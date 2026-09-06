import assert from 'node:assert/strict';
import {
  calculateGestationFromLmp,
  calculateLmpFromEdd,
} from './clinicalCalculations';

const asOf = new Date('2026-09-02T00:00:00.000Z');

function test(name: string, fn: () => void): void {
  fn();
  console.log(`✓ ${name}`);
}

test('calculates EDD as 280 days after LMP', () => {
  const result = calculateGestationFromLmp('2026-01-01', asOf);
  assert.equal(result.edd, '2026-10-08');
});

test('calculates gestational age in weeks and days', () => {
  const result = calculateGestationFromLmp('2026-07-16', asOf);
  assert.equal(result.gestationalAgeWeeks, 6);
  assert.equal(result.gestationalAgeDays, 6);
});

test('assigns first trimester through 12 weeks', () => {
  const result = calculateGestationFromLmp('2026-06-04', asOf);
  assert.equal(result.gestationalAgeWeeks, 12);
  assert.equal(result.trimester, 1);
});

test('assigns second trimester from 13 weeks', () => {
  const result = calculateGestationFromLmp('2026-06-03', asOf);
  assert.equal(result.gestationalAgeWeeks, 13);
  assert.equal(result.trimester, 2);
});

test('assigns third trimester from 28 weeks', () => {
  const result = calculateGestationFromLmp('2026-02-18', asOf);
  assert.equal(result.gestationalAgeWeeks, 28);
  assert.equal(result.trimester, 3);
});

test('does not report a negative gestational age for a future LMP', () => {
  const result = calculateGestationFromLmp('2026-09-10', asOf);
  assert.equal(result.gestationalAgeWeeks, 0);
  assert.equal(result.gestationalAgeDays, 0);
  assert.equal(result.daysRemaining, 288);
});

test('caps gestational age at 42 weeks', () => {
  const result = calculateGestationFromLmp('2025-08-20', asOf);
  assert.equal(result.gestationalAgeWeeks, 42);
  assert.equal(result.gestationalAgeDays, 0);
});

test('calculates LMP from EDD consistently', () => {
  const result = calculateLmpFromEdd('2026-10-08', asOf);
  assert.equal(result.lmp, '2026-01-01');
  assert.equal(result.edd, '2026-10-08');
});

test('rejects invalid dates', () => {
  assert.throws(() => calculateGestationFromLmp('not-a-date', asOf), /Invalid LMP date/);
  assert.throws(() => calculateLmpFromEdd('not-a-date', asOf), /Invalid EDD date/);
});

// ---------------------------------------------------------------------------
// MOH 216 Immunization Schedule Tests
// ---------------------------------------------------------------------------
import {
  computeMOH216ImmunizationSchedule,
  calculateWeightForAgeZScore,
  calculateLengthForAgeZScore,
  calculateZScore,
  calculateMeasurementForZ,
  generateNextReminders,
} from './clinicalCalculations';
import {
  WHO_WEIGHT_FOR_AGE_BOYS,
  WHO_WEIGHT_FOR_AGE_GIRLS,
  WHO_LENGTH_FOR_AGE_BOYS,
} from '../data/whoGrowthData';

test('MOH216: at birth, BCG and OPV 0 are due, 6-week vaccines are scheduled', () => {
  const birthDate = '2026-09-02';
  const schedule = computeMOH216ImmunizationSchedule(birthDate, [], asOf);
  const bcg = schedule.find(s => s.vaccineId === 'bcg');
  const opv0 = schedule.find(s => s.vaccineId === 'opv-0');
  const opv1 = schedule.find(s => s.vaccineId === 'opv-1');

  assert.ok(bcg);
  assert.equal(bcg.status, 'due');
  assert.ok(opv0);
  assert.equal(opv0.status, 'due');
  assert.ok(opv1);
  assert.equal(opv1.status, 'scheduled');
  assert.equal(opv1.scheduledDate, '2026-10-14'); // +42 days
});

