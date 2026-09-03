import assert from 'node:assert/strict';
import {
  isLifecycleStage,
  isUserMode,
  userReportedFact,
  systemDerivedFact,
  verifiedFact,
  LIFECYCLE_STAGES,
  HealthContext,
  FORBIDDEN_CLINICAL_FIELDS,
} from '../types/healthContext';
import {
  mergeHealthContext,
  sanitizeHealthContext,
  CURRENT_CONTEXT_VERSION,
} from './healthContextService';
import {
  mergeServerHealthContext,
  sanitizeServerHealthContext,
} from '../../server/services/healthContextService';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`✓ ${name}`);
}

console.log('\n--- HealthContext Architecture Foundation Tests ---\n');

// 1. Lifecycle Stage
test('validates all canonical lifecycle stages', () => {
  for (const stage of LIFECYCLE_STAGES) {
    assert.equal(isLifecycleStage(stage), true, `Stage ${stage} should be valid`);
  }
  assert.equal(isLifecycleStage('invalid_stage'), false);
  assert.equal(isLifecycleStage(null), false);
  assert.equal(isLifecycleStage(123), false);
});

test('lifecycle stage operates consistently across user modes (anonymous vs. authenticated)', () => {
  assert.equal(isUserMode('anonymous'), true);
  assert.equal(isUserMode('authenticated'), true);
  assert.equal(isUserMode('other'), false);

  const anonContext = mergeHealthContext(null, {
    userMode: 'anonymous',
    lifecycleStage: 'pregnancy',
  });
  const authContext = mergeHealthContext(null, {
    userMode: 'authenticated',
    lifecycleStage: 'pregnancy',
  });

  assert.equal(anonContext.lifecycleStage, authContext.lifecycleStage);
  assert.equal(anonContext.lifecycleStage, 'pregnancy');
  assert.equal(anonContext.userMode, 'anonymous');
  assert.equal(authContext.userMode, 'authenticated');
});

// 2. Provenance Contract
test('creates provenance records with explicit classification and metadata', () => {
  const reported = userReportedFact('Folic acid vitamins', {
    source: 'user_onboarding',
    enteredBy: 'user-123',
  });
  assert.equal(reported.provenance, 'USER_REPORTED');
  assert.equal(reported.value, 'Folic acid vitamins');
  assert.equal(reported.source, 'user_onboarding');
  assert.equal(reported.enteredBy, 'user-123');
  assert.equal(reported.verifiedBy, undefined);

  const verified = verifiedFact('ANC Visit 2 Completed', {
    enteredBy: 'clinician-456',
    verifiedBy: 'clinician-456',
    verifiedAt: '2026-09-02T10:00:00Z',
  });
  assert.equal(verified.provenance, 'VERIFIED');
  assert.equal(verified.verifiedBy, 'clinician-456');

  const derived = systemDerivedFact('Third Trimester Guidance', {
    source: 'gestational_age_calculation',
  });
  assert.equal(derived.provenance, 'SYSTEM_DERIVED');
  assert.equal(derived.source, 'gestational_age_calculation');
});

// 3. Clinical Separation & Sanitization
test('strips authoritative clinical fields from personalization context', () => {
  const payloadWithClinicalData = {
    lifecycleStage: 'pregnancy' as const,
    preferredName: 'Amina',
    // Forbidden authoritative clinical fields:
    lmp: '2026-01-01',
    edd: '2026-10-08',
    gestationalAgeWeeks: 35,
    bloodGroup: 'O+',
    chronicConditions: ['Hypertension'],
    authoritativeDiagnosis: 'Pre-eclampsia',
    verifiedBloodPressure: '140/90',
  };

  const sanitized = sanitizeHealthContext(payloadWithClinicalData);
  assert.equal((sanitized as any).lmp, undefined);
  assert.equal((sanitized as any).edd, undefined);
  assert.equal((sanitized as any).gestationalAgeWeeks, undefined);
  assert.equal((sanitized as any).bloodGroup, undefined);
  assert.equal((sanitized as any).chronicConditions, undefined);
  assert.equal((sanitized as any).authoritativeDiagnosis, undefined);
  assert.equal((sanitized as any).verifiedBloodPressure, undefined);
  assert.equal(sanitized.preferredName, 'Amina');

  const merged = mergeHealthContext(null, payloadWithClinicalData);
  assert.equal((merged as any).lmp, undefined);
  assert.equal((merged as any).edd, undefined);
  assert.equal((merged as any).gestationalAgeWeeks, undefined);
  assert.equal((merged as any).authoritativeDiagnosis, undefined);
});

