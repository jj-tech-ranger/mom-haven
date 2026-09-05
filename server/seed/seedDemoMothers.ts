/**
 * Mom Haven Mothers & Clinical State Seeding Script
 * Seeds 10 distinct demo mothers with realistic clinical and social scenarios.
 */

import {
  DEMO_MOTHERS,
  DEMO_PARTNERS,
  DEMO_DATASET_ID,
} from './demoData.js';
import { seedDemoClinicians } from './seedDemoClinicians.js';
import {
  reconcileAuthUser,
  setFirestoreDocument,
  saveManifest,
  printManifest,
  type SeedManifest,
} from './seedUtils.js';

export async function seedDemoMothers(): Promise<SeedManifest> {
  console.log('\n--- Seeding Mom Haven Demo Dataset ---');

  // Step 1: Ensure verified clinicians exist and capture their UIDs
  const { clinicianUids, clinicianAccounts } = await seedDemoClinicians();

  // Step 2: Seed the 3 required Partner Auth accounts
  console.log('\n--- Seeding Demo Partners ---');
  const partnerUidsByEmail: Record<string, string> = {};
  const partnerAccounts: Array<{ email: string; uid: string; displayName: string; role: 'PARTNER'; createdOrReconciled: 'created' | 'reconciled' }> = [];

  for (const partner of DEMO_PARTNERS) {
    const { uid, status } = await reconcileAuthUser(partner.email, partner.name, 'PARTNER');
    partnerUidsByEmail[partner.email] = uid;
    partnerAccounts.push({
      email: partner.email,
      uid,
      displayName: partner.name,
      role: 'PARTNER',
      createdOrReconciled: status,
    });

    // Seed users/${uid}
    await setFirestoreDocument(`users/${uid}`, {
      id: uid,
      uid,
      email: partner.email,
      displayName: partner.name,
      role: 'PARTNER',
      demoDataset: DEMO_DATASET_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✓ Partner ${partner.name} (${partner.email}) -> UID: ${uid} [${status}]`);
  }

  // Step 3: Seed the 10 Demo Mothers and their deep clinical records
  console.log('\n--- Seeding Demo Mothers & Scenarios ---');
  const motherAccounts: Array<{ email: string; uid: string; displayName: string; role: 'MOTHER'; createdOrReconciled: 'created' | 'reconciled' }> = [];

  const recordCounts = {
    users: clinicianAccounts.length + partnerAccounts.length,
    motherProfiles: 0,
    healthContexts: 0,
    pregnancies: 0,
    ancEncounters: 0,
    children: 0,
    immunizationRecords: 0,
    growthMeasurements: 0,
    reminders: 0,
    dailyHealthLogs: 0,
    partnerRelationships: 0,
    partnerShares: 0,
    pmtctRecords: 0,
    antenatalProfiles: 0,
    cancerScreenings: 0,
    familyPlanning: 0,
    hospitalAdmissions: 0,
    specialClinicalAttendances: 0,
    clinicianPrivateNotes: 0,
    otherClinicalRecords: 0,
  };

  for (const motherDef of DEMO_MOTHERS) {
    const { uid: motherUid, status } = await reconcileAuthUser(motherDef.email, motherDef.name, 'MOTHER');
    motherAccounts.push({
      email: motherDef.email,
      uid: motherUid,
      displayName: motherDef.name,
      role: 'MOTHER',
      createdOrReconciled: status,
    });
    recordCounts.users++;

    // Find linked partner UID if applicable
    let partnerUid: string | undefined;
    const linkedPartnerDef = DEMO_PARTNERS.find((p) => p.motherEmail === motherDef.email);
    if (linkedPartnerDef) {
      partnerUid = partnerUidsByEmail[linkedPartnerDef.email];
    }

    // Build data payload with relative date calculations
    const payload = motherDef.buildData(motherUid, partnerUid, clinicianUids);

    // 1. User document
    await setFirestoreDocument(`users/${motherUid}`, {
      id: motherUid,
      uid: motherUid,
      ...payload.user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Mother Profile
    await setFirestoreDocument(`motherProfiles/${motherUid}`, {
      id: motherUid,
      ...payload.profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    recordCounts.motherProfiles++;

    // 3. Health Context
    await setFirestoreDocument(`healthContexts/${motherUid}`, {
      id: motherUid,
      ...payload.healthContext,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    recordCounts.healthContexts++;

    // 4. Pregnancy & ANC Encounters
    if (payload.pregnancy) {
      await setFirestoreDocument(`pregnancies/${payload.pregnancy.id}`, {
        ...payload.pregnancy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      recordCounts.pregnancies++;

      if (payload.ancEncounters) {
        for (const enc of payload.ancEncounters) {
          await setFirestoreDocument(`pregnancies/${payload.pregnancy.id}/ancEncounters/${enc.id}`, {
            ...enc,
            demoDataset: DEMO_DATASET_ID,
            createdAt: new Date().toISOString(),
          });
          recordCounts.ancEncounters++;
        }
      }
    }

    // 5. Children, Immunizations, Growth, Exams
    if (payload.children) {
      for (const child of payload.children) {
        await setFirestoreDocument(`children/${child.id}`, {
          id: child.id,
          motherId: child.motherId,
          name: child.name,
          dateOfBirth: child.dateOfBirth,
          sex: child.sex,
          birthWeightKg: child.birthWeightKg,
          birthLengthCm: child.birthLengthCm,
          headCircumferenceCm: child.headCircumferenceCm,
          deliveryFacility: child.deliveryFacility,
          deliveryType: child.deliveryType,
          demoDataset: DEMO_DATASET_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        recordCounts.children++;

        if (child.immunizations) {
          for (const imm of child.immunizations) {
            await setFirestoreDocument(`children/${child.id}/immunizationRecords/${imm.id}`, {
              ...imm,
              childId: child.id,
              demoDataset: DEMO_DATASET_ID,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            recordCounts.immunizationRecords++;
          }
        }

        if (child.growthMeasurements) {
          for (const gm of child.growthMeasurements) {
            await setFirestoreDocument(`children/${child.id}/growthMeasurements/${gm.id}`, {
              ...gm,
              childId: child.id,
              demoDataset: DEMO_DATASET_ID,
              createdAt: new Date().toISOString(),
            });
            recordCounts.growthMeasurements++;
          }
        }

        if (child.newbornRecord) {
          await setFirestoreDocument(`children/${child.id}/newbornRecords/${child.newbornRecord.id}`, {
            ...child.newbornRecord,
            demoDataset: DEMO_DATASET_ID,
          });
          recordCounts.otherClinicalRecords++;
        }

        if (child.congenitalExam) {
          await setFirestoreDocument(`children/${child.id}/congenitalExams/${child.congenitalExam.id}`, {
            ...child.congenitalExam,
            demoDataset: DEMO_DATASET_ID,
          });
          recordCounts.otherClinicalRecords++;
        }

        if (child.postnatalEncounters) {
          for (const pnc of child.postnatalEncounters) {
            await setFirestoreDocument(`children/${child.id}/postnatalEncounters/${pnc.id}`, {
              ...pnc,
              demoDataset: DEMO_DATASET_ID,
            });
            recordCounts.otherClinicalRecords++;
          }
        }

        if (child.eyeCareAssessment) {
          await setFirestoreDocument(`children/${child.id}/eyeCareAssessments/${child.eyeCareAssessment.id}`, {
            ...child.eyeCareAssessment,
            demoDataset: DEMO_DATASET_ID,
          });
          await setFirestoreDocument(`eyeCareAssessments/${child.eyeCareAssessment.id}`, {
            ...child.eyeCareAssessment,
            motherId: motherUid,
            demoDataset: DEMO_DATASET_ID,
          });
          recordCounts.otherClinicalRecords++;
        }

        if (child.toothEruption) {
          await setFirestoreDocument(`children/${child.id}/toothEruptions/current`, {
            ...child.toothEruption,
            demoDataset: DEMO_DATASET_ID,
          });
          await setFirestoreDocument(`toothEruptions/${child.id}`, {
            ...child.toothEruption,
            motherId: motherUid,
            demoDataset: DEMO_DATASET_ID,
          });
          recordCounts.otherClinicalRecords++;
        }

        if (child.illnessRecords) {
          for (const ill of child.illnessRecords) {
            await setFirestoreDocument(`children/${child.id}/illnessRecords/${ill.id}`, {
              ...ill,
              demoDataset: DEMO_DATASET_ID,
            });
            recordCounts.otherClinicalRecords++;
          }
        }

        if (child.milestoneRecords) {
          for (const ms of child.milestoneRecords) {
            await setFirestoreDocument(`children/${child.id}/milestoneRecords/${ms.id}`, {
              ...ms,
              demoDataset: DEMO_DATASET_ID,
            });
            recordCounts.otherClinicalRecords++;
          }
        }

        if (child.aefiReports) {
          for (const aefi of child.aefiReports) {
            await setFirestoreDocument(`children/${child.id}/aefiReports/${aefi.id}`, {
              ...aefi,
              demoDataset: DEMO_DATASET_ID,
            });
            await setFirestoreDocument(`aefiReports/${aefi.id}`, {
              ...aefi,
              motherId: motherUid,
              demoDataset: DEMO_DATASET_ID,
            });
            recordCounts.otherClinicalRecords++;
          }
        }
      }
    }

    // 6. Reminders
    if (payload.reminders) {
      for (const rem of payload.reminders) {
        await setFirestoreDocument(`reminders/${rem.id}`, {
          ...rem,
          createdAt: new Date().toISOString(),
        });
        recordCounts.reminders++;
      }
    }

    // 7. Daily Health Logs
    if (payload.dailyHealthLogs) {
      for (const log of payload.dailyHealthLogs) {
        await setFirestoreDocument(`dailyHealthLogs/${log.id}`, {
          ...log,
          createdAt: new Date().toISOString(),
        });
        recordCounts.dailyHealthLogs++;
      }
    }

    // 8. PMTCT / HEI Records
    if (payload.pmtctRecord) {
      await setFirestoreDocument(`pmtctRecords/${payload.pmtctRecord.id}`, payload.pmtctRecord);
      await setFirestoreDocument(`users/${motherUid}/pmtctRecords/${payload.pmtctRecord.id}`, payload.pmtctRecord);
      recordCounts.pmtctRecords++;
    }

    // 9. Antenatal Profile & Ultrasounds
    if (payload.antenatalProfile) {
      await setFirestoreDocument(`antenatalProfiles/${payload.antenatalProfile.id}`, payload.antenatalProfile);
      if (payload.pregnancy) {
        await setFirestoreDocument(`pregnancies/${payload.pregnancy.id}/antenatalProfiles/profile`, payload.antenatalProfile);
      }
      recordCounts.antenatalProfiles++;
    }

    // 10. Cancer Screenings
    if (payload.cancerScreening) {
      await setFirestoreDocument(`cancerScreenings/${payload.cancerScreening.id}`, payload.cancerScreening);
      await setFirestoreDocument(`users/${motherUid}/cancerScreenings/${payload.cancerScreening.id}`, payload.cancerScreening);
      recordCounts.cancerScreenings++;
    }

    // 11. Family Planning
    if (payload.familyPlanning) {
      await setFirestoreDocument(`familyPlanning/${payload.familyPlanning.id}`, payload.familyPlanning);
      await setFirestoreDocument(`users/${motherUid}/familyPlanning/${payload.familyPlanning.id}`, payload.familyPlanning);
      recordCounts.familyPlanning++;
    }

    // 12. Hospital Admissions
    if (payload.hospitalAdmissions) {
      for (const adm of payload.hospitalAdmissions) {
        await setFirestoreDocument(`hospitalAdmissions/${adm.id}`, adm);
        recordCounts.hospitalAdmissions++;
      }
    }

    // 13. Special Clinical Attendances
    if (payload.specialClinicalAttendances) {
      for (const att of payload.specialClinicalAttendances) {
        await setFirestoreDocument(`specialClinicalAttendances/${att.id}`, att);
        recordCounts.specialClinicalAttendances++;
      }
    }

    // 14. Clinician Private Notes
    if (payload.clinicianPrivateNotes) {
      for (const note of payload.clinicianPrivateNotes) {
        await setFirestoreDocument(`clinicianPrivateNotes/${note.id}`, {
          ...note,
          demoDataset: DEMO_DATASET_ID,
        });
        recordCounts.clinicianPrivateNotes++;
      }
    }

    // 15. Partner Relationships & Shares
    if (payload.partnerRelationship && partnerUid) {
      await setFirestoreDocument(`partnerRelationships/${payload.partnerRelationship.id}`, {
        ...payload.partnerRelationship,
        demoDataset: DEMO_DATASET_ID,
      });
      // Also register code companion in partnerRelationships
      await setFirestoreDocument(`partnerRelationships/${payload.partnerRelationship.code}`, {
        id: payload.partnerRelationship.code,
        code: payload.partnerRelationship.code,
        motherId: motherUid,
        motherName: motherDef.name,
        status: 'used',
        usedBy: partnerUid,
        demoDataset: DEMO_DATASET_ID,
      });
      // Also register companion partnerConnections document (for rules & redemption flow)
      await setFirestoreDocument(`partnerConnections/${payload.partnerRelationship.code}`, {
        code: payload.partnerRelationship.code,
        motherId: motherUid,
        motherName: motherDef.name,
        status: 'used',
        usedBy: partnerUid,
        createdAt: new Date().toISOString(),
        demoDataset: DEMO_DATASET_ID,
      });
      recordCounts.partnerRelationships++;
    }

    if (payload.partnerShare) {
      await setFirestoreDocument(`partnerShares/${motherUid}`, {
        ...payload.partnerShare,
        demoDataset: DEMO_DATASET_ID,
      });
      recordCounts.partnerShares++;
    }

    console.log(`✓ Seeded ${motherDef.name} (${motherDef.email}) - ${motherDef.scenarioDescription}`);
  }

  const manifest: SeedManifest = {
    dataset: DEMO_DATASET_ID,
    seedTimestamp: new Date().toISOString(),
    authAccounts: [...clinicianAccounts, ...partnerAccounts, ...motherAccounts],
    recordCounts,
  };

  saveManifest(manifest);
  printManifest(manifest);

  return manifest;
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoMothers()
    .then(() => {
      console.log('✓ Demo mother dataset seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed demo mothers:', err);
      process.exit(1);
    });
}
