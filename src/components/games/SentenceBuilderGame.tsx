import React, { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, RotateCcw, X } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFrame, GameResult } from './GameBits';
import { shuffle, targetLanguageLabel } from './gameUtils';

interface SentenceBuilderGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const INITIAL_SIZE = 8;
const XP_PER_CORRECT = 6;

const normalizeToken = (token: string) => token.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export const SentenceBuilderGame: React.FC<SentenceBuilderGameProps> = ({ lessons, userProfile, onUpdateProfile, onBack }) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons).filter((puzzle) => puzzle.exampleSentence.trim().split(/\s+/).length >= 3 && puzzle.exampleSentence.trim().split(/\s+/).length <= 7), [lessons]);
  const [queue, setQueue] = useState(() => shuffle(puzzles).slice(0, INITIAL_SIZE));
  const [position, setPosition] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [built, setBuilt] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const current = queue[position] ?? null;
  const language = targetLanguageLabel(userProfile.targetLanguage);
  const finished = queue.length > 0 && position >= queue.length;
  const originalTokens = useMemo(() => (current ? current.exampleSentence.trim().split(/\s+/) : []), [current]);

  useEffect(() => {
    if (!current) return;
    setTokens(shuffle([...originalTokens]));
    setBuilt([]);
    setLocked(false);
  }, [current?.id, position, originalTokens]);

  if (puzzles.length < 4) return <GameEmpty onBack={onBack} />;
  if (finished) {
    return (
      <div className="gg-game-wrap">
        <GameResult score={score} total={Math.max(1, answeredCount)} xp={xp} onReplay={() => { setQueue(shuffle(puzzles).slice(0, INITIAL_SIZE)); setPosition(0); setTokens([]); setBuilt([]); setLocked(false); setScore(0); setXp(0); setAnsweredCount(0); }} onBack={onBack} title={score >= answeredCount * 0.7 ? 'بناء ممتاز!' : 'واصل التدريب!'} />
      </div>
    );
  }
  if (!current) return <GameEmpty onBack={onBack} />;

  const playSentence = (sentence: string) => speechService.speakText({ source: 'games-sentence-builder', text: sentence, rate: 0.85, gender: 'female', accent: userProfile.targetLanguage ?? 'en' });

  const handleToken = (token: string, index: number) => {
    if (locked) return;
    setTokens((value) => value.filter((_, i) => i !== index));
    setBuilt((value) => [...value, token]);
    speechService.playPop();
  };

  const handleUndo = () => {
    if (locked || built.length === 0) return;
    const last = built[built.length - 1];
    setBuilt((value) => value.slice(0, -1));
    setTokens((value) => [...value, last]);
    speechService.playPop();
  };

  useEffect(() => {
    if (!current || locked || built.length !== originalTokens.length) return;
    setLocked(true);
    const guess = built.map(normalizeToken).join(' ');
    const answer = originalTokens.map(normalizeToken).join(' ');
    setAnsweredCount((value) => value + 1);
    if (guess === answer) {
      setScore((value) => value + 1); setXp((value) => value + XP_PER_CORRECT); onUpdateProfile({ xp: userProfile.xp + XP_PER_CORRECT }); speechService.playSuccessChime();
    } else {
      if (queue.length < INITIAL_SIZE + 4) setQueue((items) => [...items, current]);
      speechService.playErrorBuzz();
    }
    setTimeout(() => setPosition((value) => value + 1), 1200);
  }, [built, current, locked, originalTokens, queue.length]);

  return (
    <div className="gg-game-wrap">
      <GameFrame icon={MessageSquareText} eyebrow="بناء جملة" title="رتّب الجملة" description={`أعد ترتيب الكلمات لتكوين جملة ${language} صحيحة.`} onBack={onBack} current={Math.min(position + 1, INITIAL_SIZE)} total={INITIAL_SIZE} score={score} accent="gold" footerNote="بناء الجملة يدرّب نحو الترتيب (SVO) ويُثبت المفردات في سياق.">
        <section className="gg-panel">
          <div className="gg-question">
            <span className="gg-question-kicker">أعد ترتيب الكلمات</span>
            <p className="gg-sentence-ar">{current.exampleSentenceAr}</p>
            <p className="gg-translation">الترجمة: {current.translationAr}</p>
          </div>
          <div className="gg-scramble-slots" aria-label="الجملة المُركّبة">
            {Array.from({ length: originalTokens.length }).map((_, i) => (
              <span key={i} className={`gg-hangman-letter ${built[i] ? 'is-revealed' : ''}`} style={{ width: 'auto', minWidth: 44, padding: '0 6px' }}>{built[i] ?? ''}</span>
            ))}
          </div>
          <div className="gg-scramble-keyboard" aria-label="كلمات مخلوطة">
            {tokens.map((token, index) => (
              <button key={`${token}-${index}`} type="button" className="gg-hangman-key" onClick={() => handleToken(token, index)} disabled={locked} style={{ width: 'auto', minWidth: 44, padding: '0 8px' }}>{token}</button>
            ))}
          </div>
          <div className="gg-feedback-actions">
            <button type="button" className="gg-soft-btn" onClick={handleUndo} disabled={locked || built.length === 0}>تراجع</button>
            <button type="button" className="gg-soft-btn" onClick={() => playSentence(current.exampleSentence)}><MessageSquareText aria-hidden="true" /> استمع</button>
          </div>
          {locked && (
            <div className={`gg-feedback ${built.map(normalizeToken).join(' ') === originalTokens.map(normalizeToken).join(' ') ? 'is-correct' : 'is-wrong'}`} role="status">
              <span className="gg-feedback-mark">{built.map(normalizeToken).join(' ') === originalTokens.map(normalizeToken).join(' ') ? <Check /> : <X />}</span>
              <div className="gg-feedback-copy">
                <strong>{built.map(normalizeToken).join(' ') === originalTokens.map(normalizeToken).join(' ') ? 'أحسنت!' : 'ليست الترتيب الصحيح'}</strong>
                <p className="gg-feedback-answer" dir="ltr">{current.exampleSentence}</p>
                <p className="gg-feedback-translation">{current.exampleSentenceAr}</p>
              </div>
            </div>
          )}
        </section>
      </GameFrame>
    </div>
  );
};
