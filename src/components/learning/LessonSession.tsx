import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Headphones, Lightbulb, Play, RotateCcw, Star, Volume2, X } from 'lucide-react';
import type { DialogueLine, Lesson, QuizQuestion, UserProfile } from '../../types';
import { getLevelExamPassingScore } from '../../services/learningPath';
import { speechService } from '../../services/speechService';
import { LearningBuddy, type BuddyMood } from './LearningBuddy';
import { LessonVisual } from './LessonVisual';
import { PrimaryAvatar } from '../video/PrimaryCharacterArt';

type SessionPhase = 'welcome' | 'story' | 'quiz' | 'result';

interface LessonSessionProps {
  lesson: Lesson;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackToPath: () => void;
}

const normalizeAnswer = (text: string) => text.trim().toLocaleLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');

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

  const questions = lesson.quiz ?? [];
  const question = questions[questionIndex];
  const line = lesson.dialogue[dialogueIndex];
  const accent = userProfile.settings.voiceAccent || 'en-US';
  const playEffect = (effect: 'success' | 'error') => {
    if (!userProfile.settings.soundEffects) return;
    if (effect === 'success') speechService.playSuccessChime();
    else speechService.playErrorBuzz();
  };
  const answerIsSentence = Boolean(question?.type === 'arrange_sentence' && question.options.some((option) => normalizeAnswer(option) === normalizeAnswer(question.correctAnswer)));
  const arrangedAnswer = arrangedTokens.map((index) => question?.options[index] ?? '').join(' ');
  const selectedAnswer = question?.type === 'arrange_sentence' && !answerIsSentence ? arrangedAnswer : selectedOption ?? '';
  const isCorrectAnswer = isAnswerChecked && normalizeAnswer(selectedAnswer) === normalizeAnswer(question?.correctAnswer ?? '');
  const progressTotal = lesson.dialogue.length + questions.length;
  const completedSteps = phase === 'welcome' ? 0 : phase === 'story' ? dialogueIndex : lesson.dialogue.length + questionIndex + (phase === 'result' ? 1 : 0);
  const progressPercent = phase === 'result' ? 100 : Math.max(4, Math.min(96, Math.round((completedSteps / Math.max(1, progressTotal)) * 100)));
  const lessonMood: BuddyMood = isAnswerChecked ? (isCorrectAnswer ? 'happy' : 'oops') : phase === 'quiz' ? 'thinking' : 'happy';

  const lineSpeaker = useMemo(() => {
    if (!line) return lesson.characterA;
    return line.speakerId === lesson.characterA.id ? lesson.characterA : lesson.characterB;
  }, [line, lesson.characterA, lesson.characterB]);

  useEffect(() => () => speechService.stopSpeaking(), []);

  const speakLine = (dialogueLine: DialogueLine, index: number) => {
    const speaker = dialogueLine.speakerId === lesson.characterA.id ? lesson.characterA : lesson.characterB;
    speechService.speakText({
      source: `lesson-session:${lesson.id}:${dialogueLine.id}`,
      text: dialogueLine.textEn,
      rate: userProfile.settings.playbackSpeed || 1,
      pitch: speaker.voicePitch || 1,
      gender: speaker.voiceGender,
      accent,
      audioAssetUrl: speechService.getLessonSpeechAssetUrl(lesson.id, dialogueLine.id, speaker.voiceGender, accent),
      onStart: () => setDialogueIndex(index),
    });
  };

  const moveDialogue = (index: number) => {
    speechService.stopSpeaking();
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
      setCorrectCount((count) => count + 1);
      playEffect('success');
    } else {
      setMissedWordIds((ids) => [...new Set([...ids, ...getReviewIds(question, lesson)])]);
      playEffect('error');
    }
  };

  const moveToNextQuestion = () => {
    if (!question) return;
    const finalCount = correctCount + (isCorrectAnswer ? 1 : 0);
    if (questionIndex + 1 >= questions.length) {
      completeSession(finalCount);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedOption(null);
    setArrangedTokens([]);
    setIsAnswerChecked(false);
  };

  const startQuiz = () => {
    speechService.stopSpeaking();
    setQuestionIndex(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setArrangedTokens([]);
    setIsAnswerChecked(false);
    if (questions.length) setPhase('quiz');
    else completeSession(0);
  };

  const playQuestionAudio = () => {
    if (!question?.questionEn) return;
    speechService.speakText({ source: `lesson-question:${lesson.id}:${question.id}`, text: question.questionEn, accent, rate: .9 });
  };

  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 100;
  const resultStars = score >= 90 ? 3 : score >= 70 ? 2 : score > 0 ? 1 : 0;

  return (
    <section className="lesson-session h-full min-h-0 w-full overflow-y-auto" dir="rtl">
      <div className="lesson-session-shell mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-6 pt-3 sm:px-7 sm:pt-5">
        <header className="lesson-session-header flex items-center gap-3">
          <button type="button" onClick={onBackToPath} className="lesson-exit-button" aria-label="العودة إلى المسار"><X className="h-5 w-5" /></button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="تقدم الدرس" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
            <div className="lesson-progress-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="lesson-step-count font-mono-num">{phase === 'result' ? '✓' : `${Math.min(completedSteps + 1, progressTotal)} / ${Math.max(1, progressTotal)}`}</span>
        </header>

        {phase === 'welcome' && (
          <div className="lesson-welcome-card mt-5 grid gap-5 rounded-[2rem] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
            <div>
              <span className="lesson-level-chip">{lesson.level} · المرحلة {lesson.curriculumStage ?? 1}</span>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{lesson.titleAr}</h1>
              <p dir="ltr" className="mt-1 font-en text-sm font-bold text-slate-500">{lesson.title}</p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{lesson.descriptionAr}</p>
              {lesson.learningNoteAr && <p className="mt-3 rounded-2xl bg-white/75 p-3 text-xs leading-6 text-slate-600"><Lightbulb className="ml-1 inline h-4 w-4 text-amber-500" />{lesson.learningNoteAr}</p>}
            </div>
            <LearningBuddy message="جاهز؟" />
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/10 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><BookOpen className="h-4 w-4 text-teal-600" />{lesson.dialogue.length} خطوات استماع <span>·</span>{questions.length} تمارين</div>
              <button type="button" onClick={() => setPhase(lesson.dialogue.length ? 'story' : 'quiz')} className="lesson-primary-button"><Play className="h-4 w-4 fill-current" /> ابدأ الدرس</button>
            </div>
          </div>
        )}

        {phase === 'story' && line && (
          <div key={line.id} className="lesson-story-step mt-5 flex flex-1 flex-col animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div><span className="lesson-kicker">استمع وافهم · {dialogueIndex + 1} من {lesson.dialogue.length}</span><h1 className="mt-2 text-xl font-black text-slate-800 sm:text-2xl">تعرّف على الموقف</h1></div>
              <LearningBuddy compact mood={isAnswerChecked ? lessonMood : 'happy'} />
            </div>
            <LessonVisual
              lesson={lesson}
              currentLine={line}
              alt={`صورة تعليمية تمثل ${lesson.titleAr}: ${lesson.descriptionAr}`}
              className="lesson-visual-story mt-4"
            />
            <div className="lesson-dialogue-card mt-4 rounded-[1.5rem] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3"><span className="lesson-speaker-chip">{lineSpeaker.design ? <PrimaryAvatar design={lineSpeaker.design} className="h-6 w-6 shrink-0" label={lineSpeaker.nameAr} /> : lineSpeaker.avatar} {lineSpeaker.nameAr}</span><button type="button" onClick={() => speakLine(line, dialogueIndex)} className="lesson-audio-button" aria-label="استمع إلى الجملة"><Volume2 className="h-5 w-5" /></button></div>
              <p dir="ltr" className="mt-4 text-left font-en text-lg font-extrabold leading-relaxed text-slate-800 sm:text-xl">{line.textEn}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{line.textAr}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
              <button type="button" disabled={dialogueIndex === 0} onClick={() => moveDialogue(dialogueIndex - 1)} className="lesson-secondary-button disabled:opacity-40"><ArrowRight className="h-4 w-4" /> السابق</button>
              {dialogueIndex + 1 < lesson.dialogue.length
                ? <button type="button" onClick={() => moveDialogue(dialogueIndex + 1)} className="lesson-primary-button">التالي <ArrowLeft className="h-4 w-4" /></button>
                : <button type="button" onClick={startQuiz} className="lesson-primary-button"><Headphones className="h-4 w-4" /> ابدأ التمارين</button>}
            </div>
          </div>
        )}

        {phase === 'quiz' && question && (
          <div key={question.id} className="lesson-quiz-step mt-6 flex flex-1 flex-col animate-fade-in">
            <div className="flex items-center justify-between gap-3"><span className="lesson-kicker">تدرّب · سؤال {questionIndex + 1} من {questions.length}</span>{question.questionEn && <button type="button" onClick={playQuestionAudio} className="lesson-audio-button" aria-label="استمع إلى السؤال"><Volume2 className="h-5 w-5" /></button>}</div>
            <div className="mt-5 flex items-start gap-3"><LearningBuddy compact mood={lessonMood} message={isAnswerChecked ? (isCorrectAnswer ? 'ممتاز!' : 'لا بأس، تعلّمنا!') : 'فكر فيها'} /><div><h1 className="text-xl font-black leading-relaxed text-slate-800 sm:text-2xl">{question.questionAr}</h1>{question.questionEn && <p dir="ltr" className="mt-2 text-left font-en text-sm font-semibold text-slate-500">{question.type === 'fill_blank' ? question.questionEn.replace(/_{3,}/g, '______') : question.questionEn}</p>}</div></div>

            <LessonVisual
              lesson={lesson}
              alt={`رسم توضيحي لدرس ${lesson.titleAr}، مرتبط بهذا السؤال: ${question.questionAr}${question.questionEn ? ` — ${question.questionEn}` : ''}`}
              className="lesson-visual-question mt-4"
            />

            {question.type === 'fill_blank' ? (
              <div className="mt-7 flex flex-1 flex-col gap-4">
                <label htmlFor={`answer-${question.id}`} className="text-xs font-black text-slate-600">اكتب الكلمة الإنجليزية المناسبة:</label>
                <input
                  id={`answer-${question.id}`}
                  type="text"
                  dir="ltr"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={selectedOption ?? ''}
                  disabled={isAnswerChecked}
                  onChange={(event) => setSelectedOption(event.target.value)}
                  placeholder="Your answer…"
                  className="lesson-type-input w-full rounded-2xl border-2 px-4 py-4 text-left font-en text-lg font-bold outline-none transition-colors"
                />
              </div>
            ) : question.type === 'arrange_sentence' && !answerIsSentence ? (
              <div className="mt-7 flex flex-1 flex-col gap-5">
                <div className="lesson-answer-zone flex min-h-20 flex-wrap content-start items-center justify-center gap-2 rounded-2xl border-b-2 border-dashed border-teal-300 p-3">
                  {arrangedTokens.length ? arrangedTokens.map((optionIndex, position) => <button key={`${optionIndex}-${position}`} type="button" disabled={isAnswerChecked} onClick={() => setArrangedTokens((tokens) => tokens.filter((_, index) => index !== position))} className="lesson-word-chip">{question.options[optionIndex]}</button>) : <span className="text-xs text-slate-400">رتّب الكلمات هنا</span>}
                </div>
                <div className="flex flex-wrap justify-center gap-2">{question.options.map((option, index) => arrangedTokens.includes(index) ? null : <button key={`${option}-${index}`} type="button" disabled={isAnswerChecked} onClick={() => setArrangedTokens((tokens) => [...tokens, index])} className="lesson-word-chip">{option}</button>)}</div>
              </div>
            ) : (
              <div className="mt-6 flex flex-1 flex-col gap-3">{question.options.map((option, index) => {
                const selected = selectedOption === option;
                const correctOption = isAnswerChecked && normalizeAnswer(option) === normalizeAnswer(question.correctAnswer);
                const wrongOption = isAnswerChecked && selected && !correctOption;
                return <button key={`${option}-${index}`} type="button" disabled={isAnswerChecked} onClick={() => setSelectedOption(option)} className={`lesson-answer-option ${selected ? 'selected' : ''} ${correctOption ? 'correct' : ''} ${wrongOption ? 'wrong' : ''}`}>
                  <span dir={/[\u0600-\u06FF]/.test(option) ? 'rtl' : 'ltr'} className={/[\u0600-\u06FF]/.test(option) ? '' : 'font-en'}>{option}</span>
                  {correctOption && <CheckCircle2 className="h-5 w-5" />}{wrongOption && <X className="h-5 w-5" />}
                </button>;
              })}</div>
            )}

            {isAnswerChecked && <div className={`lesson-feedback mt-4 rounded-2xl p-4 ${isCorrectAnswer ? 'is-correct' : 'is-wrong'}`}><div className="flex items-center gap-2 font-black">{isCorrectAnswer ? <CheckCircle2 className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}{isCorrectAnswer ? 'إجابة صحيحة!' : `الإجابة: ${question.correctAnswer}`}</div><p className="mt-2 text-xs leading-6">{question.explanationAr}</p></div>}

            <div className="mt-auto border-t border-slate-200 pt-4">
              {!isAnswerChecked
                ? <button type="button" disabled={question.type === 'arrange_sentence' && !answerIsSentence ? arrangedTokens.length === 0 : !selectedOption} onClick={checkAnswer} className="lesson-check-button">تحقّق من الإجابة</button>
                : <button type="button" onClick={moveToNextQuestion} className={`lesson-check-button ${isCorrectAnswer ? '' : 'review-next'}`}>{questionIndex + 1 < questions.length ? 'السؤال التالي' : 'اعرض النتيجة'} <ArrowLeft className="h-4 w-4" /></button>}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="lesson-result-card my-auto animate-scale-up rounded-[2rem] p-6 text-center sm:p-9">
            <LearningBuddy mood={score >= 70 ? 'happy' : 'thinking'} message={score >= 70 ? 'إنجاز رائع!' : 'كل محاولة تقرّبك!'} />
            <div className="lesson-result-stars mt-4 flex justify-center gap-2" aria-label={`${resultStars} نجوم`}>{[0, 1, 2].map((star) => <Star key={star} className={`h-10 w-10 ${star < resultStars ? 'earned' : ''}`} />)}</div>
            <h1 className="mt-4 text-2xl font-black text-slate-800">{score >= getLevelExamPassingScore() ? 'أكملت الدرس!' : 'أنهيت الجولة!'}</h1>
            <p className="mt-2 text-sm text-slate-600">{lesson.titleAr}</p>
            <div className="lesson-result-stats mt-6 grid grid-cols-3 gap-2"><div><strong>{score}%</strong><span>الدقة</span></div><div><strong>{earnedXp}</strong><span>XP مكتسب</span></div><div><strong>{correctCount}/{questions.length}</strong><span>إجابات صحيحة</span></div></div>
            {missedWordIds.length > 0 && <p className="mt-4 text-xs font-bold text-amber-700">أضفنا الكلمات المرتبطة بأخطائك إلى قائمة المراجعة.</p>}
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {score < getLevelExamPassingScore() && <button type="button" onClick={() => { setPhase('quiz'); setQuestionIndex(0); setCorrectCount(0); setSelectedOption(null); setArrangedTokens([]); setIsAnswerChecked(false); }} className="lesson-secondary-button"><RotateCcw className="h-4 w-4" /> حاول مجددًا</button>}
              <button type="button" onClick={onBackToPath} className="lesson-primary-button"><Check className="h-4 w-4" /> تابع إلى المسار</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
