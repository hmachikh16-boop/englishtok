import type {
  Character,
  DialogueLine,
  Lesson,
  QuizQuestion,
  VocabularyWord,
} from '../../types';
import type { ExpansionLessonSpec } from './types';
import { PRONUNCIATIONS } from './pronunciations';

/** Deterministic 32-bit FNV-1a hash, used to vary options and counters. */
const hash = (value: string): number => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const rotate = <T,>(items: T[], offset: number): T[] => {
  if (items.length === 0) return items;
  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
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

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const blankOut = (sentence: string, word: string): string => {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
  if (pattern.test(sentence)) return sentence.replace(pattern, '___');
  return sentence.replace(new RegExp(escapeRegExp(word), 'i'), '___');
};

const tokenize = (sentence: string): string[] =>
  sentence
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .filter(Boolean);

const normalizeKey = (word: string): string =>
  word.trim().toLowerCase().replace(/\s+/g, ' ');

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

/**
 * Turns the compact expansion source into the same `Lesson` shape the rest of
 * the app already consumes.
 *
 * Dialogue: opening (B) → one example per word (A/B/A/B) → closing (A).
 * Quiz: meaning MCQ, fill-in from example #2, arrange from `structureEn`, and
 * a reverse meaning MCQ. Everything is derived from the four words, so a
 * lesson cannot drift out of sync with its own exercises.
 */
export const buildExpansionLesson = (
  spec: ExpansionLessonSpec,
  characters: readonly [Character, Character],
): Lesson => {
  const [characterA, characterB] = characters;
  const [firstWord, secondWord, , fourthWord] = spec.words;

  const speakers: Array<'A' | 'B'> = ['A', 'B', 'A', 'B'];
  const emotions: Array<DialogueLine['emotion']> = [
    'explaining',
    'happy',
    'curious',
    'surprised',
  ];
  type BuiltLine = {
    speaker: 'A' | 'B';
    en: string;
    ar: string;
    emotion: DialogueLine['emotion'];
    highlight?: string[];
  };
  const lines: BuiltLine[] = [
    {
      speaker: 'B',
      en: spec.openingEn,
      ar: spec.openingAr,
      emotion: 'curious',
    },
    ...spec.words.map((word, index) => ({
      speaker: speakers[index],
      en: word[3],
      ar: word[4],
      emotion: emotions[index],
      highlight: [word[0]],
    })),
    {
      speaker: 'A',
      en: spec.closingEn,
      ar: spec.closingAr,
      emotion: 'happy',
    },
  ];

  const vocabulary: VocabularyWord[] = spec.words.map((word, index) => ({
    id: `${spec.id}-v${index + 1}`,
    word: word[0],
    phonetic: PRONUNCIATIONS[normalizeKey(word[0])] ?? '',
    partOfSpeech: word[1],
    translationAr: word[2],
    exampleSentence: word[3],
    exampleSentenceAr: word[4],
  }));

  const translations = unique(spec.words.map((word) => word[2]));
  const words = unique(spec.words.map((word) => word[0]));

  const firstOptions = rotate(translations, hash(`${spec.id}:meaning`) % Math.max(1, translations.length));
  const meaningQuestion: QuizQuestion = {
    id: `${spec.id}-q1`,
    type: 'multiple_choice',
    questionAr: `ما معنى كلمة «${firstWord[0]}»؟`,
    options: firstOptions,
    correctAnswer: firstWord[2],
    explanationAr: `${firstWord[0]} تعني «${firstWord[2]}». مثال: ${firstWord[3]}`,
  };

  const blanked = blankOut(secondWord[3], secondWord[0]);
  const fillQuestion: QuizQuestion = {
    id: `${spec.id}-q2`,
    type: 'fill_blank',
    questionAr: `أكمل الجملة: ${blanked}`,
    questionEn: blanked,
    options: [],
    correctAnswer: secondWord[0],
    explanationAr: `الإجابة الصحيحة: ${secondWord[0]}. ${secondWord[4]}`,
  };

  const arrangeTokens = seededShuffle(tokenize(spec.structureEn), hash(`${spec.id}:arrange`));
  const arrangeQuestion: QuizQuestion = {
    id: `${spec.id}-q3`,
    type: 'arrange_sentence',
    questionAr: 'رتّب الكلمات لتكوين جملة صحيحة:',
    promptAr: spec.structureAr,
    options: arrangeTokens,
    correctAnswer: spec.structureEn,
    explanationAr: `الترتيب الصحيح: ${spec.structureEn}`,
  };

  const reverseOptions = rotate(words, hash(`${spec.id}:reverse`) % Math.max(1, words.length));
  const reverseQuestion: QuizQuestion = {
    id: `${spec.id}-q4`,
    type: 'multiple_choice',
    questionAr: `أي كلمة تعني «${fourthWord[2]}»؟`,
    options: reverseOptions,
    correctAnswer: fourthWord[0],
    explanationAr: `${fourthWord[0]} تعني «${fourthWord[2]}». مثال: ${fourthWord[3]}`,
  };

  return {
    id: spec.id,
    slug: spec.slug,
    title: spec.title,
    titleAr: spec.titleAr,
    descriptionAr: spec.descriptionAr,
    learningNoteAr: `الهدف: ${spec.objectiveAr} البنية: ${spec.structureEn} (${spec.structureAr}).${spec.methodNoteAr ? ` ${spec.methodNoteAr}` : ''}`,
    category: spec.category,
    level: spec.level,
    curriculumStage: spec.stage,
    sceneType: spec.scene,
    characterA,
    characterB,
    dialogue: lines.map((line, index) => ({
      id: `${spec.id}-s${String(index + 1).padStart(2, '0')}`,
      speakerId: line.speaker === 'A' ? characterA.id : characterB.id,
      textEn: line.en,
      textAr: line.ar,
      durationSec: Math.max(2.2, Math.round(line.en.split(/\s+/).length * 0.36 * 10) / 10),
      emotion: line.emotion,
      ...(line.highlight ? { highlightWords: line.highlight } : {}),
    })),
    vocabulary,
    quiz: [meaningQuestion, fillQuestion, arrangeQuestion, reverseQuestion],
    likesCount: 180 + spec.stage * 40 + (hash(spec.id) % 120),
    sharesCount: 45 + spec.stage * 12 + (hash(`${spec.id}:share`) % 40),
    savedCount: 130 + spec.stage * 25 + (hash(`${spec.id}:save`) % 80),
  };
};
