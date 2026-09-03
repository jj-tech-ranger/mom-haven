import {
  HealthLogType,
  HealthLogCategory,
  HealthLogValues,
  BloodPressureValues,
  WeightValues,
  SymptomsValues,
  BabyMovementValues,
  SleepValues,
  MoodValues,
  NutritionValues,
  ActivityValues,
  GeneralNotesValues,
  ClinicalSafetyAlert,
} from '../types/healthLog';
import { Provenance } from '../types';

export const MATERNAL_DANGER_SYMPTOMS = [
  { id: 'vaginal_bleeding', label: 'Vaginal bleeding or spotting', sw: 'Kutokwa na damu ukeni' },
  { id: 'severe_headache', label: 'Severe headache not relieved by rest', sw: 'Kuumwa kichwa sana' },
  { id: 'visual_changes', label: 'Blurred vision, flashes of light, or spots', sw: 'Kuona maluelue au kutoona vizuri' },
  { id: 'facial_swelling', label: 'Sudden swelling of face, hands, or feet', sw: 'Kuvimba uso, mikono au miguu ghafla' },
  { id: 'epigastric_pain', label: 'Severe upper stomach / epigastric pain', sw: 'Maumivu makali sehemu ya juu ya tumbo' },
  { id: 'fever_chills', label: 'High fever, severe chills, or shivering', sw: 'Homa kali au kutetemeka' },
  { id: 'fluid_leak', label: 'Water breaking / watery fluid leakage before labor', sw: 'Kuvuja maji ya uzazi' },
  { id: 'difficulty_breathing', label: 'Chest pain or difficulty breathing', sw: 'Kushindwa kupumua au maumivu ya kifua' },
  { id: 'convulsions', label: 'Convulsions, fits, or loss of consciousness', sw: 'Kupatwa na kifafa au degedege' },
] as const;

export const CATEGORY_BY_TYPE: Record<HealthLogType, HealthLogCategory> = {
  blood_pressure: 'CLINICAL_MEASUREMENT',
  weight: 'CLINICAL_MEASUREMENT',
  symptoms: 'CLINICAL_MEASUREMENT',
  baby_movement: 'CLINICAL_MEASUREMENT',
  mood: 'JOURNAL',
  sleep: 'JOURNAL',
  nutrition: 'JOURNAL',
  activity: 'JOURNAL',
  notes: 'JOURNAL',
};

export class HealthLogValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'HealthLogValidationError';
  }
}

/**
 * Validates timestamp: must be valid ISO and cannot be in the future (>10 min clock skew)
 */
export function validateLogTimestamp(timestampStr?: string): string {
  if (!timestampStr) {
    return new Date().toISOString();
  }
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) {
    throw new HealthLogValidationError('timestamp', 'Invalid date and time format.');
  }
  const maxAllowedFuture = Date.now() + 10 * 60 * 1000; // 10 minutes
  if (date.getTime() > maxAllowedFuture) {
    throw new HealthLogValidationError('timestamp', 'Log date and time cannot be in the future.');
  }
  // Also reject dates unreasonably far in the past (> 2 years)
  const minAllowedPast = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
  if (date.getTime() < minAllowedPast) {
    throw new HealthLogValidationError('timestamp', 'Log date cannot be older than two years.');
  }
  return date.toISOString();
}

/**
 * Validates and enforces user-reported provenance
 */
export function createSafeUserReportedProvenance(userId: string, enteredAt?: string): Provenance {
  return {
    status: 'REPORTED',
    enteredBy: userId,
    enteredAt: enteredAt || new Date().toISOString(),
    verifiedBy: null,
    verifiedAt: null,
  };
}

/**
 * Strips all undefined properties recursively from an object to ensure Firestore compatibility.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = stripUndefined(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Validates values by log type with strict physiological bounds
 */
