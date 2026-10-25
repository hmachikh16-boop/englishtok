import type { PlacementAssessmentResult, PlacementStageResult } from '../types';
import { CURRICULUM_LEVELS } from '../data/curriculum';

export type PlacementSkill = 'vocabulary' | 'grammar' | 'reading';
export type PlacementLanguage = 'en' | 'fr';

export interface PlacementQuestion {
  id: string;
  stage: number;
  skill: PlacementSkill;
  promptAr: string;
  promptEn?: string;
  options: string[];
  correctAnswer: string;
  explanationAr: string;
}

export interface PlacementSession {
  currentStage: number;
  currentStageQuestionIndex: number;
  currentStageQuestionTotal: number;
  question: PlacementQuestion | null;
  answeredCount: number;
  testedStages: PlacementStageResult[];
  result: PlacementAssessmentResult | null;
}

export const PLACEMENT_START_STAGE = 2;
export const PLACEMENT_QUESTIONS_PER_STAGE = 4;
export const PLACEMENT_PASS_REQUIRED = 3;
export const PLACEMENT_MAX_STAGE = Math.max(...CURRICULUM_LEVELS.map((level) => level.stage));
export const PLACEMENT_MAX_QUESTIONS =
  (PLACEMENT_MAX_STAGE - PLACEMENT_START_STAGE + 1) * PLACEMENT_QUESTIONS_PER_STAGE;

type RawQuestion = Omit<PlacementQuestion, 'options'> & { options: string[] };

const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

