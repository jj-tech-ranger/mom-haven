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
  interpretZScore,
  calculateValueForZScore,
  generateGrowthCurveBands,
  type ZScoreInterpretation,
  type GrowthCurveBandPoint,
} from './whoGrowthStandards';

import {
  WHO_WEIGHT_FOR_AGE_BOYS,
  WHO_WEIGHT_FOR_AGE_GIRLS,
  WHO_LENGTH_FOR_AGE_BOYS,
  WHO_LENGTH_FOR_AGE_GIRLS,
  LmsEntry,
} from '../data/whoGrowthData';
import { calculateZScore as calculateZScoreStandard } from './whoGrowthStandards';

/**
 * Reversible LMS calculation for exact percentile/z-score curves
 */
export function calculateMeasurementForZ(
  z: number,
  month: number,
  table: LmsEntry[]
): number {
  const entry = table.find((e) => e.month === month) || table[0];
  const { l, m, s } = entry;
  if (Math.abs(l) < 0.0001) {
    return m * Math.exp(s * z);
  }
  return m * Math.pow(1 + l * s * z, 1 / l);
}

/**
 * Polymorphic Z-Score calculator supporting both table-based and metric-based calls
 */
export function calculateZScore(
  valOrY: number,
  monthOrAge: number,
  tableOrSex: LmsEntry[] | 'male' | 'female',
  metric?: 'wfa' | 'lhfa'
): number {
  if (Array.isArray(tableOrSex)) {
    const table = tableOrSex;
    const entry = table.find((e) => e.month === monthOrAge) || table[0];
    const { l, m, s } = entry;
    if (Math.abs(l) < 0.0001) {
      return Math.log(valOrY / m) / s;
    }
    return (Math.pow(valOrY / m, l) - 1) / (l * s);
  }
  return calculateZScoreStandard(valOrY, monthOrAge, tableOrSex, metric || 'wfa');
}

export interface GrowthZResult {
  zScore: number;
  zScoreRounded: number;
  classification: string;
  isFlagged: boolean;
  alertLevel: 'none' | 'warning' | 'severe';
}

export function calculateWeightForAgeZScore(
  weightKg: number,
  ageMonths: number,
  sex: 'male' | 'female'
): GrowthZResult {
  const table = sex === 'male' ? WHO_WEIGHT_FOR_AGE_BOYS : WHO_WEIGHT_FOR_AGE_GIRLS;
  const z = calculateZScore(weightKg, Math.round(ageMonths), table);
  const zScoreRounded = Math.round(z * 100) / 100;

  let classification = 'normal';
  let isFlagged = false;
  let alertLevel: 'none' | 'warning' | 'severe' = 'none';

  if (z < -3.0) {
    classification = 'severely_underweight';
    isFlagged = true;
    alertLevel = 'severe';
  } else if (z < -2.0) {
    classification = 'underweight';
    isFlagged = true;
    alertLevel = 'warning';
  } else if (z > 3.0) {
    classification = 'severely_overweight';
    isFlagged = true;
    alertLevel = 'severe';
  } else if (z > 2.0) {
    classification = 'overweight';
    isFlagged = true;
    alertLevel = 'warning';
  }

  return {
    zScore: z,
    zScoreRounded,
    classification,
    isFlagged,
    alertLevel,
  };
}

export function calculateLengthForAgeZScore(
  lengthCm: number,
  ageMonths: number,
  sex: 'male' | 'female'
): GrowthZResult {
  const table = sex === 'male' ? WHO_LENGTH_FOR_AGE_BOYS : WHO_LENGTH_FOR_AGE_GIRLS;
  const z = calculateZScore(lengthCm, Math.round(ageMonths), table);
  const zScoreRounded = Math.round(z * 100) / 100;

  let classification = 'normal';
  let isFlagged = false;
  let alertLevel: 'none' | 'warning' | 'severe' = 'none';

  if (z < -3.0) {
    classification = 'severely_stunted';
    isFlagged = true;
    alertLevel = 'severe';
  } else if (z < -2.0) {
    classification = 'stunted';
    isFlagged = true;
    alertLevel = 'warning';
  } else if (z > 3.0) {
    classification = 'very_tall';
    isFlagged = false;
    alertLevel = 'none';
  } else if (z > 2.0) {
    classification = 'tall';
    isFlagged = false;
    alertLevel = 'none';
  }

  return {
    zScore: z,
    zScoreRounded,
    classification,
    isFlagged,
    alertLevel,
  };
}

