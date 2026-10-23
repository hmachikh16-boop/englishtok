import type {
  CategoryKey,
  Character,
  DialogueLine,
  Lesson,
  Level,
  QuizQuestion,
  SceneType,
  VocabularyWord,
} from '../types';
import { EXPANSION_LESSONS } from './curriculumExpansion';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';

/**
 * The four-level EnglishTok curriculum.
 *
 * Level 1 (A1)      phonics + spaced repetition + first structures — Leo & Gigi
 * Level 2 (A2/B1)   task-based learning + everyday communication — Alex & Maya
 * Level 3 (B2)      critical communication + idioms — Sarah & David
 * Level 4 (C1/C2)   full immersion + nuance + rhetoric — Dr. Arthur & Elena
 *
 * Each level has one hundred lessons; every lesson carries `curriculumStage` so the
 * learning path unlocks levels and lessons in order.
 */

export interface CurriculumLevel {
  stage: number;
  titleAr: string;
  subtitleAr: string;
  color: string;
  cefr: string;
  audienceAr: string;
  methodologyAr: string;
}

export const CURRICULUM_LEVELS: readonly CurriculumLevel[] = [
  {
    stage: 1,
    titleAr: 'المبتدئ (A1)',
    subtitleAr: 'Phonics والتكرار المتباعد وبناء الأساس اللغوي',
    color: 'sky',
    cefr: 'CEFR A1',
    audienceAr: 'الأطفال والمبتدئون من الصفر',
    methodologyAr: 'التأسيس الصوتي والبصري، التكرار المتباعد، وبناء حصيلة لغوية أساسية.',
  },
  {
    stage: 2,
    titleAr: 'المتوسط / الإعدادي (A2–B1)',
    subtitleAr: 'التعلّم القائم على المهام والتواصل اليومي',
    color: 'emerald',
    cefr: 'CEFR A2–B1',
    audienceAr: 'الطلاب الملمّون بالأساسيات والراغبون في تكوين جمل كاملة',
    methodologyAr: 'التعلّم القائم على المهام وتطبيق القواعد في سياقات حقيقية.',
  },
  {
    stage: 3,
    titleAr: 'الثانوي (B2)',
    subtitleAr: 'التواصل الناقد والتعبير عن الرأي والمصطلحات',
    color: 'amber',
    cefr: 'CEFR B2',
    audienceAr: 'طلاب الثانوي والشباب الراغبون في طلاقة التعبير والنقاش',
    methodologyAr: 'التواصل اللغوي الناقد واستخدام المصطلحات الشائعة والتعبيرات الاصطلاحية.',
  },
  {
    stage: 4,
    titleAr: 'المتقدم (C1–C2)',
    subtitleAr: 'الانغماس اللغوي والفروق الدقيقة والخطابة',
    color: 'rose',
    cefr: 'CEFR C1–C2',
    audienceAr: 'المحترفون والأكاديميون والراغبون في الطلاقة الكاملة',
    methodologyAr: 'الانغماس اللغوي الكامل ودراسة الفروق الدقيقة (Nuances).',
  },
] as const;

export const LEO: Character = {
  id: 'leo',
  name: 'Leo',
  nameAr: 'ليو',
  roleAr: 'الكلب الذكي',
  avatar: '🐶',
  voiceGender: 'male',
  voicePitch: 0.95,
  shirtColor: '#f59e0b',
  skinTone: '#f4c28f',
  hairColor: '#7c4a1e',
  hairStyle: 'short',
  design: 'dog-leo',
};

export const GIGI: Character = {
  id: 'gigi',
  name: 'Gigi',
  nameAr: 'جيجي',
  roleAr: 'الزرافة المبدعة',
  avatar: '🦒',
  voiceGender: 'female',
  voicePitch: 1.08,
  shirtColor: '#ec4899',
  skinTone: '#f9d3a8',
  hairColor: '#b45309',
  hairStyle: 'ponytail',
  design: 'giraffe-gigi',
};

export const ALEX: Character = {
  id: 'alex',
  name: 'Alex',
  nameAr: 'أليكس',
  roleAr: 'الصديق المغامر',
  avatar: '🧑',
  voiceGender: 'male',
  voicePitch: 0.92,
  shirtColor: '#2563eb',
  skinTone: '#f3c99f',
  hairColor: '#33251d',
  hairStyle: 'spiky',
  design: 'boy-monster',
};

export const MAYA: Character = {
  id: 'maya',
  name: 'Maya',
  nameAr: 'مايا',
  roleAr: 'الصديقة الفضولية',
  avatar: '👩',
  voiceGender: 'female',
  voicePitch: 1.04,
  shirtColor: '#0d9488',
  skinTone: '#e8b98d',
  hairColor: '#3b2314',
  hairStyle: 'ponytail',
  design: 'girl-teal',
};

export const SARAH: Character = {
  id: 'sarah',
  name: 'Sarah',
  nameAr: 'سارة',
  roleAr: 'الطالبة الجامعية',
  avatar: '👩‍🎓',
  voiceGender: 'female',
  voicePitch: 1.02,
  shirtColor: '#db2777',
  skinTone: '#f0c39b',
  hairColor: '#2f1b12',
  hairStyle: 'curly',
  design: 'girl-pink',
};

export const DAVID: Character = {
  id: 'david',
  name: 'David',
  nameAr: 'ديفيد',
  roleAr: 'الطالب الطموح',
  avatar: '🧑‍🎓',
  voiceGender: 'male',
  voicePitch: 0.9,
  shirtColor: '#4338ca',
  skinTone: '#c98d63',
  hairColor: '#1f1712',
  hairStyle: 'short',
  design: 'boy-monster',
};

export const ARTHUR: Character = {
  id: 'dr-arthur',
  name: 'Dr. Arthur',
  nameAr: 'د. آرثر',
  roleAr: 'الخبير والمستشار الأكاديمي',
  avatar: '🧑‍🏫',
  voiceGender: 'male',
  voicePitch: 0.86,
  shirtColor: '#0f766e',
  skinTone: '#e9c3a0',
  hairColor: '#4a4a4a',
  hairStyle: 'glasses',
  design: 'squirrel-glasses',
};

export const ELENA: Character = {
  id: 'elena',
  name: 'Elena',
  nameAr: 'إيلينا',
  roleAr: 'المستشارة والخبيرة في التواصل',
  avatar: '👩‍💼',
  voiceGender: 'female',
  voicePitch: 1.0,
  shirtColor: '#7c3aed',
  skinTone: '#f1c9a5',
  hairColor: '#5c2c1a',
  hairStyle: 'ponytail',
  design: 'girl-green-hat',
};

const LEVEL_CHARACTERS: Record<number, [Character, Character]> = {
  1: [LEO, GIGI],
  2: [ALEX, MAYA],
  3: [SARAH, DAVID],
  4: [ARTHUR, ELENA],
};

type LineSpec = {
  speaker: 'A' | 'B';
  en: string;
  ar: string;
  emotion?: DialogueLine['emotion'];
  highlight?: string[];
};

type VocabSpec = Omit<VocabularyWord, 'id'>;

type QuizSpec = Omit<QuizQuestion, 'id'>;

interface LessonSpec {
  id: string;
  slug: string;
  stage: number;
  level: Level;
  title: string;
  titleAr: string;
  descriptionAr: string;
  objectiveAr: string;
  structureEn: string;
  structureAr: string;
  methodNoteAr?: string;
  category: CategoryKey;
  scene: SceneType;
  words: VocabSpec[];
  lines: LineSpec[];
  quiz: QuizSpec[];
}

const word = (
  wordText: string,
  phonetic: string,
  partOfSpeech: string,
  translationAr: string,
  exampleSentence: string,
  exampleSentenceAr: string,
): VocabSpec => ({ word: wordText, phonetic, partOfSpeech, translationAr, exampleSentence, exampleSentenceAr });

const mc = (
  questionAr: string,
  options: string[],
  correctAnswer: string,
  explanationAr: string,
  questionEn?: string,
): QuizSpec => ({ type: 'multiple_choice', questionAr, questionEn, options, correctAnswer, explanationAr });

const fill = (
  questionAr: string,
  questionEn: string,
  correctAnswer: string,
  explanationAr: string,
): QuizSpec => ({ type: 'fill_blank', questionAr, questionEn, options: [], correctAnswer, explanationAr });

const arrange = (
  questionAr: string,
  options: string[],
  correctAnswer: string,
  explanationAr: string,
): QuizSpec => ({ type: 'arrange_sentence', questionAr, options, correctAnswer, explanationAr });

