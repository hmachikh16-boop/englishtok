import type { Lesson, TargetLanguage } from '../types';
import { buildExpansionLesson } from './expansion/buildExpansionLesson';
import type { ExpansionLessonSpec } from './expansion/types';

/**
 * Gold curriculum additions.
 *
 * The app shell, path rail and lesson screen stay identical to Lin Go. Gold
 * only adds a stage project after the opening lesson of every stage: a short,
 * practical task that proves the learner can use what the stage taught.
 *
 * The projects are deliberately kept out of the generated 400-lesson content
 * file. That keeps the free curriculum frozen, while the Gold build can add
 * its own layer without changing the free download.
 */

const project = (spec: ExpansionLessonSpec): ExpansionLessonSpec => spec;

const ENGLISH_PROJECTS: Record<number, ExpansionLessonSpec> = {
  1: project({
    id: 'gold-project-stage-1',
    slug: 'gold-project-introduce-yourself',
    stage: 1,
    level: 'A1',
    title: 'Gold Project: Introduce Yourself',
    titleAr: 'مشروع Gold: قدّم نفسك',
    descriptionAr: 'مشروع المرحلة الأولى: استخدم ما تعلّمته لتقديم نفسك في 60 ثانية.',
    objectiveAr: 'تقديم الاسم والبلد والهواية وحلمك بجمل قصيرة وواضحة.',
    structureEn: 'My name is Adam and I am from Algeria.',
    structureAr: 'اسمي آدم وأنا من الجزائر.',
    methodNoteAr: 'ابدأ بالاسم، ثم البلد، ثم هواية واحدة، وأغلق الجملة بحلمك.',
    category: 'greetings',
    scene: 'classroom',
    openingEn: 'Welcome to your first Gold project! Can you introduce yourself?',
    openingAr: 'مرحبًا بك في مشروع Gold الأول! هل يمكنك تقديم نفسك؟',
    words: [
      ['name', 'اسم', 'اسم', 'My name is Adam.', 'اسمي آدم.'],
      ['country', 'اسم', 'بلد', 'My country is Algeria.', 'بلدي الجزائر.'],
      ['hobby', 'اسم', 'هواية', 'My hobby is reading.', 'هوايتي القراءة.'],
      ['dream', 'اسم', 'حلم', 'My dream is to travel.', 'حلمي أن أسافر.'],
    ],
    closingEn: 'Well done! You introduced yourself clearly and confidently.',
    closingAr: 'أحسنت! قدّمت نفسك بوضوح وثقة.',
    skipFillAudio: true,
  }),
  2: project({
    id: 'gold-project-stage-2',
    slug: 'gold-project-a-day-in-the-city',
    stage: 2,
    level: 'A2',
    title: 'Gold Project: A Day in the City',
    titleAr: 'مشروع Gold: يوم في المدينة',
    descriptionAr: 'مشروع المرحلة الثانية: خطّط ليومك وتعامَل مع الطريق والتذاكر والمواعيد.',
    objectiveAr: 'طلب الاتجاهات، شراء تذكرة، وتأكيد موعد بجمل مهذبة.',
    structureEn: 'Could you tell me how to get to the station?',
    structureAr: 'هل يمكنك أن تخبرني كيف أصل إلى المحطة؟',
    methodNoteAr: 'استخدم Could you للمجاملة، ثم اذكر المكان الذي تريده بدقة.',
    category: 'travel',
    scene: 'street',
    openingEn: 'Your Gold project today is to plan a day in the city.',
    openingAr: 'مشروع Gold اليوم هو أن تخطّط ليوم في المدينة.',
    words: [
      ['directions', 'اسم', 'اتجاهات', 'The directions were very clear.', 'كانت الاتجاهات واضحة جدًا.'],
      ['ticket', 'اسم', 'تذكرة', 'I bought a ticket for the train.', 'اشتريت تذكرة للقطار.'],
      ['appointment', 'اسم', 'موعد', 'I have an appointment at noon.', 'لدي موعد عند الظهر.'],
      ['receipt', 'اسم', 'إيصال', 'Please keep the receipt.', 'من فضلك احتفظ بالإيصال.'],
    ],
    closingEn: 'Excellent! You can handle a simple day in the city in English.',
    closingAr: 'ممتاز! تستطيع إدارة يوم بسيط في المدينة بالإنجليزية.',
    skipFillAudio: true,
  }),
  3: project({
    id: 'gold-project-stage-3',
    slug: 'gold-project-professional-discussion',
    stage: 3,
    level: 'B2',
    title: 'Gold Project: A Professional Discussion',
    titleAr: 'مشروع Gold: نقاش مهني',
    descriptionAr: 'مشروع المرحلة الثالثة: قدّم اقتراحًا وناقش موعدًا نهائيًا مع فريقك.',
    objectiveAr: 'عرض اقتراح، مناقشة موعد، طلب ملاحظات، والوصول إلى قرار.',
    structureEn: 'I propose we review the deadline before the meeting.',
    structureAr: 'أقترح أن نراجع الموعد النهائي قبل الاجتماع.',
    methodNoteAr: 'استخدم I propose / I suggest ثم اذكر السبب في جملة قصيرة.',
    category: 'work',
    scene: 'office',
    openingEn: 'Let us run a short professional discussion for your Gold project.',
    openingAr: 'لنجرِ نقاشًا مهنيًا قصيرًا لمشروع Gold.',
    words: [
      ['proposal', 'اسم', 'اقتراح', 'The proposal was clear and practical.', 'كان الاقتراح واضحًا وعمليًا.'],
      ['deadline', 'اسم', 'موعد نهائي', 'We need to protect the deadline.', 'علينا الحفاظ على الموعد النهائي.'],
      ['stakeholder', 'اسم', 'صاحب مصلحة', 'Every stakeholder received the update.', 'تلقّى كل صاحب مصلحة التحديث.'],
      ['feedback', 'اسم', 'ملاحظات', 'Thank you for your feedback.', 'شكرًا على ملاحظاتك.'],
    ],
    closingEn: 'Great work! Your proposal, deadline and feedback were all clear.',
    closingAr: 'عمل رائع! كان اقتراحك وموعدك وملاحظاتك واضحة.',
    skipFillAudio: true,
  }),
  4: project({
    id: 'gold-project-stage-4',
    slug: 'gold-project-persuasive-speech',
    stage: 4,
    level: 'C1',
    title: 'Gold Project: Persuasive Speech',
    titleAr: 'مشروع Gold: خطاب إقناع',
    descriptionAr: 'مشروع المرحلة الرابعة: ابنِ حجة متوازنة واستخدم الأدلة والاعتراضات.',
    objectiveAr: 'بناء حجة واضحة، دعمها بدليل، والرد على اعتراض ثم خاتمة مقنعة.',
    structureEn: 'A strong argument depends on clear evidence and a fair conclusion.',
    structureAr: 'تعتمد الحجة القوية على دليل واضح وخاتمة منصفة.',
    methodNoteAr: 'اذكر الحجة، ثم الدليل، ثم اعترف بالاعتراض، وأغلق بالخاتمة.',
    category: 'grammar',
    scene: 'classroom',
    openingEn: 'Your final Gold project is a short persuasive speech.',
    openingAr: 'مشروع Gold الأخير هو خطاب إقناع قصير.',
    words: [
      ['argument', 'اسم', 'حجة', 'A clear argument needs a clear purpose.', 'تحتاج الحجة الواضحة إلى هدف واضح.'],
      ['evidence', 'اسم', 'دليل', 'The evidence supports your main point.', 'الدليل يدعم نقطتك الرئيسية.'],
      ['counterpoint', 'اسم', 'اعتراض', 'A fair counterpoint makes your case stronger.', 'الاعتراض المنصف يجعل حجتك أقوى.'],
      ['conclusion', 'اسم', 'خاتمة', 'End with a conclusion that invites action.', 'اختم بخاتمة تدعو إلى التحرك.'],
    ],
    closingEn: 'Outstanding! You built an argument, answered the counterpoint and closed with purpose.',
    closingAr: 'ممتاز! بنيت حجة، ورددت على الاعتراض، وأغلقت بهدف واضح.',
    skipFillAudio: true,
  }),
};

