// src/components/clinician/PmtctHeiModal.tsx
// PMTCT & HIV-Exposed Infant (HEI) Management (Kenya MOH 216 Handbook pp.11-12, 36)

import React, { useState } from 'react';
import { ShieldAlert, X, Calendar, Check, AlertCircle, Heart, Pill, TestTube, Baby } from 'lucide-react';
import {
  PmtctHeiRecord,
  MaternalArtVisit,
  MaternalViralLoadRecord,
  InfantArtProphylaxis,
  InfantCtxProphylaxis,
  HeiDbsTestRecord,
  HeiTestMilestone,
} from '../../types';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface PmtctHeiModalProps {
  isOpen?: boolean;
  motherId: string;
  pregnancyId?: string;
  childId?: string;
  initialData?: Partial<PmtctHeiRecord>;
  examinerName?: string;
  facilityName?: string;
  onClose: () => void;
  onSaved: (record?: any) => void;
}

const DEFAULT_MILESTONES: { milestone: HeiTestMilestone; label: string }[] = [
  { milestone: '1st_dna_pcr_6wk', label: '1st DNA PCR (Birth / 6 Weeks)' },
  { milestone: '2nd_dna_pcr_6mo', label: '2nd DNA PCR (6 Months)' },
  { milestone: '3rd_dna_pcr_12mo', label: '3rd DNA PCR (12 Months)' },
  { milestone: 'antibody_18mo', label: 'HIV Antibody Test (18 Months)' },
  { milestone: 'antibody_24mo', label: 'HIV Antibody Test (24 Months)' },
  { milestone: 'final_antibody_6wk_wean', label: 'Final Antibody Test (6 Wks Post-Weaning)' },
];

