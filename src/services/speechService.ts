/** Studio English speech playback (bundled clips) plus synthesized UI sound effects. */

import { Capacitor } from '@capacitor/core';
import { apiUrl } from './apiBase';
import { NativeTextToSpeech } from './nativeTextToSpeech';
import {
  normalizeSpeechLanguage,
  normalizeSpeechText as normalizeClipText,
  resolveSpeechLanguage,
  speechClipHash,
  speechClipUrl,
  speechTextForTts,
  type SpeechVoice,
  voiceFor,
} from './speechClip';

export const SPEECH_UNAVAILABLE_EVENT = 'englishtok:speech-unavailable';
export const SPEECH_STATUS_EVENT = 'englishtok:speech-status';

interface SpeechUnavailableDetail {
  message: string;
}

interface SpeechStatusDetail {
  status: 'loading' | 'playing' | 'idle';
  progress?: number;
}

interface SpeechOptions {
  text: string;
  rate?: number;
  gender?: 'male' | 'female';
  accent?: string;
  audioAssetUrl?: string;
}

interface PlaybackHandlers {
  requestId: number;
  source: string;
  text: string;
  rate: number;
  pitch: number;
  gender: 'male' | 'female';
  accent: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

interface CachedAudioRecord {
  key: string;
  audio: Blob;
  lastUsedAt: number;
}

/** Split long lesson lines without cutting a word in half for the TTS proxy. */
const splitSpeechChunks = (text: string, maxLength = 180): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  let current = '';
  for (const word of normalized.split(' ')) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= maxLength) {
      current = `${current} ${word}`;
      continue;
    }
    chunks.push(current);
    current = word;
  }
  if (current) chunks.push(current);
  return chunks;
};

