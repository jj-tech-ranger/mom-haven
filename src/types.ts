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
  previousOutcomes?: string[];
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
  createdAt: string;
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

