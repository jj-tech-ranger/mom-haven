import { adminDb, document } from '../clinicianAccess';

export const CLINICAL_RECORD_GROUPS = [
  'ancEncounters', 'newbornRecords', 'postnatalEncounters', 'immunizationRecords',
  'growthMeasurements', 'muacMeasurements', 'nutritionRecords', 'developmentRecords',
] as const;

export async function getPatientRecords(motherId: string) {
  const [preg, children] = await Promise.all([
    adminDb.collection('pregnancies').where('motherId', '==', motherId).get(),
    adminDb.collection('children').where('motherId', '==', motherId).get(),
  ]);
  const groups: Record<string, unknown[]> = {};
  for (const group of CLINICAL_RECORD_GROUPS) {
    const snapshot = await adminDb.collectionGroup(group).where('motherId', '==', motherId).limit(200).get().catch(() => ({ docs: [] } as any));
    groups[group] = snapshot.docs.map((d: any) => document(d.id, d.data()));
  }
  return {
    pregnancies: preg.docs.map(d => document(d.id, d.data())),
    children: children.docs.map(d => document(d.id, d.data())),
    ...groups,
  };
}
