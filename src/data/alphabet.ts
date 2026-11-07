import type { LucideIcon } from 'lucide-react';

export interface AlphabetLetter {
  letter: string;
  lower: string;
  name: string;          // English name of the letter (e.g. "ay")
  soundAr: string;       // Arabic description of the sound
  word: string;          // example word (English)
  wordAr: string;        // example word (Arabic)
  sentence: string;      // example sentence (English)
  sentenceAr: string;    // example sentence (Arabic)
  thumb?: string;        // animal svg filename (optional)
  tone: string;          // parchment accent hex
}

export const ALPHABET: AlphabetLetter[] = [
  { letter:'A', lower:'a', name:'ay',   soundAr:'صوت «أ» كما في apple', word:'Ant',      wordAr:'نملة',     sentence:'An ant is small.',          sentenceAr:'النملة صغيرة.',          thumb:'ant.svg',       tone:'#a56c18' },
  { letter:'B', lower:'b', name:'bee',  soundAr:'صوت «ب» كما في ball',  word:'Bee',      wordAr:'نحلة',     sentence:'A bee makes honey.',        sentenceAr:'النحلة تصنع عسلاً.',     thumb:'bee.svg',       tone:'#8d2f24' },
  { letter:'C', lower:'c', name:'see',  soundAr:'صوت «ك/س» كما في cat', word:'Cat',      wordAr:'قطة',      sentence:'The cat sleeps.',           sentenceAr:'القطة تنام.',            thumb:'cat.svg',       tone:'#5b4730' },
  { letter:'D', lower:'d', name:'dee',  soundAr:'صوت «د» كما في dog',   word:'Dog',      wordAr:'كلب',      sentence:'The dog barks.',            sentenceAr:'الكلب ينبح.',            thumb:'dog.svg',       tone:'#a56c18' },
  { letter:'E', lower:'e', name:'ee',   soundAr:'صوت «إ» كما في egg',   word:'Eagle',    wordAr:'نسر',      sentence:'An eagle flies high.',      sentenceAr:'النسر يطير عالياً.',     thumb:'eagle.svg',     tone:'#8d2f24' },
  { letter:'F', lower:'f', name:'ef',   soundAr:'صوت «ف» كما في fish',  word:'Fox',      wordAr:'ثعلب',     sentence:'The fox is clever.',        sentenceAr:'الثعلب ذكي.',            thumb:'fox.svg',       tone:'#5b4730' },
  { letter:'G', lower:'g', name:'jee',  soundAr:'صوت «ج» كما في goat',  word:'Giraffe',  wordAr:'زرافة',    sentence:'The giraffe is tall.',      sentenceAr:'الزرافة طويلة.',         thumb:'giraffe.svg',   tone:'#a56c18' },
  { letter:'H', lower:'h', name:'aitch',soundAr:'صوت «هـ» كما في hat',  word:'Horse',    wordAr:'حصان',     sentence:'The horse runs fast.',      sentenceAr:'الحصان يركض بسرعة.',     thumb:'horse.svg',     tone:'#8d2f24' },
  { letter:'I', lower:'i', name:'eye',  soundAr:'صوت «إي» كما في ice',  word:'Ice',      wordAr:'جليد',     sentence:'Ice is cold.',              sentenceAr:'الجليد بارد.',           tone:'#5b4730' },
  { letter:'J', lower:'j', name:'jay',  soundAr:'صوت «ج» كما في jam',   word:'Jam',      wordAr:'مربى',     sentence:'I like strawberry jam.',    sentenceAr:'أحب مربى الفراولة.',     tone:'#a56c18' },
  { letter:'K', lower:'k', name:'kay',  soundAr:'صوت «ك» كما في kite',  word:'Key',      wordAr:'مفتاح',    sentence:'This is my key.',          sentenceAr:'هذا مفتاحي.',            tone:'#8d2f24' },
  { letter:'L', lower:'l', name:'el',   soundAr:'صوت «ل» كما في lion',  word:'Lion',     wordAr:'أسد',      sentence:'The lion is strong.',       sentenceAr:'الأسد قوي.',             thumb:'lion.svg',      tone:'#5b4730' },
  { letter:'M', lower:'m', name:'em',   soundAr:'صوت «م» كما في moon',  word:'Monkey',   wordAr:'قرد',      sentence:'The monkey climbs.',        sentenceAr:'القرد يتسلق.',           thumb:'monkey.svg',    tone:'#a56c18' },
  { letter:'N', lower:'n', name:'en',   soundAr:'صوت «ن» كما في nest',  word:'Nest',     wordAr:'عش',       sentence:'The bird builds a nest.',   sentenceAr:'العصفور يبني عشًا.',     tone:'#8d2f24' },
  { letter:'O', lower:'o', name:'oh',   soundAr:'صوت «أو» كما في orange',word:'Orange',  wordAr:'برتقال',   sentence:'An orange is sweet.',       sentenceAr:'البرتقال حلو.',          tone:'#5b4730' },
  { letter:'P', lower:'p', name:'pee',  soundAr:'صوت «ب» كما في pen',   word:'Panda',    wordAr:'باندا',    sentence:'The panda eats bamboo.',    sentenceAr:'الباندا يأكل الخيزران.', thumb:'panda.svg',     tone:'#a56c18' },
  { letter:'Q', lower:'q', name:'kyoo', soundAr:'صوت «ك» كما في queen', word:'Queen',    wordAr:'ملكة',     sentence:'The queen is wise.',        sentenceAr:'الملكة حكيمة.',          tone:'#8d2f24' },
  { letter:'R', lower:'r', name:'ar',   soundAr:'صوت «ر» كما في rabbit',word:'Rabbit',   wordAr:'أرنب',     sentence:'The rabbit hops.',          sentenceAr:'الأرنب يقفز.',           thumb:'rabbit.svg',    tone:'#5b4730' },
  { letter:'S', lower:'s', name:'ess',  soundAr:'صوت «س» كما في sun',   word:'Snake',    wordAr:'ثعبان',    sentence:'The snake slides.',         sentenceAr:'الثعبان ينزلق.',         thumb:'snake.svg',     tone:'#a56c18' },
  { letter:'T', lower:'t', name:'tee',  soundAr:'صوت «ت» كما في tiger', word:'Tiger',    wordAr:'نمر',      sentence:'The tiger is strong.',      sentenceAr:'النمر قوي.',             thumb:'tiger.svg',     tone:'#8d2f24' },
  { letter:'U', lower:'u', name:'you',  soundAr:'صوت «يو» كما في umbrella',word:'Umbrella',wordAr:'مظلة',  sentence:'Use an umbrella.',          sentenceAr:'استخدم مظلة.',           tone:'#5b4730' },
  { letter:'V', lower:'v', name:'vee',  soundAr:'صوت «ف» كما في violin',word:'Violin',   wordAr:'كمان',     sentence:'She plays the violin.',     sentenceAr:'هي تعزف الكمان.',        tone:'#a56c18' },
  { letter:'W', lower:'w', name:'double-u', soundAr:'صوت «و» كما في water', word:'Whale', wordAr:'حوت',  sentence:'The whale is huge.',        sentenceAr:'الحوت ضخم.',             thumb:'whale.svg',     tone:'#8d2f24' },
  { letter:'X', lower:'x', name:'eks',  soundAr:'صوت «كس» كما في box',  word:'Box',      wordAr:'صندوق',    sentence:'Open the box.',             sentenceAr:'افتح الصندوق.',          tone:'#5b4730' },
  { letter:'Y', lower:'y', name:'why',  soundAr:'صوت «ي» كما في yellow',word:'Yak',      wordAr:'ياك',      sentence:'The yak lives in mountains.',sentenceAr:'الياك يعيش في الجبال.', tone:'#a56c18' },
  { letter:'Z', lower:'z', name:'zee',  soundAr:'صوت «ز» كما في zebra', word:'Zebra',    wordAr:'حمار وحشي',sentence:'The zebra has stripes.',    sentenceAr:'الحمار الوحشي مخطط.',    tone:'#8d2f24' },
];

export const ALPHABET_BY_LETTER = new Map(ALPHABET.map((l) => [l.letter, l]));
