import type { CharacterDesign } from '../types';

/**
 * Hand-built, infinitely scalable cartoon characters for the primary-school
 * lessons. Every design is drawn inside a shared local coordinate system:
 *
 *   - the ground is y = 0 and grows downwards
 *   - the character is centred on x = 0 and roughly 150 units wide
 *   - the head sits around y = -172, the hat/hair tops out near y = -235
 *
 * Because everything is vector based it stays razor sharp on any screen, which
 * is why the app renders these instead of bitmap sprites.
 */

export interface CharacterArtOptions {
  /** Mouth is open while the character is talking. */
  speaking?: boolean;
  /** Animation is currently running. */
  playing?: boolean;
}

const SKIN = '#f9c9a2';
const SKIN_SHADE = '#e6a97f';
const HAIR_DARK = '#4a2c1a';

const half = (markup: string) => `${markup}<g transform="scale(-1 1)">${markup}</g>`;

const shadow = (): string =>
  '<ellipse cx="0" cy="3" rx="47" ry="9" fill="#0f172a" opacity="0.15"/>';

const blush = (x: number, y = -166): string =>
  `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.6" fill="#f472b6" opacity="0.42"/>`;

const mouthFor = (opts: CharacterArtOptions): string =>
  opts.speaking && opts.playing
    ? '<ellipse cx="0" cy="-158" rx="8.6" ry="6.6" fill="#9f2434"/><path d="M-7.4 -161.5 q7.4 3.2 14.8 0 z" fill="#ffffff"/><ellipse cx="0" cy="-154" rx="5" ry="3" fill="#ef5b7a"/>'
    : '<path d="M-9 -159 q9 10 18 0" stroke="#9f2434" stroke-width="2.8" fill="none" stroke-linecap="round"/>';

/** Shared friendly face used by every human character. */
const humanFace = (hair: string, skin: string, shade: string, opts: CharacterArtOptions): string => `
  <circle cx="-36" cy="-172" r="6.6" fill="${skin}"/>
  <circle cx="36" cy="-172" r="6.6" fill="${skin}"/>
  <circle cx="-36" cy="-172" r="3.4" fill="${shade}" opacity="0.7"/>
  <circle cx="36" cy="-172" r="3.4" fill="${shade}" opacity="0.7"/>
  <ellipse cx="-13.5" cy="-176" rx="6.8" ry="8.1" fill="#ffffff"/>
  <ellipse cx="13.5" cy="-176" rx="6.8" ry="8.1" fill="#ffffff"/>
  <circle cx="-12.4" cy="-175.5" r="3.9" fill="#243244"/>
  <circle cx="12.4" cy="-175.5" r="3.9" fill="#243244"/>
  <circle cx="-13.9" cy="-177.6" r="1.4" fill="#ffffff"/>
  <circle cx="13.9" cy="-177.6" r="1.4" fill="#ffffff"/>
  <path d="M-21 -189 q8 -5 14 -2" stroke="${hair}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M21 -189 q-8 -5 -14 -2" stroke="${hair}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M0 -171 q3.6 4 0 6" stroke="${shade}" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${blush(-24)}${blush(24)}
  ${mouthFor(opts)}
`;

/** Cartoon arm: bare skin with a coloured sleeve cap, hand already attached. */
const arm = (skin: string, sleeve: string): string => `
  <path d="M-37 -135 C-51 -129 -58 -107 -56 -88 C-55 -80 -46 -80 -43 -87 C-41 -100 -40 -117 -33 -127 Z" fill="${skin}"/>
  <path d="M-38 -137 C-49 -132 -54 -121 -55 -112 C-49 -114 -43 -121 -34 -128 Z" fill="${sleeve}"/>
  <circle cx="-55" cy="-86" r="9.6" fill="${skin}"/>
`;

const legPair = (pants: string, shoe: string, shoeShade: string): string =>
  half(`
    <rect x="-31" y="-80" width="25" height="66" rx="12" fill="${pants}"/>
    <path d="M-39 -18 h31 a12 12 0 0 1 12 12 v6 h-43 z" fill="${shoe}"/>
    <path d="M-39 -9 h43 v9 h-43 z" fill="${shoeShade}"/>
  `);

const neck = (skin: string): string => `<rect x="-10" y="-158" width="20" height="26" rx="10" fill="${skin}"/>`;

