// server/jobs/weeklyReportJob.ts
import cron from 'node-cron';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../clinicianAccess.js';

export interface WeeklySummaryRecord {
  id: string;
  facilityId: string;
  periodStart: string;
  periodEnd: string;
  ancEncountersCount: number;
  immunizationsGivenCount: number;
  dangerSignsFlaggedCount: number;
  generatedAt: any;
}

export interface ProcessWeeklyReportsResult {
  totalFacilitiesProcessed: number;
  summariesWritten: number;
  periodStart: string;
  periodEnd: string;
  nationalSummary: WeeklySummaryRecord;
  facilitySummaries: WeeklySummaryRecord[];
  errors: Array<{ facilityId: string; error: string }>;
}

export interface ProcessWeeklyReportsOptions {
  periodEnd?: Date;
  periodStart?: Date;
}

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
    // Handle date-only strings like 2026-09-01
    const dateOnly = new Date(`${val}T12:00:00Z`).getTime();
    return isNaN(dateOnly) ? 0 : dateOnly;
  }
  return 0;
}

/**
 * Computes weekly facility and national summaries for:
 * - ancEncounters count
 * - immunizationRecords count (status GIVEN)
 * - dailyHealthLogs count where hasDangerSigns is true
 * for the prior 7 days and writes them to the `weeklySummaries` collection.
 */
