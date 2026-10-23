import { ANIMALS_BY_STAGE, type AnimalProfile } from './animals';

/**
 * Collectible motivation cards that live directly inside the learning path.
 *
 * There are 200 cards: 50 per CEFR stage, unlocking every two lessons. The
 * first 25 cards in each stage are the classic animal cards; the next 25 are
 * golden editions of the same animals, unlocked across the second half of the
 * stage. This makes the collection a steady reward loop without adding another
 * saved progress field — every unlock is derived from completed lessons.
 *
 * The golden editions reuse the four habitat artworks and add a distinct
 * royal-gold frame, title, rarity and XP value.
 */

export type MotivationalCardRarity = 'hero' | 'epic' | 'legend';
export type MotivationalCardEdition = 'classic' | 'gold';

export interface MotivationalCardPalette {
  start: string;
  mid: string;
  deep: string;
  glow: string;
  accent: string;
}

export interface MotivationalCard {
  id: string;
  serial: string;
  stage: number;
  requiredLessons: number;
  titleAr: string;
  titleEn: string;
  quoteEn: string;
  quoteAr: string;
  challengeEn: string;
  challengeAr: string;
  animal: AnimalProfile;
  rarity: MotivationalCardRarity;
  edition: MotivationalCardEdition;
  xp: number;
  palette: MotivationalCardPalette;
}

export interface MotivationalCardStage {
  stage: number;
  nameAr: string;
  nameEn: string;
}

export const MOTIVATIONAL_CARD_STAGES: readonly MotivationalCardStage[] = [
  { stage: 1, nameAr: 'الأساس', nameEn: 'FOUNDATIONS' },
  { stage: 2, nameAr: 'الانطلاق', nameEn: 'MOMENTUM' },
  { stage: 3, nameAr: 'الإتقان', nameEn: 'MASTERY' },
  { stage: 4, nameAr: 'الطلاقة', nameEn: 'FLUENCY' },
];

const STAGE_PALETTES: Record<number, readonly MotivationalCardPalette[]> = {
  1: [
    { start: '#042f2e', mid: '#0f766e', deep: '#082f49', glow: '#5eead4', accent: '#bef264' },
    { start: '#082f49', mid: '#0369a1', deep: '#134e4a', glow: '#67e8f9', accent: '#a7f3d0' },
    { start: '#052e16', mid: '#15803d', deep: '#064e3b', glow: '#86efac', accent: '#fef08a' },
  ],
  2: [
    { start: '#301c06', mid: '#a16207', deep: '#14532d', glow: '#fde68a', accent: '#a3e635' },
    { start: '#3b1d05', mid: '#c2410c', deep: '#166534', glow: '#fdba74', accent: '#bef264' },
    { start: '#1c2a0a', mid: '#4d7c0f', deep: '#14532d', glow: '#facc15', accent: '#86efac' },
  ],
  3: [
    { start: '#24103f', mid: '#7e22ce', deep: '#831843', glow: '#f0abfc', accent: '#fde68a' },
    { start: '#2e1065', mid: '#4f46e5', deep: '#701a75', glow: '#c4b5fd', accent: '#fef08a' },
    { start: '#3b0a45', mid: '#be185d', deep: '#4c1d95', glow: '#f9a8d4', accent: '#fde68a' },
  ],
  4: [
    { start: '#0b1b3d', mid: '#1d4ed8', deep: '#312e81', glow: '#fbbf24', accent: '#fef08a' },
    { start: '#17123b', mid: '#6d28d9', deep: '#1e1b4b', glow: '#fcd34d', accent: '#fde68a' },
    { start: '#042f2e', mid: '#0f766e', deep: '#1e3a8a', glow: '#fde68a', accent: '#bef264' },
  ],
};

