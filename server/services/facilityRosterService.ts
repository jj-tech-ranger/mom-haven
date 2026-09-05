import { adminDb, document } from '../clinicianAccess.js';
import { CLINICAL_RECORD_GROUPS } from './patientRecordService.js';
import type { FacilityRosterEntry } from '../../src/types.js';

/**
 * Recomputes facility roster entries from authoritative clinical data:
 * - Active pregnancies & ANC encounters
 * - Children & KEPI immunization records
 * - Postnatal encounters (PNC)
 * - Child growth & MUAC measurements
 *
 * Persists entries to the `facilityRosters` collection in Firestore.
 */

interface ComputedRosterContext {
  facilitiesMap: Map<string, string>; // facilityId -> facilityName
  motherProfilesMap: Map<string, any>;
  pregnancies: any[];
  children: any[];
  ancEncounters: any[];
  immunizationRecords: any[];
  postnatalEncounters: any[];
  growthMeasurements: any[];
}

async function fetchRosterSourceData(): Promise<ComputedRosterContext> {
  const [
    facilitiesSnap,
    motherProfilesSnap,
    pregnanciesSnap,
    childrenSnap,
    ancSnap,
    immSnap,
    pncSnap,
    growthSnap,
  ] = await Promise.all([
    adminDb.collection('facilities').limit(500).get().catch(() => ({ docs: [] } as any)),
    adminDb.collection('motherProfiles').limit(1000).get().catch(() => ({ docs: [] } as any)),
    adminDb.collection('pregnancies').limit(1000).get().catch(() => ({ docs: [] } as any)),
    adminDb.collection('children').limit(1000).get().catch(() => ({ docs: [] } as any)),
    adminDb.collectionGroup('ancEncounters').limit(2000).get().catch(() => ({ docs: [] } as any)),
    adminDb.collectionGroup('immunizationRecords').limit(2000).get().catch(() => ({ docs: [] } as any)),
    adminDb.collectionGroup('postnatalEncounters').limit(1000).get().catch(() => ({ docs: [] } as any)),
    adminDb.collectionGroup('growthMeasurements').limit(1000).get().catch(() => ({ docs: [] } as any)),
  ]);

  const facilitiesMap = new Map<string, string>();
  for (const doc of facilitiesSnap.docs || []) {
    const data = doc.data();
    facilitiesMap.set(doc.id, data.name || data.facilityName || doc.id);
  }

  const motherProfilesMap = new Map<string, any>();
  for (const doc of motherProfilesSnap.docs || []) {
    motherProfilesMap.set(doc.id, { id: doc.id, ...doc.data() });
  }

  return {
    facilitiesMap,
    motherProfilesMap,
    pregnancies: (pregnanciesSnap.docs || []).map((d: any) => document(d.id, d.data())),
    children: (childrenSnap.docs || []).map((d: any) => document(d.id, d.data())),
    ancEncounters: (ancSnap.docs || []).map((d: any) => document(d.id, d.data())),
    immunizationRecords: (immSnap.docs || []).map((d: any) => document(d.id, d.data())),
    postnatalEncounters: (pncSnap.docs || []).map((d: any) => document(d.id, d.data())),
    growthMeasurements: (growthSnap.docs || []).map((d: any) => document(d.id, d.data())),
  };
}

function resolveMotherFacility(
  motherId: string,
  motherProfilesMap: Map<string, any>,
  pregnancy?: any
): string | null {
  const profile = motherProfilesMap.get(motherId);
  if (profile?.primaryHospitalFacilityId) return String(profile.primaryHospitalFacilityId).trim();
  if (profile?.facilityId) return String(profile.facilityId).trim();

  if (pregnancy?.facilityId) return String(pregnancy.facilityId).trim();
  if (pregnancy?.birthPlan?.preferredFacility) {
    const pref = String(pregnancy.birthPlan.preferredFacility).trim();
    if (/^\d+$/.test(pref)) return pref;
  }
  return null;
}

function formatIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, days: number): string {
  const next = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  return formatIsoDate(next);
}

/**
 * Recomputes all roster entries for a specific facility or all facilities
 */
