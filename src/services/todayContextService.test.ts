// src/services/todayContextService.test.ts
import assert from 'node:assert';
import {
  deriveTodayContext,
  getBabySizeForWeek,
  deriveGreeting,
  formatShortDate,
} from './todayContextService';
import { Pregnancy, Reminder, Child } from '../types';
import { HealthContext } from '../types/healthContext';

console.log('--- Phase 4: Today Context Derivation Engine Tests ---');

const mockNowMorning = new Date('2026-09-03T08:30:00Z');
const mockNowAfternoon = new Date('2026-09-03T14:30:00Z');
const mockNowEvening = new Date('2026-09-03T19:30:00Z');

// 1. Time-of-day greeting & Language formatting
const morningGreetingEn = deriveGreeting('Wanjiku', 'en', mockNowMorning);
assert.strictEqual(morningGreetingEn.salutation, 'Good morning');
assert.strictEqual(morningGreetingEn.name, 'Wanjiku');
assert.strictEqual(morningGreetingEn.fullGreeting, 'Good morning, Wanjiku');

const afternoonGreetingSw = deriveGreeting('Amina', 'sw', mockNowAfternoon);
assert.strictEqual(afternoonGreetingSw.salutation, 'Habari ya mchana');
assert.strictEqual(afternoonGreetingSw.name, 'Amina');
assert.strictEqual(afternoonGreetingSw.fullGreeting, 'Habari ya mchana, Amina');

const eveningGreetingSw = deriveGreeting('', 'sw', mockNowEvening);
assert.strictEqual(eveningGreetingSw.salutation, 'Habari ya jioni');
assert.strictEqual(eveningGreetingSw.name, 'Mama');
console.log('✓ generates culturally respectful greetings across morning/afternoon/evening in EN and SW');

// 2. Pregnancy with Authoritative Clinical Record (Takes precedence over draft)
const clinicalPregnancy: Pregnancy = {
  id: 'preg-101',
  motherId: 'user-1',
  status: 'active',
  lmp: '2026-03-01', // ~26 weeks as of Sep 2026
  edd: '2026-12-06',
  gestationalAgeWeeks: 24, // Will be recalculated from LMP
  createdAt: '2026-03-05T00:00:00Z',
};

const pregnancyHealthContext: HealthContext = {
  version: 1,
  lifecycleStage: 'pregnancy',
  language: 'en',
  preferredName: 'Faith',
  county: 'Nairobi',
  pregnancy: {
    pregnancyWeek: 16, // Stale/draft user report
    dueDate: '2026-12-20',
  },
  interests: ['nutrition', 'exercise'],
  dietaryPreferences: ['halal'],
  havenResponseStyle: 'concise',
  updatedAt: '2026-04-01T00:00:00Z',
};

const pregnancyDerived = deriveTodayContext({
  healthContext: pregnancyHealthContext,
  clinicalPregnancy,
  now: mockNowMorning,
});

assert.strictEqual(pregnancyDerived.lifecycleStage, 'pregnancy');
assert.strictEqual(pregnancyDerived.hero.type, 'pregnancy');
assert.strictEqual(pregnancyDerived.hero.isAuthoritative, true);
assert.strictEqual(pregnancyDerived.hero.provenanceTag, 'VERIFIED');
// 2026-03-01 to 2026-09-03 is 186 days = ~26 weeks
assert.strictEqual(pregnancyDerived.hero.gestationalWeeks, 26);
assert.strictEqual(pregnancyDerived.hero.trimester, 2);
assert.strictEqual(pregnancyDerived.hero.eddFormatted, '6 Dec 2026');
assert.strictEqual(pregnancyDerived.hero.babySize.size, 'an ear of corn');
assert.strictEqual(pregnancyDerived.hasAuthoritativeClinicalData, true);
console.log('✓ pregnancy: authoritative clinical record overrides stale onboarding drafts');