export interface MOH216ImmunizationScheduleItem {
  vaccineId: string;
  vaccineName: string;
  dose: string;
  targetAgeBracket: string;
  targetAgeWeeks: number;
  scheduledDate: string;
  status: 'given' | 'due' | 'overdue' | 'scheduled';
  dateGiven?: string | null;
}

export const MOH216_VACCINES: Array<{
  vaccineId: string;
  vaccineName: string;
  dose: string;
  targetAgeBracket: string;
  targetAgeWeeks: number;
}> = [
  { vaccineId: 'bcg', vaccineName: 'BCG', dose: 'Birth', targetAgeBracket: 'At Birth', targetAgeWeeks: 0 },
  { vaccineId: 'opv-0', vaccineName: 'OPV', dose: 'Birth', targetAgeBracket: 'At Birth', targetAgeWeeks: 0 },
  { vaccineId: 'opv-1', vaccineName: 'OPV', dose: 'Dose 1', targetAgeBracket: '6 Weeks', targetAgeWeeks: 6 },
  { vaccineId: 'penta-1', vaccineName: 'DPT-HepB-Hib (Pentavalent)', dose: 'Dose 1', targetAgeBracket: '6 Weeks', targetAgeWeeks: 6 },
  { vaccineId: 'pcv-1', vaccineName: 'PCV (Pneumococcal)', dose: 'Dose 1', targetAgeBracket: '6 Weeks', targetAgeWeeks: 6 },
  { vaccineId: 'rota-1', vaccineName: 'Rotavirus', dose: 'Dose 1', targetAgeBracket: '6 Weeks', targetAgeWeeks: 6 },
  { vaccineId: 'opv-2', vaccineName: 'OPV', dose: 'Dose 2', targetAgeBracket: '10 Weeks', targetAgeWeeks: 10 },
  { vaccineId: 'penta-2', vaccineName: 'DPT-HepB-Hib (Pentavalent)', dose: 'Dose 2', targetAgeBracket: '10 Weeks', targetAgeWeeks: 10 },
  { vaccineId: 'pcv-2', vaccineName: 'PCV (Pneumococcal)', dose: 'Dose 2', targetAgeBracket: '10 Weeks', targetAgeWeeks: 10 },
  { vaccineId: 'rota-2', vaccineName: 'Rotavirus', dose: 'Dose 2', targetAgeBracket: '10 Weeks', targetAgeWeeks: 10 },
  { vaccineId: 'opv-3', vaccineName: 'OPV', dose: 'Dose 3', targetAgeBracket: '14 Weeks', targetAgeWeeks: 14 },
  { vaccineId: 'penta-3', vaccineName: 'DPT-HepB-Hib (Pentavalent)', dose: 'Dose 3', targetAgeBracket: '14 Weeks', targetAgeWeeks: 14 },
  { vaccineId: 'pcv-3', vaccineName: 'PCV (Pneumococcal)', dose: 'Dose 3', targetAgeBracket: '14 Weeks', targetAgeWeeks: 14 },
  { vaccineId: 'ipv', vaccineName: 'IPV (Inactivated Polio)', dose: 'Dose 1', targetAgeBracket: '14 Weeks', targetAgeWeeks: 14 },
  { vaccineId: 'mr-6mo', vaccineName: 'Measles-Rubella (Special)', dose: '6 Months', targetAgeBracket: '6 Months', targetAgeWeeks: 26 },
  { vaccineId: 'mr-9mo', vaccineName: 'Measles-Rubella', dose: 'Dose 1', targetAgeBracket: '9 Months', targetAgeWeeks: 39 },
  { vaccineId: 'yellow-fever', vaccineName: 'Yellow Fever', dose: 'Dose 1', targetAgeBracket: '9 Months', targetAgeWeeks: 39 },
  { vaccineId: 'mr-18mo', vaccineName: 'Measles-Rubella', dose: 'Dose 2', targetAgeBracket: '18 Months', targetAgeWeeks: 78 },
];

