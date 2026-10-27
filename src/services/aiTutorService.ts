import type { Lesson, Level, UserProfile } from '../types';
import { apiUrl } from './apiBase';

export type TutorMode = 'conversation' | 'pronunciation';

export interface TutorCorrection {
  wrong: string;
  correct: string;
  explanationAr: string;
}

export interface TutorVocabulary {
  word: string;
  meaningAr: string;
  phonetic: string;
}

export interface TutorPronunciation {
  target: string;
  score: number;
  feedbackAr: string;
  tipAr: string;
}

export interface TutorReply {
  reply: string;
  translationAr: string;
  corrections: TutorCorrection[];
  vocabulary: TutorVocabulary[];
  pronunciation: TutorPronunciation | null;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  /** English text for user messages; the English reply for tutor messages. */
  text: string;
  translationAr?: string;
  corrections?: TutorCorrection[];
  vocabulary?: TutorVocabulary[];
  pronunciation?: TutorPronunciation | null;
  createdAt: number;
}

export interface TutorContext {
  level: Level;
  stage: number;
}

export interface SendTutorMessageInput {
  messages: TutorMessage[];
  level: Level;
  stage: number;
  mode?: TutorMode;
  target?: string;
  language?: 'en' | 'fr';
}

export interface TutorStatus {
  configured: boolean;
  model: string | null;
}

export class AiTutorError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AiTutorError';
    this.code = code;
  }
}

const HISTORY_KEY = 'englishtok_ai_tutor_v1';
const MAX_STORED_MESSAGES = 40;

const tutorHistoryKey = (language: 'en' | 'fr'): string =>
  language === 'fr' ? `${HISTORY_KEY}:fr` : HISTORY_KEY;
const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const FALLBACK_LEVEL_BY_STAGE: Record<number, Level> = {
  1: 'A1',
  2: 'A2',
  3: 'B2',
  4: 'C1',
};

const errorMessageForCode = (code: string): string => {
  switch (code) {
    case 'AI_NOT_CONFIGURED':
      return 'المعلم الذكي غير مفعّل بعد. أضف إعدادات الذكاء الاصطناعي إلى الخادم.';
    case 'RATE_LIMITED':
    case 'AI_RATE_LIMITED':
      return 'أرسلت رسائل كثيرة في وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.';
    case 'AI_TIMEOUT':
      return 'استغرق المعلم وقتًا طويلًا للرد. حاول مرة أخرى.';
    case 'RATE_LIMIT_UNAVAILABLE':
      return 'المعلم غير متاح مؤقتًا. حاول بعد قليل.';
    case 'TARGET_REQUIRED':
      return 'اختر جملة أولًا لنتدرّب على نطقها.';
    default:
      return 'تعذر الوصول إلى المعلم الذكي الآن. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
  }
};

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const safeText = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const normalizeReply = (payload: unknown): TutorReply => {
  const record =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const corrections = Array.isArray(record.corrections)
    ? record.corrections
        .slice(0, 4)
        .map((entry): TutorCorrection | null => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
          const item = entry as Record<string, unknown>;
          const wrong = safeText(item.wrong, 240);
          const correct = safeText(item.correct, 300);
          const explanationAr = safeText(item.explanationAr, 500);
          return wrong && correct ? { wrong, correct, explanationAr } : null;
        })
        .filter((entry): entry is TutorCorrection => entry !== null)
    : [];

  const vocabulary = Array.isArray(record.vocabulary)
    ? record.vocabulary
        .slice(0, 6)
        .map((entry): TutorVocabulary | null => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
          const item = entry as Record<string, unknown>;
          const word = safeText(item.word, 100);
          const meaningAr = safeText(item.meaningAr, 240);
          return word && meaningAr
            ? { word, meaningAr, phonetic: safeText(item.phonetic, 100) }
            : null;
        })
        .filter((entry): entry is TutorVocabulary => entry !== null)
    : [];

  let pronunciation: TutorPronunciation | null = null;
  if (
    record.pronunciation &&
    typeof record.pronunciation === 'object' &&
    !Array.isArray(record.pronunciation)
  ) {
    const item = record.pronunciation as Record<string, unknown>;
    const target = safeText(item.target, 300);
    const feedbackAr = safeText(item.feedbackAr, 500);
    const score = Number(item.score);
    if (target && feedbackAr) {
      pronunciation = {
        target,
        score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
        feedbackAr,
        tipAr: safeText(item.tipAr, 500),
      };
    }
  }

  return {
    reply: safeText(record.reply, 1_600),
    translationAr: safeText(record.translationAr, 1_400),
    corrections,
    vocabulary,
    pronunciation,
  };
};

