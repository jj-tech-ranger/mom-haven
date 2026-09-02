import React, { useState } from 'react';
import { X, Scale, Info, AlertCircle } from 'lucide-react';
import { GrowthMeasurement, Provenance } from '../../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Button from '../Button';

interface AddGrowthMeasurementModalProps {
  childId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddGrowthMeasurementModal({
  childId,
  userId,
  onClose,
  onSaved,
}: AddGrowthMeasurementModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ageMonths, setAgeMonths] = useState(6);
  const [weightKg, setWeightKg] = useState('7.2');
  const [heightCm, setHeightCm] = useState('65.5');
  const [muacCm, setMuacCm] = useState('13.8');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('43.0');
  const [feedingStatus, setFeedingStatus] = useState('Exclusive Breastfeeding');
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

      await addDoc(collection(db, 'growthMeasurements'), {
        childId,
        date,
        ageMonths: Number(ageMonths),
        weightKg: parseFloat(weightKg),
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        muacCm: muacCm ? parseFloat(muacCm) : undefined,
        headCircumferenceCm: headCircumferenceCm ? parseFloat(headCircumferenceCm) : undefined,
        feedingStatus,
        notes: notes.trim(),
        provenance,
        createdAt: new Date().toISOString(),
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to log growth measurement', err);
      setError(err?.message || 'Failed to save growth record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Log Growth Measurement
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
            This measurement will be flagged as <strong>Self-Reported</strong> until verified by a healthcare worker.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Date Measured
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Child Age (Months)
              </label>
              <input
                type="number"
                value={ageMonths}
                onChange={e => setAgeMonths(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.05"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                placeholder="e.g. 7.2"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Height / Length (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                placeholder="e.g. 65.5"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                MUAC Tape (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={muacCm}
                onChange={e => setMuacCm(e.target.value)}
                placeholder="e.g. 13.5"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Head Circ. (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={headCircumferenceCm}
                onChange={e => setHeadCircumferenceCm(e.target.value)}
                placeholder="e.g. 43.0"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Current Feeding Status
            </label>
            <select
              value={feedingStatus}
              onChange={e => setFeedingStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
            >
              <option value="Exclusive Breastfeeding">Exclusive Breastfeeding (0-6 months)</option>
              <option value="Complementary Feeding">Complementary Feeding + Breastmilk</option>
              <option value="Formula Feeding">Formula Feeding</option>
              <option value="Family Diet">Full Family Diet (1+ years)</option>
            </select>
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Saving...' : 'Save Growth Measurement'}
          </Button>
        </form>
      </div>
    </div>
  );
}
