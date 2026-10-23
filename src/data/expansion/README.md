# Expanded curriculum — authoring guide

This folder holds the first 184 expansion lessons (46 per stage). Together with
the four original lessons per stage they cover **lessons 1–50**. Lessons 51–100
are generated in `../expansionPlus/`, bringing each stage to **100 lessons** and
the curriculum to **400 lessons**.

Each stage is split into two files so a single file stays reviewable:

| Stage | Files | Export |
| --- | --- | --- |
| 1 · A1 | `stage1a.ts`, `stage1b.ts` | `STAGE_1A_LESSONS`, `STAGE_1B_LESSONS` |
| 2 · A2–B1 | `stage2a.ts`, `stage2b.ts` | `STAGE_2A_LESSONS`, `STAGE_2B_LESSONS` |
| 3 · B2 | `stage3a.ts`, `stage3b.ts` | `STAGE_3A_LESSONS`, `STAGE_3B_LESSONS` |
| 4 · C1–C2 | `stage4a.ts`, `stage4b.ts` | `STAGE_4A_LESSONS`, `STAGE_4B_LESSONS` |

> The 4 existing lessons of each stage stay in `src/data/curriculumContent.ts`.
> These files add lessons 5–50 only.

## Source format

Use `ExpansionLessonSpec` from `./types.ts` and `expansionLesson(...)` for type
checking. Do **not** add `phonetic` or quiz data: the builder derives the IPA,
the six dialogue lines (opening + four examples + closing) and the four quiz
questions automatically.

```ts
import { expansionLesson, type ExpansionLessonSpec } from './types';

export const STAGE_1A_LESSONS: ExpansionLessonSpec[] = [
  expansionLesson({
    id: 'a1-l5-family',
    slug: 'family-and-people',
    stage: 1,
    level: 'A1',
    title: 'Family & People',
    titleAr: 'العائلة والأشخاص',
    descriptionAr: 'تعرّف على أفراد العائلة ووصفهم بجمل بسيطة مع ليو وجيجي.',
    objectiveAr: 'تسمية أفراد العائلة ووصفهم بجمل قصيرة.',
    structureEn: 'This is my mother.',
    structureAr: 'هذه أمي.',
    methodNoteAr: 'استخدم This is مع المفرد وThese are مع الجمع.',
    category: 'greetings',
    scene: 'park',
    openingEn: 'Look at my family photo, Leo!',
    openingAr: 'انظر إلى صورة عائلتي يا ليو!',
    words: [
      ['mother', 'اسم', 'أم', 'This is my mother.', 'هذه أمي.'],
      ['father', 'اسم', 'أب', 'My father works in a bank.', 'أبي يعمل في بنك.'],
      ['brother', 'اسم', 'أخ', 'I have one brother.', 'لدي أخ واحد.'],
      ['sister', 'اسم', 'أخت', 'My sister is ten years old.', 'أختي عمرها عشر سنوات.'],
    ],
    closingEn: 'Family time is the best time!',
    closingAr: 'وقت العائلة هو أفضل وقت!',
  }),
];
```

## Hard requirements

1. **Exactly 23 lessons per file** (46 per stage, 5–50).
2. **Exactly 4 words per lesson**, each row has 5 strings:
   `[word, partOfSpeech, translationAr, exampleSentence, exampleSentenceAr]`.
3. `exampleSentence` must contain `word` exactly (case-insensitive substring).
   The builder blanks this word for the fill-in question.
4. Read `openingEn` → four examples → `closingEn` as **one coherent
   mini-dialogue**, not four dictionary examples. Examples should sound like
   things a person says in that situation.
5. `structureEn` is used by the arrange exercise: **one clean sentence, 4–10
   words**, no slashes, brackets, arrows or "X / Y" patterns. `structureAr` is
   its natural translation.
6. Keep the four Arabic meanings in a lesson distinct (they become MCQ options).
7. `descriptionAr`, `objectiveAr`, `methodNoteAr` are learner-facing Arabic.
   `descriptionAr` mentions the characters/scene naturally when it helps.
8. No IPA, no quiz, no audio. No duplicate ids/slugs inside the file and no
   ids that already exist in `curriculumContent.ts`.
9. Ids are sequential: `a1-l5-...` … `a1-l50-...`, `a2-l5-...` … `a2-l50-...`,
   `b2-l5-...` … `b2-l50-...`, `c1-l5-...` … `c1-l50-...`.
10. Stage 2 mixes `level: 'A2'` (lessons 5–27) and `'B1'` (28–50). Stage 4 uses
    `'C1'` (`Level` has no C2).

## Level voice

- **Stage 1 (A1, Leo & Gigi, children):** 3–7 word sentences, present simple,
  `This is / I have / It is`, concrete nouns. Avoid idioms and abstract words.
- **Stage 2 (A2–B1, Alex & Maya):** 6–12 word sentences, everyday situations,
  past/future/modals/comparatives as the topic requires. Natural but simple.
- **Stage 3 (B2, Sarah & David):** 9–16 word sentences, opinions, conditionals,
  passive voice, linking words, common idioms used in context.
- **Stage 4 (C1–C2, Dr. Arthur & Elena):** 12–20 word sentences, academic and
  professional register, hedging, nuanced argument, rhetoric. Precise Arabic.

