import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Crown,
  Headphones,
  Heart,
  HeartOff,
  Lightbulb,
  Mic,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import type { Character, DialogueLine, Lesson, QuizQuestion, UserProfile } from '../../types';
import { IS_GOLD_EDITION } from '../../config/edition';
import { GoldLessonCelebration } from '../gold/GoldLessonCelebration';
import { getLevelExamPassingScore } from '../../services/learningPath';
import { speechService } from '../../services/speechService';
import {
  isSpeechRecognitionSupported,
  SpeechRecognitionError,
  startSpeechRecognition,
  type SpeechRecognitionSession,
} from '../../services/speechRecognition';
import { PrimaryCharacter } from '../video/PrimaryCharacterArt';
import { getOptionEmoji, isSentenceOption } from './lessonVisuals';

type SessionPhase = 'welcome' | 'story' | 'speak' | 'picture' | 'quiz' | 'result' | 'failed';
type SpeakState = 'idle' | 'listening' | 'correct' | 'wrong' | 'unsupported' | 'error' | 'skipped';

interface LessonSessionProps {
  lesson: Lesson;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToPath: () => void;
  /** The Gold build and the interactive website preview opt into the Gold+ lesson layer. */
  goldEdition?: boolean;
}

const MAX_HEARTS = 5;
const GOLD_PICTURE_BONUS_XP = 10;
const GOLD_XP_MULTIPLIER = 1.25;

const GOLD_PICTURE_FALLBACK = [
  { id: 'gold-fallback-apple', word: 'apple', translationAr: 'تفاحة' },
  { id: 'gold-fallback-cat', word: 'cat', translationAr: 'قطة' },
  { id: 'gold-fallback-book', word: 'book', translationAr: 'كتاب' },
  { id: 'gold-fallback-water', word: 'water', translationAr: 'ماء' },
  { id: 'gold-fallback-house', word: 'house', translationAr: 'منزل' },
  { id: 'gold-fallback-train', word: 'train', translationAr: 'قطار' },
] as const;

interface GoldPictureOption {
  label: string;
  emoji: string;
  word: string;
}

interface GoldPictureChallenge {
  prompt: string;
  promptAr: string;
  correctLabel: string;
  correctWordId: string;
  options: GoldPictureOption[];
}

const buildGoldPictureChallenge = (lesson: Lesson): GoldPictureChallenge | null => {
  const source = lesson.vocabulary.filter((word) => word.word.trim() && word.translationAr.trim());
  if (!source.length) return null;

  const seenTranslations = new Set<string>();
  const pool = [...source, ...GOLD_PICTURE_FALLBACK].filter((word) => {
    const key = normalizeAnswer(word.translationAr);
    if (!key || seenTranslations.has(key)) return false;
    seenTranslations.add(key);
    return true;
  });
  if (pool.length < 3) return null;

  const correct = source[0];
  const distractors = pool
    .filter((word) => normalizeAnswer(word.translationAr) !== normalizeAnswer(correct.translationAr))
    .slice(0, 3);
  const options = [correct, ...distractors].map((word) => {
    const translationEmoji = getOptionEmoji(word.translationAr);
    return {
      label: word.translationAr,
      // French vocabulary is mapped through its Arabic meaning, while English
      // and the fallback pool still get their own visual.
      emoji: translationEmoji === '📘' ? getOptionEmoji(word.word) : translationEmoji,
      word: word.word,
    };
  });
  const offset = lesson.id.length % options.length;
  const orderedOptions = [...options.slice(offset), ...options.slice(0, offset)];

  return {
    prompt: correct.word,
    promptAr: correct.translationAr,
    correctLabel: correct.translationAr,
    correctWordId: correct.id,
    options: orderedOptions,
  };
};

const STAGE_ACCENTS: Record<number, { main: string; soft: string; ink: string }> = {
  1: { main: '#ce82ff', soft: '#f5e9ff', ink: '#7d2fc4' },
  2: { main: '#3d7198', soft: '#e7eef4', ink: '#284965' },
  3: { main: '#ffc800', soft: '#fff6d1', ink: '#8a5a00' },
  4: { main: '#ff9600', soft: '#fff0dd', ink: '#a35a00' },
};

const normalizeAnswer = (text: string) =>
  text
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const speechMatches = (spoken: string, target: string) => {
  const targetWords = normalizeAnswer(target).split(' ').filter(Boolean);
  const spokenWords = new Set(normalizeAnswer(spoken).split(' ').filter(Boolean));
  if (!targetWords.length) return false;
  const hits = targetWords.filter((word) => spokenWords.has(word)).length;
  return hits / targetWords.length >= 0.6;
};

const getReviewIds = (question: QuizQuestion, lesson: Lesson) => {
  const directAnswers = [question.correctAnswer, question.questionEn ?? ''];
  return lesson.vocabulary.filter((word) => {
    const terms = [word.word, word.translationAr].filter((term) => term.trim().length > 2);
    return terms.some((term) => directAnswers.some((answer) => {
      const normalizedAnswer = normalizeAnswer(answer);
      const normalizedTerm = normalizeAnswer(term);
      return normalizedAnswer === normalizedTerm || normalizedAnswer.startsWith(`${normalizedTerm} `) || normalizedAnswer.endsWith(` ${normalizedTerm}`);
    }));
  }).map((word) => word.id);
};

