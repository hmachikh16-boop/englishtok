import React from 'react';
import type { StorySceneType } from '../../data/stories';

/* ------------------------------------------------------------------ */
/*  Warm, parchment-toned story illustrations.                         */
/*  Deliberately uses sepia / brass / oxblood instead of blue or gray  */
/*  so the artwork belongs to the aged-paper skin.                     */
/* ------------------------------------------------------------------ */

const INK = '#2b2118';
const DEEP = '#3a2a1d';
const SOFT = '#5b4730';
const BRASS = '#a56c18';
const BRASS_LIGHT = '#d9b25a';
const OXBLOOD = '#8d2f24';
const PAPER = '#efd9ad';
const LIGHT = '#fbf0d7';
const EDGE = '#c9b38a';

const Stars = ({ points }: { points: Array<[number, number, number]> }) => (
  <g fill={LIGHT} opacity="0.9">
    {points.map(([x, y, r], index) => (
      <circle key={index} cx={x} cy={y} r={r} />
    ))}
  </g>
);

const HouseWindows = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width="16" height="20" rx="2" fill={BRASS_LIGHT} />
    <rect x={x + 22} y={y} width="16" height="20" rx="2" fill={BRASS_LIGHT} />
    <path d={`M${x + 8} ${y}v20M${x} ${y + 10}h16M${x + 30} ${y}v20M${x + 22} ${y + 10}h16`} stroke={SOFT} strokeWidth="1.2" />
  </g>
);

const BookSpines = ({
  x,
  y,
  colors,
  heights,
}: {
  x: number;
  y: number;
  colors: string[];
  heights: number[];
}) => {
  let offset = 0;
  return (
    <g>
      {colors.map((color, index) => {
        const width = 6 + (index % 3) * 2;
        const height = heights[index % heights.length];
        const rect = (
          <rect
            key={index}
            x={x + offset}
            y={y - height}
            width={width}
            height={height}
            rx="1.4"
            fill={color}
            stroke={SOFT}
            strokeWidth="0.6"
          />
        );
        offset += width + 2;
        return rect;
      })}
    </g>
  );
};

const sceneMorning = (
  <g>
    <rect width="320" height="170" fill="#f1dfb8" />
    <rect x="0" y="112" width="320" height="58" fill="#e3cda3" />
    {/* window */}
    <rect x="176" y="18" width="112" height="86" rx="8" fill="#f7e7c4" stroke={BRASS} strokeWidth="3" />
    <rect x="176" y="18" width="112" height="86" rx="8" fill="url(#story-morning-sky)" opacity="0.85" />
    <circle cx="250" cy="44" r="15" fill={BRASS_LIGHT} />
    <path d="M232 90c10-16 22-18 32-8 8-10 18-8 24 2v14h-56z" fill="#d7bb87" />
    <path d="M232 18v86M176 62h112" stroke={BRASS} strokeWidth="2.4" />
    {/* curtains */}
    <path d="M168 12h14c-6 26-6 62 0 96h-14z" fill={OXBLOOD} opacity="0.85" />
    <path d="M296 12h-14c6 26 6 62 0 96h14z" fill={OXBLOOD} opacity="0.85" />
    {/* table */}
    <rect x="22" y="116" width="150" height="10" rx="4" fill={BRASS} />
    <rect x="38" y="126" width="10" height="34" rx="3" fill="#7c4a0e" />
    <rect x="146" y="126" width="10" height="34" rx="3" fill="#7c4a0e" />
    {/* glass of water */}
    <path d="M62 82h30l-4 34H66z" fill="#f8ecd3" stroke={BRASS} strokeWidth="2" />
    <path d="M66 98h22l-2 18H68z" fill="#e4d2a8" />
    {/* notebook */}
    <rect x="104" y="96" width="52" height="20" rx="3" fill={LIGHT} stroke={EDGE} strokeWidth="2" />
    <path d="M110 102h40M110 108h28" stroke={SOFT} strokeWidth="1.6" strokeLinecap="round" />
    {/* plant */}
    <path d="M150 70c-10-10-8-22 0-28 6 8 6 20 0 28z" fill={OXBLOOD} />
    <path d="M150 70c10-8 12-20 6-28-8 6-10 18-6 28z" fill={BRASS} />
    <path d="M140 72h20l-3 18h-14z" fill={BRASS} stroke={SOFT} strokeWidth="1.4" />
  </g>
);