const GOLD_PALETTES: Record<number, readonly MotivationalCardPalette[]> = {
  1: [
    { start: '#201507', mid: '#a16207', deep: '#052f52', glow: '#fde68a', accent: '#fff7d6' },
    { start: '#1b2a12', mid: '#b7791f', deep: '#052e16', glow: '#fef08a', accent: '#ecfccb' },
    { start: '#2a1a05', mid: '#d97706', deep: '#082f49', glow: '#fcd34d', accent: '#fffbeb' },
  ],
  2: [
    { start: '#241604', mid: '#b45309', deep: '#052e16', glow: '#fde68a', accent: '#fef3c7' },
    { start: '#2a1d08', mid: '#ca8a04', deep: '#14532d', glow: '#fef08a', accent: '#ecfccb' },
    { start: '#1e1a05', mid: '#a16207', deep: '#134e4a', glow: '#fcd34d', accent: '#fff7d6' },
  ],
  3: [
    { start: '#1f1535', mid: '#7c3aed', deep: '#052f52', glow: '#fde68a', accent: '#fef3c7' },
    { start: '#2a1438', mid: '#a21caf', deep: '#312e81', glow: '#fcd34d', accent: '#fffbeb' },
    { start: '#1b123d', mid: '#4f46e5', deep: '#3b0764', glow: '#fef08a', accent: '#fef3c7' },
  ],
  4: [
    { start: '#071b3c', mid: '#1d4ed8', deep: '#2a1a05', glow: '#fcd34d', accent: '#fffbeb' },
    { start: '#17123b', mid: '#6d28d9', deep: '#1e1b4b', glow: '#fde68a', accent: '#fef3c7' },
    { start: '#052f52', mid: '#0f766e', deep: '#3b2504', glow: '#fcd34d', accent: '#ecfccb' },
  ],
};

const DEFAULT_PALETTE: MotivationalCardPalette = STAGE_PALETTES[1][0];
const GOLD_DEFAULT_PALETTE: MotivationalCardPalette = GOLD_PALETTES[1][0];
const DEFAULT_TITLE = { ar: 'شرارة البداية', en: 'First Spark' };

interface CardTitle {
  ar: string;
  en: string;
}

