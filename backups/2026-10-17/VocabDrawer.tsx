import React from 'react';
import { X, Volume2, Bookmark, Check, Sparkles } from 'lucide-react';
import { Lesson, VocabularyWord } from '../../types';
import { speechService } from '../../services/speechService';

interface VocabDrawerProps {
  lesson: Lesson;
  isOpen: boolean;
  savedWordIds: string[];
  onClose: () => void;
  onToggleSaveWord: (wordId: string) => void;
}

export const VocabDrawer: React.FC<VocabDrawerProps> = ({
  lesson,
  isOpen,
  savedWordIds,
  onClose,
  onToggleSaveWord,
}) => {
  if (!isOpen) return null;

  const handlePronounce = (text: string) => {
    speechService.speakText({
      text,
      rate: 0.85,
      gender: 'female',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Drag handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">كلمات ومصطلحات الدرس</h3>
              <p className="text-[11px] text-slate-400">
                {lesson.vocabulary.length} مفردات تم استخراجها من هذا الفيديو
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

        {/* Words List */}
        <div className="overflow-y-auto no-scrollbar py-3 flex flex-col gap-3">
          {lesson.vocabulary.map((vocab: VocabularyWord) => {
            const isSaved = savedWordIds.includes(vocab.id);

            return (
              <div
                key={vocab.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2 hover:border-slate-700 transition-colors"
              >
                {/* Word header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePronounce(vocab.word)}
                      className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center active:scale-90 transition-transform hover:bg-sky-500/20"
                      title="استمع للنطق"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div>
                      <h4
                        dir="ltr"
                        className="text-white font-en font-bold text-base tracking-wide"
                      >
                        {vocab.word}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono-num text-sky-300 font-en">
                          {vocab.phonetic}
                        </span>
                        <span>·</span>
                        <span className="text-slate-500">{vocab.partOfSpeech}</span>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => onToggleSaveWord(vocab.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all active:scale-95 ${
                      isSaved
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>محفوظة</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>حفظ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Arabic Translation */}
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">المعنى العربي:</span>
                  <span className="text-xs font-bold text-amber-300">{vocab.translationAr}</span>
                </div>

                {/* Example sentence */}
                <div className="text-xs pt-1 border-t border-slate-800/50 flex flex-col gap-1">
                  <div
                    dir="ltr"
                    className="flex items-center justify-between text-slate-300 font-en"
                  >
                    <span>"{vocab.exampleSentence}"</span>
                    <button
                      onClick={() => handlePronounce(vocab.exampleSentence)}
                      className="text-slate-400 hover:text-sky-300 p-1"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p dir="rtl" className="text-slate-400 text-[11px]">
                    {vocab.exampleSentenceAr}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="pt-2 text-center text-[11px] text-slate-500 shrink-0">
          💡 يمكنك مراجعة جميع كلماتك المحفوظة عبر تبويب "بنك الكلمات" في الأسفل
        </div>
      </div>
    </div>
  );
};
