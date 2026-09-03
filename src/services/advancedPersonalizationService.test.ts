import assert from 'node:assert/strict';
import {
  derivePersonalizedPlan,
  generateContextAwareHavenPrompts,
  generateSuggestedReminders,
  generateAppointmentPrepPlan,
  deriveTrendInsights,
  deriveDeterministicDailyPlan,
  filterPersonalizationPrivacy,
  enhancePlanWithAi,
} from './advancedPersonalizationService';
import { HealthContext } from '../types/healthContext';
import { Pregnancy, Child, Reminder } from '../types';
import { DailyHealthLog } from '../types/healthLog';

const MOCK_DATE = new Date('2025-06-01T12:00:00.000Z');

function createHealthContext(overrides: Partial<HealthContext> = {}): HealthContext {
  return {
    userId: 'user-p8-test',
    lifecycleStage: 'pregnancy',
    confidenceScore: 0.9,
    language: 'en',
    interests: ['nutrition', 'superfoods'],
    provenance: {
      lifecycleStage: 'USER_REPORTED',
      pregnancy: 'USER_REPORTED',
      postpartum: 'USER_REPORTED',
      parenting: 'USER_REPORTED',
      planning: 'USER_REPORTED',
      supporter: 'USER_REPORTED',
      clinicalFlags: 'SYSTEM_DERIVED',
      recommendations: 'SYSTEM_DERIVED',
      auditTrail: [],
    },
    pregnancy: {
      pregnancyWeek: 28,
      isFirstPregnancy: true,
      hadPriorComplications: false,
    },
    clinicalSafetyFlags: [],
    recommendedActions: [],
    createdAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2025-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function createAuthoritativePregnancy(overrides: Partial<Pregnancy> = {}): Pregnancy {
  return {
    id: 'preg-auth-1',
    userId: 'user-p8-test',
    status: 'active',
    // 2025-06-01 minus 20 weeks = 2025-01-12
    lmp: '2025-01-12',
    edd: '2025-10-19',
    gestationalAgeWeeks: 20,
    currentTrimester: 2,
    riskLevel: 'LOW',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  };
}

console.log('--- Phase 8: Advanced MomHaven Personalization Engine Tests ---');

// Test 1: Deterministic Plan Generation
(() => {
  const ctx = createHealthContext();
  const plan1 = derivePersonalizedPlan({
    healthContext: ctx,
    clinicalPregnancy: null,
    now: MOCK_DATE,
  });
  const plan2 = derivePersonalizedPlan({
    healthContext: ctx,
    clinicalPregnancy: null,
    now: MOCK_DATE,
  });

  assert.deepStrictEqual(plan1.dailyPlan, plan2.dailyPlan);
  assert.strictEqual(plan1.isAiEnhanced, false);
  assert.ok(plan1.dailyPlan.length > 0);
  console.log('✓ deterministic: produces identical plans given identical inputs');
})();

// Test 2: Clinical Records Priority over Onboarding Drafts
(() => {
  // Draft says 34 weeks, but authoritative clinical record says LMP was 20 weeks ago
  const draftContext = createHealthContext({
    pregnancy: {
      pregnancyWeek: 34,
    },
  });
  const authPreg = createAuthoritativePregnancy({
    lmp: '2025-01-12', // 20 weeks on 2025-06-01
  });

  const plan = derivePersonalizedPlan({
    healthContext: draftContext,
    clinicalPregnancy: authPreg,
    now: MOCK_DATE,
  });

  // Verify daily plan reflects Week 20 (not Week 34)
  const milestoneItem = plan.dailyPlan.find(i => i.category === 'milestone');
  assert.ok(milestoneItem);
  assert.ok(milestoneItem.reason.includes('20'), `Expected reason to mention Week 20, got: ${milestoneItem.reason}`);
  console.log('✓ clinical priority: authoritative clinical record overrides stale onboarding drafts');
})();

// Test 3: Safe Fallback when Context is Missing or Null
(() => {
  assert.doesNotThrow(() => {
    const plan = derivePersonalizedPlan({
      healthContext: null,
      clinicalPregnancy: null,
      now: MOCK_DATE,
    });
    assert.ok(Array.isArray(plan.dailyPlan));
    assert.ok(Array.isArray(plan.suggestedReminders));
    assert.ok(Array.isArray(plan.contextAwareHavenPrompts));
  });
  console.log('✓ resilience: safe fallback without throwing when context is null/missing');
})();

// Test 4: Context-Aware Haven Prompts
(() => {
  // Third trimester English
  const ctx3rd = createHealthContext({ language: 'en', pregnancy: { pregnancyWeek: 32 } });
  const prompts3rd = generateContextAwareHavenPrompts({
    healthContext: ctx3rd,
    clinicalPregnancy: null,
    now: MOCK_DATE,
  });
  assert.ok(prompts3rd.some(p => p.category === 'danger_signs'));
  assert.ok(prompts3rd.some(p => p.id === 'haven-p-hospital-bag'));

  // Swahili translations
  const ctxSw = createHealthContext({ language: 'sw', pregnancy: { pregnancyWeek: 32 } });
  const promptsSw = generateContextAwareHavenPrompts({
    healthContext: ctxSw,
    clinicalPregnancy: null,
    now: MOCK_DATE,
  });
  assert.ok(promptsSw.some(p => p.prompt.includes('Dalili za hatari')));

  // Nutrition interest prompt includes Kenyan superfoods
  assert.ok(prompts3rd.some(p => p.prompt.includes('Kenyan superfoods') || p.id === 'haven-p-iron-foods'));
  console.log('✓ context-aware prompts: generates stage-relevant, Swahili-aware, and nutrition-informed Haven prompts');
})();

// Test 5: Suggested Reminders (Kenya MOH ANC & KEPI Immunization Schedules)
(() => {
  // Pregnancy at 19 weeks should suggest ANC Contact 2 (due at 20 weeks)
  const ctx19w = createHealthContext({ pregnancy: { pregnancyWeek: 19 } });
  const suggestions = generateSuggestedReminders({
    healthContext: ctx19w,
    clinicalPregnancy: null,
    reminders: [],
    now: MOCK_DATE,
  });

  const anc2 = suggestions.find(s => s.id === 'sug-anc-2');
  assert.ok(anc2, 'Expected ANC Contact 2 to be suggested');
  assert.strictEqual(anc2.isSystemSuggestion, true);
  assert.strictEqual(anc2.source, 'MOH_ANC_GUIDELINES');

  // If user already has an active reminder for ANC Contact 2, do NOT duplicate it!
  const existingRem: Reminder[] = [
    {
      id: 'rem-1',
      userId: 'u1',
      title: 'ANC Contact 2 appointment at Kasarani Clinic',
      dueDate: '2025-06-08',
      category: 'anc',
      completed: false,
    },
  ];
  const suggestionsFiltered = generateSuggestedReminders({
    healthContext: ctx19w,
    clinicalPregnancy: null,
    reminders: existingRem,
    now: MOCK_DATE,
  });
  assert.ok(!suggestionsFiltered.some(s => s.id === 'sug-anc-2'), 'Should not suggest ANC 2 if already scheduled');

  // Child at 6 weeks should suggest 6-Week Immunizations
  const mockChild: Child = {
    id: 'child-1',
    userId: 'u1',
    name: 'Amani',
    // Born 6 weeks before 2025-06-01 = 2025-04-20
    dateOfBirth: '2025-04-20',
    gender: 'female',
    createdAt: '2025-04-20T00:00:00.000Z',
    updatedAt: '2025-04-20T00:00:00.000Z',
  };
  const ctxChild = createHealthContext({
    lifecycleStage: 'parenting',
    pregnancy: undefined,
  });
  const childSuggestions = generateSuggestedReminders({
    healthContext: ctxChild,
    clinicalPregnancy: null,
    children: [mockChild],
    reminders: [],
    now: MOCK_DATE,
  });
  assert.ok(childSuggestions.some(s => s.id === 'sug-kepi-5'), 'Expected 6-week KEPI immunization suggestion');
  console.log('✓ suggested reminders: correctly suggests upcoming MOH ANC and KEPI immunization visits without duplicating existing reminders');
})();

// Test 6: Appointment Prep & Grounded Clinician Questions
(() => {
  const ctx30w = createHealthContext({ pregnancy: { pregnancyWeek: 30 } });
  const prep = generateAppointmentPrepPlan({
    healthContext: ctx30w,
    clinicalPregnancy: null,
    now: MOCK_DATE,
  });

  // Checklist includes KMOH 216 booklet and National ID
  assert.ok(prep.recommendedChecklist.some(c => c.item.includes('KMOH 216')));
  assert.ok(prep.recommendedChecklist.some(c => c.item.includes('National ID')));
  assert.ok(prep.recommendedChecklist.some(c => c.item.includes('Birth Plan')));

  // Questions are grounded in real third trimester milestone
  assert.ok(prep.suggestedQuestions.some(q => q.category === 'birth_plan'));
  assert.ok(prep.suggestedQuestions.every(q => q.suggestedBy === 'SYSTEM_DERIVED'));
  console.log('✓ appointment prep: produces grounded checklist and context-justified clinician questions');
})();

// Test 7: Clinically Valid Trend Detection (Minimum 3 points rule)
(() => {
  // Empty logs
  const emptyTrends = deriveTrendInsights([]);
  assert.strictEqual(emptyTrends[0].status, 'empty');

  // Sparse logs (< 3 entries)
  const sparseLogs: DailyHealthLog[] = [
    {
      id: 'log-1',
      userId: 'u1',
      logDate: '2025-05-30',
      bloodPressure: { systolic: 120, diastolic: 80, recordedAt: '2025-05-30T09:00:00Z' },
      createdAt: '2025-05-30T09:00:00Z',
      updatedAt: '2025-05-30T09:00:00Z',
    },
  ];
  const sparseTrends = deriveTrendInsights(sparseLogs);
  const bpTrend = sparseTrends.find(t => t.type === 'blood_pressure');
  assert.ok(bpTrend);
  assert.strictEqual(bpTrend.status, 'sparse');
  assert.ok(bpTrend.summary.includes('At least 3 readings are needed'));

  // Sufficient logs (3 entries)
  const sufficientLogs: DailyHealthLog[] = [
    ...sparseLogs,
    {
      id: 'log-2',
      userId: 'u1',
      logDate: '2025-05-31',
      bloodPressure: { systolic: 122, diastolic: 82, recordedAt: '2025-05-31T09:00:00Z' },
      createdAt: '2025-05-31T09:00:00Z',
      updatedAt: '2025-05-31T09:00:00Z',
    },
    {
      id: 'log-3',
      userId: 'u1',
      logDate: '2025-06-01',
      bloodPressure: { systolic: 124, diastolic: 82, recordedAt: '2025-06-01T09:00:00Z' },
      createdAt: '2025-06-01T09:00:00Z',
      updatedAt: '2025-06-01T09:00:00Z',
    },
  ];
  const sufficientTrends = deriveTrendInsights(sufficientLogs);
  const sufficientBp = sufficientTrends.find(t => t.type === 'blood_pressure');
  assert.ok(sufficientBp);
  assert.strictEqual(sufficientBp.status, 'sufficient');
  console.log('✓ clinical trend detection: strictly enforces MIN_DATA_POINTS_FOR_TREND and avoids premature conclusions');
})();

// Test 8: Privacy Filtering Helper
(() => {
  const sensitiveContext = {
    userId: 'u-123',
    nationalId: '12345678',
    phone: '+254712345678',
    emergencyContactPhone: '+254799999999',
    clinicianPrivateNotes: 'Doctor private observations here',
    auditEvents: [{ event: 'login' }],
    pregnancyWeek: 28,
    county: 'Nairobi',
    nested: {
      driverPhone: '+254700000000',
      allowedField: 'safe value',
    },
  };

  const filtered = filterPersonalizationPrivacy(sensitiveContext) as any;
  assert.strictEqual(filtered.nationalId, undefined);
  assert.strictEqual(filtered.phone, undefined);
  assert.strictEqual(filtered.emergencyContactPhone, undefined);
  assert.strictEqual(filtered.clinicianPrivateNotes, undefined);
  assert.strictEqual(filtered.auditEvents, undefined);
  assert.strictEqual(filtered.nested.driverPhone, undefined);
  assert.strictEqual(filtered.nested.allowedField, 'safe value');
  assert.strictEqual(filtered.pregnancyWeek, 28);
  assert.strictEqual(filtered.county, 'Nairobi');
  console.log('✓ privacy filter: completely strips private notes, phones, and sensitive audit records');
})();

// Test 9: Safe AI Enhancement Fallback
(async () => {
  const ctx = createHealthContext();
  const deterministicPlan = derivePersonalizedPlan({
    healthContext: ctx,
    clinicalPregnancy: null,
    now: MOCK_DATE,
  });

  const enhanced = await enhancePlanWithAi(deterministicPlan);
  assert.deepStrictEqual(enhanced.dailyPlan, deterministicPlan.dailyPlan);
  assert.strictEqual(enhanced.isAiEnhanced, false);
  console.log('✓ ai fallback guarantee: preserves deterministic plan completely when AI is disabled/offline');
})();

console.log('All Phase 8 Advanced MomHaven Personalization Engine tests passed successfully!');