const STAGE_TITLES: Record<number, readonly CardTitle[]> = {
  1: [
    { ar: 'شرارة البداية', en: 'First Spark' },
    { ar: 'صدى الحروف', en: 'Letter Echo' },
    { ar: 'صائد الأصوات', en: 'Sound Hunter' },
    { ar: 'خطوة واثقة', en: 'Confident Step' },
    { ar: 'نجمة الكلمات', en: 'Word Star' },
    { ar: 'همسة الجرأة', en: 'Brave Whisper' },
    { ar: 'حارس الحروف', en: 'Letter Guardian' },
    { ar: 'صوتك الذهبي', en: 'Golden Voice' },
    { ar: 'قارئ صغير', en: 'Little Reader' },
    { ar: 'جسر الكلمات', en: 'Word Bridge' },
    { ar: 'مستمع ذكي', en: 'Smart Listener' },
    { ar: 'بطل التكرار', en: 'Repetition Hero' },
    { ar: 'مفاتيح اللغة', en: 'Language Keys' },
    { ar: 'نجم المحادثة', en: 'Conversation Star' },
    { ar: 'قلب شجاع', en: 'Brave Heart' },
    { ar: 'عقل متفتح', en: 'Open Mind' },
    { ar: 'حكاية أولى', en: 'First Story' },
    { ar: 'صداقة بلا حدود', en: 'Friends Without Borders' },
    { ar: 'طاقة البداية', en: 'Starter Energy' },
    { ar: 'بطل الألف كلمة', en: 'Thousand-Word Hero' },
    { ar: 'قوة الإصرار', en: 'Power of Persistence' },
    { ar: 'حارس الطريق', en: 'Path Guardian' },
    { ar: 'صاحب أول حوار', en: 'First Conversation' },
    { ar: 'نجم الأساس', en: 'Foundation Star' },
    { ar: 'أسطورة البداية', en: 'Legend of the Beginning' },
  ],
  2: [
    { ar: 'المستكشف', en: 'The Explorer' },
    { ar: 'سفير الكلمات', en: 'Word Ambassador' },
    { ar: 'قائد المحادثة', en: 'Conversation Captain' },
    { ar: 'صانع الجمل', en: 'Sentence Maker' },
    { ar: 'صوت المدينة', en: 'City Voice' },
    { ar: 'بطل الروتين', en: 'Routine Hero' },
    { ar: 'رحلة بلا خريطة', en: 'Journey Without a Map' },
    { ar: 'صديق المطعم', en: 'Restaurant Friend' },
    { ar: 'سيد السؤال', en: 'Master of Questions' },
    { ar: 'جسر الثقافات', en: 'Culture Bridge' },
    { ar: 'خطوة للأمام', en: 'Step Forward' },
    { ar: 'ذكي في السفر', en: 'Smart Traveler' },
    { ar: 'حكواتي الحياة', en: 'Everyday Storyteller' },
    { ar: 'مستمع الطريق', en: 'Roadside Listener' },
    { ar: 'بطل المواقف', en: 'Everyday Hero' },
    { ar: 'نجم الحوار', en: 'Dialogue Star' },
    { ar: 'صائد الفرص', en: 'Opportunity Hunter' },
    { ar: 'صوتك في العالم', en: 'Your Voice in the World' },
    { ar: 'قوة التواصل', en: 'Communication Power' },
    { ar: 'سفير الابتسامة', en: 'Ambassador of Smiles' },
    { ar: 'مغامرة جديدة', en: 'New Adventure' },
    { ar: 'عقل واثق', en: 'Confident Mind' },
    { ar: 'صانع الأصدقاء', en: 'Friend Maker' },
    { ar: 'نجم الانطلاق', en: 'Momentum Star' },
    { ar: 'أسطورة الانطلاق', en: 'Legend of Momentum' },
  ],
  3: [
    { ar: 'العقل الناقد', en: 'The Critical Thinker' },
    { ar: 'صائد الحجج', en: 'Argument Hunter' },
    { ar: 'سيد المعاني', en: 'Master of Meaning' },
    { ar: 'صوت الإقناع', en: 'Voice of Persuasion' },
    { ar: 'مفكر مستقل', en: 'Independent Thinker' },
    { ar: 'بطل النقاش', en: 'Debate Hero' },
    { ar: 'كاشف الأفكار', en: 'Idea Detective' },
    { ar: 'لسان بليغ', en: 'Eloquent Tongue' },
    { ar: 'حارس الحقيقة', en: 'Truth Guardian' },
    { ar: 'صانع الرأي', en: 'Opinion Maker' },
    { ar: 'قارئ ما بين السطور', en: 'Between the Lines' },
    { ar: 'نجم البلاغة', en: 'Rhetoric Star' },
    { ar: 'قوة الحجة', en: 'Power of Proof' },
    { ar: 'مستمع ناقد', en: 'Critical Listener' },
    { ar: 'بطل التعبير', en: 'Expression Hero' },
    { ar: 'عقل عالمي', en: 'Global Mind' },
    { ar: 'سفير الحوار', en: 'Dialogue Ambassador' },
    { ar: 'صائد المعاني', en: 'Meaning Hunter' },
    { ar: 'صوت الشباب', en: 'Youth Voice' },
    { ar: 'حكيم النقاش', en: 'Wise Debater' },
    { ar: 'صانع التغيير', en: 'Change Maker' },
    { ar: 'قائد الفكرة', en: 'Idea Leader' },
    { ar: 'نجم الإتقان', en: 'Mastery Star' },
    { ar: 'حارس اللغة', en: 'Language Guardian' },
    { ar: 'أسطورة الإتقان', en: 'Legend of Mastery' },
  ],
  4: [
    { ar: 'الخطيب الحكيم', en: 'Wise Orator' },
    { ar: 'أيقونة البلاغة', en: 'Rhetoric Icon' },
    { ar: 'أسطورة الطلاقة', en: 'Fluency Legend' },
    { ar: 'صوت القيادة', en: 'Voice of Leadership' },
    { ar: 'سفير العالم', en: 'World Ambassador' },
    { ar: 'عقل استراتيجي', en: 'Strategic Mind' },
    { ar: 'قوة الكلمة', en: 'Power of Words' },
    { ar: 'بطل المنصة', en: 'Stage Hero' },
    { ar: 'حكيم اللغة', en: 'Language Sage' },
    { ar: 'صانع الأثر', en: 'Impact Maker' },
    { ar: 'نجم العالم', en: 'Global Star' },
    { ar: 'قائد الحوار', en: 'Dialogue Leader' },
    { ar: 'صوت لا يُنسى', en: 'Unforgettable Voice' },
    { ar: 'سيد التعبير', en: 'Master of Expression' },
    { ar: 'عقل بلا حدود', en: 'Limitless Mind' },
    { ar: 'سفير الثقة', en: 'Confidence Ambassador' },
    { ar: 'صانع الحكاية', en: 'Story Maker' },
    { ar: 'حارس الإرث', en: 'Legacy Guardian' },
    { ar: 'نجم القمة', en: 'Summit Star' },
    { ar: 'صوت المستقبل', en: 'Voice of the Future' },
    { ar: 'أسطورة الإلهام', en: 'Legend of Inspiration' },
    { ar: 'قمة البلاغة', en: 'Summit of Rhetoric' },
    { ar: 'بطل الطلاقة', en: 'Fluency Hero' },
    { ar: 'نجم الأساطير', en: 'Star of Legends' },
    { ar: 'أسطورة الطلاقة الكبرى', en: 'The Ultimate Fluency Legend' },
  ],
};

