// server/services/aggregateInsightService.ts
import cron from 'node-cron';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../clinicianAccess.js';

export interface AggregateInsightBucketRecord {
  id: string;
  cohortId: string; // e.g. 'trimester_1' | 'trimester_2' | 'trimester_3' | 'postnatal'
  lifecycleStage: 'pregnancy' | 'postnatal';
  trimester: 'trimester_1' | 'trimester_2' | 'trimester_3' | null;
  cohortSize: number; // Mandatory >= 50 distinct users floor (k-anonymity)
  roundedPercentage: number;
  statDescription: string;
  summaryText: string;
  period: string;
  updatedAt: any;
}

export interface ProcessAggregateInsightsResult {
  periodStart: string;
  periodEnd: string;
  bucketsEvaluated: number;
  bucketsWritten: number;
  suppressedBucketsCount: number;
  buckets: AggregateInsightBucketRecord[];
}

export interface ProcessAggregateInsightsOptions {
  periodEnd?: Date;
  periodStart?: Date;
}

/**
 * Minimum distinct user cohort floor per docs/aggregate-insights-plan.md.
 * Absolutely mandatory: no stat may be generated or surfaced if cohortSize < 50.
 */
export const K_ANONYMITY_THRESHOLD = 50;

function getTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Timestamp) return val.toMillis();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = new Date(val).getTime();
    if (!isNaN(parsed)) return parsed;
    const dateOnly = new Date(`${val}T12:00:00Z`).getTime();
    return isNaN(dateOnly) ? 0 : dateOnly;
  }
  return 0;
}

/**
 * Computes k-anonymized aggregate peer insight statistics for mothers.
 * Strictly adheres to k >= 50 threshold: if fewer than 50 distinct users exist in the
 * bucket for the trailing 7 days, NO record is written (silent fallback).
 * Buckets strictly by lifecycleStage + trimester only (no county axis to prevent re-identification).
 * Writes only rounded percentage and cohortSize, never raw logs.
 */