export const PmtctHeiModal: React.FC<PmtctHeiModalProps> = ({
  isOpen = true,
  motherId,
  pregnancyId,
  childId,
  initialData,
  examinerName: defaultExaminer = '',
  facilityName: defaultFacility = '',
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'maternal' | 'infant' | 'testing' | 'careplan'>('maternal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // General & Provenance
  const [facilityName, setFacilityName] = useState(defaultFacility || initialData?.facilityName || '');
  const [examinerName, setExaminerName] = useState(defaultExaminer || initialData?.provenance?.verifiedBy || '');

  // Maternal ART (pp.11-12)
  const [maternalHivStatus, setMaternalHivStatus] = useState<'reactive' | 'non-reactive' | 'unknown'>(
    initialData?.maternalHivStatus || 'reactive'
  );
  const [maternalArtStartDate, setMaternalArtStartDate] = useState(initialData?.maternalArtStartDate || '');
  const [maternalBaselineRegimen, setMaternalBaselineRegimen] = useState(
    initialData?.maternalBaselineRegimen || 'TDF + 3TC + DTG'
  );

  // 4 Maternal ART visits per handbook p.12
  const [maternalArtVisits, setMaternalArtVisits] = useState<MaternalArtVisit[]>(
    initialData?.maternalArtVisits && initialData.maternalArtVisits.length === 4
      ? initialData.maternalArtVisits
      : [
          { visitNumber: 1, date: new Date().toISOString().split('T')[0], regimen: 'TDF + 3TC + DTG', dispensed: true, adherenceAssessed: true, comments: '' },
          { visitNumber: 2, date: '', regimen: 'TDF + 3TC + DTG', dispensed: false, adherenceAssessed: false, comments: '' },
          { visitNumber: 3, date: '', regimen: 'TDF + 3TC + DTG', dispensed: false, adherenceAssessed: false, comments: '' },
          { visitNumber: 4, date: '', regimen: 'TDF + 3TC + DTG', dispensed: false, adherenceAssessed: false, comments: '' },
        ]
  );

  // Maternal Viral Load
  const [vlSampleDate, setVlSampleDate] = useState(initialData?.maternalViralLoad?.dateSampleTaken || '');
  const [vlResultCopies, setVlResultCopies] = useState<string>(
    initialData?.maternalViralLoad?.resultCopiesMl !== undefined ? String(initialData.maternalViralLoad.resultCopiesMl) : '< 50'
  );
  const [vlSuppressionStatus, setVlSuppressionStatus] = useState<'suppressed' | 'unsuppressed' | 'pending' | 'target_not_detected'>(
    initialData?.maternalViralLoad?.suppressionStatus || 'suppressed'
  );
  const [vlDateReceived, setVlDateReceived] = useState(initialData?.maternalViralLoad?.dateResultReceived || '');
  const [nextVlDueDate, setNextVlDueDate] = useState(initialData?.maternalViralLoad?.nextVlDueDate || '');
  const [vlComments, setVlComments] = useState(initialData?.maternalViralLoad?.comments || '');

  // Infant ARV Prophylaxis (pp.12, 36)
  const [infantArtRegimen, setInfantArtRegimen] = useState(initialData?.infantArtProphylaxis?.regimen || 'AZT + NVP syrup');
  const [infantArtStartDate, setInfantArtStartDate] = useState(initialData?.infantArtProphylaxis?.startDate || '');
  const [infantArtContinuedUntil, setInfantArtContinuedUntil] = useState(initialData?.infantArtProphylaxis?.continuedUntilDate || '');
  const [infantArtStatus, setInfantArtStatus] = useState<'active' | 'completed' | 'stopped_due_to_positive' | 'discontinued'>(
    initialData?.infantArtProphylaxis?.status || 'active'
  );

  // Infant CTX Prophylaxis
  const [infantCtxDose, setInfantCtxDose] = useState(initialData?.infantCtxProphylaxis?.dose || '2.5 mL daily');
  const [infantCtxStartDate, setInfantCtxStartDate] = useState(initialData?.infantCtxProphylaxis?.startDate || '');
  const [infantCtxContinuedUntil, setInfantCtxContinuedUntil] = useState(initialData?.infantCtxProphylaxis?.continuedUntilDate || '');
  const [infantCtxStatus, setInfantCtxStatus] = useState<'active' | 'completed' | 'discontinued'>(
    initialData?.infantCtxProphylaxis?.status || 'active'
  );

  // Infant IPT
  const [infantIptGiven, setInfantIptGiven] = useState(Boolean(initialData?.infantIptGiven));
  const [infantIptDate, setInfantIptDate] = useState(initialData?.infantIptDate || '');

  // Infant Testing Schedule (p.36)
  const [infantDbsTests, setInfantDbsTests] = useState<HeiDbsTestRecord[]>(() => {
    if (initialData?.infantDbsTests && initialData.infantDbsTests.length > 0) {
      return initialData.infantDbsTests;
    }
    return DEFAULT_MILESTONES.map((m) => ({
      id: m.milestone,
      milestone: m.milestone,
      label: m.label,
      dateSampleCollected: '',
      dateResultReceived: '',
      sampleType: 'DBS',
      result: 'pending',
      confirmatoryPcrCollected: false,
      labNumber: '',
      facilityName: defaultFacility || '',
      comments: '',
    }));
  });

  // Care Plan for Mother View
  const [nextApptDate, setNextApptDate] = useState(initialData?.carePlanSummary?.nextAppointmentDate || '');
  const [infantFeeding, setInfantFeeding] = useState<'exclusive_breastfeeding' | 'exclusive_replacement' | 'mixed_avoided'>(
    initialData?.carePlanSummary?.infantFeedingCounseling || 'exclusive_breastfeeding'
  );
  const [supportGroupReferred, setSupportGroupReferred] = useState(Boolean(initialData?.carePlanSummary?.supportGroupReferred));
  const [activeMedsSummary, setActiveMedsSummary] = useState<string>(
    initialData?.carePlanSummary?.activeMedications?.join(', ') || 'Maternal ART (TDF+3TC+DTG), Infant ARV Prophylaxis (AZT+NVP), Infant CTX Syrup'
  );

  const updateVisit = (index: number, patch: Partial<MaternalArtVisit>) => {
    setMaternalArtVisits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const updateTest = (index: number, patch: Partial<HeiDbsTestRecord>) => {
    setInfantDbsTests((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'pmtct',
      motherId,
      pregnancyId: pregnancyId || undefined,
      childId: childId || undefined,
      facilityName: facilityName.trim() || undefined,
      examinerName: examinerName.trim() || undefined,
      isHivExposed: true,
      maternalHivStatus,
      maternalArtStartDate: maternalArtStartDate || undefined,
      maternalBaselineRegimen: maternalBaselineRegimen.trim() || undefined,
      maternalArtVisits,
      maternalViralLoad: {
        dateSampleTaken: vlSampleDate || undefined,
        resultCopiesMl: vlResultCopies || undefined,
        suppressionStatus: vlSuppressionStatus,
        dateResultReceived: vlDateReceived || undefined,
        nextVlDueDate: nextVlDueDate || undefined,
        comments: vlComments.trim() || undefined,
      },
      infantArtProphylaxis: {
        regimen: infantArtRegimen.trim(),
        startDate: infantArtStartDate,
        continuedUntilDate: infantArtContinuedUntil || undefined,
        status: infantArtStatus,
      },
      infantCtxProphylaxis: {
        dose: infantCtxDose.trim(),
        startDate: infantCtxStartDate,
        continuedUntilDate: infantCtxContinuedUntil || undefined,
        status: infantCtxStatus,
      },
      infantIptGiven,
      infantIptDate: infantIptGiven ? infantIptDate || undefined : undefined,
      infantDbsTests,
      carePlanSummary: {
        nextAppointmentDate: nextApptDate || undefined,
        activeMedications: activeMedsSummary.split(',').map((s) => s.trim()).filter(Boolean),
        infantFeedingCounseling: infantFeeding,
        supportGroupReferred,
      },
    };

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/clinician/encounters/pmtct', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      const result = await res.json();
      onSaved(result);
      onClose();
    } catch (err: any) {
      console.error('[PmtctHeiModal] Save error:', err);
      setErrorMessage(err.message || 'Failed to save PMTCT encounter record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white font-display">
                  PMTCT & HIV-Exposed Infant (HEI) Management
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800">
                  MOH 216 pp.11-12, 36
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authoritative maternal ART dispensing, viral load suppression & HEI prophylaxis protocol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Access Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Restricted Clinical Dataset:</strong> Clinician session verified. Raw viral loads and PCR assays remain protected. Mother receives clear, actionable care-plan guidance.
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('maternal')}
            className={`pb-2.5 px-3 border-b-2 font-display transition-colors flex items-center gap-1.5 ${
              activeTab === 'maternal'
                ? 'border-rose-600 text-rose-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            1. Maternal ART & Viral Load (pp.11-12)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('infant')}
            className={`pb-2.5 px-3 border-b-2 font-display transition-colors flex items-center gap-1.5 ${
              activeTab === 'infant'
                ? 'border-rose-600 text-rose-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            2. Infant Prophylaxis (AZT/NVP & CTX)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('testing')}
            className={`pb-2.5 px-3 border-b-2 font-display transition-colors flex items-center gap-1.5 ${
              activeTab === 'testing'
                ? 'border-rose-600 text-rose-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TestTube className="w-3.5 h-3.5" />
            3. Infant Testing Schedule (p.36)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('careplan')}
            className={`pb-2.5 px-3 border-b-2 font-display transition-colors flex items-center gap-1.5 ${
              activeTab === 'careplan'
                ? 'border-rose-600 text-rose-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            4. Actionable Mother Care Plan
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: MATERNAL ART & VIRAL LOAD */}
          {activeTab === 'maternal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maternal HIV Serostatus
                  </label>
                  <select
                    value={maternalHivStatus}
                    onChange={(e) => setMaternalHivStatus(e.target.value as any)}
                    className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white"
                  >
                    <option value="reactive">Reactive (Known Positive)</option>
                    <option value="non-reactive">Non-Reactive</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maternal ART Start Date
                  </label>
                  <input
                    type="date"
                    value={maternalArtStartDate}
                    onChange={(e) => setMaternalArtStartDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Baseline ART Regimen
                  </label>
                  <input
                    type="text"
                    value={maternalBaselineRegimen}
                    onChange={(e) => setMaternalBaselineRegimen(e.target.value)}
                    placeholder="e.g. TDF + 3TC + DTG"
                    className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>

              {/* Maternal ART Visits (Handbook p.12) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Maternal ART Visits & Dispensing (Handbook p.12: Visits 1–4)
                  </h3>
                  <span className="text-[11px] text-slate-500">Adherence & Pill Count Verification</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-16">Visit</th>
                        <th className="p-2.5 w-36">Visit Date</th>
                        <th className="p-2.5">Current ART Regimen</th>
                        <th className="p-2.5 w-24 text-center">Dispensed</th>
                        <th className="p-2.5 w-24 text-center">Adherent</th>
                        <th className="p-2.5">Reason for Regimen Change / Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {maternalArtVisits.map((v, idx) => (
                        <tr key={v.visitNumber} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-bold text-slate-800">Visit {v.visitNumber}</td>
                          <td className="p-2.5">
                            <input
                              type="date"
                              value={v.date || ''}
                              onChange={(e) => updateVisit(idx, { date: e.target.value })}
                              className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={v.regimen || ''}
                              onChange={(e) => updateVisit(idx, { regimen: e.target.value })}
                              placeholder="e.g. TDF + 3TC + DTG"
                              className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(v.dispensed)}
                              onChange={(e) => updateVisit(idx, { dispensed: e.target.checked })}
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(v.adherenceAssessed)}
                              onChange={(e) => updateVisit(idx, { adherenceAssessed: e.target.checked })}
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={v.comments || ''}
                              onChange={(e) => updateVisit(idx, { comments: e.target.value })}
                              placeholder="Clinical observations or regimen change reason"
                              className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Maternal Viral Load (VL) Tracking */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Maternal Viral Load (VL) Sample & Suppression Status</span>
                  {vlSuppressionStatus === 'unsuppressed' && (
                    <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px] font-bold">
                      Flagged: Unsuppressed VL (&ge; 1,000 copies/mL)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Date Sample Taken</label>
                    <input
                      type="date"
                      value={vlSampleDate}
                      onChange={(e) => setVlSampleDate(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">VL Result (copies/mL)</label>
                    <input
                      type="text"
                      value={vlResultCopies}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVlResultCopies(val);
                        const num = Number(val);
                        if (!isNaN(num) && num >= 1000) {
                          setVlSuppressionStatus('unsuppressed');
                        } else if (!isNaN(num) && num < 1000) {
                          setVlSuppressionStatus('suppressed');
                        }
                      }}
                      placeholder="e.g. < 50, LDL, 240, 1500"
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Suppression Status</label>
                    <select
                      value={vlSuppressionStatus}
                      onChange={(e) => setVlSuppressionStatus(e.target.value as any)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white font-medium"
                    >
                      <option value="suppressed">Suppressed (&lt; 1,000 copies/mL)</option>
                      <option value="target_not_detected">Target Not Detected / &lt; 50</option>
                      <option value="unsuppressed">Unsuppressed (&ge; 1,000 copies/mL)</option>
                      <option value="pending">Result Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Next VL Due Date</label>
                    <input
                      type="date"
                      value={nextVlDueDate}
                      onChange={(e) => setNextVlDueDate(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Enhanced Adherence / Clinical Notes</label>
                  <input
                    type="text"
                    value={vlComments}
                    onChange={(e) => setVlComments(e.target.value)}
                    placeholder="e.g. EAC sessions completed, adherence barrier identified"
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INFANT PROPHYLAXIS */}
          {activeTab === 'infant' && (
            <div className="space-y-6">
              {/* Infant ARV Prophylaxis */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Pill className="w-4 h-4 text-rose-600" />
                  <span>Infant ARV Prophylaxis (Handbook p.12, 36)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Infant ARV Regimen</label>
                    <input
                      type="text"
                      value={infantArtRegimen}
                      onChange={(e) => setInfantArtRegimen(e.target.value)}
                      placeholder="e.g. AZT + NVP syrup"
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Start Date (At Birth / 1st Contact)</label>
                    <input
                      type="date"
                      value={infantArtStartDate}
                      onChange={(e) => setInfantArtStartDate(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Continued Until Date</label>
                    <input
                      type="date"
                      value={infantArtContinuedUntil}
                      onChange={(e) => setInfantArtContinuedUntil(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">ARV Prophylaxis Status</label>
                    <select
                      value={infantArtStatus}
                      onChange={(e) => setInfantArtStatus(e.target.value as any)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    >
                      <option value="active">Active (On Daily Prophylaxis)</option>
                      <option value="completed">Completed (Minimum duration met)</option>
                      <option value="stopped_due_to_positive">Switched to ART (Child Confirmed Positive)</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Infant CTX Prophylaxis */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Pill className="w-4 h-4 text-indigo-600" />
                  <span>Infant Cotrimoxazole (CTX) Prophylaxis (Handbook p.12, 36)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">CTX Daily Dosage</label>
                    <input
                      type="text"
                      value={infantCtxDose}
                      onChange={(e) => setInfantCtxDose(e.target.value)}
                      placeholder="e.g. 2.5 mL daily syrup"
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Start Date (from 6 weeks of age)</label>
                    <input
                      type="date"
                      value={infantCtxStartDate}
                      onChange={(e) => setInfantCtxStartDate(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Continued Until Date (Post-weaning)</label>
                    <input
                      type="date"
                      value={infantCtxContinuedUntil}
                      onChange={(e) => setInfantCtxContinuedUntil(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">CTX Prophylaxis Status</label>
                    <select
                      value={infantCtxStatus}
                      onChange={(e) => setInfantCtxStatus(e.target.value as any)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed (Confirmed Negative 6 Wks Post-Wean)</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Infant IPT */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Infant Isoniazid Preventive Therapy (IPT)</div>
                  <div className="text-[11px] text-slate-500">TB exposure prophylaxis for infant if household contact</div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={infantIptGiven}
                      onChange={(e) => setInfantIptGiven(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 h-4 w-4"
                    />
                    <span>IPT Initiated</span>
                  </label>
                  {infantIptGiven && (
                    <input
                      type="date"
                      value={infantIptDate}
                      onChange={(e) => setInfantIptDate(e.target.value)}
                      className="text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INFANT TESTING SCHEDULE (MOH Handbook p.36) */}
          {activeTab === 'testing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Infant DBS DNA PCR & HIV Antibody Testing Schedule (Handbook p.36)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Track all 6 milestone tests from birth / 6 weeks through 6 weeks post-weaning
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Milestone / Test</th>
                      <th className="p-2.5 w-32">Sample Date</th>
                      <th className="p-2.5 w-28">Sample Type</th>
                      <th className="p-2.5 w-36">Result</th>
                      <th className="p-2.5 w-32">Lab / Batch #</th>
                      <th className="p-2.5">Clinical Follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {infantDbsTests.map((t, idx) => {
                      const isPositive = t.result === 'positive';
                      return (
                        <tr key={t.id || t.milestone} className={`hover:bg-slate-50 ${isPositive ? 'bg-rose-50' : ''}`}>
                          <td className="p-2.5 font-medium text-slate-800">
                            <div>{t.label}</div>
                            {isPositive && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                                Positive - Immediate ART Indicated
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="date"
                              value={t.dateSampleCollected || ''}
                              onChange={(e) => updateTest(idx, { dateSampleCollected: e.target.value })}
                              className="w-full text-xs rounded border border-slate-300 p-1 bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={t.sampleType || 'DBS'}
                              onChange={(e) => updateTest(idx, { sampleType: e.target.value as any })}
                              className="w-full text-xs rounded border border-slate-300 p-1 bg-white"
                            >
                              <option value="DBS">DBS</option>
                              <option value="Plasma">Plasma</option>
                              <option value="Rapid Test">Rapid Test</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={t.result || 'pending'}
                              onChange={(e) => updateTest(idx, { result: e.target.value as any })}
                              className={`w-full text-xs rounded border p-1 font-medium ${
                                t.result === 'positive'
                                  ? 'border-rose-400 bg-rose-100 text-rose-800'
                                  : t.result === 'negative'
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-300 bg-white text-slate-700'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="negative">Negative</option>
                              <option value="positive">Positive</option>
                              <option value="inconclusive">Inconclusive</option>
                              <option value="not_done">Not Done</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={t.labNumber || ''}
                              onChange={(e) => updateTest(idx, { labNumber: e.target.value })}
                              placeholder="Batch/Lab #"
                              className="w-full text-xs rounded border border-slate-300 p-1 bg-white font-mono"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={t.comments || ''}
                              onChange={(e) => updateTest(idx, { comments: e.target.value })}
                              placeholder="Action taken / Date result given"
                              className="w-full text-xs rounded border border-slate-300 p-1 bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIONABLE MOTHER CARE PLAN */}
          {activeTab === 'careplan' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <span>Mother & Baby Actionable Care Plan (Visible in Patient Records)</span>
                </div>
                <p className="text-xs text-slate-500">
                  This non-stigmatizing summary informs the mother of her medication times, safe feeding protocol, and next appointment without unnecessarily broadcasting sensitive lab metrics.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Next Clinic Appointment Date
                    </label>
                    <input
                      type="date"
                      value={nextApptDate}
                      onChange={(e) => setNextApptDate(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Infant Feeding Counseling Option
                    </label>
                    <select
                      value={infantFeeding}
                      onChange={(e) => setInfantFeeding(e.target.value as any)}
                      className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                    >
                      <option value="exclusive_breastfeeding">Exclusive Breastfeeding (EBF) with ARV prophylaxis</option>
                      <option value="exclusive_replacement">Exclusive Replacement Feeding (ERF)</option>
                      <option value="mixed_avoided">Mixed Feeding Strictly Avoided</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Active Medications & Prophylaxis (Mother instructions)
                  </label>
                  <textarea
                    rows={2}
                    value={activeMedsSummary}
                    onChange={(e) => setActiveMedsSummary(e.target.value)}
                    placeholder="e.g. Maternal daily ART with evening meal, Infant ARV syrup 1x daily at 8am, CTX 2.5ml daily"
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supportGroupReferred}
                      onChange={(e) => setSupportGroupReferred(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 h-4 w-4"
                    />
                    <span>Referred to Mentor Mothers / Peer Support Group</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Signed & logged with verified clinician provenance</span>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-5 py-2">
                {submitting ? 'Saving PMTCT Encounter...' : 'Save PMTCT Encounter'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PmtctHeiModal;
