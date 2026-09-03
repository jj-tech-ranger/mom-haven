export type UserMode = 'anonymous' | 'authenticated';

export type LifecycleStage =
  | 'pregnancy'
  | 'postpartum'
  | 'parenting'
  | 'planning'
  | 'supporter'
  | 'exploring';

export type ContextProvenance = 'USER_REPORTED' | 'VERIFIED' | 'SYSTEM_DERIVED';

export type AgeBracket = 'under_18' | '18_24' | '25_34' | '35_44' | '45_plus' | 'prefer_not_to_say';

export interface HealthContextValue<T> {
  value: T;
  provenance: ContextProvenance;
  updatedAt: string;
}

export interface PregnancyPersonalization {
  pregnancyWeek?: number;
  dueDate?: string;
  dueDateSource?: 'LMP' | 'PROVIDER_CONFIRMED' | 'UNKNOWN';
  multiplePregnancy?: boolean;
  pregnancyNumber?: number;
}

export interface HealthContext {
  version: number;
  lifecycleStage: LifecycleStage;
  userMode?: UserMode;
  preferredName?: string;
  ageBracket?: AgeBracket;
  county?: string;
  subcounty?: string;
  language: 'en' | 'sw';
  pregnancy?: PregnancyPersonalization;
  childAgeBracket?: 'newborn' | '0_5_months' | '6_11_months' | '1_2_years' | '3_5_years';
  interests: string[];
  dietaryPreferences: string[];
  supportSystem?: 'partner' | 'family' | 'friends' | 'community' | 'health_worker' | 'mostly_alone' | 'prefer_not_to_say';
  havenResponseStyle: 'concise' | 'detailed' | 'appointment_prep' | 'record_explanations' | 'daily_guidance';
  onboardingCompletedAt?: string;
  updatedAt: string;
}

export interface HealthContextVersion extends HealthContext {
  id: string;
  reasonForChange: 'initial_onboarding' | 'profile_edit' | 'context_sync' | 'system_migration';
  createdAt: string;
}