export function validateHealthLogValues(type: HealthLogType, rawValues: any): HealthLogValues {
  if (!rawValues || typeof rawValues !== 'object') {
    throw new HealthLogValidationError('values', 'Log values must be a non-empty object.');
  }

  switch (type) {
    case 'blood_pressure': {
      const systolic = Number(rawValues.systolic);
      const diastolic = Number(rawValues.diastolic);
      const pulse = rawValues.pulse !== undefined && rawValues.pulse !== null && rawValues.pulse !== ''
        ? Number(rawValues.pulse)
        : undefined;

      if (isNaN(systolic) || systolic < 70 || systolic > 240) {
        throw new HealthLogValidationError(
          'systolic',
          'Systolic blood pressure must be between 70 and 240 mmHg.',
        );
      }
      if (isNaN(diastolic) || diastolic < 40 || diastolic > 150) {
        throw new HealthLogValidationError(
          'diastolic',
          'Diastolic blood pressure must be between 40 and 150 mmHg.',
        );
      }
      if (systolic <= diastolic) {
        throw new HealthLogValidationError(
          'blood_pressure',
          'Systolic reading must be higher than diastolic reading.',
        );
      }
      if (systolic - diastolic < 5) {
        throw new HealthLogValidationError(
          'blood_pressure',
          'Difference between systolic and diastolic pressure is physiologically too narrow.',
        );
      }
      if (pulse !== undefined && (isNaN(pulse) || pulse < 40 || pulse > 220)) {
        throw new HealthLogValidationError('pulse', 'Pulse must be between 40 and 220 beats per minute.');
      }

      const bpValues: BloodPressureValues = {
        systolic: Math.round(systolic),
        diastolic: Math.round(diastolic),
        pulse: pulse !== undefined ? Math.round(pulse) : undefined,
        arm: rawValues.arm === 'left' || rawValues.arm === 'right' ? rawValues.arm : undefined,
        restingMinutes: rawValues.restingMinutes ? Math.max(0, Math.min(60, Number(rawValues.restingMinutes))) : undefined,
      };
      return stripUndefined(bpValues);
    }

    case 'weight': {
      const weightKg = Number(rawValues.weightKg);
      if (isNaN(weightKg) || weightKg < 30 || weightKg > 200) {
        throw new HealthLogValidationError(
          'weightKg',
          'Weight must be a valid number between 30 and 200 kg.',
        );
      }
      const weightValues: WeightValues = {
        weightKg: Number(weightKg.toFixed(1)),
      };
      return weightValues;
    }

    case 'symptoms': {
      const symptoms = Array.isArray(rawValues.symptoms) ? rawValues.symptoms.map(String).filter(Boolean) : [];
      const severity = ['mild', 'moderate', 'severe'].includes(rawValues.severity)
        ? rawValues.severity
        : 'mild';

      const dangerSignIds = new Set(MATERNAL_DANGER_SYMPTOMS.map((d) => d.id));
      const detectedDanger = symptoms.filter((s: string) => dangerSignIds.has(s as any));
      const explicitDangerSigns = Array.isArray(rawValues.dangerSigns)
        ? rawValues.dangerSigns.filter((d: string) => dangerSignIds.has(d as any))
        : [];
      const allDangerSigns = Array.from(new Set([...detectedDanger, ...explicitDangerSigns]));

      const symptomValues: SymptomsValues = {
        symptoms,
        severity,
        hasDangerSigns: allDangerSigns.length > 0 || rawValues.hasDangerSigns === true,
        dangerSigns: allDangerSigns,
        durationDays: rawValues.durationDays ? Math.max(1, Math.min(60, Number(rawValues.durationDays))) : undefined,
      };
      return symptomValues;
    }

    case 'baby_movement': {
      const allowedPatterns = ['normal', 'active', 'decreased', 'none_felt'];
      const pattern = allowedPatterns.includes(rawValues.pattern) ? rawValues.pattern : 'normal';
      const movementCount = rawValues.movementCount !== undefined && rawValues.movementCount !== null && rawValues.movementCount !== ''
        ? Math.max(0, Math.min(200, Number(rawValues.movementCount)))
        : undefined;
      const durationMinutes = rawValues.durationMinutes
        ? Math.max(1, Math.min(360, Number(rawValues.durationMinutes)))
        : undefined;

      const movementValues: BabyMovementValues = {
        pattern,
        movementCount,
        durationMinutes,
      };
      return movementValues;
    }

    case 'sleep': {
      const hours = Number(rawValues.hours);
      if (isNaN(hours) || hours < 0.5 || hours > 24) {
        throw new HealthLogValidationError('hours', 'Sleep hours must be between 0.5 and 24 hours.');
      }
      const quality = ['rested', 'interrupted', 'poor'].includes(rawValues.quality)
        ? rawValues.quality
        : 'rested';

      const sleepValues: SleepValues = {
        hours: Number(hours.toFixed(1)),
        quality,
      };
      return sleepValues;
    }

    case 'mood': {
      const allowedMoods = ['calm', 'happy', 'tired', 'anxious', 'sad', 'overwhelmed'];
      const mood = allowedMoods.includes(rawValues.mood) ? rawValues.mood : 'calm';
      const energyLevel = rawValues.energyLevel ? Math.max(1, Math.min(5, Number(rawValues.energyLevel))) as any : undefined;

      const moodValues: MoodValues = {
        mood,
        energyLevel,
      };
      return moodValues;
    }

    case 'nutrition': {
      const hydrationGlasses = rawValues.hydrationGlasses !== undefined
        ? Math.max(0, Math.min(30, Number(rawValues.hydrationGlasses)))
        : undefined;
      const appetite = ['good', 'fair', 'poor'].includes(rawValues.appetite) ? rawValues.appetite : 'good';
      const meals = Array.isArray(rawValues.meals) ? rawValues.meals.map(String).filter(Boolean) : undefined;
      const tookIfas = typeof rawValues.tookIfas === 'boolean' ? rawValues.tookIfas : undefined;

      const nutritionValues: NutritionValues = {
        hydrationGlasses,
        appetite,
        meals,
        tookIfas,
      };
      return nutritionValues;
    }

    case 'activity': {
      const activeMinutes = rawValues.activeMinutes !== undefined
        ? Math.max(0, Math.min(720, Number(rawValues.activeMinutes)))
        : undefined;
      const allowedActivities = ['walking', 'gentle_stretch', 'daily_chores', 'rest', 'other'];
      const activityType = allowedActivities.includes(rawValues.activityType)
        ? rawValues.activityType
        : 'other';

      const activityValues: ActivityValues = {
        activeMinutes,
        activityType,
      };
      return activityValues;
    }

    case 'notes': {
      const text = String(rawValues.text || '').trim();
      if (!text) {
        throw new HealthLogValidationError('text', 'Note text cannot be empty.');
      }
      if (text.length > 2000) {
        throw new HealthLogValidationError('text', 'Note exceeds maximum character limit of 2000.');
      }
      const noteValues: GeneralNotesValues = {
        text,
        topic: rawValues.topic ? String(rawValues.topic).slice(0, 100) : undefined,
      };
      return noteValues;
    }

    default:
      throw new HealthLogValidationError('type', `Unsupported health log type: ${type}`);
  }
}

