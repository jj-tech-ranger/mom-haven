import assert from 'node:assert';
import { summarizeMoodHistory, MoodHistoryItem } from './wellbeingTrendService';

// Test empty history
const emptySummary = summarizeMoodHistory([], 7);
assert.strictEqual(emptySummary.totalLogs, 0);
assert.strictEqual(emptySummary.harderDaysCount, 0);
assert.strictEqual(emptySummary.summaryText, 'No mood logs recorded yet for this period.');
console.log('✓ summarizeMoodHistory handles empty state');

// Test 7-day history with mixed moods
const mockHistory: MoodHistoryItem[] = [
  { id: '1', date: '2026-09-01', timestamp: '2026-09-01T08:00:00Z', mood: 'calm', energyLevel: 4 },
  { id: '2', date: '2026-09-02', timestamp: '2026-09-02T08:00:00Z', mood: 'calm', energyLevel: 3 },
  { id: '3', date: '2026-09-03', timestamp: '2026-09-03T08:00:00Z', mood: 'tired', energyLevel: 2 },
  { id: '4', date: '2026-09-04', timestamp: '2026-09-04T08:00:00Z', mood: 'anxious', energyLevel: 2 },
  { id: '5', date: '2026-09-05', timestamp: '2026-09-05T08:00:00Z', mood: 'sad', energyLevel: 1 },
];

const summary7 = summarizeMoodHistory(mockHistory, 7);
assert.strictEqual(summary7.totalLogs, 5);
assert.strictEqual(summary7.loggedDaysCount, 5);
assert.strictEqual(summary7.mostFrequentMood, 'calm');
assert.strictEqual(summary7.harderDaysCount, 2); // anxious + sad
assert.strictEqual(summary7.summaryText, 'Mostly calm this week, 2 harder days');
console.log('✓ summarizeMoodHistory correctly derives client-side descriptive summary');

// Test Swahili translation
const summarySw = summarizeMoodHistory(mockHistory, 7, 'sw');
assert.strictEqual(summarySw.harderDaysCount, 2);
assert.strictEqual(summarySw.summaryText, 'Zaidi ya yote ulihisi utulivu wiki hii, siku 2 zenye hisia nzito');
console.log('✓ summarizeMoodHistory supports Swahili localization');

console.log('All wellbeingTrendService tests passed!');
