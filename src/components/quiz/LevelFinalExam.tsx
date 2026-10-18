import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Check,
  Headphones,
  Lightbulb,
  RotateCcw,
  X,
} from 'lucide-react';
import type { LevelExamResult, Lesson } from '../../types';
import { getLevelExamPassingScore } from '../../services/learningPath';
import { speechService } from '../../services/speechService';

type QuestionKind =
  | 'multiple_choice'
  | 'listening'
  | 'matching'
  | 'fill_blank'
  | 'arrange_sentence'
  | 'comprehension';

interface ExamQuestion {
  id: string;
  sourceLessonId: string;
  topicAr: string;
  kind: QuestionKind;
  promptAr: string;
  promptEn?: string;
  contextEn?: string;
  options?: string[];
  words?: { id: string; text: string }[];
  correctAnswer: string;
  explanationAr: string;
  audioText?: string;
  audioAssetUrl?: string;
  audioGender?: 'male' | 'female';
  audioAccent: 'en-US' | 'en-GB';
  reviewWordIds: string[];
}

interface LevelFinalExamProps {
  stage: number;
  titleAr: string;
  lessons: Lesson[];
  result?: LevelExamResult;
  voiceAccent: 'en-US' | 'en-GB';
  onClose: () => void;
  onComplete: (score: number, reviewTopics: string[], reviewWordIds: string[]) => void;
}

const QUESTION_LABELS: Record<QuestionKind, string> = {
  multiple_choice: 'اختيار المعنى',
  listening: 'استماع',
  matching: 'مطابقة مفردة',
  fill_blank: 'إكمال فراغ',
  arrange_sentence: 'ترتيب جملة',
  comprehension: 'فهم حوار',
};

const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const normalize = (value: string) => value.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();

