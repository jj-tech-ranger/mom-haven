// src/components/clinician/CancerScreeningModal.tsx
// Reproductive Organ Cancer Screening Tracking (Kenya MOH 216 Handbook p.22)

import React, { useState } from 'react';
import { ShieldAlert, X, Calendar, Check, AlertCircle, Heart, Stethoscope } from 'lucide-react';
import { CancerScreeningRecord, CervicalCancerTestType, CervicalScreeningResult, CervicalCancerTreatment, BreastScreeningResult } from '../../types';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface CancerScreeningModalProps {
  isOpen?: boolean;
  motherId: string;
  examinerName?: string;
  facilityName?: string;
  onClose: () => void;
  onSaved: (record?: CancerScreeningRecord) => void;
}

export const CancerScreeningModal: React.FC<CancerScreeningModalProps> = ({
  isOpen = true,
  motherId,
  examinerName: defaultExaminer = '',
  facilityName: defaultFacility = '',
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [examinerName, setExaminerName] = useState(defaultExaminer);
  const [facilityName, setFacilityName] = useState(defaultFacility);

  // Cervical Screening
  const [cervicalDone, setCervicalDone] = useState(true);
  const [cervicalTestType, setCervicalTestType] = useState<CervicalCancerTestType>('VIA-VILI');
  const [cervicalResult, setCervicalResult] = useState<CervicalScreeningResult>('negative');
  const [cervicalTreatment, setCervicalTreatment] = useState<CervicalCancerTreatment>('none');
  const [cervicalReferralFacility, setCervicalReferralFacility] = useState('');
  const [cervicalNotes, setCervicalNotes] = useState('');

  // Breast Screening
  const [breastDone, setBreastDone] = useState(true);
  const [breastTestType, setBreastTestType] = useState<'CBE' | 'ultrasound' | 'mammography'>('CBE');
  const [breastResult, setBreastResult] = useState<BreastScreeningResult>('normal');
  const [breastTreatmentOrReferral, setBreastTreatmentOrReferral] = useState('');
  const [breastNotes, setBreastNotes] = useState('');

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCervicalFlagged = cervicalDone && (cervicalResult === 'positive' || cervicalResult === 'suspicious');
  const isBreastFlagged = breastDone && breastResult === 'suspicious lump';
  const hasAlert = isCervicalFlagged || isBreastFlagged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'cancer_screening',
      motherId,
      date,
      examinerName: examinerName.trim() || undefined,
      facilityName: facilityName.trim() || undefined,
      cervicalDone,
      cervicalTestType: cervicalDone ? cervicalTestType : undefined,
      cervicalResult: cervicalDone ? cervicalResult : undefined,
      cervicalTreatment: cervicalDone ? cervicalTreatment : undefined,
      cervicalReferralFacility: cervicalDone && cervicalReferralFacility.trim() ? cervicalReferralFacility.trim() : undefined,
      cervicalNotes: cervicalDone && cervicalNotes.trim() ? cervicalNotes.trim() : undefined,
      breastDone,
      breastTestType: breastDone ? breastTestType : undefined,
      breastResult: breastDone ? breastResult : undefined,
      breastTreatmentOrReferral: breastDone && breastTreatmentOrReferral.trim() ? breastTreatmentOrReferral.trim() : undefined,
      breastNotes: breastDone && breastNotes.trim() ? breastNotes.trim() : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/clinician/encounters/cancer-screening', {
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
      setErrorMessage(err.message || 'Failed to save screening record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 shadow-2xl border border-[var(--border-hairline)] my-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                Reproductive Organ Cancer Screening
              </h3>
              <p className="text-xs text-gray-500">Kenya MOH 216 Handbook p.22 · Cervical & Breast Exam</p>
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

        {hasAlert && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Referral Flag Activated</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                A positive or suspicious result will trigger an alert in the clinician workspace and a sensitive, supportive follow-up recommendation in the mother's record.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Exam</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Facility Name</label>
              <input
                type="text"
                placeholder="e.g. Pumwani Maternity"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Examiner Name</label>
              <input
                type="text"
                placeholder="Clinician / Nurse"
                value={examinerName}
                onChange={(e) => setExaminerName(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Section 1: Cervical Screening */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cervicalDone}
                  onChange={(e) => setCervicalDone(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <span className="text-xs font-bold text-gray-800">1. Cervical Cancer Screening (MOH p.22)</span>
              </label>
              <span className="text-[11px] font-medium text-gray-500">HPV / VIA / VIA-VILI / Pap smear</span>
            </div>

            {cervicalDone && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Test Type</label>
                    <select
                      value={cervicalTestType}
                      onChange={(e) => setCervicalTestType(e.target.value as CervicalCancerTestType)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="VIA-VILI">VIA-VILI (Visual Inspection Acetic Acid / Lugol's)</option>
                      <option value="VIA">VIA (Visual Inspection with Acetic Acid)</option>
                      <option value="HPV">HPV DNA Test</option>
                      <option value="Pap smear">Pap Smear (Cytology)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Result</label>
                    <select
                      value={cervicalResult}
                      onChange={(e) => setCervicalResult(e.target.value as CervicalScreeningResult)}
                      className={`w-full text-xs p-2.5 border rounded-lg font-bold ${
                        cervicalResult === 'positive'
                          ? 'border-red-400 bg-red-50 text-red-800'
                          : cervicalResult === 'suspicious'
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                    >
                      <option value="negative">Negative (Normal)</option>
                      <option value="positive">Positive (Pre-cancerous lesion)</option>
                      <option value="suspicious">Suspicious for Invasive Cancer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Treatment / Interventions</label>
                    <select
                      value={cervicalTreatment}
                      onChange={(e) => setCervicalTreatment(e.target.value as CervicalCancerTreatment)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="none">None (Routine screening repeat)</option>
                      <option value="cryotherapy">Cryotherapy</option>
                      <option value="thermoablation">Thermoablation</option>
                      <option value="LEEP">LEEP (Loop Electrosurgical Excision)</option>
                      <option value="referred">Referred to Specialist Center</option>
                      <option value="other">Other Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Referral Facility (if applicable)</label>
                    <input
                      type="text"
                      placeholder="e.g. KNH Gynae-Oncology"
                      value={cervicalReferralFacility}
                      onChange={(e) => setCervicalReferralFacility(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Cervical Exam Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Well visualized SCJ, no acetowhite changes"
                    value={cervicalNotes}
                    onChange={(e) => setCervicalNotes(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Breast Screening */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={breastDone}
                  onChange={(e) => setBreastDone(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-gray-300"
                />
                <span className="text-xs font-bold text-gray-800">2. Breast Examination & Screening (MOH p.22)</span>
              </label>
              <span className="text-[11px] font-medium text-gray-500">CBE / Ultrasound</span>
            </div>

            {breastDone && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Screening Method</label>
                    <select
                      value={breastTestType}
                      onChange={(e) => setBreastTestType(e.target.value as any)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="CBE">CBE (Clinical Breast Examination)</option>
                      <option value="ultrasound">Breast Ultrasound</option>
                      <option value="mammography">Mammography</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Findings</label>
                    <select
                      value={breastResult}
                      onChange={(e) => setBreastResult(e.target.value as BreastScreeningResult)}
                      className={`w-full text-xs p-2.5 border rounded-lg font-bold ${
                        breastResult === 'suspicious lump'
                          ? 'border-red-400 bg-red-50 text-red-800'
                          : breastResult === 'benign lump'
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-gray-300 bg-white text-gray-800'
                      }`}
                    >
                      <option value="normal">Normal (No lumps, no skin changes)</option>
                      <option value="benign lump">Benign Lump (Fibroadenoma / Cyst)</option>
                      <option value="suspicious lump">Suspicious Lump (Hard, fixed, or skin tethering)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Treatment / Referral Action</label>
                    <input
                      type="text"
                      placeholder="e.g. Ultrasound requisition / Surgical review"
                      value={breastTreatmentOrReferral}
                      onChange={(e) => setBreastTreatmentOrReferral(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Clinical Findings Description</label>
                    <input
                      type="text"
                      placeholder="Quadrant, mobility, size (cm)"
                      value={breastNotes}
                      onChange={(e) => setBreastNotes(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">General Notes & Follow-up Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Post-procedure counseling given; repeat examination scheduled in..."
              className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
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
              className="text-xs bg-pink-600 hover:bg-pink-700 text-white"
            >
              {submitting ? 'Saving...' : 'Save Screening Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CancerScreeningModal;
