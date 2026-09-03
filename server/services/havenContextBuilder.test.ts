import assert from 'node:assert';
import {
  compareProvenance,
  resolveFactByTrust,
  calculateChildAge,
  resolvePregnancyContext,
  resolveChildrenContext,
  ClinicalPregnancyRecord,
  ClinicalChildRecord,
} from './contextSources.js';
import { formatHavenContext, buildHavenContext } from './havenContextBuilder.js';
import { HavenContext, HavenContextFact, PROVENANCE_TRUST_RANK } from '../types/havenContext.js';
import { ServerHealthContext } from './healthContextService.js';

console.log('--- Phase 3: Haven Context Builder & Provenance Tests ---');

// 1. Trust Hierarchy & Provenance Comparison
assert.strictEqual(
  PROVENANCE_TRUST_RANK.VERIFIED > PROVENANCE_TRUST_RANK.AUTHORITATIVE,
  true,
  'VERIFIED rank must exceed AUTHORITATIVE',
);
assert.strictEqual(
  PROVENANCE_TRUST_RANK.AUTHORITATIVE > PROVENANCE_TRUST_RANK.SYSTEM_DERIVED,
  true,
  'AUTHORITATIVE rank must exceed SYSTEM_DERIVED',
);
assert.strictEqual(
  PROVENANCE_TRUST_RANK.SYSTEM_DERIVED > PROVENANCE_TRUST_RANK.USER_REPORTED,
  true,
  'SYSTEM_DERIVED rank must exceed USER_REPORTED',
);
assert.strictEqual(
  PROVENANCE_TRUST_RANK.USER_REPORTED > PROVENANCE_TRUST_RANK.ANONYMOUS,
  true,
  'USER_REPORTED rank must exceed ANONYMOUS',
);

assert.strictEqual(compareProvenance('VERIFIED', 'USER_REPORTED') > 0, true);
assert.strictEqual(compareProvenance('ANONYMOUS', 'VERIFIED') < 0, true);

// 2. Conflict Resolution via Trust Hierarchy
const userFact: HavenContextFact<string> = { value: '20 weeks', provenance: 'USER_REPORTED' };
const verifiedFact: HavenContextFact<string> = { value: '22 weeks', provenance: 'VERIFIED' };
const anonymousFact: HavenContextFact<string> = { value: '18 weeks', provenance: 'ANONYMOUS' };

assert.strictEqual(resolveFactByTrust(userFact, verifiedFact)?.value, '22 weeks');
assert.strictEqual(resolveFactByTrust(verifiedFact, userFact)?.value, '22 weeks');
assert.strictEqual(resolveFactByTrust(userFact, anonymousFact)?.value, '20 weeks');
console.log('✓ enforces strict trust hierarchy (Verified > Authoritative > System-Derived > User-Reported > Anonymous)');

// 3. Child Age Calculation
const mockNow = new Date('2026-09-01T00:00:00Z');
const baby = calculateChildAge('2026-06-01', mockNow);
assert.ok(baby);
assert.strictEqual(baby.ageMonths, 3);
assert.strictEqual(baby.ageFormatted, '3 months old');

const toddler = calculateChildAge('2024-03-01', mockNow);
assert.ok(toddler);
assert.strictEqual(toddler.ageMonths, 30);
assert.strictEqual(toddler.ageFormatted, '2 yr 6 mo old');

const newborn = calculateChildAge('2026-08-25', mockNow);
assert.ok(newborn);
assert.strictEqual(newborn.ageMonths, 0);
assert.strictEqual(newborn.ageFormatted, '1 week old');
console.log('✓ deterministically calculates child age in months and formatted text');

// 4. Pregnancy Context Resolution (Clinical vs Personalization)
const clinicalPregnancy: ClinicalPregnancyRecord = {
  id: 'preg-101',
  status: 'active',
  lmp: '2026-03-01',
  edd: '2026-12-06',
  gravida: 2,
  parity: 1,
  verifiedAt: '2026-03-10T00:00:00Z',
};

const personalization: ServerHealthContext = {
  preferredName: 'Wanjiku',
  language: 'sw',
  lifecycleStage: 'pregnancy',
  interests: ['Nutrition', 'Postpartum healing'],
  dietaryPreferences: ['Halal'],
  havenResponseStyle: 'concise',
  pregnancy: {
    pregnancyWeek: 16, // User self-reported 16 weeks, but LMP shows 26 weeks
    dueDate: '2026-12-15',
    multiplePregnancy: true,
  },
};

const resolvedPreg = resolvePregnancyContext(clinicalPregnancy, personalization, mockNow);
assert.ok(resolvedPreg.pregnancyFact);
assert.strictEqual(resolvedPreg.pregnancyFact.provenance, 'VERIFIED');
assert.strictEqual(resolvedPreg.pregnancyFact.value.gravida, 2);
assert.strictEqual(resolvedPreg.pregnancyFact.value.parity, 1);
assert.strictEqual(resolvedPreg.pregnancyFact.value.multiplePregnancy, true); // Retains user preference signal