export async function processAggregateInsights(
  options: ProcessAggregateInsightsOptions = {}
): Promise<ProcessAggregateInsightsResult> {
  const periodEnd = options.periodEnd || new Date();
  const periodStart = options.periodStart || new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const periodStartStr = periodStart.toISOString();
  const periodEndStr = periodEnd.toISOString();
  const dateRangeStr = `${periodStartStr.slice(0, 10)} to ${periodEndStr.slice(0, 10)}`;

  const result: ProcessAggregateInsightsResult = {
    periodStart: periodStartStr,
    periodEnd: periodEndStr,
    bucketsEvaluated: 0,
    bucketsWritten: 0,
    suppressedBucketsCount: 0,
    buckets: [],
  };

  try {
    const isWithinTrailing7Days = (dateVal: any): boolean => {
      const ms = getTimestampMs(dateVal);
      return ms >= startMs && ms <= endMs;
    };

    // Parallel fetch of health logs, pregnancies, and children
    const [healthLogsGroupSnap, rootHealthLogsSnap, pregnanciesSnap, childrenSnap] = await Promise.all([
      adminDb.collectionGroup('dailyHealthLogs').limit(10000).get().catch(() => ({ docs: [] } as any)),
      adminDb.collection('dailyHealthLogs').limit(10000).get().catch(() => ({ docs: [] } as any)),
      adminDb.collection('pregnancies').limit(5000).get().catch(() => ({ docs: [] } as any)),
      adminDb.collection('children').limit(5000).get().catch(() => ({ docs: [] } as any)),
    ]);

    // Build user -> lifecycleStage & trimester mapping
    interface UserCohortInfo {
      lifecycleStage: 'pregnancy' | 'postnatal';
      trimester: 'trimester_1' | 'trimester_2' | 'trimester_3' | null;
    }

    const userCohortMap = new Map<string, UserCohortInfo>();

    // 1. Map mothers with active pregnancies
    for (const doc of pregnanciesSnap.docs) {
      const data = doc.data();
      const motherId = data?.motherId;
      if (!motherId) continue;

      const status = String(data?.status || 'active').toLowerCase().trim();
      if (status === 'completed' || status === 'archived') continue;

      let weeks = data?.gestationalAgeWeeks;
      if (weeks == null && data?.lmp) {
        const ms = Date.now() - new Date(data.lmp).getTime();
        if (!isNaN(ms) && ms > 0) {
          weeks = Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
        }
      }

      let trimester: 'trimester_1' | 'trimester_2' | 'trimester_3' = 'trimester_2';
      if (typeof weeks === 'number' && weeks > 0) {
        if (weeks <= 13) {
          trimester = 'trimester_1';
        } else if (weeks <= 27) {
          trimester = 'trimester_2';
        } else {
          trimester = 'trimester_3';
        }
      }

      userCohortMap.set(motherId, {
        lifecycleStage: 'pregnancy',
        trimester,
      });
    }

    // 2. Map mothers with children (postnatal) if not already active in pregnancy
    for (const doc of childrenSnap.docs) {
      const data = doc.data();
      const motherId = data?.motherId;
      if (motherId && !userCohortMap.has(motherId)) {
        userCohortMap.set(motherId, {
          lifecycleStage: 'postnatal',
          trimester: null,
        });
      }
    }

    // Deduplicate daily health logs
    const allHealthLogs = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const d of healthLogsGroupSnap.docs || []) allHealthLogs.set(d.id, d);
    for (const d of rootHealthLogsSnap.docs || []) allHealthLogs.set(d.id, d);

    // Trailing 7 days logs
    const recentLogs = Array.from(allHealthLogs.values()).filter((d) => {
      const data = d.data();
      return (
        isWithinTrailing7Days(data?.timestamp) ||
        isWithinTrailing7Days(data?.createdAt) ||
        isWithinTrailing7Days(data?.firestoreCreatedAt)
      );
    });

    // Bucketing structure:
    // Defined coarse cohorts: 'trimester_1', 'trimester_2', 'trimester_3', 'postnatal'
    interface BucketAccumulator {
      cohortId: string;
      lifecycleStage: 'pregnancy' | 'postnatal';
      trimester: 'trimester_1' | 'trimester_2' | 'trimester_3' | null;
      label: string;
      distinctUsers: Set<string>;
      usersWithCommonStat: Set<string>;
    }

    const buckets: Record<string, BucketAccumulator> = {
      trimester_1: {
        cohortId: 'trimester_1',
        lifecycleStage: 'pregnancy',
        trimester: 'trimester_1',
        label: '1st Trimester',
        distinctUsers: new Set<string>(),
        usersWithCommonStat: new Set<string>(),
      },
      trimester_2: {
        cohortId: 'trimester_2',
        lifecycleStage: 'pregnancy',
        trimester: 'trimester_2',
        label: '2nd Trimester',
        distinctUsers: new Set<string>(),
        usersWithCommonStat: new Set<string>(),
      },
      trimester_3: {
        cohortId: 'trimester_3',
        lifecycleStage: 'pregnancy',
        trimester: 'trimester_3',
        label: '3rd Trimester',
        distinctUsers: new Set<string>(),
        usersWithCommonStat: new Set<string>(),
      },
      postnatal: {
        cohortId: 'postnatal',
        lifecycleStage: 'postnatal',
        trimester: null,
        label: 'Postnatal & Early Infancy',
        distinctUsers: new Set<string>(),
        usersWithCommonStat: new Set<string>(),
      },
    };

    // Helper to evaluate if log indicates fatigue or low energy (common non-red-flag adaptation)
    const indicatesFatigueOrTired = (data: any): boolean => {
      const values = data?.values || {};
      const symptomsList: string[] = Array.isArray(values.symptoms)
        ? values.symptoms.map((s: any) => String(s).toLowerCase())
        : [];
      if (Array.isArray(data?.symptoms)) {
        symptomsList.push(...data.symptoms.map((s: any) => String(s).toLowerCase()));
      }

      if (
        symptomsList.some(
          (s) => s.includes('fatigue') || s.includes('tired') || s.includes('exhaust')
        )
      ) {
        return true;
      }

      const mood = String(values.mood || data?.mood || '').toLowerCase();
      if (mood === 'tired' || mood === 'low' || mood === 'overwhelmed') {
        return true;
      }

      if (values.energyLevel === 1 || values.energyLevel === 2) {
        return true;
      }

      return false;
    };

    // Aggregate trailing 7 days logs by distinct user into buckets
    for (const logDoc of recentLogs) {
      const log = logDoc.data();
      const userId = log?.userId;
      if (!userId) continue;

      const cohort = userCohortMap.get(userId) || {
        lifecycleStage: 'pregnancy',
        trimester: 'trimester_2',
      };

      const bucketKey =
        cohort.lifecycleStage === 'postnatal'
          ? 'postnatal'
          : cohort.trimester || 'trimester_2';

      const targetBucket = buckets[bucketKey];
      if (!targetBucket) continue;

      targetBucket.distinctUsers.add(userId);

      if (indicatesFatigueOrTired(log)) {
        targetBucket.usersWithCommonStat.add(userId);
      }
    }

    result.bucketsEvaluated = Object.keys(buckets).length;

    // Evaluate each bucket against the mandatory k >= 50 threshold
    for (const bucketKey of Object.keys(buckets)) {
      const bucket = buckets[bucketKey];
      const cohortSize = bucket.distinctUsers.size;

      // STRICT PRIVACY GUARDRAIL:
      // If cohortSize < 50, DO NOT WRITE ANY RECORD.
      // Under the plan, this triggers the mandatory "Silent Fallback" — UI renders nothing.
      if (cohortSize < K_ANONYMITY_THRESHOLD) {
        result.suppressedBucketsCount++;
        // If an old under-threshold document exists, delete it so no stale small-sample claim persists
        await adminDb.collection('aggregateInsightBuckets').doc(bucketKey).delete().catch(() => {});
        continue;
      }

      // Compute rounded percentage (never fractional float or raw logs)
      const roundedPercentage = Math.round((bucket.usersWithCommonStat.size / cohortSize) * 100);

      const record: AggregateInsightBucketRecord = {
        id: bucketKey,
        cohortId: bucket.cohortId,
        lifecycleStage: bucket.lifecycleStage,
        trimester: bucket.trimester,
        cohortSize, // guaranteed >= 50
        roundedPercentage,
        statDescription: 'reported feeling tired or fatigued this week',
        summaryText: `${roundedPercentage}% of mothers in ${bucket.label} logged feeling tired or fatigued this week.`,
        period: dateRangeStr,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Write strictly the aggregated numbers to aggregateInsightBuckets
      await adminDb.collection('aggregateInsightBuckets').doc(bucketKey).set(record, { merge: true });

      result.bucketsWritten++;
      result.buckets.push({
        ...record,
        updatedAt: periodEndStr,
      });
    }
  } catch (err) {
    console.error('[AggregateInsightService] Error calculating aggregate insight buckets:', err);
    throw err;
  }

  return result;
}

let cronJobStarted = false;

/**
 * Starts the background node-cron scheduled job for aggregate peer insights.
 * Runs once every 24 hours at 2:00 AM ('0 2 * * *') per docs/aggregate-insights-plan.md.
 */
export function startAggregateInsightsCron(): void {
  if (cronJobStarted) return;
  cronJobStarted = true;

  // Run daily at 2:00 AM ('0 2 * * *')
  cron.schedule('0 2 * * *', async () => {
    console.log('[AggregateInsight Cron] Starting daily aggregate insight computation (k>=50 guardrail)...');
    try {
      const result = await processAggregateInsights();
      console.log(
        `[AggregateInsight Cron] Run completed: ${result.bucketsWritten} written, ${result.suppressedBucketsCount} suppressed due to k<50 anonymity rule.`
      );
    } catch (err) {
      console.error('[AggregateInsight Cron] Aggregate insight computation failed:', err);
    }
  });

  console.log('[AggregateInsight Cron] Scheduled daily aggregator engine registered (0 2 * * *).');
}
