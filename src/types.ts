/**
 * MomHaven Canonical Firestore Data Model & Application Types
 * Compliant with Kenyan Ministry of Health (MOH 216) & Phase 0 Specifications
 */

export type UserRole = 'MOTHER' | 'PARTNER' | 'CLINICIAN' | 'ADMIN';
export type AppViewRole = 'mother' | 'partner' | 'clinician' | 'admin';

export type ProvenanceStatus = 'REPORTED' | 'VERIFIED';

/**
 * Embedded Provenance Object
 * The single most important shared pattern in the entire data model.
 * A record is NEVER silently changed from REPORTED to VERIFIED without
 * verifiedBy and verifiedAt both being set.
 */
export interface Provenance {
  status: ProvenanceStatus;
  enteredBy: string; // User UID
  enteredAt: string; // ISO date / Server Timestamp
  verifiedBy: string | null; // Clinician UID or null
  verifiedAt: string | null; // ISO date / Server Timestamp or null
  verifiedByRole?: string | null;
  facilityName?: string | null;
  kmhflCode?: string | null;
  clinicianName?: string | null;
  source?: 'reported_caregiver' | 'verified_clinician';
  recordedAt?: string;
}

// 1. users/{uid}
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

// 2. motherProfiles/{uid}
export interface MotherProfileDoc {
  uid: string;
  phone?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  county?: string;
  subCounty?: string;
  fullName?: string;
  bloodGroup?: string;
  rhesus?: string;
  gravida?: number;
  parity?: number;
  para?: number;
  isFirstPregnancy?: boolean;
  preExistingConditions?: string[];
  surgicalHistory?: string;
  priorDeliveries?: Array<{
    year: string;
    deliveryType: string;
    outcome: string;
    birthWeightKg?: string;
    facility?: string;
  }>;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  facilityName?: string;
  kmhflCode?: string;
  ancNumber?: string;
  provenance?: Provenance;
}

// 3. pregnancies/{pregnancyId}
export interface PregnancyDoc {
  id: string;
  motherId: string;
  lmp?: string; // Last menstrual period
  edd?: string; // Expected delivery date
  lastMenstrualPeriod?: string;
  estimatedDeliveryDate?: string;
  gestationalAgeWeeks?: number;
  status: 'active' | 'completed';
  createdAt: string;
}

// subcollection: pregnancies/{id}/birthPlan or birthPlans/{pregnancyId}
export interface BirthPlanDoc {
  id: string;
  pregnancyId: string;
  motherId: string;
  facilityName: string;
  backupFacilityName?: string;
  supportPersonName: string;
  supportPersonPhone: string;
  supportPersonRelationship: string;
  transportMode: string;
  driverName?: string;
  driverPhone?: string;
  estimatedTravelTimeMinutes?: number;
  emergencyFundPrepared: boolean;
  bloodDonorIdentified: boolean;
  bloodDonorName?: string;
  hospitalBagPacked: boolean;
  babyClothesPacked: boolean;
  preferences: {
    delayedCordClamping: boolean;
    immediateSkinToSkin: boolean;
    exclusiveBreastfeeding: boolean;
    painReliefPreference?: string;
  };
  specialNotes?: string;
  status: 'draft' | 'complete';
  sharedWithPartner?: boolean;
  updatedAt: string;
}

// subcollection: pregnancies/{id}/ancEncounters/{id}
export interface AncEncounterDoc {
  id: string;
  pregnancyId: string;
  date: string;
  facilityId?: string;
  facilityName?: string;
  visitNumber?: number;
  gestationWeeks?: number;
  weight?: number;
  bloodPressure?: string;
  fundalHeight?: number;
  fetalHeartRate?: number;
  notes?: string;
  provenance: Provenance;
}

// 4. children/{childId}
export interface ChildDoc {
  id: string;
  motherId: string;
  name: string;
  dateOfBirth: string;
  sex: 'boy' | 'girl';
  birthOutcomeId?: string;
  birthWeightGrams?: number;
  birthLengthCm?: number;
  cwcNumber?: string;
  facilityName?: string;
  createdAt: string;
}

// subcollection: children/{id}/newbornRecords/{id}
export interface NewbornRecordDoc {
  id: string;
  childId: string;
  date: string;
  apgarScore1Min?: number;
  apgarScore5Min?: number;
  headCircumferenceCm?: number;
  eyeProphylaxisGiven: boolean;
  vitaminKGiven: boolean;
  bcgGiven: boolean;
  opv0Given: boolean;
  provenance: Provenance;
}

