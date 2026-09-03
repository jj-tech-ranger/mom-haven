// src/services/todayContextService.ts
/**
 * Today Context Derivation Engine (Phase 4)
 *
 * Combines:
 * - HealthContext (Personalization preferences, lifecycle stage, language, interests, county)
 * - Authoritative Clinical Records (Pregnancy, Children)
 * - Real Reminders (from reminderService)
 * - Current Date / Time
 * -> Derived TodayContext for the Today Dashboard.
 *
 * CRITICAL RULES:
 * 1. Authoritative clinical records ALWAYS take precedence over personalization drafts.
 * 2. Never invent fake appointments or fake clinical data (e.g. no hardcoded clinics or fake lab tests).
 * 3. Never diagnose based on user-reported context.
 * 4. Distinct, thoughtful support for all 6 canonical lifecycle stages:
 *    - pregnancy, postpartum, parenting, planning, supporter, exploring.
 */

import { Pregnancy, Reminder, Child } from '../types';
import { HealthContext, LifecycleStage } from '../types/healthContext';
import { calculateGestationFromLmp } from '../utils/clinicalCalculations';
import { calculateChildAge } from './childService';
import { PersonalizedPlanResult } from '../types/advancedPersonalization';
import { derivePersonalizedPlan } from './advancedPersonalizationService';

export interface TodayGreeting {
  salutation: string;
  name: string;
  fullGreeting: string;
  dateFormatted: string;
}

export interface BabySizeMilestone {
  size: string;
  emoji: string;
  fact: string;
}

export interface TodayHeroGestation {
  type: 'pregnancy';
  gestationalWeeks: number;
  trimester: 1 | 2 | 3;
  eddFormatted?: string;
  progressRatio: number;
  progressPercent: number;
  babySize: BabySizeMilestone;
  isAuthoritative: boolean;
  provenanceTag: 'VERIFIED' | 'USER_REPORTED';
  provenanceNote: string;
}

export interface TodayHeroPostpartum {
  type: 'postpartum';
  weeksPostpartum?: number;
  daysPostpartum?: number;
  childName?: string;
  childAgeFormatted?: string;
  headline: string;
  subheadline: string;
  provenanceNote: string;
}

export interface TodayHeroParenting {
  type: 'parenting';
  childName?: string;
  childAgeFormatted?: string;
  milestoneFocus: string;
  headline: string;
  subheadline: string;
  hasChildRecord: boolean;
}

export interface TodayHeroPlanning {
  type: 'planning';
  headline: string;
  subheadline: string;
  primaryFocus: string;
}

export interface TodayHeroSupporter {
  type: 'supporter';
  headline: string;
  subheadline: string;
  supportTip: string;
}

export interface TodayHeroExploring {
  type: 'exploring';
  headline: string;
  subheadline: string;
  learningFocus: string;
}

export type TodayHeroData =
  | TodayHeroGestation
  | TodayHeroPostpartum
  | TodayHeroParenting
  | TodayHeroPlanning
  | TodayHeroSupporter
  | TodayHeroExploring;

export interface TodayPriorityCard {
  id: string;
  title: string;
  description: string;
  badge?: string;
  category: 'reminder' | 'clinical' | 'education' | 'danger_sign' | 'action';
  iconType: 'calendar' | 'pill' | 'syringe' | 'baby' | 'heart' | 'shield' | 'alert' | 'book' | 'sparkles';
  accentColor: 'rose' | 'emerald' | 'purple' | 'amber' | 'blue';
  isAuthoritative?: boolean;
  actionLabel?: string;
  actionTab?: 'haven' | 'journey' | 'records' | 'profile';
  specialAction?: 'emergency' | 'askHaven';
  reminderRef?: Reminder;
}

export interface TodayQuickAction {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'sparkles' | 'plus' | 'shield' | 'alert' | 'book' | 'calendar';
  bgClass: string;
  textClass: string;
  actionTab?: 'haven' | 'journey' | 'records' | 'profile';
  specialAction?: 'emergency' | 'askHaven' | 'addVisit';
}