interface CardMessage {
  quoteEn: string;
  quoteAr: string;
  challengeEn: string;
  challengeAr: string;
}

const CARD_MESSAGES: readonly CardMessage[] = [
  {
    quoteEn: 'Every expert was once a beginner.',
    quoteAr: 'كل خبير كان يومًا مبتدئًا.',
    challengeEn: 'Say one new English word aloud.',
    challengeAr: 'قل كلمة إنجليزية جديدة بصوت عالٍ.',
  },
  {
    quoteEn: 'A new language is a new life.',
    quoteAr: 'لغة جديدة تعني حياة جديدة.',
    challengeEn: 'Introduce yourself in one sentence.',
    challengeAr: 'عرّف عن نفسك بجملة واحدة.',
  },
  {
    quoteEn: 'Small steps build fluent voices.',
    quoteAr: 'الخطوات الصغيرة تصنع صوتًا طليقًا.',
    challengeEn: 'Read one lesson sentence aloud.',
    challengeAr: 'اقرأ جملة من درسك بصوت عالٍ.',
  },
  {
    quoteEn: 'English is your passport to the world.',
    quoteAr: 'الإنجليزية جواز سفرك إلى العالم.',
    challengeEn: 'Ask one English question today.',
    challengeAr: 'اسأل سؤالًا إنجليزيًا اليوم.',
  },
  {
    quoteEn: 'Mistakes are proof that you are trying.',
    quoteAr: 'الأخطاء دليل أنك تحاول.',
    challengeEn: "Try a sentence even if you're not sure.",
    challengeAr: 'جرّب جملة حتى لو لم تكن متأكدًا.',
  },
  {
    quoteEn: 'Speak today, shine tomorrow.',
    quoteAr: 'تحدّث اليوم، وتألّق غدًا.',
    challengeEn: 'Speak for 30 seconds without stopping.',
    challengeAr: 'تحدّث 30 ثانية دون توقف.',
  },
  {
    quoteEn: 'Your voice deserves to be heard.',
    quoteAr: 'صوتك يستحق أن يُسمع.',
    challengeEn: 'Share your opinion in English.',
    challengeAr: 'شارك رأيك بالإنجليزية.',
  },
  {
    quoteEn: 'Think bigger. Speak bolder.',
    quoteAr: 'فكّر أكبر، وتحدّث بجرأة.',
    challengeEn: 'Support an opinion with one reason.',
    challengeAr: 'ادعم رأيًا بسبب واحد.',
  },
  {
    quoteEn: 'Fluency is built one brave sentence at a time.',
    quoteAr: 'الطلاقة تُبنى بجملة جريئة في كل مرة.',
    challengeEn: 'Make one brave sentence now.',
    challengeAr: 'قل جملة جريئة الآن.',
  },
  {
    quoteEn: 'One word a day opens a thousand doors.',
    quoteAr: 'كلمة كل يوم تفتح ألف باب.',
    challengeEn: 'Learn and use one new word today.',
    challengeAr: 'تعلّم كلمة جديدة واستخدمها اليوم.',
  },
  {
    quoteEn: 'English is the language of the world. Speak it with confidence.',
    quoteAr: 'الإنجليزية هي لغة العالم، تحدّثها بثقة.',
    challengeEn: 'Say your favourite English sentence confidently.',
    challengeAr: 'قل جملتك الإنجليزية المفضلة بثقة.',
  },
  {
    quoteEn: "You didn't come this far to stop now.",
    quoteAr: 'لم تصل إلى هنا لتتوقف الآن.',
    challengeEn: 'Finish one more small goal today.',
    challengeAr: 'أكمل هدفًا صغيرًا آخر اليوم.',
  },
  {
    quoteEn: 'Progress, not perfection.',
    quoteAr: 'تقدّم، لا كمال.',
    challengeEn: 'Practise for five focused minutes.',
    challengeAr: 'تدرّب خمس دقائق بتركيز.',
  },
  {
    quoteEn: 'The best time to speak is now.',
    quoteAr: 'أفضل وقت للتحدث هو الآن.',
    challengeEn: 'Say hello in English to someone.',
    challengeAr: 'قل مرحبًا بالإنجليزية لشخص ما.',
  },
  {
    quoteEn: 'Your accent is part of your story.',
    quoteAr: 'لكنتك جزء من قصتك.',
    challengeEn: 'Read a sentence slowly and clearly.',
    challengeAr: 'اقرأ جملة ببطء ووضوح.',
  },
  {
    quoteEn: 'Listen, repeat, shine.',
    quoteAr: 'استمع، كرّر، وتألّق.',
    challengeEn: 'Repeat one audio line three times.',
    challengeAr: 'كرر سطرًا صوتيًا ثلاث مرات.',
  },
  {
    quoteEn: 'Every conversation is a victory.',
    quoteAr: 'كل محادثة انتصار.',
    challengeEn: 'Start a short English conversation.',
    challengeAr: 'ابدأ محادثة إنجليزية قصيرة.',
  },
  {
    quoteEn: 'Words open worlds.',
    quoteAr: 'الكلمات تفتح عوالم.',
    challengeEn: 'Use a new word in a full sentence.',
    challengeAr: 'استخدم كلمة جديدة في جملة كاملة.',
  },
  {
    quoteEn: 'Be proud of your progress.',
    quoteAr: 'كن فخورًا بتقدمك.',
    challengeEn: 'Review three words you learned.',
    challengeAr: 'راجع ثلاث كلمات تعلمتها.',
  },
  {
    quoteEn: 'A little every day goes a long way.',
    quoteAr: 'القليل كل يوم يصنع فرقًا كبيرًا.',
    challengeEn: 'Complete a lesson and say why it matters.',
    challengeAr: 'أكمل درسًا وقل لماذا يهمك.',
  },
  {
    quoteEn: 'Confidence grows when you use it.',
    quoteAr: 'الثقة تنمو حين تستخدمها.',
    challengeEn: 'Answer one question out loud.',
    challengeAr: 'أجب عن سؤال بصوت عالٍ.',
  },
  {
    quoteEn: 'The world is waiting for your voice.',
    quoteAr: 'العالم ينتظر صوتك.',
    challengeEn: 'Say your dream in English.',
    challengeAr: 'قل حلمك بالإنجليزية.',
  },
  {
    quoteEn: 'Learn boldly, live freely.',
    quoteAr: 'تعلّم بجرأة، وعش بحرية.',
    challengeEn: 'Make a mistake and keep going.',
    challengeAr: 'ارتكب خطأً وواصل التقدم.',
  },
  {
    quoteEn: 'Your future self will thank you.',
    quoteAr: 'نسختك المستقبلية ستشكرك.',
    challengeEn: 'Do one thing today your future self will love.',
    challengeAr: 'افعل اليوم شيئًا ستحبه نسختك المستقبلية.',
  },
  {
    quoteEn: 'Never stop becoming.',
    quoteAr: 'لا تتوقف عن التطور.',
    challengeEn: 'Set one new learning goal today.',
    challengeAr: 'ضع هدفًا تعليميًا جديدًا اليوم.',
  },
];

