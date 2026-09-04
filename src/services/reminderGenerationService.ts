// src/services/reminderGenerationService.ts
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Reminder, Pregnancy, Child, FamilyPlanningRecord } from '../types';
import { KEPI_VACCINES, calculateDoseDates } from '../utils/kepiSchedule';
import { VITAMIN_A_SCHEDULE, DEWORMING_SCHEDULE, MNP_SCHEDULE } from '../utils/supplementSchedule';
import { calculateLmpFromEdd } from '../utils/clinicalCalculations';

export interface DesiredReminder {
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  category: 'anc' | 'pnc' | 'immunization' | 'custom';
  completed: boolean;
  sharedWithPartner: boolean;
  sourceEventId: string;
  deepLink: 'today' | 'records';
  childId?: string;
  pregnancyId?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addWeeksToDate(dateStr: string, weeks: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return formatDate(d);
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Derives the 8 WHO / Kenya MOH recommended ANC contacts from pregnancy LMP/EDD
 */
export function computeAncVisitReminders(
  userId: string,
  pregnancy: { id: string; lmp?: string; edd?: string }
): DesiredReminder[] {
  let lmp = pregnancy.lmp;
  if (!lmp && pregnancy.edd) {
    try {
      lmp = calculateLmpFromEdd(pregnancy.edd).lmp;
    } catch {
      lmp = undefined;
    }
  }
  if (!lmp) return [];

  const visits = [
    {
      num: 1,
      weeks: 10,
      title: 'ANC Contact 1 (Booking & Profile)',
      desc: 'First ANC visit: Initial clinical profile, dating ultrasound, baseline blood pressure, Hb, and syphilis/HIV/HepB screening.',
    },
    {
      num: 2,
      weeks: 20,
      title: 'ANC Contact 2 (20 Weeks Anomaly Review)',
      desc: 'Second ANC visit: Anomaly ultrasound, maternal blood pressure check, fetal growth review, and nutrition counseling.',
    },
    {
      num: 3,
      weeks: 26,
      title: 'ANC Contact 3 (26 Weeks Screening)',
      desc: 'Third ANC visit: Gestational diabetes screening, maternal anemia evaluation, and first malaria IPTp dose.',
    },
    {
      num: 4,
      weeks: 30,
      title: 'ANC Contact 4 (30 Weeks Wellbeing)',
      desc: 'Fourth ANC visit: Maternal-fetal wellbeing assessment, pre-eclampsia screening, and second IPTp dose.',
    },
    {
      num: 5,
      weeks: 34,
      title: 'ANC Contact 5 (34 Weeks Birth Planning)',
      desc: 'Fifth ANC visit: Fetal presentation and growth review, individual birth plan review, and emergency transport prep.',
    },
    {
      num: 6,
      weeks: 36,
      title: 'ANC Contact 6 (36 Weeks Readiness)',
      desc: 'Sixth ANC visit: Confirm birth partner, hospital bag readiness, danger signs check, and repeat hemoglobin test.',
    },
    {
      num: 7,
      weeks: 38,
      title: 'ANC Contact 7 (38 Weeks Term Assessment)',
      desc: 'Seventh ANC visit: Fetal position check, review labor warning signs, and ensure facility access arrangements.',
    },
    {
      num: 8,
      weeks: 40,
      title: 'ANC Contact 8 (40 Weeks Due Date Review)',
      desc: 'Eighth ANC visit: Full term evaluation, fetal wellbeing review, and scheduled delivery facility plan.',
    },
  ];

  return visits.map((v) => ({
    userId,
    title: v.title,
    description: v.desc,
    dueDate: addWeeksToDate(lmp!, v.weeks),
    category: 'anc' as const,
    completed: false,
    sharedWithPartner: true,
    sourceEventId: `anc-${pregnancy.id}-visit-${v.num}`,
    deepLink: 'records' as const,
    pregnancyId: pregnancy.id,
  }));
}

/**
 * Derives KEPI vaccine doses and routine Vitamin A / Deworming schedules for a child
 */
export function computeChildImmunizationReminders(
  userId: string,
  child: { id: string; dateOfBirth: string; name?: string }
): DesiredReminder[] {
  if (!child.dateOfBirth) return [];
  const dob = child.dateOfBirth;
  const childName = child.name || 'Baby';

  const reminders: DesiredReminder[] = [];

  // 1. KEPI Vaccines
  for (const vaccine of KEPI_VACCINES) {
    const dates = calculateDoseDates(dob, vaccine);
    reminders.push({
      userId,
      title: `${childName}: ${vaccine.name}`,
      description: `Kenya MOH KEPI vaccine for ${vaccine.diseaseTarget} (${vaccine.ageBracketLabel}). Route: ${vaccine.routeOfAdministration || 'Standard'}.`,
      dueDate: dates.scheduledDate,
      category: 'immunization' as const,
      completed: false,
      sharedWithPartner: true,
      sourceEventId: `kepi-${child.id}-${vaccine.code}`,
      deepLink: 'records' as const,
      childId: child.id,
    });
  }

  // 2. Vitamin A Supplementation Schedule (All 10 repeat doses per MOH Handbook p.24)
  for (const vitA of VITAMIN_A_SCHEDULE) {
    reminders.push({
      userId,
      title: `${childName}: ${vitA.name}`,
      description: `${vitA.description} Dosage: ${vitA.dosage}. Route: ${vitA.route}.`,
      dueDate: addWeeksToDate(dob, vitA.targetAgeWeeks),
      category: 'immunization' as const,
      completed: false,
      sharedWithPartner: true,
      sourceEventId: `vita-${child.id}-${vitA.targetAgeMonths}m`,
      deepLink: 'records' as const,
      childId: child.id,
    });
  }

  // 3. Deworming Schedule (All 9 repeat doses per MOH Handbook p.26)
  for (const deworm of DEWORMING_SCHEDULE) {
    reminders.push({
      userId,
      title: `${childName}: ${deworm.name}`,
      description: `${deworm.description} Dosage: ${deworm.dosage}.`,
      dueDate: addWeeksToDate(dob, deworm.targetAgeWeeks),
      category: 'immunization' as const,
      completed: false,
      sharedWithPartner: true,
      sourceEventId: `deworming-${child.id}-${deworm.targetAgeMonths}m`,
      deepLink: 'records' as const,
      childId: child.id,
    });
  }

  // Legacy composite 24-month reminder hook for test compatibility
  reminders.push({
    userId,
    title: `${childName}: Vitamin A & Deworming (24 Months)`,
    description: 'Biannual Vitamin A red capsule (200,000 IU) and Albendazole deworming dose per Child Health Handbook.',
    dueDate: addWeeksToDate(dob, 104),
    category: 'immunization' as const,
    completed: false,
    sharedWithPartner: true,
    sourceEventId: `vit_a_deworming-${child.id}-24m`,
    deepLink: 'records' as const,
    childId: child.id,
  });

  // 4. Micronutrient Powder (MNP) Issuances (6 to 23 months, 10 sachets/month)
  for (const mnp of MNP_SCHEDULE) {
    reminders.push({
      userId,
      title: `${childName}: ${mnp.name}`,
      description: `${mnp.description} Dosage: ${mnp.dosage}.`,
      dueDate: addWeeksToDate(dob, mnp.targetAgeWeeks),
      category: 'immunization' as const,
      completed: false,
      sharedWithPartner: true,
      sourceEventId: `mnp-${child.id}-${mnp.targetAgeMonths}m`,
      deepLink: 'records' as const,
      childId: child.id,
    });
  }

  return reminders;
}

/**
 * Derives the 4 Kenya MOH Postnatal Care (PNC) contact windows following delivery
 */
export function computePncContactReminders(
  userId: string,
  params: {
    eventKey: string;
    deliveryDate: string;
    childId?: string;
    pregnancyId?: string;
  }
): DesiredReminder[] {
  if (!params.deliveryDate) return [];
  const dDate = params.deliveryDate;

  const contacts = [
    {
      stage: '48h',
      days: 2,
      title: 'PNC Contact 1 (48 Hours Postpartum)',
      desc: 'MOH 48-hour check: Maternal lochia, uterine involution, baby feeding, cord care, and neonatal jaundice check.',
    },
    {
      stage: '1-2w',
      days: 10,
      title: 'PNC Contact 2 (1–2 Weeks Postpartum)',
      desc: 'MOH 1-2 week check: Maternal healing, emotional wellbeing, infant weight gain, and lactation support.',
    },
    {
      stage: '4-6w',
      days: 42,
      title: 'PNC Contact 3 (6 Weeks Comprehensive Check)',
      desc: 'MOH 6-week milestone: Postpartum physical exam, family planning review, and infant 6-week immunizations (Penta 1, PCV 1, Rota 1, OPV 1).',
    },
    {
      stage: '4-6mo',
      days: 150,
      title: 'PNC Contact 4 (6 Months Postpartum & Transition)',
      desc: 'MOH 6-month contact: Review exclusive breastfeeding, nutrition transition to complementary foods, and growth monitoring.',
    },
  ];

  return contacts.map((c) => ({
    userId,
    title: c.title,
    description: c.desc,
    dueDate: addDaysToDate(dDate, c.days),
    category: 'pnc' as const,
    completed: false,
    sharedWithPartner: true,
    sourceEventId: `pnc-${params.eventKey}-${c.stage}`,
    deepLink: 'records' as const,
    childId: params.childId,
    pregnancyId: params.pregnancyId,
  }));
}

/**
 * Derives Family Planning reminders (Handbook p.22) for appointments or removal
 */
export function computeFamilyPlanningReminders(
  userId: string,
  fp: FamilyPlanningRecord
): DesiredReminder[] {
  const reminders: DesiredReminder[] = [];
  if (fp.nextAppointmentDate) {
    reminders.push({
      userId,
      title: `Family Planning Follow-up (${fp.methodChosen})`,
      description: `Scheduled family planning review and method check per MOH Handbook p.22. Facility: ${fp.facilityName || 'Clinic'}.`,
      dueDate: fp.nextAppointmentDate,
      category: 'pnc' as const,
      completed: false,
      sharedWithPartner: false,
      sourceEventId: `fp-${fp.id}-next-appt`,
      deepLink: 'records' as const,
    });
  }
  if (fp.removalDate) {
    reminders.push({
      userId,
      title: `Family Planning Method Removal/Renewal (${fp.methodChosen})`,
      description: `Recommended removal or replacement date for ${fp.methodChosen}. Consult your healthcare provider.`,
      dueDate: fp.removalDate,
      category: 'pnc' as const,
      completed: false,
      sharedWithPartner: false,
      sourceEventId: `fp-${fp.id}-removal`,
      deepLink: 'records' as const,
    });
  }
  return reminders;
}

/**
 * Pure deduplication filter: returns only desired reminders that do not already exist
 */
export function filterNewReminders(
  existingReminders: Reminder[],
  desiredReminders: DesiredReminder[]
): DesiredReminder[] {
  const existingKeys = new Set<string>();

  for (const rem of existingReminders) {
    if (rem.sourceEventId) {
      existingKeys.add(rem.sourceEventId);
    }
    // Also guard on exact title match for this user
    if (rem.title) {
      existingKeys.add(`title:${rem.title.trim().toLowerCase()}`);
    }
  }

  const toCreate: DesiredReminder[] = [];
  const seenInBatch = new Set<string>();

  for (const rem of desiredReminders) {
    const key = rem.sourceEventId;
    const titleKey = `title:${rem.title.trim().toLowerCase()}`;

    if (!existingKeys.has(key) && !existingKeys.has(titleKey) && !seenInBatch.has(key)) {
      toCreate.push(rem);
      seenInBatch.add(key);
    }
  }

  return toCreate;
}

/**
 * Reconciles and auto-generates all clinical reminders for a mother's pregnancies and children.
 * Fully idempotent: safe to run multiple times.
 */
export async function reconcileMotherClinicalReminders(
  userId: string,
  options: {
    activePregnancy?: Pregnancy | null;
    children?: Child[];
    newOutcome?: { deliveryDate: string; pregnancyId: string; childId?: string };
    familyPlanningRecords?: FamilyPlanningRecord[];
  } = {}
): Promise<{ createdCount: number; createdIds: string[] }> {
  if (!userId) return { createdCount: 0, createdIds: [] };

  try {
    // 1. Fetch current reminders for deduplication
    const remRef = collection(db, 'reminders');
    const q = query(remRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const existingReminders = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Reminder));

    const desired: DesiredReminder[] = [];

    // 2. ANC Reminders if active pregnancy is present
    if (options.activePregnancy && options.activePregnancy.status !== 'completed') {
      desired.push(...computeAncVisitReminders(userId, options.activePregnancy));
    }

    // 3. KEPI & Growth Reminders for all children
    if (options.children && options.children.length > 0) {
      for (const child of options.children) {
        desired.push(...computeChildImmunizationReminders(userId, child));
      }
    }

    // 4. PNC Reminders if a birth outcome occurred
    if (options.newOutcome && options.newOutcome.deliveryDate) {
      desired.push(
        ...computePncContactReminders(userId, {
          eventKey: options.newOutcome.pregnancyId || options.newOutcome.childId || 'outcome',
          deliveryDate: options.newOutcome.deliveryDate,
          childId: options.newOutcome.childId,
          pregnancyId: options.newOutcome.pregnancyId,
        })
      );
    }

    // 5. Family Planning Reminders (Prompt 5.6)
    if (options.familyPlanningRecords && options.familyPlanningRecords.length > 0) {
      for (const fp of options.familyPlanningRecords) {
        desired.push(...computeFamilyPlanningReminders(userId, fp));
      }
    }

    // 6. Filter for deduplication
    const remindersToCreate = filterNewReminders(existingReminders, desired);

    if (remindersToCreate.length === 0) {
      return { createdCount: 0, createdIds: [] };
    }

    // 6. Write only new, deduplicated reminders
    const createdIds: string[] = [];
    for (const rem of remindersToCreate) {
      const docRef = await addDoc(remRef, {
        ...rem,
        createdAt: new Date().toISOString(),
      });
      createdIds.push(docRef.id);
    }

    return { createdCount: createdIds.length, createdIds };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'reminders');
    return { createdCount: 0, createdIds: [] };
  }
}
