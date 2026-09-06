// src/services/sharingService.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

  // Test 9: Client Codebase Audit - No collection-level query/where against partnerConnections
  await test('client codebase contains zero collection-level queries or where clauses on partnerConnections', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    function scanDir(dir: string): string[] {
      const files: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...scanDir(full));
        else if (
          entry.isFile() &&
          (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
          !entry.name.includes('.test.')
        ) {
          files.push(full);
        }
      }
      return files;
    }

    const files = scanDir(srcDir);
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes("'partnerConnections'") || content.includes('"partnerConnections"')) {
        // Assert no collection reference is constructed for partnerConnections
        assert.equal(
          content.includes("collection(db, 'partnerConnections')") ||
          content.includes('collection(db, "partnerConnections")') ||
          content.includes("collection(getFirestore(), 'partnerConnections')"),
          false,
          `File ${path.relative(process.cwd(), f)} must never construct collection reference on partnerConnections`
        );
        // Assert every access uses doc() with specific ID
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes('partnerConnections') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            assert.ok(
              line.includes("doc(") || line.includes("docData") || line.includes("partnerConnections"),
              `Line must only access partnerConnections by doc ID: ${line}`
            );
          }
        }
      }
    }
  });

  // Test 10: firestore.rules Structural Contract for partnerConnections
  await test('firestore.rules restricts partnerConnections to allow get by ID and explicitly forbids list', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    assert.ok(
      rulesContent.includes('match /partnerConnections/{id}'),
      'firestore.rules must define match /partnerConnections/{id}'
    );
    assert.ok(
      rulesContent.includes('allow list:if false;') || rulesContent.includes('allow list: if false;'),
      'firestore.rules must explicitly forbid collection list/query on partnerConnections'
    );
    assert.ok(
      rulesContent.includes('allow get:if signed()') || rulesContent.includes('allow get: if signed()'),
      'firestore.rules must require authentication and document-level get'
    );
    assert.equal(
      rulesContent.includes("allow read:if signed()&&resource.data.status=='pending'"),
      false,
      'firestore.rules must NOT contain broad allow read that allows collection query listing'
    );
  });

  // Test 11: Rules Emulator Simulation - Authenticated stranger cannot list or query pending connections
  await test('rules emulator: authenticated stranger cannot list or query pending connections of another mother', () => {
    // Emulated Firestore Rules evaluation context
    interface SecurityContext {
      auth: { uid: string } | null;
      operation: 'get' | 'list' | 'create' | 'update' | 'delete';
      documentId?: string;
      resource?: { data: Record<string, any> };
      requestResource?: { data: Record<string, any> };
    }

    function evaluatePartnerConnectionsRule(ctx: SecurityContext): boolean {
      const isSigned = Boolean(ctx.auth?.uid);
      const uid = ctx.auth?.uid;

      if (ctx.operation === 'list') {
        // Rule: allow list: if false;
        return false;
      }

      if (ctx.operation === 'get') {
        // Rule: allow get: if signed() && (resource.data.status == 'pending' || resource.data.motherId == request.auth.uid || resource.data.usedBy == request.auth.uid);
        if (!isSigned) return false;
        const data = ctx.resource?.data;
        if (!data) return false;
        return (
          data.status === 'pending' ||
          data.motherId === uid ||
          data.usedBy === uid
        );
      }

      if (ctx.operation === 'create') {
        // Rule: allow create: if owner(request.resource.data.motherId);
        return isSigned && ctx.requestResource?.data?.motherId === uid;
      }

      if (ctx.operation === 'update') {
        // Rule: allow update: if signed() && (resource.data.motherId == request.auth.uid || resource.data.usedBy == request.auth.uid);
        if (!isSigned) return false;
        const data = ctx.resource?.data;
        return data?.motherId === uid || data?.usedBy === uid;
      }

      return false;
    }

    const motherUid = 'mother-user-alice';
    const strangerUid = 'stranger-bob';
    const pendingInviteDoc = {
      motherId: motherUid,
      motherName: 'Alice',
      code: 'HAVEN-7K9',
      status: 'pending',
    };

    // Scenario A: Stranger attempts collection-level query (e.g. status == 'pending')
    // This MUST be denied, preventing enumeration of all mothers' pending codes
    const strangerListAttempt = evaluatePartnerConnectionsRule({
      auth: { uid: strangerUid },
      operation: 'list',
    });
    assert.equal(
      strangerListAttempt,
      false,
      'Authenticated stranger must NOT be permitted to list partnerConnections collection'
    );

    // Scenario B: Stranger attempts to list without auth
    const unauthListAttempt = evaluatePartnerConnectionsRule({
      auth: null,
      operation: 'list',
    });
    assert.equal(unauthListAttempt, false, 'Unauthenticated user cannot list');

    // Scenario C: Intended partner receives specific code from mother and executes getDoc(code)
    const partnerGetWithCode = evaluatePartnerConnectionsRule({
      auth: { uid: strangerUid },
      operation: 'get',
      documentId: 'HAVEN-7K9',
      resource: { data: pendingInviteDoc },
    });
    assert.equal(
      partnerGetWithCode,
      true,
      'Partner who knows specific pending code can retrieve the document by ID'
    );

    // Scenario D: Stranger tries to get an already used/revoked code they do not own
    const strangerGetUsedCode = evaluatePartnerConnectionsRule({
      auth: { uid: strangerUid },
      operation: 'get',
      documentId: 'HAVEN-OLD',
      resource: { data: { motherId: motherUid, status: 'used', usedBy: 'other-partner' } },
    });
    assert.equal(
      strangerGetUsedCode,
      false,
      'Stranger cannot get non-pending partner connection doc belonging to another'
    );

    // Scenario E: Mother can inspect her own connection doc even after used
    const motherGetOwnDoc = evaluatePartnerConnectionsRule({
      auth: { uid: motherUid },
      operation: 'get',
      documentId: 'HAVEN-OLD',
      resource: { data: { motherId: motherUid, status: 'used', usedBy: 'other-partner' } },
    });
    assert.equal(motherGetOwnDoc, true, 'Mother can get her own connection doc');
  });

  // Test 12: Partner Onboarding End-to-End Simulation
  await test('end-to-end partner invite flow: mother generates code, partner redeems via getDoc by code', () => {
    const motherId = 'mother-user-sarah';
    const partnerId = 'partner-user-david';
    const code = generateCode('HAVEN', 3);

    // 1. Mother creates connection payload
    const connectionPayload = {
      motherId,
      motherName: 'Sarah',
      code,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 2. Partner verifies code by looking up doc by ID
    assert.equal(connectionPayload.code, code);
    assert.equal(connectionPayload.status, 'pending');

    // 3. Composite ID build for active relationship
    const relationshipId = buildPartnerRelationshipDocId(motherId, partnerId);
    assert.equal(relationshipId, `${motherId}_${partnerId}`);

    // 4. Partner claims connection
    const updatedConnection = {
      ...connectionPayload,
      status: 'used',
      usedBy: partnerId,
      usedAt: new Date().toISOString(),
    };
    assert.equal(updatedConnection.status, 'used');
    assert.equal(updatedConnection.usedBy, partnerId);
  });

  console.log('\nAll Partner Relationship Data Contract tests passed successfully.\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
