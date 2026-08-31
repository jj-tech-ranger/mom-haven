// Canonical deterministic safety patterns for Haven and the Phase 6 Emergency surface.
// Keep contextual phrases here; never replace them with broad single-word triggers.
// Phase 6 must import this exact module so the safety list cannot drift between surfaces.

export const DANGER_SIGN_PATTERNS: RegExp[] = [
  /\bheavy bleeding\b/i,
  /\bbleeding (?:a )?lot\b/i,
  /\bcan't stop bleeding\b/i,
  /\bsevere (?:headache|abdominal pain|stomach pain|belly pain)\b/i,
  /\bblurred vision\b/i,
  /\bconvulsion(?:s)?\b/i,
  /\bhaving a fit\b/i,
  /\bdifficulty breathing\b/i,
  /\bcan't breathe\b/i,
  /\bnot breathing\b/i,
  /\bbaby (?:isn't|is not) moving\b/i,
  /\breduced (?:fetal |baby )?movement\b/i,
  /\bbaby feels cold\b/i,
  /\bbaby (?:won't|will not) feed\b/i,
  /\bbaby is not feeding\b/i,
];

export const SELF_HARM_OR_VIOLENCE_PATTERNS: RegExp[] = [
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[- ]harm\b/i,
  /\bhurt myself\b/i,
  /\bwant to die\b/i,
  /\b(?:being|been) (?:hit|beaten|hurt|assaulted)\b/i,
  /\b(?:partner|husband|someone) (?:hits|hit|beats|beat|hurts|hurt) me\b/i,
  /\bdomestic violence\b/i,
  /\bsexual assault\b/i,
  /\brape(?:d)?\b/i,
  /\babuse(?:d)?\b/i,
];

// Deliberately contextual: "positive" alone is meaningless.
export const POSITIVE_TEST_CONTEXT = /\b(?:pregnancy|pregnant|pregnancy)\s+test\b.{0,80}\b(?:came back|is|was)\s+positive\b|\bpositive\b.{0,50}\b(?:pregnancy|pregnant)\s+test\b/i;

export type LayerOneResult = 'physical_danger' | 'self_harm_or_violence' | null;

export function classifyLayerOne(message: string): LayerOneResult {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (SELF_HARM_OR_VIOLENCE_PATTERNS.some((pattern) => pattern.test(normalized))) return 'self_harm_or_violence';
  if (DANGER_SIGN_PATTERNS.some((pattern) => pattern.test(normalized))) return 'physical_danger';
  return null;
}

// Test intent examples to preserve the contextual distinction:
// MUST trigger: "I'm bleeding heavily right now", "my baby isn't moving".
// MUST NOT trigger: "that ultrasound was such a positive experience".
// Positive pregnancy-test context is recognized separately from the bare word "positive".
export function matchesPositivePregnancyTestContext(message: string): boolean {
  return POSITIVE_TEST_CONTEXT.test(message.replace(/\s+/g, ' ').trim());
}
