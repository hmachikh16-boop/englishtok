import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Flame,
  Gamepad2,
  HelpCircle,
  ImageIcon,
  Keyboard,
  Layers,
  Lightbulb,
  Link2,
  MessageSquareText,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  Tags,
  Timer,
  TrendingUp,
  Trophy,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import type { Lesson, UserProfile } from '../../types';
import { buildGamePuzzles } from '../../services/gamePuzzles';
import {
  loadGameProgress,
  resetGameProgress,
} from '../../services/gameProgressService';
import { CategorySortGame } from './CategorySortGame';
import { DictationGame } from './DictationGame';
import { FillBlankGame } from './FillBlankGame';
import { FlashcardGame } from './FlashcardGame';
import { HangmanGame } from './HangmanGame';
import { ListenChooseGame } from './ListenChooseGame';
import { MemoryMatchGame } from './MemoryMatchGame';
import { OddOneOutGame } from './OddOneOutGame';
import { PhoneticMatchGame } from './PhoneticMatchGame';
import { PictureQuizGame } from './PictureQuizGame';
import { SentenceBuilderGame } from './SentenceBuilderGame';
import { SpeedQuizGame } from './SpeedQuizGame';
import { SpellingGame } from './SpellingGame';
import { VocabularyLadderGame } from './VocabularyLadderGame';
import { WordChainGame } from './WordChainGame';
import { WordChoiceGame } from './WordChoiceGame';
import { WordScrambleGame } from './WordScrambleGame';
import './games.css';