class SpeechService {
  private static readonly MAX_CACHED_AUDIO_ITEMS = 4;
  private static readonly MAX_CACHED_AUDIO_BYTES = 8 * 1024 * 1024;
  private static readonly MAX_PERSISTENT_AUDIO_ITEMS = 12;
  private static readonly MAX_PERSISTENT_AUDIO_BYTES = 16 * 1024 * 1024;
  private static readonly AUDIO_DATABASE_NAME = 'englishtok-speech-cache';
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private prefetchedAudio: HTMLAudioElement[] = [];
  private preloadedSpeechBlobs = new Map<string, Blob>();
  private preloadedSpeechRequests = new Map<string, Promise<void>>();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentSource: string | null = null;
  private currentBlobUrl: string | null = null;
  private requestId = 0;
  private generatedAudio = new Map<string, Blob>();
  private generatedAudioBytes = 0;
  private inFlightAudio = new Map<string, Promise<Blob>>();
  private audioDatabasePromise: Promise<IDBDatabase | null> | null = null;
  private lastUnavailableMessage: string | null = null;
  /** Clips this build does not ship, remembered so we never fetch them twice. */
  private missingAudioKeys = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.stopSpeaking());
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.stopSpeaking();
  };

  private reportSpeechUnavailable(
    message: string,
    onError?: (error: unknown) => void
  ) {
    this.lastUnavailableMessage = message;
    this.setStatus('idle');
    const error = new Error(message);
    console.warn('[speechService]', error);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<SpeechUnavailableDetail>(SPEECH_UNAVAILABLE_EVENT, {
          detail: { message },
        })
      );
    }
    onError?.(error);
  }

  private setStatus(status: SpeechStatusDetail['status'], progress?: number) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<SpeechStatusDetail>(SPEECH_STATUS_EVENT, {
          detail: { status, progress },
        })
      );
    }
  }

  public getLastUnavailableMessage() {
    return this.lastUnavailableMessage;
  }

  /** URL of the bundled studio clip for a line, or undefined when there is none. */
  private clipManifest: Map<string, Set<string>> | null = null;
  private clipManifestPromise: Promise<void> | null = null;

  public loadClipManifest(): void {
    if (this.clipManifestPromise) return;
    this.clipManifestPromise = (async () => {
      try {
        const response = await fetch('/audio/tts/manifest.json', { cache: 'force-cache' });
        if (!response.ok) return;
        const data = (await response.json()) as Record<string, string[]>;
        const map = new Map<string, Set<string>>();
        for (const [voice, hashes] of Object.entries(data)) {
          map.set(voice, new Set(hashes));
        }
        this.clipManifest = map;
      } catch {
        // Manifest unavailable — keep the legacy behaviour (try the clip, cache misses).
        this.clipManifest = null;
      }
    })();
  }

  public getSpeechClipUrl(text: string, gender: 'male' | 'female', accent: string) {
    // `accent` is the learner's preference, not the language of this sentence.
    // Resolve English course text to English even when the UI is set to French.
    const language = resolveSpeechLanguage(text, accent);
    const url = speechClipUrl(text, gender, language) ?? undefined;
    if (!url) return undefined;
    // If the manifest is loaded, skip clips that are known to be missing so we
    // never pay a 404 round-trip (and IndexedDB probe) for them.
    if (this.clipManifest) {
      const voice = voiceFor(language, gender);
      const hash = speechClipHash(normalizeClipText(text) ?? text);
      if (!this.clipManifest.get(voice)?.has(hash)) return undefined;
    }
    return url;
  }

  /**
   * Boot the Android TTS engine ahead of the first narration. Without this the
   * initial story/lesson line waited for the engine to spin up, which read as a
   * slow "loading" pause even though the text was ready.
   */
  public warmUp(language: 'en' | 'fr' = 'en') {
    if (Capacitor.getPlatform() !== 'android') return;
    void NativeTextToSpeech.warmUp?.({
      language: language === 'fr' ? 'fr-FR' : 'en-US',
    }).catch(() => undefined);
  }

  /**
   * Pre-fetch the first generated speech chunks while a story reader paints.
   * The server fallback can take a couple of seconds to synthesise the first
   * line; doing it before the tap makes "استمع للقصة" start immediately.
   */
  public preloadSpeech(text: string, language: 'en' | 'fr', maxChunks = 2) {
    if (Capacitor.getPlatform() === 'android') return;
    // Mirror the playback pipeline exactly so preload keys match play keys.
    const cleaned = normalizeClipText(text);
    if (!cleaned) return;
    const chunks = splitSpeechChunks(speechTextForTts(cleaned, language)).slice(0, maxChunks);
    for (const chunk of chunks) {
      const key = `${language}:${chunk}`;
      if (this.preloadedSpeechBlobs.has(key) || this.preloadedSpeechRequests.has(key)) continue;
      const request = fetch(apiUrl(`/api/tts?lang=${language}&q=${encodeURIComponent(chunk)}`), {
        headers: { Accept: 'audio/mpeg' },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Speech preload failed (${response.status}).`);
          const blob = await response.blob();
          if (blob.size < 256) throw new Error('Speech preload returned an empty clip.');
          const normalized = this.normalizeAudioBlob(blob, '');
          this.preloadedSpeechBlobs.set(key, normalized);
          // Persist so the clip survives a reload and plays offline.
          void this.writePersistentAudio(`gen:${key}`, normalized).catch(() => undefined);
        })
        .catch(() => undefined)
        .finally(() => this.preloadedSpeechRequests.delete(key));
      this.preloadedSpeechRequests.set(key, request);
    }
  }

  /** Fetch a generated TTS clip, using the in-memory + persistent cache when
   * available, otherwise synthesising it via the server and persisting the
   * result so the next play is instant and works offline. */
  public async fetchGeneratedClip(
    language: 'en' | 'fr',
    text: string,
  ): Promise<Blob> {
    const cleaned = normalizeClipText(text);
    if (!cleaned) throw new Error('There is no text to speak.');
    const chunk = splitSpeechChunks(speechTextForTts(cleaned, language))[0];
    if (!chunk) throw new Error('There is no text to speak.');
    const key = `${language}:${chunk}`;
    const genKey = `gen:${language}:${chunk}`;

    const memory = this.preloadedSpeechBlobs.get(key);
    if (memory) return memory;

    try {
      const persisted = await this.readPersistentAudio(genKey);
      if (persisted) {
        const normalized = this.normalizeAudioBlob(persisted, '');
        this.preloadedSpeechBlobs.set(key, normalized);
        return normalized;
      }
    } catch {
      // ignore cache read errors
    }

    const response = await fetch(
      apiUrl(`/api/tts?lang=${language}&q=${encodeURIComponent(chunk)}`),
      { headers: { Accept: 'audio/mpeg' } },
    );
    if (!response.ok) throw new Error(`Speech fetch failed (${response.status}).`);
    const blob = await response.blob();
    if (blob.size < 256) throw new Error('Speech fetch returned an empty clip.');
    const normalized = this.normalizeAudioBlob(blob, '');
    this.preloadedSpeechBlobs.set(key, normalized);
    void this.writePersistentAudio(genKey, normalized).catch(() => undefined);
    return normalized;
  }

  /** Download & persist every audio chunk of a lesson in the background so the
   *  lesson plays smoothly and works offline afterwards. */
  public prefetchLessonAudio(lesson: { dialogue?: { textEn: string }[]; vocabulary?: { word: string; exampleSentence?: string }[]; structureSentence?: string }, language: 'en' | 'fr' = 'en') {
    if (Capacitor.getPlatform() === 'android') return;
    const texts: string[] = [];
    if (lesson.structureSentence) texts.push(lesson.structureSentence);
    for (const line of lesson.dialogue ?? []) {
      if (line?.textEn) texts.push(line.textEn);
    }
    for (const word of lesson.vocabulary ?? []) {
      if (word?.word) texts.push(word.word);
      if (word?.exampleSentence) texts.push(word.exampleSentence);
    }
    for (const text of texts) {
      this.preloadSpeech(text, language, 99);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public stopSpeaking = (source?: string) => {
    if (source && this.currentSource !== source) return;
    this.requestId += 1;
    this.currentSource = null;
    this.clearPlayback();
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    if (Capacitor.getPlatform() === 'android') {
      void NativeTextToSpeech.stop().catch(() => undefined);
    }
    this.setStatus('idle');
  };

  private clearPlayback() {
    if (this.currentAudio) {
      this.currentAudio.onplaying = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    if (this.prefetchedAudio.length) {
      for (const audio of this.prefetchedAudio) {
        audio.onplaying = null;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      this.prefetchedAudio = [];
    }
  }

  /** Play lesson/story text through the same-origin fallback voice. */
  private playRemoteSpeech(
    language: 'en' | 'fr',
    handlers: PlaybackHandlers,
    onFailure: (error: unknown) => void,
  ) {
    const { requestId, source, text, rate, onStart, onEnd } = handlers;
    const chunks = splitSpeechChunks(speechTextForTts(text, language));
    if (!chunks.length) {
      onFailure(new Error('There is no text to speak.'));
      return;
    }

    this.clearPlayback();
    this.currentSource = source;
    let index = 0;
    let started = false;
    let failed = false;

    const fail = (error: unknown) => {
      if (failed || requestId !== this.requestId) return;
      failed = true;
      onFailure(error);
    };

    const finish = () => {
      if (requestId !== this.requestId) return;
      this.clearPlayback();
      this.currentSource = null;
      this.requestId += 1;
      this.setStatus('idle');
      onEnd?.();
    };

    const makeAudio = (chunk: string) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = apiUrl(`/api/tts?lang=${language}&q=${encodeURIComponent(chunk)}`);
      audio.playbackRate = Math.max(0.5, Math.min(1.2, rate));
      audio.preservesPitch = true;
      return audio;
    };

    // Buffer the next chunk while the current one speaks, so long story
    // narration does not pause at every 180-character boundary.
    const prefetched = new Map<number, HTMLAudioElement>();
    const prefetch = (chunkIndex: number) => {
      if (chunkIndex >= chunks.length || prefetched.has(chunkIndex)) return;
      if (this.preloadedSpeechBlobs.has(`${language}:${chunks[chunkIndex]}`)) return;
      const audio = makeAudio(chunks[chunkIndex]);
      audio.load();
      prefetched.set(chunkIndex, audio);
      this.prefetchedAudio.push(audio);
    };

    const playNext = async () => {
      if (failed || requestId !== this.requestId) return;
      if (index >= chunks.length) {
        finish();
        return;
      }

      const currentIndex = index;
      const chunk = chunks[index];
      index += 1;
      const prefetchedAudio = prefetched.get(currentIndex);
      prefetched.delete(currentIndex);
      let cachedBlob = this.preloadedSpeechBlobs.get(`${language}:${chunk}`);
      if (!cachedBlob) {
        try {
          const persisted = await this.readPersistentAudio(`gen:${language}:${chunk}`);
          if (persisted) {
            cachedBlob = this.normalizeAudioBlob(persisted, '');
            this.preloadedSpeechBlobs.set(`${language}:${chunk}`, cachedBlob);
          }
        } catch {
          // ignore cache read errors
        }
      }
      let audio: HTMLAudioElement;
      if (cachedBlob) {
        // A warm Blob avoids a second network round-trip and starts instantly.
        if (prefetchedAudio) {
          this.prefetchedAudio = this.prefetchedAudio.filter((item) => item !== prefetchedAudio);
          prefetchedAudio.pause();
          prefetchedAudio.removeAttribute('src');
          prefetchedAudio.load();
        }
        const objectUrl = URL.createObjectURL(cachedBlob);
        this.currentBlobUrl = objectUrl;
        audio = new Audio(objectUrl);
        audio.preload = 'auto';
        audio.playbackRate = Math.max(0.5, Math.min(1.2, rate));
        audio.preservesPitch = true;
      } else {
        audio = prefetchedAudio ?? makeAudio(chunk);
        if (prefetchedAudio) {
          this.prefetchedAudio = this.prefetchedAudio.filter((item) => item !== prefetchedAudio);
        }
        // Persist this chunk in the background so the next play is instant/offline.
        void this.fetchGeneratedClip(language, chunk).catch(() => {});
      }
      this.currentAudio = audio;

      audio.onplaying = () => {
        if (failed || requestId !== this.requestId) return;
        if (started) return;
        started = true;
        this.setStatus('playing');
        onStart?.();
      };
      audio.onended = () => {
        window.clearTimeout(safetyTimer);
        if (failed || requestId !== this.requestId) return;
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
          this.currentBlobUrl = null;
        }
        playNext();
      };
      audio.onerror = () => {
        window.clearTimeout(safetyTimer);
        fail(new Error('The speech fallback could not be played.'));
      };

      prefetch(index);
      const estimatedMs = Math.max(2000, Math.min(30000, chunk.length * 75));
      const safetyTimer = window.setTimeout(() => {
        if (failed || requestId !== this.requestId) return;
        if (this.currentAudio !== audio) return;
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
          this.currentBlobUrl = null;
        }
        playNext();
      }, estimatedMs);
      void audio.play().catch((error) => {
        window.clearTimeout(safetyTimer);
        fail(error);
      });
    };

    prefetch(0);
    playNext();
  }

  private playBrowserSpeech({
    requestId,
    source,
    text,
    rate,
    pitch,
    gender,
    accent,
    onStart,
    onEnd,
    onError,
    reason,
    allowRemote = true,
  }: PlaybackHandlers & { reason: unknown; allowRemote?: boolean }) {
    if (requestId !== this.requestId) return;

    const language = normalizeSpeechLanguage(accent) === 'fr' ? 'fr-FR' : 'en-US';
    const synthesis =
      typeof window !== 'undefined' && window.speechSynthesis
        ? window.speechSynthesis
        : null;
    const availableVoices = synthesis?.getVoices() ?? [];
    const voices = availableVoices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(language.toLowerCase()),
    );

    // Android WebViews often ship without a French voice, and some do not
    // expose the Web Speech API at all. Use the small server-side French
    // speech fallback instead of reading French with an English/Arabic default
    // voice. If the request fails, fall back once to a French device voice when
    // one appeared in the meantime.
    if (
      language === 'fr-FR' &&
      allowRemote &&
      (!synthesis ||
        typeof SpeechSynthesisUtterance === 'undefined' ||
        availableVoices.length === 0 ||
        voices.length === 0)
    ) {
      this.playRemoteSpeech('fr',
        { requestId, source, text, rate, pitch, gender, accent, onStart, onEnd, onError },
        (error: unknown) => {
          if (requestId !== this.requestId) return;
          const frenchVoiceArrived =
            synthesis
              ?.getVoices()
              .some((voice) => voice.lang.toLowerCase().startsWith('fr')) ?? false;
          if (frenchVoiceArrived) {
            this.playBrowserSpeech({ requestId, source, text, rate, pitch, gender, accent, onStart, onEnd, onError, reason: error, allowRemote: false });
            return;
          }
          this.finishWithError(
            'تعذر تحميل الصوت الفرنسي. تحقق من اتصال الإنترنت وحاول مرة أخرى، أو ثبّت حزمة الصوت الفرنسية من إعدادات النظام.',
            onError
          );
        },
      );
      return;
    }

    // English has no device voice available (common in headless/locked-down
    // WebViews). Use the same-origin server fallback instead of failing
    // silently, so stories and other generated text can still be spoken.
    if (
      language === 'en-US' &&
      allowRemote &&
      (!synthesis ||
        typeof SpeechSynthesisUtterance === 'undefined' ||
        availableVoices.length === 0 ||
        voices.length === 0)
    ) {
      this.playRemoteSpeech('en',
        { requestId, source, text, rate, pitch, gender, accent, onStart, onEnd, onError },
        (error: unknown) => {
          if (requestId !== this.requestId) return;
          this.finishWithError(
            'تعذر تحميل الصوت. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
            onError
          );
        },
      );
      return;
    }

    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      this.finishWithError(
        'تعذر تشغيل الصوت المحلي على هذا الجهاز. تحقق من دعم النطق في المتصفح أو جرّب متصفحًا آخر.',
        onError
      );
      return;
    }

    console.info('[speechService] Speaking with the device voice for instant playback.', reason);
    this.clearPlayback();

    const utterance = new SpeechSynthesisUtterance(
      speechTextForTts(text, language === 'fr-FR' ? 'fr' : 'en'),
    );
    const genderPattern =
      language === 'fr-FR'
        ? /female|woman|amélie|amelie|audrey|thomas/i
        : gender === 'female'
          ? /female|woman|samantha|zira|jenny|aria/i
          : /male|man|david|mark|george/i;
    utterance.voice = voices.find((voice) => genderPattern.test(voice.name)) ?? voices[0] ?? null;
    utterance.lang = language;
    utterance.rate = Math.max(0.5, Math.min(1.2, rate));
    utterance.pitch = Math.max(0.5, Math.min(2, pitch));
    this.currentSource = source;
    this.currentUtterance = utterance;
    // The device voice starts instantly, so there is no loading state to report.

    let started = false;
    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (startTimer) window.clearTimeout(startTimer);
      if (requestId !== this.requestId) return;
      this.currentUtterance = null;
      this.currentSource = null;
      this.requestId += 1;
      this.setStatus('idle');
      onEnd?.();
    };

    utterance.onstart = () => {
      if (requestId !== this.requestId || finished) return;
      started = true;
      if (startTimer) window.clearTimeout(startTimer);
      this.setStatus('playing');
      onStart?.();
    };
    utterance.onend = () => {
      if (requestId !== this.requestId) return;
      finishOnce();
    };
    utterance.onerror = (event) => {
      if (requestId !== this.requestId || finished) return;
      finished = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (startTimer) window.clearTimeout(startTimer);
      this.currentUtterance = null;
      this.finishWithError(
        `تعذر تشغيل صوت Kokoro أو صوت الجهاز (${event.error}). تحقق من إعدادات الصوت وحاول مجددًا.`,
        onError
      );
    };

    // Some engines (headless/locked-down browsers) never fire onstart/onend.
    // Fall back to a timer so the UI never gets stuck in the "speaking" state
    // and the lesson can advance.
    const startTimer = window.setTimeout(() => {
      if (requestId !== this.requestId || started || finished) return;
      started = true;
      this.setStatus('playing');
      onStart?.();
    }, 400);
    const estimatedMs = Math.max(3000, Math.min(30000, text.length * 75));
    const fallbackTimer = window.setTimeout(() => {
      if (requestId !== this.requestId || finished) return;
      finishOnce();
    }, estimatedMs);

    try {
      synthesis.speak(utterance);
    } catch (error) {
      finished = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (startTimer) window.clearTimeout(startTimer);
      this.currentUtterance = null;
      this.finishWithError(
        'تعذر بدء النطق على هذا الجهاز. تحقق من إعدادات الصوت وحاول مجددًا.',
        onError
      );
      console.error('[speechService] Device speech fallback failed:', error);
    }
  }

  private getCachedAudio(key: string): Blob | undefined {
    const cached = this.generatedAudio.get(key);
    if (!cached) return undefined;
    this.generatedAudio.delete(key);
    this.generatedAudio.set(key, cached);
    return cached;
  }

  private cacheAudio(key: string, audio: Blob) {
    const previous = this.generatedAudio.get(key);
    if (previous) this.generatedAudioBytes -= previous.size;
    this.generatedAudio.delete(key);
    this.generatedAudio.set(key, audio);
    this.generatedAudioBytes += audio.size;

    while (
      this.generatedAudio.size > SpeechService.MAX_CACHED_AUDIO_ITEMS ||
      this.generatedAudioBytes > SpeechService.MAX_CACHED_AUDIO_BYTES
    ) {
      const oldestKey = this.generatedAudio.keys().next().value;
      if (oldestKey === undefined) break;
      const oldestAudio = this.generatedAudio.get(oldestKey);
      if (oldestAudio) this.generatedAudioBytes -= oldestAudio.size;
      this.generatedAudio.delete(oldestKey);
    }
  }

  private openAudioDatabase(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (this.audioDatabasePromise) return this.audioDatabasePromise;

    this.audioDatabasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(SpeechService.AUDIO_DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('audio')) {
          const store = database.createObjectStore('audio', { keyPath: 'key' });
          store.createIndex('lastUsedAt', 'lastUsedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.audioDatabasePromise = null;
        reject(request.error || new Error('Unable to open the speech audio cache.'));
      };
      request.onblocked = () => {
        this.audioDatabasePromise = null;
        reject(new Error('The speech audio cache upgrade is blocked by another tab.'));
      };
    });

    return this.audioDatabasePromise;
  }

  private async readPersistentAudio(key: string): Promise<Blob | undefined> {
    const database = await this.openAudioDatabase();
    if (!database) return undefined;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction('audio', 'readwrite');
      const store = transaction.objectStore('audio');
      const request = store.get(key) as IDBRequest<CachedAudioRecord | undefined>;
      let result: Blob | undefined;
      request.onsuccess = () => {
        const record = request.result;
        if (!record) return;
        result = record.audio;
        store.put({ ...record, lastUsedAt: Date.now() } satisfies CachedAudioRecord);
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () =>
        reject(transaction.error || new Error('Unable to read cached speech audio.'));
      transaction.onabort = () =>
        reject(transaction.error || new Error('Reading cached speech audio was aborted.'));
    });
  }

  private async writePersistentAudio(key: string, audio: Blob): Promise<void> {
    const database = await this.openAudioDatabase();
    if (!database) return;

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('audio', 'readwrite');
      const store = transaction.objectStore('audio');
      store.put({ key, audio, lastUsedAt: Date.now() } satisfies CachedAudioRecord);
      const request = store.getAll() as IDBRequest<CachedAudioRecord[]>;
      request.onsuccess = () => {
        const records = request.result.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
        let totalBytes = records.reduce((total, record) => total + record.audio.size, 0);
        let itemCount = records.length;
        for (const record of records) {
          if (
            itemCount <= SpeechService.MAX_PERSISTENT_AUDIO_ITEMS &&
            totalBytes <= SpeechService.MAX_PERSISTENT_AUDIO_BYTES
          ) {
            break;
          }
          store.delete(record.key);
          itemCount -= 1;
          totalBytes -= record.audio.size;
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error || new Error('Unable to persist generated speech audio.'));
      transaction.onabort = () =>
        reject(transaction.error || new Error('Persisting generated speech audio was aborted.'));
    });
  }


  private normalizeSpeechText(text: string): string | null {
    return normalizeClipText(text);
  }

  /** Ensure a cached or fetched clip has an audio MIME type for <audio>. */
  private normalizeAudioBlob(blob: Blob, sourceUrl: string): Blob {
    if (blob.type.startsWith('audio/')) return blob;
    return new Blob([blob], {
      type: sourceUrl.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/ogg',
    });
  }

  /** True when this browser exposes a usable speech synthesiser. */
  private canUseDeviceSpeech() {
    return (
      typeof window !== 'undefined' &&
      Boolean(window.speechSynthesis) &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    );
  }

  /** Fetch a bundled clip (memory, IndexedDB, then network) without touching Kokoro. */
  private loadRecordedAudio(
    audioAssetUrl: string,
    voice: SpeechVoice,
    speed: number,
    accent: string
  ): Promise<Blob> {
    const key = `asset:v3:${JSON.stringify([audioAssetUrl, accent, voice, speed])}`;
    if (this.missingAudioKeys.has(key)) {
      return Promise.reject(new Error(`No bundled clip for "${audioAssetUrl}".`));
    }
    const cached = this.getCachedAudio(key);
    if (cached) return Promise.resolve(cached);
    const existing = this.inFlightAudio.get(key);
    if (existing) return existing;

    const load = (async () => {
      let persisted: Blob | undefined;
      try {
        persisted = await this.readPersistentAudio(key);
      } catch (error) {
        console.warn('[speechService] Could not read persistent speech cache:', error);
      }
      if (persisted) {
        const normalized = this.normalizeAudioBlob(persisted, audioAssetUrl);
        this.cacheAudio(key, normalized);
        return normalized;
      }

      const response = await fetch(audioAssetUrl, { cache: 'force-cache' });
      if (!response.ok) {
        this.missingAudioKeys.add(key);
        throw new Error(`Bundled speech clip request failed (${response.status}).`);
      }
      const rawAudio = await response.blob();
      if (!rawAudio.size) {
        this.missingAudioKeys.add(key);
        throw new Error('Bundled speech clip was empty.');
      }
      // Capacitor's local asset server can answer a missing asset with the
      // HTML shell (status 200). Reject that before wrapping it as audio.
      if (audioAssetUrl.toLowerCase().endsWith('.ogg')) {
        const signature = new Uint8Array(await rawAudio.slice(0, 4).arrayBuffer());
        const isOgg =
          signature[0] === 0x4f &&
          signature[1] === 0x67 &&
          signature[2] === 0x67 &&
          signature[3] === 0x53;
        if (!isOgg) {
          this.missingAudioKeys.add(key);
          throw new Error('Bundled speech clip was not an Ogg file.');
        }
      }
      const audio = this.normalizeAudioBlob(rawAudio, audioAssetUrl);
      this.cacheAudio(key, audio);
      try {
        await this.writePersistentAudio(key, audio);
      } catch (error) {
        console.warn('[speechService] Could not persist bundled speech audio:', error);
      }
      return audio;
    })().finally(() => this.inFlightAudio.delete(key));

    this.inFlightAudio.set(key, load);
    return load;
  }

  /**
   * Play a bundled clip from a Blob URL inside the Android WebView.
   *
   * Capacitor's local asset server does not reliably answer the byte-range
   * requests a media element sends for an .ogg file, so pointing <audio> at
   * /audio/tts/... fails with MEDIA_ERR_SRC_NOT_SUPPORTED on Android even
   * though the clip is present. Fetching the clip and playing its Blob works
   * on both Android and the web.
   */
  private playBlobAudio(
    audioBlob: Blob,
    handlers: PlaybackHandlers,
    onFailure: (reason: unknown) => void
  ) {
    const { requestId } = handlers;
    this.clearPlayback();
    this.currentSource = handlers.source;

    const objectUrl = URL.createObjectURL(audioBlob);
    this.currentBlobUrl = objectUrl;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = objectUrl;
    audio.playbackRate = Math.max(0.5, Math.min(1.2, handlers.rate));
    audio.preservesPitch = true;
    this.currentAudio = audio;

    let failed = false;
    const fail = (error: unknown) => {
      if (failed || requestId !== this.requestId) return;
      failed = true;
      this.clearPlayback();
      onFailure(error);
    };

    audio.onplaying = () => {
      if (requestId !== this.requestId) return;
      this.setStatus('playing');
      handlers.onStart?.();
    };
    audio.onended = () => {
      if (requestId !== this.requestId) return;
      this.clearPlayback();
      this.currentSource = null;
      this.requestId += 1;
      this.setStatus('idle');
      handlers.onEnd?.();
    };
    audio.onerror = () => fail(new Error('The bundled speech audio file could not be played.'));

    void audio.play().catch(fail);
  }

  private playBundledClipAsBlob(
    audioAssetUrl: string,
    handlers: PlaybackHandlers,
    onFailure: (reason: unknown) => void
  ) {
    const voice = this.getVoice(handlers.accent, handlers.gender);
    const speed = Math.max(0.5, Math.min(1.2, handlers.rate));
    this.setStatus('loading');
    void this.loadRecordedAudio(audioAssetUrl, voice, speed, handlers.accent)
      .then((audio) => {
        if (handlers.requestId !== this.requestId) return;
        this.playBlobAudio(audio, handlers, onFailure);
      })
      .catch((error: unknown) => {
        if (handlers.requestId !== this.requestId) return;
        onFailure(error);
      });
  }

  /** Android WebView has no Web Speech API; use the native TTS bridge. */
  private playNativeDeviceSpeech(handlers: PlaybackHandlers, attempt = 0) {
    const language = normalizeSpeechLanguage(handlers.accent) === 'fr' ? 'fr-FR' : 'en-US';
    const text = speechTextForTts(
      handlers.text,
      language === 'fr-FR' ? 'fr' : 'en',
    );
    this.clearPlayback();
    this.currentSource = handlers.source;
    this.setStatus('loading');
    handlers.onStart?.();

    void NativeTextToSpeech.speak({
      text,
      rate: Math.max(0.5, Math.min(1.3, handlers.rate)),
      pitch: Math.max(0.7, Math.min(1.3, handlers.pitch)),
      language,
    })
      .then(() => {
        if (handlers.requestId !== this.requestId) return;
        this.currentSource = null;
        this.setStatus('idle');
        handlers.onEnd?.();
      })
      .catch((error: unknown) => {
        if (handlers.requestId !== this.requestId) return;
        const code = (error as { code?: string } | undefined)?.code;
        if (code === 'TTS_STOPPED') {
          this.currentSource = null;
          this.setStatus('idle');
          handlers.onEnd?.();
          return;
        }
        // A cold engine (first phrase after launch) or a stop/speak race
        // surfaces as NOT_READY/BUSY. Retrying on the device voice avoids the
        // noticeably slower server fallback for a perfectly healthy phone.
        if ((code === 'TTS_NOT_READY' || code === 'TTS_BUSY') && attempt < 2) {
          window.setTimeout(() => {
            if (handlers.requestId === this.requestId) {
              this.playNativeDeviceSpeech(handlers, attempt + 1);
            }
          }, 280);
          return;
        }
        // Try the server-side voice before giving up. This keeps stories and
        // other generated text speakable on devices without a working TTS
        // engine and in the web preview.
        const remoteLanguage = normalizeSpeechLanguage(handlers.accent) === 'fr' ? 'fr' : 'en';
        this.playRemoteSpeech(remoteLanguage,
          { requestId: handlers.requestId, source: handlers.source, text: handlers.text, rate: handlers.rate, pitch: handlers.pitch, gender: handlers.gender, accent: handlers.accent, onStart: handlers.onStart, onEnd: handlers.onEnd, onError: handlers.onError },
          (remoteError: unknown) => {
            if (handlers.requestId !== this.requestId) return;
            if (normalizeSpeechLanguage(handlers.accent) === 'fr' || this.canUseDeviceSpeech()) {
              this.playBrowserSpeech({ ...handlers, reason: remoteError });
              return;
            }
            this.finishWithError('تعذر تشغيل هذا الصوت على الجهاز. حاول مرة أخرى.', handlers.onError);
          },
        );
        return;
      });
  }

  /**
   * Play a bundled clip directly from its URL on the web. Starting the media
   * element synchronously keeps the browser's user gesture alive.
   */
  private playAudioUrl(
    audioUrl: string,
    handlers: PlaybackHandlers,
    onFailure: (reason: unknown) => void
  ) {
    const { requestId } = handlers;
    this.clearPlayback();
    this.currentSource = handlers.source;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = audioUrl;
    audio.playbackRate = Math.max(0.5, Math.min(1.2, handlers.rate));
    audio.preservesPitch = true;
    this.currentAudio = audio;

    let failed = false;
    const fail = (error: unknown) => {
      if (failed || requestId !== this.requestId) return;
      failed = true;
      onFailure(error);
    };

    audio.onplaying = () => {
      if (requestId !== this.requestId) return;
      this.setStatus('playing');
      handlers.onStart?.();
    };
    audio.onended = () => {
      if (requestId !== this.requestId) return;
      this.clearPlayback();
      this.currentSource = null;
      this.requestId += 1;
      this.setStatus('idle');
      handlers.onEnd?.();
    };
    audio.onerror = () => fail(new Error('The speech audio file could not be played.'));

    void audio.play().catch(fail);
  }

  /**
   * Instant path: play the bundled studio clip when the library has one, otherwise
   * hand straight over to the phone voice, which never needs a download.
   */
  private playFastPath(handlers: PlaybackHandlers, audioAssetUrl?: string) {
    const useDeviceVoice = (reason: unknown) => {
      if (handlers.requestId !== this.requestId) return;
      if (Capacitor.getPlatform() === 'android') {
        this.playNativeDeviceSpeech(handlers);
        return;
      }
      // The browser path owns the same-origin server fallback for both
      // languages when no local voice exists, so always hand over to it
      // instead of failing in WebViews that hide speechSynthesis.
      this.playBrowserSpeech({ ...handlers, reason });
    };

    // Full-story narration uses the cloud (server) TTS as the primary voice so
    // it works reliably on every device (no missing device voices, no 404 clips)
    // and plays smoothly with chunked prefetch. Single words keep the instant
    // device voice.
    if (handlers.source === 'stories') {
      const remoteLanguage = normalizeSpeechLanguage(handlers.accent) === 'fr' ? 'fr' : 'en';
      this.playRemoteSpeech(remoteLanguage, handlers, (error: unknown) => {
        if (handlers.requestId !== this.requestId) return;
        // Fall back to the device voice if the cloud is unreachable.
        if (Capacitor.getPlatform() === 'android') {
          this.playNativeDeviceSpeech(handlers);
        } else {
          this.playBrowserSpeech({ ...handlers, reason: error });
        }
      });
      return;
    }

    if (!audioAssetUrl) {
      useDeviceVoice(new Error('Instant playback with the device voice.'));
      return;
    }

    if (Capacitor.getPlatform() === 'android') {
      this.playBundledClipAsBlob(audioAssetUrl, handlers, useDeviceVoice);
      return;
    }

    // Some static hosts do not honour Range requests for .ogg files. Retry the
    // same clip as a Blob before falling back to the device voice.
    this.playAudioUrl(audioAssetUrl, handlers, () => {
      this.playBundledClipAsBlob(audioAssetUrl, handlers, useDeviceVoice);
    });
  }


  public preloadText({
    text,
    rate = 1.0,
    gender = 'female',
    accent = 'en',
    audioAssetUrl,
  }: SpeechOptions) {
    const cleanText = this.normalizeSpeechText(text);
    if (!cleanText) return;
    const language = resolveSpeechLanguage(cleanText, accent);
    const voice = this.getVoice(language, gender);
    const speed = Math.max(0.5, Math.min(1.2, rate));
    const clipUrl = audioAssetUrl ?? this.getSpeechClipUrl(cleanText, gender, language);

    // Bundled clips are worth fetching ahead of time; the phone voice is already instant.
    if (clipUrl) {
      void this.loadRecordedAudio(clipUrl, voice, speed, language).catch(() => undefined);
    }
  }

  public speakText({
    source,
    text,
    rate = 1.0,
    pitch = 1.0,
    gender = 'female',
    accent = 'en',
    onStart,
    onEnd,
    onError,
    audioAssetUrl,
  }: {
    source: string;
    text: string;
    rate?: number;
    pitch?: number;
    gender?: 'male' | 'female';
    accent?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
    audioAssetUrl?: string;
  }) {
    this.stopSpeaking();

    const cleanText = this.normalizeSpeechText(text);
    if (!cleanText) {
      this.reportSpeechUnavailable(
        'أدخل نصًا إنجليزيًا أو فرنسيًا صالحًا للنطق؛ لا تُرسل الترجمة العربية إلى محرك الصوت.',
        onError
      );
      return;
    }

    const language = resolveSpeechLanguage(cleanText, accent);
    const handlers: PlaybackHandlers = {
      requestId: this.requestId,
      source,
      text: cleanText,
      rate,
      pitch,
      gender,
      accent: language,
      onStart,
      onEnd,
      onError,
    };

    const clipUrl = audioAssetUrl ?? this.getSpeechClipUrl(cleanText, gender, language);
    this.playFastPath(handlers, clipUrl);
  }

  private getVoice(accent: string, gender: 'male' | 'female'): SpeechVoice {
    // Kokoro has a single French voice; English has one per gender.
    if (normalizeSpeechLanguage(accent) === 'fr') return 'ff_siwis';
    return gender === 'male' ? 'am_michael' : 'af_heart';
  }

  private finishWithError(message: string, onError?: (error: unknown) => void) {
    this.clearPlayback();
    this.requestId += 1;
    this.currentSource = null;
    this.reportSpeechUnavailable(message, onError);
  }

  // --- Sound Effects using Web Audio API Synthesizer ---

  public playPop() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context restricted or not supported
    }
  }

  public playHeartSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio fallback
    }
  }

  public playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.3);
      });
    } catch {
      // Silent fallback
    }
  }

  public playErrorBuzz() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silent fallback
    }
  }
}

export const speechService = new SpeechService();
