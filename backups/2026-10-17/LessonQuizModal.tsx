import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Lesson, QuizQuestion } from '../../types';
import { speechService } from '../../services/speechService';

interface LessonQuizModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onQuizComplete: (earnedXp: number, passed: boolean) => void;
}

export const LessonQuizModal: React.FC<LessonQuizModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onQuizComplete,
}) => {
  if (!isOpen) return null;

  const questions = lesson.quiz;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ: QuizQuestion | undefined = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
    speechService.playPop();
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQ || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption.trim() === currentQ.correctAnswer.trim();

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
      speechService.playSuccessChime();
    } else {
      speechService.playErrorBuzz();
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Finished
      const finalCorrect = correctAnswersCount + (selectedOption === currentQ?.correctAnswer ? 0 : 0);
      const passed = finalCorrect >= Math.ceil(questions.length / 2);
      const earnedXp = finalCorrect * 15 + (passed ? 10 : 0);
      setIsFinished(true);
      onQuizComplete(earnedXp, passed);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectAnswersCount(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">اختبار سريع: {lesson.titleAr}</h3>
              <p className="text-[11px] text-slate-400">
                السؤال {currentIdx + 1} من {questions.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Finished State Screen */}
        {isFinished ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mb-4 shadow-xl shadow-amber-500/30 animate-bounce">
              <Award className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {correctAnswersCount === questions.length
                ? 'أداء استثنائي! 🌟'
                : correctAnswersCount > 0
                ? 'عمل رائع! أحسنت 👏'
                : 'حاول مجدداً لتتقن الدرس! 💪'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              أجبت على {correctAnswersCount} من {questions.length} أسئلة بشكل صحيح
            </p>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 w-full mb-6 flex justify-around items-center">
              <div>
                <span className="block text-2xl font-black text-amber-400 font-mono-num">
                  +{correctAnswersCount * 15 + (correctAnswersCount > 0 ? 10 : 0)}
                </span>
                <span className="text-[11px] text-slate-400">نقاط XP مكتسبة</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="block text-2xl font-black text-emerald-400 font-mono-num">
                  {Math.round((correctAnswersCount / questions.length) * 100)}%
                </span>
                <span className="text-[11px] text-slate-400">نسبة الدقة</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                إعادة الاختبار
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-sky-500/20 active:scale-95 transition-transform"
              >
                متابعة المشاهدة
              </button>
            </div>
          </div>
        ) : (
          /* Active Question */
          currentQ && (
            <div className="pt-4 flex flex-col gap-4">
              {/* Question Text */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/70">
                <span className="text-[11px] text-sky-400 font-bold block mb-1">
                  اختر الإجابة الصحيحة:
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {currentQ.questionAr}
                </p>
                {currentQ.questionEn && (
                  <p
                    dir="ltr"
                    className="text-xs text-slate-400 font-en mt-1 text-left"
                  >
                    "{currentQ.questionEn}"
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = isAnswerSubmitted && opt.trim() === currentQ.correctAnswer.trim();
                  const isWrong = isAnswerSubmitted && isSelected && !isCorrect;

                  let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800';

                  if (isSelected && !isAnswerSubmitted) {
                    btnStyle = 'bg-sky-500/20 border-sky-400 text-sky-300';
                  } else if (isCorrect) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                  } else if (isWrong) {
                    btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-3.5 rounded-xl border text-right text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98] ${btnStyle}`}
                    >
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />}
                      {isWrong && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mr-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation note when submitted */}
              {isAnswerSubmitted && (
                <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-amber-400 block mb-0.5">💡 التوضيح:</span>
                  {currentQ.explanationAr}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${
                      selectedOption
                        ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 active:scale-95 shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    تأكيد الإجابة
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <span>{currentIdx + 1 < questions.length ? 'السؤال التالي' : 'عرض النتيجة'}</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