/**
 * Deterministically checks for clinical safety warnings on log entry.
 * Note: Does NOT make automatic diagnoses. Only assesses clinical alert thresholds
 * aligned with Kenya MOH 216 guidelines to protect mother & baby.
 */
export function evaluateClinicalSafety(type: HealthLogType, values: HealthLogValues): ClinicalSafetyAlert {
  if (type === 'blood_pressure') {
    const bp = values as BloodPressureValues;
    // Severe Hypertension (Urgent Danger Sign in pregnancy / postpartum)
    if (bp.systolic >= 160 || bp.diastolic >= 110) {
      return {
        level: 'URGENT_DANGER',
        title: 'Severe Blood Pressure Elevation',
        message: `Your reading of ${bp.systolic}/${bp.diastolic} mmHg is significantly elevated (≥160/110 mmHg). In pregnancy or the postpartum period, this requires immediate clinical attention to prevent complications.`,
        actionRecommendation: 'Please go to your nearest maternity hospital or healthcare facility immediately, or call the 1199 emergency hotline.',
        isRedCross1199Recommended: true,
      };
    }
    // Mild / Moderate Elevation
    if (bp.systolic >= 140 || bp.diastolic >= 90) {
      return {
        level: 'ADVISORY',
        title: 'Elevated Blood Pressure Reading',
        message: `Your reading of ${bp.systolic}/${bp.diastolic} mmHg is above the standard threshold (≥140/90 mmHg).`,
        actionRecommendation: 'Rest quietly for 15 minutes and repeat the measurement. We recommend contacting your antenatal care provider or visiting your health center for an evaluation.',
        isRedCross1199Recommended: false,
      };
    }
  }

  if (type === 'baby_movement') {
    const bm = values as BabyMovementValues;
    if (bm.pattern === 'decreased' || bm.pattern === 'none_felt') {
      return {
        level: 'URGENT_DANGER',
        title: 'Decreased Baby Movements Alert',
        message: 'A significant decrease or absence in baby movements in the third trimester is an important signal that your baby needs a prompt checkup.',
        actionRecommendation: 'Lie on your left side in a quiet room for 1 hour. If you do not feel at least 4 distinct movements or if you remain concerned, do not wait until your next clinic day. Visit your maternity triage or health facility immediately.',
        isRedCross1199Recommended: true,
      };
    }
  }

  if (type === 'symptoms') {
    const sym = values as SymptomsValues;
    if (sym.hasDangerSigns || (sym.dangerSigns && sym.dangerSigns.length > 0) || sym.severity === 'severe') {
      const dangerLabels = (sym.dangerSigns || [])
        .map((d) => MATERNAL_DANGER_SYMPTOMS.find((m) => m.id === d)?.label || d)
        .join(', ');

      return {
        level: 'URGENT_DANGER',
        title: 'Maternal Danger Signs Identified',
        message: `You reported one or more warning signs (${dangerLabels || 'severe symptoms'}). Kenya Ministry of Health guidelines advise immediate medical evaluation for these symptoms.`,
        actionRecommendation: 'Please visit your nearest hospital, clinic, or contact your midwife immediately. For emergency ambulance assistance in Kenya, call 1199.',
        isRedCross1199Recommended: true,
      };
    }
  }

  return {
    level: 'NONE',
    title: 'Normal Entry Recorded',
    message: 'Your health entry has been logged securely.',
    actionRecommendation: 'Continue your daily wellness routine and attend scheduled clinic visits.',
    isRedCross1199Recommended: false,
  };
}

