import { Provenance } from '../types';

export type HealthLogCategory = 'JOURNAL' | 'CLINICAL_MEASUREMENT';

export type HealthLogType =
  | 'blood_pressure'
  | 'weight'
  | 'symptoms'
  | 'baby_movement'
  | 'mood'
  | 'sleep'
  | 'nutrition'
  | 'activity'
  | 'notes';

export interface BloodPressureValues {
  systolic: number;
  diastolic: number;
  pulse?: number;
  arm?: 'left' | 'right';
  restingMinutes?: number;
}

export interface WeightValues {
  weightKg: number;
}

export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export interface SymptomsValues {
  symptoms: string[];
  severity: SymptomSeverity;
  hasDangerSigns: boolean;
  dangerSigns?: string[];
  durationDays?: number;
}

export type BabyMovementPattern = 'normal' | 'active' | 'decreased' | 'none_felt';

export interface BabyMovementValues {
  pattern: BabyMovementPattern;
  movementCount?: number;
  durationMinutes?: number;
}

export type MoodType = 'calm' | 'happy' | 'tired' | 'anxious' | 'sad' | 'overwhelmed';

export interface MoodValues {
  mood: MoodType;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
}

export type SleepQuality = 'rested' | 'interrupted' | 'poor';

export interface SleepValues {
  hours: number;
  quality: SleepQuality;
}

export interface NutritionValues {
  hydrationGlasses?: number;
  appetite: 'good' | 'fair' | 'poor';
  meals?: string[];
  tookIfas?: boolean; // Iron & Folic Acid Supplement
}

export interface ActivityValues {
  activeMinutes?: number;
  activityType?: 'walking' | 'gentle_stretch' | 'daily_chores' | 'rest' | 'other';
}

export interface GeneralNotesValues {
  text: string;
  topic?: string;
}

export type HealthLogValues =
  | BloodPressureValues
  | WeightValues
  | SymptomsValues
  | BabyMovementValues
  | MoodValues
  | SleepValues
  | NutritionValues
  | ActivityValues
  | GeneralNotesValues;

export interface DailyHealthLog<T = HealthLogValues> {
  id: string;
  userId: string;
  timestamp: string; // ISO 8601 string
  type: HealthLogType;
  category: HealthLogCategory;
  values: T;
  notes?: string;
  source: 'USER_REPORTED';
  provenance: Provenance;
  sharedWithClinician?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateHealthLogInput<T = HealthLogValues> {
  timestamp?: string;
  type: HealthLogType;
  values: T;
  notes?: string;
  sharedWithClinician?: boolean;
}

export interface UpdateHealthLogInput<T = HealthLogValues> {
  timestamp?: string;
  values?: Partial<T>;
  notes?: string;
  sharedWithClinician?: boolean;
}

export interface ClinicalSafetyAlert {
  level: 'NONE' | 'ADVISORY' | 'URGENT_DANGER';
  title: string;
  message: string;
  actionRecommendation: string;
  isRedCross1199Recommended: boolean;
}
