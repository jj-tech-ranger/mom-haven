/**
 * MomHaven Health Summary Service (Phase 7)
 *
 * Core architectural principle:
 * Assembles a structured summary layer connecting the Personalization Context (Layer 2)
 * to Clinical Records (Layer 3) with explicit provenance and Zero-Trust access control.
 *
 * CRITICAL DIRECTIVES:
 * 1. Never duplicate or blur authoritative clinical data with user-reported personalization.
 * 2. Clearly distinguish "Mother reported" (USER_REPORTED) from "Clinically verified" (VERIFIED).
 * 3. Never include clinician private notes in the mother's personalization context or leak unauthorized notes.
 * 4. Only include daily health logs explicitly appropriate for clinical review (vital measurements,
 *    severe symptoms/danger signs within 30 days) and exclude private personal journals.
 * 5. Strictly enforce authorized clinician session validation before generating summary.
 */

import { adminDb, requireActiveSession, requireClinician, logAudit, ApiError } from '../clinicianAccess.js';
import { getHealthContextForUser, ServerHealthContext } from './healthContextService.js';
import { getPatientRecords, filterClinicianSummaryLogs } from './patientRecordService.js';
import { calculateGestationFromLmp } from '../../src/utils/clinicalCalculations.js';
import { calculateChildAge } from './contextSources.js';
import type {
  MomHavenHealthSummary,
  PatientReportedContextSummary,
  AuthoritativePregnancySummary,
  ClinicalAncEncounterSummary,
  ChildHealthSummary,
  ClinicianHealthLogEntry,
  ClinicalAppointmentSummary,
  VerifiedClinicalHighlights,
} from '../../src/types/healthSummary.js';

export async function getMotherDisplayName(motherId: string): Promise<string> {
  try {
    const profile = await adminDb.doc(`motherProfiles/${motherId}`).get();
    if (profile.exists && profile.data()?.fullName) {
      return String(profile.data()!.fullName);
    }
    const user = await adminDb.doc(`users/${motherId}`).get();
    if (user.exists) {
      return String(user.data()?.displayName || user.data()?.email?.split('@')[0] || 'Mama');
    }
  } catch (error) {
    console.warn(`[HealthSummaryService] Could not fetch mother name for ${motherId}:`, error);
  }
  return 'Mama';
}

/**
 * Builds the structured MomHaven Health Summary by combining controlled services.
 * Does not expose raw Firestore documents, excludes clinician private notes,
 * and preserves exact provenance tags for every section.
 */
export async function buildHealthSummary(
  motherId: string,
  clinicianId?: string,
  sessionContext?: {
    sessionId: string;
    clinicianId: string;
    facilityId?: string | null;
    expiresAt?: string;
  },
  asOf: Date = new Date(),
): Promise<MomHavenHealthSummary> {
  if (!motherId) {
    throw new ApiError(400, 'Mother ID is required to generate health summary.');
  }

  // Fetch personalization context and clinical records via controlled services in parallel
  const [healthContext, records, displayName] = await Promise.all([
    getHealthContextForUser(motherId).catch(() => null),
    getPatientRecords(motherId).catch(() => ({
      pregnancies: [],
      children: [],
      patientReportedHomeMonitoring: [],
      ancEncounters: [],
      immunizationRecords: [],
      growthMeasurements: [],
      muacMeasurements: [],
    } as any)),
    getMotherDisplayName(motherId),
  ]);

  return assembleHealthSummary(
    motherId,
    healthContext,
    records,
    displayName,
    clinicianId,
    sessionContext,
    asOf,
  );
}

/**
 * Validates clinician credentials, approval status, and active session boundaries.
 * Enforces the exact security policy:
 * 1. Must have CLINICIAN role
 * 2. Clinician verification status must be 'approved'
 * 3. Session must exist and be 'active'
 * 4. Clinician and Mother must match session bindings
 * 5. Session must not be expired
 */
