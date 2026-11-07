import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Sparkles, Volume2, X } from 'lucide-react';
import type { EducationalStory } from '../../data/stories';
import { speechService } from '../../services/speechService';
import { StoryScene } from './StoryScene';

interface StoryReaderProps {
  story: EducationalStory;
  language: 'en' | 'fr';
  completed?: boolean;
  onClose: () => void;
  onComplete?: (storyId: string) => void;
}

interface ActiveWord {
  word: string;
  translation: string;
}

const WORD_PATTERN = /([A-Za-zÀ-ÖØ-öø-ÿ]+(?:[’'-][A-Za-zÀ-ÖØ-öø-ÿ]+)*)([^A-Za-zÀ-ÖØ-öø-ÿ]*)/g;

const normalizeWord = (raw: string) => {
  const lower = raw
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^[^a-zà-öø-ÿ]+|[^a-zà-öø-ÿ]+$/g, '');
  // French elisions: l'eau -> eau, qu'il -> il, d'abord -> abord.
  return lower.replace(/^(qu|l|d|j|n|s|c|m|t)'(?=[a-zà-öø-ÿ])/, '');
};

const tokenize = (text: string): Array<{ text: string; word: string | null }> => {
  const tokens: Array<{ text: string; word: string | null }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  WORD_PATTERN.lastIndex = 0;
  while ((match = WORD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), word: null });
    }
    tokens.push({ text: match[1], word: normalizeWord(match[1]) });
    if (match[2]) tokens.push({ text: match[2], word: null });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), word: null });
  }
  return tokens;
};

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  language,
  completed = false,
  onClose,
  onComplete,
}) => {
  const [activeWord, setActiveWord] = useState<ActiveWord | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isDone, setIsDone] = useState(completed);

  const glossary = story.glossary[language];
  const title = language === 'fr' ? story.titleFr : story.titleEn;
  const paragraphs = useMemo(
    () => story.paragraphs.map((paragraph) => paragraph[language]),
    [language, story.paragraphs],
  );
  const plainText = useMemo(() => paragraphs.join(' '), [paragraphs]);
  // Tokenize once per story/language. Re-tokenizing on every word tap made the
  // reader feel heavy on low-end phones.
  const tokenizedParagraphs = useMemo(
    () => paragraphs.map((paragraph) => tokenize(paragraph)),
    [paragraphs],
  );

  useEffect(() => {
    setIsDone(completed);
  }, [completed, story.id]);

  useEffect(() => {
    // Warm the native TTS engine while the reader paints so the first
    // "استمع للقصة" tap starts speaking without an extra initialization delay.
    speechService.warmUp(language);
  }, [language]);

  useEffect(() => {
    // On the web/Windows fallback the first sentence is synthesised on request
    // (~2s). Pre-fetching it while the reader paints removes that pause.
    speechService.preloadSpeech(plainText, language);
  }, [plainText, language]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      speechService.stopSpeaking();
    };
  }, [onClose]);

  const speak = useCallback(
    (text: string, rate: number) => {
      speechService.speakText({
        source: 'stories',
        text,
        rate,
        gender: 'female',
        accent: language,
        onStart: () => setIsReading(true),
        onEnd: () => setIsReading(false),
        onError: () => setIsReading(false),
      });
    },
    [language],
  );

  const handleWord = useCallback(
    (word: string, translation: string) => {
      setActiveWord({ word, translation });
      speak(word, 0.82);
    },
    [speak],
  );

  const handleReadStory = useCallback(() => {
    if (isReading) {
      speechService.stopSpeaking();
      setIsReading(false);
      return;
    }
    speak(plainText, 0.88);
  }, [isReading, plainText, speak]);

  const handleComplete = useCallback(() => {
    setIsDone(true);
    onComplete?.(story.id);
  }, [onComplete, story.id]);

  return (
    <div className="story-overlay" role="dialog" aria-modal="true" aria-label={`قصة: ${story.titleAr}`}>
      <button type="button" className="story-backdrop" aria-label="إغلاق القصة" onClick={onClose} />
      <section className="story-reader" dir="rtl">
        <header className="story-reader-topbar">
          <button type="button" className="story-icon-button" onClick={onClose} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
          <span className="story-level-chip">
            <BookOpen className="h-3.5 w-3.5" />
            {story.level} · قصة
          </span>
          <button
            type="button"
            className={`story-icon-button ${isReading ? 'is-reading' : ''}`}
            onClick={handleReadStory}
            aria-label={isReading ? 'إيقاف القراءة' : 'استمع للقصة'}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </header>

        <div className="story-reader-art">
          <StoryScene scene={story.scene} className="story-reader-scene" />
          <div className="story-reader-art-shade" />
          <div className="story-reader-art-copy">
            <span className="story-reader-kicker">{story.titleAr}</span>
            <h2 className="story-reader-title">{title}</h2>
            <span className="story-reader-meta">
              {story.minutes} دقائق قراءة · {story.paragraphs.length} مقاطع
            </span>
          </div>
        </div>

        <div className="story-reader-body">
          <p className="story-reader-lead">
            اضغط على أي كلمة مظللة لسماعها ورؤية معناها بالعربية.
          </p>
          <div className="story-reader-text" dir="ltr">
            {tokenizedParagraphs.map((tokens, paragraphIndex) => (
              <p key={paragraphIndex} className="story-paragraph">
                {tokens.map((token, tokenIndex) => {
                  const translation = token.word ? glossary[token.word] : undefined;
                  if (!token.word || !translation) {
                    return <React.Fragment key={tokenIndex}>{token.text}</React.Fragment>;
                  }
                  return (
                    <button
                      key={tokenIndex}
                      type="button"
                      className="story-word"
                      onClick={() => handleWord(token.word as string, translation)}
                    >
                      {token.text}
                    </button>
                  );
                })}
              </p>
            ))}
          </div>
        </div>

        {activeWord && (
          <div className="story-word-card" role="status">
            <div className="story-word-copy">
              <strong className="story-word-term">{activeWord.word}</strong>
              <span className="story-word-translation">{activeWord.translation}</span>
            </div>
            <div className="story-word-actions">
              <button
                type="button"
                className="story-icon-button"
                onClick={() => speak(activeWord.word, 0.8)}
                aria-label="أعد سماع الكلمة"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="story-icon-button"
                onClick={() => setActiveWord(null)}
                aria-label="إغلاق المعنى"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <footer className="story-reader-footer">
          <button type="button" className="story-secondary-button" onClick={handleReadStory}>
            <Volume2 className="h-4 w-4" />
            {isReading ? 'إيقاف' : 'استمع للقصة'}
          </button>
          <button
            type="button"
            className={`story-primary-button ${isDone ? 'is-done' : ''}`}
            onClick={handleComplete}
            disabled={isDone}
          >
            {isDone ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {isDone ? 'أتممت القصة' : 'أنهيت القصة'}
          </button>
        </footer>
      </section>
    </div>
  );
};
