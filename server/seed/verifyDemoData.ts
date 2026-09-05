/**
 * Mom Haven Demo Dataset Verification Script
 * Validates the clinical integrity and structure of all 10 demo mothers,
 * verified clinicians, partner relationships, and clinical states.
 */

import {
  DEMO_MOTHERS,
  DEMO_CLINICIANS,
  DEMO_PARTNERS,
  DEMO_DATASET_ID,
} from './demoData.js';
import {
  getFirestoreDocument,
  loadManifest,
} from './seedUtils.js';

export interface VerificationResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failures: string[];
}

export async function verifyDemoData(): Promise<VerificationResult> {
  console.log('\n===============================================================');
  console.log('              VERIFYING MOM HAVEN DEMO DATASET                 ');
  console.log('===============================================================');

  const failures: string[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  function assert(condition: boolean, description: string) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(` ✓ [PASS] ${description}`);
    } else {
      failures.push(description);
      console.error(` ✗ [FAIL] ${description}`);
    }
  }

  // 1. Verify Manifest
  const manifest = loadManifest();
  assert(manifest !== null, 'Demo dataset manifest exists');
  if (manifest) {
    assert(manifest.dataset === DEMO_DATASET_ID, `Dataset ID matches ${DEMO_DATASET_ID}`);
    assert(manifest.authAccounts.length >= 19, `Manifest contains all accounts (found ${manifest.authAccounts.length})`);
  }

  // 2. Verify Clinicians
  for (const clin of DEMO_CLINICIANS) {
    const clinUser = manifest?.authAccounts.find((a) => a.email === clin.email);
    assert(!!clinUser, `Clinician Auth account exists for ${clin.email}`);
    if (clinUser) {
      const userDoc = await getFirestoreDocument(`users/${clinUser.uid}`);
      assert(userDoc?.role === 'CLINICIAN', `User ${clin.email} has role CLINICIAN`);
      assert(userDoc?.demoDataset === DEMO_DATASET_ID, `User ${clin.email} marked with demoDataset`);

      const clinDoc = await getFirestoreDocument(`clinicians/${clinUser.uid}`);
      assert(clinDoc?.verificationStatus === clin.status, `Clinician ${clin.email} status is '${clin.status}'`);
      assert(clinDoc?.facilityId === clin.facilityId, `Clinician ${clin.email} facility ID matches KMHFL ${clin.facilityId}`);
      if (clin.status === 'rejected') {
        assert(!!clinDoc?.rejectionReason, `Rejected clinician ${clin.email} has visible rejectionReason`);
      }
    }
  }

  // 3. Verify Partners (Only 3 required partners)
  for (const partner of DEMO_PARTNERS) {
    const partnerAcc = manifest?.authAccounts.find((a) => a.email === partner.email);
    assert(!!partnerAcc, `Partner Auth account exists for ${partner.email}`);
    if (partnerAcc) {
      const userDoc = await getFirestoreDocument(`users/${partnerAcc.uid}`);
      assert(userDoc?.role === 'PARTNER', `User ${partner.email} has role PARTNER`);
    }
  }

  // 4. Verify the 10 Demo Mothers
  const motherAccounts = manifest?.authAccounts.filter((a) => a.role === 'MOTHER') || [];
  assert(motherAccounts.length === 10, `Exactly 10 demo mothers exist (found ${motherAccounts.length})`);

  for (const motherDef of DEMO_MOTHERS) {
    const acc = motherAccounts.find((a) => a.email === motherDef.email);
    assert(!!acc, `Mother Auth account exists for ${motherDef.name} (${motherDef.email})`);
    if (!acc) continue;

    const uid = acc.uid;

    // Verify Profile
    const profile = await getFirestoreDocument(`motherProfiles/${uid}`);
    assert(profile !== null, `${motherDef.name} motherProfile exists`);
    assert(profile?.county === motherDef.county, `${motherDef.name} residence county is exactly '${motherDef.county}'`);
    assert(!profile?.subcounty, `${motherDef.name} motherProfile does not contain forbidden subcounty field`);

    if (motherDef.primaryHospitalFacilityId) {
      assert(profile?.primaryHospitalFacilityId === motherDef.primaryHospitalFacilityId, `${motherDef.name} primary hospital ID matches ${motherDef.primaryHospitalFacilityId}`);
      assert(profile?.primaryHospitalName === motherDef.primaryHospitalName, `${motherDef.name} primary hospital name matches ${motherDef.primaryHospitalName}`);
    } else {
      assert(!profile?.primaryHospitalFacilityId, `${motherDef.name} intentionally has no primary hospital ID`);
    }

    // Verify HealthContext
    const context = await getFirestoreDocument(`healthContexts/${uid}`);
    assert(context?.lifecycleStage === motherDef.lifecycleStage, `${motherDef.name} lifecycleStage is '${motherDef.lifecycleStage}'`);
    assert(context?.county === motherDef.county, `${motherDef.name} healthContext county is '${motherDef.county}'`);

    // Verify Support Configurations
    if (motherDef.support === 'partner') {
      const linkedPartner = DEMO_PARTNERS.find((p) => p.motherEmail === motherDef.email);
      const partnerAcc = manifest?.authAccounts.find((a) => a.email === linkedPartner?.email);
      if (partnerAcc) {
        const relId = `${uid}_${partnerAcc.uid}`;
        const rel = await getFirestoreDocument(`partnerRelationships/${relId}`);
        assert(rel?.status === 'active', `${motherDef.name} has active partner relationship with ${linkedPartner?.name}`);
        assert(rel?.scope?.includes('No Clinical Records Access'), `${motherDef.name} partner relationship strictly limits clinical access`);

        const share = await getFirestoreDocument(`partnerShares/${uid}`);
        assert(share !== null, `${motherDef.name} partnerShares signal projection exists`);
      }
    } else if (motherDef.support === 'family') {
      assert(!!profile?.emergencyContactName, `${motherDef.name} has family emergency contact configured`);
      assert(motherDef.emergencyContact?.relationship === profile?.emergencyContactRelationship, `${motherDef.name} family relationship is ${motherDef.emergencyContact?.relationship}`);
    } else {
      // support: none
      assert(!profile?.emergencyContactName, `${motherDef.name} has no support/emergency contact`);
    }

    // Specific Scenario Verifications:
    if (motherDef.key === 'grace-neema') {
      // 1st trimester pregnancy + ANC history + upcoming ANC
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}`);
      assert(preg?.status === 'active', 'Grace Neema has active pregnancy');
      assert(preg?.gestationalAgeWeeks >= 1 && preg?.gestationalAgeWeeks <= 13, `Grace Neema is 1st trimester (${preg?.gestationalAgeWeeks} weeks)`);
      const anc = await getFirestoreDocument(`pregnancies/preg-${uid}/ancEncounters/anc-preg-${uid}-1`);
      assert(anc !== null, 'Grace Neema has booking ANC encounter');
      const rem = await getFirestoreDocument(`reminders/rem-${uid}-anc2`);
      assert(rem?.category === 'anc', 'Grace Neema has upcoming ANC reminder');
    }

    if (motherDef.key === 'mercy-faraja') {
      // 3rd trimester pregnancy + detailed clinical history
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}`);
      assert(preg?.status === 'active', 'Mercy Faraja has active pregnancy');
      assert(preg?.gestationalAgeWeeks >= 28, `Mercy Faraja is 3rd trimester (${preg?.gestationalAgeWeeks} weeks)`);

      const pmtct = await getFirestoreDocument(`pmtctRecords/pmtct-${uid}`);
      assert(pmtct?.maternalHivStatus === 'reactive', 'Mercy Faraja PMTCT record reflects reactive status');
      assert(pmtct?.maternalViralLoad?.suppressionStatus === 'suppressed', 'Mercy Faraja viral load is suppressed');
      assert(pmtct?.maternalArtVisits?.length === 3, 'Mercy Faraja has 3 maternal ART visits');

      const profile = await getFirestoreDocument(`antenatalProfiles/preg-${uid}`);
      assert(profile?.serologyRepeatSchedule?.length >= 3, 'Mercy Faraja has serology repeat schedule');
      assert(profile?.ultrasound1 !== undefined && profile?.ultrasound2 !== undefined, 'Mercy Faraja has 2 ultrasound scans');

      const cs = await getFirestoreDocument(`cancerScreenings/cs-${uid}`);
      assert(cs?.cervicalDone === true && cs?.cervicalTestType === 'VIA', 'Mercy Faraja has VIA cervical screening');
    }

    if (motherDef.key === 'joy-baraka') {
      // 6-month-old child + vaccination history
      const child = await getFirestoreDocument(`children/child-${uid}-1`);
      assert(child !== null, 'Joy Baraka has child record');
      const bcg = await getFirestoreDocument(`children/child-${uid}-1/immunizationRecords/imm-child-${uid}-1-bcg`);
      assert(bcg?.status === 'GIVEN', 'Joy Baraka child has BCG given');
      const penta3 = await getFirestoreDocument(`children/child-${uid}-1/immunizationRecords/imm-child-${uid}-1-penta3`);
      assert(penta3?.status === 'GIVEN', 'Joy Baraka child has 14-week Penta 3 given');
      const vitA = await getFirestoreDocument(`children/child-${uid}-1/immunizationRecords/imm-child-${uid}-1-vita`);
      assert(vitA?.status === 'SCHEDULED', 'Joy Baraka child has 6-month Vitamin A scheduled');
    }

    if (motherDef.key === 'faith-upendo') {
      // 2-year-old child + overdue/missed item
      const child = await getFirestoreDocument(`children/child-${uid}-1`);
      assert(child !== null, 'Faith Upendo has 2-year-old child record');
      const mr2 = await getFirestoreDocument(`children/child-${uid}-1/immunizationRecords/imm-child-${uid}-1-mr2`);
      assert(mr2?.status === 'MISSED', 'Faith Upendo child has MISSED 18-month MR2 dose');
      const tooth = await getFirestoreDocument(`toothEruptions/child-${uid}-1`);
      assert(tooth?.teethPresentCount === 16, 'Faith Upendo child tooth record has 16 teeth');
      const ill = await getFirestoreDocument(`children/child-${uid}-1/illnessRecords/ill-child-${uid}-1-1`);
      assert(ill?.hasDangerSigns === true, 'Faith Upendo child has historical illness record with danger signs');
    }

    if (motherDef.key === 'brenda-imani') {
      // newborn/postpartum + recent PNC + upcoming review
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}-completed`);
      assert(preg?.status === 'completed', 'Brenda Imani has completed pregnancy');
      const child = await getFirestoreDocument(`children/child-${uid}-1`);
      assert(child !== null, 'Brenda Imani has newborn record');
      const pnc = await getFirestoreDocument(`children/child-${uid}-1/postnatalEncounters/pnc-child-${uid}-1-48h`);
      assert(pnc !== null, 'Brenda Imani has 48h postnatal encounter completed');
      const eye = await getFirestoreDocument(`eyeCareAssessments/child-${uid}-1`);
      assert(eye?.teoGivenAtBirth === true, 'Brenda Imani newborn has birth eye-care assessment with TEO');
      const rem = await getFirestoreDocument(`reminders/rem-${uid}-pnc2`);
      assert(rem?.category === 'pnc', 'Brenda Imani has upcoming 1-2 week PNC reminder');
    }

    if (motherDef.key === 'diana-zawadi') {
      // pregnant + toddler/multiple dependents
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}`);
      assert(preg?.status === 'active', 'Diana Zawadi has active pregnancy');
      const child1 = await getFirestoreDocument(`children/child-${uid}-1`);
      const child2 = await getFirestoreDocument(`children/child-${uid}-2`);
      assert(child1 !== null && child2 !== null, 'Diana Zawadi has 2 dependent children');
      const fp = await getFirestoreDocument(`familyPlanning/fp-${uid}`);
      assert(fp?.methodChosen === 'Copper T IUCD', 'Diana Zawadi has previous IUCD family planning record');
    }

    if (motherDef.key === 'winnie-rehema') {
      // pregnant + infant + overlapping ANC/immunization
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}`);
      assert(preg?.status === 'active', 'Winnie Rehema has active pregnancy');
      const infant = await getFirestoreDocument(`children/child-${uid}-1`);
      assert(infant !== null, 'Winnie Rehema has infant record');
      const aefi = await getFirestoreDocument(`aefiReports/aefi-child-${uid}-1-1`);
      assert(aefi?.severity === 'mild', 'Winnie Rehema infant has mild AEFI report');
      const note = await getFirestoreDocument(`clinicianPrivateNotes/note-${uid}-1`);
      assert(note !== null, 'Winnie Rehema has clinician private note');
    }

    if (motherDef.key === 'sharon-nuru') {
      // preconception + no dependents
      const fp = await getFirestoreDocument(`familyPlanning/fp-${uid}`);
      assert(fp?.methodChosen?.includes('COCs'), 'Sharon Nuru has family planning/preconception record');
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}`);
      assert(preg === null, 'Sharon Nuru has no active pregnancy');
    }

    if (motherDef.key === 'christine-amani') {
      // preconception + historical admission/check-in
      const adm = await getFirestoreDocument(`hospitalAdmissions/adm-${uid}-1`);
      assert(adm?.hospitalName === 'Kilifi County Hospital', 'Christine Amani has historical hospital admission');
      const att = await getFirestoreDocument(`specialClinicalAttendances/att-${uid}-1`);
      assert(att !== null, 'Christine Amani has special clinical attendance record');
    }

    if (motherDef.key === 'esther-furaha') {
      // preconception + minimal/no dependents
      const log1 = await getFirestoreDocument(`dailyHealthLogs/log-${uid}-1`);
      const log2 = await getFirestoreDocument(`dailyHealthLogs/log-${uid}-2`);
      assert(log1 !== null && log2 !== null, 'Esther Furaha has historical daily health logs');
      const preg = await getFirestoreDocument(`pregnancies/preg-${uid}`);
      assert(preg === null, 'Esther Furaha has no active pregnancy');
    }
  }

  console.log('\n===============================================================');
  console.log(` VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  console.log('===============================================================');

  if (failures.length > 0) {
    console.error('\nFAILED CHECKS:');
    for (const f of failures) {
      console.error(` - ${f}`);
    }
  } else {
    console.log('All acceptance criteria verified with 100% integrity.');
  }

  return {
    passed: failures.length === 0,
    totalChecks,
    passedChecks,
    failures,
  };
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDemoData()
    .then((result) => {
      if (result.passed) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Verification encountered an unexpected error:', err);
      process.exit(1);
    });
}
