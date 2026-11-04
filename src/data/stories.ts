export type StorySceneType =
  | 'morning'
  | 'park'
  | 'market'
  | 'travel'
  | 'library'
  | 'office'
  | 'haunted'
  | 'classroom';

export interface StoryParagraph {
  en: string;
  fr: string;
}

export interface EducationalStory {
  id: string;
  titleAr: string;
  titleEn: string;
  titleFr: string;
  level: string;
  /** Curriculum stage (1-4) the story is anchored to on the path. */
  stage: number;
  scene: StorySceneType;
  minutes: number;
  /** Flat text kept for the compact card / listen button. */
  textEn: string;
  textFr: string;
  paragraphs: StoryParagraph[];
  /** Tappable words, keyed by lowercase word, mapped to Arabic meaning. */
  glossary: {
    en: Record<string, string>;
    fr: Record<string, string>;
  };
}

const joinParagraphs = (paragraphs: StoryParagraph[], lang: 'en' | 'fr') =>
  paragraphs.map((paragraph) => paragraph[lang]).join(' ');

const makeStory = (
  story: Omit<EducationalStory, 'textEn' | 'textFr'>,
): EducationalStory => ({
  ...story,
  textEn: joinParagraphs(story.paragraphs, 'en'),
  textFr: joinParagraphs(story.paragraphs, 'fr'),
});

