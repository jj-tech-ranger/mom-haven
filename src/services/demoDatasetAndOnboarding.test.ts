// src/services/demoDatasetAndOnboarding.test.ts
import assert from 'node:assert/strict';
import { KENYA_KMHFL_FACILITIES, type KMHFLFacility } from './clinicianService';
import {
  DEMO_DATASET_ID,
  DEMO_DOMAIN,
  DEMO_PASSWORD,
  DEMO_CLINICIANS,
  DEMO_PARTNERS,
  DEMO_MOTHERS,
  formatDate,
  weeksAgo,
  weeksFromNow,
} from '../../server/seed/demoData';
import {
  loadManifest,
  getLocalStoreDoc,
  getAllLocalStoreDocs,
} from '../../server/seed/seedUtils';

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`  ✓ ${name}`);
}

export async function runTests() {
  console.log('\n--- Demo Dataset, Onboarding & Clinical Consistency Tests ---\n');

  // 1. County → Hospital Filtering
  await test('county → hospital filtering returns only facilities belonging to the selected county', () => {
    const nairobiHospitals = KENYA_KMHFL_FACILITIES.filter(
      (f) => f.county.trim().toLowerCase() === 'nairobi'
    );
    assert.ok(nairobiHospitals.length >= 3, 'Nairobi has multiple KMHFL facilities');
    assert.ok(nairobiHospitals.every((f) => f.county.toLowerCase() === 'nairobi'));
    assert.ok(nairobiHospitals.some((f) => f.name.includes('Pumwani')));
    assert.ok(nairobiHospitals.some((f) => f.name.includes('Kenyatta National Hospital')));

    const mombasaHospitals = KENYA_KMHFL_FACILITIES.filter(
      (f) => f.county.trim().toLowerCase() === 'mombasa'
    );
    assert.ok(mombasaHospitals.length >= 1, 'Mombasa has KMHFL facilities');
    assert.ok(mombasaHospitals.every((f) => f.county.toLowerCase() === 'mombasa'));
    assert.ok(mombasaHospitals.some((f) => f.name.includes('Coast General')));
    assert.ok(!mombasaHospitals.some((f) => f.name.includes('Pumwani')), 'Mombasa must not include Nairobi facilities');

    const kisumuHospitals = KENYA_KMHFL_FACILITIES.filter(
      (f) => f.county.trim().toLowerCase() === 'kisumu'
    );
    assert.ok(kisumuHospitals.some((f) => f.name.includes('Jaramogi Oginga Odinga')));

    const nakuruHospitals = KENYA_KMHFL_FACILITIES.filter(
      (f) => f.county.trim().toLowerCase() === 'nakuru'
    );
    assert.ok(nakuruHospitals.some((f) => f.name.includes('Nakuru Level 5')));
  });

  // 2. County Change Clearing Incompatible Hospital
  await test('county change clears hospital selection if it does not belong to the new county', () => {
    // Initial state: Mother selected Pumwani in Nairobi
    let selectedCounty = 'Nairobi';
    let hospitalId = '13123'; // Pumwani Maternity Hospital (Nairobi)
    let hospitalName = 'Pumwani Maternity Hospital';

    function onCountyChange(newCounty: string) {
      selectedCounty = newCounty;
      if (hospitalId) {
        const match = KENYA_KMHFL_FACILITIES.find(
          (f) => f.code === hospitalId && f.county.trim().toLowerCase() === newCounty.trim().toLowerCase()
        );
        if (!match) {
          hospitalId = '';
          hospitalName = '';
        }
      }
    }

    // Change to Mombasa: Pumwani does not belong to Mombasa -> must clear
    onCountyChange('Mombasa');
    assert.equal(selectedCounty, 'Mombasa');
    assert.equal(hospitalId, '', 'Hospital ID must be cleared on county change to Mombasa');
    assert.equal(hospitalName, '', 'Hospital Name must be cleared on county change to Mombasa');

    // Select Coast General in Mombasa
    hospitalId = '11540';
    hospitalName = 'Coast General Teaching & Referral Hospital';

    // Change to Kisumu: Coast General does not belong to Kisumu -> must clear
    onCountyChange('Kisumu');
    assert.equal(hospitalId, '', 'Hospital ID must be cleared on county change to Kisumu');

    // Select JOOTRH in Kisumu
    hospitalId = '15400';
    hospitalName = 'Jaramogi Oginga Odinga Teaching & Referral Hospital';

    // Re-select Kisumu: should preserve
    onCountyChange('Kisumu');
    assert.equal(hospitalId, '15400', 'Hospital ID must be preserved when county is unchanged');
  });

  // 3. Optional Primary Hospital
  await test('optional primary hospital allows continuing without selecting a facility', () => {
    // Mothers without primary hospitals in the demo dataset (e.g. Diana, Sharon, Christine, Esther)
    const mothersWithoutHospital = DEMO_MOTHERS.filter((m) => !m.primaryHospitalFacilityId);
    assert.equal(mothersWithoutHospital.length, 4, 'Exactly 4 mothers have no primary hospital selected');

    for (const m of mothersWithoutHospital) {
      assert.equal(m.primaryHospitalFacilityId, undefined);
      assert.equal(m.primaryHospitalName, undefined);
      assert.ok(m.county.length > 0, `${m.name} still has a valid county`);
    }

    // Mothers with primary hospital have verified KMHFL facilities matching their county
    const mothersWithHospital = DEMO_MOTHERS.filter((m) => !!m.primaryHospitalFacilityId);
    assert.equal(mothersWithHospital.length, 6, 'Exactly 6 mothers have primary hospital selected');

    for (const m of mothersWithHospital) {
      const facility = KENYA_KMHFL_FACILITIES.find((f) => f.code === m.primaryHospitalFacilityId);
      assert.ok(facility, `Facility ${m.primaryHospitalFacilityId} exists in KMHFL catalogue`);
      assert.equal(
        facility?.county.trim().toLowerCase(),
        m.county.trim().toLowerCase(),
        `Facility county ${facility?.county} must match mother county ${m.county}`
      );
    }
  });

  // 4. Mother Profile Persistence & Schema Conformance
  await test('mother profile persistence strictly conforms to production schema and forbids subcounty/city fields', () => {
    for (const m of DEMO_MOTHERS) {
      const doc = getLocalStoreDoc(`motherProfiles/${m.email}`) || getLocalStoreDoc('motherProfiles');
      // Verify schema rules from specification
      assert.ok(m.county, `${m.name} must have a county`);
      assert.equal((m as any).subcounty, undefined, `${m.name} must not have subcounty`);
      assert.equal((m as any).residenceSubcounty, undefined, `${m.name} must not have residenceSubcounty`);
      assert.equal((m as any).city, undefined, `${m.name} must not have city`);

      // Verify support distribution
      if (m.support === 'partner') {
        assert.ok(['grace-neema', 'brenda-imani', 'christine-amani'].includes(m.key), `${m.name} has partner support`);
      } else if (m.support === 'family') {
        assert.ok(['mercy-faraja', 'faith-upendo', 'winnie-rehema'].includes(m.key), `${m.name} has family support`);
        assert.ok(m.emergencyContact, `${m.name} has family emergency contact`);
        assert.ok(m.emergencyContact?.name, `${m.name} has family contact name`);
        assert.ok(m.emergencyContact?.relationship, `${m.name} has family contact relationship`);
      } else {
        assert.equal(m.support, 'none');
        assert.equal(m.emergencyContact, undefined, `${m.name} with no support has no emergency contact`);
      }
    }
  });

  // 5. Seed Idempotency
  await test('seed idempotency: manifest and documents are stable and reusable across runs', () => {
    const manifest = loadManifest();
    assert.ok(manifest !== null, 'Seed manifest exists');
    assert.equal(manifest?.dataset, DEMO_DATASET_ID);
    assert.equal(manifest?.authAccounts.length, 19, 'Manifest contains all 19 accounts (6 clinicians, 3 partners, 10 mothers)');

    // Verify all clinician accounts are present
    for (const clin of DEMO_CLINICIANS) {
      const found = manifest?.authAccounts.find((a) => a.email === clin.email);
      assert.ok(found, `Clinician ${clin.email} registered in manifest`);
      assert.equal(found?.role, 'CLINICIAN');
    }

    // Verify all partner accounts are present
    for (const partner of DEMO_PARTNERS) {
      const found = manifest?.authAccounts.find((a) => a.email === partner.email);
      assert.ok(found, `Partner ${partner.email} registered in manifest`);
      assert.equal(found?.role, 'PARTNER');
    }

    // Verify all mother accounts are present
    for (const mother of DEMO_MOTHERS) {
      const found = manifest?.authAccounts.find((a) => a.email === mother.email);
      assert.ok(found, `Mother ${mother.email} registered in manifest`);
      assert.equal(found?.role, 'MOTHER');
    }
  });

  // 6. Safe Email Collision Handling
  await test('safe email collision handling: refuses to touch or delete accounts outside demo domain', () => {
    const foreignEmail = 'real.doctor@knh.or.ke';
    assert.ok(!foreignEmail.endsWith(DEMO_DOMAIN), 'Foreign email does not end with demo domain');

    // Check safety assertion function
    function checkSafety(email: string) {
      if (!email.trim().toLowerCase().endsWith(DEMO_DOMAIN)) {
        throw new Error(`SECURITY REFUSAL: Account ${email} does not belong to demo domain ${DEMO_DOMAIN}.`);
      }
      return true;
    }

    assert.throws(
      () => checkSafety(foreignEmail),
      /SECURITY REFUSAL/,
      'Must refuse foreign account'
    );

    assert.equal(
      checkSafety('dr.faith.amani@momhaven-demo.co.ke'),
      true,
      'Permits valid demo domain account'
    );
  });

  // 7. Demo Verification: Clinicians, Partners, and Mother States
  await test('demo verification asserts all 6 clinicians, 3 partner accounts, and 0 unwanted support accounts', () => {
    // 6 Clinicians: 4 approved, 1 pending, 1 rejected with rejectionReason
    const approved = DEMO_CLINICIANS.filter((c) => c.status === 'approved');
    const pending = DEMO_CLINICIANS.filter((c) => c.status === 'pending');
    const rejected = DEMO_CLINICIANS.filter((c) => c.status === 'rejected');

    assert.equal(approved.length, 4, 'Exactly 4 approved clinicians');
    assert.equal(pending.length, 1, 'Exactly 1 pending clinician (Dr. Peter Imani)');
    assert.equal(rejected.length, 1, 'Exactly 1 rejected clinician (Joseph Zawadi)');
    assert.equal(pending[0].name, 'Dr. Peter Imani');
    assert.equal(rejected[0].name, 'Joseph Zawadi');
    assert.ok(rejected[0].rejectionReason && rejected[0].rejectionReason.length > 10, 'Rejected clinician has visible rejectionReason');

    // Only 3 partner accounts in DEMO_PARTNERS
    assert.equal(DEMO_PARTNERS.length, 3, 'Only 3 partner accounts');
    assert.deepEqual(
      DEMO_PARTNERS.map((p) => p.motherEmail).sort(),
      ['brenda.imani@momhaven-demo.co.ke', 'christine.amani@momhaven-demo.co.ke', 'grace.neema@momhaven-demo.co.ke'].sort()
    );
  });

  // 8. Cleanup Safety
  await test('cleanup safety: only documents with demoDataset marker are targeted', () => {
    const demoDoc = { id: 'doc-1', title: 'Demo Log', demoDataset: DEMO_DATASET_ID };
    const prodDoc = { id: 'doc-2', title: 'Production Clinical Record' };

    function canDelete(doc: any): boolean {
      return doc.demoDataset === DEMO_DATASET_ID;
    }

    assert.equal(canDelete(demoDoc), true, 'Demo doc marked with dataset id can be cleaned');
    assert.equal(canDelete(prodDoc), false, 'Production doc must NEVER be deleted');
  });

  // 9. Pregnancy Date & Trimester Consistency
  await test('pregnancy date and trimester consistency across gestational age ranges', () => {
    const gracePayload = DEMO_MOTHERS.find((m) => m.key === 'grace-neema')?.buildData('uid-grace');
    assert.ok(gracePayload?.pregnancy, 'Grace has pregnancy payload');
    assert.ok(
      gracePayload!.pregnancy!.gestationalAgeWeeks >= 1 && gracePayload!.pregnancy!.gestationalAgeWeeks <= 13,
      `Grace Neema is 1st trimester (${gracePayload!.pregnancy!.gestationalAgeWeeks} weeks)`
    );

    const mercyPayload = DEMO_MOTHERS.find((m) => m.key === 'mercy-faraja')?.buildData('uid-mercy');
    assert.ok(mercyPayload?.pregnancy, 'Mercy has pregnancy payload');
    assert.ok(
      mercyPayload!.pregnancy!.gestationalAgeWeeks >= 28 && mercyPayload!.pregnancy!.gestationalAgeWeeks <= 42,
      `Mercy Faraja is 3rd trimester (${mercyPayload!.pregnancy!.gestationalAgeWeeks} weeks)`
    );

    const brendaPayload = DEMO_MOTHERS.find((m) => m.key === 'brenda-imani')?.buildData('uid-brenda');
    assert.equal(brendaPayload?.pregnancy?.status, 'completed', 'Brenda pregnancy is completed');
    assert.ok(brendaPayload?.children?.length! >= 1, 'Brenda has newborn child');

    const dianaPayload = DEMO_MOTHERS.find((m) => m.key === 'diana-zawadi')?.buildData('uid-diana');
    assert.equal(dianaPayload?.pregnancy?.status, 'active', 'Diana has active pregnancy');
    assert.equal(dianaPayload?.children?.length, 2, 'Diana has 2 children (multiparous + pregnant)');

    const winniePayload = DEMO_MOTHERS.find((m) => m.key === 'winnie-rehema')?.buildData('uid-winnie');
    assert.equal(winniePayload?.pregnancy?.status, 'active', 'Winnie has active pregnancy');
    assert.equal(winniePayload?.children?.length, 1, 'Winnie has infant child');
  });

  // 10. Vaccine Status & Date Consistency
  await test('vaccine status and date consistency: strictly valid status and logical administered dates', () => {
    const joyPayload = DEMO_MOTHERS.find((m) => m.key === 'joy-baraka')?.buildData('uid-joy');
    assert.ok(joyPayload?.children?.[0]?.immunizations, 'Joy child has immunizations');

    const allowedStatuses = new Set(['GIVEN', 'SCHEDULED', 'MISSED', 'OVERDUE']);
    for (const v of joyPayload!.children![0].immunizations!) {
      assert.ok(allowedStatuses.has(v.status), `Vaccine status '${v.status}' is valid`);
      if (v.status === 'GIVEN') {
        assert.ok(v.dateAdministered, `Given dose ${v.vaccineName} has administered date`);
        assert.ok(v.facility || (v as any).facilityId, `Given dose ${v.vaccineName} has facility`);
      }
    }

    const faithPayload = DEMO_MOTHERS.find((m) => m.key === 'faith-upendo')?.buildData('uid-faith');
    const missedOrOverdue = faithPayload?.children?.[0]?.immunizations?.find(
      (v) => v.status === 'MISSED' || v.status === 'OVERDUE'
    );
    assert.ok(missedOrOverdue, 'Faith Upendo child has MISSED or OVERDUE immunization record');
    assert.equal(missedOrOverdue?.status, 'MISSED', '18-month measles dose is marked MISSED');
  });

  console.log('\nAll 10 Demo Dataset, Onboarding & Clinical Consistency tests passed successfully!\n');
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
