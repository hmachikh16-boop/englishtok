/**
 * Small visual helpers for the Duolingo-style lesson player.
 *
 * Quiz options are text, so each card borrows a large emoji illustration to
 * keep the picture-first feel of the reference screens. The map covers every
 * word and translation used by the current curriculum and falls back to a
 * neutral letter tile for anything new.
 */

const VISUALS: Record<string, string> = {
  // Level 1
  apple: '🍎',
  تفاحة: '🍎',
  ball: '⚽',
  كرة: '⚽',
  cat: '🐱',
  قطة: '🐱',
  dog: '🐶',
  كلب: '🐶',
  'how many?': '🔢',
  'what color?': '🎨',
  'what is your name?': '🪪',
  'where is it?': '📍',
  'how old are you?': '🎂',
  one: '1️⃣',
  two: '2️⃣',
  three: '3️⃣',
  five: '5️⃣',
  ten: '🔟',
  واحد: '1️⃣',
  اثنان: '2️⃣',
  ثلاثة: '3️⃣',
  خمسة: '5️⃣',
  عشرة: '🔟',
  red: '🔴',
  blue: '🔵',
  yellow: '🟡',
  green: '🟢',
  circle: '⭕',
  square: '🟥',
  أحمر: '🔴',
  أزرق: '🔵',
  أصفر: '🟡',
  أخضر: '🟢',
  دائرة: '⭕',
  مربع: '🟥',
  hello: '👋',
  goodbye: '👋',
  name: '🪪',
  'years old': '🎂',
  مرحبًا: '👋',
  'إلى اللقاء': '👋',
  اسم: '🪪',
  'كم عمرك؟': '🎂',

  // Level 2
  'wake up': '⏰',
  'wakes up': '⏰',
  'brush teeth': '🪥',
  school: '🏫',
  usually: '🔁',
  always: '♾️',
  عادةً: '🔁',
  دائمًا: '♾️',
  أبدًا: '🚫',
  أحيانًا: '🌤️',
  menu: '📋',
  delicious: '😋',
  favorite: '⭐',
  prefer: '⚖️',
  لذيذ: '😋',
  صحي: '🥗',
  غالي: '💰',
  سريع: '⚡',
  yesterday: '📅',
  'last week': '🗓️',
  went: '🚶',
  saw: '👀',
  enjoyed: '😄',
  أمس: '🌙',
  'الأسبوع الماضي': '🗓️',
  غدًا: '🌅',
  اليوم: '☀️',
  'turn left': '⬅️',
  'turn right': '➡️',
  'straight ahead': '⬆️',
  'excuse me': '🙋',
  'انعطف يسارًا': '⬅️',
  'انعطف يمينًا': '➡️',
  'أمامك مباشرة': '⬆️',
  عفوًا: '🙋',

  // Level 3
  'from my perspective': '👓',
  'strongly believe': '💪',
  'on the other hand': '🤲',
  disagree: '❌',
  opinion: '💭',
  'in my opinion...': '💭',
  'من وجهة نظري': '👓',
  'أعتقد بقوة': '💪',
  'من ناحية أخرى': '🤲',
  أتفق: '✅',
  'break a leg': '🍀',
  'call it a day': '🌇',
  'figure out': '🧩',
  'carry on': '▶️',
  idiom: '🗣️',
  'حظًا موفقًا': '🍀',
  'اكسر ساقك': '🦵',
  توقف: '⏹️',
  واصل: '▶️',
  regret: '😞',
  يندم: '😞',
  يفرح: '😄',
  يواصل: '▶️',
  يقرر: '🧭',
  'be implemented': '🏗️',
  implement: '🏗️',
  implemented: '🏗️',
  implementing: '🏗️',
  'artificial intelligence': '🤖',
  sustainability: '🌱',
  'renewable energy': '🔋',
  impact: '💥',
  'carbon footprint': '👣',
  'الذكاء الاصطناعي': '🤖',
  الاستدامة: '🌱',
  'الطاقة المتجددة': '🔋',
  التأثير: '💥',
  'البصمة الكربونية': '👣',

  // Level 4
  consensus: '🤝',
  leverage: '🧲',
  'win-win scenario': '🏆',
  'counter-offer': '🔄',
  stakeholders: '👥',
  'أصحاب المصلحة': '👥',
  'الميزانية': '💰',
  'العرض': '📨',
  'التفاوض': '🤝',
  furthermore: '➕',
  consequently: '⏩',
  hypothesis: '💡',
  'empirical evidence': '🔬',
  'in contrast': '↔️',
  فرضية: '💡',
  دليل: '🔬',
  نتيجة: '📊',
  منهجية: '🧪',
  sarcasm: '😏',
  subtext: '🔍',
  implicit: '🫥',
  ambiguity: '❓',
  nuance: '🎭',
  سخرية: '😏',
  'معنى ضمني': '🔍',
  غموض: '❓',
  'فرق دقيق': '🎭',
  persuasive: '🎤',
  resonance: '📣',
  articulate: '🗣️',
  captivate: '✨',
  'call to action': '📢',
  يأسر: '✨',
  يقنع: '🎤',
  يتحدث: '🗣️',
  يكرر: '🔁',
  // Gold+ project and picture-challenge vocabulary
  country: '🌍',
  hobby: '🎨',
  dream: '🌟',
  directions: '🧭',
  ticket: '🎫',
  appointment: '📅',
  receipt: '🧾',
  proposal: '📝',
  deadline: '⏰',
  stakeholder: '🤝',
  feedback: '💬',
  argument: '🗣️',
  evidence: '🔎',
  counterpoint: '⚖️',
  conclusion: '🏁',
  nom: '🪪',
  pays: '🌍',
  passion: '🎨',
  rêve: '🌟',
  itinéraire: '🧭',
  billet: '🎫',
  'rendez-vous': '📅',
  reçu: '🧾',
  proposition: '📝',
  échéance: '⏰',
  'partie prenante': '🤝',
  retour: '💬',
  preuve: '🔎',
  objection: '⚖️',
};

const normalizeOption = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/[.,!?;:…]/g, '')
    .replace(/\s+/g, ' ');

export const getOptionEmoji = (value: string): string => {
  const normalized = normalizeOption(value);
  if (VISUALS[normalized]) return VISUALS[normalized];
  const words = normalized.split(' ');
  for (const word of words) {
    if (VISUALS[word]) return VISUALS[word];
  }
  return /[\u0600-\u06FF]/.test(value) ? '📘' : '🔤';
};

/**
 * True when the options are full sentences and look better as a vertical list
 * than as picture cards (the reference screens use the card grid for words).
 */
export const isSentenceOption = (options: string[]): boolean =>
  options.some((option) => {
    const normalized = option.trim();
    const words = normalized.split(/\s+/).filter(Boolean);
    const hasSentencePunctuation = /[.!?…]$/.test(normalized);
    return words.length >= 4 || (hasSentencePunctuation && words.length >= 3);
  });
