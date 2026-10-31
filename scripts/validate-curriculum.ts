/**
 * Structural checks for the 400-lesson curriculum.
 *
 *   npx tsx scripts/validate-curriculum.ts
 *
 * This does not judge prose quality; it catches the mistakes that break the
 * learner flow (duplicate ids, empty translations, missing IPA, a fill-in
 * answer that is not in its example, or an arrange exercise whose tokens do
 * not rebuild the target sentence).
 */
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[.,!?;:’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const errors: string[] = [];
const ids = new Set<string>();
const slugs = new Set<string>();
const byStage = new Map<number, number>();

for (const lesson of LEARNING_PATH_LESSONS) {
  const lessonNumber = Number(lesson.id.match(/-l(\d+)-/)?.[1] ?? 0);
  const isExpansion = lessonNumber >= 5;

  if (ids.has(lesson.id)) errors.push(`duplicate id: ${lesson.id}`);
  if (slugs.has(lesson.slug)) errors.push(`duplicate slug: ${lesson.slug}`);
  ids.add(lesson.id);
  slugs.add(lesson.slug);
  byStage.set(lesson.curriculumStage ?? 0, (byStage.get(lesson.curriculumStage ?? 0) ?? 0) + 1);

  if (!lesson.title.trim() || !lesson.titleAr.trim()) errors.push(`${lesson.id}: missing title`);
  if (!lesson.descriptionAr.trim()) errors.push(`${lesson.id}: missing descriptionAr`);
  if (!lesson.learningNoteAr?.trim()) errors.push(`${lesson.id}: missing learning note`);
  if (lesson.vocabulary.length < 4) errors.push(`${lesson.id}: only ${lesson.vocabulary.length} words`);
  if (lesson.dialogue.length < 5) errors.push(`${lesson.id}: only ${lesson.dialogue.length} dialogue lines`);
  if (lesson.quiz.length !== 5) errors.push(`${lesson.id}: expected 5 quiz questions`);

  const stage = lesson.curriculumStage ?? 0;
  const allowedLevels: Record<number, string[]> = {
    1: ['A1'],
    2: ['A2', 'B1'],
    3: ['B2'],
    4: ['C1'],
  };
  if (!allowedLevels[stage]?.includes(lesson.level)) {
    errors.push(`${lesson.id}: level ${lesson.level} does not fit stage ${stage}`);
  }
  if (lesson.dialogue.some((line) => !line.textEn.trim() || !line.textAr.trim())) {
    errors.push(`${lesson.id}: empty dialogue line`);
  }

  const arrange = lesson.quiz.find((question) => question.type === 'arrange_sentence');
  if (arrange) {
    const structureWords = arrange.correctAnswer.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);
    if (structureWords.length < 3 || structureWords.length > 12) {
      errors.push(`${lesson.id}: arrange sentence has ${structureWords.length} words`);
    }
    if (!arrange.promptAr) errors.push(`${lesson.id}: arrange question has no Arabic prompt`);
  }

  for (const word of lesson.vocabulary) {
    if (!word.translationAr.trim()) errors.push(`${lesson.id}: ${word.word} has no Arabic meaning`);
    if (!word.exampleSentenceAr.trim()) errors.push(`${lesson.id}: ${word.word} has no example translation`);
    if (!word.phonetic.trim()) errors.push(`${lesson.id}: ${word.word} has no IPA`);

    if (isExpansion) {
      if (!normalize(word.exampleSentence).includes(normalize(word.word))) {
        errors.push(`${lesson.id}: ${word.word} is absent from its example`);
      }
    }
  }

  if (isExpansion) {
    const meanings = lesson.vocabulary.map((word) => normalize(word.translationAr));
    if (new Set(meanings).size !== meanings.length) {
      errors.push(`${lesson.id}: duplicate Arabic meanings make the MCQ ambiguous`);
    }
    const headwords = lesson.vocabulary.map((word) => normalize(word.word));
    if (new Set(headwords).size !== headwords.length) {
      errors.push(`${lesson.id}: duplicate headwords`);
    }

    const fill = lesson.quiz.find((question) => question.type === 'fill_blank');
    if (fill) {
      const answerWord = lesson.vocabulary.find(
        (word) => normalize(word.word) === normalize(fill.correctAnswer),
      );
      if (!answerWord) {
        errors.push(`${lesson.id}: fill answer "${fill.correctAnswer}" is not in the vocabulary`);
      }
    }

    if (arrange) {
      const targetTokens = normalize(arrange.correctAnswer).split(' ').filter(Boolean).sort();
      const optionTokens = arrange.options.map((option) => normalize(option)).filter(Boolean).sort();
      if (targetTokens.join(' ') !== optionTokens.join(' ')) {
        errors.push(`${lesson.id}: arrange tokens do not rebuild "${arrange.correctAnswer}"`);
      }
    }
  }
}

const expectedStages = [1, 2, 3, 4];
for (const stage of expectedStages) {
  const count = byStage.get(stage) ?? 0;
  if (count !== 125) errors.push(`stage ${stage}: expected 125 lessons, found ${count}`);
}

if (LEARNING_PATH_LESSONS.length !== 500) {
  errors.push(`expected 400 lessons, found ${LEARNING_PATH_LESSONS.length}`);
}

if (errors.length) {
  console.error(`[curriculum] ${errors.length} issue(s):`);
  for (const error of errors.slice(0, 80)) console.error(`  - ${error}`);
  if (errors.length > 80) console.error(`  ... and ${errors.length - 80} more`);
  process.exitCode = 1;
} else {
  console.info(
    `[curriculum] OK — ${LEARNING_PATH_LESSONS.length} lessons (${expectedStages
      .map((stage) => `${byStage.get(stage)} in stage ${stage}`)
      .join(', ')}).`,
  );
}
