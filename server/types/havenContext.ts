export type HavenContextProvenance = 'USER_REPORTED' | 'VERIFIED' | 'SYSTEM_DERIVED';

export interface HavenContextFact<T = unknown> {
  value: T;
  provenance: HavenContextProvenance;
}

export interface HavenContext {
  lifecycleStage?: HavenContextFact<string>;
  preferredName?: HavenContextFact<string>;
  language?: HavenContextFact<'en' | 'sw'>;
  location?: HavenContextFact<{ county?: string; subcounty?: string }>;
  interests: HavenContextFact<string[]>;
  havenResponseStyle?: HavenContextFact<string>;
  pregnancy?: HavenContextFact<{
    id: string;
    lmp?: string;
    edd?: string;
    gestationalAgeWeeks?: number;
    status: string;
    gravida?: number;
    parity?: number;
    multiplePregnancy?: boolean;
  }>;
  children: Array<HavenContextFact<{
    id: string;
    name?: string;
    dateOfBirth?: string;
    sex?: string;
  }>>;
}