export async function recomputeFacilityRoster(targetFacilityId?: string): Promise<FacilityRosterEntry[]> {
  const data = await fetchRosterSourceData();
  const entries: FacilityRosterEntry[] = [];
  const now = new Date();
  const nowMs = now.getTime();

  // Index ANC encounters by pregnancyId and motherId
  const ancByPregnancy = new Map<string, any[]>();
  for (const enc of data.ancEncounters) {
    const pregId = enc.pregnancyId || enc.pregnancy;
    if (pregId) {
      const list = ancByPregnancy.get(pregId) || [];
      list.push(enc);
      ancByPregnancy.set(pregId, list);
    }
  }

  // Index Immunizations by childId
  const immByChild = new Map<string, any[]>();
  for (const imm of data.immunizationRecords) {
    const cid = imm.childId || imm.child;
    if (cid) {
      const list = immByChild.get(cid) || [];
      list.push(imm);
      immByChild.set(cid, list);
    }
  }

  // Index Postnatal encounters by motherId and childId
  const pncByMother = new Map<string, any[]>();
  for (const pnc of data.postnatalEncounters) {
    const mid = pnc.motherId;
    if (mid) {
      const list = pncByMother.get(mid) || [];
      list.push(pnc);
      pncByMother.set(mid, list);
    }
  }

  // Index Growth by childId
  const growthByChild = new Map<string, any[]>();
  for (const g of data.growthMeasurements) {
    const cid = g.childId;
    if (cid) {
      const list = growthByChild.get(cid) || [];
      list.push(g);
      growthByChild.set(cid, list);
    }
  }

  // 1. Process ANC for Active Pregnancies
  for (const preg of data.pregnancies) {
    const motherId = preg.motherId;
    if (!motherId) continue;
    if (preg.status && preg.status !== 'active') continue;

    const facId = resolveMotherFacility(motherId, data.motherProfilesMap, preg);
    if (!facId) continue;
    if (targetFacilityId && facId !== targetFacilityId) continue;

    const motherProfile = data.motherProfilesMap.get(motherId);
    const motherName = motherProfile?.fullName || motherProfile?.displayName || 'Mother';

    const encList = ancByPregnancy.get(preg.id) || [];
    encList.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    const latestEnc = encList[0];

    // Determine nextDueDate
    let nextDueDate = latestEnc?.nextAppointmentDate || null;
    if (!nextDueDate) {
      // Estimate based on gestation or EDD
      if (preg.edd) {
        const eddDate = new Date(preg.edd);
        const diffDays = Math.round((eddDate.getTime() - nowMs) / (24 * 60 * 60 * 1000));
        if (diffDays > 0) {
          // Schedule next visit within 2-4 weeks or near EDD
          const stepDays = diffDays <= 28 ? 7 : diffDays <= 70 ? 14 : 28;
          nextDueDate = addDays(now, Math.min(stepDays, diffDays));
        } else {
          nextDueDate = formatIsoDate(eddDate);
        }
      } else if (preg.lmp) {
        const lmpDate = new Date(preg.lmp);
        const eddEstimate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
        nextDueDate = addDays(now, 14);
      } else {
        nextDueDate = addDays(now, 7);
      }
    }

    // Determine risk flag
    let riskFlag: 'none' | 'watch' | 'urgent' = 'none';
    if (latestEnc) {
      const sys = Number(latestEnc.systolicBp || 0);
      const dia = Number(latestEnc.diastolicBp || 0);
      const hb = Number(latestEnc.hbLevelGdl || 12);
      const hasDanger = Boolean(latestEnc.hasDangerSigns || latestEnc.dangerSigns?.length);

      if (sys >= 140 || dia >= 90 || hb < 8 || hasDanger) {
        riskFlag = 'urgent';
      } else if (hb < 11 || (preg.currentGestationWeeks && preg.currentGestationWeeks >= 40)) {
        riskFlag = 'watch';
      }
    }

    // Overdue check
    if (nextDueDate && new Date(nextDueDate).getTime() < nowMs - 24 * 60 * 60 * 1000) {
      if (riskFlag === 'none') riskFlag = 'watch';
    }

    const entryId = `roster_${facId}_${motherId}_anc`;
    entries.push({
      id: entryId,
      facilityId: facId,
      motherId,
      childId: null,
      nextDueType: 'anc',
      nextDueDate: typeof nextDueDate === 'string' ? nextDueDate.split('T')[0] : formatIsoDate(now),
      lastVisitDate: latestEnc?.date ? String(latestEnc.date).split('T')[0] : null,
      riskFlag,
      updatedAt: new Date().toISOString(),
    });
  }

  // 2. Process Immunization and Child Care
  for (const child of data.children) {
    const motherId = child.motherId;
    if (!motherId) continue;

    const facId = resolveMotherFacility(motherId, data.motherProfilesMap);
    if (!facId) continue;
    if (targetFacilityId && facId !== targetFacilityId) continue;

    const immList = immByChild.get(child.id) || [];
    // Sort scheduled or overdue immunizations by dueDate
    const pendingImm = immList.filter((im) => {
      const st = String(im.status || '').toUpperCase();
      return st !== 'GIVEN' && st !== 'COMPLETED';
    });

    pendingImm.sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    const nextImm = pendingImm[0];

    const givenImm = immList.filter((im) => String(im.status || '').toUpperCase() === 'GIVEN');
    givenImm.sort((a, b) => new Date(b.dateAdministered || b.date || 0).getTime() - new Date(a.dateAdministered || a.date || 0).getTime());
    const lastGiven = givenImm[0];

    let immDueDate = nextImm?.dueDate || null;
    if (!immDueDate && child.dateOfBirth) {
      const dob = new Date(child.dateOfBirth);
      const ageDays = Math.round((nowMs - dob.getTime()) / (24 * 60 * 60 * 1000));
      if (ageDays < 42) immDueDate = addDays(dob, 42); // 6-week immunization
      else if (ageDays < 70) immDueDate = addDays(dob, 70); // 10-week
      else if (ageDays < 98) immDueDate = addDays(dob, 98); // 14-week
      else if (ageDays < 270) immDueDate = addDays(dob, 270); // 9-month measles
      else if (ageDays < 540) immDueDate = addDays(dob, 540); // 18-month measles
      else immDueDate = addDays(now, 30);
    }

    let immRiskFlag: 'none' | 'watch' | 'urgent' = 'none';
    if (immDueDate) {
      const dueTime = new Date(immDueDate).getTime();
      const delayDays = Math.round((nowMs - dueTime) / (24 * 60 * 60 * 1000));
      if (delayDays > 14) immRiskFlag = 'urgent';
      else if (delayDays > 0) immRiskFlag = 'watch';
      else if (child.birthWeightKg && Number(child.birthWeightKg) < 2.5) immRiskFlag = 'watch';
    }

    if (immDueDate) {
      const entryId = `roster_${facId}_${motherId}_imm_${child.id}`;
      entries.push({
        id: entryId,
        facilityId: facId,
        motherId,
        childId: child.id,
        nextDueType: 'immunization',
        nextDueDate: typeof immDueDate === 'string' ? immDueDate.split('T')[0] : formatIsoDate(now),
        lastVisitDate: lastGiven?.dateAdministered ? String(lastGiven.dateAdministered).split('T')[0] : (child.dateOfBirth ? String(child.dateOfBirth).split('T')[0] : null),
        riskFlag: immRiskFlag,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. PNC for recent births (< 8 weeks)
    if (child.dateOfBirth) {
      const dob = new Date(child.dateOfBirth);
      const ageWeeks = (nowMs - dob.getTime()) / (7 * 24 * 60 * 60 * 1000);
      if (ageWeeks >= 0 && ageWeeks <= 8) {
        const pncList = pncByMother.get(motherId) || [];
        const lastPnc = pncList[0];
        let pncDueDate = ageWeeks < 2 ? addDays(dob, 14) : addDays(dob, 42);

        const entryId = `roster_${facId}_${motherId}_pnc_${child.id}`;
        entries.push({
          id: entryId,
          facilityId: facId,
          motherId,
          childId: child.id,
          nextDueType: 'pnc',
          nextDueDate: pncDueDate,
          lastVisitDate: lastPnc?.date ? String(lastPnc.date).split('T')[0] : String(child.dateOfBirth).split('T')[0],
          riskFlag: 'none',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 4. Growth check for under-2 infants
    if (child.dateOfBirth) {
      const dob = new Date(child.dateOfBirth);
      const ageMonths = (nowMs - dob.getTime()) / (30 * 24 * 60 * 60 * 1000);
      if (ageMonths >= 0 && ageMonths <= 24) {
        const growthList = growthByChild.get(child.id) || [];
        growthList.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        const lastGrowth = growthList[0];

        let growthDueDate: string;
        if (lastGrowth?.date) {
          growthDueDate = addDays(new Date(lastGrowth.date), 30);
        } else {
          growthDueDate = addDays(dob, 30);
        }

        let growthRisk: 'none' | 'watch' | 'urgent' = 'none';
        if (lastGrowth?.muacCm && Number(lastGrowth.muacCm) < 11.5) {
          growthRisk = 'urgent';
        } else if (lastGrowth?.muacCm && Number(lastGrowth.muacCm) < 12.5) {
          growthRisk = 'watch';
        }

        const entryId = `roster_${facId}_${motherId}_growth_${child.id}`;
        entries.push({
          id: entryId,
          facilityId: facId,
          motherId,
          childId: child.id,
          nextDueType: 'growth_check',
          nextDueDate: growthDueDate,
          lastVisitDate: lastGrowth?.date ? String(lastGrowth.date).split('T')[0] : null,
          riskFlag: growthRisk,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Persist computed entries to Firestore in batches
  if (entries.length > 0) {
    const batchSize = 400;
    for (let i = 0; i < entries.length; i += batchSize) {
      const chunk = entries.slice(i, i + batchSize);
      const batch = adminDb.batch();
      for (const entry of chunk) {
        const ref = adminDb.collection('facilityRosters').doc(entry.id);
        batch.set(ref, entry, { merge: true });
      }
      await batch.commit().catch((err) => {
        console.warn('[FacilityRosterService] Batch write notice:', err?.message || err);
      });
    }
  }

  return entries;
}

/**
 * Returns facility roster entries for a given facilityId.
 * Automatically recomputes if no entries exist yet.
 */
export async function getFacilityRoster(facilityId: string): Promise<FacilityRosterEntry[]> {
  const cleanId = String(facilityId || '').trim();
  if (!cleanId) return [];

  const snap = await adminDb
    .collection('facilityRosters')
    .where('facilityId', '==', cleanId)
    .limit(500)
    .get();

  if (!snap.empty) {
    const list = snap.docs.map((d) => d.data() as FacilityRosterEntry);
    list.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    return list;
  }

  // Recompute if empty
  const computed = await recomputeFacilityRoster(cleanId);
  computed.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  return computed;
}
