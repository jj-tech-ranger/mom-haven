import { adminDb, document } from '../clinicianAccess.js';

export const CLINICAL_RECORD_GROUPS = [
  'ancEncounters', 'newbornRecords', 'postnatalEncounters', 'immunizationRecords',
  'growthMeasurements', 'muacMeasurements', 'nutritionRecords', 'developmentRecords',
] as const;

/**
 * Filter daily health logs for clinician summary according to explicit product rules:
 * 1. Only clinical measurements (blood pressure, weight, baby movement, or severe symptoms/danger signs)
 * 2. Strictly excludes private personal journals (mood, sleep, nutrition, activity, notes)
 * 3. Within the active 30-day clinical window
 * 4. Stamped with USER_REPORTED provenance to prevent confusion with facility encounters
 */
export function filterClinicianSummaryLogs(rawDocs: { id: string; data: any }[], maxDays: number = 30) {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  return rawDocs
    .filter(({ data }) => {
      if (data.category !== 'CLINICAL_MEASUREMENT') return false;
      const time = new Date(data.timestamp).getTime();
      if (isNaN(time) || time < cutoff) return false;
      if (data.type === 'symptoms') {
        return data.values?.hasDangerSigns === true || data.values?.severity === 'severe';
      }
      return data.type === 'blood_pressure' || data.type === 'weight' || data.type === 'baby_movement';
    })
    .map(({ id, data }) => document(id, {
      ...data,
      source: 'USER_REPORTED',
      provenance: {
        ...(data.provenance || {}),
        status: 'REPORTED',
      },
    }))
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getPatientRecords(motherId: string) {
  const [preg, children, healthLogsSnap] = await Promise.all([
    adminDb.collection('pregnancies').where('motherId', '==', motherId).get(),
    adminDb.collection('children').where('motherId', '==', motherId).get(),
    adminDb.collection('dailyHealthLogs').where('userId', '==', motherId).limit(100).get().catch(() => ({ docs: [] } as any)),
  ]);
  const groups: Record<string, unknown[]> = {};
  for (const group of CLINICAL_RECORD_GROUPS) {
    const snapshot = await adminDb.collectionGroup(group).where('motherId', '==', motherId).limit(200).get().catch(() => ({ docs: [] } as any));
    groups[group] = snapshot.docs.map((d: any) => document(d.id, d.data()));
  }

  const rawLogs = healthLogsSnap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
  const patientReportedHomeMonitoring = filterClinicianSummaryLogs(rawLogs);

  return {
    pregnancies: preg.docs.map(d => document(d.id, d.data())),
    children: children.docs.map(d => document(d.id, d.data())),
    patientReportedHomeMonitoring,
    ...groups,
  };
}
