import type { Lesson, PlacementAssessmentResult } from '../types';
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

const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

/**
 * Fill-in-the-blank quiz items ship without options because the lesson UI asks
 * learners to type the answer. The placement test is multiple-choice only, so
 * derive plausible options from the other fill answers in the same stage.
 */
const buildGrammarOptions = (correctAnswer: string, candidates: string[]): string[] => {
  const distractors = unique(
    candidates.filter((candidate) => candidate.toLowerCase() !== correctAnswer.toLowerCase()),
  ).slice(0, 3);
  const options = [correctAnswer, ...distractors];
  if (options.length < 2) return [];
  // Rotate deterministically so the correct answer does not always come first.
  const offset = correctAnswer.length % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
};

export const buildPlacementQuestions = (lessons: Lesson[]): PlacementQuestion[] => {
  const questions: PlacementQuestion[] = [];
  for (const level of CURRICULUM_LEVELS) {
    const stageLessons = lessons.filter((lesson) => !lesson.schoolYearId && lesson.curriculumStage === level.stage);
    const multipleChoice = stageLessons.find((lesson) => lesson.quiz.some((question) => question.type === 'multiple_choice'));
    const fillBlank = stageLessons.find((lesson) => lesson.quiz.some((question) => question.type === 'fill_blank'));

    const vocabQuestion = multipleChoice?.quiz.find((question) => question.type === 'multiple_choice');
    if (vocabQuestion) {
      questions.push({
        id: `placement-${level.stage}-vocabulary`, stage: level.stage, skill: 'vocabulary',
        promptAr: vocabQuestion.questionAr, promptEn: vocabQuestion.questionEn,
        options: vocabQuestion.options, correctAnswer: vocabQuestion.correctAnswer,
        explanationAr: vocabQuestion.explanationAr,
      });
    }

    const grammarQuestion = fillBlank?.quiz.find((question) => question.type === 'fill_blank');
    if (grammarQuestion) {
      const grammarOptions = grammarQuestion.options.length >= 2
        ? grammarQuestion.options
        : buildGrammarOptions(
            grammarQuestion.correctAnswer,
            [
              ...stageLessons.flatMap((lesson) => lesson.quiz),
              ...lessons.flatMap((lesson) => lesson.quiz),
            ]
              .filter((question) => question.type === 'fill_blank')
              .map((question) => question.correctAnswer),
          );
      if (grammarOptions.length >= 2) {
        questions.push({
          id: `placement-${level.stage}-grammar`, stage: level.stage, skill: 'grammar',
          promptAr: grammarQuestion.questionAr, promptEn: grammarQuestion.questionEn,
          options: grammarOptions, correctAnswer: grammarQuestion.correctAnswer,
          explanationAr: grammarQuestion.explanationAr,
        });
      }
    }

    const readingLesson = stageLessons.find((lesson) => lesson.dialogue.length > 0);
    const readingLine = readingLesson?.dialogue[0];
    if (readingLesson && readingLine) {
      const distractors = stageLessons.flatMap((lesson) => lesson.dialogue.slice(1).map((line) => line.textAr));
      const options = unique([readingLine.textAr, ...distractors]).slice(0, 4);
      if (options.length >= 2) {
        questions.push({
          id: `placement-${level.stage}-reading`, stage: level.stage, skill: 'reading',
          promptAr: 'اقرأ الجملة واختر معناها الأقرب:', promptEn: readingLine.textEn,
          options, correctAnswer: readingLine.textAr,
          explanationAr: `معنى الجملة: ${readingLine.textAr}`,
        });
      }
    }
  }
  return questions;
};

export const scorePlacementAssessment = (
  questions: PlacementQuestion[],
  answers: Record<string, string>,
  completedAt = new Date().toISOString(),
): PlacementAssessmentResult => {
  const answered = questions.filter((question) => Object.prototype.hasOwnProperty.call(answers, question.id));
  const correctCount = answered.filter((question) => answers[question.id] === question.correctAnswer).length;
  const maxWeight = answered.reduce((sum, question) => sum + question.stage, 0);
  const earnedWeight = answered.reduce((sum, question) => sum + (answers[question.id] === question.correctAnswer ? question.stage : 0), 0);
  const stages = CURRICULUM_LEVELS.map(({ stage }) => {
    const stageQuestions = questions.filter((question) => question.stage === stage);
    const correct = stageQuestions.filter((question) => answers[question.id] === question.correctAnswer).length;
    return { stage, correct, total: stageQuestions.length, passed: stageQuestions.length > 0 && correct / stageQuestions.length >= 2 / 3 };
  });
  const firstUnpassed = stages.find((stage) => !stage.passed);
  const suggestedStage = firstUnpassed?.stage ?? stages[stages.length - 1]?.stage ?? 1;
  const skillCoverage = [...new Set(answered.map((question) => question.skill))];
  return {
    completedAt,
    correctCount,
    answeredCount: answered.length,
    scorePercent: maxWeight ? Math.round((earnedWeight / maxWeight) * 100) : 0,
    suggestedStage,
    skillCoverage,
    stages,
  };
};

export const PLACEMENT_STAGE_LABELS: Record<number, string> = {
  1: 'بداية الأساسيات',
  2: 'الأساسيات الأولى',
  3: 'بناء الجمل اليومية',
  4: 'التواصل في مواقف متنوعة',
  5: 'توسيع الطلاقة والتعبير',
  6: 'التواصل المتقدم',
  7: 'التعبير الدقيق والمتقدم',
};

export const PLACEMENT_PASS_RULE = 'يُعد المستوى متقنًا مبدئيًا عند الإجابة الصحيحة عن ثلثي أسئلته على الأقل، ويكون البدء من أول مستوى لم يتحقق فيه ذلك.';
