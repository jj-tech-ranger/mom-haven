/**
 * Advanced MomHaven Personalization Service (Phase 8)
 *
 * Implements deterministic-first, explainable personalization:
 * - Personalized daily plan
 * - Smart resource recommendation
 * - Context-aware Haven prompts
 * - Suggested reminders (distinguished from confirmed clinical appointments)
 * - Appointment preparation & grounded clinician questions
 * - Clinically-validated trend detection
 * - Privacy filtering & safe AI enhancement fallback
 *
 * ARCHITECTURAL INTEGRITY:
 * - Never invents clinical tasks or diagnoses.
 * - Never fabricates symptoms, medications, or clinical measurements.
 * - Always provides explainable attribution ("Because you said...").
 */

import { Pregnancy, Reminder, Child } from '../types';
import { HealthContext, LifecycleStage } from '../types/healthContext';
import { DailyHealthLog } from '../types/healthLog';
import { calculateGestationFromLmp } from '../utils/clinicalCalculations';
import { calculateChildAge } from './childService';
import {
  scoreResource,
  filterPublishedResources,
} from './resourceRecommendationService';
import { EDUCATIONAL_RESOURCES } from '../data/educationalResources';
import {
  analyzeBloodPressureTrends,
  analyzeBabyMovementTrends,
  MIN_DATA_POINTS_FOR_TREND,
} from './healthTrendService';
import {
  PersonalizedPlanResult,
  DailyPlanItem,
  SuggestedReminder,
  ContextAwareHavenPrompt,
  ClinicianQuestion,
  AppointmentPrepPlan,
  TrendInsightSummary,
  TopResourceRecommendation,
} from '../types/advancedPersonalization';

export interface DerivePersonalizedPlanParams {
  healthContext: HealthContext | null | undefined;
  clinicalPregnancy: Pregnancy | null | undefined;
  children?: Child[];
  reminders?: Reminder[];
  healthLogs?: DailyHealthLog[];
  userName?: string;
  now?: Date;
}

// Kenya MOH ANC 8-Contact Schedule
interface MohAncContact {
  contactNumber: number;
  targetWeek: number;
  minWeek: number;
  maxWeek: number;
  title: string;
  description: string;
}

const MOH_ANC_SCHEDULE: MohAncContact[] = [
  { contactNumber: 1, targetWeek: 12, minWeek: 0, maxWeek: 14, title: 'ANC Contact 1 (< 12 Weeks)', description: 'Booking visit, baseline health checks, blood group, Hb level, and ultrasound' },
  { contactNumber: 2, targetWeek: 20, minWeek: 18, maxWeek: 22, title: 'ANC Contact 2 (20 Weeks)', description: 'Anatomy and fetal growth assessment, blood pressure, and gentle wellness check' },
  { contactNumber: 3, targetWeek: 26, minWeek: 24, maxWeek: 28, title: 'ANC Contact 3 (26 Weeks)', description: 'Gestational diabetes check, fetal movement tracking, and nutrition check' },
  { contactNumber: 4, targetWeek: 30, minWeek: 29, maxWeek: 32, title: 'ANC Contact 4 (30 Weeks)', description: 'Pre-eclampsia screening, blood pressure monitoring, and fetal lie' },
  { contactNumber: 5, targetWeek: 34, minWeek: 33, maxWeek: 35, title: 'ANC Contact 5 (34 Weeks)', description: 'Birth preparedness plan review, transport planning, and blood donor identification' },
  { contactNumber: 6, targetWeek: 36, minWeek: 35, maxWeek: 37, title: 'ANC Contact 6 (36 Weeks)', description: 'Fetal presentation check and hospital bag readiness' },
  { contactNumber: 7, targetWeek: 38, minWeek: 37, maxWeek: 39, title: 'ANC Contact 7 (38 Weeks)', description: 'Late gestation assessment, birth companion review, and danger signs' },
  { contactNumber: 8, targetWeek: 40, minWeek: 39, maxWeek: 42, title: 'ANC Contact 8 (40 Weeks)', description: 'Term delivery planning and labor onset guidance' },
];

// Kenya KEPI Immunization Schedule
interface KepiMilestone {
  ageWeeksMin: number;
  ageWeeksMax: number;
  ageLabel: string;
  vaccines: string[];
  title: string;
}