test('MOH216: seeded child with birth date 10 weeks in the past shows OPV1/DPT1/PCV1/Rota1 as overdue', () => {
  // asOf is 2026-09-02. 10 weeks (70 days) in the past = 2026-06-24
  const dob10WeeksAgo = '2026-06-24';
  const schedule = computeMOH216ImmunizationSchedule(dob10WeeksAgo, [], asOf);

  const opv1 = schedule.find(s => s.vaccineId === 'opv-1');
  const penta1 = schedule.find(s => s.vaccineId === 'penta-1');
  const pcv1 = schedule.find(s => s.vaccineId === 'pcv-1');
  const rota1 = schedule.find(s => s.vaccineId === 'rota-1');

  assert.ok(opv1);
  assert.equal(opv1.status, 'overdue');
  assert.ok(penta1);
  assert.equal(penta1.status, 'overdue');
  assert.ok(pcv1);
  assert.equal(pcv1.status, 'overdue');
  assert.ok(rota1);
  assert.equal(rota1.status, 'overdue');

  // 10-week vaccines should be 'due' on exactly week 10
  const opv2 = schedule.find(s => s.vaccineId === 'opv-2');
  assert.ok(opv2);
  assert.equal(opv2.status, 'due');

  // 14-week vaccines should be 'scheduled' (future)
  const opv3 = schedule.find(s => s.vaccineId === 'opv-3');
  assert.ok(opv3);
  assert.equal(opv3.status, 'scheduled');
});

test('MOH216: administered vaccine marks status as given with dateGiven', () => {
  const dob10WeeksAgo = '2026-06-24';
  const administered = [
    { vaccineName: 'BCG', dateAdministered: '2026-06-24', status: 'GIVEN' },
    { vaccineName: 'OPV', dose: 'Dose 1', dateAdministered: '2026-08-10', status: 'GIVEN' },
  ];
  const schedule = computeMOH216ImmunizationSchedule(dob10WeeksAgo, administered, asOf);

  const bcg = schedule.find(s => s.vaccineId === 'bcg');
  assert.equal(bcg?.status, 'given');
  assert.equal(bcg?.dateGiven, '2026-06-24');

  const opv1 = schedule.find(s => s.vaccineId === 'opv-1');
  assert.equal(opv1?.status, 'given');
  assert.equal(opv1?.dateGiven, '2026-08-10');

  // Penta 1 remains overdue because it was not administered
  const penta1 = schedule.find(s => s.vaccineId === 'penta-1');
  assert.equal(penta1?.status, 'overdue');
});

test('MOH216: grace period boundaries (day before, day of, last grace day, overdue day)', () => {
  // Target 6 weeks is 42 days.
  // Child born 2026-07-22 -> 42 days later is 2026-09-02 (today).
  const dobExact42Days = '2026-07-22';
  const schedExact = computeMOH216ImmunizationSchedule(dobExact42Days, [], asOf);
  const opv1Exact = schedExact.find(s => s.vaccineId === 'opv-1');
  assert.equal(opv1Exact?.status, 'due');

  // Child born 2026-07-23 -> 41 days old (1 day before scheduled 42 days).
  const dob41Days = '2026-07-23';
  const schedBefore = computeMOH216ImmunizationSchedule(dob41Days, [], asOf);
  const opv1Before = schedBefore.find(s => s.vaccineId === 'opv-1');
  assert.equal(opv1Before?.status, 'scheduled');

  // Child born 42 + 14 = 56 days ago (2026-07-08) -> exactly at end of grace period (due)
  const dob56Days = '2026-07-08';
  const schedGraceEnd = computeMOH216ImmunizationSchedule(dob56Days, [], asOf);
  const opv1GraceEnd = schedGraceEnd.find(s => s.vaccineId === 'opv-1');
  assert.equal(opv1GraceEnd?.status, 'due');

  // Child born 57 days ago (2026-07-07) -> 1 day past grace period (overdue)
  const dob57Days = '2026-07-07';
  const schedOverdue = computeMOH216ImmunizationSchedule(dob57Days, [], asOf);
  const opv1Overdue = schedOverdue.find(s => s.vaccineId === 'opv-1');
  assert.equal(opv1Overdue?.status, 'overdue');
});

// ---------------------------------------------------------------------------
// WHO Growth LMS Z-Score Tests against known WHO reference points
// ---------------------------------------------------------------------------

test('WHO Growth: boys weight-for-age at birth reference points', () => {
  // At birth (0m), boys median weight M = 3.3464 kg
  const medianZ = calculateWeightForAgeZScore(3.3464, 0, 'male');
  assert.ok(Math.abs(medianZ.zScore) < 0.01, `Expected ~0, got ${medianZ.zScore}`);
  assert.equal(medianZ.classification, 'normal');
  assert.equal(medianZ.isFlagged, false);

  // Severe underweight at birth: 2.0 kg (WHO -3 SD is ~2.08 kg)
  const samZ = calculateWeightForAgeZScore(2.0, 0, 'male');
  assert.ok(samZ.zScore < -3.0, `Expected < -3, got ${samZ.zScore}`);
  assert.equal(samZ.classification, 'severely_underweight');
  assert.equal(samZ.isFlagged, true);
  assert.equal(samZ.alertLevel, 'severe');

  // Moderate underweight at birth: 2.4 kg (WHO -2 SD is ~2.46 kg)
  const mamZ = calculateWeightForAgeZScore(2.4, 0, 'male');
  assert.ok(mamZ.zScore < -2.0 && mamZ.zScore > -2.5, `Expected ~ -2.2, got ${mamZ.zScore}`);
});

