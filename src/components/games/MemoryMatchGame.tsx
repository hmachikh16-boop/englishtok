import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Sparkles, Timer } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { buildRound, shuffle } from './gameUtils';

interface MemoryMatchGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const ROUND_SIZE = 6;
const XP_PER_MATCH = 3;

interface MemoryCard {
  id: string;
  text: string;
  pair: string;
  side: 'en' | 'ar';
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [roundKey, setRoundKey] = useState(0);
  const round = useMemo(() => buildRound(puzzles, ROUND_SIZE), [puzzles, roundKey]);
  const cards = useMemo<MemoryCard[]>(() => {
    const list: MemoryCard[] = [];
    round.forEach((puzzle) => {
      list.push({ id: `${puzzle.id}-en`, text: puzzle.word.toLowerCase(), pair: puzzle.id, side: 'en' });
      list.push({ id: `${puzzle.id}-ar`, text: puzzle.translationAr, pair: puzzle.id, side: 'ar' });
    });
    return shuffle(list);
  }, [round]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const flipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [finished, roundKey]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current);
    };
  }, []);

  if (puzzles.length < 3) return <GameEmpty onBack={onBack} />;

  const restart = () => {
    setRoundKey((value) => value + 1);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setXp(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
    setSeconds(0);
  };

  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult
          score={matched.size}
          total={round.length}
          xp={xp}
          bestStreak={bestStreak}
          onReplay={restart}
          onBack={onBack}
          title="ذاكرة رائعة!"
          detail={`أكملت ${round.length} مطابقات في ${moves} حركة و${seconds} ثانية.`}
        />
      </div>
    );
  }

  const handleClick = (card: MemoryCard) => {
    if (finished || matched.has(card.pair) || flipped.includes(card.id) || flipped.length === 2) return;
    const next = [...flipped, card.id];
    setFlipped(next);

    if (next.length !== 2) return;
    setMoves((value) => value + 1);

    const first = cards.find((item) => item.id === next[0]);
    const second = cards.find((item) => item.id === next[1]);
    if (!first || !second) return;

    if (first.pair === second.pair) {
      const nextMatched = new Set(matched).add(first.pair);
      const nextStreak = streak + 1;
      setMatched(nextMatched);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      setXp((value) => value + XP_PER_MATCH);
      onUpdateProfile({ xp: userProfile.xp + XP_PER_MATCH });
      speechService.playSuccessChime();

      const puzzle = round.find((item) => item.id === first.pair);
      if (puzzle) {
        speechService.speakText({
          source: 'games-memory',
          text: puzzle.word.toLowerCase(),
          rate: 0.9,
          gender: 'female',
          accent: userProfile.targetLanguage ?? 'en',
        });
      }

      if (nextMatched.size === round.length) {
        setFinished(true);
        speechService.playSuccessChime();
      }

      flipTimerRef.current = window.setTimeout(() => setFlipped([]), 700);
      return;
    }

    setStreak(0);
    speechService.playErrorBuzz();
    flipTimerRef.current = window.setTimeout(() => setFlipped([]), 850);
  };

  return (
    <div className="gg-game-wrap">
      <GameFrame
        icon={LayoutGrid}
        eyebrow="ذاكرة ومفردات"
        title="طابق الكلمة بمعناها"
        description="اقلب البطاقات وطابق كل كلمة إنجليزية أو فرنسية مع ترجمتها العربية. كل مطابقة تمنح XP وتثبت الذاكرة."
        onBack={onBack}
        current={matched.size}
        total={round.length}
        score={moves}
        scoreLabel="حركات"
        progressLabel={`المطابقات ${matched.size} من ${round.length}`}
        accent="violet"
        footerNote={`كل مطابقة = ${XP_PER_MATCH} XP. المطابقة الصحيحة تُقرأ aloud لتثبيت النطق. حاول إكمال اللوحة بأقل عدد من الحركات.`}
      >
        <section className="gg-panel">
          <div className="gg-memory-meta">
            <span>
              <Timer aria-hidden="true" />
              {seconds} ثانية
            </span>
            <span>
              <Sparkles aria-hidden="true" />
              سلسلة {streak}
            </span>
            <span>
              <LayoutGrid aria-hidden="true" />
              {matched.size}/{round.length}
            </span>
          </div>

          <div className="gg-memory-grid" role="grid" aria-label="لعبة مطابقة الذاكرة">
            {cards.map((card) => {
              const isFlipped = flipped.includes(card.id) || matched.has(card.pair);
              const isMatched = matched.has(card.pair);
              const label = isFlipped
                ? `${card.side === 'en' ? 'كلمة' : 'ترجمة'} ${card.text}`
                : 'بطاقة مقلوبة';
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`gg-memory-card ${isFlipped ? 'is-flipped' : ''} ${isMatched ? 'is-matched' : ''}`}
                  onClick={() => handleClick(card)}
                  disabled={isMatched || flipped.includes(card.id)}
                  aria-label={label}
                  aria-pressed={isFlipped}
                >
                  <span className="gg-memory-inner">
                    <span className="gg-memory-back" aria-hidden={isFlipped}>
                      <Sparkles aria-hidden="true" />
                    </span>
                    <span className="gg-memory-face">
                      <small className="gg-memory-side">{card.side === 'en' ? 'EN' : 'AR'}</small>
                      <strong
                        className="gg-memory-text"
                        dir={card.side === 'en' ? 'ltr' : 'rtl'}
                      >
                        {card.text}
                      </strong>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </GameFrame>
    </div>
  );
};
