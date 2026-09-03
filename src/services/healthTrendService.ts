import { DailyHealthLog, HealthLogType, BloodPressureValues, WeightValues, SleepValues, BabyMovementValues, SymptomsValues } from '../types/healthLog';

export type TrendStatus = 'empty' | 'sparse' | 'sufficient';

export interface BaseTrendSummary {
  type: HealthLogType;
  status: TrendStatus;
  timeframeDays: number;
  totalEntries: number;
  message: string;
}

export interface BloodPressureTrendSummary extends BaseTrendSummary {
  type: 'blood_pressure';
  latest?: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    date: string;
  };
  averageSystolic?: number;
  averageDiastolic?: number;
  systolicRange?: [number, number];
  diastolicRange?: [number, number];
  elevatedCount?: number;
  severeCount?: number;
  hasSevereElevation?: boolean;
}

export interface WeightTrendSummary extends BaseTrendSummary {
  type: 'weight';
  latest?: {
    weightKg: number;
    date: string;
  };
  earliest?: {
    weightKg: number;
    date: string;
  };
  deltaKg?: number;
  minWeight?: number;
  maxWeight?: number;
  averageWeight?: number;
}

export interface SleepTrendSummary extends BaseTrendSummary {
  type: 'sleep';
  averageHours?: number;
  restedPercentage?: number;
  poorPercentage?: number;
  minHours?: number;
  maxHours?: number;
}

export interface BabyMovementTrendSummary extends BaseTrendSummary {
  type: 'baby_movement';
  normalActiveCount?: number;
  decreasedCount?: number;
  hasDecreasedAlert?: boolean;
  totalKickCountLogged?: number;
}

export interface SymptomsTrendSummary extends BaseTrendSummary {
  type: 'symptoms';
  frequentSymptoms?: { symptom: string; count: number }[];
  dangerSignsEncountered?: string[];
  hasRecentDangerSign?: boolean;
}

/**
 * Filter logs to a given timeframe in days from today
 */