const buildQuestionPool = (lessons: Lesson[], voiceAccent: 'en-US' | 'en-GB') => {
  const allWords = lessons.flatMap((lesson) => lesson.vocabulary);
  const translations = [...new Set(allWords.map((word) => word.translationAr))];
  const pool: ExamQuestion[] = [];

  for (const lesson of lessons) {
    const dialogue = lesson.dialogue;
    const vocabulary = lesson.vocabulary;
    const lessonQuiz = lesson.quiz[0];
    if (lessonQuiz) {
      pool.push({
        id: `${lesson.id}-final-choice`,
        sourceLessonId: lesson.id,
        topicAr: lesson.titleAr,
        kind: 'multiple_choice',
        promptAr: lessonQuiz.questionAr,
        promptEn: lessonQuiz.questionEn,
        options: lessonQuiz.options,
        correctAnswer: lessonQuiz.correctAnswer,
        explanationAr: lessonQuiz.explanationAr,
        audioAccent: voiceAccent,
        reviewWordIds: lesson.vocabulary.slice(0, 1).map((word) => word.id),
      });
    }

    const listeningLine = dialogue[0];
    if (listeningLine) {
      const speaker =
        listeningLine.speakerId === lesson.characterA.id ? lesson.characterA : lesson.characterB;
      const distractors = dialogue
        .filter((line) => line.id !== listeningLine.id)
        .map((line) => line.textAr);
      const listeningReviewWordIds = vocabulary
        .filter((word) =>
          listeningLine.textEn.toLowerCase().includes(word.word.toLowerCase().split(' ')[0])
        )
        .map((word) => word.id)
        .slice(0, 2);
      pool.push({
        id: `${lesson.id}-final-listen`,
        sourceLessonId: lesson.id,
        topicAr: lesson.titleAr,
        kind: 'listening',
        promptAr: 'استمع إلى الجملة واختر معناها الأقرب.',
        options: [...new Set([listeningLine.textAr, ...distractors])].slice(0, 4),
        correctAnswer: listeningLine.textAr,
        explanationAr: `تقول الجملة: «${listeningLine.textAr}»`,
        audioText: listeningLine.textEn,
        audioGender: speaker.voiceGender,
        audioAssetUrl: speechService.getLessonSpeechAssetUrl(
          lesson.id,
          listeningLine.id,
          speaker.voiceGender,
          voiceAccent
        ),
        audioAccent: voiceAccent,
        reviewWordIds: listeningReviewWordIds.length
          ? listeningReviewWordIds
          : vocabulary.slice(0, 1).map((word) => word.id),
      });
    }

    const matchWord = vocabulary[1] ?? vocabulary[0];
    if (matchWord) {
      const alternatives = translations.filter((translation) => translation !== matchWord.translationAr);
      pool.push({
        id: `${lesson.id}-final-match`,
        sourceLessonId: lesson.id,
        topicAr: lesson.titleAr,
        kind: 'matching',
        promptAr: `اختر معنى المفردة: ${matchWord.word}`,
        promptEn: matchWord.phonetic,
        options: shuffle([matchWord.translationAr, ...alternatives.slice(0, 3)]),
        correctAnswer: matchWord.translationAr,
        explanationAr: `تعني "${matchWord.word}" ${matchWord.translationAr}. مثال: ${matchWord.exampleSentence}`,
        audioAccent: voiceAccent,
        reviewWordIds: [matchWord.id],
      });
    }

    const sentenceLine = dialogue[1] ?? dialogue[0];
    if (sentenceLine) {
      const words = sentenceLine.textEn.match(/[\w’'-]+[.,!?;:]?/g) ?? sentenceLine.textEn.split(/\s+/);
      pool.push({
        id: `${lesson.id}-final-arrange`,
        sourceLessonId: lesson.id,
        topicAr: lesson.titleAr,
        kind: 'arrange_sentence',
        promptAr: 'رتّب الكلمات لتكوين جملة صحيحة من الحوار.',
        words: shuffle(words.map((word, index) => ({ id: `${lesson.id}-token-${index}`, text: word }))),
        correctAnswer: words.join(' '),
        explanationAr: `الترتيب الصحيح: ${sentenceLine.textEn}`,
        audioAccent: voiceAccent,
        reviewWordIds: vocabulary.slice(0, 2).map((word) => word.id),
      });
    }

    const blankWord = vocabulary[0];
    if (blankWord) {
      const escapedWord = blankWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const example = blankWord.exampleSentence;
      const sentence = new RegExp(escapedWord, 'i').test(example)
        ? example.replace(new RegExp(escapedWord, 'i'), '_____')
        : `${dialogue[0]?.textEn ?? ''} _____`;
      const alternatives = vocabulary
        .filter((word) => word.id !== blankWord.id)
        .map((word) => word.word);
      pool.push({
        id: `${lesson.id}-final-gap`,
        sourceLessonId: lesson.id,
        topicAr: lesson.titleAr,
        kind: 'fill_blank',
        promptAr: 'أكمل الجملة بالكلمة المناسبة.',
        promptEn: sentence,
        options: shuffle([blankWord.word, ...alternatives.slice(0, 3)]),
        correctAnswer: blankWord.word,
        explanationAr: `الكلمة المناسبة هي "${blankWord.word}" ومعناها ${blankWord.translationAr}.`,
        audioAccent: voiceAccent,
        reviewWordIds: [blankWord.id],
      });
    }

    const contextLines = dialogue.slice(0, Math.max(2, dialogue.length - 1));
    const answerLine = dialogue[dialogue.length - 1];
    if (contextLines.length && answerLine) {
      const distractors = dialogue
        .filter((line) => line.id !== answerLine.id)
        .map((line) => line.textAr);
      pool.push({
        id: `${lesson.id}-final-context`,
        sourceLessonId: lesson.id,
        topicAr: lesson.titleAr,
        kind: 'comprehension',
        promptAr: 'ما المعنى الأقرب لآخر رد في هذا الحوار؟',
        contextEn: contextLines.map((line) => line.textEn).join(' '),
        options: shuffle([...new Set([answerLine.textAr, ...distractors])]).slice(0, 4),
        correctAnswer: answerLine.textAr,
        explanationAr: `آخر رد هو: «${answerLine.textAr}»`,
        audioAccent: voiceAccent,
        reviewWordIds: vocabulary.slice(0, 2).map((word) => word.id),
      });
    }
  }

  return pool;
};

const createExam = (lessons: Lesson[], voiceAccent: 'en-US' | 'en-GB') => {
  const pool = buildQuestionPool(lessons, voiceAccent);
  const kinds: QuestionKind[] = [
    'multiple_choice',
    'listening',
    'matching',
    'fill_blank',
    'arrange_sentence',
    'comprehension',
  ];
  const selected: ExamQuestion[] = [];
  const usedIds = new Set<string>();

  for (const kind of shuffle(kinds)) {
    const candidates = shuffle(pool.filter((question) => question.kind === kind));
    const question = candidates.find((candidate) => !usedIds.has(candidate.id));
    if (question) {
      selected.push(question);
      usedIds.add(question.id);
    }
  }

  for (const question of shuffle(pool)) {
    if (selected.length >= 10) break;
    if (usedIds.has(question.id)) continue;
    selected.push(question);
    usedIds.add(question.id);
  }

  return shuffle(selected.slice(0, 10)).map((question) => ({
    ...question,
    options: question.options ? shuffle(question.options) : undefined,
  }));
};

export const LevelFinalExam: React.FC<LevelFinalExamProps> = ({
  stage,
  titleAr,
  lessons,
  result,
  voiceAccent,
  onClose,
  onComplete,
}) => {
  const [examVersion, setExamVersion] = useState(0);
  const questions = useMemo(
    () => createExam(lessons, voiceAccent),
    [examVersion, lessons, voiceAccent]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<{ id: string; text: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean }>>({});
  const [finished, setFinished] = useState(false);
  const passingScore = getLevelExamPassingScore();
  const question = questions[currentIndex];

  useEffect(() => () => speechService.stopSpeaking(), []);

  if (!question) return null;

  const answerValue = question.kind === 'arrange_sentence'
    ? selectedWords.map((word) => word.text).join(' ')
    : selectedOption ?? '';
  const isCorrect =
    question.kind === 'arrange_sentence'
      ? normalize(answerValue) === normalize(question.correctAnswer)
      : normalize(answerValue) === normalize(question.correctAnswer);

  const submitAnswer = () => {
    if (submitted || !answerValue) return;
    speechService.stopSpeaking();
    setSubmitted(true);
    setAnswers((previous) => ({
      ...previous,
      [question.id]: { answer: answerValue, correct: isCorrect },
    }));
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((index) => index + 1);
      setSelectedOption(null);
      setSelectedWords([]);
      setSubmitted(false);
      return;
    }

    const finalAnswers = {
      ...answers,
      [question.id]: { answer: answerValue, correct: isCorrect },
    };
    const correctCount = Object.values(finalAnswers).filter((answer) => answer.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const reviewTopics = [...new Set(
      questions
        .filter((item) => !finalAnswers[item.id]?.correct)
        .map((item) => item.topicAr)
    )];
    const reviewWordIds = [...new Set(
      questions
        .filter((item) => !finalAnswers[item.id]?.correct)
        .flatMap((item) => item.reviewWordIds)
    )];
    setAnswers(finalAnswers);
    setFinished(true);
    onComplete(score, reviewTopics, reviewWordIds);
  };

  const restart = () => {
    speechService.stopSpeaking();
    setExamVersion((version) => version + 1);
    setCurrentIndex(0);
    setSelectedOption(null);
    setSelectedWords([]);
    setSubmitted(false);
    setAnswers({});
    setFinished(false);
  };

  const playListeningPrompt = () => {
    if (!question.audioText) return;
    speechService.speakText({
      source: `level-exam:${stage}:${question.id}`,
      text: question.audioText,
      gender: question.audioGender ?? 'female',
      accent: question.audioAccent,
      audioAssetUrl: question.audioAssetUrl,
    });
  };

  const toggleWord = (word: { id: string; text: string }) => {
    if (submitted) return;
    setSelectedWords((previous) =>
      previous.some((item) => item.id === word.id)
        ? previous.filter((item) => item.id !== word.id)
        : [...previous, word]
    );
  };

  return (
    <div
      className="journey-exam fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`الاختبار النهائي: ${titleAr}`}
      onClick={(event) => event.stopPropagation()}
    >
      <section className="journey-exam-panel flex max-h-[92dvh] w-full max-w-xl flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl sm:p-6" dir="rtl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <p className="text-xs font-bold text-amber-400">اختبار نهاية المرحلة {stage}</p>
            <h2 className="mt-1 text-lg font-black text-white">{titleAr}</h2>
            <p className="mt-1 text-xs text-slate-400">
              10 أسئلة متنوعة · يلزم {passingScore}% للانتقال · المحاولات متاحة بلا حد
            </p>
          </div>
          <button type="button" onClick={() => { speechService.stopSpeaking(); onClose(); }} aria-label="إغلاق الاختبار" className="rounded-full bg-slate-800 p-2 text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </header>

        {finished ? (
          <div className="py-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
              <Award className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-black text-white">
              {result?.passed ? 'اجتزت المرحلة!' : 'محاولة جيدة، راجع ثم أعد الاختبار'}
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              نتيجتك {result?.latestScore ?? 0}% — أفضل نتيجة {result?.bestScore ?? 0}%
            </p>
            {result?.passed && <p className="mt-2 text-sm font-bold text-emerald-300">فُتحت المرحلة التالية. يمكنك العودة لمراجعة دروسك في أي وقت.</p>}
            {!result?.passed && (
              <p className="mt-2 text-xs text-slate-400">لم تُخصم نقاط عند الإعادة، ولم يتغير إنجاز الدروس السابقة.</p>
            )}
            {result?.reviewTopics.length ? (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-right">
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-200"><Lightbulb className="h-4 w-4" />موضوعات للمراجعة</h4>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {result.reviewTopics.map((topic) => <li key={topic}>• {topic}</li>)}
                </ul>
              </div>
            ) : null}
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={restart} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold hover:bg-slate-700">
                <RotateCcw className="h-4 w-4" /> إعادة بأسئلة مرتبة من جديد
              </button>
              <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-sky-400 py-3 text-sm font-black text-slate-950">متابعة المسار</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>السؤال {currentIndex + 1} من {questions.length}</span>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-sky-200">{QUESTION_LABELS[question.kind]}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-sky-400 transition-[width]" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>

            {question.contextEn && (
              <p dir="ltr" className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left font-en text-sm leading-relaxed text-slate-200">
                {question.contextEn}
              </p>
            )}
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-bold leading-relaxed text-white">{question.promptAr}</p>
              {question.promptEn && <p dir="ltr" className="mt-2 text-left font-en text-sm text-sky-200">{question.promptEn}</p>}
            </div>

            {question.kind === 'listening' && (
              <button type="button" onClick={playListeningPrompt} className="mt-3 inline-flex w-fit items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-200">
                <Headphones className="h-4 w-4" /> تشغيل الجملة الإنجليزية
              </button>
            )}

            {question.kind === 'arrange_sentence' ? (
              <div className="mt-4">
                <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3" dir="ltr">
                  {selectedWords.map((word, index) => (
                    <button key={word.id} type="button" disabled={submitted} onClick={() => toggleWord(word)} className="rounded-lg bg-sky-500/20 px-2.5 py-1.5 text-sm text-sky-100">{word.text}</button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2" dir="ltr">
                  {question.words?.filter((word) => !selectedWords.some((selected) => selected.id === word.id)).map((word) => (
                    <button key={word.id} type="button" disabled={submitted} onClick={() => toggleWord(word)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 disabled:opacity-50">{word.text}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {question.options?.map((option) => {
                  const correctOption = submitted && normalize(option) === normalize(question.correctAnswer);
                  const wrongSelected = submitted && option === selectedOption && !isCorrect;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={submitted}
                      onClick={() => setSelectedOption(option)}
                      className={`rounded-xl border px-3 py-3 text-right text-sm transition-colors ${
                        correctOption ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                          : wrongSelected ? 'border-rose-500 bg-rose-500/10 text-rose-200'
                            : selectedOption === option ? 'border-sky-400 bg-sky-400/10 text-sky-100'
                              : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {submitted && (
              <div className={`mt-4 rounded-xl border p-3 text-sm ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
                <p className="flex items-center gap-2 font-bold">
                  {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {isCorrect ? 'إجابة صحيحة' : `الإجابة الصحيحة: ${question.correctAnswer}`}
                </p>
                <p className="mt-1 text-xs opacity-90">{question.explanationAr}</p>
              </div>
            )}

            <button
              type="button"
              disabled={!answerValue}
              onClick={submitted ? nextQuestion : submitAnswer}
              className="mt-5 rounded-xl bg-sky-400 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitted ? (currentIndex + 1 === questions.length ? 'عرض النتيجة' : 'السؤال التالي') : 'تحقق من الإجابة'}
            </button>
          </>
        )}
      </section>
    </div>
  );
};
