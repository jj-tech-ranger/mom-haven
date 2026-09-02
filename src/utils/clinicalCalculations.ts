export interface GestationCalculation {
  lmp: string;
  edd: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PREGNANCY_DAYS = 280;

/**
 * Calculate pregnancy dating from the first day of the last menstrual period.
 * `asOf` is injectable so clinical logic can be tested deterministically.
 */
export function calculateGestationFromLmp(
  lmpString: string,
  asOf: Date = new Date(),
): GestationCalculation {
  const lmpDate = new Date(lmpString);
  const eddDate = new Date(lmpDate.getTime() + PREGNANCY_DAYS * DAY_MS);

  if (Number.isNaN(lmpDate.getTime()) || Number.isNaN(eddDate.getTime())) {
    throw new Error('Invalid LMP date');
  }

  const diffTime = asOf.getTime() - lmpDate.getTime();
  const totalDays = Math.max(0, Math.floor(diffTime / DAY_MS));
  const weeks = Math.min(42, Math.floor(totalDays / 7));
  const days = totalDays % 7;

  const remainingTime = eddDate.getTime() - asOf.getTime();
  const daysRemaining = Math.max(0, Math.ceil(remainingTime / DAY_MS));

  let trimester: 1 | 2 | 3 = 1;
  if (weeks >= 28) trimester = 3;
  else if (weeks >= 13) trimester = 2;

  return {
    lmp: toDateOnly(lmpDate),
    edd: toDateOnly(eddDate),
    gestationalAgeWeeks: weeks,
    gestationalAgeDays: days,
    trimester,
    daysRemaining,
  };
}

export function calculateLmpFromEdd(
  eddString: string,
  asOf: Date = new Date(),
): GestationCalculation {
  const eddDate = new Date(eddString);
  if (Number.isNaN(eddDate.getTime())) throw new Error('Invalid EDD date');

  const lmpDate = new Date(eddDate.getTime() - PREGNANCY_DAYS * DAY_MS);
  return calculateGestationFromLmp(toDateOnly(lmpDate), asOf);
}

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}
