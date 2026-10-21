import { LEARNING_PATH_LESSONS } from '../src/data/curriculum';
import type { Lesson } from '../src/types';

/**
 * Select the lessons whose speech clips a script should inspect or generate.
 *
 * The expanded curriculum has exactly 50 lessons per CEFR stage, so a stage is
 * the natural publishing batch. `--lessons 1-50` exists for arbitrary slices
 * (for example after editing a smaller group of lessons).
 */
export interface SpeechSelection {
  lessons: Lesson[];
  label: string;
  /** First selected lesson number, 1-based and inclusive. */
  start: number;
  /** Last selected lesson number, 1-based and inclusive. */
  end: number;
}

const TOTAL_LESSONS = LEARNING_PATH_LESSONS.length;

const optionValue = (argv: string[], name: string): string | undefined => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
};

const parsePositiveInteger = (value: string, label: string): number => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a positive whole number, received "${value}".`);
  }
  return Number.parseInt(value, 10);
};

export const parseSpeechSelection = (
  argv: string[] = process.argv.slice(2)
): SpeechSelection => {
  const stageValue = optionValue(argv, '--stage');
  const rangeValue = optionValue(argv, '--lessons');

  if (stageValue !== undefined && rangeValue !== undefined) {
    throw new Error('Use either --stage or --lessons, not both.');
  }

  if (stageValue !== undefined) {
    const stage = parsePositiveInteger(stageValue, '--stage');
    const indices = LEARNING_PATH_LESSONS
      .map((lesson, index) => (lesson.curriculumStage === stage ? index : -1))
      .filter((index) => index >= 0);
    if (indices.length === 0) {
      throw new Error(
        `No lessons found for stage ${stage}. Available stages: ` +
          `${[...new Set(LEARNING_PATH_LESSONS.map((lesson) => lesson.curriculumStage))].join(', ')}.`
      );
    }
    const start = indices[0] + 1;
    const end = indices[indices.length - 1] + 1;
    return {
      lessons: indices.map((index) => LEARNING_PATH_LESSONS[index]),
      label: `stage ${stage} (lessons ${start}-${end})`,
      start,
      end,
    };
  }

  if (rangeValue !== undefined) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(rangeValue);
    if (!match) {
      throw new Error(`--lessons must look like 1-50 or 12, received "${rangeValue}".`);
    }
    const start = parsePositiveInteger(match[1], '--lessons start');
    const end = match[2] === undefined ? start : parsePositiveInteger(match[2], '--lessons end');
    if (start < 1 || end > TOTAL_LESSONS || start > end) {
      throw new Error(
        `--lessons must be within 1-${TOTAL_LESSONS} and start must not exceed end, received "${rangeValue}".`
      );
    }
    return {
      lessons: LEARNING_PATH_LESSONS.slice(start - 1, end),
      label: start === end ? `lesson ${start}` : `lessons ${start}-${end}`,
      start,
      end,
    };
  }

  return {
    lessons: LEARNING_PATH_LESSONS,
    label: `all ${TOTAL_LESSONS} lessons`,
    start: 1,
    end: TOTAL_LESSONS,
  };
};
