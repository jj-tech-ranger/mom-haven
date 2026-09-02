// src/services/safetyInterceptor.ts
// 2-Layer Safety Interceptor for HavenChat Intelligence

export interface InterceptorResult {
  blocked: boolean;
  action: 'ALLOW' | 'EMERGENCY_ESCALATION' | 'CLINICAL_ESCALATION' | 'PRIVACY_WARNING' | 'CLARIFY';
  dangerSignCategory?: 'MOTHER' | 'NEWBORN' | 'CHILD' | 'SELF_HARM';
  matchedPattern?: string;
  clarificationPrompt?: string;
  privacyHelpline?: string;
  emergencyTitle?: string;
  emergencyActionText?: string;
}

// Contextual Regex Patterns for Layer 1 Deterministic Pre-Check
// Designed to prevent bare-word false positives (e.g., "positive attitude" vs "tested positive for HIV")
export const DANGER_SIGN_PATTERNS = {
  MATERNAL_BLEEDING: /\b(heavy|severe|vaginal|gushing|soaking|massive|clotting)\s+(bleeding|blood|hemorrhage|haemorrhage|spotting\s+heavy)\b/i,
  PREECLAMPSIA: /\b(severe|blinding|unbearable|splitting)\s+(headache|head\s+pain)\b.*\b(blurred\s+vision|spots\s+in\s+eyes|flashing\s+lights|swelling|edema|puffy\s+face)\b/i,
  MATERNAL_CONVULSIONS: /\b(convulsion|convulsing|seizure|fit|fits|passed\s+out|lost\s+consciousness|blackout|fainted|shaking\s+uncontrollably)\b/i,
  REDUCED_MOVEMENT: /\b(baby\s+(stopped|not)\s+moving|no\s+fetal\s+movement|less\s+movement|not\s+kicking|stopped\s+kicking|fetal\s+demise)\b/i,
  RUPTURED_MEMBRANES: /\b(water\s+(broke|broken|gushing|leaking)|fluid\s+leaking|membrane\s+rupture)\b.*\b(early|before\s+due|3[0-6]\s+weeks|premature)\b/i,
  NEWBORN_BREATHING: /\b(baby|newborn|infant)\b.*\b(fast\s+breathing|gasping|chest\s+in-drawing|chest\s+sucking\s+in|grunting|blue\s+lips|breathing\s+hard)\b/i,
  NEWBORN_FEEDING: /\b(baby|newborn|infant)\b.*\b(cannot|unable\s+to|refusing\s+to|won't|not)\s+(suckle|feed|drink|breastfeed|latch|keep\s+milk\s+down)\b/i,
  NEWBORN_TEMP: /\b(baby|newborn|infant)\b.*\b(very\s+hot|high\s+fever|very\s+cold|hypothermi\w+|temperature\s+(38|39|40|35|34))\b/i,
  SELF_HARM: /\b(suicide|kill\s+myself|end\s+my\s+life|hurt\s+myself|want\s+to\s+die|self\s*harm|overdose)\b/i,
};

export const SENSITIVE_TOPIC_PATTERNS = {
  HIV: /\b(tested\s+positive|hiv\s+positive|art\s+meds|arv|exposed\s+infant|pmtct|viral\s+load)\b/i,
  GBV: /\b(husband|partner|boyfriend|man)\b.*\b(beat|beating|hit\s+me|abused|forced\s+sex|violence|threatened|assaulted)\b/i,
  DEPRESSION: /\b(postpartum\s+depression|crying\s+all\s+the\s+time|cannot\s+bond|hate\s+my\s+baby|feel\s+hopeless|worthless|severe\s+anxiety)\b/i,
};

export const MEDICATION_DOSING_PATTERNS = /\b(how\s+many\s+mg|what\s+dose|dosage|how\s+many\s+tablets|how\s+many\s+pills|can\s+i\s+take\s+(panadol|amoxicillin|flagyl|aspirin|ibuprofen|cytotec|misoprostol|augmentin|doxycycline|cipro))\b/i;

export function evaluateLayer1Deterministic(userMessage: string): InterceptorResult {
  const text = userMessage.trim();

  // 1. Self-Harm Check
  if (DANGER_SIGN_PATTERNS.SELF_HARM.test(text)) {
    return {
      blocked: true,
      action: 'EMERGENCY_ESCALATION',
      dangerSignCategory: 'SELF_HARM',
      matchedPattern: 'SELF_HARM',
      emergencyTitle: 'Immediate Crisis Support Needed',
      emergencyActionText: 'If you are feeling overwhelmed or having thoughts of self-harm, free confidential 24/7 counselors are ready to support you right now. Please call Kenya Red Cross Mental Health Line at 1199 or emergency services.'
    };
  }

  // 2. Maternal Obstetric Danger Signs
  if (
    DANGER_SIGN_PATTERNS.MATERNAL_BLEEDING.test(text) ||
    DANGER_SIGN_PATTERNS.PREECLAMPSIA.test(text) ||
    DANGER_SIGN_PATTERNS.MATERNAL_CONVULSIONS.test(text) ||
    DANGER_SIGN_PATTERNS.REDUCED_MOVEMENT.test(text) ||
    DANGER_SIGN_PATTERNS.RUPTURED_MEMBRANES.test(text)
  ) {
    return {
      blocked: true,
      action: 'EMERGENCY_ESCALATION',
      dangerSignCategory: 'MOTHER',
      matchedPattern: 'MATERNAL_DANGER_SIGN',
      emergencyTitle: 'Obstetric Emergency Detected',
      emergencyActionText: 'The symptoms you described are high-urgency maternal danger signs. Do not wait for online replies. Proceed immediately to the nearest hospital with emergency maternity facilities.'
    };
  }

  // 3. Newborn Danger Signs
  if (
    DANGER_SIGN_PATTERNS.NEWBORN_BREATHING.test(text) ||
    DANGER_SIGN_PATTERNS.NEWBORN_FEEDING.test(text) ||
    DANGER_SIGN_PATTERNS.NEWBORN_TEMP.test(text)
  ) {
    return {
      blocked: true,
      action: 'EMERGENCY_ESCALATION',
      dangerSignCategory: 'NEWBORN',
      matchedPattern: 'NEWBORN_DANGER_SIGN',
      emergencyTitle: 'Newborn Emergency Warning Sign',
      emergencyActionText: 'Newborn infants can deteriorate rapidly. The signs you described require urgent in-person pediatric review at a health facility. Keep baby warm and go to the hospital immediately.'
    };
  }

  // 4. Medication Dosing Request
  if (MEDICATION_DOSING_PATTERNS.test(text)) {
    return {
      blocked: true,
      action: 'CLINICAL_ESCALATION',
      matchedPattern: 'MEDICATION_DOSING_REQUEST',
      emergencyTitle: 'Prescription & Dosage Restriction',
      emergencyActionText: 'For your safety, MomHaven AI does not provide medication dosages or prescription instructions. Safe dosages depend on your clinical history, gestational age, and in-person vitals. Please consult your midwife, doctor, or pharmacist.'
    };
  }

  // 5. Sensitive Topic Pre-Check
  if (SENSITIVE_TOPIC_PATTERNS.HIV.test(text) || SENSITIVE_TOPIC_PATTERNS.GBV.test(text) || SENSITIVE_TOPIC_PATTERNS.DEPRESSION.test(text)) {
    return {
      blocked: false,
      action: 'PRIVACY_WARNING',
      privacyHelpline: SENSITIVE_TOPIC_PATTERNS.GBV.test(text) 
        ? '1195 (National Toll-Free GBV Helpline)' 
        : '1199 (Kenya Red Cross Mental Health & Crisis Hotline)',
    };
  }

  return { blocked: false, action: 'ALLOW' };
}

// Layer 2 Post-Generation Response Validator
export function validateAiResponse(rawResponse: string): string {
  // Strip out any hallucinated specific numerical milligram or pill dosage instructions
  const dosageRegex = /\b(take|administer|drink|swallow)\s+(\d+(\.\d+)?\s*(mg|milligrams|tablets|pills|capsules|ml))\b/gi;
  if (dosageRegex.test(rawResponse)) {
    return rawResponse.replace(
      dosageRegex,
      'Please consult your midwife or doctor for the exact medication dosage prescribed for your clinical condition.'
    );
  }
  return rawResponse;
}
