import React, { useState } from 'react';
import { 
  Search, 
  Volume2, 
  Bookmark, 
  Check, 
  Sparkles, 
  RotateCw, 
  Layers, 
  Award 
} from 'lucide-react';
import { Lesson, VocabularyWord, UserProfile } from '../../types';
import { speechService } from '../../services/speechService';

interface VocabTabProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const VocabTab: React.FC<VocabTabProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
}) => {
  const [filterMode, setFilterMode] = useState<'saved' | 'all' | 'review'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Gather all unique vocabulary across all lessons
  const allVocab: VocabularyWord[] = [];
  const seenIds = new Set<string>();

  lessons.forEach((l) => {
    l.vocabulary.forEach((v) => {
      if (!seenIds.has(v.id)) {
        seenIds.add(v.id);
        allVocab.push(v);
      }
    });
  });

  const savedWordCount = allVocab.filter((v) => userProfile.savedWordIds.includes(v.id)).length;
  const reviewWordCount = allVocab.filter((v) => userProfile.reviewWordIds.includes(v.id)).length;

  const displayedVocab = allVocab.filter((v) => {
    const isSaved = userProfile.savedWordIds.includes(v.id);
    const isUnderReview = userProfile.reviewWordIds.includes(v.id);
    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'saved' && isSaved) ||
      (filterMode === 'review' && isUnderReview);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      v.word.toLowerCase().includes(query) ||
      v.translationAr.includes(query) ||
      v.exampleSentence.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const handlePronounce = (text: string) => {
    speechService.speakText({
      source: `vocabulary-bank:${text}`,
      text,
      rate: 0.85,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const handleToggleSave = (wordId: string) => {
    speechService.playPop();
    const isSaved = userProfile.savedWordIds.includes(wordId);
    if (isSaved) {
      onUpdateProfile({
        savedWordIds: userProfile.savedWordIds.filter((id) => id !== wordId),
      });
    } else {
      onUpdateProfile({
        savedWordIds: [...userProfile.savedWordIds, wordId],
        xp: userProfile.xp + 5,
      });
    }
  };

  const handleToggleMastered = (wordId: string) => {
    speechService.playSuccessChime();
    const isMastered = userProfile.masteredWordIds.includes(wordId);
    if (isMastered) {
      onUpdateProfile({
        masteredWordIds: userProfile.masteredWordIds.filter((id) => id !== wordId),
      });
    } else {
      onUpdateProfile({
        masteredWordIds: [...userProfile.masteredWordIds, wordId],
        reviewWordIds: userProfile.reviewWordIds.filter((id) => id !== wordId),
        xp: userProfile.xp + 10,
      });
    }
  };

  // Flashcard controls
  const currentCard = displayedVocab[flashcardIdx];

  const handleNextCard = () => {
    setIsFlipped(false);
    speechService.playPop();
    setFlashcardIdx((prev) => (prev + 1) % displayedVocab.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    speechService.playPop();
    setFlashcardIdx((prev) => (prev - 1 + displayedVocab.length) % displayedVocab.length);
  };

  return (
    <div className="journey-secondary w-full h-full max-w-4xl mx-auto overflow-y-auto no-scrollbar p-4 sm:p-6 text-slate-100 flex flex-col gap-4">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>بنك الكلمات والمفردات</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono-num font-bold">
              {displayedVocab.length} كلمة
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            احفظ الكلمات وراجعها بأسلوب البطاقات الذكية
          </p>
        </div>

        {/* Flashcards Toggle Button */}
        {displayedVocab.length > 0 && (
          <button
            onClick={() => {
              speechService.playPop();
              setIsFlashcardMode(!isFlashcardMode);
              setIsFlipped(false);
              setFlashcardIdx(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              isFlashcardMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isFlashcardMode ? 'قائمة الكلمات' : 'بطاقات المراجعة'}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs (Saved vs All) */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            setFilterMode('saved');
            speechService.playPop();
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            filterMode === 'saved'
              ? 'bg-slate-800 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          كلماتي المحفوظة ({savedWordCount})
        </button>
        <button
          onClick={() => {
            setFilterMode('all');
            speechService.playPop();
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            filterMode === 'all'
              ? 'bg-slate-800 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          قاموس المنهج الشامل ({allVocab.length})
        </button>
        <button
          onClick={() => {
            setFilterMode('review');
            speechService.playPop();
          }}
          className={`rounded-lg py-2 text-[10px] font-bold transition-all sm:text-xs ${
            filterMode === 'review'
              ? 'bg-slate-800 text-rose-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          للمراجعة ({reviewWordCount})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`ابحث عن كلمة ${userProfile.targetLanguage === 'fr' ? 'بالفرنسية' : 'بالإنجليزية'} أو العربية...`}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 shadow-lg"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Flashcard Practice Mode */}
      {isFlashcardMode && currentCard ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-xs text-slate-400 font-mono-num">
            البطاقة {flashcardIdx + 1} من {displayedVocab.length}
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => {
              speechService.playPop();
              setIsFlipped(!isFlipped);
            }}
            className="w-full min-h-[260px] bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-amber-400/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between cursor-pointer transition-all active:scale-[0.99] text-center"
          >
            <div className="w-full flex items-center justify-between text-xs text-slate-500">
              <span>{isFlipped ? 'الوجه الخلفي (المعنى والمثال)' : 'الوجه الأمامي (انقر للقلب)'}</span>
              <RotateCw className="w-4 h-4 text-slate-500" />
            </div>

            {!isFlipped ? (
              // Front: Word & Audio
              <div className="my-auto flex flex-col items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePronounce(currentCard.word);
                  }}
                  className="w-14 h-14 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/40 flex items-center justify-center hover:bg-sky-500/25 active:scale-90 transition-transform shadow-lg shadow-sky-500/10"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <h3 dir="ltr" className="text-2xl font-black text-white font-en tracking-wide">
                  {currentCard.word}
                </h3>
                {currentCard.phonetic && <span dir="ltr" className="text-xs font-mono-num text-sky-300 font-en">
                  {currentCard.phonetic}
                </span>}
                <span className="text-[11px] text-slate-400">
                  {currentCard.partOfSpeech}
                </span>
              </div>
            ) : (
              // Back: Meaning & Example
              <div className="my-auto flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400">الترجمة:</span>
                <h3 className="text-xl font-bold text-amber-300">
                  {currentCard.translationAr}
                </h3>
                <div className="mt-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex flex-col gap-1 w-full">
                  <div dir="ltr" className="text-slate-200 font-en text-left font-semibold">
                    "{currentCard.exampleSentence}"
                  </div>
                  <div className="text-slate-400 text-right">
                    {currentCard.exampleSentenceAr}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500">
              انقر على البطاقة لقلبها ↻
            </div>
          </div>

          {/* Flashcard Next/Prev Controls */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handlePrevCard}
              className="flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              السابق
            </button>
            <button
              onClick={() => handleToggleMastered(currentCard.id)}
              className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
                userProfile.masteredWordIds.includes(currentCard.id)
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{userProfile.masteredWordIds.includes(currentCard.id) ? 'متقنة ✓' : 'أتقنت الكلمة'}</span>
            </button>
            <button
              onClick={handleNextCard}
              className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-sky-500/20 active:scale-95 transition-transform"
            >
              التالي
            </button>
          </div>
        </div>
      ) : (
        /* Regular Word Cards List */
        <div className="flex flex-col gap-3">
          {displayedVocab.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center gap-2">
              <Bookmark className="w-8 h-8 text-slate-600" />
              <p className="text-xs text-slate-400 font-medium">
                {filterMode === 'saved'
                  ? 'لم تحفظ أي كلمات بعد. أضف كلمات جديدة إلى قائمتك أثناء مراجعة المفردات.'
                  : filterMode === 'review'
                    ? 'لا توجد كلمات مطلوبة للمراجعة حاليًا. أخطاؤك في الاختبارات ستظهر هنا.'
                    : 'لم يتم العثور على كلمات مطابقة للبحث.'}
              </p>
            </div>
          ) : (
            displayedVocab.map((vocab) => {
              const isSaved = userProfile.savedWordIds.includes(vocab.id);
              const isMastered = userProfile.masteredWordIds.includes(vocab.id);
              const isUnderReview = userProfile.reviewWordIds.includes(vocab.id);

              return (
                <div
                  key={vocab.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handlePronounce(vocab.word)}
                        className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center hover:bg-sky-500/20 active:scale-90 transition-transform"
                        title="استمع للنطق"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div>
                        <h4
                          dir="ltr"
                          className="text-base font-bold text-white font-en tracking-wide text-left"
                        >
                          {vocab.word}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          {vocab.phonetic && <><span className="font-mono-num text-sky-300 font-en">
                            {vocab.phonetic}
                          </span><span>·</span></>}
                          <span className="text-slate-500">{vocab.partOfSpeech}</span>
                        </div>
                        {isUnderReview && <span className="mt-1 inline-block rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">مراجعة من اختبار</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleMastered(vocab.id)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all active:scale-90 ${
                          isMastered
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={isMastered ? 'كلمة متقنة' : 'تحديد كمتقنة'}
                      >
                        <Award className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleSave(vocab.id)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all active:scale-90 ${
                          isSaved
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={isSaved ? 'إزالة من المحفوظات' : 'حفظ'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/70 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">الترجمة:</span>
                    <span className="font-bold text-amber-300">{vocab.translationAr}</span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/60 text-xs flex flex-col gap-1">
                    <div
                      dir="ltr"
                      className="flex items-center justify-between text-slate-300 font-en text-left"
                    >
                      <span>"{vocab.exampleSentence}"</span>
                      <button
                        onClick={() => handlePronounce(vocab.exampleSentence)}
                        className="text-slate-400 hover:text-sky-300 p-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-[11px] text-right">
                      {vocab.exampleSentenceAr}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
