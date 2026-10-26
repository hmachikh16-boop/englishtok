import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Lock,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  MOTIVATIONAL_CARDS,
  MOTIVATIONAL_CARD_STAGES,
  getMotivationalCardById,
  getMotivationalCardsForStage,
  getMotivationalCardsUnlockedCount,
  getNextMotivationalCard,
  getStageCardProgress,
  getStageName,
  isMotivationalCardUnlocked,
  type MotivationalCard,
  type MotivationalCardRarity,
} from '../../data/motivationalCards';
import type { AnimalProfile } from '../../data/animals';
import { speechService } from '../../services/speechService';

type CardVariables = React.CSSProperties & {
  '--card-start': string;
  '--card-mid': string;
  '--card-deep': string;
  '--card-glow': string;
  '--card-accent': string;
};

const cardStyle = (entry: MotivationalCard): CardVariables => ({
  '--card-start': entry.palette.start,
  '--card-mid': entry.palette.mid,
  '--card-deep': entry.palette.deep,
  '--card-glow': entry.palette.glow,
  '--card-accent': entry.palette.accent,
});

const RARITY_LABEL: Record<MotivationalCardRarity, string> = {
  hero: 'HERO',
  epic: 'EPIC',
  legend: 'LEGEND',
};

const RARITY_STARS: Record<MotivationalCardRarity, string> = {
  hero: '✦',
  epic: '✦✦',
  legend: '✦✦✦',
};

const GALLERY_PAGE_SIZE = 9;

const pad = (value: number): string => String(value).padStart(2, '0');

const lessonCountAr = (count: number): string => {
  if (count === 1) return 'درسًا واحدًا';
  if (count === 2) return 'درسين';
  if (count >= 3 && count <= 10) return `${count} دروس`;
  return `${count} درسًا`;
};

interface AnimalArtProps {
  animal: AnimalProfile;
  className?: string;
}

/**
 * A different animal portrait for every card. The SVGs are bundled locally so
 * the same 100 species render in the web app and inside the offline APK.
 */
const GoalAnimalArt: React.FC<AnimalArtProps> = ({ animal, className = '' }) => (
  <span className={`goal-animal-art ${className}`} aria-hidden="true">
    <span className="goal-animal-halo" />
    <img
      className="goal-animal-image"
      src={`${import.meta.env.BASE_URL}animals/${animal.asset}`}
      alt=""
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  </span>
);

interface GoalCardFrontProps {
  entry: MotivationalCard;
  completed: number;
  unlocked: boolean;
}