test('WHO Growth: girls weight-for-age at birth reference points', () => {
  // Girls birth median M = 3.2322 kg
  const girlZ = calculateWeightForAgeZScore(3.2322, 0, 'female');
  assert.ok(Math.abs(girlZ.zScore) < 0.01, `Expected ~0, got ${girlZ.zScore}`);
  assert.equal(girlZ.classification, 'normal');
  assert.equal(girlZ.isFlagged, false);
});

test('WHO Growth: 6 months boys weight-for-age reference points', () => {
  // At 6 months, boys median M = 7.9338 kg
  const sixMoZ = calculateWeightForAgeZScore(7.9338, 6, 'male');
  assert.ok(Math.abs(sixMoZ.zScore) < 0.01);
  assert.equal(sixMoZ.classification, 'normal');

  // Below -2 SD (e.g. 5.9 kg at 6 months)
  const falteringZ = calculateWeightForAgeZScore(5.9, 6, 'male');
  assert.ok(falteringZ.zScore < -2.0);
  assert.equal(falteringZ.isFlagged, true);
});

test('WHO Growth: boys length-for-age at birth and 12m reference points', () => {
  // Birth boys length median M = 49.88 cm
  const birthLenZ = calculateLengthForAgeZScore(49.8842, 0, 'male');
  assert.ok(Math.abs(birthLenZ.zScore) < 0.01);
  assert.equal(birthLenZ.classification, 'normal');

  // 12m boys length median M = 75.75 cm
  const yrLenZ = calculateLengthForAgeZScore(75.7485, 12, 'male');
  assert.ok(Math.abs(yrLenZ.zScore) < 0.01);
  assert.equal(yrLenZ.classification, 'normal');

  // Stunted boy at 12m: 69 cm
  const stuntedZ = calculateLengthForAgeZScore(69.0, 12, 'male');
  assert.ok(stuntedZ.zScore < -2.0);
  assert.equal(stuntedZ.isFlagged, true);
  assert.equal(stuntedZ.classification, 'stunted');
});

test('WHO Growth: calculateMeasurementForZ reversibility', () => {
  // For z = 0, calculateMeasurementForZ should yield exact median M
  const medianCalc = calculateMeasurementForZ(0, 0, WHO_WEIGHT_FOR_AGE_BOYS);
  assert.ok(Math.abs(medianCalc - 3.3464) < 0.001);

  // For z = -2, round-trip calculateZScore should yield -2.0
  const valNeg2 = calculateMeasurementForZ(-2, 0, WHO_WEIGHT_FOR_AGE_BOYS);
  const zBack = calculateZScore(valNeg2, 0, WHO_WEIGHT_FOR_AGE_BOYS);
  assert.ok(Math.abs(zBack - (-2)) < 0.001);
});

// ---------------------------------------------------------------------------
// Reminder Generation Pure Function Tests
// ---------------------------------------------------------------------------

test('Reminder Generation: generates ANC reminder from encounter nextAppointmentDate', () => {
  const reminders = generateNextReminders({
    motherId: 'user-1',
    pregnancy: { id: 'preg-1', status: 'active', lmp: '2026-03-01' },
    ancEncounters: [
      { id: 'enc-1', visitNumber: 1, date: '2026-04-15', nextAppointmentDate: '2026-09-15' },
    ],
    children: [],
    asOf,
  });

  assert.ok(reminders.length > 0);
  const ancReminder = reminders.find(r => r.category === 'anc');
  assert.ok(ancReminder);
  assert.equal(ancReminder.dueDate, '2026-09-15');
  assert.equal(ancReminder.sharedWithPartner, true);
  assert.equal(ancReminder.pushEligible, true);
});

test('Reminder Generation: generates child immunization & growth reminders', () => {
  const dob = '2026-06-24'; // 10 weeks ago
  const reminders = generateNextReminders({
    motherId: 'user-1',
    pregnancy: null,
    children: [{ id: 'child-1', name: 'Baraka', dateOfBirth: dob, sex: 'male' }],
    childRecords: {},
    asOf,
  });

  const immReminder = reminders.find(r => r.category === 'immunization');
  assert.ok(immReminder);
  assert.ok(immReminder.title.includes('Baraka'));

  const growthReminder = reminders.find(r => r.category === 'pnc');
  assert.ok(growthReminder);
  assert.ok(growthReminder.title.includes('Monthly Growth'));
});

