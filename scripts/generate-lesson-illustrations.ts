import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { characterSvg } from '../src/characters/characterArt';
import type { CharacterDesign } from '../src/types';

interface LessonIllustrationSource {
  slug: string;
  sceneType?: string;
  title?: string;
  titleAr?: string;
  descriptionAr?: string;
  level?: string;
  category?: string;
  vocabulary?: Array<{ word?: string; translationAr?: string }>;
  dialogue?: Array<{ textEn?: string }>;
  characterA?: { design?: CharacterDesign };
  characterB?: { design?: CharacterDesign };
}

interface LearningPathSource {
  lessons?: LessonIllustrationSource[];
}

const root = process.cwd();
const dataPath = resolve(root, 'public/content/learning-path.json');
const outputDir = resolve(root, 'public/images/lessons');
const data = JSON.parse(await readFile(dataPath, 'utf8')) as LearningPathSource;
await mkdir(outputDir, { recursive: true });

type SceneTheme = [string, string, string];

const themes: Record<string, SceneTheme> = {
  airport: ['#e2f5ff', '#a9e4fa', '#167c9b'],
  cafe: ['#fff0d9', '#ffd7ad', '#aa5b32'],
  classroom: ['#e5f6ed', '#bcebd4', '#18866a'],
  clinic: ['#e4f5f5', '#bde9e3', '#168a83'],
  office: ['#e8edff', '#cbd3ff', '#575ec6'],
  park: ['#edfae4', '#d0f0b2', '#579b45'],
  shop: ['#fff0ef', '#ffd1cb', '#dc675b'],
  street: ['#fff6d9', '#ffe39c', '#b17b1a'],
};

const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch] ?? ch
  );
const truncate = (value: unknown, max: number): string => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

