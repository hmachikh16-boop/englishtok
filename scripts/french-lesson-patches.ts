import type { FrenchLessonPatch } from './french-overrides';

type PatchQuiz = NonNullable<FrenchLessonPatch['quiz']>[number];

const mc = (
  id: string,
  questionAr: string,
  options: string[],
  correctAnswer: string,
  explanationAr: string,
  questionEn?: string,
): PatchQuiz => ({
  id,
  type: 'multiple_choice',
  questionAr,
  ...(questionEn ? { questionEn } : {}),
  options,
  correctAnswer,
  explanationAr,
});

const fill = (
  id: string,
  questionAr: string,
  questionEn: string,
  correctAnswer: string,
  explanationAr: string,
): PatchQuiz => ({
  id,
  type: 'fill_blank',
  questionAr,
  questionEn,
  options: [],
  correctAnswer,
  explanationAr,
});

const arrange = (
  id: string,
  promptAr: string,
  options: string[],
  correctAnswer: string,
  explanationAr: string,
): PatchQuiz => ({
  id,
  type: 'arrange_sentence',
  questionAr: 'رتّب الكلمات لتكوين جملة صحيحة:',
  promptAr,
  options,
  correctAnswer,
  explanationAr,
});

/**
 * Hand-authored French versions of the sixteen foundation lessons plus the
 * nine expansion lessons that teach grammar. Everything else can be derived
 * reliably from the English curriculum.
 */
