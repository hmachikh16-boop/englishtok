// Regenerates src/data/wordPictures.ts from the files in public/images/words.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'images', 'words');
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.replace(/\.webp$/, ''))
  .sort();

const head =
  '// Auto-generated list of lesson word pictures cropped from the flashcard sheets.\n' +
  'export const AVAILABLE_WORD_PICTURES = new Set<string>([\n';
const body = files.map((f) => `  '${f}',`).join('\n');
const tail = `\n]);

const ALIASES: Record<string, string> = {
  bag: 'school-bag',
};

export const wordPictureUrl = (word: string): string | null => {
  if (!word) return null;
  const slug = word.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const key = ALIASES[slug] ?? slug;
  return AVAILABLE_WORD_PICTURES.has(key) ? \`/images/words/\${key}.webp\` : null;
};
`;

const out = path.join(__dirname, '..', 'src', 'data', 'wordPictures.ts');
fs.writeFileSync(out, head + body + tail);
console.log('written', files.length, 'words ->', out);
