import React from 'react';

export type BuddyMood = 'happy' | 'thinking' | 'oops';

interface LearningBuddyProps {
  mood?: BuddyMood;
  message?: string;
  compact?: boolean;
}

/** An original word-scout mascot drawn in SVG so it works offline. */
export const LearningBuddy: React.FC<LearningBuddyProps> = ({ mood = 'happy', message, compact = false }) => (
  <div className={`learning-buddy ${compact ? 'learning-buddy-compact' : ''} buddy-${mood}`} aria-live="polite">
    <svg className="buddy-art" viewBox="0 0 112 112" role="img" aria-label="لومي، رفيق التعلّم">
      <path d="M55 16V9" stroke="#bef264" strokeWidth="5" strokeLinecap="round" /><circle cx="55" cy="7" r="5" fill="#bef264" />
      <path d="M19 54c0-21 14-36 36-36s38 15 38 36v18c0 19-14 32-38 32S19 91 19 72V54Z" fill="#5eead4" stroke="#ccfbf1" strokeWidth="4" />
      <path d="M13 57c-7-4-9-10-5-14 5-5 13-2 18 4" fill="#fbbf24" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" /><path d="M94 57c7-4 9-10 5-14-5-5-13-2-18 4" fill="#fbbf24" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="42" cy="59" rx="5" ry={mood === 'oops' ? 7 : 6} fill="#102a38" /><ellipse cx="69" cy="59" rx="5" ry={mood === 'oops' ? 7 : 6} fill="#102a38" />
      {mood === 'thinking' && <path d="M35 48l10-2M66 46l10 2" stroke="#102a38" strokeWidth="3" strokeLinecap="round" />}
      {mood === 'oops' ? <ellipse cx="55" cy="77" rx="5" ry="7" fill="#102a38" /> : <path d={mood === 'thinking' ? 'M49 78q6-5 12 0' : 'M44 75q11 13 22 0'} fill="none" stroke="#102a38" strokeWidth="3.5" strokeLinecap="round" />}
      <path d="M38 96l-4 9m38-9 4 9" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
      {mood === 'happy' && <path d="m91 21 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#bef264" />}
    </svg>
    {message && <span className="buddy-bubble">{message}</span>}
  </div>
);
