/**
 * Advanced MomHaven Personalization Types (Phase 8)
 *
 * Conceptual Layers:
 * 1. Identity
 * 2. Personalization Context (HealthContext)
 * 3. Clinical Records (Pregnancy, Children, Encounters)
 * 4. Derived Context (TodayContext, HealthSummary)
 * 5. Advanced Personalization (Personalized Plan, Smart Suggestions, Context-Aware Prompts)
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Advanced personalization sits ABOVE Derived Context and must NOT become a new source of truth.
 * 2. Deterministic first: dates, gestational weeks, eligibility, clinical thresholds are 100% deterministic.
 * 3. Never invent tasks, symptoms, medications, or clinical measurements.
 * 4. Every recommendation has an explainable, understandable source ("Because you said...").
 * 5. Suggested reminders MUST NOT silently create clinical appointments.
 */

import { ContextProvenance } from './healthContext';
import { Reminder } from '../types';

export type DailyPlanCategory =
  | 'milestone'
  | 'nutrition'
  | 'reminder'
  | 'preparation'
  | 'learning'
  | 'check_in';

export interface DailyPlanAction {
  type: 'navigate' | 'ask_haven' | 'view_resource' | 'open_reminder' | 'health_log' | 'appointment_prep';
  target?: string;
  label: string;
}

export interface DailyPlanItem {
  id: string;
  title: string;
  description: string;
  category: DailyPlanCategory;
  /** Explainable source: "Because you are in Week 28 of your pregnancy" */
  reason: string;
  action: DailyPlanAction;
  completed: boolean;
  provenance: ContextProvenance;
  priorityScore: number;
}

export type SuggestedReminderCategory = 'anc' | 'kepi' | 'pnc' | 'wellness';

export type SuggestedReminderSource =
  | 'MOH_ANC_GUIDELINES'
  | 'KEPI_SCHEDULE'
  | 'MOH_PNC_GUIDELINES'
  | 'NUTRITION_HABIT';

export interface SuggestedReminder {
  id: string;
  title: string;
  description: string;
  suggestedDate: string;
  category: SuggestedReminderCategory;
  source: SuggestedReminderSource;
  rationale: string;
  /** Explicit flag confirming this is a recommendation, NOT an existing appointment */
  isSystemSuggestion: true;
}

export interface ContextAwareHavenPrompt {
  id: string;
  prompt: string;
  category: 'anc_prep' | 'nutrition' | 'development' | 'danger_signs' | 'comfort' | 'general';
  reason: string;
  language: 'en' | 'sw';
}

export interface ClinicianQuestion {
  id: string;
  question: string;
  category: 'tests' | 'symptoms' | 'birth_plan' | 'immunizations' | 'general';
  relevanceReason: string;
  suggestedBy: 'SYSTEM_DERIVED';
}

export interface AppointmentChecklistItem {
  id: string;
  item: string;
  description?: string;
  mandatory: boolean;
}

export interface AppointmentPrepPlan {
  stageTitle: string;
  upcomingMilestone: string;
  recommendedChecklist: AppointmentChecklistItem[];
  suggestedQuestions: ClinicianQuestion[];
  savedQuestions: string[];
}

export interface TrendInsightSummary {
  type: 'blood_pressure' | 'weight' | 'baby_movement' | 'sleep' | 'symptoms';
  status: 'empty' | 'sparse' | 'sufficient';
  summary: string;
  dataPointsCount: number;
  alert?: boolean;
}

export interface TopResourceRecommendation {
  id: string;
  title: string;
  summary: string;
  topic: string;
  reason: string;
}

export interface PersonalizedPlanResult {
  dailyPlan: DailyPlanItem[];
  suggestedReminders: SuggestedReminder[];
  contextAwareHavenPrompts: ContextAwareHavenPrompt[];
  appointmentPrep: AppointmentPrepPlan;
  trendInsights: TrendInsightSummary[];
  topResourceRecommendation?: TopResourceRecommendation;
  derivedAt: string;
  isAiEnhanced?: boolean;
}