const GoalCardFront: React.FC<GoalCardFrontProps> = ({ entry, completed, unlocked }) => {
  const progress = entry.requiredLessons
    ? Math.min(100, (completed / entry.requiredLessons) * 100)
    : 0;

  return (
    <div className={`goal-card-face goal-card-front rarity-${entry.rarity} edition-${entry.edition}`}>
      <span className="goal-card-holo" aria-hidden="true" />
      <span className="goal-card-shine" aria-hidden="true" />
      <header className="goal-card-head">
        <span className="goal-card-brand">Lin Go <b>Legends</b></span>
        <span className="goal-card-stage">STAGE {pad(entry.stage)}</span>
      </header>
      <div className={`goal-card-art ${unlocked ? '' : 'is-secret'}`}>
        <span className="goal-card-rays" aria-hidden="true" />
        <span className="goal-card-dots" aria-hidden="true" />
        <GoalAnimalArt animal={entry.animal} className="goal-card-animal" />
        {entry.edition === 'gold' && <span className="goal-card-edition-badge">GOLD</span>}
        <span className="goal-card-serial">{entry.serial}</span>
        <span className={`goal-card-state ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
          {unlocked ? (
            <>
              <Sparkles aria-hidden="true" /> مفتوحة
            </>
          ) : (
            <>
              <Lock aria-hidden="true" /> {completed}/{entry.requiredLessons}
            </>
          )}
        </span>
      </div>
      <footer className="goal-card-copy">
        {unlocked ? (
          <>
            <p className="goal-card-animal-name">
              <strong>{entry.animal.nameAr}</strong>
              <span className="goal-card-animal-en" dir="ltr">{entry.animal.nameEn}</span>
            </p>
            <p className="goal-card-title-ar">{entry.titleAr}</p>
            <p className="goal-card-title-en" dir="ltr">{entry.titleEn}</p>
            <div className="goal-card-meta">
              <span className={`goal-card-rarity rarity-${entry.rarity}`}>
                <span aria-hidden="true">{RARITY_STARS[entry.rarity]}</span>
                {RARITY_LABEL[entry.rarity]}
              </span>
              <span className="goal-card-xp">+{entry.xp} XP</span>
            </div>
          </>
        ) : (
          <div className="goal-card-locked-copy">
            <p className="goal-card-animal-name"><strong>بطاقة مقفلة</strong></p>
            <p className="goal-card-title-ar">تُفتح بعد {lessonCountAr(Math.max(0, entry.requiredLessons - completed))}</p>
            <p className="goal-card-title-en" dir="ltr">LOCKED CARD</p>
            <span className="goal-card-progress" aria-hidden="true">
              <i style={{ width: `${progress}%` }} />
            </span>
          </div>
        )}
      </footer>
    </div>
  );
};

interface GoalCardBackProps {
  entry: MotivationalCard;
  unlocked: boolean;
}

const GoalCardBack: React.FC<GoalCardBackProps> = ({ entry, unlocked }) => {
  const stage = getStageName(entry.stage);

  return (
    <div className={`goal-card-face goal-card-back rarity-${entry.rarity} edition-${entry.edition}`}>
      <span className="goal-card-back-grid" aria-hidden="true" />
      <header className="goal-card-back-head">
        <span>{entry.edition === 'gold' ? 'رسالة ذهبية · ' : 'رسالة '}{entry.animal.nameAr}</span>
        <span className="font-en" dir="ltr">{entry.serial}</span>
      </header>
      <div className="goal-card-back-quote">
        <span className="goal-card-quote-mark" aria-hidden="true">“</span>
        <p className="goal-card-quote-en" dir="ltr">{entry.quoteEn}</p>
        <p className="goal-card-quote-ar">{entry.quoteAr}</p>
      </div>
      <div className="goal-card-challenge">
        <span className="goal-card-challenge-label">
          <Trophy aria-hidden="true" /> تحدي البطاقة
        </span>
        <p className="goal-card-challenge-ar">{entry.challengeAr}</p>
        <p className="goal-card-challenge-en" dir="ltr">{entry.challengeEn}</p>
      </div>
      <footer className="goal-card-back-foot">
        <span>{stage.nameAr} · {entry.animal.nameEn} · STAGE {pad(entry.stage)}</span>
        <span>{unlocked ? 'في مجموعتك' : 'هدف قادم'}</span>
      </footer>
    </div>
  );
};

interface GoalFlipCardProps {
  entry: MotivationalCard;
  completed: number;
  unlocked: boolean;
  flipped: boolean;
  onFlip: () => void;
  className?: string;
}

const GoalFlipCard: React.FC<GoalFlipCardProps> = ({
  entry,
  completed,
  unlocked,
  flipped,
  onFlip,
  className = '',
}) => (
  <button
    type="button"
    disabled={!unlocked}
    className={`goal-flip-card rarity-${entry.rarity} edition-${entry.edition} ${unlocked ? 'is-unlocked' : 'is-locked'} ${unlocked && flipped ? 'is-flipped' : ''} ${className}`}
    style={cardStyle(entry)}
    onClick={() => {
      if (!unlocked) return;
      speechService.playPop();
      onFlip();
    }}
    aria-label={unlocked
      ? `${entry.animal.nameAr}، ${entry.titleAr}. بطاقة مفتوحة. اضغط لقلب البطاقة.`
      : `بطاقة مقفلة. أكملت ${completed} من ${lessonCountAr(entry.requiredLessons)}. تُفتح بعد إكمال الدروس المطلوبة.`}
    aria-pressed={unlocked ? flipped : undefined}
  >
    <span className="goal-card-inner">
      <GoalCardFront entry={entry} completed={completed} unlocked={unlocked} />
      {unlocked && <GoalCardBack entry={entry} unlocked={unlocked} />}
    </span>
  </button>
);

interface GoalCardTileProps {
  entry: MotivationalCard;
  completedLessons: number;
  onClick: () => void;
  className?: string;
}

/** Compact animal poster reused by the stage checkpoints and the 200-card album. */
const GoalCardTile: React.FC<GoalCardTileProps> = ({
  entry,
  completedLessons,
  onClick,
  className = '',
}) => {
  const unlocked = completedLessons >= entry.requiredLessons;
  const completed = Math.min(completedLessons, entry.requiredLessons);
  const progress = entry.requiredLessons
    ? Math.min(100, (completed / entry.requiredLessons) * 100)
    : 0;

  return (
    <button
      type="button"
      disabled={!unlocked}
      className={`stage-goal-card edition-${entry.edition} ${unlocked ? 'is-unlocked' : 'is-locked'} ${className}`}
      style={cardStyle(entry)}
      onClick={() => {
        if (!unlocked) return;
        speechService.playPop();
        onClick();
      }}
      aria-label={unlocked
        ? `${entry.animal.nameAr}، ${entry.titleAr}، مفتوحة`
        : `بطاقة مقفلة. أكملت ${completed} من ${lessonCountAr(entry.requiredLessons)}`}
    >
      <span className={`stage-goal-art ${unlocked ? '' : 'is-secret'}`}>
        <GoalAnimalArt animal={entry.animal} className="stage-goal-animal" />
        <span className="stage-goal-card-number">{entry.serial}</span>
        {entry.edition === 'gold' && <span className="stage-goal-edition-badge">GOLD</span>}
        {unlocked ? (
          <span className="stage-goal-open-mark"><Sparkles aria-hidden="true" /></span>
        ) : (
          <span className="stage-goal-lock"><Lock aria-hidden="true" /></span>
        )}
      </span>
      <span className="stage-goal-copy">
        <strong>{unlocked ? entry.animal.nameAr : 'بطاقة مقفلة'}</strong>
        <small>{unlocked ? entry.titleAr : `مقفلة · ${completed}/${entry.requiredLessons}`}</small>
      </span>
      <span className="stage-goal-progress" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </span>
    </button>
  );
};

interface SpotlightProps {
  progressByStage: Record<number, number>;
  onBrowse: () => void;
}

export const MotivationalGoalSpotlight = React.memo(function MotivationalGoalSpotlight({
  progressByStage,
  onBrowse,
}: SpotlightProps) {
  const nextCard = getNextMotivationalCard(progressByStage);
  const nextCardUnlocked = isMotivationalCardUnlocked(nextCard, progressByStage);
  const nextCardCompleted = getStageCardProgress(nextCard, progressByStage);
  const nextCardRemaining = Math.max(0, nextCard.requiredLessons - (progressByStage[nextCard.stage] ?? 0));
  const unlockedCount = getMotivationalCardsUnlockedCount(progressByStage);
  const collectionProgress = MOTIVATIONAL_CARDS.length
    ? (unlockedCount / MOTIVATIONAL_CARDS.length) * 100
    : 0;
  const allCollected = unlockedCount === MOTIVATIONAL_CARDS.length;
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [nextCard.id]);

  return (
    <section className="goal-quest-panel" dir="rtl" aria-labelledby="goal-quest-title">
      <span className="goal-quest-orb goal-quest-orb-one" aria-hidden="true" />
      <span className="goal-quest-orb goal-quest-orb-two" aria-hidden="true" />
      <div className="goal-quest-copy">
        <p className="goal-quest-eyebrow">
          <span className="goal-quest-eyebrow-icon"><Trophy aria-hidden="true" /></span>
          أهدافك البطولية
        </p>
        <h3 id="goal-quest-title">200 بطاقة في أربع مراحل</h3>
        <p className="goal-quest-description">
          كل مرحلة تضم 25 بطاقة أساسية و25 نسخة ذهبية. كل درسين يفتحان بطاقة،
          والبطاقات المقفلة لا تُقلب ولا تُقرأ قبل فتحها.
        </p>

        <div className="goal-quest-summary">
          <div className="goal-quest-count">
            <span className="goal-quest-count-number font-mono-num" dir="ltr">
              {unlockedCount}<small>/{MOTIVATIONAL_CARDS.length}</small>
            </span>
            <span className="goal-quest-count-label">بطاقة في مجموعتك</span>
          </div>
          <div className="goal-quest-meter" aria-hidden="true">
            <span style={{ width: `${collectionProgress}%` }} />
          </div>
        </div>

        <div className="goal-quest-next">
          <span className="goal-quest-next-kicker">
            {allCollected ? 'اكتملت المملكة' : nextCardUnlocked ? 'آخر بطاقة في المجموعة' : 'بطاقتك القادمة'}
          </span>
          <div className="goal-quest-next-line">
            <strong>{nextCardUnlocked ? nextCard.animal.nameAr : 'بطاقة سرية'}</strong>
            <span className="font-en" dir="ltr">
              {nextCardUnlocked ? `${nextCard.animal.nameEn} · ${nextCard.titleEn}` : 'LOCKED · COMPLETE LESSONS TO REVEAL'}
            </span>
          </div>
          <p>
            {allCollected
              ? 'أنت الآن أسطورة الطلاقة — كل بطاقات المملكة في مجموعتك.'
              : nextCardUnlocked
                ? 'جاهزة الآن — اقلب البطاقة واقرأ رسالتها.'
                : `أكمل ${lessonCountAr(nextCardRemaining)} في المرحلة ${nextCard.stage} لفتحها.`}
          </p>
          <div className="goal-quest-next-progress" aria-hidden="true">
            <span
              style={{
                width: `${nextCard.requiredLessons ? Math.min(100, (nextCardCompleted / nextCard.requiredLessons) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="goal-quest-actions">
          <button
            type="button"
            onClick={() => {
              speechService.playPop();
              onBrowse();
            }}
            className="goal-quest-browse"
          >
            <LayoutGrid aria-hidden="true" />
            <span>تصفّح {MOTIVATIONAL_CARDS.length} بطاقة</span>
            <ChevronLeft aria-hidden="true" />
          </button>
          <span className="goal-quest-whisper">
            {nextCardUnlocked ? 'اضغط البطاقة لقلبها' : 'تُفتح البطاقة بعد إكمال الدروس'}
          </span>
        </div>
      </div>

      <div className="goal-quest-card-wrap">
        <span className="goal-quest-card-ring" aria-hidden="true" />
        <GoalFlipCard
          entry={nextCard}
          completed={nextCardCompleted}
          unlocked={nextCardUnlocked}
          flipped={flipped}
          onFlip={() => setFlipped((value) => !value)}
          className="goal-flip-card--spotlight"
        />
        <span className="goal-quest-card-caption">
          <RotateCcw aria-hidden="true" /> بطاقة المجموعة
        </span>
      </div>
    </section>
  );
});

interface StageCardsProps {
  stage: number;
  completedLessons: number;
  onOpenCard: (cardId: string) => void;
  onOpenGallery: (stage: number) => void;
}

export const StageMotivationalCards = React.memo(function StageMotivationalCards({
  stage,
  completedLessons,
  onOpenCard,
  onOpenGallery,
}: StageCardsProps) {
  const cards = getMotivationalCardsForStage(stage);
  if (cards.length === 0) return null;
  const unlockedCount = cards.filter(
    (entry) => completedLessons >= entry.requiredLessons,
  ).length;
  const unlockedCards = cards.filter((entry) => completedLessons >= entry.requiredLessons);
  const lockedCards = cards.filter((entry) => completedLessons < entry.requiredLessons);
  const previewCards = lockedCards.length > 0
    ? [...unlockedCards.slice(-1), ...lockedCards].slice(0, 3)
    : cards.slice(-3);
  const nextLocked = lockedCards[0];
  const nextLockedRemaining = nextLocked
    ? Math.max(1, nextLocked.requiredLessons - completedLessons)
    : 0;
  const stageInfo = getStageName(stage);

  return (
    <section className="stage-goal-panel" dir="rtl" aria-label={`بطاقات ${stageInfo.nameAr}`}>
      <header className="stage-goal-head">
        <span className="stage-goal-title">
          <Trophy aria-hidden="true" />
          بطاقات المرحلة
        </span>
        <span className="stage-goal-head-actions">
          <span className="stage-goal-count">{unlockedCount}/{cards.length} مفتوحة</span>
          <button
            type="button"
            className="stage-goal-browse"
            onClick={() => {
              speechService.playPop();
              onOpenGallery(stage);
            }}
            aria-label={`عرض جميع بطاقات المرحلة ${stage}`}
          >
            <LayoutGrid aria-hidden="true" />
            عرض الكل
          </button>
        </span>
      </header>
      <div className="stage-goal-grid">
        {previewCards.map((entry) => (
          <GoalCardTile
            key={entry.id}
            entry={entry}
            completedLessons={completedLessons}
            onClick={() => onOpenCard(entry.id)}
          />
        ))}
      </div>
      <p className="stage-goal-footnote">
        {nextLocked
          ? nextLockedRemaining === 1
            ? 'البطاقة القادمة بعد درس واحد'
            : `البطاقة القادمة بعد ${lessonCountAr(nextLockedRemaining)}`
          : 'اكتملت بطاقات هذه المرحلة — افتح المجموعة لمراجعتها.'}
      </p>
    </section>
  );
});

type GalleryFilter = 'all' | number;
type GalleryView = 'gallery' | 'detail';

interface ModalProps {
  initialCardId?: string | null;
  initialStage?: number | null;
  progressByStage: Record<number, number>;
  onClose: () => void;
}

export const MotivationalCardModal: React.FC<ModalProps> = ({
  initialCardId = null,
  initialStage = null,
  progressByStage,
  onClose,
}) => {
  const initialCard = initialCardId ? getMotivationalCardById(initialCardId) : undefined;
  const initialFilter: GalleryFilter = initialStage ?? initialCard?.stage ?? 'all';
  const [view, setView] = useState<GalleryView>(initialCardId ? 'detail' : 'gallery');
  const [filter, setFilter] = useState<GalleryFilter>(initialFilter);
  const [page, setPage] = useState(0);
  const [activeCardId, setActiveCardId] = useState(initialCard?.id ?? MOTIVATIONAL_CARDS[0]?.id ?? '');
  const [flipped, setFlipped] = useState(false);
  const modalRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  const filteredCards = filter === 'all'
    ? MOTIVATIONAL_CARDS
    : getMotivationalCardsForStage(filter);
  const safePage = Math.min(page, Math.max(0, Math.ceil(filteredCards.length / GALLERY_PAGE_SIZE) - 1));
  const visibleCards = filteredCards.slice(
    safePage * GALLERY_PAGE_SIZE,
    safePage * GALLERY_PAGE_SIZE + GALLERY_PAGE_SIZE,
  );
  const pageCount = Math.max(1, Math.ceil(filteredCards.length / GALLERY_PAGE_SIZE));
  const activeCard = getMotivationalCardById(activeCardId) ?? filteredCards[0] ?? MOTIVATIONAL_CARDS[0];
  const activePosition = activeCard
    ? filteredCards.findIndex((entry) => entry.id === activeCard.id)
    : -1;
  const unlockedCount = getMotivationalCardsUnlockedCount(progressByStage);
  const collectionProgress = MOTIVATIONAL_CARDS.length
    ? (unlockedCount / MOTIVATIONAL_CARDS.length) * 100
    : 0;

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    setFlipped(false);
  }, [activeCard?.id]);

  const scrollToTop = () => {
    modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDetail = (entry: MotivationalCard) => {
    setActiveCardId(entry.id);
    setFlipped(false);
    setView('detail');
    scrollToTop();
  };

  const changeFilter = (nextFilter: GalleryFilter) => {
    setFilter(nextFilter);
    setPage(0);
    setView('gallery');
    setFlipped(false);
    scrollToTop();
  };

  const changePage = (nextPage: number) => {
    setPage(Math.max(0, Math.min(nextPage, pageCount - 1)));
    scrollToTop();
  };

  const navigateDetail = (direction: -1 | 1) => {
    if (!filteredCards.length) return;
    const position = filteredCards.findIndex((entry) => entry.id === activeCard?.id);
    const safePosition = position >= 0 ? position : 0;
    const next = filteredCards[(safePosition + direction + filteredCards.length) % filteredCards.length];
    if (!next) return;
    setActiveCardId(next.id);
    setFlipped(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      if (view === 'detail') {
        event.preventDefault();
        navigateDetail(event.key === 'ArrowRight' ? -1 : 1);
        return;
      }
      if (pageCount > 1) {
        event.preventDefault();
        changePage(safePage + (event.key === 'ArrowRight' ? -1 : 1));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  if (!activeCard) return null;

  const activeUnlocked = isMotivationalCardUnlocked(activeCard, progressByStage);
  const activeCompleted = getStageCardProgress(activeCard, progressByStage);
  const activeRemaining = Math.max(0, activeCard.requiredLessons - (progressByStage[activeCard.stage] ?? 0));
  const stage = getStageName(activeCard.stage);

  return (
    <div
      className="goal-card-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={modalRef}
        className={`goal-card-modal ${view === 'gallery' ? 'is-gallery' : 'is-detail'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-card-modal-title"
        dir="rtl"
      >
        <header className="goal-card-modal-head">
          <div>
            <p>Lin Go Legends · {MOTIVATIONAL_CARDS.length} بطاقة</p>
            <h2 id="goal-card-modal-title">
              {view === 'gallery' ? 'مملكة البطاقات' : 'بطاقة المجموعة'}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="goal-card-modal-close"
            onClick={onClose}
            aria-label="إغلاق مجموعة البطاقات"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        {view === 'gallery' ? (
          <>
            <div className="goal-card-modal-summary">
              <div className="goal-card-modal-summary-count">
                <strong className="font-mono-num" dir="ltr">
                  {unlockedCount}<span>/{MOTIVATIONAL_CARDS.length}</span>
                </strong>
                <small>بطاقة مفتوحة</small>
              </div>
              <div className="goal-card-modal-summary-meter" aria-hidden="true">
                <span style={{ width: `${collectionProgress}%` }} />
              </div>
              <span className="goal-card-modal-summary-hint">كل درسين = بطاقة · 25 أساسية + 25 ذهبية لكل مرحلة</span>
            </div>

            <div
              className="goal-card-modal-filters"
              role="tablist"
              aria-label="تصفية البطاقات حسب المرحلة"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                className={`goal-card-modal-filter ${filter === 'all' ? 'is-active' : ''}`}
                onClick={() => changeFilter('all')}
              >
                <span>الكل</span>
                <small>{MOTIVATIONAL_CARDS.length}</small>
              </button>
              {MOTIVATIONAL_CARD_STAGES.map((stageEntry) => {
                const stageCards = getMotivationalCardsForStage(stageEntry.stage);
                const stageUnlocked = stageCards.filter(
                  (entry) => isMotivationalCardUnlocked(entry, progressByStage),
                ).length;
                return (
                  <button
                    key={stageEntry.stage}
                    type="button"
                    role="tab"
                    aria-selected={filter === stageEntry.stage}
                    className={`goal-card-modal-filter ${filter === stageEntry.stage ? 'is-active' : ''}`}
                    onClick={() => changeFilter(stageEntry.stage)}
                  >
                    <span>{stageEntry.nameAr}</span>
                    <small dir="ltr">{stageUnlocked}/{stageCards.length}</small>
                  </button>
                );
              })}
            </div>

            <div className="goal-card-modal-pager" aria-label="التنقل بين صفحات البطاقات">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => changePage(safePage - 1)}
                aria-label="الصفحة السابقة"
              >
                <ChevronRight aria-hidden="true" />
                السابق
              </button>
              <span className="font-mono-num" dir="ltr">
                {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => changePage(safePage + 1)}
                aria-label="الصفحة التالية"
              >
                التالي
                <ChevronLeft aria-hidden="true" />
              </button>
            </div>

            <div className="goal-card-modal-grid" aria-label="بطاقات المجموعة">
              {visibleCards.map((entry) => (
                <GoalCardTile
                  key={entry.id}
                  entry={entry}
                  completedLessons={progressByStage[entry.stage] ?? 0}
                  onClick={() => openDetail(entry)}
                  className="goal-gallery-card"
                />
              ))}
            </div>

            <p className="goal-card-modal-credit">
              رسوم الحيوانات: Twemoji · CC BY 4.0
            </p>
          </>
        ) : (
          <>
            <div className="goal-card-modal-detail-top">
              <button
                type="button"
                className="goal-card-modal-back"
                onClick={() => {
                  setView('gallery');
                  setFlipped(false);
                  scrollToTop();
                }}
              >
                <ChevronRight aria-hidden="true" />
                المجموعة
              </button>
              <span className={`goal-card-modal-detail-badge ${activeUnlocked ? 'is-unlocked' : 'is-locked'}`}>
                {activeUnlocked
                  ? activeCard.edition === 'gold' ? 'ذهبية مفتوحة' : 'مفتوحة'
                  : 'مقفلة'} · {stage.nameAr} · {activeCard.serial}
              </span>
            </div>

            <div className="goal-card-modal-stage">
              <button
                type="button"
                className="goal-card-nav"
                onClick={() => {
                  speechService.playPop();
                  navigateDetail(-1);
                }}
                aria-label="البطاقة السابقة"
              >
                <ChevronRight aria-hidden="true" />
              </button>

              <GoalFlipCard
                entry={activeCard}
                completed={activeCompleted}
                unlocked={activeUnlocked}
                flipped={flipped}
                onFlip={() => setFlipped((value) => !value)}
                className="goal-flip-card--modal"
              />

              <button
                type="button"
                className="goal-card-nav"
                onClick={() => {
                  speechService.playPop();
                  navigateDetail(1);
                }}
                aria-label="البطاقة التالية"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
            </div>

            <div className="goal-card-modal-info" aria-live="polite">
              <div className="goal-card-modal-position">
                <span>{activePosition >= 0 ? activePosition + 1 : 1} من {filteredCards.length}</span>
                <span>{stage.nameAr} · STAGE {pad(activeCard.stage)}</span>
              </div>
              <h3>{activeUnlocked ? activeCard.animal.nameAr : 'بطاقة سرية'}</h3>
              <p className="goal-card-modal-en font-en" dir="ltr">
                {activeUnlocked ? activeCard.animal.nameEn : 'LOCKED CARD'}
              </p>
              {activeUnlocked ? (
                <p className="goal-card-modal-card-title">
                  «{activeCard.titleAr}» · <span className="font-en" dir="ltr">{activeCard.titleEn}</span>
                </p>
              ) : (
                <p className="goal-card-modal-card-title">تفاصيل البطاقة تُكشف بعد فتحها.</p>
              )}
              <p className={`goal-card-modal-status ${activeUnlocked ? 'is-unlocked' : 'is-locked'}`}>
                {activeUnlocked
                  ? 'البطاقة مفتوحة — اقلبها لتقرأ رسالة حيوانك وتحديه اليومي.'
                  : `مقفلة — أكمل ${lessonCountAr(activeRemaining)} في المرحلة ${activeCard.stage}. لا يمكن قلب البطاقة أو قراءتها قبل فتحها.`}
              </p>
              {activeUnlocked && (
                <button
                  type="button"
                  className="goal-card-modal-flip"
                  onClick={() => {
                    speechService.playPop();
                    setFlipped((value) => !value);
                  }}
                >
                  <RotateCcw aria-hidden="true" />
                  {flipped ? 'عرض وجه البطاقة' : 'اقلب البطاقة واقرأ الرسالة'}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