## Categories and scenes

`category`: `greetings` | `travel` | `food` | `work` | `shopping` | `health` |
`idioms` | `grammar`

`scene`: `cafe` | `airport` | `office` | `street` | `shop` | `clinic` | `park` |
`classroom`

Pick what fits the topic; vary them across the file.

## Topic list

### Stage 1 — lessons 5–50

`stage1a.ts` (5–27):
Family & People · My Body · My Classroom · Toys & Games · Zoo Animals · Fruits ·
Vegetables · Food & Drink · Clothes · Weather · Days of the Week · Months &
Seasons · My House · Rooms & Furniture · Feelings · Greetings & Polite Words ·
My Daily Routine · Telling Time · School Subjects · My Friends · Pets · Farm
Animals · At the Park

`stage1b.ts` (28–50):
At the Beach · Birthdays · Nature Colors · Shapes Around Us · Big & Small ·
Hot & Cold · Fast & Slow · My Favorite Things · Abilities: Can & Can't · Likes &
Dislikes · This & That · In, On, Under · Counting to 20 · My Morning · My Evening ·
Healthy Habits · Safety Rules · Family Activities · At the Supermarket ·
In the Kitchen · At the Doctor · Helping at Home · Review & Celebration

### Stage 2 — lessons 5–50

`stage2a.ts` (5–27):
Future Plans · Present Continuous · Comparatives & Superlatives · Modals:
can/could/must/should · Shopping for Clothes · At the Supermarket · Making
Appointments · Phone Calls · Invitations · Travel Plans · At the Airport · Hotel
Check-in · At the Train Station · Asking for Help · Describing People ·
Describing Places · Hobbies & Free Time · Sports & Fitness · Health & Illness ·
At the Pharmacy · Healthy Eating · Cooking a Recipe · School Life

`stage2b.ts` (28–50):
Jobs & Work · A Job Interview · Money & Budgeting · Online Shopping · Technology
& Devices · Social Media · Email & Messages · Booking a Table · At the Café ·
Weather & Seasons · City vs Countryside · Transportation · Giving Advice ·
Making Suggestions · Expressing Surprise · Talking About the Weekend · Past
Experiences · Future Predictions · Making Plans with Friends · Past Habits ·
Telling a Story · Problem Solving · Review & Showcase

### Stage 3 — lessons 5–50

`stage3a.ts` (5–27):
Technology & Society · Artificial Intelligence · Media & Fake News · Advertising
& Persuasion · Education Systems · Work-Life Balance · Career Development ·
Leadership & Teamwork · Negotiation Skills · Consumer Rights · Globalization ·
Cultural Differences · Social Justice · Volunteering · Mental Health ·
Relationships · Risk & Decision Making · Innovation & Entrepreneurship · Money
& Ethics · Climate Change · Renewable Energy · Sustainable Living · Travel &
Tourism

`stage3b.ts` (28–50):
Migration · Urbanization · Food Culture · Literature & Storytelling · Art &
Creativity · Music & Identity · Film & Criticism · Science & Discovery · Space
Exploration · Privacy & Security · Freedom of Speech · Crime & Punishment ·
Sports & Fair Play · Health & Lifestyle · Genetic Engineering · Aging Population ·
Education & Technology · Remote Work Debate · Social Media Debate · AI Regulation
Debate · Presentation Skills · Critical Thinking · Review & Debate Championship

### Stage 4 — lessons 5–50

`stage4a.ts` (5–27):
Diplomacy & Tact · Strategic Communication · Crisis Management · Executive
Leadership · Corporate Governance · Behavioral Economics · Macroeconomics ·
Entrepreneurship & Venture Capital · International Law · Human Rights Discourse ·
Political Rhetoric · Persuasion & Framing · Cognitive Bias · Philosophy of Mind ·
Ethics of AI · Bioethics · Climate Diplomacy · Geopolitics · Migration Policy ·
Global Health · Higher Education Reform · Research Methodology · Data
Interpretation

`stage4b.ts` (28–50):
Statistical Literacy · Literary Analysis · Poetics & Metaphor · Narrative
Structure · Film Theory · Art Criticism · Musicology · Linguistics & Language
Change · Semiotics · Journalism Ethics · Investigative Reporting · Memoir &
Personal Essay · Satire & Irony · Negotiating Across Cultures · Conflict
Resolution · Mediation & Facilitation · Public Speaking Mastery · The Art of the
Argument · Rhetorical Devices · Strategic Storytelling · Legacy & Reputation ·
The Future of Work · Capstone: Global Summit

## Validation

Run this after writing each file (replace the path/export):

```bash
npx tsx -e "import { STAGE_1A_LESSONS as L } from './src/data/expansion/stage1a.ts'; const bad=L.filter(l=>l.words.length!==4||!l.structureEn||!l.openingEn||!l.closingEn); const missing=L.flatMap(l=>l.words.filter(w=>!w[3].toLowerCase().includes(w[0].toLowerCase()))); console.log('count',L.length,'bad',bad.length,'missing word in example',missing.length);"
```

Expected: `count 23 bad 0 missing word in example 0`.