export function computeMOH216ImmunizationSchedule(
  birthDate: string,
  administered: Array<{
    vaccineId?: string;
    vaccineName?: string;
    antigen?: string;
    dose?: string;
    dateAdministered?: string | null;
    dateGiven?: string | null;
    givenDate?: string | null;
    status?: string;
  }> = [],
  asOf: Date = new Date()
): MOH216ImmunizationScheduleItem[] {
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) {
    throw new Error('Invalid birth date');
  }

  const asOfDateOnly = new Date(toDateOnly(asOf));

  return MOH216_VACCINES.map((v) => {
    const schedTime = dob.getTime() + v.targetAgeWeeks * 7 * DAY_MS;
    const scheduledDate = toDateOnly(new Date(schedTime));
    const schedDateOnly = new Date(scheduledDate);

    // Matching logic for administered
    const match = administered.find((a) => {
      if (a.vaccineId && a.vaccineId.toLowerCase() === v.vaccineId.toLowerCase()) return true;
      const vName = (a.vaccineName || a.antigen || '').toLowerCase();
      if (!vName) return false;

      if (v.vaccineId === 'bcg' && vName.includes('bcg')) return true;
      if (v.vaccineId === 'ipv' && vName.includes('ipv')) return true;
      if (v.vaccineId === 'yellow-fever' && vName.includes('yellow')) return true;

      // Match OPV doses
      if (vName.includes('opv') || vName.includes('polio')) {
        if (v.vaccineId === 'opv-0' && (a.dose === 'Birth' || a.dose === '0' || a.dose === 'Dose 0' || vName.includes('0'))) return true;
        if (v.vaccineId === 'opv-1' && (a.dose === 'Dose 1' || a.dose === '1' || vName.includes('1'))) return true;
        if (v.vaccineId === 'opv-2' && (a.dose === 'Dose 2' || a.dose === '2' || vName.includes('2'))) return true;
        if (v.vaccineId === 'opv-3' && (a.dose === 'Dose 3' || a.dose === '3' || vName.includes('3'))) return true;
      }

      // Match Penta
      if (vName.includes('penta') || vName.includes('dpt')) {
        if (v.vaccineId === 'penta-1' && (a.dose === 'Dose 1' || a.dose === '1' || vName.includes('1'))) return true;
        if (v.vaccineId === 'penta-2' && (a.dose === 'Dose 2' || a.dose === '2' || vName.includes('2'))) return true;
        if (v.vaccineId === 'penta-3' && (a.dose === 'Dose 3' || a.dose === '3' || vName.includes('3'))) return true;
      }

      // Match PCV
      if (vName.includes('pcv')) {
        if (v.vaccineId === 'pcv-1' && (a.dose === 'Dose 1' || a.dose === '1' || vName.includes('1'))) return true;
        if (v.vaccineId === 'pcv-2' && (a.dose === 'Dose 2' || a.dose === '2' || vName.includes('2'))) return true;
        if (v.vaccineId === 'pcv-3' && (a.dose === 'Dose 3' || a.dose === '3' || vName.includes('3'))) return true;
      }

      // Match Rota
      if (vName.includes('rota')) {
        if (v.vaccineId === 'rota-1' && (a.dose === 'Dose 1' || a.dose === '1' || vName.includes('1'))) return true;
        if (v.vaccineId === 'rota-2' && (a.dose === 'Dose 2' || a.dose === '2' || vName.includes('2'))) return true;
      }

      // Match MR
      if (vName.includes('mr') || vName.includes('measles')) {
        if (v.vaccineId === 'mr-6mo' && (a.dose === '6 Months' || vName.includes('6'))) return true;
        if (v.vaccineId === 'mr-9mo' && (a.dose === 'Dose 1' || a.dose === '1' || vName.includes('9'))) return true;
        if (v.vaccineId === 'mr-18mo' && (a.dose === 'Dose 2' || a.dose === '2' || vName.includes('18'))) return true;
      }

      return false;
    });

    const isGiven = match && (match.status === 'given' || match.status === 'GIVEN' || !!match.dateAdministered || !!match.dateGiven || !!match.givenDate);

    if (isGiven) {
      return {
        ...v,
        scheduledDate,
        status: 'given',
        dateGiven: match.dateAdministered || match.dateGiven || match.givenDate || toDateOnly(asOf),
      };
    }

    const diffDays = Math.round((asOfDateOnly.getTime() - schedDateOnly.getTime()) / DAY_MS);

    let status: 'given' | 'due' | 'overdue' | 'scheduled';
    if (diffDays < 0) {
      status = 'scheduled';
    } else if (diffDays <= 14) {
      status = 'due';
    } else {
      status = 'overdue';
    }

    return {
      ...v,
      scheduledDate,
      status,
      dateGiven: null,
    };
  });
}

