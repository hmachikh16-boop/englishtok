import { Capacitor } from '@capacitor/core';
import type { Lesson } from '../types';

const CONTENT_CACHE_KEYS = {
  en: 'englishtok_learning_path_content_v10',
  fr: 'englishtok_learning_path_content_fr_v3',
} as const;
const CONTENT_VERSION_KEYS = {
  en: 'englishtok_learning_path_version_en_v3',
  fr: 'englishtok_learning_path_version_fr_v3',
} as const;
const CONTENT_LAST_CHECK_KEYS = {
  en: 'englishtok_learning_path_checked_en_v2',
  fr: 'englishtok_learning_path_checked_fr_v2',
} as const;
const GITHUB_REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY;
const CONTENT_REMOTE_BASE = (
  import.meta.env.VITE_CONTENT_BASE_URL || 'https://englishtok-eight.vercel.app'
).replace(/\/+$/, '');

// The English curriculum is compiled into the app bundle. Matching this version
// to the published manifest lets us skip the very first download entirely.
const BUNDLED_CONTENT_VERSIONS: Record<ContentLanguage, string> = {
  en: __CONTENT_VERSION_EN__,
  fr: __CONTENT_VERSION_FR__,
};

/** The web build re-checks the published content once a day. */
const WEB_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** Native builds already ship the curriculum, so a weekly check is enough. */
const NATIVE_CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const MANIFEST_TIMEOUT_MS = 8_000;
const CONTENT_TIMEOUT_MS = 20_000;

type ContentLanguage = keyof typeof CONTENT_CACHE_KEYS;

interface ContentManifestEntry {
  version: string;
  url: string;
  bytes?: number;
}

interface ContentManifest {
  schemaVersion: number;
  generatedAt?: string;
  en?: ContentManifestEntry;
  fr?: ContentManifestEntry;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * AbortSignal.timeout is missing on some older Android WebViews. Falling back
 * to a manual controller keeps content refreshes working there as well.
 */
const timeoutSignal = (milliseconds: number): AbortSignal | undefined => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(milliseconds);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), milliseconds);
    return controller.signal;
  }
  return undefined;
};

const isLessonList = (value: unknown): value is Lesson[] =>
  Array.isArray(value) &&
  value.every((item) => {
    if (!isRecord(item)) return false;
    return (
      hasText(item.id) &&
      hasText(item.slug) &&
      hasText(item.title) &&
      hasText(item.titleAr) &&
      hasText(item.descriptionAr) &&
      hasText(item.category) &&
      hasText(item.level) &&
      hasText(item.sceneType) &&
      isRecord(item.characterA) &&
      hasText(item.characterA.id) &&
      isRecord(item.characterB) &&
      hasText(item.characterB.id) &&
      Array.isArray(item.dialogue) &&
      item.dialogue.length > 0 &&
      item.dialogue.every(
        (line) =>
          isRecord(line) &&
          hasText(line.id) &&
          hasText(line.textEn) &&
          hasText(line.textAr),
      ) &&
      Array.isArray(item.vocabulary) &&
      item.vocabulary.every(
        (word) =>
          isRecord(word) &&
          hasText(word.id) &&
          hasText(word.word) &&
          hasText(word.translationAr),
      ) &&
      Array.isArray(item.quiz) &&
      item.quiz.every(
        (question) =>
          isRecord(question) &&
          hasText(question.id) &&
          hasText(question.questionAr) &&
          hasText(question.correctAnswer),
      )
    );
  }) &&
  new Set(value.map((lesson) => (isRecord(lesson) ? lesson.id : null))).size === value.length;

const parseContent = (value: unknown): Lesson[] | null => {
  if (!isRecord(value) || value.schemaVersion !== 4) {
    return null;
  }
  const lessons = value.lessons;
  if (!isLessonList(lessons)) return null;
  return lessons;
};

const parseManifest = (value: unknown): ContentManifest | null => {
  if (!isRecord(value) || value.schemaVersion !== 1) return null;
  const parseEntry = (entry: unknown): ContentManifestEntry | null => {
    if (!isRecord(entry) || !hasText(entry.version) || !hasText(entry.url)) return null;
    return {
      version: entry.version,
      url: entry.url,
      bytes: typeof entry.bytes === 'number' ? entry.bytes : undefined,
    };
  };
  return {
    schemaVersion: 1,
    generatedAt: hasText(value.generatedAt) ? value.generatedAt : undefined,
    en: parseEntry(value.en) ?? undefined,
    fr: parseEntry(value.fr) ?? undefined,
  };
};

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Unable to update the Lin Go content state:', error);
  }
};

const readVersion = (language: ContentLanguage): string | null =>
  readStorage(CONTENT_VERSION_KEYS[language]);

const writeVersion = (language: ContentLanguage, version: string) =>
  writeStorage(CONTENT_VERSION_KEYS[language], version);

