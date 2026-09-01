import { PregnancyDoc } from '../types';
import { calculateGestationalAgeWeeks, calculatePregnancyProgress } from './clinicalCalculations';

export function getActivePregnancy(pregnancy: PregnancyDoc | null): PregnancyDoc | null {
  return pregnancy?.status === 'active' ? pregnancy : null;
}

export function getCurrentGestationWeeks(pregnancy: PregnancyDoc | null, asOf: string | Date = new Date()): number | null {
  if (!pregnancy?.lmp) return pregnancy?.gestationalAgeWeeks ?? null;
  return calculateGestationalAgeWeeks(pregnancy.lmp, asOf);
}

export function getPregnancyProgress(pregnancy: PregnancyDoc | null, asOf: string | Date = new Date()): number {
  const week = getCurrentGestationWeeks(pregnancy, asOf);
  return week == null ? 0 : calculatePregnancyProgress(week);
}
