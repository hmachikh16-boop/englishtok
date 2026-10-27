/**
 * Instant tutor fallback.
 *
 * The public AI provider used by the free deployment is anonymous and
 * rate-limited (it can return 402 after a handful of messages, and sometimes
 * takes 20+ seconds). The app must still answer immediately, so the API uses
 * this deterministic tutor whenever no account-backed provider is configured,
 * and when a configured provider fails.
 *
 * It is intentionally a focused language-practice engine, not a pretend LLM:
 * it detects the topic, acknowledges the learner, asks one level-appropriate
 * follow-up, returns one useful correction and two vocabulary items.
 */

export interface LocalTutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LocalTutorInput {
  messages: LocalTutorMessage[];
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  mode: 'conversation' | 'pronunciation';
  target: string;
  language: 'en' | 'fr';
}

export interface LocalTutorReply {
  reply: string;
  translationAr: string;
  corrections: Array<{ wrong: string; correct: string; explanationAr: string }>;
  vocabulary: Array<{ word: string; meaningAr: string; phonetic: string }>;
  pronunciation: {
    target: string;
    score: number;
    feedbackAr: string;
    tipAr: string;
  } | null;
}

type Language = LocalTutorInput['language'];
type Level = LocalTutorInput['level'];

interface Phrase {
  en: string;
  fr: string;
  ar: string;
}

interface Vocabulary {
  word: string;
  meaningAr: string;
  phonetic: string;
}

interface Topic {
  id: string;
  keywords: string[];
  starter: Phrase;
  questions: {
    beginner: Phrase[];
    advanced: Phrase[];
  };
  vocabulary: Record<Language, Vocabulary[]>;
}

interface Correction {
  wrong: string;
  correct: string;
  explanationAr: string;
}

interface CorrectionRule {
  pattern: RegExp;
  replace: (match: RegExpMatchArray) => string;
  explanationAr: string;
}

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const hashText = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const pick = <T>(items: readonly T[], seed: number): T => items[seed % items.length] as T;

const hasArabic = (value: string): boolean => /[\u0600-\u06FF]/.test(value);

const isAdvanced = (level: Level): boolean =>
  level === 'B1' || level === 'B2' || level === 'C1';

const containsKeyword = (text: string, keyword: string): boolean => {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;
  if (/^[a-z0-9' ]+$/.test(normalizedKeyword)) {
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text);
  }
  return text.includes(normalizedKeyword);
};

