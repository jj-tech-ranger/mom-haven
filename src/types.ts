// Canonical Data Types for MomHaven (Phase 0 Master Foundation)

export type UserRole = 'MOTHER' | 'PARTNER' | 'CLINICIAN' | 'ADMIN';

export type ProvenanceStatus = 'REPORTED' | 'VERIFIED';

export interface Provenance {
  status: ProvenanceStatus;
  enteredBy: string;
  enteredAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface MotherProfile {
  id?: string;
  userId: string;
  phone: string;
  dateOfBirth: string;
  county: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BirthPlan {
  preferredFacility?: string;
  backupFacility?: string;
  transportMode?: string;
  driverName?: string;
  driverPhone?: string;
  birthCompanion?: string;
  companionRelationship?: string;
  companionPhone?: string;
  bloodDonorName?: string;
  bloodDonorGroup?: string;
  bloodDonorPhone?: string;
  emergencyFundsSaved?: number;
  hospitalBagPacked?: string[];
  notes?: string;
  updatedAt?: string;
}

export interface Pregnancy {
  id: string;
  motherId: string;
  lmp?: string;
  edd?: string;
  gestationalAgeWeeks?: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  gravida?: number;
  parity?: number;
  previousPregnancies?: PreviousPregnancyRecord[];
  /** @deprecated Migrated into previousPregnancies */
  previousOutcomes?: string[];
  babyName?: string;
  birthPlan?: BirthPlan;
  chronicConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  bloodGroup?: string;
  rhesusFactor?: '+' | '-';
  outcomeDetails?: {
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryType?: 'SVD' | 'CS' | 'Assisted';
    outcomeType?: 'Live Birth' | 'Multiple Birth' | 'Stillbirth';
    facilityName?: string;
    attendantCadre?: string;
  };
}

export interface AncEncounter {
  id: string;
  pregnancyId: string;
  visitNumber: number;
  date: string;
  facilityId?: string;
  facilityName?: string;
  gestationalAgeWeeks?: number;
  weight?: number;
  systolicBp?: number;
  diastolicBp?: number;
  bloodPressure?: string;
  fundalHeight?: number;
  fetalHeartRate?: number;
  hbLevel?: number;
  urineAlbumin?: string;
  urineGlucose?: string;
  iptpGiven?: boolean;
  ironFolicGiven?: boolean;
  tdBoosterGiven?: boolean;
  mosquitoNetGiven?: boolean;
  nextAppointmentDate?: string;
  notes?: string;
  provenance: Provenance;
}

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River',
  'Tharaka Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
] as const;

export interface Child {
  id: string;
  motherId: string;
  name: string;
  dateOfBirth: string;
  sex: 'male' | 'female';
  birthWeightKg?: number;
  birthLengthCm?: number;
  headCircumferenceCm?: number;
  bloodGroup?: string;
  deliveryFacility?: string;
  deliveryType?: 'SVD' | 'CS' | 'Assisted';
  birthOutcomeId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChildVaccineRecord {
  id: string;
  childId: string;
  vaccineName: string;
  recommendedAgeBracket: string;
  dateAdministered: string;
  facilityName?: string;
  batchNumber?: string;
  administeredBy?: string;
  status: 'GIVEN' | 'MISSED' | 'SCHEDULED';
  adverseEvents?: string;
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  title: string;
  category: 'Ultrasound' | 'Lab Results' | 'Immunization' | 'Clinical Notes' | 'Prescriptions';
  date: string;
  facilityName?: string;
  fileUrl?: string;
  fileType?: string;
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

export interface IllnessRecord {
  id: string;
  childId: string;
  date: string;
  symptoms: string[];
  temperatureCelsius?: number;
  durationDays?: number;
  hasDangerSigns: boolean;
  dangerSigns?: string[];
  careActionTaken?: string;
  provenance: Provenance;
}

export interface ChildMilestoneRecord {
  id: string;
  childId: string;
  milestoneId: string;
  domain: string;
  achievedDate?: string;
  notes?: string;
  provenance: Provenance;
}

export interface NewbornRecord {
  id: string;
  childId: string;
  birthWeightKg?: number;
  birthLengthCm?: number;
  headCircumferenceCm?: number;
  apgarScore?: string;
  deliveryType?: 'SVD' | 'CS' | 'Assisted';
  deliveryFacilityId?: string;
  notes?: string;
  provenance: Provenance;
}

export interface PostnatalEncounter {
  id: string;
  childId: string;
  motherId: string;
  visit: '48h' | '1-2w' | '4-6w' | '4-6mo';
  date: string;
  motherFindings?: string;
  babyFindings?: string;
  provenance: Provenance;
}

export interface ImmunizationRecord {
  id: string;
  childId: string;
  vaccine: string;
  dose: string;
  dateGiven?: string;
  minimumEligibleDate: string;
  scheduledDate: string;
  recommendedActionDate: string;
  batchNumber?: string;
  facilityId?: string;
  provenance: Provenance;
}

export interface GrowthMeasurement {
  id: string;
  childId: string;
  date: string;
  ageMonths?: number;
  weightKg: number;
  heightCm?: number;
  muacCm?: number;
  headCircumferenceCm?: number;
  feedingStatus?: string;
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

export type MuacBand = 'SAM' | 'MAM' | 'AtRisk' | 'Normal';

export interface MuacMeasurement {
  id: string;
  childId: string;
  date: string;
  cm: number;
  band: MuacBand;
  provenance: Provenance;
}

export interface NutritionRecord {
  id: string;
  childId: string;
  date: string;
  feedingMethod: string;
  dietaryNotes?: string;
  provenance: Provenance;
}

export interface DevelopmentRecord {
  id: string;
  childId: string;
  date: string;
  milestone: string;
  category: 'motor' | 'cognitive' | 'speech' | 'social';
  achieved: boolean;
  notes?: string;
  provenance: Provenance;
}

export interface PartnerRelationship {
  id: string;
  motherId: string;
  partnerId: string;
  status: 'pending' | 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string | null;
}

export interface Facility {
  id: string;
  name: string;
  kmhflCode: string;
  county: string;
  subcounty: string;
  contactPhone: string;
}

export interface Clinician {
  uid: string;
  name?: string;
  email?: string;
  licenseNumber: string;
  cadre: string;
  facilityId: string;
  facilityName?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface ClinicianAccessSession {
  id: string;
  motherId: string;
  clinicianId: string;
  shareCode: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  revokedAt?: string | null;
}

export interface ClinicianPrivateNote {
  id: string;
  clinicianId: string;
  motherId: string;
  childId?: string | null;
  text: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  category: 'anc' | 'pnc' | 'immunization' | 'custom';
  completed: boolean;
  sharedWithPartner?: boolean;
  createdAt: string;
  notifiedAt?: string | null;
  sourceEventId?: string;
  deepLink?: string;
  childId?: string;
  pregnancyId?: string;
}

export interface PregnancySummary {
  motherId: string;
  motherName?: string;
  hasActivePregnancy: boolean;
  pregnancyId?: string;
  lmp?: string;
  edd?: string;
  eddFormatted?: string;
  gestationalAgeWeeks: number;
  gestationalWeeks: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
  weeksRemaining: number;
  status: 'active' | 'completed' | 'none';
  babyMilestone?: {
    size: string;
    emoji: string;
    fact: string;
  };
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface SavedEmergencyFacility {
  id: string;
  userId: string;
  facilityName: string;
  county: string;
  phone: string;
  isDefault?: boolean;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  objectType: string;
  objectId: string;
  timestamp: string;
  facilityId?: string | null;
  details?: Record<string, unknown>;
}

export interface HavenSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
}

export interface HavenMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  classification?: 'safe' | 'medication_request' | 'sensitive_topic' | 'insufficient_info' | 'emergency';
  suggestedFollowups?: string[];
  createdAt: string;
}

// Early Identification of Congenital Abnormalities (MOH Handbook p.17)
export interface CongenitalExamRecord {
  id: string;
  childId: string;
  motherId: string;
  examWindow: 'within48h' | 'at6weeks';
  date: string;
  examinerName?: string;
  facilityName?: string;
  // Body systems per Handbook p.17
  headSize: 'normal' | 'microcephalic' | 'hydrocephalic';
  headSizeDetails?: string;
  mouthGums: 'normal' | 'cleft_lip' | 'cleft_palate' | 'abnormal';
  mouthGumsDetails?: string;
  ears: 'normal' | 'abnormal';
  earsDetails?: string;
  armsLegs: 'normal' | 'abnormal';
  armsLegsDetails?: string; // muscle tone, joints, fingers/toes, club foot, congenital hip dislocation, extra/fused digits
  spineNeckBack: 'normal' | 'abnormal';
  spineNeckBackDetails?: string;
  bodyMovement: 'normal' | 'abnormal';
  bodyMovementDetails?: string; // floppiness, cerebral palsy flag
  cerebralPalsyRisk?: boolean;
  abdominalWall: 'normal' | 'abnormal';
  abdominalWallDetails?: string;
  genitalia: 'normal' | 'abnormal';
  genitaliaDetails?: string;
  anus: 'perforate' | 'imperforate' | 'abnormal';
  anusDetails?: string;
  hasAbnormality: boolean;
  abnormalFindingsList?: string[];
  referralOrActionTaken?: string;
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Postnatal Family Planning Tracking (MOH Handbook p.22)
export type FamilyPlanningMethod =
  | 'Implants'
  | 'IUCD'
  | 'Injectables (DMPA)'
  | 'POPs'
  | 'COCs'
  | 'Condoms'
  | 'BTL'
  | 'Vasectomy'
  | 'LAM'
  | 'Natural FP'
  | 'None'
  | 'Other';

export interface FamilyPlanningRecord {
  id: string;
  motherId: string;
  counselingDate: string;
  counselorName?: string;
  facilityName?: string;
  methodChosen: FamilyPlanningMethod | string;
  methodDetails?: string;
  dateStarted?: string;
  nextAppointmentDate?: string;
  removalDate?: string;
  adverseEffects?: string;
  reasonForSwitch?: string;
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Reproductive Organ Cancer Screening (MOH Handbook p.22)
export type CervicalTestType = 'HPV' | 'VIA' | 'VIA-VILI' | 'Pap smear';
export type CervicalResult = 'negative' | 'positive' | 'suspicious';
export type CervicalTreatment = 'cryotherapy' | 'thermoablation' | 'LEEP' | 'referred' | 'none' | 'other';

export type BreastTestType = 'CBE' | 'ultrasound' | 'mammography';
export type BreastResult = 'normal' | 'benign lump' | 'suspicious lump';

export interface CancerScreeningRecord {
  id: string;
  motherId: string;
  date: string;
  facilityName?: string;
  examinerName?: string;
  // Cervical Screening
  cervicalDone?: boolean;
  cervicalTestType?: CervicalTestType;
  cervicalResult?: CervicalResult;
  cervicalTreatment?: CervicalTreatment | string;
  cervicalReferralFacility?: string;
  cervicalNotes?: string;
  // Breast Screening
  breastDone?: boolean;
  breastTestType?: BreastTestType;
  breastResult?: BreastResult;
  breastTreatmentOrReferral?: string;
  breastNotes?: string;
  // Overall referral & alerts
  hasPositiveOrSuspicious: boolean;
  alerts?: string[];
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Eye Care Assessment (MOH Handbook p.25)
export type EyeCareAgeStage = 'birth' | '6months' | '9months' | '18months';

export interface EyeCareAssessment {
  id: string;
  childId: string;
  motherId: string;
  ageStage: EyeCareAgeStage;
  date: string;
  teoGivenAtBirth?: boolean; // Tetracycline Eye Ointment
  pupil: 'black' | 'white'; // White pupil is flagged URGENT (cataract / retinoblastoma)
  sightFollowing: 'present' | 'absent';
  squint: 'present' | 'absent';
  otherProblems?: string;
  isUrgentWhitePupil?: boolean;
  hasAbnormality?: boolean;
  notes?: string;
  facilityName?: string;
  examinerName?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Teeth Development Chart (MOH Handbook p.26)
export interface ToothEruptionItem {
  id: string;
  toothKey: string;
  name: string;
  jaw: 'upper' | 'lower' | 'both';
  normalAgeRangeMonths: string;
  dateSeen?: string;
  notes?: string;
}

export interface ToothEruptionRecord {
  id: string;
  childId: string;
  motherId: string;
  teeth: ToothEruptionItem[];
  updatedAt?: string;
  provenance: Provenance;
}

// Adverse Events Following Immunization - AEFI (MOH Handbook p.34)
export interface AefiReport {
  id: string;
  childId: string;
  motherId: string;
  vaccineRecordId?: string;
  date: string;
  vaccineOrAntigen: string;
  batchNumber?: string;
  manufacturer?: string;
  manufactureDate?: string;
  expiryDate?: string;
  adverseEventDescription: string;
  severity: 'mild' | 'moderate' | 'severe';
  reportedToFacility: boolean;
  facilityName?: string;
  reportedAt?: string;
  actionTaken?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Hospital Admissions Log (MOH Handbook p.40)
export interface HospitalAdmissionRecord {
  id: string;
  motherId: string;
  childId?: string;
  personType: 'mother' | 'child';
  hospitalName: string;
  admissionNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  dischargeDiagnosis: string;
  outcome?: string; // Discharged well, Referred, Under treatment
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Special Clinical Attendance (MOH Handbook p.40)
export interface SpecialClinicalAttendanceRecord {
  id: string;
  motherId: string;
  childId?: string;
  personType: 'mother' | 'child';
  hospitalName: string;
  clinicName: string; // e.g. Pediatric Cardiology, Sickle Cell, ENT, High Risk ANC
  date: string;
  reasonForAttendance: string;
  drugsGiven?: string;
  dischargeDiagnosis: string;
  notes?: string;
  provenance: Provenance;
  createdAt?: string;
}

// Cancer screening aliases for modal compatibility
export type CervicalCancerTestType = CervicalTestType;
export type CervicalScreeningResult = CervicalResult;
export type CervicalCancerTreatment = CervicalTreatment;
export type BreastScreeningResult = BreastResult;

// Tooth aliases for modal compatibility
export type ToothType = string;
export type ToothStatus = 'not_erupted' | 'erupted' | 'erupting' | 'fully_erupted' | 'shed';

// Antenatal Profile & Maternal Serology Tracking (MOH Handbook pp.7, 11)
export type BloodGroup = 'A' | 'B' | 'AB' | 'O';
export type RhesusFactor = '+' | '-' | 'Positive' | 'Negative';
export type SerologyResult = 'reactive' | 'non-reactive' | 'not-tested' | 'inconclusive';

export interface SerologyRepeatRow {
  id?: string;
  testType: 'HIV' | 'Syphilis' | 'Hepatitis B' | string;
  milestone?: string;
  status?: string;
  dateTested?: string;
  result?: SerologyResult | string;
  nextAppointmentDate?: string;
  comments?: string;
  facilityName?: string;
  testedBy?: string;
}

export type SerologyRepeatScheduleItem = SerologyRepeatRow;

export interface ObstetricUltrasoundScan {
  scanNumber: 1 | 2;
  windowLabel: string; // 'Ultrasound #1 (<24 weeks)' | 'Ultrasound #2 (3rd trimester)'
  date?: string;
  gestationWeeks?: number;
  gestationalAgeWeeks?: number;
  placentaLocation?: string;
  fetalViability?: boolean;
  findings?: string;
  facilityName?: string;
}

export type UltrasoundExam = ObstetricUltrasoundScan;

export interface AntenatalProfile {
  id: string;
  pregnancyId: string;
  motherId: string;
  // Blood & Urine baseline
  bloodGroup?: BloodGroup;
  rhesusFactor?: RhesusFactor;
  urinalysisResult?: string; // Albumin, Glucose
  bloodRbs?: string; // Random Blood Sugar in mmol/L
  // TB ICF screening
  tbIcfScreeningOutcome?: 'negative' | 'positive' | 'suspect' | 'on_treatment';
  tbIptDate?: string; // Isoniazid Preventive Therapy start date
  tbIptNextVisit?: string;
  // Partner HIV status
  partnerHivStatus?: 'reactive' | 'non-reactive' | 'not-tested' | string;
  // Triple serology initial status
  hivStatus?: SerologyResult | string;
  syphilisStatus?: SerologyResult | string;
  hepatitisBStatus?: SerologyResult | string;
  // Repeat serology schedule
  serologyRepeatSchedule: SerologyRepeatRow[];
  // Obstetric Ultrasounds
  ultrasound1?: ObstetricUltrasoundScan;
  ultrasound2?: ObstetricUltrasoundScan;
  provenance: Provenance;
  createdAt?: string;
  updatedAt?: string;
}

// Detailed Previous Pregnancy History (Kenya MOH Handbook p.6)
export interface PreviousPregnancyRecord {
  id?: string;
  pregnancyOrder: number; // 1, 2, 3...
  year?: number | string;
  ancVisitsAttended?: number;
  placeOfChildbirth?: string; // Facility name or home
  gestationWeeks?: number;
  durationOfLabour?: string; // e.g. "8 hrs", "12 hrs"
  modeOfDelivery?: 'SVD' | 'Caesarean section' | 'Vacuum extraction' | 'Breech delivery' | 'Assisted vaginal' | string;
  birthWeightGrams?: number;
  sex?: 'Male' | 'Female' | 'Unknown';
  outcome?: 'Alive and well' | 'Fresh stillbirth' | 'Macerated stillbirth' | 'Neonatal death' | 'Abortion / Miscarriage' | string;
  puerperiumNotes?: string;
  notes?: string; // Best-effort migration field for prior free-text outcomes
}

// PMTCT & HIV-Exposed Infant (HEI) Management (Kenya MOH 216 Handbook pp.11-12, 36)
export interface MaternalArtVisit {
  visitNumber: 1 | 2 | 3 | 4;
  date?: string;
  regimen?: string; // e.g. "TDF + 3TC + DTG", "AZT + 3TC + ATV/r"
  dispensed?: boolean;
  adherenceAssessed?: boolean;
  comments?: string; // Reason for regimen change or clinical observations
}

export interface MaternalViralLoadRecord {
  dateSampleTaken?: string;
  resultCopiesMl?: number | string; // e.g. "< 50", "LDL", 240, 1500
  suppressionStatus?: 'suppressed' | 'unsuppressed' | 'pending' | 'target_not_detected';
  dateResultReceived?: string;
  nextVlDueDate?: string;
  comments?: string;
}

export interface InfantArtProphylaxis {
  regimen: string; // e.g. "AZT + NVP syrup"
  startDate: string;
  durationWeeks?: number; // e.g. 6 weeks, 12 weeks, or through cessation
  continuedUntilDate?: string;
  status: 'active' | 'completed' | 'stopped_due_to_positive' | 'discontinued';
  comments?: string;
}

export interface InfantCtxProphylaxis {
  dose: string; // e.g. "2.5 mL daily"
  startDate: string; // usually 6 weeks of age
  continuedUntilDate?: string; // 6 weeks post complete cessation of breastfeeding
  status: 'active' | 'completed' | 'discontinued';
  comments?: string;
}

export type HeiTestMilestone =
  | '1st_dna_pcr_6wk'     // 1st contact after delivery / 6 weeks
  | '2nd_dna_pcr_6mo'     // at 6 months
  | '3rd_dna_pcr_12mo'    // at 12 months
  | 'antibody_18mo'       // at 18 months
  | 'antibody_24mo'       // at 24 months (or every 6 mo if breastfeeding)
  | 'final_antibody_6wk_wean'; // 6 weeks after complete cessation of breastfeeding

export interface HeiDbsTestRecord {
  id: string;
  milestone: HeiTestMilestone;
  label: string; // e.g. "1st DNA PCR (Birth / 6 Weeks)"
  dateSampleCollected?: string;
  dateResultReceived?: string;
  sampleType: 'DBS' | 'Plasma' | 'Rapid Test';
  result?: 'negative' | 'positive' | 'inconclusive' | 'pending' | 'not_done';
  confirmatoryPcrCollected?: boolean;
  baselineViralLoadTaken?: boolean;
  labNumber?: string;
  facilityName?: string;
  comments?: string;
}

export interface PmtctHeiRecord {
  id: string;
  motherId: string;
  pregnancyId?: string;
  childId?: string;
  facilityName?: string;
  isHivExposed: boolean;
  // Maternal ART tracking (pp.11-12)
  maternalHivStatus: 'reactive' | 'non-reactive' | 'unknown';
  maternalArtStartDate?: string;
  maternalBaselineRegimen?: string;
  maternalArtVisits: MaternalArtVisit[];
  maternalViralLoad?: MaternalViralLoadRecord;
  // Infant Prophylaxis (pp.12, 36)
  infantArtProphylaxis?: InfantArtProphylaxis;
  infantCtxProphylaxis?: InfantCtxProphylaxis;
  infantIptGiven?: boolean;
  infantIptDate?: string;
  // Infant Testing Schedule (p.36)
  infantDbsTests: HeiDbsTestRecord[];
  // Non-stigmatizing care plan for mother view
  carePlanSummary?: {
    nextAppointmentDate?: string;
    activeMedications: string[];
    infantFeedingCounseling: 'exclusive_breastfeeding' | 'exclusive_replacement' | 'mixed_avoided';
    supportGroupReferred?: boolean;
    counselorName?: string;
  };
  provenance: Provenance;
  createdAt: string;
  updatedAt: string;
}



