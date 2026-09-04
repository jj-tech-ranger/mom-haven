// src/components/clinician/AntenatalProfileModal.tsx
// Antenatal Profile & Maternal Serology Tracking (Kenya MOH 216 Handbook pp.7, 11)

import React, { useState } from 'react';
import { Activity, X, Check, AlertCircle, Calendar, ShieldCheck, FileCheck, Stethoscope } from 'lucide-react';
import { AntenatalProfile, BloodGroup, RhesusFactor, SerologyRepeatScheduleItem, UltrasoundExam } from '../../types';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface AntenatalProfileModalProps {
  isOpen?: boolean;
  motherId: string;
  pregnancyId?: string;
  initialProfile?: Partial<AntenatalProfile> | null;
  onClose: () => void;
  onSaved: (profile?: AntenatalProfile) => void;
}

export const AntenatalProfileModal: React.FC<AntenatalProfileModalProps> = ({
  isOpen = true,
  motherId,
  pregnancyId,
  initialProfile,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  // Profile core values
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(initialProfile?.bloodGroup || 'O');
  const [rhesusFactor, setRhesusFactor] = useState<RhesusFactor>(initialProfile?.rhesusFactor || 'Positive');
  const [urinalysisResult, setUrinalysisResult] = useState<string>(initialProfile?.urinalysisResult || 'Albumin: Nil; Glucose: Nil');
  const [bloodRbs, setBloodRbs] = useState<string>(initialProfile?.bloodRbs || '5.2 mmol/L');
  const [tbIcfScreeningOutcome, setTbIcfScreeningOutcome] = useState<'negative' | 'positive' | 'suspect' | 'on_treatment'>(
    initialProfile?.tbIcfScreeningOutcome || 'negative'
  );
  const [tbIptDate, setTbIptDate] = useState<string>(initialProfile?.tbIptDate || '');
  const [tbIptNextVisit, setTbIptNextVisit] = useState<string>(initialProfile?.tbIptNextVisit || '');

  // Triple Serology & Partner Status
  const [hivStatus, setHivStatus] = useState<string>(initialProfile?.hivStatus || 'Negative');
  const [partnerHivStatus, setPartnerHivStatus] = useState<string>(initialProfile?.partnerHivStatus || 'Negative');
  const [syphilisStatus, setSyphilisStatus] = useState<string>(initialProfile?.syphilisStatus || 'Negative (Non-reactive)');
  const [hepatitisBStatus, setHepatitisBStatus] = useState<string>(initialProfile?.hepatitisBStatus || 'Negative (HBsAg non-reactive)');

  // Repeat Schedule
  const [repeat36Weeks, setRepeat36Weeks] = useState(true);
  const [repeatDelivery, setRepeatDelivery] = useState(true);
  const [repeatPnc, setRepeatPnc] = useState(false);

  // Ultrasounds (MOH Handbook p.11 - recommended 2 scans: before 24 weeks & at 28-32 weeks)
  const [us1Done, setUs1Done] = useState(Boolean(initialProfile?.ultrasound1));
  const [us1Date, setUs1Date] = useState(initialProfile?.ultrasound1?.date || '');
  const [us1Gest, setUs1Gest] = useState(String(initialProfile?.ultrasound1?.gestationalAgeWeeks || ''));
  const [us1Findings, setUs1Findings] = useState(initialProfile?.ultrasound1?.findings || 'Single live intrauterine gestation. Normal cardiac activity.');

  const [us2Done, setUs2Done] = useState(Boolean(initialProfile?.ultrasound2));
  const [us2Date, setUs2Date] = useState(initialProfile?.ultrasound2?.date || '');
  const [us2Gest, setUs2Gest] = useState(String(initialProfile?.ultrasound2?.gestationalAgeWeeks || ''));
  const [us2Findings, setUs2Findings] = useState(initialProfile?.ultrasound2?.findings || 'Normal fetal growth, cephalic presentation, adequate liquor.');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const repeatSchedule: SerologyRepeatScheduleItem[] = [];
    if (repeat36Weeks) {
      repeatSchedule.push({
        milestone: '36_weeks',
        testType: 'HIV & Syphilis Rapid Test',
        status: 'pending',
      });
    }
    if (repeatDelivery) {
      repeatSchedule.push({
        milestone: 'delivery',
        testType: 'HIV Rapid Test',
        status: 'pending',
      });
    }
    if (repeatPnc) {
      repeatSchedule.push({
        milestone: 'pnc_6weeks',
        testType: 'HIV Rapid Test',
        status: 'pending',
      });
    }

    const payload: Record<string, any> = {
      type: 'antenatal_profile',
      motherId,
      pregnancyId,
      bloodGroup,
      rhesusFactor,
      urinalysisResult: urinalysisResult.trim() || undefined,
      bloodRbs: bloodRbs.trim() || undefined,
      tbIcfScreeningOutcome,
      tbIptDate: tbIptDate || undefined,
      tbIptNextVisit: tbIptNextVisit || undefined,
      hivStatus,
      partnerHivStatus,
      syphilisStatus,
      hepatitisBStatus,
      serologyRepeatSchedule: repeatSchedule,
    };

    if (us1Done && us1Date) {
      payload.ultrasound1 = {
        scanNumber: 1,
        date: us1Date,
        gestationalAgeWeeks: us1Gest ? Number(us1Gest) : undefined,
        findings: us1Findings.trim() || undefined,
        placentalLocation: 'Normal',
        multiplePregnancy: false,
      };
    }

    if (us2Done && us2Date) {
      payload.ultrasound2 = {
        scanNumber: 2,
        date: us2Date,
        gestationalAgeWeeks: us2Gest ? Number(us2Gest) : undefined,
        findings: us2Findings.trim() || undefined,
        placentalLocation: 'Normal',
        multiplePregnancy: false,
      };
    }

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/clinician/encounters/antenatal-profile', {
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
      setErrorMessage(err.message || 'Failed to update Antenatal Profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 shadow-2xl border border-[var(--border-hairline)] my-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                Antenatal Profile & Serology
              </h3>
              <p className="text-xs text-gray-500">Kenya MOH 216 Handbook pp.7, 11 · Comprehensive Lab & Screening Record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Blood & Baseline Lab Section */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-950 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              1. Blood Group, Rhesus & Baseline Diagnostics (MOH p.7)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white font-bold"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Rhesus Factor</label>
                <select
                  value={rhesusFactor}
                  onChange={(e) => setRhesusFactor(e.target.value as RhesusFactor)}
                  className={`w-full text-xs p-2.5 border rounded-lg font-bold ${
                    rhesusFactor === 'Negative' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="Positive">Rh Positive (+)</option>
                  <option value="Negative">Rh Negative (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Urinalysis</label>
                <input
                  type="text"
                  value={urinalysisResult}
                  onChange={(e) => setUrinalysisResult(e.target.value)}
                  placeholder="Albumin / Glucose"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Blood Sugar (RBS)</label>
                <input
                  type="text"
                  value={bloodRbs}
                  onChange={(e) => setBloodRbs(e.target.value)}
                  placeholder="e.g. 5.4 mmol/L"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* TB ICF Screening */}
            <div className="mt-3 pt-3 border-t border-indigo-100/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">TB-ICF Screening</label>
                <select
                  value={tbIcfScreeningOutcome}
                  onChange={(e) => setTbIcfScreeningOutcome(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="negative">Negative (No cough/fever/night sweats)</option>
                  <option value="suspect">Suspect (Symptomatic, Sputum ordered)</option>
                  <option value="on_treatment">On TB Treatment</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">TB IPT Date Started</label>
                <input
                  type="date"
                  value={tbIptDate}
                  onChange={(e) => setTbIptDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">IPT Next Visit</label>
                <input
                  type="date"
                  value={tbIptNextVisit}
                  onChange={(e) => setTbIptNextVisit(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Maternal Triple Serology & Partner Status */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-950 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              2. Maternal Triple Serology & Partner Status (MOH p.7)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Maternal HIV Status</label>
                <select
                  value={hivStatus}
                  onChange={(e) => setHivStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white font-medium"
                >
                  <option value="Negative">Tested Negative</option>
                  <option value="Positive">Tested Positive (Initiated HAART/PMTCT)</option>
                  <option value="Known Positive">Known Positive on ART</option>
                  <option value="Declined">Declined Test</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Partner HIV Status</label>
                <select
                  value={partnerHivStatus}
                  onChange={(e) => setPartnerHivStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white font-medium"
                >
                  <option value="Negative">Partner Tested Negative</option>
                  <option value="Positive">Partner Tested Positive</option>
                  <option value="Not Tested">Partner Not Tested / Unknown</option>
                  <option value="Declined">Partner Declined Test</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Syphilis Screen (VDRL / Dual Kit)</label>
                <select
                  value={syphilisStatus}
                  onChange={(e) => setSyphilisStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="Negative (Non-reactive)">Negative (Non-reactive)</option>
                  <option value="Positive (Reactive - Treated Benzathine)">Positive (Reactive - Treated)</option>
                  <option value="Positive (Reactive - Pending Treatment)">Positive (Reactive - Pending Treatment)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Hepatitis B (HBsAg)</label>
                <select
                  value={hepatitisBStatus}
                  onChange={(e) => setHepatitisBStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="Negative (HBsAg non-reactive)">Negative (HBsAg non-reactive)</option>
                  <option value="Positive (HBsAg reactive)">Positive (HBsAg reactive)</option>
                </select>
              </div>
            </div>

            {/* Repeat testing schedule */}
            <div className="mt-3 pt-3 border-t border-emerald-100/60">
              <p className="text-[11px] font-bold text-gray-700 mb-1.5">MOH Repeat Testing Protocol Scheduled:</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repeat36Weeks}
                    onChange={(e) => setRepeat36Weeks(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Re-test at 36 Weeks</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repeatDelivery}
                    onChange={(e) => setRepeatDelivery(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Re-test in Labor & Delivery</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repeatPnc}
                    onChange={(e) => setRepeatPnc(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Re-test at 6 Weeks Postnatal</span>
                </label>
              </div>
            </div>
          </div>

          {/* Ultrasound Scans (MOH Handbook p.11) */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-600" />
              3. Obstetric Ultrasound Tracking (MOH p.11 - Recommended 2 Scans)
            </h4>

            <div className="space-y-3">
              {/* Scan 1 */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={us1Done}
                      onChange={(e) => setUs1Done(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Ultrasound #1 (Target: Before 24 Weeks - Dating & Anatomy)</span>
                  </label>
                </div>
                {us1Done && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <label className="block text-[10px] text-gray-500">Scan Date</label>
                      <input
                        type="date"
                        value={us1Date}
                        onChange={(e) => setUs1Date(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500">Gestation (Weeks)</label>
                      <input
                        type="number"
                        placeholder="e.g. 18"
                        value={us1Gest}
                        onChange={(e) => setUs1Gest(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500">Findings Summary</label>
                      <input
                        type="text"
                        value={us1Findings}
                        onChange={(e) => setUs1Findings(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Scan 2 */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={us2Done}
                      onChange={(e) => setUs2Done(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Ultrasound #2 (Target: 28–32+ Weeks - Growth & Placenta)</span>
                  </label>
                </div>
                {us2Done && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <label className="block text-[10px] text-gray-500">Scan Date</label>
                      <input
                        type="date"
                        value={us2Date}
                        onChange={(e) => setUs2Date(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500">Gestation (Weeks)</label>
                      <input
                        type="number"
                        placeholder="e.g. 32"
                        value={us2Gest}
                        onChange={(e) => setUs2Gest(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500">Findings Summary</label>
                      <input
                        type="text"
                        value={us2Findings}
                        onChange={(e) => setUs2Findings(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? 'Saving...' : 'Save Antenatal Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AntenatalProfileModal;
