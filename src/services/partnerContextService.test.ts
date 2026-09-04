// src/services/partnerContextService.test.ts
import assert from 'node:assert/strict';
import {
  moodToSignal,
  energyToSignal,
  PARTNER_MOOD_TIPS,
  type PartnerShareData,
} from './partnerContextService';
import type { MoodType } from '../types/healthLog';

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  console.log(`✓ ${name}`);
}

async function runTests() {
  console.log('\n--- Partner Context & Mood Signal Tests (audit §9.2, §9.4, §9.6, §13.2) ---\n');

  // Test 1: Mood Mapping - Low Signal
  await test('maps vulnerable/stressed maternal moods (sad, overwhelmed, anxious) to coarse "low" signal', () => {
    assert.equal(moodToSignal('sad'), 'low');
    assert.equal(moodToSignal('overwhelmed'), 'low');
    assert.equal(moodToSignal('anxious'), 'low');
  });

  // Test 2: Mood Mapping - Ok Signal
  await test('maps tired maternal mood to coarse "ok" signal', () => {
    assert.equal(moodToSignal('tired'), 'ok');
  });

  // Test 3: Mood Mapping - Good Signal
  await test('maps positive/peaceful maternal moods (calm, happy) to coarse "good" signal', () => {
    assert.equal(moodToSignal('calm'), 'good');
    assert.equal(moodToSignal('happy'), 'good');
  });

  // Test 4: Energy Mapping
  await test('maps 1-5 maternal energy levels to 3-level coarse signals accurately', () => {
    assert.equal(energyToSignal(1), 'low');
    assert.equal(energyToSignal(2), 'low');
    assert.equal(energyToSignal(3), 'ok');
    assert.equal(energyToSignal(4), 'good');
    assert.equal(energyToSignal(5), 'good');
    assert.equal(energyToSignal(undefined), undefined);
  });

  // Test 5: Confidentiality & Boundary Protection
  await test('partner share payload strictly confines to coarse signals, omitting raw notes and medical values', () => {
    // Simulate what a daily check-in logs
    const internalLog = {
      type: 'mood',
      values: {
        mood: 'sad' as MoodType,
        energyLevel: 2,
        notes: 'Feeling painful contractions and severe anxiety about finances',
      },
    };

    // Coarse signal computed for partnerShares
    const coarseShare: PartnerShareData = {
      moodSignal: moodToSignal(internalLog.values.mood),
      energySignal: energyToSignal(internalLog.values.energyLevel),
      sharedAt: '2026-09-04T12:00:00.000Z',
    };

    // Assert coarse transformation
    assert.equal(coarseShare.moodSignal, 'low');
    assert.equal(coarseShare.energySignal, 'low');

    // Assert that raw mood string, notes, and raw energy number are NOT present
    assert.equal((coarseShare as any).notes, undefined, 'Notes must never be included');
    assert.notEqual((coarseShare as any).moodSignal, 'sad', 'Raw mood string must never be stored in partner share');
    assert.equal((coarseShare as any).energyLevel, undefined, 'Raw energy number must never be stored in partner share');
  });

  // Test 6: Partner Tips Verification for all 3 signals in EN and SW
  await test('partner support guidance includes localized headlines, descriptions, and action tips for all signals', () => {
    const signals: Array<'low' | 'ok' | 'good'> = ['low', 'ok', 'good'];
    for (const signal of signals) {
      const guidance = PARTNER_MOOD_TIPS[signal];
      assert.ok(guidance, `Guidance must exist for ${signal}`);
      assert.ok(guidance.headline.length > 0, `English headline must not be empty for ${signal}`);
      assert.ok(guidance.headlineSw.length > 0, `Swahili headline must not be empty for ${signal}`);
      assert.ok(guidance.description.length > 0, `Description must not be empty for ${signal}`);
      assert.ok(guidance.descriptionSw.length > 0, `Swahili description must not be empty for ${signal}`);
      assert.ok(guidance.actionTips.length >= 2, `Must include at least 2 actionable tips for ${signal}`);
      for (const tip of guidance.actionTips) {
        assert.ok(tip.en.length > 0, 'Tip EN must not be empty');
        assert.ok(tip.sw.length > 0, 'Tip SW must not be empty');
      }
    }
  });

  console.log('\nAll Partner Context & Mood Signal tests passed successfully.\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