export function filterLogsByTimeframe(logs: DailyHealthLog[], timeframeDays: number = 14): DailyHealthLog[] {
  const cutoffTime = Date.now() - timeframeDays * 24 * 60 * 60 * 1000;
  return logs
    .filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      return !isNaN(logTime) && logTime >= cutoffTime;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Minimum entries required to identify patterns or calculate averages without misleading.
 * As explicitly required: Avoid misleading conclusions from sparse data (e.g. 1 or 2 arbitrary readings).
 */
export const MIN_DATA_POINTS_FOR_TREND = 3;

/**
 * Analyzes Blood Pressure entries over a specific timeframe
 */
export function analyzeBloodPressureTrends(
  logs: DailyHealthLog[],
  timeframeDays: number = 14,
): BloodPressureTrendSummary {
  const bpLogs = filterLogsByTimeframe(
    logs.filter((l) => l.type === 'blood_pressure'),
    timeframeDays,
  );

  const count = bpLogs.length;

  if (count === 0) {
    return {
      type: 'blood_pressure',
      status: 'empty',
      timeframeDays,
      totalEntries: 0,
      message: `No blood pressure entries recorded over the last ${timeframeDays} days.`,
    };
  }

  if (count < MIN_DATA_POINTS_FOR_TREND) {
    const latest = bpLogs[count - 1];
    const vals = latest.values as BloodPressureValues;
    return {
      type: 'blood_pressure',
      status: 'sparse',
      timeframeDays,
      totalEntries: count,
      latest: {
        systolic: vals.systolic,
        diastolic: vals.diastolic,
        pulse: vals.pulse,
        date: latest.timestamp,
      },
      message: `${count} reading${count > 1 ? 's' : ''} recorded over the last ${timeframeDays} days. At least ${MIN_DATA_POINTS_FOR_TREND} readings are recommended to observe patterns.`,
    };
  }

  // Sufficient data (>= 3 points)
  let sumSys = 0;
  let sumDia = 0;
  let minSys = Infinity;
  let maxSys = -Infinity;
  let minDia = Infinity;
  let maxDia = -Infinity;
  let elevatedCount = 0;
  let severeCount = 0;

  for (const log of bpLogs) {
    const vals = log.values as BloodPressureValues;
    sumSys += vals.systolic;
    sumDia += vals.diastolic;
    if (vals.systolic < minSys) minSys = vals.systolic;
    if (vals.systolic > maxSys) maxSys = vals.systolic;
    if (vals.diastolic < minDia) minDia = vals.diastolic;
    if (vals.diastolic > maxDia) maxDia = vals.diastolic;

    if (vals.systolic >= 160 || vals.diastolic >= 110) {
      severeCount++;
    } else if (vals.systolic >= 140 || vals.diastolic >= 90) {
      elevatedCount++;
    }
  }

  const avgSys = Math.round(sumSys / count);
  const avgDia = Math.round(sumDia / count);
  const latestLog = bpLogs[count - 1];
  const latestVals = latestLog.values as BloodPressureValues;

  let message = `${count} blood pressure readings recorded over the last ${timeframeDays} days. Average: ${avgSys}/${avgDia} mmHg (Range: ${minSys}/${minDia} to ${maxSys}/${maxDia} mmHg).`;

  if (severeCount > 0) {
    message += ` Note: ${severeCount} reading${severeCount > 1 ? 's were' : ' was'} in the severely elevated range (≥160/110 mmHg). Please follow up with your maternity clinic.`;
  } else if (elevatedCount > 0) {
    message += ` Note: ${elevatedCount} reading${elevatedCount > 1 ? 's were' : ' was'} above standard threshold (≥140/90 mmHg).`;
  } else {
    message += ' All readings in this period were within standard expected limits (<140/90 mmHg).';
  }

  return {
    type: 'blood_pressure',
    status: 'sufficient',
    timeframeDays,
    totalEntries: count,
    latest: {
      systolic: latestVals.systolic,
      diastolic: latestVals.diastolic,
      pulse: latestVals.pulse,
      date: latestLog.timestamp,
    },
    averageSystolic: avgSys,
    averageDiastolic: avgDia,
    systolicRange: [minSys, maxSys],
    diastolicRange: [minDia, maxDia],
    elevatedCount,
    severeCount,
    hasSevereElevation: severeCount > 0,
    message,
  };
}

/**
 * Analyzes Weight trends
 */
export function analyzeWeightTrends(
  logs: DailyHealthLog[],
  timeframeDays: number = 30,
): WeightTrendSummary {
  const weightLogs = filterLogsByTimeframe(
    logs.filter((l) => l.type === 'weight'),
    timeframeDays,
  );

  const count = weightLogs.length;

  if (count === 0) {
    return {
      type: 'weight',
      status: 'empty',
      timeframeDays,
      totalEntries: 0,
      message: `No weight measurements recorded over the last ${timeframeDays} days.`,
    };
  }

  if (count < MIN_DATA_POINTS_FOR_TREND) {
    const latest = weightLogs[count - 1];
    const vals = latest.values as WeightValues;
    return {
      type: 'weight',
      status: 'sparse',
      timeframeDays,
      totalEntries: count,
      latest: {
        weightKg: vals.weightKg,
        date: latest.timestamp,
      },
      message: `${count} weight reading${count > 1 ? 's' : ''} recorded over the last ${timeframeDays} days.`,
    };
  }

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const log of weightLogs) {
    const w = (log.values as WeightValues).weightKg;
    sum += w;
    if (w < min) min = w;
    if (w > max) max = w;
  }

  const earliest = weightLogs[0];
  const latest = weightLogs[count - 1];
  const earliestWeight = (earliest.values as WeightValues).weightKg;
  const latestWeight = (latest.values as WeightValues).weightKg;
  const deltaKg = Number((latestWeight - earliestWeight).toFixed(1));

  const changeText = deltaKg > 0 ? `+${deltaKg} kg` : `${deltaKg} kg`;
  const message = `${count} weight entries over the last ${timeframeDays} days. Most recent: ${latestWeight} kg (Change: ${changeText}).`;

  return {
    type: 'weight',
    status: 'sufficient',
    timeframeDays,
    totalEntries: count,
    latest: {
      weightKg: latestWeight,
      date: latest.timestamp,
    },
    earliest: {
      weightKg: earliestWeight,
      date: earliest.timestamp,
    },
    deltaKg,
    minWeight: min,
    maxWeight: max,
    averageWeight: Number((sum / count).toFixed(1)),
    message,
  };
}

/**
 * Analyzes Sleep trends
 */
export function analyzeSleepTrends(
  logs: DailyHealthLog[],
  timeframeDays: number = 14,
): SleepTrendSummary {
  const sleepLogs = filterLogsByTimeframe(
    logs.filter((l) => l.type === 'sleep'),
    timeframeDays,
  );

  const count = sleepLogs.length;

  if (count === 0) {
    return {
      type: 'sleep',
      status: 'empty',
      timeframeDays,
      totalEntries: 0,
      message: `No sleep logs recorded over the last ${timeframeDays} days.`,
    };
  }

  if (count < MIN_DATA_POINTS_FOR_TREND) {
    return {
      type: 'sleep',
      status: 'sparse',
      timeframeDays,
      totalEntries: count,
      message: `${count} sleep log${count > 1 ? 's' : ''} recorded over the last ${timeframeDays} days.`,
    };
  }

  let totalHours = 0;
  let restedCount = 0;
  let poorCount = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const log of sleepLogs) {
    const vals = log.values as SleepValues;
    totalHours += vals.hours;
    if (vals.hours < min) min = vals.hours;
    if (vals.hours > max) max = vals.hours;
    if (vals.quality === 'rested') restedCount++;
    if (vals.quality === 'poor') poorCount++;
  }

  const avgHours = Number((totalHours / count).toFixed(1));
  const restedPct = Math.round((restedCount / count) * 100);
  const poorPct = Math.round((poorCount / count) * 100);

  const message = `${count} sleep logs over the last ${timeframeDays} days. Average: ${avgHours} hours/night. ${restedPct}% logged as restful.`;

  return {
    type: 'sleep',
    status: 'sufficient',
    timeframeDays,
    totalEntries: count,
    averageHours: avgHours,
    restedPercentage: restedPct,
    poorPercentage: poorPct,
    minHours: min,
    maxHours: max,
    message,
  };
}

