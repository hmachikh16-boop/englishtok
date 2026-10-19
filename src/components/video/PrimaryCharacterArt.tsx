import React from 'react';
import type { CharacterDesign } from '../../types';
import { characterSvg } from '../../characters/characterArt';

interface PrimaryCharacterProps {
  design: CharacterDesign;
  speaking?: boolean;
  playing?: boolean;
}

/**
 * Renders one of the hand-built primary-school characters. The actual vectors
 * live in src/characters/characterArt.ts so the very same art can be reused by
 * offline tooling.
 */
export const PrimaryCharacter = React.memo<PrimaryCharacterProps>(
  ({ design, speaking = false, playing = false }) => (
    <g
      dangerouslySetInnerHTML={{
        __html: characterSvg(design, { speaking, playing }),
      }}
    />
  ),
);
PrimaryCharacter.displayName = 'PrimaryCharacter';

interface PrimaryAvatarProps {
  design: CharacterDesign;
  className?: string;
  label?: string;
}

/**
 * A compact, circular head-and-shoulders avatar for lists and speaker chips.
 * It reuses the full illustration but crops the viewport onto the face.
 */
export const PrimaryAvatar = React.memo<PrimaryAvatarProps>(
  ({ design, className = '', label }) => (
    <svg
      viewBox="-64 -232 128 148"
      className={className}
      role="img"
      aria-label={label}
      focusable="false"
    >
      <PrimaryCharacter design={design} />
    </svg>
  ),
);
PrimaryAvatar.displayName = 'PrimaryAvatar';