interface GamesTabProps {
  lessons: Lesson[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

type GameKey =
  | 'spelling'
  | 'choice'
  | 'memory'
  | 'listen'
  | 'fill'
  | 'speed'
  | 'hangman'
  | 'flashcards'
  | 'scramble'
  | 'picture'
  | 'category'
  | 'odd'
  | 'sentence'
  | 'dictation'
  | 'phonetic'
  | 'chain'
  | 'ladder';

interface GameCard {
  id: GameKey;
  icon: LucideIcon;
  tone: 'emerald' | 'gold' | 'blue' | 'rose' | 'violet' | 'teal' | 'amber';
  title: string;
  description: string;
  skill: string;
  duration: string;
  badge?: string;
  thumb?: string;
  difficulty?: 'سهل' | 'متوسط' | 'متقدم';
  xp?: number;
}

const GAME_CATALOG: GameCard[] = [
  {
    id: 'spelling',
    icon: Gamepad2,
    tone: 'emerald',
    title: 'تحدي التهجئة',
    description: 'رتّب الحروف من الصورة، مع تلميحات ونطق لكل كلمة.',
    skill: 'تهجئة',
    duration: '3–5 دقائق',
    badge: 'مميز',
  },
  {
    id: 'choice',
    icon: Star,
    tone: 'gold',
    title: 'اختيار المعنى',
    description: 'اقرأ الكلمة واختر معناها العربي من أربعة خيارات.',
    skill: 'مفردات',
    duration: '2–3 دقائق',
  },
  {
    id: 'listen',
    icon: Timer,
    tone: 'blue',
    title: 'استمع واختر',
    description: 'استمع إلى الكلمة ثم اختر شكلها المكتوب.',
    skill: 'استماع',
    duration: '2–3 دقائق',
  },
  {
    id: 'fill',
    icon: Sparkles,
    tone: 'rose',
    title: 'أكمل الجملة',
    description: 'اختر الكلمة التي تكمل الجملة وتثبّت الاستخدام.',
    skill: 'سياق',
    duration: '3–4 دقائق',
  },
  {
    id: 'speed',
    icon: Flame,
    tone: 'amber',
    title: 'تحدي السرعة',
    description: '10 ثوانٍ لكل سؤال، مع نقاط وسلسلة إجابات.',
    skill: 'طلاقة',
    duration: '2–3 دقائق',
  },
  {
    id: 'memory',
    icon: Trophy,
    tone: 'violet',
    title: 'مطابقة الذاكرة',
    description: 'طابق الكلمة بمعناها ودرّب ذاكرتك البصرية.',
    skill: 'ذاكرة',
    duration: '3–4 دقائق',
  },
  {
    id: 'hangman',
    icon: Lightbulb,
    tone: 'teal',
    title: 'خمّن الكلمة',
    description: 'اكتشف الكلمة حرفًا حرفًا قبل نفاد المحاولات.',
    skill: 'تهجئة',
    duration: '3–5 دقائق',
  },
  {
    id: 'flashcards',
    icon: Layers,
    tone: 'blue',
    title: 'بطاقات ذكية',
    description: 'راجع المفردات ببطاقات تتكيف: غير المتقنة تُعاد لاحقًا.',
    skill: 'مراجعة',
    duration: '3–4 دقائق',
    badge: 'ذكي',
  },
  {
    id: 'scramble',
    icon: Shuffle,
    tone: 'gold',
    title: 'خلط الحروف',
    description: 'أعد ترتيب الحروف مخلوطة لتكوين الكلمة.',
    skill: 'تهجئة',
    duration: '2–3 دقائق',
  },
  {
    id: 'picture',
    icon: ImageIcon,
    tone: 'rose',
    title: 'تخمين الصورة',
    description: 'اقرأ الكلمة واختر الصورة التي تمثلها.',
    skill: 'ربط بصري',
    duration: '2–3 دقائق',
  },
  {
    id: 'category',
    icon: Tags,
    tone: 'teal',
    title: 'صنّف المفردة',
    description: 'حدد الفئة (طعام، سفر، عمل…) للكلمة.',
    skill: 'تصنيف',
    duration: '2–3 دقائق',
  },
  {
    id: 'odd',
    icon: HelpCircle,
    tone: 'violet',
    title: 'الشاذ',
    description: 'جد الكلمة التي لا تنتمي إلى نفس الفئة.',
    skill: 'تفكير',
    duration: '2–4 دقائق',
  },
  {
    id: 'sentence',
    icon: MessageSquareText,
    tone: 'gold',
    title: 'رتّب الجملة',
    description: 'أعد ترتيب الكلمات لتكوين جملة صحيحة.',
    skill: 'نحو',
    duration: '3–4 دقائق',
  },
  {
    id: 'dictation',
    icon: Keyboard,
    tone: 'blue',
    title: 'استمع واكتب',
    description: 'استمع للكلمة واكتبها (إملاء).',
    skill: 'استماع+كتابة',
    duration: '3–4 دقائق',
  },
  {
    id: 'phonetic',
    icon: Volume2,
    tone: 'rose',
    title: 'طابق النطق',
    description: 'اختر التهجئة الصوتية (IPA) الصحيحة.',
    skill: 'نطق',
    duration: '2–3 دقائق',
  },
  {
    id: 'chain',
    icon: Link2,
    tone: 'amber',
    title: 'سلسلة كلمات',
    description: 'اختر كلمة تبدأ بآخر حرف من الكلمة الحالية.',
    skill: 'سرعة استرجاع',
    duration: '2–3 دقائق',
  },
  {
    id: 'ladder',
    icon: TrendingUp,
    tone: 'emerald',
    title: 'سلم المفردات',
    description: 'تسلّق 10 درجات؛ خطأ = فقدان حياة وإعادة الدرجة.',
    skill: 'تحدي',
    duration: '3–5 دقائق',
    badge: 'جديد',
  },
];

// Smart metadata for each game: an illustrated thumbnail (from the existing
// animal art set), a difficulty level and an XP reward estimate. Kept in a
// side table so the catalog entries stay compact and easy to author.
const GAME_EXTRAS: Record<string, { thumb: string; difficulty: 'سهل' | 'متوسط' | 'متقدم'; xp: number }> = {
  spelling: { thumb: 'bee.svg', difficulty: 'متوسط', xp: 12 },
  choice: { thumb: 'butterfly.svg', difficulty: 'سهل', xp: 8 },
  listen: { thumb: 'parrot.svg', difficulty: 'سهل', xp: 8 },
  fill: { thumb: 'cat.svg', difficulty: 'متوسط', xp: 10 },
  speed: { thumb: 'tiger.svg', difficulty: 'متقدم', xp: 15 },
  hangman: { thumb: 'fox.svg', difficulty: 'متوسط', xp: 10 },
  flashcards: { thumb: 'owl.svg', difficulty: 'سهل', xp: 6 },
  scramble: { thumb: 'monkey.svg', difficulty: 'متوسط', xp: 10 },
  picture: { thumb: 'panda.svg', difficulty: 'سهل', xp: 8 },
  category: { thumb: 'rabbit.svg', difficulty: 'متقدم', xp: 12 },
  odd: { thumb: 'sheep.svg', difficulty: 'متوسط', xp: 10 },
  sentence: { thumb: 'turtle.svg', difficulty: 'متقدم', xp: 14 },
  dictation: { thumb: 'whale.svg', difficulty: 'متقدم', xp: 14 },
  phonetic: { thumb: 'frog.svg', difficulty: 'متوسط', xp: 10 },
  chain: { thumb: 'snake.svg', difficulty: 'متقدم', xp: 14 },
  ladder: { thumb: 'giraffe.svg', difficulty: 'متقدم', xp: 16 },
  memory: { thumb: 'elephant.svg', difficulty: 'متوسط', xp: 10 },
};

// Pick the "game of the day" deterministically so it stays stable within a day.
const dailyGame = (): GameKey => {
  const catalog = GAME_CATALOG;
  const day = Math.floor(Date.now() / 86400000);
  return catalog[day % catalog.length].id;
};

export const GamesTab: React.FC<GamesTabProps> = ({ lessons, userProfile, onUpdateProfile }) => {
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);
  const [progressVersion, setProgressVersion] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const handleProfileUpdate = useCallback((updated: Partial<UserProfile>) => {
    const newXp = typeof updated.xp === 'number' ? updated.xp : userProfile.xp;
    const xpGain = Math.max(0, newXp - (userProfile.xp ?? 0));
    const coinsGain = Math.floor(xpGain / 10);
    const next: Partial<UserProfile> = { ...updated };
    if (coinsGain > 0) {
      next.points = (userProfile.points ?? 0) + coinsGain + (updated.points ?? 0);
    }
    onUpdateProfile(next);
  }, [userProfile, onUpdateProfile]);

  const progress = useMemo(() => loadGameProgress(), [activeGame, progressVersion]);
  const puzzleCount = useMemo(() => buildGamePuzzles(lessons).length, [lessons]);

  const handleResetProgress = () => {
    if (!window.confirm('سيتم حذف عدد كلمات التهجئة وسلسلة اللعب فقط، دون المساس بتقدم الدروس. هل تريد المتابعة؟')) {
      return;
    }
    resetGameProgress();
    setProgressVersion((value) => value + 1);
  };

  const startGame = (game: GameKey) => {
    setActiveGame(game);
    if (rootRef.current) rootRef.current.scrollTop = 0;
  };

  const backToLibrary = () => {
    setActiveGame(null);
    if (rootRef.current) rootRef.current.scrollTop = 0;
  };

  const renderGame = () => {
    switch (activeGame) {
      case 'spelling':
        return (
          <SpellingGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'choice':
        return (
          <WordChoiceGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'memory':
        return (
          <MemoryMatchGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'listen':
        return (
          <ListenChooseGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'fill':
        return (
          <FillBlankGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'speed':
        return (
          <SpeedQuizGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'hangman':
        return (
          <HangmanGame
            lessons={lessons}
            userProfile={userProfile}
            onUpdateProfile={handleProfileUpdate}
            onBack={backToLibrary}
          />
        );
      case 'flashcards':
        return <FlashcardGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'scramble':
        return <WordScrambleGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'picture':
        return <PictureQuizGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'category':
        return <CategorySortGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'odd':
        return <OddOneOutGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'sentence':
        return <SentenceBuilderGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'dictation':
        return <DictationGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'phonetic':
        return <PhoneticMatchGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'chain':
        return <WordChainGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      case 'ladder':
        return <VocabularyLadderGame lessons={lessons} userProfile={userProfile} onUpdateProfile={handleProfileUpdate} onBack={backToLibrary} />;
      default:
        return null;
    }
  };

  return (
    <div className="journey-home flex-1 min-h-0 overflow-y-auto" dir="rtl" ref={rootRef}>
      {activeGame ? (
        renderGame()
      ) : (
        <div className="gg-wrap">
          <section className="gg-hub-hero" aria-labelledby="games-hub-title">
            <div className="gg-hub-hero-main">
              <span className="gg-hub-kicker">
                <Gamepad2 aria-hidden="true" />
                ركن الألعاب
              </span>
              <h1 id="games-hub-title">تعلّم باللعب، وثبّت كل كلمة.</h1>
              <p>
                سبعة عشر لعبة، كل منها تدرّب مهارة مختلفة: التهجئة، المفردات،
                الاستماع، السياق، الذاكرة، والسرعة. كل إجابة صحيحة تمنح XP وتجعل
                الدرس أكثر ثباتًا.
              </p>
            </div>
            <span className="gg-hub-emblem" aria-hidden="true">
              <Gamepad2 />
            </span>
            <div className="gg-hub-stats">
              <div>
                <Trophy aria-hidden="true" />
                <strong>{userProfile.xp.toLocaleString('en-US')}</strong>
                <span>مجموع XP</span>
              </div>
              <div>
                <Flame aria-hidden="true" />
                <strong>{userProfile.streakDays.toLocaleString('en-US')}</strong>
                <span>أيام متتالية</span>
              </div>
              <div>
                <Gamepad2 aria-hidden="true" />
                <strong>{GAME_CATALOG.length}</strong>
                <span>ألعاب</span>
              </div>
            </div>
          </section>

          <section className="gg-quick" aria-labelledby="games-quick-title">
            <span className="gg-quick-icon" aria-hidden="true">
              <Timer />
            </span>
            <div className="gg-quick-copy">
              <strong id="games-quick-title">تحدي سريع</strong>
              <small>10 كلمات، 10 ثوانٍ لكل سؤال. مناسب قبل إنهاء جلسة التعلم.</small>
            </div>
            <button type="button" className="gg-quick-btn" onClick={() => startGame('speed')}>
              ابدأ الآن
              <ChevronLeft aria-hidden="true" />
            </button>
          </section>

          <section className="gg-recommended" aria-labelledby="games-recommended-title">
            <div className="gg-recommended-art" aria-hidden="true">
              <img src={`/animals/${GAME_EXTRAS[dailyGame()].thumb}`} alt="" />
            </div>
            <div className="gg-recommended-copy">
              <span className="gg-recommended-kicker">
                <Sparkles aria-hidden="true" /> لعبة اليوم
              </span>
              <strong id="games-recommended-title">
                {GAME_CATALOG.find((g) => g.id === dailyGame())?.title}
              </strong>
              <small>
                {GAME_CATALOG.find((g) => g.id === dailyGame())?.description}
              </small>
              <div className="gg-recommended-meta">
                <span>{GAME_CATALOG.find((g) => g.id === dailyGame())?.skill}</span>
                <span aria-hidden="true">•</span>
                <span>{GAME_EXTRAS[dailyGame()].difficulty}</span>
                <span aria-hidden="true">•</span>
                <span>+{GAME_EXTRAS[dailyGame()].xp} XP</span>
              </div>
            </div>
            <button
              type="button"
              className="gg-recommended-btn"
              onClick={() => startGame(dailyGame())}
            >
              ابدأ
              <ChevronLeft aria-hidden="true" />
            </button>
          </section>

          {(() => {
            const groups = new Map<string, typeof GAME_CATALOG>();
            for (const game of GAME_CATALOG) {
              if (!groups.has(game.skill)) groups.set(game.skill, []);
              groups.get(game.skill)!.push(game);
            }
            return [...groups.entries()].map(([skill, games]) => (
              <div key={skill} className="gg-skill-group">
                <div className="gg-section-head gg-skill-head">
                  <div>
                    <h2>{skill}</h2>
                    <p>{games.length} {games.length === 1 ? 'لعبة' : 'ألعاب'} · تدرّب هذه المهارة</p>
                  </div>
                  <span>{games.length}</span>
                </div>
                <div className="gg-grid">
                  {games.map((game) => {
                    const Icon = game.icon;
                    const extra = GAME_EXTRAS[game.id];
                    return (
                      <button
                        key={game.id}
                        type="button"
                        className="gg-game-card"
                        onClick={() => startGame(game.id)}
                        aria-label={`ابدأ ${game.title}`}
                      >
                        <span className={`gg-game-icon tone-${game.tone}`} aria-hidden="true">
                          {extra?.thumb ? (
                            <img src={`/animals/${extra.thumb}`} alt="" className="gg-game-thumb" />
                          ) : (
                            <Icon />
                          )}
                        </span>
                        <span className="gg-game-copy">
                          <span className="gg-game-title-row">
                            <strong>{game.title}</strong>
                            {game.badge && <em className="gg-game-badge">{game.badge}</em>}
                          </span>
                          <span className="gg-game-desc">{game.description}</span>
                          <span className="gg-game-meta">
                            <span>{game.skill}</span>
                            <span aria-hidden="true">•</span>
                            <span>{game.duration}</span>
                            {extra && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span className="gg-game-difficulty">{extra.difficulty}</span>
                                <span className="gg-game-xp">+{extra.xp} XP</span>
                              </>
                            )}
                          </span>
                        </span>
                        <span className="gg-game-arrow" aria-hidden="true">
                          <ChevronLeft />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          <section className="gg-hub-progress" aria-labelledby="games-progress-title">
            <div className="gg-hub-progress-head">
              <span id="games-progress-title">
                <Trophy aria-hidden="true" />
                تقدم التهجئة
              </span>
              <strong>{progress.totalSolved.toLocaleString('en-US')} كلمة</strong>
            </div>
            <div className="gg-progress-track">
              <span
                style={{
                  width: `${Math.min(100, Math.round((progress.totalSolved / Math.max(1, puzzleCount)) * 100))}%`,
                }}
              />
            </div>
            <div className="gg-hub-progress-meta">
              <span>أفضل سلسلة: {progress.bestStreak.toLocaleString('en-US')}</span>
              <span>{puzzleCount.toLocaleString('en-US')} كلمة في المنهج</span>
            </div>
          </section>

          <section className="gg-hub-footer">
            <p>
              <Lightbulb aria-hidden="true" />
              كل كلمة مأخوذة من دروس المنهج. لا توجد خسارة عند الخطأ؛ استخدم التلميحات
              أو استمع للنطق ثم حاول مجددًا.
            </p>
            <div className="gg-hub-footer-row">
              <span>
                <Sparkles aria-hidden="true" />
                الرسوم الكرتونية: Twemoji · CC BY 4.0
              </span>
              <button type="button" className="gg-reset-btn" onClick={handleResetProgress}>
                <RotateCcw aria-hidden="true" />
                إعادة ضبط إحصاءات التهجئة
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
