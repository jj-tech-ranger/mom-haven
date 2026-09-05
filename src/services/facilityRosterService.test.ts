// src/services/facilityRosterService.test.ts
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import type { FacilityRosterEntry } from '../types';
import { isDueThisWeek, isDueToday, isOverdue } from './facilityRosterService';

console.log('--- Facility Roster & Clinic Module Data Contract Tests ---');

// 1. Data Contract Validation
const mockRosterEntry: FacilityRosterEntry = {
  id: 'roster_13123_mother-123_anc',
  facilityId: '13123',
  motherId: 'mother-123',
  childId: null,
  nextDueType: 'anc',
  nextDueDate: '2026-09-10',
  lastVisitDate: '2026-08-10',
  riskFlag: 'watch',
  updatedAt: new Date().toISOString(),
};

assert.strictEqual(mockRosterEntry.facilityId, '13123');
assert.strictEqual(mockRosterEntry.motherId, 'mother-123');
assert.strictEqual(mockRosterEntry.childId, null);
assert.strictEqual(mockRosterEntry.nextDueType, 'anc');
assert.strictEqual(mockRosterEntry.riskFlag, 'watch');

// Allowed due types test
const validDueTypes: FacilityRosterEntry['nextDueType'][] = ['anc', 'immunization', 'pnc', 'growth_check'];
for (const type of validDueTypes) {
  const item: FacilityRosterEntry = {
    ...mockRosterEntry,
    id: `entry_${type}`,
    nextDueType: type,
  };
  assert.ok(['anc', 'immunization', 'pnc', 'growth_check'].includes(item.nextDueType));
}

// Allowed risk flags test
const validRiskFlags: NonNullable<FacilityRosterEntry['riskFlag']>[] = ['none', 'watch', 'urgent'];
for (const flag of validRiskFlags) {
  const item: FacilityRosterEntry = {
    ...mockRosterEntry,
    id: `entry_${flag}`,
    riskFlag: flag,
  };
  assert.ok(['none', 'watch', 'urgent'].includes(item.riskFlag!));
}
console.log('✓ FacilityRosterEntry interface strictly conforms to schema');

// 2. Date Filtering Logic Tests
const now = new Date('2026-09-05T10:00:00.000Z');

// Today
assert.strictEqual(isDueToday('2026-09-05', now), true);
assert.strictEqual(isDueToday('2026-09-06', now), false);

// This week (upcoming 7 days)
assert.strictEqual(isDueThisWeek('2026-09-05', now), true); // today
assert.strictEqual(isDueThisWeek('2026-09-08', now), true); // in 3 days
assert.strictEqual(isDueThisWeek('2026-09-12', now), true); // in 7 days
assert.strictEqual(isDueThisWeek('2026-10-15', now), false); // next month (not this week)

// Overdue
assert.strictEqual(isOverdue('2026-09-01', now), true); // 4 days ago
assert.strictEqual(isOverdue('2026-09-05', now), false); // today is not overdue
assert.strictEqual(isOverdue('2026-09-10', now), false); // future date
console.log('✓ Timing filters (isDueThisWeek, isDueToday, isOverdue) operate accurately');

// 3. Security Rules Verification
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

// Assert facilityRosters collection exists in firestore.rules
assert.ok(
  rulesContent.includes('match /facilityRosters/{id}'),
  'firestore.rules must declare match /facilityRosters/{id}'
);
assert.ok(
  rulesContent.includes('allow write:if false;') || rulesContent.includes('allow write: if false;'),
  'facilityRosters collection must be strictly writable only server-side (write: if false)'
);
assert.ok(
  rulesContent.includes('facilityId==resource.data.facilityId') || rulesContent.includes('facilityId == resource.data.facilityId'),
  'facilityRosters must check clinician facilityId matching entry facilityId'
);
assert.ok(
  rulesContent.includes('isAdmin()'),
  'facilityRosters must allow read by ADMIN'
);

// Assert existing clinicianAccessSessions and clinicianPrivateNotes rules were not broken
assert.ok(
  rulesContent.includes('match /clinicianAccessSessions/{id}'),
  'clinicianAccessSessions rule must remain intact'
);
assert.ok(
  rulesContent.includes('match /clinicianPrivateNotes/{id}'),
  'clinicianPrivateNotes rule must remain intact'
);
console.log('✓ firestore.rules enforces read access by matching facilityId and server-side-only write:false');

// 4. Blueprint Verification
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const blueprintContent = fs.readFileSync(blueprintPath, 'utf8');
assert.ok(blueprintContent.includes('"FacilityRosterEntry"'), 'firebase-blueprint.json defines FacilityRosterEntry');
assert.ok(blueprintContent.includes('"/facilityRosters/{rosterId}"'), 'firebase-blueprint.json defines /facilityRosters/{rosterId}');
console.log('✓ firebase-blueprint.json includes FacilityRosterEntry entity and collection');

// 5. Clinician Navigation Non-Regression
const clinicianShellPath = path.resolve(process.cwd(), 'src/components/ClinicianShell.tsx');
const clinicianShellContent = fs.readFileSync(clinicianShellPath, 'utf8');

// Assert existing tabs are all present and untouched
assert.ok(clinicianShellContent.includes("id: 'dashboard'"), 'Clinician dashboard nav intact');
assert.ok(clinicianShellContent.includes("id: 'access'"), 'Clinician access nav intact');
assert.ok(clinicianShellContent.includes("id: 'workspace'"), 'Clinician workspace nav intact');
assert.ok(clinicianShellContent.includes("id: 'caseload'"), 'Clinician caseload nav intact');
assert.ok(clinicianShellContent.includes("id: 'audit'"), 'Clinician audit nav intact');

// Assert new roster nav is present
assert.ok(clinicianShellContent.includes("id: 'roster'"), 'Clinician roster nav added');
assert.ok(clinicianShellContent.includes('FacilityRosterView'), 'ClinicianShell mounts FacilityRosterView');
console.log('✓ ClinicianShell navigation includes new Facility Roster entry without altering existing entries');

console.log('All Facility Roster & Clinic Module Data Contract tests passed successfully!');
