// src/services/reminderGenerationService.test.ts
import assert from 'node:assert';
import {
  computeAncVisitReminders,
  computeChildImmunizationReminders,
  computePncContactReminders,
  filterNewReminders,
  DesiredReminder,
} from './reminderGenerationService';
import { Reminder } from '../types';

console.log('--- Phase 2: Clinical Reminder Auto-Generation Tests ---');

// 1. ANC Visit Schedule (8-contact model)
const motherId = 'user-test-mama';
const pregnancy = {
  id: 'preg-888',
  lmp: '2026-01-01',
  edd: '2026-10-08',
};

const ancReminders = computeAncVisitReminders(motherId, pregnancy);
assert.strictEqual(ancReminders.length, 8, 'Must generate exactly 8 ANC contacts');

// Check first contact (Week 10)
const contact1 = ancReminders.find((r) => r.sourceEventId === 'anc-preg-888-visit-1');
assert.ok(contact1, 'Contact 1 must exist');
assert.strictEqual(contact1.category, 'anc');
assert.strictEqual(contact1.dueDate, '2026-03-12', 'Week 10 from 2026-01-01');
assert.strictEqual(contact1.sharedWithPartner, true, 'Clinical reminders should be shareable with partner');

// Check last contact (Week 40)
const contact8 = ancReminders.find((r) => r.sourceEventId === 'anc-preg-888-visit-8');
assert.ok(contact8, 'Contact 8 must exist');
assert.strictEqual(contact8.dueDate, '2026-10-08', 'Week 40 matches calculated EDD');

// Fallback to EDD if LMP is omitted
const ancFromEdd = computeAncVisitReminders(motherId, { id: 'preg-999', edd: '2026-10-08' });
assert.strictEqual(ancFromEdd.length, 8, 'Must derive 8 ANC visits from EDD alone');
console.log('✓ generates 8 WHO/Kenya MOH ANC contacts deterministically from LMP or EDD');

// 2. KEPI Immunization & Child Schedules
const child = {
  id: 'child-101',
  dateOfBirth: '2026-06-01',
  name: 'Zawadi',
};

const childReminders = computeChildImmunizationReminders(motherId, child);
assert.ok(childReminders.length >= 10, 'Must include birth, 6w, 10w, 14w, 6m, 9m, 18m vaccines and supplements');

const birthBcg = childReminders.find((r) => r.sourceEventId === 'kepi-child-101-BCG');
assert.ok(birthBcg, 'BCG at birth must exist');
assert.strictEqual(birthBcg.dueDate, '2026-06-01', 'Birth vaccine due on DOB');
assert.strictEqual(birthBcg.childId, 'child-101');
assert.strictEqual(birthBcg.category, 'immunization');

const deworming12m = childReminders.find((r) => r.sourceEventId === 'deworming-child-101-12m');
assert.ok(deworming12m, '12-Month Deworming dose must be generated');
assert.strictEqual(deworming12m.dueDate, '2027-05-31', '52 weeks from 2026-06-01');

const vitADeworming24m = childReminders.find((r) => r.sourceEventId === 'vit_a_deworming-child-101-24m');
assert.ok(vitADeworming24m, '24-Month Vitamin A + Deworming reminder must exist');
console.log('✓ generates all KEPI child vaccine doses, Vitamin A, and Deworming dates from DOB');

// 3. Postnatal Care (PNC) Windows
const pncReminders = computePncContactReminders(motherId, {
  eventKey: 'preg-888',
  deliveryDate: '2026-09-01',
  childId: 'child-101',
  pregnancyId: 'preg-888',
});

assert.strictEqual(pncReminders.length, 4, 'Must generate 4 postnatal contacts');
const pnc48h = pncReminders.find((r) => r.sourceEventId === 'pnc-preg-888-48h');
assert.ok(pnc48h);
assert.strictEqual(pnc48h.dueDate, '2026-09-03', '48 hours = Day 2 post-delivery');
assert.strictEqual(pnc48h.category, 'pnc');

const pnc6w = pncReminders.find((r) => r.sourceEventId === 'pnc-preg-888-4-6w');
assert.ok(pnc6w);
assert.strictEqual(pnc6w.dueDate, '2026-10-13', '6 weeks (42 days) post-delivery');
console.log('✓ derives the 4 Kenya MOH PNC contact windows (48h, 1-2wk, 4-6wk, 4-6mo) accurately');

// 4. Pure Idempotency and Deduplication
const allDesired: DesiredReminder[] = [...ancReminders, ...childReminders, ...pncReminders];

// First run on clean user (0 existing)
const firstRunNew = filterNewReminders([], allDesired);
assert.strictEqual(firstRunNew.length, allDesired.length, 'First run should mark all desired as new');

// Mock existing state after first run
const existingInDb: Reminder[] = firstRunNew.map((r, i) => ({
  ...r,
  id: `db-rem-${i}`,
  createdAt: new Date().toISOString(),
}));

// Second run with the same source data
const secondRunNew = filterNewReminders(existingInDb, allDesired);
assert.strictEqual(secondRunNew.length, 0, 'Second run must be strictly idempotent (0 duplicates created)');

// Adding a second child should only generate reminders for the second child
const secondChild = {
  id: 'child-102',
  dateOfBirth: '2026-08-15',
  name: 'Baraka',
};
const secondChildReminders = computeChildImmunizationReminders(motherId, secondChild);
const combinedDesired = [...allDesired, ...secondChildReminders];

const incrementalNew = filterNewReminders(existingInDb, combinedDesired);
assert.strictEqual(incrementalNew.length, secondChildReminders.length, 'Only new child reminders should be queued');
assert.ok(incrementalNew.every((r) => r.childId === 'child-102'));

// Completed reminders should also not be recreated
const completedReminders: Reminder[] = existingInDb.map((r, idx) =>
  idx === 0 ? { ...r, completed: true } : r
);
const afterCompletionNew = filterNewReminders(completedReminders, allDesired);
assert.strictEqual(afterCompletionNew.length, 0, 'Completed reminders must not be resurrected or duplicated');

console.log('✓ guarantees strict idempotency, prevents duplicates, and preserves completed reminders');
console.log('All Phase 2 Clinical Reminder Auto-Generation tests passed successfully!');