const humanHead = (skin: string): string =>
  `<circle cx="0" cy="-172" r="38" fill="${skin}" stroke="${SKIN_SHADE}" stroke-width="1.5" stroke-opacity="0.5"/>`;

/* ------------------------------------------------------------------ humans */

const boyMonster = (opts: CharacterArtOptions): string => `
  ${shadow()}
  ${legPair('#5a6ad4', '#f4f8ff', '#dbe5f7')}
  <path d="M-44 -141 C-47 -112 -41 -84 -32 -72 L32 -72 C41 -84 47 -112 44 -141 Z" fill="#f2703a"/>
  <path d="M-43 -127 C-20 -123 20 -123 43 -127 L42 -113 C20 -109 -20 -109 -42 -113 Z" fill="#ffd166"/>
  <path d="M-41 -105 C-20 -101 20 -101 41 -105 L40 -91 C20 -87 -20 -87 -40 -91 Z" fill="#ffd166"/>
  <path d="M-38 -83 C-20 -79 20 -79 38 -83 L33 -70 L-33 -70 Z" fill="#ffd166"/>
  <path d="M-15 -145 q15 13 30 0 q-15 7 -30 0 z" fill="#fff4e2" opacity="0.95"/>
  ${half(arm(SKIN, '#f2703a'))}
  ${neck(SKIN)}
  ${humanHead(SKIN)}
  ${humanFace(HAIR_DARK, SKIN, SKIN_SHADE, opts)}
  <path d="M-33 -183 C-15 -193 15 -193 33 -183 C20 -178 -20 -178 -33 -183 Z" fill="${HAIR_DARK}"/>
  <path d="M-40 -180 C-43 -215 -19 -229 0 -229 C19 -229 43 -215 40 -180 Z" fill="#43b3e6"/>
  <path d="M-26 -218 C-15 -226 -2 -226 5 -219 C-6 -220 -17 -216 -24 -209 Z" fill="#a8e4f8" opacity="0.75"/>
  <path d="M-32 -218 C-43 -231 -33 -242 -22 -237 C-17 -233 -19 -224 -26 -215 Z" fill="#8b7be0"/>
  <path d="M32 -218 C43 -231 33 -242 22 -237 C17 -233 19 -224 26 -215 Z" fill="#8b7be0"/>
  <rect x="-42" y="-189" width="84" height="17" rx="8.5" fill="#8ad6f2"/>
  <rect x="-42" y="-189" width="84" height="6" rx="3" fill="#b9e9fa" opacity="0.8"/>
`;

interface GirlOptions {
  hair: string;
  hairLight: string;
  dress: string;
  dressLight: string;
  trim: string;
  hat?: 'none' | 'green';
}

const girl = (o: GirlOptions, opts: CharacterArtOptions): string => `
  ${shadow()}
  ${legPair(SKIN, '#ffffff', '#e3ebf7')}
  <path d="M-42 -142 C-50 -106 -60 -66 -62 -50 L62 -50 C60 -66 50 -106 42 -142 Z" fill="${o.dress}"/>
  <path d="M-42 -142 C-48 -110 -55 -78 -57 -54 L-30 -54 C-30 -86 -33 -118 -31 -142 Z" fill="${o.dressLight}" opacity="0.5"/>
  <path d="M-62 -50 L62 -50 L62 -42 L-62 -42 Z" fill="${o.trim}"/>
  ${half(arm(SKIN, '#ffffff'))}
  ${neck(SKIN)}
  <path d="M-45 -180 C-50 -150 -42 -118 -28 -107 C-10 -100 10 -100 28 -107 C42 -118 50 -150 45 -180 Z" fill="${o.hair}" stroke="rgba(15,23,42,0.10)" stroke-width="2"/>
  <path d="M-46 -176 C-50 -152 -46 -128 -38 -116 C-42 -140 -40 -162 -35 -176 Z" fill="${o.hair}"/>
  <path d="M46 -176 C50 -152 46 -128 38 -116 C42 -140 40 -162 35 -176 Z" fill="${o.hair}"/>
  <path d="M-32 -145 L0 -122 L32 -145 C19 -155 -19 -155 -32 -145 Z" fill="#ffffff"/>
  <path d="M-11 -138 l-10 -7 v14 z" fill="#ef5b7a"/>
  <path d="M11 -138 l10 -7 v14 z" fill="#ef5b7a"/>
  <circle cx="0" cy="-138" r="3.5" fill="#d43f63"/>
  ${humanHead(SKIN)}
  <path d="M-39 -188 C-31 -210 31 -210 39 -188 C27 -199 11 -196 4 -183 C-3 -196 -21 -200 -39 -188 Z" fill="${o.hair}"/>
  <path d="M-26 -199 C-13 -210 12 -210 24 -200 C9 -204 -11 -204 -26 -199 Z" fill="${o.hairLight}" opacity="0.85"/>
  ${humanFace(o.hair, SKIN, SKIN_SHADE, opts)}
  ${o.hat === 'green'
    ? '<ellipse cx="0" cy="-206" rx="48" ry="10" fill="#3f8549"/><path d="M-35 -206 C-32 -234 32 -234 35 -206 Z" fill="#4f9d5b"/><path d="M-21 -222 C-13 -230 8 -230 17 -221 C3 -225 -11 -224 -21 -222 Z" fill="#6fbe7a" opacity="0.8"/>'
    : ''}
`;

