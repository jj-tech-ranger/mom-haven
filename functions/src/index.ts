// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// Standard Kenya Expanded Programme on Immunization (KEPI) Target Age Intervals (in days)
const KEPI_SCHEDULE_RULES: Array<{ antigen: string; targetDays: number; label: string }> = [
  { antigen: 'BCG', targetDays: 0, label: 'At birth' },
  { antigen: 'OPV0', targetDays: 0, label: 'At birth' },
  { antigen: 'OPV1', targetDays: 42, label: '6 Weeks' },
  { antigen: 'DPT-HepB-Hib 1', targetDays: 42, label: '6 Weeks (Penta 1)' },
  { antigen: 'PCV 1', targetDays: 42, label: '6 Weeks' },
  { antigen: 'Rota 1', targetDays: 42, label: '6 Weeks' },
  { antigen: 'OPV2', targetDays: 70, label: '10 Weeks' },
  { antigen: 'DPT-HepB-Hib 2', targetDays: 70, label: '10 Weeks (Penta 2)' },
  { antigen: 'PCV 2', targetDays: 70, label: '10 Weeks' },
  { antigen: 'Rota 2', targetDays: 70, label: '10 Weeks' },
  { antigen: 'OPV3', targetDays: 98, label: '14 Weeks' },
  { antigen: 'IPV', targetDays: 98, label: '14 Weeks' },
  { antigen: 'DPT-HepB-Hib 3', targetDays: 98, label: '14 Weeks (Penta 3)' },
  { antigen: 'PCV 3', targetDays: 98, label: '14 Weeks' },
  { antigen: 'MR-6mo', targetDays: 182, label: '6 Months' },
  { antigen: 'MR-9mo', targetDays: 273, label: '9 Months' },
  { antigen: 'YellowFever', targetDays: 273, label: '9 Months' },
  { antigen: 'MR-18mo', targetDays: 547, label: '18 Months' },
];

/**
 * Scheduled Cloud Function (pubsub.schedule) triggered every morning at 06:00 Africa/Nairobi.
 * 1. Derives dynamic due and overdue states for all maternal and child health milestones.
 * 2. Clears / completes reminders when immunizations or ANC encounters have been recorded.
 * 3. Delivers push notifications via Firebase Cloud Messaging for pushEligible items.
 */
export const recomputeMaternalReminders = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('Africa/Nairobi')
  .onRun(async (context) => {
    functions.logger.info('Starting daily MOH 216 reminder recompute & FCM push delivery...');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Process Children & KEPI Immunizations
    const childrenSnap = await db.collection('children').get();
    for (const childDoc of childrenSnap.docs) {
      const child = { id: childDoc.id, ...childDoc.data() } as any;
      const motherId = child.motherId;
      const dobStr = child.dateOfBirth || child.dob;
      if (!motherId || !dobStr) continue;

      const dob = new Date(dobStr);
      if (isNaN(dob.getTime())) continue;

      // Fetch child's administered immunizations
      const [subSnap, topSnap] = await Promise.all([
        db.collection(`children/${child.id}/immunizationRecords`).get(),
        db.collection('immunizationRecords').where('childId', '==', child.id).get(),
      ]);

      const givenAntigens = new Set<string>();
      for (const d of [...subSnap.docs, ...topSnap.docs]) {
        const data = d.data();
        const antigen = (data.antigen || data.vaccineName || data.vaccine || '').trim().toLowerCase();
        const isGiven = data.givenDate || data.dateGiven || data.status === 'given' || data.status === 'GIVEN';
        if (antigen && isGiven) givenAntigens.add(antigen);
      }

      // Fetch existing reminders for child
      const remSnap = await db
        .collection('reminders')
        .where('userId', '==', motherId)
        .where('childId', '==', child.id)
        .get();

      const existingMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
      remSnap.docs.forEach((d) => {
        const key = d.data().sourceEventId;
        if (key) existingMap.set(key, d);
      });

      for (const rule of KEPI_SCHEDULE_RULES) {
        const sourceKey = `kepi_${child.id}_${rule.antigen}`;
        const scheduledTime = dob.getTime() + rule.targetDays * 24 * 3600 * 1000;
        const scheduledDateStr = new Date(scheduledTime).toISOString().split('T')[0];
        const normalAntigen = rule.antigen.trim().toLowerCase();
        const isGiven = givenAntigens.has(normalAntigen) || givenAntigens.has(normalAntigen.replace(/\s+/g, ''));

        const existingDoc = existingMap.get(sourceKey);

        if (isGiven) {
          // Clear reminder if marked given
          if (existingDoc && !existingDoc.data().completed) {
            await existingDoc.ref.update({
              completed: true,
              completedAt: now.toISOString(),
              clearedReason: 'dose_administered',
              updatedAt: now.toISOString(),
            });
          }
        } else {
          // Calculate due vs overdue
          const diffDays = Math.round((new Date(scheduledDateStr).getTime() - new Date(todayStr).getTime()) / (24 * 3600 * 1000));
          if (diffDays < 0 || diffDays <= 14) {
            const isOverdue = diffDays < 0;
            const title = isOverdue
              ? `OVERDUE: ${rule.antigen} Vaccine for ${child.name || 'Baby'}`
              : `Upcoming: ${rule.antigen} Vaccine for ${child.name || 'Baby'}`;

            const payload = {
              userId: motherId,
              childId: child.id,
              title,
              description: `MOH 216 Childhood Immunization: ${rule.antigen} scheduled at ${rule.label}.`,
              dueDate: scheduledDateStr,
              category: 'clinical',
              type: 'immunization',
              sourceEventId: sourceKey,
              status: isOverdue ? 'overdue' : 'due',
              completed: false,
              verified: true,
              pushEligible: true,
              updatedAt: now.toISOString(),
            };

            if (!existingDoc) {
              await db.collection('reminders').add({
                ...payload,
                createdAt: now.toISOString(),
              });
            } else if (!existingDoc.data().completed) {
              await existingDoc.ref.update(payload);
            }
          }
        }
      }
    }

    // 2. Deliver FCM push notifications for pushEligible active reminders
    const pushSnap = await db
      .collection('reminders')
      .where('pushEligible', '==', true)
      .where('completed', '==', false)
      .limit(200)
      .get();

    let pushesSent = 0;
    for (const rDoc of pushSnap.docs) {
      const data = rDoc.data();
      if (data.notifiedAt) {
        const notifTime = new Date(data.notifiedAt).getTime();
        // Skip if notified in last 48h
        if (Date.now() - notifTime < 48 * 3600 * 1000) continue;
      }

      const motherId = data.userId;
      const [motherProfile, userDoc] = await Promise.all([
        db.doc(`motherProfiles/${motherId}`).get(),
        db.doc(`users/${motherId}`).get(),
      ]);

      const token = motherProfile.data()?.fcmToken || userDoc.data()?.fcmToken;
      if (token) {
        try {
          await messaging.send({
            token,
            notification: {
              title: data.title,
              body: data.description || 'Important health reminder from MomHaven.',
            },
            data: {
              reminderId: rDoc.id,
              category: data.category || 'clinical',
            },
          });
          await rDoc.ref.update({
            notifiedAt: now.toISOString(),
            notifiedPush: true,
          });
          pushesSent++;
        } catch (err: any) {
          functions.logger.warn(`Push failed for user ${motherId}:`, err);
        }
      }
    }

    functions.logger.info(`Recompute completed. Delivered ${pushesSent} push notifications.`);
    return { success: true, pushesSent };
  });
