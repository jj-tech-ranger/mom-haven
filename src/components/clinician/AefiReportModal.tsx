// src/components/clinician/AefiReportModal.tsx
// Adverse Events Following Immunization (AEFI) Reporting (Kenya MOH 216 Handbook p.34)

import React, { useState } from 'react';
import { Syringe, X, CheckCircle, AlertTriangle, Calendar, ShieldCheck, HeartHandshake } from 'lucide-react';
import { AefiReport } from '../../types';
import Button from '../Button';
import { auth } from '../../lib/firebase';

interface AefiReportModalProps {
  isOpen?: boolean;
  motherId: string;
  childId?: string;
  defaultVaccine?: string;
  facilityName?: string;
  onClose: () => void;
  onSaved: (report?: AefiReport) => void;
}

export const AefiReportModal: React.FC<AefiReportModalProps> = ({
  isOpen = true,
  motherId,
  childId,
  defaultVaccine = 'DPT-HepB-Hib (Pentavalent)',
  facilityName: defaultFacility = '',
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vaccineOrAntigen, setVaccineOrAntigen] = useState(defaultVaccine);
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [adverseEventDescription, setAdverseEventDescription] = useState('');
  const [facilityName, setFacilityName] = useState(defaultFacility);
  const [actionTaken, setActionTaken] = useState('Counseling on fever management provided; paracetamol recommended if indicated; child observed.');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessReported, setIsSuccessReported] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'aefi',
      motherId,
      childId,
      date,
      vaccineOrAntigen: vaccineOrAntigen.trim(),
      batchNumber: batchNumber.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      expiryDate: expiryDate || undefined,
      severity,
      adverseEventDescription: adverseEventDescription.trim() || 'Mild post-vaccination reaction',
      facilityName: facilityName.trim() || undefined,
      actionTaken: actionTaken.trim() || undefined,
    };

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/clinician/encounters/aefi', {
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
      setIsSuccessReported(true);
      setTimeout(() => {
        onSaved(result);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit AEFI log.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-xl w-full p-6 shadow-2xl border border-[var(--border-hairline)] my-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                AEFI Documentation & Safety Report
              </h3>
              <p className="text-xs text-gray-500">Kenya MOH 216 Handbook p.34 · Adverse Event Following Immunization</p>
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

        {/* Positive Safety Assurance Banner */}
        <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <HeartHandshake className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Encouraging Vigilance & Safe Healthcare</span>
            <p className="mt-0.5 text-blue-800">
              Documenting post-vaccine reactions ensures rapid supportive care and continuous vaccine quality assurance. Reporting is constructive, non-punitive, and helps safeguard mother and baby.
            </p>
          </div>
        </div>

        {isSuccessReported ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-base text-gray-900">Reported to Health Facility Successfully</h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              The immunization safety team has recorded this event. Follow-up instructions and supportive guidance are now part of the patient's verified record.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Event</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vaccine / Antigen</label>
                <input
                  type="text"
                  value={vaccineOrAntigen}
                  onChange={(e) => setVaccineOrAntigen(e.target.value)}
                  required
                  placeholder="e.g. Pentavalent 1, Measles-Rubella"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  placeholder="e.g. B-9482A"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Serum Institute"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white font-medium"
                >
                  <option value="mild">Mild (Low fever / Local swelling)</option>
                  <option value="moderate">Moderate (Persistent crying / High fever)</option>
                  <option value="severe">Severe (Required Admission / Anaphylaxis)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description of Adverse Event</label>
              <textarea
                rows={2}
                value={adverseEventDescription}
                onChange={(e) => setAdverseEventDescription(e.target.value)}
                required
                placeholder="Onset timing (hours post-jab), symptoms noted, mother's observations..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Action & Supportive Care Given</label>
              <textarea
                rows={2}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Supportive measures, hydration, reassurance, medical review..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? 'Transmitting Report...' : 'Log & Report to Facility'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default AefiReportModal;
