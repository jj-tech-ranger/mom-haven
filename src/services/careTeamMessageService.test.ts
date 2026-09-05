// src/services/careTeamMessageService.test.ts
import assert from 'node:assert/strict';
import { CareTeamMessage, ClinicianPrivateNote } from '../types';

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`✓ ${name}`);
}

async function runTests() {
  console.log('\n--- Care Team Messages Data Contract & Privacy Separation Tests ---\n');

  // Test 1: Data Contract for CareTeamMessage
  await test('CareTeamMessage contains required fields and valid sentByRole', () => {
    const message: CareTeamMessage = {
      id: 'msg-001',
      motherId: 'mother-123',
      clinicianId: 'clinician-456',
      childId: 'child-789',
      sentByRole: 'CLINICIAN',
      text: 'Your ANC routine hemoglobin and blood pressure are normal. Continue IFAS.',
      category: 'lab_result',
      relatedRecordId: 'anc-record-1',
      readByMother: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    assert.equal(message.sentByRole, 'CLINICIAN');
    assert.equal(message.category, 'lab_result');
    assert.equal(message.readByMother, false);
    assert.equal(message.readAt, null);
    assert.equal(typeof message.text, 'string');
    assert.ok(message.text.length > 0);
  });

  // Test 2: Category union validity
  await test('CareTeamMessage allows all 4 required clinical categories', () => {
    const validCategories: CareTeamMessage['category'][] = [
      'general',
      'lab_result',
      'appointment',
      'reassurance',
    ];

    validCategories.forEach((cat) => {
      const msg: CareTeamMessage = {
        id: `msg-${cat}`,
        motherId: 'mother-123',
        clinicianId: 'clinician-456',
        sentByRole: 'CLINICIAN',
        text: `Test message for ${cat}`,
        category: cat,
        readByMother: false,
        createdAt: new Date().toISOString(),
      };
      assert.equal(msg.category, cat);
    });
  });

  // Test 3: Read transition behavior
  await test('Marking read updates readByMother to true and records readAt timestamp', () => {
    const msg: CareTeamMessage = {
      id: 'msg-read-test',
      motherId: 'mother-123',
      clinicianId: 'clinician-456',
      sentByRole: 'CLINICIAN',
      text: 'Please attend your scheduled 28-week ANC appointment.',
      category: 'appointment',
      readByMother: false,
      readAt: null,
      createdAt: '2026-09-01T10:00:00.000Z',
    };

    // Simulate markRead
    const readTimestamp = new Date().toISOString();
    const updated: CareTeamMessage = {
      ...msg,
      readByMother: true,
      readAt: readTimestamp,
    };

    assert.equal(updated.readByMother, true);
    assert.ok(updated.readAt);
  });

  // Test 4: Privacy boundary: ClinicianPrivateNote vs CareTeamMessage
  await test('ClinicianPrivateNote remains strictly separate and distinct from CareTeamMessage', () => {
    const privateNote: ClinicianPrivateNote = {
      id: 'note-001',
      clinicianId: 'clinician-456',
      motherId: 'mother-123',
      childId: null,
      text: 'Private clinical observation: patient shows mild anxiety regarding delivery location.',
      createdAt: new Date().toISOString(),
    };

    const patientFacingMessage: CareTeamMessage = {
      id: 'msg-002',
      motherId: 'mother-123',
      clinicianId: 'clinician-456',
      sentByRole: 'CLINICIAN',
      text: 'Everything looks healthy with baby and you. Our team is available 24/7 if you have questions.',
      category: 'reassurance',
      readByMother: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    // Assert distinct contracts: privateNote does not have sentByRole, category, readByMother
    assert.equal('sentByRole' in privateNote, false);
    assert.equal('readByMother' in privateNote, false);
    assert.equal('category' in privateNote, false);

    // Assert patientFacingMessage has explicit patient visibility flags
    assert.equal('readByMother' in patientFacingMessage, true);
    assert.equal('category' in patientFacingMessage, true);
    assert.equal(patientFacingMessage.sentByRole, 'CLINICIAN');
  });

  console.log('\nAll Care Team Messages Data Contract tests passed successfully!\n');
}

runTests().catch((err) => {
  console.error('Care team message tests failed:', err);
  process.exit(1);
});
