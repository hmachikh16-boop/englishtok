import { BookOpen, BriefcaseBusiness, GraduationCap, School } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SchoolYearRoute {
  id: string;
  labelAr: string;
  stages: number[];
  grade?: number;
}

export interface EducationalPhase {
  id: string;
  titleAr: string;
  subtitleAr: string;
  icon: LucideIcon;
  years: SchoolYearRoute[];
}

export const EDUCATIONAL_PHASES: EducationalPhase[] = [
  {
    id: 'primary', titleAr: 'الطور الابتدائي', subtitleAr: 'السنة الأولى إلى الخامسة ابتدائي', icon: BookOpen,
    years: [
      { id: 'primary-1', labelAr: 'السنة الأولى ابتدائي', stages: [1], grade: 1 },
      { id: 'primary-2', labelAr: 'السنة الثانية ابتدائي', stages: [2], grade: 2 },
      { id: 'primary-3', labelAr: 'السنة الثالثة ابتدائي', stages: [3], grade: 3 },
      { id: 'primary-4', labelAr: 'السنة الرابعة ابتدائي', stages: [4], grade: 4 },
      { id: 'primary-5', labelAr: 'السنة الخامسة ابتدائي', stages: [5], grade: 5 },
    ],
  },
  {
    id: 'middle', titleAr: 'الطور المتوسط', subtitleAr: 'السنة الأولى إلى الرابعة متوسط', icon: School,
    years: [
      { id: 'middle-1', labelAr: 'السنة الأولى متوسط', stages: [3], grade: 6 },
      { id: 'middle-2', labelAr: 'السنة الثانية متوسط', stages: [4], grade: 7 },
      { id: 'middle-3', labelAr: 'السنة الثالثة متوسط', stages: [4], grade: 8 },
      { id: 'middle-4', labelAr: 'السنة الرابعة متوسط', stages: [5], grade: 9 },
    ],
  },
  {
    id: 'secondary', titleAr: 'الطور الثانوي', subtitleAr: 'السنة الأولى إلى الثالثة ثانوي', icon: GraduationCap,
    years: [
      { id: 'secondary-1', labelAr: 'السنة الأولى ثانوي', stages: [5], grade: 10 },
      { id: 'secondary-2', labelAr: 'السنة الثانية ثانوي', stages: [6], grade: 11 },
      { id: 'secondary-3', labelAr: 'السنة الثالثة ثانوي', stages: [6], grade: 12 },
    ],
  },
  {
    id: 'advanced', titleAr: 'التخرج والتطوير المتقدم', subtitleAr: 'الجامعة والعمل والتواصل المتقدم', icon: BriefcaseBusiness,
    years: [{ id: 'advanced-path', labelAr: 'مسار التخرج والتطوير المتقدم', stages: [7] }],
  },
];

export const findSchoolYearRoute = (id: string | null) =>
  EDUCATIONAL_PHASES.flatMap((phase) => phase.years).find((year) => year.id === id);

// تنظيم أولي لمحتوى EnglishTok الموجود. لا يزعم مطابقة رسمية مع سنوات الدراسة أو مستويات CEFR.
export const SCHOOL_YEAR_ALIGNMENT_NOTE = 'المحتوى متدرج للتعلّم والمراجعة، لكنه ليس اعتمادًا رسميًا لمنهج وطني أو شهادة لمستويات CEFR.';
