import type { Lesson } from '../types';

const CONTENT_CACHE_KEYS = {
  en: 'englishtok_learning_path_content_v7',
  fr: 'englishtok_learning_path_content_fr_v1',
} as const;
const GITHUB_REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY;

type ContentLanguage = keyof typeof CONTENT_CACHE_KEYS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * AbortSignal.timeout is missing on some older Android WebViews. Falling back
 * to a manual controller keeps content refreshes working there as well.
 */
const timeoutSignal = (milliseconds: number): AbortSignal | undefined => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(milliseconds);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), milliseconds);
    return controller.signal;
  }
  return undefined;
};

const isLessonList = (value: unknown): value is Lesson[] =>
  Array.isArray(value) &&
  value.every((item) => {
    if (!isRecord(item)) return false;
    return (
      hasText(item.id) &&
      hasText(item.slug) &&
      hasText(item.title) &&
      hasText(item.titleAr) &&
      hasText(item.descriptionAr) &&
      hasText(item.category) &&
      hasText(item.level) &&
      hasText(item.sceneType) &&
      isRecord(item.characterA) &&
      hasText(item.characterA.id) &&
      isRecord(item.characterB) &&
      hasText(item.characterB.id) &&
      Array.isArray(item.dialogue) &&
      item.dialogue.length > 0 &&
      item.dialogue.every(
        (line) =>
          isRecord(line) &&
          hasText(line.id) &&
          hasText(line.textEn) &&
          hasText(line.textAr),
      ) &&
      Array.isArray(item.vocabulary) &&
      item.vocabulary.every(
        (word) =>
          isRecord(word) &&
          hasText(word.id) &&
          hasText(word.word) &&
          hasText(word.translationAr),
      ) &&
      Array.isArray(item.quiz) &&
      item.quiz.every(
        (question) =>
          isRecord(question) &&
          hasText(question.id) &&
          hasText(question.questionAr) &&
          hasText(question.correctAnswer),
      )
    );
  }) &&
  new Set(value.map((lesson) => (isRecord(lesson) ? lesson.id : null))).size === value.length;

const parseContent = (value: unknown): Lesson[] | null => {
  if (!isRecord(value) || value.schemaVersion !== 4) {
    return null;
  }
  const lessons = value.lessons;
  if (!isLessonList(lessons)) return null;
  return lessons;
};

export const getCachedLearningPath = (language: ContentLanguage = 'en'): Lesson[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONTENT_CACHE_KEYS[language]);
    if (!raw) return null;
    return parseContent(JSON.parse(raw));
  } catch (error) {
    console.warn(`Unable to load cached Lin Go ${language} lesson content:`, error);
    return null;
  }
};

const saveContent = (lessons: Lesson[], language: ContentLanguage) => {
  try {
    window.localStorage.setItem(
      CONTENT_CACHE_KEYS[language],
      JSON.stringify({ schemaVersion: 4, lessons }),
    );
  } catch (error) {
    console.warn(`Unable to cache the latest Lin Go ${language} lesson content:`, error);
  }
};

const getRepository = () => {
  const repository = GITHUB_REPOSITORY;
  if (typeof repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    return null;
  }
  return repository;
};

/**
 * Lesson content lives in the repository (public/content/learning-path.json)
 * and is also mirrored to jsDelivr. Both endpoints send CORS headers, unlike
 * GitHub release assets whose download redirect is blocked inside the WebView.
 */
const contentUrls = (
  repository: string,
  language: ContentLanguage,
): { url: string; githubApi: boolean }[] => {
  const fileName = language === 'fr' ? 'learning-path-fr.json' : 'learning-path.json';
  const local = { url: `/content/${fileName}`, githubApi: false };
  const remote = [
    {
      url: `https://api.github.com/repos/${repository}/contents/public/content/${fileName}?ref=main`,
      githubApi: true,
    },
    {
      url: `https://cdn.jsdelivr.net/gh/${repository}@main/public/content/${fileName}`,
      githubApi: false,
    },
  ];
  // French is loaded from the bundled/site file first so a preview always
  // matches the generated curriculum. English keeps its existing update chain.
  return language === 'fr' ? [local, ...remote] : [...remote, local];
};

export const fetchLatestLearningPath = async (
  language: ContentLanguage = 'en',
): Promise<Lesson[] | null> => {
  const repository = getRepository();
  if (!repository) {
    if (language === 'fr') {
      const response = await fetch('/content/learning-path-fr.json', { cache: 'no-store' });
      if (!response.ok) return null;
      const lessons = parseContent(await response.json());
      if (lessons) saveContent(lessons, 'fr');
      return lessons;
    }
    return null;
  }

  let lastError: unknown = new Error('تعذر تحميل محتوى الدروس.');

  for (const candidate of contentUrls(repository, language)) {
    try {
      const contentResponse = await fetch(candidate.url, {
        cache: 'no-store',
        headers: candidate.githubApi
          ? { Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' }
          : { Accept: 'application/json' },
        signal: timeoutSignal(20_000),
      });
      if (!contentResponse.ok) {
        lastError = new Error(`Lesson content download failed (${contentResponse.status}).`);
        continue;
      }

      const lessons = parseContent(await contentResponse.json());
      if (!lessons) {
        lastError = new Error('The downloaded lesson content has an unsupported or invalid format.');
        continue;
      }

      saveContent(lessons, language);
      return lessons;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to download the latest lesson content.');
};

