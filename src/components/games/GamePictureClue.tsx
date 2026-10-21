import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { GamePicture } from '../../data/gamePictureClues';
import type { CategoryKey } from '../../types';
import { twemojiUrl } from '../../utils/twemoji';

interface GamePictureClueProps {
  picture: GamePicture;
  translationAr: string;
  category: CategoryKey;
}

const SHAPE_LABELS: Record<
  Extract<GamePicture, { kind: 'shape' }>['shape'],
  string
> = {
  circle: 'دائرة',
  square: 'مربع',
  triangle: 'مثلث',
  rectangle: 'مستطيل',
  star: 'نجمة',
  heart: 'قلب',
};

const THEME_LABELS: Partial<Record<CategoryKey, string>> = {
  greetings: 'تعارف',
  travel: 'سفر',
  food: 'طعام',
  work: 'عمل',
  shopping: 'تسوق',
  health: 'صحة',
  idioms: 'تعبيرات',
  grammar: 'أساسيات',
};

const EmojiPicture: React.FC<{ emoji: string }> = ({ emoji }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [emoji]);

  if (failed) {
    return (
      <span className="games-picture-emoji" aria-hidden="true">
        {emoji}
      </span>
    );
  }

  return (
    <img
      className="games-picture-emoji games-picture-emoji-img"
      src={twemojiUrl(emoji)}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
};

const PictureContent: React.FC<{ picture: GamePicture }> = ({ picture }) => {
  if (picture.kind === 'emoji') {
    return <EmojiPicture key={picture.emoji} emoji={picture.emoji} />;
  }

  if (picture.kind === 'number') {
    return (
      <span className="games-picture-number" aria-hidden="true">
        {picture.value}
      </span>
    );
  }

  if (picture.kind === 'color') {
    return (
      <span
        className="games-picture-color"
        style={{ background: picture.color }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`games-picture-shape is-${picture.shape}`}
      aria-hidden="true"
    />
  );
};

const pictureLabel = (picture: GamePicture, translationAr: string): string => {
  if (picture.kind === 'color') return `لون ${picture.label}`;
  if (picture.kind === 'number') return `الرقم ${picture.value}`;
  if (picture.kind === 'shape') return `شكل ${SHAPE_LABELS[picture.shape]}`;
  return translationAr;
};

export const GamePictureClue: React.FC<GamePictureClueProps> = ({
  picture,
  translationAr,
  category,
}) => (
  <div
    className="games-picture"
    data-category={category}
    role="img"
    aria-label={`صورة تعبّر عن ${pictureLabel(picture, translationAr)}`}
  >
    <span className="games-picture-sun" aria-hidden="true" />
    <span className="games-picture-cloud is-one" aria-hidden="true" />
    <span className="games-picture-cloud is-two" aria-hidden="true" />
    <span className="games-picture-hill is-back" aria-hidden="true" />
    <span className="games-picture-hill is-front" aria-hidden="true" />
    <span className="games-picture-spark is-one" aria-hidden="true">✦</span>
    <span className="games-picture-spark is-two" aria-hidden="true">✦</span>

    <span className="games-picture-kicker">
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      خمّن من الصورة
    </span>

    <div className="games-picture-stage">
      <PictureContent picture={picture} />
    </div>

    <span className="games-picture-mascot" aria-hidden="true">
      <span className="games-picture-bubble">؟</span>
      <span className="games-picture-panda">🐼</span>
    </span>

    {THEME_LABELS[category] && (
      <span className="games-picture-theme" aria-hidden="true">
        {THEME_LABELS[category]}
      </span>
    )}
  </div>
);
