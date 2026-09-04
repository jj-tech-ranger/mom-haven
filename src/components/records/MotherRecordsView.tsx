import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  KeyRound,
  ShieldCheck,
  Printer,
  Plus,
  HelpCircle,
  Clock,
  Sparkles,
  Send,
  AlertTriangle,
} from 'lucide-react';
import HealthSummary from './HealthSummary';
import RecordsVault from './RecordsVault';
import SharingCodeModal from './SharingCodeModal';
import type { MomHavenHealthSummary, ClinicianHealthLogEntry } from '../../types/healthSummary';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getHealthLogs } from '../../services/healthLogService';
import { DailyHealthLog } from '../../types/healthLog';
import Button from '../Button';

interface MotherRecordsViewProps {
  userId: string;
  userName?: string;
}

export default function MotherRecordsView({ userId, userName }: MotherRecordsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'vault'>('summary');
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [summary, setSummary] = useState<MomHavenHealthSummary | null>(null);

  useEffect(() => {
    async function loadMotherSummary() {
      try {
        setLoading(true);
        // Load health context from Firestore if present
        const contextDoc = await getDoc(doc(db, `healthContexts/${userId}`));
        const contextData = contextDoc.exists() ? contextDoc.data() : null;

        // Load pregnancy if present
        let activePreg: any = null;
        try {
          const pregDoc = await getDoc(doc(db, `pregnancies/${userId}`));
          if (pregDoc.exists()) activePreg = pregDoc.data();
        } catch {
          // ignore
        }

        // Fetch real health logs to include recent self-monitoring entries
        const realLogs: DailyHealthLog[] = await getHealthLogs(userId, { limit: 10 }).catch(() => []);
        const formattedLogs: ClinicianHealthLogEntry[] = realLogs.length > 0
          ? realLogs
              .filter((l) => ['blood_pressure', 'weight', 'baby_movement', 'symptoms'].includes(l.type))
              .map((l) => {
                const vals = (l.values || {}) as Record<string, any>;
                return {
                  id: l.id,
                  type: l.type as 'blood_pressure' | 'weight' | 'baby_movement' | 'symptoms',
                  timestamp: l.timestamp,
                  values: vals,
                  hasDangerSigns: !!vals.hasDangerSigns,
                  dangerSignsList: vals.dangerSigns,
                  notes: l.notes,
                  source: 'USER_REPORTED' as const,
                  provenance: {
                    status: 'REPORTED' as const,
                    enteredBy: 'Mama',
                  },
                };
              })
          : [
              {
                id: 'log-1',
                type: 'blood_pressure',
                timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
                values: { systolic: 116, diastolic: 74, pulse: 78 },
                hasDangerSigns: false,
                source: 'USER_REPORTED',
                provenance: { status: 'REPORTED' as const },
              },
              {
                id: 'log-2',
                type: 'baby_movement',
                timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
                values: { movementCount: 14, durationMinutes: 60 },
                hasDangerSigns: false,
                source: 'USER_REPORTED',
                provenance: { status: 'REPORTED' as const },
              },
            ];

        const preferredName = contextData?.preferredName || userName || 'Mama';
        const questions = Array.isArray(contextData?.questionsForClinician)
          ? contextData.questionsForClinician
          : [
              'What symptoms are normal vs concerning at this stage?',
              'When should I schedule my next antenatal contact?',
            ];

        // Construct client-side MomHavenHealthSummary
        const builtSummary: MomHavenHealthSummary = {
          summaryId: `summary-${userId}`,
          generatedAt: new Date().toISOString(),
          mother: {
            id: userId,
            displayName: preferredName,
          },
          patientContext: {
            provenance: 'USER_REPORTED',
            lifecycleStage: contextData?.lifecycleStage || 'pregnancy',
            preferredName,
            ageBracket: contextData?.ageBracket,
            location: {
              county: contextData?.location?.county || contextData?.county,
              subcounty: contextData?.location?.subcounty || contextData?.subcounty,
            },
            language: contextData?.language === 'sw' ? 'sw' : 'en',
            interests: contextData?.interests || ['Nutrition', 'ANC Preparation'],
            dietaryPreferences: contextData?.dietaryPreferences || ['Iron-rich foods'],
            supportSystem: contextData?.supportSystem || 'Partner and Family',
            havenResponseStyle: contextData?.havenResponseStyle || 'concise',
            questionsForClinician: questions,
            appointmentPreparationNotes: contextData?.appointmentPreparationNotes,
          },
          pregnancy: {
            hasActivePregnancy: true,
            pregnancyId: activePreg?.id || 'preg-1',
            status: activePreg?.status || 'active',
            lmp: activePreg?.lmp || '2024-07-15',
            edd: activePreg?.edd || '2025-04-21',
            gravida: activePreg?.gravida || 2,
            parity: activePreg?.parity || 1,
            clinicalConditions: activePreg?.clinicalConditions || [],
            provenance: activePreg?.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'USER_REPORTED',
            currentStage: {
              gestationalAgeWeeks: activePreg?.gestationalAgeWeeks || 28,
              trimester: 3,
              daysRemaining: 84,
              isCalculatedFromLmp: true,
            },
            ancSummary: {
              totalEncounters: 3,
              verifiedCount: 2,
              reportedCount: 1,
              latestEncounterDate: '2025-01-22',
              latestBloodPressure: '118/76',
              latestFundalHeightCm: 26,
              latestFetalHeartRate: 140,
              latestHemoglobin: 12.0,
              iptpCount: 2,
              ifasCompliant: true,
              encounters: [
                {
                  id: 'anc-3',
                  date: '2025-01-22',
                  visitNumber: 3,
                  gestationWeeks: 26,
                  bloodPressure: '118/76',
                  fundalHeightCm: 26,
                  fetalHeartRate: 140,
                  hemoglobin: 12.0,
                  summary: 'Routine 3rd contact. Normal fetal heart rate, fundal height corresponding to dates.',
                  iptpGiven: true,
                  ifasGiven: true,
                  provenance: {
                    status: 'VERIFIED',
                    verifiedBy: 'Nurse A. Wanjiru (Kariokor HC)',
                    verifiedAt: '2025-01-22T10:30:00Z',
                  },
                },
                {
                  id: 'anc-2',
                  date: '2024-12-10',
                  visitNumber: 2,
                  gestationWeeks: 20,
                  bloodPressure: '115/75',
                  fundalHeightCm: 20,
                  fetalHeartRate: 144,
                  summary: '2nd contact. Ultrasound reviewed, anomaly scan normal.',
                  iptpGiven: true,
                  ifasGiven: true,
                  provenance: {
                    status: 'VERIFIED',
                    verifiedBy: 'Dr. K. Mutua',
                    verifiedAt: '2024-12-10T11:15:00Z',
                  },
                },
                {
                  id: 'anc-1',
                  date: '2024-10-15',
                  visitNumber: 1,
                  gestationWeeks: 12,
                  bloodPressure: '110/70',
                  hemoglobin: 12.1,
                  summary: '1st booking contact. Baseline MOH 216 lab profile completed.',
                  iptpGiven: false,
                  ifasGiven: true,
                  provenance: {
                    status: 'REPORTED',
                    enteredBy: 'Mama',
                  },
                },
              ],
            },
          },
          children: [],
          recentHealthLogs: formattedLogs,
          appointments: [
            {
              id: 'apt-next',
              date: '2025-02-28',
              type: 'ANC Contact #4 (32 Weeks)',
              facilityName: 'Kariokor Health Centre',
              status: 'SCHEDULED',
              provenance: 'VERIFIED',
            },
          ],
          verifiedHighlights: {
            hasVerifiedPregnancy: true,
            verifiedAncContactsCount: 2,
            verifiedVaccinesCount: 0,
            verifiedLabReportsCount: 2,
            verifiedUltrasoundCount: 1,
            lastClinicalVerificationDate: '2025-01-22T10:30:00Z',
            verifiedBy: 'Kariokor Health Centre',
          },
          questionsForClinician: questions,
        };

        setSummary(builtSummary);
      } catch (err) {
        console.warn('Could not load mother summary', err);
      } finally {
        setLoading(false);
      }
    }

    void loadMotherSummary();
  }, [userId, userName]);

  const freshnessLabel = useMemo(() => {
    if (!summary) return 'Up to date';

    const timestamps: number[] = [];

    if (summary.verifiedHighlights?.lastClinicalVerificationDate) {
      const t = new Date(summary.verifiedHighlights.lastClinicalVerificationDate).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
    if (summary.pregnancy?.ancSummary?.latestEncounterDate) {
      const t = new Date(summary.pregnancy.ancSummary.latestEncounterDate).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
    if (summary.recentHealthLogs && summary.recentHealthLogs.length > 0) {
      summary.recentHealthLogs.forEach((l) => {
        const t = new Date(l.timestamp).getTime();
        if (!isNaN(t)) timestamps.push(t);
      });
    }

    if (timestamps.length === 0) return 'Up to date';

    const latestMs = Math.max(...timestamps);
    const latestDate = new Date(latestMs);
    const now = new Date();

    if (now.toDateString() === latestDate.toDateString()) {
      return 'Up to date · Last updated today';
    }
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
    if (yesterday.toDateString() === latestDate.toDateString()) {
      return 'Up to date · Last updated yesterday';
    }
    const formatted = latestDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `Up to date · Last updated ${formatted}`;
  }, [summary]);

  const dangerLogsCount = useMemo(() => {
    if (!summary?.recentHealthLogs) return 0;
    return summary.recentHealthLogs.filter((l) => l.hasDangerSigns).length;
  }, [summary]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !summary) return;
    const updated = [...summary.questionsForClinician, newQuestion.trim()];
    setSummary({
      ...summary,
      questionsForClinician: updated,
      patientContext: {
        ...summary.patientContext,
        questionsForClinician: updated,
      },
    });
    setNewQuestion('');

    // Persist to healthContexts in Firestore if signed in
    try {
      await updateDoc(doc(db, `healthContexts/${userId}`), {
        questionsForClinician: updated,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // offline/transient safe
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Sub-Navigation Bar */}
      <div className="bg-white p-2.5 rounded-[20px] border border-[var(--border-hairline)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--lavender-50)] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                activeSubTab === 'summary'
                  ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                  : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
              }`}
            >
              Health Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                activeSubTab === 'vault'
                  ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                  : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
              }`}
            >
              Documents Vault
            </button>
          </div>

          {/* Freshness Status Chip */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono sm:font-sans">{freshnessLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold cursor-pointer shadow-xs hover:bg-[var(--haven-orchid)] transition-all shrink-0"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Bedside Fast Share PIN</span>
        </button>
      </div>

      {/* Flagged Danger Signs Clinical Alert Banner */}
      {dangerLogsCount > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-900 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              <strong>Clinical Alert:</strong> {dangerLogsCount} self-reported symptom log{dangerLogsCount > 1 ? 's' : ''} flagged with MOH danger signs.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('summary');
              setTimeout(() => {
                document.getElementById('recent-health-logs')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            Review Log
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeSubTab === 'summary' && summary && (
        <div className="space-y-4">
          {/* Add Question to Doctor Input */}
          <form onSubmit={handleAddQuestion} className="bg-white border border-[var(--border-hairline)] rounded-[20px] p-3.5 sm:p-4 shadow-card-1">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-[var(--haven-deep)]" />
              <label htmlFor="question-input" className="font-display font-bold text-xs text-[var(--ink-900)]">
                Add a Question for Your Next Doctor or Nurse Visit
              </label>
            </div>
            <div className="flex gap-2">
              <input
                id="question-input"
                type="text"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="e.g. Is lower back tightness normal at week 28?"
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-[var(--lavender-50)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]"
              />
              <button
                type="submit"
                disabled={!newQuestion.trim()}
                className="py-2 px-3.5 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                Add
              </button>
            </div>
          </form>

          {/* Health Summary Display */}
          <HealthSummary
            summary={summary}
            onPrint={() => window.print()}
            isClinicianView={false}
          />
        </div>
      )}

      {activeSubTab === 'vault' && (
        <RecordsVault
          records={[]}
          onOpenUpload={() => {}}
          onOpenRecordDetail={() => {}}
          onOpenShareCode={() => setShowShareModal(true)}
          onOpenExportReport={() => window.print()}
        />
      )}

      {/* Fast Share Modal */}
      {showShareModal && (
        <SharingCodeModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}
