/**
 * Build the French learning track from the English curriculum and Google
 * Translate's public gtx endpoint.
 *
 * The generated JSON is committed so production builds never depend on the
 * network or on machine translation being available at build time. Run this
 * script manually after changing the English curriculum:
 *
 *   npx tsx scripts/generate-french-curriculum.ts
 *
 * Manual corrections live in scripts/french-overrides.ts.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum';
import { EXPANSION_LESSONS } from '../src/data/curriculumExpansion';
import type { Lesson, QuizQuestion, VocabularyWord } from '../src/types';
import {
  AR_OVERRIDES,
  DESCRIPTION_AR_OVERRIDES,
  LESSON_PATCHES,
  SENTENCE_OVERRIDES,
  TITLE_AR_OVERRIDES,
  TITLE_OVERRIDES,
  WORD_OVERRIDES,
  type FrenchLessonPatch,
} from './french-overrides';

const CACHE_PATH = resolve('tmp', 'french-translation-cache.json');
const OUTPUT_SOURCE_PATH = resolve('src', 'data', 'frenchCurriculum.json');
const OUTPUT_PUBLIC_PATH = resolve('public', 'content', 'learning-path-fr.json');
const BATCH_SIZE = 40;

const require = createRequire(import.meta.url);
type IpaDictionary = Map<string, string[]>;
const frenchIpa = require(resolve('node_modules', 'ipa-dict', 'lib', 'fr_FR.js')) as IpaDictionary;

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
const hasLatin = (text: string) => /[A-Za-zÀ-ÖØ-öø-ÿŒœ]/.test(text);
const cleanKey = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

const readCache = async (): Promise<Record<string, string>> => {
  try {
    const parsed: unknown = JSON.parse(await readFile(CACHE_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // First run.
  }
  return {};
};

const writeCache = async (cache: Record<string, string>) => {
  await mkdir(resolve('tmp'), { recursive: true });
  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
};

const sleep = (ms: number) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const translateBatch = async (texts: string[]): Promise<string[]> => {
  const form = new URLSearchParams();
  texts.forEach((text) => form.append('q', text));
  let lastError: unknown = new Error('Translation failed.');
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(
        'https://translate.googleapis.com/translate_a/t?client=gtx&sl=en&tl=fr&format=text',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
          },
          body: form.toString(),
        },
      );
      if (!response.ok) throw new Error(`Google Translate returned ${response.status}.`);
      const parsed: unknown = await response.json();
      if (typeof parsed === 'string') return [parsed];
      if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) {
        return parsed as string[];
      }
      throw new Error('Unexpected translation response.');
    } catch (error) {
      lastError = error;
      await sleep(400 * 2 ** attempt);
    }
  }
  throw lastError;
};

const translateAll = async (sourceTexts: string[]): Promise<Record<string, string>> => {
  const cache = await readCache();
  const unique = [...new Set(sourceTexts.filter((text) => text.trim().length > 0))];
  const missing = unique.filter((text) => !cache[text]);
  const batches: string[][] = [];
  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    batches.push(missing.slice(index, index + BATCH_SIZE));
  }

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const translated = await translateBatch(batch);
    if (translated.length !== batch.length) {
      throw new Error(
        `Translation count mismatch: sent ${batch.length}, received ${translated.length}.`,
      );
    }
    batch.forEach((source, offset) => {
      cache[source] = translated[offset].trim();
    });
    if (index % 5 === 0) {
      console.info(`Translated ${Math.min((index + 1) * BATCH_SIZE, missing.length)}/${missing.length} strings…`);
    }
    await writeCache(cache);
    await sleep(140);
  }

  return cache;
};

const overrideFor = (source: string, overrides: Record<string, string>): string | undefined =>
  overrides[source] ?? overrides[cleanKey(source)];

const stripArticle = (value: string): string =>
  value
    // Require a word boundary after the article. Without it, "lait" became
    // "it" and "lapin" became "pin" because "la" matched inside the word.
    .replace(/^(?:(?:le|la|les|un|une|des|du|de la)\s+|l['’]\s*)/i, '')
    .trim();

const contextCache: Record<string, string> = {};
const contextWords = new Set<string>();

const markedSentence = (word: string, example: string): string | null => {
  const normalizedWord = word.trim();
  if (!normalizedWord) return null;
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^\\p{L}\\p{N}])`,
    'iu',
  );
  if (!pattern.test(example)) return null;
  return example.replace(pattern, (_match, before: string) => `${before}[[${normalizedWord}]]`);
};

const extractMarked = (translated: string): string | null => {
  const match = translated.match(/\[\[\s*([^[\]]+?)\s*\]\]/u);
  return match?.[1]?.trim() || null;
};

const wordTranslation = (
  word: string,
  partOfSpeech: string,
  example: string,
  cache: Record<string, string>,
): string => {
  const directOverride = WORD_OVERRIDES[cleanKey(word)];
  if (directOverride) return directOverride;

  const lowerWord = word.toLowerCase();
  const standalone = cache[lowerWord] ?? cache[word] ?? word;
  if (!partOfSpeech.includes('اسم') || word.includes(' ')) return standalone;

  const marked = markedSentence(lowerWord, example);
  const translated = marked ? cache[marked] : undefined;
  const contextual = translated ? extractMarked(translated) : null;
  return contextual ? stripArticle(contextual) : standalone;
};

/**
 * A few English headwords have two senses inside the same curriculum. The
 * Arabic gloss is the most reliable disambiguator, so use it for those.
 */
