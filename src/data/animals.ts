/**
 * The hundred animals that appear on EnglishTok's collectible motivation
 * cards. Each stage owns a distinct 25-animal habitat, so opening the next
 * stage feels like discovering a new part of the animal kingdom.
 *
 * The vector artwork lives in public/animals and is derived from Twemoji
 * (CC-BY 4.0). Keeping the species metadata here makes the collection easy to
 * audit: there are exactly 100 unique ids and 100 unique cards.
 */

export type AnimalGroup = 'home' | 'safari' | 'ocean' | 'legend';

export interface AnimalProfile {
  /** Stable slug used by the card id and the asset file name. */
  id: string;
  nameAr: string;
  nameEn: string;
  /** File inside public/animals. */
  asset: string;
  group: AnimalGroup;
  /** A short label used in the card gallery filters. */
  groupAr: string;
}

const home = (id: string, nameAr: string, nameEn: string, asset: string): AnimalProfile => ({
  id,
  nameAr,
  nameEn,
  asset,
  group: 'home',
  groupAr: 'البيت والغابة',
});

const safari = (id: string, nameAr: string, nameEn: string, asset: string): AnimalProfile => ({
  id,
  nameAr,
  nameEn,
  asset,
  group: 'safari',
  groupAr: 'السفاري والأدغال',
});

const ocean = (id: string, nameAr: string, nameEn: string, asset: string): AnimalProfile => ({
  id,
  nameAr,
  nameEn,
  asset,
  group: 'ocean',
  groupAr: 'المحيط والقطب',
});

const legend = (id: string, nameAr: string, nameEn: string, asset: string): AnimalProfile => ({
  id,
  nameAr,
  nameEn,
  asset,
  group: 'legend',
  groupAr: 'الأساطير والحيوانات النادرة',
});

/** 25 friendly animals for the first steps of the journey. */
const HOME_ANIMALS: readonly AnimalProfile[] = [
  home('dog', 'الكلب', 'Dog', 'dog.svg'),
  home('cat', 'القطة', 'Cat', 'cat.svg'),
  home('rabbit', 'الأرنب', 'Rabbit', 'rabbit.svg'),
  home('hamster', 'الهامستر', 'Hamster', 'hamster.svg'),
  home('mouse', 'الفأر', 'Mouse', 'mouse.svg'),
  home('squirrel', 'السنجاب', 'Squirrel', 'squirrel.svg'),
  home('hedgehog', 'القنفذ', 'Hedgehog', 'hedgehog.svg'),
  home('fox', 'الثعلب', 'Fox', 'fox.svg'),
  home('deer', 'الأيل', 'Deer', 'deer.svg'),
  home('owl', 'البومة', 'Owl', 'owl.svg'),
  home('duck', 'البطة', 'Duck', 'duck.svg'),
  home('chicken', 'الدجاجة', 'Chicken', 'chicken.svg'),
  home('turkey', 'الديك الرومي', 'Turkey', 'turkey.svg'),
  home('pig', 'الخنزير', 'Pig', 'pig.svg'),
  home('cow', 'البقرة', 'Cow', 'cow.svg'),
  home('horse', 'الحصان', 'Horse', 'horse.svg'),
  home('sheep', 'الخروف', 'Sheep', 'sheep.svg'),
  home('goat', 'العنزة', 'Goat', 'goat.svg'),
  home('beaver', 'القندس', 'Beaver', 'beaver.svg'),
  home('raccoon', 'الراكون', 'Raccoon', 'raccoon.svg'),
  home('badger', 'الغرير', 'Badger', 'badger.svg'),
  home('skunk', 'الظربان', 'Skunk', 'skunk.svg'),
  home('otter', 'ثعلب الماء', 'Otter', 'otter.svg'),
  home('bat', 'الخفاش', 'Bat', 'bat.svg'),
  home('frog', 'الضفدع', 'Frog', 'frog.svg'),
];