export function validateClinicianAccess(
  clinicianUser: { role: string } | null,
  clinicianProfile: { verificationStatus: string } | null,
  session: {
    status: string;
    clinicianId: string;
    motherId: string;
    expiresAt: Date | string | { toDate?: () => Date };
  } | null,
  requestedClinicianId: string,
  requestedMotherId: string,
  now: Date = new Date(),
): { valid: boolean; error?: { status: number; message: string } } {
  if (!clinicianUser || clinicianUser.role !== 'CLINICIAN') {
    return { valid: false, error: { status: 403, message: 'Clinician access required.' } };
  }
  if (!clinicianProfile || clinicianProfile.verificationStatus !== 'approved') {
    return { valid: false, error: { status: 403, message: 'Your clinician account is awaiting verification.' } };
  }
  if (!session || session.status !== 'active') {
    return { valid: false, error: { status: 403, message: 'No active access session for this patient.' } };
  }
  if (session.clinicianId !== requestedClinicianId || session.motherId !== requestedMotherId) {
    return { valid: false, error: { status: 403, message: 'No active access session for this patient.' } };
  }
  let exp: Date;
  if (session.expiresAt instanceof Date) {
    exp = session.expiresAt;
  } else if (typeof session.expiresAt === 'object' && session.expiresAt && typeof (session.expiresAt as any).toDate === 'function') {
    exp = (session.expiresAt as any).toDate();
  } else {
    exp = new Date(session.expiresAt as string);
  }
  if (isNaN(exp.getTime()) || exp <= now) {
    return { valid: false, error: { status: 403, message: 'Access session has expired.' } };
  }
  return { valid: true };
}

/**
 * Pure aggregation function:
 * Assembles the MomHaven Health Summary from retrieved context and records.
 * Ensures provenance guarantees, clinical condition preservation, and
 * complete exclusion of clinician private notes.
 */