export interface TodayContext {
  greeting: TodayGreeting;
  lifecycleStage: LifecycleStage;
  stageTitle: string;
  hero: TodayHeroData;
  priorities: TodayPriorityCard[];
  quickActions: TodayQuickAction[];
  userInterests: string[];
  county?: string;
  language: 'en' | 'sw';
  hasAuthoritativeClinicalData: boolean;
  provenanceSummary: string;
  advancedPersonalization?: PersonalizedPlanResult;
}

export interface DeriveTodayContextParams {
  healthContext: HealthContext | null;
  clinicalPregnancy: Pregnancy | null;
  children?: Child[];
  reminders?: Reminder[];
  userName?: string;
  now?: Date;
}

// Deterministic baby milestones per Kenya & WHO obstetrics guidelines
export const BABY_SIZE_MILESTONES: Record<number, BabySizeMilestone> = {
  4: { size: 'a poppy seed', emoji: '🌱', fact: 'Blastocyst is implanting gently in the uterine lining.' },
  8: { size: 'a raspberry', emoji: '🫐', fact: 'Tiny fingers, toes and cardiac chambers are developing.' },
  12: { size: 'a plum', emoji: '🍑', fact: 'All vital organs are formed; reflexes are starting.' },
  16: { size: 'an avocado', emoji: '🥑', fact: 'Baby can move facial muscles and make gentle swimming movements.' },
  20: { size: 'a banana', emoji: '🍌', fact: 'Halfway milestone! You may begin to notice fluttery kicks (quickening).' },
  24: { size: 'an ear of corn', emoji: '🌽', fact: 'Baby can hear your voice, heartbeats and familiar ambient sounds.' },
  28: { size: 'an eggplant', emoji: '🍆', fact: 'Entering 3rd trimester! Baby practices breathing movements.' },
  32: { size: 'a butternut squash', emoji: '🥥', fact: 'Bones are fully developed, and baby is storing maternal calcium.' },
  36: { size: 'a papaya', emoji: '🍈', fact: 'Lungs and central nervous system are maturing rapidly for birth.' },
  40: { size: 'a small pumpkin', emoji: '🎃', fact: 'Full term! Baby is ready to be welcomed into the world.' },
};

export function getBabySizeForWeek(week: number): BabySizeMilestone {
  const availableWeeks = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  const closest = availableWeeks.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );
  return BABY_SIZE_MILESTONES[closest] || {
    size: 'an ear of corn',
    emoji: '🌽',
    fact: 'Baby is growing steadily and hearing sounds from the outside world.',
  };
}