/** 25 animals that make the middle of the path feel like an expedition. */
const SAFARI_ANIMALS: readonly AnimalProfile[] = [
  safari('lion', 'الأسد', 'Lion', 'lion.svg'),
  safari('tiger', 'النمر', 'Tiger', 'tiger.svg'),
  safari('leopard', 'الفهد', 'Leopard', 'leopard.svg'),
  safari('elephant', 'الفيل', 'Elephant', 'elephant.svg'),
  safari('giraffe', 'الزرافة', 'Giraffe', 'giraffe.svg'),
  safari('zebra', 'الحمار الوحشي', 'Zebra', 'zebra.svg'),
  safari('monkey', 'القرد', 'Monkey', 'monkey.svg'),
  safari('gorilla', 'الغوريلا', 'Gorilla', 'gorilla.svg'),
  safari('orangutan', 'إنسان الغاب', 'Orangutan', 'orangutan.svg'),
  safari('rhino', 'وحيد القرن', 'Rhinoceros', 'rhino.svg'),
  safari('hippo', 'فرس النهر', 'Hippopotamus', 'hippo.svg'),
  safari('crocodile', 'التمساح', 'Crocodile', 'crocodile.svg'),
  safari('snake', 'الأفعى', 'Snake', 'snake.svg'),
  safari('camel', 'الجمل', 'Camel', 'camel.svg'),
  safari('llama', 'اللاما', 'Llama', 'llama.svg'),
  safari('kangaroo', 'الكنغر', 'Kangaroo', 'kangaroo.svg'),
  safari('koala', 'الكوالا', 'Koala', 'koala.svg'),
  safari('panda', 'الباندا', 'Panda', 'panda.svg'),
  safari('sloth', 'الكسلان', 'Sloth', 'sloth.svg'),
  safari('bison', 'البيسون', 'Bison', 'bison.svg'),
  safari('buffalo', 'الجاموس', 'Water Buffalo', 'buffalo.svg'),
  safari('flamingo', 'الفلامنجو', 'Flamingo', 'flamingo.svg'),
  safari('peacock', 'الطاووس', 'Peacock', 'peacock.svg'),
  safari('parrot', 'الببغاء', 'Parrot', 'parrot.svg'),
  safari('lizard', 'السحلية', 'Lizard', 'lizard.svg'),
];

/** 25 ocean, polar, bird and small-creature cards for the mastery stage. */
const OCEAN_ANIMALS: readonly AnimalProfile[] = [
  ocean('whale', 'الحوت', 'Whale', 'whale.svg'),
  ocean('dolphin', 'الدلفين', 'Dolphin', 'dolphin.svg'),
  ocean('shark', 'القرش', 'Shark', 'shark.svg'),
  ocean('octopus', 'الأخطبوط', 'Octopus', 'octopus.svg'),
  ocean('squid', 'الحبار', 'Squid', 'squid.svg'),
  ocean('crab', 'السلطعون', 'Crab', 'crab.svg'),
  ocean('lobster', 'الكركند', 'Lobster', 'lobster.svg'),
  ocean('shrimp', 'الروبيان', 'Shrimp', 'shrimp.svg'),
  ocean('seal', 'الفقمة', 'Seal', 'seal.svg'),
  ocean('penguin', 'البطريق', 'Penguin', 'penguin.svg'),
  ocean('polar-bear', 'الدب القطبي', 'Polar Bear', 'polar-bear.svg'),
  ocean('eagle', 'العقاب', 'Eagle', 'eagle.svg'),
  ocean('swan', 'البجعة', 'Swan', 'swan.svg'),
  ocean('dove', 'الحمامة', 'Dove', 'dove.svg'),
  ocean('fish', 'السمكة', 'Fish', 'fish.svg'),
  ocean('tropical-fish', 'السمكة الملونة', 'Tropical Fish', 'tropical-fish.svg'),
  ocean('blowfish', 'السمكة المنتفخة', 'Blowfish', 'blowfish.svg'),
  ocean('oyster', 'المحار', 'Oyster', 'oyster.svg'),
  ocean('snail', 'الحلزون', 'Snail', 'snail.svg'),
  ocean('turtle', 'السلحفاة', 'Turtle', 'turtle.svg'),
  ocean('scorpion', 'العقرب', 'Scorpion', 'scorpion.svg'),
  ocean('butterfly', 'الفراشة', 'Butterfly', 'butterfly.svg'),
  ocean('bee', 'النحلة', 'Bee', 'bee.svg'),
  ocean('ladybug', 'الدعسوقة', 'Ladybug', 'ladybug.svg'),
  ocean('spider', 'العنكبوت', 'Spider', 'spider.svg'),
];

