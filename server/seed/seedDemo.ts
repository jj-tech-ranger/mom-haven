/**
 * Mom Haven Full Demo Dataset Seed Runner
 * Executes clinician seeding, mother/partner seeding, and integrity verification.
 */

import { seedDemoMothers } from './seedDemoMothers.js';
import { verifyDemoData } from './verifyDemoData.js';

async function main() {
  console.log('Starting full Mom Haven demo dataset seeding...');
  await seedDemoMothers();

  console.log('\nRunning automatic post-seed integrity verification...');
  const verification = await verifyDemoData();

  if (!verification.passed) {
    console.error('\n⚠️ Seeding completed but some verification checks failed.');
    process.exit(1);
  }

  console.log('\n🎉 Full demo dataset successfully seeded and verified!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error in seedDemo:', err);
  process.exit(1);
});
