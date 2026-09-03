import assert from 'node:assert/strict';
import {
  saveAnonymousContextDraft,
  getAnonymousContextDraft,
  clearAnonymousContextDraft,
  hasAnonymousContextDraft,
  isAnonymousContextExpired,
  sanitizeAnonymousDraftInput,
  ANONYMOUS_STORAGE_KEY,
  DEFAULT_ANONYMOUS_TTL_MS,
  type AnonymousContextDraft,
} from './anonymousContextService';
import {
  validateAndSanitizeSyncPayload,
  mergeAnonymousDraftIntoContext,
} from '../../server/routes/contextSync';
import type { ServerHealthContext } from '../../server/services/healthContextService';

// Mock localStorage for Node test runner
const memoryStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => memoryStorage.get(key) || null,
  setItem: (key: string, val: string) => memoryStorage.set(key, String(val)),
  removeItem: (key: string) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`✓ ${name}`);
}

async function runTests() {
  console.log('\n--- Phase 2: Anonymous Personalization & Context Continuity Tests ---\n');

  // Test 1: Anonymous context creation
  await test('creates and persists valid anonymous context draft with TTL', () => {
    localStorage.clear();
    const draft = saveAnonymousContextDraft({
      lifecycleStage: 'pregnancy',
      language: 'en',
      pregnancyWeek: 18,
      dueDate: '2026-10-15',
      interests: ['nutrition', 'anc'],
      havenResponseStyle: 'concise',
    });

    assert.ok(draft, 'Draft should be created');
    assert.equal(draft.lifecycleStage, 'pregnancy');
    assert.equal(draft.pregnancyWeek, 18);
    assert.equal(draft.dueDate, '2026-10-15');
    assert.equal(draft.language, 'en');
    assert.deepEqual(draft.interests, ['nutrition', 'anc']);
    assert.ok(draft.createdAt, 'Should contain createdAt timestamp');
    assert.ok(draft.expiresAt, 'Should contain expiresAt timestamp');

    const retrieved = getAnonymousContextDraft();
    assert.ok(retrieved, 'Draft should be retrievable from localStorage');
    assert.equal(retrieved.pregnancyWeek, 18);
    assert.equal(hasAnonymousContextDraft(), true);
  });

  // Test 2: Context expiration and clearing
  await test('handles context expiration and manual clearing accurately', () => {
    localStorage.clear();
    const pastDate = new Date(Date.now() - 10000).toISOString();
    const futureDate = new Date(Date.now() + 100000).toISOString();

    assert.equal(isAnonymousContextExpired({ expiresAt: pastDate }), true);
    assert.equal(isAnonymousContextExpired({ expiresAt: futureDate }), false);
    assert.equal(isAnonymousContextExpired({ expiresAt: '' as any }), true);

    // Save an already expired draft directly to localStorage
    const expiredDraft: AnonymousContextDraft = {
      lifecycleStage: 'pregnancy',
      language: 'en',
      pregnancyWeek: 12,
      interests: [],
      createdAt: new Date(Date.now() - 20000).toISOString(),
      expiresAt: pastDate,
    };
    localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(expiredDraft));

    // getAnonymousContextDraft should detect expiration, clear storage, and return null
    const result = getAnonymousContextDraft();
    assert.equal(result, null, 'Expired draft must return null');
    assert.equal(localStorage.getItem(ANONYMOUS_STORAGE_KEY), null, 'Expired draft must be evicted');

    // Test explicit clearing
    saveAnonymousContextDraft({
      lifecycleStage: 'postpartum',
      language: 'sw',
      interests: ['breastfeeding'],
    });
    assert.equal(hasAnonymousContextDraft(), true);
    clearAnonymousContextDraft();
    assert.equal(hasAnonymousContextDraft(), false);
    assert.equal(getAnonymousContextDraft(), null);
  });

  // Test 3: Privileged clinical field rejection (Client and Server)
  await test('rejects and strips privileged clinical fields from anonymous context', () => {
    const maliciousInput = {
      lifecycleStage: 'pregnancy',
      pregnancyWeek: 20,
      language: 'en',
      interests: ['nutrition'],
      // Forbidden clinical fields that must NEVER exist in anonymous drafts:
      bloodPressure: '140/90',
      hivStatus: 'reactive',
      authoritativeDiagnosis: 'Pre-eclampsia',
      clinicalNotes: 'Urgent consult required',
      lmp: '2026-01-01',
      bloodGroup: 'O+',
    };

    const sanitized = sanitizeAnonymousDraftInput(maliciousInput);
    assert.equal((sanitized as any).bloodPressure, undefined);
    assert.equal((sanitized as any).hivStatus, undefined);
    assert.equal((sanitized as any).authoritativeDiagnosis, undefined);
    assert.equal((sanitized as any).clinicalNotes, undefined);
    assert.equal((sanitized as any).lmp, undefined);
    assert.equal((sanitized as any).bloodGroup, undefined);
    assert.equal(sanitized.pregnancyWeek, 20);

    // Server-side validation check
    const serverCheck = validateAndSanitizeSyncPayload(
      { draft: maliciousInput },
      'verified-user-123',
    );
    assert.equal(serverCheck.valid, false, 'Server must reject privileged clinical fields');
    assert.ok(
      serverCheck.error?.includes('Privileged clinical field'),
      'Error must mention privileged clinical field',
    );
  });

  // Test 4: UID spoofing detection and token authority
  await test('detects and rejects UID spoofing attempts on sync endpoint', () => {
    const verifiedUid = 'genuine-mother-abc';
    const spoofedUid = 'attacker-impersonating-xyz';

    // Attacker tries to pass spoofed UID in the payload body
    const spoofAttempt = validateAndSanitizeSyncPayload(
      {
        uid: spoofedUid,
        lifecycleStage: 'pregnancy',
        pregnancyWeek: 14,
      },
      verifiedUid,
    );

    assert.equal(spoofAttempt.valid, false);
    assert.ok(
      spoofAttempt.error?.includes('UID mismatch detected'),
      'Must flag UID spoofing mismatch',
    );

    // Same with userId key
    const spoofAttempt2 = validateAndSanitizeSyncPayload(
      {
        userId: spoofedUid,
        lifecycleStage: 'pregnancy',
      },
      verifiedUid,
    );
    assert.equal(spoofAttempt2.valid, false);
    assert.ok(spoofAttempt2.error?.includes('userId mismatch detected'));
  });

  // Test 5: Malformed payload rejection
  await test('rejects malformed payloads gracefully', () => {
    const verifiedUid = 'mother-123';

    // Invalid lifecycle stage
    const badStage = validateAndSanitizeSyncPayload(
      { lifecycleStage: 'space_traveler' },
      verifiedUid,
    );
    assert.equal(badStage.valid, false);
    assert.ok(badStage.error?.includes('Invalid lifecycle stage'));

    // Invalid pregnancy week (> 44)
    const badWeek = validateAndSanitizeSyncPayload(
      { lifecycleStage: 'pregnancy', pregnancyWeek: 99 },
      verifiedUid,
    );
    assert.equal(badWeek.valid, false);
    assert.ok(badWeek.error?.includes('pregnancyWeek must be an integer between 1 and 44'));

    // Invalid due date
    const badDueDate = validateAndSanitizeSyncPayload(
      { lifecycleStage: 'pregnancy', dueDate: 'invalid-date-format' },
      verifiedUid,
    );
    assert.equal(badDueDate.valid, false);
    assert.ok(badDueDate.error?.includes('dueDate must be a valid ISO date string'));
  });

  // Test 6: Deterministic merge when no existing context exists (New Account)
  await test('initializes complete health context when syncing new account', () => {
    const draftPayload = {
      lifecycleStage: 'pregnancy' as const,
      language: 'sw' as const,
      pregnancyWeek: 22,
      dueDate: '2026-11-20',
      interests: ['nutrition', 'anc'],
      havenResponseStyle: 'detailed' as const,
      county: 'Kilifi',
    };

    const newContext = mergeAnonymousDraftIntoContext(null, draftPayload, 'Amina');

    assert.equal(newContext.version, 1);
    assert.equal(newContext.userMode, 'authenticated');
    assert.equal(newContext.preferredName, 'Amina');
    assert.equal(newContext.language, 'sw');
    assert.equal(newContext.lifecycleStage, 'pregnancy');
    assert.equal(newContext.pregnancy?.pregnancyWeek, 22);
    assert.equal(newContext.pregnancy?.dueDate, '2026-11-20');
    assert.equal(newContext.county, 'Kilifi');
    assert.deepEqual(newContext.interests, ['nutrition', 'anc']);
    assert.equal(newContext.havenResponseStyle, 'detailed');
    assert.equal(newContext.onboarding?.completed, true);
    assert.equal(newContext.onboarding?.source, 'anonymous_context_sync');
  });

  // Test 7: Deterministic merge with existing authenticated context (Preservation)
  await test('preserves established clinical facts and deterministically merges preferences', () => {
    const establishedContext: ServerHealthContext = {
      version: 2,
      lifecycleStage: 'pregnancy',
      userMode: 'authenticated',
      preferredName: 'Wanjiku',
      language: 'en',
      pregnancy: {
        pregnancyWeek: 26, // Verified clinical week
        dueDate: '2026-09-10',
        dueDateSource: 'ULTRASOUND',
        multiplePregnancy: false,
      },
      interests: ['anc'],
      havenResponseStyle: 'concise',
      county: 'Nairobi',
      onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
    };

    // Anonymous device draft has newer preferences and a different estimated week
    const incomingDraft = {
      lifecycleStage: 'pregnancy' as const,
      language: 'sw' as const,
      pregnancyWeek: 24, // Differing anonymous estimate must NOT overwrite established week 26
      interests: ['nutrition', 'warning_signs'], // New interests
      havenResponseStyle: 'appointment_prep' as const, // Updated response style
      subcounty: 'Westlands', // Missing field that should be hydrated
    };

    const merged = mergeAnonymousDraftIntoContext(establishedContext, incomingDraft, 'Wanjiku');

    // Rule 1: Version increments monotonically
    assert.equal(merged.version, 3);

    // Rule 2: Established clinical pregnancy facts are preserved (week 26, not week 24)
    assert.equal(merged.pregnancy?.pregnancyWeek, 26, 'Established pregnancy week must not be overwritten');
    assert.equal(merged.pregnancy?.dueDateSource, 'ULTRASOUND', 'Authoritative due date source preserved');

    // Rule 3: Preferred name is preserved
    assert.equal(merged.preferredName, 'Wanjiku');

    // Rule 4: Interests are unioned without duplicates
    assert.deepEqual(merged.interests, ['anc', 'nutrition', 'warning_signs']);

    // Rule 5: Non-sensitive preferences updated
    assert.equal(merged.language, 'sw');
    assert.equal(merged.havenResponseStyle, 'appointment_prep');

    // Rule 6: Missing subcounty was hydrated
    assert.equal(merged.subcounty, 'Westlands');
    assert.equal(merged.county, 'Nairobi');
  });

  // Test 8: Hydrates missing pregnancy week if established context lacked it
  await test('hydrates missing pregnancy fields if existing context lacked them', () => {
    const existingWithoutWeek: ServerHealthContext = {
      version: 1,
      lifecycleStage: 'pregnancy',
      userMode: 'authenticated',
      preferredName: 'Mama',
      interests: [],
    };

    const draft = {
      lifecycleStage: 'pregnancy' as const,
      pregnancyWeek: 14,
      dueDate: '2026-12-01',
    };

    const merged = mergeAnonymousDraftIntoContext(existingWithoutWeek, draft, 'Mama');
    assert.equal(merged.pregnancy?.pregnancyWeek, 14, 'Missing pregnancy week should be hydrated');
    assert.equal(merged.pregnancy?.dueDate, '2026-12-01');
  });

  console.log('\nAll Phase 2 Anonymous Personalization & Continuity tests passed successfully!\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
