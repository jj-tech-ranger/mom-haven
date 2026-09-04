// src/components/clinician/FamilyPlanningModal.tsx
// Postnatal Family Planning Counseling & Method Tracking (MOH 216 Handbook p.22)

import React, { useState } from 'react';
import { HeartHandshake, X, Calendar, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { FamilyPlanningRecord, FamilyPlanningMethod } from '../../types';

interface FamilyPlanningModalProps {
  isOpen?: boolean;
  motherId: string;
  counselorName?: string;
  facilityName?: string;
  onClose: () => void;
  onSaved: (record?: FamilyPlanningRecord) => void;
}

const FP_METHODS: { method: FamilyPlanningMethod; defaultDurationYears?: number; category: string }[] = [
  { method: 'Implants', defaultDurationYears: 3, category: 'LARC (Long-Acting)' },
  { method: 'IUCD', defaultDurationYears: 10, category: 'LARC (Long-Acting)' },
  { method: 'Injectables (DMPA)', defaultDurationYears: 0.25, category: 'Short-Acting Hormonal' },
  { method: 'POPs', category: 'Progestin-Only (Breastfeeding safe)' },
  { method: 'COCs', category: 'Combined Oral Contraceptives' },
  { method: 'Condoms', category: 'Barrier & Dual Protection' },
  { method: 'LAM', category: 'Lactational Amenorrhea Method (First 6m)' },
  { method: 'Natural FP', category: 'Fertility Awareness' },
  { method: 'BTL', category: 'Permanent (Bilateral Tubal Ligation)' },
  { method: 'Vasectomy', category: 'Permanent (Male)' },
  { method: 'None', category: 'Declined / Undecided' },
  { method: 'Other', category: 'Specialized' },
];

export const FamilyPlanningModal: React.FC<FamilyPlanningModalProps> = ({
  isOpen = true,
  motherId,
  counselorName: defaultCounselorName = '',
  facilityName: defaultFacilityName = '',
  onClose,
  onSaved,
}) => {
  if (isOpen === false) return null;

  const [counselingDate, setCounselingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [methodChosen, setMethodChosen] = useState<FamilyPlanningMethod>('Implants');
  const [methodDetails, setMethodDetails] = useState('');
  const [dateStarted, setDateStarted] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>('');
  const [removalDate, setRemovalDate] = useState<string>('');
  const [counselorName, setCounselorName] = useState(defaultCounselorName);
  const [facilityName, setFacilityName] = useState(defaultFacilityName);
  const [adverseEffects, setAdverseEffects] = useState('');
  const [reasonForSwitch, setReasonForSwitch] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-calculate suggested removal or next appointment date when method changes
  const handleMethodChange = (m: FamilyPlanningMethod) => {
    setMethodChosen(m);
    const today = new Date(dateStarted || new Date());
    if (m === 'Injectables (DMPA)') {
      // 13 weeks / 3 months follow up
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 90);
      setNextAppointmentDate(nextDate.toISOString().split('T')[0]);
      setRemovalDate('');
    } else if (m === 'Implants') {
      // 3 or 5 years
      const remDate = new Date(today);
      remDate.setFullYear(remDate.getFullYear() + 3);
      setRemovalDate(remDate.toISOString().split('T')[0]);
      const apptDate = new Date(today);
      apptDate.setDate(apptDate.getDate() + 42); // 6-week wound/side-effect review
      setNextAppointmentDate(apptDate.toISOString().split('T')[0]);
    } else if (m === 'IUCD') {
      const remDate = new Date(today);
      remDate.setFullYear(remDate.getFullYear() + 10);
      setRemovalDate(remDate.toISOString().split('T')[0]);
      const apptDate = new Date(today);
      apptDate.setDate(apptDate.getDate() + 42); // 6-week string check
      setNextAppointmentDate(apptDate.toISOString().split('T')[0]);
    } else if (m === 'POPs' || m === 'COCs') {
      const nextDate = new Date(today);
      nextDate.setMonth(nextDate.getMonth() + 3); // 3-month resupply
      setNextAppointmentDate(nextDate.toISOString().split('T')[0]);
      setRemovalDate('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'familyplanning',
      motherId,
      counselingDate,
      counselorName,
      facilityName,
      methodChosen,
      methodDetails,
      dateStarted,
      nextAppointmentDate: nextAppointmentDate || undefined,
      removalDate: removalDate || undefined,
      adverseEffects: adverseEffects || undefined,
      reasonForSwitch: reasonForSwitch || undefined,
      notes: notes || undefined,
    };

    try {
      const res = await fetch('/api/v1/clinician/encounters/family-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      const result = await res.json();
      const savedRecord: FamilyPlanningRecord = {
        id: result.id,
        motherId,
        counselingDate,
        counselorName,
        facilityName,
        methodChosen,
        methodDetails,
        dateStarted,
        nextAppointmentDate,
        removalDate,
        adverseEffects,
        reasonForSwitch,
        notes,
        provenance: {
          status: 'VERIFIED',
          enteredBy: counselorName,
          enteredAt: new Date().toISOString(),
          verifiedBy: counselorName,
          verifiedAt: new Date().toISOString(),
        },
      };

      onSaved(savedRecord);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save family planning record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-600 text-white shadow-xs">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Postnatal Family Planning
              </h2>
              <p className="text-xs text-slate-500">
                Kenya MOH Handbook p.22 • Counseling & Method Administration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Counseling Date & Counselor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Counseling Date *
              </label>
              <input
                type="date"
                required
                value={counselingDate}
                onChange={(e) => setCounselingDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Counselor / Clinician Name
              </label>
              <input
                type="text"
                placeholder="Nurse / Medical Officer"
                value={counselorName}
                onChange={(e) => setCounselorName(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Method Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Family Planning Method Chosen (MOH Handbook p.22) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FP_METHODS.map((item) => (
                <button
                  type="button"
                  key={item.method}
                  onClick={() => handleMethodChange(item.method)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border transition ${
                    methodChosen === item.method
                      ? 'border-pink-500 bg-pink-50/70 ring-2 ring-pink-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900">{item.method}</span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method Specifics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Lot / Insertion Site
              </label>
              <input
                type="text"
                placeholder="e.g. Implanon NXT, Jadelle, Left arm"
                value={methodDetails}
                onChange={(e) => setMethodDetails(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Started / Inserted
              </label>
              <input
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Next Follow-up & Expiry / Removal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-lg border border-pink-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Appointment / Review Date
              </label>
              <input
                type="date"
                value={nextAppointmentDate}
                onChange={(e) => setNextAppointmentDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">Feeds into automated clinical reminders</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Removal / Expiry Date
              </label>
              <input
                type="date"
                value={removalDate}
                onChange={(e) => setRemovalDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">For implants (3-5y) and IUCD (10y)</p>
            </div>
          </div>

          {/* Adverse effects or Reason for switch */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adverse Effects / Client Concerns (if any)
              </label>
              <input
                type="text"
                placeholder="e.g. Irregular spotting, amenorrhea, mild headache..."
                value={adverseEffects}
                onChange={(e) => setAdverseEffects(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Counseling & Guidance Notes
              </label>
              <textarea
                rows={2}
                placeholder="Dual protection counseling, warning signs for infection/expulsion, return whenever desired..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <span>Saving Record...</span>
              ) : (
                <>
                  <span>Save Family Planning</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
