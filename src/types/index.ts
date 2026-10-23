import type { LucideIcon } from 'lucide-react';

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type CategoryKey = 
  | 'greetings' 
  | 'travel' 
  | 'food' 
  | 'work' 
  | 'shopping' 
  | 'health' 
  | 'idioms' 
  | 'grammar';

export interface CategoryInfo {
  key: CategoryKey;
  nameAr: string;
  nameEn: string;
  icon: LucideIcon;
  color: string;
  descriptionAr: string;
}

/**
 * Hand-built cartoon designs used by the primary-school lessons. Each value maps
 * to a detailed vector illustration in src/characters/characterArt.ts.
 */
export type CharacterDesign =
  | 'boy-monster'
  | 'girl-teal'
  | 'girl-pink'
  | 'girl-green-hat'
  | 'squirrel'
  | 'squirrel-glasses'
  | 'squirrel-scarf'
  | 'fox-flowers'
  | 'dog-brown'
  /** Leo, the clever dog of the CEFR A1 beginner track. */
  | 'dog-leo'
  /** Gigi, the creative giraffe of the CEFR A1 beginner track. */
  | 'giraffe-gigi';

export interface Character {
  id: string;
  name: string;
  nameAr: string;
  roleAr: string;
  avatar: string;
  voiceGender: 'male' | 'female';
  voicePitch: number; // e.g. 1.0 for female/higher, 0.85 for male
  voiceRateModifier?: number;
  shirtColor: string;
  skinTone: string;
  hairColor: string;
  hairStyle: 'short' | 'curly' | 'ponytail' | 'glasses' | 'spiky';
  /** When set, the character is drawn with its dedicated cartoon illustration. */
  design?: CharacterDesign;
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  textEn: string;
  textAr: string;
  durationSec: number;
  emotion: 'happy' | 'curious' | 'surprised' | 'explaining' | 'laughing';
  highlightWords?: string[];
}

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  translationAr: string;
  exampleSentence: string;
  exampleSentenceAr: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'arrange_sentence' | 'fill_blank';
  questionAr: string;
  questionEn?: string;
  /** Arabic sentence the learner is asked to translate in an arrange exercise. */
  promptAr?: string;
  options: string[];
  correctAnswer: string;
  explanationAr: string;
}

export type SceneType = 
  | 'cafe' 
  | 'airport' 
  | 'office' 
  | 'street' 
  | 'shop' 
  | 'clinic' 
  | 'park' 
  | 'classroom';

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  descriptionAr: string;
  learningNoteAr?: string;
  category: CategoryKey;
  level: Level;
  curriculumStage?: number;
  schoolYearId?: string;
  sceneType: SceneType;
  characterA: Character;
  characterB: Character;
  dialogue: DialogueLine[];
  vocabulary: VocabularyWord[];
  quiz: QuizQuestion[];
  likesCount: number;
  sharesCount: number;
  savedCount: number;
}

export interface UserSettings {
  playbackSpeed: number; // 0.5, 0.75, 1.0
  subtitlesMode: 'both' | 'en' | 'ar' | 'none';
  soundEffects: boolean;
  autoNext: boolean;
  /** Language used for speech: English (course language) or French (second option). */
  voiceLanguage: 'en' | 'fr';
}

export interface UserProfile {
  /** Optional public identity shown in the Settings profile card. */
  displayName?: string;
  profileTagline?: string;
  joinedAt?: string;
  avatarDataUrl?: string;
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  likedLessonIds: string[];
  favoriteLessonIds: string[];
  watchedLessonIds: string[];
  completedLessonIds: string[];
  savedWordIds: string[];
  masteredWordIds: string[];
  reviewWordIds: string[];
  quizScores: Record<string, number>; // lessonId -> score percent
  levelExamResults: Record<string, LevelExamResult>;
  placementAssessment?: PlacementAssessmentState;
  dailyGoalLessons: number;
  dailyProgress: {
    date: string;
    completedLessonIds: string[];
  };
  settings: UserSettings;
}

export interface PlacementStageResult {
  stage: number;
  correct: number;
  total: number;
  passed: boolean;
}

export interface PlacementAssessmentResult {
  completedAt: string;
  correctCount: number;
  answeredCount: number;
  scorePercent: number;
  suggestedStage: number;
  skillCoverage: string[];
  stages: PlacementStageResult[];
  /** Distinguishes a real assessment from deliberately starting at stage 1. */
  method?: 'test' | 'first_stage';
}

export interface PlacementAssessmentState {
  schemaVersion: 1;
  startedAt: string;
  answers: Record<string, string>;
  result?: PlacementAssessmentResult;
}

export interface LevelExamResult {
  attempts: number;
  bestScore: number;
  latestScore: number;
  passed: boolean;
  reviewTopics: string[];
  reviewWordIds: string[];
  passedAt?: string;
}

export type ActiveTab = 'categories' | 'lesson' | 'games' | 'vocab' | 'progress' | 'settings' | 'chat';
