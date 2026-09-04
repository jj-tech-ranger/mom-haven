import React, { useState } from 'react';
import { X, Syringe, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Provenance } from '../../types';
import { KENYA_FACILITIES } from '../../data/kenyaFacilities';
import { KEPI_SCHEDULE } from './ImmunizationPassport';
import { addImmunizationRecord } from '../../services/childService';
import Button from '../Button';

interface AddVaccineModalProps {
  childId: string;
  userId: string;
  initialVaccineName?: string;
  initialAgeBracket?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddVaccineModal({
  childId,
  userId,
  initialVaccineName = 'Pentavalent 1 (DTP-HepB-Hib)',
  initialAgeBracket = '6 Weeks',
  onClose,
  onSaved,
}: AddVaccineModalProps) {
  const [vaccineName, setVaccineName] = useState(initialVaccineName);
  const [recommendedAgeBracket, setRecommendedAgeBracket] = useState(initialAgeBracket);
  const [dateAdministered, setDateAdministered] = useState(() => new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [adverseEvents, setAdverseEvents] = useState('None');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const provenance: Provenance = {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      };

      await addImmunizationRecord(childId, {
        childId,
        vaccineName,
        recommendedAgeBracket,
        dateAdministered,
        facilityName,
        batchNumber: batchNumber.trim() || undefined,
        administeredBy: administeredBy.trim() || undefined,
        status: 'GIVEN',
        adverseEvents: adverseEvents.trim(),
        notes: notes.trim(),
        provenance,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to record vaccine', err);
      setError(err?.message || 'Failed to save vaccine record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Syringe className="w-4 h-4" />
            </div>
            <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Log Administered Vaccine
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provenance Disclaimer Banner */}
        <div className="mt-3 p-3.5 rounded-[16px] bg-[#FBF0DC] border border-[#A15E06]/30 flex items-start gap-2.5 text-[12px] text-[#A15E06]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A15E06]" />
          <div>
            <span className="font-bold font-display block">Self-Reported Entry</span>
            This dose will be marked as <strong>Self-Reported</strong> until confirmed by a healthcare provider at your clinic.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Vaccine Name
            </label>
            <select
              value={vaccineName}
              onChange={e => {
                setVaccineName(e.target.value);
                const match = KEPI_SCHEDULE.find(s => s.name === e.target.value);
                if (match) setRecommendedAgeBracket(match.ageBracket);
              }}
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
            >
              {KEPI_SCHEDULE.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.ageBracket})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Date Given
              </label>
              <input
                type="date"
                value={dateAdministered}
                onChange={e => setDateAdministered(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Age Bracket
              </label>
              <input
                type="text"
                value={recommendedAgeBracket}
                onChange={e => setRecommendedAgeBracket(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Administered at Health Facility
            </label>
            <input
              type="text"
              list="facilities-list-vac"
              value={facilityName}
              onChange={e => setFacilityName(e.target.value)}
              placeholder="e.g. Pumwani Maternity Hospital"
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              required
            />
            <datalist id="facilities-list-vac">
              {KENYA_FACILITIES.map(f => (
                <option key={f.id} value={f.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Batch / Lot # (Optional)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                placeholder="e.g. AB12345"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Provider Name (Optional)
              </label>
              <input
                type="text"
                value={administeredBy}
                onChange={e => setAdministeredBy(e.target.value)}
                placeholder="e.g. Nurse Jane"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Post-Vaccine Side Effects / Notes
            </label>
            <input
              type="text"
              value={adverseEvents}
              onChange={e => setAdverseEvents(e.target.value)}
              placeholder="e.g. Mild fever, normal tenderness at injection site"
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Saving...' : 'Record Vaccine Dose'}
          </Button>
        </form>
      </div>
    </div>
  );
}
