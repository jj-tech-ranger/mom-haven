export type HavenContextProvenance =
  | 'VERIFIED'
  | 'AUTHORITATIVE'
  | 'SYSTEM_DERIVED'
  | 'USER_REPORTED'
  | 'ANONYMOUS';

export const PROVENANCE_TRUST_RANK: Record<HavenContextProvenance, number> = {
  VERIFIED: 5,
  AUTHORITATIVE: 4,
  SYSTEM_DERIVED: 3,
  USER_REPORTED: 2,
  ANONYMOUS: 1,
};

export interface HavenContextFact<T = unknown> {
  value: T;
  provenance: HavenContextProvenance;
  source?: string;
  verifiedAt?: string;
}

export interface HavenPregnancyContext {
  id: string;
  status: string;
  gestationalAgeWeeks?: number;
  trimester?: 1 | 2 | 3;
  edd?: string;
  lmp?: string;
  gravida?: number;
  parity?: number;
  multiplePregnancy?: boolean;
}

export interface HavenChildContext {
  id: string;
  name?: string;
  dateOfBirth?: string;
  ageMonths?: number;
  ageFormatted?: string;
  sex?: string;
}

export interface HavenDerivedTiming {
  currentGestationalWeeks?: number;
  trimester?: 1 | 2 | 3;
  daysRemainingToEdd?: number;
  targetChildAgeMonths?: number;
}

export interface HavenContext {
  userMode?: HavenContextFact<'anonymous' | 'authenticated'>;
  lifecycleStage?: HavenContextFact<string>;
  preferredName?: HavenContextFact<string>;
  language?: HavenContextFact<'en' | 'sw'>;
  location?: HavenContextFact<{ county?: string; subcounty?: string }>;
  interests: HavenContextFact<string[]>;
  dietaryPreferences?: HavenContextFact<string[]>;
  havenResponseStyle?: HavenContextFact<string>;
  pregnancy?: HavenContextFact<HavenPregnancyContext>;
  children: Array<HavenContextFact<HavenChildContext>>;
  derivedTiming?: HavenContextFact<HavenDerivedTiming>;
}

export interface HavenContextRequest {
  uid: string;
  isAnonymous?: boolean;
  contextMode?: 'PREGNANCY' | 'CHILD';
  language?: 'en' | 'sw';
  clientProvidedContext?: Record<string, unknown>;
}