export function formatContextDate(date: Date, lang: 'en' | 'sw' = 'en'): string {
  try {
    return date.toLocaleDateString(lang === 'sw' ? 'sw-KE' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return date.toDateString();
  }
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return 'Not recorded';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function deriveGreeting(
  name: string,
  lang: 'en' | 'sw',
  now: Date
): TodayGreeting {
  const hours = now.getHours();
  let salutation = 'Good morning';

  if (lang === 'sw') {
    if (hours < 12) salutation = 'Habari ya asubuhi';
    else if (hours < 17) salutation = 'Habari ya mchana';
    else salutation = 'Habari ya jioni';
  } else {
    if (hours < 12) salutation = 'Good morning';
    else if (hours < 17) salutation = 'Good afternoon';
    else salutation = 'Good evening';
  }

  const cleanName = name.trim() || (lang === 'sw' ? 'Mama' : 'Mama');

  return {
    salutation,
    name: cleanName,
    fullGreeting: `${salutation}, ${cleanName}`,
    dateFormatted: formatContextDate(now, lang),
  };
}

const STAGE_TITLES: Record<LifecycleStage, { en: string; sw: string }> = {
  pregnancy: { en: 'Pregnancy Journey', sw: 'Safari ya Ujauzito' },
  postpartum: { en: 'Postpartum Recovery', sw: 'Kupona Baada ya Kujifungua' },
  parenting: { en: 'Parenting Journey', sw: 'Safari ya Malezi' },
  planning: { en: 'Preconception Planning', sw: 'Maandalizi ya Ujauzito' },
  supporter: { en: 'Supporter & Partner Guide', sw: 'Mwongozo wa Mshirika' },
  exploring: { en: 'Maternal Health Learning', sw: 'Elimu ya Afya ya Uzazi' },
};

/**
 * Main Pure Derivation Function
 */
export function deriveTodayContext({
  healthContext,
  clinicalPregnancy,
  children = [],
  reminders = [],
  userName,
  now = new Date(),
}: DeriveTodayContextParams): TodayContext {
  const language = healthContext?.language || 'en';
  const rawStage = healthContext?.lifecycleStage || 'pregnancy';
  const lifecycleStage: LifecycleStage = rawStage;
  const stageTitle = STAGE_TITLES[lifecycleStage]?.[language] || STAGE_TITLES[lifecycleStage]?.en || 'MomHaven Home';

  const preferredName =
    healthContext?.preferredName?.trim() ||
    userName?.trim() ||
    (language === 'sw' ? 'Mama' : 'Mama');

  const greeting = deriveGreeting(preferredName, language, now);

  // 1. Resolve Hero Data
  let hero: TodayHeroData;
  let hasAuthoritativeClinicalData = false;

  if (lifecycleStage === 'pregnancy') {
    if (clinicalPregnancy) {
      hasAuthoritativeClinicalData = true;
      let weeks = clinicalPregnancy.gestationalAgeWeeks || 0;
      if (clinicalPregnancy.lmp) {
        const calc = calculateGestationFromLmp(clinicalPregnancy.lmp, now);
        weeks = calc.gestationalAgeWeeks;
      }
      weeks = Math.max(1, Math.min(42, weeks));
      const trimester: 1 | 2 | 3 = weeks >= 28 ? 3 : weeks >= 13 ? 2 : 1;
      const progressRatio = Math.min(1, Math.max(0.05, weeks / 40));
      const progressPercent = Math.round(progressRatio * 100);

      hero = {
        type: 'pregnancy',
        gestationalWeeks: weeks,
        trimester,
        eddFormatted: clinicalPregnancy.edd ? formatShortDate(clinicalPregnancy.edd) : undefined,
        progressRatio,
        progressPercent,
        babySize: getBabySizeForWeek(weeks),
        isAuthoritative: true,
        provenanceTag: 'VERIFIED',
        provenanceNote: 'Calculated from your verified clinical pregnancy record',
      };
    } else if (healthContext?.pregnancy?.pregnancyWeek) {
      // User-reported fallback
      const weeks = Math.max(1, Math.min(42, healthContext.pregnancy.pregnancyWeek));
      const trimester: 1 | 2 | 3 = weeks >= 28 ? 3 : weeks >= 13 ? 2 : 1;
      const progressRatio = Math.min(1, Math.max(0.05, weeks / 40));
      const progressPercent = Math.round(progressRatio * 100);

      hero = {
        type: 'pregnancy',
        gestationalWeeks: weeks,
        trimester,
        eddFormatted: healthContext.pregnancy.dueDate ? formatShortDate(healthContext.pregnancy.dueDate) : undefined,
        progressRatio,
        progressPercent,
        babySize: getBabySizeForWeek(weeks),
        isAuthoritative: false,
        provenanceTag: 'USER_REPORTED',
        provenanceNote: 'Based on your self-reported profile date (clinical record pending)',
      };
    } else {
      // Pregnancy stage without any dates yet
      hero = {
        type: 'pregnancy',
        gestationalWeeks: 0,
        trimester: 1,
        progressRatio: 0.1,
        progressPercent: 10,
        babySize: {
          size: 'a seed of new life',
          emoji: '🌱',
          fact: 'Recording your Last Menstrual Period (LMP) helps track weekly milestones accurately.',
        },
        isAuthoritative: false,
        provenanceTag: 'USER_REPORTED',
        provenanceNote: 'No pregnancy dates recorded yet',
      };
    }
  } else if (lifecycleStage === 'postpartum') {
    // Check if there is a recorded newborn or child
    const primaryChild = children[0];
    if (primaryChild?.dateOfBirth) {
      hasAuthoritativeClinicalData = true;
      const ageCalc = calculateChildAge(primaryChild.dateOfBirth);
      const weeks = Math.max(0, Math.floor(ageCalc.totalDays / 7));
      hero = {
        type: 'postpartum',
        weeksPostpartum: weeks,
        daysPostpartum: ageCalc.totalDays,
        childName: primaryChild.name,
        childAgeFormatted: ageCalc.ageFormatted,
        headline: weeks > 0 ? `Week ${weeks} Postpartum` : 'Early Postpartum Days',
        subheadline: `Caring for ${primaryChild.name || 'baby'} (${ageCalc.ageFormatted}) while gently supporting maternal recovery.`,
        provenanceNote: 'Postpartum guidance aligned with Kenya MOH postnatal standards',
      };
    } else {
      hero = {
        type: 'postpartum',
        headline: 'Postpartum Recovery',
        subheadline: 'Restoring strength, nourishing your body, and caring for emotional well-being.',
        provenanceNote: 'Maternal recovery guidelines per Kenya MOH protocols',
      };
    }
  } else if (lifecycleStage === 'parenting') {
    const primaryChild = children[0];
    if (primaryChild?.dateOfBirth) {
      hasAuthoritativeClinicalData = true;
      const ageCalc = calculateChildAge(primaryChild.dateOfBirth);
      let milestone = 'Active play, language development & nutritious meals';
      if (ageCalc.months < 6) {
        milestone = 'Exclusive breastfeeding & foundational infant motor reflexes';
      } else if (ageCalc.months < 12) {
        milestone = 'Complementary feeding initiation & interactive communication';
      } else if (ageCalc.months < 24) {
        milestone = 'First walking steps, vocabulary expansion & social exploration';
      }

      hero = {
        type: 'parenting',
        childName: primaryChild.name,
        childAgeFormatted: ageCalc.ageFormatted,
        milestoneFocus: milestone,
        headline: primaryChild.name ? `Parenting ${primaryChild.name}` : 'Parenting Journey',
        subheadline: `${primaryChild.name || 'Child'} is ${ageCalc.ageFormatted} · ${milestone}`,
        hasChildRecord: true,
      };
    } else {
      hero = {
        type: 'parenting',
        headline: 'Parenting & Child Wellness',
        subheadline: 'Track immunizations, developmental milestones, and healthy nutrition.',
        milestoneFocus: 'Comprehensive early childhood support',
        hasChildRecord: false,
      };
    }
  } else if (lifecycleStage === 'planning') {
    hero = {
      type: 'planning',
      headline: 'Preconception Care',
      subheadline: 'Fostering optimal maternal wellness, nutrition, and lifestyle habits before pregnancy.',
      primaryFocus: 'Folic acid supplementation, balanced meals & baseline health reviews',
    };
  } else if (lifecycleStage === 'supporter') {
    hero = {
      type: 'supporter',
      headline: 'Supporter & Companion Hub',
      subheadline: 'Standing beside a mother with practical care, watchful awareness, and steady encouragement.',
      supportTip: 'Ask how she is resting today, stay alert to emergency danger signs, and assist with daily chores.',
    };
  } else {
    // Exploring
    hero = {
      type: 'exploring',
      headline: 'Maternal Health Learning',
      subheadline: 'Access verified maternal health knowledge, Kenya MOH guidance, and confidential answers from Haven.',
      learningFocus: 'Pregnancy milestones, birth preparedness rights & newborn essentials',
    };
  }

  // 2. Build Priorities ("What matters today")
  // Rule: Surface real reminders first (if any exist in Firestore).
  // If no reminders exist, provide 2–4 high-yield, deterministic cards tailored to stage, clinical record, and interests.
  // NEVER fabricate fake appointment records!
  const priorities: TodayPriorityCard[] = [];

  // Real Reminders from reminderService
  const uncompletedReminders = reminders.filter(r => !r.completed);
  for (const rem of uncompletedReminders.slice(0, 2)) {
    priorities.push({
      id: `reminder-${rem.id}`,
      title: rem.title,
      description: rem.dueDate ? `Scheduled for: ${formatShortDate(rem.dueDate)}` : (rem.description || 'Upcoming routine reminder'),
      badge: 'Reminder',
      category: 'reminder',
      iconType: rem.category === 'anc' ? 'calendar' : rem.category === 'pnc' ? 'baby' : rem.category === 'immunization' ? 'syringe' : 'calendar',
      accentColor: rem.category === 'anc' ? 'purple' : rem.category === 'pnc' ? 'emerald' : 'blue',
      isAuthoritative: true,
      actionTab: 'records',
      reminderRef: rem,
    });
  }

  // Complement up to 3 or 4 cards with deterministic, non-fake guidance based on stage
  if (lifecycleStage === 'pregnancy') {
    const currentWeek = hero.type === 'pregnancy' ? hero.gestationalWeeks : 20;

    // A. ANC Milestones from Kenya MOH
    if (priorities.length < 3) {
      let ancGuidelineTitle = 'MOH Recommended ANC Schedule';
      let ancGuidelineDesc = 'Kenya MOH recommends 8 focused contacts across your pregnancy.';

      if (currentWeek <= 12) {
        ancGuidelineTitle = 'ANC Contact 1: First Trimester';
        ancGuidelineDesc = 'Comprehensive baseline labs, ultrasound dating, and IFAS initiation.';
      } else if (currentWeek <= 20) {
        ancGuidelineTitle = 'ANC Contact 2: Week 20 Window';
        ancGuidelineDesc = 'Fetal anomaly check, blood pressure review, and maternal weight assessment.';
      } else if (currentWeek <= 26) {
        ancGuidelineTitle = 'ANC Contact 3: Week 26 Window';
        ancGuidelineDesc = 'Gestational diabetes check, IPTp-SP dose for malaria prevention.';
      } else if (currentWeek <= 30) {
        ancGuidelineTitle = 'ANC Contact 4: Week 30 Window';
        ancGuidelineDesc = 'Fetal growth check, second IPTp dose, and hemoglobin monitoring.';
      } else if (currentWeek <= 34) {
        ancGuidelineTitle = 'ANC Contact 5: Week 34 Window';
        ancGuidelineDesc = 'Birth preparedness review, partner involvement, and facility selection.';
      } else if (currentWeek <= 36) {
        ancGuidelineTitle = 'ANC Contact 6: Week 36 Window';
        ancGuidelineDesc = 'Fetal presentation check, danger signs review, and transport planning.';
      } else {
        ancGuidelineTitle = 'ANC Contact 7 & 8: Term Care';
        ancGuidelineDesc = 'Weekly monitoring, labor onset signs, and emergency contact readiness.';
      }

      priorities.push({
        id: 'guideline-anc',
        title: ancGuidelineTitle,
        description: `${ancGuidelineDesc} (Kenya MOH Guidelines)`,
        badge: 'Clinical Guideline',
        category: 'clinical',
        iconType: 'calendar',
        accentColor: 'purple',
        actionLabel: 'View journey',
        actionTab: 'journey',
      });
    }

    // B. Daily IFAS / Nutrition Guidance
    if (priorities.length < 3) {
      priorities.push({
        id: 'guideline-ifas',
        title: 'Daily Iron & Folic Acid (IFAS)',
        description: 'Take 1 tablet daily with clean water or citrus juice (avoid tea or milk 2 hours before/after). Boost with iron-rich foods.',
        badge: 'Daily Routine',
        category: 'education',
        iconType: 'pill',
        accentColor: 'emerald',
        actionLabel: 'Ask Haven',
        specialAction: 'askHaven',
      });
    }

    // C. Emergency Danger Signs Warning
    if (priorities.length < 4) {
      priorities.push({
        id: 'guideline-danger',
        title: 'MOH Emergency Danger Signs',
        description: 'Seek hospital care immediately for vaginal bleeding, severe headache with blurred vision, sudden facial swelling, or stopped baby kicks.',
        badge: 'Safety First',
        category: 'danger_sign',
        iconType: 'alert',
        accentColor: 'rose',
        actionLabel: 'Emergency Guide',
        specialAction: 'emergency',
      });
    }
  } else if (lifecycleStage === 'postpartum') {
    // Postpartum priorities
    if (priorities.length < 3) {
      priorities.push({
        id: 'postpartum-danger',
        title: 'Postpartum Red Flags (PPH & Sepsis)',
        description: 'Seek emergency care for heavy bleeding (soaking 2+ sanitary pads in 1 hour), high fever, foul lochia, or severe calf swelling.',
        badge: 'Safety Alert',
        category: 'danger_sign',
        iconType: 'alert',
        accentColor: 'rose',
        actionLabel: 'Emergency Guide',
        specialAction: 'emergency',
      });
    }

    if (priorities.length < 3) {
      priorities.push({
        id: 'postpartum-ebf',
        title: 'Exclusive Breastfeeding & Hydration',
        description: 'Feed on demand (8–12 times daily). Drink plenty of clean water and warm fluids to maintain hydration and milk production.',
        badge: 'Infant Nutrition',
        category: 'education',
        iconType: 'baby',
        accentColor: 'emerald',
        actionLabel: 'Ask Haven',
        specialAction: 'askHaven',
      });
    }

    if (priorities.length < 4) {
      priorities.push({
        id: 'postpartum-pnc',
        title: 'Postnatal Clinic Check (PNC)',
        description: 'Kenya MOH recommends maternal and newborn checks at 48 hours, 1–2 weeks, and 6 weeks after delivery for healing and infant vaccines.',
        badge: 'Clinical Schedule',
        category: 'clinical',
        iconType: 'calendar',
        accentColor: 'purple',
        actionLabel: 'View records',
        actionTab: 'records',
      });
    }
  } else if (lifecycleStage === 'parenting') {
    // Parenting priorities
    if (priorities.length < 3) {
      priorities.push({
        id: 'parenting-kepi',
        title: 'KEPI Immunization Schedule',
        description: 'Ensure vaccines are up to date: BCG at birth, Pentavalent/Polio at 6, 10, 14 weeks, and Measles-Rubella at 9 & 18 months.',
        badge: 'Immunization',
        category: 'clinical',
        iconType: 'syringe',
        accentColor: 'purple',
        actionLabel: 'View records',
        actionTab: 'records',
      });
    }

    if (priorities.length < 3) {
      priorities.push({
        id: 'parenting-danger',
        title: 'Under-5 Emergency Danger Signs',
        description: 'Seek urgent hospital care if child has difficulty breathing, chest indrawing, convulsions, vomiting everything, or extreme lethargy.',
        badge: 'Child Safety',
        category: 'danger_sign',
        iconType: 'alert',
        accentColor: 'rose',
        actionLabel: 'Emergency Guide',
        specialAction: 'emergency',
      });
    }

    if (priorities.length < 4) {
      priorities.push({
        id: 'parenting-growth',
        title: 'Growth & Nutrition Monitoring',
        description: 'Regular monthly growth and MUAC assessments help detect early nutritional changes and support healthy development.',
        badge: 'Growth Tracking',
        category: 'education',
        iconType: 'heart',
        accentColor: 'emerald',
        actionLabel: 'Ask Haven',
        specialAction: 'askHaven',
      });
    }
  } else if (lifecycleStage === 'planning') {
    // Planning priorities
    priorities.push({
      id: 'planning-folic',
      title: 'Preconception Folic Acid (400 mcg)',
      description: 'Taking daily folic acid at least 1 month before conception significantly reduces the risk of neural tube defects.',
      badge: 'Daily Habit',
      category: 'education',
      iconType: 'pill',
      accentColor: 'emerald',
      actionLabel: 'Ask Haven',
      specialAction: 'askHaven',
    });

    priorities.push({
      id: 'planning-checkup',
      title: 'Preconception Clinical Consultation',
      description: 'Review blood pressure, blood group, rhesus factor, sickle cell screening, and chronic medication safety with a clinician.',
      badge: 'Healthcare Step',
      category: 'clinical',
      iconType: 'shield',
      accentColor: 'purple',
      actionLabel: 'Ask Haven',
      specialAction: 'askHaven',
    });

    priorities.push({
      id: 'planning-facilities',
      title: 'Maternal Facilities & Linda Mama / SHA',
      description: 'Explore accredited maternity health facilities nearby and ensure your SHA / NHIF enrollment is active.',
      badge: 'Facility Planning',
      category: 'education',
      iconType: 'book',
      accentColor: 'blue',
      actionLabel: 'Ask Haven',
      specialAction: 'askHaven',
    });
  } else if (lifecycleStage === 'supporter') {
    // Supporter priorities
    priorities.push({
      id: 'supporter-actions',
      title: 'Daily Practical Support',
      description: 'Take charge of heavy household lifting, prepare clean drinking water and nourishing meals, and protect her sleep.',
      badge: 'Practical Care',
      category: 'action',
      iconType: 'heart',
      accentColor: 'emerald',
      actionLabel: 'Ask Haven',
      specialAction: 'askHaven',
    });

    priorities.push({
      id: 'supporter-danger',
      title: 'Emergency Awareness for Partners',
      description: 'Memorize maternal danger signs: sudden severe headaches, convulsions, breathlessness, and heavy bleeding require immediate hospital transport.',
      badge: 'Critical Awareness',
      category: 'danger_sign',
      iconType: 'alert',
      accentColor: 'rose',
      actionLabel: 'Emergency Guide',
      specialAction: 'emergency',
    });

    priorities.push({
      id: 'supporter-clinic',
      title: 'Clinic Attendance & Privacy',
      description: 'Accompany her to clinical appointments when requested, respect her healthcare decisions, and safeguard her medical privacy.',
      badge: 'Companion Care',
      category: 'education',
      iconType: 'shield',
      accentColor: 'purple',
      actionLabel: 'Ask Haven',
      specialAction: 'askHaven',
    });
  } else {
    // Exploring priorities
    priorities.push({
      id: 'exploring-moh',
      title: 'Kenya MOH Maternal Health Rights',
      description: 'Understand the standard of care for maternity, free delivery under Linda Mama / SHA, and the 8 ANC contact schedule.',
      badge: 'Health Rights',
      category: 'education',
      iconType: 'book',
      accentColor: 'blue',
      actionLabel: 'Ask Haven',
      specialAction: 'askHaven',
    });

    priorities.push({
      id: 'exploring-ask',
      title: 'Ask Haven Without Judgment',
      description: 'Get confidential, medically verified answers on reproductive health, menstrual cycles, and pregnancy signs.',
      badge: 'AI Companion',
      category: 'education',
      iconType: 'sparkles',
      accentColor: 'purple',
      actionLabel: 'Talk to Haven',
      specialAction: 'askHaven',
    });

    priorities.push({
      id: 'exploring-danger',
      title: 'Maternal Danger Signs Knowledge',
      description: 'Recognizing obstetric red flags saves lives. Learn the warning signs that demand immediate medical attention.',
      badge: 'Essential Knowledge',
      category: 'danger_sign',
      iconType: 'alert',
      accentColor: 'rose',
      actionLabel: 'Emergency Guide',
      specialAction: 'emergency',
    });
  }

  // 3. Quick Actions Tailored to Stage
  let quickActions: TodayQuickAction[] = [
    {
      id: 'action-haven',
      title: 'Ask Haven',
      subtitle: 'Clinical companion',
      iconType: 'sparkles',
      bgClass: 'bg-[var(--lavender-100)]',
      textClass: 'text-[var(--haven-deep)]',
      specialAction: 'askHaven',
      actionTab: 'haven',
    },
  ];

  if (lifecycleStage === 'pregnancy') {
    quickActions.push(
      {
        id: 'action-anc',
        title: 'ANC Journey',
        subtitle: 'Contacts & records',
        iconType: 'calendar',
        bgClass: 'bg-purple-100',
        textClass: 'text-[var(--haven-deep)]',
        actionTab: 'journey',
      },
      {
        id: 'action-records',
        title: 'Health Vault',
        subtitle: 'Verified records',
        iconType: 'shield',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-700',
        actionTab: 'records',
      },
      {
        id: 'action-emergency',
        title: 'Emergency 1199',
        subtitle: 'Danger signs triage',
        iconType: 'alert',
        bgClass: 'bg-rose-100',
        textClass: 'text-rose-700',
        specialAction: 'emergency',
      }
    );
  } else if (lifecycleStage === 'postpartum' || lifecycleStage === 'parenting') {
    quickActions.push(
      {
        id: 'action-child',
        title: 'Child Health',
        subtitle: 'Vaccines & growth',
        iconType: 'plus',
        bgClass: 'bg-purple-100',
        textClass: 'text-[var(--haven-deep)]',
        actionTab: 'records',
      },
      {
        id: 'action-records',
        title: 'Health Vault',
        subtitle: 'Immunization card',
        iconType: 'shield',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-700',
        actionTab: 'records',
      },
      {
        id: 'action-emergency',
        title: 'Emergency 1199',
        subtitle: 'Under-5 & maternal',
        iconType: 'alert',
        bgClass: 'bg-rose-100',
        textClass: 'text-rose-700',
        specialAction: 'emergency',
      }
    );
  } else {
    quickActions.push(
      {
        id: 'action-guide',
        title: 'Health Topics',
        subtitle: 'Evidence-based guides',
        iconType: 'book',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-700',
        specialAction: 'askHaven',
      },
      {
        id: 'action-records',
        title: 'Health Vault',
        subtitle: 'Personal profile',
        iconType: 'shield',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-700',
        actionTab: 'records',
      },
      {
        id: 'action-emergency',
        title: 'Emergency 1199',
        subtitle: 'MOH emergency lines',
        iconType: 'alert',
        bgClass: 'bg-rose-100',
        textClass: 'text-rose-700',
        specialAction: 'emergency',
      }
    );
  }

  // Provenance Summary
  let provenanceSummary = 'Personalized for your daily journey.';
  if (hasAuthoritativeClinicalData) {
    provenanceSummary = 'Dates & milestones reflect your authoritative clinical records.';
  } else if (healthContext?.pregnancy?.pregnancyWeek) {
    provenanceSummary = 'Dates reflect your self-reported profile draft.';
  }

  const advancedPersonalization = derivePersonalizedPlan({
    healthContext,
    clinicalPregnancy,
    children,
    reminders,
    userName,
    now,
  });

  return {
    greeting,
    lifecycleStage,
    stageTitle,
    hero,
    priorities: priorities.slice(0, 4), // Cap at 4 cards max
    quickActions,
    userInterests: healthContext?.interests || [],
    county: healthContext?.county,
    language,
    hasAuthoritativeClinicalData,
    provenanceSummary,
    advancedPersonalization,
  };
}
