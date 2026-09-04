import React, { useState } from 'react';
import { X, Scale, Info, AlertCircle, ShieldCheck, WifiOff } from 'lucide-react';
import { Provenance } from '../../types';
import { addGrowthMeasurement } from '../../services/childService';
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
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [muacCm, setMuacCm] = useState('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('');
  const [feedingStatus, setFeedingStatus] = useState('Exclusive Breastfeeding');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineSavedMessage, setOfflineSavedMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      const provenance: Provenance = {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      };

      await addGrowthMeasurement(childId, {
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
      });

      if (isOffline) {
        setOfflineSavedMessage("Saved locally — will sync automatically when you're back online.");
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1400);
      } else {
        onSaved();
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to log growth measurement', err);
      setError(err?.message || 'Failed to save growth record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[24px] sm:rounded-[20px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Handbook Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              MOH 216 GROWTH &amp; NUTRITION MONITORING
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 mt-0.5">
              Log Growth Measurement
            </h2>
            <p className="font-body text-xs text-slate-600">
              Record weight and height from your child's health clinic visit
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {offlineSavedMessage && (
          <div className="my-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center gap-2.5 shadow-xs">
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-medium">{offlineSavedMessage}</span>
          </div>
        )}

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
                onChange={e => setAgeMonths(e.target.value)}
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