const CharacterFigure: React.FC<{
  character: Character;
  speaking?: boolean;
  className?: string;
}> = ({ character, speaking = false, className = '' }) => {
  if (!character.design) {
    return <span className={`duo-character-emoji ${className}`} role="img" aria-label={character.nameAr}>{character.avatar}</span>;
  }
  return (
    <svg
      viewBox="-78 -242 156 252"
      className={`duo-character ${className}`}
      role="img"
      aria-label={character.nameAr}
      preserveAspectRatio="xMidYMax meet"
      focusable="false"
    >
      <PrimaryCharacter design={character.design} speaking={speaking} playing={speaking} />
    </svg>
  );
};

export const LessonSession: React.FC<LessonSessionProps> = ({
  lesson,
  userProfile,
  onUpdateProfile,
  onBackToPath,
  goldEdition = IS_GOLD_EDITION,
}) => {
  const [phase, setPhase] = useState<SessionPhase>('welcome');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [arrangedTokens, setArrangedTokens] = useState<number[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedWordIds, setMissedWordIds] = useState<string[]>([]);
  const [earnedXp, setEarnedXp] = useState(0);
  const [lives, setLives] = useState(MAX_HEARTS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakState, setSpeakState] = useState<SpeakState>('idle');
  const [speakTargetIndex, setSpeakTargetIndex] = useState(0);
  const [speakErrorMessage, setSpeakErrorMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [goldPictureSelection, setGoldPictureSelection] = useState<string | null>(null);
  const [goldPictureChecked, setGoldPictureChecked] = useState(false);
  const [goldPictureCorrect, setGoldPictureCorrect] = useState(false);
  const [goldPictureBonusXp, setGoldPictureBonusXp] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);

  const correctCountRef = useRef(0);
  const goldPictureBonusRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionSession | null>(null);

  const questions = lesson.quiz ?? [];
  const question = questions[questionIndex];
  const line = lesson.dialogue[dialogueIndex];
  const language = userProfile.settings.voiceLanguage || 'en';
  const accent = STAGE_ACCENTS[lesson.curriculumStage ?? 1] ?? STAGE_ACCENTS[1];
  const goldPicture = useMemo(
    () => (goldEdition ? buildGoldPictureChallenge(lesson) : null),
    [goldEdition, lesson],
  );
  const speakTargets = useMemo(() => {
    const entries = lesson.vocabulary
      .slice(0, goldEdition ? 2 : 1)
      .map((word) => ({ text: word.exampleSentence, ar: word.exampleSentenceAr }))
      .filter((entry) => entry.text.trim());
    if (entries.length) return entries;
    return [{
      text: lesson.dialogue[0]?.textEn ?? lesson.title,
      ar: lesson.dialogue[0]?.textAr ?? '',
    }];
  }, [goldEdition, lesson]);
  const activeSpeakTarget = speakTargets[Math.min(speakTargetIndex, speakTargets.length - 1)] ?? speakTargets[0];
  const speakTarget = activeSpeakTarget?.text ?? lesson.title;
  const speakTargetAr = activeSpeakTarget?.ar ?? '';

  const playEffect = (effect: 'success' | 'error') => {
    if (!userProfile.settings.soundEffects) return;
    if (effect === 'success') speechService.playSuccessChime();
    else speechService.playErrorBuzz();
  };

  const answerIsSentence = Boolean(
    question?.type === 'arrange_sentence'
    && question.options.some((option) => normalizeAnswer(option) === normalizeAnswer(question.correctAnswer)),
  );
  const arrangedAnswer = arrangedTokens.map((index) => question?.options[index] ?? '').join(' ');
  const selectedAnswer = question?.type === 'arrange_sentence' && !answerIsSentence ? arrangedAnswer : selectedOption ?? '';
  const isCorrectAnswer = isAnswerChecked && normalizeAnswer(selectedAnswer) === normalizeAnswer(question?.correctAnswer ?? '');

  const totalSteps = lesson.dialogue.length + 1 + (goldPicture ? 1 : 0) + questions.length;
  const completedSteps = phase === 'welcome'
    ? 0
    : phase === 'story'
      ? dialogueIndex
      : phase === 'speak'
        ? lesson.dialogue.length
        : phase === 'picture'
          ? lesson.dialogue.length + 1
          : phase === 'quiz'
            ? lesson.dialogue.length + (goldPicture ? 2 : 1) + questionIndex
            : totalSteps;
  const progressPercent = phase === 'result' || phase === 'failed'
    ? 100
    : Math.max(0, Math.min(100, Math.round((completedSteps / Math.max(1, totalSteps)) * 100)));

  const lineSpeaker = useMemo(() => {
    if (!line) return lesson.characterA;
    return line.speakerId === lesson.characterA.id ? lesson.characterA : lesson.characterB;
  }, [line, lesson.characterA, lesson.characterB]);

  useEffect(() => () => {
    speechService.stopSpeaking();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    if (phase !== 'story') return;
    const rate = userProfile.settings.playbackSpeed || 1;
    for (const offset of [0, 1, 2]) {
      const upcoming = lesson.dialogue[dialogueIndex + offset];
      if (!upcoming) break;
      const speaker = upcoming.speakerId === lesson.characterA.id ? lesson.characterA : lesson.characterB;
      speechService.preloadText({
        text: upcoming.textEn,
        rate,
        gender: speaker.voiceGender,
        accent: language,
      });
    }
  }, [phase, dialogueIndex, lesson, language, userProfile.settings.playbackSpeed]);

  const playText = (
    text: string,
    source: string,
    character?: Character,
    rateOverride?: number,
  ) => {
    speechService.stopSpeaking();
    setIsSpeaking(true);
    speechService.speakText({
      source,
      text,
      rate: rateOverride ?? (userProfile.settings.playbackSpeed || 1),
      pitch: character?.voicePitch || 1,
      gender: character?.voiceGender ?? 'female',
      accent: language,
      onEnd: () => setIsSpeaking(false),
    });
  };

  const speakLine = () => {
    if (!line) return;
    playText(line.textEn, `lesson-session:${lesson.id}:${line.id}`, lineSpeaker);
  };

  const speakQuestion = () => {
    if (!question?.questionEn) return;
    playText(question.questionEn, `lesson-question:${lesson.id}:${question.id}`, lesson.characterA);
  };

  const speakPracticeSentence = () => {
    playText(speakTarget, `lesson-speak:${lesson.id}:${speakTargetIndex}`, lesson.characterA);
  };

  const speakPracticeSentenceSlowly = () => {
    playText(
      speakTarget,
      `lesson-speak-slow:${lesson.id}:${speakTargetIndex}`,
      lesson.characterA,
      Math.max(0.55, (userProfile.settings.playbackSpeed || 1) * 0.72),
    );
  };

  const moveDialogue = (index: number) => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
    setDialogueIndex(Math.max(0, Math.min(lesson.dialogue.length - 1, index)));
  };

  const completeSession = (finalCorrectCount: number) => {
    const score = questions.length ? Math.round((finalCorrectCount / questions.length) * 100) : 100;
    const passed = score >= getLevelExamPassingScore();
    const previousBest = userProfile.quizScores[lesson.id] ?? 0;
    const isNewBest = score > previousBest;
    const firstCompletion = !userProfile.completedLessonIds.includes(lesson.id);
    const baseReward = (firstCompletion ? 20 : 0) + (isNewBest ? finalCorrectCount * 15 + (passed ? 10 : 0) : 0);
    const bonusReward = goldEdition ? goldPictureBonusRef.current : 0;
    const reward = Math.round(baseReward * (goldEdition ? GOLD_XP_MULTIPLIER : 1)) + bonusReward;
    const today = new Date().toISOString().slice(0, 10);
    const daily = userProfile.dailyProgress.date === today
      ? userProfile.dailyProgress
      : { date: today, completedLessonIds: [] as string[] };
    const dailyIds = daily.completedLessonIds.includes(lesson.id)
      ? daily.completedLessonIds
      : [...daily.completedLessonIds, lesson.id];
    setEarnedXp(reward);
    setFinalScore(score);
    setFinalCorrect(finalCorrectCount);
    onUpdateProfile({
      completedLessonIds: firstCompletion ? [...userProfile.completedLessonIds, lesson.id] : userProfile.completedLessonIds,
      watchedLessonIds: userProfile.watchedLessonIds.includes(lesson.id) ? userProfile.watchedLessonIds : [...userProfile.watchedLessonIds, lesson.id],
      dailyProgress: { date: today, completedLessonIds: dailyIds },
      quizScores: { ...userProfile.quizScores, [lesson.id]: Math.max(previousBest, score) },
      reviewWordIds: [...new Set([...userProfile.reviewWordIds, ...missedWordIds])],
      xp: userProfile.xp + reward,
    });
    goldPictureBonusRef.current = 0;
    setPhase('result');
    playEffect('success');
  };

  const checkAnswer = () => {
    if (!question || isAnswerChecked) return;
    const answer = question.type === 'arrange_sentence' && !answerIsSentence ? arrangedAnswer : selectedOption ?? '';
    if (!answer) return;
    const correct = normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);
    setIsAnswerChecked(true);
    if (correct) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      playEffect('success');
    } else {
      if (!goldEdition) setLives((current) => Math.max(0, current - 1));
      setMissedWordIds((ids) => [...new Set([...ids, ...getReviewIds(question, lesson)])]);
      playEffect('error');
    }
  };

  const moveToNextQuestion = () => {
    if (!question) return;
    if (!goldEdition && !isCorrectAnswer && lives === 0) {
      setPhase('failed');
      return;
    }
    if (questionIndex + 1 >= questions.length) {
      completeSession(correctCountRef.current);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedOption(null);
    setArrangedTokens([]);
    setIsAnswerChecked(false);
  };

  const startQuiz = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
    setQuestionIndex(0);
    correctCountRef.current = 0;
    setCorrectCount(0);
    setSelectedOption(null);
    setArrangedTokens([]);
    setIsAnswerChecked(false);
    setLives(MAX_HEARTS);
    if (questions.length) setPhase('quiz');
    else completeSession(0);
  };

  const resetSpeakAttempt = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setTranscript('');
    setSpeakErrorMessage('');
    setSpeakState('idle');
    setIsListening(false);
    setIsSpeaking(false);
    speechService.stopSpeaking();
  };

  const continueAfterSpeaking = () => {
    if (goldEdition && speakTargetIndex + 1 < speakTargets.length) {
      setSpeakTargetIndex((index) => index + 1);
      resetSpeakAttempt();
      return;
    }
    if (goldEdition && goldPicture) {
      resetSpeakAttempt();
      setPhase('picture');
      return;
    }
    startQuiz();
  };

  const checkGoldPicture = () => {
    if (!goldPicture || !goldPictureSelection || goldPictureChecked) return;
    const correct =
      normalizeAnswer(goldPictureSelection) === normalizeAnswer(goldPicture.correctLabel);
    setGoldPictureChecked(true);
    setGoldPictureCorrect(correct);
    if (correct) {
      setGoldPictureBonusXp(GOLD_PICTURE_BONUS_XP);
      goldPictureBonusRef.current = GOLD_PICTURE_BONUS_XP;
      playEffect('success');
    } else {
      setMissedWordIds((ids) => [...new Set([...ids, goldPicture.correctWordId])]);
      playEffect('error');
    }
  };

  const retryGoldPicture = () => {
    setGoldPictureSelection(null);
    setGoldPictureChecked(false);
    setGoldPictureCorrect(false);
    setGoldPictureBonusXp(0);
    goldPictureBonusRef.current = 0;
  };

  const startStory = () => {
    if (lesson.dialogue.length) setPhase('story');
    else setPhase('speak');
  };

  const nextStoryStep = () => {
    if (dialogueIndex + 1 < lesson.dialogue.length) moveDialogue(dialogueIndex + 1);
    else {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      setPhase('speak');
    }
  };

  const startListening = async () => {
    if (isListening || speakState === 'correct') return;

    if (!isSpeechRecognitionSupported()) {
      setSpeakErrorMessage('هذا الجهاز لا يدعم التعرف على الصوت. يمكنك الاستماع والمتابعة.');
      setSpeakState('unsupported');
      return;
    }

    recognitionRef.current?.stop();
    const session = startSpeechRecognition(language === 'fr' ? 'fr-FR' : 'en-US');
    recognitionRef.current = session;
    setTranscript('');
    setSpeakErrorMessage('');
    setSpeakState('listening');
    setIsListening(true);

    try {
      const spoken = await session.result;
      if (recognitionRef.current !== session) return;
      recognitionRef.current = null;
      setIsListening(false);
      setTranscript(spoken);
      if (speechMatches(spoken, speakTarget)) {
        setSpeakState('correct');
      } else {
        setSpeakState('wrong');
        setSpeakErrorMessage('لم نسمع الجملة بوضوح. يمكنك المحاولة مرة أخرى.');
      }
    } catch (error) {
      if (recognitionRef.current !== session) return;
      recognitionRef.current = null;
      setIsListening(false);

      const code = error instanceof SpeechRecognitionError ? error.code : 'unknown';
      if (code === 'aborted') return;
      if (code === 'permission-denied') {
        setSpeakErrorMessage('لم يتم السماح باستخدام الميكروفون. افتح إعدادات التطبيق وامنح إذن الميكروفون ثم أعد المحاولة.');
        setSpeakState('unsupported');
        return;
      }
      if (code === 'unsupported') {
        setSpeakErrorMessage('التسجيل الصوتي غير متاح على هذا الجهاز. يمكنك الاستماع والمتابعة.');
        setSpeakState('unsupported');
        return;
      }
      if (code === 'no-speech') {
        setSpeakErrorMessage('لم نسمع الجملة بوضوح. اقترب من الميكروفون وحاول مرة أخرى.');
        setSpeakState('wrong');
        return;
      }
      setSpeakErrorMessage(
        error instanceof SpeechRecognitionError
          ? error.message
          : 'تعذر تشغيل الميكروفون. حاول مرة أخرى.',
      );
      setSpeakState('error');
    }
  };

  const retrySpeaking = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setTranscript('');
    setSpeakErrorMessage('');
    setSpeakState('idle');
    setIsListening(false);
  };

  const skipSpeaking = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setSpeakErrorMessage('');
    setSpeakState('skipped');
  };

  const retryAfterFailure = () => {
    setLives(MAX_HEARTS);
    correctCountRef.current = 0;
    setCorrectCount(0);
    setQuestionIndex(0);
    setSelectedOption(null);
    setArrangedTokens([]);
    setIsAnswerChecked(false);
    setPhase('quiz');
  };

  const optionGrid = question ? isSentenceOption(question.options) : false;
  const quizBubble = question
    ? question.type === 'arrange_sentence'
      ? question.promptAr ?? question.questionAr
      : question.questionEn ?? 'اختر الإجابة الصحيحة'
    : '';
  const quizBubbleIsArabic = isArabic(quizBubble);
  const quizTitle = question
    ? question.type === 'fill_blank'
      ? 'أكمل الجملة'
      : question.type === 'arrange_sentence'
        ? 'رتّب الجملة'
        : question.questionAr
    : '';

  const footerTone = phase === 'quiz' && isAnswerChecked
    ? (isCorrectAnswer ? 'has-success' : 'has-error')
    : phase === 'picture' && goldPictureChecked
      ? (goldPictureCorrect ? 'has-success' : 'has-error')
      : phase === 'speak' && ['correct', 'wrong', 'unsupported', 'error', 'skipped'].includes(speakState)
        ? speakState === 'unsupported' || speakState === 'error'
          ? 'has-info'
          : speakState === 'correct' || speakState === 'skipped'
            ? 'has-success'
            : 'has-error'
        : '';

  const footer = (() => {
    if (phase === 'welcome') {
      return (
        <div className="duo-footer-row">
          <button type="button" onClick={startStory} className="duo-btn duo-btn-primary duo-btn-wide">
            ابدأ الدرس
          </button>
        </div>
      );
    }

    if (phase === 'story') {
      return (
        <div className="duo-footer-row">
          <button
            type="button"
            disabled={dialogueIndex === 0}
            onClick={() => moveDialogue(dialogueIndex - 1)}
            className="duo-btn duo-btn-secondary"
          >
            <ArrowRight className="h-4 w-4" /> السابق
          </button>
          <button type="button" onClick={nextStoryStep} className="duo-btn duo-btn-primary duo-btn-grow">
            متابعة <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (phase === 'speak') {
      const isDone = ['correct', 'wrong', 'unsupported', 'error', 'skipped'].includes(speakState);
      const isPositive = speakState === 'correct' || speakState === 'skipped';
      const isNeutral = speakState === 'unsupported' || speakState === 'error';
      return (
        <div className={`duo-footer-panel ${isDone ? (isPositive || isNeutral ? 'is-correct' : 'is-wrong') : ''}`}>
          {isDone && (
            <div className="duo-feedback-copy">
              <strong>
                {speakState === 'correct' && 'ممتاز! نطق واضح.'}
                {speakState === 'wrong' && 'لم نسمع الجملة بوضوح.'}
                {speakState === 'unsupported' && (speakErrorMessage || 'التسجيل الصوتي غير متاح هنا.')}
                {speakState === 'error' && (speakErrorMessage || 'تعذر تشغيل الميكروفون.')}
                {speakState === 'skipped' && 'لا بأس، يمكنك التدرب لاحقاً.'}
              </strong>
              <span>
                {speakState === 'wrong'
                  ? 'يمكنك المحاولة مرة أخرى أو المتابعة.'
                  : speakState === 'unsupported'
                    ? 'يمكنك الاستماع إلى الجملة ثم المتابعة، أو المحاولة بعد السماح بالإذن.'
                    : speakState === 'error'
                      ? 'تحقق من إذن الميكروفون واتصال الإنترنت ثم أعد المحاولة.'
                      : 'استمر، أنت تتقدم!'}
              </span>
            </div>
          )}
          <div className="duo-footer-row">
            {!isDone && (
              <button type="button" onClick={skipSpeaking} className="duo-btn duo-btn-secondary">
                تخطّي
              </button>
            )}
            {(speakState === 'wrong' || speakState === 'error' || speakState === 'unsupported') && (
              <button type="button" onClick={retrySpeaking} className="duo-btn duo-btn-secondary">
                <RotateCcw className="h-4 w-4" /> حاول مجدداً
              </button>
            )}
            <button
              type="button"
              disabled={!isDone}
              onClick={continueAfterSpeaking}
              className="duo-btn duo-btn-primary duo-btn-grow"
            >
              {goldEdition && speakTargetIndex + 1 < speakTargets.length
                ? 'الجملة التالية'
                : goldEdition && goldPicture
                  ? 'تحدي Gold البصري'
                  : 'متابعة'}
            </button>
          </div>
        </div>
      );
    }

    if (phase === 'picture' && goldPicture) {
      if (!goldPictureChecked) {
        return (
          <div className="duo-footer-row">
            <button
              type="button"
              disabled={!goldPictureSelection}
              onClick={checkGoldPicture}
              className="duo-btn duo-btn-primary duo-btn-wide"
            >
              تحقّق
            </button>
          </div>
        );
      }
      return (
        <div className={`duo-footer-panel ${goldPictureCorrect ? 'is-correct' : 'is-wrong'}`}>
          <div className="duo-feedback-copy">
            <strong>{goldPictureCorrect ? 'ممتاز! عين ذهبية.' : 'ليست هذه الصورة.'}</strong>
            <span>
              {goldPictureCorrect
                ? `أضفت +${GOLD_PICTURE_BONUS_XP} XP إلى مكافأة الدرس.`
                : `الإجابة الصحيحة: ${goldPicture.correctLabel}. أضفناها إلى مراجعتك.`}
            </span>
          </div>
          <div className="duo-footer-row">
            {!goldPictureCorrect && (
              <button type="button" onClick={retryGoldPicture} className="duo-btn duo-btn-secondary">
                <RotateCcw className="h-4 w-4" /> حاول مجدداً
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                speechService.stopSpeaking();
                setIsSpeaking(false);
                startQuiz();
              }}
              className="duo-btn duo-btn-primary duo-btn-grow"
            >
              متابعة إلى التمارين
            </button>
          </div>
        </div>
      );
    }

    if (phase === 'quiz') {
      if (!isAnswerChecked) {
        return (
          <div className="duo-footer-row">
            <button
              type="button"
              disabled={question?.type === 'arrange_sentence' && !answerIsSentence ? arrangedTokens.length === 0 : !selectedOption}
              onClick={checkAnswer}
              className="duo-btn duo-btn-primary duo-btn-wide"
            >
              تحقّق
            </button>
          </div>
        );
      }
      return (
        <div className={`duo-footer-panel ${isCorrectAnswer ? 'is-correct' : 'is-wrong'}`}>
          <div className="duo-feedback-copy">
            <strong>{isCorrectAnswer ? 'ممتاز!' : !goldEdition && lives === 0 ? 'نفدت القلوب!' : 'لا بأس!'}</strong>
            <span>{isCorrectAnswer ? question?.explanationAr : `الإجابة: ${question?.correctAnswer}. ${question?.explanationAr}`}</span>
          </div>
          <div className="duo-footer-row">
            <button type="button" onClick={moveToNextQuestion} className="duo-btn duo-btn-primary duo-btn-wide">
              متابعة
            </button>
          </div>
        </div>
      );
    }

    return null;
  })();

  return (
    <section
      className="duo-lesson h-full min-h-0 w-full overflow-y-auto"
      dir="rtl"
      style={{
        '--duo-accent': accent.main,
        '--duo-accent-soft': accent.soft,
        '--duo-accent-ink': accent.ink,
      } as React.CSSProperties}
    >
      <div className="duo-shell">
        <header className="duo-topbar" dir="ltr">
          <div
            className={`duo-hearts ${phase === 'result' || phase === 'failed' ? 'is-hidden' : ''}`}
            aria-label={goldEdition ? 'قلوب لا نهائية في Gold' : `${lives} محاولات متبقية`}
          >
            <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
            <span>{goldEdition ? '∞' : lives}</span>
          </div>
          <div
            className="duo-progress"
            role="progressbar"
            aria-label="تقدم الدرس"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <span className="duo-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <button type="button" onClick={onBackToPath} className="duo-close" aria-label="العودة إلى المسار">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="duo-body">
          {phase === 'welcome' && (
            <div className="duo-welcome">
              <div className="duo-welcome-art" aria-hidden="true">
                <CharacterFigure character={lesson.characterB} />
                <CharacterFigure character={lesson.characterA} />
              </div>
              <span className="duo-kicker">
                المرحلة {lesson.curriculumStage ?? 1} <span aria-hidden="true">·</span> <bdi dir="ltr">{lesson.level}</bdi>
              </span>
              <h1 className="duo-title">{lesson.titleAr}</h1>
              <p className="duo-title-en" dir="ltr">{lesson.title}</p>
              <p className="duo-description">{lesson.descriptionAr}</p>
              {lesson.learningNoteAr && (
                <div className="duo-note">
                  <Lightbulb className="h-4 w-4 shrink-0" />
                  <p>{lesson.learningNoteAr}</p>
                </div>
              )}
              {goldEdition && (
                <div className="duo-note is-gold">
                  <Crown className="h-4 w-4 shrink-0" />
                  <p>
                    <strong>Gold+:</strong> قلوب لا نهائية، مكافأة XP أعلى 25%، ونطق موسّع
                    {goldPicture ? '، مع تحدي بصري إضافي' : ''}.
                  </p>
                </div>
              )}
              <div className="duo-meta">
                <span><BookOpen className="h-4 w-4" /> {lesson.dialogue.length} خطوات استماع</span>
                <span><Mic className="h-4 w-4" /> تدريب نطق</span>
                <span><CheckCircle2 className="h-4 w-4" /> {questions.length} تمارين</span>
                {goldEdition && goldPicture && <span><Sparkles className="h-4 w-4" /> تحدي Gold البصري</span>}
              </div>
            </div>
          )}

          {phase === 'story' && line && (
            <div key={line.id} className="duo-exercise animate-fade-in">
              <span className="duo-kicker">استمع وافهم · {dialogueIndex + 1} من {lesson.dialogue.length}</span>
              <h1 className="duo-title">تعرّف على الموقف</h1>
              <div className="duo-hero" dir="ltr">
                <CharacterFigure character={lineSpeaker} speaking={isSpeaking} />
                <div className="duo-bubble">
                  <button type="button" onClick={speakLine} className="duo-bubble-audio" aria-label="استمع إلى الجملة">
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <p className="duo-bubble-en">{line.textEn}</p>
                </div>
              </div>
              <p className="duo-translation">{line.textAr}</p>
              <div className="duo-dots" aria-hidden="true">
                {lesson.dialogue.map((dialogueLine, index) => (
                  <span key={dialogueLine.id} className={index === dialogueIndex ? 'is-active' : index < dialogueIndex ? 'is-done' : ''} />
                ))}
              </div>
              <div className="duo-speaker-tag">
                <span>{lineSpeaker.avatar}</span>
                <strong>{lineSpeaker.nameAr}</strong>
                <small>{lineSpeaker.roleAr}</small>
              </div>
            </div>
          )}

          {phase === 'speak' && (
            <div className="duo-exercise animate-fade-in">
              <span className="duo-kicker">
                {goldEdition ? 'Gold+ · تدرّب على النطق' : 'تدرّب على النطق'}
                {goldEdition && speakTargets.length > 1 ? ` · جملة ${speakTargetIndex + 1} من ${speakTargets.length}` : ''}
              </span>
              <h1 className="duo-title">انطق هذه الجملة</h1>
              <div className="duo-hero" dir="ltr">
                <CharacterFigure character={lesson.characterA} speaking={isSpeaking} />
                <div className="duo-bubble">
                  <button type="button" onClick={speakPracticeSentence} className="duo-bubble-audio" aria-label="استمع إلى الجملة">
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <p className="duo-bubble-en">{speakTarget}</p>
                </div>
              </div>
              {speakTargetAr && <p className="duo-translation">{speakTargetAr}</p>}
              {goldEdition && (
                <button type="button" onClick={speakPracticeSentenceSlowly} className="duo-retry-link">
                  <Headphones className="h-4 w-4" /> استمع ببطء قبل النطق
                </button>
              )}
              <button
                type="button"
                onClick={startListening}
                disabled={isListening || speakState === 'correct'}
                className={`duo-mic ${isListening ? 'is-listening' : ''} ${speakState}`}
              >
                <Mic className="h-5 w-5" />
                {isListening ? 'أستمع إليك…' : speakState === 'correct' ? 'تم النطق' : 'اضغط للتحدث'}
              </button>
              <p className="duo-mic-hint">
                {speakState === 'unsupported' || speakState === 'error'
                  ? speakErrorMessage
                  : isListening
                    ? 'تحدث الآن بوضوح…'
                    : goldEdition && speakTargets.length > 1
                      ? 'استمع أولاً، ثم انطق الجملة. لديك جملتان في Gold+.'
                      : 'استمع أولاً، ثم انطق الجملة بوضوح.'}
              </p>
              {transcript && <p className="duo-transcript" dir="ltr">“{transcript}”</p>}
              {speakState === 'wrong' && (
                <button type="button" onClick={retrySpeaking} className="duo-retry-link">
                  <RotateCcw className="h-4 w-4" /> حاول مرة أخرى
                </button>
              )}
            </div>
          )}

          {phase === 'picture' && goldPicture && (
            <div className="duo-exercise animate-fade-in">
              <span className="duo-kicker">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                Gold+ · تحدٍّ بصري · +{GOLD_PICTURE_BONUS_XP} XP
              </span>
              <h1 className="duo-title">اختر الصورة الصحيحة</h1>
              <div className="duo-hero duo-hero-quiz" dir="ltr">
                <CharacterFigure character={lesson.characterA} speaking={isSpeaking} />
                <div className="duo-bubble">
                  <button
                    type="button"
                    onClick={() => playText(goldPicture.prompt, `lesson-gold-picture:${lesson.id}`, lesson.characterA)}
                    className="duo-bubble-audio"
                    aria-label="استمع إلى الكلمة"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <p className="duo-bubble-en">Which picture shows “{goldPicture.prompt}”?</p>
                </div>
              </div>
              <p className="duo-translation">
                اختر الصورة التي تعني: <strong dir="ltr">{goldPicture.prompt}</strong>
              </p>
              <div className="duo-choice-grid">
                {goldPicture.options.map((option, index) => {
                  const selected = goldPictureSelection === option.label;
                  const correctOption = goldPictureChecked && normalizeAnswer(option.label) === normalizeAnswer(goldPicture.correctLabel);
                  const wrongOption = goldPictureChecked && selected && !correctOption;
                  return (
                    <button
                      key={`${option.label}-${index}`}
                      type="button"
                      disabled={goldPictureChecked}
                      onClick={() => setGoldPictureSelection(option.label)}
                      className={`duo-choice tone-${index % 4} ${selected ? 'is-selected' : ''} ${correctOption ? 'is-correct' : ''} ${wrongOption ? 'is-wrong' : ''}`}
                    >
                      <span className="duo-choice-art" aria-hidden="true">{option.emoji}</span>
                      <span className="duo-choice-label" dir="rtl">{option.label}</span>
                      {correctOption && <span className="duo-choice-badge"><Check className="h-4 w-4" /></span>}
                      {wrongOption && <span className="duo-choice-badge is-wrong"><X className="h-4 w-4" /></span>}
                    </button>
                  );
                })}
              </div>
              <div className="duo-companion" aria-hidden="true">
                <CharacterFigure character={lesson.characterB} />
              </div>
            </div>
          )}

          {phase === 'quiz' && question && (
            <div key={question.id} className="duo-exercise animate-fade-in">
              <span className="duo-kicker">تدرّب · سؤال {questionIndex + 1} من {questions.length}</span>
              <h1 className="duo-title">{quizTitle}</h1>

              <div className="duo-hero duo-hero-quiz" dir="ltr">
                <CharacterFigure character={lesson.characterA} speaking={isSpeaking} />
                <div className={`duo-bubble ${quizBubbleIsArabic ? 'is-arabic' : ''}`}>
                  {question.questionEn && question.type !== 'fill_blank' && question.type !== 'arrange_sentence' && (
                    <button type="button" onClick={speakQuestion} className="duo-bubble-audio" aria-label="استمع إلى السؤال">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                  <p className={quizBubbleIsArabic ? 'duo-bubble-ar' : 'duo-bubble-en'}>{quizBubble}</p>
                </div>
              </div>

              {question.type === 'fill_blank' ? (
                <div className="duo-fill">
                  <input
                    type="text"
                    dir="ltr"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={selectedOption ?? ''}
                    disabled={isAnswerChecked}
                    onChange={(event) => setSelectedOption(event.target.value)}
                    placeholder="اكتب الكلمة هنا"
                    aria-label={`اكتب الكلمة ${userProfile.targetLanguage === 'fr' ? 'الفرنسية' : 'الإنجليزية'} المناسبة`}
                    className="duo-input"
                  />
                </div>
              ) : question.type === 'arrange_sentence' && !answerIsSentence ? (
                <div className="duo-arrange" dir="ltr">
                  <div className="duo-answer-line">
                    {arrangedTokens.length
                      ? arrangedTokens.map((optionIndex, position) => (
                        <button
                          key={`${optionIndex}-${position}`}
                          type="button"
                          disabled={isAnswerChecked}
                          onClick={() => setArrangedTokens((tokens) => tokens.filter((_, index) => index !== position))}
                          className="duo-word"
                        >
                          {question.options[optionIndex]}
                        </button>
                      ))
                      : <span className="duo-answer-placeholder">رتّب الكلمات هنا</span>}
                  </div>
                  <div className="duo-bank">
                    {question.options.map((option, index) => arrangedTokens.includes(index) ? null : (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setArrangedTokens((tokens) => [...tokens, index])}
                        className="duo-word"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : optionGrid ? (
                <div className="duo-option-list">
                  {question.options.map((option, index) => {
                    const selected = selectedOption === option;
                    const correctOption = isAnswerChecked && normalizeAnswer(option) === normalizeAnswer(question.correctAnswer);
                    const wrongOption = isAnswerChecked && selected && !correctOption;
                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedOption(option)}
                        className={`duo-option ${selected ? 'is-selected' : ''} ${correctOption ? 'is-correct' : ''} ${wrongOption ? 'is-wrong' : ''}`}
                      >
                        <span className="duo-option-key">{['أ', 'ب', 'ج', 'د'][index] ?? index + 1}</span>
                        <span dir={isArabic(option) ? 'rtl' : 'ltr'}>{option}</span>
                        {correctOption && <CheckCircle2 className="h-5 w-5" />}
                        {wrongOption && <X className="h-5 w-5" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="duo-choice-grid">
                  {question.options.map((option, index) => {
                    const selected = selectedOption === option;
                    const correctOption = isAnswerChecked && normalizeAnswer(option) === normalizeAnswer(question.correctAnswer);
                    const wrongOption = isAnswerChecked && selected && !correctOption;
                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedOption(option)}
                        className={`duo-choice tone-${index % 4} ${selected ? 'is-selected' : ''} ${correctOption ? 'is-correct' : ''} ${wrongOption ? 'is-wrong' : ''}`}
                      >
                        <span className="duo-choice-art" aria-hidden="true">{getOptionEmoji(option)}</span>
                        <span className="duo-choice-label" dir={isArabic(option) ? 'rtl' : 'ltr'}>{option}</span>
                        {correctOption && <span className="duo-choice-badge"><Check className="h-4 w-4" /></span>}
                        {wrongOption && <span className="duo-choice-badge is-wrong"><X className="h-4 w-4" /></span>}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="duo-companion" aria-hidden="true">
                <CharacterFigure character={lesson.characterB} />
              </div>
            </div>
          )}

          {phase === 'result' && (goldEdition ? (
            <GoldLessonCelebration
              lesson={lesson}
              score={finalScore}
              xp={earnedXp}
              bonusXp={goldPictureBonusXp}
              correct={finalCorrect}
              total={questions.length}
              passed={finalScore >= getLevelExamPassingScore()}
              onContinue={onBackToPath}
              onRetry={retryAfterFailure}
            />
          ) : (
            <div className="duo-result animate-scale-up">
              <div className="duo-result-art" aria-hidden="true">
                <CharacterFigure character={lesson.characterA} />
                <CharacterFigure character={lesson.characterB} />
              </div>
              <div className="duo-result-stars" aria-label={`${finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : finalScore > 0 ? 1 : 0} نجوم`}>
                {[0, 1, 2].map((star) => (
                  <Star key={star} className={star < (finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : finalScore > 0 ? 1 : 0) ? 'earned' : ''} />
                ))}
              </div>
              <h1 className="duo-result-title">
                {finalScore >= getLevelExamPassingScore() ? 'أكملت الدرس!' : 'أنهيت الجولة!'}
              </h1>
              <p className="duo-result-lesson">{lesson.titleAr}</p>
              <div className="duo-result-stats">
                <div><strong>{finalScore}%</strong><span>الدقة</span></div>
                <div><strong>{earnedXp}</strong><span>XP مكتسب</span></div>
                <div><strong>{finalCorrect}/{questions.length}</strong><span>إجابات صحيحة</span></div>
              </div>
              {missedWordIds.length > 0 && (
                <p className="duo-result-hint">أضفنا الكلمات المرتبطة بأخطائك إلى قائمة المراجعة.</p>
              )}
              <div className="duo-result-actions">
                {finalScore < getLevelExamPassingScore() && (
                  <button type="button" onClick={retryAfterFailure} className="duo-btn duo-btn-secondary">
                    <RotateCcw className="h-4 w-4" /> حاول مجدداً
                  </button>
                )}
                <button type="button" onClick={onBackToPath} className="duo-btn duo-btn-primary">
                  <Check className="h-4 w-4" /> تابع إلى المسار
                </button>
              </div>
            </div>
          ))}

          {phase === 'failed' && (
            <div className="duo-failed animate-scale-up">
              <div className="duo-failed-icon"><HeartOff className="h-12 w-12" /></div>
              <h1>نفدت القلوب!</h1>
              <p>لا بأس، الأخطاء جزء من التعلّم. أعد المحاولة وستنجح.</p>
              <div className="duo-result-actions">
                <button type="button" onClick={retryAfterFailure} className="duo-btn duo-btn-primary">
                  <RotateCcw className="h-4 w-4" /> أعد المحاولة
                </button>
                <button type="button" onClick={onBackToPath} className="duo-btn duo-btn-secondary">
                  العودة إلى المسار
                </button>
              </div>
            </div>
          )}
        </main>

        {footer && phase !== 'result' && phase !== 'failed' && (
          <footer className={`duo-footer ${footerTone}`}>
            {footer}
          </footer>
        )}
      </div>
    </section>
  );
};
