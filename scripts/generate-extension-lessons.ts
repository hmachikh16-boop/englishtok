/**
 * Build the 200 extension lessons (50 per stage) that carry every stage from
 * 50 to 100 lessons. Vocabulary and example sentences are deliberately reused
 * from the existing curriculum: every bundled audio clip already exists, so the
 * new lessons work offline without a second large speech pack. New openings and
 * closings are the only freshly generated clips.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEARNING_PATH_LESSONS } from '../src/data/curriculum';
import type { Lesson, VocabularyWord } from '../src/types';

const STAGE_PREFIX = ['a1', 'a2', 'b2', 'c1'] as const;

const OPENERS: Record<number, readonly { en: string; ar: string }[]> = {
  1: [
    { en: "Hello! Let's practise two lessons together today.", ar: 'مرحبًا! لنتدرب على درسين معًا اليوم.' },
    { en: 'Are you ready to connect these words?', ar: 'هل أنت مستعد لربط هذه الكلمات؟' },
    { en: "Let's build a new conversation with our words.", ar: 'لنبنِ محادثة جديدة بكلماتنا.' },
    { en: "Let's use both lessons in one short chat.", ar: 'لنستخدم الدرسين في محادثة قصيرة واحدة.' },
    { en: 'We have two sets of words. Let us mix them!', ar: 'لدينا مجموعتان من الكلمات. لنمزجهما!' },
  ],
  2: [
    { en: "Let's connect these two situations in one conversation.", ar: 'لنربط هذين الموقفين في محادثة واحدة.' },
    { en: 'Can you combine what we learned in both lessons?', ar: 'هل يمكنك دمج ما تعلمناه في الدرسين؟' },
    { en: "Let's practise these ideas in a realistic situation.", ar: 'لنتدرب على هذه الأفكار في موقف واقعي.' },
    { en: "Let's move between both topics naturally.", ar: 'لنتنقل بين الموضوعين بشكل طبيعي.' },
    { en: 'Here is a chance to use everything from both lessons.', ar: 'هذه فرصة لاستخدام كل شيء من الدرسين.' },
  ],
  3: [
    { en: "Let's bring these two themes into a single discussion.", ar: 'لنجمع هذين الموضوعين في نقاش واحد.' },
    { en: 'How do these two issues influence each other?', ar: 'كيف يؤثر هذان الموضوعان في بعضهما؟' },
    { en: "Let's test these ideas against a more complex scenario.", ar: 'لنختبر هذه الأفكار في سيناريو أكثر تعقيدًا.' },
    { en: "Let's connect the two arguments rather than separate them.", ar: 'لنربط الحجتين بدلًا من فصلهما.' },
    { en: 'Which idea from each lesson strengthens the other?', ar: 'أي فكرة من كل درس تعزز الأخرى؟' },
  ],
  4: [
    { en: 'Let us examine how these two domains illuminate one another.', ar: 'لنفحص كيف يضيء هذان المجالان أحدهما الآخر.' },
    { en: 'What happens when we place these concepts in the same frame?', ar: 'ماذا يحدث عندما نضع هذين المفهومين في إطار واحد؟' },
    { en: 'Let us push these ideas toward their limits.', ar: 'لندفع هذه الأفكار نحو حدودها.' },
    { en: 'Let us test whether these frameworks can coexist.', ar: 'لنختبر ما إذا كان هذان الإطاران يمكن أن يتعايشا.' },
    { en: 'Where do these two lines of thought converge?', ar: 'أين يتقارب هذان الخطان من التفكير؟' },
  ],
};

const CLOSERS: Record<number, readonly { en: string; ar: string }[]> = {
  1: [
    { en: 'Great job! Say these words again at home.', ar: 'أحسنت! قل هذه الكلمات مرة أخرى في المنزل.' },
    { en: 'Well done! You used the new words beautifully.', ar: 'أحسنت! استخدمت الكلمات الجديدة بجمال.' },
    { en: 'Perfect! Now try the same conversation with a friend.', ar: 'ممتاز! جرّب المحادثة نفسها مع صديق.' },
    { en: 'Excellent! Try one more sentence before you go.', ar: 'ممتاز! جرّب جملة أخرى قبل أن تذهب.' },
    { en: 'Brilliant! You are building longer conversations.', ar: 'رائع! أنت تبني محادثات أطول.' },
  ],
  2: [
    { en: 'Good work! Use these phrases in your next real conversation.', ar: 'عمل جيد! استخدم هذه العبارات في محادثتك الحقيقية القادمة.' },
    { en: 'Exactly! That is how fluent speakers link ideas.', ar: 'بالضبط! هكذا يربط المتحدثون الطلقاء الأفكار.' },
    { en: 'Nice! Keep practising until the phrases feel natural.', ar: 'رائع! واصل التدريب حتى تصبح العبارات طبيعية.' },
    { en: 'That sounded natural. Keep the connection in mind.', ar: 'بدا ذلك طبيعيًا. تذكّر هذا الارتباط.' },
    { en: 'Strong work! Real conversations mix topics like this.', ar: 'عمل قوي! المحادثات الحقيقية تمزج الموضوعات هكذا.' },
  ],
  3: [
    { en: 'Good. A strong argument connects ideas rather than listing them.', ar: 'جيد. الحجة القوية تربط الأفكار بدلًا من سردها.' },
    { en: 'Exactly. That connection is where the real analysis begins.', ar: 'بالضبط. من هذا الارتباط يبدأ التحليل الحقيقي.' },
    { en: 'Well argued. Now consider the strongest objection.', ar: 'حجة جيدة. فكّر الآن في أقوى اعتراض.' },
    { en: 'Good. Now ask what each argument overlooks.', ar: 'جيد. اسأل الآن عمّا تغفله كل حجة.' },
    { en: 'Thoughtful. That is the beginning of a nuanced position.', ar: 'مدروس. هذه بداية موقف دقيق.' },
  ],
  4: [
    { en: 'Precisely. Nuance emerges when we refuse to isolate them.', ar: 'بدقة. يظهر الفرق الدقيق حين نرفض عزلهما.' },
    { en: 'Good. The tension between them is more revealing than either alone.', ar: 'جيد. التوتر بينهما أكثر كشفًا من كل منهما منفردًا.' },
    { en: 'Excellent. Now defend the conclusion against its best counterargument.', ar: 'ممتاز. دافع الآن عن الاستنتاج أمام أقوى حجة مضادة.' },
    { en: 'Good. Coexistence is not agreement, but it is a start.', ar: 'جيد. التعايش ليس اتفاقًا، لكنه بداية.' },
    { en: 'Excellent. Now map where they diverge.', ar: 'ممتاز. ارسم الآن موضع اختلافهما.' },
  ],
};

const TITLE_PREFIXES = [
  { en: 'Bridge', ar: 'جسر تدريبي' },
  { en: 'Link', ar: 'رابط تطبيقي' },
  { en: 'Practice', ar: 'تدريب موسّع' },
  { en: 'Workshop', ar: 'ورشة لغوية' },
  { en: 'Challenge', ar: 'تحدٍ متكامل' },
] as const;

const STRUCTURE_FALLBACK: Record<number, { en: string; ar: string }> = {
  1: { en: 'We can use these words together.', ar: 'يمكننا استخدام هذه الكلمات معًا.' },
  2: { en: "Let's connect these ideas in a conversation.", ar: 'لنربط هذه الأفكار في محادثة.' },
  3: { en: 'These ideas deserve a careful discussion.', ar: 'تستحق هذه الأفكار نقاشًا دقيقًا.' },
  4: { en: 'A precise argument connects evidence and consequence.', ar: 'الحجة الدقيقة تربط الدليل والنتيجة.' },
};

const structureFor = (lesson: Lesson): { en: string; ar: string } => {
  const match = /البنية: (.+?) \((.+?)\)\./.exec(lesson.learningNoteAr ?? '');
  const rawEn = match?.[1] ?? '';
  const rawAr = match?.[2] ?? '';
  // The four original lessons in each stage sometimes use a topic label
  // ("Hedging & Diplomatic Language.") instead of a model sentence. Do not
  // turn those labels into an arrange exercise.
  const lessonNumber = Number(/-l(\d+)-/.exec(lesson.id)?.[1] ?? 0);
  if (lessonNumber <= 4 || !rawEn || /[&+\[\]→←]/.test(rawEn)) {
    return STRUCTURE_FALLBACK[lesson.curriculumStage ?? 1] ?? STRUCTURE_FALLBACK[1];
  }
  const en = rawEn
    .replace(/\s*\/\s*/g, ' and ')
    .replace(/[→←—]/g, ' ')
    .replace(/\[([^\]]+)\]/g, (_match, value: string) => value.split(/\s+/)[0] || 'name')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = en.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean).length;
  if (!en || wordCount < 3 || wordCount > 12) {
    return STRUCTURE_FALLBACK[lesson.curriculumStage ?? 1] ?? STRUCTURE_FALLBACK[1];
  }
  return { en, ar: rawAr || STRUCTURE_FALLBACK[lesson.curriculumStage ?? 1].ar };
};

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[.,!?;:’']/g, '').replace(/\s+/g, ' ').trim();

const uniqueWords = (lessonA: Lesson, lessonB: Lesson): VocabularyWord[] => {
  const pool = [
    ...lessonA.vocabulary.slice(0, 2),
    ...lessonB.vocabulary.slice(0, 2),
    ...lessonA.vocabulary.slice(2),
    ...lessonB.vocabulary.slice(2),
  ];
  const seen = new Set<string>();
  const seenMeanings = new Set<string>();
  const result: VocabularyWord[] = [];
  for (const word of pool) {
    const key = word.word.trim().toLowerCase();
    const meaning = word.translationAr.trim().toLowerCase();
    if (
      !key ||
      !word.phonetic.trim() ||
      !normalize(word.exampleSentence).includes(normalize(word.word)) ||
      seen.has(key) ||
      seenMeanings.has(meaning)
    ) continue;
    seen.add(key);
    seenMeanings.add(meaning);
    result.push(word);
    if (result.length === 4) break;
  }
  return result;
};

const quote = (value: string): string => JSON.stringify(value);

const tuple = (word: VocabularyWord): string =>
  `      [${quote(word.word)}, ${quote(word.partOfSpeech)}, ${quote(word.translationAr)}, ${quote(word.exampleSentence)}, ${quote(word.exampleSentenceAr)}, ${quote(word.phonetic)}],`;

const oldLessonsByStage = new Map<number, Lesson[]>();
for (const lesson of LEARNING_PATH_LESSONS) {
  const numberMatch = /-l(\d+)-/.exec(lesson.id);
  const number = numberMatch ? Number(numberMatch[1]) : 0;
  if (!lesson.curriculumStage || number < 1 || number > 50) continue;
  const bucket = oldLessonsByStage.get(lesson.curriculumStage) ?? [];
  bucket.push(lesson);
  oldLessonsByStage.set(lesson.curriculumStage, bucket);
}

for (const [stage, lessons] of oldLessonsByStage) {
  lessons.sort((left, right) => {
    const leftNumber = Number(/-l(\d+)-/.exec(left.id)?.[1] ?? 0);
    const rightNumber = Number(/-l(\d+)-/.exec(right.id)?.[1] ?? 0);
    return leftNumber - rightNumber;
  });
}

const generated: string[] = [];

for (let stage = 1; stage <= 4; stage += 1) {
  const lessons = oldLessonsByStage.get(stage) ?? [];
  if (lessons.length !== 50) {
    throw new Error(`Stage ${stage} has ${lessons.length} base lessons, expected 50.`);
  }
  const prefix = STAGE_PREFIX[stage - 1];
  const entries: string[] = [];
  for (let index = 0; index < 50; index += 1) {
    const lessonA = lessons[index];
    const lessonB = lessons[(index + 1) % lessons.length];
    const number = 51 + index;
    const words = uniqueWords(lessonA, lessonB);
    if (words.length !== 4) {
      throw new Error(`Could not find four unique words for stage ${stage} lesson ${number}.`);
    }
    const titlePrefix = TITLE_PREFIXES[index % TITLE_PREFIXES.length];
    const structure = structureFor(lessonA);
    const opening = OPENERS[stage][index % OPENERS[stage].length];
    const closing = CLOSERS[stage][index % CLOSERS[stage].length];
    const id = `${prefix}-l${number}-extension`;
    const slug = `extension-${number}-${lessonA.slug}-${lessonB.slug}`;
    entries.push(`  expansionLesson({
    id: ${quote(id)},
    slug: ${quote(slug)},
    stage: ${stage},
    level: ${quote(lessonA.level)},
    title: ${quote(`${titlePrefix.en}: ${lessonA.title} × ${lessonB.title}`)},
    titleAr: ${quote(`${titlePrefix.ar}: ${lessonA.titleAr} × ${lessonB.titleAr}`)},
    descriptionAr: ${quote(`درس توسعة يربط بين «${lessonA.titleAr}» و«${lessonB.titleAr}» في حوار وتمارين جديدة.`)},
    objectiveAr: ${quote(`توظيف مفردات «${lessonA.titleAr}» و«${lessonB.titleAr}» معًا في جمل وحوار قصير.`)},
    structureEn: ${quote(structure.en)},
    structureAr: ${quote(structure.ar)},
    methodNoteAr: 'راجع الكلمات أولًا، ثم استخدمها في جمل من إنشائك.',
    category: ${quote(lessonA.category)},
    scene: ${quote(lessonA.sceneType)},
    openingEn: ${quote(opening.en)},
    openingAr: ${quote(opening.ar)},
    words: [
${words.map(tuple).join('\n')}
    ],
    closingEn: ${quote(closing.en)},
    closingAr: ${quote(closing.ar)},
    skipFillAudio: true,
  }),`);
  }
  const contents = `import { expansionLesson, type ExpansionLessonSpec } from '../expansion/types';

/**
 * Stage ${stage} extensions · lessons 51–100.
 *
 * Each lesson links the vocabulary of two adjacent base lessons. The examples
 * and audio are reused from the base curriculum; only the framing lines are
 * new, which keeps the offline speech pack compact.
 */
export const STAGE_${stage}_PLUS_LESSONS: ExpansionLessonSpec[] = [
${entries.join('\n')}
];
`;
  generated.push(contents);
}

const outputDir = resolve(process.cwd(), 'src/data/expansionPlus');
mkdirSync(outputDir, { recursive: true });
for (let stage = 1; stage <= 4; stage += 1) {
  writeFileSync(resolve(outputDir, `stage${stage}.ts`), generated[stage - 1], 'utf8');
}
console.info(`Generated ${generated.length * 50} extension lessons in ${outputDir}.`);