export function assembleHealthSummary(
  motherId: string,
  healthContext: ServerHealthContext | null,
  records: any,
  displayName?: string,
  clinicianId?: string,
  sessionContext?: {
    sessionId: string;
    clinicianId: string;
    facilityId?: string | null;
    expiresAt?: string;
  },
  asOf: Date = new Date(),
): MomHavenHealthSummary {
  // 1. Patient-Reported Context (Layer 2)
  const preferredName = healthContext?.preferredName || displayName || 'Mama';
  const patientContext: PatientReportedContextSummary = {
    provenance: 'USER_REPORTED',
    lifecycleStage: healthContext?.lifecycleStage || 'pregnancy',
    preferredName,
    ageBracket: healthContext?.ageBracket,
    location: {
      county: healthContext?.location?.county || healthContext?.county,
      subcounty: healthContext?.location?.subcounty || healthContext?.subcounty,
    },
    language: healthContext?.language === 'sw' ? 'sw' : 'en',
    interests: Array.isArray(healthContext?.interests) ? healthContext.interests : [],
    dietaryPreferences: Array.isArray(healthContext?.dietaryPreferences) ? healthContext.dietaryPreferences : [],
    supportSystem: healthContext?.supportSystem,
    havenResponseStyle: healthContext?.havenResponseStyle,
    selfReportedPregnancy: healthContext?.pregnancy
      ? {
          pregnancyWeek: healthContext.pregnancy.pregnancyWeek,
          dueDate: healthContext.pregnancy.dueDate,
          dueDateSource: healthContext.pregnancy.dueDateSource,
          multiplePregnancy: healthContext.pregnancy.multiplePregnancy,
          pregnancyNumber: healthContext.pregnancy.pregnancyNumber,
        }
      : undefined,
    questionsForClinician: Array.isArray(healthContext?.questionsForClinician)
      ? healthContext.questionsForClinician.filter(q => typeof q === 'string' && q.trim().length > 0)
      : [],
    appointmentPreparationNotes: healthContext?.appointmentPreparationNotes,
  };

  // 2. Authoritative Pregnancy & ANC (Layer 3)
  const rawPregnancies = (records.pregnancies || []) as any[];
  const activePreg = rawPregnancies.find(p => p.status === 'active') || rawPregnancies[0] || null;

  let pregnancySummary: AuthoritativePregnancySummary;
  if (activePreg) {
    let currentStage: AuthoritativePregnancySummary['currentStage'] = undefined;

    if (activePreg.lmp) {
      try {
        const ga = calculateGestationFromLmp(activePreg.lmp, asOf);
        currentStage = {
          gestationalAgeWeeks: ga.gestationalAgeWeeks,
          trimester: ga.trimester,
          daysRemaining: ga.daysRemaining,
          isCalculatedFromLmp: true,
        };
      } catch {
        // Fall back to recorded gestational age
      }
    }

    if (!currentStage && typeof activePreg.gestationalAgeWeeks === 'number') {
      const weeks = activePreg.gestationalAgeWeeks;
      const trimester: 1 | 2 | 3 = weeks <= 12 ? 1 : weeks <= 27 ? 2 : 3;
      const daysRemaining = Math.max(0, (40 - weeks) * 7);
      currentStage = {
        gestationalAgeWeeks: weeks,
        trimester,
        daysRemaining,
        isCalculatedFromLmp: false,
      };
    }

    // Filter and map ANC encounters
    const rawAncEncounters = (records.ancEncounters || []) as any[];
    const relevantAnc = rawAncEncounters
      .filter(e => !e.pregnancyId || e.pregnancyId === activePreg.id)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const mappedAnc: ClinicalAncEncounterSummary[] = relevantAnc.map((e, idx) => ({
      id: e.id || `anc-${idx}`,
      date: e.date || '',
      visitNumber: e.visitNumber,
      gestationWeeks: e.gestationWeeks,
      bloodPressure: e.bp || e.bloodPressure,
      weightKg: e.weightKg || e.weight,
      fundalHeightCm: e.fundalHeight || e.fundalHeightCm,
      fetalHeartRate: e.fhr || e.fetalHeartRate,
      hemoglobin: e.hb || e.hemoglobin,
      summary: e.summary,
      iptpGiven: e.iptp === true || e.iptpGiven === true,
      ifasGiven: e.ifas === true || e.ifasGiven === true,
      provenance: {
        status: e.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'REPORTED',
        enteredBy: e.provenance?.enteredBy,
        verifiedBy: e.provenance?.verifiedBy || null,
        verifiedAt: e.provenance?.verifiedAt || null,
      },
    }));

    const verifiedAnc = mappedAnc.filter(e => e.provenance.status === 'VERIFIED');
    const reportedAnc = mappedAnc.filter(e => e.provenance.status === 'REPORTED');
    const latestAnc = mappedAnc[0];

    pregnancySummary = {
      hasActivePregnancy: true,
      pregnancyId: activePreg.id,
      status: activePreg.status || 'active',
      lmp: activePreg.lmp,
      edd: activePreg.edd,
      eddSource: activePreg.eddSource,
      gravida: activePreg.gravida,
      parity: activePreg.parity,
      clinicalConditions: Array.isArray(activePreg.clinicalConditions)
        ? activePreg.clinicalConditions
        : Array.isArray(activePreg.conditions)
          ? activePreg.conditions
          : [],
      provenance: activePreg.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'USER_REPORTED',
      currentStage,
      ancSummary: {
        totalEncounters: mappedAnc.length,
        verifiedCount: verifiedAnc.length,
        reportedCount: reportedAnc.length,
        latestEncounterDate: latestAnc?.date,
        latestBloodPressure: latestAnc?.bloodPressure,
        latestFundalHeightCm: latestAnc?.fundalHeightCm,
        latestFetalHeartRate: latestAnc?.fetalHeartRate,
        latestHemoglobin: latestAnc?.hemoglobin,
        iptpCount: mappedAnc.filter(e => e.iptpGiven).length,
        ifasCompliant: mappedAnc.some(e => e.ifasGiven),
        encounters: mappedAnc,
      },
    };
  } else {
    pregnancySummary = {
      hasActivePregnancy: false,
      clinicalConditions: [],
      provenance: 'USER_REPORTED',
      ancSummary: {
        totalEncounters: 0,
        verifiedCount: 0,
        reportedCount: 0,
        iptpCount: 0,
        encounters: [],
      },
    };
  }

  // 3. Children (Layer 3)
  const rawChildren = (records.children || []) as any[];
  const rawImmunizations = (records.immunizationRecords || []) as any[];
  const rawGrowth = (records.growthMeasurements || []) as any[];
  const rawMuac = (records.muacMeasurements || []) as any[];

  const childrenSummary: ChildHealthSummary[] = rawChildren.map((c, idx) => {
    const ageCalc = c.dateOfBirth ? calculateChildAge(c.dateOfBirth, asOf) : null;
    const childVaccines = rawImmunizations.filter(v => v.childId === c.id || !v.childId);
    const verifiedVaccines = childVaccines.filter(v => v.provenance?.status === 'VERIFIED');

    const childGrowth = rawGrowth
      .filter(g => g.childId === c.id || !g.childId)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    const latestGrowth = childGrowth[0];

    const childMuac = rawMuac
      .filter(m => m.childId === c.id || !m.childId)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    const latestMuac = childMuac[0];

    let muacClassification: 'NORMAL' | 'MAM' | 'SAM' | undefined;
    const muacVal = latestMuac?.measurementMm || latestMuac?.muacMm;
    if (typeof muacVal === 'number') {
      if (muacVal >= 125) muacClassification = 'NORMAL';
      else if (muacVal >= 115) muacClassification = 'MAM';
      else muacClassification = 'SAM';
    }

    return {
      id: c.id || `child-${idx}`,
      name: c.name || `Child ${idx + 1}`,
      dateOfBirth: c.dateOfBirth,
      ageMonths: ageCalc?.ageMonths ?? 0,
      ageFormatted: ageCalc?.ageFormatted ?? 'Age unknown',
      sex: c.sex,
      provenance: c.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'USER_REPORTED',
      immunizations: {
        totalAdministered: childVaccines.length,
        verifiedCount: verifiedVaccines.length,
        recentRecords: childVaccines.slice(0, 5).map(v => ({
          id: v.id,
          vaccineName: v.vaccineName || v.name || 'Vaccine',
          dateGiven: v.dateGiven || v.date || '',
          batch: v.batch,
          provenance: {
            status: v.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'REPORTED',
            verifiedBy: v.provenance?.verifiedBy || null,
          },
        })),
      },
      growth: {
        latestWeightKg: latestGrowth?.weightKg,
        latestHeightCm: latestGrowth?.heightCm,
        latestMuacMm: muacVal,
        latestMeasurementDate: latestGrowth?.date || latestMuac?.date,
        muacClassification,
        provenance: {
          status: (latestGrowth?.provenance?.status === 'VERIFIED' || latestMuac?.provenance?.status === 'VERIFIED')
            ? 'VERIFIED'
            : 'REPORTED',
          verifiedBy: latestGrowth?.provenance?.verifiedBy || latestMuac?.provenance?.verifiedBy || null,
        },
      },
    };
  });

  // 4. Recent Health Logs (Appropriate for Clinician Review)
  // Strictly measurements/severe danger signs within 30 days, USER_REPORTED
  const rawClinicianLogs = (records.patientReportedHomeMonitoring || []) as any[];
  const recentHealthLogs: ClinicianHealthLogEntry[] = rawClinicianLogs.map(log => {
    let hasDangerSigns = log.values?.hasDangerSigns === true;
    const dangerSignsList: string[] = [];

    if (log.type === 'blood_pressure') {
      const systolic = log.values?.systolic;
      const diastolic = log.values?.diastolic;
      if (systolic >= 140 || diastolic >= 90) {
        hasDangerSigns = true;
        dangerSignsList.push(`Elevated BP: ${systolic}/${diastolic} mmHg`);
      }
    } else if (log.type === 'baby_movement') {
      const count = log.values?.movementCount;
      if (typeof count === 'number' && count < 10) {
        hasDangerSigns = true;
        dangerSignsList.push(`Decreased fetal movement: ${count} kicks`);
      }
    } else if (log.type === 'symptoms') {
      if (Array.isArray(log.values?.symptoms)) {
        dangerSignsList.push(...log.values.symptoms);
      }
      if (log.values?.severity === 'severe') {
        hasDangerSigns = true;
      }
    }

    return {
      id: log.id,
      type: log.type,
      timestamp: log.timestamp || log.date || new Date().toISOString(),
      values: log.values || {},
      hasDangerSigns,
      dangerSignsList: dangerSignsList.length > 0 ? dangerSignsList : undefined,
      notes: log.notes,
      source: 'USER_REPORTED',
      provenance: {
        status: 'REPORTED',
        enteredBy: motherId,
      },
    };
  });

  // 5. Appointments & Encounters (Chronological, existing only)
  const appointments: ClinicalAppointmentSummary[] = [];
  if (pregnancySummary.hasActivePregnancy) {
    pregnancySummary.ancSummary.encounters.forEach(e => {
      appointments.push({
        id: `apt-${e.id}`,
        date: e.date,
        type: `ANC Contact #${e.visitNumber || 1}`,
        facilityName: e.provenance.verifiedBy || undefined,
        status: 'COMPLETED',
        provenance: e.provenance.status === 'VERIFIED' ? 'VERIFIED' : 'USER_REPORTED',
      });
    });
  }

  // 6. Verified Clinical Information Highlights
  let lastClinicalVerificationDate: string | undefined;
  let verifiedBy: string | undefined;

  const allVerifiedItems = [
    ...(pregnancySummary.hasActivePregnancy && pregnancySummary.provenance === 'VERIFIED' ? [activePreg] : []),
    ...pregnancySummary.ancSummary.encounters.filter(e => e.provenance.status === 'VERIFIED'),
    ...rawImmunizations.filter(v => v.provenance?.status === 'VERIFIED'),
    ...rawGrowth.filter(g => g.provenance?.status === 'VERIFIED'),
  ];

  allVerifiedItems.forEach(item => {
    const vDate = item.provenance?.verifiedAt || item.verifiedAt;
    if (vDate && (!lastClinicalVerificationDate || vDate > lastClinicalVerificationDate)) {
      lastClinicalVerificationDate = vDate;
      verifiedBy = item.provenance?.verifiedBy || item.verifiedBy || verifiedBy;
    }
  });

  const verifiedHighlights: VerifiedClinicalHighlights = {
    hasVerifiedPregnancy: pregnancySummary.hasActivePregnancy && pregnancySummary.provenance === 'VERIFIED',
    verifiedAncContactsCount: pregnancySummary.ancSummary.verifiedCount,
    verifiedVaccinesCount: rawImmunizations.filter(v => v.provenance?.status === 'VERIFIED').length,
    verifiedLabReportsCount: (records.labResults || []).filter((l: any) => l.provenance?.status === 'VERIFIED').length,
    verifiedUltrasoundCount: (records.ultrasounds || []).filter((u: any) => u.provenance?.status === 'VERIFIED').length,
    lastClinicalVerificationDate,
    verifiedBy,
  };

  // 7. Questions for Clinician (Mother-generated preparation)
  const questionsForClinician = Array.from(
    new Set([
      ...patientContext.questionsForClinician,
      ...(patientContext.appointmentPreparationNotes ? [patientContext.appointmentPreparationNotes] : []),
    ]),
  );

  return {
    summaryId: `summary-${motherId}-${asOf.getTime()}`,
    generatedAt: asOf.toISOString(),
    mother: {
      id: motherId,
      displayName: preferredName,
    },
    sessionContext: sessionContext
      ? {
          sessionId: sessionContext.sessionId,
          clinicianId: sessionContext.clinicianId,
          facilityId: sessionContext.facilityId,
          expiresAt: sessionContext.expiresAt,
        }
      : undefined,
    patientContext,
    pregnancy: pregnancySummary,
    children: childrenSummary,
    recentHealthLogs,
    appointments,
    verifiedHighlights,
    questionsForClinician,
  };
}

