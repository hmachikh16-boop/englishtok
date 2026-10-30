import React, { useEffect, useMemo, useState } from 'react';
import { Heart, HelpCircle, Lightbulb, Volume2 } from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import { speechService } from '../../services/speechService';
import { GameEmpty, GameFeedback, GameFrame, GameResult } from './GameBits';
import { buildRound } from './gameUtils';

interface HangmanGameProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBack: () => void;
}

const ROUND_SIZE = 8;
const MAX_WRONG = 6;
const XP_PER_WIN = 10;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒ'.split('');

export const HangmanGame: React.FC<HangmanGameProps> = ({
  lessons,
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const puzzles = useMemo(() => buildGamePuzzles(lessons), [lessons]);
  const [roundKey, setRoundKey] = useState(0);
  const round = useMemo(() => buildRound(puzzles, ROUND_SIZE), [puzzles, roundKey]);
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const current = round[index] ?? null;
  const word = current ? current.word.toUpperCase() : '';
  const letterSet = new Set(ALPHABET);
  const isWin = word.length > 0 && word.split('').every((character) => !letterSet.has(character) || guessed.has(character));

  useEffect(() => {
    setGuessed(new Set());
    setWrong(0);
    setFinished(false);
    setWon(false);
    setResultReady(false);
  }, [current?.id, roundKey]);

  if (!current && round.length === 0) return <GameEmpty onBack={onBack} />;

  if (round.length === 0) return <GameEmpty onBack={onBack} />;

  const playWord = (value: string) => {
    speechService.speakText({
      source: 'games-hangman',
      text: value.toLowerCase(),
      rate: 0.9,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  };

  const restart = () => {
    setRoundKey((value) => value + 1);
    setIndex(0);
    setScore(0);
    setXp(0);
    setStreak(0);
    setBestStreak(0);
    setGuessed(new Set());
    setWrong(0);
    setFinished(false);
    setWon(false);
    setResultReady(false);
  };

  if (resultReady) {
    return (
      <div className="gg-game-wrap">
        <GameResult
          score={score}
          total={round.length}
          xp={xp}
          bestStreak={bestStreak}
          onReplay={restart}
          onBack={onBack}
          title={score >= Math.ceil(round.length * 0.6) ? 'أداء رائع!' : 'واصل التدريب!'}
        />
      </div>
    );
  }

  const handleGuess = (letter: string) => {
    if (finished || guessed.has(letter)) return;
    const nextGuessed = new Set(guessed).add(letter);
    setGuessed(nextGuessed);

    if (!word.includes(letter)) {
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      speechService.playErrorBuzz();
      if (nextWrong >= MAX_WRONG) {
        setFinished(true);
        setWon(false);
        setStreak(0);
      }
      return;
    }

    speechService.playPop();
    const nextIsWin = word.split('').every((character) => !letterSet.has(character) || nextGuessed.has(character));
    if (nextIsWin) {
      const nextStreak = streak + 1;
      setFinished(true);
      setWon(true);
      setScore((value) => value + 1);
      setXp((value) => value + XP_PER_WIN);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      onUpdateProfile({ xp: userProfile.xp + XP_PER_WIN });
      speechService.playSuccessChime();
    }
  };

  const handleNext = () => {
    if (index + 1 >= round.length) {
      setResultReady(true);
      return;
    }
    setIndex((value) => value + 1);
  };

  const livesLost = Math.min(wrong, MAX_WRONG);

  return (
    <div className="gg-game-wrap">
      <GameFrame
        icon={HelpCircle}
        eyebrow="تهجئة واكتشاف"
        title="خمّن الكلمة"
        description="اكتشف الكلمة من تلميحها العربي، حرفًا حرفًا، قبل نفاد المحاولات. كل فوز يمنحك XP."
        onBack={onBack}
        current={index + 1}
        total={round.length}
        score={score}
        scoreLabel="فوز"
        accent="violet"
        footerNote={`كل كلمة صحيحة = ${XP_PER_WIN} XP. التلميح العربي ظاهر دائمًا، والأخطاء لا تخصم XP. الأحرف ذات التشكيل (É, Ç...) تُحسب كأحرف مستقلة.`}
      >
        <section className="gg-panel">
          <div className="gg-hangman-top">
            <span className="gg-hint-chip">
              <Lightbulb aria-hidden="true" />
              {current.translationAr}
            </span>
            <span className="gg-lives" aria-label={`${MAX_WRONG - wrong} محاولات متبقية`}>
              {Array.from({ length: MAX_WRONG }).map((_, lifeIndex) => (
                <Heart
                  key={lifeIndex}
                  aria-hidden="true"
                  className={lifeIndex < livesLost ? 'is-lost' : ''}
                  fill={lifeIndex < livesLost ? 'none' : 'currentColor'}
                />
              ))}
            </span>
          </div>

          <div className="gg-hangman-word" dir="ltr" aria-label="الكلمة المطلوب تخمينها">
            {word.split('').map((character, characterIndex) => {
              const isLetter = letterSet.has(character);
              const revealed = !isLetter || guessed.has(character) || finished;
              return (
                <span
                  key={`${character}-${characterIndex}`}
                  className={`gg-hangman-letter ${revealed ? 'is-revealed' : ''} ${!isLetter ? 'is-symbol' : ''}`}
                >
                  {revealed ? character : ''}
                </span>
              );
            })}
          </div>

          <p className="gg-hangman-status">
            محاولات خاطئة: {wrong} من {MAX_WRONG}
            {won && ' — فزت!'}
            {finished && !won && ' — خسرت!'}
          </p>

          <div className="gg-hangman-keyboard" dir="ltr" aria-label="لوحة الأحرف">
            {ALPHABET.map((letter) => {
              const guessedLetter = guessed.has(letter);
              const inWord = word.includes(letter);
              const stateClass = guessedLetter ? (inWord ? 'is-correct' : 'is-wrong') : '';
              return (
                <button
                  key={letter}
                  type="button"
                  className={`gg-hangman-key ${stateClass}`}
                  onClick={() => handleGuess(letter)}
                  disabled={guessedLetter || finished}
                  aria-label={`الحرف ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {finished && (
            <GameFeedback
              correct={won}
              wrongTitle="انتهت المحاولات"
              answer={current.word}
              translation={current.translationAr}
              example={current.exampleSentence}
              exampleAr={current.exampleSentenceAr}
              onListen={() => playWord(current.word)}
              onNext={handleNext}
              nextLabel={index + 1 >= round.length ? 'عرض النتيجة' : 'الكلمة التالية'}
            />
          )}
        </section>
      </GameFrame>
    </div>
  );
};