const FRENCH_PROJECTS: Record<number, ExpansionLessonSpec> = {
  1: project({
    id: 'gold-project-stage-1',
    slug: 'projet-gold-se-presenter',
    stage: 1,
    level: 'A1',
    title: 'Projet Gold : Se présenter',
    titleAr: 'مشروع Gold: قدّم نفسك',
    descriptionAr: 'مشروع المرحلة الأولى: استخدم ما تعلّمته لتقديم نفسك في 60 ثانية.',
    objectiveAr: 'تقديم الاسم والبلد والهواية والحلم بجمل فرنسية قصيرة وواضحة.',
    structureEn: "Je m'appelle Adam et je viens d'Algérie.",
    structureAr: 'اسمي آدم وأنا من الجزائر.',
    methodNoteAr: 'ابدأ بالاسم، ثم البلد، ثم هواية واحدة، وأغلق الجملة بحلمك.',
    category: 'greetings',
    scene: 'classroom',
    openingEn: 'Bienvenue dans ton premier projet Gold ! Peux-tu te présenter ?',
    openingAr: 'مرحبًا بك في مشروع Gold الأول! هل يمكنك تقديم نفسك؟',
    words: [
      ['nom', 'اسم', 'اسم', "Mon nom est Adam.", 'اسمي آدم.'],
      ['pays', 'اسم', 'بلد', "Mon pays est l'Algérie.", 'بلدي الجزائر.'],
      ['passion', 'اسم', 'شغف', 'Ma passion est la lecture.', 'شغفي هو القراءة.'],
      ['rêve', 'اسم', 'حلم', 'Mon rêve est de voyager.', 'حلمي أن أسافر.'],
    ],
    closingEn: 'Bravo ! Tu t’es présenté clairement et avec confiance.',
    closingAr: 'أحسنت! قدّمت نفسك بوضوح وثقة.',
    skipFillAudio: true,
  }),
  2: project({
    id: 'gold-project-stage-2',
    slug: 'projet-gold-une-journee-en-ville',
    stage: 2,
    level: 'A2',
    title: 'Projet Gold : Une journée en ville',
    titleAr: 'مشروع Gold: يوم في المدينة',
    descriptionAr: 'مشروع المرحلة الثانية: خطّط ليومك وتعامَل مع الطريق والتذاكر والمواعيد.',
    objectiveAr: 'طلب الاتجاهات، شراء تذكرة، وتأكيد موعد بجمل فرنسية مهذبة.',
    structureEn: 'Pouvez-vous m’indiquer le chemin de la gare ?',
    structureAr: 'هل يمكنك أن تخبرني كيف أصل إلى المحطة؟',
    methodNoteAr: 'استخدم Pouvez-vous للمجاملة، ثم اذكر المكان الذي تريده بدقة.',
    category: 'travel',
    scene: 'street',
    openingEn: 'Ton projet Gold aujourd’hui est de préparer une journée en ville.',
    openingAr: 'مشروع Gold اليوم هو أن تخطّط ليوم في المدينة.',
    words: [
      ['itinéraire', 'اسم', 'مسار', "L'itinéraire était très clair.", 'كان المسار واضحًا جدًا.'],
      ['billet', 'اسم', 'تذكرة', 'J’ai acheté un billet de train.', 'اشتريت تذكرة قطار.'],
      ['rendez-vous', 'اسم', 'موعد', 'J’ai un rendez-vous à midi.', 'لدي موعد عند الظهر.'],
      ['reçu', 'اسم', 'إيصال', 'Gardez le reçu, s’il vous plaît.', 'من فضلك احتفظ بالإيصال.'],
    ],
    closingEn: 'Excellent ! Tu peux gérer une journée simple en ville en français.',
    closingAr: 'ممتاز! تستطيع إدارة يوم بسيط في المدينة بالفرنسية.',
    skipFillAudio: true,
  }),
  3: project({
    id: 'gold-project-stage-3',
    slug: 'projet-gold-discussion-professionnelle',
    stage: 3,
    level: 'B2',
    title: 'Projet Gold : Discussion professionnelle',
    titleAr: 'مشروع Gold: نقاش مهني',
    descriptionAr: 'مشروع المرحلة الثالثة: قدّم اقتراحًا وناقش موعدًا نهائيًا مع فريقك.',
    objectiveAr: 'عرض اقتراح، مناقشة موعد، طلب ملاحظات، والوصول إلى قرار.',
    structureEn: 'Je propose de revoir l’échéance avant la réunion.',
    structureAr: 'أقترح أن نراجع الموعد النهائي قبل الاجتماع.',
    methodNoteAr: 'استخدم Je propose / Je suggère ثم اذكر السبب في جملة قصيرة.',
    category: 'work',
    scene: 'office',
    openingEn: 'Faisons une courte discussion professionnelle pour ton projet Gold.',
    openingAr: 'لنجرِ نقاشًا مهنيًا قصيرًا لمشروع Gold.',
    words: [
      ['proposition', 'اسم', 'اقتراح', 'La proposition était claire et pratique.', 'كان الاقتراح واضحًا وعمليًا.'],
      ['échéance', 'اسم', 'موعد نهائي', 'Nous devons respecter l’échéance.', 'علينا احترام الموعد النهائي.'],
      ['partie prenante', 'اسم', 'صاحب مصلحة', 'Chaque partie prenante a reçu la mise à jour.', 'تلقّى كل صاحب مصلحة التحديث.'],
      ['retour', 'اسم', 'ملاحظات', 'Merci pour ton retour.', 'شكرًا على ملاحظاتك.'],
    ],
    closingEn: 'Très bien ! Ta proposition, ton échéance et ton retour étaient clairs.',
    closingAr: 'عمل رائع! كان اقتراحك وموعدك وملاحظاتك واضحة.',
    skipFillAudio: true,
  }),
  4: project({
    id: 'gold-project-stage-4',
    slug: 'projet-gold-discours-persuasif',
    stage: 4,
    level: 'C1',
    title: 'Projet Gold : Discours persuasif',
    titleAr: 'مشروع Gold: خطاب إقناع',
    descriptionAr: 'مشروع المرحلة الرابعة: ابنِ حجة متوازنة واستخدم الأدلة والاعتراضات.',
    objectiveAr: 'بناء حجة واضحة، دعمها بدليل، والرد على اعتراض ثم خاتمة مقنعة.',
    structureEn: 'Un argument solide repose sur des preuves claires et une conclusion juste.',
    structureAr: 'تعتمد الحجة القوية على دليل واضح وخاتمة منصفة.',
    methodNoteAr: 'اذكر الحجة، ثم الدليل، ثم اعترف بالاعتراض، وأغلق بالخاتمة.',
    category: 'grammar',
    scene: 'classroom',
    openingEn: 'Ton dernier projet Gold est un court discours persuasif.',
    openingAr: 'مشروع Gold الأخير هو خطاب إقناع قصير.',
    words: [
      ['argument', 'اسم', 'حجة', 'Un argument clair a un objectif clair.', 'تحتاج الحجة الواضحة إلى هدف واضح.'],
      ['preuve', 'اسم', 'دليل', 'La preuve soutient ton idée principale.', 'الدليل يدعم فكرتك الرئيسية.'],
      ['objection', 'اسم', 'اعتراض', 'Une objection juste renforce ton argument.', 'الاعتراض المنصف يقوّي حجتك.'],
      ['conclusion', 'اسم', 'خاتمة', 'Termine par une conclusion qui appelle à agir.', 'اختم بخاتمة تدعو إلى التحرك.'],
    ],
    closingEn: 'Remarquable ! Tu as construit un argument, répondu à l’objection et conclu avec intention.',
    closingAr: 'ممتاز! بنيت حجة، ورددت على الاعتراض، وأغلقت بهدف واضح.',
    skipFillAudio: true,
  }),
};