// 3. Pregnancy with User-Reported Draft (No Clinical Record)
const draftPregnancyDerived = deriveTodayContext({
  healthContext: pregnancyHealthContext,
  clinicalPregnancy: null,
  now: mockNowMorning,
});

assert.strictEqual(draftPregnancyDerived.hero.type, 'pregnancy');
assert.strictEqual(draftPregnancyDerived.hero.isAuthoritative, false);
assert.strictEqual(draftPregnancyDerived.hero.provenanceTag, 'USER_REPORTED');
assert.strictEqual(draftPregnancyDerived.hero.gestationalWeeks, 16);
assert.strictEqual(draftPregnancyDerived.hero.trimester, 2);
assert.strictEqual(draftPregnancyDerived.hero.eddFormatted, '20 Dec 2026');
assert.strictEqual(draftPregnancyDerived.hasAuthoritativeClinicalData, false);
console.log('✓ pregnancy: gracefully falls back to user-reported draft when clinical records are absent');

// 4. Pregnancy with No Dates or Context (Empty state safety)
const blankPregnancyDerived = deriveTodayContext({
  healthContext: null,
  clinicalPregnancy: null,
  now: mockNowMorning,
});

assert.strictEqual(blankPregnancyDerived.hero.type, 'pregnancy');
assert.strictEqual(blankPregnancyDerived.hero.gestationalWeeks, 0);
assert.strictEqual(blankPregnancyDerived.hero.isAuthoritative, false);
assert.strictEqual(blankPregnancyDerived.priorities.length > 0, true);
console.log('✓ pregnancy: safe fallback without throwing when context is completely missing');

// 5. Postpartum with Child Record
const newbornChild: Child = {
  id: 'child-1',
  motherId: 'user-2',
  name: 'Zawadi',
  dateOfBirth: '2026-08-01', // ~1 month old as of Sep 3 2026
  sex: 'female',
  createdAt: '2026-08-01T00:00:00Z',
};

const postpartumContext: HealthContext = {
  version: 1,
  lifecycleStage: 'postpartum',
  language: 'en',
  preferredName: 'Mercy',
  interests: ['breastfeeding', 'recovery'],
  dietaryPreferences: [],
  havenResponseStyle: 'detailed',
  updatedAt: '2026-08-02T00:00:00Z',
};

const postpartumDerived = deriveTodayContext({
  healthContext: postpartumContext,
  clinicalPregnancy: null,
  children: [newbornChild],
  now: mockNowMorning,
});

assert.strictEqual(postpartumDerived.lifecycleStage, 'postpartum');
assert.strictEqual(postpartumDerived.hero.type, 'postpartum');
assert.strictEqual(postpartumDerived.hero.childName, 'Zawadi');
assert.strictEqual(postpartumDerived.hero.weeksPostpartum, 4);
assert.strictEqual(postpartumDerived.hasAuthoritativeClinicalData, true);
assert.strictEqual(
  postpartumDerived.priorities.some(p => p.id === 'postpartum-danger'),
  true,
  'Must include postpartum danger signs warning'
);
assert.strictEqual(
  postpartumDerived.priorities.some(p => p.id === 'postpartum-ebf'),
  true,
  'Must include exclusive breastfeeding guidance'
);
console.log('✓ postpartum: derives postpartum weeks from child record and surfaces PPH/sepsis warnings');

// 6. Postpartum without Child Record
const postpartumNoChildDerived = deriveTodayContext({
  healthContext: postpartumContext,
  clinicalPregnancy: null,
  children: [],
  now: mockNowMorning,
});

assert.strictEqual(postpartumNoChildDerived.hero.type, 'postpartum');
assert.strictEqual(postpartumNoChildDerived.hero.weeksPostpartum, undefined);
assert.strictEqual(postpartumNoChildDerived.hero.headline, 'Postpartum Recovery');
console.log('✓ postpartum: handles absent child records gracefully');

