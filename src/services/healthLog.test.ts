// src/services/healthLog.test.ts
import {
  validateHealthLogInput,
  evaluateClinicalSafety,
  sanitizeAndFormatHealthLog,
} from './healthLogValidationService';
import {
  analyzeHealthTrends,
  filterClinicianSummaryLogs,
} from './healthTrendService';
import {
  saveDailyHealthLog,
  getDailyHealthLogById,
  updateDailyHealthLog,
  deleteDailyHealthLog,
} from './healthLogService';
import { DailyHealthLog, HealthLogType, BloodPressureValues } from '../types/healthLog';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(message);
  }
}

async function runPhase6Tests() {
  console.log('--- Phase 6: Longitudinal Health Journey & Progressive Health Logging Tests ---');

  // =========================================================================
  // 1. CREATION & PROVENANCE TESTS
  // =========================================================================
  {
    const bpInput = {
      userId: 'mother-123',
      type: 'blood_pressure' as HealthLogType,
      category: 'CLINICAL_MEASUREMENT' as const,
      values: { systolic: 120, diastolic: 80, pulse: 72 },
      timestamp: new Date().toISOString(),
      notes: 'Morning reading after resting 5 mins',
    };

    const validation = validateHealthLogInput(bpInput);
    assert(validation.isValid, `Valid BP should pass validation: ${validation.errors.join(', ')}`);

    const sanitized = sanitizeAndFormatHealthLog(bpInput);
    assert(sanitized.id.length > 0, 'Must generate unique id');
    assert(sanitized.source === 'USER_REPORTED', 'Source must always be USER_REPORTED');
    assert(sanitized.provenance.status === 'REPORTED', 'Provenance status must be REPORTED');
    assert(!sanitized.provenance.verifiedBy, 'Must not have verifiedBy on creation');
    assert(!sanitized.provenance.verifiedAt, 'Must not have verifiedAt on creation');

    console.log('✓ creation & provenance: creates valid record with explicit USER_REPORTED provenance');
  }

  // =========================================================================
  // 2. PROVENANCE INTEGRITY & SPOOFING PREVENTION
  // =========================================================================
  {
    const spoofedInput: any = {
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 118, diastolic: 78 },
      timestamp: new Date().toISOString(),
      provenance: {
        status: 'VERIFIED',
        verifiedBy: 'fake-doctor-id',
        verifiedAt: new Date().toISOString(),
      },
    };

    const sanitized = sanitizeAndFormatHealthLog(spoofedInput);
    assert(
      sanitized.provenance.status === 'REPORTED',
      `Must override spoofed status to REPORTED, got ${sanitized.provenance.status}`,
    );
    assert(
      !sanitized.provenance.verifiedBy,
      'Must strip unauthorized verifiedBy field',
    );
    assert(
      !sanitized.provenance.verifiedAt,
      'Must strip unauthorized verifiedAt field',
    );

    console.log('✓ provenance integrity: prevents client-side spoofing of VERIFIED clinical status');
  }

  // =========================================================================
  // 3. INVALID VALUES REJECTION
  // =========================================================================
  {
    // Test 3a: BP Systolic lower than diastolic
    const invertedBp = validateHealthLogInput({
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 80, diastolic: 120 },
      timestamp: new Date().toISOString(),
    });
    assert(!invertedBp.isValid, 'Must reject inverted blood pressure (systolic < diastolic)');

    // Test 3b: BP Out of physiological range
    const crazyHighBp = validateHealthLogInput({
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 280, diastolic: 90 },
      timestamp: new Date().toISOString(),
    });
    assert(!crazyHighBp.isValid, 'Must reject systolic > 240');

    const crazyLowBp = validateHealthLogInput({
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 60, diastolic: 40 },
      timestamp: new Date().toISOString(),
    });
    assert(!crazyLowBp.isValid, 'Must reject systolic < 70');

    // Test 3c: Weight out of physiological range
    const crazyWeight = validateHealthLogInput({
      userId: 'mother-123',
      type: 'weight',
      category: 'CLINICAL_MEASUREMENT',
      values: { weightKg: 15 },
      timestamp: new Date().toISOString(),
    });
    assert(!crazyWeight.isValid, 'Must reject adult weight < 30kg');

    const nanWeight = validateHealthLogInput({
      userId: 'mother-123',
      type: 'weight',
      category: 'CLINICAL_MEASUREMENT',
      values: { weightKg: NaN },
      timestamp: new Date().toISOString(),
    });
    assert(!nanWeight.isValid, 'Must reject NaN weight');

    // Test 3d: Sleep hours invalid
    const negativeSleep = validateHealthLogInput({
      userId: 'mother-123',
      type: 'sleep',
      category: 'JOURNAL',
      values: { hours: 26, quality: 'good' },
      timestamp: new Date().toISOString(),
    });
    assert(!negativeSleep.isValid, 'Must reject sleep hours > 24');

    // Test 3e: Notes length
    const hugeNotes = validateHealthLogInput({
      userId: 'mother-123',
      type: 'notes',
      category: 'JOURNAL',
      values: { text: 'A'.repeat(2500) },
      notes: 'A'.repeat(2500),
      timestamp: new Date().toISOString(),
    });
    assert(!hugeNotes.isValid, 'Must reject notes over 2000 characters');

    console.log('✓ invalid values rejection: enforces strict physiological & structural limits');
  }

  // =========================================================================
  // 4. DATE VALIDATION & CLOCK SKEW
  // =========================================================================
  {
    const farFutureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const futureLog = validateHealthLogInput({
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 120, diastolic: 80 },
      timestamp: farFutureDate,
    });
    assert(!futureLog.isValid, 'Must reject log timestamp in the far future');

    const garbageDate = validateHealthLogInput({
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 120, diastolic: 80 },
      timestamp: 'not-a-valid-date-string',
    });
    assert(!garbageDate.isValid, 'Must reject corrupted date string');

    const minorSkewDate = new Date(Date.now() + 4 * 60 * 1000).toISOString();
    const allowedSkewLog = validateHealthLogInput({
      userId: 'mother-123',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 120, diastolic: 80 },
      timestamp: minorSkewDate,
    });
    assert(allowedSkewLog.isValid, 'Must tolerate reasonable clock skew within 10 minutes');

    console.log('✓ dates validation: rejects future dates, invalid formats, and accommodates clock skew');
  }

  // =========================================================================
  // 5. OWNERSHIP & CRUD PERSISTENCE
  // =========================================================================
  {
    const userA = 'user-owner-A';
    const userB = 'user-owner-B';

    // Save log for user A
    const logA = await saveDailyHealthLog(userA, {
      type: 'blood_pressure',
      values: { systolic: 122, diastolic: 82 },
      timestamp: new Date().toISOString(),
    });

    assert(logA.id.length > 0, 'Saved log must have an id');
    assert(logA.userId === userA, 'Saved log must match user A');

    // Read log by ID
    const retrieved = await getDailyHealthLogById(userA, logA.id);
    assert(retrieved !== null, 'Should retrieve saved log');
    assert((retrieved?.values as BloodPressureValues)?.systolic === 122, 'Values should match');

    // Attempt read by User B (ownership check)
    const forbiddenRetrieve = await getDailyHealthLogById(userB, logA.id);
    assert(forbiddenRetrieve === null, 'User B must not be able to retrieve User A log');

    // Update log
    const updated = await updateDailyHealthLog(userA, logA.id, {
      values: { systolic: 124, diastolic: 84 },
      notes: 'Updated after glass of water',
    });
    assert(updated !== null, 'Should update successfully');
    assert((updated?.values as BloodPressureValues)?.systolic === 124, 'Updated values must reflect changes');
    assert(updated?.provenance.status === 'REPORTED', 'Update must never set VERIFIED');

    // Attempt update by User B
    const forbiddenUpdate = await updateDailyHealthLog(userB, logA.id, {
      values: { systolic: 150, diastolic: 100 },
    });
    assert(forbiddenUpdate === null, 'User B must not be able to update User A log');

    // Deletion
    const deleteSuccess = await deleteDailyHealthLog(userA, logA.id);
    assert(deleteSuccess, 'User A should be able to delete their own log');

    const afterDelete = await getDailyHealthLogById(userA, logA.id);
    assert(afterDelete === null, 'Deleted log must no longer exist');

    console.log('✓ ownership & CRUD: securely enforces user ownership during save, read, update, and delete');
  }

  // =========================================================================
  // 6. CLINICAL SAFETY ALERT EVALUATION (MOH 216 / PRE-ECLAMPSIA RULES)
  // =========================================================================
  {
    // Severe Hypertension (>= 160/110)
    const severeAlert = evaluateClinicalSafety(
      'blood_pressure',
      { systolic: 165, diastolic: 112 },
    );
    assert(severeAlert.level === 'URGENT_DANGER', 'Severe hypertension must be URGENT_DANGER level');
    assert(severeAlert.isRedCross1199Recommended, 'Emergency alert must recommend calling 1199');
    assert(severeAlert.actionRecommendation.includes('1199'), 'Action recommendation must mention 1199');

    // Moderate Elevation (>= 140/90)
    const moderateAlert = evaluateClinicalSafety(
      'blood_pressure',
      { systolic: 142, diastolic: 92 },
    );
    assert(moderateAlert.level === 'ADVISORY', 'Moderate elevation should be ADVISORY level');

    // Normal BP
    const normalAlert = evaluateClinicalSafety(
      'blood_pressure',
      { systolic: 118, diastolic: 76 },
    );
    assert(normalAlert.level === 'NONE', 'Normal BP should be NONE level');

    // Fetal Movement: Decreased movements
    const fetalMovementAlert = evaluateClinicalSafety(
      'baby_movement',
      { pattern: 'decreased', movementCount: 3, durationMinutes: 120 },
    );
    assert(fetalMovementAlert.level === 'URGENT_DANGER', 'Significantly decreased movement must be URGENT_DANGER');
    assert(fetalMovementAlert.isRedCross1199Recommended, 'Decreased movement should recommend emergency contact');

    console.log('✓ clinical safety: correctly evaluates Kenya MOH 216 danger thresholds');
  }

  // =========================================================================
  // 7. SPARSE TRENDS & EMPTY TRENDS (NO MISLEADING REGRESSIONS)
  // =========================================================================
  {
    // 7a: Empty trends (0 logs)
    const emptyTrend = analyzeHealthTrends('blood_pressure', []);
    assert(emptyTrend.status === 'empty', `Expected status 'empty', got ${emptyTrend.status}`);
    assert(emptyTrend.totalEntries === 0, 'Empty trend should have 0 entries');
    assert(!isNaN(emptyTrend.totalEntries), 'Must not produce NaN values');

    // 7b: Sparse trends (1 entry < MIN_DATA_POINTS_FOR_TREND)
    const singleLog: DailyHealthLog = {
      id: 'log-1',
      userId: 'user-1',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 120, diastolic: 80 },
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      source: 'USER_REPORTED',
      provenance: {
        status: 'REPORTED',
        enteredBy: 'user-1',
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      },
      createdAt: new Date().toISOString(),
    };

    const sparseTrend1 = analyzeHealthTrends('blood_pressure', [singleLog]);
    assert(sparseTrend1.status === 'sparse', `Expected status 'sparse', got ${sparseTrend1.status}`);
    assert(sparseTrend1.totalEntries === 1, 'Total entries should be 1');
    assert(
      sparseTrend1.summaryMessage.toLowerCase().includes('at least 3 readings'),
      'Should explain that at least 3 readings are required for trends',
    );

    // 7c: Sparse trends (2 entries < MIN_DATA_POINTS_FOR_TREND)
    const secondLog: DailyHealthLog = {
      id: 'log-2',
      userId: 'user-1',
      type: 'blood_pressure',
      category: 'CLINICAL_MEASUREMENT',
      values: { systolic: 124, diastolic: 82 },
      timestamp: new Date().toISOString(),
      source: 'USER_REPORTED',
      provenance: {
        status: 'REPORTED',
        enteredBy: 'user-1',
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      },
      createdAt: new Date().toISOString(),
    };

    const sparseTrend2 = analyzeHealthTrends('blood_pressure', [singleLog, secondLog]);
    assert(sparseTrend2.status === 'sparse', 'Must remain sparse with only 2 readings');

    console.log('✓ sparse & empty trends: strictly prevents premature conclusions or misleading regressions');
  }

  // =========================================================================
  // 8. SUFFICIENT DATA TRENDS (>= 3 DATA POINTS)
  // =========================================================================
  {
    const baseTime = Date.now() - 7 * 24 * 3600 * 1000;
    const logs: DailyHealthLog[] = [
      {
        id: 'log-1',
        userId: 'user-1',
        type: 'blood_pressure',
        category: 'CLINICAL_MEASUREMENT',
        values: { systolic: 118, diastolic: 76 },
        timestamp: new Date(baseTime).toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-2',
        userId: 'user-1',
        type: 'blood_pressure',
        category: 'CLINICAL_MEASUREMENT',
        values: { systolic: 122, diastolic: 80 },
        timestamp: new Date(baseTime + 2 * 24 * 3600 * 1000).toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-3',
        userId: 'user-1',
        type: 'blood_pressure',
        category: 'CLINICAL_MEASUREMENT',
        values: { systolic: 126, diastolic: 82 },
        timestamp: new Date(baseTime + 4 * 24 * 3600 * 1000).toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
    ];

    const trend = analyzeHealthTrends('blood_pressure', logs);
    assert(trend.status === 'sufficient', `Expected status 'sufficient', got ${trend.status}`);
    assert(trend.totalEntries === 3, 'Should have 3 entries');
    assert(trend.average?.systolic === 122, `Expected avg systolic 122, got ${trend.average?.systolic}`);
    assert(trend.average?.diastolic === 79, `Expected avg diastolic 79, got ${trend.average?.diastolic}`);
    assert(trend.range?.systolicMin === 118, 'Min systolic should be 118');
    assert(trend.range?.systolicMax === 126, 'Max systolic should be 126');
    assert(trend.delta?.systolicDelta === 8, 'Delta systolic should be 8');

    console.log('✓ sufficient data trends: computes accurate longitudinal metrics over time');
  }

  // =========================================================================
  // 9. CLINICAL INTEGRATION PRODUCT RULES
  // =========================================================================
  {
    const mixedLogs: DailyHealthLog[] = [
      // Clinical measurement: Blood pressure within 30 days
      {
        id: 'bp-1',
        userId: 'user-1',
        type: 'blood_pressure',
        category: 'CLINICAL_MEASUREMENT',
        values: { systolic: 135, diastolic: 85 },
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
      // Personal journal: Mood (MUST BE EXCLUDED)
      {
        id: 'mood-1',
        userId: 'user-1',
        type: 'mood',
        category: 'JOURNAL',
        values: { mood: 'anxious', energyLevel: 2 },
        timestamp: new Date().toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
      // Personal journal: Sleep (MUST BE EXCLUDED)
      {
        id: 'sleep-1',
        userId: 'user-1',
        type: 'sleep',
        category: 'JOURNAL',
        values: { hours: 6, quality: 'poor' },
        timestamp: new Date().toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
      // Clinical measurement: Old log beyond 30 days (MUST BE EXCLUDED)
      {
        id: 'bp-old',
        userId: 'user-1',
        type: 'blood_pressure',
        category: 'CLINICAL_MEASUREMENT',
        values: { systolic: 120, diastolic: 80 },
        timestamp: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
        source: 'USER_REPORTED',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'user-1',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
        createdAt: new Date().toISOString(),
      },
    ];

    const clinicianSummary = filterClinicianSummaryLogs(mixedLogs, 30);
    assert(clinicianSummary.length === 1, `Expected 1 log in clinician summary, got ${clinicianSummary.length}`);
    assert(clinicianSummary[0].id === 'bp-1', 'Only recent clinical measurement should be included');
    assert(clinicianSummary[0].source === 'USER_REPORTED', 'Must retain USER_REPORTED source');
    assert(clinicianSummary[0].provenance.status === 'REPORTED', 'Must retain REPORTED status');

    console.log('✓ clinical integration product rules: strictly excludes private journals and old logs');
  }

  console.log('All Phase 6 Longitudinal Health Journey & Progressive Health Logging tests passed successfully!');
  process.exit(0);
}

runPhase6Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