const LESSON_SPECS: LessonSpec[] = [
  // ───────────────────────── Level 1 · A1 ─────────────────────────
  {
    id: 'a1-l1-alphabet',
    slug: 'alphabet-and-phonics',
    stage: 1,
    level: 'A1',
    title: 'Alphabet & Phonics',
    titleAr: 'الحروف والأصوات: A, B, C, D',
    descriptionAr: 'تعرّف على أصوات الحروف A وB وC وD في كلمات بسيطة مع ليو وجيجي.',
    objectiveAr: 'التعرّف على أصوات الحروف (A, B, C, D) وربطها بكلمات مألوفة.',
    structureEn: 'A is for Apple / B is for Ball',
    structureAr: 'A تعني Apple / B تعني Ball',
    methodNoteAr: 'استمع للصوت أولاً ثم اربطه بالكلمة والصورة.',
    category: 'grammar',
    scene: 'classroom',
    words: [
      word('Apple', '/ˈæp.əl/', 'اسم', 'تفاحة', 'A is for Apple.', 'A تعني تفاحة.'),
      word('Ball', '/bɔːl/', 'اسم', 'كرة', 'B is for Ball.', 'B تعني كرة.'),
      word('Cat', '/kæt/', 'اسم', 'قطة', 'C is for Cat.', 'C تعني قطة.'),
      word('Dog', '/dɒɡ/', 'اسم', 'كلب', 'D is for Dog.', 'D تعني كلب.'),
    ],
    lines: [
      { speaker: 'A', en: "Hello, Gigi! Let's learn the alphabet today.", ar: 'مرحبًا جيجي! لنتعلم الأبجدية اليوم.' },
      { speaker: 'B', en: 'Great idea, Leo! A, /æ/, Apple!', ar: 'فكرة رائعة يا ليو! A، /æ/، تفاحة!', highlight: ['Apple'] },
      { speaker: 'A', en: 'A is for Apple. Very good, Gigi!', ar: 'A تعني Apple. أحسنت يا جيجي!', emotion: 'explaining', highlight: ['Apple'] },
      { speaker: 'B', en: 'B, /b/, Ball! B is for Ball.', ar: 'B، /b/، كرة! B تعني Ball.', emotion: 'curious', highlight: ['Ball'] },
      { speaker: 'A', en: 'C is for Cat. Can you say /k/?', ar: 'C تعني Cat. هل يمكنك قول /k/؟', emotion: 'explaining', highlight: ['Cat'] },
      { speaker: 'B', en: 'C, /k/, Cat! And D, /d/, Dog!', ar: 'C، /k/، قطة! وD، /d/، كلب!', highlight: ['Cat', 'Dog'] },
      { speaker: 'A', en: 'Wonderful! A, B, C, D. Now you try!', ar: 'رائع! A، B، C، D. جرّب الآن!' },
    ],
    quiz: [
      mc('أي كلمة تبدأ بصوت /æ/؟', ['Apple', 'Ball', 'Cat', 'Dog'], 'Apple', 'كلمة Apple تبدأ بصوت /æ/.'),
      fill('أكمل: A is ___ Apple.', 'A is ___ Apple.', 'for', 'نقول A is for Apple لربط الحرف بالكلمة.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['for', 'A', 'Apple', 'is'], 'A is for Apple.', 'الترتيب الصحيح: A is for Apple.'),
      mc('ما معنى كلمة Dog؟', ['كلب', 'قطة', 'كرة', 'تفاحة'], 'كلب', 'Dog تعني كلب.'),
    ],
  },
  {
    id: 'a1-l2-numbers',
    slug: 'numbers-and-counting',
    stage: 1,
    level: 'A1',
    title: 'Numbers & Counting',
    titleAr: 'الأرقام والعدّ من 1 إلى 10',
    descriptionAr: 'تعلّم العدّ من واحد إلى عشرة والسؤال عن العدد مع جيجي وليو.',
    objectiveAr: 'عدّ الأشياء البسيطة واستخدام السؤال How many?',
    structureEn: 'How many? → Three balls.',
    structureAr: 'كم العدد؟ ← ثلاث كرات.',
    methodNoteAr: 'عُدّ بصوت عالٍ واربط كل رقم بالأشياء التي تراها.',
    category: 'grammar',
    scene: 'park',
    words: [
      word('one', '/wʌn/', 'عدد', 'واحد', 'I see one ball.', 'أرى كرة واحدة.'),
      word('two', '/tuː/', 'عدد', 'اثنان', 'Two cats are playing.', 'قطتان تلعبان.'),
      word('three', '/θriː/', 'عدد', 'ثلاثة', 'There are three balls.', 'هناك ثلاث كرات.'),
      word('five', '/faɪv/', 'عدد', 'خمسة', 'I have five fingers.', 'لدي خمسة أصابع.'),
      word('ten', '/ten/', 'عدد', 'عشرة', "Let's count to ten.", 'لنعدّ إلى عشرة.'),
      word('How many?', '/haʊ ˈmen.i/', 'تعبير', 'كم العدد؟', 'How many cats?', 'كم عدد القطط؟'),
    ],
    lines: [
      { speaker: 'B', en: 'Look at all these balls, Leo!', ar: 'انظر إلى كل هذه الكرات يا ليو!' },
      { speaker: 'A', en: 'Wow! How many balls?', ar: 'واو! كم عدد الكرات؟', emotion: 'curious', highlight: ['How many'] },
      { speaker: 'B', en: 'One, two, three. Three balls!', ar: 'واحد، اثنان، ثلاثة. ثلاث كرات!', emotion: 'explaining', highlight: ['Three'] },
      { speaker: 'A', en: 'Great counting! How many cats do you see?', ar: 'عدّ رائع! كم عدد القطط التي تراها؟', highlight: ['How many'] },
      { speaker: 'B', en: 'One, two. Two cats!', ar: 'واحد، اثنان. قطتان!', highlight: ['Two'] },
      { speaker: 'A', en: "Well done! Let's count to ten: one, two, three, four, five, six, seven, eight, nine, ten!", ar: 'أحسنت! لنعدّ إلى عشرة: واحد، اثنان، ثلاثة، أربعة، خمسة، ستة، سبعة، ثمانية، تسعة، عشرة!' },
    ],
    quiz: [
      mc('كيف تسأل عن عدد الأشياء؟', ['How many?', 'What color?', 'What is your name?', 'Where is it?'], 'How many?', 'نستخدم How many للسؤال عن العدد.'),
      fill('أكمل: How ___ balls?', 'How ___ balls?', 'many', 'التعبير الكامل هو How many.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['There', 'are', 'three', 'balls'], 'There are three balls.', 'الترتيب الصحيح: There are three balls.'),
      mc('ما معنى كلمة ten؟', ['عشرة', 'خمسة', 'ثلاثة', 'اثنان'], 'عشرة', 'ten تعني عشرة.'),
    ],
  },
  {
    id: 'a1-l3-colors',
    slug: 'colors-and-shapes',
    stage: 1,
    level: 'A1',
    title: 'Colors & Shapes',
    titleAr: 'الألوان والأشكال',
    descriptionAr: 'صِف الأشياء من حولك باللون والشكل مع ليو وجيجي في الحديقة.',
    objectiveAr: 'وصف الأشياء المحيطة باللون والشكل.',
    structureEn: 'It is a yellow circle.',
    structureAr: 'إنها دائرة صفراء.',
    methodNoteAr: 'انظر حولك وسمِّ لون وشكل كل شيء تراه.',
    category: 'grammar',
    scene: 'park',
    words: [
      word('red', '/red/', 'صفة', 'أحمر', 'It is a red square.', 'إنه مربع أحمر.'),
      word('blue', '/bluː/', 'صفة', 'أزرق', 'It is a blue circle.', 'إنها دائرة زرقاء.'),
      word('yellow', '/ˈjel.əʊ/', 'صفة', 'أصفر', 'The sun is yellow.', 'الشمس صفراء.'),
      word('green', '/ɡriːn/', 'صفة', 'أخضر', 'The grass is green.', 'العشب أخضر.'),
      word('circle', '/ˈsɜː.kəl/', 'اسم', 'دائرة', 'It is a yellow circle.', 'إنها دائرة صفراء.'),
      word('square', '/skweər/', 'اسم', 'مربع', 'It is a red square.', 'إنه مربع أحمر.'),
    ],
    lines: [
      { speaker: 'A', en: 'Gigi, look at the grass!', ar: 'جيجي، انظر إلى العشب!', emotion: 'curious' },
      { speaker: 'B', en: 'It is green! The grass is green.', ar: 'إنه أخضر! العشب أخضر.', highlight: ['green'] },
      { speaker: 'A', en: 'And look at the sun!', ar: 'وانظر إلى الشمس!', emotion: 'explaining' },
      { speaker: 'B', en: 'It is a yellow circle!', ar: 'إنها دائرة صفراء!', emotion: 'surprised', highlight: ['yellow', 'circle'] },
      { speaker: 'A', en: 'Yes! The sun is a yellow circle.', ar: 'نعم! الشمس دائرة صفراء.', highlight: ['yellow', 'circle'] },
      { speaker: 'B', en: 'Can you find a red square?', ar: 'هل يمكنك إيجاد مربع أحمر؟', emotion: 'curious', highlight: ['red', 'square'] },
      { speaker: 'A', en: 'Here! A red square!', ar: 'هنا! مربع أحمر!', highlight: ['red', 'square'] },
    ],
    quiz: [
      mc('ما لون العشب في القصة؟', ['أخضر', 'أحمر', 'أزرق', 'أصفر'], 'أخضر', 'قالت جيجي: The grass is green.'),
      fill('أكمل: It is ___ yellow circle.', 'It is ___ yellow circle.', 'a', 'نستخدم a قبل الصفة والاسم المفرد.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['It', 'is', 'a', 'yellow', 'circle'], 'It is a yellow circle.', 'الترتيب الصحيح: It is a yellow circle.'),
      mc('ما معنى square؟', ['مربع', 'دائرة', 'أحمر', 'أصفر'], 'مربع', 'square تعني مربع.'),
    ],
  },
  {
    id: 'a1-l4-introduction',
    slug: 'self-introduction',
    stage: 1,
    level: 'A1',
    title: 'Self-Introduction',
    titleAr: 'التعريف بالنفس والتحيات',
    descriptionAr: 'قدّم نفسك بالاسم والعمر، وتعلّم التحية والوداع مع ليو وجيجي.',
    objectiveAr: 'إلقاء التحية وإخبار الاسم والعمر.',
    structureEn: 'Hello, I am [Name]. I am [Number] years old.',
    structureAr: 'مرحبًا، أنا [الاسم]. عمري [الرقم] سنوات.',
    methodNoteAr: 'كرر الجملة بصوتك واستبدل الاسم والرقم بمعلوماتك.',
    category: 'greetings',
    scene: 'classroom',
    words: [
      word('Hello', '/həˈləʊ/', 'تحية', 'مرحبًا', 'Hello, I am Gigi.', 'مرحبًا، أنا جيجي.'),
      word('Goodbye', '/ɡʊdˈbaɪ/', 'وداع', 'إلى اللقاء', 'Goodbye, Leo!', 'إلى اللقاء يا ليو!'),
      word('Name', '/neɪm/', 'اسم', 'اسم', 'What is your name?', 'ما اسمك؟'),
      word('Years old', '/jɪəz əʊld/', 'تعبير', 'سنة من العمر', 'I am seven years old.', 'عمري سبع سنوات.'),
    ],
    lines: [
      { speaker: 'A', en: 'Hello! I am Leo. What is your name?', ar: 'مرحبًا! أنا ليو. ما اسمك؟', highlight: ['Hello', 'name'] },
      { speaker: 'B', en: 'Hi! I am Gigi. I am 7 years old.', ar: 'أهلًا! أنا جيجي. عمري 7 سنوات.', highlight: ['years old'] },
      { speaker: 'A', en: 'Nice to meet you, Gigi! I am 8 years old.', ar: 'سعيد بلقائك يا جيجي! عمري 8 سنوات.', highlight: ['years old'] },
      { speaker: 'B', en: 'Nice to meet you too! How old are you, Leo?', ar: 'سعيدة بلقائك أيضًا! كم عمرك يا ليو؟', emotion: 'curious' },
      { speaker: 'A', en: 'I am 8 years old.', ar: 'عمري 8 سنوات.', emotion: 'explaining', highlight: ['years old'] },
      { speaker: 'B', en: 'Goodbye, Leo! See you tomorrow!', ar: 'إلى اللقاء يا ليو! أراك غدًا!', highlight: ['Goodbye'] },
    ],
    quiz: [
      mc('كيف تسأل شخصًا عن اسمه؟', ['What is your name?', 'How old are you?', 'How many?', 'What color?'], 'What is your name?', 'السؤال عن الاسم يكون What is your name?'),
      fill('أكمل: I ___ Gigi.', 'I ___ Gigi.', 'am', 'نستخدم am مع الضمير I.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['I', 'am', 'seven', 'years', 'old'], 'I am seven years old.', 'الترتيب الصحيح: I am seven years old.'),
      mc('ما معنى Goodbye؟', ['إلى اللقاء', 'مرحبًا', 'اسم', 'كم عمرك؟'], 'إلى اللقاء', 'Goodbye تعني إلى اللقاء.'),
    ],
  },

  // ───────────────────────── Level 2 · A2/B1 ─────────────────────────
  {
    id: 'a2-l1-routine',
    slug: 'daily-routine-present-simple',
    stage: 2,
    level: 'A2',
    title: 'Daily Routine & Present Simple',
    titleAr: 'الروتين اليومي والمضارع البسيط',
    descriptionAr: 'تحدث عن يومك وعاداتك باستخدام المضارع البسيط مع أليكس ومايا.',
    objectiveAr: 'التحدث عن الأنشطة اليومية والعادات.',
    structureEn: 'I [verb] every day. / He [verb+s] at 7 AM.',
    structureAr: 'أنا [فعل] كل يوم. / هو [فعل+s] في السابعة صباحًا.',
    methodNoteAr: 'لاحظ إضافة s مع he/she/it في المضارع البسيط.',
    category: 'grammar',
    scene: 'classroom',
    words: [
      word('wake up', '/weɪk ʌp/', 'فعل مركب', 'يستيقظ', 'I wake up at seven.', 'أستيقظ في السابعة.'),
      word('brush teeth', '/brʌʃ tiːθ/', 'تعبير', 'ينظف أسنانه', 'I brush my teeth every morning.', 'أنظف أسناني كل صباح.'),
      word('school', '/skuːl/', 'اسم', 'مدرسة', 'I go to school at eight.', 'أذهب إلى المدرسة في الثامنة.'),
      word('usually', '/ˈjuː.ʒu.ə.li/', 'ظرف تكرار', 'عادةً', 'I usually walk to school.', 'عادةً أمشي إلى المدرسة.'),
      word('always', '/ˈɔːl.weɪz/', 'ظرف تكرار', 'دائمًا', 'I always wake up early.', 'أستيقظ دائمًا مبكرًا.'),
    ],
    lines: [
      { speaker: 'B', en: 'What time do you wake up, Alex?', ar: 'في أي ساعة تستيقظ يا أليكس؟', emotion: 'curious' },
      { speaker: 'A', en: 'I always wake up at 7:00 AM.', ar: 'أستيقظ دائمًا في السابعة صباحًا.', emotion: 'explaining', highlight: ['always', 'wake up'] },
      { speaker: 'B', en: 'And what do you do after that?', ar: 'وماذا تفعل بعد ذلك؟' },
      { speaker: 'A', en: 'I brush my teeth and have breakfast. Then I go to school at 8:00.', ar: 'أنظف أسناني وأتناول الفطور. ثم أذهب إلى المدرسة في الثامنة.', emotion: 'explaining', highlight: ['brush teeth', 'school'] },
      { speaker: 'B', en: 'Do you usually walk to school?', ar: 'هل تمشي عادةً إلى المدرسة؟', emotion: 'curious', highlight: ['usually'] },
      { speaker: 'A', en: 'Yes, usually. I like the morning walk.', ar: 'نعم، عادةً. أحب المشي الصباحي.', highlight: ['usually'] },
    ],
    quiz: [
      mc('أكمل: He ___ at 7 AM.', ['wakes up', 'wake up', 'waking', 'woke'], 'wakes up', 'مع he نضيف s إلى الفعل: wakes up.'),
      fill('I ___ wake up at 7:00.', 'I ___ wake up at 7:00.', 'always', 'always ظرف تكرار يعني دائمًا.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['I', 'brush', 'my', 'teeth', 'every', 'day'], 'I brush my teeth every day.', 'الترتيب الصحيح: I brush my teeth every day.'),
      mc('ما معنى usually؟', ['عادةً', 'دائمًا', 'أبدًا', 'أحيانًا'], 'عادةً', 'usually تعني عادةً.'),
    ],
  },
  {
    id: 'a2-l2-ordering-food',
    slug: 'ordering-food-and-preferences',
    stage: 2,
    level: 'A2',
    title: 'Ordering Food & Preferences',
    titleAr: 'المطعم والتفضيلات',
    descriptionAr: 'اطلب طعامك بأدب وعبّر عن الأطعمة التي تحبها وتفضلها مع مايا وأليكس.',
    objectiveAr: 'الطلب بأدب والتعبير عن التفضيلات.',
    structureEn: 'Can I have [Food], please? / I prefer [X] to [Y].',
    structureAr: 'هل يمكنني الحصول على [طعام] من فضلك؟ / أفضّل [X] على [Y].',
    methodNoteAr: 'استخدم please وwould like لإضافة اللياقة إلى الطلب.',
    category: 'food',
    scene: 'cafe',
    words: [
      word('menu', '/ˈmen.juː/', 'اسم', 'قائمة الطعام', 'Here is the menu.', 'هذه قائمة الطعام.'),
      word('delicious', '/dɪˈlɪʃ.əs/', 'صفة', 'لذيذ', 'The pizza is delicious.', 'البيتزا لذيذة.'),
      word('I would like', '/aɪ wʊd laɪk/', 'تعبير', 'أود', 'I would like some water.', 'أود بعض الماء.'),
      word('favorite', '/ˈfeɪ.vər.ɪt/', 'صفة', 'المفضل', 'Pizza is my favorite food.', 'البيتزا طعامي المفضل.'),
      word('prefer', '/prɪˈfɜːr/', 'فعل', 'يفضّل', 'I prefer tea to coffee.', 'أفضّل الشاي على القهوة.'),
    ],
    lines: [
      { speaker: 'B', en: 'Here is the menu, Alex. What would you like?', ar: 'هذه قائمة الطعام يا أليكس. ماذا تود؟' },
      { speaker: 'A', en: 'Can I have a cheese pizza, please?', ar: 'هل يمكنني الحصول على بيتزا بالجبن من فضلك؟', emotion: 'explaining', highlight: ['Can I have'] },
      { speaker: 'B', en: 'And to drink?', ar: 'وماذا للشرب؟', emotion: 'curious' },
      { speaker: 'A', en: 'Water, please. Pizza is my favorite food!', ar: 'ماء من فضلك. البيتزا طعامي المفضل!', highlight: ['favorite'] },
      { speaker: 'B', en: 'I prefer salad. It is healthier.', ar: 'أنا أفضّل السلطة. إنها أكثر صحة.', emotion: 'explaining', highlight: ['prefer'] },
      { speaker: 'A', en: 'Good choice! The food here is delicious.', ar: 'اختيار جيد! الطعام هنا لذيذ.', highlight: ['delicious'] },
    ],
    quiz: [
      mc('كيف تطلب طعامًا بأدب؟', ['Can I have a pizza, please?', 'Give me pizza.', 'I pizza.', 'You pizza.'], 'Can I have a pizza, please?', 'الطلب المهذب يبدأ بـ Can I have ... please?'),
      fill('I ___ salad to pizza.', 'I ___ salad to pizza.', 'prefer', 'prefer تعني يفضّل، ونستخدم to للمقارنة.'),
      arrange('رتّب الكلمات لتكوين طلب مهذب:', ['Can', 'I', 'have', 'a', 'cheese', 'pizza', 'please'], 'Can I have a cheese pizza please.', 'الترتيب الصحيح: Can I have a cheese pizza please.'),
      mc('ما معنى delicious؟', ['لذيذ', 'صحي', 'غالي', 'سريع'], 'لذيذ', 'delicious تعني لذيذ.'),
    ],
  },
  {
    id: 'b1-l1-past',
    slug: 'past-experiences-past-simple',
    stage: 2,
    level: 'B1',
    title: 'Past Experiences & Past Simple',
    titleAr: 'التحدث عن الماضي والأحداث السابقة',
    descriptionAr: 'اسرد ما فعلته أمس والأسبوع الماضي باستخدام الماضي البسيط مع أليكس ومايا.',
    objectiveAr: 'سرد أحداث وقصص حدثت في الماضي.',
    structureEn: 'Regular: [verb+ed] / Irregular: Go → Went.',
    structureAr: 'المنتظم: [فعل+ed] / الشاذ: Go ← Went.',
    methodNoteAr: 'احفظ الأفعال الشاذة تدريجيًا واستخدم did للسؤال.',
    category: 'grammar',
    scene: 'park',
    words: [
      word('yesterday', '/ˈjes.tər.deɪ/', 'ظرف زمان', 'أمس', 'I played football yesterday.', 'لعبت كرة القدم أمس.'),
      word('last week', '/lɑːst wiːk/', 'تعبير زمني', 'الأسبوع الماضي', 'I visited my aunt last week.', 'زرت خالتي الأسبوع الماضي.'),
      word('went', '/went/', 'فعل (ماضٍ)', 'ذهب', 'I went to the park.', 'ذهبت إلى الحديقة.'),
      word('saw', '/sɔː/', 'فعل (ماضٍ)', 'رأى', 'I saw my friends there.', 'رأيت أصدقائي هناك.'),
      word('enjoyed', '/ɪnˈdʒɔɪd/', 'فعل (ماضٍ)', 'استمتع', 'We enjoyed the game.', 'استمتعنا بالمباراة.'),
    ],
    lines: [
      { speaker: 'B', en: 'Where did you go yesterday, Alex?', ar: 'أين ذهبت أمس يا أليكس؟', emotion: 'curious' },
      { speaker: 'A', en: 'I went to the park and played football.', ar: 'ذهبت إلى الحديقة ولعبت كرة القدم.', highlight: ['went'] },
      { speaker: 'B', en: 'Did you see anyone there?', ar: 'هل رأيت أحدًا هناك؟', emotion: 'curious' },
      { speaker: 'A', en: 'Yes, I saw Omar and Sami. We enjoyed the game a lot.', ar: 'نعم، رأيت عمر وسامي. استمتعنا بالمباراة كثيرًا.', emotion: 'explaining', highlight: ['saw', 'enjoyed'] },
      { speaker: 'B', en: 'That sounds fun! What did you do last week?', ar: 'يبدو ممتعًا! ماذا فعلت الأسبوع الماضي؟', highlight: ['last week'] },
      { speaker: 'A', en: 'Last week, I visited my grandmother. We cooked together.', ar: 'الأسبوع الماضي، زرت جدتي. طبخنا معًا.', emotion: 'explaining', highlight: ['last week'] },
    ],
    quiz: [
      mc('ما الماضي البسيط للفعل go؟', ['went', 'goed', 'gone', 'going'], 'went', 'go فعل شاذ وماضيه went.'),
      fill('I ___ football yesterday.', 'I ___ football yesterday.', 'played', 'نضيف ed إلى الفعل المنتظم play لتصبح played.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['I', 'went', 'to', 'the', 'park', 'yesterday'], 'I went to the park yesterday.', 'الترتيب الصحيح: I went to the park yesterday.'),
      mc('ما معنى last week؟', ['الأسبوع الماضي', 'غدًا', 'اليوم', 'أمس'], 'الأسبوع الماضي', 'last week تعني الأسبوع الماضي.'),
    ],
  },
  {
    id: 'b1-l2-directions',
    slug: 'asking-for-directions',
    stage: 2,
    level: 'B1',
    title: 'Asking for Directions & Travel',
    titleAr: 'الاتجاهات والسفر',
    descriptionAr: 'اسأل عن الأماكن وتعلّم وصف الطريق بالاتجاهات مع أليكس ومايا.',
    objectiveAr: 'التنقل والسؤال عن الأماكن في المدينة.',
    structureEn: 'How can I get to [Place]?',
    structureAr: 'كيف يمكنني الوصول إلى [المكان]؟',
    methodNoteAr: 'تدرّب على وصف طريق من منزلك إلى أقرب متجر.',
    category: 'travel',
    scene: 'street',
    words: [
      word('turn left', '/tɜːrn left/', 'تعبير', 'انعطف يسارًا', 'Turn left at the bank.', 'انعطف يسارًا عند البنك.'),
      word('turn right', '/tɜːrn raɪt/', 'تعبير', 'انعطف يمينًا', 'Turn right after the school.', 'انعطف يمينًا بعد المدرسة.'),
      word('straight ahead', '/streɪt əˈhed/', 'تعبير', 'أمامك مباشرة', 'Go straight ahead.', 'امشِ أمامك مباشرة.'),
      word('excuse me', '/ɪkˈskjuːz miː/', 'تعبير', 'عفوًا', 'Excuse me, where is the bank?', 'عفوًا، أين البنك؟'),
      word('Where is...?', '/weər ɪz/', 'تعبير', 'أين...؟', 'Where is the library?', 'أين المكتبة؟'),
    ],
    lines: [
      { speaker: 'A', en: 'Excuse me, how can I get to the library?', ar: 'عفوًا، كيف أصل إلى المكتبة؟', emotion: 'curious', highlight: ['Excuse me', 'How can I get'] },
      { speaker: 'B', en: 'Go straight ahead for two blocks.', ar: 'امشِ أمامك مباشرة لمدة شارعين.', emotion: 'explaining', highlight: ['straight ahead'] },
      { speaker: 'A', en: 'Then do I turn left or right?', ar: 'ثم هل أنعطف يسارًا أم يمينًا؟', emotion: 'curious' },
      { speaker: 'B', en: 'Turn left at the bank. The library is next to the park.', ar: 'انعطف يسارًا عند البنك. المكتبة بجوار الحديقة.', highlight: ['turn left'] },
      { speaker: 'A', en: 'Thank you! Where is the bus stop?', ar: 'شكرًا! أين موقف الحافلات؟', highlight: ['Where is'] },
      { speaker: 'B', en: 'It is over there, on the right.', ar: 'إنه هناك، على اليمين.', highlight: ['right'] },
    ],
    quiz: [
      mc('كيف تسأل عن مكان المكتبة؟', ['Where is the library?', 'How many libraries?', 'What is a library?', 'Who is the library?'], 'Where is the library?', 'نستخدم Where is للسؤال عن المكان.'),
      fill('Go ___ ahead.', 'Go ___ ahead.', 'straight', 'straight ahead تعني أمامك مباشرة.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['Turn', 'left', 'at', 'the', 'bank'], 'Turn left at the bank.', 'الترتيب الصحيح: Turn left at the bank.'),
      mc('ما معنى turn right؟', ['انعطف يمينًا', 'انعطف يسارًا', 'أمامك مباشرة', 'عفوًا'], 'انعطف يمينًا', 'turn right تعني انعطف يمينًا.'),
    ],
  },

  // ───────────────────────── Level 3 · B2 ─────────────────────────
  {
    id: 'b2-l1-opinions',
    slug: 'expressing-opinions-and-debate',
    stage: 3,
    level: 'B2',
    title: 'Expressing Opinions & Debate',
    titleAr: 'التعبير عن الرأي والمناظرة',
    descriptionAr: 'قدّم وجهة نظرك ودافع عنها بأسلوب راقٍ مع سارة وديفيد.',
    objectiveAr: 'تقديم وجهات النظر والدفاع عنها بأسلوب راقٍ.',
    structureEn: 'In my opinion, [Clause], although [Counter-argument].',
    structureAr: 'في رأيي، [جملة]، رغم أن [حجة معاكسة].',
    methodNoteAr: 'استخدم ربطًا متوازنًا: رأي ثم اعتراض ثم تسوية.',
    category: 'grammar',
    scene: 'classroom',
    words: [
      word('from my perspective', '/frəm maɪ pərˈspek.tɪv/', 'تعبير', 'من وجهة نظري', 'From my perspective, the plan is solid.', 'من وجهة نظري، الخطة متينة.'),
      word('strongly believe', '/ˈstrɔːŋ.li bɪˈliːv/', 'تعبير', 'أعتقد بقوة', 'I strongly believe in teamwork.', 'أعتقد بقوة في العمل الجماعي.'),
      word('on the other hand', '/ɒn ðə ˈʌð.ər hænd/', 'تعبير', 'من ناحية أخرى', 'On the other hand, it costs more.', 'من ناحية أخرى، إنه يكلف أكثر.'),
      word('disagree', '/ˌdɪs.əˈɡriː/', 'فعل', 'يختلف في الرأي', 'I disagree with that idea.', 'أختلف مع تلك الفكرة.'),
      word('opinion', '/əˈpɪn.jən/', 'اسم', 'رأي', 'What is your opinion?', 'ما رأيك؟'),
    ],
    lines: [
      { speaker: 'A', en: 'In my opinion, online learning is efficient.', ar: 'في رأيي، التعلم عبر الإنترنت فعّال.', highlight: ['In my opinion'] },
      { speaker: 'B', en: 'I see your point, but traditional classrooms offer better social interaction.', ar: 'أفهم وجهة نظرك، لكن الفصول التقليدية توفر تفاعلًا اجتماعيًا أفضل.', emotion: 'curious' },
      { speaker: 'A', en: 'From my perspective, flexibility is the most important factor.', ar: 'من وجهة نظري، المرونة هي العامل الأهم.', emotion: 'explaining', highlight: ['From my perspective'] },
      { speaker: 'B', en: 'On the other hand, students may feel isolated without a class.', ar: 'من ناحية أخرى، قد يشعر الطلاب بالعزلة دون صف.', emotion: 'explaining', highlight: ['On the other hand'] },
      { speaker: 'A', en: 'I strongly believe both models can work together.', ar: 'أعتقد بقوة أن النموذجين يمكن أن يعملا معًا.', highlight: ['strongly believe'] },
      { speaker: 'B', en: 'I agree with that. A blended approach is the win-win solution.', ar: 'أوافق على ذلك. النهج المدمج هو الحل الذي يفيد الجميع.' },
    ],
    quiz: [
      mc('أي عبارة تُستخدم لتقديم رأي؟', ['In my opinion...', 'How many...?', 'Turn left...', 'I went...'], 'In my opinion...', 'In my opinion تُستخدم لتقديم الرأي.'),
      fill('___ my opinion, online learning is efficient.', '___ my opinion, online learning is efficient.', 'In', 'التعبير الكامل هو In my opinion.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['I', 'see', 'your', 'point', 'but', 'I', 'disagree'], 'I see your point but I disagree.', 'الترتيب الصحيح: I see your point but I disagree.'),
      mc('ما معنى on the other hand؟', ['من ناحية أخرى', 'من وجهة نظري', 'أعتقد بقوة', 'أتفق'], 'من ناحية أخرى', 'on the other hand تعني من ناحية أخرى.'),
    ],
  },
  {
    id: 'b2-l2-idioms',
    slug: 'idioms-and-phrasal-verbs',
    stage: 3,
    level: 'B2',
    title: 'Idioms & Phrasal Verbs in Context',
    titleAr: 'التعبير المجازي والأفعال المركبة',
    descriptionAr: 'اجعل حديثك طبيعيًا باستخدام تعبيرات وأفعال مركبة شائعة مع سارة وديفيد.',
    objectiveAr: 'استخدام التعبيرات الاصطلاحية والأفعال المركبة في السياق.',
    structureEn: 'Phrasal Verb + Object / Idiomatic Expressions',
    structureAr: 'فعل مركب + مفعول / تعبيرات اصطلاحية.',
    methodNoteAr: 'لا تترجم التعبير حرفيًا؛ احفظ معناه داخل الموقف.',
    category: 'idioms',
    scene: 'office',
    words: [
      word('break a leg', '/breɪk ə leɡ/', 'تعبير', 'حظًا موفقًا', 'Break a leg at your interview!', 'حظًا موفقًا في مقابلتك!'),
      word('call it a day', '/kɔːl ɪt ə deɪ/', 'تعبير', 'ننهي العمل لليوم', "It's late. Let's call it a day.", 'الوقت متأخر. لننهِ العمل لليوم.'),
      word('figure out', '/ˈfɪɡ.ər aʊt/', 'فعل مركب', 'يكتشف/يحل', 'Can you figure out the problem?', 'هل يمكنك اكتشاف المشكلة؟'),
      word('carry on', '/ˈkær.i ɒn/', 'فعل مركب', 'يواصل', 'Carry on with your work.', 'واصل عملك.'),
      word('idiom', '/ˈɪd.i.əm/', 'اسم', 'تعبير اصطلاحي', 'Break a leg is a common idiom.', 'Break a leg تعبير اصطلاحي شائع.'),
    ],
    lines: [
      { speaker: 'B', en: "We've been working for five hours, Sarah!", ar: 'لقد كنا نعمل لخمس ساعات يا سارة!', emotion: 'surprised' },
      { speaker: 'A', en: "You're right. Let's call it a day.", ar: 'معك حق. لننهِ العمل لهذا اليوم.', highlight: ['call it a day'] },
      { speaker: 'B', en: 'Before we go, can you figure out the last report?', ar: 'قبل أن نذهب، هل يمكنك فهم التقرير الأخير؟', emotion: 'curious', highlight: ['figure out'] },
      { speaker: 'A', en: 'I think I found the mistake. We can carry on tomorrow.', ar: 'أعتقد أنني وجدت الخطأ. يمكننا المواصلة غدًا.', emotion: 'explaining', highlight: ['carry on'] },
      { speaker: 'B', en: 'Great! Break a leg at your presentation tomorrow.', ar: 'رائع! حظًا موفقًا في عرضك غدًا.', highlight: ['Break a leg'] },
      { speaker: 'A', en: "Thank you! I'll do my best.", ar: 'شكرًا! سأبذل قصارى جهدي.', emotion: 'laughing' },
    ],
    quiz: [
      mc('بعد عمل طويل، ماذا تقول لإنهاء اليوم؟', ["Let's call it a day.", 'Break a leg.', 'Figure it out.', 'Carry on.'], "Let's call it a day.", 'call it a day تعني إنهاء العمل لليوم.'),
      fill('We need to ___ out the problem.', 'We need to ___ out the problem.', 'figure', 'figure out تعني يكتشف أو يحل.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ["Let's", 'call', 'it', 'a', 'day'], "Let's call it a day.", 'الترتيب الصحيح: Let’s call it a day.'),
      mc('ما معنى break a leg؟', ['حظًا موفقًا', 'اكسر ساقك', 'توقف', 'واصل'], 'حظًا موفقًا', 'break a leg تعبير يعني حظًا موفقًا.'),
    ],
  },
  {
    id: 'b2-l3-conditionals',
    slug: 'complex-tenses-and-conditionals',
    stage: 3,
    level: 'B2',
    title: 'Complex Tenses & Conditionals',
    titleAr: 'القواعد المعقدة والجمل الشرطية',
    descriptionAr: 'عبّر عن الافتراضات والندم والاحتمالات باستخدام الشرط الثاني والثالث مع سارة وديفيد.',
    objectiveAr: 'التعبير عن الافتراضات والندم والاحتمالات المستقبلية.',
    structureEn: 'Second & Third Conditionals (If + Past Perfect → Would have + P.P).',
    structureAr: 'الشرط الثاني والثالث (If + الماضي التام ← Would have + التصريف الثالث).',
    methodNoteAr: 'ميّز بين if للاحتمال وunless بمعنى «ما لم».',
    category: 'grammar',
    scene: 'classroom',
    words: [
      word('if', '/ɪf/', 'أداة شرط', 'إذا', 'If it rains, we will stay home.', 'إذا أمطرت، سنبقى في المنزل.'),
      word('unless', '/ənˈles/', 'أداة شرط', 'ما لم', 'We will go unless it rains.', 'سنذهب ما لم تمطر.'),
      word('provided that', '/prəˈvaɪ.dɪd ðæt/', 'تعبير شرطي', 'بشرط أن', 'You can go, provided that you finish.', 'يمكنك الذهاب بشرط أن تنهي.'),
      word('regret', '/rɪˈɡret/', 'فعل', 'يندم', 'I regret not studying more.', 'أندم على عدم الدراسة أكثر.'),
      word('conditional', '/kənˈdɪʃ.ən.əl/', 'اسم', 'جملة شرطية', 'This is a third conditional.', 'هذه جملة شرطية من النوع الثالث.'),
    ],
    lines: [
      { speaker: 'A', en: 'If I had studied harder, I would have passed the exam easily.', ar: 'لو درست بجدية أكبر، لنجحت في الاختبار بسهولة.', emotion: 'explaining', highlight: ['If', 'would have'] },
      { speaker: 'B', en: 'So you regret not studying more?', ar: 'إذن أنت تندم على عدم الدراسة أكثر؟', emotion: 'curious', highlight: ['regret'] },
      { speaker: 'A', en: 'Yes. But I know better now.', ar: 'نعم. لكنني أصبحت أكثر وعيًا الآن.', emotion: 'explaining' },
      { speaker: 'B', en: 'We can meet tomorrow, provided that you finish your homework.', ar: 'يمكننا أن نلتقي غدًا بشرط أن تنهي واجبك.', highlight: ['provided that'] },
      { speaker: 'A', en: 'And unless it rains, we can study in the park.', ar: 'وما لم تمطر، يمكننا الدراسة في الحديقة.', emotion: 'curious', highlight: ['unless'] },
      { speaker: 'B', en: "Deal! Let's prepare well this time.", ar: 'اتفقنا! لنستعد جيدًا هذه المرة.' },
    ],
    quiz: [
      mc('أكمل الشرط الثالث: If I had studied harder, I ___ passed.', ['would have', 'will have', 'would', 'was'], 'would have', 'الشرط الثالث: If + past perfect → would have + past participle.'),
      fill('We will go ___ it rains.', 'We will go ___ it rains.', 'unless', 'unless تعني ما لم (if not).'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['If', 'I', 'had', 'studied', 'harder', 'I', 'would', 'have', 'passed'], 'If I had studied harder I would have passed.', 'الترتيب الصحيح يبدأ بالشرط ثم النتيجة.'),
      mc('ما معنى regret؟', ['يندم', 'يفرح', 'يواصل', 'يقرر'], 'يندم', 'regret تعني يندم.'),
    ],
  },
  {
    id: 'b2-l4-environment',
    slug: 'technology-and-environment',
    stage: 3,
    level: 'B2',
    title: 'Technology & Environmental Issues',
    titleAr: 'القضايا المعاصرة والبيئة',
    descriptionAr: 'ناقش الذكاء الاصطناعي والاستدامة والطاقة المتجددة بأسلوب متقدم مع سارة وديفيد.',
    objectiveAr: 'نقاش مواضيع إنسانية وعلمية معقدة بكلمات متقدمة.',
    structureEn: 'Passive Voice for formal topics.',
    structureAr: 'المبني للمجهول للمواضيع الرسمية.',
    methodNoteAr: 'استخدم المبني للمجهول عندما يكون الفاعل غير مهم أو غير معروف.',
    category: 'work',
    scene: 'office',
    words: [
      word('artificial intelligence', '/ˌɑːr.tɪˈfɪʃ.əl ɪnˈtel.ɪ.dʒəns/', 'اسم', 'الذكاء الاصطناعي', 'Artificial intelligence is changing education.', 'الذكاء الاصطناعي يغيّر التعليم.'),
      word('sustainability', '/səˌsteɪ.nəˈbɪl.ə.ti/', 'اسم', 'الاستدامة', 'Sustainability guides our long-term plans.', 'الاستدامة توجه خططنا طويلة المدى.'),
      word('renewable energy', '/rɪˈnuː.ə.bəl ˈen.ər.dʒi/', 'اسم', 'الطاقة المتجددة', 'Renewable energy is the future.', 'الطاقة المتجددة هي المستقبل.'),
      word('impact', '/ˈɪm.pækt/', 'اسم', 'تأثير', 'Technology has a big impact on society.', 'للتكنولوجيا تأثير كبير على المجتمع.'),
      word('carbon footprint', '/ˈkɑːr.bən ˈfʊt.prɪnt/', 'تعبير', 'البصمة الكربونية', 'We must reduce our carbon footprint.', 'يجب أن نقلل بصمتنا الكربونية.'),
    ],
    lines: [
      { speaker: 'B', en: 'Renewable energy must be implemented worldwide to reduce the carbon footprint.', ar: 'يجب تطبيق الطاقة المتجددة عالميًا لتقليل البصمة الكربونية.', emotion: 'explaining', highlight: ['renewable energy', 'carbon footprint'] },
      { speaker: 'A', en: 'Do you think artificial intelligence can help with sustainability?', ar: 'هل تعتقد أن الذكاء الاصطناعي يمكن أن يساعد في الاستدامة؟', emotion: 'curious', highlight: ['artificial intelligence', 'sustainability'] },
      { speaker: 'B', en: 'Absolutely. AI can optimize energy use and reduce waste.', ar: 'بالتأكيد. يمكن للذكاء الاصطناعي تحسين استخدام الطاقة وتقليل الهدر.', emotion: 'explaining' },
      { speaker: 'A', en: 'But its own impact on the environment must be measured, too.', ar: 'لكن يجب قياس تأثيره هو أيضًا على البيئة.', emotion: 'explaining', highlight: ['impact'] },
      { speaker: 'B', en: 'True. Technology and sustainability should grow together.', ar: 'صحيح. يجب أن تنمو التكنولوجيا والاستدامة معًا.' },
      { speaker: 'A', en: "Then let's support clean innovation.", ar: 'إذن لندعم الابتكار النظيف.' },
    ],
    quiz: [
      mc('أكمل المبني للمجهول: Renewable energy must ___ worldwide.', ['be implemented', 'implement', 'implemented', 'implementing'], 'be implemented', 'بعد must نستخدم be + past participle في المبني للمجهول.'),
      fill('AI can have a huge ___ on education.', 'AI can have a huge ___ on education.', 'impact', 'impact تعني تأثير.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['Renewable', 'energy', 'must', 'be', 'implemented', 'worldwide'], 'Renewable energy must be implemented worldwide.', 'الترتيب الصحيح: Renewable energy must be implemented worldwide.'),
      mc('ما معنى sustainability؟', ['الاستدامة', 'البصمة الكربونية', 'الذكاء الاصطناعي', 'التأثير'], 'الاستدامة', 'sustainability تعني الاستدامة.'),
    ],
  },

  // ───────────────────────── Level 4 · C1/C2 ─────────────────────────
  {
    id: 'c1-l1-negotiation',
    slug: 'business-communication-and-negotiation',
    stage: 4,
    level: 'C1',
    title: 'Business Communication & Negotiation',
    titleAr: 'التفاوض والتواصل المهني',
    descriptionAr: 'تدرّب على الدبلوماسية والتفاوض التجاري وصياغة العروض مع إيلينا ود. آرثر.',
    objectiveAr: 'إدراك أساليب الدبلوماسية والتفاوض التجاري في بيئة العمل.',
    structureEn: 'Hedging & Diplomatic Language.',
    structureAr: 'لغة التحفّظ والدبلوماسية.',
    methodNoteAr: 'لطّف الرفض بـ might وhowever وI am afraid.',
    category: 'work',
    scene: 'office',
    words: [
      word('consensus', '/kənˈsen.səs/', 'اسم', 'توافق', 'We reached a consensus.', 'وصلنا إلى توافق.'),
      word('leverage', '/ˈlev.ər.ɪdʒ/', 'اسم', 'نفوذ/ورقة ضغط', 'We used our leverage in the deal.', 'استخدمنا نفوذنا في الصفقة.'),
      word('win-win scenario', '/wɪn wɪn səˈnɑːr.i.oʊ/', 'تعبير', 'سيناريو يفيد الطرفين', 'A win-win scenario benefits everyone.', 'السيناريو الذي يفيد الطرفين يعود بالنفع على الجميع.'),
      word('counter-offer', '/ˈkaʊn.tər ˌɒf.ər/', 'اسم', 'عرض مضاد', 'They sent a counter-offer.', 'أرسلوا عرضًا مضادًا.'),
      word('stakeholders', '/ˈsteɪkˌhoʊl.dərz/', 'اسم (جمع)', 'أصحاب المصلحة', 'All stakeholders must agree.', 'يجب أن يوافق جميع أصحاب المصلحة.'),
    ],
    lines: [
      { speaker: 'B', en: 'We appreciate your offer; however, we might need to adjust the timeline to ensure quality.', ar: 'نقدّر عرضكم؛ ومع ذلك، قد نحتاج إلى تعديل الجدول الزمني لضمان الجودة.', emotion: 'explaining', highlight: ['however', 'might'] },
      { speaker: 'A', en: 'That seems reasonable if we maintain the current budget.', ar: 'يبدو ذلك معقولًا إذا حافظنا على الميزانية الحالية.' },
      { speaker: 'B', en: 'Would a counter-offer with a shorter phase-one be acceptable?', ar: 'هل سيكون عرض مضاد بمرحلة أولى أقصر مقبولًا؟', emotion: 'curious', highlight: ['counter-offer'] },
      { speaker: 'A', en: 'Possibly. We need consensus from all stakeholders first.', ar: 'ربما. نحتاج أولًا إلى توافق من جميع أصحاب المصلحة.', emotion: 'explaining', highlight: ['consensus', 'stakeholders'] },
      { speaker: 'B', en: 'A win-win scenario is what we are aiming for.', ar: 'السيناريو الذي يفيد الطرفين هو ما نطمح إليه.', highlight: ['win-win scenario'] },
      { speaker: 'A', en: "Then let's use our leverage wisely and finalize the terms.", ar: 'إذن لنستخدم نفوذنا بحكمة وننهِ الشروط.', highlight: ['leverage'] },
    ],
    quiz: [
      mc('أي عبارة تُستخدم للتحفّظ الدبلوماسي؟', ['We might need to adjust...', 'We will do it now.', 'This is impossible.', 'You are wrong.'], 'We might need to adjust...', 'might تلطّف الطلب وتترك مجالًا للتفاوض.'),
      fill('We appreciate your offer; ___, we might need more time.', 'We appreciate your offer; ___, we might need more time.', 'however', 'however تعني ومع ذلك.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['That', 'seems', 'reasonable', 'if', 'we', 'maintain', 'the', 'budget'], 'That seems reasonable if we maintain the budget.', 'الترتيب الصحيح: That seems reasonable if we maintain the budget.'),
      mc('ما معنى stakeholders؟', ['أصحاب المصلحة', 'الميزانية', 'العرض', 'التفاوض'], 'أصحاب المصلحة', 'stakeholders تعني أصحاب المصلحة.'),
    ],
  },
  {
    id: 'c1-l2-academic',
    slug: 'academic-writing-and-analysis',
    stage: 4,
    level: 'C1',
    title: 'Academic Writing & Analysis',
    titleAr: 'الكتابة الأكاديمية والتحليل',
    descriptionAr: 'حلّل النصوص والأبحاث واكتب بأسلوب أكاديمي متماسك مع د. آرثر وإيلينا.',
    objectiveAr: 'تحليل النصوص والأبحاث وكتابة المقالات الرسمية.',
    structureEn: 'Advanced Cohesive Devices & Academic Structures.',
    structureAr: 'روابط متقدمة وتراكيب أكاديمية.',
    methodNoteAr: 'اربط الفكرة بالدليل ثم بالنتيجة باستخدام furthermore وconsequently.',
    category: 'work',
    scene: 'classroom',
    words: [
      word('furthermore', '/ˈfɜːr.ðər.mɔːr/', 'رابط', 'علاوة على ذلك', 'Furthermore, the sample was small.', 'علاوة على ذلك، كانت العينة صغيرة.'),
      word('consequently', '/ˈkɑːn.sə.kwənt.li/', 'رابط', 'وبالتالي', 'The data was missing; consequently, we delayed.', 'كانت البيانات ناقصة؛ وبالتالي تأخرنا.'),
      word('hypothesis', '/haɪˈpɑː.θə.sɪs/', 'اسم', 'فرضية', 'The hypothesis was tested twice.', 'اختُبرت الفرضية مرتين.'),
      word('empirical evidence', '/ɪmˈpɪr.ɪ.kəl ˈev.ɪ.dəns/', 'تعبير', 'دليل تجريبي', 'Empirical evidence supports the claim.', 'الأدلة التجريبية تدعم الادعاء.'),
      word('in contrast', '/ɪn ˈkɑːn.træst/', 'رابط', 'في المقابل', 'In contrast, the first study failed.', 'في المقابل، فشلت الدراسة الأولى.'),
    ],
    lines: [
      { speaker: 'A', en: 'The empirical evidence suggests a direct correlation between stress and productivity.', ar: 'تشير الأدلة التجريبية إلى ارتباط مباشر بين التوتر والإنتاجية.', emotion: 'explaining', highlight: ['empirical evidence'] },
      { speaker: 'B', en: 'What is your hypothesis for the next study?', ar: 'ما فرضيتك للدراسة القادمة؟', emotion: 'curious', highlight: ['hypothesis'] },
      { speaker: 'A', en: 'That sleep quality mediates the effect. Furthermore, workload plays a role.', ar: 'أن جودة النوم تتوسط التأثير. علاوة على ذلك، يلعب عبء العمل دورًا.', highlight: ['Furthermore'] },
      { speaker: 'B', en: 'In contrast, the earlier data showed no such link.', ar: 'في المقابل، أظهرت البيانات السابقة عدم وجود رابط كهذا.', emotion: 'explaining', highlight: ['In contrast'] },
      { speaker: 'A', en: 'Consequently, we need a larger sample to confirm the findings.', ar: 'وبالتالي، نحتاج إلى عينة أكبر لتأكيد النتائج.', highlight: ['Consequently'] },
      { speaker: 'B', en: "Agreed. Let's prepare the methodology section.", ar: 'أوافق. لنحضّر قسم المنهجية.' },
    ],
    quiz: [
      mc('أي رابط يُستخدم للنتيجة؟', ['Consequently', 'Furthermore', 'In contrast', 'Hypothesis'], 'Consequently', 'Consequently تعني وبالتالي وتقدّم النتيجة.'),
      fill('The empirical ___ suggests a direct correlation.', 'The empirical ___ suggests a direct correlation.', 'evidence', 'التعبير الكامل هو empirical evidence.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['The', 'evidence', 'suggests', 'a', 'direct', 'correlation'], 'The evidence suggests a direct correlation.', 'الترتيب الصحيح: The evidence suggests a direct correlation.'),
      mc('ما معنى hypothesis؟', ['فرضية', 'دليل', 'نتيجة', 'منهجية'], 'فرضية', 'hypothesis تعني فرضية.'),
    ],
  },
  {
    id: 'c1-l3-nuance',
    slug: 'nuances-irony-and-subtext',
    stage: 4,
    level: 'C1',
    title: 'Nuances, Irony & Cultural Subtleties',
    titleAr: 'الفروق اللغوية والبلاغة',
    descriptionAr: 'افهم السخرية غير المباشرة والتلميحات الثقافية والفروق الدقيقة مع إيلينا ود. آرثر.',
    objectiveAr: 'فهم السخرية غير المباشرة والتلميحات الثقافية واللكنات المتعددة.',
    structureEn: 'Inverted Structures for Emphasis.',
    structureAr: 'تراكيب معكوسة للتوكيد.',
    methodNoteAr: 'لاحظ ما يُقال وما يُضمر؛ المعنى قد يكون بين السطور.',
    category: 'idioms',
    scene: 'cafe',
    words: [
      word('sarcasm', '/ˈsɑːr.kæz.əm/', 'اسم', 'سخرية', 'His praise was pure sarcasm.', 'كان ثناؤه سخرية خالصة.'),
      word('subtext', '/ˈsʌb.tekst/', 'اسم', 'المعنى الضمني', 'The subtext was clearer than the words.', 'كان المعنى الضمني أوضح من الكلمات.'),
      word('implicit', '/ɪmˈplɪs.ɪt/', 'صفة', 'ضمني', 'She gave an implicit warning.', 'أعطت تحذيرًا ضمنيًا.'),
      word('ambiguity', '/ˌæm.bɪˈɡjuː.ə.ti/', 'اسم', 'غموض', 'The ambiguity was intentional.', 'كان الغموض مقصودًا.'),
      word('nuance', '/ˈnuː.ɑːns/', 'اسم', 'فرق دقيق', 'The nuance changes the meaning.', 'الفرق الدقيق يغيّر المعنى.'),
    ],
    lines: [
      { speaker: 'B', en: 'Rarely do we encounter an issue this complex, yet the subtext reveals a simple solution.', ar: 'نادرًا ما نصادف مشكلة بهذا التعقيد، ومع ذلك يكشف المعنى الضمني حلًا بسيطًا.', emotion: 'explaining', highlight: ['Rarely', 'subtext'] },
      { speaker: 'A', en: 'Is that sarcasm, Elena, or genuine optimism?', ar: 'هل هذه سخرية يا إيلينا أم تفاؤل صادق؟', emotion: 'laughing', highlight: ['sarcasm'] },
      { speaker: 'B', en: 'A little of both. The ambiguity is intentional.', ar: 'القليل من كليهما. الغموض مقصود.', highlight: ['ambiguity'] },
      { speaker: 'A', en: 'So the implicit message is that we should simplify the plan?', ar: 'إذن الرسالة الضمنية هي أن علينا تبسيط الخطة؟', emotion: 'curious', highlight: ['implicit'] },
      { speaker: 'B', en: 'Exactly. The nuance matters more than the words themselves.', ar: 'بالضبط. الفرق الدقيق أهم من الكلمات نفسها.', highlight: ['nuance'] },
      { speaker: 'A', en: "Then let's read between the lines and act.", ar: 'إذن لنقرأ ما بين السطور ونتصرف.' },
    ],
    quiz: [
      mc('أكمل التركيب المعكوس: Rarely ___ we encounter an issue this complex.', ['do', 'we', 'does', 'did'], 'do', 'بعد Rarely نستخدم ترتيب السؤال: Rarely do we...'),
      fill('The ___ reveals a simple solution.', 'The ___ reveals a simple solution.', 'subtext', 'subtext تعني المعنى الضمني.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['Rarely', 'do', 'we', 'encounter', 'an', 'issue', 'this', 'complex'], 'Rarely do we encounter an issue this complex.', 'الترتيب الصحيح يبدأ بـ Rarely do we.'),
      mc('ما معنى nuance؟', ['فرق دقيق', 'سخرية', 'غموض', 'معنى ضمني'], 'فرق دقيق', 'nuance تعني فرقًا دقيقًا.'),
    ],
  },
  {
    id: 'c1-l4-speech',
    slug: 'public-speaking-and-rhetoric',
    stage: 4,
    level: 'C1',
    title: 'Public Speaking & Rhetoric',
    titleAr: 'الخطابة والإقناع',
    descriptionAr: 'ألقِ عرضًا مؤثرًا واستخدم البلاغة والأسئلة الخطابية مع د. آرثر وإيلينا.',
    objectiveAr: 'إلقاء العروض التقديمية والتأثير في الجمهور بطلاقة.',
    structureEn: 'Rhetorical Questions & Rule of Three.',
    structureAr: 'الأسئلة البلاغية وقاعدة الثلاثة.',
    methodNoteAr: 'اجمع بين السؤال البلاغي والتكرار الثلاثي لصناعة تأثير قوي.',
    category: 'work',
    scene: 'office',
    words: [
      word('persuasive', '/pərˈsweɪ.sɪv/', 'صفة', 'مقنع', 'She gave a persuasive speech.', 'ألقت خطابًا مقنعًا.'),
      word('resonance', '/ˈrez.ə.nəns/', 'اسم', 'صدى/تأثير وجداني', 'The message had a strong resonance.', 'كان للرسالة صدى قوي.'),
      word('articulate', '/ɑːrˈtɪk.jə.lət/', 'صفة', 'فصيح وواضح', 'He is an articulate speaker.', 'هو متحدث فصيح.'),
      word('captivate', '/ˈkæp.tɪ.veɪt/', 'فعل', 'يأسر', 'Great stories captivate an audience.', 'القصص الرائعة تأسر الجمهور.'),
      word('call to action', '/kɔːl tuː ˈæk.ʃən/', 'تعبير', 'دعوة لاتخاذ إجراء', 'End with a clear call to action.', 'اختم بدعوة واضحة لاتخاذ إجراء.'),
    ],
    lines: [
      { speaker: 'A', en: 'Ask yourselves: If not us, who? If not now, when?', ar: 'اسألوا أنفسكم: إن لم نكن نحن، فمن؟ وإن لم يكن الآن، فمتى؟', emotion: 'explaining', highlight: ['If not us'] },
      { speaker: 'B', en: 'We must act with precision, passion, and purpose.', ar: 'يجب أن نتصرف بدقة وشغف وهدف.', highlight: ['precision', 'passion', 'purpose'] },
      { speaker: 'A', en: 'A persuasive speech needs a clear call to action.', ar: 'الخطاب المقنع يحتاج إلى دعوة واضحة لاتخاذ إجراء.', highlight: ['persuasive', 'call to action'] },
      { speaker: 'B', en: "And it must resonate with the audience's values.", ar: 'ويجب أن يلامس قيم الجمهور.', emotion: 'explaining', highlight: ['resonate'] },
      { speaker: 'A', en: 'How do we captivate a large crowd?', ar: 'كيف نأسر حشدًا كبيرًا؟', emotion: 'curious', highlight: ['captivate'] },
      { speaker: 'B', en: 'Speak clearly, tell a story, and repeat your key message.', ar: 'تحدث بوضوح، احكِ قصة، وكرر رسالتك الأساسية.' },
    ],
    quiz: [
      mc('أكمل السؤال البلاغي: If not us, ___?', ['who', 'whom', 'whose', 'which'], 'who', 'السؤال البلاغي: If not us, who?'),
      fill('We must act with precision, passion, and ___.', 'We must act with precision, passion, and ___.', 'purpose', 'قاعدة الثلاثة: precision, passion, purpose.'),
      arrange('رتّب الكلمات لتكوين جملة صحيحة:', ['Ask', 'yourselves', 'if', 'not', 'us', 'who'], 'Ask yourselves if not us who.', 'الترتيب الصحيح: Ask yourselves if not us who.'),
      mc('ما معنى captivate؟', ['يأسر', 'يقنع', 'يتحدث', 'يكرر'], 'يأسر', 'captivate تعني يأسر أو يجذب الانتباه.'),
    ],
  },
];

/** Arabic sentence shown in the speech bubble for each lesson's arrange exercise. */
const ARRANGE_PROMPTS: Record<string, string> = {
  'a1-l1-alphabet': 'A تعني تفاحة.',
  'a1-l2-numbers': 'هناك ثلاث كرات.',
  'a1-l3-colors': 'إنها دائرة صفراء.',
  'a1-l4-introduction': 'عمري سبع سنوات.',
  'a2-l1-routine': 'أنظف أسناني كل يوم.',
  'a2-l2-ordering-food': 'هل يمكنني الحصول على بيتزا بالجبن من فضلك؟',
  'b1-l1-past': 'ذهبت إلى الحديقة أمس.',
  'b1-l2-directions': 'انعطف يسارًا عند البنك.',
  'b2-l1-opinions': 'أفهم وجهة نظرك لكنني أختلف.',
  'b2-l2-idioms': 'لننهِ العمل لهذا اليوم.',
  'b2-l3-conditionals': 'لو درست بجدية أكبر لنجحت.',
  'b2-l4-environment': 'يجب تطبيق الطاقة المتجددة عالميًا.',
  'c1-l1-negotiation': 'يبدو ذلك معقولًا إذا حافظنا على الميزانية.',
  'c1-l2-academic': 'تشير الأدلة إلى ارتباط مباشر.',
  'c1-l3-nuance': 'نادرًا ما نصادف مشكلة بهذا التعقيد.',
  'c1-l4-speech': 'اسألوا أنفسكم إن لم نكن نحن فمن.',
};

const buildLesson = (spec: LessonSpec): Lesson => {
  const [characterA, characterB] = LEVEL_CHARACTERS[spec.stage];
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
    dialogue: spec.lines.map((line, index) => ({
      id: `${spec.id}-s${String(index + 1).padStart(2, '0')}`,
      speakerId: line.speaker === 'A' ? characterA.id : characterB.id,
      textEn: line.en,
      textAr: line.ar,
      durationSec: Math.max(2.2, Math.round(line.en.split(/\s+/).length * 0.36 * 10) / 10),
      emotion: line.emotion ?? 'happy',
      ...(line.highlight ? { highlightWords: line.highlight } : {}),
    })),
    vocabulary: spec.words.map((entry, index) => ({ ...entry, id: `${spec.id}-v${index + 1}` })),
    quiz: spec.quiz.map((question, index) => ({
      ...question,
      id: `${spec.id}-q${index + 1}`,
      ...(question.type === 'arrange_sentence' && ARRANGE_PROMPTS[spec.id]
        ? { promptAr: ARRANGE_PROMPTS[spec.id] }
        : {}),
    })),
    likesCount: 180 + spec.stage * 40,
    sharesCount: 45 + spec.stage * 12,
    savedCount: 130 + spec.stage * 25,
  };
};

export const CURRICULUM_LESSONS: Lesson[] = [
  ...LESSON_SPECS.map(buildLesson),
  ...EXPANSION_LESSONS.map((spec) =>
    buildExpansionLesson(spec, LEVEL_CHARACTERS[spec.stage]),
  ),
].sort((left, right) => (left.curriculumStage ?? 0) - (right.curriculumStage ?? 0));