const SPECS: Record<TargetLanguage, Record<number, ExpansionLessonSpec>> = {
  en: ENGLISH_PROJECTS,
  fr: FRENCH_PROJECTS,
};

/**
 * Adds the four Gold projects to a curriculum without touching the original
 * lessons. The project is inserted immediately after the first lesson of each
 * stage so a learner can see it without completing 100 lessons first.
 */
export const applyGoldCurriculum = (
  lessons: Lesson[],
  language: TargetLanguage = 'en',
): Lesson[] => {
  if (lessons.length === 0) return lessons;
  if (lessons.some((lesson) => lesson.id.startsWith('gold-project-stage-'))) return lessons;

  const specs = SPECS[language] ?? SPECS.en;
  const projects = new Map<number, Lesson>();

  for (const stage of [1, 2, 3, 4]) {
    const spec = specs[stage];
    const template = lessons.find((lesson) => lesson.curriculumStage === stage);
    if (!spec || !template) continue;
    projects.set(
      stage,
      buildExpansionLesson(spec, [template.characterA, template.characterB]),
    );
  }

  const inserted = new Set<number>();
  const result: Lesson[] = [];

  for (const lesson of lessons) {
    result.push(lesson);
    const stage = lesson.curriculumStage;
    if (!stage || inserted.has(stage)) continue;
    const goldProject = projects.get(stage);
    if (goldProject) {
      result.push(goldProject);
      inserted.add(stage);
    }
  }

  return result;
};
