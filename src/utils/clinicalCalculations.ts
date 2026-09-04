export interface GestationCalculation {
  lmp: string;
  edd: string;
  gestationalAgeWeeks: number;
  /** Backwards-compatible alias used by advanced personalization. */
  gestationalWeeks: number;
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
    gestationalWeeks: weeks,
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

export interface BabyMilestone {
  size: string;
  emoji: string;
  fact: string;
}

export type BabySizeMilestone = BabyMilestone;

// Deterministic baby milestones per Kenya & WHO obstetrics guidelines
export const BABY_SIZE_MILESTONES: Record<number, BabyMilestone> = {
  4: { size: 'a poppy seed', emoji: '🌱', fact: 'Blastocyst is implanting gently in the uterine lining.' },
  8: { size: 'a raspberry', emoji: '🫐', fact: 'Tiny fingers, toes and cardiac chambers are developing.' },
  12: { size: 'a plum', emoji: '🍑', fact: 'All vital organs are formed; reflexes are starting.' },
  16: { size: 'an avocado', emoji: '🥑', fact: 'Baby can move facial muscles and make gentle swimming movements.' },
  20: { size: 'a banana', emoji: '🍌', fact: 'Halfway milestone! You may begin to notice fluttery kicks (quickening).' },
  24: { size: 'an ear of corn', emoji: '🌽', fact: 'Baby can hear your voice, heartbeats and familiar ambient sounds.' },
  28: { size: 'an eggplant', emoji: '🍆', fact: 'Entering 3rd trimester! Baby practices breathing movements.' },
  32: { size: 'a butternut squash', emoji: '🥥', fact: 'Bones are fully developed, and baby is storing maternal calcium.' },
  36: { size: 'a papaya', emoji: '🍈', fact: 'Lungs and central nervous system are maturing rapidly for birth.' },
  40: { size: 'a small pumpkin', emoji: '🎃', fact: 'Full term! Baby is ready to be welcomed into the world.' },
};

export function getBabySizeForWeek(week: number): BabyMilestone {
  const availableWeeks = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  const closest = availableWeeks.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );
  return BABY_SIZE_MILESTONES[closest] || {
    size: 'an ear of corn',
    emoji: '🌽',
    fact: 'Baby is growing steadily and hearing sounds from the outside world.',
  };
}

export interface GestationalHeroMetrics {
  weeks: number;
  gestationalWeeks: number;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
  weeksRemaining: number;
  progressRatio: number;
  progressPercent: number;
  edd?: string;
  eddFormatted?: string;
  babySize: BabyMilestone;
}

/**
 * Computes gestational week, trimester, weeks to due date, and baby milestone
 * using a single canonical obstetrics derivation shared across mother and partner views.
 */
export function computeGestationalHeroMetrics(
  pregnancy: { lmp?: string; edd?: string; gestationalAgeWeeks?: number } | null | undefined,
  now: Date = new Date()
): GestationalHeroMetrics | null {
  if (!pregnancy) return null;

  let calc: GestationCalculation | null = null;
  if (pregnancy.lmp) {
    try {
      calc = calculateGestationFromLmp(pregnancy.lmp, now);
    } catch {
      calc = null;
    }
  } else if (pregnancy.edd) {
    try {
      calc = calculateLmpFromEdd(pregnancy.edd, now);
    } catch {
      calc = null;
    }
  }

  let weeks: number;
  let trimester: 1 | 2 | 3;
  let daysRemaining: number;
  let gestationalAgeDays = 0;

  if (calc) {
    weeks = Math.max(1, Math.min(42, calc.gestationalAgeWeeks));
    trimester = calc.trimester;
    daysRemaining = calc.daysRemaining;
    gestationalAgeDays = calc.gestationalAgeDays;
  } else if (typeof pregnancy.gestationalAgeWeeks === 'number' && pregnancy.gestationalAgeWeeks > 0) {
    weeks = Math.max(1, Math.min(42, pregnancy.gestationalAgeWeeks));
    trimester = weeks >= 28 ? 3 : weeks >= 13 ? 2 : 1;
    const remainingWeeks = Math.max(0, 40 - weeks);
    daysRemaining = remainingWeeks * 7;
  } else {
    return null;
  }

  const weeksRemaining = Math.max(0, Math.ceil(daysRemaining / 7));
  const progressRatio = Math.min(1, Math.max(0.05, weeks / 40));
  const progressPercent = Math.round(progressRatio * 100);

  const edd = calc?.edd || pregnancy.edd;
  let eddFormatted: string | undefined = undefined;
  if (edd) {
    try {
      const d = new Date(edd);
      if (!isNaN(d.getTime())) {
        eddFormatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      eddFormatted = edd;
    }
  }

  return {
    weeks,
    gestationalWeeks: weeks,
    gestationalAgeWeeks: weeks,
    gestationalAgeDays,
    trimester,
    daysRemaining,
    weeksRemaining,
    progressRatio,
    progressPercent,
    edd,
    eddFormatted,
    babySize: getBabySizeForWeek(weeks),
  };
}
