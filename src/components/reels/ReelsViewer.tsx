import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  X,
  Youtube,
} from 'lucide-react';
import { apiUrl } from '../../services/apiBase';
import { UserProfile } from '../../types';
import './reels.css';

interface ReelVideo {
  id: string;
  title: string;
  type: 'short' | 'video';
  views: number | null;
  viewsText: string;
  published: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
}

interface ReelChannel {
  channelId: string;
  handle: string;
  title: string;
  subscribers: number | null;
  subscribersText: string;
  videoCount: number | null;
  videoCountText: string;
  totalViews: number | null;
  totalViewsText: string;
  source: 'api' | 'scrape';
  updatedAt: string;
}

interface ReelPayload {
  channel: ReelChannel;
  videos: ReelVideo[];
  shorts: ReelVideo[];
  channelUrl: string;
  subscribeUrl: string;
}

interface ReelsViewerProps {
  userProfile: UserProfile;
  onClose: () => void;
}

type ReelFilter = 'shorts' | 'videos' | 'all';

const formatRelative = (iso: string): string => {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return '';
  const diff = Date.now() - time;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.round(days / 30);
  if (months < 12) return `قبل ${months} شهر`;
  return `قبل ${Math.round(months / 12)} سنة`;
};

const openExternal = async (url: string): Promise<void> => {
  try {
    if (Capacitor.getPlatform() === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Browser.open({ url });
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  }
};

const localizeViews = (text: string): string => {
  if (!text) return '';
  if (/^no views?$/i.test(text.trim())) return 'لا مشاهدات بعد';
  return text.replace(/\s*views?$/i, ' مشاهدة');
};

const formatMetric = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : value.toLocaleString('en-US');

const THUMBNAIL_STEPS = ['oar2', 'frame0', 'hqdefault', 'maxresdefault'] as const;

const thumbnailAt = (id: string, step: number): string => {
  const index = Math.min(Math.max(step, 0), THUMBNAIL_STEPS.length - 1);
  return `https://i.ytimg.com/vi/${id}/${THUMBNAIL_STEPS[index]}.jpg`;
};

export const ReelsViewer: React.FC<ReelsViewerProps> = ({ onClose }) => {
  const [payload, setPayload] = useState<ReelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ReelFilter>('shorts');
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(apiUrl(`/api/youtube?action=feed${force ? '&refresh=1' : ''}`), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = (await response.json()) as ReelPayload;
      if (!mountedRef.current) return;
      setPayload(next);
      setFilter((current) => {
        if (current === 'shorts' && next.shorts.length === 0 && next.videos.length > 0) return 'videos';
        if (current === 'videos' && next.videos.length === 0 && next.shorts.length > 0) return 'shorts';
        return current;
      });
      setActiveIndex(0);
      setPlayingId(null);
    } catch {
      if (mountedRef.current) {
        setError('تعذر تحميل فيديوهات القناة الآن. تحقق من الاتصال ثم أعد المحاولة.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    if (!payload) return [] as ReelVideo[];
    if (filter === 'shorts') return payload.shorts;
    if (filter === 'videos') return payload.videos;
    return [...payload.shorts, ...payload.videos];
  }, [payload, filter]);

  const active = items[activeIndex] ?? null;

  const goTo = useCallback(
    (next: number) => {
      if (!items.length) return;
      const clamped = Math.min(items.length - 1, Math.max(0, next));
      setActiveIndex(clamped);
      setPlayingId(null);
      const feed = feedRef.current;
      const slide = feed?.querySelector<HTMLElement>(`[data-reel-index="${clamped}"]`);
      slide?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [items.length],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        goTo(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, goTo, onClose]);

  const channel = payload?.channel;
  const subscribeUrl = payload?.subscribeUrl ?? 'https://www.youtube.com/@lingogold?sub_confirmation=1';
  const channelUrl = payload?.channelUrl ?? 'https://www.youtube.com/@lingogold';
  const showFilters = Boolean(payload && payload.shorts.length > 0 && payload.videos.length > 0);

  return (
    <div className="reels-overlay" role="dialog" aria-modal="true" aria-label="ريلز Lin Go من يوتيوب">
      <div className="reels-shell">
        <header className="reels-head">
          <span className="reels-brand" aria-hidden="true">
            <Youtube />
          </span>
          <div className="reels-brand-copy">
            <strong>Lin Go Reels</strong>
            <span dir="ltr">{channel?.handle ?? '@lingogold'}</span>
          </div>
          <div className="reels-head-actions">
            <a
              className="reels-subscribe"
              href={subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.preventDefault();
                void openExternal(subscribeUrl);
              }}
              aria-label="اشترك في قناة Lin Go على يوتيوب"
            >
              <Bell />
              <span>اشترك</span>
            </a>
            <button
              type="button"
              className="reels-icon-btn"
              onClick={() => void load(true)}
              aria-label="تحديث الفيديوهات"
              title="تحديث الفيديوهات"
            >
              <RefreshCw className={loading ? 'is-spinning' : ''} />
            </button>
            <button type="button" className="reels-icon-btn" onClick={onClose} aria-label="إغلاق">
              <X />
            </button>
          </div>
        </header>

        {channel && (
          <div className="reels-channel-strip">
            <div className="reels-channel-metric">
              <strong>{formatMetric(channel.subscribers)}</strong>
              <span>مشترك</span>
            </div>
            <span className="reels-channel-divider" aria-hidden="true" />
            <div className="reels-channel-metric">
              <strong>{formatMetric(channel.totalViews)}</strong>
              <span>مشاهدة</span>
            </div>
            <span className="reels-channel-divider" aria-hidden="true" />
            <div className="reels-channel-metric">
              <strong>{formatMetric(channel.videoCount)}</strong>
              <span>فيديو</span>
            </div>
            <a
              className="reels-channel-link"
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.preventDefault();
                void openExternal(channelUrl);
              }}
            >
              القناة
              <ExternalLink />
            </a>
          </div>
        )}

        {showFilters && (
          <div className="reels-filters" role="tablist" aria-label="نوع الفيديو">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'shorts'}
              className={filter === 'shorts' ? 'is-active' : ''}
              onClick={() => {
                setFilter('shorts');
                setActiveIndex(0);
                setPlayingId(null);
              }}
            >
              شورتات <span>{payload?.shorts.length ?? 0}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'videos'}
              className={filter === 'videos' ? 'is-active' : ''}
              onClick={() => {
                setFilter('videos');
                setActiveIndex(0);
                setPlayingId(null);
              }}
            >
              فيديوهات <span>{payload?.videos.length ?? 0}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={filter === 'all' ? 'is-active' : ''}
              onClick={() => {
                setFilter('all');
                setActiveIndex(0);
                setPlayingId(null);
              }}
            >
              الكل <span>{(payload?.shorts.length ?? 0) + (payload?.videos.length ?? 0)}</span>
            </button>
          </div>
        )}

        <div className="reels-body">
          {loading && !payload && (
            <div className="reels-state">
              <Loader2 className="reels-spinner" />
              <strong>جارٍ تحميل شورتات القناة…</strong>
              <p>أحدث المقاطع تصل مباشرة من يوتيوب.</p>
            </div>
          )}

          {!loading && error && (
            <div className="reels-state is-error">
              <Youtube />
              <strong>{error}</strong>
              <div className="reels-state-actions">
                <button type="button" className="reels-btn" onClick={() => void load(true)}>
                  <RefreshCw /> إعادة المحاولة
                </button>
                <button type="button" className="reels-btn is-ghost" onClick={() => void openExternal(channelUrl)}>
                  <ExternalLink /> فتح القناة
                </button>
              </div>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="reels-state">
              <Youtube />
              <strong>لا توجد مقاطع منشورة بعد</strong>
              <p>سيظهر هنا أي شورت جديد تنشره القناة تلقائيًا.</p>
              <div className="reels-state-actions">
                <button type="button" className="reels-btn" onClick={() => void openExternal(subscribeUrl)}>
                  <Bell /> اشترك في القناة
                </button>
                <button type="button" className="reels-btn is-ghost" onClick={() => void load(true)}>
                  <RefreshCw /> تحديث
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="reels-feed" ref={feedRef} aria-live="polite">
                {items.map((item, index) => {
                  const isActive = index === activeIndex;
                  const isPlaying = playingId === item.id;
                  return (
                    <article
                      key={item.id}
                      data-reel-index={index}
                      className={`reels-slide ${isActive ? 'is-active' : ''} ${item.type === 'short' ? 'is-short' : 'is-video'}`}
                      onFocus={() => setActiveIndex(index)}
                    >
                      <div className="reels-frame">
                        {isPlaying ? (
                          <iframe
                            key={item.id}
                            title={item.title}
                            src={item.embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        ) : (
                          <button
                            type="button"
                            className="reels-poster"
                            onClick={() => {
                              setActiveIndex(index);
                              setPlayingId(item.id);
                            }}
                            aria-label={`تشغيل ${item.title}`}
                          >
                            <img
                              src={item.thumbnail}
                              alt=""
                              loading={index < 3 ? 'eager' : 'lazy'}
                              onLoad={(event) => {
                                const img = event.currentTarget;
                                const step = Number(img.dataset.thumbStep || '0');
                                if (
                                  img.naturalWidth > 0 &&
                                  img.naturalWidth < 320 &&
                                  step < THUMBNAIL_STEPS.length - 1
                                ) {
                                  img.dataset.thumbStep = String(step + 1);
                                  img.src = thumbnailAt(item.id, step + 1);
                                }
                              }}
                              onError={(event) => {
                                const img = event.currentTarget;
                                const step = Number(img.dataset.thumbStep || '0');
                                if (step < THUMBNAIL_STEPS.length - 1) {
                                  img.dataset.thumbStep = String(step + 1);
                                  img.src = thumbnailAt(item.id, step + 1);
                                }
                              }}
                            />
                            <span className="reels-play-orb" aria-hidden="true">
                              <Play />
                            </span>
                            <span className="reels-type-badge">
                              {item.type === 'short' ? 'شورت' : 'فيديو'}
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="reels-slide-meta">
                        <div className="reels-slide-copy">
                          <strong>{item.title}</strong>
                          <span className="reels-slide-stats">
                            {item.viewsText && <span>{localizeViews(item.viewsText)}</span>}
                            {item.published && <span>{formatRelative(item.published)}</span>}
                            <span dir="ltr">{index + 1} / {items.length}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          className="reels-open-btn"
                          onClick={() => void openExternal(item.url)}
                          aria-label={`فتح ${item.title} على يوتيوب`}
                        >
                          <ExternalLink />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="reels-nav">
                <button
                  type="button"
                  className="reels-nav-btn"
                  onClick={() => goTo(activeIndex - 1)}
                  disabled={activeIndex <= 0}
                  aria-label="المقطع السابق"
                >
                  <ChevronUp />
                </button>
                <div className="reels-dots" aria-hidden="true">
                  {items.slice(0, 12).map((item, index) => (
                    <span key={item.id} className={index === activeIndex ? 'is-active' : ''} />
                  ))}
                </div>
                <button
                  type="button"
                  className="reels-nav-btn"
                  onClick={() => goTo(activeIndex + 1)}
                  disabled={activeIndex >= items.length - 1}
                  aria-label="المقطع التالي"
                >
                  <ChevronDown />
                </button>
              </div>
            </>
          )}
        </div>

        <footer className="reels-foot">
          <span>
            {channel?.source === 'api' ? 'إحصاءات YouTube الرسمية' : 'تُحدَّث القائمة عند فتح الريلز'}
          </span>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.preventDefault();
              void openExternal(channelUrl);
            }}
          >
            @lingogold
            <ExternalLink />
          </a>
        </footer>
      </div>
    </div>
  );
};
