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

// ---------------------------------------------------------------------------
// MOH 216 Childhood Immunization Engine (KEPI Schedule)
// ---------------------------------------------------------------------------

export type MOH216AntigenName =
  | 'BCG'
  | 'OPV0'
  | 'OPV1'
  | 'OPV2'
  | 'OPV3'
  | 'IPV'
  | 'DPT-HepB-Hib 1'
  | 'DPT-HepB-Hib 2'
  | 'DPT-HepB-Hib 3'
  | 'PCV 1'
  | 'PCV 2'
  | 'PCV 3'
  | 'Rota 1'
  | 'Rota 2'
  | 'MR-6mo'
  | 'MR-9mo'
  | 'MR-18mo'
  | 'YellowFever';

export interface MOH216ScheduleDoseDefinition {
  antigen: MOH216AntigenName;
  targetAgeWeeks: number;
  label: string;
  route: string;
  notes?: string;
}

export const MOH216_STANDARD_DOSES: MOH216ScheduleDoseDefinition[] = [
  // Birth
  { antigen: 'BCG', targetAgeWeeks: 0, label: 'At birth', route: 'Intradermal' },
  { antigen: 'OPV0', targetAgeWeeks: 0, label: 'At birth (within 2 weeks)', route: 'Oral' },
  // 6 Weeks
  { antigen: 'OPV1', targetAgeWeeks: 6, label: '6 Weeks', route: 'Oral' },
  { antigen: 'DPT-HepB-Hib 1', targetAgeWeeks: 6, label: '6 Weeks (Penta 1)', route: 'Intramuscular' },
  { antigen: 'PCV 1', targetAgeWeeks: 6, label: '6 Weeks', route: 'Intramuscular' },
  { antigen: 'Rota 1', targetAgeWeeks: 6, label: '6 Weeks', route: 'Oral' },
  // 10 Weeks
  { antigen: 'OPV2', targetAgeWeeks: 10, label: '10 Weeks', route: 'Oral' },
  { antigen: 'DPT-HepB-Hib 2', targetAgeWeeks: 10, label: '10 Weeks (Penta 2)', route: 'Intramuscular' },
  { antigen: 'PCV 2', targetAgeWeeks: 10, label: '10 Weeks', route: 'Intramuscular' },
  { antigen: 'Rota 2', targetAgeWeeks: 10, label: '10 Weeks', route: 'Oral' },
  // 14 Weeks
  { antigen: 'OPV3', targetAgeWeeks: 14, label: '14 Weeks', route: 'Oral' },
  { antigen: 'IPV', targetAgeWeeks: 14, label: '14 Weeks', route: 'Intramuscular' },
  { antigen: 'DPT-HepB-Hib 3', targetAgeWeeks: 14, label: '14 Weeks (Penta 3)', route: 'Intramuscular' },
  { antigen: 'PCV 3', targetAgeWeeks: 14, label: '14 Weeks', route: 'Intramuscular' },
  // 6 Months (special/risk)
  { antigen: 'MR-6mo', targetAgeWeeks: 26, label: '6 Months', route: 'Subcutaneous', notes: 'High-risk / outbreak dose' },
  // 9 Months
  { antigen: 'MR-9mo', targetAgeWeeks: 39, label: '9 Months', route: 'Subcutaneous' },
  { antigen: 'YellowFever', targetAgeWeeks: 39, label: '9 Months', route: 'Subcutaneous' },
  // 18 Months
  { antigen: 'MR-18mo', targetAgeWeeks: 78, label: '18 Months', route: 'Subcutaneous' },
];

export interface ScheduledMOH216Vaccine {
  antigen: MOH216AntigenName;
  targetAgeWeeks: number;
  scheduledDate: string;
  status: 'given' | 'due' | 'overdue' | 'scheduled';
  givenDate?: string | null;
  batchNumber?: string;
  daysDifference: number; // Positive = future, Negative = past
}

/**
 * Derives dynamic immunization status without storing stale values in database.
 */
export function deriveImmunizationStatus(
  scheduledDate: string,
  givenDate?: string | null,
  asOf: Date = new Date()
): 'given' | 'due' | 'overdue' | 'scheduled' {
  if (givenDate && givenDate.trim().length > 0) {
    return 'given';
  }

  const sched = new Date(scheduledDate);
  const now = new Date(asOf);
  if (isNaN(sched.getTime())) return 'scheduled';

  // Normalize to date-only boundary (UTC)
  const schedTime = new Date(sched.toISOString().split('T')[0]).getTime();
  const nowTime = new Date(now.toISOString().split('T')[0]).getTime();
  const diffDays = Math.round((schedTime - nowTime) / DAY_MS);

  if (diffDays < 0) {
    return 'overdue';
  }
  if (diffDays <= 14) {
    return 'due';
  }
  return 'scheduled';
}

/**
 * Pure function: Given a child's dateOfBirth, computes the MOH 216 schedule
 * and derives real-time due/overdue/given status.
 */
export function computeMOH216Schedule(
  dateOfBirth: string,
  administeredRecords: { antigen?: string; vaccine?: string; givenDate?: string | null; dateGiven?: string | null; batchNumber?: string; status?: string }[] = [],
  asOf: Date = new Date()
): ScheduledMOH216Vaccine[] {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    throw new Error('Invalid child date of birth');
  }

  // Create lookup of administered records
  const administeredMap = new Map<string, { givenDate: string; batchNumber?: string }>();
  for (const rec of administeredRecords) {
    const key = (rec.antigen || rec.vaccine || '').trim().toLowerCase();
    if (!key) continue;
    const given = rec.givenDate || rec.dateGiven;
    const isMarkedGiven = rec.status === 'given' || rec.status === 'GIVEN';
    if (given || isMarkedGiven) {
      administeredMap.set(key, {
        givenDate: given || toDateOnly(asOf),
        batchNumber: rec.batchNumber,
      });
    }
  }

  return MOH216_STANDARD_DOSES.map((dose) => {
    const schedDate = new Date(dob.getTime() + dose.targetAgeWeeks * 7 * DAY_MS);
    const scheduledDateStr = toDateOnly(schedDate);
    
    // Normalize matching key
    const normalKey = dose.antigen.trim().toLowerCase();
    const adminRecord = administeredMap.get(normalKey) 
      || administeredMap.get(normalKey.replace(/\s+/g, ''))
      || administeredMap.get(normalKey.replace('-', ''));

    const status = deriveImmunizationStatus(scheduledDateStr, adminRecord?.givenDate, asOf);

    const schedTime = new Date(scheduledDateStr).getTime();
    const asOfTime = new Date(toDateOnly(asOf)).getTime();
    const daysDifference = Math.round((schedTime - asOfTime) / DAY_MS);

    return {
      antigen: dose.antigen,
      targetAgeWeeks: dose.targetAgeWeeks,
      scheduledDate: scheduledDateStr,
      status,
      givenDate: adminRecord?.givenDate || null,
      batchNumber: adminRecord?.batchNumber,
      daysDifference,
    };
  });
}

// Re-export WHO Growth Standard utilities from dedicated engine
export {
  calculateZScore,
  interpretZScore,
  calculateValueForZScore,
  generateGrowthCurveBands,
  type ZScoreInterpretation,
  type GrowthCurveBandPoint,
} from './whoGrowthStandards';

