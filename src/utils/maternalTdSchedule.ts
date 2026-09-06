// src/utils/maternalTdSchedule.ts
// Maternal Tetanus-Diphtheria (TD) Immunization Schedule Engine
// Strictly conforms to Kenya Ministry of Health Mother-Child Health Handbook (MOH 216) pp. 10–11

import { MaternalTdDose, MaternalTdScheduleResult } from '../types';

export interface TdScheduleDefinition {
  doseNumber: 1 | 2 | 3 | 4 | 5;
  label: string;
  timingDescription: string;
  minIntervalDays: number;
  protectionLevel: string;
  protectionDuration: string;
}

export const TD_SCHEDULE: TdScheduleDefinition[] = [
  {
    doseNumber: 1,
    label: 'TD 1',
    timingDescription: 'At first ANC contact or as early as possible in pregnancy',
    minIntervalDays: 0,
    protectionLevel: 'None',
    protectionDuration: 'None',
  },
  {
    doseNumber: 2,
    label: 'TD 2',
    timingDescription: 'At least 4 weeks after TD 1',
    minIntervalDays: 28, // 4 weeks = 28 days
    protectionLevel: '80%',
    protectionDuration: '3 years',
  },
  {
    doseNumber: 3,
    label: 'TD 3',
    timingDescription: 'At least 6 months after TD 2 (or in next pregnancy)',
    minIntervalDays: 182, // ~6 months
    protectionLevel: '95%',
    protectionDuration: '5 years',
  },
  {
    doseNumber: 4,
    label: 'TD 4',
    timingDescription: 'At least 1 year after TD 3 (or in next pregnancy)',
    minIntervalDays: 365, // 1 year
    protectionLevel: '99%',
    protectionDuration: '10 years',
  },
  {
    doseNumber: 5,
    label: 'TD 5',
    timingDescription: 'At least 1 year after TD 4 (or in next pregnancy)',
    minIntervalDays: 365, // 1 year
    protectionLevel: '99%',
    protectionDuration: 'Childbearing years (lifetime)',
  },
];

const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

/**
 * Calculates a mother's current Td immunization status and next due dose per Kenya MOH 216 pp.10-11.
 *
 * Explicit Handbook Invariant:
 * "If the gap between TD-1 and TD-2 is ≥ 10 years, the schedule restarts from TD-1."
 * This special restart rule applies strictly and exclusively to the 1st–2nd dose gap.
 * Subsequent dose gaps (e.g. between TD-2 and TD-3, or TD-3 and TD-4) > 10 years do NOT
 * restart the schedule; every subsequent dose continues to boost protective immunity.
 */
export function calculateMaternalTdSchedule(
  administeredDoses: MaternalTdDose[] = [],
  referenceDateInput?: string | Date,
  firstAncDateInput?: string
): MaternalTdScheduleResult {
  const refDate = referenceDateInput ? toDate(referenceDateInput) : new Date();
  const notes: string[] = [];

  // Filter valid doses and sort chronologically
  const sorted = [...administeredDoses]
    .filter((d) => Boolean(d && d.dateGiven))
    .sort((a, b) => new Date(a.dateGiven).getTime() - new Date(b.dateGiven).getTime());

  if (sorted.length === 0) {
    const scheduledDate = firstAncDateInput || formatDate(refDate);
    return {
      completedDoses: [],
      nextDoseNumber: 1,
      nextDoseScheduledDate: scheduledDate,
      protectionStatus: 'Unprotected (TD-1 due at first ANC contact)',
      restartedDueTo10YearGap: false,
      notes: ['No maternal TD doses on record. TD-1 should be administered as early as possible in pregnancy.'],
    };
  }

  // Check 10-year rule on Dose 1 to Dose 2 gap
  const firstDose = sorted[0];
  const firstDoseTime = new Date(firstDose.dateGiven).getTime();

  let restartedDueTo10YearGap = false;
  let activeDoses = sorted;

  if (sorted.length === 1) {
    // Only Dose 1 has been recorded
    const gapFromDose1 = refDate.getTime() - firstDoseTime;
    if (gapFromDose1 >= TEN_YEARS_MS) {
      restartedDueTo10YearGap = true;
      notes.push(
        'Special Rule (MOH Handbook p.10): The gap between TD-1 and TD-2 is ≥ 10 years without completion. The schedule restarts from TD-1.'
      );
      return {
        completedDoses: sorted,
        nextDoseNumber: 1,
        nextDoseScheduledDate: formatDate(refDate),
        protectionStatus: 'Unprotected (Restarting from TD-1 due to ≥ 10-year gap)',
        restartedDueTo10YearGap: true,
        notes,
      };
    }
  } else {
    // Dose 1 and at least Dose 2 are recorded. Check the gap between Dose 1 and Dose 2.
    const secondDose = sorted[1];
    const secondDoseTime = new Date(secondDose.dateGiven).getTime();
    const gapDose1Dose2 = secondDoseTime - firstDoseTime;

    if (gapDose1Dose2 >= TEN_YEARS_MS) {
      restartedDueTo10YearGap = true;
      notes.push(
        'Special Rule (MOH Handbook p.10): Gap between Dose 1 and Dose 2 was ≥ 10 years. Prior Dose 1 expired; Dose 2 counted as restarted TD-1.'
      );
      // The second dose effectively becomes the restarted Dose 1, and subsequent doses follow
      activeDoses = sorted.slice(1);
    }
  }

  // Count valid completed doses in current active series (up to 5)
  const validDoseCount = Math.min(activeDoses.length, 5) as 1 | 2 | 3 | 4 | 5;
  const lastActiveDose = activeDoses[activeDoses.length - 1];
  const lastDoseDate = new Date(lastActiveDose.dateGiven);

  if (validDoseCount >= 5) {
    return {
      completedDoses: activeDoses,
      nextDoseNumber: null,
      nextDoseScheduledDate: null,
      protectionStatus: 'Protected for all childbearing years (5-dose complete series, 99% efficacy)',
      restartedDueTo10YearGap,
      notes: [
        'Full 5-dose maternal Td series completed. Lifelong protective immunity achieved per Kenya MOH guidelines.',
      ],
    };
  }

  // Calculate next due dose
  const nextDoseNum = (validDoseCount + 1) as 2 | 3 | 4 | 5;
  const nextDef = TD_SCHEDULE.find((s) => s.doseNumber === nextDoseNum)!;

  // Minimum required interval from last dose
  const minEligibleDate = addDays(lastDoseDate, nextDef.minIntervalDays);
  const nextDoseScheduledDate = formatDate(minEligibleDate);

  // Derive current protection level
  const currentDef = TD_SCHEDULE.find((s) => s.doseNumber === validDoseCount)!;
  let protectionStatus = `${currentDef.protectionLevel} protection (${currentDef.protectionDuration})`;
  if (validDoseCount === 1) {
    protectionStatus = 'Low / Transient protection (TD-2 required for protective immunity)';
  }

  // Add explicit note about later gaps
  if (validDoseCount >= 2) {
    notes.push(
      `Series active: TD-${validDoseCount} completed. Per MOH Handbook p.10, later gaps do NOT restart the schedule; TD-${nextDoseNum} remains due.`
    );
  }

  return {
    completedDoses: activeDoses,
    nextDoseNumber: nextDoseNum,
    nextDoseScheduledDate,
    protectionStatus,
    restartedDueTo10YearGap,
    notes,
  };
}