/**
 * Analyzes Baby Movements
 */
export function analyzeBabyMovementTrends(
  logs: DailyHealthLog[],
  timeframeDays: number = 14,
): BabyMovementTrendSummary {
  const movementLogs = filterLogsByTimeframe(
    logs.filter((l) => l.type === 'baby_movement'),
    timeframeDays,
  );

  const count = movementLogs.length;

  if (count === 0) {
    return {
      type: 'baby_movement',
      status: 'empty',
      timeframeDays,
      totalEntries: 0,
      message: `No baby movement logs recorded over the last ${timeframeDays} days.`,
    };
  }

  let normalActive = 0;
  let decreased = 0;
  let totalKicks = 0;

  for (const log of movementLogs) {
    const vals = log.values as BabyMovementValues;
    if (vals.pattern === 'normal' || vals.pattern === 'active') normalActive++;
    if (vals.pattern === 'decreased' || vals.pattern === 'none_felt') decreased++;
    if (vals.movementCount) totalKicks += vals.movementCount;
  }

  const hasDecreasedAlert = decreased > 0;
  const message = hasDecreasedAlert
    ? `Caution: ${decreased} session${decreased > 1 ? 's' : ''} reported decreased movements. Prompt maternity evaluation is advised if movements remain low.`
    : `${count} baby movement session${count > 1 ? 's' : ''} recorded. Active/regular patterns reported.`;

  return {
    type: 'baby_movement',
    status: count < MIN_DATA_POINTS_FOR_TREND ? 'sparse' : 'sufficient',
    timeframeDays,
    totalEntries: count,
    normalActiveCount: normalActive,
    decreasedCount: decreased,
    hasDecreasedAlert,
    totalKickCountLogged: totalKicks,
    message,
  };
}

/**
 * Analyzes Symptoms Logs
 */
export function analyzeSymptomsTrends(
  logs: DailyHealthLog[],
  timeframeDays: number = 14,
): SymptomsTrendSummary {
  const symptomLogs = filterLogsByTimeframe(
    logs.filter((l) => l.type === 'symptoms'),
    timeframeDays,
  );

  const count = symptomLogs.length;

  if (count === 0) {
    return {
      type: 'symptoms',
      status: 'empty',
      timeframeDays,
      totalEntries: 0,
      message: `No symptoms recorded over the last ${timeframeDays} days.`,
    };
  }

  const freqMap = new Map<string, number>();
  const dangerSignsSet = new Set<string>();
  let hasRecentDanger = false;

  for (const log of symptomLogs) {
    const vals = log.values as SymptomsValues;
    if (vals.symptoms) {
      for (const s of vals.symptoms) {
        freqMap.set(s, (freqMap.get(s) || 0) + 1);
      }
    }
    if (vals.hasDangerSigns || (vals.dangerSigns && vals.dangerSigns.length > 0)) {
      hasRecentDanger = true;
      (vals.dangerSigns || []).forEach((d) => dangerSignsSet.add(d));
    }
  }

  const frequentSymptoms = Array.from(freqMap.entries())
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dangerSignsEncountered = Array.from(dangerSignsSet);

  const message = hasRecentDanger
    ? `Warning signs were noted in ${dangerSignsEncountered.length} category/categories during this period.`
    : `${count} symptom entry/entries recorded. No maternal danger signs detected.`;

  return {
    type: 'symptoms',
    status: count < MIN_DATA_POINTS_FOR_TREND ? 'sparse' : 'sufficient',
    timeframeDays,
    totalEntries: count,
    frequentSymptoms,
    dangerSignsEncountered,
    hasRecentDangerSign: hasRecentDanger,
    message,
  };
}

/**
 * CLINICIAN INTEGRATION PRODUCT RULES:
 * Explicit rules for which logs become part of clinician-facing summaries.
 * - Must be CLINICAL_MEASUREMENT (blood_pressure, weight, or symptoms with danger signs / severe grade)
 * - Excludes all private journals (mood, sleep, nutrition, activity, notes)
 * - Must be within a clinically relevant active window (default 30 days)
 * - Strictly labels all logs as USER_REPORTED (unverified patient home monitoring)
 */