const scenePark = (
  <g>
    <defs>
      <linearGradient id="story-park-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7e8c5" />
        <stop offset="1" stopColor="#e6cf9f" />
      </linearGradient>
    </defs>
    <rect width="320" height="170" fill="url(#story-park-sky)" />
    <circle cx="262" cy="40" r="20" fill={BRASS_LIGHT} />
    <path d="M0 112c40-22 80-18 120 0 40 16 90 12 130-6 30-12 52-10 70-2v66H0z" fill="#d9c093" />
    <path d="M0 132c60-16 120-8 180 4 50 10 100 6 140-6v40H0z" fill="#c9b38a" />
    {/* trees */}
    <g>
      <rect x="58" y="78" width="10" height="52" rx="4" fill="#7c4a0e" />
      <circle cx="63" cy="66" r="28" fill={BRASS} />
      <circle cx="44" cy="76" r="18" fill="#b8862b" />
      <circle cx="82" cy="78" r="18" fill="#8a5a12" />
    </g>
    <g>
      <rect x="226" y="84" width="8" height="46" rx="3" fill="#7c4a0e" />
      <circle cx="230" cy="74" r="22" fill="#b8862b" />
      <circle cx="214" cy="82" r="14" fill={OXBLOOD} opacity="0.75" />
    </g>
    {/* bench */}
    <rect x="112" y="112" width="96" height="8" rx="3" fill={BRASS} />
    <rect x="118" y="120" width="8" height="26" rx="2" fill="#7c4a0e" />
    <rect x="194" y="120" width="8" height="26" rx="2" fill="#7c4a0e" />
    <path d="M112 104h96" stroke={BRASS} strokeWidth="5" strokeLinecap="round" />
    {/* birds */}
    <path d="M150 46c4-5 8-5 12 0M168 38c4-5 8-5 12 0" stroke={SOFT} strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* path */}
    <path d="M140 170c-6-26 4-38 20-38s26 12 20 38z" fill="#e3cda3" />
  </g>
);

const sceneMarket = (
  <g>
    <rect width="320" height="170" fill="#f3e2ba" />
    <rect y="116" width="320" height="54" fill="#dcc497" />
    {/* stalls */}
    <g>
      <rect x="18" y="70" width="122" height="60" rx="4" fill="#b8862b" />
      <path d="M12 70h134l-10-24H22z" fill={OXBLOOD} />
      <path d="M34 46l-8 24M58 46l-6 24M82 46l-4 24M106 46l-2 24M130 46v24" stroke={LIGHT} strokeWidth="7" opacity="0.85" />
      <rect x="28" y="96" width="102" height="10" rx="3" fill="#7c4a0e" />
      <circle cx="48" cy="92" r="7" fill={OXBLOOD} />
      <circle cx="64" cy="92" r="7" fill={BRASS_LIGHT} />
      <circle cx="80" cy="92" r="7" fill="#c96a24" />
      <circle cx="96" cy="92" r="7" fill={OXBLOOD} />
      <circle cx="112" cy="92" r="7" fill={BRASS_LIGHT} />
    </g>
    <g>
      <rect x="178" y="76" width="124" height="54" rx="4" fill="#a56c18" />
      <path d="M172 76h136l-10-22H182z" fill={BRASS} />
      <path d="M196 54l-8 22M222 54l-6 22M248 54l-4 22M274 54l-2 22M298 54v22" stroke={LIGHT} strokeWidth="7" opacity="0.85" />
      <rect x="188" y="100" width="104" height="10" rx="3" fill="#7c4a0e" />
      <rect x="198" y="84" width="26" height="16" rx="3" fill={LIGHT} stroke={SOFT} strokeWidth="1.2" />
      <rect x="232" y="84" width="26" height="16" rx="3" fill={LIGHT} stroke={SOFT} strokeWidth="1.2" />
      <rect x="266" y="84" width="18" height="16" rx="3" fill={LIGHT} stroke={SOFT} strokeWidth="1.2" />
    </g>
    {/* vendor + buyer silhouettes */}
    <g fill={DEEP}>
      <circle cx="150" cy="82" r="9" />
      <path d="M136 132c0-18 6-28 14-28s14 10 14 28z" />
      <circle cx="170" cy="90" r="7" />
      <path d="M160 132c0-14 4-22 10-22s10 8 10 22z" />
    </g>
    {/* baskets */}
    <path d="M96 140h30l-4 20H100z" fill="#8a5a12" />
    <path d="M100 146h22M102 152h18" stroke={BRASS_LIGHT} strokeWidth="1.6" />
    <circle cx="104" cy="138" r="5" fill={OXBLOOD} />
    <circle cx="114" cy="136" r="5" fill={BRASS_LIGHT} />
    <circle cx="122" cy="139" r="5" fill="#c96a24" />
  </g>
);