export interface GeneratedReminderItem {
  id?: string;
  userId: string;
  category: 'anc' | 'immunization' | 'pnc' | 'supplement' | 'action';
  title: string;
  description?: string;
  dueDate: string;
  sharedWithPartner?: boolean;
  pushEligible?: boolean;
  completed?: boolean;
  sourceEventId?: string;
}

export function generateNextReminders(params: {
  motherId: string;
  pregnancy?: { id: string; status?: string; lmp?: string; edd?: string } | null;
  ancEncounters?: Array<{ id: string; visitNumber?: number; date?: string; nextAppointmentDate?: string; nextVisitDate?: string }>;
  children?: Array<{ id: string; name?: string; dateOfBirth: string; sex?: string }>;
  childRecords?: Record<string, any>;
  asOf?: Date;
}): GeneratedReminderItem[] {
  const reminders: GeneratedReminderItem[] = [];
  const asOf = params.asOf || new Date();

  // 1. ANC appointment from clinical encounter
  if (params.ancEncounters && params.ancEncounters.length > 0) {
    for (const enc of params.ancEncounters) {
      const targetDate = enc.nextAppointmentDate || enc.nextVisitDate;
      if (targetDate) {
        reminders.push({
          id: `anc_${enc.id}`,
          userId: params.motherId,
          category: 'anc',
          title: 'Upcoming ANC Visit',
          description: 'Scheduled antenatal care visit with your healthcare provider.',
          dueDate: targetDate,
          sharedWithPartner: true,
          pushEligible: true,
          completed: false,
          sourceEventId: `anc_enc_${enc.id}`,
        });
      }
    }
  }

  // 2. Child immunizations & growth monitoring
  if (params.children && params.children.length > 0) {
    for (const child of params.children) {
      const schedule = computeMOH216ImmunizationSchedule(child.dateOfBirth, [], asOf);
      const nextVac = schedule.find((s) => s.status === 'due' || s.status === 'overdue') || schedule.find((s) => s.status === 'scheduled');
      if (nextVac) {
        reminders.push({
          id: `imm_${child.id}_${nextVac.vaccineId}`,
          userId: params.motherId,
          category: 'immunization',
          title: `${child.name || 'Child'}'s Immunization: ${nextVac.vaccineName} (${nextVac.dose})`,
          description: `Scheduled ${nextVac.vaccineName} immunization.`,
          dueDate: nextVac.scheduledDate,
          sharedWithPartner: true,
          pushEligible: true,
          completed: false,
          sourceEventId: `kepi_${child.id}_${nextVac.vaccineId}`,
        });
      }

      reminders.push({
        id: `growth_${child.id}`,
        userId: params.motherId,
        category: 'pnc',
        title: `${child.name || 'Child'}'s Monthly Growth Monitoring`,
        description: `Track your child's weight, length, and nutritional development.`,
        dueDate: toDateOnly(asOf),
        sharedWithPartner: true,
        pushEligible: true,
        completed: false,
        sourceEventId: `growth_monthly_${child.id}`,
      });
    }
  }

  return reminders;
}


