// src/components/child/MuacAssessmentModal.tsx
import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { classifyMUAC, MUAC_BANDS } from '../../utils/muac';
import Button from '../Button';

interface MuacAssessmentModalProps {
  childId: string;
  childName: string;
  onClose: () => void;
  onSave: (data: {
    muacCm: number;
    oedema: 'none' | 'plus_1' | 'plus_2' | 'plus_3';
    date: string;
    notes?: string;
  }) => Promise<void>;
  onEmergencyTrigger?: () => void;
}

export default function MuacAssessmentModal({
  childId,
  childName,
  onClose,
  onSave,
  onEmergencyTrigger,
}: MuacAssessmentModalProps) {
  const [muacCm, setMuacCm] = useState<number>(13.5);
  const [oedema, setOedema] = useState<'none' | 'plus_1' | 'plus_2' | 'plus_3'>('none');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const classification = classifyMUAC(muacCm) || MUAC_BANDS.NORMAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        muacCm,
        oedema,
        date,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error saving MUAC assessment', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-card-2 border border-[var(--border-hairline)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-[18px] text-[var(--ink-900)]">
              MUAC Screening for {childName}
            </h3>
            <p className="font-body text-xs text-[var(--ink-600)]">
              Mid-Upper Arm Circumference · Nutrition Triage (6–59 Months)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          {/* Dynamic Band Card */}
          <div
            className="p-4 rounded-[20px] border transition-all"
            style={{
              backgroundColor: classification.bg,
              borderColor: classification.border,
              color: classification.text,
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[11px] font-display font-extrabold px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider"
                style={{ backgroundColor: classification.hex }}
              >
                {classification.code} BAND
              </span>
              <span className="font-display font-bold text-[20px]">
                {muacCm.toFixed(1)} cm
              </span>
            </div>
            <h4 className="font-display font-bold text-[15px]">{classification.label}</h4>
            <p className="font-body text-xs mt-1 leading-relaxed opacity-95">
              {classification.clinicalAction}
            </p>

            {classification.urgent && onEmergencyTrigger && (
              <button
                type="button"
                onClick={onEmergencyTrigger}
                className="mt-3 w-full bg-[#DC2626] text-white font-display font-bold text-xs py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-xs cursor-pointer hover:bg-red-700"
              >
                <ShieldAlert className="w-4 h-4" />
                Emergency Nutrition Referral Protocol
              </button>
            )}
          </div>

          {/* Interactive Tape Slider */}
          <div className="bg-gray-50 border border-[var(--border-hairline)] p-4 rounded-[18px]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-display font-semibold text-[var(--ink-900)]">
                Arm Circumference (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="7.0"
                max="22.0"
                value={muacCm}
                onChange={(e) => setMuacCm(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-right font-display font-bold text-sm bg-white border border-gray-300 rounded-[8px]"
              />
            </div>

            {/* Slider */}
            <input
              type="range"
              min="8.0"
              max="20.0"
              step="0.1"
              value={muacCm}
              onChange={(e) => setMuacCm(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-gradient-to-r from-red-500 via-amber-400 via-lime-500 to-emerald-500 rounded-lg appearance-none cursor-pointer accent-[var(--haven-orchid)]"
            />

            {/* Scale Markings */}
            <div className="flex justify-between text-[10px] font-semibold text-gray-500 mt-2 px-1">
              <span>8cm (SAM)</span>
              <span>11.5cm (MAM)</span>
              <span>12.5cm (At Risk)</span>
              <span>13.5cm+ (Normal)</span>
            </div>
          </div>

          {/* Bilateral Pitting Oedema */}
          <div>
            <label className="block text-xs font-display font-semibold text-[var(--ink-900)] mb-1.5">
              Bilateral Pitting Oedema Screening
            </label>
            <p className="font-body text-[11px] text-[var(--ink-600)] mb-2">
              Press both thumbs gently on the tops of baby&apos;s feet for 3 seconds. Check if a dent remains.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'None (0)' },
                { id: 'plus_1', label: 'Mild (+)' },
                { id: 'plus_2', label: 'Moderate (++)' },
                { id: 'plus_3', label: 'Severe (+++)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOedema(opt.id as any)}
                  className={`p-2.5 rounded-[12px] text-xs font-display font-medium border text-center transition-all cursor-pointer ${
                    oedema === opt.id
                      ? 'bg-[var(--lavender-100)] border-[var(--haven-orchid)] text-[var(--haven-deep)] font-bold'
                      : 'bg-white border-gray-200 text-[var(--ink-700)] hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Measurement Date */}
          <div>
            <label className="block text-xs font-display font-semibold text-[var(--ink-900)] mb-1">
              Assessment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white text-xs"
              required
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-display font-semibold text-[var(--ink-900)] mb-1">
              Feeding & Clinical Observations (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Active, feeding well on complementary porridge with peanut paste..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-[12px] border border-[var(--border-hairline)] bg-white text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1 py-2.5 text-xs"
            >
              {loading ? 'Saving...' : 'Save MUAC Reading'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
