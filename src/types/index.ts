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
  voiceAccent: 'en-US' | 'en-GB';
}

export interface UserProfile {
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
  dailyGoalLessons: number;
  dailyProgress: {
    date: string;
    completedLessonIds: string[];
  };
  settings: UserSettings;
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

export type ActiveTab = 'feed' | 'categories' | 'vocab' | 'progress' | 'settings';
