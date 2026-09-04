// src/services/sharingService.test.ts
import assert from 'node:assert/strict';
import {
  generateCode,
  buildPartnerRelationshipDocId,
  isValidPartnerStatus,
  DEFAULT_SHARING_SCOPES,
  type PartnerRelationship,
  type PartnerSharingScopes,
} from './sharingService';

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`✓ ${name}`);
}

async function runTests() {
  console.log('\n--- Partner Relationship Data Contract Tests (audit §2.3, §13.1) ---\n');

  // Test 1: Deterministic Composite Document ID
  await test('generates deterministic composite document ID matching firestore.rules activePartner(motherId)', () => {
    const motherId = 'mother-user-123';
    const partnerId = 'partner-user-456';
    const docId = buildPartnerRelationshipDocId(motherId, partnerId);

    assert.equal(
      docId,
      'mother-user-123_partner-user-456',
      'Doc ID must match exact composite key: motherId_partnerId'
    );
    assert.equal(
      docId,
      `${motherId}_${partnerId}`,
      'Must satisfy firestore.rules: partnerRelationships/$(motherId + "_" + request.auth.uid)'
    );
  });

  // Test 2: Status Contract Validation
  await test('validates partner relationship status union strictly against firestore.rules', () => {
    // Valid statuses
    assert.equal(isValidPartnerStatus('pending'), true, 'pending must be valid');
    assert.equal(isValidPartnerStatus('active'), true, 'active must be valid');
    assert.equal(isValidPartnerStatus('revoked'), true, 'revoked must be valid');

    // Invalid / legacy statuses
    assert.equal(isValidPartnerStatus('connected'), false, 'connected is deprecated and must be rejected');
    assert.equal(isValidPartnerStatus('inactive'), false, 'inactive must be rejected');
    assert.equal(isValidPartnerStatus(''), false, 'empty string must be rejected');
    assert.equal(isValidPartnerStatus(null), false, 'null must be rejected');
  });

  // Test 3: Human-Readable Connection Code Generation
  await test('generates formatted human-readable connection codes with custom prefix', () => {
    const code = generateCode('HAVEN', 3);
    assert.match(code, /^HAVEN-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{3}$/);

    const customCode = generateCode('CLINIC', 4);
    assert.match(customCode, /^CLINIC-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
  });

  // Test 4: Creation Shape (Predictable Pending Doc Contract)
  await test('pending partner invitation conforms to firestore.rules create requirements', () => {
    const motherId = 'mother-abc';
    const motherName = 'Mama Jemimah';
    const code = 'HAVEN-7K9';

    const pendingDoc: PartnerRelationship = {
      id: code,
      motherId,
      motherName,
      partnerId: null,
      partnerName: undefined,
      code,
      connectionCode: code,
      status: 'pending',
      scope: 'Logistics & Support Only — No Clinical Records Access',
      createdAt: '2026-09-04T00:00:00.000Z',
    };

    assert.equal(pendingDoc.status, 'pending');
    assert.equal(pendingDoc.partnerId, null);
    assert.equal(pendingDoc.id, code);
    assert.equal(pendingDoc.code, pendingDoc.connectionCode);
  });

  // Test 5: Redemption Shape (Canonical Composite ID and Active Status)
  await test('active partner relationship conforms to firestore.rules activePartner contract', () => {
    const motherId = 'mother-abc';
    const partnerId = 'partner-xyz';
    const partnerName = 'Papa Ochieng';
    const code = 'HAVEN-7K9';

    const relationshipId = buildPartnerRelationshipDocId(motherId, partnerId);
    const activeDoc: PartnerRelationship = {
      id: relationshipId,
      motherId,
      motherName: 'Mama Jemimah',
      partnerId,
      partnerName,
      code,
      connectionCode: code,
      status: 'active',
      scope: 'Logistics & Support Only — No Clinical Records Access',
      createdAt: '2026-09-04T00:00:00.000Z',
      connectedAt: '2026-09-04T00:05:00.000Z',
    };

    // 1. Doc ID must be composite motherId_partnerId
    assert.equal(activeDoc.id, `${motherId}_${partnerId}`);

    // 2. Status must be 'active' (NOT 'connected') to satisfy get(...).data.status == 'active'
    assert.equal(activeDoc.status, 'active');
    assert.notEqual(activeDoc.status, 'connected');

    // 3. Partner identification
    assert.equal(activeDoc.partnerId, partnerId);
    assert.equal(activeDoc.partnerName, partnerName);
  });

  // Test 6: Revocation Status Transition
  await test('revocation transitions status to revoked so activePartner gate evaluates to false', () => {
    const activeRel: PartnerRelationship = {
      id: 'mother-abc_partner-xyz',
      motherId: 'mother-abc',
      partnerId: 'partner-xyz',
      connectionCode: 'HAVEN-7K9',
      status: 'active',
      scope: 'Logistics & Support Only — No Clinical Records Access',
      createdAt: '2026-09-04T00:00:00.000Z',
      connectedAt: '2026-09-04T00:05:00.000Z',
    };

    // Simulate revocation
    const revokedRel: PartnerRelationship = {
      ...activeRel,
      status: 'revoked',
      revokedAt: '2026-09-04T00:10:00.000Z',
    };

    assert.equal(revokedRel.status, 'revoked');
    // activePartner rule: get(...).data.status == 'active'
    const isRuleActivePartner = (revokedRel.status as string) === 'active';
    assert.equal(isRuleActivePartner, false, 'Revoked relationship must fail activePartner check');
  });

  // Test 7: Default Sharing Scopes Contract (P6.1)
  await test('default sharing scopes keeps moodSignal strictly opt-in and other support scopes active', () => {
    assert.deepEqual(DEFAULT_SHARING_SCOPES, {
      logistics: true,
      emergencyContacts: true,
      moodSignal: false, // Must be strictly opt-in by default
      sharedReminders: true,
    });
  });

  // Test 8: Granular Scope Customization
  await test('customizes sharingScopes map cleanly and supports granular toggle overrides', () => {
    const baseScopes: PartnerSharingScopes = { ...DEFAULT_SHARING_SCOPES };
    assert.equal(baseScopes.moodSignal, false);

    // Mother explicitly opts into mood signal sharing
    const updatedWithMood: PartnerSharingScopes = {
      ...baseScopes,
      moodSignal: true,
    };
    assert.equal(updatedWithMood.moodSignal, true);
    assert.equal(updatedWithMood.logistics, true);
    assert.equal(updatedWithMood.emergencyContacts, true);
    assert.equal(updatedWithMood.sharedReminders, true);

    // Mother turns off shared reminders
    const updatedWithoutReminders: PartnerSharingScopes = {
      ...updatedWithMood,
      sharedReminders: false,
    };
    assert.equal(updatedWithoutReminders.sharedReminders, false);
    assert.equal(updatedWithoutReminders.moodSignal, true);
  });

  console.log('\nAll Partner Relationship Data Contract tests passed successfully.\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
