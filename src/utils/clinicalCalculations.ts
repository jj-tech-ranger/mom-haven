import { classifyMUAC } from './muac';

export type BpCategory = 'NORMAL' | 'HYPERTENSIVE_ALERT' | 'HYPOTENSIVE_ALERT';

export function calculateGestationalAgeWeeks(lmp: string | Date, asOf: string | Date = new Date()): number | null {
  const start = new Date(lmp).getTime();
  const end = new Date(asOf).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.floor((end - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export function calculatePregnancyProgress(gestationWeeks: number, termWeeks = 40): number {
  if (!Number.isFinite(gestationWeeks) || termWeeks <= 0) return 0;
  return Math.min(100, Math.max(0, (gestationWeeks / termWeeks) * 100));
}

export function evaluateBloodPressure(systolic: number, diastolic: number): BpCategory {
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) throw new Error('Blood pressure values must be finite numbers.');
  if (systolic >= 140 || diastolic >= 90) return 'HYPERTENSIVE_ALERT';
  if (systolic < 90 || diastolic < 60) return 'HYPOTENSIVE_ALERT';
  return 'NORMAL';
}

export function parseBloodPressure(value: string): { systolic: number; diastolic: number } | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  return Number.isFinite(systolic) && Number.isFinite(diastolic) ? { systolic, diastolic } : null;
}

export { classifyMUAC };
