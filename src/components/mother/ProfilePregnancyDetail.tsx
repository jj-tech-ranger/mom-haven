import React, { useState } from 'react';
import { ChevronLeft, Heart, Calendar, Check, Archive } from 'lucide-react';
import { PregnancyDoc } from '../../types';

interface ProfilePregnancyDetailProps {
  pregnancy: PregnancyDoc;
  onBack: () => void;
  onUpdate: (updated: Partial<PregnancyDoc>) => Promise<void> | void;
  onArchive?: () => void;
}

export const ProfilePregnancyDetail: React.FC<ProfilePregnancyDetailProps> = ({
  pregnancy,
  onBack,
  onUpdate,
  onArchive,
}) => {
  const [edd, setEdd] = useState(pregnancy.edd || pregnancy.estimatedDeliveryDate || '');
  const [lmp, setLmp] = useState(pregnancy.lmp || pregnancy.lastMenstrualPeriod || '');
  const [status, setStatus] = useState(pregnancy.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate({
        edd,
        lmp: lmp || undefined,
        status,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Manage Pregnancy</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Status Badge & Selector */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Pregnancy Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
          >
            <option value="active">Active Journey</option>
            <option value="completed">Completed (Childbirth Recorded)</option>
          </select>
        </div>

        {/* Estimated Delivery Date */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Estimated Delivery Date (EDD) *
          </label>
          <input
            type="date"
            value={edd}
            onChange={(e) => setEdd(e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Last Menstrual Period */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Last Menstrual Period (LMP)
          </label>
          <input
            type="date"
            value={lmp}
            onChange={(e) => setLmp(e.target.value)}
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
            <span>{isSaving ? 'Saving changes...' : 'Save details'}</span>
          </button>

          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className="w-full py-3.5 px-6 bg-white border border-border-hairline text-ink-600 font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Archive pregnancy</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