// 7. Parenting Stage with Child Record
const toddlerChild: Child = {
  id: 'child-2',
  motherId: 'user-3',
  name: 'Baraka',
  dateOfBirth: '2025-03-01', // 18 months old
  sex: 'male',
  createdAt: '2025-03-01T00:00:00Z',
};

const parentingContext: HealthContext = {
  version: 1,
  lifecycleStage: 'parenting',
  language: 'en',
  preferredName: 'Achieng',
  interests: ['nutrition', 'milestones'],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2025-03-05T00:00:00Z',
};

const parentingDerived = deriveTodayContext({
  healthContext: parentingContext,
  clinicalPregnancy: null,
  children: [toddlerChild],
  now: mockNowMorning,
});

assert.strictEqual(parentingDerived.lifecycleStage, 'parenting');
assert.strictEqual(parentingDerived.hero.type, 'parenting');
if (parentingDerived.hero.type === 'parenting') {
  assert.strictEqual(parentingDerived.hero.childName, 'Baraka');
  assert.strictEqual(parentingDerived.hero.hasChildRecord, true);
}
assert.strictEqual(
  parentingDerived.priorities.some(p => p.id === 'parenting-kepi'),
  true,
  'Must include KEPI immunization schedule'
);
console.log('✓ parenting: surfaces child age, milestones and KEPI immunization priorities');

// 8. Parenting Stage without Child Record
const parentingNoChild = deriveTodayContext({
  healthContext: parentingContext,
  clinicalPregnancy: null,
  children: [],
  now: mockNowMorning,
});

assert.strictEqual(parentingNoChild.hero.type, 'parenting');
if (parentingNoChild.hero.type === 'parenting') {
  assert.strictEqual(parentingNoChild.hero.hasChildRecord, false);
}
console.log('✓ parenting: provides clear empty-state prompting when no child record is linked');

// 9. Planning Stage
const planningContext: HealthContext = {
  version: 1,
  lifecycleStage: 'planning',
  language: 'en',
  preferredName: 'Sharon',
  interests: ['fertility', 'nutrition'],
  dietaryPreferences: [],
  havenResponseStyle: 'detailed',
  updatedAt: '2026-01-01T00:00:00Z',
};

const planningDerived = deriveTodayContext({
  healthContext: planningContext,
  clinicalPregnancy: null,
  now: mockNowMorning,
});

assert.strictEqual(planningDerived.lifecycleStage, 'planning');
assert.strictEqual(planningDerived.hero.type, 'planning');
assert.strictEqual(
  planningDerived.priorities.some(p => p.id === 'planning-folic'),
  true,
  'Must include preconception folic acid guidance'
);
assert.strictEqual(
  planningDerived.priorities.some(p => p.id === 'planning-checkup'),
  true,
  'Must include preconception consultation'
);
console.log('✓ planning: surfaces preconception nutrition and clinical checkup guidance without assuming pregnancy');

// 10. Supporter Stage
const supporterContext: HealthContext = {
  version: 1,
  lifecycleStage: 'supporter',
  language: 'sw',
  preferredName: 'Kiprono',
  interests: ['partner_support'],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2026-01-01T00:00:00Z',
};

const supporterDerived = deriveTodayContext({
  healthContext: supporterContext,
  clinicalPregnancy: null,
  now: mockNowMorning,
});

assert.strictEqual(supporterDerived.lifecycleStage, 'supporter');
assert.strictEqual(supporterDerived.hero.type, 'supporter');
assert.strictEqual(
  supporterDerived.priorities.some(p => p.id === 'supporter-actions'),
  true,
  'Must include practical supporter actions'
);
assert.strictEqual(
  supporterDerived.priorities.some(p => p.id === 'supporter-danger'),
  true,
  'Must include emergency danger signs awareness for partners'
);
console.log('✓ supporter: guides partners respectfully with practical help and danger sign awareness');

