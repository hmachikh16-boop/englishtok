import type { Lesson } from '../types';

const CONTENT_CACHE_KEY = 'englishtok_learning_path_content_v1';
const CONTENT_RELEASE_TAG = 'content-latest';
const GITHUB_REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isReleaseAssetUrl = (value: unknown, repository: string): value is string =>
  typeof value === 'string' &&
  value.startsWith(`https://api.github.com/repos/${repository}/releases/assets/`) &&
  /^\d+$/.test(value.slice(`https://api.github.com/repos/${repository}/releases/assets/`.length));

const isLessonList = (value: unknown): value is Lesson[] =>
  Array.isArray(value) &&
  value.length > 0 &&
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
  if (!isRecord(value) || value.schemaVersion !== 1 || !isLessonList(value.lessons)) {
    return null;
  }
  return value.lessons;
};

export const getCachedLearningPath = (): Lesson[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONTENT_CACHE_KEY);
    if (!raw) return null;
    return parseContent(JSON.parse(raw));
  } catch (error) {
    console.warn('Unable to load cached EnglishTok lesson content:', error);
    return null;
  }
};

const saveContent = (lessons: Lesson[]) => {
  try {
    window.localStorage.setItem(
      CONTENT_CACHE_KEY,
      JSON.stringify({ schemaVersion: 1, lessons }),
    );
  } catch (error) {
    console.warn('Unable to cache the latest EnglishTok lesson content:', error);
  }
};

const getRepository = () => {
  const repository = GITHUB_REPOSITORY;
  if (typeof repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    return null;
  }
  return repository;
};

export const fetchLatestLearningPath = async (): Promise<Lesson[] | null> => {
  const repository = getRepository();
  if (!repository) return null;

  const releaseResponse = await fetch(
    `https://api.github.com/repos/${repository}/releases/tags/${CONTENT_RELEASE_TAG}`,
    {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (releaseResponse.status === 404) return null;
  if (!releaseResponse.ok) {
    throw new Error(`Lesson content update check failed (${releaseResponse.status}).`);
  }

  const release: unknown = await releaseResponse.json();
  if (!isRecord(release) || release.tag_name !== CONTENT_RELEASE_TAG || !Array.isArray(release.assets)) {
    throw new Error('The published lesson-content release metadata is invalid.');
  }
  const asset = release.assets.find(
    (candidate) => isRecord(candidate) && candidate.name === 'learning-path.json',
  );
  if (
    !isRecord(asset) ||
    !isReleaseAssetUrl(asset.url, repository)
  ) {
    throw new Error('The latest lesson-content release is missing learning-path.json.');
  }

  const contentResponse = await fetch(asset.url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/octet-stream',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!contentResponse.ok) {
    throw new Error(`Lesson content download failed (${contentResponse.status}).`);
  }

  const lessons = parseContent(await contentResponse.json());
  if (!lessons) throw new Error('The downloaded lesson content has an unsupported or invalid format.');
  saveContent(lessons);
  return lessons;
};