// 4. Safe Merge Behavior & Field Preservation
test('preserves existing fields when partial updates are applied', () => {
  const existing: HealthContext = {
    version: 1,
    lifecycleStage: 'pregnancy',
    userMode: 'authenticated',
    preferredName: 'Wanjiku',
    county: 'Nyeri',
    subcounty: 'Tetū',
    location: { county: 'Nyeri', subcounty: 'Tetū' },
    language: 'sw',
    interests: ['nutrition', 'anc'],
    dietaryPreferences: ['vegetarian'],
    havenResponseStyle: 'detailed',
    pregnancy: {
      pregnancyWeek: 18,
      multiplePregnancy: false,
    },
    updatedAt: '2026-08-01T00:00:00Z',
  };

  // User only updates preferredName and adds an interest
  const updates = {
    preferredName: 'Mama Neema',
    interests: ['nutrition', 'anc', 'birth_prep'],
  };

  const merged = mergeHealthContext(existing, updates);

  // Updated fields
  assert.equal(merged.preferredName, 'Mama Neema');
  assert.deepEqual(merged.interests, ['nutrition', 'anc', 'birth_prep']);

  // Preserved fields
  assert.equal(merged.lifecycleStage, 'pregnancy');
  assert.equal(merged.county, 'Nyeri');
  assert.equal(merged.language, 'sw');
  assert.deepEqual(merged.dietaryPreferences, ['vegetarian']);
  assert.equal(merged.havenResponseStyle, 'detailed');
  assert.equal(merged.pregnancy?.pregnancyWeek, 18);
  assert.equal(merged.pregnancy?.multiplePregnancy, false);
});

test('safely merges nested pregnancy personalization signals without erasing existing signals', () => {
  const existing: HealthContext = {
    version: 1,
    lifecycleStage: 'pregnancy',
    preferredName: 'Halima',
    language: 'en',
    interests: [],
    dietaryPreferences: [],
    havenResponseStyle: 'concise',
    pregnancy: {
      pregnancyWeek: 12,
      dueDate: '2026-11-20',
      multiplePregnancy: true,
    },
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const partialPregnancyUpdate = {
    pregnancy: {
      pregnancyWeek: 16,
    },
  };

  const merged = mergeHealthContext(existing, partialPregnancyUpdate);
  assert.equal(merged.pregnancy?.pregnancyWeek, 16);
  assert.equal(merged.pregnancy?.dueDate, '2026-11-20');
  assert.equal(merged.pregnancy?.multiplePregnancy, true);
});

// 5. Missing Context Handling
test('handles missing context safely with sensible defaults', () => {
  const merged = mergeHealthContext(null, {});
  assert.equal(merged.version, CURRENT_CONTEXT_VERSION);
  assert.equal(merged.lifecycleStage, 'pregnancy');
  assert.equal(merged.preferredName, 'Mama');
  assert.equal(merged.language, 'en');
  assert.deepEqual(merged.interests, []);
  assert.deepEqual(merged.dietaryPreferences, []);
  assert.equal(merged.havenResponseStyle, 'concise');
  assert.ok(merged.updatedAt);
});

// 6. Malformed Context Handling
test('handles malformed context safely without throwing', () => {
  const malformedInput = {
    lifecycleStage: 'corrupted_stage_name' as any,
    interests: 'not_an_array' as any,
    preferredName: null as any,
    authoritativeDiagnosis: 'forbidden',
  };

  const result = mergeHealthContext(null, malformedInput);
  // Falls back to safe defaults
  assert.equal(result.lifecycleStage, 'pregnancy');
  assert.equal(result.preferredName, 'Mama');
  assert.deepEqual(result.interests, []);
  assert.equal((result as any).authoritativeDiagnosis, undefined);

  // Non-object input
  const nonObjectResult = sanitizeHealthContext(null as any);
  assert.deepEqual(nonObjectResult, {});
});

// 7. Context Versioning
test('tracks context versioning and preserves version monotonicity', () => {
  const v1 = mergeHealthContext(null, { version: 1, lifecycleStage: 'planning' });
  assert.equal(v1.version, 1);

  const v2 = mergeHealthContext(v1, { version: 2, lifecycleStage: 'pregnancy' });
  assert.equal(v2.version, 2);

  // Does not regress version
  const regressed = mergeHealthContext(v2, { version: 1 });
  assert.equal(regressed.version, 2);
});

// 8. User Isolation Simulation
test('guarantees user context isolation between different user IDs', () => {
  const userAContext = mergeHealthContext(null, {
    preferredName: 'User A',
    county: 'Mombasa',
    interests: ['breastfeeding'],
  });

  const userBContext = mergeHealthContext(null, {
    preferredName: 'User B',
    county: 'Kisumu',
    interests: ['nutrition'],
  });

  assert.notEqual(userAContext.preferredName, userBContext.preferredName);
  assert.notEqual(userAContext.county, userBContext.county);
  assert.notDeepEqual(userAContext.interests, userBContext.interests);
});

// 9. Server Context Access and Clinical Separation
test('server health context service enforces clinical separation and safe merge', () => {
  const serverInput = {
    preferredName: 'Mama Server',
    county: 'Nakuru',
    // Clinical data to be stripped:
    lmp: '2026-02-01',
    edd: '2026-11-08',
    clinicalConditions: ['Asthma'],
  };

  const sanitizedServer = sanitizeServerHealthContext(serverInput);
  assert.equal((sanitizedServer as any).lmp, undefined);
  assert.equal((sanitizedServer as any).edd, undefined);
  assert.equal((sanitizedServer as any).clinicalConditions, undefined);
  assert.equal(sanitizedServer.preferredName, 'Mama Server');

  const mergedServer = mergeServerHealthContext(null, serverInput);
  assert.equal(mergedServer.preferredName, 'Mama Server');
  assert.equal(mergedServer.county, 'Nakuru');
  assert.equal((mergedServer as any).lmp, undefined);
});

console.log('\nAll HealthContext foundation tests passed successfully!\n');
