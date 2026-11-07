export interface TitleDef {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  price: number;          // points cost
  minXP: number;          // minimum XP to unlock purchase
  tone: string;           // accent hex
  icon: string;           // emoji (legacy)
  thumb: string;          // svg filename in /titles/
}

export const TITLES: TitleDef[] = [
  { id: 'beginner',     nameAr: 'المبتدئ',     nameEn: 'Beginner',     descriptionAr: 'أول خطوة في رحلة التعلم.',              price: 0,   minXP: 0,    tone: '#5b4730', icon: '🌱', thumb: 'beginner.svg' },
  { id: 'diligent',     nameAr: 'المجتهد',     nameEn: 'Diligent',     descriptionAr: 'يتعلم كل يوم دون انقطاع.',              price: 50,  minXP: 100,  tone: '#a56c18', icon: '📚', thumb: 'diligent.svg' },
  { id: 'skilled',      nameAr: 'البارع',      nameEn: 'Skilled',      descriptionAr: 'إتقان المفردات والقواعد.',              price: 120, minXP: 300,  tone: '#8d2f24', icon: '🎯', thumb: 'skilled.svg' },
  { id: 'professional', nameAr: 'المحترف',     nameEn: 'Professional', descriptionAr: 'مستوى احترافي في اللغة.',               price: 250, minXP: 700,  tone: '#5b4730', icon: '🏆', thumb: 'professional.svg' },
  { id: 'genius',       nameAr: 'العبقري',     nameEn: 'Genius',       descriptionAr: 'ذاكرة قوية وسرعة في التعلم.',           price: 400, minXP: 1200, tone: '#a56c18', icon: '🧠', thumb: 'genius.svg' },
  { id: 'master',       nameAr: 'الماستر',     nameEn: 'Master',       descriptionAr: 'إتقان كامل للغة.',                     price: 700, minXP: 2000, tone: '#8d2f24', icon: '👑', thumb: 'master.svg' },
  { id: 'polyglot',     nameAr: 'متعدد اللغات', nameEn: 'Polyglot',    descriptionAr: 'يتحدث بثقة في أي موقف.',                price: 1000,minXP: 3000, tone: '#5b4730', icon: '🌍', thumb: 'polyglot.svg' },
  { id: 'legend',       nameAr: 'أسطورة',      nameEn: 'Legend',       descriptionAr: 'إنجاز نادر — للمتعلمين المتفوقين.',     price: 1500,minXP: 5000, tone: '#8d2f24', icon: '⚡', thumb: 'legend.svg' },
];

export const getTitleById = (id: string | undefined) =>
  id ? TITLES.find((t) => t.id === id) : undefined;