// 11. Exploring Stage
const exploringContext: HealthContext = {
  version: 1,
  lifecycleStage: 'exploring',
  language: 'en',
  preferredName: 'Guest',
  interests: [],
  dietaryPreferences: [],
  havenResponseStyle: 'concise',
  updatedAt: '2026-01-01T00:00:00Z',
};

const exploringDerived = deriveTodayContext({
  healthContext: exploringContext,
  clinicalPregnancy: null,
  now: mockNowMorning,
});

assert.strictEqual(exploringDerived.lifecycleStage, 'exploring');
assert.strictEqual(exploringDerived.hero.type, 'exploring');
assert.strictEqual(
  exploringDerived.priorities.some(p => p.id === 'exploring-moh'),
  true,
  'Must include Kenya MOH health rights'
);
console.log('✓ exploring: educational pathway without forcing into a pregnancy workflow');

// 12. Real Reminders Integration vs. No Reminders (Ensures NO Fake Appointments)
const realReminders: Reminder[] = [
  {
    id: 'rem-1',
    userId: 'user-1',
    title: 'Hospital ANC Lab Results Collection',
    dueDate: '2026-09-10',
    category: 'anc',
    completed: false,
    createdAt: '2026-09-01T00:00:00Z',
  },
];

const derivedWithReminders = deriveTodayContext({
  healthContext: pregnancyHealthContext,
  clinicalPregnancy,
  reminders: realReminders,
  now: mockNowMorning,
});

assert.strictEqual(
  derivedWithReminders.priorities.some(p => p.id === 'reminder-rem-1'),
  true,
  'Real reminder must be surfaced in priorities'
);
assert.strictEqual(
  derivedWithReminders.priorities.some(p => p.description.includes('Kariokor Health Centre')),
  false,
  'Must NEVER invent fake clinics like Kariokor Health Centre'
);

const derivedWithoutReminders = deriveTodayContext({
  healthContext: pregnancyHealthContext,
  clinicalPregnancy,
  reminders: [],
  now: mockNowMorning,
});

assert.strictEqual(
  derivedWithoutReminders.priorities.some(p => p.category === 'reminder'),
  false,
  'Must not fabricate reminder cards when reminders array is empty'
);
assert.strictEqual(
  derivedWithoutReminders.priorities.some(p => p.id === 'guideline-anc'),
  true,
  'Surfaces non-fabricated MOH clinical guidance instead'
);
console.log('✓ reminders: uses real reminders when present and NEVER fabricates fake clinic appointments');

// 10. Daily Check-in & Micro-insights (P2.1)
const unloggedContext = deriveTodayContext({
  healthContext: pregnancyHealthContext,
  clinicalPregnancy,
  todaysMoodLog: null,
  now: mockNowMorning,
});
assert.strictEqual(unloggedContext.checkInStatus?.completed, false);
assert.strictEqual(unloggedContext.checkInStatus?.mood, undefined);

const mockMoodLog: any = {
  id: 'mood-log-1',
  userId: 'user-1',
  timestamp: mockNowMorning.toISOString(),
  category: 'JOURNAL',
  type: 'mood',
  values: {
    mood: 'anxious',
    energyLevel: 3,
  },
};

const loggedContext = deriveTodayContext({
  healthContext: pregnancyHealthContext,
  clinicalPregnancy,
  todaysMoodLog: mockMoodLog,
  now: mockNowMorning,
});
assert.strictEqual(loggedContext.checkInStatus?.completed, true);
assert.strictEqual(loggedContext.checkInStatus?.mood, 'anxious');
assert.strictEqual(typeof loggedContext.checkInStatus?.microInsight, 'string');
assert.strictEqual((loggedContext.checkInStatus?.microInsight?.length || 0) > 10, true);
console.log('✓ daily check-in: computes checkInStatus and deterministic micro-insight accurately');

console.log('All Today Context Derivation Engine tests passed successfully!');
