/**
 * Twemoji stores each glyph as an SVG named after its Unicode code points.
 * Variation selectors (FE0F) are not part of the filenames we bundle, except
 * for a couple of older joined sequences which are aliased separately.
 */
export const twemojiCode = (emoji: string): string =>
  Array.from(emoji)
    .map((character) => character.codePointAt(0)?.toString(16) ?? '')
    .filter((code) => code && code !== 'fe0f')
    .join('-');

export const twemojiUrl = (emoji: string): string =>
  `/images/game-emojis/${twemojiCode(emoji)}.svg`;
