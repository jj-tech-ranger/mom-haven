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
  assert.equal(result.daysRemaining, 30);
});

test('caps gestational age at 42 weeks', () => {
  const result = calculateGestationFromLmp('2025-08-20', asOf);
  assert.equal(result.gestationalAgeWeeks, 42);
  assert.equal(result.gestationalAgeDays, 6);
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