assert.ok(resolvedPreg.derivedTimingFact);
assert.strictEqual(resolvedPreg.derivedTimingFact.provenance, 'SYSTEM_DERIVED');
assert.strictEqual(resolvedPreg.derivedTimingFact.value.currentGestationalWeeks, 26);
assert.strictEqual(resolvedPreg.derivedTimingFact.value.trimester, 2);
console.log('✓ clinical pregnancy record takes precedence over self-reported drafts with derived timing');

// 5. Fallback to User-Reported when No Clinical Pregnancy Record Exists
const userOnlyPreg = resolvePregnancyContext(null, personalization, mockNow);
assert.ok(userOnlyPreg.pregnancyFact);
assert.strictEqual(userOnlyPreg.pregnancyFact.provenance, 'USER_REPORTED');
assert.strictEqual(userOnlyPreg.pregnancyFact.value.gestationalAgeWeeks, 16);
assert.strictEqual(userOnlyPreg.pregnancyFact.value.edd, '2026-12-15');
console.log('✓ gracefully falls back to USER_REPORTED signals when clinical records are absent');

// 6. Child Records Resolution & Minimization
const clinicalChildren: ClinicalChildRecord[] = [
  { id: 'c1', name: 'Baraka', dateOfBirth: '2025-09-01', sex: 'Male' },
  { id: 'c2', name: 'Zuri', dateOfBirth: '2023-01-15', sex: 'Female' },
];

const resolvedChildren = resolveChildrenContext(clinicalChildren, personalization, mockNow);
assert.strictEqual(resolvedChildren.length, 2);
assert.strictEqual(resolvedChildren[0].provenance, 'VERIFIED');
assert.strictEqual(resolvedChildren[0].value.name, 'Baraka');
assert.strictEqual(resolvedChildren[0].value.ageMonths, 12);
assert.strictEqual(resolvedChildren[0].value.ageFormatted, '1 year old');
console.log('✓ resolves clinical children with calculated ages and verified provenance');

// 7. Context Formatter Tests (Provenance tags, safe boundaries, deterministic lines)
const fullContext: HavenContext = {
  userMode: { value: 'authenticated', provenance: 'VERIFIED' },
  preferredName: { value: 'Wanjiku', provenance: 'USER_REPORTED' },
  lifecycleStage: { value: 'pregnancy', provenance: 'USER_REPORTED' },
  language: { value: 'sw', provenance: 'USER_REPORTED' },
  location: { value: { county: 'Kiambu', subcounty: 'Thika' }, provenance: 'USER_REPORTED' },
  interests: { value: ['Nutrition', 'Mental wellness'], provenance: 'USER_REPORTED' },
  dietaryPreferences: { value: ['Vegetarian'], provenance: 'USER_REPORTED' },
  havenResponseStyle: { value: 'concise', provenance: 'USER_REPORTED' },
  pregnancy: resolvedPreg.pregnancyFact,
  derivedTiming: resolvedPreg.derivedTimingFact,
  children: resolvedChildren,
};

const formatted = formatHavenContext(fullContext);
assert.ok(formatted.includes('[VERIFIED]'));
assert.ok(formatted.includes('[SYSTEM_DERIVED]'));
assert.ok(formatted.includes('[USER_REPORTED]'));
assert.ok(formatted.includes('Preferred name: Wanjiku [USER_REPORTED]'));
assert.ok(formatted.includes('Location: Kiambu, Thika [USER_REPORTED]'));
assert.ok(formatted.includes('Active pregnancy: week 26, trimester 2, EDD 2026-12-06, gravida 2, parity 1 [VERIFIED]'));
assert.ok(formatted.includes('Multiple pregnancy preference signal: yes [USER_REPORTED]'));
assert.ok(formatted.includes('Derived gestational timing: 26 weeks gestational age, trimester 2'));
assert.ok(formatted.includes('[SYSTEM_DERIVED]'));
assert.ok(formatted.includes('Child 1: Baraka, 1 year old, DOB 2025-09-01, Male [VERIFIED]'));
assert.ok(formatted.includes('Provenance rules:'));
assert.ok(formatted.includes('NEVER invent missing clinical data'));
console.log('✓ deterministically formats facts with clear provenance tags and safety rules');

// 8. Safe Fallback on Missing or Empty User
async function testSafeFallback() {
  const fallback = await buildHavenContext('');
  assert.strictEqual(fallback.userMode?.value, 'authenticated');
  assert.strictEqual(fallback.interests.value.length, 0);
  assert.strictEqual(fallback.children.length, 0);

  const anonFallback = await buildHavenContext('', { isAnonymous: true });
  assert.strictEqual(anonFallback.userMode?.value, 'anonymous');
  assert.strictEqual(anonFallback.userMode?.provenance, 'ANONYMOUS');
  assert.strictEqual(anonFallback.interests.provenance, 'ANONYMOUS');
}

testSafeFallback().then(() => {
  console.log('✓ provides safe fallback context without crashing when uid is empty');
  console.log('All Phase 3 Haven Context Builder tests passed successfully!');
}).catch((err) => {
  console.error('Test failed', err);
  process.exit(1);
});