const matchTopic = (text: string): Topic => {
  let bestTopic: Topic = DAILY_TOPIC;
  let bestScore = 0;
  for (const topic of TOPICS) {
    const score = topic.keywords.reduce(
      (total, keyword) => total + (containsKeyword(text, keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }
  return bestTopic;
};

const POSITIVE_WORDS = [
  'good', 'great', 'happy', 'love', 'enjoy', 'wonderful', 'excellent', 'amazing',
  'excited', 'fine', 'bien', 'heureux', 'aime', 'formidable', 'سعيد', 'رائع',
  'ممتاز', 'أحب', 'جيد', 'سعيد',
];

const NEGATIVE_WORDS = [
  'tired', 'sad', 'stressed', 'bad', 'hard', 'difficult', 'worried', 'busy',
  'angry', 'triste', 'fatigue', 'stresse', 'difficile', 'occupe', 'متعب', 'حزين',
  'صعب', 'مشغول', 'قلق', 'تعبان',
];

const detectSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  if (NEGATIVE_WORDS.some((word) => containsKeyword(text, word))) return 'negative';
  if (POSITIVE_WORDS.some((word) => containsKeyword(text, word))) return 'positive';
  return 'neutral';
};

const ACKS: Record<'positive' | 'negative' | 'neutral', Record<'beginner' | 'advanced', Phrase[]>> = {
  positive: {
    beginner: [
      { en: "That's wonderful!", fr: "C'est formidable !", ar: 'هذا رائع!' },
      { en: "I'm glad to hear that!", fr: "Je suis content de l'entendre !", ar: 'سعيد لسماع ذلك!' },
    ],
    advanced: [
      { en: 'That sounds really positive.', fr: 'Cela semble vraiment positif.', ar: 'يبدو ذلك إيجابيًا حقًا.' },
      { en: 'I appreciate the positive energy.', fr: "J'apprécie cette énergie positive.", ar: 'أقدّر هذه الطاقة الإيجابية.' },
    ],
  },
  negative: {
    beginner: [
      { en: "I'm sorry to hear that.", fr: "Je suis désolé de l'entendre.", ar: 'آسف لسماع ذلك.' },
      { en: 'That sounds difficult.', fr: 'Cela semble difficile.', ar: 'يبدو ذلك صعبًا.' },
    ],
    advanced: [
      { en: 'I understand — that can be tiring.', fr: 'Je comprends — cela peut être fatigant.', ar: 'أتفهم ذلك — قد يكون مرهقًا.' },
      { en: 'Thank you for sharing that; take it one step at a time.', fr: "Merci de partager cela ; avance étape par étape.", ar: 'شكرًا لمشاركتك ذلك؛ خذها خطوة بخطوة.' },
    ],
  },
  neutral: {
    beginner: [
      { en: 'Thanks for sharing!', fr: 'Merci de partager !', ar: 'شكرًا لمشاركتك!' },
      { en: "That's nice!", fr: "C'est bien !", ar: 'هذا لطيف!' },
    ],
    advanced: [
      { en: "That's interesting.", fr: "C'est intéressant.", ar: 'هذا مثير للاهتمام.' },
      { en: 'I appreciate you sharing that.', fr: "Merci d'avoir partagé cela.", ar: 'أقدّر مشاركتك لذلك.' },
    ],
  },
};

const TOPICS: Topic[] = [
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'bonjour', 'salut', 'bonsoir', 'coucou', 'مرحبا', 'أهلا', 'السلام', 'صباح', 'مساء'],
    starter: {
      en: "Hello! It's nice to meet you.",
      fr: 'Bonjour ! Enchanté de te rencontrer.',
      ar: 'مرحبًا! سعيد بلقائك.',
    },
    questions: {
      beginner: [
        { en: 'How are you feeling today?', fr: "Comment te sens-tu aujourd'hui ?", ar: 'كيف تشعر اليوم؟' },
        { en: 'What would you like to talk about today?', fr: "De quoi aimerais-tu parler aujourd'hui ?", ar: 'عن ماذا تحب أن نتحدث اليوم؟' },
      ],
      advanced: [
        { en: 'What has been the best part of your day so far?', fr: "Quel a été le meilleur moment de ta journée jusqu'ici ?", ar: 'ما أفضل جزء في يومك حتى الآن؟' },
        { en: 'What would you like to improve this week?', fr: "Qu'aimerais-tu améliorer cette semaine ?", ar: 'ماذا تحب أن تحسّن هذا الأسبوع؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'hello', meaningAr: 'مرحبًا', phonetic: 'həˈloʊ' },
        { word: 'great', meaningAr: 'رائع', phonetic: 'ɡreɪt' },
      ],
      fr: [
        { word: 'bonjour', meaningAr: 'مرحبًا', phonetic: 'bɔ̃ʒuʁ' },
        { word: 'ravi', meaningAr: 'سعيد', phonetic: 'ʁavi' },
      ],
    },
  },
  {
    id: 'intro',
    keywords: ['my name', 'name is', "i'm from", 'i am from', 'je m’appelle', "je m'appelle", 'je viens de', 'اسمي', 'أنا من'],
    starter: {
      en: "My name is Ahmed, and I'm from Riyadh.",
      fr: "Je m'appelle Ahmed et je viens de Riyad.",
      ar: 'اسمي أحمد وأنا من الرياض.',
    },
    questions: {
      beginner: [
        { en: 'Where are you from?', fr: "D'où viens-tu ?", ar: 'من أين أنت؟' },
        { en: 'What do you do?', fr: 'Que fais-tu dans la vie ?', ar: 'ماذا تعمل؟' },
      ],
      advanced: [
        { en: 'What is something people often misunderstand about you?', fr: "Qu'est-ce que les gens comprennent souvent mal chez toi ?", ar: 'ما الشيء الذي يسيء الناس فهمه عنك غالبًا؟' },
        { en: 'How would you introduce yourself to a new group?', fr: 'Comment te présenterais-tu à un nouveau groupe ?', ar: 'كيف تعرّف بنفسك لمجموعة جديدة؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'name', meaningAr: 'اسم', phonetic: 'neɪm' },
        { word: 'from', meaningAr: 'من', phonetic: 'frəm' },
      ],
      fr: [
        { word: 'prénom', meaningAr: 'الاسم الأول', phonetic: 'pʁenɔ̃' },
        { word: 'venir de', meaningAr: 'يأتي من', phonetic: 'vəniʁ də' },
      ],
    },
  },
  {
    id: 'work',
    keywords: ['work', 'job', 'school', 'study', 'student', 'teacher', 'engineer', 'office', 'university', 'travail', 'travaille', 'ecole', 'etudier', 'etudiant', 'professeur', 'bureau', 'universite', 'عمل', 'وظيفة', 'دراسة', 'طالب', 'مدرسة', 'جامعة'],
    starter: {
      en: 'I work as an engineer.',
      fr: 'Je travaille comme ingénieur.',
      ar: 'أعمل مهندسًا.',
    },
    questions: {
      beginner: [
        { en: 'What do you like most about your work or studies?', fr: "Qu'aimes-tu le plus dans ton travail ou tes études ?", ar: 'ما أكثر ما تحبه في عملك أو دراستك؟' },
        { en: 'Do you prefer working alone or with others?', fr: 'Préfères-tu travailler seul ou avec les autres ?', ar: 'هل تفضل العمل وحدك أم مع الآخرين؟' },
      ],
      advanced: [
        { en: 'What skill would you like to develop for your career?', fr: 'Quelle compétence aimerais-tu développer pour ta carrière ?', ar: 'ما المهارة التي تحب تطويرها لمسيرتك المهنية؟' },
        { en: 'How do you stay focused on busy days?', fr: 'Comment restes-tu concentré pendant les journées chargées ?', ar: 'كيف تحافظ على تركيزك في الأيام المزدحمة؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'job', meaningAr: 'وظيفة', phonetic: 'dʒɑːb' },
        { word: 'skill', meaningAr: 'مهارة', phonetic: 'skɪl' },
      ],
      fr: [
        { word: 'travail', meaningAr: 'عمل', phonetic: 'tʁavaj' },
        { word: 'compétence', meaningAr: 'مهارة', phonetic: 'kɔ̃petɑ̃s' },
      ],
    },
  },
  {
    id: 'family',
    keywords: ['family', 'mother', 'father', 'brother', 'sister', 'parents', 'wife', 'husband', 'children', 'famille', 'mere', 'pere', 'frere', 'soeur', 'parents', 'عائلة', 'أم', 'أب', 'أخ', 'أخت', 'زوجة', 'زوج', 'أطفال'],
    starter: {
      en: 'I have a small family.',
      fr: "J'ai une petite famille.",
      ar: 'لدي عائلة صغيرة.',
    },
    questions: {
      beginner: [
        { en: 'How many people are in your family?', fr: 'Combien de personnes y a-t-il dans ta famille ?', ar: 'كم عدد أفراد عائلتك؟' },
        { en: 'What do you enjoy doing together?', fr: "Qu'aimez-vous faire ensemble ?", ar: 'ماذا تحبون أن تفعلوا معًا؟' },
      ],
      advanced: [
        { en: 'What value from your family do you carry with you?', fr: 'Quelle valeur de ta famille portes-tu avec toi ?', ar: 'ما القيمة التي تحملها من عائلتك؟' },
        { en: 'How has your family shaped your goals?', fr: 'Comment ta famille a-t-elle façonné tes objectifs ?', ar: 'كيف شكّلت عائلتك أهدافك؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'family', meaningAr: 'عائلة', phonetic: 'ˈfæməli' },
        { word: 'together', meaningAr: 'معًا', phonetic: 'təˈɡeðər' },
      ],
      fr: [
        { word: 'famille', meaningAr: 'عائلة', phonetic: 'famij' },
        { word: 'ensemble', meaningAr: 'معًا', phonetic: 'ɑ̃sɑ̃bl' },
      ],
    },
  },
  {
    id: 'food',
    keywords: ['food', 'eat', 'eating', 'drink', 'restaurant', 'coffee', 'tea', 'breakfast', 'lunch', 'dinner', 'hungry', 'delicious', 'manger', 'boire', 'nourriture', 'cafe', 'the', 'petit-dejeuner', 'dejeuner', 'diner', 'faim', 'طعام', 'أكل', 'أشرب', 'مطعم', 'قهوة', 'شاي', 'فطور', 'غداء', 'عشاء', 'جائع', 'لذيذ'],
    starter: {
      en: 'I am hungry, and I would like something light.',
      fr: "J'ai faim et j'aimerais quelque chose de léger.",
      ar: 'أنا جائع وأريد شيئًا خفيفًا.',
    },
    questions: {
      beginner: [
        { en: 'What is your favorite dish?', fr: 'Quel est ton plat préféré ?', ar: 'ما طبقك المفضل؟' },
        { en: 'Do you prefer eating at home or at a restaurant?', fr: 'Préfères-tu manger à la maison ou au restaurant ?', ar: 'هل تفضل الأكل في المنزل أم في المطعم؟' },
      ],
      advanced: [
        { en: 'What dish reminds you of home?', fr: 'Quel plat te rappelle la maison ?', ar: 'ما الطبق الذي يذكّرك بالمنزل؟' },
        { en: 'How would you describe your favorite meal to someone who has never tried it?', fr: "Comment décrirais-tu ton plat préféré à quelqu'un qui ne l'a jamais goûté ?", ar: 'كيف تصف وجبتك المفضلة لمن لم يجربها؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'delicious', meaningAr: 'لذيذ', phonetic: 'dɪˈlɪʃəs' },
        { word: 'hungry', meaningAr: 'جائع', phonetic: 'ˈhʌŋɡri' },
      ],
      fr: [
        { word: 'délicieux', meaningAr: 'لذيذ', phonetic: 'delisjø' },
        { word: 'faim', meaningAr: 'جوع', phonetic: 'fɛ̃' },
      ],
    },
  },
  {
    id: 'travel',
    keywords: ['travel', 'trip', 'city', 'country', 'visit', 'hotel', 'airport', 'vacation', 'voyage', 'ville', 'pays', 'visiter', 'hotel', 'aeroport', 'vacances', 'سفر', 'رحلة', 'مدينة', 'بلد', 'زيارة', 'فندق', 'مطار', 'عطلة'],
    starter: {
      en: 'I would like to visit a new city.',
      fr: "J'aimerais visiter une nouvelle ville.",
      ar: 'أود زيارة مدينة جديدة.',
    },
    questions: {
      beginner: [
        { en: 'Where would you like to travel next?', fr: 'Où aimerais-tu voyager ensuite ?', ar: 'إلى أين تحب أن تسافر بعد ذلك؟' },
        { en: 'Do you prefer the beach or the mountains?', fr: 'Préfères-tu la plage ou la montagne ?', ar: 'هل تفضل الشاطئ أم الجبال؟' },
      ],
      advanced: [
        { en: 'What place has changed the way you see the world?', fr: 'Quel lieu a changé ta façon de voir le monde ?', ar: 'ما المكان الذي غيّر نظرتك إلى العالم؟' },
        { en: 'How do you plan a trip without missing the important details?', fr: 'Comment planifies-tu un voyage sans oublier les détails importants ?', ar: 'كيف تخطط لرحلة دون تفويت التفاصيل المهمة؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'journey', meaningAr: 'رحلة', phonetic: 'ˈdʒɜːrni' },
        { word: 'destination', meaningAr: 'وجهة', phonetic: 'ˌdestɪˈneɪʃən' },
      ],
      fr: [
        { word: 'voyage', meaningAr: 'سفر', phonetic: 'vwajaʒ' },
        { word: 'destination', meaningAr: 'وجهة', phonetic: 'dɛstinasjɔ̃' },
      ],
    },
  },
  {
    id: 'hobbies',
    keywords: ['hobby', 'free time', 'like', 'love', 'enjoy', 'music', 'sport', 'read', 'reading', 'game', 'football', 'loisir', 'temps libre', 'aime', 'musique', 'sport', 'lire', 'jeu', 'football', 'هواية', 'وقت فراغ', 'أحب', 'موسيقى', 'رياضة', 'قراءة', 'لعبة', 'كرة'],
    starter: {
      en: 'In my free time, I like reading.',
      fr: "Pendant mon temps libre, j'aime lire.",
      ar: 'في وقت فراغي أحب القراءة.',
    },
    questions: {
      beginner: [
        { en: 'What do you like to do in your free time?', fr: "Qu'aimes-tu faire pendant ton temps libre ?", ar: 'ماذا تحب أن تفعل في وقت فراغك؟' },
        { en: 'Do you prefer music or sports?', fr: 'Préfères-tu la musique ou le sport ?', ar: 'هل تفضل الموسيقى أم الرياضة؟' },
      ],
      advanced: [
        { en: 'What hobby would you like to learn, and why?', fr: 'Quel loisir aimerais-tu apprendre, et pourquoi ?', ar: 'ما الهواية التي تحب تعلمها، ولماذا؟' },
        { en: 'How do your hobbies help you recharge?', fr: 'Comment tes loisirs t’aident-ils à te ressourcer ?', ar: 'كيف تساعدك هواياتك على استعادة طاقتك؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'hobby', meaningAr: 'هواية', phonetic: 'ˈhɑːbi' },
        { word: 'relax', meaningAr: 'يسترخي', phonetic: 'rɪˈlæks' },
      ],
      fr: [
        { word: 'loisir', meaningAr: 'هواية', phonetic: 'lwaziʁ' },
        { word: 'se détendre', meaningAr: 'يسترخي', phonetic: 'sə detɑ̃dʁ' },
      ],
    },
  },
  {
    id: 'routine',
    keywords: ['every day', 'daily', 'morning', 'evening', 'wake', 'routine', 'usually', 'tous les jours', 'matin', 'soir', 'routine', 'يومي', 'كل يوم', 'صباح', 'مساء', 'روتين', 'عادة'],
    starter: {
      en: 'I usually wake up early.',
      fr: 'Je me lève généralement tôt.',
      ar: 'عادةً أستيقظ مبكرًا.',
    },
    questions: {
      beginner: [
        { en: 'What time do you usually wake up?', fr: 'À quelle heure te lèves-tu généralement ?', ar: 'في أي ساعة تستيقظ عادةً؟' },
        { en: 'What is your favorite part of the day?', fr: 'Quel est ton moment préféré de la journée ?', ar: 'ما الجزء المفضل لديك من اليوم؟' },
      ],
      advanced: [
        { en: 'Which part of your routine helps you most, and why?', fr: 'Quelle partie de ta routine t’aide le plus, et pourquoi ?', ar: 'أي جزء من روتينك يساعدك أكثر، ولماذا؟' },
        { en: 'What would you change about your daily schedule?', fr: 'Que changerais-tu dans ton emploi du temps quotidien ?', ar: 'ماذا ستغيّر في جدولك اليومي؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'routine', meaningAr: 'روتين', phonetic: 'ruːˈtiːn' },
        { word: 'early', meaningAr: 'مبكرًا', phonetic: 'ˈɜːrli' },
      ],
      fr: [
        { word: 'routine', meaningAr: 'روتين', phonetic: 'ʁutin' },
        { word: 'tôt', meaningAr: 'مبكرًا', phonetic: 'to' },
      ],
    },
  },
  {
    id: 'weather',
    keywords: ['weather', 'rain', 'raining', 'sun', 'sunny', 'hot', 'cold', 'wind', 'temps', 'pluie', 'soleil', 'chaud', 'froid', 'vent', 'طقس', 'مطر', 'شمس', 'حار', 'بارد', 'ريح'],
    starter: {
      en: 'The weather is sunny today.',
      fr: "Il fait beau aujourd'hui.",
      ar: 'الطقس مشمس اليوم.',
    },
    questions: {
      beginner: [
        { en: 'What is the weather like today?', fr: "Quel temps fait-il aujourd'hui ?", ar: 'كيف الطقس اليوم؟' },
        { en: 'Do you prefer hot or cold weather?', fr: 'Préfères-tu le temps chaud ou froid ?', ar: 'هل تفضل الطقس الحار أم البارد؟' },
      ],
      advanced: [
        { en: 'How does the weather affect your mood or plans?', fr: 'Comment le temps influence-t-il ton humeur ou tes projets ?', ar: 'كيف يؤثر الطقس في مزاجك أو خططك؟' },
        { en: 'What is your ideal weather for a perfect day?', fr: 'Quel temps idéal choisirais-tu pour une journée parfaite ?', ar: 'ما الطقس المثالي ليوم رائع؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'weather', meaningAr: 'طقس', phonetic: 'ˈweðər' },
        { word: 'sunny', meaningAr: 'مشمس', phonetic: 'ˈsʌni' },
      ],
      fr: [
        { word: 'temps', meaningAr: 'طقس', phonetic: 'tɑ̃' },
        { word: 'ensoleillé', meaningAr: 'مشمس', phonetic: 'ɑ̃sɔleje' },
      ],
    },
  },
  {
    id: 'shopping',
    keywords: ['buy', 'shop', 'shopping', 'price', 'clothes', 'market', 'expensive', 'cheap', 'acheter', 'magasin', 'prix', 'vetements', 'marche', 'cher', 'pas cher', 'شراء', 'أشتري', 'سوق', 'سعر', 'ملابس', 'غالي', 'رخيص'],
    starter: {
      en: 'I would like to buy a new jacket.',
      fr: "J'aimerais acheter une nouvelle veste.",
      ar: 'أود شراء سترة جديدة.',
    },
    questions: {
      beginner: [
        { en: 'What do you usually buy when you go shopping?', fr: "Qu'achètes-tu généralement quand tu fais du shopping ?", ar: 'ماذا تشتري عادةً عندما تتسوق؟' },
        { en: 'Do you prefer shopping online or in a store?', fr: 'Préfères-tu acheter en ligne ou en magasin ?', ar: 'هل تفضل الشراء عبر الإنترنت أم من المتجر؟' },
      ],
      advanced: [
        { en: 'How do you decide whether something is worth the price?', fr: "Comment décides-tu si quelque chose vaut son prix ?", ar: 'كيف تقرر إن كان شيء ما يستحق سعره؟' },
        { en: 'What is the best purchase you have made recently?', fr: 'Quel est le meilleur achat que tu as fait récemment ?', ar: 'ما أفضل عملية شراء قمت بها مؤخرًا؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'price', meaningAr: 'سعر', phonetic: 'praɪs' },
        { word: 'bargain', meaningAr: 'صفقة رابحة', phonetic: 'ˈbɑːrɡən' },
      ],
      fr: [
        { word: 'prix', meaningAr: 'سعر', phonetic: 'pʁi' },
        { word: 'acheter', meaningAr: 'يشتري', phonetic: 'aʃte' },
      ],
    },
  },
  {
    id: 'feelings',
    keywords: ['happy', 'sad', 'tired', 'stressed', 'feel', 'feeling', 'excited', 'worried', 'heureux', 'triste', 'fatigue', 'stresse', 'sentir', 'excite', 'inquiet', 'سعيد', 'حزين', 'متعب', 'متوتر', 'أشعر', 'قلق'],
    starter: {
      en: 'I feel tired today.',
      fr: "Je me sens fatigué aujourd'hui.",
      ar: 'أشعر بالتعب اليوم.',
    },
    questions: {
      beginner: [
        { en: 'What makes you feel happy?', fr: "Qu'est-ce qui te rend heureux ?", ar: 'ما الذي يجعلك سعيدًا؟' },
        { en: 'What do you do when you feel tired?', fr: 'Que fais-tu quand tu te sens fatigué ?', ar: 'ماذا تفعل عندما تشعر بالتعب؟' },
      ],
      advanced: [
        { en: 'How do you usually handle a stressful day?', fr: 'Comment gères-tu généralement une journée stressante ?', ar: 'كيف تتعامل عادةً مع يوم مرهق؟' },
        { en: 'What helps you feel more confident when you speak?', fr: "Qu'est-ce qui t'aide à te sentir plus confiant quand tu parles ?", ar: 'ما الذي يساعدك على الشعور بثقة أكبر عند التحدث؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'confident', meaningAr: 'واثق', phonetic: 'ˈkɑːnfɪdənt' },
        { word: 'calm', meaningAr: 'هادئ', phonetic: 'kɑːm' },
      ],
      fr: [
        { word: 'confiant', meaningAr: 'واثق', phonetic: 'kɔ̃fjɑ̃' },
        { word: 'calme', meaningAr: 'هادئ', phonetic: 'kalm' },
      ],
    },
  },
  {
    id: 'plans',
    keywords: ['tomorrow', 'next week', 'plan', 'will', 'going to', 'soon', 'demain', 'semaine prochaine', 'projet', 'bientot', 'غدا', 'الأسبوع القادم', 'خطة', 'سوف', 'قريبا'],
    starter: {
      en: 'Tomorrow, I am going to study English.',
      fr: 'Demain, je vais étudier le français.',
      ar: 'غدًا سأدرس الإنجليزية.',
    },
    questions: {
      beginner: [
        { en: 'What are you going to do tomorrow?', fr: 'Que vas-tu faire demain ?', ar: 'ماذا ستفعل غدًا؟' },
        { en: 'Do you have any plans for the weekend?', fr: 'As-tu des projets pour le week-end ?', ar: 'هل لديك خطط لعطلة نهاية الأسبوع؟' },
      ],
      advanced: [
        { en: 'What is one goal you are working toward this month?', fr: 'Quel est l’objectif que tu poursuis ce mois-ci ?', ar: 'ما الهدف الذي تعمل عليه هذا الشهر؟' },
        { en: 'How do you adjust your plans when something unexpected happens?', fr: "Comment ajustes-tu tes projets quand quelque chose d'inattendu arrive ?", ar: 'كيف تعدّل خططك عندما يحدث شيء غير متوقع؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'goal', meaningAr: 'هدف', phonetic: 'ɡoʊl' },
        { word: 'tomorrow', meaningAr: 'غدًا', phonetic: 'təˈmɑːroʊ' },
      ],
      fr: [
        { word: 'objectif', meaningAr: 'هدف', phonetic: 'ɔbʒɛktif' },
        { word: 'demain', meaningAr: 'غدًا', phonetic: 'dəmɛ̃' },
      ],
    },
  },
  {
    id: 'past',
    keywords: ['yesterday', 'last week', 'weekend', 'went', 'did', 'was', 'were', 'hier', 'semaine derniere', 'week-end', 'suis alle', 'a fait', 'أمس', 'الأسبوع الماضي', 'عطلة', 'ذهبت', 'فعلت'],
    starter: {
      en: 'Yesterday, I went to the park.',
      fr: 'Hier, je suis allé au parc.',
      ar: 'أمس ذهبت إلى الحديقة.',
    },
    questions: {
      beginner: [
        { en: 'What did you do last weekend?', fr: 'Qu’as-tu fait le week-end dernier ?', ar: 'ماذا فعلت في عطلة نهاية الأسبوع الماضية؟' },
        { en: 'Did you enjoy your day yesterday?', fr: 'As-tu aimé ta journée hier ?', ar: 'هل استمتعت بيومك أمس؟' },
      ],
      advanced: [
        { en: 'What did you learn from something that did not go as planned?', fr: "Qu'as-tu appris d'une chose qui ne s'est pas passée comme prévu ?", ar: 'ماذا تعلمت من شيء لم يسر كما خططت؟' },
        { en: 'Which recent experience would you like to repeat?', fr: 'Quelle expérience récente aimerais-tu revivre ?', ar: 'ما التجربة الحديثة التي تحب أن تعيشها مرة أخرى؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'weekend', meaningAr: 'عطلة نهاية الأسبوع', phonetic: 'ˌwiːkˈend' },
        { word: 'experience', meaningAr: 'تجربة', phonetic: 'ɪkˈspɪriəns' },
      ],
      fr: [
        { word: 'week-end', meaningAr: 'عطلة نهاية الأسبوع', phonetic: 'wikɛnd' },
        { word: 'expérience', meaningAr: 'تجربة', phonetic: 'ɛkspeʁjɑ̃s' },
      ],
    },
  },
  {
    id: 'opinion',
    keywords: ['think', 'opinion', 'agree', 'disagree', 'because', 'believe', 'pense', 'avis', "d'accord", 'pas d’accord', 'parce que', 'crois', 'أعتقد', 'رأي', 'أوافق', 'لا أوافق', 'لأن'],
    starter: {
      en: 'I think practice is the most important part.',
      fr: 'Je pense que la pratique est le plus important.',
      ar: 'أعتقد أن التدريب هو الأهم.',
    },
    questions: {
      beginner: [
        { en: 'What do you think about learning online?', fr: "Que penses-tu de l'apprentissage en ligne ?", ar: 'ما رأيك في التعلم عبر الإنترنت؟' },
        { en: 'Do you agree that practice is more important than talent?', fr: 'Es-tu d’accord pour dire que la pratique compte plus que le talent ?', ar: 'هل توافق أن التدريب أهم من الموهبة؟' },
      ],
      advanced: [
        { en: 'What is an opinion you have changed your mind about?', fr: 'Sur quelle opinion as-tu changé d’avis ?', ar: 'ما الرأي الذي غيّرت رأيك بشأنه؟' },
        { en: 'How do you disagree politely in a conversation?', fr: 'Comment exprimes-tu un désaccord avec politesse ?', ar: 'كيف تعبّر عن اختلافك بأدب في المحادثة؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'opinion', meaningAr: 'رأي', phonetic: 'əˈpɪnjən' },
        { word: 'agree', meaningAr: 'أوافق', phonetic: 'əˈɡriː' },
      ],
      fr: [
        { word: 'avis', meaningAr: 'رأي', phonetic: 'avi' },
        { word: "d'accord", meaningAr: 'موافق', phonetic: 'dakɔʁ' },
      ],
    },
  },
  {
    id: 'learning',
    keywords: ['english', 'french', 'learn', 'learning', 'practice', 'lesson', 'improve', 'study', 'anglais', 'francais', 'apprendre', 'pratique', 'lecon', 'ameliorer', 'إنجليزي', 'فرنسي', 'تعلم', 'ممارسة', 'درس', 'تحسين'],
    starter: {
      en: 'I practice English for ten minutes every day.',
      fr: 'Je pratique le français dix minutes par jour.',
      ar: 'أتدرب على الإنجليزية عشر دقائق كل يوم.',
    },
    questions: {
      beginner: [
        { en: 'What part of English do you find easiest?', fr: 'Quelle partie du français trouves-tu la plus facile ?', ar: 'أي جزء من اللغة تجده الأسهل؟' },
        { en: 'How much time can you practice each day?', fr: 'Combien de temps peux-tu pratiquer chaque jour ?', ar: 'كم من الوقت يمكنك التدرب كل يوم؟' },
      ],
      advanced: [
        { en: 'What is the biggest challenge in your learning journey right now?', fr: "Quel est le plus grand défi de ton apprentissage en ce moment ?", ar: 'ما أكبر تحدٍ في رحلة تعلمك الآن؟' },
        { en: 'How do you measure your progress?', fr: 'Comment mesures-tu tes progrès ?', ar: 'كيف تقيس تقدمك؟' },
      ],
    },
    vocabulary: {
      en: [
        { word: 'practice', meaningAr: 'ممارسة', phonetic: 'ˈpræktɪs' },
        { word: 'progress', meaningAr: 'تقدم', phonetic: 'ˈprɑːɡres' },
      ],
      fr: [
        { word: 'pratique', meaningAr: 'ممارسة', phonetic: 'pʁatik' },
        { word: 'progrès', meaningAr: 'تقدم', phonetic: 'pʁɔɡʁɛ' },
      ],
    },
  },
];

const DAILY_TOPIC: Topic = {
  id: 'daily',
  keywords: ['today', 'day', 'good', 'fine', 'ok', 'okay', 'yes', 'no', "aujourd'hui", 'bien', 'oui', 'non', 'اليوم', 'بخير', 'نعم', 'لا'],
  starter: {
    en: 'Today was a good day.',
    fr: "Aujourd'hui était une bonne journée.",
    ar: 'اليوم كان يومًا جيدًا.',
  },
  questions: {
    beginner: [
      { en: 'What did you do today?', fr: "Qu'as-tu fait aujourd'hui ?", ar: 'ماذا فعلت اليوم؟' },
      { en: 'How is your day going?', fr: 'Comment se passe ta journée ?', ar: 'كيف يسير يومك؟' },
    ],
    advanced: [
      { en: 'What was the most interesting moment of your day?', fr: 'Quel a été le moment le plus intéressant de ta journée ?', ar: 'ما أكثر لحظة مثيرة للاهتمام في يومك؟' },
      { en: 'What is one small thing you are grateful for today?', fr: "Pour quelle petite chose es-tu reconnaissant aujourd'hui ?", ar: 'ما الشيء الصغير الذي أنت ممتن له اليوم؟' },
    ],
  },
  vocabulary: {
    en: [
      { word: 'today', meaningAr: 'اليوم', phonetic: 'təˈdeɪ' },
      { word: 'grateful', meaningAr: 'ممتن', phonetic: 'ˈɡreɪtfəl' },
    ],
    fr: [
      { word: "aujourd'hui", meaningAr: 'اليوم', phonetic: 'oʒuʁdɥi' },
      { word: 'reconnaissant', meaningAr: 'ممتن', phonetic: 'ʁəkɔnɛsɑ̃' },
    ],
  },
};

const ENGLISH_RULES: CorrectionRule[] = [
  {
    pattern: /\bI am agree\b/i,
    replace: () => 'I agree',
    explanationAr: 'لا نستخدم am مع الفعل agree؛ نقول I agree.',
  },
  {
    pattern: /\bI have (\d{1,2}) years?(?: old)?\b/i,
    replace: (match) => `I am ${match[1]} years old`,
    explanationAr: 'نستخدم am مع العمر، وليس have.',
  },
  {
    pattern: /\bYesterday I go\b/i,
    replace: () => 'Yesterday I went',
    explanationAr: 'مع yesterday نستخدم الماضي went.',
  },
  {
    pattern: /\bI go yesterday\b/i,
    replace: () => 'I went yesterday',
    explanationAr: 'مع yesterday نستخدم الماضي went.',
  },
  {
    pattern: /\b(He|She) go\b/i,
    replace: (match) => `${match[1]} goes`,
    explanationAr: 'مع He وShe نضيف s للفعل في المضارع البسيط.',
  },
  {
    pattern: /\b(He|She) have\b/i,
    replace: (match) => `${match[1]} has`,
    explanationAr: 'مع He وShe نستخدم has.',
  },
  {
    pattern: /\bI didn't went\b/i,
    replace: () => "I didn't go",
    explanationAr: "بعد didn't نستخدم الفعل في المصدر.",
  },
  {
    pattern: /\bI have went\b/i,
    replace: () => 'I have gone',
    explanationAr: 'مع have نستخدم التصريف الثالث gone.',
  },
  {
    pattern: /\bI want go\b/i,
    replace: () => 'I want to go',
    explanationAr: 'بعد want نستخدم to + المصدر.',
  },
  {
    pattern: /\bI like to eating\b/i,
    replace: () => 'I like eating',
    explanationAr: 'بعد like يمكن استخدام eating أو to eat، وليس to eating.',
  },
  {
    pattern: /\bI am boring\b/i,
    replace: () => 'I am bored',
    explanationAr: 'bored تصف شعورك، وboring تصف الشيء.',
  },
  {
    pattern: /\bI am interesting\b/i,
    replace: () => 'I am interested',
    explanationAr: 'interested تصف شعورك، وinteresting تصف الشيء.',
  },
  {
    pattern: /\bHow I can\b/i,
    replace: () => 'How can I',
    explanationAr: 'في السؤال نقدّم can قبل الفاعل.',
  },
  {
    pattern: /\bWhat I should\b/i,
    replace: () => 'What should I',
    explanationAr: 'في السؤال نقدّم should قبل الفاعل.',
  },
  {
    pattern: /\bI am living here since\b/i,
    replace: () => 'I have lived here since',
    explanationAr: 'مع since نستخدم المضارع التام: have lived.',
  },
];

const FRENCH_RULES: CorrectionRule[] = [
  {
    pattern: /\bje suis (\d{1,2}) ans\b/i,
    replace: (match) => `j'ai ${match[1]} ans`,
    explanationAr: "للعمر نستخدم avoir: j'ai 20 ans.",
  },
  {
    pattern: /\bje ai\b/i,
    replace: () => "j'ai",
    explanationAr: "نستخدم j'ai مع حذف e.",
  },
  {
    pattern: /\bje aime\b/i,
    replace: () => "j'aime",
    explanationAr: "نستخدم j'aime مع حذف e.",
  },
  {
    pattern: /\bje habite\b/i,
    replace: () => "j'habite",
    explanationAr: "نستخدم j'habite مع حذف e.",
  },
  {
    pattern: /\bje va\b/i,
    replace: () => 'je vais',
    explanationAr: 'التصريف الصحيح: je vais.',
  },
  {
    pattern: /\bje mange hier\b/i,
    replace: () => "j'ai mangé hier",
    explanationAr: "مع hier نستخدم الماضي المركب: j'ai mangé.",
  },
  {
    pattern: /\bje avoir\b/i,
    replace: () => "j'ai",
    explanationAr: "التصريف الصحيح: j'ai.",
  },
];

const findCorrection = (language: Language, text: string): Correction | null => {
  const rules = language === 'fr' ? FRENCH_RULES : ENGLISH_RULES;
  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    return {
      wrong: match[0],
      correct: rule.replace(match),
      explanationAr: rule.explanationAr,
    };
  }
  return null;
};

const normalizeSpeech = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const levenshtein = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0] as number;
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const saved = previous[rightIndex] as number;
      previous[rightIndex] = Math.min(
        (previous[rightIndex] as number) + 1,
        (previous[rightIndex - 1] as number) + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = saved;
    }
  }
  return previous[right.length] as number;
};

const scorePronunciation = (target: string, spoken: string): number => {
  const normalizedTarget = normalizeSpeech(target);
  const normalizedSpoken = normalizeSpeech(spoken);
  if (!normalizedTarget || !normalizedSpoken) return 70;
  if (normalizedSpoken.includes(normalizedTarget) || normalizedTarget.includes(normalizedSpoken)) {
    return 92;
  }
  const distance = levenshtein(normalizedTarget, normalizedSpoken);
  const similarity = 1 - distance / Math.max(normalizedTarget.length, normalizedSpoken.length);
  return Math.max(38, Math.min(94, Math.round(similarity * 100)));
};

const buildPronunciationReply = (
  input: LocalTutorInput,
  lastUser: string,
): LocalTutorReply => {
  const target = input.target.trim();
  const score = scorePronunciation(target, lastUser);
  const reply = input.language === 'fr'
    ? `Bon essai ! Travaillons le rythme de « ${target} ».`
    : `Good try! Let's work on the rhythm of “${target}”.`;
  const translationAr = input.language === 'fr'
    ? `محاولة جيدة! لنتدرب على إيقاع «${target}».`
    : `محاولة جيدة! لنتدرب على إيقاع «${target}».`;
  const feedbackAr = score >= 85
    ? 'تقدير تقريبي جيد: النطق واضح. حافظ على الإيقاع نفسه.'
    : score >= 65
      ? 'تقدير تقريبي: قريب. ركّز على الحروف الأخيرة والوصل بين الكلمات.'
      : 'تقدير تقريبي: استمع للنموذج ثم أعد المحاولة ببطء.';
  return {
    reply,
    translationAr,
    corrections: [],
    vocabulary: [],
    pronunciation: {
      target,
      score,
      feedbackAr,
      tipAr: 'اقرأ العبارة مقطعًا مقطعًا، ثم أعدها بسرعة طبيعية.',
    },
  };
};

export const buildLocalTutorReply = (input: LocalTutorInput): LocalTutorReply => {
  const lastUser = [...input.messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? '';

  if (input.mode === 'pronunciation') {
    return buildPronunciationReply(input, lastUser);
  }

  const text = normalize(lastUser);
  const topic = matchTopic(text);
  const advanced = isAdvanced(input.level);
  const seed = hashText(lastUser) + input.messages.length * 13;
  const ack = pick(ACKS[detectSentiment(text)][advanced ? 'advanced' : 'beginner'], seed);
  const question = pick(topic.questions[advanced ? 'advanced' : 'beginner'], seed + 3);
  const correction = hasArabic(lastUser) ? null : findCorrection(input.language, lastUser);
  const vocabulary = topic.vocabulary[input.language].slice(0, 2);

  if (hasArabic(lastUser)) {
    const reply = input.language === 'fr'
      ? `Essayons en français : « ${topic.starter.fr} » ${question.fr}`
      : `Let's try that in English: “${topic.starter.en}” ${question.en}`;
    const translationAr = input.language === 'fr'
      ? `لنجرب ذلك بالفرنسية: «${topic.starter.ar}» ${question.ar}`
      : `لنجرب ذلك بالإنجليزية: «${topic.starter.ar}» ${question.ar}`;
    return {
      reply,
      translationAr,
      corrections: [],
      vocabulary,
      pronunciation: null,
    };
  }

  return {
    reply: `${ack[input.language]} ${question[input.language]}`,
    translationAr: `${ack.ar} ${question.ar}`,
    corrections: correction ? [correction] : [],
    vocabulary,
    pronunciation: null,
  };
};