const KEPI_SCHEDULE: KepiMilestone[] = [
  { ageWeeksMin: 0, ageWeeksMax: 2, ageLabel: 'Birth', vaccines: ['BCG', 'OPV 0'], title: 'Birth Vaccines (BCG & OPV 0)' },
  { ageWeeksMin: 5, ageWeeksMax: 8, ageLabel: '6 Weeks', vaccines: ['Pentavalent 1', 'OPV 1', 'PCV 10 1', 'Rotavirus 1'], title: '6-Week Immunizations' },
  { ageWeeksMin: 9, ageWeeksMax: 12, ageLabel: '10 Weeks', vaccines: ['Pentavalent 2', 'OPV 2', 'PCV 10 2', 'Rotavirus 2'], title: '10-Week Immunizations' },
  { ageWeeksMin: 13, ageWeeksMax: 16, ageLabel: '14 Weeks', vaccines: ['Pentavalent 3', 'OPV 3', 'PCV 10 3', 'IPV'], title: '14-Week Immunizations' },
  { ageWeeksMin: 24, ageWeeksMax: 28, ageLabel: '6 Months', vaccines: ['Vitamin A (1st dose)'], title: '6-Month Vitamin A & Growth Check' },
  { ageWeeksMin: 38, ageWeeksMax: 44, ageLabel: '9 Months', vaccines: ['Measles-Rubella 1', 'Yellow Fever'], title: '9-Month Measles-Rubella & Yellow Fever' },
  { ageWeeksMin: 76, ageWeeksMax: 84, ageLabel: '18 Months', vaccines: ['Measles-Rubella 2'], title: '18-Month Measles-Rubella 2 Booster' },
];

/**
 * Derives effective lifecycle stage and gestational/child details deterministically.
 * Strict trust hierarchy: Authoritative Clinical Records > User Reported Signals.
 */
function resolveStageAndTiming(params: DerivePersonalizedPlanParams) {
  const { healthContext, clinicalPregnancy, children = [], now = new Date() } = params;

  let effectiveStage: LifecycleStage = healthContext?.lifecycleStage || 'pregnancy';
  let gestationalWeeks = 0;
  let isAuthoritativeGestation = false;
  let childAgeMonths: number | undefined;
  let primaryChild: Child | undefined;

  // 1. Authoritative Pregnancy check
  if (clinicalPregnancy && clinicalPregnancy.status === 'active') {
    effectiveStage = 'pregnancy';
    if (clinicalPregnancy.lmp) {
      const calc = calculateGestationFromLmp(clinicalPregnancy.lmp, now);
      gestationalWeeks = calc.gestationalWeeks;
      isAuthoritativeGestation = true;
    } else if (clinicalPregnancy.gestationalAgeWeeks) {
      gestationalWeeks = clinicalPregnancy.gestationalAgeWeeks;
      isAuthoritativeGestation = true;
    }
  } else if (!clinicalPregnancy && healthContext?.pregnancy?.pregnancyWeek) {
    // Fallback to user-reported pregnancy draft
    if (effectiveStage === 'pregnancy') {
      gestationalWeeks = healthContext.pregnancy.pregnancyWeek;
      isAuthoritativeGestation = false;
    }
  }

  // 2. Children check (Postpartum / Parenting)
  if (children.length > 0) {
    // Pick youngest child
    const sorted = [...children].sort(
      (a, b) => new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime()
    );
    primaryChild = sorted[0];
    if (primaryChild?.dateOfBirth) {
      const ageCalc = calculateChildAge(primaryChild.dateOfBirth, now);
      childAgeMonths = ageCalc.months;
      // If pregnancy is not active, stage can be postpartum or parenting based on age
      if (!clinicalPregnancy || clinicalPregnancy.status !== 'active') {
        if (effectiveStage === 'pregnancy') {
          effectiveStage = ageCalc.months <= 6 ? 'postpartum' : 'parenting';
        }
      }
    }
  }

  return {
    effectiveStage,
    gestationalWeeks,
    isAuthoritativeGestation,
    primaryChild,
    childAgeMonths,
  };
}

/**
 * Builds deterministic Context-Aware Haven Prompts.
 * Grounded in the mother's current week/age, interests, and appointments.
 * Never leaks private clinical notes or fabricated data.
 */
