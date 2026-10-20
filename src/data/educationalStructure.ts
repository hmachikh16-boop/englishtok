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

/**
 * The phase explorer is intentionally empty while the new curriculum is being
 * authored. Add a phase here when its tracks are ready; the UI hides the
 * explorer automatically when this list is empty.
 */
export const EDUCATIONAL_PHASES: EducationalPhase[] = [];

export const findSchoolYearRoute = (id: string | null) =>
  EDUCATIONAL_PHASES.flatMap((phase) => phase.years).find((year) => year.id === id);

export const SCHOOL_YEAR_ALIGNMENT_NOTE = 'المحتوى متدرج للتعلّم والمراجعة، لكنه ليس اعتمادًا رسميًا لمنهج وطني أو شهادة لمستويات CEFR.';
