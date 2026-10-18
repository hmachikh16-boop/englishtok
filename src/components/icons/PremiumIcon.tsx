import React from 'react';

export type PremiumIconName =
  | 'lesson'
  | 'categories'
  | 'vocabulary'
  | 'progress'
  | 'settings'
  | 'listening'
  | 'streak'
  | 'trophy'
  | 'target'
  | 'coffee'
  | 'crown'
  | 'award';

interface PremiumIconProps {
  name: PremiumIconName;
  size?: number;
  className?: string;
}

const iconGradients: Record<PremiumIconName, string> = {
  lesson: 'linear-gradient(145deg, #a5f3fc 0%, #38bdf8 45%, #0369a1 100%)',
  categories: 'linear-gradient(145deg, #ddd6fe 0%, #a78bfa 45%, #6d28d9 100%)',
  vocabulary: 'linear-gradient(145deg, #bbf7d0 0%, #34d399 45%, #047857 100%)',
  progress: 'linear-gradient(145deg, #fecaca 0%, #fb7185 45%, #be123c 100%)',
  settings: 'linear-gradient(145deg, #cbd5e1 0%, #64748b 48%, #334155 100%)',
  listening: 'linear-gradient(145deg, #ddd6fe 0%, #a78bfa 45%, #6d28d9 100%)',
  streak: 'linear-gradient(145deg, #fef3c7 0%, #fbbf24 45%, #d97706 100%)',
  trophy: 'linear-gradient(145deg, #fef3c7 0%, #fbbf24 45%, #d97706 100%)',
  target: 'linear-gradient(145deg, #ffe4e6 0%, #fb7185 45%, #be123c 100%)',
  coffee: 'linear-gradient(145deg, #fed7aa 0%, #fb923c 45%, #c2410c 100%)',
  crown: 'linear-gradient(145deg, #fef3c7 0%, #fbbf24 45%, #b45309 100%)',
  award: 'linear-gradient(145deg, #a5f3fc 0%, #38bdf8 45%, #0369a1 100%)',
};