export const LESSON_PATCHES: Record<string, FrenchLessonPatch> = {
  'a1-l1-alphabet': {
    learningNoteAr:
      'الهدف: التعرّف على الحروف الفرنسية A, B, C, D وأصواتها. البنية: A comme pomme. / B comme ballon. استمع للصوت أولًا ثم اربط الحرف بالكلمة.',
    dialogue: {
      'a1-l1-alphabet-s02': {
        textEn: 'Excellente idée Léo ! A, /a/, pomme !',
        textAr: 'فكرة رائعة يا ليو! A، /a/، تفاحة!',
        highlightWords: ['pomme'],
      },
      'a1-l1-alphabet-s03': {
        textEn: 'A comme pomme. Très bien, Gigi !',
        textAr: 'A مثل تفاحة. أحسنت يا جيجي!',
        highlightWords: ['pomme'],
      },
      'a1-l1-alphabet-s04': {
        textEn: 'B, /b/, ballon ! B comme ballon.',
        textAr: 'B، /b/، كرة! B مثل كرة.',
        highlightWords: ['ballon'],
      },
      'a1-l1-alphabet-s05': {
        textEn: 'C comme chat. Pouvez-vous dire /k/ ?',
        textAr: 'C مثل قطة. هل يمكنك قول /k/؟',
        highlightWords: ['chat'],
      },
      'a1-l1-alphabet-s06': {
        textEn: 'C, /k/, chat ! Et D, /d/, chien !',
        textAr: 'C، /k/، قطة! وD، /d/، كلب!',
        highlightWords: ['chat', 'chien'],
      },
      'a1-l1-alphabet-s07': {
        textEn: 'Merveilleux ! A, B, C, D. Maintenant, essayez !',
        textAr: 'رائع! A، B، C، D. الآن جرّب!',
      },
    },
    vocabulary: {
      'a1-l1-alphabet-v1': {
        word: 'pomme',
        phonetic: '/pɔm/',
        translationAr: 'تفاحة',
        exampleSentence: 'A comme pomme.',
        exampleSentenceAr: 'A مثل تفاحة.',
      },
      'a1-l1-alphabet-v2': {
        word: 'ballon',
        phonetic: '/balɔ̃/',
        translationAr: 'كرة',
        exampleSentence: 'B comme ballon.',
        exampleSentenceAr: 'B مثل كرة.',
      },
      'a1-l1-alphabet-v3': {
        word: 'chat',
        phonetic: '/ʃa/',
        translationAr: 'قطة',
        exampleSentence: 'C comme chat.',
        exampleSentenceAr: 'C مثل قطة.',
      },
      'a1-l1-alphabet-v4': {
        word: 'chien',
        phonetic: '/ʃjɛ̃/',
        translationAr: 'كلب',
        exampleSentence: 'D comme chien.',
        exampleSentenceAr: 'D مثل كلب.',
      },
    },
    quiz: [
      mc(
        'a1-l1-alphabet-q1',
        'أي كلمة تعني «تفاحة»؟',
        ['pomme', 'ballon', 'chat', 'chien'],
        'pomme',
        'pomme تعني «تفاحة». مثال: A comme pomme.',
      ),
      fill(
        'a1-l1-alphabet-q2',
        'أكمل: A comme ___.',
        'A comme ___.',
        'pomme',
        'الإجابة الصحيحة: pomme. A comme pomme.',
      ),
      arrange(
        'a1-l1-alphabet-q3',
        'A مثل تفاحة.',
        ['A', 'comme', 'pomme'],
        'A comme pomme',
        'الترتيب الصحيح: A comme pomme.',
      ),
      mc(
        'a1-l1-alphabet-q4',
        'ما معنى كلمة «chien»؟',
        ['كلب', 'قطة', 'كرة', 'تفاحة'],
        'كلب',
        'chien تعني «كلب». مثال: D comme chien.',
      ),
    ],
  },

  'a1-l33-hot-cold': {
    vocabulary: {
      'a1-l33-hot-cold-v3': {
        word: 'tiède',
        phonetic: '/tjɛd/',
        translationAr: 'دافئ',
        exampleSentence: 'Le pain est encore tiède.',
        exampleSentenceAr: 'الخبز لا يزال دافئًا.',
      },
    },
  },

  'a1-l2-numbers': {
    learningNoteAr:
      'الهدف: العد من 1 إلى 10 والسؤال عن العدد. البنية: Combien de chats ? — Trois chats. استخدم combien de + اسم.',
    dialogue: {
      'a1-l2-numbers-s04': {
        textEn: 'Super comptage ! Combien de chats vois-tu ?',
        textAr: 'عدّ رائع! كم عدد القطط التي تراها؟',
        highlightWords: ['Combien'],
      },
    },
    vocabulary: {
      'a1-l2-numbers-v1': {
        exampleSentence: 'Un chat joue.',
        exampleSentenceAr: 'قطة واحدة تلعب.',
      },
      'a1-l2-numbers-v6': {
        word: 'combien',
        phonetic: '/kɔ̃bjɛ̃/',
        translationAr: 'كم',
        exampleSentence: 'Combien de chats ?',
        exampleSentenceAr: 'كم عدد القطط؟',
        partOfSpeech: 'أداة استفهام',
      },
    },
    quiz: [
      mc(
        'a1-l2-numbers-q1',
        'كيف تسأل عن عدد الأشياء؟',
        ['Combien de... ?', 'Quelle couleur... ?', 'Quel est ton nom ?', 'Où est... ?'],
        'Combien de... ?',
        'نستخدم Combien de + اسم للسؤال عن العدد.',
      ),
      fill(
        'a1-l2-numbers-q2',
        'أكمل: Il y a ___ balles.',
        'Il y a ___ balles.',
        'trois',
        'الإجابة الصحيحة: trois. هناك ثلاث كرات.',
      ),
      arrange(
        'a1-l2-numbers-q3',
        'هناك ثلاث كرات.',
        ['Il', 'y', 'a', 'trois', 'balles'],
        'Il y a trois balles',
        'الترتيب الصحيح: Il y a trois balles.',
      ),
      mc(
        'a1-l2-numbers-q4',
        'ما معنى كلمة «dix»؟',
        ['عشرة', 'خمسة', 'ثلاثة', 'اثنان'],
        'عشرة',
        'dix تعني «عشرة». مثال: Comptons jusqu’à dix.',
      ),
    ],
  },

  'a1-l3-colors': {
    learningNoteAr:
      'الهدف: وصف الأشياء باللون والشكل. البنية: C’est un cercle jaune. / L’herbe est verte. لاحظ مطابقة الصفة للاسم.',
    vocabulary: {
      'a1-l3-colors-v4': {
        exampleSentence: 'L’arbre est vert.',
        exampleSentenceAr: 'الشجرة خضراء.',
      },
    },
    quiz: [
      mc(
        'a1-l3-colors-q1',
        'ما معنى كلمة «vert»؟',
        ['أخضر', 'أحمر', 'أزرق', 'أصفر'],
        'أخضر',
        'vert تعني «أخضر». مثال: L’arbre est vert.',
      ),
      fill(
        'a1-l3-colors-q2',
        'أكمل: C’est ___ cercle jaune.',
        'C’est ___ cercle jaune.',
        'un',
        'الإجابة الصحيحة: un. cercle اسم مذكر، لذلك نستخدم un.',
      ),
      arrange(
        'a1-l3-colors-q3',
        'إنها دائرة صفراء.',
        ['C’est', 'un', 'cercle', 'jaune'],
        'C’est un cercle jaune',
        'الترتيب الصحيح: C’est un cercle jaune.',
      ),
      mc(
        'a1-l3-colors-q4',
        'ما معنى كلمة «carré»؟',
        ['مربع', 'دائرة', 'أحمر', 'أصفر'],
        'مربع',
        'carré تعني «مربع». مثال: C’est un carré rouge.',
      ),
    ],
  },

  'a1-l4-introduction': {
    learningNoteAr:
      'الهدف: التحية وتقديم الاسم والعمر. البنية: Je m’appelle... / J’ai ... ans. / Quel est ton nom ?',
    vocabulary: {
      'a1-l4-introduction-v3': {
        word: 'nom',
        phonetic: '/nɔ̃/',
        translationAr: 'اسم',
        exampleSentence: 'Quel est ton nom ?',
        exampleSentenceAr: 'ما اسمك؟',
      },
      'a1-l4-introduction-v4': {
        word: 'ans',
        phonetic: '/ɑ̃/',
        translationAr: 'سنة (للعمر)',
        exampleSentence: 'J’ai sept ans.',
        exampleSentenceAr: 'عمري سبع سنوات.',
        partOfSpeech: 'اسم (جمع)',
      },
    },
    quiz: [
      mc(
        'a1-l4-introduction-q1',
        'كيف تسأل شخصًا عن اسمه؟',
        ['Quel est ton nom ?', 'Quel âge as-tu ?', 'Combien ?', 'Où est... ?'],
        'Quel est ton nom ?',
        'نقول Quel est ton nom ? للسؤال عن الاسم.',
      ),
      fill(
        'a1-l4-introduction-q2',
        'أكمل: Je ___ Gigi.',
        'Je ___ Gigi.',
        'm’appelle',
        'الإجابة الصحيحة: m’appelle. Je m’appelle Gigi.',
      ),
      arrange(
        'a1-l4-introduction-q3',
        'عمري سبع سنوات.',
        ['J’ai', 'sept', 'ans'],
        'J’ai sept ans',
        'الترتيب الصحيح: J’ai sept ans.',
      ),
      mc(
        'a1-l4-introduction-q4',
        'ما معنى كلمة «au revoir»؟',
        ['إلى اللقاء', 'مرحبًا', 'اسم', 'كم عمرك؟'],
        'إلى اللقاء',
        'au revoir تعني «إلى اللقاء». مثال: Au revoir, Léo !',
      ),
    ],
  },

  'a2-l1-routine': {
    learningNoteAr:
      'الهدف: التحدث عن الروتين اليومي. البنية: Je me réveille à sept heures. / Il se réveille à sept heures. الأفعال الانعكاسية تأخذ ضميرًا: me, te, se, nous, vous, se.',
    vocabulary: {
      'a2-l1-routine-v1': {
        exampleSentence: 'Il faut se réveiller à sept heures.',
        exampleSentenceAr: 'يجب الاستيقاظ في السابعة.',
      },
      'a2-l1-routine-v2': {
        exampleSentence: 'Il faut se brosser les dents tous les matins.',
        exampleSentenceAr: 'يجب تنظيف الأسنان كل صباح.',
      },
      'a2-l1-routine-v4': {
        exampleSentence: 'Je marche généralement jusqu’à l’école.',
        exampleSentenceAr: 'أمشي عادةً إلى المدرسة.',
      },
    },
    quiz: [
      mc(
        'a2-l1-routine-q1',
        'أكمل: Il ___ à sept heures.',
        ['se réveille', 'se réveiller', 'réveillé', 'réveille'],
        'se réveille',
        'مع il نستخدم se + الفعل المصرّف: il se réveille.',
      ),
      fill(
        'a2-l1-routine-q2',
        'أكمل: Je me lève ___ tôt.',
        'Je me lève ___ tôt.',
        'toujours',
        'الإجابة الصحيحة: toujours. أستيقظ دائمًا مبكرًا.',
      ),
      arrange(
        'a2-l1-routine-q3',
        'أنظف أسناني كل يوم.',
        ['Je', 'me', 'brosse', 'les', 'dents', 'tous', 'les', 'jours'],
        'Je me brosse les dents tous les jours',
        'الترتيب الصحيح: Je me brosse les dents tous les jours.',
      ),
      mc(
        'a2-l1-routine-q4',
        'ما معنى كلمة «généralement»؟',
        ['عادةً', 'دائمًا', 'أبدًا', 'أحيانًا'],
        'عادةً',
        'généralement تعني «عادةً». مثال: Je marche généralement jusqu’à l’école.',
      ),
    ],
  },

  'a2-l2-ordering-food': {
    learningNoteAr:
      'الهدف: الطلب بأدب والتعبير عن التفضيلات. البنية: Je voudrais..., s’il vous plaît. / Je préfère X à Y.',
    quiz: [
      mc(
        'a2-l2-ordering-food-q1',
        'كيف تطلب طعامًا بأدب؟',
        [
          'Je voudrais une pizza, s’il vous plaît.',
          'Donne-moi une pizza.',
          'Je pizza.',
          'Ta pizza.',
        ],
        'Je voudrais une pizza, s’il vous plaît.',
        'الطلب المهذب يبدأ بـ Je voudrais... s’il vous plaît.',
      ),
      fill(
        'a2-l2-ordering-food-q2',
        'أكمل: Je ___ de l’eau.',
        'Je ___ de l’eau.',
        'voudrais',
        'الإجابة الصحيحة: voudrais. Je voudrais de l’eau.',
      ),
      arrange(
        'a2-l2-ordering-food-q3',
        'هل يمكنني الحصول على بيتزا بالجبن من فضلك؟',
        ['Puis-je', 'avoir', 'une', 'pizza', 'au', 'fromage', 's’il', 'vous', 'plaît'],
        'Puis-je avoir une pizza au fromage s’il vous plaît',
        'الترتيب الصحيح: Puis-je avoir une pizza au fromage s’il vous plaît.',
      ),
      mc(
        'a2-l2-ordering-food-q4',
        'ما معنى كلمة «délicieux»؟',
        ['لذيذ', 'صحي', 'غالي', 'سريع'],
        'لذيذ',
        'délicieux تعني «لذيذ». مثال: La pizza est délicieuse.',
      ),
    ],
  },

  'b1-l1-past': {
    learningNoteAr:
      'الهدف: سرد أحداث الماضي. البنية: passé composé = avoir/être + participe passé. أمثلة: J’ai joué / Je suis allé.',
    dialogue: {
      'b1-l1-past-s04': {
        highlightWords: ['vu', 'apprécié'],
      },
    },
    vocabulary: {
      'b1-l1-past-v3': {
        exampleSentence: 'Il est allé au parc hier.',
        exampleSentenceAr: 'ذهب إلى الحديقة أمس.',
      },
      'b1-l1-past-v4': {
        word: 'vu',
        phonetic: '/vy/',
        translationAr: 'رأى',
        exampleSentence: 'J’ai vu mes amis.',
        exampleSentenceAr: 'رأيت أصدقائي.',
        partOfSpeech: 'فعل (ماضٍ)',
      },
    },
    quiz: [
      mc(
        'b1-l1-past-q1',
        'ما هو passé composé للفعل aller مع je؟',
        ['je suis allé', 'j’ai allé', 'je vais', 'j’allais'],
        'je suis allé',
        'aller يأخذ être في الماضي المركب: je suis allé.',
      ),
      fill(
        'b1-l1-past-q2',
        'أكمل: J’___ joué au football hier.',
        'J’___ joué au football hier.',
        'ai',
        'الإجابة الصحيحة: ai. J’ai joué au football hier.',
      ),
      arrange(
        'b1-l1-past-q3',
        'ذهبت إلى الحديقة أمس.',
        ['Je', 'suis', 'allé', 'au', 'parc', 'hier'],
        'Je suis allé au parc hier',
        'الترتيب الصحيح: Je suis allé au parc hier.',
      ),
      mc(
        'b1-l1-past-q4',
        'ما معنى كلمة «la semaine dernière»؟',
        ['الأسبوع الماضي', 'غدًا', 'اليوم', 'أمس'],
        'الأسبوع الماضي',
        'la semaine dernière تعني «الأسبوع الماضي».',
      ),
    ],
  },

  'b1-l2-directions': {
    learningNoteAr:
      'الهدف: السؤال عن الاتجاهات. البنية: Où est... ? / Tournez à gauche/droite. / Allez tout droit.',
    vocabulary: {
      'b1-l2-directions-v1': {
        word: 'tourner à gauche',
        exampleSentence: 'Il faut tourner à gauche à la banque.',
        exampleSentenceAr: 'يجب الانعطاف يسارًا عند البنك.',
      },
      'b1-l2-directions-v2': {
        word: 'tourner à droite',
        exampleSentence: 'Il faut tourner à droite après l’école.',
        exampleSentenceAr: 'يجب الانعطاف يمينًا بعد المدرسة.',
      },
    },
    quiz: [
      mc(
        'b1-l2-directions-q1',
        'كيف تسأل عن مكان المكتبة؟',
        [
          'Où est la bibliothèque ?',
          'Combien de bibliothèques ?',
          'Qu’est-ce qu’une bibliothèque ?',
          'Qui est la bibliothèque ?',
        ],
        'Où est la bibliothèque ?',
        'نستخدم Où est... ? للسؤال عن المكان.',
      ),
      fill(
        'b1-l2-directions-q2',
        'أكمل: Allez ___ droit.',
        'Allez ___ droit.',
        'tout',
        'الإجابة الصحيحة: tout. نقول tout droit.',
      ),
      arrange(
        'b1-l2-directions-q3',
        'انعطف يسارًا عند البنك.',
        ['Tournez', 'à', 'gauche', 'à', 'la', 'banque'],
        'Tournez à gauche à la banque',
        'الترتيب الصحيح: Tournez à gauche à la banque.',
      ),
      mc(
        'b1-l2-directions-q4',
        'ما معنى كلمة «Tournez à droite»؟',
        ['انعطف يمينًا', 'انعطف يسارًا', 'أمامك مباشرة', 'عفوًا'],
        'انعطف يمينًا',
        'Tournez à droite تعني «انعطف يمينًا».',
      ),
    ],
  },

  'b2-l1-opinions': {
    learningNoteAr:
      'الهدف: تقديم الرأي والاعتراض بأسلوب متوازن. البنية: À mon avis... / D’un autre côté... / Je suis d’accord...',
    vocabulary: {
      'b2-l1-opinions-v2': {
        exampleSentence: 'Il faut croire fermement au travail d’équipe.',
        exampleSentenceAr: 'يجب الإيمان بقوة بالعمل الجماعي.',
      },
      'b2-l1-opinions-v3': {
        exampleSentence: 'D’autre part, cela coûte plus cher.',
        exampleSentenceAr: 'من ناحية أخرى، هذا يكلف أكثر.',
      },
      'b2-l1-opinions-v4': {
        exampleSentence: 'Je suis en désaccord avec cette idée.',
        exampleSentenceAr: 'أنا أختلف مع هذه الفكرة.',
      },
    },
    quiz: [
      mc(
        'b2-l1-opinions-q1',
        'أي عبارة تُستخدم لتقديم رأي؟',
        ['À mon avis...', 'Combien... ?', 'Tournez à gauche...', 'Je suis allé...'],
        'À mon avis...',
        'À mon avis تُستخدم لتقديم الرأي.',
      ),
      fill(
        'b2-l1-opinions-q2',
        'أكمل: ___ mon avis, l’apprentissage en ligne est efficace.',
        '___ mon avis, l’apprentissage en ligne est efficace.',
        'À',
        'الإجابة الصحيحة: À. نقول À mon avis.',
      ),
      arrange(
        'b2-l1-opinions-q3',
        'أفهم وجهة نظرك لكنني أختلف.',
        ['Je', 'comprends', 'votre', 'point', 'de', 'vue', 'mais', 'je', 'ne', 'suis', 'pas', 'd’accord'],
        'Je comprends votre point de vue mais je ne suis pas d’accord',
        'الترتيب الصحيح: Je comprends votre point de vue mais je ne suis pas d’accord.',
      ),
      mc(
        'b2-l1-opinions-q4',
        'ما معنى كلمة «d’autre part»؟',
        ['من ناحية أخرى', 'من وجهة نظري', 'أعتقد بقوة', 'أتفق'],
        'من ناحية أخرى',
        'd’autre part تعني «من ناحية أخرى».',
      ),
    ],
  },

  'b2-l2-idioms': {
    learningNoteAr:
      'الهدف: استخدام التعبيرات الاصطلاحية في السياق. لا تترجم التعبير حرفيًا؛ احفظ معناه داخل الموقف.',
    dialogue: {
      'b2-l2-idioms-s02': {
        textEn: 'Tu as raison. Arrêtons pour aujourd’hui.',
        textAr: 'معك حق. لننهِ العمل لهذا اليوم.',
        highlightWords: ['arrêter pour aujourd’hui'],
      },
      'b2-l2-idioms-s03': {
        textEn: 'Avant de partir, pouvez-vous comprendre le dernier rapport ?',
        textAr: 'قبل أن نذهب، هل يمكنك فهم التقرير الأخير؟',
        highlightWords: ['comprendre'],
      },
      'b2-l2-idioms-s05': {
        textEn: 'Super ! Bonne chance pour votre présentation demain.',
        textAr: 'رائع! حظًا موفقًا في عرضك غدًا.',
        highlightWords: ['bonne chance'],
      },
    },
    vocabulary: {
      'b2-l2-idioms-v1': {
        exampleSentence: 'Bonne chance pour votre entretien !',
        exampleSentenceAr: 'حظًا موفقًا في مقابلتك!',
      },
      'b2-l2-idioms-v2': {
        exampleSentence: 'Il est temps d’arrêter pour aujourd’hui.',
        exampleSentenceAr: 'حان وقت التوقف لهذا اليوم.',
      },
      'b2-l2-idioms-v3': {
        translationAr: 'يفهم',
        exampleSentence: 'Pouvez-vous comprendre le problème ?',
        exampleSentenceAr: 'هل يمكنك فهم المشكلة؟',
      },
      'b2-l2-idioms-v5': {
        exampleSentence: '« Poser un lapin » est un idiome courant.',
        exampleSentenceAr: '« إعطاء موعد وعدم الحضور » تعبير اصطلاحي شائع.',
      },
    },
    quiz: [
      mc(
        'b2-l2-idioms-q1',
        'بعد عمل طويل، ماذا تقول لإنهاء اليوم؟',
        ['Arrêtons pour aujourd’hui.', 'Bonne chance !', 'Continuez.', 'Compris.'],
        'Arrêtons pour aujourd’hui.',
        'arrêter pour aujourd’hui تعني إنهاء العمل لهذا اليوم.',
      ),
      fill(
        'b2-l2-idioms-q2',
        'أكمل: Nous devons ___ le problème.',
        'Nous devons ___ le problème.',
        'comprendre',
        'الإجابة الصحيحة: comprendre. يجب أن نفهم المشكلة.',
      ),
      arrange(
        'b2-l2-idioms-q3',
        'لننهِ العمل لهذا اليوم.',
        ['Arrêtons', 'pour', 'aujourd’hui'],
        'Arrêtons pour aujourd’hui',
        'الترتيب الصحيح: Arrêtons pour aujourd’hui.',
      ),
      mc(
        'b2-l2-idioms-q4',
        'ما معنى كلمة «bonne chance»؟',
        ['حظًا موفقًا', 'اكسر ساقك', 'توقف', 'واصل'],
        'حظًا موفقًا',
        'bonne chance تعني «حظًا موفقًا».',
      ),
    ],
  },

  'b2-l3-conditionals': {
    learningNoteAr:
      'الهدف: التعبير عن الافتراض والندم. البنية: Si + plus-que-parfait → conditionnel passé. / à condition que + subjonctif. / sauf si + présent.',
    dialogue: {
      'b2-l3-conditionals-s01': {
        highlightWords: ['aurais'],
      },
      'b2-l3-conditionals-s02': {
        highlightWords: ['regrettes'],
      },
      'b2-l3-conditionals-s05': {
        highlightWords: ['à moins que'],
      },
    },
    vocabulary: {
      'b2-l3-conditionals-v2': {
        exampleSentence: 'Nous y irons sauf si la pluie tombe.',
        exampleSentenceAr: 'سنذهب ما لم تسقط الأمطار.',
      },
      'b2-l3-conditionals-v3': {
        exampleSentence: 'Vous pouvez y aller, à condition que vous finissiez.',
        exampleSentenceAr: 'يمكنك الذهاب بشرط أن تنهي.',
      },
      'b2-l3-conditionals-v4': {
        word: 'regretter',
        phonetic: '/ʁəɡʁɛte/',
        translationAr: 'يندم',
        exampleSentence: 'Je regrette de ne pas avoir étudié davantage.',
        exampleSentenceAr: 'أندم على عدم الدراسة أكثر.',
        partOfSpeech: 'فعل',
      },
      'b2-l3-conditionals-v5': {
        word: 'conditionnel',
        translationAr: 'صيغة الشرط',
        exampleSentence: 'Le conditionnel exprime une hypothèse.',
        exampleSentenceAr: 'صيغة الشرط تعبّر عن الافتراض.',
        partOfSpeech: 'اسم',
      },
    },
    quiz: [
      mc(
        'b2-l3-conditionals-q1',
        'أكمل الشرط الثالث: Si j’avais étudié, j’___ réussi.',
        ['aurais', 'avais', 'ai', 'serais'],
        'aurais',
        'الشرط الثالث: Si + plus-que-parfait → conditionnel passé: j’aurais réussi.',
      ),
      fill(
        'b2-l3-conditionals-q2',
        'أكمل: Nous y irons ___ la pluie tombe.',
        'Nous y irons ___ la pluie tombe.',
        'sauf si',
        'الإجابة الصحيحة: sauf si. سنذهب ما لم تسقط الأمطار.',
      ),
      arrange(
        'b2-l3-conditionals-q3',
        'لو درست بجدية أكبر لنجحت.',
        ['Si', 'j’avais', 'étudié', 'plus', 'dur', 'j’aurais', 'réussi'],
        'Si j’avais étudié plus dur j’aurais réussi',
        'الترتيب الصحيح: Si j’avais étudié plus dur, j’aurais réussi.',
      ),
      mc(
        'b2-l3-conditionals-q4',
        'ما معنى كلمة «regretter»؟',
        ['يندم', 'يفرح', 'يواصل', 'يقرر'],
        'يندم',
        'regretter تعني «يندم».',
      ),
    ],
  },

  'b2-l4-environment': {
    learningNoteAr:
      'الهدف: مناقشة التقنية والبيئة. البنية: المبني للمجهول: être + participe passé. مثال: Les énergies doivent être mises en œuvre.',
    vocabulary: {
      'b2-l4-environment-v2': {
        word: 'durabilité',
        phonetic: '/dyʁabilite/',
        translationAr: 'الاستدامة',
        exampleSentence: 'La durabilité guide nos plans à long terme.',
        exampleSentenceAr: 'الاستدامة توجه خططنا طويلة المدى.',
      },
    },
    quiz: [
      mc(
        'b2-l4-environment-q1',
        'أكمل المبني للمجهول: Les énergies renouvelables doivent ___ en œuvre.',
        ['être mises', 'mettre', 'mis', 'mises'],
        'être mises',
        'بعد doivent نستخدم être + participe passé، مع مطابقة الجمع المؤنث: être mises.',
      ),
      fill(
        'b2-l4-environment-q2',
        'أكمل: La technologie a un ___ important sur la société.',
        'La technologie a un ___ important sur la société.',
        'impact',
        'الإجابة الصحيحة: impact. للتكنولوجيا تأثير كبير على المجتمع.',
      ),
      arrange(
        'b2-l4-environment-q3',
        'يجب تطبيق الطاقة المتجددة عالميًا.',
        ['Les', 'énergies', 'renouvelables', 'doivent', 'être', 'mises', 'en', 'œuvre', 'dans', 'le', 'monde', 'entier'],
        'Les énergies renouvelables doivent être mises en œuvre dans le monde entier',
        'الترتيب الصحيح: Les énergies renouvelables doivent être mises en œuvre dans le monde entier.',
      ),
      mc(
        'b2-l4-environment-q4',
        'ما معنى كلمة «durabilité»؟',
        ['الاستدامة', 'البصمة الكربونية', 'الذكاء الاصطناعي', 'التأثير'],
        'الاستدامة',
        'durabilité تعني «الاستدامة».',
      ),
    ],
  },

  'c1-l1-negotiation': {
    learningNoteAr:
      'الهدف: التفاوض والتواصل المهني بلغة دبلوماسية. البنية: Nous apprécions... ; cependant... / Il faudra peut-être... / Nous visons un scénario gagnant-gagnant.',
    vocabulary: {
      'c1-l1-negotiation-v2': {
        exampleSentence: 'Nous avons utilisé notre effet de levier dans la transaction.',
        exampleSentenceAr: 'استخدمنا نفوذنا في الصفقة.',
      },
    },
    quiz: [
      mc(
        'c1-l1-negotiation-q1',
        'أي عبارة تُستخدم للتحفّظ الدبلوماسي؟',
        [
          'Il faudra peut-être s’adapter...',
          'Nous allons le faire maintenant.',
          'C’est impossible.',
          'Vous avez tort.',
        ],
        'Il faudra peut-être s’adapter...',
        'peut-être تلطّف الطلب وتترك مجالًا للتفاوض.',
      ),
      fill(
        'c1-l1-negotiation-q2',
        'أكمل: Nous apprécions votre offre ; ___, nous pourrions avoir besoin de plus de temps.',
        'Nous apprécions votre offre ; ___, nous pourrions avoir besoin de plus de temps.',
        'cependant',
        'الإجابة الصحيحة: cependant. نقدّر عرضكم؛ ومع ذلك قد نحتاج وقتًا أطول.',
      ),
      arrange(
        'c1-l1-negotiation-q3',
        'يبدو ذلك معقولًا إذا حافظنا على الميزانية.',
        ['Cela', 'semble', 'raisonnable', 'si', 'nous', 'maintenons', 'le', 'budget'],
        'Cela semble raisonnable si nous maintenons le budget',
        'الترتيب الصحيح: Cela semble raisonnable si nous maintenons le budget.',
      ),
      mc(
        'c1-l1-negotiation-q4',
        'ما معنى كلمة «parties prenantes»؟',
        ['أصحاب المصلحة', 'الميزانية', 'العرض', 'التفاوض'],
        'أصحاب المصلحة',
        'parties prenantes تعني «أصحاب المصلحة».',
      ),
    ],
  },

  'c1-l2-academic': {
    learningNoteAr:
      'الهدف: التحليل والكتابة الأكاديمية. البنية: en outre / par conséquent / en revanche. اربط الفكرة بالدليل ثم بالنتيجة.',
    vocabulary: {
      'c1-l2-academic-v1': {
        exampleSentence: 'En outre, l’échantillon était petit.',
        exampleSentenceAr: 'علاوة على ذلك، كانت العينة صغيرة.',
      },
    },
    quiz: [
      mc(
        'c1-l2-academic-q1',
        'أي رابط يُستخدم للنتيجة؟',
        ['par conséquent', 'en outre', 'en revanche', 'hypothèse'],
        'par conséquent',
        'par conséquent تعني «وبالتالي» وتقدّم النتيجة.',
      ),
      fill(
        'c1-l2-academic-q2',
        'أكمل: Une ___ empirique soutient cette affirmation.',
        'Une ___ empirique soutient cette affirmation.',
        'preuve',
        'الإجابة الصحيحة: preuve. دليل تجريبي يدعم هذا الادعاء.',
      ),
      arrange(
        'c1-l2-academic-q3',
        'تشير الأدلة إلى ارتباط مباشر.',
        ['Les', 'preuves', 'suggèrent', 'une', 'corrélation', 'directe'],
        'Les preuves suggèrent une corrélation directe',
        'الترتيب الصحيح: Les preuves suggèrent une corrélation directe.',
      ),
      mc(
        'c1-l2-academic-q4',
        'ما معنى كلمة «hypothèse»؟',
        ['فرضية', 'دليل', 'نتيجة', 'منهجية'],
        'فرضية',
        'hypothèse تعني «فرضية».',
      ),
    ],
  },

  'c1-l3-nuance': {
    learningNoteAr:
      'الهدف: فهم السخرية والتلميحات والتراكيب المعكوسة. البنية: Rarement avons-nous rencontré... / Le sous-texte révèle...',
    quiz: [
      mc(
        'c1-l3-nuance-q1',
        'أكمل التركيب المعكوس: Rarement ___ un problème aussi complexe.',
        ['avons-nous rencontré', 'nous avons rencontré', 'rencontrons-nous', 'nous rencontrons'],
        'avons-nous rencontré',
        'بعد Rarement نستخدم قلب الفعل والضمير: Rarement avons-nous rencontré...',
      ),
      fill(
        'c1-l3-nuance-q2',
        'أكمل: Le ___ était plus clair que les mots.',
        'Le ___ était plus clair que les mots.',
        'sous-texte',
        'الإجابة الصحيحة: sous-texte. كان المعنى الضمني أوضح من الكلمات.',
      ),
      arrange(
        'c1-l3-nuance-q3',
        'نادرًا ما نصادف مشكلة بهذا التعقيد.',
        ['Rarement', 'avons-nous', 'rencontré', 'un', 'problème', 'aussi', 'complexe'],
        'Rarement avons-nous rencontré un problème aussi complexe',
        'الترتيب الصحيح: Rarement avons-nous rencontré un problème aussi complexe.',
      ),
      mc(
        'c1-l3-nuance-q4',
        'ما معنى كلمة «nuance»؟',
        ['فرق دقيق', 'سخرية', 'غموض', 'معنى ضمني'],
        'فرق دقيق',
        'nuance تعني «فرق دقيق».',
      ),
    ],
  },

  'c1-l4-speech': {
    learningNoteAr:
      'الهدف: الخطابة والإقناع. البنية: السؤال البلاغي + قاعدة الثلاثة + دعوة واضحة إلى العمل.',
    dialogue: {
      'c1-l4-speech-s01': {
        textEn:
          'Demandez-vous : si ce n’est pas nous, qui ? Si ce n’est pas maintenant, quand ?',
        textAr: 'اسألوا أنفسكم: إن لم نكن نحن، فمن؟ وإن لم يكن الآن، فمتى؟',
        highlightWords: ['si ce n’est pas nous'],
      },
      'c1-l4-speech-s02': {
        textEn: 'Nous devons agir avec précision, passion et détermination.',
        textAr: 'يجب أن نتصرف بدقة وشغف وعزيمة.',
        highlightWords: ['précision', 'passion', 'détermination'],
      },
      'c1-l4-speech-s03': {
        highlightWords: ['persuasif'],
      },
      'c1-l4-speech-s04': {
        textEn: 'Et cela doit correspondre aux valeurs du public.',
        textAr: 'ويجب أن يتوافق مع قيم الجمهور.',
        highlightWords: ['correspondre'],
      },
      'c1-l4-speech-s05': {
        highlightWords: ['captiver'],
      },
    },
    vocabulary: {
      'c1-l4-speech-v1': {
        exampleSentence: 'Elle a prononcé un discours persuasif.',
        exampleSentenceAr: 'ألقت خطابًا مقنعًا.',
      },
      'c1-l4-speech-v3': {
        word: 'articulé',
        translationAr: 'فصيح وواضح',
        exampleSentence: 'C’est un orateur articulé.',
        exampleSentenceAr: 'هو متحدث فصيح.',
        partOfSpeech: 'صفة',
      },
    },
    quiz: [
      mc(
        'c1-l4-speech-q1',
        'أكمل السؤال البلاغي: Si ce n’est pas nous, ___ ?',
        ['qui', 'que', 'où', 'quand'],
        'qui',
        'السؤال البلاغي: Si ce n’est pas nous, qui ?',
      ),
      fill(
        'c1-l4-speech-q2',
        'أكمل: Nous devons agir avec précision, passion et ___.',
        'Nous devons agir avec précision, passion et ___.',
        'détermination',
        'الإجابة الصحيحة: détermination. يجب أن نتصرف بدقة وشغف وعزيمة.',
      ),
      arrange(
        'c1-l4-speech-q3',
        'إن لم نكن نحن، فمن سيفعل؟',
        ['Si', 'ce', 'n’est', 'pas', 'nous', 'qui', 'le', 'fera'],
        'Si ce n’est pas nous qui le fera',
        'الترتيب الصحيح: Si ce n’est pas nous qui le fera.',
      ),
      mc(
        'c1-l4-speech-q4',
        'ما معنى كلمة «captiver»؟',
        ['يأسر', 'يقنع', 'يتحدث', 'يكرر'],
        'يأسر',
        'captiver تعني «يأسر».',
      ),
    ],
  },

  'a2-l5-future-plans': {
    learningNoteAr:
      'الهدف: التحدث عن الخطط المستقبلية. البنية: aller + مصدر (futur proche): Je vais rendre visite à mon cousin.',
    vocabulary: {
      'a2-l5-future-plans-v1': {
        word: 'aller',
        translationAr: 'سوف / يذهب',
        exampleSentence: 'Je vais rendre visite à mon cousin samedi.',
        exampleSentenceAr: 'سأزور ابن عمي يوم السبت.',
        partOfSpeech: 'فعل',
      },
    },
    quiz: [
      mc(
        'a2-l5-future-plans-q1',
        'ما معنى «aller» في «Je vais partir»؟',
        ['سوف', 'غدًا', 'خطة', 'عطلة'],
        'سوف',
        'aller + مصدر يعبّر عن المستقبل القريب: Je vais partir.',
      ),
      fill(
        'a2-l5-future-plans-q2',
        'أكمل: Avez-vous un ___ pour dimanche ?',
        'Avez-vous un ___ pour dimanche ?',
        'plan',
        'الإجابة الصحيحة: plan. هل لديك خطة ليوم الأحد؟',
      ),
      arrange(
        'a2-l5-future-plans-q3',
        'سأزور ابن عمي.',
        ['Je', 'vais', 'rendre', 'visite', 'à', 'mon', 'cousin'],
        'Je vais rendre visite à mon cousin',
        'الترتيب الصحيح: Je vais rendre visite à mon cousin.',
      ),
      mc(
        'a2-l5-future-plans-q4',
        'أي كلمة تعني «عطلة نهاية الأسبوع»؟',
        ['week-end', 'aller', 'plan', 'demain'],
        'week-end',
        'week-end تعني «عطلة نهاية الأسبوع».',
      ),
    ],
  },

  'a2-l6-present-continuous': {
    title: 'Présent continu',
    learningNoteAr:
      'الهدف: وصف فعل يحدث الآن. البنية: être en train de + مصدر، أو المضارع: Je suis en train de travailler / Je travaille.',
    dialogue: {
      'a2-l6-present-continuous-s02': { highlightWords: ['travaille'] },
      'a2-l6-present-continuous-s03': { highlightWords: ['pleut'] },
      'a2-l6-present-continuous-s04': { highlightWords: ['écoute'] },
      'a2-l6-present-continuous-s05': { highlightWords: ['porte'] },
    },
    vocabulary: {
      'a2-l6-present-continuous-v1': {
        word: 'travailler',
        phonetic: '/tʁavaje/',
        translationAr: 'يعمل',
        exampleSentence: 'Je travaille sur un rapport pour mon manager.',
        exampleSentenceAr: 'أنا أعمل على تقرير لمديري.',
        partOfSpeech: 'فعل',
      },
      'a2-l6-present-continuous-v2': {
        word: 'pleuvoir',
        phonetic: '/pløvwaʁ/',
        translationAr: 'تمطر',
        exampleSentence: 'Il pleut dehors, alors prenez votre parapluie.',
        exampleSentenceAr: 'إنها تمطر في الخارج، لذا خذ مظلتك.',
        partOfSpeech: 'فعل',
      },
      'a2-l6-present-continuous-v3': {
        word: 'écouter',
        phonetic: '/ekute/',
        translationAr: 'يستمع',
        exampleSentence: 'J’écoute la météo maintenant.',
        exampleSentenceAr: 'أنا أستمع إلى نشرة الطقس الآن.',
        partOfSpeech: 'فعل',
      },
      'a2-l6-present-continuous-v4': {
        word: 'porter',
        phonetic: '/pɔʁte/',
        translationAr: 'يرتدي',
        exampleSentence: 'Ma sœur porte un manteau chaud aujourd’hui.',
        exampleSentenceAr: 'أختي ترتدي معطفًا دافئًا اليوم.',
        partOfSpeech: 'فعل',
      },
    },
    quiz: [
      mc(
        'a2-l6-present-continuous-q1',
        'ما معنى «travailler»؟',
        ['يعمل', 'يستمع', 'يرتدي', 'تمطر'],
        'يعمل',
        'travailler تعني «يعمل».',
      ),
      fill(
        'a2-l6-present-continuous-q2',
        'أكمل: Il ___ dehors, alors prenez votre parapluie.',
        'Il ___ dehors, alors prenez votre parapluie.',
        'pleut',
        'الإجابة الصحيحة: pleut. إنها تمطر في الخارج.',
      ),
      arrange(
        'a2-l6-present-continuous-q3',
        'أنا أعمل على تقرير الآن.',
        ['Je', 'suis', 'en', 'train', 'de', 'travailler', 'sur', 'un', 'rapport'],
        'Je suis en train de travailler sur un rapport',
        'الترتيب الصحيح: Je suis en train de travailler sur un rapport.',
      ),
      mc(
        'a2-l6-present-continuous-q4',
        'أي كلمة تعني «يرتدي»؟',
        ['porter', 'travailler', 'pleuvoir', 'écouter'],
        'porter',
        'porter تعني «يرتدي».',
      ),
    ],
  },

  'a2-l7-comparatives-superlatives': {
    learningNoteAr:
      'الهدف: المقارنة والتفضيل. البنية: plus/moins/aussi + صفة + que. / le/la/les plus + صفة.',
    vocabulary: {
      'a2-l7-comparatives-superlatives-v4': {
        word: 'plus grand',
        translationAr: 'أكبر',
        exampleSentence: 'Oui, et son écran est plus grand.',
        exampleSentenceAr: 'نعم، وشاشته أكبر.',
        partOfSpeech: 'صفة (مقارنة)',
      },
    },
    quiz: [
      mc(
        'a2-l7-comparatives-superlatives-q1',
        'ما معنى كلمة «moins cher»؟',
        ['أرخص', 'الأفضل', 'أكبر', 'أغلى'],
        'أرخص',
        'moins cher تعني «أرخص».',
      ),
      fill(
        'a2-l7-comparatives-superlatives-q2',
        'أكمل: Le noir est ___ que le blanc.',
        'Le noir est ___ que le blanc.',
        'plus cher',
        'الإجابة الصحيحة: plus cher. الأسود أغلى من الأبيض.',
      ),
      arrange(
        'a2-l7-comparatives-superlatives-q3',
        'هذا الهاتف أرخص من ذلك.',
        ['Ce', 'téléphone', 'est', 'moins', 'cher', 'que', 'celui-là'],
        'Ce téléphone est moins cher que celui-là',
        'الترتيب الصحيح: Ce téléphone est moins cher que celui-là.',
      ),
      mc(
        'a2-l7-comparatives-superlatives-q4',
        'أي كلمة تعني «أكبر»؟',
        ['plus grand', 'moins cher', 'plus cher', 'le meilleur'],
        'plus grand',
        'plus grand تعني «أكبر».',
      ),
    ],
  },

  'a2-l8-modals': {
    learningNoteAr:
      'الهدف: استخدام pouvoir وdevoir للتعبير عن القدرة والطلب والالتزام. البنية: Je peux... / Pourriez-vous... ? / Je dois... / Vous devriez...',
    dialogue: {
      'a2-l8-modals-s02': { highlightWords: ['peux'] },
      'a2-l8-modals-s03': { highlightWords: ['Pourriez'] },
      'a2-l8-modals-s04': { highlightWords: ['dois'] },
      'a2-l8-modals-s05': { highlightWords: ['devriez'] },
    },
    quiz: [
      mc(
        'a2-l8-modals-q1',
        'ما معنى كلمة «peut»؟',
        ['يستطيع', 'ينبغي', 'هل يمكنك', 'يجب'],
        'يستطيع',
        'peut تعني «يستطيع».',
      ),
      fill(
        'a2-l8-modals-q2',
        'أكمل: Je ___ partir à quatre heures.',
        'Je ___ partir à quatre heures.',
        'dois',
        'الإجابة الصحيحة: dois. يجب أن أغادر في الرابعة.',
      ),
      arrange(
        'a2-l8-modals-q3',
        'هل يمكنك مساعدتي في هذا التقرير؟',
        ['Pourriez-vous', 'm’aider', 'avec', 'ce', 'rapport'],
        'Pourriez-vous m’aider avec ce rapport',
        'الترتيب الصحيح: Pourriez-vous m’aider avec ce rapport ?',
      ),
      mc(
        'a2-l8-modals-q4',
        'أي كلمة تعني «ينبغي»؟',
        ['devrait', 'doit', 'peut', 'pourrait'],
        'devrait',
        'devrait تعني «ينبغي».',
      ),
    ],
  },

  'a2-l40-giving-advice': {
    learningNoteAr:
      'الهدف: تقديم النصيحة. البنية: Vous devriez + مصدر. / Il vaut mieux + مصدر. / Je suggère...',
    vocabulary: {
      'a2-l40-giving-advice-v3': {
        word: 'il vaut mieux',
        translationAr: 'من الأفضل أن',
        exampleSentence: 'Il vaut mieux en parler à votre manager aujourd’hui.',
        exampleSentenceAr: 'من الأفضل أن تتحدث إلى مديرك اليوم.',
        partOfSpeech: 'تعبير',
      },
      'a2-l40-giving-advice-v4': {
        exampleSentence: 'Je suggère une courte réunion demain matin.',
        exampleSentenceAr: 'أقترح اجتماعًا قصيرًا صباح الغد.',
      },
    },
    quiz: [
      mc(
        'a2-l40-giving-advice-q1',
        'ما معنى كلمة «devrait»؟',
        ['ينبغي', 'من الأفضل أن', 'يقترح', 'نصيحة'],
        'ينبغي',
        'devrait تعني «ينبغي».',
      ),
      fill(
        'a2-l40-giving-advice-q2',
        'أكمل: C’est un ___ très utile.',
        'C’est un ___ très utile.',
        'conseil',
        'الإجابة الصحيحة: conseil. هذه نصيحة مفيدة جدًا.',
      ),
      arrange(
        'a2-l40-giving-advice-q3',
        'ينبغي أن تتحدث إلى مديرك بشأن ذلك.',
        ['Vous', 'devriez', 'en', 'parler', 'à', 'votre', 'manager'],
        'Vous devriez en parler à votre manager',
        'الترتيب الصحيح: Vous devriez en parler à votre manager.',
      ),
      mc(
        'a2-l40-giving-advice-q4',
        'أي كلمة تعني «يقترح»؟',
        ['suggérer', 'devrait', 'conseil', 'il vaut mieux'],
        'suggérer',
        'suggérer تعني «يقترح».',
      ),
    ],
  },

  'a2-l41-making-suggestions': {
    learningNoteAr:
      'الهدف: تقديم الاقتراحات. البنية: Et si + imparfait ? / Pourquoi ne pas + مصدر ? / On pourrait...',
    vocabulary: {
      'a2-l41-making-suggestions-v2': {
        exampleSentence: 'Pourquoi ne pas nous retrouver devant le centre commercial à sept heures ?',
        exampleSentenceAr: 'لمَ لا نلتقي أمام المركز التجاري في السابعة؟',
      },
    },
    quiz: [
      mc(
        'a2-l41-making-suggestions-q1',
        'ما معنى كلمة «Et si»؟',
        ['ما رأيك في', 'يبدو جيدًا', 'لمَ لا', 'ربما'],
        'ما رأيك في',
        'Et si تُستخدم لتقديم اقتراح.',
      ),
      fill(
        'a2-l41-making-suggestions-q2',
        'أكمل: ___ on allait au cinéma ce soir ?',
        '___ on allait au cinéma ce soir ?',
        'Et si',
        'الإجابة الصحيحة: Et si. ما رأيك بالذهاب إلى السينما الليلة؟',
      ),
      arrange(
        'a2-l41-making-suggestions-q3',
        'ما رأيك بالذهاب إلى السينما الليلة؟',
        ['Et', 'si', 'on', 'allait', 'au', 'cinéma', 'ce', 'soir'],
        'Et si on allait au cinéma ce soir',
        'الترتيب الصحيح: Et si on allait au cinéma ce soir ?',
      ),
      mc(
        'a2-l41-making-suggestions-q4',
        'أي كلمة تعني «يبدو جيدًا»؟',
        ['ça a l’air bien', 'peut-être', 'Et si', 'pourquoi ne pas'],
        'ça a l’air bien',
        'ça a l’air bien تعني «يبدو جيدًا».',
      ),
    ],
  },

  'a2-l44-past-experiences': {
    learningNoteAr:
      'الهدف: التحدث عن الخبرات. البنية: passé composé + déjà / jamais / encore. مثال: Je n’ai jamais essayé.',
    vocabulary: {
      'a2-l44-past-experiences-v1': {
        word: 'être allé',
        translationAr: 'زرت / ذهبت',
        exampleSentence: 'Je suis allé en Turquie deux fois.',
        exampleSentenceAr: 'زرت تركيا مرتين.',
        partOfSpeech: 'تعبير',
      },
      'a2-l44-past-experiences-v4': {
        word: 'encore',
        translationAr: 'بعد / مرة أخرى',
        exampleSentence: 'Je n’ai pas encore fait mes valises.',
        exampleSentenceAr: 'لم أحزم حقائبي بعد.',
      },
    },
    quiz: [
      mc(
        'a2-l44-past-experiences-q1',
        'ما معنى «être allé»؟',
        ['زرت / ذهبت', 'بعد', 'لم يسبق', 'بالفعل'],
        'زرت / ذهبت',
        'être allé تعني «ذهبت/زرت».',
      ),
      fill(
        'a2-l44-past-experiences-q2',
        'أكمل: Je n’ai ___ essayé la cuisine japonaise.',
        'Je n’ai ___ essayé la cuisine japonaise.',
        'jamais',
        'الإجابة الصحيحة: jamais. لم أجرب الطعام الياباني من قبل.',
      ),
      arrange(
        'a2-l44-past-experiences-q3',
        'لم أجرب الطعام الياباني من قبل.',
        ['Je', 'n’ai', 'jamais', 'essayé', 'la', 'cuisine', 'japonaise'],
        'Je n’ai jamais essayé la cuisine japonaise',
        'الترتيب الصحيح: Je n’ai jamais essayé la cuisine japonaise.',
      ),
      mc(
        'a2-l44-past-experiences-q4',
        'أي كلمة تعني «بعد»؟',
        ['encore', 'déjà', 'jamais', 'être allé'],
        'encore',
        'encore تعني «بعد» في النفي: pas encore.',
      ),
    ],
  },

  'a2-l45-future-predictions': {
    learningNoteAr:
      'الهدف: التعبير عن التوقعات. البنية: futur simple (travailleront) / conditionnel (pourraient).',
    vocabulary: {
      'a2-l45-future-predictions-v1': {
        word: 'futur simple',
        phonetic: '/fytyʁ sɛ̃pl/',
        translationAr: 'المستقبل البسيط',
        exampleSentence: 'Le futur simple exprime des prédictions.',
        exampleSentenceAr: 'المستقبل البسيط يعبّر عن التوقعات.',
        partOfSpeech: 'اسم',
      },
    },
    quiz: [
      mc(
        'a2-l45-future-predictions-q1',
        'ما معنى كلمة «futur»؟',
        ['المستقبل', 'قد', 'يتوقع', 'على الأرجح'],
        'المستقبل',
        'futur تعني «المستقبل».',
      ),
      fill(
        'a2-l45-future-predictions-q2',
        'أكمل: Les voitures ___ voler, mais je n’en suis pas sûr.',
        'Les voitures ___ voler, mais je n’en suis pas sûr.',
        'pourraient',
        'الإجابة الصحيحة: pourraient. قد تطير السيارات، لكنني لست متأكدًا.',
      ),
      arrange(
        'a2-l45-future-predictions-q3',
        'أعتقد أنها ستمطر غدًا.',
        ['Je', 'pense', 'qu’il', 'va', 'pleuvoir', 'demain'],
        'Je pense qu’il va pleuvoir demain',
        'الترتيب الصحيح: Je pense qu’il va pleuvoir demain.',
      ),
      mc(
        'a2-l45-future-predictions-q4',
        'أي كلمة تعني «على الأرجح»؟',
        ['probablement', 'futur', 'pourrait', 'prédire'],
        'probablement',
        'probablement تعني «على الأرجح».',
      ),
    ],
  },

  'a2-l47-past-habits': {
    learningNoteAr:
      'الهدف: وصف العادات الماضية. البنية: imparfait: Je jouais... / Mon père nous emmenait...',
    vocabulary: {
      'a2-l47-past-habits-v1': {
        word: 'imparfait',
        phonetic: '/ɛ̃paʁfɛ/',
        translationAr: 'الماضي المستخدم للعادات',
        exampleSentence: 'L’imparfait décrit une habitude passée.',
        exampleSentenceAr: 'يصف الماضي المستخدم للعادات عادةً ماضية.',
        partOfSpeech: 'اسم',
      },
      'a2-l47-past-habits-v2': {
        word: 'emmenait',
        phonetic: '/ɑ̃mənɛ/',
        translationAr: 'كان يأخذ',
        exampleSentence: 'Mon père nous emmenait à la plage en été.',
        exampleSentenceAr: 'كان أبي يأخذنا إلى الشاطئ في الصيف.',
        partOfSpeech: 'فعل (ماضٍ)',
      },
      'a2-l47-past-habits-v3': {
        word: 'ne plus',
        translationAr: 'لم يعد',
        exampleSentence: 'Je n’ai plus le temps de m’entraîner.',
        exampleSentenceAr: 'لم يعد لدي وقت للتدريب.',
        partOfSpeech: 'تعبير',
      },
    },
    quiz: [
      mc(
        'a2-l47-past-habits-q1',
        'ما معنى «imparfait»؟',
        ['الماضي المستخدم للعادات', 'المستقبل', 'المضارع', 'الشرط'],
        'الماضي المستخدم للعادات',
        'imparfait يُستخدم لوصف العادات الماضية.',
      ),
      fill(
        'a2-l47-past-habits-q2',
        'أكمل: Mon père nous ___ à la plage en été.',
        'Mon père nous ___ à la plage en été.',
        'emmenait',
        'الإجابة الصحيحة: emmenait. كان أبي يأخذنا إلى الشاطئ في الصيف.',
      ),
      arrange(
        'a2-l47-past-habits-q3',
        'اعتدت لعب كرة القدم كل يوم.',
        ['Je', 'jouais', 'au', 'football', 'tous', 'les', 'jours'],
        'Je jouais au football tous les jours',
        'الترتيب الصحيح: Je jouais au football tous les jours.',
      ),
      mc(
        'a2-l47-past-habits-q4',
        'أي كلمة تعني «طفولة»؟',
        ['enfance', 'imparfait', 'emmenait', 'ne plus'],
        'enfance',
        'enfance تعني «طفولة».',
      ),
    ],
  },

  'a1-l49-helping-home': {
    vocabulary: {
      'a1-l49-helping-home-v2': {
        word: 'nettoyer',
        phonetic: '/netwaje/',
        translationAr: 'ينظف',
        exampleSentence: 'Veuillez nettoyer la table.',
        exampleSentenceAr: 'نظّف الطاولة من فضلك.',
        partOfSpeech: 'فعل',
      },
    },
  },

  'a2-l34-email-messages': {
    vocabulary: {
      'a2-l34-email-messages-v3': {
        word: 'objet',
        phonetic: '/ɔbʒɛ/',
        translationAr: 'موضوع',
        exampleSentence: 'La ligne d’objet doit être courte et claire.',
        exampleSentenceAr: 'يجب أن يكون سطر الموضوع قصيرًا وواضحًا.',
        partOfSpeech: 'اسم',
      },
    },
  },

  'a2-l50-review-showcase': {
    vocabulary: {
      'a2-l50-review-showcase-v3': {
        word: 'revoir',
        phonetic: '/ʁəvwaʁ/',
        translationAr: 'يراجع',
        exampleSentence: 'Nous devrions revoir les temps du passé avant le test.',
        exampleSentenceAr: 'ينبغي أن نراجع الأزمنة الماضية قبل الاختبار.',
        partOfSpeech: 'فعل',
      },
    },
  },

  'c1-l10-behavioral-economics': {
    vocabulary: {
      'c1-l10-behavioral-economics-v4': {
        word: 'paramètre par défaut',
        translationAr: 'إعداد افتراضي',
        exampleSentence: 'Changez ensuite le paramètre par défaut, car l’inertie est plus forte que n’importe quel dépliant.',
        exampleSentenceAr: 'غيّر بعد ذلك الإعداد الافتراضي، لأن القصور الذاتي أقوى من أي منشور.',
        partOfSpeech: 'تعبير',
      },
    },
  },

  'c1-l37-journalism-ethics': {
    vocabulary: {
      'c1-l37-journalism-ethics-v3': {
        word: 'vie privée',
        translationAr: 'خصوصية',
        exampleSentence: 'La vie privée de la famille compte plus que la photographie, même si elle améliorait la page.',
        exampleSentenceAr: 'خصوصية الأسرة أهم من الصورة، حتى لو كانت ستحسن الصفحة.',
        partOfSpeech: 'تعبير',
      },
    },
  },
};
