// src/components/clinician/HospitalAdmissionModal.tsx
// Hospital Admissions (MOH p.40) & Special Clinical Attendance Logs (MOH p.34)

import React, { useState } from 'react';
import { Building2, X, AlertCircle, Calendar, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';
import { HospitalAdmissionRecord, SpecialClinicalAttendanceRecord } from '../../types';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface HospitalAdmissionModalProps {
  isOpen?: boolean;
  motherId: string;
  childId?: string;
  childName?: string;
  defaultFacility?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const HospitalAdmissionModal: React.FC<HospitalAdmissionModalProps> = ({
  isOpen = true,
  motherId,
  childId,
  childName,
  defaultFacility = '',
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'admission' | 'specialAttendance'>('admission');

  // Person target
  const [personType, setPersonType] = useState<'mother' | 'child'>(childId ? 'child' : 'mother');

  // Hospital Admission fields (MOH p.40)
  const [hospitalName, setHospitalName] = useState(defaultFacility || 'County Referral Hospital');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [admissionDate, setAdmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dischargeDate, setDischargeDate] = useState<string>('');
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [outcome, setOutcome] = useState('Discharged well / Improved');

  // Special Clinical Attendance fields (MOH p.34)
  const [clinicName, setClinicName] = useState('High Risk Maternal / Pediatric Clinic');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reasonForAttendance, setReasonForAttendance] = useState('');
  const [drugsGiven, setDrugsGiven] = useState('');

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const isAdmission = mode === 'admission';
    const endpoint = isAdmission
      ? '/api/v1/clinician/encounters/hospital-admission'
      : '/api/v1/clinician/encounters/special-attendance';

    const payload: Record<string, any> = {
      motherId,
      childId: personType === 'child' ? childId : undefined,
      personType,
      notes: notes.trim() || undefined,
    };

    if (isAdmission) {
      payload.type = 'hospitaladmission';
      payload.hospitalName = hospitalName.trim();
      payload.admissionNumber = admissionNumber.trim() || undefined;
      payload.admissionDate = admissionDate;
      payload.dischargeDate = dischargeDate || undefined;
      payload.dischargeDiagnosis = dischargeDiagnosis.trim() || 'Clinical inpatient care';
      payload.outcome = outcome.trim() || undefined;
    } else {
      payload.type = 'specialattendance';
      payload.hospitalName = hospitalName.trim();
      payload.clinicName = clinicName.trim();
      payload.date = attendanceDate;
      payload.reasonForAttendance = reasonForAttendance.trim() || 'Specialist consultation';
      payload.drugsGiven = drugsGiven.trim() || undefined;
      payload.dischargeDiagnosis = dischargeDiagnosis.trim() || undefined;
    }

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save clinical encounter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-xl w-full p-6 shadow-2xl border border-[var(--border-hairline)] my-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                {mode === 'admission' ? 'Hospital Admission Record' : 'Special Clinical Attendance'}
              </h3>
              <p className="text-xs text-gray-500">
                Kenya MOH 216 Handbook pp.34, 40 · Inpatient & Specialist Care Logs
              </p>
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

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 mt-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('admission')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
              mode === 'admission'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Hospital Admission (p.40)
          </button>
          <button
            type="button"
            onClick={() => setMode('specialAttendance')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
              mode === 'specialAttendance'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Special Attendance Clinic (p.34)
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Patient Target */}
          {childId && (
            <div className="flex items-center gap-4 text-xs font-medium text-gray-700 p-2.5 bg-gray-50 rounded-lg">
              <span className="font-bold">Record applies to:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="personType"
                  value="child"
                  checked={personType === 'child'}
                  onChange={() => setPersonType('child')}
                />
                <span>Child ({childName || 'Infant'})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="personType"
                  value="mother"
                  checked={personType === 'mother'}
                  onChange={() => setPersonType('mother')}
                />
                <span>Mother</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
              />
            </div>
            {mode === 'admission' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Admission / IPD Number</label>
                <input
                  type="text"
                  placeholder="e.g. IPD-2026-081"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Specialist Clinic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pediatric Cardiology, Sickle Cell Clinic"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            )}
          </div>

          {mode === 'admission' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discharge Date (if completed)</label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discharge Diagnosis / Reason for Admission</label>
                <input
                  type="text"
                  placeholder="e.g. Severe Neonatal Sepsis, Hyperbilirubinemia, Preeclampsia"
                  value={dischargeDiagnosis}
                  onChange={(e) => setDischargeDiagnosis(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discharge Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="Discharged well / Improved">Discharged well / Improved</option>
                  <option value="Referred to Higher Level">Referred to Higher Level Facility</option>
                  <option value="Discharged against medical advice">Discharged against medical advice</option>
                  <option value="Absconded">Absconded</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Attendance Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis / Assessment</label>
                  <input
                    type="text"
                    placeholder="Clinical impression"
                    value={dischargeDiagnosis}
                    onChange={(e) => setDischargeDiagnosis(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Specialized Attendance</label>
                <input
                  type="text"
                  placeholder="e.g. Heart murmur review, failure to thrive assessment"
                  value={reasonForAttendance}
                  onChange={(e) => setReasonForAttendance(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Drugs & Interventions Given</label>
                <input
                  type="text"
                  placeholder="e.g. Iron supplements, Special therapeutic feeds, follow-up date"
                  value={drugsGiven}
                  onChange={(e) => setDrugsGiven(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Follow-up Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Further review schedule, discharge summary notes..."
              className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submitting ? 'Saving...' : 'Save Encounter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default HospitalAdmissionModal;