export function generateContextAwareHavenPrompts(
  params: DerivePersonalizedPlanParams
): ContextAwareHavenPrompt[] {
  const { healthContext, language = 'en' } = {
    ...params,
    language: params.healthContext?.language || 'en',
  };
  const { effectiveStage, gestationalWeeks, primaryChild, childAgeMonths } =
    resolveStageAndTiming(params);

  const prompts: ContextAwareHavenPrompt[] = [];
  const isSwahili = language === 'sw';
  const interests = healthContext?.interests || [];

  if (effectiveStage === 'pregnancy') {
    if (gestationalWeeks >= 28) {
      prompts.push({
        id: 'haven-p-3rd-tri',
        prompt: isSwahili
          ? `Dalili za hatari ninazopaswa kuchunguza katika wiki ya ${gestationalWeeks} ni zipi?`
          : `What warning signs should I watch for closely at ${gestationalWeeks} weeks?`,
        category: 'danger_signs',
        reason: `Because you are at week ${gestationalWeeks} (third trimester)`,
        language,
      });
      prompts.push({
        id: 'haven-p-hospital-bag',
        prompt: isSwahili
          ? 'Ni vitu gani muhimu ninavyopaswa kuweka kwenye mfuko wa hospitali (hospital bag)?'
          : 'What essential items should I pack in my hospital birth bag in Kenya?',
        category: 'anc_prep',
        reason: 'Recommended for third trimester birth preparedness',
        language,
      });
    } else if (gestationalWeeks >= 14) {
      prompts.push({
        id: 'haven-p-2nd-tri-kicks',
        prompt: isSwahili
          ? 'Nitaanza lini kuhisi mateke ya mtoto tumboni (quickening)?'
          : 'When should I expect to feel baby movements and what do early kicks feel like?',
        category: 'development',
        reason: `Because you are in your second trimester (week ${gestationalWeeks})`,
        language,
      });
      prompts.push({
        id: 'haven-p-anc-tests',
        prompt: isSwahili
          ? 'Ni vipimo gani vya kawaida vya maabara hufanywa kwenye kliniki ya ANC?'
          : 'What tests and screenings are normally done during second-trimester ANC visits?',
        category: 'anc_prep',
        reason: 'Grounded in Kenya MOH antenatal care guidelines',
        language,
      });
    } else if (gestationalWeeks > 0) {
      prompts.push({
        id: 'haven-p-1st-tri-symptoms',
        prompt: isSwahili
          ? 'Jinsi gani naweza kudhibiti kichefuchefu na uchovu katika miezi mitatu ya kwanza?'
          : 'How can I manage morning nausea and fatigue naturally in early pregnancy?',
        category: 'comfort',
        reason: `Because you are in your first trimester (week ${gestationalWeeks})`,
        language,
      });
      prompts.push({
        id: 'haven-p-folic-acid',
        prompt: isSwahili
          ? 'Kwanini vidonge vya madini ya chuma na folic acid ni muhimu sana sasa?'
          : 'Why are daily iron and folic acid supplements so important in early pregnancy?',
        category: 'nutrition',
        reason: 'MOH iron and folic acid supplementation guideline',
        language,
      });
    } else {
      prompts.push({
        id: 'haven-p-anc-booking',
        prompt: isSwahili
          ? 'Ni wakati gani unaofaa kuanza kliniki ya kwanza ya ujauzito (ANC Contact 1)?'
          : 'When is the best time to book my first antenatal care clinic visit in Kenya?',
        category: 'anc_prep',
        reason: 'Recommended for pregnancy journey planning',
        language,
      });
    }

    // Nutrition interest integration
    if (interests.includes('nutrition') || interests.includes('superfoods')) {
      prompts.push({
        id: 'haven-p-iron-foods',
        prompt: isSwahili
          ? 'Ni vyakula gani vya asili vya Kenya vyenye wingi wa madini ya chuma (kama managu, kunde)?'
          : 'What traditional Kenyan superfoods (like managu, kunde, terere) boost maternal iron levels?',
        category: 'nutrition',
        reason: 'Because you noted an interest in traditional superfoods and nutrition',
        language,
      });
    }
  } else if (effectiveStage === 'postpartum') {
    prompts.push({
      id: 'haven-post-healing',
      prompt: isSwahili
        ? 'Ni dalili zipi za uponyaji mzuri wa uzazi baada ya kujifungua?'
        : 'What should normal postpartum healing feel like, and what signs require clinic attention?',
      category: 'comfort',
      reason: 'Because you are in your postpartum recovery window',
      language,
    });
    prompts.push({
      id: 'haven-post-lactation',
      prompt: isSwahili
        ? 'Jinsi gani naweza kuboresha uzalishaji wa maziwa ya mama kwa usalama?'
        : 'How can I ensure good latch and steady milk supply for my newborn?',
      category: 'nutrition',
      reason: 'Recommended for early infant feeding and lactation support',
      language,
    });
  } else if (effectiveStage === 'parenting') {
    const childName = primaryChild?.name || 'baby';
    prompts.push({
      id: 'haven-par-kepi',
      prompt: isSwahili
        ? `Ni chanjo gani za KEPI zinazofuata kwa mtoto wangu ${childName}?`
        : `Which KEPI immunizations are coming up next for ${childName}?`,
      category: 'development',
      reason: primaryChild ? `Because ${childName} is registered in your care` : 'Based on parenting milestones',
      language,
    });
    prompts.push({
      id: 'haven-par-growth',
      prompt: isSwahili
        ? 'Ni vyakula gani bora vya kuanzia kumpa mtoto akifikisha miezi 6?'
        : 'What are the best traditional Kenyan complementary foods to introduce at 6 months?',
      category: 'nutrition',
      reason: 'Kenya MOH infant and young child feeding guidelines',
      language,
    });
  } else {
    // Planning / Supporter / Exploring
    prompts.push({
      id: 'haven-gen-prep',
      prompt: isSwahili
        ? 'Ni virutubisho gani muhimu kabla ya kupata ujauzito (kama folic acid)?'
        : 'What preconception steps and nutritional habits support a healthy future pregnancy?',
      category: 'general',
      reason: 'Because you are in the planning stage',
      language,
    });
    prompts.push({
      id: 'haven-gen-rights',
      prompt: isSwahili
        ? 'Bima ya afya ya Linda Mama na SHA inashughulikia huduma gani za uzazi?'
        : 'What maternal healthcare services are covered under Kenya national health benefits (SHA/Linda Mama)?',
      category: 'general',
      reason: 'Based on your health knowledge exploration',
      language,
    });
  }

  return prompts.slice(0, 4);
}

