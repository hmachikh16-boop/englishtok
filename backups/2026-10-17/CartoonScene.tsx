import React from 'react';
import { Character, DialogueLine, SceneType } from '../../types';

interface CartoonSceneProps {
  sceneType: SceneType;
  characterA: Character;
  characterB: Character;
  currentLine: DialogueLine | null;
  isPlaying: boolean;
  onDoubleTap?: (e: React.MouseEvent | React.TouchEvent) => void;
  onSingleTap?: () => void;
}

export const CartoonScene: React.FC<CartoonSceneProps> = ({
  sceneType,
  characterA,
  characterB,
  currentLine,
  isPlaying,
}) => {
  const isASpeaking = currentLine?.speakerId === characterA.id;
  const isBSpeaking = currentLine?.speakerId === characterB.id;

  // Background decoration according to sceneType
  const renderSceneBackground = () => {
    switch (sceneType) {
      case 'cafe':
        return (
          <g id="scene-cafe">
            {/* Wall background gradient */}
            <rect width="100%" height="100%" fill="#18181b" />
            <rect x="0" y="0" width="100%" height="60%" fill="#27272a" opacity="0.6" />
            
            {/* Brick accents */}
            <rect x="30" y="80" width="60" height="18" rx="3" fill="#3f3f46" opacity="0.4" />
            <rect x="100" y="80" width="70" height="18" rx="3" fill="#3f3f46" opacity="0.3" />
            <rect x="60" y="105" width="80" height="18" rx="3" fill="#3f3f46" opacity="0.35" />
            <rect x="320" y="90" width="75" height="18" rx="3" fill="#3f3f46" opacity="0.35" />
            <rect x="280" y="115" width="85" height="18" rx="3" fill="#3f3f46" opacity="0.4" />

            {/* Menu chalkboard */}
            <rect x="130" y="55" width="160" height="70" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <text x="210" y="78" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">☕ BEAN & BREW</text>
            <text x="210" y="95" textAnchor="middle" fill="#94a3b8" fontSize="9">Latte · Cappuccino · Muffins</text>
            <text x="210" y="110" textAnchor="middle" fill="#facc15" fontSize="8">Freshly Ground Everyday</text>

            {/* Hanging warm pendant lamps */}
            <line x1="80" y1="0" x2="80" y2="45" stroke="#71717a" strokeWidth="2" />
            <ellipse cx="80" cy="45" rx="14" ry="7" fill="#fbbf24" opacity="0.9" />
            <circle cx="80" cy="47" r="4" fill="#fff" />
            <circle cx="80" cy="48" r="32" fill="#fbbf24" opacity="0.12" />

            <line x1="340" y1="0" x2="340" y2="45" stroke="#71717a" strokeWidth="2" />
            <ellipse cx="340" cy="45" rx="14" ry="7" fill="#fbbf24" opacity="0.9" />
            <circle cx="340" cy="47" r="4" fill="#fff" />
            <circle cx="340" cy="48" r="32" fill="#fbbf24" opacity="0.12" />

            {/* Coffee Counter */}
            <rect x="0" y="440" width="100%" height="280" fill="#292524" />
            <rect x="0" y="440" width="100%" height="16" fill="#78350f" />
            
            {/* Espresso machine */}
            <rect x="30" y="380" width="90" height="60" rx="6" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
            <rect x="42" y="392" width="66" height="24" rx="3" fill="#0f172a" />
            <circle cx="56" cy="404" r="5" fill="#22c55e" />
            <circle cx="74" cy="404" r="5" fill="#0ea5e9" />
            <circle cx="92" cy="404" r="5" fill="#f59e0b" />
            {/* Coffee steam */}
            <path d="M70,375 Q68,360 74,350 Q80,340 76,330" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M84,375 Q88,362 82,352 Q76,342 80,332" fill="none" stroke="#e2e8f0" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />

            {/* Coffee cup on counter */}
            <rect x="180" y="415" width="22" height="25" rx="3" fill="#f8fafc" />
            <path d="M202,420 Q208,427 202,434" fill="none" stroke="#f8fafc" strokeWidth="3" />
            <ellipse cx="191" cy="415" rx="11" ry="3" fill="#78350f" />
          </g>
        );

      case 'airport':
        return (
          <g id="scene-airport">
            <rect width="100%" height="100%" fill="#090d16" />
            {/* Terminal panoramic glass wall with plane in sky */}
            <rect x="20" y="40" width="380" height="200" rx="12" fill="#0369a1" opacity="0.25" stroke="#1e293b" strokeWidth="3" />
            {/* Clouds */}
            <ellipse cx="90" cy="100" rx="35" ry="14" fill="#38bdf8" opacity="0.15" />
            <ellipse cx="280" cy="80" rx="45" ry="18" fill="#38bdf8" opacity="0.12" />
            {/* Distant Airplane */}
            <path d="M220,110 L255,102 L275,104 L260,112 L245,113 L235,122 L230,121 L235,113 Z" fill="#93c5fd" opacity="0.75" />
            
            {/* Flight Departures Board */}
            <rect x="70" y="255" width="280" height="75" rx="8" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="85" y="278" fill="#60a5fa" fontSize="11" fontWeight="bold">FLIGHT DEPARTURES</text>
            <text x="85" y="296" fill="#fde047" fontSize="10">BA 142 London Heathrow · ON TIME</text>
            <text x="85" y="312" fill="#4ade80" fontSize="10">GATE B12 · BOARDING 10:30</text>
            
            {/* Floor and Check-in Counter */}
            <rect x="0" y="450" width="100%" height="270" fill="#1e293b" />
            <rect x="0" y="450" width="100%" height="12" fill="#3b82f6" opacity="0.8" />
            {/* Baggage scale */}
            <rect x="35" y="430" width="70" height="20" rx="4" fill="#475569" />
            <rect x="45" y="418" width="50" height="12" rx="2" fill="#0f172a" />
            <text x="70" y="427" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">20.0 KG</text>
          </g>
        );

      case 'office':
        return (
          <g id="scene-office">
            <rect width="100%" height="100%" fill="#0f172a" />
            {/* Modern glass partition and whiteboards */}
            <rect x="40" y="50" width="340" height="220" rx="10" fill="#1e293b" opacity="0.5" stroke="#334155" strokeWidth="2" />
            {/* Whiteboard with sprint diagrams */}
            <rect x="60" y="70" width="130" height="90" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1" />
            <text x="70" y="90" fill="#38bdf8" fontSize="10" fontWeight="bold">🚀 SPRINT GOALS</text>
            <line x1="70" y1="105" x2="160" y2="105" stroke="#22c55e" strokeWidth="2" />
            <line x1="70" y1="120" x2="140" y2="120" stroke="#f59e0b" strokeWidth="2" />
            <line x1="70" y1="135" x2="175" y2="135" stroke="#a855f7" strokeWidth="2" />

            {/* Motivational Poster */}
            <rect x="240" y="70" width="100" height="110" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
            <text x="290" y="105" textAnchor="middle" fill="#c7d2fe" fontSize="10" fontWeight="bold">INNOVATE</text>
            <text x="290" y="125" textAnchor="middle" fill="#818cf8" fontSize="8">& ELEVATE</text>

            {/* Modern Office Desk */}
            <rect x="0" y="445" width="100%" height="275" fill="#1e293b" />
            <rect x="0" y="445" width="100%" height="14" fill="#0ea5e9" opacity="0.6" />
            {/* Laptop on desk */}
            <polygon points="170,442 220,442 215,422 175,422" fill="#64748b" />
            <rect x="178" y="405" width="34" height="20" rx="2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            <rect x="180" y="407" width="30" height="16" fill="#38bdf8" opacity="0.8" />
          </g>
        );

      case 'shop':
        return (
          <g id="scene-shop">
            <rect width="100%" height="100%" fill="#18181b" />
            <rect x="30" y="60" width="360" height="180" rx="10" fill="#27272a" opacity="0.6" />
            {/* Boutique banner */}
            <text x="210" y="95" textAnchor="middle" fill="#fb7185" fontSize="14" fontWeight="bold">URBAN ATELIER</text>
            <text x="210" y="112" textAnchor="middle" fill="#fda4af" fontSize="9">AUTUMN COLLECTION · 20% OFF</text>
            
            {/* Clothes rack on the wall */}
            <line x1="60" y1="150" x2="360" y2="150" stroke="#71717a" strokeWidth="3" />
            {/* Hanging shirts */}
            <path d="M80,150 L70,190 L100,190 L90,150 Z" fill="#3b82f6" />
            <path d="M120,150 L110,195 L140,195 L130,150 Z" fill="#ec4899" />
            <path d="M160,150 L150,190 L180,190 L170,150 Z" fill="#10b981" />
            <path d="M250,150 L240,195 L270,195 L260,150 Z" fill="#f59e0b" />
            <path d="M290,150 L280,190 L310,190 L300,150 Z" fill="#8b5cf6" />

            {/* Shop counter and fitting room sign */}
            <rect x="0" y="445" width="100%" height="275" fill="#27272a" />
            <rect x="0" y="445" width="100%" height="14" fill="#f43f5e" opacity="0.7" />
            <rect x="280" y="220" width="100" height="40" rx="6" fill="#111827" stroke="#e11d48" strokeWidth="1.5" />
            <text x="330" y="244" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="bold">FITTING ROOMS ➔</text>
          </g>
        );

      case 'clinic':
        return (
          <g id="scene-clinic">
            <rect width="100%" height="100%" fill="#042f2e" />
            <rect x="30" y="50" width="360" height="200" rx="10" fill="#134e4a" opacity="0.5" />
            {/* Medical cross symbol */}
            <circle cx="210" cy="110" r="32" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2" />
            <rect x="203" y="90" width="14" height="40" rx="2" fill="#ffffff" />
            <rect x="190" y="103" width="40" height="14" rx="2" fill="#ffffff" />
            
            {/* Eye chart */}
            <rect x="60" y="80" width="60" height="90" rx="4" fill="#f8fafc" />
            <text x="90" y="105" textAnchor="middle" fill="#0f172a" fontSize="16" fontWeight="bold">E</text>
            <text x="90" y="125" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">F P</text>
            <text x="90" y="142" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">T O Z</text>
            <text x="90" y="156" textAnchor="middle" fill="#0f172a" fontSize="6">L P E D</text>

            {/* Clinic Counter */}
            <rect x="0" y="445" width="100%" height="275" fill="#115e59" />
            <rect x="0" y="445" width="100%" height="14" fill="#2dd4bf" />
            {/* Stethoscope icon */}
            <circle cx="180" cy="425" r="7" fill="#64748b" />
            <path d="M180,432 C180,442 205,442 205,432" fill="none" stroke="#64748b" strokeWidth="3" />
          </g>
        );

      default: // street & park
        return (
          <g id="scene-street">
            <rect width="100%" height="100%" fill="#090d16" />
            {/* Sky gradient and city skyline */}
            <rect x="0" y="0" width="100%" height="320" fill="#0c4a6e" opacity="0.3" />
            {/* Distant building silhouettes */}
            <rect x="30" y="100" width="45" height="150" fill="#1e293b" opacity="0.8" />
            <rect x="85" y="70" width="55" height="180" fill="#0f172a" />
            <rect x="150" y="120" width="40" height="130" fill="#1e293b" opacity="0.8" />
            <rect x="200" y="85" width="70" height="165" fill="#0f172a" />
            <rect x="280" y="110" width="50" height="140" fill="#1e293b" opacity="0.8" />
            <rect x="340" y="65" width="50" height="185" fill="#0f172a" />
            {/* Lit windows in buildings */}
            <circle cx="105" cy="100" r="3" fill="#fef08a" opacity="0.9" />
            <circle cx="120" cy="130" r="3" fill="#fef08a" opacity="0.8" />
            <circle cx="225" cy="115" r="3" fill="#fef08a" opacity="0.9" />
            <circle cx="250" cy="140" r="3" fill="#fef08a" opacity="0.8" />

            {/* Street lamp */}
            <line x1="60" y1="180" x2="60" y2="445" stroke="#475569" strokeWidth="4" />
            <path d="M60,180 Q80,170 85,185" fill="none" stroke="#475569" strokeWidth="3" />
            <ellipse cx="85" cy="188" rx="8" ry="4" fill="#facc15" />
            <circle cx="85" cy="190" r="30" fill="#facc15" opacity="0.12" />

            {/* Pavement */}
            <rect x="0" y="445" width="100%" height="275" fill="#1c1917" />
            <rect x="0" y="445" width="100%" height="14" fill="#44403c" />
          </g>
        );
    }
  };

  // Helper to render an animated character
  const renderCharacter = (
    char: Character,
    isSpeaking: boolean,
    side: 'left' | 'right'
  ) => {
    const xBase = side === 'left' ? 100 : 310;
    const yBase = 390;

    return (
      <g
        id={`char-${char.id}`}
        className={`transition-all duration-300 ${
          isSpeaking && isPlaying ? 'animate-character-speaking' : ''
        }`}
        opacity={isSpeaking ? 1 : 0.88}
        transform={`scale(${isSpeaking ? 1.03 : 0.97})`}
        transform-origin={`${xBase}px ${yBase}px`}
      >
        {/* Active speaker glow ring on ground */}
        {isSpeaking && (
          <ellipse
            cx={xBase}
            cy={yBase + 45}
            rx="46"
            ry="12"
            fill="#38bdf8"
            opacity="0.25"
          />
        )}

        {/* Character Body / Clothes */}
        <path
          d={`M${xBase - 36},${yBase + 40} C${xBase - 36},${yBase - 35} ${xBase - 25},${yBase - 55} ${xBase},${yBase - 55} C${xBase + 25},${yBase - 55} ${xBase + 36},${yBase - 35} ${xBase + 36},${yBase + 40} Z`}
          fill={char.shirtColor}
        />
        
        {/* Collar / Necktie */}
        <polygon
          points={`${xBase - 8},${yBase - 55} ${xBase + 8},${yBase - 55} ${xBase},${yBase - 42}`}
          fill="#ffffff"
          opacity="0.9"
        />

        {/* Neck */}
        <rect
          x={xBase - 9}
          y={yBase - 72}
          width="18"
          height="20"
          rx="4"
          fill={char.skinTone}
        />

        {/* Head */}
        <circle
          cx={xBase}
          cy={yBase - 96}
          r="38"
          fill={char.skinTone}
          stroke="#000000"
          strokeWidth="1.5"
          strokeOpacity="0.1"
        />

        {/* Hair Styles */}
        {char.hairStyle === 'ponytail' && (
          <g>
            <path
              d={`M${xBase - 40},${yBase - 105} C${xBase - 40},${yBase - 142} ${xBase + 40},${yBase - 142} ${xBase + 40},${yBase - 105} C${xBase + 20},${yBase - 110} ${xBase - 20},${yBase - 110} ${xBase - 40},${yBase - 105} Z`}
              fill={char.hairColor}
            />
            {/* Ponytail extension */}
            <path
              d={`M${side === 'left' ? xBase - 34 : xBase + 34},${yBase - 110} Q${side === 'left' ? xBase - 55 : xBase + 55},${yBase - 70} ${side === 'left' ? xBase - 40 : xBase + 40},${yBase - 40}`}
              fill="none"
              stroke={char.hairColor}
              strokeWidth="14"
              strokeLinecap="round"
            />
          </g>
        )}

        {char.hairStyle === 'curly' && (
          <g fill={char.hairColor}>
            <circle cx={xBase - 30} cy={yBase - 115} r="16" />
            <circle cx={xBase} cy={yBase - 130} r="18" />
            <circle cx={xBase + 30} cy={yBase - 115} r="16" />
            <circle cx={xBase - 35} cy={yBase - 95} r="14" />
            <circle cx={xBase + 35} cy={yBase - 95} r="14" />
          </g>
        )}

        {char.hairStyle === 'spiky' && (
          <path
            d={`M${xBase - 38},${yBase - 105} L${xBase - 30},${yBase - 135} L${xBase - 15},${yBase - 120} L${xBase},${yBase - 142} L${xBase + 18},${yBase - 122} L${xBase + 34},${yBase - 135} L${xBase + 38},${yBase - 105} Z`}
            fill={char.hairColor}
          />
        )}

        {(char.hairStyle === 'short' || char.hairStyle === 'glasses') && (
          <path
            d={`M${xBase - 40},${yBase - 105} C${xBase - 40},${yBase - 138} ${xBase + 40},${yBase - 138} ${xBase + 40},${yBase - 105} C${xBase + 25},${yBase - 115} ${xBase - 25},${yBase - 115} ${xBase - 40},${yBase - 105} Z`}
            fill={char.hairColor}
          />
        )}

        {/* Eyebrows */}
        <line
          x1={xBase - 22}
          y1={yBase - 108}
          x2={xBase - 8}
          y2={isSpeaking ? yBase - 112 : yBase - 108}
          stroke={char.hairColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1={xBase + 8}
          y1={isSpeaking ? yBase - 112 : yBase - 108}
          x2={xBase + 22}
          y2={yBase - 108}
          stroke={char.hairColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Eyes with pupils and catchlight */}
        <circle cx={xBase - 15} cy={yBase - 98} r="6" fill="#ffffff" />
        <circle cx={xBase - 14} cy={yBase - 98} r="3.5" fill="#0f172a" />
        <circle cx={xBase - 15} cy={yBase - 100} r="1.2" fill="#ffffff" />

        <circle cx={xBase + 15} cy={yBase - 98} r="6" fill="#ffffff" />
        <circle cx={xBase + 16} cy={yBase - 98} r="3.5" fill="#0f172a" />
        <circle cx={xBase + 15} cy={yBase - 100} r="1.2" fill="#ffffff" />

        {/* Glasses if applicable */}
        {char.hairStyle === 'glasses' && (
          <g stroke="#38bdf8" strokeWidth="2" fill="none">
            <rect x={xBase - 24} y={yBase - 105} width="18" height="14" rx="4" />
            <rect x={xBase + 6} y={yBase - 105} width="18" height="14" rx="4" />
            <line x1={xBase - 6} y1={yBase - 98} x2={xBase + 6} y2={yBase - 98} />
          </g>
        )}

        {/* Cute blush cheeks */}
        <circle cx={xBase - 24} cy={yBase - 88} r="6" fill="#f43f5e" opacity="0.3" />
        <circle cx={xBase + 24} cy={yBase - 88} r="6" fill="#f43f5e" opacity="0.3" />

        {/* Animated Mouth */}
        {isSpeaking && isPlaying ? (
          // Animated mouth while speaking
          <g transform={`translate(${xBase}, ${yBase - 80})`}>
            <ellipse
              cx="0"
              cy="0"
              rx="9"
              ry="7"
              fill="#991b1b"
              className="animate-mouth"
            />
            {/* Teeth & tongue */}
            <rect x="-6" y="-5" width="12" height="3" rx="1.5" fill="#ffffff" />
            <ellipse cx="0" cy="4" rx="5" ry="3" fill="#f43f5e" />
          </g>
        ) : (
          // Relaxed pleasant smile when listening
          <path
            d={`M${xBase - 8},${yBase - 80} Q${xBase},${yBase - 72} ${xBase + 8},${yBase - 80}`}
            fill="none"
            stroke="#78350f"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Name tag on character */}
        <g transform={`translate(${xBase}, ${yBase + 58})`}>
          <rect
            x="-35"
            y="-10"
            width="70"
            height="20"
            rx="10"
            fill="#090d16"
            opacity="0.85"
            stroke={isSpeaking ? '#38bdf8' : '#334155'}
            strokeWidth={isSpeaking ? '1.5' : '1'}
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill={isSpeaking ? '#38bdf8' : '#cbd5e1'}
            fontSize="10"
            fontWeight="bold"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {char.name}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* Cartoon SVG Scene */}
      <svg
        viewBox="0 0 420 740"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.95" />
          </linearGradient>
          <filter id="bubbleShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Scene Background */}
        {renderSceneBackground()}

        {/* Character A (Left) */}
        {renderCharacter(characterA, isASpeaking, 'left')}

        {/* Character B (Right) */}
        {renderCharacter(characterB, isBSpeaking, 'right')}

        {/* Cartoon Speech Bubble pointing to the active speaker */}
        {currentLine && (
          <g
            id="speech-bubble"
            filter="url(#bubbleShadow)"
            className="transition-all duration-300"
          >
            {/* Bubble Tail pointing to the speaker */}
            {isASpeaking ? (
              <polygon
                points="110,210 135,210 100,240"
                fill="#ffffff"
              />
            ) : (
              <polygon
                points="310,210 285,210 320,240"
                fill="#ffffff"
              />
            )}

            {/* Bubble Card */}
            <rect
              x="20"
              y="115"
              width="380"
              height="95"
              rx="18"
              fill="url(#bubbleGrad)"
              stroke="#38bdf8"
              strokeWidth="2"
            />

            {/* Speaker mini tag in speech bubble */}
            <rect
              x="35"
              y="102"
              width="80"
              height="20"
              rx="10"
              fill={isASpeaking ? characterA.shirtColor : characterB.shirtColor}
            />
            <text
              x="75"
              y="116"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {isASpeaking ? characterA.name : characterB.name}
            </text>

            {/* Animated Audio Wave Indicator inside speech bubble */}
            {isPlaying && (
              <g transform="translate(350, 114)">
                <line x1="0" y1="-4" x2="0" y2="4" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                <line x1="6" y1="-8" x2="6" y2="8" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="12" y1="-5" x2="12" y2="5" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
              </g>
            )}

            {/* English Sentence in cartoon bubble */}
            <foreignObject x="35" y="128" width="350" height="72">
              <div
                dir="ltr"
                className="w-full h-full flex items-center justify-start text-left"
              >
                <p className="text-slate-900 font-bold text-sm sm:text-base leading-snug line-clamp-3 font-en">
                  {currentLine.textEn}
                </p>
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
};
