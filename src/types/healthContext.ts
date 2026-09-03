/**
 * MomHaven Context Architecture Foundation (Phase 0)
 *
 * Conceptual Layers:
 * 1. Identity               -> Who is the user? Anonymous vs. Authenticated, Application Role
 * 2. Personalization Context -> HealthContext: Lifecycle stage, preferences, language, goals
 * 3. Clinical Records        -> Authoritative clinical data: Pregnancy, Children, ANC, Growth
 * 4. Derived Context         -> Aggregated context for Today, Haven, Resources, Clinician summary
 *
 * CRITICAL RULE: Never duplicate authoritative clinical data into personalization context.
 */

export type ArchitectureLayer =
  | 'IDENTITY'
  | 'PERSONALIZATION_CONTEXT'
  | 'CLINICAL_RECORDS'
  | 'DERIVED_CONTEXT';

export type UserMode = 'anonymous' | 'authenticated';

export type LifecycleStage =
  | 'pregnancy'
  | 'postpartum'
  | 'parenting'
  | 'planning'
  | 'supporter'
  | 'exploring';

export const LIFECYCLE_STAGES: readonly LifecycleStage[] = [
  'pregnancy',
  'postpartum',
  'parenting',
  'planning',
  'supporter',
  'exploring',
] as const;

export function isLifecycleStage(value: unknown): value is LifecycleStage {
  return typeof value === 'string' && LIFECYCLE_STAGES.includes(value as LifecycleStage);
}

export function isUserMode(value: unknown): value is UserMode {
  return value === 'anonymous' || value === 'authenticated';
}

/**
 * Provenance System
 * Explicitly distinguishes user-reported personalization from verified clinical facts.
 * Never falsely upgrade user-reported information to verified clinical information.
 */
export type ContextProvenance = 'USER_REPORTED' | 'VERIFIED' | 'SYSTEM_DERIVED';

export interface ProvenanceRecord {
  provenance: ContextProvenance;
  source?: string;
  enteredBy?: string;
  enteredAt?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export interface ProvenancedValue<T> extends ProvenanceRecord {
  value: T;
  updatedAt?: string;
}

export type HealthContextValue<T> = ProvenancedValue<T>;

export function createProvenanceFact<T>(
  value: T,
  provenance: ContextProvenance = 'USER_REPORTED',
  meta: Omit<Partial<ProvenanceRecord>, 'provenance'> = {},
): ProvenancedValue<T> {
  return {
    value,
    provenance,
    enteredAt: meta.enteredAt || new Date().toISOString(),
    ...meta,
  };
}

export function userReportedFact<T>(
  value: T,
  meta: Omit<Partial<ProvenanceRecord>, 'provenance'> = {},
): ProvenancedValue<T> {
  return createProvenanceFact(value, 'USER_REPORTED', meta);
}

export function systemDerivedFact<T>(
  value: T,
  meta: Omit<Partial<ProvenanceRecord>, 'provenance'> = {},
): ProvenancedValue<T> {
  return createProvenanceFact(value, 'SYSTEM_DERIVED', meta);
}

export function verifiedFact<T>(
  value: T,
  meta: Omit<Partial<ProvenanceRecord>, 'provenance'> = {},
): ProvenancedValue<T> {
  return createProvenanceFact(value, 'VERIFIED', meta);
}

export type AgeBracket = 'under_18' | '18_24' | '25_34' | '35_44' | '45_plus' | 'prefer_not_to_say';

export type SupportSystemType =
  | 'partner'
  | 'family'
  | 'friends'
  | 'community'
  | 'health_worker'
  | 'mostly_alone'
  | 'prefer_not_to_say'
  | string;

export type HavenResponseStyle =
  | 'concise'
  | 'detailed'
  | 'appointment_prep'
  | 'record_explanations'
  | 'daily_guidance';

export type ChildAgeBracket =
  | 'newborn'
  | '0_5_months'
  | '6_11_months'
  | '1_2_years'
  | '3_5_years';

export interface LocationPersonalization {
  county?: string;
  subcounty?: string;
}

/**
 * Pregnancy personalization signals:
 * User-reported preference signals and targets.
 * NOTE: The authoritative clinical pregnancy record (LMP, EDD, GA, obstetric history,
 * clinical conditions, ANC encounters) resides in the `pregnancies` collection.
 */
export interface PregnancyPersonalizationSignals {
  pregnancyWeek?: number;
  dueDate?: string;
  dueDateSource?: 'LMP' | 'PROVIDER_CONFIRMED' | 'UNKNOWN';
  multiplePregnancy?: boolean;
  pregnancyNumber?: number;
}

export type PregnancyPersonalization = PregnancyPersonalizationSignals;

export interface UpdateMetadata {
  updatedAt: string;
  updatedBy?: string;
  source?: string;
  clientVersion?: string;
  changeSummary?: string;
}

export interface OnboardingCompletionInfo {
  completed: boolean;
  completedAt?: string;
  version?: number;
  source?: 'full_wizard' | 'anonymous_sync' | 'quick_start' | 'legacy';
}

/**
 * HealthContext: Personalization Context Contract
 * Path: `healthContexts/{uid}`
 */
export interface HealthContext {
  version: number;
  lifecycleStage: LifecycleStage;
  userMode?: UserMode;
  preferredName?: string;
  ageBracket?: AgeBracket;
  county?: string;
  subcounty?: string;
  location?: LocationPersonalization;
  language: 'en' | 'sw';
  pregnancy?: PregnancyPersonalizationSignals;
  childAgeBracket?: ChildAgeBracket;
  interests: string[];
  dietaryPreferences: string[];
  supportSystem?: SupportSystemType;
  havenResponseStyle: HavenResponseStyle;
  questionsForClinician?: string[];
  appointmentPreparationNotes?: string;
  onboarding?: OnboardingCompletionInfo;
  onboardingCompletedAt?: string;
  updatedAt: string;
  metadata?: UpdateMetadata;
}

export type ContextChangeReason =
  | 'initial_onboarding'
  | 'profile_edit'
  | 'context_sync'
  | 'lifecycle_transition'
  | 'preferences_update'
  | 'system_migration';

/**
 * HealthContextVersion: Historical audit snapshot
 * Path: `healthContextVersions/{uid}/versions/{versionId}`
 */
export interface HealthContextVersion extends HealthContext {
  id: string;
  reasonForChange: ContextChangeReason;
  createdAt: string;
}

/**
 * Authoritative clinical fields that MUST NOT be duplicated into HealthContext.
 * The authoritative source of truth for these is `pregnancies`, `children`, and clinical subcollections.
 */
export const FORBIDDEN_CLINICAL_FIELDS = [
  'lmp',
  'edd',
  'gestationalAgeWeeks',
  'gravida',
  'parity',
  'bloodGroup',
  'rhesusFactor',
  'chronicConditions',
  'currentMedications',
  'allergies',
  'ancEncounters',
  'birthOutcomes',
  'vaccines',
  'growthMeasurements',
  'muacMeasurements',
  'milestones',
  'illnesses',
  'authoritativeDiagnosis',
  'verifiedBloodPressure',
  'clinicalConditions',
  'verifiedMedications',
] as const;