/** 25 rare, mythical and surprising animals for the final collection tier. */
const LEGEND_ANIMALS: readonly AnimalProfile[] = [
  legend('wolf', 'الذئب', 'Wolf', 'wolf.svg'),
  legend('bear', 'الدب', 'Bear', 'bear.svg'),
  legend('rat', 'الجرذ', 'Rat', 'rat.svg'),
  legend('boar', 'الخنزير البري', 'Wild Boar', 'boar.svg'),
  legend('moose', 'الموظ', 'Moose', 'moose.svg'),
  legend('donkey', 'الحمار', 'Donkey', 'donkey.svg'),
  legend('goose', 'الإوزة', 'Goose', 'goose.svg'),
  legend('dodo', 'الدودو', 'Dodo', 'dodo.svg'),
  legend('mammoth', 'الماموث', 'Mammoth', 'mammoth.svg'),
  legend('unicorn', 'اليونيكورن', 'Unicorn', 'unicorn.svg'),
  legend('dragon', 'التنين', 'Dragon', 'dragon.svg'),
  legend('sauropod', 'الديناصور طويل العنق', 'Sauropod', 'sauropod.svg'),
  legend('t-rex', 'الديناصور تي ريكس', 'T-Rex', 't-rex.svg'),
  legend('ant', 'النملة', 'Ant', 'ant.svg'),
  legend('cricket', 'الجدجد', 'Cricket', 'cricket.svg'),
  legend('mosquito', 'البعوضة', 'Mosquito', 'mosquito.svg'),
  legend('caterpillar', 'اليرقة', 'Caterpillar', 'caterpillar.svg'),
  legend('beetle', 'الخنفساء', 'Beetle', 'beetle.svg'),
  legend('fly', 'الذبابة', 'Fly', 'fly.svg'),
  legend('worm', 'الدودة', 'Worm', 'worm.svg'),
  legend('jellyfish', 'قنديل البحر', 'Jellyfish', 'jellyfish.svg'),
  legend('phoenix', 'طائر الفينيق', 'Phoenix', 'phoenix.svg'),
  legend('raven', 'الغراب', 'Raven', 'raven.svg'),
  legend('ox', 'الثور', 'Ox', 'ox.svg'),
  legend('bactrian-camel', 'الجمل ذو السنامين', 'Bactrian Camel', 'bactrian-camel.svg'),
];

export const ANIMALS_BY_STAGE: Record<number, readonly AnimalProfile[]> = {
  1: HOME_ANIMALS,
  2: SAFARI_ANIMALS,
  3: OCEAN_ANIMALS,
  4: LEGEND_ANIMALS,
};

export const ALL_ANIMALS: readonly AnimalProfile[] = [
  ...HOME_ANIMALS,
  ...SAFARI_ANIMALS,
  ...OCEAN_ANIMALS,
  ...LEGEND_ANIMALS,
];

export const ANIMAL_GROUPS: readonly { group: AnimalGroup; nameAr: string }[] = [
  { group: 'home', nameAr: 'البيت والغابة' },
  { group: 'safari', nameAr: 'السفاري والأدغال' },
  { group: 'ocean', nameAr: 'المحيط والقطب' },
  { group: 'legend', nameAr: 'الأساطير والنوادر' },
];

