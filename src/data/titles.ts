export interface TitleDef {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  price: number;          // points cost
  minXP: number;          // minimum XP to unlock purchase
  tone: string;           // accent hex
  icon: string;           // emoji
}

export const TITLES: TitleDef[] = [
  { id: 'beginner',     nameAr: 'المبتدئ',     nameEn: 'Beginner',     descriptionAr: 'أول خطوة في رحلة التعلم.',              price: 0,   minXP: 0,    tone: '#5b4730', icon: '🌱' },
  { id: 'diligent',     nameAr: 'المجتهد',     nameEn: 'Diligent',     descriptionAr: 'يتعلم كل يوم دون انقطاع.',              price: 50,  minXP: 100,  tone: '#a56c18', icon: '📚' },
  { id: 'skilled',      nameAr: 'البارع',      nameEn: 'Skilled',      descriptionAr: 'إتقان المفردات والقواعد.',              price: 120, minXP: 300,  tone: '#8d2f24', icon: '🎯' },
  { id: 'professional', nameAr: 'المحترف',     nameEn: 'Professional', descriptionAr: 'مستوى احترافي في اللغة.',               price: 250, minXP: 700,  tone: '#5b4730', icon: '🏆' },
  { id: 'genius',       nameAr: 'العبقري',     nameEn: 'Genius',       descriptionAr: 'ذاكرة قوية وسرعة في التعلم.',           price: 400, minXP: 1200, tone: '#a56c18', icon: '🧠' },
  { id: 'master',       nameAr: 'الماستر',     nameEn: 'Master',       descriptionAr: 'إتقان كامل للغة.',                     price: 700, minXP: 2000, tone: '#8d2f24', icon: '👑' },
  { id: 'polyglot',     nameAr: 'متعدد اللغات', nameEn: 'Polyglot',    descriptionAr: 'يتحدث بثقة في أي موقف.',                price: 1000,minXP: 3000, tone: '#5b4730', icon: '🌍' },
  { id: 'legend',       nameAr: 'أسطورة',      nameEn: 'Legend',       descriptionAr: 'إنجاز نادر — للمتعلمين المتفوقين.',     price: 1500,minXP: 5000, tone: '#8d2f24', icon: '⚡' },
];

export const getTitleById = (id: string | undefined) =>
  id ? TITLES.find((t) => t.id === id) : undefined;
