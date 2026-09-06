// server/services/reminderRecomputeService.ts
import { adminDb, getAdminMessaging } from '../clinicianAccess.js';
import { computeMOH216Schedule, ScheduledMOH216Vaccine } from '../../src/utils/clinicalCalculations';
import { calculateMaternalTdSchedule } from '../../src/utils/maternalTdSchedule';

function addDaysToIso(baseDate: string, days: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

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

    // 4b. Recompute Family Planning Reminders (MOH Handbook p.22)
    let fpQuery: FirebaseFirestore.Query = adminDb.collection('familyPlanning');
    if (targetMotherId) {
      fpQuery = fpQuery.where('motherId', '==', targetMotherId);
    }
    const fpSnap = await fpQuery.get();
    for (const fpDoc of fpSnap.docs) {
      const fp = fpDoc.data();
      const motherId = fp.motherId;
      if (!motherId || fp.methodChosen === 'None') continue;

      let dueDate: string | null = fp.nextAppointmentDate || fp.removalDate || null;
      if (!dueDate && fp.dateStarted) {
        if (fp.methodChosen === 'Injectables (DMPA)') {
          dueDate = addDaysToIso(fp.dateStarted, 84); // 12 weeks
        } else if (fp.methodChosen === 'POPs' || fp.methodChosen === 'COCs') {
          dueDate = addDaysToIso(fp.dateStarted, 84);
        } else if (fp.methodChosen === 'Implants') {
          dueDate = addDaysToIso(fp.dateStarted, 1095); // 3 years
        } else if (fp.methodChosen === 'IUCD') {
          dueDate = addDaysToIso(fp.dateStarted, 3652); // 10 years
        }
      }

      if (dueDate) {
        const isPast = dueDate < todayStr;
        const sourceKey = `fp_${motherId}_${fpDoc.id}`;
        const existingRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', sourceKey)
          .limit(1)
          .get();

        const fpPayload = {
          userId: motherId,
          title: isPast ? `OVERDUE: Family Planning Review (${fp.methodChosen})` : `Family Planning Follow-up (${fp.methodChosen})`,
          description: `Scheduled family planning clinical follow-up / resupply for ${fp.methodChosen} per MOH Handbook p.22.`,
          dueDate,
          category: 'clinical',
          type: 'family_planning',
          sourceEventId: sourceKey,
          completed: false,
          verified: true,
          pushEligible: true,
          deepLink: 'records',
          updatedAt: new Date().toISOString(),
        };

        if (existingRem.empty) {
          await adminDb.collection('reminders').add({
            ...fpPayload,
            createdAt: new Date().toISOString(),
          });
          summary.remindersCreated++;
        } else if (!existingRem.docs[0].data().completed) {
          await existingRem.docs[0].ref.update(fpPayload);
          summary.remindersUpdated++;
        }
      }
    }

    // 4c. Recompute Cancer Screening Urgent Follow-ups (MOH Handbook p.22)
    let csQuery: FirebaseFirestore.Query = adminDb.collection('cancerScreenings');
    if (targetMotherId) {
      csQuery = csQuery.where('motherId', '==', targetMotherId);
    }
    const csSnap = await csQuery.get();
    for (const csDoc of csSnap.docs) {
      const cs = csDoc.data();
      const motherId = cs.motherId;
      if (!motherId) continue;

      const isCervicalFlagged = cs.cervicalDone && (cs.cervicalResult === 'positive' || cs.cervicalResult === 'suspicious');
      const isBreastFlagged = cs.breastDone && cs.breastResult === 'suspicious lump';
      const isAbnormal = Boolean(isCervicalFlagged || isBreastFlagged || cs.hasPositiveOrSuspicious);

      if (isAbnormal) {
        const baseDate = cs.date || todayStr;
        const dueDate = addDaysToIso(baseDate, 14); // 14-day urgent follow-up
        const isPast = dueDate < todayStr;
        const sourceKey = `cancer_followup_${motherId}_${csDoc.id}`;

        const existingRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', sourceKey)
          .limit(1)
          .get();

        const csPayload = {
          userId: motherId,
          title: isPast ? 'OVERDUE: Cancer Screening Follow-up Review' : 'URGENT: Cancer Screening Clinical Follow-up Review',
          description: `Urgent reproductive organ cancer clinical follow-up required per Kenya MOH Handbook p.22 protocol.`,
          dueDate,
          category: 'clinical',
          type: 'cancer_screening_followup',
          sourceEventId: sourceKey,
          completed: false,
          verified: true,
          pushEligible: true,
          deepLink: 'records',
          updatedAt: new Date().toISOString(),
        };

        if (existingRem.empty) {
          await adminDb.collection('reminders').add({
            ...csPayload,
            createdAt: new Date().toISOString(),
          });
          summary.remindersCreated++;
        } else if (!existingRem.docs[0].data().completed) {
          await existingRem.docs[0].ref.update(csPayload);
          summary.remindersUpdated++;
        }
      }
    }

    // 4d. Recompute PMTCT / HEI Infant Testing Schedule (MOH Handbook p.36)
    let pmtctQuery: FirebaseFirestore.Query = adminDb.collection('pmtctRecords');
    if (targetMotherId) {
      pmtctQuery = pmtctQuery.where('motherId', '==', targetMotherId);
    }
    const pmtctSnap = await pmtctQuery.get();
    const HEI_STAGES = [
      { milestone: '1st_dna_pcr_6wk', label: '1st DNA-PCR Test (6 Weeks)', days: 42 },
      { milestone: '2nd_dna_pcr_6mo', label: '2nd DNA-PCR Test (6 Months)', days: 182 },
      { milestone: '3rd_dna_pcr_12mo', label: '3rd DNA-PCR Test (12 Months)', days: 365 },
      { milestone: 'antibody_18mo', label: 'Rapid Antibody Test (18 Months)', days: 548 },
      { milestone: 'antibody_24mo', label: 'Rapid Antibody Test (24 Months)', days: 730 },
    ];

    for (const pmtctDoc of pmtctSnap.docs) {
      const pmtct = pmtctDoc.data();
      const motherId = pmtct.motherId;
      if (!motherId || pmtct.isHivExposed === false) continue;

      const rawTests = Array.isArray(pmtct.infantDbsTests) ? pmtct.infantDbsTests : [];
      const completedMilestones = new Set(
        rawTests
          .filter((t: any) => t.result && t.result !== 'pending' && t.result !== 'not_done')
          .map((t: any) => t.milestone)
      );

      // Event-driven clear of completed milestones
      for (const milestone of completedMilestones) {
        const completedKey = `hei_${pmtct.childId || motherId}_${milestone}`;
        const priorRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', completedKey)
          .get();
        for (const d of priorRem.docs) {
          if (!d.data().completed) {
            await d.ref.update({ completed: true, updatedAt: new Date().toISOString() });
            summary.remindersCompleted++;
          }
        }
      }

      // Determine next stage
      const nextStage = HEI_STAGES.find((s) => !completedMilestones.has(s.milestone));
      if (nextStage) {
        let childDob: string | null = null;
        if (pmtct.childId) {
          const chSnap = await adminDb.doc(`children/${pmtct.childId}`).get().catch(() => null);
          if (chSnap?.exists) childDob = chSnap.data()?.dateOfBirth || chSnap.data()?.dob;
        }

        const dueDate = childDob
          ? addDaysToIso(childDob, nextStage.days)
          : addDaysToIso(todayStr, 140);

        const isPast = dueDate < todayStr;
        const sourceKey = `hei_${pmtct.childId || motherId}_${nextStage.milestone}`;

        const existingRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', sourceKey)
          .limit(1)
          .get();

        const heiPayload = {
          userId: motherId,
          childId: pmtct.childId || undefined,
          title: isPast ? `OVERDUE: HEI ${nextStage.label}` : `HEI ${nextStage.label}`,
          description: `MOH Handbook p.36 protocol: DBS sample collection and diagnostic follow-up for infant.`,
          dueDate,
          category: 'clinical',
          type: 'pmtct_hei_test',
          sourceEventId: sourceKey,
          completed: false,
          verified: true,
          pushEligible: true,
          deepLink: 'records',
          updatedAt: new Date().toISOString(),
        };

        if (existingRem.empty) {
          await adminDb.collection('reminders').add({
            ...heiPayload,
            createdAt: new Date().toISOString(),
          });
          summary.remindersCreated++;
        } else if (!existingRem.docs[0].data().completed) {
          await existingRem.docs[0].ref.update(heiPayload);
          summary.remindersUpdated++;
        }
      }
    }

    // 4e. Recompute Maternal Td Immunization Reminders (MOH Handbook pp.10-11)
    let ancProfQuery: FirebaseFirestore.Query = adminDb.collection('antenatalProfiles');
    if (targetMotherId) {
      ancProfQuery = ancProfQuery.where('motherId', '==', targetMotherId);
    }
    const ancProfSnap = await ancProfQuery.get();
    for (const profDoc of ancProfSnap.docs) {
      const prof = profDoc.data();
      const motherId = prof.motherId;
      const pregnancyId = prof.pregnancyId;
      if (!motherId || !Array.isArray(prof.tdDoses) || prof.tdDoses.length === 0) continue;

      const tdSchedule = calculateMaternalTdSchedule(prof.tdDoses);

      // Clear reminders for completed doses
      for (const d of tdSchedule.completedDoses) {
        const completedKey = `td_preg_${pregnancyId}_dose_${d.doseNumber}`;
        const priorRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', completedKey)
          .get();
        for (const r of priorRem.docs) {
          if (!r.data().completed) {
            await r.ref.update({ completed: true, updatedAt: new Date().toISOString() });
            summary.remindersCompleted++;
          }
        }
      }

      // Schedule next due dose
      if (tdSchedule.nextDoseNumber && tdSchedule.nextDoseScheduledDate) {
        const dueDate = tdSchedule.nextDoseScheduledDate;
        const isPast = dueDate < todayStr;
        const sourceKey = `td_preg_${pregnancyId}_dose_${tdSchedule.nextDoseNumber}`;

        const existingRem = await adminDb
          .collection('reminders')
          .where('userId', '==', motherId)
          .where('sourceEventId', '==', sourceKey)
          .limit(1)
          .get();

        const tdPayload = {
          userId: motherId,
          pregnancyId,
          title: isPast
            ? `OVERDUE: Maternal Td Immunization (Dose ${tdSchedule.nextDoseNumber})`
            : `Upcoming: Maternal Td Immunization (Dose ${tdSchedule.nextDoseNumber})`,
          description: `MOH Handbook pp.10-11 schedule. Tetanus-Diphtheria protection: ${tdSchedule.protectionStatus}.`,
          dueDate,
          category: 'clinical',
          type: 'maternal_td',
          sourceEventId: sourceKey,
          completed: false,
          verified: true,
          pushEligible: true,
          deepLink: 'records',
          updatedAt: new Date().toISOString(),
        };

        if (existingRem.empty) {
          await adminDb.collection('reminders').add({
            ...tdPayload,
            createdAt: new Date().toISOString(),
          });
          summary.remindersCreated++;
        } else if (!existingRem.docs[0].data().completed) {
          await existingRem.docs[0].ref.update(tdPayload);
          summary.remindersUpdated++;
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
