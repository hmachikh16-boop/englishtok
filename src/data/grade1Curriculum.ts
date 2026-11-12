/**
 * Grade 1 (الصف الأول الابتدائي) curriculum.
 *
 * 50 lessons across 5 units. Each lesson carries four target words (emoji is
 * used as the picture so the module has zero external image dependencies and
 * stays crisp on every screen) and one primary activity.
 *
 * Activity types map directly to the classroom worksheets:
 *  - match    → connect a picture to its word
 *  - circle   → circle the correct word for a picture
 *  - trace    → trace the dotted word with a finger
 *  - count    → count the objects and write the number
 *  - complete → fill the missing letter (b_g → bag)
 */
export type Grade1Activity = 'match' | 'circle' | 'trace' | 'count' | 'complete';

export interface Grade1Word {
  en: string;
  ar: string;
  emoji: string;
}

export interface Grade1Lesson {
  id: string;
  unit: number;
  unitAr: string;
  topic: string;
  topicAr: string;
  activity: Grade1Activity;
  words: Grade1Word[];
  /** For the count activity. */
  count?: number;
  countEmoji?: string;
  /** For the complete activity: the word and the index of the missing letter. */
  completeWord?: string;
  completeIndex?: number;
}

const ACTIVITY_CYCLE: Grade1Activity[] = ['match', 'circle', 'trace', 'count', 'complete'];

const SCHOOL: Grade1Word[] = [
  { en: 'book', ar: 'كتاب', emoji: '📕' },
  { en: 'pen', ar: 'قلم حبر', emoji: '🖊️' },
  { en: 'pencil', ar: 'قلم رصاص', emoji: '✏️' },
  { en: 'bag', ar: 'حقيبة', emoji: '🎒' },
  { en: 'ruler', ar: 'مسطرة', emoji: '📏' },
  { en: 'eraser', ar: 'ممحاة', emoji: '🧽' },
  { en: 'table', ar: 'طاولة', emoji: '🪑' },
  { en: 'chair', ar: 'كرسي', emoji: '🪑' },
  { en: 'sharpener', ar: 'مبراة', emoji: '🖍️' },
  { en: 'crayon', ar: 'طباشير ملوّن', emoji: '🖍️' },
];

const COLORS: Grade1Word[] = [
  { en: 'red', ar: 'أحمر', emoji: '🔴' },
  { en: 'blue', ar: 'أزرق', emoji: '🔵' },
  { en: 'green', ar: 'أخضر', emoji: '🟢' },
  { en: 'yellow', ar: 'أصفر', emoji: '🟡' },
  { en: 'brown', ar: 'بني', emoji: '🟤' },
  { en: 'black', ar: 'أسود', emoji: '⚫' },
  { en: 'white', ar: 'أبيض', emoji: '⚪' },
  { en: 'pink', ar: 'وردي', emoji: '🩷' },
  { en: 'orange', ar: 'برتقالي', emoji: '🟠' },
  { en: 'purple', ar: 'بنفسجي', emoji: '🟣' },
];

const FAMILY: Grade1Word[] = [
  { en: 'mother', ar: 'أم', emoji: '👩' },
  { en: 'father', ar: 'أب', emoji: '👨' },
  { en: 'sister', ar: 'أخت', emoji: '👧' },
  { en: 'brother', ar: 'أخ', emoji: '👦' },
  { en: 'grandfather', ar: 'جد', emoji: '👴' },
  { en: 'grandmother', ar: 'جدة', emoji: '👵' },
  { en: 'baby', ar: 'طفل صغير', emoji: '👶' },
  { en: 'family', ar: 'عائلة', emoji: '👨‍👩‍👧‍👦' },
  { en: 'aunt', ar: 'عمة/خالة', emoji: '👩‍🦰' },
  { en: 'uncle', ar: 'عم/خال', emoji: '👨‍🦱' },
];

const ANIMALS: Grade1Word[] = [
  { en: 'cat', ar: 'قطة', emoji: '🐱' },
  { en: 'dog', ar: 'كلب', emoji: '🐶' },
  { en: 'bird', ar: 'طائر', emoji: '🐦' },
  { en: 'fish', ar: 'سمكة', emoji: '🐟' },
  { en: 'lion', ar: 'أسد', emoji: '🦁' },
  { en: 'elephant', ar: 'فيل', emoji: '🐘' },
  { en: 'monkey', ar: 'قرد', emoji: '🐵' },
  { en: 'rabbit', ar: 'أرنب', emoji: '🐰' },
  { en: 'cow', ar: 'بقرة', emoji: '🐮' },
  { en: 'duck', ar: 'بطة', emoji: '🦆' },
];

