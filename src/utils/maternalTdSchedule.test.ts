// src/utils/maternalTdSchedule.test.ts
// Unit tests for Kenya MOH Maternal Td Immunization Schedule Engine

import { calculateMaternalTdSchedule, TD_SCHEDULE } from './maternalTdSchedule';
import { MaternalTdDose } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function runTests() {
  console.log('\n--- Running Maternal Td Schedule Tests ---');

  // Test 1: No doses administered
  const emptySchedule = calculateMaternalTdSchedule([]);
  assert(emptySchedule.protectionStatus.includes('Unprotected'), 'Zero doses should be Unprotected');
  assert(emptySchedule.completedDoses.length === 0, 'completedDoses should be empty');
  assert(emptySchedule.nextDoseNumber === 1, 'Next due dose should be TD 1');
  assert(emptySchedule.restartedDueTo10YearGap === false, 'restartedDueTo10YearGap should be false');

  // Test 2: Single dose administered (TD 1)
  const singleDose: MaternalTdDose[] = [
    { doseNumber: 1, dateGiven: '2024-01-01', facilityName: 'Pumwani Maternity' },
  ];
  const td1Schedule = calculateMaternalTdSchedule(singleDose, '2024-02-01');
  assert(td1Schedule.protectionStatus.includes('Low / Transient'), 'TD 1 alone does not give full protective immunity');
  assert(td1Schedule.completedDoses.length === 1, 'completedDoses length should be 1');
  assert(td1Schedule.nextDoseNumber === 2, 'Next due dose should be TD 2');

  // Test 3: Two doses administered (TD 1 + TD 2)
  const twoDoses: MaternalTdDose[] = [
    { doseNumber: 1, dateGiven: '2024-01-01', facilityName: 'Pumwani Maternity' },
    { doseNumber: 2, dateGiven: '2024-02-01', facilityName: 'Pumwani Maternity' },
  ];
  const td2Schedule = calculateMaternalTdSchedule(twoDoses, '2024-03-01');
  assert(td2Schedule.protectionStatus.includes('80%'), 'TD 2 protects current pregnancy (80% protection)');
  assert(td2Schedule.completedDoses.length === 2, 'completedDoses length should be 2');
  assert(td2Schedule.nextDoseNumber === 3, 'Next due dose should be TD 3');

  // Test 4: Three doses administered (TD 1, 2, 3)
  const threeDoses: MaternalTdDose[] = [
    { doseNumber: 1, dateGiven: '2020-01-01' },
    { doseNumber: 2, dateGiven: '2020-02-01' },
    { doseNumber: 3, dateGiven: '2020-08-01' },
  ];
  const td3Schedule = calculateMaternalTdSchedule(threeDoses, '2021-01-01');
  assert(td3Schedule.protectionStatus.includes('95%'), 'TD 3 gives 95% protection');
  assert(td3Schedule.completedDoses.length === 3, 'completedDoses length should be 3');
  assert(td3Schedule.nextDoseNumber === 4, 'Next due dose should be TD 4');

  // Test 5: Five doses completed (Full lifelong immunity)
  const fiveDoses: MaternalTdDose[] = [
    { doseNumber: 1, dateGiven: '2015-01-01' },
    { doseNumber: 2, dateGiven: '2015-02-01' },
    { doseNumber: 3, dateGiven: '2015-08-01' },
    { doseNumber: 4, dateGiven: '2016-08-01' },
    { doseNumber: 5, dateGiven: '2017-08-01' },
  ];
  const td5Schedule = calculateMaternalTdSchedule(fiveDoses, '2020-01-01');
  assert(td5Schedule.protectionStatus.includes('childbearing years'), 'TD 5 grants protection for all childbearing years');
  assert(td5Schedule.completedDoses.length === 5, 'completedDoses length should be 5');
  assert(td5Schedule.nextDoseNumber === null, 'No further doses due after TD 5');

  // Test 6: MOH Rule — Later gaps do NOT restart schedule
  // Dose 1 in 2012, Dose 2 in 2012, Dose 3 in 2024 (12-year gap between 2 and 3)
  const laterGapDoses: MaternalTdDose[] = [
    { doseNumber: 1, dateGiven: '2012-01-01' },
    { doseNumber: 2, dateGiven: '2012-02-01' },
    { doseNumber: 3, dateGiven: '2024-01-01' },
  ];
  const laterGapSchedule = calculateMaternalTdSchedule(laterGapDoses, '2024-02-01');
  assert(laterGapSchedule.restartedDueTo10YearGap === false, 'Gap between dose 2 and 3 does NOT restart schedule');
  assert(laterGapSchedule.completedDoses.length === 3, 'All 3 doses are counted');
  assert(laterGapSchedule.nextDoseNumber === 4, 'Next due dose is TD 4');

  // Test 7: MOH Special Rule — Gap between Dose 1 and Dose 2 >= 10 years restarts
  const dose1GapDoses: MaternalTdDose[] = [
    { doseNumber: 1, dateGiven: '2010-01-01' },
    { doseNumber: 2, dateGiven: '2023-01-01' }, // 13-year gap between 1 and 2
  ];
  const dose1GapSchedule = calculateMaternalTdSchedule(dose1GapDoses, '2023-02-01');
  assert(dose1GapSchedule.restartedDueTo10YearGap === true, 'Gap between dose 1 and 2 >= 10 years triggers restart');
  assert(dose1GapSchedule.completedDoses.length === 1, 'Dose 2 becomes new TD 1, count is 1');
  assert(dose1GapSchedule.nextDoseNumber === 2, 'Next due dose is TD 2');

  console.log('--- All Maternal Td Schedule Tests Passed Successfully! ---\n');
}

runTests();
