// src/components/today/TodayDashboard.test.ts
/**
 * Today Dashboard Integration & Behavioral Tests (Phase 4)
 *
 * Verifies all required dashboard behavioral scenarios:
 * 1. pregnancy (authoritative vs self-reported)
 * 2. postpartum
 * 3. parenting
 * 4. planning
 * 5. supporter
 * 6. exploring
 * 7. no clinical record
 * 8. no context
 * 9. loading & error recovery simulation
 * 10. failed context load
 * 11. failed pregnancy load
 * 12. no reminders (ensures zero fabricated appointments)
 */

import assert from 'node:assert';
import { deriveTodayContext } from '../../services/todayContextService';
import { Pregnancy, Reminder, Child } from '../../types';
import { HealthContext } from '../../types/healthContext';

console.log('--- Phase 4: Today Dashboard Behavioral & Lifecycle Tests ---');

const fixedNow = new Date('2026-09-03T10:00:00Z');

// ============================================================================
// 1. Pregnancy Behavior
// ============================================================================
const clinicalPregnancy: Pregnancy = {
  id: 'preg-active-1',
  motherId: 'user-auth-1',
  status: 'active',
  lmp: '2026-03-01',
  edd: '2026-12-06',
  gestationalAgeWeeks: 24,
  createdAt: '2026-03-01T00:00:00Z',
};

const pregnancyContext: HealthContext = {
  version: 1,
  lifecycleStage: 'pregnancy',
  language: 'en',
  preferredName: 'Amina',
  county: 'Mombasa',
  pregnancy: {
    pregnancyWeek: 18, // Stale onboarding value
    dueDate: '2026-12-25',
  },
  interests: ['nutrition', 'birth_preparation'],
  dietaryPreferences: ['halal'],
  havenResponseStyle: 'detailed',
  updatedAt: '2026-04-01T00:00:00Z',
};

const pregResult = deriveTodayContext({
  healthContext: pregnancyContext,
  clinicalPregnancy,
  now: fixedNow,
});

assert.strictEqual(pregResult.lifecycleStage, 'pregnancy');
assert.strictEqual(pregResult.hero.type, 'pregnancy');
assert.strictEqual(pregResult.hero.isAuthoritative, true);
assert.strictEqual(pregResult.hero.provenanceTag, 'VERIFIED');
assert.strictEqual(pregResult.hero.gestationalWeeks, 26, 'Must calculate GA from clinical LMP');
assert.strictEqual(pregResult.hero.trimester, 2);
assert.strictEqual(pregResult.county, 'Mombasa');
assert.strictEqual(pregResult.hasAuthoritativeClinicalData, true);
console.log('✓ Scenario 1 (Pregnancy): Uses authoritative clinical records over stale onboarding values');

// ============================================================================
// 2. Postpartum Behavior
// ============================================================================
const newborn: Child = {
  id: 'child-newborn-1',
  motherId: 'user-auth-2',
  name: 'Baraka',
  dateOfBirth: '2026-08-01',
  sex: 'male',
  createdAt: '2026-08-01T00:00:00Z',
};

const postpartumContext: HealthContext = {
  version: 1,
  lifecycleStage: 'postpartum',
  language: 'en',
  preferredName: 'Wanjiku',
  interests: ['breastfeeding', 'recovery'],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2026-08-02T00:00:00Z',
};

const postResult = deriveTodayContext({
  healthContext: postpartumContext,
  clinicalPregnancy: null,
  children: [newborn],
  now: fixedNow,
});

assert.strictEqual(postResult.lifecycleStage, 'postpartum');
assert.strictEqual(postResult.hero.type, 'postpartum');
assert.strictEqual(postResult.hero.childName, 'Baraka');
assert.strictEqual(postResult.hero.weeksPostpartum, 4);
assert.strictEqual(
  postResult.priorities.some(p => p.category === 'danger_sign'),
  true,
  'Postpartum must include warning sign education (PPH, infection)'
);
assert.strictEqual(
  postResult.priorities.some(p => p.title.includes('Exclusive Breastfeeding')),
  true,
  'Postpartum must include feeding resources'
);
console.log('✓ Scenario 2 (Postpartum): Derives weeks from child record, prioritizes maternal recovery & danger signs');

// ============================================================================
// 3. Parenting Behavior
// ============================================================================
const toddler: Child = {
  id: 'child-toddler-1',
  motherId: 'user-auth-3',
  name: 'Zawadi',
  dateOfBirth: '2025-02-15', // ~18 months
  sex: 'female',
  createdAt: '2025-02-15T00:00:00Z',
};