const sceneTravel = (
  <g>
    <defs>
      <linearGradient id="story-travel-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6e7c6" />
        <stop offset="1" stopColor="#e2c99a" />
      </linearGradient>
    </defs>
    <rect width="320" height="170" fill="url(#story-travel-sky)" />
    <rect y="118" width="320" height="52" fill="#cdb183" />
    {/* station canopy */}
    <path d="M0 36h320" stroke={BRASS} strokeWidth="6" />
    <path d="M28 36v82M292 36v82" stroke={BRASS} strokeWidth="6" />
    <path d="M0 44h320l-18 12H18z" fill={OXBLOOD} opacity="0.85" />
    {/* clock */}
    <circle cx="160" cy="70" r="17" fill={LIGHT} stroke={BRASS} strokeWidth="3" />
    <path d="M160 60v10l7 5" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* sign */}
    <rect x="206" y="56" width="76" height="26" rx="4" fill={DEEP} />
    <text x="244" y="74" textAnchor="middle" fontSize="12" fontWeight="700" fill={LIGHT} fontFamily="sans-serif">STATION</text>
    {/* train */}
    <rect x="18" y="86" width="126" height="44" rx="8" fill={OXBLOOD} />
    <rect x="30" y="94" width="26" height="18" rx="3" fill={BRASS_LIGHT} />
    <rect x="62" y="94" width="26" height="18" rx="3" fill={BRASS_LIGHT} />
    <rect x="94" y="94" width="26" height="18" rx="3" fill={BRASS_LIGHT} />
    <circle cx="42" cy="134" r="8" fill={DEEP} />
    <circle cx="118" cy="134" r="8" fill={DEEP} />
    <rect x="18" y="120" width="126" height="6" rx="3" fill="#7c271e" />
    {/* suitcase */}
    <rect x="164" y="104" width="40" height="30" rx="5" fill={BRASS} stroke="#7c4a0e" strokeWidth="2" />
    <path d="M174 104v-6h20v6M184 104v30" stroke="#7c4a0e" strokeWidth="2" fill="none" />
    {/* tracks */}
    <path d="M0 148h320M0 160h320" stroke={SOFT} strokeWidth="3" />
    <path d="M14 144v22M46 144v22M78 144v22M110 144v22M142 144v22M174 144v22M206 144v22M238 144v22M270 144v22M302 144v22" stroke="#8a6a3a" strokeWidth="2" />
  </g>
);