// subcollection: children/{id}/postnatalEncounters/{id}
export interface PostnatalEncounterDoc {
  id: string;
  childId: string;
  visit: '48h' | '1-2w' | '4-6w' | '4-6mo';
  date: string;
  motherFindings: string;
  babyFindings: string;
  provenance: Provenance;
}

// subcollection: children/{id}/immunizationRecords/{id}
export interface ImmunizationRecordDoc {
  id: string;
  childId: string;
  vaccine: string;
  dose: string;
  dateGiven?: string;
  minimumEligibleDate: string; // Earliest allowed by interval logic
  scheduledDate: string; // Date on approved schedule
  recommendedActionDate: string; // Date caregiver should act
  status: 'given' | 'due' | 'upcoming' | 'missed';
  provenance: Provenance;
}

// subcollection: children/{id}/growthMeasurements/{id}
export interface GrowthMeasurementDoc {
  id: string;
  childId: string;
  date: string;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  provenance: Provenance;
}

// subcollection: children/{id}/muacMeasurements/{id}
export interface MuacMeasurementDoc {
  id: string;
  childId: string;
  date: string;
  cm: number;
  band: 'SAM' | 'MAM' | 'AtRisk' | 'Normal';
  provenance: Provenance;
}

// subcollection: children/{id}/nutritionRecords/{id}
export interface NutritionRecordDoc {
  id: string;
  childId: string;
  date: string;
  feedingType: 'Exclusive Breastfeeding' | 'Complementary' | 'Replacement';
  vitaminADose?: string;
  dewormingDose?: string;
  notes?: string;
  provenance: Provenance;
}

// subcollection: children/{id}/developmentRecords/{id}
export interface DevelopmentRecordDoc {
  id: string;
  childId: string;
  date: string;
  milestoneTitle: string;
  ageCategory: string;
  achieved: boolean;
  notes?: string;
  provenance: Provenance;
}

// 5. partnerRelationships/{id}
export interface PartnerRelationshipDoc {
  id: string;
  motherId: string;
  partnerId: string;
  partnerName?: string;
  partnerPhone?: string;
  sharedSections?: string[];
  status: 'pending' | 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string | null;
}

// 6. facilities/{facilityId}
export interface FacilityDoc {
  id: string;
  name: string;
  kmhflCode: string;
  county: string;
  subcounty: string;
  contactPhone: string;
  level?: string;
  ambulanceAvailable?: boolean;
  maternityWardAvailable?: boolean;
}

// 7. clinicians/{uid}
export interface ClinicianDoc {
  uid: string;
  licenseNumber: string;
  cadre: string;
  facilityId: string;
  facilityName?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

// 8. clinicianAccessSessions/{id}
// Temporary grant with authoritative expiresAt check
export interface ClinicianAccessSessionDoc {
  id: string;
  motherId: string;
  clinicianId: string;
  shareCode: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  revokedAt?: string | null;
}

// 9. clinicianPrivateNotes/{id}
// CRITICAL: This collection must NEVER be readable by the MOTHER or PARTNER role
export interface ClinicianPrivateNoteDoc {
  id: string;
  clinicianId: string;
  motherId: string;
  childId?: string;
  text: string;
  createdAt: string;
}

// 10. reminders/{id}
export interface ReminderDoc {
  id: string;
  userId: string;
  title: string;
  detail?: string;
  dueDate: string;
  urgency?: 'urgent' | 'normal' | 'info';
  category: 'ANC' | 'Immunization' | 'PNC' | 'Medication' | 'Milestone' | 'SelfCare';
  type?: 'anc' | 'supplement' | 'development' | 'immunization' | 'general';
  completed: boolean;
  facility?: string;
  dosage?: string;
  clinicalGuidance?: string;
  relatedRecordId?: string;
  createdAt: string;
}

// 10b. notifications/{id}
export interface NotificationDoc {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'ANC' | 'Immunization' | 'Medication' | 'Guidance' | 'System';
  read: boolean;
  timestamp: string;
  reminderId?: string;
  urgency?: 'urgent' | 'normal' | 'info';
}

// 11. emergencyContacts/{id}
export interface EmergencyContactDoc {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  role: 'partner' | 'driver' | 'doctor' | 'facility' | 'other';
}

// 12. savedEmergencyFacilities/{id}
export interface SavedEmergencyFacilityDoc {
  id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  phone: string;
  notes?: string;
}

// 13. auditEvents/{id}
export interface AuditEventDoc {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  objectType: string;
  objectId: string;
  timestamp: string;
  facilityId?: string;
}

// 14. havenSessions/{id}/messages/{id}
export interface HavenSessionDoc {
  id: string;
  userId: string;
  createdAt: string;
}

export interface HavenMessageDoc {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}