const parentingContext: HealthContext = {
  version: 1,
  lifecycleStage: 'parenting',
  language: 'en',
  preferredName: 'Faith',
  interests: ['child_milestones', 'nutrition'],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2025-03-01T00:00:00Z',
};

const parentResult = deriveTodayContext({
  healthContext: parentingContext,
  clinicalPregnancy: null,
  children: [toddler],
  now: fixedNow,
});

assert.strictEqual(parentResult.lifecycleStage, 'parenting');
assert.strictEqual(parentResult.hero.type, 'parenting');
assert.strictEqual(parentResult.hero.childName, 'Zawadi');
assert.strictEqual(parentResult.hero.hasChildRecord, true);
assert.strictEqual(
  parentResult.priorities.some(p => p.id === 'parenting-kepi'),
  true,
  'Parenting must include KEPI immunization guidance'
);
assert.strictEqual(
  parentResult.priorities.some(p => p.id === 'parenting-danger'),
  true,
  'Parenting must include under-5 danger signs'
);
console.log('✓ Scenario 3 (Parenting): Uses child records, surfaces KEPI immunization & development guidance');

// ============================================================================
// 4. Planning Behavior
// ============================================================================
const planningContext: HealthContext = {
  version: 1,
  lifecycleStage: 'planning',
  language: 'en',
  preferredName: 'Sharon',
  interests: ['preconception', 'nutrition'],
  dietaryPreferences: [],
  havenResponseStyle: 'detailed',
  updatedAt: '2026-01-10T00:00:00Z',
};

const planResult = deriveTodayContext({
  healthContext: planningContext,
  clinicalPregnancy: null,
  now: fixedNow,
});

assert.strictEqual(planResult.lifecycleStage, 'planning');
assert.strictEqual(planResult.hero.type, 'planning');
assert.strictEqual(
  planResult.priorities.some(p => p.id === 'planning-folic'),
  true,
  'Planning must highlight preconception folic acid'
);
assert.strictEqual(
  planResult.priorities.some(p => p.id === 'planning-checkup'),
  true,
  'Planning must highlight preconception medical consultation'
);
console.log('✓ Scenario 4 (Planning): Preconception education & preparation without assuming pregnancy');

// ============================================================================
// 5. Supporter Behavior
// ============================================================================
const supporterContext: HealthContext = {
  version: 1,
  lifecycleStage: 'supporter',
  language: 'en',
  preferredName: 'Dennis',
  interests: ['partner_care'],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2026-01-10T00:00:00Z',
};

const supporterResult = deriveTodayContext({
  healthContext: supporterContext,
  clinicalPregnancy: null,
  now: fixedNow,
});

assert.strictEqual(supporterResult.lifecycleStage, 'supporter');
assert.strictEqual(supporterResult.hero.type, 'supporter');
assert.strictEqual(
  supporterResult.priorities.some(p => p.id === 'supporter-danger'),
  true,
  'Supporter must include danger signs awareness for partners'
);
assert.strictEqual(
  supporterResult.priorities.some(p => p.id === 'supporter-actions'),
  true,
  'Supporter must include daily practical actions'
);
console.log('✓ Scenario 5 (Supporter): Supportive content, practical help & danger signs watch');

// ============================================================================
// 6. Exploring Behavior
// ============================================================================
const exploringContext: HealthContext = {
  version: 1,
  lifecycleStage: 'exploring',
  language: 'sw',
  preferredName: 'Mgeni',
  interests: [],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2026-01-10T00:00:00Z',
};

const exploreResult = deriveTodayContext({
  healthContext: exploringContext,
  clinicalPregnancy: null,
  now: fixedNow,
});

assert.strictEqual(exploreResult.lifecycleStage, 'exploring');
assert.strictEqual(exploreResult.hero.type, 'exploring');
assert.strictEqual(exploreResult.language, 'sw');
assert.strictEqual(
  exploreResult.priorities.some(p => p.id === 'exploring-moh'),
  true,
  'Exploring must surface Kenya MOH healthcare rights & Linda Mama / SHA'
);
console.log('✓ Scenario 6 (Exploring): Educational discovery without forcing into pregnancy flow');

// ============================================================================
// 7. No Clinical Record (Self-Reported Draft Fallback vs. Empty Fallback)
// ============================================================================
const draftOnlyResult = deriveTodayContext({
  healthContext: pregnancyContext,
  clinicalPregnancy: null, // No clinical record
  now: fixedNow,
});

