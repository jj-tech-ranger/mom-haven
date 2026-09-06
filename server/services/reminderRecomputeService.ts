// server/services/reminderRecomputeService.ts
import { adminDb, getAdminMessaging } from '../clinicianAccess.js';
import { computeMOH216Schedule, ScheduledMOH216Vaccine } from '../../src/utils/clinicalCalculations';

export interface RecomputeSummary {
  mothersProcessed: number;
  childrenProcessed: number;
  remindersCreated: number;
  remindersUpdated: number;
  remindersCompleted: number;
  pushNotificationsSent: number;
  errors: string[];
}

/**
 * Recomputes dynamic overdue/due statuses and clinical reminders across mothers and children.
 * Enforces single source of truth and event-driven cleanup:
 * When an immunization or ANC encounter is recorded, overdue reminders clear.
 */
export async function recomputeAllMaternalReminders(targetMotherId?: string): Promise<RecomputeSummary> {
  const summary: RecomputeSummary = {
    mothersProcessed: 0,
    childrenProcessed: 0,
    remindersCreated: 0,
    remindersUpdated: 0,
    remindersCompleted: 0,
    pushNotificationsSent: 0,
    errors: [],
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  try {
    // 1. Fetch Children
    let childrenQuery: FirebaseFirestore.Query = adminDb.collection('children');
    if (targetMotherId) {
      childrenQuery = childrenQuery.where('motherId', '==', targetMotherId);
    }
    const childrenSnap = await childrenQuery.get();

    // 2. Fetch Active Pregnancies
    let pregQuery: FirebaseFirestore.Query = adminDb.collection('pregnancies').where('status', '==', 'active');
    if (targetMotherId) {
      pregQuery = pregQuery.where('motherId', '==', targetMotherId);
    }
    const pregSnap = await pregQuery.get();

    const motherIds = new Set<string>();
    childrenSnap.docs.forEach((d) => {
      const mId = d.data().motherId;
      if (mId) motherIds.add(mId);
    });
    pregSnap.docs.forEach((d) => {
      const mId = d.data().motherId;
      if (mId) motherIds.add(mId);
    });

    summary.mothersProcessed = motherIds.size;
    summary.childrenProcessed = childrenSnap.size;

    // 3. Process Child Immunizations
    for (const childDoc of childrenSnap.docs) {
      const child = { id: childDoc.id, ...childDoc.data() } as any;
      const motherId = child.motherId;
      const dob = child.dateOfBirth || child.dob;
      if (!motherId || !dob) continue;

      // Fetch Child Immunization Records (dual subcollection + top collection)
      const [subSnap, topSnap] = await Promise.all([
        adminDb.collection(`children/${child.id}/immunizationRecords`).get(),
        adminDb.collection('immunizationRecords').where('childId', '==', child.id).get(),
      ]);

      const recordsMap = new Map<string, any>();
      for (const d of [...subSnap.docs, ...topSnap.docs]) {
        const data = d.data();
        const k = (data.antigen || data.vaccineName || data.vaccine || '').trim().toLowerCase();
        if (k && !recordsMap.has(k)) recordsMap.set(k, data);
      }
      const adminRecords = Array.from(recordsMap.values());

      // Compute dynamic schedule
      let schedule: ScheduledMOH216Vaccine[] = [];
      try {
        schedule = computeMOH216Schedule(dob, adminRecords, now);
      } catch (err: any) {
        summary.errors.push(`Child ${child.id} schedule error: ${err.message}`);
        continue;
      }

      // Fetch existing reminders for this child
      const remSnap = await adminDb
        .collection('reminders')
        .where('userId', '==', motherId)
        .where('childId', '==', child.id)
        .get();

      const existingRemindersMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
      remSnap.docs.forEach((d) => {
        const sourceKey = d.data().sourceEventId;
        if (sourceKey) existingRemindersMap.set(sourceKey, d);
      });

      for (const dose of schedule) {
        const sourceKey = `kepi_${child.id}_${dose.antigen}`;
        const existingDoc = existingRemindersMap.get(sourceKey);

        if (dose.status === 'given') {
          // If given, clear any lingering pending reminders
          if (existingDoc && !existingDoc.data().completed) {
            await existingDoc.ref.update({
              completed: true,
              completedAt: new Date().toISOString(),
              clearedReason: 'dose_administered',
              updatedAt: new Date().toISOString(),
            });
            summary.remindersCompleted++;
          }
        } else if (dose.status === 'due' || dose.status === 'overdue') {
          const title = dose.status === 'overdue'
            ? `OVERDUE: ${dose.antigen} Vaccine for ${child.name || 'Baby'}`
            : `Upcoming: ${dose.antigen} Vaccine for ${child.name || 'Baby'}`;

          const reminderPayload = {
            userId: motherId,
            childId: child.id,
            title,
            description: `MOH 216 Childhood Immunization: ${dose.antigen} is scheduled at ${dose.targetAgeWeeks} weeks.`,
            dueDate: dose.scheduledDate,
            category: 'clinical',
            type: 'immunization',
            sourceEventId: sourceKey,
            status: dose.status,
            completed: false,
            verified: true,
            pushEligible: true,
            updatedAt: new Date().toISOString(),
          };

          if (!existingDoc) {
            await adminDb.collection('reminders').add({
              ...reminderPayload,
              createdAt: new Date().toISOString(),
            });
            summary.remindersCreated++;
          } else if (existingDoc.data().completed) {
            // Already completed, leave alone unless reset
          } else {
            // Update title or status if it transitioned (e.g. from due to overdue)
            if (existingDoc.data().status !== dose.status || existingDoc.data().title !== title) {
              await existingDoc.ref.update(reminderPayload);
              summary.remindersUpdated++;
            }
          }
        }
      }
    }

    // 4. Process Active Pregnancies & ANC Reminders
    for (const pregDoc of pregSnap.docs) {
      const preg = { id: pregDoc.id, ...pregDoc.data() } as any;
      const motherId = preg.motherId;
      if (!motherId) continue;

      if (preg.nextVisitDate) {
        const sourceKey = `anc_next_visit_${preg.id}`;
        const existingRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', sourceKey)
          .limit(1)
          .get();

        const isPast = preg.nextVisitDate < todayStr;
        const title = isPast
          ? 'OVERDUE: Follow-up ANC Clinic Contact'
          : 'Upcoming: Scheduled ANC Clinic Contact';

        const ancPayload = {
          userId: motherId,
          pregnancyId: preg.id,
          title,
          description: `Authoritative clinical return date: ${preg.nextVisitDate}. Please attend your designated MCH health facility.`,
          dueDate: preg.nextVisitDate,
          category: 'clinical',
          type: 'anc_visit',
          sourceEventId: sourceKey,
          completed: false,
          verified: true,
          pushEligible: true,
          updatedAt: new Date().toISOString(),
        };

        if (existingRem.empty) {
          await adminDb.collection('reminders').add({
            ...ancPayload,
            createdAt: new Date().toISOString(),
          });
          summary.remindersCreated++;
        } else {
          const docRef = existingRem.docs[0].ref;
          if (!existingRem.docs[0].data().completed) {
            await docRef.update(ancPayload);
            summary.remindersUpdated++;
          }
        }
      }
    }

    // 5. Push Delivery Path for pushEligible reminders
    const messaging = getAdminMessaging();
    if (messaging) {
      const pushSnap = await adminDb
        .collection('reminders')
        .where('pushEligible', '==', true)
        .where('completed', '==', false)
        .limit(100)
        .get();

      for (const rDoc of pushSnap.docs) {
        const rData = rDoc.data();
        // Skip if notified in last 48 hours
        if (rData.notifiedAt) {
          const notifiedTime = new Date(rData.notifiedAt).getTime();
          if (Date.now() - notifiedTime < 48 * 3600 * 1000) continue;
        }

        const motherId = rData.userId;
        let token: string | null = null;
        const [motherProfile, userDoc] = await Promise.all([
          adminDb.doc(`motherProfiles/${motherId}`).get(),
          adminDb.doc(`users/${motherId}`).get(),
        ]);

        if (motherProfile.exists && motherProfile.data()?.fcmToken) {
          token = motherProfile.data()?.fcmToken;
        } else if (userDoc.exists && userDoc.data()?.fcmToken) {
          token = userDoc.data()?.fcmToken;
        }

        if (token) {
          try {
            await messaging.send({
              token,
              notification: {
                title: rData.title,
                body: rData.description || 'You have an important clinical appointment on MomHaven.',
              },
              data: {
                reminderId: rDoc.id,
                category: rData.category || 'clinical',
                type: rData.type || 'reminder',
              },
            });
            await rDoc.ref.update({
              notifiedAt: new Date().toISOString(),
              notifiedPush: true,
            });
            summary.pushNotificationsSent++;
          } catch (pushErr: any) {
            console.warn(`[recomputeReminders] Push failed for mother ${motherId}:`, pushErr.message);
          }
        }
      }
    }

    return summary;
  } catch (error: any) {
    summary.errors.push(error.message || String(error));
    return summary;
  }
}
