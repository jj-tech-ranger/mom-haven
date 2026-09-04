// server/jobs/reminderPush.ts
import cron from 'node-cron';
import { adminDb, getAdminMessaging } from '../clinicianAccess';

export interface ProcessRemindersResult {
  totalChecked: number;
  dueFound: number;
  notifiedCount: number;
  errors: Array<{ reminderId: string; error: string }>;
}

/**
 * Checks all active, uncompleted reminders and dispatches push notifications
 * for those that are due or within the notification window (e.g. 24h lead time).
 */
export async function processDueReminders(options: {
  leadTimeHours?: number;
  targetUserId?: string;
  targetReminderId?: string;
} = {}): Promise<ProcessRemindersResult> {
  const leadTimeHours = options.leadTimeHours ?? 24;
  const now = new Date();
  const maxDueDate = new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000);

  const result: ProcessRemindersResult = {
    totalChecked: 0,
    dueFound: 0,
    notifiedCount: 0,
    errors: [],
  };

  try {
    let remindersDocs: FirebaseFirestore.DocumentSnapshot[] = [];

    if (options.targetReminderId) {
      const singleDoc = await adminDb.doc(`reminders/${options.targetReminderId}`).get();
      if (singleDoc.exists) {
        remindersDocs = [singleDoc];
      }
    } else {
      let q: FirebaseFirestore.Query = adminDb.collection('reminders').where('completed', '==', false);
      if (options.targetUserId) {
        q = q.where('userId', '==', options.targetUserId);
      }
      const snapshot = await q.get();
      remindersDocs = snapshot.docs;
    }

    result.totalChecked = remindersDocs.length;
    const messaging = getAdminMessaging();

    for (const docSnap of remindersDocs) {
      const data = docSnap.data();
      if (!data || data.completed) continue;

      // Skip if already notified
      if (data.notifiedAt) continue;

      // Determine due date/time
      const rawDueDate = data.dueDate;
      if (!rawDueDate) continue;

      let dueTime: number;
      if (typeof rawDueDate === 'string' && rawDueDate.includes('T')) {
        dueTime = new Date(rawDueDate).getTime();
      } else if (typeof rawDueDate === 'string') {
        // Date string like "2026-09-04" -> consider end of that day or 08:00
        dueTime = new Date(`${rawDueDate}T23:59:59Z`).getTime();
      } else if (rawDueDate?.toDate) {
        dueTime = rawDueDate.toDate().getTime();
      } else {
        dueTime = new Date(rawDueDate).getTime();
      }

      if (isNaN(dueTime)) continue;

      // Check if within due window (past due or due within leadTimeHours)
      if (dueTime <= maxDueDate.getTime()) {
        result.dueFound++;
        const userId = data.userId;
        const reminderId = docSnap.id;

        // Fetch user/mother profile to get FCM tokens
        let fcmToken: string | null = null;
        if (userId) {
          const motherDoc = await adminDb.doc(`motherProfiles/${userId}`).get();
          if (motherDoc.exists) {
            fcmToken = motherDoc.data()?.fcmToken || null;
          }
          if (!fcmToken) {
            const userDoc = await adminDb.doc(`users/${userId}`).get();
            if (userDoc.exists) {
              fcmToken = userDoc.data()?.fcmToken || null;
            }
          }
        }

        let pushSent = false;
        if (fcmToken && messaging) {
          try {
            await messaging.send({
              token: fcmToken,
              notification: {
                title: `MomHaven Reminder: ${data.title || 'Upcoming Care'}`,
                body: data.description || 'You have an upcoming appointment or immunization scheduled.',
              },
              data: {
                reminderId,
                deepLink: data.deepLink || 'today',
                category: data.category || 'anc',
                dueDate: String(data.dueDate || ''),
              },
            });
            pushSent = true;
          } catch (fcmErr) {
            console.warn(`[ReminderPush] FCM dispatch notice for reminder ${reminderId}:`, fcmErr instanceof Error ? fcmErr.message : String(fcmErr));
            result.errors.push({
              reminderId,
              error: fcmErr instanceof Error ? fcmErr.message : String(fcmErr),
            });
          }
        }

        // Mark as notified so the reminder is not re-sent every scheduled run
        try {
          await docSnap.ref.update({
            notifiedAt: new Date().toISOString(),
            lastNotifiedMethod: pushSent ? 'fcm' : 'system_scheduled',
          });
          result.notifiedCount++;
        } catch (updateErr) {
          console.error(`[ReminderPush] Failed to update notifiedAt for ${reminderId}:`, updateErr);
        }
      }
    }
  } catch (err) {
    console.error('[ReminderPush] Error running due reminders scan:', err);
    throw err;
  }

  return result;
}

let cronJobStarted = false;

/**
 * Starts the background node-cron scheduled job.
 * Runs at minute 0 of every hour (at least hourly).
 */
export function startReminderPushCron(): void {
  if (cronJobStarted) return;
  cronJobStarted = true;

  // Run at minute 0 every hour: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    console.log('[ReminderPush Cron] Starting scheduled hourly reminder check...');
    try {
      const summary = await processDueReminders({ leadTimeHours: 24 });
      console.log(`[ReminderPush Cron] Finished check: ${summary.dueFound} due, ${summary.notifiedCount} marked/pushed.`);
    } catch (err) {
      console.error('[ReminderPush Cron] Scheduled run encountered error:', err);
    }
  });

  console.log('[ReminderPush Cron] Scheduled hourly reminder delivery engine registered.');
}