const hashOption = (questionId: string, option: string): number => {
  let hash = 2166136261;
  for (const character of `${questionId}:${option}`) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/**
 * Stable pseudo-shuffle: the same question always has the same option order,
 * but the correct answer is no longer predictably first.
 */
const shuffleOptions = (questionId: string, options: string[]): string[] =>
  unique(options)
    .map((option) => ({ option, rank: hashOption(questionId, option) }))
    .sort((left, right) => left.rank - right.rank || left.option.localeCompare(right.option))
    .map(({ option }) => option);

const RAW_PLACEMENT_QUESTIONS: RawQuestion[] = [
  // ── Stage 1 · foundations ──────────────────────────────────────────────
  {
    id: 'placement-v2-1-vocabulary-hungry',
    stage: 1,
    skill: 'vocabulary',
    promptAr: 'ما معنى كلمة hungry؟',
    options: ['جائع', 'عطشان', 'متعب', 'غاضب'],
    correctAnswer: 'جائع',
    explanationAr: 'hungry تعني جائع.',
  },
  {
    id: 'placement-v2-1-grammar-is',
    stage: 1,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'She ___ a new student.',
    options: ['is', 'are', 'am', 'be'],
    correctAnswer: 'is',
    explanationAr: 'مع الضمير المفرد She نستخدم is.',
  },
  {
    id: 'placement-v2-1-grammar-there-are',
    stage: 1,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'There ___ two cats in the garden.',
    options: ['are', 'is', 'was', 'be'],
    correctAnswer: 'are',
    explanationAr: 'مع الاسم الجمع two cats نستخدم are في المضارع.',
  },
  {
    id: 'placement-v2-1-reading-routine',
    stage: 1,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر ما تفعله سارة بعد الاستيقاظ مباشرة:',
    promptEn: 'Sara wakes up at seven, eats breakfast, and walks to school.',
    options: ['تتناول الفطور', 'تذهب إلى المدرسة', 'تنام مرة أخرى', 'تتناول العشاء'],
    correctAnswer: 'تتناول الفطور',
    explanationAr: 'ترتيب الأحداث: تستيقظ، ثم تتناول الفطور، ثم تمشي إلى المدرسة.',
  },

  // ── Stage 2 · daily communication ─────────────────────────────────────
  {
    id: 'placement-v2-2-vocabulary-usually',
    stage: 2,
    skill: 'vocabulary',
    promptAr: 'ما معنى كلمة usually؟',
    options: ['عادةً', 'أبدًا', 'أمس', 'غدًا'],
    correctAnswer: 'عادةً',
    explanationAr: 'usually ظرف تكرار يعني عادةً.',
  },
  {
    id: 'placement-v2-2-grammar-past-simple',
    stage: 2,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'He ___ football yesterday.',
    options: ['played', 'plays', 'play', 'playing'],
    correctAnswer: 'played',
    explanationAr: 'وجود yesterday يدل على الماضي البسيط، وماضي play هو played.',
  },
  {
    id: 'placement-v2-2-grammar-comparative',
    stage: 2,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'This bag is ___ than that one.',
    options: ['cheaper', 'cheap', 'cheapest', 'more cheap'],
    correctAnswer: 'cheaper',
    explanationAr: 'نستخدم الصفة القصيرة + er مع than: cheaper than.',
  },
  {
    id: 'placement-v2-2-reading-present-continuous',
    stage: 2,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر كيف وصل المتحدث إلى العمل اليوم:',
    promptEn: 'I usually take the bus to work, but today I am walking because the weather is beautiful.',
    options: ['مشيًا', 'بالحافلة', 'بالسيارة', 'بالقطار'],
    correctAnswer: 'مشيًا',
    explanationAr: 'usually تعبّر عن العادة، أما today فتشير إلى ما يحدث الآن: هو يمشي اليوم.',
  },

  // ── Stage 3 · independent expression ──────────────────────────────────
  {
    id: 'placement-v2-3-vocabulary-linking',
    stage: 3,
    skill: 'vocabulary',
    promptAr: 'ما معنى on the other hand؟',
    options: ['من ناحية أخرى', 'بالإضافة إلى ذلك', 'على سبيل المثال', 'باختصار'],
    correctAnswer: 'من ناحية أخرى',
    explanationAr: 'on the other hand تُستخدم لعرض وجهة نظر أو جانب مقابل.',
  },
  {
    id: 'placement-v2-3-grammar-third-conditional',
    stage: 3,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'If I had studied harder, I ___ the exam.',
    options: ['would have passed', 'will pass', 'would pass', 'have passed'],
    correctAnswer: 'would have passed',
    explanationAr: 'الشرط الثالث: If + past perfect، ثم would have + past participle.',
  },
  {
    id: 'placement-v2-3-grammar-passive',
    stage: 3,
    skill: 'grammar',
    promptAr: 'اختر الصيغة الصحيحة للمبني للمجهول:',
    promptEn: 'The report ___ by the team yesterday.',
    options: ['was written', 'wrote', 'was writing', 'has wrote'],
    correctAnswer: 'was written',
    explanationAr: 'المبني للمجهول في الماضي: was/were + past participle. التقرير كُتب، لذلك was written.',
  },
  {
    id: 'placement-v2-3-reading-contrast',
    stage: 3,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر سبب رفض اللجنة للاقتراح:',
    promptEn: 'Although the proposal was ambitious, the committee rejected it because the budget was unclear.',
    options: ['لأن الميزانية لم تكن واضحة', 'لأن الاقتراح لم يكن طموحًا', 'لأن الفريق رفضه', 'لأن الاقتراح كان قصيرًا'],
    correctAnswer: 'لأن الميزانية لم تكن واضحة',
    explanationAr: 'because the budget was unclear هي السبب المذكور مباشرة في الجملة.',
  },

  // ── Stage 4 · advanced nuance ─────────────────────────────────────────
  {
    id: 'placement-v2-4-vocabulary-mitigate',
    stage: 4,
    skill: 'vocabulary',
    promptAr: 'ما معنى الفعل mitigate؟',
    options: ['يخفف', 'يزيد', 'يؤجل', 'يكرر'],
    correctAnswer: 'يخفف',
    explanationAr: 'mitigate تعني يخفف من حدة شيء أو يقلل أثره.',
  },
  {
    id: 'placement-v2-4-grammar-inversion',
    stage: 4,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Rarely ___ such a compelling argument.',
    options: ['have I heard', 'I have heard', 'did I heard', 'I heard'],
    correctAnswer: 'have I heard',
    explanationAr: 'بعد الظرف السلبي Rarely نستخدم ترتيب السؤال: Rarely have I heard...',
  },
  {
    id: 'placement-v2-4-grammar-not-only',
    stage: 4,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Not only ___ the deadline, but the team also improved quality.',
    options: ['did they meet', 'they met', 'they did meet', 'met they'],
    correctAnswer: 'did they meet',
    explanationAr: 'بعد Not only في بداية الجملة نستخدم ترتيب السؤال: did they meet.',
  },
  {
    id: 'placement-v2-4-reading-tone',
    stage: 4,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر وصفًا دقيقًا لأسلوب الكاتبة:',
    promptEn: "The author's tone is deliberately restrained; she lets the evidence speak rather than urging the reader toward a conclusion.",
    options: ['هادئ ويعتمد على الأدلة', 'ساخر ومبالغ', 'متحمس وعاطفي', 'غامض ومتردد'],
    correctAnswer: 'هادئ ويعتمد على الأدلة',
    explanationAr: 'restrained تعني متحفظ وهادئ، وlets the evidence speak تؤكد الاعتماد على الأدلة.',
  },
];

const RAW_FRENCH_PLACEMENT_QUESTIONS: RawQuestion[] = [
  // ── Stage 1 · bases ────────────────────────────────────────────────────
  {
    id: 'placement-fr-1-vocabulary-bonjour',
    stage: 1,
    skill: 'vocabulary',
    promptAr: 'ما معنى كلمة bonjour؟',
    options: ['مرحبًا', 'وداعًا', 'شكرًا', 'من فضلك'],
    correctAnswer: 'مرحبًا',
    explanationAr: 'bonjour تعني مرحبًا، وتُستخدم للتحية نهارًا.',
  },
  {
    id: 'placement-fr-1-grammar-est',
    stage: 1,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Elle ___ une nouvelle élève.',
    options: ['est', 'sont', 'suis', 'être'],
    correctAnswer: 'est',
    explanationAr: 'مع الضمير المفرد elle نستخدم est من الفعل être.',
  },
  {
    id: 'placement-fr-1-grammar-sommes',
    stage: 1,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Nous ___ étudiants.',
    options: ['sommes', 'sont', 'êtes', 'est'],
    correctAnswer: 'sommes',
    explanationAr: 'مع الضمير nous نستخدم sommes من الفعل être.',
  },
  {
    id: 'placement-fr-1-reading-lea',
    stage: 1,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر ما تفعله ليا بعد الاستيقاظ مباشرة:',
    promptEn: 'Léa se réveille à sept heures, prend son petit-déjeuner et va à l’école.',
    options: ['تتناول الفطور', 'تذهب إلى المدرسة', 'تنام مرة أخرى', 'تتناول العشاء'],
    correctAnswer: 'تتناول الفطور',
    explanationAr: 'ترتيب الأحداث: تستيقظ، ثم تتناول الفطور، ثم تذهب إلى المدرسة.',
  },

  // ── Stage 2 · communication quotidienne ────────────────────────────────
  {
    id: 'placement-fr-2-vocabulary-souvent',
    stage: 2,
    skill: 'vocabulary',
    promptAr: 'ما معنى كلمة souvent؟',
    options: ['غالبًا', 'أبدًا', 'أمس', 'غدًا'],
    correctAnswer: 'غالبًا',
    explanationAr: 'souvent ظرف تكرار يعني غالبًا.',
  },
  {
    id: 'placement-fr-2-grammar-passe-compose',
    stage: 2,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Hier, il ___ au football.',
    options: ['a joué', 'joue', 'jouer', 'jouant'],
    correctAnswer: 'a joué',
    explanationAr: 'وجود hier يدل على الماضي، ونستخدم passé composé: il a joué.',
  },
  {
    id: 'placement-fr-2-grammar-comparatif',
    stage: 2,
    skill: 'grammar',
    promptAr: 'اختر الشكل الصحيح للصفة مع الاسم المذكر المفرد:',
    promptEn: 'Ce sac est ___ que l’autre.',
    options: ['plus cher', 'plus chère', 'plus chers', 'plus chères'],
    correctAnswer: 'plus cher',
    explanationAr: 'sac اسم مذكر مفرد، لذلك نستخدم plus cher.',
  },
  {
    id: 'placement-fr-2-reading-aujourdhui',
    stage: 2,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر كيف وصل المتحدث إلى العمل اليوم:',
    promptEn: 'Je prends habituellement le bus pour aller au travail, mais aujourd’hui je marche parce qu’il fait beau.',
    options: ['مشيًا', 'بالحافلة', 'بالسيارة', 'بالقطار'],
    correctAnswer: 'مشيًا',
    explanationAr: 'habituellement تعبّر عن العادة، أما aujourd’hui فتشير إلى أنه يمشي اليوم.',
  },

  // ── Stage 3 · تعبير وتحليل ─────────────────────────────────────────────
  {
    id: 'placement-fr-3-vocabulary-dune-part',
    stage: 3,
    skill: 'vocabulary',
    promptAr: 'ما معنى d’une part … d’autre part؟',
    options: ['من ناحية… ومن ناحية أخرى', 'بالإضافة إلى ذلك', 'على سبيل المثال', 'باختصار'],
    correctAnswer: 'من ناحية… ومن ناحية أخرى',
    explanationAr: 'd’une part … d’autre part تُستخدم لعرض جانبين أو وجهتي نظر.',
  },
  {
    id: 'placement-fr-3-grammar-conditionnel-passe',
    stage: 3,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Si j’avais étudié davantage, j’___ l’examen.',
    options: ['aurais réussi', 'réussirai', 'réussirais', 'ai réussi'],
    correctAnswer: 'aurais réussi',
    explanationAr: 'الشرط الثالث: si + plus-que-parfait، ثم conditionnel passé.',
  },
  {
    id: 'placement-fr-3-grammar-voix-passive',
    stage: 3,
    skill: 'grammar',
    promptAr: 'اختر الصيغة الصحيحة للمبني للمجهول:',
    promptEn: 'Le rapport ___ par l’équipe hier.',
    options: ['a été écrit', 'a écrit', 'écrivait', 'avait écrit'],
    correctAnswer: 'a été écrit',
    explanationAr: 'المبني للمجهول في الماضي: a été + participe passé. التقرير كُتب، لذلك a été écrit.',
  },
  {
    id: 'placement-fr-3-reading-budget',
    stage: 3,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر سبب رفض اللجنة للاقتراح:',
    promptEn: 'Bien que la proposition fût ambitieuse, le comité l’a rejetée parce que le budget n’était pas clair.',
    options: ['لأن الميزانية لم تكن واضحة', 'لأن الاقتراح لم يكن طموحًا', 'لأن الفريق رفضه', 'لأن الاقتراح كان قصيرًا'],
    correctAnswer: 'لأن الميزانية لم تكن واضحة',
    explanationAr: 'parce que le budget n’était pas clair هي السبب المذكور مباشرة.',
  },

  // ── Stage 4 · nuance متقدمة ────────────────────────────────────────────
  {
    id: 'placement-fr-4-vocabulary-attenuer',
    stage: 4,
    skill: 'vocabulary',
    promptAr: 'ما معنى الفعل atténuer؟',
    options: ['يخفف', 'يزيد', 'يؤجل', 'يكرر'],
    correctAnswer: 'يخفف',
    explanationAr: 'atténuer تعني يخفف من حدة شيء أو يقلل أثره.',
  },
  {
    id: 'placement-fr-4-grammar-inversion',
    stage: 4,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Rarement ___ un argument aussi convaincant.',
    options: ['ai-je entendu', 'j’ai entendu', 'j’avais entendu', 'j’entendais'],
    correctAnswer: 'ai-je entendu',
    explanationAr: 'بعد الظرف السلبي Rarement نستخدم ترتيب السؤال: Rarement ai-je entendu…',
  },
  {
    id: 'placement-fr-4-grammar-subjonctif',
    stage: 4,
    skill: 'grammar',
    promptAr: 'أكمل الجملة بالشكل الصحيح:',
    promptEn: 'Bien qu’il ___ fatigué, il a continué.',
    options: ['soit', 'est', 'était', 'sera'],
    correctAnswer: 'soit',
    explanationAr: 'بعد bien que نستخدم صيغة subjonctif: bien qu’il soit.',
  },
  {
    id: 'placement-fr-4-reading-ton',
    stage: 4,
    skill: 'reading',
    promptAr: 'اقرأ الجملة، ثم اختر وصفًا دقيقًا لأسلوب الكاتبة:',
    promptEn: 'Le ton de l’auteure est délibérément mesuré ; elle laisse les faits parler plutôt que d’orienter le lecteur vers une conclusion.',
    options: ['هادئ ويعتمد على الأدلة', 'ساخر ومبالغ', 'متحمس وعاطفي', 'غامض ومتردد'],
    correctAnswer: 'هادئ ويعتمد على الأدلة',
    explanationAr: 'mesuré تعني متحفظ وهادئ، وlaisse les faits parler تؤكد الاعتماد على الأدلة.',
  },
];

export const PLACEMENT_QUESTIONS: readonly PlacementQuestion[] = RAW_PLACEMENT_QUESTIONS.map((question) => ({
  ...question,
  options: shuffleOptions(question.id, question.options),
}));

const FRENCH_PLACEMENT_QUESTIONS: readonly PlacementQuestion[] = RAW_FRENCH_PLACEMENT_QUESTIONS.map((question) => ({
  ...question,
  options: shuffleOptions(question.id, question.options),
}));

/**
 * Kept as the single entry point for the assessment UI. The curated bank is
 * independent from lesson quiz generation so a future content edit cannot
 * silently turn a vocabulary question into a grammar question, or produce
 * ambiguous distractors.
 */
const placementBank = (language: PlacementLanguage): readonly PlacementQuestion[] =>
  language === 'fr' ? FRENCH_PLACEMENT_QUESTIONS : PLACEMENT_QUESTIONS;

export const buildPlacementQuestions = (language: PlacementLanguage = 'en'): PlacementQuestion[] => [
  ...placementBank(language),
];

const stageQuestions = (stage: number, bank: readonly PlacementQuestion[]): PlacementQuestion[] =>
  bank.filter((question) => question.stage === stage);

const answerFor = (answers: Record<string, string>, questionId: string): string | undefined =>
  Object.prototype.hasOwnProperty.call(answers, questionId) ? answers[questionId] : undefined;

const stageResult = (
  stage: number,
  answers: Record<string, string>,
  bank: readonly PlacementQuestion[],
): PlacementStageResult => {
  const questions = stageQuestions(stage, bank);
  const correct = questions.filter((question) => answerFor(answers, question.id) === question.correctAnswer).length;
  return {
    stage,
    correct,
    total: questions.length,
    passed: questions.length > 0 && correct >= PLACEMENT_PASS_REQUIRED,
  };
};

const isStageComplete = (
  stage: number,
  answers: Record<string, string>,
  bank: readonly PlacementQuestion[],
): boolean =>
  stageQuestions(stage, bank).every((question) => answerFor(answers, question.id) !== undefined);

const nextStageQuestion = (
  stage: number,
  answers: Record<string, string>,
  bank: readonly PlacementQuestion[],
): PlacementQuestion | null =>
  stageQuestions(stage, bank).find((question) => answerFor(answers, question.id) === undefined) ?? null;

const countAnswered = (
  answers: Record<string, string>,
  bank: readonly PlacementQuestion[],
): number =>
  bank.filter((question) => answerFor(answers, question.id) !== undefined).length;

const buildResult = (
  suggestedStage: number,
  testedStages: PlacementStageResult[],
  answers: Record<string, string>,
  completedAt: string,
  bank: readonly PlacementQuestion[],
): PlacementAssessmentResult => {
  const answeredQuestions = bank.filter(
    (question) => answerFor(answers, question.id) !== undefined,
  );
  const correctCount = answeredQuestions.filter(
    (question) => answerFor(answers, question.id) === question.correctAnswer,
  ).length;
  return {
    completedAt,
    correctCount,
    answeredCount: answeredQuestions.length,
    scorePercent: answeredQuestions.length
      ? Math.round((correctCount / answeredQuestions.length) * 100)
      : 0,
    suggestedStage,
    skillCoverage: [...new Set(answeredQuestions.map((question) => question.skill))],
    stages: [...testedStages].sort((left, right) => left.stage - right.stage),
    method: 'test',
  };
};

const sessionForStage = (
  stage: number,
  answers: Record<string, string>,
  testedStages: PlacementStageResult[],
  bank: readonly PlacementQuestion[],
): PlacementSession => {
  const question = nextStageQuestion(stage, answers, bank);
  const questions = stageQuestions(stage, bank);
  return {
    currentStage: stage,
    currentStageQuestionIndex: question
      ? questions.findIndex((entry) => entry.id === question.id)
      : questions.length,
    currentStageQuestionTotal: questions.length,
    question,
    answeredCount: countAnswered(answers, bank),
    testedStages,
    result: null,
  };
};

const completedSession = (
  suggestedStage: number,
  answers: Record<string, string>,
  testedStages: PlacementStageResult[],
  completedAt: string,
  bank: readonly PlacementQuestion[],
): PlacementSession => {
  const result = buildResult(suggestedStage, testedStages, answers, completedAt, bank);
  return {
    currentStage: suggestedStage,
    currentStageQuestionIndex: 0,
    currentStageQuestionTotal: 0,
    question: null,
    answeredCount: result.answeredCount,
    testedStages: result.stages,
    result,
  };
};

/**
 * Reconstructs the adaptive test from saved answers. This makes the test
 * resumable after closing the app and prevents a browser refresh from losing
 * the route through the question bank.
 */
export const getPlacementSession = (
  answers: Record<string, string>,
  language: PlacementLanguage = 'en',
  completedAt = new Date().toISOString(),
): PlacementSession => {
  const bank = placementBank(language);
  const stageTwo = stageResult(2, answers, bank);
  if (!isStageComplete(2, answers, bank)) {
    return sessionForStage(2, answers, [], bank);
  }
  if (stageTwo.passed) {
    const stageThree = stageResult(3, answers, bank);
    if (!isStageComplete(3, answers, bank)) {
      return sessionForStage(3, answers, [stageTwo], bank);
    }
    if (!stageThree.passed) {
      return completedSession(3, answers, [stageTwo, stageThree], completedAt, bank);
    }
    const stageFour = stageResult(4, answers, bank);
    if (!isStageComplete(4, answers, bank)) {
      return sessionForStage(4, answers, [stageTwo, stageThree], bank);
    }
    return completedSession(4, answers, [stageTwo, stageThree, stageFour], completedAt, bank);
  }

  const stageOne = stageResult(1, answers, bank);
  if (!isStageComplete(1, answers, bank)) {
    return sessionForStage(1, answers, [stageTwo], bank);
  }
  // A learner who only scrapes through stage 1 should not be pushed into stage 2
  // after a weak stage 2 attempt. Require both a solid stage 1 score and at least
  // half of the stage 2 items before recommending stage 2.
  const suggestedStage = stageOne.correct >= 3 && stageTwo.correct >= 2 ? 2 : 1;
  return completedSession(suggestedStage, answers, [stageTwo, stageOne], completedAt, bank);
};

export const scorePlacementAssessment = (
  answers: Record<string, string>,
  language: PlacementLanguage = 'en',
  completedAt = new Date().toISOString(),
): PlacementAssessmentResult | null => getPlacementSession(answers, language, completedAt).result;

export const PLACEMENT_STAGE_LABELS: Record<number, string> = {
  1: 'بداية الأساسيات (A1)',
  2: 'الأساسيات اليومية (A2–B1)',
  3: 'التعبير والتحليل (B2)',
  4: 'الطلاقة المتقدمة (C1–C2)',
};

export const PLACEMENT_PASS_RULE =
  'نعتبر المستوى مناسبًا عندما تكون 3 إجابات صحيحة من 4 على الأقل. يبدأ الاختبار من المستوى 2، ثم يصعد عند النجاح أو يعود إلى المستوى 1 عند الحاجة. وإذا كانت نتيجة المستوى 2 ضعيفة نوصي بالبدء من المستوى 1 حتى لو اجتزت بعض أساسياته، لذلك يتكيف طول الاختبار مع إجاباتك.';