assert.strictEqual(draftOnlyResult.hero.type, 'pregnancy');
assert.strictEqual(draftOnlyResult.hero.isAuthoritative, false);
assert.strictEqual(draftOnlyResult.hero.provenanceTag, 'USER_REPORTED');
assert.strictEqual(draftOnlyResult.hero.gestationalWeeks, 18);
assert.strictEqual(draftOnlyResult.hasAuthoritativeClinicalData, false);

const noDatesPregResult = deriveTodayContext({
  healthContext: {
    ...pregnancyContext,
    pregnancy: undefined,
  },
  clinicalPregnancy: null,
  now: fixedNow,
});

assert.strictEqual(noDatesPregResult.hero.type, 'pregnancy');
assert.strictEqual(noDatesPregResult.hero.gestationalWeeks, 0, 'Must NOT fabricate fake 24 weeks');
console.log('✓ Scenario 7 (No Clinical Record): Clean fallback to draft or 0-week prompt without fabricating data');

// ============================================================================
// 8. No Context (Completely Uninitialized / Anonymous Initial Load)
// ============================================================================
const noContextResult = deriveTodayContext({
  healthContext: null,
  clinicalPregnancy: null,
  now: fixedNow,
});

assert.strictEqual(noContextResult.lifecycleStage, 'pregnancy', 'Defaults safely to pregnancy');
assert.strictEqual(noContextResult.greeting.name, 'Mama');
assert.strictEqual(noContextResult.priorities.length > 0, true);
assert.strictEqual(noContextResult.quickActions.length, 4);
console.log('✓ Scenario 8 (No Context): Safe fallback defaults without crash');

// ============================================================================
// 9. No Reminders (Ensures Zero Invented / Fabricated Appointments)
// ============================================================================
const noRemindersResult = deriveTodayContext({
  healthContext: pregnancyContext,
  clinicalPregnancy,
  reminders: [],
  now: fixedNow,
});

assert.strictEqual(
  noRemindersResult.priorities.some(p => p.category === 'reminder'),
  false,
  'Must NEVER fabricate fake reminder objects'
);
assert.strictEqual(
  noRemindersResult.priorities.some(p => p.description.toLowerCase().includes('kariokor')),
  false,
  'Must NOT hardcode fake clinic names like Kariokor'
);
assert.strictEqual(
  noRemindersResult.priorities.some(p => p.id === 'guideline-anc'),
  true,
  'Surfaces Kenya MOH recommended schedule instead of fabricated appointments'
);
console.log('✓ Scenario 9 (No Reminders): Replaces fabricated demo appointments with MOH educational guidelines');

// ============================================================================
// 10. Failed Context Load Simulation
// ============================================================================
// Simulate error by passing null context and verifying resilient UI derivation
const failedContextResult = deriveTodayContext({
  healthContext: null,
  clinicalPregnancy,
  reminders: [],
  now: fixedNow,
});
assert.strictEqual(failedContextResult.hero.type, 'pregnancy');
assert.strictEqual(failedContextResult.hero.isAuthoritative, true);
console.log('✓ Scenario 10 (Failed Context Load): Continues gracefully using clinical record');

// ============================================================================
// 11. Failed Pregnancy Load Simulation
// ============================================================================
const failedPregnancyResult = deriveTodayContext({
  healthContext: pregnancyContext,
  clinicalPregnancy: null,
  reminders: [],
  now: fixedNow,
});
assert.strictEqual(failedPregnancyResult.hero.type, 'pregnancy');
assert.strictEqual(failedPregnancyResult.hero.isAuthoritative, false);
console.log('✓ Scenario 11 (Failed Pregnancy Load): Recovers gracefully using personalization draft');

// ============================================================================
// 12. Real Reminders Integration
// ============================================================================
const realReminders: Reminder[] = [
  {
    id: 'rem-lab-1',
    userId: 'user-auth-1',
    title: 'Collect Routine Urine & Hemoglobin Lab Results',
    dueDate: '2026-09-08',
    category: 'anc',
    completed: false,
    createdAt: '2026-09-01T00:00:00Z',
  },
];

const withRemindersResult = deriveTodayContext({
  healthContext: pregnancyContext,
  clinicalPregnancy,
  reminders: realReminders,
  now: fixedNow,
});

assert.strictEqual(
  withRemindersResult.priorities.some(p => p.id === 'reminder-rem-lab-1'),
  true,
  'Real reminder from Firestore must be surfaced'
);
console.log('✓ Scenario 12 (Real Reminders): Seamlessly incorporates active reminders from Firestore');

console.log('All 12 Today Dashboard Behavioral Scenarios Verified Successfully!');
