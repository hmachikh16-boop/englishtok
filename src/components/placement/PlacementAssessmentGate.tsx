import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Languages,
  LockKeyhole,
  PencilLine,
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react';
import type { PlacementAssessmentState, UserProfile } from '../../types';
import {
  PLACEMENT_MAX_QUESTIONS,
  PLACEMENT_PASS_RULE,
  PLACEMENT_STAGE_LABELS,
  buildPlacementQuestions,
  getPlacementSession,
} from '../../services/placementService';
import { speechService } from '../../services/speechService';

interface PlacementAssessmentGateProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onContinue: () => void;
}

const SKILL_LABELS: Record<string, string> = {
  vocabulary: 'مفردات',
  grammar: 'قواعد',
  reading: 'قراءة',
};

const isArabicText = (value: string) => /[\u0600-\u06FF]/.test(value);

const testState = (startedAt: string, answers: Record<string, string>): PlacementAssessmentState => ({
  schemaVersion: 1,
  startedAt,
  answers,
});

export const PlacementAssessmentGate: React.FC<PlacementAssessmentGateProps> = ({
  profile,
  onUpdateProfile,
  onContinue,
}) => {
  const questions = useMemo(() => buildPlacementQuestions(), []);
  const knownQuestionIds = useMemo(() => new Set(questions.map((question) => question.id)), [questions]);
  const placement = profile.placementAssessment;
  const [showSavedResult, setShowSavedResult] = useState(true);
  const result = showSavedResult ? placement?.result : undefined;
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(placement?.answers ?? {}).filter(([questionId]) => knownQuestionIds.has(questionId)),
    ),
  );
  const [started, setStarted] = useState(Boolean(placement?.startedAt));
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const session = useMemo(() => getPlacementSession(answers), [answers]);
  const question = useMemo(
    () => (activeQuestionId ? questions.find((entry) => entry.id === activeQuestionId) : undefined) ?? session.question,
    [activeQuestionId, questions, session.question],
  );
  const selected = question ? answers[question.id] : undefined;
  const willFinish = question && selected
    ? Boolean(getPlacementSession({ ...answers, [question.id]: selected }).result)
    : false;

  useEffect(() => {
    if (started && !activeQuestionId && session.question) {
      setActiveQuestionId(session.question.id);
    }
  }, [activeQuestionId, session.question, started]);

  const beginTest = () => {
    const startedAt = placement?.startedAt ?? new Date().toISOString();
    setShowSavedResult(false);
    onUpdateProfile({ placementAssessment: testState(startedAt, answers) });
    setActiveQuestionId(getPlacementSession(answers).question?.id ?? null);
    setStarted(true);
  };

  const startFreshTest = () => {
    const startedAt = new Date().toISOString();
    setShowSavedResult(false);
    setAnswers({});
    setActiveQuestionId(getPlacementSession({}).question?.id ?? null);
    onUpdateProfile({ placementAssessment: testState(startedAt, {}) });
    setStarted(true);
  };

  const startFromFirstStage = () => {
    const completedAt = new Date().toISOString();
    setShowSavedResult(true);
    onUpdateProfile({
      placementAssessment: {
        schemaVersion: 1,
        startedAt: completedAt,
        answers: {},
        result: {
          completedAt,
          correctCount: 0,
          answeredCount: 0,
          scorePercent: 0,
          suggestedStage: 1,
          skillCoverage: [],
          stages: [],
          method: 'first_stage',
        },
      },
    });
  };

  const chooseAnswer = (answer: string) => {
    if (!question || result) return;
    const nextAnswers = { ...answers, [question.id]: answer };
    setAnswers(nextAnswers);
    onUpdateProfile({
      placementAssessment: testState(placement?.startedAt ?? new Date().toISOString(), nextAnswers),
    });
  };

  const continueTest = () => {
    if (!question || !selected) return;
    const nextAnswers = { ...answers, [question.id]: selected };
    const nextSession = getPlacementSession(nextAnswers);
    setAnswers(nextAnswers);
    if (nextSession.result) {
      setShowSavedResult(true);
      setActiveQuestionId(null);
      onUpdateProfile({
        placementAssessment: {
          ...testState(placement?.startedAt ?? new Date().toISOString(), nextAnswers),
          result: nextSession.result,
        },
      });
      return;
    }
    setActiveQuestionId(nextSession.question?.id ?? null);
    onUpdateProfile({
      placementAssessment: testState(placement?.startedAt ?? new Date().toISOString(), nextAnswers),
    });
  };

  const retry = () => {
    setShowSavedResult(false);
    setAnswers({});
    setActiveQuestionId(null);
    setStarted(false);
    onUpdateProfile({ placementAssessment: undefined });
  };

  const backToChoice = () => {
    setShowSavedResult(false);
    setActiveQuestionId(null);
    setStarted(false);
  };

  const isFirstStageChoice = result?.method === 'first_stage';
  const SkillIcon = question?.skill === 'reading'
    ? BookOpen
    : question?.skill === 'grammar'
      ? PencilLine
      : Languages;

  return (
    <div className="placement-gate fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-3 sm:p-6" dir="rtl">
      <div className="placement-panel relative my-auto w-full max-w-xl overflow-hidden rounded-[28px] border bg-white shadow-2xl">
        <div className="placement-panel-top flex items-center justify-between gap-3 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="placement-logo"><BookOpen className="h-5 w-5" /></span>
            <div><div className="text-sm font-black">EnglishTok</div><div className="text-[10px] opacity-80">اختيار نقطة البداية</div></div>
          </div>
          <span className="placement-lock-label"><LockKeyhole className="h-3.5 w-3.5" /> قبل بدء الدروس</span>
        </div>

        {result ? (
          <div className="p-5 sm:p-8">
            <div className="placement-result-mark">{isFirstStageChoice ? <BookOpen className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}</div>
            <h1 className="mt-3 text-center text-2xl font-black text-slate-800">
              {isFirstStageChoice ? 'اخترت البدء من الأساسيات' : 'نقطة بدايتك المقترحة جاهزة'}
            </h1>
            {isFirstStageChoice ? (
              <>
                <p className="mt-2 text-center text-sm leading-7 text-slate-500">
                  ستبدأ من <strong className="text-emerald-700">المرحلة 1 · {PLACEMENT_STAGE_LABELS[1]}</strong>، خطوة بخطوة من الأساسيات. يمكنك تغيير ذلك في أي وقت من الإعدادات.
                </p>
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-xs leading-6 text-emerald-900">
                  هذا الخيار مناسب إذا كنت تفضّل بناء الأساس من الصفر بدلًا من اختبار تحديد المستوى. لن يحذف اختيارك أي XP أو دروس منجزة.
                </div>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={onContinue} className="placement-primary-button"><CheckCircle2 className="h-4 w-4" /> ابدأ التعلّم</button>
                  <button type="button" onClick={startFreshTest} className="placement-secondary-button"><Target className="h-4 w-4" /> حدد مستواي بالاختبار</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-center text-sm leading-7 text-slate-500">
                  الأقرب لمستواك الحالي: <strong className="text-emerald-700">المستوى {result.suggestedStage} · {PLACEMENT_STAGE_LABELS[result.suggestedStage] ?? 'تطوير متقدم'}</strong>
                </p>
                <div className="placement-result-stats mt-5 grid grid-cols-3 gap-2 text-center">
                  <div><strong>{result.correctCount}/{result.answeredCount}</strong><span>إجابة صحيحة</span></div>
                  <div><strong>{result.scorePercent}%</strong><span>نسبة الإجابات الصحيحة</span></div>
                  <div><strong>{result.skillCoverage.length}/3</strong><span>مهارات مقاسة</span></div>
                </div>
                {result.stages.length > 0 && (
                  <div className="placement-stage-results mt-3" aria-label="نتيجة كل مستوى تم قياسه">
                    {result.stages.map((stage) => (
                      <span key={stage.stage} className={stage.passed ? 'is-passed' : 'is-review'}>
                        مستوى {stage.stage}: {stage.correct}/{stage.total}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                  الاختبار تكيّف مع إجاباتك بين المفردات والقواعد والقراءة. النتيجة نقطة بداية تعليمية في EnglishTok، وليست شهادة CEFR أو بديلًا عن اختبار معياري.
                </p>
                <p className="mt-3 text-[11px] leading-5 text-slate-500">{PLACEMENT_PASS_RULE}</p>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={onContinue} className="placement-primary-button"><CheckCircle2 className="h-4 w-4" /> ابدأ التعلّم</button>
                  <button type="button" onClick={retry} className="placement-secondary-button">إعادة الاختبار</button>
                </div>
                <button type="button" onClick={startFromFirstStage} className="placement-text-button mt-3 w-full">
                  أفضّل البدء من المرحلة الأولى بدلًا من ذلك
                </button>
              </>
            )}
          </div>
        ) : !started ? (
          <div className="p-5 sm:p-8">
            <div className="placement-result-mark"><Target className="h-7 w-7" /></div>
            <h1 className="mt-3 text-center text-2xl font-black text-slate-800">كيف تحب أن تبدأ؟</h1>
            <p className="mt-2 text-center text-sm leading-7 text-slate-500">اختر البداية من الأساسيات، أو اختبر مستواك بأسئلة قصيرة تتكيف مع إجاباتك لتحديد نقطة بداية أقرب لمستواك الحقيقي.</p>
            <div className="placement-choice-grid mt-5">
              <button
                type="button"
                onClick={beginTest}
                disabled={questions.length < 8}
                className="placement-choice is-recommended"
              >
                <span className="placement-choice-icon"><Sparkles className="h-5 w-5" /></span>
                <span className="placement-choice-copy">
                  <span className="placement-choice-title"><strong>حدد مستواي بالاختبار</strong><span className="placement-choice-badge">موصى به</span></span>
                  <small>{session.answeredCount > 0
                    ? `لديك ${session.answeredCount} إجابة محفوظة. تابع الاختبار من حيث توقفت، أو اختر البدء من الأساسيات.`
                    : 'اختبار متكيف من المفردات والقواعد والقراءة. قد ينتهي بعد 8 أسئلة أو يستمر حسب أدائك.'}</small>
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0" />
              </button>
              <button type="button" onClick={startFromFirstStage} className="placement-choice">
                <span className="placement-choice-icon is-basics"><BookOpen className="h-5 w-5" /></span>
                <span className="placement-choice-copy">
                  <span className="placement-choice-title"><strong>ابدأ من المرحلة الأولى</strong></span>
                  <small>ابدأ من الأساسيات مباشرة، دون اختبار. مناسب لمن يفضّل التدرج من الصفر.</small>
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0" />
              </button>
            </div>
            <div className="placement-skill-row mt-4">
              {['المفردات', 'القواعد', 'قراءة الجمل'].map((skill) => (
                <span key={skill} className="placement-skill-chip"><CheckCircle2 className="h-4 w-4" />{skill}</span>
              ))}
            </div>
            <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">
              في الحالتين لن يُحذف XP أو سجل الدروس. يمكنك تغيير نقطة البداية لاحقًا من الإعدادات، وتُحفظ إجابات الاختبار على هذا الجهاز إذا أغلقته.
            </p>
            {questions.length < 8 && <p role="alert" className="mt-2 text-xs text-rose-700">تعذر تجهيز بنك الأسئلة. يمكنك البدء من المرحلة الأولى الآن وإعادة المحاولة لاحقًا.</p>}
          </div>
        ) : question ? (
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
              <span>سؤال {session.answeredCount + (selected ? 0 : 1)}</span>
              <span>اختبار متكيف · المستوى {question.stage}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${Math.min(100, (session.answeredCount / PLACEMENT_MAX_QUESTIONS) * 100)}%` }}
              />
            </div>
            <div className="mt-6 flex items-start gap-3">
              <span className="placement-question-icon"><SkillIcon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[10px] font-black text-emerald-700">{SKILL_LABELS[question.skill]} · {PLACEMENT_STAGE_LABELS[question.stage] ?? `المستوى ${question.stage}`}</div>
                <h1 className="text-lg font-black leading-8 text-slate-800">{question.promptAr}</h1>
                {question.promptEn && (
                  <div className="mt-2 flex items-center gap-2">
                    <p dir="ltr" className="min-w-0 flex-1 text-left font-en text-sm font-semibold leading-6 text-slate-600">{question.promptEn}</p>
                    {question.skill === 'reading' && (
                      <button
                        type="button"
                        onClick={() => speechService.speakText({ source: `placement:${question.id}`, text: question.promptEn!, accent: profile.settings.voiceLanguage, rate: 0.9 })}
                        className="placement-audio-button"
                        aria-label="استمع إلى الجملة"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 grid gap-2" role="group" aria-label="اختر الإجابة">
              {question.options.map((option) => {
                const arabic = isArabicText(option);
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => chooseAnswer(option)}
                    aria-pressed={selected === option}
                    className={`placement-option ${selected === option ? 'is-selected' : ''}`}
                  >
                    <span dir={arabic ? 'rtl' : 'ltr'} className={arabic ? 'min-w-0 text-right' : 'min-w-0 flex-1 text-left font-en'}>{option}</span>
                    {selected === option && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!selected} onClick={continueTest} className="placement-primary-button mt-5 w-full">
              {willFinish ? 'اعرض النتيجة' : 'تابع'} <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-[10px] text-slate-400">يمكنك تغيير الاختيار قبل المتابعة. تُحفظ الإجابة على هذا الجهاز فور اختيارها.</p>
            <button type="button" onClick={backToChoice} className="placement-text-button mt-2 w-full">العودة لاختيار نقطة البداية</button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-700">تعذر تحميل أسئلة الاختبار. يمكنك البدء من المرحلة الأولى أو المحاولة لاحقًا.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={startFromFirstStage} className="placement-primary-button">ابدأ من المرحلة الأولى</button>
              <button type="button" onClick={onContinue} className="placement-secondary-button">العودة</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
