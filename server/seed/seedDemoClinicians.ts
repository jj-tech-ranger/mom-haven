/**
 * Mom Haven Clinician Seeding Script
 * Seeds or reconciles verified demo clinicians.
 */

import { DEMO_CLINICIANS, DEMO_DATASET_ID } from './demoData.js';
import {
  reconcileAuthUser,
  setFirestoreDocument,
} from './seedUtils.js';

export async function seedDemoClinicians(): Promise<{
  clinicianUids: Record<string, string>;
  clinicianAccounts: Array<{ email: string; uid: string; displayName: string; role: 'CLINICIAN'; createdOrReconciled: 'created' | 'reconciled' }>;
}> {
  console.log('\n--- Seeding Demo Clinicians ---');
  const clinicianUids: Record<string, string> = {};
  const clinicianAccounts: Array<{ email: string; uid: string; displayName: string; role: 'CLINICIAN'; createdOrReconciled: 'created' | 'reconciled' }> = [];

  for (const clin of DEMO_CLINICIANS) {
    const { uid, status } = await reconcileAuthUser(clin.email, clin.name, 'CLINICIAN');
    clinicianUids[clin.email] = uid;
    clinicianAccounts.push({
      email: clin.email,
      uid,
      displayName: clin.name,
      role: 'CLINICIAN',
      createdOrReconciled: status,
    });

    // 1. Seed users/${uid}
    await setFirestoreDocument(`users/${uid}`, {
      id: uid,
      uid,
      email: clin.email,
      displayName: clin.name,
      role: 'CLINICIAN',
      demoDataset: DEMO_DATASET_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Seed clinicians/${uid}
    await setFirestoreDocument(`clinicians/${uid}`, {
      uid,
      name: clin.name,
      email: clin.email,
      licenseNumber: clin.licenseNumber,
      cadre: clin.cadre,
      facilityId: clin.facilityId,
      facilityName: clin.facilityName,
      county: clin.county,
      verificationStatus: clin.status,
      ...(clin.rejectionReason ? { rejectionReason: clin.rejectionReason } : {}),
      demoDataset: DEMO_DATASET_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✓ Clinician ${clin.name} (${clin.email}) -> UID: ${uid} [${status}]`);
  }

  return { clinicianUids, clinicianAccounts };
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoClinicians()
    .then(() => {
      console.log('✓ Clinician seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed clinicians:', err);
      process.exit(1);
    });
}