const readLastCheck = (language: ContentLanguage): number => {
  const raw = readStorage(CONTENT_LAST_CHECK_KEYS[language]);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const writeLastCheck = (language: ContentLanguage) =>
  writeStorage(CONTENT_LAST_CHECK_KEYS[language], String(Date.now()));

const isNativePlatform = (): boolean => {
  try {
    return Capacitor.getPlatform() !== 'web';
  } catch {
    return false;
  }
};

const contentFileName = (language: ContentLanguage): string =>
  language === 'fr' ? 'learning-path-fr.json' : 'learning-path.json';

const defaultContentUrl = (base: string, language: ContentLanguage): string =>
  `${base}/content/${contentFileName(language)}`;

const resolveContentUrl = (base: string, url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getRepository = () => {
  const repository = GITHUB_REPOSITORY;
  if (typeof repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    return null;
  }
  return repository;
};

const fetchManifest = async (base: string): Promise<ContentManifest | null> => {
  const response = await fetch(`${base}/content/content-manifest.json`, {
    cache: 'no-cache',
    headers: { Accept: 'application/json' },
    signal: timeoutSignal(MANIFEST_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return parseManifest(await response.json());
};

export const getCachedLearningPath = (language: ContentLanguage = 'en'): Lesson[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONTENT_CACHE_KEYS[language]);
    if (!raw) return null;
    return parseContent(JSON.parse(raw));
  } catch (error) {
    console.warn(`Unable to load cached Lin Go ${language} lesson content:`, error);
    return null;
  }
};

const saveContent = (lessons: Lesson[], language: ContentLanguage) => {
  try {
    window.localStorage.setItem(
      CONTENT_CACHE_KEYS[language],
      JSON.stringify({ schemaVersion: 4, lessons }),
    );
  } catch (error) {
    console.warn(`Unable to cache the latest Lin Go ${language} lesson content:`, error);
  }
};

const downloadContent = async (
  url: string,
  language: ContentLanguage,
  version: string | null,
  useNoStore: boolean,
): Promise<Lesson[] | null> => {
  const response = await fetch(url, {
    cache: useNoStore ? 'no-store' : 'default',
    headers: { Accept: 'application/json' },
    signal: timeoutSignal(CONTENT_TIMEOUT_MS),
  });
  if (!response.ok) return null;

  const lessons = parseContent(await response.json());
  if (!lessons) return null;

  saveContent(lessons, language);
  writeVersion(language, version ?? `local-${Date.now()}`);
  writeLastCheck(language);
  return lessons;
};

export interface FetchLatestLearningPathOptions {
  /** Manual refresh from Settings: bypasses the interval and the version check. */
  force?: boolean;
}

/**
 * Returns updated lesson content, or `null` when there is nothing new.
 *
 * The app already ships the full English curriculum in its JavaScript bundle,
 * so native builds never download it again. The web build checks a tiny
 * manifest once a day and only downloads the large JSON when its version
 * actually changed. This removes a 0.5–5 MB request from every launch.
 */
export const fetchLatestLearningPath = async (
  language: ContentLanguage = 'en',
  options: FetchLatestLearningPathOptions = {},
): Promise<Lesson[] | null> => {
  const force = options.force === true;
  const native = isNativePlatform();

  // Native English: the curriculum is compiled into the app.
  if (native && language === 'en' && !force) return null;

  // Native French: read the bundled asset once, never touch the network.
  if (native && language === 'fr' && !force) {
    if (readStorage(CONTENT_CACHE_KEYS.fr)) return null;
    try {
      return await downloadContent('/content/learning-path-fr.json', 'fr', null, false);
    } catch (error) {
      console.warn('Unable to load the bundled Lin Go French content:', error);
      return null;
    }
  }

  const hasCachedContent = Boolean(readStorage(CONTENT_CACHE_KEYS[language]));
  const bundledVersion = BUNDLED_CONTENT_VERSIONS[language] || '';

  if (!force) {
    const interval = native ? NATIVE_CHECK_INTERVAL_MS : WEB_CHECK_INTERVAL_MS;
    if (Date.now() - readLastCheck(language) < interval) return null;
  }

  const base = native ? CONTENT_REMOTE_BASE : '';
  let manifest: ContentManifest | null = null;
  try {
    manifest = await fetchManifest(base);
  } catch {
    manifest = null;
  }

  const entry = manifest?.[language] ?? null;
  const cachedVersion = readVersion(language);
  const publishedVersion = entry?.version || '';
  const matchesBundled =
    Boolean(bundledVersion) && publishedVersion === bundledVersion;

  if (!force && publishedVersion) {
    if (
      hasCachedContent &&
      (cachedVersion === publishedVersion || matchesBundled)
    ) {
      if (cachedVersion !== publishedVersion) {
        writeVersion(language, publishedVersion);
      }
      writeLastCheck(language);
      return null;
    }
    if (!hasCachedContent && language === 'en' && matchesBundled) {
      // The English curriculum is compiled into the bundle, so there is
      // nothing to download on the first launch.
      writeVersion(language, publishedVersion);
      writeLastCheck(language);
      return null;
    }
  }

  const urls: string[] = [];
  if (entry?.url) urls.push(resolveContentUrl(base, entry.url));
  urls.push(defaultContentUrl(base, language));

  if (native && language === 'fr') {
    urls.push('/content/learning-path-fr.json');
  } else if (!native) {
    const repository = getRepository();
    if (repository) {
      urls.push(
        `https://cdn.jsdelivr.net/gh/${repository}@main/public/content/${contentFileName(language)}`,
      );
    }
  }

  for (const url of urls) {
    try {
      const lessons = await downloadContent(url, language, entry?.version ?? null, force);
      if (lessons) return lessons;
    } catch {
      /* Try the next mirror. */
    }
  }

  // A failed background refresh must never interrupt the app. Remember the
  // attempt so an offline device does not retry on every single launch.
  writeLastCheck(language);
  return null;
};