/**
 * Picks a CEFR level and curriculum stage from the learner's actual path.
 * Placement results take priority, then the first unfinished lesson.
 */
export const getTutorContext = (
  lessons: Lesson[],
  profile: UserProfile,
): TutorContext => {
  const placementStage = profile.placementAssessment?.result?.suggestedStage;
  const completed = new Set(profile.completedLessonIds);
  const pathLessons = lessons.filter((lesson) => !lesson.schoolYearId);

  if (placementStage && placementStage >= 1 && placementStage <= 4) {
    const placementLesson = pathLessons.find(
      (lesson) => lesson.curriculumStage === placementStage,
    );
    return {
      level: placementLesson?.level ?? FALLBACK_LEVEL_BY_STAGE[placementStage] ?? 'A1',
      stage: placementStage,
    };
  }

  for (let stage = 1; stage <= 4; stage += 1) {
    const stageLessons = pathLessons.filter((lesson) => (lesson.curriculumStage ?? 1) === stage);
    const nextLesson = stageLessons.find((lesson) => !completed.has(lesson.id));
    if (nextLesson) {
      return { level: nextLesson.level, stage };
    }
  }

  const lastLesson = pathLessons[pathLessons.length - 1];
  return {
    level: lastLesson?.level ?? 'A1',
    stage: lastLesson?.curriculumStage ?? 1,
  };
};

export const normalizeTutorLevel = (value: string | null | undefined): Level =>
  LEVELS.includes(value as Level) ? (value as Level) : 'A1';

export const loadTutorHistory = (language: 'en' | 'fr' = 'en'): TutorMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(tutorHistoryKey(language));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is TutorMessage => {
        if (!entry || typeof entry !== 'object') return false;
        const item = entry as Record<string, unknown>;
        return (
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0
        );
      })
      .slice(-MAX_STORED_MESSAGES)
      .map((entry) => ({
        ...entry,
        id: typeof entry.id === 'string' ? entry.id : createId(),
        createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
};

export const saveTutorHistory = (
  messages: TutorMessage[],
  language: 'en' | 'fr' = 'en',
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      tutorHistoryKey(language),
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
    );
  } catch {
    // Conversation history is a convenience; storage can be unavailable.
  }
};

export const clearTutorHistory = (language: 'en' | 'fr' = 'en'): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(tutorHistoryKey(language));
  } catch {
    // Ignore storage failures.
  }
};

export const createTutorMessage = (
  role: TutorMessage['role'],
  text: string,
): TutorMessage => ({
  id: createId(),
  role,
  text,
  createdAt: Date.now(),
});

export const createTutorReplyMessage = (reply: TutorReply): TutorMessage => ({
  id: createId(),
  role: 'assistant',
  text: reply.reply,
  translationAr: reply.translationAr,
  corrections: reply.corrections,
  vocabulary: reply.vocabulary,
  pronunciation: reply.pronunciation,
  createdAt: Date.now(),
});

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
};

export const getTutorStatus = async (): Promise<TutorStatus> => {
  try {
    const response = await fetchWithTimeout(apiUrl('/api/chat'), { method: 'GET' }, 12_000);
    if (!response.ok) return { configured: false, model: null };
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { configured: false, model: null };
    }
    const record = payload as Record<string, unknown>;
    return {
      configured: record.configured === true,
      model: typeof record.model === 'string' ? record.model : null,
    };
  } catch {
    return { configured: false, model: null };
  }
};

export const sendTutorMessage = async ({
  messages,
  level,
  stage,
  mode = 'conversation',
  target,
  language = 'en',
}: SendTutorMessageInput): Promise<TutorReply> => {
  const conversation = messages.slice(-6).map((message) => ({
    role: message.role,
    content: message.text,
  }));

  let response: Response;
  try {
    response = await fetchWithTimeout(
      apiUrl('/api/chat'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation,
          level,
          stage,
          mode,
          target,
          language,
        }),
      },
      30_000,
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AiTutorError('AI_TIMEOUT', errorMessageForCode('AI_TIMEOUT'));
    }
    throw new AiTutorError('NETWORK', errorMessageForCode('NETWORK'));
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    const code = typeof record.code === 'string' ? record.code : 'AI_UPSTREAM_ERROR';
    throw new AiTutorError(code, errorMessageForCode(code));
  }

  const reply = normalizeReply(payload);
  if (!reply.reply) {
    throw new AiTutorError('AI_EMPTY_RESPONSE', errorMessageForCode('AI_EMPTY_RESPONSE'));
  }
  return reply;
};
