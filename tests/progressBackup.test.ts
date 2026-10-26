import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ProgressBackupError,
  clearPreImportSnapshot,
  createEncryptedProgressBackup,
  decryptProgressBackup,
  getPreImportSnapshot,
  inspectProgressBackup,
  savePreImportSnapshot,
  summarizeProgress,
} from '../src/services/progressBackupService';
import type { GameProgress } from '../src/services/gameProgressService';
import { validateProgressBackupProfile } from '../src/services/storageService';
import type { LanguageProgress, UserProfile } from '../src/types';

const PASSWORD = 'correct horse battery staple 42!';

const languageProgress = (completedLessonIds: string[]): LanguageProgress => ({
  likedLessonIds: [],
  favoriteLessonIds: [],
  watchedLessonIds: [...completedLessonIds],
  completedLessonIds: [...completedLessonIds],
  savedWordIds: [],
  masteredWordIds: [],
  reviewWordIds: [],
  quizScores: {},
  levelExamResults: {},
  dailyProgress: { date: '2026-10-25', completedLessonIds: [] },
});

const profile: UserProfile = {
  targetLanguage: 'en',
  languageProgress: {
    fr: languageProgress(['fr-1']),
  },
  displayName: 'Test Learner',
  profileTagline: 'A deterministic test profile',
  joinedAt: '2026-01-01T00:00:00.000Z',
  xp: 420,
  streakDays: 7,
  lastActiveDate: '2026-10-25',
  likedLessonIds: ['lesson-1'],
  favoriteLessonIds: ['lesson-1'],
  watchedLessonIds: ['lesson-1', 'lesson-2'],
  completedLessonIds: ['lesson-1', 'lesson-2'],
  savedWordIds: ['word-1', 'word-2'],
  masteredWordIds: ['word-1'],
  reviewWordIds: [],
  quizScores: { 'lesson-1': 100, 'lesson-2': 80 },
  levelExamResults: {
    '1': {
      attempts: 2,
      bestScore: 90,
      latestScore: 85,
      passed: true,
      reviewTopics: ['greetings'],
      reviewWordIds: ['word-1'],
      passedAt: '2026-10-20T12:00:00.000Z',
    },
  },
  placementAssessment: {
    schemaVersion: 1,
    startedAt: '2026-10-01T10:00:00.000Z',
    answers: {},
    result: {
      completedAt: '2026-10-01T10:10:00.000Z',
      correctCount: 10,
      answeredCount: 12,
      scorePercent: 83.33,
      suggestedStage: 2,
      skillCoverage: ['reading', 'grammar'],
      stages: [{ stage: 1, correct: 10, total: 12, passed: true }],
      method: 'test',
    },
  },
  dailyGoalLessons: 2,
  dailyProgress: { date: '2026-10-25', completedLessonIds: ['lesson-1'] },
  settings: {
    playbackSpeed: 1,
    subtitlesMode: 'both',
    soundEffects: true,
    autoNext: false,
    voiceLanguage: 'en',
  },
};

const gameProgress: GameProgress = {
  solvedWordIds: ['word-1', 'word-2'],
  totalSolved: 12,
  bestStreak: 4,
  lastPlayedAt: '2026-10-24T18:30:00.000Z',
};

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  },
});

const expectCode = async (
  operation: Promise<unknown> | (() => unknown),
  code: string,
): Promise<void> => {
  try {
    await (typeof operation === 'function' ? operation() : operation);
    assert.fail(`Expected ProgressBackupError code ${code}`);
  } catch (error) {
    assert.ok(error instanceof ProgressBackupError, `Expected ProgressBackupError, got ${String(error)}`);
    assert.equal(error.code, code);
  }
};