const sceneLibrary = (
  <g>
    <rect width="320" height="170" fill="#eddaaf" />
    <rect y="126" width="320" height="44" fill="#d8bd8c" />
    {/* shelves */}
    <rect x="12" y="12" width="128" height="104" rx="4" fill="#8a5a12" />
    <rect x="18" y="18" width="116" height="30" fill="#e3cda3" />
    <rect x="18" y="54" width="116" height="30" fill="#e3cda3" />
    <rect x="18" y="90" width="116" height="20" fill="#e3cda3" />
    <BookSpines x={22} y={46} colors={[OXBLOOD, BRASS, SOFT, '#7c4a0e', BRASS_LIGHT, OXBLOOD]} heights={[24, 20, 26, 18, 22, 24]} />
    <BookSpines x={22} y={82} colors={[BRASS, OXBLOOD, '#8a5a12', SOFT, BRASS_LIGHT]} heights={[22, 26, 18, 24, 20]} />
    <BookSpines x={22} y={108} colors={[SOFT, BRASS_LIGHT, OXBLOOD, BRASS]} heights={[16, 14, 18, 15]} />
    {/* second shelf */}
    <rect x="180" y="12" width="128" height="72" rx="4" fill="#8a5a12" />
    <rect x="186" y="18" width="116" height="28" fill="#e3cda3" />
    <rect x="186" y="52" width="116" height="26" fill="#e3cda3" />
    <BookSpines x={190} y={44} colors={[BRASS, OXBLOOD, SOFT, BRASS_LIGHT, '#7c4a0e']} heights={[22, 18, 24, 20, 26]} />
    <BookSpines x={190} y={76} colors={[OXBLOOD, BRASS_LIGHT, BRASS, SOFT]} heights={[20, 24, 18, 22]} />
    {/* ladder */}
    <path d="M150 30l14 96M166 30l14 96M150 54h18M153 76h18M156 98h18" stroke="#7c4a0e" strokeWidth="4" strokeLinecap="round" />
    {/* table + open book */}
    <rect x="86" y="132" width="150" height="9" rx="3" fill={BRASS} />
    <rect x="100" y="141" width="9" height="26" rx="2" fill="#7c4a0e" />
    <rect x="214" y="141" width="9" height="26" rx="2" fill="#7c4a0e" />
    <path d="M126 132c14-10 28-10 40 0v-18c-12-8-26-8-40 0z" fill={LIGHT} stroke={EDGE} strokeWidth="2" />
    <path d="M166 132c12-10 26-10 40 0v-18c-14-8-28-8-40 0z" fill={LIGHT} stroke={EDGE} strokeWidth="2" />
    <path d="M166 114v18" stroke={EDGE} strokeWidth="2" />
    {/* lamp glow */}
    <circle cx="256" cy="112" r="20" fill={BRASS_LIGHT} opacity="0.35" />
    <path d="M244 112h24l-6-14h-12z" fill={BRASS} />
    <path d="M256 112v18M248 130h16" stroke="#7c4a0e" strokeWidth="3" strokeLinecap="round" />
  </g>
);

const sceneOffice = (
  <g>
    <rect width="320" height="170" fill="#f0ddb4" />
    <rect y="120" width="320" height="50" fill="#dcc497" />
    {/* window */}
    <rect x="196" y="16" width="104" height="76" rx="6" fill="#f8ecd3" stroke={BRASS} strokeWidth="3" />
    <path d="M196 54h104M248 16v76" stroke={BRASS} strokeWidth="2.4" />
    <circle cx="274" cy="34" r="10" fill={BRASS_LIGHT} />
    <path d="M208 84c8-14 20-16 30-6 8-8 18-6 24 4v10h-54z" fill="#d7bb87" />
    {/* desk */}
    <rect x="20" y="108" width="170" height="12" rx="4" fill={BRASS} />
    <rect x="36" y="120" width="10" height="34" rx="3" fill="#7c4a0e" />
    <rect x="164" y="120" width="10" height="34" rx="3" fill="#7c4a0e" />
    {/* laptop */}
    <path d="M62 108V78h64v30z" fill={DEEP} />
    <rect x="68" y="82" width="52" height="22" rx="2" fill="#f4e8cc" />
    <path d="M74 88h30M74 94h22M74 100h34" stroke={BRASS} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M56 108h76l-6 6H62z" fill="#7c4a0e" />
    {/* chair */}
    <path d="M108 118h34v26h-34z" fill={OXBLOOD} opacity="0.85" />
    <path d="M112 144v14M138 144v14" stroke="#7c4a0e" strokeWidth="4" strokeLinecap="round" />
    {/* plant */}
    <path d="M196 96c-8-10-6-22 0-28 6 8 6 20 0 28z" fill={OXBLOOD} />
    <path d="M196 96c8-8 10-20 4-28-6 6-8 18-4 28z" fill={BRASS} />
    <path d="M186 98h20l-3 18h-14z" fill={BRASS} stroke={SOFT} strokeWidth="1.4" />
    {/* framed picture */}
    <rect x="30" y="28" width="52" height="42" rx="3" fill={LIGHT} stroke={BRASS} strokeWidth="3" />
    <path d="M38 62l14-18 10 12 8-8 8 14z" fill={BRASS} opacity="0.7" />
    <circle cx="66" cy="40" r="4" fill={BRASS_LIGHT} />
  </g>
);

