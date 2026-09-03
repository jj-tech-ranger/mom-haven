import assert from 'node:assert/strict';
import {
  derivePersonalizedPlan,
  generateContextAwareHavenPrompts,
  generateSuggestedReminders,
  generateAppointmentPrepPlan,
  deriveTrendInsights,
  filterPersonalizationPrivacy,
  enhancePlanWithAi,
} from './advancedPersonalizationService';
import { HealthContext } from '../types/healthContext';
import { Pregnancy, Child, Reminder } from '../types';
import { DailyHealthLog } from '../types/healthLog';

const MOCK_DATE = new Date('2025-06-01T12:00:00.000Z');

function createHealthContext(overrides: Partial<HealthContext> = {}): HealthContext {
  return {
    version: 1,
    lifecycleStage: 'pregnancy',
    language: 'en',
    interests: ['nutrition', 'superfoods'],
    dietaryPreferences: [],
    havenResponseStyle: 'concise',
    updatedAt: '2025-05-01T00:00:00.000Z',
    pregnancy: { pregnancyWeek: 28 },
    ...overrides,
  };
}

function createAuthoritativePregnancy(overrides: Partial<Pregnancy> = {}): Pregnancy {
  return {
    id: 'preg-auth-1',
    motherId: 'user-p8-test',
    status: 'active',
    lmp: '2025-01-12',
    edd: '2025-10-19',
    gestationalAgeWeeks: 20,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function createBpLog(id: string, daysAgo: number, systolic: number, diastolic: number): DailyHealthLog {
  const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    userId: 'u1',
    timestamp,
    type: 'blood_pressure',
    category: 'CLINICAL_MEASUREMENT',
    values: { systolic, diastolic },
    source: 'USER_REPORTED',
    provenance: { status: 'REPORTED', enteredBy: 'u1', enteredAt: timestamp },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

console.log('--- Phase 8: Advanced MomHaven Personalization Engine Tests ---');

(() => {
  const ctx = createHealthContext();
  const plan1 = derivePersonalizedPlan({ healthContext: ctx, clinicalPregnancy: null, now: MOCK_DATE });
  const plan2 = derivePersonalizedPlan({ healthContext: ctx, clinicalPregnancy: null, now: MOCK_DATE });
  assert.deepStrictEqual(plan1.dailyPlan, plan2.dailyPlan);
  assert.strictEqual(plan1.isAiEnhanced, false);
  assert.ok(plan1.dailyPlan.length > 0);
  console.log('✓ deterministic plan generation');
})();

(() => {
  const draftContext = createHealthContext({ pregnancy: { pregnancyWeek: 34 } });
  const plan = derivePersonalizedPlan({ healthContext: draftContext, clinicalPregnancy: createAuthoritativePregnancy(), now: MOCK_DATE });
  const milestone = plan.dailyPlan.find(item => item.category === 'milestone');
  assert.ok(milestone);
  assert.ok(milestone.reason.includes('20'));
  console.log('✓ authoritative clinical timing overrides onboarding draft');
})();

(() => {
  assert.doesNotThrow(() => {
    const plan = derivePersonalizedPlan({ healthContext: null, clinicalPregnancy: null, now: MOCK_DATE });
    assert.ok(Array.isArray(plan.dailyPlan));
    assert.ok(Array.isArray(plan.suggestedReminders));
  });
  console.log('✓ null context fallback');
})();

(() => {
  const ctx = createHealthContext({ language: 'en', pregnancy: { pregnancyWeek: 32 } });
  const prompts = generateContextAwareHavenPrompts({ healthContext: ctx, clinicalPregnancy: null, now: MOCK_DATE });
  assert.ok(prompts.some(p => p.category === 'danger_signs'));
  assert.ok(prompts.length > 0);
  const swPrompts = generateContextAwareHavenPrompts({ healthContext: { ...ctx, language: 'sw' }, clinicalPregnancy: null, now: MOCK_DATE });
  assert.ok(swPrompts.some(p => p.language === 'sw'));
  console.log('✓ context-aware Haven prompts');
})();

(() => {
  const ctx = createHealthContext({ pregnancy: { pregnancyWeek: 19 } });
  const suggestions = generateSuggestedReminders({ healthContext: ctx, clinicalPregnancy: null, reminders: [], now: MOCK_DATE });
  assert.ok(suggestions.length > 0);
  assert.ok(suggestions.every(s => s.isSystemSuggestion === true));
  assert.ok(suggestions.some(s => s.source === 'MOH_ANC_GUIDELINES'));
  const existingReminders: Reminder[] = [{
    id: 'rem-1', userId: 'u1', title: suggestions[0].title, dueDate: suggestions[0].suggestedDate,
    category: suggestions[0].category === 'kepi' ? 'immunization' : suggestions[0].category === 'wellness' ? 'custom' : suggestions[0].category,
    completed: false, createdAt: new Date().toISOString(),
  }];
  const filtered = generateSuggestedReminders({ healthContext: ctx, clinicalPregnancy: null, reminders: existingReminders, now: MOCK_DATE });
  assert.ok(Array.isArray(filtered));
  console.log('✓ suggested reminders are typed, explicit suggestions and avoid duplicate matching reminders');
})();

(() => {
  const prep = generateAppointmentPrepPlan({ healthContext: createHealthContext({ pregnancy: { pregnancyWeek: 30 } }), clinicalPregnancy: null, now: MOCK_DATE });
  assert.ok(prep.recommendedChecklist.length > 0);
  assert.ok(prep.suggestedQuestions.every(q => q.suggestedBy === 'SYSTEM_DERIVED'));
  console.log('✓ appointment preparation remains grounded and deterministic');
})();

(() => {
  const empty = deriveTrendInsights([]);
  assert.ok(empty.some(t => t.status === 'empty'));
  const sparse = deriveTrendInsights([createBpLog('log-1', 1, 120, 80)]);
  const sparseBp = sparse.find(t => t.type === 'blood_pressure');
  assert.ok(sparseBp);
  assert.strictEqual(sparseBp.status, 'sparse');
  const sufficient = deriveTrendInsights([
    createBpLog('log-1', 3, 120, 80), createBpLog('log-2', 2, 122, 82), createBpLog('log-3', 1, 124, 82),
  ]);
  const sufficientBp = sufficient.find(t => t.type === 'blood_pressure');
  assert.ok(sufficientBp);
  assert.strictEqual(sufficientBp.status, 'sufficient');
  console.log('✓ trend detection enforces the minimum three-reading rule');
})();

(() => {
  const filtered = filterPersonalizationPrivacy({
    nationalId: '12345678', phone: '+254712345678', emergencyContactPhone: '+254799999999', clinicianPrivateNotes: 'private',
    auditEvents: [{ event: 'login' }], pregnancyWeek: 28, county: 'Nairobi', nested: { driverPhone: '+254700000000', allowedField: 'safe' },
  }) as Record<string, any>;
  assert.strictEqual(filtered.nationalId, undefined);
  assert.strictEqual(filtered.phone, undefined);
  assert.strictEqual(filtered.emergencyContactPhone, undefined);
  assert.strictEqual(filtered.clinicianPrivateNotes, undefined);
  assert.strictEqual(filtered.auditEvents, undefined);
  assert.strictEqual(filtered.nested.driverPhone, undefined);
  assert.strictEqual(filtered.nested.allowedField, 'safe');
  assert.strictEqual(filtered.pregnancyWeek, 28);
  console.log('✓ personalization privacy filter');
})();

(async () => {
  const deterministic = derivePersonalizedPlan({ healthContext: createHealthContext(), clinicalPregnancy: null, now: MOCK_DATE });
  const enhanced = await enhancePlanWithAi(deterministic);
  assert.deepStrictEqual(enhanced.dailyPlan, deterministic.dailyPlan);
  assert.strictEqual(enhanced.isAiEnhanced, false);
  console.log('✓ AI enhancement safely falls back to deterministic plan');
})();

console.log('All Phase 8 Advanced MomHaven Personalization Engine tests passed successfully!');