/* ----------------------------------------------------------------- animals */

const animalEyes = (cx = 12, cy = -134): string => `
  <ellipse cx="${-cx}" cy="${cy}" rx="6.2" ry="7.6" fill="#ffffff"/>
  <ellipse cx="${cx}" cy="${cy}" rx="6.2" ry="7.6" fill="#ffffff"/>
  <circle cx="${-cx + 1}" cy="${cy + 0.6}" r="3.7" fill="#243244"/>
  <circle cx="${cx - 1}" cy="${cy + 0.6}" r="3.7" fill="#243244"/>
  <circle cx="${-cx - 0.4}" cy="${cy - 1.4}" r="1.3" fill="#ffffff"/>
  <circle cx="${cx + 0.4}" cy="${cy - 1.4}" r="1.3" fill="#ffffff"/>
  <path d="M-19 -145 q6 -4 11 -1" stroke="#7a3a1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M19 -145 q-6 -4 -11 -1" stroke="#7a3a1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
`;

const squirrelMouth = (): string =>
  '<path d="M0 -124 v4 M0 -120 q-7 7 -12 1 M0 -120 q7 7 12 1" stroke="#3b2a23" stroke-width="2.1" fill="none" stroke-linecap="round"/>';

const squirrel = (
  o: { glasses?: boolean; scarf?: boolean },
  opts: CharacterArtOptions,
): string => `
  ${shadow()}
  <path d="M20 -64 C74 -48 98 -108 68 -152 C58 -168 34 -170 28 -154 C50 -138 56 -98 24 -76 Z" fill="#d95f33"/>
  <path d="M32 -76 C62 -94 70 -128 52 -150 C62 -124 50 -94 28 -82 Z" fill="#f08a5c" opacity="0.75"/>
  <ellipse cx="-16" cy="-7" rx="15" ry="9" fill="#c9552c"/>
  <ellipse cx="16" cy="-7" rx="15" ry="9" fill="#c9552c"/>
  <ellipse cx="0" cy="-56" rx="34" ry="45" fill="#e2693c"/>
  <ellipse cx="0" cy="-50" rx="23" ry="35" fill="#f7ead6"/>
  <g transform="rotate(20 -32 -70)"><ellipse cx="-32" cy="-70" rx="10" ry="16" fill="#e2693c"/></g>
  <g transform="rotate(-20 32 -70)"><ellipse cx="32" cy="-70" rx="10" ry="16" fill="#e2693c"/></g>
  <circle cx="-38" cy="-54" r="7" fill="#f7ead6"/>
  <circle cx="38" cy="-54" r="7" fill="#f7ead6"/>
  <path d="M-31 -150 C-38 -178 -22 -185 -11 -164 Z" fill="#e2693c"/>
  <path d="M31 -150 C38 -178 22 -185 11 -164 Z" fill="#e2693c"/>
  <path d="M-27 -155 C-31 -170 -22 -175 -16 -162 Z" fill="#f7ead6"/>
  <path d="M27 -155 C31 -170 22 -175 16 -162 Z" fill="#f7ead6"/>
  <ellipse cx="-31" cy="-118" rx="13" ry="11" fill="#e2693c"/>
  <ellipse cx="31" cy="-118" rx="13" ry="11" fill="#e2693c"/>
  <circle cx="0" cy="-128" r="34" fill="#e2693c" stroke="#c9552c" stroke-width="1.5" stroke-opacity="0.5"/>
  <ellipse cx="0" cy="-118" rx="20" ry="15" fill="#f7ead6"/>
  ${animalEyes()}
  <ellipse cx="0" cy="-128" rx="5.2" ry="4" fill="#3b2a23"/>
  ${squirrelMouth()}
  <path d="M-22 -120 l-12 -3 M-22 -116 l-12 3" stroke="#c9552c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M22 -120 l12 -3 M22 -116 l12 3" stroke="#c9552c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  ${blush(-24, -122)}
  ${blush(24, -122)}
  ${o.glasses
    ? '<circle cx="-12" cy="-134" r="11.5" fill="none" stroke="#24303a" stroke-width="3"/><circle cx="12" cy="-134" r="11.5" fill="none" stroke="#24303a" stroke-width="3"/><path d="M-1 -134 h2 M-23 -136 l-8 -3 M23 -136 l8 -3" stroke="#24303a" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : ''}
  ${o.scarf
    ? '<path d="M-31 -98 C-16 -88 16 -88 31 -98 C33 -88 18 -80 0 -80 C-18 -80 -33 -88 -31 -98 Z" fill="#3fb8c9"/><path d="M-28 -90 L-26 -50 L-6 -52 L-12 -90 Z" fill="#35a6b6"/><path d="M-26 -55 l-1 8 M-19 -55 l-1 8 M-12 -56 l-1 8" stroke="#7ed8e4" stroke-width="2.4" stroke-linecap="round"/><path d="M-30 -97 C-16 -89 16 -89 30 -97" stroke="#7ed8e4" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="0" cy="-150" r="7.5" fill="#fdf6ec"/>'
    : ''}
`;