test('encrypted backup round-trips progress and game achievements', async () => {
  const backup = await createEncryptedProgressBackup(profile, gameProgress, PASSWORD);
  assert.ok(backup.contents.length > 0);
  assert.ok(!backup.contents.includes('Test Learner'));
  assert.ok(!backup.contents.includes('correct horse'));

  const metadata = inspectProgressBackup(backup.contents);
  assert.equal(metadata.schemaVersion, 1);
  assert.equal(metadata.iterations, 210_000);
  assert.equal(metadata.ciphertextBytes > 0, true);

  const decrypted = await decryptProgressBackup(backup.contents, PASSWORD);
  assert.equal(decrypted.profile.displayName, profile.displayName);
  assert.equal(decrypted.profile.xp, profile.xp);
  assert.deepEqual(decrypted.profile.completedLessonIds, profile.completedLessonIds);
  assert.equal(decrypted.profile.levelExamResults['1'].bestScore, 90);
  assert.equal(decrypted.profile.languageProgress?.fr?.completedLessonIds[0], 'fr-1');
  assert.deepEqual(decrypted.gameProgress, gameProgress);

  const summary = summarizeProgress(decrypted.profile, decrypted.gameProgress);
  assert.equal(summary.currentStage, 2);
  assert.equal(summary.totalCompletedLessons, 3);
  assert.equal(summary.gameSolved, 12);
});

test('the same password is required to restore a backup', async () => {
  const backup = await createEncryptedProgressBackup(profile, gameProgress, PASSWORD);
  await expectCode(decryptProgressBackup(backup.contents, 'wrong password'), 'AUTHENTICATION_FAILED');
});

test('tampered ciphertext is rejected instead of restoring damaged data', async () => {
  const backup = await createEncryptedProgressBackup(profile, gameProgress, PASSWORD);
  const envelope = JSON.parse(backup.contents) as { ciphertext: string };
  const index = Math.floor(envelope.ciphertext.length / 2);
  envelope.ciphertext =
    envelope.ciphertext.slice(0, index) +
    (envelope.ciphertext[index] === 'A' ? 'B' : 'A') +
    envelope.ciphertext.slice(index + 1);
  await expectCode(decryptProgressBackup(JSON.stringify(envelope), PASSWORD), 'AUTHENTICATION_FAILED');
});

test('invalid JSON and unknown formats are rejected before import', async () => {
  await expectCode(
    () => inspectProgressBackup('{not-json'),
    'INVALID_JSON',
  );
  await expectCode(
    () => inspectProgressBackup(JSON.stringify({ format: 'another-app', schemaVersion: 1 })),
    'INVALID_FORMAT',
  );
});

test('older unencrypted backups are identified as legacy, not silently imported', async () => {
  await expectCode(
    () =>
      inspectProgressBackup(
        JSON.stringify({
          format: 'englishtok-progress-backup',
          schemaVersion: 1,
          code: 'ABC123',
          createdAt: '2026-01-01T00:00:00.000Z',
          profile,
        }),
      ),
    'LEGACY_FORMAT',
  );
});

test('unsupported backup versions are rejected', async () => {
  const backup = await createEncryptedProgressBackup(profile, gameProgress, PASSWORD);
  const envelope = JSON.parse(backup.contents) as { schemaVersion: number };
  envelope.schemaVersion = 99;
  await expectCode(
    () => inspectProgressBackup(JSON.stringify(envelope)),
    'UNSUPPORTED_VERSION',
  );
});

test('short export passwords are rejected', async () => {
  await expectCode(
    () => createEncryptedProgressBackup(profile, gameProgress, '1234567'),
    'WEAK_PASSWORD',
  );
});

test('pre-import safety snapshot can be saved and read back', () => {
  clearPreImportSnapshot();
  const snapshot = savePreImportSnapshot(profile, gameProgress, '2026-10-01T10:10:00.000Z');
  assert.equal(snapshot.profile.displayName, profile.displayName);
  assert.equal(snapshot.gameProgress.totalSolved, gameProgress.totalSolved);

  const loaded = getPreImportSnapshot();
  assert.ok(loaded);
  assert.equal(loaded.profile.xp, profile.xp);
  assert.deepEqual(loaded.profile.completedLessonIds, profile.completedLessonIds);
  assert.deepEqual(loaded.gameProgress, gameProgress);

  clearPreImportSnapshot();
  assert.equal(getPreImportSnapshot(), null);
});

test('the old default display name is migrated without touching custom names', () => {
  const migrated = validateProgressBackupProfile({
    ...profile,
    displayName: 'متعلّم EnglishTok',
  });
  assert.ok(migrated);
  assert.equal(migrated.displayName, 'متعلّم Lin Go');

  const custom = validateProgressBackupProfile({
    ...profile,
    displayName: 'اسم مخصص',
  });
  assert.ok(custom);
  assert.equal(custom.displayName, 'اسم مخصص');
});
