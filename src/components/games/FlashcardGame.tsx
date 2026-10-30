import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Layers, RotateCcw, Volume2, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, targetLanguageLabel } from './gameUtils';

interface FlashcardGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 10;
const XP_PER_KNOWN = 2;

export const FlashcardGame: React.FC<FlashcardGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [queue, setQueue] = useState(() => buildRound(puzzles, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [xp, setXp] = useState(0);
  const [answered, setAnswered] = useState(0);

  const current = queue[position] ?? null;
  const language = targetLanguageLabel(userProfile.targetLanguage);
  const finished = queue.length > 0 && position >= queue.length;

  useEffect(() => {
    setFlipped(false);
  }, [current?.id, position]);

  if (!current && !finished) return <GameEmpty onBack={onBack} />;

  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult
          score={known}
          total={Math.max(1, answered)}
          xp={xp}
          onReplay={() => {
            setQueue(buildRound(puzzles, INITIAL_SIZE));
            setPosition(0);
            setFlipped(false);
            setKnown(0);
            setReviewed(0);
            setXp(0);
            setAnswered(0);
          }}
          onBack={onBack}
          title={known >= answered * 0.7 ? 'ذاكرة قوية!' : 'واصل المراجعة!'}
          detail={`${known} من ${answered} بطاقة أُتقنت${reviewed > 0 ? `، و${reviewed} بطاقة تمت مراجعتها` : ''}.`}
        />
      </div>
    );
  }

  if (!current) return <GameEmpty onBack={onBack} />;

  const playWord = (word: string) => {
    speechService.speakText({ source: 'games-flashcards', text: word.toLowerCase(), rate: 0.9, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });
  };

  const advance = (wasKnown: boolean) => {
    setAnswered((value) => value + 1);
    if (wasKnown) {
      setKnown((value) => value + 1);
      setXp((value) => value + XP_PER_KNOWN);
      onUpdateProfile({ xp: userProfile.xp + XP_PER_KNOWN });
      speechService.playSuccessChime();
    } else {
      setReviewed((value) => value + 1);
      if (queue.length < INITIAL_SIZE + 6) {
        setQueue((items) => [...items, current]);
      }
      speechService.playErrorBuzz();
    }
    setPosition((value) => value + 1);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame
        icon={Layers}
        eyebrow="مراجعة ذكية"
        title="بطاقات ذكية"
        description={`اقلب البطاقة، اختبر ذاكرتك، وحدد ما أتقنته. البطاقات غير المتقنة تُعاد لاحقًا (حتى ${INITIAL_SIZE + 6} بطاقة).`}
        onBack={onBack}
        current={Math.min(position + 1, INITIAL_SIZE)}
        total={INITIAL_SIZE}
        score={known}
        accent="blue"
        footerNote="البطاقات هي أسرع طريقة لتثبيت المفردات. استمع للنطق بعد الكشف لتثبيت الذاكرة السمعية."
      >
        <section className="gg-panel">
          <div className="gg-flashcard-wrap" onClick={() => setFlipped((value) => !value)} role="button" tabIndex={0} aria-label="اقلب البطاقة">
            <div className={`gg-flashcard ${flipped ? 'is-flipped' : ''}`}>
              <div className="gg-flashcard-face gg-flashcard-front">
                <span className="gg-question-kicker">ما معنى هذه الكلمة؟</span>
                <h2 className="gg-word" dir="ltr">{current.word.toLowerCase()}</h2>
                {current.phonetic && <p className="gg-phonetic" dir="ltr">{current.phonetic}</p>}
                <span className="gg-flashcard-hint">اضغط للكشف</span>
              </div>
              <div className="gg-flashcard-face gg-flashcard-back">
                <strong className="gg-flashcard-translation">{current.translationAr}</strong>
                {current.exampleSentence && <p className="gg-feedback-example" dir="ltr">{current.exampleSentence}</p>}
                {current.exampleSentenceAr && <p className="gg-feedback-translation">{current.exampleSentenceAr}</p>}
              </div>
            </div>
          </div>

          <div className="gg-flashcard-actions">
            <button type="button" className="gg-soft-btn" onClick={() => playWord(current.word)}>
              <Volume2 aria-hidden="true" />
              استمع
            </button>
            <button type="button" className="gg-secondary" onClick={() => advance(false)}>
              <X aria-hidden="true" />
              أحتاج مراجعة
            </button>
            <button type="button" className="gg-primary" onClick={() => advance(true)}>
              <Check aria-hidden="true" />
              أتقنتها
            </button>
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