function sceneArt(type: string | undefined, accent: string): string {
  const common = `<circle cx="790" cy="112" r="48" fill="#fff" opacity=".5"/><path d="M0 486 Q180 440 335 485T650 475T1024 476V640H0Z" fill="#fff" opacity=".4"/>`;
  const art: Record<string, string> = {
    airport: `<rect x="80" y="104" width="420" height="242" rx="28" fill="#fff" opacity=".55"/><path d="M105 290h365M210 108v230M358 108v230" stroke="#fff" stroke-width="13" opacity=".75"/><path d="M284 187l82-15 71 16-70 11-39 38-14-2 19-38-49-5z" fill="${accent}"/><rect x="662" y="340" width="205" height="23" rx="11" fill="${accent}" opacity=".28"/><rect x="712" y="290" width="112" height="54" rx="11" fill="#fff"/><circle cx="737" cy="351" r="13" fill="#536b7b"/><circle cx="801" cy="351" r="13" fill="#536b7b"/>`,
    cafe: `<path d="M75 355h480v28H75z" fill="${accent}" opacity=".28"/><rect x="112" y="208" width="402" height="144" rx="20" fill="#fff" opacity=".58"/><path d="M258 271h86v78q0 31-43 31t-43-31z" fill="#fff" stroke="${accent}" stroke-width="9"/><path d="M344 286h28q28 0 19 28-5 15-25 15h-22" fill="none" stroke="${accent}" stroke-width="9"/><ellipse cx="301" cy="271" rx="44" ry="11" fill="${accent}"/><path d="M283 245q-14-20 0-37m32 37q-14-20 0-37" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
    classroom: `<rect x="102" y="102" width="465" height="254" rx="22" fill="#fff" opacity=".62"/><rect x="133" y="130" width="404" height="191" rx="13" fill="${accent}"/><path d="M182 181h170M182 221h286M182 261h224" stroke="#fff" stroke-width="13" stroke-linecap="round" opacity=".82"/><path d="M214 380h260l-28 27H242z" fill="#fff" opacity=".7"/><rect x="271" y="342" width="146" height="39" rx="10" fill="#eebd81"/>`,
    clinic: `<rect x="102" y="105" width="436" height="254" rx="24" fill="#fff" opacity=".66"/><circle cx="320" cy="231" r="82" fill="${accent}"/><rect x="299" y="180" width="42" height="102" rx="11" fill="#fff"/><rect x="270" y="210" width="100" height="42" rx="11" fill="#fff"/><path d="M151 344v-99q0-43 44-43t44 43v99" fill="none" stroke="${accent}" stroke-width="13" opacity=".72"/>`,
    office: `<rect x="100" y="96" width="470" height="263" rx="25" fill="#fff" opacity=".66"/><rect x="132" y="130" width="405" height="171" rx="14" fill="${accent}" opacity=".85"/><path d="M154 290h357" stroke="#fff" stroke-width="8" opacity=".7"/><rect x="250" y="307" width="155" height="18" rx="9" fill="${accent}"/><rect x="271" y="239" width="112" height="69" rx="8" fill="#526078"/><rect x="280" y="247" width="94" height="51" rx="4" fill="#c5ecff"/>`,
    park: `<circle cx="328" cy="213" r="106" fill="#fff" opacity=".6"/><path d="M325 235v143" stroke="#896344" stroke-width="26" stroke-linecap="round"/><circle cx="282" cy="192" r="70" fill="${accent}"/><circle cx="352" cy="173" r="79" fill="${accent}" opacity=".84"/><circle cx="389" cy="224" r="61" fill="${accent}" opacity=".9"/><path d="M100 408q170-73 340 0t430-4" fill="none" stroke="#fff" stroke-width="18" opacity=".7"/>`,
    shop: `<path d="M124 194h415l-42-85H166z" fill="${accent}"/><path d="M142 194h380v172H142z" fill="#fff" opacity=".69"/><path d="M142 194h380" stroke="#fff" stroke-width="12"/><path d="M194 211v125m91-125v125m91-125v125m91-125v125" stroke="${accent}" stroke-width="8" opacity=".43"/><path d="M122 194h419" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>`,
    street: `<path d="M80 332V190h112v142m18 0V130h142v202m20 0V204h116v128" fill="#fff" opacity=".56"/><path d="M101 217h22m35 0h22M235 164h25m46 0h25m-96 42h25m46 0h25m112 22h22m35 0h22" stroke="${accent}" stroke-width="12" stroke-linecap="round"/><path d="M0 432h1024" stroke="#fff" stroke-width="15" opacity=".65"/><path d="M510 441h102m55 0h102" stroke="${accent}" stroke-width="9" stroke-linecap="round" opacity=".65"/>`,
  };
  return common + (art[type ?? ''] ?? art.classroom);
}

/**
 * Places one of the hand-drawn characters on the illustration ground. The
 * character art is authored with its feet at y = 0 and centred on x = 0, so a
 * single translate puts it exactly where the old generic character stood while
 * leaving the illustrated background untouched.
 */
const characterAt = (design: CharacterDesign | undefined, fallback: CharacterDesign, cx: number): string =>
  `<g transform="translate(${cx} 500)">${characterSvg(design ?? fallback)}</g>`;

let written = 0;
let skipped = 0;
for (const lesson of data.lessons ?? []) {
  // Refresh only illustrations that already exist: lessons without a static
  // illustration keep the animated CartoonScene, which renders the same cast.
  const outputPath = resolve(outputDir, `${lesson.slug}.svg`);
  if (!existsSync(outputPath)) {
    skipped++;
    continue;
  }
  const [top, bottom, accent] = themes[lesson.sceneType ?? ''] ?? themes.classroom;
  const title = truncate(lesson.title, 37);
  const word = truncate(lesson.vocabulary?.[0]?.word ?? lesson.dialogue?.[0]?.textEn ?? lesson.title, 27);
  const meaning = truncate(lesson.vocabulary?.[0]?.translationAr ?? lesson.titleAr, 34);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="640" viewBox="0 0 1024 640" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(lesson.descriptionAr)} — ${esc(word)}: ${esc(meaning)}</desc><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><filter id="shadow" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="13" stdDeviation="15" flood-color="#294750" flood-opacity=".14"/></filter></defs><rect width="1024" height="640" rx="36" fill="url(#sky)"/><g>${sceneArt(lesson.sceneType, accent)}</g><g filter="url(#shadow)"><rect x="583" y="112" width="359" height="159" rx="31" fill="#fff"/><path d="M615 272l-13 27 40-27" fill="#fff"/><circle cx="624" cy="154" r="13" fill="${accent}"/><circle cx="665" cy="154" r="13" fill="${accent}" opacity=".36"/><circle cx="706" cy="154" r="13" fill="${accent}" opacity=".2"/><text x="616" y="207" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#253a40">${esc(title)}</text><text x="616" y="245" font-family="Arial,sans-serif" font-size="18" fill="#668078">${esc(lesson.level)} · ${esc(lesson.category)}</text><rect x="580" y="319" width="364" height="101" rx="25" fill="#fff" opacity=".94"/><text x="611" y="361" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="${accent}">${esc(word)}</text><text x="611" y="395" font-family="Arial,sans-serif" font-size="19" fill="#596f6a" direction="rtl">${esc(meaning)}</text></g>${characterAt(lesson.characterA?.design, 'girl-teal', 183)}${characterAt(lesson.characterB?.design, 'boy-monster', 865)}<g fill="#fff" opacity=".84"><path d="M645 79l5 14 15 1-11 9 4 14-13-8-12 8 4-14-11-9 15-1z"/><path d="M908 475l4 11 12 1-9 7 3 12-10-7-10 7 3-12-9-7 12-1z"/><circle cx="567" cy="93" r="7"/><circle cx="954" cy="301" r="6"/></g></svg>`;
  await writeFile(outputPath, svg, { encoding: 'utf8' });
  written++;
}
console.log(
  `Generated ${written} static lesson illustrations in public/images/lessons (${skipped} lessons without a static illustration were left unchanged).`
);
