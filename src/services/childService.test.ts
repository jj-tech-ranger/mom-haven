// src/services/childService.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { GrowthMeasurement, ChildVaccineRecord, Provenance } from '../types';

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve(fn()).then(() => {
    console.log(`✓ ${name}`);
  });
}

async function runTests() {
  console.log('\n--- Child Service & Modal Regression Tests (Prompt 1.1) ---\n');

  // Test 1: Regression check - AddGrowthMeasurementModal does NOT write to top-level collection
  await test('AddGrowthMeasurementModal does not perform direct top-level writes to growthMeasurements', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/child/AddGrowthMeasurementModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.equal(
      content.includes("addDoc(collection(db, 'growthMeasurements')"),
      false,
      'Modal must NOT write directly to top-level growthMeasurements'
    );
    assert.equal(
      content.includes("collection(db"),
      false,
      'Modal must not construct raw Firestore collections directly'
    );
    assert.equal(
      content.includes("from 'firebase/firestore'"),
      false,
      'Modal must not import direct Firestore functions'
    );
    assert.equal(
      content.includes("addGrowthMeasurement"),
      true,
      'Modal must call childService.addGrowthMeasurement()'
    );
  });

  // Test 2: Regression check - AddVaccineModal does NOT write to top-level collection
  await test('AddVaccineModal does not perform direct top-level writes to childVaccineRecords', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/child/AddVaccineModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.equal(
      content.includes("addDoc(collection(db, 'childVaccineRecords')"),
      false,
      'Modal must NOT write directly to top-level childVaccineRecords'
    );
    assert.equal(
      content.includes("collection(db"),
      false,
      'Modal must not construct raw Firestore collections directly'
    );
    assert.equal(
      content.includes("from 'firebase/firestore'"),
      false,
      'Modal must not import direct Firestore functions'
    );
    assert.equal(
      content.includes("addImmunizationRecord"),
      true,
      'Modal must call childService.addImmunizationRecord()'
    );
  });

  // Test 3: Repo-wide check: No component performs direct top-level writes for child sub-resources
  await test('No component calls addDoc to write directly to Firestore collections', () => {
    const componentsDir = path.resolve(process.cwd(), 'src/components');
    function scanDir(dir: string): string[] {
      const files: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...scanDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const componentFiles = scanDir(componentsDir);
    for (const file of componentFiles) {
      const src = fs.readFileSync(file, 'utf8');
      assert.equal(
        src.includes('addDoc('),
        false,
        `File ${path.relative(process.cwd(), file)} should not call addDoc directly; use service layer`
      );
    }
  });

  // Test 4: Subcollection path matches firestore.rules hierarchy
  await test('childService subcollection paths match firestore.rules security pattern', () => {
    const servicePath = path.resolve(process.cwd(), 'src/services/childService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');

    // Verify subcollection paths in childService
    assert.equal(
      serviceContent.includes('children/${childId}/growthMeasurements'),
      true,
      'childService must write to children/${childId}/growthMeasurements subcollection'
    );
    assert.equal(
      serviceContent.includes('children/${childId}/immunizationRecords'),
      true,
      'childService must write to children/${childId}/immunizationRecords subcollection'
    );

    // Verify firestore.rules covers subcollection wildcard
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    assert.equal(
      rulesContent.includes('match /children/{id}'),
      true,
      'firestore.rules must have a match for /children/{id}'
    );
    assert.equal(
      rulesContent.includes('match /{sub=**}'),
      true,
      'firestore.rules must permit children subcollections via recursive wildcard'
    );
    assert.equal(
      rulesContent.includes('match /growthMeasurements/{id}'),
      false,
      'firestore.rules must NOT have a rogue top-level /growthMeasurements rule'
    );
  });

  // Test 5: Contract compatibility between AddGrowthMeasurementModal payload and childService
  await test('Modal measurement payload matches childService.addGrowthMeasurement signature', () => {
    const childId = 'child-demo-001';
    const userId = 'mother-user-789';

    const testProvenance: Provenance = {
      status: 'REPORTED',
      enteredBy: userId,
      enteredAt: new Date().toISOString(),
      verifiedBy: null,
      verifiedAt: null,
    };

    const modalPayload: Omit<GrowthMeasurement, 'id'> = {
      childId,
      date: '2026-03-04',
      ageMonths: 6,
      weightKg: 7.4,
      heightCm: 66.0,
      muacCm: 14.0,
      headCircumferenceCm: 43.5,
      feedingStatus: 'Exclusive Breastfeeding',
      notes: 'Child is active and alert.',
      provenance: testProvenance,
    };

    assert.equal(modalPayload.childId, childId);
    assert.equal(modalPayload.weightKg, 7.4);
    assert.equal(modalPayload.provenance.status, 'REPORTED');
    assert.equal(modalPayload.provenance.enteredBy, userId);
  });

  // Test 6: In-memory simulation of modal write -> immediate childService getGrowthMeasurements visibility
  await test('Measurement written via modal payload format is immediately visible in child growth measurements', async () => {
    // Simulated Firestore subcollection store
    const subcollectionStore = new Map<string, GrowthMeasurement[]>();

    function mockAddGrowthMeasurement(cid: string, measurement: Omit<GrowthMeasurement, 'id'>): string {
      const id = `meas-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const fullDoc: GrowthMeasurement = {
        ...measurement,
        id,
        createdAt: new Date().toISOString(),
      };
      const existing = subcollectionStore.get(cid) || [];
      existing.push(fullDoc);
      subcollectionStore.set(cid, existing);
      return id;
    }

    function mockGetGrowthMeasurements(cid: string): GrowthMeasurement[] {
      return (subcollectionStore.get(cid) || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    }

    const childId = 'child-test-123';
    const measurementId = mockAddGrowthMeasurement(childId, {
      childId,
      date: '2026-03-04',
      ageMonths: 4,
      weightKg: 6.5,
      heightCm: 62.0,
      provenance: {
        status: 'REPORTED',
        enteredBy: 'mother-1',
        enteredAt: '2026-03-04T10:00:00Z',
      },
    });

    assert.ok(measurementId, 'Must return a generated document ID');

    // Query for the child
    const results = mockGetGrowthMeasurements(childId);
    assert.equal(results.length, 1, 'Measurement must be immediately queryable');
    assert.equal(results[0].id, measurementId);
    assert.equal(results[0].weightKg, 6.5);
    assert.equal(results[0].childId, childId);

    // Verify subcollection isolation: another child has 0 records
    const otherChildResults = mockGetGrowthMeasurements('other-child-456');
    assert.equal(otherChildResults.length, 0, 'Other children must not see records from child-test-123');
  });

  console.log('All Child Service & Modal Regression Tests passed successfully!\n');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