const DEFAULT_MESSAGE = CARD_MESSAGES[0];
const FALLBACK_ANIMAL = ANIMALS_BY_STAGE[1][0];

const cards: MotivationalCard[] = Array.from({ length: 200 }, (_, globalIndex) => {
  const stage = Math.floor(globalIndex / 50) + 1;
  const withinStage = globalIndex % 50;
  const edition: MotivationalCardEdition = withinStage >= 25 ? 'gold' : 'classic';
  const editionIndex = withinStage % 25;
  const requiredLessons = edition === 'gold'
    ? 50 + (editionIndex + 1) * 2
    : (editionIndex + 1) * 2;
  const baseTitle = STAGE_TITLES[stage]?.[editionIndex] ?? DEFAULT_TITLE;
  const title = edition === 'gold'
    ? { ar: `النسخة الذهبية · ${baseTitle.ar}`, en: `Golden ${baseTitle.en}` }
    : baseTitle;
  const messageIndex = edition === 'gold'
    ? (globalIndex + 11) % CARD_MESSAGES.length
    : globalIndex % CARD_MESSAGES.length;
  const message = CARD_MESSAGES[messageIndex] ?? DEFAULT_MESSAGE;
  const goldPalettes = GOLD_PALETTES[stage] ?? GOLD_PALETTES[1];
  const palette = edition === 'gold'
    ? goldPalettes[editionIndex % goldPalettes.length] ?? GOLD_DEFAULT_PALETTE
    : STAGE_PALETTES[stage]?.[editionIndex % 3] ?? DEFAULT_PALETTE;
  const animal = ANIMALS_BY_STAGE[stage]?.[editionIndex] ?? FALLBACK_ANIMAL;
  const rarity: MotivationalCardRarity = edition === 'gold'
    ? editionIndex === 24
      ? 'legend'
      : 'epic'
    : editionIndex === 24
      ? 'legend'
      : editionIndex % 5 === 4
        ? 'epic'
        : 'hero';
  const xp = 40 + requiredLessons * 5
    + (rarity === 'legend' ? 160 : rarity === 'epic' ? 40 : 0)
    + (edition === 'gold' ? 120 : 0);

  return {
    id: edition === 'gold'
      ? `et-s${stage}-g${String(editionIndex + 1).padStart(2, '0')}`
      : `et-s${stage}-${String(editionIndex + 1).padStart(2, '0')}`,
    serial: `ET-${String(globalIndex + 1).padStart(3, '0')}`,
    stage,
    requiredLessons,
    titleAr: title.ar,
    titleEn: title.en,
    quoteEn: message.quoteEn,
    quoteAr: message.quoteAr,
    challengeEn: message.challengeEn,
    challengeAr: message.challengeAr,
    animal,
    rarity,
    edition,
    xp,
    palette,
  };
});

