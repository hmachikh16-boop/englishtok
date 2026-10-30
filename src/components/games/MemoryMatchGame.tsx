import React, { useMemo, useState } from 'react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';

interface Props { lessons: Lesson[]; userProfile: UserProfile; onUpdateProfile: (u: Partial<UserProfile>) => void; }

export const MemoryMatchGame: React.FC<Props> = ({ lessons }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).slice(0, 6), [lessons]);
  const cards = useMemo(() => {
    const list: { id: string; text: string; pair: string; side: 'en' | 'ar' }[] = [];
    puzzles.forEach((p) => {
      list.push({ id: p.id + '-en', text: p.word.toLowerCase(), pair: p.id, side: 'en' });
      list.push({ id: p.id + '-ar', text: p.translationAr, pair: p.id, side: 'ar' });
    });
    return list.sort(() => Math.random() - 0.5);
  }, [puzzles]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const handleClick = (card: { id: string; pair: string }) => {
    if (matched.has(card.pair) || flipped.includes(card.id) || flipped.length === 2) return;
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      const first = cards.find((c) => c.id === next[0])!;
      const second = cards.find((c) => c.id === next[1])!;
      if (first.pair === second.pair) {
        setMatched((prev) => new Set(prev).add(first.pair));
      }
      window.setTimeout(() => setFlipped([]), 900);
    }
  };

  if (puzzles.length < 3) return <p className="games-empty">ستظهر اللعبة بعد تحميل المنهج.</p>;

  return (
    <div className="memory-game">
      <p className="memory-progress">مطابقات: {matched.size}/{puzzles.length}</p>
      <div className="memory-grid">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.pair);
          return (
            <button key={card.id} type="button" className={`memory-card ${isFlipped ? 'is-flipped' : ''} ${matched.has(card.pair) ? 'is-matched' : ''}`} onClick={() => handleClick(card)}>
              {isFlipped ? card.text : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
};