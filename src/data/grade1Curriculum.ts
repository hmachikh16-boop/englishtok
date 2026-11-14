/**
 * Grade 1 (الصف الأول الابتدائي) curriculum.
 *
 * 70 lessons across 7 units. Each lesson carries four target words (emoji is
 * used as the picture so the module has zero external image dependencies and
 * stays crisp on every screen) and one primary activity.
 *
 * Activity types map directly to the classroom worksheets:
 *  - match    → connect a picture to its word
 *  - circle   → circle the correct word for a picture
 *  - trace    → trace the dotted word with a finger
 *  - count    → count the objects and write the number
 *  - complete → fill the missing letter (b_g → bag)
 *  - color    → pick a colour, then tap a region to fill it (Colours unit)
 */
export type Grade1Activity = 'match' | 'circle' | 'trace' | 'count' | 'complete' | 'color';

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

const HOME: Grade1Word[] = [
  { en: 'house', ar: 'منزل', emoji: '🏠' },
  { en: 'door', ar: 'باب', emoji: '🚪' },
  { en: 'window', ar: 'نافذة', emoji: '🪟' },
  { en: 'bed', ar: 'سرير', emoji: '🛏️' },
  { en: 'table', ar: 'طاولة', emoji: '🪑' },
  { en: 'chair', ar: 'كرسي', emoji: '🪑' },
  { en: 'kitchen', ar: 'مطبخ', emoji: '🍳' },
  { en: 'bathroom', ar: 'حمام', emoji: '🛁' },
  { en: 'bedroom', ar: 'غرفة نوم', emoji: '🛏️' },
  { en: 'living-room', ar: 'غرفة جلوس', emoji: '🛋️' },
];

const FOOD: Grade1Word[] = [
  { en: 'bread', ar: 'خبز', emoji: '🍞' },
  { en: 'rice', ar: 'أرز', emoji: '🍚' },
  { en: 'milk', ar: 'حليب', emoji: '🥛' },
  { en: 'egg', ar: 'بيضة', emoji: '🥚' },
  { en: 'apple', ar: 'تفاحة', emoji: '🍎' },
  { en: 'banana', ar: 'موزة', emoji: '🍌' },
  { en: 'cheese', ar: 'جبن', emoji: '🧀' },
  { en: 'soup', ar: 'شوربة', emoji: '🥣' },
  { en: 'cake', ar: 'كعكة', emoji: '🎂' },
  { en: 'salad', ar: 'سلطة', emoji: '🥗' },
];

const CLOTHES: Grade1Word[] = [
  { en: 'shirt', ar: 'قميص', emoji: '👕' },
  { en: 'pants', ar: 'بنطال', emoji: '👖' },
  { en: 'dress', ar: 'فستان', emoji: '👗' },
  { en: 'shoes', ar: 'حذاء', emoji: '👟' },
  { en: 'socks', ar: 'جوارب', emoji: '🧦' },
  { en: 'hat', ar: 'قبعة', emoji: '🎩' },
  { en: 'jacket', ar: 'سترة', emoji: '🧥' },
  { en: 'skirt', ar: 'تنورة', emoji: '👗' },
  { en: 'gloves', ar: 'قفازات', emoji: '🧤' },
  { en: 'scarf', ar: 'وشاح', emoji: '🧣' },
];

const FRUITS: Grade1Word[] = [
  { en: 'apple', ar: 'تفاحة', emoji: '🍎' },
  { en: 'banana', ar: 'موزة', emoji: '🍌' },
  { en: 'orange', ar: 'برتقال', emoji: '🍊' },
  { en: 'grape', ar: 'عنب', emoji: '🍇' },
  { en: 'strawberry', ar: 'فراولة', emoji: '🍓' },
  { en: 'mango', ar: 'مانجو', emoji: '🥭' },
  { en: 'lemon', ar: 'ليمون', emoji: '🍋' },
  { en: 'pear', ar: 'إجاص', emoji: '🍐' },
  { en: 'watermelon', ar: 'بطيخ', emoji: '🍉' },
  { en: 'peach', ar: 'خوخ', emoji: '🍑' },
];

