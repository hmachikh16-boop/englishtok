import React, { useState } from 'react';
import { Lesson, DialogueLine } from '../../types';
import { CartoonScene } from '../video/CartoonScene';

interface LessonVisualProps {
  lesson: Lesson;
  alt: string;
  currentLine?: DialogueLine | null;
  className?: string;
}

/** Loads an offline lesson illustration and falls back to the lesson's existing SVG scene. */
export const LessonVisual: React.FC<LessonVisualProps> = ({
  lesson,
  alt,
  currentLine = null,
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = `/images/lessons/${lesson.slug}.svg`;

  return (
    <figure className={`lesson-visual ${className}`}>
      {imageFailed ? (
        <div className="lesson-visual-fallback" role="img" aria-label={alt}>
          <div aria-hidden="true" className="h-full w-full">
            <CartoonScene
              sceneType={lesson.sceneType}
              characterA={lesson.characterA}
              characterB={lesson.characterB}
              currentLine={currentLine}
              isPlaying={false}
            />
          </div>
        </div>
      ) : (
        <img
          key={lesson.slug}
          className="lesson-visual-image"
          src={imageSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      )}
    </figure>
  );
};