/** Asset mapping used by the one-off downloader script. */
export const ANIMAL_ASSET_SOURCES: readonly { asset: string; codepoint: string }[] = [
  { asset: 'dog.svg', codepoint: '1f436' },
  { asset: 'cat.svg', codepoint: '1f431' },
  { asset: 'rabbit.svg', codepoint: '1f430' },
  { asset: 'hamster.svg', codepoint: '1f439' },
  { asset: 'mouse.svg', codepoint: '1f42d' },
  { asset: 'squirrel.svg', codepoint: '1f43f' },
  { asset: 'hedgehog.svg', codepoint: '1f994' },
  { asset: 'fox.svg', codepoint: '1f98a' },
  { asset: 'deer.svg', codepoint: '1f98c' },
  { asset: 'owl.svg', codepoint: '1f989' },
  { asset: 'duck.svg', codepoint: '1f986' },
  { asset: 'chicken.svg', codepoint: '1f414' },
  { asset: 'turkey.svg', codepoint: '1f983' },
  { asset: 'pig.svg', codepoint: '1f437' },
  { asset: 'cow.svg', codepoint: '1f42e' },
  { asset: 'horse.svg', codepoint: '1f434' },
  { asset: 'sheep.svg', codepoint: '1f411' },
  { asset: 'goat.svg', codepoint: '1f410' },
  { asset: 'beaver.svg', codepoint: '1f9ab' },
  { asset: 'raccoon.svg', codepoint: '1f99d' },
  { asset: 'badger.svg', codepoint: '1f9a1' },
  { asset: 'skunk.svg', codepoint: '1f9a8' },
  { asset: 'otter.svg', codepoint: '1f9a6' },
  { asset: 'bat.svg', codepoint: '1f987' },
  { asset: 'frog.svg', codepoint: '1f438' },
  { asset: 'lion.svg', codepoint: '1f981' },
  { asset: 'tiger.svg', codepoint: '1f42f' },
  { asset: 'leopard.svg', codepoint: '1f406' },
  { asset: 'elephant.svg', codepoint: '1f418' },
  { asset: 'giraffe.svg', codepoint: '1f992' },
  { asset: 'zebra.svg', codepoint: '1f993' },
  { asset: 'monkey.svg', codepoint: '1f435' },
  { asset: 'gorilla.svg', codepoint: '1f98d' },
  { asset: 'orangutan.svg', codepoint: '1f9a7' },
  { asset: 'rhino.svg', codepoint: '1f98f' },
  { asset: 'hippo.svg', codepoint: '1f99b' },
  { asset: 'crocodile.svg', codepoint: '1f40a' },
  { asset: 'snake.svg', codepoint: '1f40d' },
  { asset: 'camel.svg', codepoint: '1f42a' },
  { asset: 'llama.svg', codepoint: '1f999' },
  { asset: 'kangaroo.svg', codepoint: '1f998' },
  { asset: 'koala.svg', codepoint: '1f428' },
  { asset: 'panda.svg', codepoint: '1f43c' },
  { asset: 'sloth.svg', codepoint: '1f9a5' },
  { asset: 'bison.svg', codepoint: '1f9ac' },
  { asset: 'buffalo.svg', codepoint: '1f403' },
  { asset: 'flamingo.svg', codepoint: '1f9a9' },
  { asset: 'peacock.svg', codepoint: '1f99a' },
  { asset: 'parrot.svg', codepoint: '1f99c' },
  { asset: 'lizard.svg', codepoint: '1f98e' },
  { asset: 'whale.svg', codepoint: '1f433' },
  { asset: 'dolphin.svg', codepoint: '1f42c' },
  { asset: 'shark.svg', codepoint: '1f988' },
  { asset: 'octopus.svg', codepoint: '1f419' },
  { asset: 'squid.svg', codepoint: '1f991' },
  { asset: 'crab.svg', codepoint: '1f980' },
  { asset: 'lobster.svg', codepoint: '1f99e' },
  { asset: 'shrimp.svg', codepoint: '1f990' },
  { asset: 'seal.svg', codepoint: '1f9ad' },
  { asset: 'penguin.svg', codepoint: '1f427' },
  { asset: 'polar-bear.svg', codepoint: '1f43b-200d-2744-fe0f' },
  { asset: 'eagle.svg', codepoint: '1f985' },
  { asset: 'swan.svg', codepoint: '1f9a2' },
  { asset: 'dove.svg', codepoint: '1f54a' },
  { asset: 'fish.svg', codepoint: '1f41f' },
  { asset: 'tropical-fish.svg', codepoint: '1f420' },
  { asset: 'blowfish.svg', codepoint: '1f421' },
  { asset: 'oyster.svg', codepoint: '1f9aa' },
  { asset: 'snail.svg', codepoint: '1f40c' },
  { asset: 'turtle.svg', codepoint: '1f422' },
  { asset: 'scorpion.svg', codepoint: '1f982' },
  { asset: 'butterfly.svg', codepoint: '1f98b' },
  { asset: 'bee.svg', codepoint: '1f41d' },
  { asset: 'ladybug.svg', codepoint: '1f41e' },
  { asset: 'spider.svg', codepoint: '1f577' },
  { asset: 'wolf.svg', codepoint: '1f43a' },
  { asset: 'bear.svg', codepoint: '1f43b' },
  { asset: 'rat.svg', codepoint: '1f400' },
  { asset: 'boar.svg', codepoint: '1f417' },
  { asset: 'moose.svg', codepoint: '1face' },
  { asset: 'donkey.svg', codepoint: '1facf' },
  { asset: 'goose.svg', codepoint: '1fabf' },
  { asset: 'dodo.svg', codepoint: '1f9a4' },
  { asset: 'mammoth.svg', codepoint: '1f9a3' },
  { asset: 'unicorn.svg', codepoint: '1f984' },
  { asset: 'dragon.svg', codepoint: '1f409' },
  { asset: 'sauropod.svg', codepoint: '1f995' },
  { asset: 't-rex.svg', codepoint: '1f996' },
  { asset: 'ant.svg', codepoint: '1f41c' },
  { asset: 'cricket.svg', codepoint: '1f997' },
  { asset: 'mosquito.svg', codepoint: '1f99f' },
  { asset: 'caterpillar.svg', codepoint: '1f41b' },
  { asset: 'beetle.svg', codepoint: '1fab2' },
  { asset: 'fly.svg', codepoint: '1fab0' },
  { asset: 'worm.svg', codepoint: '1fab1' },
  { asset: 'jellyfish.svg', codepoint: '1fabc' },
  { asset: 'phoenix.svg', codepoint: '1f426-200d-1f525' },
  { asset: 'raven.svg', codepoint: '1f426-200d-2b1b' },
  { asset: 'ox.svg', codepoint: '1f402' },
  { asset: 'bactrian-camel.svg', codepoint: '1f42b' },
];
