import assert from 'node:assert/strict';
import { calculateGestationalAgeWeeks, calculatePregnancyProgress, evaluateBloodPressure, parseBloodPressure } from './clinicalCalculations';

assert.equal(calculateGestationalAgeWeeks('2026-01-01', '2026-01-08'), 2);
assert.equal(calculateGestationalAgeWeeks('2026-01-10', '2026-01-09'), null);
assert.equal(calculatePregnancyProgress(20), 50);
assert.equal(calculatePregnancyProgress(44), 100);
assert.equal(evaluateBloodPressure(120, 80), 'NORMAL');
assert.equal(evaluateBloodPressure(140, 90), 'HYPERTENSIVE_ALERT');
assert.equal(evaluateBloodPressure(89, 59), 'HYPOTENSIVE_ALERT');
assert.deepEqual(parseBloodPressure('120 / 80'), { systolic: 120, diastolic: 80 });
assert.equal(parseBloodPressure('120-80'), null);

console.log('clinical calculation tests passed');
