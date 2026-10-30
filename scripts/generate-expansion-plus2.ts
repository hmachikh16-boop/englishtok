import { CURRICULUM_LESSONS } from '../src/data/curriculumContent';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const LEVELS = ['A1', 'A2', 'B2', 'C1'] as const;
const COUNT_PER_STAGE = 25;

const wordsToTuple = (word: any) => [
  word.word,
  word.partOfSpeech,
  word.translationAr,
  word.exampleSentence,
  word.exampleSentenceAr,
  word.phonetic || undefined,
];

const buildSpec = (stage: number, index: number, a: any, b: any) => {
  const wordsA = (a.vocabulary || []).slice(0, 2);
  const wordsB = (b.vocabulary || []).slice(0, 2);
  const words = [...wordsA, ...wordsB].map(wordsToTuple);
  if (words.length < 4) return null;
  const id = `stage${stage}-bridge-${index + 1}`;
  return `  expansionLesson({
    id: "${id}",
    slug: "${id}",
    stage: ${stage},
    level: "${LEVELS[stage - 1]}",
    title: "Bridge: ${a.title} x ${b.title}",
    titleAr: "جسر تدريبي: ${a.titleAr} × ${b.titleAr}",
    descriptionAr: "درس توسعة يربط بين «${a.titleAr}» و«${b.titleAr}» في حوار وتمارين جديدة.",
    objectiveAr: "توظيف مفردات «${a.titleAr}» و«${b.titleAr}» معًا في جمل وحوار قصير.",
    structureEn: "We can use these words together.",
    structureAr: "يمكننا استخدام هذه الكلمات معًا.",
    methodNoteAr: "راجع الكلمات أولًا، ثم استخدمها في جمل من إنشائك.",
    category: "${a.category || 'vocabulary'}",
    scene: "${a.scene || 'classroom'}",
    openingEn: "Hello! Let's practise two lessons together today.",
    openingAr: "مرحبًا! لنتدرب على درسين معًا اليوم.",
    words: [
${words.map((w) => `      [${w.map((x) => (x === undefined ? 'undefined' : JSON.stringify(x))).join(', ')}],`).join('\n')}
    ],
    closingEn: "Great job! Say these words again at home.",
    closingAr: "أحسنت! قل هذه الكلمات مرة أخرى في المنزل.",
    skipFillAudio: true,
  }),`;
};

const main = () => {
  const outDir = resolve(process.cwd(), 'src/data/expansionPlus2');
  mkdirSync(outDir, { recursive: true });

  for (let stage = 1; stage <= 4; stage++) {
    const lessons = CURRICULUM_LESSONS.filter((l: any) => (l.curriculumStage ?? 1) === stage);
    const specs: string[] = [];
    for (let i = 0; i < COUNT_PER_STAGE; i++) {
      const a = lessons[i % lessons.length];
      const b = lessons[(i + 7) % lessons.length];
      const spec = buildSpec(stage, i, a, b);
      if (spec) specs.push(spec);
    }
    const content = `import { expansionLesson, type ExpansionLessonSpec } from '../expansion/types';

/**
 * Stage ${stage} extensions · auto-generated bridge lessons.
 * Reuses existing vocabulary/audio to keep the speech pack compact.
 */
export const STAGE_${stage}_PLUS2_LESSONS: ExpansionLessonSpec[] = [
${specs.join('\n')}
];
`;
    writeFileSync(resolve(outDir, `stage${stage}.ts`), content, 'utf8');
    console.log(`Generated ${specs.length} lessons for stage ${stage}`);
  }
};

main();