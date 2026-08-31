import type { ComponentType } from 'react';

export type DangerSignCategory = 'mother' | 'newborn' | 'child' | 'selfharm';

export interface DangerSign {
  id: string;
  label: string;
  icon: string;
  category: DangerSignCategory;
  matchPatterns: string[];
}

// Canonical danger-sign content for both Haven's deterministic interceptor and the
// Emergency checklist. Keep this as the single source of truth; do not duplicate
// these labels/patterns in screen components.
export const DANGER_SIGNS: DangerSign[] = [
  { id: 'mother-vaginal-bleeding', label: 'Vaginal bleeding', icon: 'droplets', category: 'mother', matchPatterns: ['vaginal bleeding', 'bleeding heavily', 'bleeding a lot', "can't stop bleeding"] },
  { id: 'mother-severe-headache', label: 'Severe headache', icon: 'brain', category: 'mother', matchPatterns: ['severe headache'] },
  { id: 'mother-pallor', label: 'Pale / pallor', icon: 'user-round', category: 'mother', matchPatterns: ['pale', 'pallor', 'very pale'] },
  { id: 'mother-fever', label: 'Fever', icon: 'thermometer', category: 'mother', matchPatterns: ['fever', 'high temperature'] },
  { id: 'mother-severe-abdominal-pain', label: 'Severe abdominal pain', icon: 'stethoscope', category: 'mother', matchPatterns: ['severe abdominal pain', 'severe stomach pain', 'severe belly pain'] },
  { id: 'mother-swelling', label: 'Swelling of face and hands', icon: 'hand', category: 'mother', matchPatterns: ['swelling of face and hands', 'swollen face and hands', 'swelling of the face', 'swelling of the hands'] },
  { id: 'mother-reduced-fetal-movement', label: 'Reduced or no movement of the unborn baby', icon: 'baby', category: 'mother', matchPatterns: ['reduced fetal movement', 'reduced baby movement', 'baby is not moving', "baby isn't moving", 'no fetal movement'] },
  { id: 'mother-waters-breaking', label: 'Waters breaking', icon: 'waves', category: 'mother', matchPatterns: ['waters breaking', 'water broke', 'waters have broken'] },
  { id: 'mother-convulsions', label: 'Convulsions / fits', icon: 'activity', category: 'mother', matchPatterns: ['convulsion', 'having a fit', 'fits'] },
  { id: 'mother-heavy-postpartum-bleeding', label: 'Heavy bleeding after birth', icon: 'droplets', category: 'mother', matchPatterns: ['heavy bleeding after birth', 'heavy postpartum bleeding', 'bleeding heavily after delivery'] },
  { id: 'mother-foul-discharge', label: 'Foul-smelling vaginal discharge', icon: 'alert-triangle', category: 'mother', matchPatterns: ['foul-smelling vaginal discharge', 'foul smelling vaginal discharge', 'smelly vaginal discharge'] },

  // Reuses the Phase 3.2 newborn danger-sign concepts. The most severe breathing and
  // temperature thresholds remain functionally implemented but are flagged in the
  // clinical decision register as awaiting formal clinical review; Phase 9 Admin must
  // track that governance status rather than silently treating them as approved.
  { id: 'newborn-feeding', label: 'Not feeding well', icon: 'heart-crack', category: 'newborn', matchPatterns: ['baby won\'t feed', 'baby will not feed', 'baby is not feeding', 'not feeding well', 'unable to feed', 'unable to suckle'] },
  { id: 'newborn-breathing', label: 'Difficult or fast breathing', icon: 'wind', category: 'newborn', matchPatterns: ['fast or difficult breathing', 'difficult breathing', 'baby is breathing fast', 'very fast breathing', 'grunting', 'chest pulling in'] },
  { id: 'newborn-temperature', label: 'Feels hot or unusually cold', icon: 'thermometer', category: 'newborn', matchPatterns: ['baby feels very hot', 'baby feels hot', 'baby feels unusually cold', 'baby feels cold', 'very high temperature', 'very low temperature'] },
  { id: 'newborn-less-active', label: 'Becomes less active', icon: 'shield-alert', category: 'newborn', matchPatterns: ['becomes less active', 'less active', 'very sleepy', 'floppy', 'difficult to wake', 'unconscious'] },
  { id: 'newborn-jaundice', label: 'Yellowing of skin / eyes (jaundice)', icon: 'sun', category: 'newborn', matchPatterns: ['yellow skin', 'yellow eyes', 'yellowing of skin', 'yellowing of eyes', 'jaundice'] },

  // Conservative starting set. The fast-breathing thresholds are age-specific and are
  // intentionally shown here as the clinical decision register currently records them:
  // 50+ breaths/min for 2–11 months and 40+ for 12–59 months. Cross-check this list
  // against the full IMNCI source document in project materials before declaring it complete.
  { id: 'child-fast-breathing', label: 'Fast breathing', icon: 'wind', category: 'child', matchPatterns: ['fast breathing', 'breathing fast', 'difficulty breathing'] },
  { id: 'child-chest-indrawing', label: 'Chest indrawing', icon: 'wind', category: 'child', matchPatterns: ['chest indrawing', 'chest pulling in', 'chest pulls in'] },
  { id: 'child-convulsions', label: 'Convulsions', icon: 'activity', category: 'child', matchPatterns: ['child convulsion', 'child having a fit', 'child fits'] },
  { id: 'child-unable-to-drink', label: 'Unable to drink or breastfeed', icon: 'cup-soda', category: 'child', matchPatterns: ['unable to drink', 'unable to breastfeed', 'cannot drink', 'cannot breastfeed'] },
  { id: 'child-lethargy', label: 'Unusually lethargic or difficult to wake', icon: 'shield-alert', category: 'child', matchPatterns: ['child is lethargic', 'child is difficult to wake', 'child is unusually sleepy', 'child is less active'] },

  { id: 'selfharm-thoughts', label: 'Thoughts of harming myself', icon: 'heart-crack', category: 'selfharm', matchPatterns: ['kill myself', 'end my life', 'suicide', 'suicidal', 'self-harm', 'self harm', 'hurt myself', 'want to die'] },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const DANGER_SIGN_PATTERNS: RegExp[] = DANGER_SIGNS
  .flatMap((sign) => sign.matchPatterns)
  .map((pattern) => new RegExp(`\\b${escapeRegExp(pattern).replace(/\\s+/g, '\\s+')}\\b`, 'i'));

export const SELF_HARM_OR_VIOLENCE_PATTERNS: RegExp[] = [
  ...DANGER_SIGNS.filter((sign) => sign.category === 'selfharm').flatMap((sign) => sign.matchPatterns).map((pattern) => new RegExp(`\\b${escapeRegExp(pattern).replace(/\\s+/g, '\\s+')}\\b`, 'i'))),
  /\b(?:being|been) (?:hit|beaten|hurt|assaulted)\b/i,
  /\b(?:partner|husband|someone) (?:hits|hit|beats|beat|hurts|hurt) me\b/i,
  /\bdomestic violence\b/i,
  /\bsexual assault\b/i,
  /\brape(?:d)?\b/i,
  /\babuse(?:d)?\b/i,
];

export const POSITIVE_TEST_CONTEXT = /\b(?:pregnancy|pregnant)\s+test\b.{0,80}\b(?:came back|is|was)\s+positive\b|\bpositive\b.{0,50}\b(?:pregnancy|pregnant)\s+test\b/i;

export type LayerOneResult = 'physical_danger' | 'self_harm_or_violence' | null;

export function classifyLayerOne(message: string): LayerOneResult {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (SELF_HARM_OR_VIOLENCE_PATTERNS.some((pattern) => pattern.test(normalized))) return 'self_harm_or_violence';
  if (DANGER_SIGN_PATTERNS.some((pattern) => pattern.test(normalized))) return 'physical_danger';
  return null;
}

export function matchesPositivePregnancyTestContext(message: string): boolean {
  return POSITIVE_TEST_CONTEXT.test(message.replace(/\s+/g, ' ').trim());
}

// Kept for consumers that want a type-only icon registry without storing React
// components in the canonical data file. The Emergency UI maps these stable names
// to Lucide icons locally.
export type DangerSignIcon = ComponentType<{ className?: string }>;
