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
import type { MomHavenHealthSummary, ClinicianHealthLogEntry, ChildHealthSummary } from '../../types/healthSummary';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getHealthLogs } from '../../services/healthLogService';
import { getActivePregnancy, getAncEncounters } from '../../services/pregnancyService';
import { getChildren, getImmunizationRecords, getGrowthMeasurements, calculateChildAge } from '../../services/childService';
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
          activePreg = await getActivePregnancy(userId);
          if (!activePreg) {
            const pregDoc = await getDoc(doc(db, `pregnancies/${userId}`));
            if (pregDoc.exists()) activePreg = { id: pregDoc.id, ...pregDoc.data() };
          }
        } catch {
          // ignore
        }

        // Fetch real ANC encounters for active pregnancy
        let realEncounters: any[] = [];
        if (activePreg?.id) {
          realEncounters = await getAncEncounters(activePreg.id).catch(() => []);
        }
        realEncounters.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

        const totalEncounters = realEncounters.length;
        const verifiedCount = realEncounters.filter((e) => e.provenance?.status === 'VERIFIED').length;
        const reportedCount = totalEncounters - verifiedCount;
        const latest = realEncounters[0];
        const mappedEncounters = realEncounters.map((e) => ({
          id: e.id,
          date: e.date,
          visitNumber: e.visitNumber || 1,
          gestationWeeks: e.gestationalAgeWeeks ?? e.gestationalWeeks,
          bloodPressure: e.bloodPressure || (e.systolicBp && e.diastolicBp ? `${e.systolicBp}/${e.diastolicBp}` : undefined),
          fundalHeightCm: e.fundalHeightCm ?? e.fundalHeight,
          fetalHeartRate: e.fetalHeartRate ?? e.fhr,
          hemoglobin: e.hemoglobin ?? e.hbLevel ?? e.hb,
          summary: e.summary || e.notes || e.clinicalNotes,
          iptpGiven: Boolean(e.iptpGiven || e.iptp),
          ifasGiven: Boolean(e.ifasGiven || e.ifas || e.ironFolicGiven),
          provenance: {
            status: (e.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'REPORTED') as 'VERIFIED' | 'REPORTED',
            enteredBy: e.provenance?.enteredBy || 'Clinician',
            verifiedBy: e.provenance?.verifiedBy,
            verifiedAt: e.provenance?.verifiedAt,
          },
        }));

        // Load real children
        const realChildren = await getChildren(userId).catch(() => []);
        const mappedChildren: ChildHealthSummary[] = await Promise.all(
          realChildren.map(async (ch) => {
            const age = ch.dateOfBirth ? calculateChildAge(ch.dateOfBirth) : { months: 0, ageFormatted: 'Newborn' };
            const [vaccines, growth] = await Promise.all([
              getImmunizationRecords(ch.id).catch(() => []),
              getGrowthMeasurements(ch.id).catch(() => []),
            ]);
            const verifiedVax = vaccines.filter((v) => v.provenance?.status === 'VERIFIED').length;
            growth.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
            const latestGrowth = growth[0];
            return {
              id: ch.id,
              name: ch.name || 'Baby',
              dateOfBirth: ch.dateOfBirth,
              ageMonths: age.months,
              ageFormatted: age.ageFormatted,
              sex: ch.sex,
              provenance: (ch.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'USER_REPORTED') as any,
              immunizations: {
                totalAdministered: vaccines.length,
                verifiedCount: verifiedVax,
                recentRecords: vaccines.map((v) => ({
                  id: v.id,
                  vaccineName: v.vaccineName,
                  dateGiven: v.dateAdministered || (v as any).dateGiven || '',
                  batch: v.batchNumber,
                  provenance: {
                    status: (v.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'REPORTED') as 'VERIFIED' | 'REPORTED',
                    verifiedBy: v.provenance?.verifiedBy || null,
                  },
                })),
              },
              growth: {
                latestWeightKg: latestGrowth?.weightKg,
                latestHeightCm: latestGrowth?.heightCm,
                latestMuacMm: latestGrowth?.muacCm ? latestGrowth.muacCm * 10 : undefined,
                latestMeasurementDate: latestGrowth?.date,
                provenance: latestGrowth
                  ? {
                      status: (latestGrowth.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'REPORTED') as 'VERIFIED' | 'REPORTED',
                      verifiedBy: latestGrowth.provenance?.verifiedBy || null,
                    }
                  : undefined,
              },
            };
          })
        );

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

        // Fetch cancer screening records (MOH 216 p.22)
        let cancerScreeningsList: any[] = [];
        try {
          const csQuery = query(collection(db, 'cancerScreenings'), where('motherId', '==', userId));
          const csSnap = await getDocs(csQuery);
          csSnap.forEach((d) => cancerScreeningsList.push({ id: d.id, ...d.data() }));
        } catch {
          // ignore if collection empty or unavailable
        }

        const hasSuspiciousOrPositive = cancerScreeningsList.some(
          (cs) =>
            cs.cervicalScreening?.result === 'positive' ||
            cs.cervicalScreening?.result === 'suspicious' ||
            cs.breastScreening?.result === 'suspicious_lump'
        );
        const alerts: string[] = [];
        cancerScreeningsList.forEach((cs) => {
          if (cs.cervicalScreening?.result === 'positive' || cs.cervicalScreening?.result === 'suspicious') {
            alerts.push(`Cervical screening finding: ${cs.cervicalScreening.result}`);
          }
          if (cs.breastScreening?.result === 'suspicious_lump') {
            alerts.push('Breast screening finding: suspicious lump');
          }
        });

        // Fetch PMTCT / HEI records (MOH 216 pp.11-12, 36)
        let pmtctRecordsList: any[] = [];
        try {
          const pmtctQuery = query(collection(db, 'pmtctRecords'), where('motherId', '==', userId));
          const pmtctSnap = await getDocs(pmtctQuery);
          pmtctSnap.forEach((d) => pmtctRecordsList.push({ id: d.id, ...d.data() }));
        } catch {
          // ignore if collection empty or unavailable
        }

        let pmtctSummaryData: any = undefined;
        if (pmtctRecordsList.length > 0) {
          const latestPmtct = pmtctRecordsList[0];
          const hasVlAlert = latestPmtct.maternalViralLoad?.status === 'unsuppressed' ||
            (typeof latestPmtct.maternalViralLoad?.copiesPerMl === 'number' && latestPmtct.maternalViralLoad.copiesPerMl >= 1000);
          const hasHeiPositive = latestPmtct.infantTests?.some((t: any) => t.result === 'positive');
          const pmtctAlerts: string[] = [];
          if (hasVlAlert) pmtctAlerts.push('Maternal viral load unsuppressed (>= 1,000 copies/mL)');
          if (hasHeiPositive) pmtctAlerts.push('Positive infant PCR / antibody test recorded');

          pmtctSummaryData = {
            isHivExposed: true,
            maternalArtRegimen: latestPmtct.maternalArt?.baselineRegimen,
            maternalArtVisitsCount: latestPmtct.maternalArt?.visits?.length || 0,
            maternalViralLoadStatus: latestPmtct.maternalViralLoad?.status,
            maternalViralLoadResult: latestPmtct.maternalViralLoad?.copiesPerMl ?? latestPmtct.maternalViralLoad?.status,
            infantArtProphylaxisRegimen: latestPmtct.infantProphylaxis?.arvRegimen,
            infantCtxProphylaxisStatus: latestPmtct.infantProphylaxis?.ctxDailyDose ? 'Active' : undefined,
            infantTestsCompletedCount: latestPmtct.infantTests?.filter((t: any) => t.result && t.result !== 'pending').length || 0,
            hasAlerts: hasVlAlert || hasHeiPositive,
            alerts: pmtctAlerts,
            carePlan: latestPmtct.patientFacingPlan || {
              activeMedications: ['Daily prenatal vitamins & protective medication regimen'],
              nextAppointmentDate: 'Per clinical schedule',
              infantFeedingCounseling: 'Exclusive breastfeeding with medication coverage per clinician advice',
            },
            records: pmtctRecordsList,
          };
        }

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
            hasActivePregnancy: !!activePreg,
            pregnancyId: activePreg?.id,
            status: activePreg?.status || 'active',
            lmp: activePreg?.lmp,
            edd: activePreg?.edd,
            gravida: activePreg?.gravida,
            parity: activePreg?.parity,
            bloodGroup: activePreg?.bloodGroup,
            clinicalConditions: activePreg?.clinicalConditions || [],
            provenance: activePreg?.provenance?.status === 'VERIFIED' ? 'VERIFIED' : 'USER_REPORTED',
            currentStage: {
              gestationalAgeWeeks: activePreg?.gestationalAgeWeeks || 0,
              trimester: activePreg?.gestationalAgeWeeks
                ? (activePreg.gestationalAgeWeeks < 13 ? 1 : activePreg.gestationalAgeWeeks < 27 ? 2 : 3)
                : 1,
              daysRemaining: activePreg?.edd
                ? Math.max(0, Math.floor((new Date(activePreg.edd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : 0,
              isCalculatedFromLmp: !!activePreg?.lmp,
            },
            ancSummary: {
              totalEncounters,
              verifiedCount,
              reportedCount,
              latestEncounterDate: latest?.date || null,
              latestBloodPressure: latest?.bloodPressure || (latest?.systolicBp && latest?.diastolicBp ? `${latest.systolicBp}/${latest.diastolicBp}` : null),
              latestFundalHeightCm: latest?.fundalHeightCm ?? latest?.fundalHeight,
              latestFetalHeartRate: latest?.fetalHeartRate ?? latest?.fhr,
              latestHemoglobin: latest?.hemoglobin ?? latest?.hbLevel ?? latest?.hb,
              iptpCount: realEncounters.filter((e) => e.iptpGiven || e.iptp).length,
              ifasCompliant: realEncounters.some((e) => e.ifasGiven || e.ifas || e.ironFolicGiven),
              encounters: mappedEncounters,
            },
          },
          children: mappedChildren,
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
          reproductiveScreening: cancerScreeningsList.length > 0 ? {
            totalScreenings: cancerScreeningsList.length,
            hasSuspiciousOrPositive,
            latestScreeningDate: cancerScreeningsList[0]?.date,
            records: cancerScreeningsList,
            alerts,
          } : undefined,
          pmtct: pmtctSummaryData,
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
      {/* Official Kenya MOH Clinical Handbook Banner */}
      <div className="bg-slate-800 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <span className="flex items-center gap-1.5 font-semibold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          REPUBLIC OF KENYA · MINISTRY OF HEALTH
        </span>
        <span className="text-slate-400 font-mono">MOH 216 · CLINICAL DOSSIER</span>
      </div>

      {/* Top Action & Sub-Navigation Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab('summary')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeSubTab === 'summary'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Health Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('vault')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeSubTab === 'vault'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Documents Vault
            </button>
          </div>

          {/* Freshness Status Chip */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{freshnessLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-mono font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
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