export const EDUCATIONAL_STORIES: EducationalStory[] = [
  makeStory({
    id: 'story-morning-routine',
    titleAr: 'صباح هادئ',
    titleEn: 'A Calm Morning',
    titleFr: 'Un matin calme',
    level: 'A1',
    stage: 1,
    scene: 'morning',
    minutes: 2,
    paragraphs: [
      {
        en: 'Every morning, Sara drinks a glass of water and reviews five words.',
        fr: "Chaque matin, Sara boit un verre d'eau et révise cinq mots.",
      },
      {
        en: 'Then she listens to one short sentence and repeats it slowly.',
        fr: 'Ensuite, elle écoute une courte phrase et la répète lentement.',
      },
      {
        en: 'Small habits build strong language skills.',
        fr: 'Les petites habitudes créent de solides compétences linguistiques.',
      },
    ],
    glossary: {
      en: {
        morning: 'الصباح',
        drinks: 'يشرب',
        water: 'ماء',
        reviews: 'يراجع',
        words: 'كلمات',
        listens: 'يستمع',
        short: 'قصيرة',
        sentence: 'جملة',
        repeats: 'يكرر',
        slowly: 'ببطء',
        habits: 'عادات',
        build: 'تبني',
        skills: 'مهارات',
      },
      fr: {
        matin: 'الصباح',
        boit: 'يشرب',
        verre: 'كأس',
        eau: 'ماء',
        révise: 'يراجع',
        mots: 'كلمات',
        écoute: 'يستمع',
        courte: 'قصيرة',
        phrase: 'جملة',
        répète: 'يكرر',
        lentement: 'ببطء',
        habitudes: 'عادات',
        compétences: 'مهارات',
      },
    },
  }),
  makeStory({
    id: 'story-consistency',
    titleAr: 'الاستمرارية تفوز',
    titleEn: 'Consistency Wins',
    titleFr: 'La régularité gagne',
    level: 'A1',
    stage: 1,
    scene: 'park',
    minutes: 2,
    paragraphs: [
      {
        en: 'Ten minutes every day beats two hours once a week.',
        fr: 'Dix minutes par jour valent mieux que deux heures une fois par semaine.',
      },
      {
        en: 'Your brain remembers patterns through repetition, not pressure.',
        fr: 'Le cerveau retient les schémas par la répétition, pas par la pression.',
      },
      {
        en: 'Choose a time you can keep, and protect it.',
        fr: 'Choisissez un moment que vous pouvez tenir, et protégez-le.',
      },
    ],
    glossary: {
      en: {
        minutes: 'دقائق',
        day: 'يوم',
        beats: 'يتفوق على',
        hours: 'ساعات',
        week: 'أسبوع',
        brain: 'الدماغ',
        remembers: 'يتذكر',
        patterns: 'أنماط',
        repetition: 'التكرار',
        pressure: 'الضغط',
        choose: 'اختر',
        time: 'وقتًا',
        keep: 'تحافظ عليه',
        protect: 'احمِه',
      },
      fr: {
        minutes: 'دقائق',
        jour: 'يوم',
        valent: 'تفوق',
        heures: 'ساعات',
        semaine: 'أسبوع',
        cerveau: 'الدماغ',
        retient: 'يتذكر',
        schémas: 'أنماط',
        répétition: 'التكرار',
        pression: 'الضغط',
        choisissez: 'اختر',
        moment: 'وقتًا',
        tenir: 'تحافظ عليه',
        protégez: 'احمِه',
      },
    },
  }),
  makeStory({
    id: 'story-market',
    titleAr: 'في السوق',
    titleEn: 'At the Market',
    titleFr: 'Au marché',
    level: 'A2',
    stage: 2,
    scene: 'market',
    minutes: 3,
    paragraphs: [
      {
        en: 'Tom walks through the morning market and stops at a fruit stall.',
        fr: "Tom traverse le marché du matin et s'arrête à un étal de fruits.",
      },
      {
        en: '“How much are these apples?” he asks. The seller smiles and gives him a fair price.',
        fr: '« Combien coûtent ces pommes ? » demande-t-il. Le vendeur sourit et lui propose un prix juste.',
      },
      {
        en: 'Tom pays, says thank you, and leaves with a bag full of fruit.',
        fr: 'Tom paie, remercie et repart avec un sac plein de fruits.',
      },
    ],
    glossary: {
      en: {
        walks: 'يمشي',
        market: 'سوق',
        stops: 'يتوقف',
        fruit: 'فاكهة',
        stall: 'بسطة',
        much: 'كم',
        apples: 'تفاح',
        asks: 'يسأل',
        seller: 'البائع',
        smiles: 'يبتسم',
        price: 'سعر',
        pays: 'يدفع',
        leaves: 'يغادر',
        bag: 'حقيبة',
        full: 'ممتلئ',
      },
      fr: {
        traverse: 'يعبر',
        marché: 'سوق',
        arrête: 'يتوقف',
        étal: 'بسطة',
        fruits: 'فاكهة',
        combien: 'كم',
        pommes: 'تفاح',
        demande: 'يسأل',
        vendeur: 'البائع',
        sourit: 'يبتسم',
        prix: 'سعر',
        paie: 'يدفع',
        remercie: 'يشكر',
        repart: 'يغادر',
        sac: 'حقيبة',
      },
    },
  }),
  makeStory({
    id: 'story-travel',
    titleAr: 'رحلة قصيرة',
    titleEn: 'A Short Trip',
    titleFr: 'Un court voyage',
    level: 'A2',
    stage: 2,
    scene: 'travel',
    minutes: 3,
    paragraphs: [
      {
        en: 'During a trip, short phrases help you move with confidence.',
        fr: 'En voyage, les phrases courtes vous aident à avancer avec confiance.',
      },
      {
        en: '“Where is the station?”, “How much is this?”, and “Thank you” open many doors.',
        fr: '« Où est la gare ? », « Combien ça coûte ? » et « Merci » ouvrent bien des portes.',
      },
      {
        en: 'Practice them before you travel, and speak slowly.',
        fr: 'Exercez-les avant de partir, et parlez lentement.',
      },
    ],
    glossary: {
      en: {
        trip: 'رحلة',
        short: 'قصيرة',
        phrases: 'عبارات',
        help: 'تساعد',
        move: 'تتحرك',
        confidence: 'ثقة',
        where: 'أين',
        station: 'محطة',
        much: 'كم',
        thank: 'شكرًا',
        open: 'تفتح',
        doors: 'أبواب',
        practice: 'تدرب',
        travel: 'تسافر',
        speak: 'تتكلم',
        slowly: 'ببطء',
      },
      fr: {
        voyage: 'رحلة',
        phrases: 'عبارات',
        courtes: 'قصيرة',
        aident: 'تساعد',
        avancer: 'تتقدم',
        confiance: 'ثقة',
        gare: 'محطة',
        combien: 'كم',
        coûte: 'يكلف',
        merci: 'شكرًا',
        ouvrent: 'تفتح',
        portes: 'أبواب',
        exercez: 'تدرب',
        partir: 'تسافر',
        parlez: 'تتكلم',
        lentement: 'ببطء',
      },
    },
  }),
  makeStory({
    id: 'story-library',
    titleAr: 'الكتاب المفقود',
    titleEn: 'The Lost Book',
    titleFr: 'Le livre perdu',
    level: 'A2',
    stage: 2,
    scene: 'library',
    minutes: 3,
    paragraphs: [
      {
        en: 'Lina finds an old book under a library table.',
        fr: 'Lina trouve un vieux livre sous une table de bibliothèque.',
      },
      {
        en: 'Its cover is soft with age, and the first page holds a handwritten name.',
        fr: 'Sa couverture est usée par le temps, et la première page porte un nom manuscrit.',
      },
      {
        en: 'She returns it to the librarian, who thanks her and offers her a new story.',
        fr: 'Elle le rend à la bibliothécaire, qui la remercie et lui offre une nouvelle histoire.',
      },
    ],
    glossary: {
      en: {
        finds: 'يجد',
        old: 'قديم',
        book: 'كتاب',
        library: 'مكتبة',
        table: 'طاولة',
        cover: 'غلاف',
        soft: 'ناعم',
        age: 'العمر',
        page: 'صفحة',
        handwritten: 'مكتوب بخط اليد',
        name: 'اسم',
        returns: 'يعيد',
        librarian: 'أمين المكتبة',
        thanks: 'يشكر',
        offers: 'يقدم',
        story: 'قصة',
      },
      fr: {
        trouve: 'يجد',
        vieux: 'قديم',
        livre: 'كتاب',
        bibliothèque: 'مكتبة',
        table: 'طاولة',
        couverture: 'غلاف',
        usée: 'مهترئة',
        temps: 'الوقت',
        première: 'الأولى',
        page: 'صفحة',
        nom: 'اسم',
        manuscrit: 'مكتوب بخط اليد',
        rend: 'يعيد',
        bibliothécaire: 'أمين المكتبة',
        remercie: 'يشكر',
        offre: 'يقدم',
        histoire: 'قصة',
      },
    },
  }),
  makeStory({
    id: 'story-interview',
    titleAr: 'مقابلة عمل',
    titleEn: 'The Job Interview',
    titleFr: "L'entretien d'embauche",
    level: 'B1',
    stage: 3,
    scene: 'office',
    minutes: 3,
    paragraphs: [
      {
        en: 'Maria prepares three clear answers before the interview.',
        fr: "Maria prépare trois réponses claires avant l'entretien.",
      },
      {
        en: 'She speaks slowly, gives one example for each skill, and asks a thoughtful question at the end.',
        fr: 'Elle parle lentement, donne un exemple pour chaque compétence et pose une question réfléchie à la fin.',
      },
      {
        en: 'Confidence grows with practice, not perfection.',
        fr: 'La confiance vient avec la pratique, pas la perfection.',
      },
    ],
    glossary: {
      en: {
        prepares: 'يحضر',
        clear: 'واضحة',
        answers: 'أجوبة',
        interview: 'مقابلة',
        speaks: 'يتكلم',
        slowly: 'ببطء',
        example: 'مثال',
        skill: 'مهارة',
        thoughtful: 'مدروسة',
        question: 'سؤال',
        confidence: 'ثقة',
        grows: 'تنمو',
        practice: 'التدريب',
        perfection: 'الكمال',
      },
      fr: {
        prépare: 'يحضر',
        réponses: 'أجوبة',
        claires: 'واضحة',
        entretien: 'مقابلة',
        parle: 'يتكلم',
        lentement: 'ببطء',
        exemple: 'مثال',
        compétence: 'مهارة',
        pose: 'يطرح',
        réfléchie: 'مدروسة',
        question: 'سؤال',
        confiance: 'ثقة',
        pratique: 'التدريب',
        perfection: 'الكمال',
      },
    },
  }),
  makeStory({
    id: 'story-haunted-house',
    titleAr: 'المنزل المهجور',
    titleEn: 'The Empty House',
    titleFr: 'La maison vide',
    level: 'B1',
    stage: 3,
    scene: 'haunted',
    minutes: 4,
    paragraphs: [
      {
        en: 'Roderick stops in front of the empty house and listens.',
        fr: "Roderick s'arrête devant la maison vide et écoute.",
      },
      {
        en: 'He hears a strange sound behind the door, but he does not believe in ghosts.',
        fr: 'Il entend un bruit étrange derrière la porte, mais il ne croit pas aux fantômes.',
      },
      {
        en: 'Still, his hand shakes as he turns the key.',
        fr: 'Pourtant, sa main tremble lorsqu’il tourne la clé.',
      },
    ],
    glossary: {
      en: {
        stops: 'يتوقف',
        front: 'أمام',
        empty: 'فارغة',
        house: 'منزل',
        listens: 'يستمع',
        hears: 'يسمع',
        strange: 'غريب',
        sound: 'صوت',
        behind: 'خلف',
        door: 'باب',
        believe: 'يؤمن',
        ghosts: 'أشباح',
        hand: 'يد',
        shakes: 'ترتجف',
        turns: 'يدير',
        key: 'مفتاح',
      },
      fr: {
        arrête: 'يتوقف',
        devant: 'أمام',
        maison: 'منزل',
        vide: 'فارغة',
        écoute: 'يستمع',
        entend: 'يسمع',
        bruit: 'صوت',
        étrange: 'غريب',
        derrière: 'خلف',
        porte: 'باب',
        croit: 'يؤمن',
        fantômes: 'أشباح',
        main: 'يد',
        tremble: 'ترتجف',
        tourne: 'يدير',
        clé: 'مفتاح',
      },
    },
  }),
  makeStory({
    id: 'story-feedback',
    titleAr: 'تصحيح لطيف',
    titleEn: 'Gentle Correction',
    titleFr: 'Une correction douce',
    level: 'B2',
    stage: 4,
    scene: 'classroom',
    minutes: 3,
    paragraphs: [
      {
        en: 'A good teacher corrects one mistake at a time and praises real progress.',
        fr: 'Un bon enseignant corrige une erreur à la fois et souligne les progrès réels.',
      },
      {
        en: 'Feedback should guide the learner, not discourage them.',
        fr: "Le retour doit guider l'apprenant, pas le décourager.",
      },
      {
        en: 'When correction feels safe, students speak more freely.',
        fr: 'Quand la correction est rassurante, les élèves parlent plus librement.',
      },
    ],
    glossary: {
      en: {
        teacher: 'معلم',
        corrects: 'يصحح',
        mistake: 'خطأ',
        time: 'مرة',
        praises: 'يمدح',
        real: 'حقيقي',
        progress: 'تقدم',
        feedback: 'ملاحظات',
        guide: 'يوجه',
        learner: 'المتعلم',
        discourage: 'يثبط',
        correction: 'تصحيح',
        safe: 'آمن',
        students: 'الطلاب',
        speak: 'يتحدثون',
        freely: 'بحرية',
      },
      fr: {
        enseignant: 'معلم',
        corrige: 'يصحح',
        erreur: 'خطأ',
        fois: 'مرة',
        souligne: 'يبرز',
        progrès: 'تقدم',
        réels: 'حقيقية',
        retour: 'ملاحظات',
        guider: 'يوجه',
        apprenant: 'المتعلم',
        décourager: 'يثبط',
        correction: 'تصحيح',
        rassurante: 'مطمئنة',
        élèves: 'الطلاب',
        parlent: 'يتحدثون',
        librement: 'بحرية',
      },
    },
  }),
];

export const getStoryById = (id: string | null | undefined) =>
  EDUCATIONAL_STORIES.find((story) => story.id === id) ?? null;

export const getStoriesForStage = (stage: number) =>
  EDUCATIONAL_STORIES.filter((story) => story.stage === stage);
