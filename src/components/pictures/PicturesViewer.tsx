import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import { apiUrl } from '../../services/apiBase';
import './pictures.css';

interface Picture {
  id: string;
  url: string;
  caption: string;
  createdAt: string;
}

export const PicturesViewer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/pictures'), { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { items?: Picture[] };
      if (!mountedRef.current) return;
      const next = Array.isArray(data.items) ? data.items : [];
      setItems(next);
      setActiveIndex(0);
    } catch {
      if (mountedRef.current) setError('تعذر تحميل الصور. تحقق من الاتصال ثم أعد المحاولة.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => { mountedRef.current = false; };
  }, [load]);

  // Track the visible slide for the dots indicator.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || items.length === 0) return;
    const slides = Array.from(feed.querySelectorAll<HTMLElement>('[data-picture-index]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number(visible.target.getAttribute('data-picture-index'));
          if (Number.isFinite(idx)) setActiveIndex(idx);
        }
      },
      { root: feed, threshold: 0.6 },
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = Math.min(items.length - 1, activeIndex + 1);
        setActiveIndex(next);
        feedRef.current?.querySelector<HTMLElement>(`[data-picture-index="${next}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prev = Math.max(0, activeIndex - 1);
        setActiveIndex(prev);
        feedRef.current?.querySelector<HTMLElement>(`[data-picture-index="${prev}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, items.length, onClose]);

  return (
    <div className="pictures-viewer" role="dialog" aria-modal="true" aria-label="المجموعة — صور تعليمية">
      <button type="button" className="pictures-close" onClick={onClose} aria-label="إغلاق">
        <X size={22} />
      </button>

      {loading ? (
        <div className="pictures-state">
          <RefreshCw className="pictures-spinner" size={28} />
          <p>جارٍ تحميل الصور…</p>
        </div>
      ) : error ? (
        <div className="pictures-state">
          <p>{error}</p>
          <button type="button" className="pictures-retry" onClick={() => void load()}>إعادة المحاولة</button>
        </div>
      ) : items.length === 0 ? (
        <div className="pictures-state">
          <ImageIcon size={56} />
          <p>لا توجد صور منشورة بعد.</p>
          <small>سيتم إضافة صور تعليمية هنا من لوحة التحكم.</small>
        </div>
      ) : (
        <>
          <div className="pictures-feed" ref={feedRef}>
            {items.map((item, i) => (
              <section className="pictures-slide" key={item.id} data-picture-index={i}>
                <img src={item.url} alt={item.caption || `صورة ${i + 1}`} className="pictures-img" loading={i === 0 ? 'eager' : 'lazy'} />
                {item.caption && <div className="pictures-caption">{item.caption}</div>}
                <div className="pictures-counter">{i + 1} / {items.length}</div>
              </section>
            ))}
          </div>
          {items.length > 1 && (
            <div className="pictures-dots" aria-hidden="true">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pictures-dot ${i === activeIndex ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveIndex(i);
                    feedRef.current?.querySelector<HTMLElement>(`[data-picture-index="${i}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  aria-label={`صورة ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};