const ANIMALS2: Grade1Word[] = [
  { en: 'lion', ar: 'أسد', emoji: '🦁' },
  { en: 'elephant', ar: 'فيل', emoji: '🐘' },
  { en: 'monkey', ar: 'قرد', emoji: '🐵' },
  { en: 'rabbit', ar: 'أرنب', emoji: '🐰' },
  { en: 'cow', ar: 'بقرة', emoji: '🐮' },
  { en: 'duck', ar: 'بطة', emoji: '🦆' },
  { en: 'tiger', ar: 'نمر', emoji: '🐯' },
  { en: 'bear', ar: 'دب', emoji: '🐻' },
  { en: 'horse', ar: 'حصان', emoji: '🐴' },
  { en: 'sheep', ar: 'خروف', emoji: '🐑' },
];

const FEELINGS: Grade1Word[] = [
  { en: 'happy', ar: 'سعيد', emoji: '😊' },
  { en: 'sad', ar: 'حزين', emoji: '😢' },
  { en: 'angry', ar: 'غاضب', emoji: '😠' },
  { en: 'scared', ar: 'خائف', emoji: '😨' },
  { en: 'shy', ar: 'خجول', emoji: '😳' },
  { en: 'excited', ar: 'متحمس', emoji: '🤩' },
  { en: 'tired', ar: 'متعب', emoji: '😴' },
  { en: 'hungry', ar: 'جوعان', emoji: '😋' },
  { en: 'thirsty', ar: 'عطشان', emoji: '🥤' },
  { en: 'brave', ar: 'شجاع', emoji: '🦸' },
];

const TRANSPORT: Grade1Word[] = [
  { en: 'car', ar: 'سيارة', emoji: '🚗' },
  { en: 'bus', ar: 'حافلة', emoji: '🚌' },
  { en: 'train', ar: 'قطار', emoji: '🚂' },
  { en: 'bicycle', ar: 'دراجة', emoji: '🚲' },
  { en: 'motorcycle', ar: 'دراجة نارية', emoji: '🏍️' },
  { en: 'taxi', ar: 'تاكسي', emoji: '🚕' },
  { en: 'truck', ar: 'شاحنة', emoji: '🚚' },
  { en: 'ambulance', ar: 'إسعاف', emoji: '🚑' },
  { en: 'police-car', ar: 'شرطة', emoji: '🚓' },
  { en: 'fire-truck', ar: 'إطفاء', emoji: '🚒' },
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
  {
    unit: 6,
    unitAr: 'البيت',
    words: HOME,
    topicEn: (i, word) => (i === 9 ? 'Home Review' : `Home: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة أجزاء المنزل' : `البيت: ${word.ar}`),
  },
  {
    unit: 7,
    unitAr: 'الطعام',
    words: FOOD,
    topicEn: (i, word) => (i === 9 ? 'Food Review' : `Food: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة الأطعمة' : `الطعام: ${word.ar}`),
  },
  {
    unit: 8,
    unitAr: 'الملابس',
    words: CLOTHES,
    topicEn: (i, word) => (i === 9 ? 'Clothes Review' : `Clothes: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة الملابس' : `الملابس: ${word.ar}`),
  },
  {
    unit: 9,
    unitAr: 'الفاكهة',
    words: FRUITS,
    topicEn: (i, word) => (i === 9 ? 'Fruits Review' : `Fruits: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة الفواكه' : `الفاكهة: ${word.ar}`),
  },
  {
    unit: 10,
    unitAr: 'الحيوانات ٢',
    words: ANIMALS2,
    topicEn: (i, word) => (i === 9 ? 'Animals 2 Review' : `Animals 2: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة حيوانات ٢' : `الحيوانات ٢: ${word.ar}`),
  },
  {
    unit: 11,
    unitAr: 'المشاعر',
    words: FEELINGS,
    topicEn: (i, word) => (i === 9 ? 'Feelings Review' : `Feelings: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة المشاعر' : `المشاعر: ${word.ar}`),
  },
  {
    unit: 12,
    unitAr: 'المواصلات',
    words: TRANSPORT,
    topicEn: (i, word) => (i === 9 ? 'Transport Review' : `Transport: ${word.en}`),
    topicAr: (i, word) => (i === 9 ? 'مراجعة المواصلات' : `المواصلات: ${word.ar}`),
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
      const activity: Grade1Activity =
        unit.unit === 2 ? 'color' : ACTIVITY_CYCLE[index % ACTIVITY_CYCLE.length];
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
    case 'color':
      return 'التلوين';
    default:
      return activity;
  }
};
