/**
 * MomHaven Health Summary & Clinician Context (Phase 7)
 *
 * Core architectural principle:
 * Combines Layer 2 (Personalization Context: user-reported preferences, language, support system)
 * with Layer 3 (Clinical Records: authoritative pregnancy, ANC, children, immunizations, growth)
 * and filtered Layer 2/3 health logs into a structured, provenance-aware summary.
 *
 * CRITICAL RULES:
 * 1. Never duplicate or blur authoritative clinical data with user-reported personalization.
 * 2. Clearly distinguish "Mother reported" (USER_REPORTED) from "Clinically verified" (VERIFIED).
 * 3. Never include clinician private notes in mother-facing context or leak unauthorized notes.
 * 4. Only include daily health logs explicitly appropriate for clinical review (vital measurements,
 *    severe symptoms/danger signs within 30 days) and exclude private personal journals.
 */

export type SummaryProvenance = 'USER_REPORTED' | 'VERIFIED' | 'SYSTEM_DERIVED';

export interface PatientReportedContextSummary {
  provenance: 'USER_REPORTED';
  lifecycleStage: string;
  preferredName: string;
  ageBracket?: string;
  location?: {
    county?: string;
    subcounty?: string;
    primaryHospitalFacilityId?: string;
    primaryHospitalName?: string;
  };
  language: 'en' | 'sw';
  interests: string[];
  dietaryPreferences: string[];
  supportSystem?: string;
  havenResponseStyle?: string;
  selfReportedPregnancy?: {
    pregnancyWeek?: number;
    dueDate?: string;
    dueDateSource?: string;
    multiplePregnancy?: boolean;
    pregnancyNumber?: number;
  };
  questionsForClinician: string[];
  appointmentPreparationNotes?: string;
}

export interface ClinicalAncEncounterSummary {
  id: string;
  date: string;
  visitNumber?: number;
  gestationWeeks?: number;
  bloodPressure?: string;
  weightKg?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  hemoglobin?: number;
  summary?: string;
  iptpGiven?: boolean;
  ifasGiven?: boolean;
  provenance: {
    status: 'VERIFIED' | 'REPORTED';
    enteredBy?: string;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
  };
}

export interface AuthoritativePregnancySummary {
  hasActivePregnancy: boolean;
  pregnancyId?: string;
  status?: string;
  lmp?: string;
  edd?: string;
  eddSource?: string;
  gravida?: number;
  parity?: number;
  bloodGroup?: string;
  clinicalConditions: string[];
  provenance: SummaryProvenance;
  currentStage?: {
    gestationalAgeWeeks: number;
    trimester: 1 | 2 | 3;
    daysRemaining: number;
    isCalculatedFromLmp: boolean;
  };
  ancSummary: {
    totalEncounters: number;
    verifiedCount: number;
    reportedCount: number;
    latestEncounterDate?: string;
    latestBloodPressure?: string;
    latestFundalHeightCm?: number;
    latestFetalHeartRate?: number;
    latestHemoglobin?: number;
    iptpCount: number;
    ifasCompliant?: boolean;
    encounters: ClinicalAncEncounterSummary[];
  };
}

export interface ChildHealthSummary {
  id: string;
  name: string;
  dateOfBirth?: string;
  ageMonths: number;
  ageFormatted: string;
  sex?: string;
  provenance: SummaryProvenance;
  immunizations: {
    totalAdministered: number;
    verifiedCount: number;
    recentRecords: Array<{
      id: string;
      vaccineName: string;
      dateGiven: string;
      batch?: string;
      provenance: { status: 'VERIFIED' | 'REPORTED'; verifiedBy?: string | null };
    }>;
  };
  growth: {
    latestWeightKg?: number;
    latestHeightCm?: number;
    latestMuacMm?: number;
    latestMeasurementDate?: string;
    muacClassification?: 'NORMAL' | 'MAM' | 'SAM';
    provenance?: { status: 'VERIFIED' | 'REPORTED'; verifiedBy?: string | null };
  };
}

export interface ClinicianHealthLogEntry {
  id: string;
  type: 'blood_pressure' | 'weight' | 'baby_movement' | 'symptoms';
  timestamp: string;
  values: Record<string, any>;
  hasDangerSigns?: boolean;
  dangerSignsList?: string[];
  notes?: string;
  source: 'USER_REPORTED';
  provenance: {
    status: 'REPORTED';
    enteredBy?: string;
  };
}

export interface ClinicalAppointmentSummary {
  id: string;
  date: string;
  type: string;
  facilityName?: string;
  clinicianName?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  provenance: SummaryProvenance;
}

export interface VerifiedClinicalHighlights {
  hasVerifiedPregnancy: boolean;
  verifiedAncContactsCount: number;
  verifiedVaccinesCount: number;
  verifiedLabReportsCount: number;
  verifiedUltrasoundCount: number;
  lastClinicalVerificationDate?: string;
  verifiedBy?: string;
}

export interface ReproductiveScreeningSummary {
  totalScreenings: number;
  latestScreeningDate?: string;
  hasSuspiciousOrPositive: boolean;
  alerts: string[];
  records: any[];
}

export interface PmtctHeiSummary {
  isHivExposed: boolean;
  maternalArtRegimen?: string;
  maternalArtVisitsCount: number;
  maternalViralLoadStatus?: string;
  maternalViralLoadResult?: string | number;
  infantArtProphylaxisRegimen?: string;
  infantCtxProphylaxisStatus?: string;
  infantTestsCompletedCount: number;
  hasAlerts: boolean;
  alerts: string[];
  carePlan?: {
    nextAppointmentDate?: string;
    activeMedications: string[];
    infantFeedingCounseling?: string;
  };
  records: any[];
}

export interface MomHavenHealthSummary {
  summaryId: string;
  generatedAt: string;
  mother: {
    id: string;
    displayName: string;
  };
  sessionContext?: {
    sessionId: string;
    clinicianId: string;
    facilityId?: string | null;
    expiresAt?: string;
  };
  patientContext: PatientReportedContextSummary;
  pregnancy: AuthoritativePregnancySummary;
  children: ChildHealthSummary[];
  recentHealthLogs: ClinicianHealthLogEntry[];
  appointments: ClinicalAppointmentSummary[];
  verifiedHighlights: VerifiedClinicalHighlights;
  questionsForClinician: string[];
  reproductiveScreening?: ReproductiveScreeningSummary;
  pmtct?: PmtctHeiSummary;
}
