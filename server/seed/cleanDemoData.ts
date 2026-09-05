/**
 * Mom Haven Demo Dataset Cleanup Script
 * Safely removes only records belonging to the demo dataset "defense-demo-v1".
 * Strict safety rules prevent modifying or deleting any real user accounts.
 */

import { DEMO_DATASET_ID, DEMO_DOMAIN } from './demoData.js';
import {
  loadManifest,
  clearLocalStore,
  deleteDemoAuthUser,
  deleteFirestoreDocument,
  queryDemoDocuments,
} from './seedUtils.js';

export async function cleanDemoData(): Promise<void> {
  console.log('\n===============================================================');
  console.log('                 CLEANING MOM HAVEN DEMO DATASET               ');
  console.log(` Target Dataset ID : ${DEMO_DATASET_ID}`);
  console.log('===============================================================');

  const manifest = loadManifest();
  let deletedAuthCount = 0;
  let deletedDocCount = 0;

  // 1. Delete Auth Accounts from Manifest or Target List
  if (manifest?.authAccounts) {
    for (const acc of manifest.authAccounts) {
      if (acc.email.endsWith(DEMO_DOMAIN)) {
        try {
          await deleteDemoAuthUser(acc.uid, acc.email);
          deletedAuthCount++;
          console.log(`✓ Deleted Auth user: ${acc.email} (${acc.uid})`);
        } catch (err: any) {
          console.warn(`Could not delete Auth user ${acc.email}:`, err.message);
        }
      }
    }
  }

  // 2. Collections to clean demo documents from
  const collectionsToClean = [
    'users',
    'clinicians',
    'motherProfiles',
    'healthContexts',
    'pregnancies',
    'children',
    'reminders',
    'dailyHealthLogs',
    'partnerRelationships',
    'partnerConnections',
    'partnerShares',
    'pmtctRecords',
    'antenatalProfiles',
    'cancerScreenings',
    'familyPlanning',
    'hospitalAdmissions',
    'specialClinicalAttendances',
    'clinicianPrivateNotes',
    'eyeCareAssessments',
    'toothEruptions',
    'aefiReports',
  ];

  for (const col of collectionsToClean) {
    const docs = await queryDemoDocuments(col);
    for (const d of docs) {
      if (d.demoDataset === DEMO_DATASET_ID) {
        const deleted = await deleteFirestoreDocument(`${col}/${d.id}`);
        if (deleted) deletedDocCount++;
      }
    }
  }

  // Clear local demo store
  clearLocalStore();

  console.log('\n===============================================================');
  console.log('                 CLEANUP COMPLETED SUCCESSFULLY                ');
  console.log(` Deleted Auth Accounts : ${deletedAuthCount}`);
  console.log(` Deleted Demo Documents: ${deletedDocCount}`);
  console.log('===============================================================\n');
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanDemoData()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Cleanup failed:', err);
      process.exit(1);
    });
}
