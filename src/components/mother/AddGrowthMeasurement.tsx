import React, { useState } from 'react';
import { ChevronLeft, Scale, Check, AlertCircle } from 'lucide-react';
import { GrowthMeasurementDoc } from '../../types';

interface AddGrowthMeasurementProps {
  childId: string;
  onBack: () => void;
  onSave: (measurement: Omit<GrowthMeasurementDoc, 'id'>) => Promise<void> | void;
}

export const AddGrowthMeasurement: React.FC<AddGrowthMeasurementProps> = ({
  childId,
  onBack,
  onSave,
}) => {
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState('Kariokor Health Centre');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const hc = headCircumferenceCm ? parseFloat(headCircumferenceCm) : undefined;

    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
      setError('Please enter valid positive numbers for weight (kg) and length/height (cm).');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onSave({
        childId,
        date,
        weightKg: w,
        heightCm: h,
        headCircumferenceCm: hc,
        provenance: {
          status: 'REPORTED',
          enteredBy: 'mother',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
          facilityName: facilityName || undefined,
        },
      });
    } catch (err) {
      console.error(err);
      setError('Failed to save growth measurement.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Add Measurement</h1>
        <div className="w-10" />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Date Field */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Measurement Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Weight Field */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Weight (Kilograms) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 7.4"
              className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              required
            />
            <span className="absolute right-4 top-3.5 font-display font-bold text-sm text-ink-600">
              kg
            </span>
          </div>
        </div>

        {/* Length / Height Field */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Length / Height (Centimeters) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 67.5"
              className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              required
            />
            <span className="absolute right-4 top-3.5 font-display font-bold text-sm text-ink-600">
              cm
            </span>
          </div>
        </div>

        {/* Head Circumference Field */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Head Circumference (Optional)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={headCircumferenceCm}
              onChange={(e) => setHeadCircumferenceCm(e.target.value)}
              placeholder="e.g. 43.0"
              className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            />
            <span className="absolute right-4 top-3.5 font-display font-bold text-sm text-ink-600">
              cm
            </span>
          </div>
        </div>

        {/* Facility */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Measurement Facility / Provider
          </label>
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="e.g. Kariokor Health Centre (Child Welfare Clinic)"
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save measurement'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
