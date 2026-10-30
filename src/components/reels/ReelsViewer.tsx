import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Play, Volume2, X } from 'lucide-react';
import { EDUCATIONAL_STORIES } from '../../data/stories';
import { speechService } from '../../services/speechService';
import { UserProfile } from '../../types';
import './reels.css';

interface ReelsViewerProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export const ReelsViewer: React.FC<ReelsViewerProps> = ({ userProfile, onClose }) => {
  const [mode, setMode] = useState<'video' | 'story'>('video');
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const reel = EDUCATIONAL_STORIES[index];
  const searchQuery = userProfile.targetLanguage === 'fr'
    ? 'French English conversation dialogue story for learners'
    : 'English conversation dialogue story for learners';

  const playReel = useCallback(() => {
    if (!reel) return;
    const text = userProfile.targetLanguage === 'fr' ? reel.textFr : reel.textEn;
    speechService.speakText({
      source: 'reels',
      text,
      rate: 0.88,
      gender: 'female',
      accent: userProfile.targetLanguage ?? 'en',
    });
  }, [reel, userProfile.targetLanguage]);

  useEffect(() => {
    const timer = window.setTimeout(() => playReel(), 400);
    return () => window.clearTimeout(timer);
  }, [index, playReel]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') setIndex((value) => Math.min(EDUCATIONAL_STORIES.length - 1, value + 1));
      if (event.key === 'ArrowUp') setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!reel) return null;

  const text = userProfile.targetLanguage === 'fr' ? reel.textFr : reel.textEn;

  return (
    <div className="reels-overlay" role="dialog" aria-modal="true" aria-label="ريلز تعليمية">
      <div className="reels-shell">
        <button type="button" className="reels-close" onClick={onClose} aria-label="إغلاق">
          <X />
        </button>
        <div className="reels-mode-switch" role="tablist" aria-label="وضع Reels">
          <button type="button" className={mode === 'video' ? 'is-active' : ''} onClick={() => setMode('video')}>فيديو</button>
          <button type="button" className={mode === 'story' ? 'is-active' : ''} onClick={() => setMode('story')}>قصص</button>
        </div>

        {mode === 'video' ? (
          <div className="reels-video-wrap">
            <p className="reels-kicker">Reels • فيديو (YouTube)</p>
            <div className="reels-video-frame">
              <iframe
                title="Reels تعليمية"
                src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(searchQuery)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="reels-text">
              فيديوهات حوار/قصة (1+ دقيقة) من YouTube. للعمل offline، استخدم وضع "قصص".
            </p>
          </div>
        ) : (
          <>
            <div className="reels-progress">
              {EDUCATIONAL_STORIES.map((_, itemIndex) => (
                <span key={itemIndex} className={itemIndex === index ? 'is-active' : itemIndex < index ? 'is-done' : ''} />
              ))}
            </div>

            <div className="reels-card" key={reel.titleEn}>
          <span className="reels-kicker">ريلز تعليمي • {index + 1}/{EDUCATIONAL_STORIES.length}</span>
          <h2>{reel.titleAr}</h2>
          <p className="reels-title-en" dir="ltr">{reel.titleEn}</p>
          <p className="reels-text" dir="ltr">{text}</p>
          <div className="reels-actions">
            <button type="button" className="reels-btn" onClick={playReel}>
              <Volume2 /> استمع
            </button>
            <button type="button" className="reels-btn reels-btn-secondary" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
              <ChevronUp /> السابق
            </button>
            <button type="button" className="reels-btn reels-btn-secondary" onClick={() => setIndex((value) => Math.min(EDUCATIONAL_STORIES.length - 1, value + 1))} disabled={index === EDUCATIONAL_STORIES.length - 1}>
              <ChevronDown /> التالي
            </button>
          </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};