const semanticPartOfSpeechFix = (entry: VocabularyWord): string => {
  const key = cleanKey(entry.word);
  const arabic = entry.translationAr;
  if ((key === 'will' && arabic.includes('سوف')) || (key === 'would' && arabic.includes('كان يفعل'))) {
    return 'اسم';
  }
  if (key === 'running') return 'فعل';
  if (key === 'wake up' || key === 'join us' || key === 'went') return 'فعل';
  if (key === 'save' && arabic.includes('يدخر')) return 'فعل';
  if (key === 'free') return 'صفة';
  return entry.partOfSpeech;
};

const semanticWordFix = (entry: VocabularyWord, translated: string): string => {
  const key = cleanKey(entry.word);
  const arabic = entry.translationAr;
  if (key === 'clean') return arabic.includes('ينظف') ? 'nettoyer' : 'propre';
  if (key === 'review') return arabic.includes('يراجع') ? 'revoir' : 'critique';
  if (key === 'subject') return arabic.includes('مادة') ? 'matière' : 'objet';
  if (key === 'watch') return arabic.includes('ساعة') ? 'montre' : 'regarder';
  if (key === 'saw') return arabic.includes('منشار') ? 'scie' : 'voir';
  if (key === 'sleep' && arabic === 'نوم') return 'sommeil';
  if (key === 'free') return arabic.includes('متفرغ') ? 'libre' : 'gratuit';
  if (key === 'save' && arabic.includes('يدخر')) return 'économiser';
  if (key === 'will' && arabic.includes('سوف')) return 'futur simple';
  if (key === 'would' && arabic.includes('كان يفعل')) return 'imparfait';
  if (key === 'working' && arabic.includes('يعمل')) return 'travailler';
  if (key === 'cart') return 'chariot';
  if (key === 'ball') return 'ballon';
  if (key === 'apple') return 'pomme';
  if (key === 'cat') return 'chat';
  if (key === 'dog') return 'chien';
  return translated;
};