const fox = (opts: CharacterArtOptions): string => {
  const flowers = [
    [-13, -84],
    [10, -78],
    [-2, -62],
  ]
    .map(
      ([x, y]) =>
        `<g transform="translate(${x} ${y})" fill="#fff8f0"><circle cx="0" cy="-5.5" r="3.8"/><circle cx="5.5" cy="0" r="3.8"/><circle cx="3" cy="6.5" r="3.8"/><circle cx="-3" cy="6.5" r="3.8"/><circle cx="-5.5" cy="0" r="3.8"/><circle cx="0" cy="0" r="2.6" fill="#f2b705"/></g>`,
    )
    .join('');
  return `
  ${shadow()}
  <path d="M-22 -60 C-78 -44 -96 -104 -68 -134 C-60 -144 -38 -144 -34 -130 C-58 -118 -60 -88 -26 -72 Z" fill="#e8802f"/>
  <path d="M-68 -134 C-60 -144 -38 -144 -34 -130 C-48 -134 -58 -132 -68 -126 Z" fill="#fdf4e8"/>
  <ellipse cx="-16" cy="-7" rx="15" ry="9" fill="#c96a22"/>
  <ellipse cx="16" cy="-7" rx="15" ry="9" fill="#c96a22"/>
  <ellipse cx="0" cy="-56" rx="33" ry="45" fill="#e8802f"/>
  <ellipse cx="0" cy="-50" rx="22" ry="34" fill="#fdf4e8"/>
  <path d="M-32 -104 C-34 -64 -20 -44 0 -42 C20 -44 34 -64 32 -104 Z" fill="#ffd166"/>
  <path d="M-30 -102 C-20 -106 20 -106 30 -102 L28 -94 L-28 -94 Z" fill="#f2b705"/>
  ${flowers}
  ${half(arm('#e8802f', '#ffd166'))}
  <path d="M-28 -150 L-40 -190 L-8 -162 Z" fill="#e8802f"/>
  <path d="M28 -150 L40 -190 L8 -162 Z" fill="#e8802f"/>
  <path d="M-24 -156 L-35 -184 L-14 -160 Z" fill="#fdf4e8" opacity="0.9"/>
  <path d="M24 -156 L35 -184 L14 -160 Z" fill="#fdf4e8" opacity="0.9"/>
  <path d="M-37 -184 L-40 -190 L-30 -182 Z" fill="#3b2a23"/>
  <path d="M37 -184 L40 -190 L30 -182 Z" fill="#3b2a23"/>
  <circle cx="0" cy="-128" r="33" fill="#e8802f" stroke="#c96a22" stroke-width="1.5" stroke-opacity="0.5"/>
  <path d="M-21 -118 C-21 -98 -9 -90 0 -90 C9 -90 21 -98 21 -118 C21 -131 11 -139 0 -139 C-11 -139 -21 -131 -21 -118 Z" fill="#fdf4e8"/>
  ${animalEyes()}
  <ellipse cx="0" cy="-126" rx="5.6" ry="4.2" fill="#3b2a23"/>
  <path d="M0 -122 v3 M0 -119 q-7 7 -12 1 M0 -119 q7 7 12 1" stroke="#3b2a23" stroke-width="2.1" fill="none" stroke-linecap="round"/>
  <path d="M-22 -120 l-12 -3 M-22 -116 l-12 3" stroke="#c96a22" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M22 -120 l12 -3 M22 -116 l12 3" stroke="#c96a22" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  ${blush(-24, -122)}
  ${blush(24, -122)}
`;
};