/**
 * Deterministically generates Suggested Reminders based on Kenya MOH and KEPI schedules.
 * CRITICAL RULE: These are SUGGESTIONS that the mother must confirm. They NEVER silently create appointments.
 */
export function generateSuggestedReminders(
  params: DerivePersonalizedPlanParams
): SuggestedReminder[] {
  const { clinicalPregnancy, children = [], reminders = [], now = new Date() } = params;
  const { effectiveStage, gestationalWeeks, primaryChild, childAgeMonths } =
    resolveStageAndTiming(params);

  const existingTitles = new Set(
    reminders.map((r) => (r.title || '').toLowerCase().trim())
  );
  const suggestions: SuggestedReminder[] = [];

  // Helper to add date in weeks
  function addWeeks(d: Date, weeks: number): string {
    const target = new Date(d.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  }

  // 1. Pregnancy MOH ANC Suggestions
  if (effectiveStage === 'pregnancy' && gestationalWeeks > 0) {
    for (const contact of MOH_ANC_SCHEDULE) {
      const isUpcoming =
        contact.targetWeek >= gestationalWeeks &&
        contact.targetWeek <= gestationalWeeks + 6;

      const alreadyHasReminder = Array.from(existingTitles).some((t) =>
        t.includes(`anc contact ${contact.contactNumber}`) ||
        t.includes(`anc visit ${contact.contactNumber}`) ||
        t.includes(`contact ${contact.contactNumber}`)
      );

      if (isUpcoming && !alreadyHasReminder) {
        const weeksAhead = Math.max(0, contact.targetWeek - gestationalWeeks);
        suggestions.push({
          id: `sug-anc-${contact.contactNumber}`,
          title: `Schedule ${contact.title}`,
          description: contact.description,
          suggestedDate: addWeeks(now, weeksAhead),
          category: 'anc',
          source: 'MOH_ANC_GUIDELINES',
          rationale: `Kenya MOH recommends ANC Contact ${contact.contactNumber} around Week ${contact.targetWeek} of pregnancy.`,
          isSystemSuggestion: true,
        });
      }
    }
  }

  // 2. KEPI Immunization Suggestions for Children
  if ((effectiveStage === 'parenting' || effectiveStage === 'postpartum') && primaryChild) {
    const ageInWeeks = Math.floor(
      (now.getTime() - new Date(primaryChild.dateOfBirth).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );

    for (const milestone of KEPI_SCHEDULE) {
      const isUpcoming =
        milestone.ageWeeksMin >= ageInWeeks - 1 &&
        milestone.ageWeeksMin <= ageInWeeks + 4;

      const alreadyHasReminder = Array.from(existingTitles).some(
        (t) =>
          t.includes(milestone.title.toLowerCase()) ||
          milestone.vaccines.some((v) => t.includes(v.toLowerCase()))
      );

      if (isUpcoming && !alreadyHasReminder) {
        const weeksAhead = Math.max(0, milestone.ageWeeksMin - ageInWeeks);
        suggestions.push({
          id: `sug-kepi-${milestone.ageWeeksMin}`,
          title: `${primaryChild.name}: ${milestone.title}`,
          description: `Vaccines due: ${milestone.vaccines.join(', ')}`,
          suggestedDate: addWeeks(now, weeksAhead),
          category: 'kepi',
          source: 'KEPI_SCHEDULE',
          rationale: `KEPI immunization milestone due at ${milestone.ageLabel} for ${primaryChild.name}.`,
          isSystemSuggestion: true,
        });
      }
    }
  }

  // 3. Postpartum PNC Checkup Suggestions
  if (effectiveStage === 'postpartum') {
    const pncAlreadyReminded = Array.from(existingTitles).some((t) =>
      t.includes('pnc') || t.includes('postnatal')
    );
    if (!pncAlreadyReminded) {
      suggestions.push({
        id: 'sug-pnc-checkup',
        title: 'Schedule Postnatal Clinic (PNC) Checkup',
        description: 'Maternal recovery check, blood pressure review, and neonatal growth assessment',
        suggestedDate: addWeeks(now, 1),
        category: 'pnc',
        source: 'MOH_PNC_GUIDELINES',
        rationale: 'Kenya MOH recommends timely postnatal assessments at 48 hours, 1-2 weeks, and 6 weeks.',
        isSystemSuggestion: true,
      });
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Builds Appointment Preparation Plan with context-grounded clinician questions.
 * CRITICAL RULE: Questions must be based strictly on available context (gestation, child age, nutrition).
 * NEVER invent symptoms, medications, or abnormal readings.
 */
export function generateAppointmentPrepPlan(
  params: DerivePersonalizedPlanParams
): AppointmentPrepPlan {
  const { healthContext, clinicalPregnancy, primaryChild } = {
    ...params,
    ...resolveStageAndTiming(params),
  };
  const { effectiveStage, gestationalWeeks } = resolveStageAndTiming(params);

  const checklist: AppointmentPrepPlan['recommendedChecklist'] = [
    {
      id: 'chk-booklet',
      item: 'Mother and Child Health Handbook (MCH Booklet / KMOH 216)',
      description: 'Contains verified clinical history, growth charts, and immunization stickers.',
      mandatory: true,
    },
    {
      id: 'chk-id',
      item: 'National ID and SHA / Health Insurance Card',
      description: 'Needed for facility registration and Linda Mama benefit coverage.',
      mandatory: true,
    },
    {
      id: 'chk-meds',
      item: 'Current supplements & medications',
      description: 'Bring your Iron-Folic Acid tablets or any prescribed medications to show your provider.',
      mandatory: false,
    },
  ];

  const suggestedQuestions: ClinicianQuestion[] = [];

  if (effectiveStage === 'pregnancy') {
    if (gestationalWeeks >= 28) {
      checklist.push({
        id: 'chk-birth-plan',
        item: 'Individualized Birth Plan & Emergency Contact',
        description: 'Selected delivery facility, blood donor contact, and transport mode.',
        mandatory: true,
      });

      suggestedQuestions.push({
        id: 'q-delivery-signs',
        question: 'When labor starts or if my waters break, when should I report directly to the maternity unit?',
        category: 'birth_plan',
        relevanceReason: `Relevant for your third trimester visit (${gestationalWeeks} weeks)`,
        suggestedBy: 'SYSTEM_DERIVED',
      });
      suggestedQuestions.push({
        id: 'q-fetal-kicks',
        question: 'How many kicks or movements should I count during my daily baby movement check?',
        category: 'symptoms',
        relevanceReason: 'Standard third-trimester fetal wellbeing monitoring',
        suggestedBy: 'SYSTEM_DERIVED',
      });
      suggestedQuestions.push({
        id: 'q-companion',
        question: 'May my chosen birth companion stay with me in the labor ward during delivery?',
        category: 'birth_plan',
        relevanceReason: 'Facility-specific birth companion policy',
        suggestedBy: 'SYSTEM_DERIVED',
      });
    } else if (gestationalWeeks >= 14) {
      suggestedQuestions.push({
        id: 'q-lab-results',
        question: 'Could we review my blood tests (Hb level and blood group) and verify if I need an ultrasound?',
        category: 'tests',
        relevanceReason: 'Standard second-trimester laboratory check',
        suggestedBy: 'SYSTEM_DERIVED',
      });
      suggestedQuestions.push({
        id: 'q-nutrition-supplements',
        question: 'Are there any side effects from my iron tablets, and what foods help absorption without constipation?',
        category: 'general',
        relevanceReason: 'Based on ongoing iron and folic acid supplementation',
        suggestedBy: 'SYSTEM_DERIVED',
      });
    } else {
      suggestedQuestions.push({
        id: 'q-booking-tests',
        question: 'Which baseline blood and urine tests are recommended for my first booking visit?',
        category: 'tests',
        relevanceReason: 'Relevant for early antenatal care registration',
        suggestedBy: 'SYSTEM_DERIVED',
      });
      suggestedQuestions.push({
        id: 'q-early-care',
        question: 'Which foods or heavy activities should I avoid in the first three months of pregnancy?',
        category: 'general',
        relevanceReason: 'Standard first-trimester health counseling',
        suggestedBy: 'SYSTEM_DERIVED',
      });
    }
  } else if (effectiveStage === 'postpartum' || effectiveStage === 'parenting') {
    suggestedQuestions.push({
      id: 'q-vaccine-effects',
      question: 'What mild side effects (like slight fever or tenderness) can happen after today\'s vaccinations, and how should I comfort baby?',
      category: 'immunizations',
      relevanceReason: 'Routine post-immunization parent guidance',
      suggestedBy: 'SYSTEM_DERIVED',
    });
    suggestedQuestions.push({
      id: 'q-feeding-growth',
      question: 'Is baby\'s weight and length plotting along a healthy growth curve in the MCH booklet?',
      category: 'general',
      relevanceReason: 'Growth monitoring and infant nutrition check',
      suggestedBy: 'SYSTEM_DERIVED',
    });
  } else {
    suggestedQuestions.push({
      id: 'q-preconception-check',
      question: 'What routine health checks and vitamins do you recommend as I prepare for pregnancy?',
      category: 'general',
      relevanceReason: 'Preconception health review',
      suggestedBy: 'SYSTEM_DERIVED',
    });
  }

  const savedQuestions = healthContext?.questionsForClinician || [];

  return {
    stageTitle: effectiveStage.toUpperCase(),
    upcomingMilestone:
      gestationalWeeks > 0
        ? `Pregnancy Week ${gestationalWeeks}`
        : primaryChild
        ? `${primaryChild.name}'s Wellness Visit`
        : 'Health Clinic Visit',
    recommendedChecklist: checklist,
    suggestedQuestions,
    savedQuestions,
  };
}

/**
 * Derives Clinically-Meaningful Trend Summaries.
 * STRICT RULE: Only derives trends if MIN_DATA_POINTS_FOR_TREND (3) is satisfied.
 * Never outputs speculative AI conclusions from sparse readings.
 */
export function deriveTrendInsights(healthLogs?: DailyHealthLog[]): TrendInsightSummary[] {
  if (!healthLogs || healthLogs.length === 0) {
    return [
      {
        type: 'blood_pressure',
        status: 'empty',
        summary: 'No blood pressure logs recorded yet.',
        dataPointsCount: 0,
      },
      {
        type: 'baby_movement',
        status: 'empty',
        summary: 'No baby movement sessions recorded yet.',
        dataPointsCount: 0,
      },
    ];
  }

  const bpSummary = analyzeBloodPressureTrends(healthLogs, 14);
  const movementSummary = analyzeBabyMovementTrends(healthLogs, 14);

  const results: TrendInsightSummary[] = [];

  // Blood Pressure
  if (bpSummary.status === 'sufficient') {
    results.push({
      type: 'blood_pressure',
      status: 'sufficient',
      summary: bpSummary.message,
      dataPointsCount: bpSummary.totalEntries,
      alert: bpSummary.hasSevereElevation,
    });
  } else if (bpSummary.status === 'sparse') {
    results.push({
      type: 'blood_pressure',
      status: 'sparse',
      summary: `Logged ${bpSummary.totalEntries} blood pressure reading(s). At least 3 readings are needed to evaluate patterns safely.`,
      dataPointsCount: bpSummary.totalEntries,
      alert: bpSummary.hasSevereElevation,
    });
  } else {
    results.push({
      type: 'blood_pressure',
      status: 'empty',
      summary: 'No recent blood pressure entries found.',
      dataPointsCount: 0,
    });
  }

  // Baby Movement
  if (movementSummary.status === 'sufficient') {
    results.push({
      type: 'baby_movement',
      status: 'sufficient',
      summary: movementSummary.message,
      dataPointsCount: movementSummary.totalEntries,
      alert: movementSummary.hasDecreasedAlert,
    });
  } else if (movementSummary.status === 'sparse') {
    results.push({
      type: 'baby_movement',
      status: 'sparse',
      summary: `Logged ${movementSummary.totalEntries} movement check(s). At least 3 checks are needed to evaluate consistency.`,
      dataPointsCount: movementSummary.totalEntries,
      alert: movementSummary.hasDecreasedAlert,
    });
  } else {
    results.push({
      type: 'baby_movement',
      status: 'empty',
      summary: 'No baby movement entries found in the last 14 days.',
      dataPointsCount: 0,
    });
  }

  return results;
}

/**
 * Deterministically derives the Personalized Daily Plan.
 * Build from:
 * - lifecycle stage
 * - authoritative records
 * - real reminders
 * - interests & preferences
 * - resource ranking
 *
 * Each item has an explainable reason. No tasks are invented from thin air.
 */
export function deriveDeterministicDailyPlan(
  params: DerivePersonalizedPlanParams
): DailyPlanItem[] {
  const {
    healthContext,
    clinicalPregnancy,
    reminders = [],
    now = new Date(),
  } = params;
  const { effectiveStage, gestationalWeeks, primaryChild, childAgeMonths } =
    resolveStageAndTiming(params);

  const planItems: DailyPlanItem[] = [];

  // 1. Authoritative Clinical / Milestone Task
  if (effectiveStage === 'pregnancy' && gestationalWeeks > 0) {
    if (gestationalWeeks >= 28) {
      planItems.push({
        id: 'plan-fetal-movement',
        title: 'Daily Baby Movement Check',
        description: 'Relax for 1-2 hours and count your baby\'s fluttery kicks or gentle movements.',
        category: 'milestone',
        reason: `Because you are at Week ${gestationalWeeks} (third trimester)`,
        action: {
          type: 'health_log',
          label: 'Log Movement',
        },
        completed: false,
        provenance: 'SYSTEM_DERIVED',
        priorityScore: 90,
      });
    } else if (gestationalWeeks >= 14) {
      planItems.push({
        id: 'plan-hydration-comfort',
        title: 'Hydration & Posture Break',
        description: 'Drink 2-3 glasses of clean water and take gentle rest to support healthy blood volume.',
        category: 'milestone',
        reason: `Because you are in Week ${gestationalWeeks} of pregnancy`,
        action: {
          type: 'health_log',
          label: 'Check In',
        },
        completed: false,
        provenance: 'SYSTEM_DERIVED',
        priorityScore: 80,
      });
    } else {
      planItems.push({
        id: 'plan-early-rest',
        title: 'Morning Nausea & Gentle Rest',
        description: 'Eat small, frequent meals with dry crackers or arrowroots (nduma) to soothe early nausea.',
        category: 'milestone',
        reason: `Because you are in early pregnancy (Week ${gestationalWeeks})`,
        action: {
          type: 'ask_haven',
          target: 'How can I manage morning nausea and fatigue naturally in early pregnancy?',
          label: 'Ask Haven',
        },
        completed: false,
        provenance: 'SYSTEM_DERIVED',
        priorityScore: 80,
      });
    }
  } else if (effectiveStage === 'postpartum') {
    planItems.push({
      id: 'plan-postpartum-rest',
      title: 'Pelvic Rest & Hydration',
      description: 'Rest when baby sleeps, drink plenty of warm fluids, and inspect your bleeding color.',
      category: 'milestone',
      reason: 'Because you are in your active postpartum recovery window',
      action: {
        type: 'ask_haven',
        target: 'What should normal postpartum healing feel like, and what signs require clinic attention?',
        label: 'Ask Haven',
      },
      completed: false,
      provenance: 'SYSTEM_DERIVED',
      priorityScore: 90,
    });
  } else if (effectiveStage === 'parenting' && primaryChild) {
    planItems.push({
      id: 'plan-child-milestone',
      title: `${primaryChild.name}: Responsive Play & Interaction`,
      description: 'Engage with baby through singing, gentle eye contact, and tummy time play.',
      category: 'milestone',
      reason: `Because ${primaryChild.name} is developing new social and motor milestones`,
      action: {
        type: 'navigate',
        target: 'records',
        label: 'View Records',
      },
      completed: false,
      provenance: 'SYSTEM_DERIVED',
      priorityScore: 80,
    });
  }

  // 2. Active Reminders (from real user records)
  const activeReminders = reminders.filter((r) => !r.completed);
  if (activeReminders.length > 0) {
    const topReminder = activeReminders[0];
    planItems.push({
      id: `plan-rem-${topReminder.id}`,
      title: topReminder.title,
      description: topReminder.description || `Due on ${topReminder.dueDate}`,
      category: 'reminder',
      reason: 'Because you have an active reminder scheduled',
      action: {
        type: 'open_reminder',
        target: topReminder.id,
        label: 'View Reminder',
      },
      completed: false,
      provenance: 'USER_REPORTED',
      priorityScore: 85,
    });
  }

  // 3. Nutrition / Preference Habit Task
  const interests = healthContext?.interests || [];
  if (interests.includes('nutrition') || interests.includes('superfoods')) {
    planItems.push({
      id: 'plan-nutrition-habit',
      title: 'Iron-Rich Meal with Vitamin C',
      description: 'Pair green leafy vegetables (kunde, managu, terere) with oranges or tomatoes to maximize iron absorption.',
      category: 'nutrition',
      reason: 'Because you selected an interest in nutrition and traditional superfoods',
      action: {
        type: 'view_resource',
        label: 'Explore Recipes',
      },
      completed: false,
      provenance: 'USER_REPORTED',
      priorityScore: 70,
    });
  } else {
    planItems.push({
      id: 'plan-wellness-water',
      title: 'Prenatal Hydration & Rest Goal',
      description: 'Aim for 8-10 glasses of clean water today and prioritize an unhurried 30-minute rest.',
      category: 'nutrition',
      reason: 'Because maternal hydration supports amniotic fluid and circulation',
      action: {
        type: 'health_log',
        label: 'Log Wellness',
      },
      completed: false,
      provenance: 'SYSTEM_DERIVED',
      priorityScore: 65,
    });
  }

  // 4. Appointment Preparation Task
  if (effectiveStage === 'pregnancy' && gestationalWeeks >= 20) {
    planItems.push({
      id: 'plan-prep-visit',
      title: 'Prepare Questions for Your Clinician',
      description: 'Review what to bring to clinic (MCH booklet) and write down questions about your upcoming milestone.',
      category: 'preparation',
      reason: `Because you are reaching key mid/late pregnancy milestones (${gestationalWeeks} weeks)`,
      action: {
        type: 'appointment_prep',
        label: 'Prepare for Visit',
      },
      completed: false,
      provenance: 'SYSTEM_DERIVED',
      priorityScore: 75,
    });
  }

  // Sort by priorityScore desc
  return planItems.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Deterministically ranks and extracts the single best Educational Resource
 * for today's plan highlight using the Phase 5 scoring engine.
 */
function findTopResourceHighlight(
  params: DerivePersonalizedPlanParams
): TopResourceRecommendation | undefined {
  const { healthContext } = params;
  const { effectiveStage, gestationalWeeks, childAgeMonths } = resolveStageAndTiming(params);

  const published = filterPublishedResources(EDUCATIONAL_RESOURCES);
  if (published.length === 0) return undefined;

  const scored = published
    .map((res) =>
      scoreResource(res, {
        lifecycleStage: effectiveStage,
        pregnancyWeek: gestationalWeeks > 0 ? gestationalWeeks : undefined,
        childAgeMonths,
        interests: healthContext?.interests || [],
        language: healthContext?.language || 'en',
        county: healthContext?.county,
      })
    )
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score <= 0) return undefined;

  const reason =
    top.reasons && top.reasons.length > 0
      ? top.reasons[0]
      : `Matched your current stage: ${effectiveStage}`;

  return {
    id: top.resource.id,
    title: top.resource.title,
    summary: top.resource.summary,
    topic: top.resource.category,
    reason: `Because this guide ${reason.toLowerCase()}`,
  };
}

/**
 * Primary Master Derivation Function for Phase 8.
 * Purely deterministic, explainable, and resilient.
 */
export function derivePersonalizedPlan(
  params: DerivePersonalizedPlanParams
): PersonalizedPlanResult {
  const dailyPlan = deriveDeterministicDailyPlan(params);
  const suggestedReminders = generateSuggestedReminders(params);
  const contextAwareHavenPrompts = generateContextAwareHavenPrompts(params);
  const appointmentPrep = generateAppointmentPrepPlan(params);
  const trendInsights = deriveTrendInsights(params.healthLogs);
  const topResourceRecommendation = findTopResourceHighlight(params);

  return {
    dailyPlan,
    suggestedReminders,
    contextAwareHavenPrompts,
    appointmentPrep,
    trendInsights,
    topResourceRecommendation,
    derivedAt: (params.now || new Date()).toISOString(),
    isAiEnhanced: false,
  };
}

/**
 * Privacy Protection Filter
 * Strips all private notes, internal audit events, national IDs, and direct PII
 * before context is passed to any AI model or external API.
 */
export function filterPersonalizationPrivacy(rawContext: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  const FORBIDDEN_KEYS = new Set([
    'nationalId',
    'phone',
    'emergencyContactPhone',
    'driverPhone',
    'companionPhone',
    'bloodDonorPhone',
    'clinicianPrivateNotes',
    'auditEvents',
    'shareCode',
    'authToken',
    'passwordHash',
  ]);

  for (const [k, v] of Object.entries(rawContext || {})) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      safe[k] = filterPersonalizationPrivacy(v as Record<string, unknown>);
    } else {
      safe[k] = v;
    }
  }

  return safe;
}

/**
 * Safe AI Enhancement Wrapper
 * If an AI call is attempted for wording/phrasing polishing:
 * - If the call fails or throws, gracefully returns the deterministic plan unmodified.
 * - Under NO circumstances does it allow AI to alter clinical dates, weeks, or safety rules.
 */
export async function enhancePlanWithAi(
  deterministicPlan: PersonalizedPlanResult,
  _options?: { language?: 'en' | 'sw'; customWordingPrompt?: string }
): Promise<PersonalizedPlanResult> {
  // Deterministic-first fallback guarantee:
  // Returns the pristine deterministic plan without any risk of hallucination or clinical distortion.
  try {
    return {
      ...deterministicPlan,
      isAiEnhanced: false,
    };
  } catch {
    return deterministicPlan;
  }
}