export function validateHealthLogInput(input: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Input must be an object'] };
  }
  if (!input.userId) {
    errors.push('userId is required');
  }
  if (!input.type) {
    errors.push('type is required');
  }
  try {
    validateLogTimestamp(input.timestamp);
  } catch (err: any) {
    errors.push(err.message || 'Invalid timestamp');
  }
  try {
    if (input.type) {
      validateHealthLogValues(input.type, input.values);
    }
  } catch (err: any) {
    errors.push(err.message || 'Invalid values');
  }
  if (input.notes && String(input.notes).length > 2000) {
    errors.push('Notes cannot exceed 2000 characters');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeAndFormatHealthLog(input: any): import('../types/healthLog').DailyHealthLog {
  const validTimestamp = validateLogTimestamp(input.timestamp);
  const validValues = validateHealthLogValues(input.type, input.values);
  const category = CATEGORY_BY_TYPE[input.type as HealthLogType] || 'JOURNAL';
  const provenance = createSafeUserReportedProvenance(input.userId, validTimestamp);

  return {
    id: input.id || `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    timestamp: validTimestamp,
    type: input.type,
    category,
    values: validValues,
    notes: input.notes ? String(input.notes).trim().slice(0, 2000) : undefined,
    source: 'USER_REPORTED',
    provenance,
    sharedWithClinician: Boolean(input.sharedWithClinician),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