const dog = (opts: CharacterArtOptions): string => `
  ${shadow()}
  <path d="M-16 -58 C-48 -56 -57 -86 -36 -104 C-31 -108 -23 -106 -25 -98 C-38 -87 -34 -72 -14 -70 Z" fill="#b07a45"/>
  <ellipse cx="-15" cy="-7" rx="15" ry="9" fill="#8f6134"/>
  <ellipse cx="15" cy="-7" rx="15" ry="9" fill="#8f6134"/>
  <ellipse cx="0" cy="-56" rx="33" ry="44" fill="#b07a45"/>
  <ellipse cx="0" cy="-52" rx="21" ry="32" fill="#f3e2cc"/>
  <g transform="rotate(14 -33 -122)"><ellipse cx="-33" cy="-122" rx="11" ry="24" fill="#8f6134"/></g>
  <g transform="rotate(-14 33 -122)"><ellipse cx="33" cy="-122" rx="11" ry="24" fill="#8f6134"/></g>
  ${half(arm('#b07a45', '#b07a45'))}
  <circle cx="0" cy="-128" r="33" fill="#b07a45" stroke="#8f6134" stroke-width="1.5" stroke-opacity="0.5"/>
  <ellipse cx="-13" cy="-139" rx="8" ry="6.5" fill="#8f6134" opacity="0.7"/>
  <ellipse cx="0" cy="-117" rx="18" ry="14" fill="#f3e2cc"/>
  ${animalEyes()}
  <ellipse cx="0" cy="-126" rx="5.2" ry="4" fill="#3b2a23"/>
  <path d="M0 -122 v3 M0 -119 q-7 7 -12 1 M0 -119 q7 7 12 1" stroke="#3b2a23" stroke-width="2.1" fill="none" stroke-linecap="round"/>
  <path d="M-26 -98 C-14 -91 14 -91 26 -98" stroke="#e35d5d" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="0" cy="-89" r="4.4" fill="#ffd166"/>
  ${blush(-24, -122)}
  ${blush(24, -122)}
`;

/* ------------------------------------------------------------------ export */

const DESIGNS: Record<
  CharacterDesign,
  (opts: CharacterArtOptions) => string
> = {
  'boy-monster': boyMonster,
  'girl-teal': (o) =>
    girl({ hair: '#e8663c', hairLight: '#f4915f', dress: '#2fb6c9', dressLight: '#79d8e6', trim: '#1f97ab' }, o),
  'girl-pink': (o) =>
    girl({ hair: '#6b4a2f', hairLight: '#8f6a48', dress: '#f7a8c4', dressLight: '#ffc9dc', trim: '#e0729c' }, o),
  'girl-green-hat': (o) =>
    girl({ hair: '#5b3a24', hairLight: '#7d5636', dress: '#fbeef2', dressLight: '#ffffff', trim: '#f3b6c9', hat: 'green' }, o),
  squirrel: (o) => squirrel({}, o),
  'squirrel-glasses': (o) => squirrel({ glasses: true }, o),
  'squirrel-scarf': (o) => squirrel({ scarf: true }, o),
  'fox-flowers': fox,
  'dog-brown': dog,
};

/**
 * Returns the SVG markup for a design. The result is a fragment made of
 * drawing elements, ready to be dropped inside an existing <svg>.
 */
export const characterSvg = (
  design: CharacterDesign,
  opts: CharacterArtOptions = {},
): string => {
  const draw = DESIGNS[design] ?? boyMonster;
  return `<g>${draw(opts)}</g>`;
};

export const PRIMARY_DESIGNS = Object.keys(DESIGNS) as CharacterDesign[];