const sceneHaunted = (
  <g>
    <defs>
      <linearGradient id="story-haunted-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b2118" />
        <stop offset="0.62" stopColor="#4a3524" />
        <stop offset="1" stopColor="#6b4a2a" />
      </linearGradient>
      <radialGradient id="story-haunted-moon" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fbf0d7" />
        <stop offset="1" stopColor="#d9b25a" />
      </radialGradient>
    </defs>
    <rect width="320" height="170" fill="url(#story-haunted-sky)" />
    <Stars points={[[24, 24, 1.4], [58, 14, 1], [92, 30, 1.2], [128, 16, 1], [170, 26, 1.4], [214, 12, 1], [252, 30, 1.2], [292, 18, 1.4], [304, 44, 1]]} />
    <circle cx="256" cy="40" r="26" fill="url(#story-haunted-moon)" />
    <circle cx="266" cy="34" r="4" fill="#d9b25a" opacity="0.5" />
    <circle cx="250" cy="46" r="5" fill="#d9b25a" opacity="0.4" />
    {/* distant hills */}
    <path d="M0 128c34-14 62-10 92 0 30 10 70 8 100-4 34-14 74-10 128 6v40H0z" fill="#241a12" />
    {/* house */}
    <g>
      <path d="M96 132V70l44-32 44 32v62z" fill="#3a2a1d" stroke="#1f1710" strokeWidth="3" />
      <path d="M88 72l52-38 52 38" fill="none" stroke="#1f1710" strokeWidth="7" strokeLinecap="round" />
      <HouseWindows x={112} y={82} />
      <rect x="130" y="112" width="20" height="20" rx="2" fill={BRASS} />
      <circle cx="145" cy="122" r="1.6" fill={DEEP} />
      <rect x="158" y="44" width="10" height="22" fill="#2b2118" />
      <path d="M96 132h88" stroke="#1f1710" strokeWidth="3" />
    </g>
    {/* bare tree */}
    <path d="M40 136V92m0 12-16-16m16 8 18-20m-18 32-12-10m12 18 16-12" stroke="#1f1710" strokeWidth="6" strokeLinecap="round" fill="none" />
    {/* fence */}
    <path d="M0 140h64M6 128v18M20 126v20M34 128v18M48 126v20M62 128v18" stroke="#1f1710" strokeWidth="4" strokeLinecap="round" />
    {/* pumpkins */}
    <g>
      <ellipse cx="216" cy="142" rx="14" ry="11" fill="#c96a24" stroke="#8d4a12" strokeWidth="2" />
      <path d="M216 131v22M209 133c-4 6-4 14 0 18M223 133c4 6 4 14 0 18" stroke="#8d4a12" strokeWidth="1.6" fill="none" />
      <path d="M216 131c2-5 5-6 8-5" stroke="#4a3524" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="246" cy="148" rx="10" ry="8" fill="#b8862b" stroke="#7c4a0e" strokeWidth="2" />
      <path d="M246 140v16" stroke="#7c4a0e" strokeWidth="1.4" />
    </g>
    {/* mist */}
    <path d="M0 152c40-8 80-8 120 0s80 8 120 0 60-6 80 0v18H0z" fill="#d9c097" opacity="0.16" />
  </g>
);

const sceneClassroom = (
  <g>
    <rect width="320" height="170" fill="#efdcb2" />
    <rect y="122" width="320" height="48" fill="#d8bd8c" />
    {/* chalkboard */}
    <rect x="58" y="16" width="204" height="86" rx="6" fill="#3a2a1d" stroke="#7c4a0e" strokeWidth="6" />
    <path d="M76 40h120M76 56h150M76 72h96M76 88h132" stroke={LIGHT} strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
    <path d="M76 40c8-8 16 8 24 0s16 8 24 0" stroke={BRASS_LIGHT} strokeWidth="2" fill="none" opacity="0.9" />
    {/* apple + chalk tray */}
    <rect x="58" y="102" width="204" height="6" rx="2" fill="#7c4a0e" />
    <circle cx="90" cy="98" r="6" fill={OXBLOOD} />
    <path d="M90 92c2-4 5-5 8-4" stroke="#4a3524" strokeWidth="2" fill="none" strokeLinecap="round" />
    <rect x="110" y="98" width="18" height="4" rx="2" fill={LIGHT} />
    {/* desks */}
    <g>
      <rect x="26" y="120" width="72" height="9" rx="3" fill={BRASS} />
      <rect x="36" y="129" width="7" height="30" rx="2" fill="#7c4a0e" />
      <rect x="82" y="129" width="7" height="30" rx="2" fill="#7c4a0e" />
      <rect x="44" y="110" width="30" height="10" rx="2" fill={LIGHT} stroke={EDGE} strokeWidth="1.6" />
    </g>
    <g>
      <rect x="214" y="120" width="72" height="9" rx="3" fill={BRASS} />
      <rect x="224" y="129" width="7" height="30" rx="2" fill="#7c4a0e" />
      <rect x="270" y="129" width="7" height="30" rx="2" fill="#7c4a0e" />
      <rect x="232" y="110" width="30" height="10" rx="2" fill={LIGHT} stroke={EDGE} strokeWidth="1.6" />
    </g>
    {/* window */}
    <rect x="8" y="30" width="40" height="52" rx="4" fill="#f8ecd3" stroke={BRASS} strokeWidth="3" />
    <path d="M8 56h40M28 30v52" stroke={BRASS} strokeWidth="2" />
    <circle cx="20" cy="42" r="6" fill={BRASS_LIGHT} />
  </g>
);