export async function processWeeklyReports(
  options: ProcessWeeklyReportsOptions = {}
): Promise<ProcessWeeklyReportsResult> {
  const periodEnd = options.periodEnd || new Date();
  const periodStart = options.periodStart || new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const periodStartStr = periodStart.toISOString();
  const periodEndStr = periodEnd.toISOString();
  const dateKey = periodStartStr.slice(0, 10);

  const result: ProcessWeeklyReportsResult = {
    totalFacilitiesProcessed: 0,
    summariesWritten: 0,
    periodStart: periodStartStr,
    periodEnd: periodEndStr,
    nationalSummary: {
      id: `NATIONAL_${dateKey}`,
      facilityId: 'NATIONAL',
      periodStart: periodStartStr,
      periodEnd: periodEndStr,
      ancEncountersCount: 0,
      immunizationsGivenCount: 0,
      dangerSignsFlaggedCount: 0,
      generatedAt: periodEndStr,
    },
    facilitySummaries: [],
    errors: [],
  };

  try {
    const isWithinPeriod = (dateVal: any): boolean => {
      const ms = getTimestampMs(dateVal);
      return ms >= startMs && ms <= endMs;
    };

    // Parallel fetch of facilities and all required collectionGroup datasets
    const [facilitiesSnap, ancSnap, immSnap, healthLogsSnap, rootHealthLogsSnap, motherProfilesSnap, pregnanciesSnap] =
      await Promise.all([
        adminDb.collection('facilities').limit(1000).get(),
        adminDb.collectionGroup('ancEncounters').limit(5000).get(),
        adminDb.collectionGroup('immunizationRecords').limit(5000).get(),
        adminDb.collectionGroup('dailyHealthLogs').limit(5000).get().catch(() => ({ docs: [] } as any)),
        adminDb.collection('dailyHealthLogs').limit(5000).get().catch(() => ({ docs: [] } as any)),
        adminDb.collection('motherProfiles').limit(5000).get().catch(() => ({ docs: [] } as any)),
        adminDb.collection('pregnancies').limit(5000).get().catch(() => ({ docs: [] } as any)),
      ]);

    // Build user -> facility mapping for maternal logs without explicit facilityId
    const userFacilityMap = new Map<string, string>();
    for (const doc of motherProfilesSnap.docs) {
      const data = doc.data();
      const fid = data.facilityId || data.primaryFacility || data.preferredFacility;
      if (fid) userFacilityMap.set(doc.id, String(fid).trim());
    }
    for (const doc of pregnanciesSnap.docs) {
      const data = doc.data();
      const mid = data.motherId;
      const pref = data.birthPlan?.preferredFacility;
      if (mid && pref && !userFacilityMap.has(mid)) {
        userFacilityMap.set(mid, String(pref).trim());
      }
    }

    // Deduplicate daily health logs
    const allHealthLogDocs = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const d of healthLogsSnap.docs || []) allHealthLogDocs.set(d.id, d);
    for (const d of rootHealthLogsSnap.docs || []) allHealthLogDocs.set(d.id, d);

    // Filter ANC Encounters within prior 7 days
    const ancInPeriod = ancSnap.docs.filter((d) => {
      const data = d.data();
      return (
        isWithinPeriod(data.date) ||
        isWithinPeriod(data.createdAt) ||
        isWithinPeriod(data.provenance?.enteredAt)
      );
    });

    // Filter Immunizations (status GIVEN) within prior 7 days
    const immInPeriod = immSnap.docs.filter((d) => {
      const data = d.data();
      const status = String(data.status || '').toUpperCase().trim();
      if (status !== 'GIVEN') return false;
      return (
        isWithinPeriod(data.dateAdministered) ||
        isWithinPeriod(data.dateGiven) ||
        isWithinPeriod(data.date) ||
        isWithinPeriod(data.createdAt) ||
        isWithinPeriod(data.provenance?.enteredAt)
      );
    });

    // Filter DailyHealthLogs where hasDangerSigns is true within prior 7 days
    // Field on DailyHealthLog is `values.hasDangerSigns` (with fallback to `hasDangerSigns` or non-empty `dangerSigns` list)
    const dangerLogsInPeriod = Array.from(allHealthLogDocs.values()).filter((d) => {
      const data = d.data();
      const hasDanger = Boolean(
        data?.values?.hasDangerSigns === true ||
        data?.hasDangerSigns === true ||
        (Array.isArray(data?.values?.dangerSigns) && data.values.dangerSigns.length > 0) ||
        (Array.isArray(data?.dangerSigns) && data.dangerSigns.length > 0)
      );
      if (!hasDanger) return false;
      return (
        isWithinPeriod(data.timestamp) ||
        isWithinPeriod(data.createdAt) ||
        isWithinPeriod(data.firestoreCreatedAt)
      );
    });

    result.totalFacilitiesProcessed = facilitiesSnap.size;

    let nationalAncCount = 0;
    let nationalImmCount = 0;
    let nationalDangerCount = 0;

    // Process each facility in the facilities collection
    for (const facilityDoc of facilitiesSnap.docs) {
      const facilityId = facilityDoc.id;
      const facData = facilityDoc.data() || {};
      const kmhflCode = String(facData.kmhflCode || '').trim();
      const facName = String(facData.name || '').trim().toLowerCase();

      const matchesFacility = (recordData: any, userId?: string): boolean => {
        const recFacId = String(recordData.facilityId || recordData.deliveryFacilityId || '').trim();
        const recFacName = String(recordData.facilityName || recordData.deliveryFacility || '').trim().toLowerCase();

        if (recFacId) {
          if (recFacId === facilityId || (kmhflCode && recFacId === kmhflCode)) return true;
        }
        if (recFacName && facName) {
          if (recFacName === facName || facName.includes(recFacName) || recFacName.includes(facName)) return true;
        }
        if (userId && userFacilityMap.has(userId)) {
          const uFac = userFacilityMap.get(userId)!;
          if (uFac === facilityId || (kmhflCode && uFac === kmhflCode) || (facName && uFac.toLowerCase() === facName)) {
            return true;
          }
        }
        return false;
      };

      try {
        const ancCount = ancInPeriod.filter((d) => matchesFacility(d.data(), d.data()?.motherId)).length;
        const immCount = immInPeriod.filter((d) => matchesFacility(d.data(), d.data()?.motherId)).length;
        const dangerCount = dangerLogsInPeriod.filter((d) => matchesFacility(d.data(), d.data()?.userId)).length;

        nationalAncCount += ancCount;
        nationalImmCount += immCount;
        nationalDangerCount += dangerCount;

        const docId = `${facilityId}_${dateKey}`;
        const summaryRecord: WeeklySummaryRecord = {
          id: docId,
          facilityId,
          periodStart: periodStartStr,
          periodEnd: periodEndStr,
          ancEncountersCount: ancCount,
          immunizationsGivenCount: immCount,
          dangerSignsFlaggedCount: dangerCount,
          generatedAt: FieldValue.serverTimestamp(),
        };

        await adminDb.collection('weeklySummaries').doc(docId).set(summaryRecord, { merge: true });

        result.summariesWritten++;
        result.facilitySummaries.push({
          ...summaryRecord,
          generatedAt: periodEndStr,
        });
      } catch (facilityErr: any) {
        console.error(`[WeeklyReportJob] Error writing summary for facility ${facilityId}:`, facilityErr);
        result.errors.push({
          facilityId,
          error: facilityErr?.message || String(facilityErr),
        });
      }
    }

    // Write one document with facilityId: 'NATIONAL' summing all facilities
    const nationalDocId = `NATIONAL_${dateKey}`;
    const nationalSummaryRecord: WeeklySummaryRecord = {
      id: nationalDocId,
      facilityId: 'NATIONAL',
      periodStart: periodStartStr,
      periodEnd: periodEndStr,
      ancEncountersCount: nationalAncCount,
      immunizationsGivenCount: nationalImmCount,
      dangerSignsFlaggedCount: nationalDangerCount,
      generatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('weeklySummaries').doc(nationalDocId).set(nationalSummaryRecord, { merge: true });
    result.summariesWritten++;

    result.nationalSummary = {
      ...nationalSummaryRecord,
      generatedAt: periodEndStr,
    };
  } catch (err) {
    console.error('[WeeklyReportJob] Error running weekly report computation:', err);
    throw err;
  }

  return result;
}

let cronJobStarted = false;

/**
 * Starts the background node-cron scheduled job for weekly facility reports.
 * Runs weekly every Monday at 6:00 AM ('0 6 * * 1').
 */
export function startWeeklyReportCron(): void {
  if (cronJobStarted) return;
  cronJobStarted = true;

  // Run weekly: every Monday at 6:00 AM ('0 6 * * 1')
  cron.schedule('0 6 * * 1', async () => {
    console.log('[WeeklyReport Cron] Starting scheduled weekly facility report generation...');
    try {
      const summary = await processWeeklyReports();
      console.log(
        `[WeeklyReport Cron] Completed run: ${summary.totalFacilitiesProcessed} facilities, ${summary.summariesWritten} summaries written. National ANC: ${summary.nationalSummary.ancEncountersCount}, Immunizations: ${summary.nationalSummary.immunizationsGivenCount}, Danger Signs: ${summary.nationalSummary.dangerSignsFlaggedCount}`
      );
    } catch (err) {
      console.error('[WeeklyReport Cron] Scheduled weekly report encountered error:', err);
    }
  });

  console.log('[WeeklyReport Cron] Scheduled weekly report delivery engine registered (0 6 * * 1).');
}