export const MOTIVATIONAL_CARDS: readonly MotivationalCard[] = cards;

export const getMotivationalCardsForStage = (stage: number): MotivationalCard[] =>
  MOTIVATIONAL_CARDS.filter((entry) => entry.stage === stage);

export const getMotivationalCardById = (id: string): MotivationalCard | undefined =>
  MOTIVATIONAL_CARDS.find((entry) => entry.id === id);

export const getStageCardProgress = (
  cardEntry: MotivationalCard,
  progressByStage: Record<number, number>,
): number => Math.max(0, Math.min(progressByStage[cardEntry.stage] ?? 0, cardEntry.requiredLessons));

export const isMotivationalCardUnlocked = (
  cardEntry: MotivationalCard,
  progressByStage: Record<number, number>,
): boolean => (progressByStage[cardEntry.stage] ?? 0) >= cardEntry.requiredLessons;

export const getMotivationalCardsUnlockedCount = (
  progressByStage: Record<number, number>,
): number => MOTIVATIONAL_CARDS.filter((entry) => isMotivationalCardUnlocked(entry, progressByStage)).length;

export const getNextMotivationalCard = (
  progressByStage: Record<number, number>,
): MotivationalCard =>
  MOTIVATIONAL_CARDS.find((entry) => !isMotivationalCardUnlocked(entry, progressByStage)) ??
  MOTIVATIONAL_CARDS[MOTIVATIONAL_CARDS.length - 1];

export const getStageName = (stage: number): MotivationalCardStage =>
  MOTIVATIONAL_CARD_STAGES.find((entry) => entry.stage === stage) ?? MOTIVATIONAL_CARD_STAGES[0];
