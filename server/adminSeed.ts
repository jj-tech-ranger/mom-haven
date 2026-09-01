import { adminDb } from './clinicianAccess.js';

export async function ensureAdminRegistersSeeded() {
  const governance = adminDb.collection('clinicalDecisionRegister');
  const existing = await governance.limit(1).get();
  if (existing.empty) {
    await governance.doc('newborn-fast-breathing-threshold').set({
      id:'newborn-fast-breathing-threshold',
      title:'Newborn/young-infant fast-breathing threshold',
      source:'Phase 5 safety-pattern review · IMNCI source cross-check required',
      status:'needs_clinical_review',
      note:'The safety module flags age-specific breathing thresholds for formal clinical review before they are treated as approved governance.',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    });
    await governance.doc('newborn-temperature-threshold').set({
      id:'newborn-temperature-threshold',
      title:'Newborn temperature threshold',
      source:'Phase 5 safety-pattern review · formal clinical review required',
      status:'needs_clinical_review',
      note:'The newborn temperature danger-sign logic is intentionally tracked as awaiting formal clinical review.',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    });
  }
}