const iconArtwork: Record<PremiumIconName, React.ReactNode> = {
  lesson: (
    <>
      <path d="M11 24c7-4 14-3 21 2 7-5 14-6 21-2v25c-7-4-14-3-21 2-7-5-14-6-21-2z" fill="#f8fafc" stroke="#dbeafe" strokeWidth="2" />
      <path d="M32 26v25M17 32c4-2 7-2 10-1m11 0c3-1 6-1 10 1M17 39c4-2 7-2 10-1m11 0c3-1 6-1 10 1" fill="none" stroke="#38bdf8" strokeLinecap="round" strokeWidth="2" />
      <path d="M40 15c4-5 13-3 14 3 1 5-3 8-8 8l-5 3 1-5c-4-2-5-6-2-9z" fill="#fff" stroke="#bae6fd" strokeWidth="1.5" />
      <circle cx="44" cy="19" r="1" fill="#0284c7" /><circle cx="48" cy="19" r="1" fill="#0284c7" /><circle cx="52" cy="19" r="1" fill="#0284c7" />
    </>
  ),
  categories: (
    <>
      <circle cx="32" cy="32" r="20" fill="#f8fafc" fillOpacity=".96" />
      <circle cx="32" cy="32" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3" />
      <path d="m39 23-5 12-12 6 5-12z" fill="#6d28d9" stroke="#4c1d95" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="2.5" fill="#fff" />
      <path d="M32 9v5m0 36v5M9 32h5m36 0h5" stroke="#ede9fe" strokeLinecap="round" strokeWidth="2.5" />
    </>
  ),
  vocabulary: (
    <>
      <g transform="rotate(-8 32 32)">
        <rect x="16" y="13" width="32" height="40" rx="5" fill="#f8fafc" stroke="#d1fae5" strokeWidth="2" />
        <path d="M21 21h21M21 26h14" stroke="#94a3b8" strokeLinecap="round" strokeWidth="2" />
        <text x="32" y="43" textAnchor="middle" fill="#047857" fontSize="20" fontWeight="900">A</text>
        <path d="M24 48h16" stroke="#34d399" strokeLinecap="round" strokeWidth="2" />
      </g>
      <circle cx="48" cy="16" r="9" fill="#fef3c7" stroke="#fbbf24" strokeWidth="2" />
      <path d="M48 11v10m-5-5h10" stroke="#b45309" strokeLinecap="round" strokeWidth="2" />
    </>
  ),
  progress: (
    <>
      <circle cx="30" cy="34" r="20" fill="#fff7ed" />
      <circle cx="30" cy="34" r="13" fill="#fb7185" />
      <circle cx="30" cy="34" r="6" fill="#fff7ed" />
      <circle cx="30" cy="34" r="2.5" fill="#be123c" />
      <path d="m29 35 20-22" stroke="#78350f" strokeLinecap="round" strokeWidth="3.5" />
      <path d="m45 12 9-3-3 9z" fill="#fef3c7" stroke="#b45309" strokeLinejoin="round" strokeWidth="1.5" />
    </>
  ),
  settings: (
    <>
      <path d="m28 12 8 0 2 6 5 2 5-3 6 6-3 5 2 5 6 2v8l-6 2-2 5 3 5-6 6-5-3-5 2-2 6h-8l-2-6-5-2-5 3-6-6 3-5-2-5-6-2v-8l6-2 2-5-3-5 6-6 5 3 5-2z" fill="#f8fafc" stroke="#e2e8f0" strokeLinejoin="round" strokeWidth="1.5" transform="translate(-2 -3) scale(1.05)" />
      <circle cx="32" cy="32" r="10" fill="#475569" stroke="#cbd5e1" strokeWidth="3" />
      <circle cx="32" cy="32" r="4" fill="#f8fafc" />
    </>
  ),
  listening: (
    <>
      <path d="M14 34v-4a18 18 0 0 1 36 0v4" fill="none" stroke="#f8fafc" strokeLinecap="round" strokeWidth="6" />
      <rect x="11" y="31" width="10" height="17" rx="5" fill="#312e81" stroke="#ede9fe" strokeWidth="2" />
      <rect x="43" y="31" width="10" height="17" rx="5" fill="#312e81" stroke="#ede9fe" strokeWidth="2" />
      <path d="M45 47c-2 5-7 7-13 7" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.5" />
      <circle cx="30" cy="54" r="3" fill="#fff" />
    </>
  ),
  streak: (
    <>
      <path d="M33 10c10 9 12 16 8 24 6-3 10-1 11 7 2 12-8 18-20 18-13 0-22-8-20-19 1-6 4-10 9-14-1 7 2 10 6 11-3-10 0-19 6-27z" fill="#fff7ed" />
      <path d="M34 30c6 5 7 9 4 13 4-2 7 1 7 5 0 5-4 8-10 8-7 0-11-4-10-9 0-3 2-6 5-8 0 4 2 5 4 5-2-5-1-10 0-14z" fill="#f97316" />
      <path d="M34 43c3 3 3 6 1 9-3 2-6 0-5-3 0-2 1-4 4-6z" fill="#fbbf24" />
    </>
  ),
  trophy: (
    <>
      <path d="M22 14h20v9c0 11-4 17-10 17s-10-6-10-17z" fill="#fff7ed" stroke="#fef3c7" strokeWidth="2" />
      <path d="M22 19h-8v4c0 7 4 11 11 11m17-15h8v4c0 7-4 11-11 11" fill="none" stroke="#fff7ed" strokeLinecap="round" strokeWidth="4" />
      <path d="M32 40v8m-9 5h18m-15-5h12" fill="none" stroke="#fff7ed" strokeLinecap="round" strokeWidth="4" />
      <path d="m32 18 2 5 5 .3-4 3 1.5 5-4.5-2.8-4.5 2.8 1.5-5-4-3 5-.3z" fill="#fbbf24" />
    </>
  ),
  target: (
    <>
      <circle cx="31" cy="34" r="20" fill="#fff7ed" />
      <circle cx="31" cy="34" r="14" fill="#fb7185" />
      <circle cx="31" cy="34" r="7" fill="#fff7ed" />
      <path d="m31 34 19-21" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="3.5" />
      <path d="m46 10 8-2-2 8z" fill="#fef3c7" stroke="#b45309" strokeLinejoin="round" strokeWidth="1.5" />
    </>
  ),
  coffee: (
    <>
      <path d="M17 25h27v16a10 10 0 0 1-10 10h-7a10 10 0 0 1-10-10z" fill="#fff7ed" stroke="#ffedd5" strokeWidth="2" />
      <path d="M44 29h3a6 6 0 0 1 0 12h-4" fill="none" stroke="#fff7ed" strokeWidth="4" />
      <path d="M24 18c-3-4 3-5 0-9m10 9c-3-4 3-5 0-9" fill="none" stroke="#fff7ed" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M16 52h33" stroke="#7c2d12" strokeLinecap="round" strokeWidth="3" />
    </>
  ),
  crown: (
    <>
      <path d="m14 24 11 8 7-17 7 17 11-8-4 24H18z" fill="#fff7ed" stroke="#fef3c7" strokeLinejoin="round" strokeWidth="2" />
      <path d="M20 42h24" stroke="#fbbf24" strokeLinecap="round" strokeWidth="3" />
      <circle cx="14" cy="22" r="4" fill="#fff" /><circle cx="32" cy="14" r="4" fill="#fff" /><circle cx="50" cy="22" r="4" fill="#fff" />
    </>
  ),
  award: (
    <>
      <circle cx="32" cy="28" r="17" fill="#fff7ed" stroke="#dbeafe" strokeWidth="2" />
      <path d="m32 17 3.5 7 8 1.2-5.8 5.6 1.4 8-7.1-3.8-7.1 3.8 1.4-8-5.8-5.6 8-1.2z" fill="#38bdf8" />
      <path d="m22 42-2 13 12-6 12 6-2-13" fill="#bae6fd" stroke="#e0f2fe" strokeLinejoin="round" strokeWidth="2" />
    </>
  ),
};

export const PremiumIcon: React.FC<PremiumIconProps> = ({
  name,
  size = 40,
  className = '',
}) => (
  <span
    aria-hidden="true"
    className={`relative inline-flex shrink-0 items-center justify-center rounded-full border border-white/35 shadow-lg shadow-slate-950/35 ${className}`}
    style={{ width: size, height: size, background: iconGradients[name] }}
  >
    <span className="pointer-events-none absolute inset-[2px] rounded-full bg-[radial-gradient(ellipse_at_28%_20%,rgba(255,255,255,0.68),rgba(255,255,255,0.12)_45%,transparent_72%)]" />
    <svg
      viewBox="0 0 64 64"
      className="relative z-10 h-[82%] w-[82%] drop-shadow-[0_2px_2px_rgba(15,23,42,0.28)]"
      fill="none"
    >
      {iconArtwork[name]}
    </svg>
  </span>
);