export function filterClinicianSummaryLogs(
  logs: DailyHealthLog[],
  maxDays: number = 30,
): DailyHealthLog[] {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;

  return logs
    .filter((log) => {
      // 1. Must be a clinical measurement
      if (log.category !== 'CLINICAL_MEASUREMENT') {
        return false;
      }

      // 2. Must be within the active clinical window
      const time = new Date(log.timestamp).getTime();
      if (isNaN(time) || time < cutoff) {
        return false;
      }

      // 3. For symptoms, only include if severe or with danger signs
      if (log.type === 'symptoms') {
        const sym = log.values as SymptomsValues;
        return sym.hasDangerSigns || sym.severity === 'severe';
      }

      // 4. Clinical measurements like blood pressure, weight, baby movement are eligible
      return log.type === 'blood_pressure' || log.type === 'weight' || log.type === 'baby_movement';
    })
    .map((log) => ({
      ...log,
      source: 'USER_REPORTED' as const,
      provenance: {
        ...log.provenance,
        status: 'REPORTED' as const, // Never allow self-log to be presented as VERIFIED
      },
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export interface GenericHealthTrendResult {
  type: HealthLogType;
  status: TrendStatus;
  totalEntries: number;
  timeframeDays: number;
  summaryMessage: string;
  average?: {
    systolic?: number;
    diastolic?: number;
    weightKg?: number;
    hours?: number;
  };
  range?: {
    systolicMin?: number;
    systolicMax?: number;
    diastolicMin?: number;
    diastolicMax?: number;
  };
  delta?: {
    systolicDelta?: number;
    diastolicDelta?: number;
    weightDelta?: number;
  };
  details?: any;
}

/**
 * Unified health trend dispatcher across all health log categories
 */
export function analyzeHealthTrends(
  type: HealthLogType,
  logs: DailyHealthLog[],
  timeframeDays: number = 14,
): GenericHealthTrendResult {
  if (type === 'blood_pressure') {
    const res = analyzeBloodPressureTrends(logs, timeframeDays);
    const sortedBp = logs
      .filter((l) => l.type === 'blood_pressure')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const firstBp = sortedBp.length > 0 ? (sortedBp[0].values as BloodPressureValues) : null;
    const lastBp = sortedBp.length > 0 ? (sortedBp[sortedBp.length - 1].values as BloodPressureValues) : null;

    return {
      type,
      status: res.status,
      totalEntries: res.totalEntries,
      timeframeDays: res.timeframeDays,
      summaryMessage: res.message,
      average: res.averageSystolic !== undefined ? {
        systolic: res.averageSystolic,
        diastolic: res.averageDiastolic,
      } : undefined,
      range: res.systolicRange ? {
        systolicMin: res.systolicRange[0],
        systolicMax: res.systolicRange[1],
        diastolicMin: res.diastolicRange ? res.diastolicRange[0] : undefined,
        diastolicMax: res.diastolicRange ? res.diastolicRange[1] : undefined,
      } : undefined,
      delta: (firstBp && lastBp) ? {
        systolicDelta: lastBp.systolic - firstBp.systolic,
        diastolicDelta: lastBp.diastolic - firstBp.diastolic,
      } : undefined,
      details: res,
    };
  }

  if (type === 'weight') {
    const res = analyzeWeightTrends(logs, timeframeDays);
    return {
      type,
      status: res.status,
      totalEntries: res.totalEntries,
      timeframeDays: res.timeframeDays,
      summaryMessage: res.message,
      average: res.averageWeight ? { weightKg: res.averageWeight } : undefined,
      delta: res.deltaKg !== undefined ? { weightDelta: res.deltaKg } : undefined,
      details: res,
    };
  }

  if (type === 'sleep') {
    const res = analyzeSleepTrends(logs, timeframeDays);
    return {
      type,
      status: res.status,
      totalEntries: res.totalEntries,
      timeframeDays: res.timeframeDays,
      summaryMessage: res.message,
      average: res.averageHours ? { hours: res.averageHours } : undefined,
      details: res,
    };
  }

  if (type === 'baby_movement') {
    const res = analyzeBabyMovementTrends(logs, timeframeDays);
    return {
      type,
      status: res.status,
      totalEntries: res.totalEntries,
      timeframeDays: res.timeframeDays,
      summaryMessage: res.message,
      details: res,
    };
  }

  const res = analyzeSymptomsTrends(logs, timeframeDays);
  return {
    type,
    status: res.status,
    totalEntries: res.totalEntries,
    timeframeDays: res.timeframeDays,
    summaryMessage: res.message,
    details: res,
  };
}
