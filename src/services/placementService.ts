import type { PlacementAssessmentResult, PlacementStageResult } from '../types';
import { CURRICULUM_LEVELS } from '../data/curriculum';

export type PlacementSkill = 'vocabulary' | 'grammar' | 'reading';

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

export const PLACEMENT_QUESTIONS: readonly PlacementQuestion[] = RAW_PLACEMENT_QUESTIONS.map((question) => ({
  ...question,
  options: shuffleOptions(question.id, question.options),
}));

/**
 * Kept as the single entry point for the assessment UI. The curated bank is
 * independent from lesson quiz generation so a future content edit cannot
 * silently turn a vocabulary question into a grammar question, or produce
 * ambiguous distractors.
 */
export const buildPlacementQuestions = (): PlacementQuestion[] => [...PLACEMENT_QUESTIONS];

const stageQuestions = (stage: number): PlacementQuestion[] =>
  PLACEMENT_QUESTIONS.filter((question) => question.stage === stage);

const answerFor = (answers: Record<string, string>, questionId: string): string | undefined =>
  Object.prototype.hasOwnProperty.call(answers, questionId) ? answers[questionId] : undefined;

const stageResult = (stage: number, answers: Record<string, string>): PlacementStageResult => {
  const questions = stageQuestions(stage);
  const correct = questions.filter((question) => answerFor(answers, question.id) === question.correctAnswer).length;
  return {
    stage,
    correct,
    total: questions.length,
    passed: questions.length > 0 && correct >= PLACEMENT_PASS_REQUIRED,
  };
};

const isStageComplete = (stage: number, answers: Record<string, string>): boolean =>
  stageQuestions(stage).every((question) => answerFor(answers, question.id) !== undefined);

const nextStageQuestion = (stage: number, answers: Record<string, string>): PlacementQuestion | null =>
  stageQuestions(stage).find((question) => answerFor(answers, question.id) === undefined) ?? null;

const countAnswered = (answers: Record<string, string>): number =>
  PLACEMENT_QUESTIONS.filter((question) => answerFor(answers, question.id) !== undefined).length;

const buildResult = (
  suggestedStage: number,
  testedStages: PlacementStageResult[],
  answers: Record<string, string>,
  completedAt: string,
): PlacementAssessmentResult => {
  const answeredQuestions = PLACEMENT_QUESTIONS.filter(
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
): PlacementSession => {
  const question = nextStageQuestion(stage, answers);
  const questions = stageQuestions(stage);
  return {
    currentStage: stage,
    currentStageQuestionIndex: question
      ? questions.findIndex((entry) => entry.id === question.id)
      : questions.length,
    currentStageQuestionTotal: questions.length,
    question,
    answeredCount: countAnswered(answers),
    testedStages,
    result: null,
  };
};

const completedSession = (
  suggestedStage: number,
  answers: Record<string, string>,
  testedStages: PlacementStageResult[],
  completedAt: string,
): PlacementSession => {
  const result = buildResult(suggestedStage, testedStages, answers, completedAt);
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
  completedAt = new Date().toISOString(),
): PlacementSession => {
  const stageTwo = stageResult(2, answers);
  if (!isStageComplete(2, answers)) {
    return sessionForStage(2, answers, []);
  }
  if (stageTwo.passed) {
    const stageThree = stageResult(3, answers);
    if (!isStageComplete(3, answers)) {
      return sessionForStage(3, answers, [stageTwo]);
    }
    if (!stageThree.passed) {
      return completedSession(3, answers, [stageTwo, stageThree], completedAt);
    }
    const stageFour = stageResult(4, answers);
    if (!isStageComplete(4, answers)) {
      return sessionForStage(4, answers, [stageTwo, stageThree]);
    }
    return completedSession(4, answers, [stageTwo, stageThree, stageFour], completedAt);
  }

  const stageOne = stageResult(1, answers);
  if (!isStageComplete(1, answers)) {
    return sessionForStage(1, answers, [stageTwo]);
  }
  // A learner who only scrapes through stage 1 should not be pushed into stage 2
  // after a weak stage 2 attempt. Require both a solid stage 1 score and at least
  // half of the stage 2 items before recommending stage 2.
  const suggestedStage = stageOne.correct >= 3 && stageTwo.correct >= 2 ? 2 : 1;
  return completedSession(suggestedStage, answers, [stageTwo, stageOne], completedAt);
};

export const scorePlacementAssessment = (
  answers: Record<string, string>,
  completedAt = new Date().toISOString(),
): PlacementAssessmentResult | null => getPlacementSession(answers, completedAt).result;

export const PLACEMENT_STAGE_LABELS: Record<number, string> = {
  1: 'بداية الأساسيات (A1)',
  2: 'الأساسيات اليومية (A2–B1)',
  3: 'التعبير والتحليل (B2)',
  4: 'الطلاقة المتقدمة (C1–C2)',
};

export const PLACEMENT_PASS_RULE =
  'نعتبر المستوى مناسبًا عندما تكون 3 إجابات صحيحة من 4 على الأقل. يبدأ الاختبار من المستوى 2، ثم يصعد عند النجاح أو يعود إلى المستوى 1 عند الحاجة. وإذا كانت نتيجة المستوى 2 ضعيفة نوصي بالبدء من المستوى 1 حتى لو اجتزت بعض أساسياته، لذلك يتكيف طول الاختبار مع إجاباتك.';