const SCENES: Record<StorySceneType, React.ReactNode> = {
  morning: sceneMorning,
  park: scenePark,
  market: sceneMarket,
  travel: sceneTravel,
  library: sceneLibrary,
  office: sceneOffice,
  haunted: sceneHaunted,
  classroom: sceneClassroom,
};

interface StorySceneProps {
  scene: StorySceneType;
  className?: string;
}

export const StoryScene = React.memo(function StoryScene({ scene, className }: StorySceneProps) {
  return (
    <svg
      viewBox="0 0 320 170"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="story-morning-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e7c4" />
          <stop offset="1" stopColor="#e6cf9f" />
        </linearGradient>
      </defs>
      {SCENES[scene]}
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/*  Circular character medallion used by the path story nodes.         */
/* ------------------------------------------------------------------ */

const AVATAR_TONES: Record<
  StorySceneType,
  { bg: string; shirt: string; hair: string; skin: string; accent: string }
> = {
  morning: { bg: '#f4e8cc', shirt: '#a56c18', hair: '#4a2f09', skin: '#e8c39a', accent: '#d9b25a' },
  park: { bg: '#e8d9b0', shirt: '#8d2f24', hair: '#2b2118', skin: '#d9a97a', accent: '#a56c18' },
  market: { bg: '#f4e8cc', shirt: '#b8862b', hair: '#3a2a1d', skin: '#e0b088', accent: '#8d2f24' },
  travel: { bg: '#e6d3ae', shirt: '#5b4730', hair: '#2b2118', skin: '#c98f63', accent: '#a56c18' },
  library: { bg: '#ead9b5', shirt: '#8d2f24', hair: '#4a2f09', skin: '#e8c39a', accent: '#a56c18' },
  office: { bg: '#f4e8cc', shirt: '#2b2118', hair: '#3a2a1d', skin: '#c98f63', accent: '#8d2f24' },
  haunted: { bg: '#e6d3ae', shirt: '#3a2a1d', hair: '#2b2118', skin: '#e0b088', accent: '#8d2f24' },
  classroom: { bg: '#f4e8cc', shirt: '#a56c18', hair: '#4a2f09', skin: '#d9a97a', accent: '#2b2118' },
};

interface StoryAvatarProps {
  scene: StorySceneType;
  className?: string;
}

export const StoryAvatar = React.memo(function StoryAvatar({ scene, className }: StoryAvatarProps) {
  const tone = AVATAR_TONES[scene];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill={tone.bg} />
      <circle cx="32" cy="32" r="30" fill="none" stroke={tone.accent} strokeWidth="2" opacity="0.55" />
      <path d="M8 64c2-15 12-22 24-22s22 7 24 22z" fill={tone.shirt} />
      <path d="M27 40h10v8a5 5 0 0 1-10 0z" fill={tone.skin} />
      <circle cx="32" cy="27" r="14" fill={tone.skin} />
      <path
        d="M18 27c0-9 6-15 14-15s14 6 14 15c-2-6-7-9-14-9s-12 3-14 9z"
        fill={tone.hair}
      />
      <circle cx="26.5" cy="27" r="1.7" fill={INK} />
      <circle cx="37.5" cy="27" r="1.7" fill={INK} />
      <path d="M27 33c3 3 7 3 10 0" stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M22 36c2 2 4 3 5 3M42 36c-2 2-4 3-5 3" stroke={tone.accent} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
});