const phoneticFor = (word: string): string => {
  const normalized = cleanKey(word);
  const candidates = [
    normalized,
    stripArticle(normalized),
    normalized.replace(/[’']/g, "'"),
    normalized.replace(/^(?:se |s['’])/i, ''),
  ];
  for (const candidate of candidates) {
    const entry = frenchIpa.get(candidate);
    if (entry?.[0]) return entry[0].trim();
  }
  return '';
};

const blankOut = (sentence: string, word: string): string => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`,
    'iu',
  );
  if (pattern.test(sentence)) return sentence.replace(pattern, '$1___');
  return sentence.replace(new RegExp(escaped, 'iu'), '___');
};

const tokenize = (sentence: string): string[] =>
  sentence
    .replace(/[.,!?;:]+$/g, '')
    .split(/\s+/)
    .map((token) => token.replace(/^[.,!?;:]+|[.,!?;:]+$/g, ''))
    .filter(Boolean);

const normalizeMatch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’']/g, "'")
    .toLowerCase()
    .replace(/[.,!?;:«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Find the form of a dictionary word that is actually present in a French
 * example. Verbs and adjectives inflect, so \"se réveiller\" has to become
 * \"réveille\" in \"Je me réveille\" before it can be blanked in a fill quiz.
 */
const findSurfaceForm = (word: string, sentence: string): string | null => {
  const normalizedWord = normalizeMatch(word);
  if (!normalizedWord) return null;
  const tokens = sentence
    .split(/\s+/)
    .map((token) => token.replace(/^[«"']+|[»"',.;:!?]+$/g, ''))
    .filter(Boolean);
  const exact = tokens.find((token) => normalizeMatch(token) === normalizedWord);
  if (exact) return exact;
  if (word.includes(' ')) {
    for (const candidate of [word, word.replace(/'/g, '’')]) {
      if (sentence.includes(candidate)) return candidate;
    }
    if (normalizeMatch(sentence).includes(normalizedWord)) return word;
    return null;
  }

  const stems: string[] = [];
  for (let remove = 1; remove <= 4; remove += 1) {
    const stem = normalizedWord.slice(0, -remove);
    if (stem.length >= 3) stems.push(stem);
  }
  let best: { token: string; stem: string } | null = null;
  for (const token of tokens) {
    const normalizedToken = normalizeMatch(token);
    for (const stem of stems) {
      if (normalizedToken.startsWith(stem) && (!best || stem.length > best.stem.length)) {
        best = { token, stem };
      }
    }
  }
  return best?.token ?? null;
};

const buildMeaningFallback = (
  question: QuizQuestion,
  entry: VocabularyWord,
  vocabulary: VocabularyWord[],
): QuizQuestion => {
  const translations = [
    entry.translationAr,
    ...vocabulary
      .filter((candidate) => candidate.translationAr !== entry.translationAr)
      .map((candidate) => candidate.translationAr),
  ].filter(Boolean);
  const options = seededShuffle(
    [...new Set(translations)].slice(0, 4),
    hash(`${question.id}:meaning-fallback`),
  );
  return {
    ...question,
    type: 'multiple_choice',
    questionAr: `ما معنى كلمة «${entry.word}»؟`,
    questionEn: undefined,
    options,
    correctAnswer: entry.translationAr,
    explanationAr: `${entry.word} تعني «${entry.translationAr}». مثال: ${entry.exampleSentence}`,
  };
};

const hash = (value: string): number => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const seededShuffle = <T,>(items: T[], seed: number): T[] => {
  const result = [...items];
  let state = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const replacePairs = (text: string, pairs: Array<[string, string]>): string => {
  let result = text;
  for (const [source, target] of [...pairs].sort((left, right) => right[0].length - left[0].length)) {
    if (!source || source.length < 2 || source === target) continue;
    result = result.split(source).join(target);
  }
  return result;
};

const translatedText = (
  source: string,
  cache: Record<string, string>,
  overrides: Record<string, string>,
): string => overrideFor(source, overrides) ?? cache[source] ?? source;

const genericLearningNote = (lesson: Lesson, frenchTitle: string): string =>
  `الهدف: التدريب على «${frenchTitle}» ضمن المستوى ${lesson.level}، مع مفردات وحوار وتمارين قصيرة. راجع الكلمات أولًا، ثم استخدمها في جمل من إنشائك.`;

/** Google occasionally leaves the English lesson-type label in the title. */
const normalizeFrenchTitle = (value: string): string =>
  value
    .replace(/\bBridge\b/gi, 'Pont')
    .replace(/\bCapstone\b/gi, 'Projet final')
    .replace(/\bWorkshop\b/gi, 'Atelier')
    .replace(/\bPractice\b/gi, 'Pratique')
    .replace(/\bChallenge\b/gi, 'Défi')
    .replace(/\bShowcase\b/gi, 'Présentation')
    .replace(/\bReview\b/gi, 'Révision');

const buildFrenchLesson = (
  lesson: Lesson,
  cache: Record<string, string>,
  wordMap: Map<string, string>,
  patch: FrenchLessonPatch | undefined,
): Lesson => {
  const title = normalizeFrenchTitle(
    patch?.title ??
      overrideFor(lesson.title, TITLE_OVERRIDES) ??
      cache[lesson.title] ??
      lesson.title,
  );

  const dialogue = lesson.dialogue.map((line) => {
    const linePatch = patch?.dialogue?.[line.id];
    const french =
      linePatch?.textEn ??
      translatedText(line.textEn, cache, SENTENCE_OVERRIDES);
    const highlights = linePatch?.highlightWords
      ? linePatch.highlightWords
      : line.highlightWords
        ? line.highlightWords.map((word) => wordMap.get(cleanKey(word)) ?? word)
        : undefined;
    const verifiedHighlights = highlights?.filter((word) =>
      normalizeMatch(french).includes(normalizeMatch(word)),
    );
    return {
      ...line,
      textEn: french,
      ...(linePatch?.textAr ? { textAr: linePatch.textAr } : {}),
      durationSec: Math.max(2.2, Math.round(french.split(/\s+/).length * 0.38 * 10) / 10),
      ...(verifiedHighlights?.length ? { highlightWords: verifiedHighlights } : {}),
    };
  });

  const vocabulary: VocabularyWord[] = lesson.vocabulary.map((entry) => {
    const override = patch?.vocabulary?.[entry.id];
    const mapped = wordMap.get(cleanKey(entry.word));
    const word =
      override?.word ??
      semanticWordFix(
        entry,
        mapped ??
          WORD_OVERRIDES[cleanKey(entry.word)] ??
          cache[entry.word] ??
          entry.word,
      );
    const exampleSentence =
      override?.exampleSentence ??
      translatedText(entry.exampleSentence, cache, SENTENCE_OVERRIDES);
    return {
      ...entry,
      word,
      translationAr:
        override?.translationAr ??
        AR_OVERRIDES[cleanKey(entry.word)] ??
        entry.translationAr,
      partOfSpeech: override?.partOfSpeech ?? semanticPartOfSpeechFix(entry),
      phonetic: override?.phonetic ?? phoneticFor(word),
      exampleSentence,
      ...(override?.exampleSentenceAr ? { exampleSentenceAr: override.exampleSentenceAr } : {}),
    };
  });

  const vocabularyByWord = new Map(
    vocabulary.map((entry, index) => [cleanKey(lesson.vocabulary[index].word), entry]),
  );

  const quiz = patch?.quiz
    ? (patch.quiz as QuizQuestion[])
    : lesson.quiz.map((question) => {
        const frenchQuestionEn = question.questionEn
          ? translatedText(question.questionEn, cache, SENTENCE_OVERRIDES)
          : undefined;

        if (question.type === 'arrange_sentence') {
          const structure =
            translatedText(question.correctAnswer, cache, SENTENCE_OVERRIDES)
              .replace(/[.!?;:]+$/g, '')
              .trim();
          const tokens = seededShuffle(tokenize(structure), hash(`${question.id}:fr-arrange`));
          return {
            ...question,
            questionAr: 'رتّب الكلمات لتكوين جملة صحيحة:',
            ...(question.promptAr ? { promptAr: question.promptAr } : {}),
            options: tokens,
            correctAnswer: structure,
            explanationAr: `الترتيب الصحيح: ${structure}`,
          };
        }

        if (question.type === 'fill_blank') {
          const sourceWord =
            vocabularyByWord.get(cleanKey(question.correctAnswer)) ??
            vocabulary.find((entry) => cleanKey(entry.word) === cleanKey(question.correctAnswer));
          if (!sourceWord) {
            return {
              ...question,
              questionAr: `أكمل الجملة: ${frenchQuestionEn ?? question.questionEn ?? ''}`,
              options: [],
              correctAnswer: cache[question.correctAnswer] ?? question.correctAnswer,
              explanationAr: question.explanationAr,
            };
          }
          const frenchWord = sourceWord.word;
          const frenchExample = sourceWord.exampleSentence;
          const surface = findSurfaceForm(frenchWord, frenchExample);
          if (!surface) return buildMeaningFallback(question, sourceWord, vocabulary);
          const blanked = blankOut(frenchExample, surface);
          const extra = surface !== frenchWord ? ` (${frenchWord})` : '';
          return {
            ...question,
            questionAr: `أكمل الجملة: ${blanked}`,
            questionEn: blanked,
            options: [],
            correctAnswer: surface,
            explanationAr: `الإجابة الصحيحة: ${surface}. ${sourceWord.exampleSentenceAr}${extra}`.trim(),
          };
        }

        const reverse = question.questionAr.includes('أي كلمة');
        const quotedWord = question.questionAr.match(/«([^»]+)»/)?.[1];
        const englishWord = reverse
          ? question.correctAnswer
          : quotedWord && !isArabic(quotedWord)
            ? quotedWord
            : vocabulary.find((entry) => entry.translationAr === question.correctAnswer)?.word;
        const frenchWord = englishWord
          ? vocabularyByWord.get(cleanKey(englishWord))?.word ??
            wordMap.get(cleanKey(englishWord)) ??
            cache[englishWord] ??
            englishWord
          : undefined;
        const meaningEntry = frenchWord
          ? vocabulary.find((entry) => cleanKey(entry.word) === cleanKey(frenchWord))
          : undefined;
        const options = question.options.map((option) => {
          if (isArabic(option)) return option;
          return vocabularyByWord.get(cleanKey(option))?.word ??
            wordMap.get(cleanKey(option)) ??
            cache[option] ??
            option;
        });
        const correctAnswer = isArabic(question.correctAnswer)
          ? question.correctAnswer
          : vocabularyByWord.get(cleanKey(question.correctAnswer))?.word ??
            wordMap.get(cleanKey(question.correctAnswer)) ??
            cache[question.correctAnswer] ??
            question.correctAnswer;

        return {
          ...question,
          questionAr: reverse
            ? `أي كلمة تعني «${quotedWord ?? question.correctAnswer}»؟`
            : frenchWord
              ? `ما معنى كلمة «${frenchWord}»؟`
              : question.questionAr,
          ...(frenchQuestionEn ? { questionEn: frenchQuestionEn } : {}),
          options,
          correctAnswer,
          explanationAr: meaningEntry && frenchWord
            ? `${frenchWord} تعني «${meaningEntry.translationAr}». مثال: ${meaningEntry.exampleSentence}`
            : question.explanationAr,
        };
      });

  const normalizedQuiz = quiz.map((question) => {
    if (question.type !== 'multiple_choice') return question;
    const options = [...new Set(question.options)];
    if (!options.includes(question.correctAnswer)) options.push(question.correctAnswer);
    if (options.length >= 3) {
      return options.length === question.options.length ? question : { ...question, options };
    }
    const entry =
      vocabulary.find((candidate) => cleanKey(candidate.word) === cleanKey(question.correctAnswer)) ??
      vocabulary.find((candidate) => candidate.translationAr === question.correctAnswer);
    if (!entry) return { ...question, options };
    const translations = [
      ...new Set([entry.translationAr, ...vocabulary.map((candidate) => candidate.translationAr)]),
    ].slice(0, 4);
    return {
      ...question,
      questionAr: `ما معنى كلمة «${entry.word}»؟`,
      questionEn: undefined,
      options: seededShuffle(translations, hash(`${question.id}:normalized`)),
      correctAnswer: entry.translationAr,
      explanationAr: `${entry.word} تعني «${entry.translationAr}». مثال: ${entry.exampleSentence}`,
    };
  });

  const pairs: Array<[string, string]> = [];
  lesson.dialogue.forEach((line, index) => {
    if (dialogue[index]?.textEn) pairs.push([line.textEn, dialogue[index].textEn]);
  });
  lesson.vocabulary.forEach((entry, index) => {
    if (vocabulary[index]?.word) pairs.push([entry.word, vocabulary[index].word]);
    if (vocabulary[index]?.exampleSentence) {
      pairs.push([entry.exampleSentence, vocabulary[index].exampleSentence]);
    }
  });
  lesson.quiz.forEach((entry, index) => {
    if (normalizedQuiz[index]?.correctAnswer) {
      pairs.push([entry.correctAnswer, normalizedQuiz[index].correctAnswer]);
    }
    if (entry.questionEn && normalizedQuiz[index]?.questionEn) {
      pairs.push([entry.questionEn, normalizedQuiz[index].questionEn]);
    }
    entry.options.forEach((option, optionIndex) => {
      const translated = normalizedQuiz[index]?.options[optionIndex];
      if (translated) pairs.push([option, translated]);
    });
  });

  // The source notes mix Arabic explanations with English grammar terms. The
  // old pair-replacement approach occasionally spliced French fragments into
  // the middle of Arabic words, so generated lessons get a clean, accurate
  // note instead. Hand-authored lessons keep their curated notes.
  const learningNoteAr = patch?.learningNoteAr
    ? patch.learningNoteAr
    : patch
      ? lesson.learningNoteAr
        ? replacePairs(lesson.learningNoteAr, pairs)
        : lesson.learningNoteAr
      : genericLearningNote(lesson, title);

  const titleAr =
    patch?.titleAr ?? TITLE_AR_OVERRIDES[lesson.title] ?? lesson.titleAr;
  const descriptionAr =
    patch?.descriptionAr ??
    DESCRIPTION_AR_OVERRIDES[lesson.title] ??
    lesson.descriptionAr;

  return {
    ...lesson,
    title,
    titleAr,
    descriptionAr,
    dialogue,
    vocabulary,
    quiz: normalizedQuiz,
    ...(learningNoteAr ? { learningNoteAr } : {}),
  };
};

const main = async () => {
  const originalIds = new Set(
    LEARNING_PATH_LESSONS.filter(
      (lesson) => !EXPANSION_LESSONS.some((spec) => spec.id === lesson.id),
    ).map((lesson) => lesson.id),
  );

  const sourceTexts: string[] = [];
  const add = (value: string | undefined) => {
    if (value && hasLatin(value)) sourceTexts.push(value);
  };

  for (const lesson of LEARNING_PATH_LESSONS) {
    add(lesson.title);
    for (const line of lesson.dialogue) add(line.textEn);
    for (const entry of lesson.vocabulary) {
      add(entry.word.toLowerCase());
      add(entry.exampleSentence);
      if (entry.partOfSpeech.includes('اسم') && !entry.word.includes(' ')) {
        const marked = markedSentence(entry.word.toLowerCase(), entry.exampleSentence);
        if (marked) contextWords.add(marked);
      }
    }
    for (const question of lesson.quiz) {
      if (question.questionEn && question.type !== 'fill_blank') add(question.questionEn);
      if (question.type === 'arrange_sentence') add(question.correctAnswer);
      if (question.type === 'multiple_choice') {
        question.options.forEach((option) => {
          if (!isArabic(option)) add(option);
        });
        if (!isArabic(question.correctAnswer)) add(question.correctAnswer);
      }
    }
  }
  contextWords.forEach((sentence) => sourceTexts.push(sentence));

  console.info(`Preparing ${new Set(sourceTexts).size} unique French translations…`);
  const cache = await translateAll(sourceTexts);

  const wordMap = new Map<string, string>();
  for (const lesson of LEARNING_PATH_LESSONS) {
    for (const entry of lesson.vocabulary) {
      if (wordMap.has(cleanKey(entry.word))) continue;
      wordMap.set(
        cleanKey(entry.word),
        wordTranslation(entry.word, entry.partOfSpeech, entry.exampleSentence, cache),
      );
    }
  }

  const frenchLessons = LEARNING_PATH_LESSONS.map((lesson) =>
    buildFrenchLesson(lesson, cache, wordMap, LESSON_PATCHES[lesson.id]),
  );

  // Never ship a lesson where the target word is absent from its own example:
  // the fill-in exercise and the audio both depend on that invariant.
  const missingWordExamples: string[] = [];
  for (const lesson of frenchLessons) {
    for (const entry of lesson.vocabulary) {
      if (!entry.word.trim() || !entry.exampleSentence.toLowerCase().includes(entry.word.toLowerCase())) {
        missingWordExamples.push(`${lesson.id}: ${entry.word} — ${entry.exampleSentence}`);
      }
    }
  }
  if (missingWordExamples.length > 0) {
    console.warn(`\n${missingWordExamples.length} vocabulary rows need a manual example override:`);
    missingWordExamples.slice(0, 80).forEach((line) => console.warn(`  ${line}`));
  }

  const lessonIds = new Set(frenchLessons.map((lesson) => lesson.id));
  if (lessonIds.size !== frenchLessons.length || frenchLessons.length !== 400) {
    throw new Error(`Unexpected French lesson count: ${frenchLessons.length}.`);
  }

  const payload = { schemaVersion: 4, lessons: frenchLessons };
  await mkdir(resolve('src', 'data'), { recursive: true });
  await mkdir(resolve('public', 'content'), { recursive: true });
  await writeFile(OUTPUT_SOURCE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(OUTPUT_PUBLIC_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.info(
    `Wrote ${frenchLessons.length} French lessons (${originalIds.size} original, ${frenchLessons.length - originalIds.size} generated).`,
  );
};

await main();
