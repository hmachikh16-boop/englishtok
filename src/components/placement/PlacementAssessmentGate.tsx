import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Headphones, LockKeyhole, Sparkles, Volume2 } from 'lucide-react';
import type { Lesson, PlacementAssessmentState, UserProfile } from '../../types';
import { PLACEMENT_PASS_RULE, PLACEMENT_STAGE_LABELS, buildPlacementQuestions, scorePlacementAssessment } from '../../services/placementService';
import { speechService } from '../../services/speechService';

interface PlacementAssessmentGateProps {
  lessons: Lesson[];
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onContinue: () => void;
}

export const PlacementAssessmentGate: React.FC<PlacementAssessmentGateProps> = ({ lessons, profile, onUpdateProfile, onContinue }) => {
  // The gate mounts before the lesson catalog finishes loading. Build once the
  // real catalog is available, then keep IDs/order stable for the whole attempt.
  const [questions, setQuestions] = useState(() => buildPlacementQuestions(lessons));
  useEffect(() => {
    if (questions.length === 0 && lessons.length > 0) {
      setQuestions(buildPlacementQuestions(lessons));
    }
  }, [lessons, questions.length]);
  const placement = profile.placementAssessment;
  const result = placement?.result;
  const [started, setStarted] = useState(Boolean(placement?.startedAt));
  const [questionIndex, setQuestionIndex] = useState(() => Math.max(0, questions.findIndex((question) => !placement?.answers[question.id])));
  const question = questions[questionIndex];
  const selected = question ? placement?.answers[question.id] : undefined;

  const begin = () => {
    const next: PlacementAssessmentState = placement ?? { schemaVersion: 1, startedAt: new Date().toISOString(), answers: {} };
    onUpdateProfile({ placementAssessment: next });
    setStarted(true);
    if (placement?.result) setQuestionIndex(0);
  };

  const chooseAnswer = (answer: string) => {
    if (!question || result) return;
    const next: PlacementAssessmentState = {
      schemaVersion: 1,
      startedAt: placement?.startedAt ?? new Date().toISOString(),
      answers: { ...(placement?.answers ?? {}), [question.id]: answer },
    };
    onUpdateProfile({ placementAssessment: next });
  };

  const continueTest = () => {
    if (!question || !selected) return;
    // Include the just-selected answer even if the parent profile update has
    // not rendered yet (notably important on the final question).
    const answers = { ...(placement?.answers ?? {}), [question.id]: selected };
    if (questionIndex === questions.length - 1) {
      const assessed = scorePlacementAssessment(questions, answers);
      onUpdateProfile({
        placementAssessment: {
          schemaVersion: 1,
          startedAt: placement?.startedAt ?? new Date().toISOString(),
          answers,
          result: assessed,
        },
      });
      return;
    }
    setQuestionIndex((index) => Math.min(index + 1, questions.length - 1));
  };

  const retry = () => {
    onUpdateProfile({ placementAssessment: undefined });
    setStarted(false);
    setQuestionIndex(0);
  };

  return (
    <div className="placement-gate fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-3 sm:p-6" dir="rtl">
      <div className="placement-panel relative my-auto w-full max-w-xl overflow-hidden rounded-[28px] border bg-white shadow-2xl">
        <div className="placement-panel-top flex items-center justify-between gap-3 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="placement-logo"><BookOpen className="h-5 w-5" /></span>
            <div><div className="text-sm font-black">EnglishTok</div><div className="text-[10px] opacity-80">اختبار تحديد نقطة البداية</div></div>
          </div>
          <span className="placement-lock-label"><LockKeyhole className="h-3.5 w-3.5" /> مطلوب قبل الدروس</span>
        </div>

        {result ? (
          <div className="p-5 sm:p-8">
            <div className="placement-result-mark"><Sparkles className="h-7 w-7" /></div>
            <h1 className="mt-3 text-center text-2xl font-black text-slate-800">نتيجتك الأولية جاهزة</h1>
            <p className="mt-2 text-center text-sm leading-7 text-slate-500">نقطة البداية المقترحة في EnglishTok: <strong className="text-emerald-700">المستوى {result.suggestedStage} · {PLACEMENT_STAGE_LABELS[result.suggestedStage] ?? 'تطوير متقدم'}</strong></p>
            <div className="placement-result-stats mt-5 grid grid-cols-3 gap-2 text-center">
              <div><strong>{result.correctCount}/{result.answeredCount}</strong><span>إجابة صحيحة</span></div>
              <div><strong>{result.scorePercent}%</strong><span>نتيجة موزونة</span></div>
              <div><strong>{result.skillCoverage.length}/3</strong><span>مهارات مقاسة</span></div>
            </div>
            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">هذا تقدير تعليمي أولي من أسئلة المفردات والقواعد وقراءة الجمل الموجودة في المنهج. لا يساوي سنة دراسية أو مستوى CEFR، ولا يتضمن اختبار استماع معياريًا.</p>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">{PLACEMENT_PASS_RULE}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={onContinue} className="placement-primary-button"><CheckCircle2 className="h-4 w-4" /> ابدأ التعلّم</button>
              <button type="button" onClick={retry} className="placement-secondary-button">إعادة الاختبار</button>
            </div>
          </div>
        ) : !started ? (
          <div className="p-5 sm:p-8">
            <div className="placement-result-mark"><Sparkles className="h-7 w-7" /></div>
            <h1 className="mt-3 text-center text-2xl font-black text-slate-800">لنحدد نقطة البداية المناسبة</h1>
            <p className="mt-2 text-center text-sm leading-7 text-slate-500">أجب عن {questions.length} سؤالًا تتدرج من الأساسيات إلى التعبير المتقدم. سنقترح لك مستوى EnglishTok مناسبًا، ويمكنك التقدم بعد ذلك بإنجاز الدروس.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {['المفردات', 'القواعد', 'قراءة الجمل'].map((skill) => <div key={skill} className="placement-skill-chip"><CheckCircle2 className="h-4 w-4" />{skill}</div>)}
            </div>
            <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">لن يحذف الاختبار XP أو الدروس المنجزة سابقًا. تُحفظ إجاباتك تلقائيًا على هذا الجهاز ويمكنك المتابعة بعد إغلاق التطبيق.</p>
            <button type="button" onClick={begin} disabled={questions.length < 12} className="placement-primary-button mt-5 w-full">ابدأ الاختبار <ArrowLeft className="h-4 w-4" /></button>
            {questions.length < 12 && <p role="alert" className="mt-2 text-xs text-rose-700">بيانات الدروس المتاحة لا تكفي لبناء اختبار موثوق.</p>}
          </div>
        ) : question ? (
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500"><span>سؤال {questionIndex + 1} من {questions.length}</span><span>المستوى {question.stage} · {question.skill === 'vocabulary' ? 'مفردات' : question.skill === 'grammar' ? 'قواعد' : 'قراءة'}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
            <div className="mt-6 flex items-start gap-3"><span className="placement-question-icon">{question.skill === 'reading' ? <BookOpen className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><h1 className="text-lg font-black leading-8 text-slate-800">{question.promptAr}</h1>{question.promptEn && <div className="mt-2 flex items-center gap-2"><p dir="ltr" className="min-w-0 flex-1 text-left font-en text-sm font-semibold leading-6 text-slate-600">{question.promptEn}</p><button type="button" onClick={() => speechService.speakText({ source: `placement:${question.id}`, text: question.promptEn!, accent: profile.settings.voiceLanguage, rate: 0.9 })} className="placement-audio-button" aria-label="استمع إلى الجملة"><Volume2 className="h-4 w-4" /></button></div>}</div></div>
            <div className="mt-5 grid gap-2">
              {question.options.map((option) => <button type="button" key={option} onClick={() => chooseAnswer(option)} aria-pressed={selected === option} className={`placement-option ${selected === option ? 'is-selected' : ''}`}><span>{option}</span>{selected === option && <CheckCircle2 className="h-5 w-5" />}</button>)}
            </div>
            <button type="button" disabled={!selected} onClick={continueTest} className="placement-primary-button mt-5 w-full">{questionIndex === questions.length - 1 ? 'اعرض النتيجة' : 'تابع'} <ArrowLeft className="h-4 w-4" /></button>
            <p className="mt-3 text-center text-[10px] text-slate-400">تُحفظ الإجابة على هذا الجهاز فور اختيارها.</p>
          </div>
        ) : (
          <div className="p-8 text-center"><p className="text-sm text-slate-700">تعذر تحميل أسئلة الاختبار من محتوى المنهج.</p><button type="button" onClick={onContinue} className="placement-primary-button mt-4">العودة</button></div>
        )}
      </div>
    </div>
  );
};
