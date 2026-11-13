import React, { useState } from 'react';
import { wordPictureUrl } from '../../data/wordPictures';

interface WordPictureProps {
  word: string;
  emoji?: string;
  className?: string;
  alt?: string;
}

export const WordPicture: React.FC<WordPictureProps> = ({ word, emoji = '', className = '', alt }) => {
  const src = wordPictureUrl(word);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className={className} aria-hidden="true">
        {emoji}
      </span>
    );
  }

  return (
    <span className={`${className} word-picture`.trim()} aria-hidden="true">
      <img src={src} alt={alt ?? word} draggable={false} onError={() => setFailed(true)} loading="lazy" />
    </span>
  );
};
