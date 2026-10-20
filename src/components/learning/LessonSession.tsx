import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Heart,
  HeartOff,
  Lightbulb,
  Mic,
  RotateCcw,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import type { Character, DialogueLine, Lesson, QuizQuestion, UserProfile } from '../../types';
import { getLevelExamPassingScore } from '../../services/learningPath';
import { speechService } from '../../services/speechService';
import { PrimaryCharacter } from '../video/PrimaryCharacterArt';
import { getOptionEmoji, isSentenceOption } from './lessonVisuals';

type SessionPhase = 'welcome' | 'story' | 'speak' | 'quiz' | 'result' | 'failed';
type SpeakState = 'idle' | 'listening' | 'correct' | 'wrong' | 'unsupported' | 'skipped';

interface LessonSessionProps {
  lesson: Lesson;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToPath: () => void;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

const MAX_HEARTS = 5;

const STAGE_ACCENTS: Record<number, { main: string; soft: string; ink: string }> = {
  1: { main: '#ce82ff', soft: '#f5e9ff', ink: '#7d2fc4' },
  2: { main: '#1cb0f6', soft: '#e4f6ff', ink: '#0b6fa4' },
  3: { main: '#ffc800', soft: '#fff6d1', ink: '#8a5a00' },
  4: { main: '#ff9600', soft: '#fff0dd', ink: '#a35a00' },
};

const normalizeAnswer = (text: string) =>
  text.trim().toLocaleLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');

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

export const LessonSession: React.FC<LessonSessionProps> = ({ lesson, userProfile, onUpdateProfile, onBackToPath }) => {
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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrect, setFinalCorrect] = useState(0);

  const correctCountRef = useRef(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const questions = lesson.quiz ?? [];
  const question = questions[questionIndex];
  const line = lesson.dialogue[dialogueIndex];
  const language = userProfile.settings.voiceLanguage || 'en';
  const accent = STAGE_ACCENTS[lesson.curriculumStage ?? 1] ?? STAGE_ACCENTS[1];
  const speakTarget = lesson.vocabulary[0]?.exampleSentence ?? lesson.dialogue[0]?.textEn ?? lesson.title;
  const speakTargetAr = lesson.vocabulary[0]?.exampleSentenceAr ?? '';

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

  const totalSteps = lesson.dialogue.length + 1 + questions.length;
  const completedSteps = phase === 'welcome'
    ? 0
    : phase === 'story'
      ? dialogueIndex
      : phase === 'speak'
        ? lesson.dialogue.length
        : phase === 'quiz'
          ? lesson.dialogue.length + 1 + questionIndex
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
    recognitionRef.current?.abort?.();
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

  const playText = (text: string, source: string, character?: Character) => {
    speechService.stopSpeaking();
    setIsSpeaking(true);
    speechService.speakText({
      source,
      text,
      rate: userProfile.settings.playbackSpeed || 1,
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
    playText(speakTarget, `lesson-speak:${lesson.id}`, lesson.characterA);
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
    const reward = (firstCompletion ? 20 : 0) + (isNewBest ? finalCorrectCount * 15 + (passed ? 10 : 0) : 0);
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
      setLives((current) => Math.max(0, current - 1));
      setMissedWordIds((ids) => [...new Set([...ids, ...getReviewIds(question, lesson)])]);
      playEffect('error');
    }
  };

  const moveToNextQuestion = () => {
    if (!question) return;
    if (!isCorrectAnswer && lives === 0) {
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

  const startListening = () => {
    if (isListening || speakState === 'correct') return;
    const recognitionConstructor = (window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!recognitionConstructor) {
      setSpeakState('unsupported');
      return;
    }

    try {
      const recognition = new recognitionConstructor();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript ?? '';
        setTranscript(spoken);
        setSpeakState(speechMatches(spoken, speakTarget) ? 'correct' : 'wrong');
      };
      recognition.onerror = () => {
        setIsListening(false);
        setSpeakState('unsupported');
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      setTranscript('');
      setSpeakState('listening');
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeakState('unsupported');
    }
  };

  const retrySpeaking = () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    setTranscript('');
    setSpeakState('idle');
    setIsListening(false);
  };

  const skipSpeaking = () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    setIsListening(false);
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
    : phase === 'speak' && ['correct', 'wrong', 'unsupported', 'skipped'].includes(speakState)
      ? speakState === 'unsupported'
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
      const isDone = ['correct', 'wrong', 'unsupported', 'skipped'].includes(speakState);
      const isPositive = speakState === 'correct' || speakState === 'skipped';
      return (
        <div className={`duo-footer-panel ${isDone ? (isPositive ? 'is-correct' : 'is-wrong') : ''}`}>
          {isDone && (
            <div className="duo-feedback-copy">
              <strong>
                {speakState === 'correct' && 'ممتاز! نطق واضح.'}
                {speakState === 'wrong' && 'لم نسمع الجملة بوضوح.'}
                {speakState === 'unsupported' && 'التسجيل الصوتي غير متاح هنا.'}
                {speakState === 'skipped' && 'لا بأس، يمكنك التدرب لاحقاً.'}
              </strong>
              <span>
                {speakState === 'wrong'
                  ? 'يمكنك المحاولة مرة أخرى أو المتابعة.'
                  : speakState === 'unsupported'
                    ? 'استمع إلى الجملة ثم تابع الدرس.'
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
            {speakState === 'wrong' && (
              <button type="button" onClick={retrySpeaking} className="duo-btn duo-btn-secondary">
                <RotateCcw className="h-4 w-4" /> حاول مجدداً
              </button>
            )}
            <button
              type="button"
              disabled={!isDone}
              onClick={startQuiz}
              className="duo-btn duo-btn-primary duo-btn-grow"
            >
              متابعة
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
            <strong>{isCorrectAnswer ? 'ممتاز!' : lives === 0 ? 'نفدت القلوب!' : 'لا بأس!'}</strong>
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
            aria-label={`${lives} محاولات متبقية`}
          >
            <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
            <span>{lives}</span>
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
              <div className="duo-meta">
                <span><BookOpen className="h-4 w-4" /> {lesson.dialogue.length} خطوات استماع</span>
                <span><Mic className="h-4 w-4" /> تدريب نطق</span>
                <span><CheckCircle2 className="h-4 w-4" /> {questions.length} تمارين</span>
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
              <span className="duo-kicker">تدرّب على النطق</span>
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
                {speakState === 'unsupported'
                  ? 'هذا المتصفح لا يدعم التعرف على الصوت. يمكنك الاستماع والمتابعة.'
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
                    placeholder="Type here"
                    aria-label="اكتب الكلمة الإنجليزية المناسبة"
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

          {phase === 'result' && (
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
          )}

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