/**
 * High-Security Clinician Entry Point:
 * Verifies clinician identity, approval status, and active access session
 * before generating the structured health summary.
 * Strictly prevents access with expired, revoked, or unapproved sessions.
 */
export async function getAuthorizedHealthSummary(
  clinicianId: string,
  motherId: string,
  asOf: Date = new Date(),
): Promise<MomHavenHealthSummary> {
  if (!clinicianId) {
    throw new ApiError(401, 'Clinician authentication required.');
  }
  if (!motherId) {
    throw new ApiError(400, 'Patient identifier is required.');
  }

  // 1. Verify clinician authentication and verification approval
  const { clinician } = await requireClinician(clinicianId);

  // 2. Verify active patient-mediated access session (enforces not expired, not revoked, matching clinician and mother)
  const session = await requireActiveSession(clinicianId, motherId);

  // 3. Build summary through controlled services
  const expiresAt = session.expiresAt instanceof Date
    ? session.expiresAt.toISOString()
    : typeof session.expiresAt?.toDate === 'function'
      ? session.expiresAt.toDate().toISOString()
      : String(session.expiresAt || '');

  const summary = await buildHealthSummary(
    motherId,
    clinicianId,
    {
      sessionId: session.sessionId,
      clinicianId,
      facilityId: clinician.facilityId || session.facilityId || null,
      expiresAt,
    },
    asOf,
  );

  // 4. Write immutable audit log entry
  await logAudit(
    clinicianId,
    'CLINICIAN',
    'VIEWED',
    'healthSummary',
    motherId,
    clinician.facilityId || null,
    motherId,
  );

  return summary;
}