const NUMBERS: Grade1Word[] = [
  { en: 'one', ar: 'واحد', emoji: '1️⃣' },
  { en: 'two', ar: 'اثنان', emoji: '2️⃣' },
  { en: 'three', ar: 'ثلاثة', emoji: '3️⃣' },
  { en: 'four', ar: 'أربعة', emoji: '4️⃣' },
  { en: 'five', ar: 'خمسة', emoji: '5️⃣' },
  { en: 'six', ar: 'ستة', emoji: '6️⃣' },
  { en: 'seven', ar: 'سبعة', emoji: '7️⃣' },
  { en: 'eight', ar: 'ثمانية', emoji: '8️⃣' },
  { en: 'nine', ar: 'تسعة', emoji: '9️⃣' },
  { en: 'ten', ar: 'عشرة', emoji: '🔟' },
  { en: 'circle', ar: 'دائرة', emoji: '⭕' },
  { en: 'square', ar: 'مربع', emoji: '🟦' },
  { en: 'triangle', ar: 'مثلث', emoji: '🔺' },
  { en: 'star', ar: 'نجمة', emoji: '⭐' },
];

interface UnitSpec {
  unit: number;
  unitAr: string;
  words: Grade1Word[];
  topicEn: (index: number, word: Grade1Word) => string;
  topicAr: (index: number, word: Grade1Word) => string;
}

const UNITS: UnitSpec[] = [
  {
    unit: 1,
    unitAr: 'المدرسة',
    words: SCHOOL,
    topicEn: (i, word) => (i === 9 ? 'School Review' : `School Objects: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة أدوات المدرسة' : `أدوات المدرسة: ${word.ar}`),
  },
  {
    unit: 2,
    unitAr: 'الألوان',
    words: COLORS,
    topicEn: (i, word) => (i === 9 ? 'Colors Review' : `Colors: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة الألوان' : `الألوان: ${word.ar}`),
  },
  {
    unit: 3,
    unitAr: 'العائلة',
    words: FAMILY,
    topicEn: (i, word) => (i === 9 ? 'Family Review' : `Family: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة العائلة' : `العائلة: ${word.ar}`),
  },
  {
    unit: 4,
    unitAr: 'الحيوانات',
    words: ANIMALS,
    topicEn: (i, word) => (i === 9 ? 'Animals Review' : `Animals: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة الحيوانات' : `الحيوانات: ${word.ar}`),
  },
  {
    unit: 5,
    unitAr: 'الأرقام والأشكال',
    words: NUMBERS,
    topicEn: (i, word) => (i === 9 ? 'Numbers & Shapes Review' : `Numbers & Shapes: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة الأرقام والأشكال' : `الأرقام والأشكال: ${word.ar}`),
  },
];

/** Build a wrap-around group of four words beginning at `start`. */
const group = (words: Grade1Word[], start: number): Grade1Word[] =>
  Array.from({ length: 4 }, (_, offset) => words[(start + offset) % words.length]);

/** Pick a letter to hide for the complete activity (prefer a vowel). */
const pickMissingIndex = (word: string): number => {
  for (let i = 1; i < word.length - 1; i += 1) {
    if ('aeiou'.includes(word[i])) return i;
  }
  return Math.max(1, Math.floor(word.length / 2));
};

const buildLessons = (): Grade1Lesson[] => {
  const lessons: Grade1Lesson[] = [];
  let serial = 1;
  for (const unit of UNITS) {
    for (let index = 0; index < 10; index += 1) {
      const target = unit.words[index % unit.words.length];
      const activity = ACTIVITY_CYCLE[index % ACTIVITY_CYCLE.length];
      const lesson: Grade1Lesson = {
        id: `g1-u${unit.unit}-l${String(index + 1).padStart(2, '0')}`,
        unit: unit.unit,
        unitAr: unit.unitAr,
        topic: unit.topicEn(index, target),
        topicAr: unit.topicAr(index, target),
        activity,
        words: group(unit.words, index),
      };
      if (activity === 'count') {
        lesson.count = 1 + ((serial * 3) % 10);
        lesson.countEmoji = target.emoji;
      }
      if (activity === 'complete') {
        const word = target.en;
        lesson.completeWord = word;
        lesson.completeIndex = pickMissingIndex(word);
        // Keep the target first in the group so the complete activity is clear.
        lesson.words = [target, ...group(unit.words, index + 1).slice(0, 3)];
      }
      lessons.push(lesson);
      serial += 1;
    }
  }
  return lessons;
};

export const GRADE1_LESSONS: Grade1Lesson[] = buildLessons();

export const GRADE1_UNITS = UNITS.map((unit) => ({
  unit: unit.unit,
  unitAr: unit.unitAr,
  lessonCount: GRADE1_LESSONS.filter((lesson) => lesson.unit === unit.unit).length,
}));

export const grade1ActivityLabel = (activity: Grade1Activity): string => {
  switch (activity) {
    case 'match':
      return 'الربط';
    case 'circle':
      return 'اختر الكلمة';
    case 'trace':
      return 'الكتابة';
    case 'count':
      return 'العد';
    case 'complete':
      return 'أكمل الحرف';
    default:
      return activity;
  }
};
