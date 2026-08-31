import React, { useState } from 'react';
import { Calendar, ArrowLeft, ArrowRight, Info, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import Button from '../Button';
import { HavenRibbon } from '../HavenRibbon';

interface PregnancySetupProps {
  onBack: () => void;
  onContinue: (data: { method: 'LMP' | 'EDD'; date: string; calculatedEDD: string; calculatedWeeks: number }) => void;
  onSkip: () => void;
}

export const PregnancySetup: React.FC<PregnancySetupProps> = ({
  onBack,
  onContinue,
  onSkip,
}) => {
  // Toggle between Last Menstrual Period (LMP) and Expected Due Date (EDD)
  const [method, setMethod] = useState<'LMP' | 'EDD'>('LMP');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Helper calculations based on Kenyan MOH Naegele's rule
  const calculatePregnancyDetails = () => {
    if (!selectedDate) return null;
    const inputDate = new Date(selectedDate);
    if (isNaN(inputDate.getTime())) return null;

    const today = new Date();

    if (method === 'LMP') {
      // EDD = LMP + 280 days (40 weeks)
      const edd = new Date(inputDate);
      edd.setDate(edd.getDate() + 280);

      // Gestational age in weeks
      const diffTime = today.getTime() - inputDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const gestationalWeeks = Math.max(0, Math.floor(diffDays / 7));
      const gestationalDays = Math.max(0, diffDays % 7);

      return {
        edd: edd.toISOString().split('T')[0],
        formattedEDD: edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        weeks: gestationalWeeks,
        days: gestationalDays,
        trimester: gestationalWeeks < 13 ? 1 : gestationalWeeks < 27 ? 2 : 3,
      };
    } else {
      // EDD is entered directly
      const edd = inputDate;
      const lmp = new Date(edd);
      lmp.setDate(lmp.getDate() - 280);

      const diffTime = today.getTime() - lmp.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const gestationalWeeks = Math.max(0, Math.floor(diffDays / 7));
      const gestationalDays = Math.max(0, diffDays % 7);

      return {
        edd: edd.toISOString().split('T')[0],
        formattedEDD: edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        weeks: gestationalWeeks,
        days: gestationalDays,
        trimester: gestationalWeeks < 13 ? 1 : gestationalWeeks < 27 ? 2 : 3,
      };
    }
  };

  const details = calculatePregnancyDetails();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Please select a date to calculate your pregnancy timeline.');
      return;
    }
    if (!details) {
      setError('Please provide a valid date.');
      return;
    }
    onContinue({
      method,
      date: selectedDate,
      calculatedEDD: details.edd,
      calculatedWeeks: details.weeks,
    });
  };

  return (
    <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-lavender-50 text-ink-900 border border-border-hairline">
      {/* Top App Bar with screen code and back chevron */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-100 transition-colors cursor-pointer"
            aria-label="Back to profile setup"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-display font-bold text-haven-orchid tracking-wider uppercase">
            M-AUTH-007
          </span>
        </div>

        {/* Haven Ribbon Progress (Step 1 of 2 in onboarding journey) */}
        <div className="my-2">
          <HavenRibbon
            progress={50}
            currentStep={1}
            totalSteps={2}
            label="Pregnancy Setup"
            sublabel="Step 1 of 2"
            showMarkerTooltip={false}
          />
        </div>

        {/* Header Title */}
        <div className="mt-1 mb-4">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-haven-deep tracking-tight">
            When is baby expected?
          </h1>
          <p className="font-body text-sm text-ink-600 mt-1 leading-relaxed">
            Enter your Last Menstrual Period (LMP) or your Doctor's Estimated Due Date (EDD).
          </p>
        </div>

        {/* LMP / EDD Segmented Toggle */}
        <div className="bg-lavender-100 p-1 rounded-pill flex items-center mb-4 border border-border-hairline">
          <button
            type="button"
            onClick={() => {
              setMethod('LMP');
              setSelectedDate('');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-pill text-xs font-display font-bold transition-all cursor-pointer ${
              method === 'LMP'
                ? 'bg-haven-deep text-white shadow-card-1'
                : 'text-ink-600 hover:text-haven-deep'
            }`}
          >
            Last Period (LMP)
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('EDD');
              setSelectedDate('');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-pill text-xs font-display font-bold transition-all cursor-pointer ${
              method === 'EDD'
                ? 'bg-haven-deep text-white shadow-card-1'
                : 'text-ink-600 hover:text-haven-deep'
            }`}
          >
            Due Date (EDD)
          </button>
        </div>

        {/* Date Input Form */}
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-xs font-display font-bold text-ink-900 mb-1.5">
              {method === 'LMP'
                ? 'First day of your last period (LMP)'
                : 'Estimated Due Date from Ultrasound/Doctor (EDD)'}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-400" />
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setError(null);
                }}
                className="w-full pl-10 pr-3.5 py-3 bg-white rounded-input border border-border-hairline text-sm text-ink-900 focus:outline-none focus:border-haven-orchid transition-colors"
              />
            </div>
            {error && <p className="text-xs text-status-urgent mt-1">{error}</p>}
          </div>

          {/* Plain English Explainer Card */}
          <div className="p-3.5 rounded-card bg-white border border-border-hairline shadow-card-1 space-y-2">
            <div className="flex items-center gap-2 text-haven-deep text-xs font-display font-bold">
              <Info className="w-4 h-4 text-haven-orchid shrink-0" />
              <span>How this is calculated (MOH 216)</span>
            </div>
            <p className="text-xs text-ink-600 font-body leading-relaxed">
              {method === 'LMP'
                ? "We add 280 days (40 weeks) from the first day of your last period following standard clinical guidelines in the Kenya Mother & Child Health handbook."
                : "Your ultrasound or clinical provider calculates your EDD directly. We use this date to anchor your weekly milestones and ANC visit schedule."}
            </p>
          </div>

          {/* Dynamic Calculated Milestone Preview */}
          {details && (
            <div className="p-4 rounded-card bg-white border-2 border-haven-orchid/40 shadow-card-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-display font-bold text-haven-orchid uppercase tracking-wider">
                  Estimated Timeline
                </span>
                <span className="text-xs font-display font-bold bg-lavender-100 text-haven-deep px-2 py-0.5 rounded-pill">
                  Trimester {details.trimester}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <p className="text-xs text-ink-400 font-body">Estimated Due Date:</p>
                  <p className="text-base font-display font-bold text-haven-deep">
                    {details.formattedEDD}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400 font-body">Current Stage:</p>
                  <p className="text-base font-display font-bold text-haven-orchid">
                    {details.weeks} weeks {details.days > 0 ? `+ ${details.days}d` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedDate}
              className="flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Footer secondary action */}
      <div className="pt-4 pb-1 text-center space-y-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-ink-600 hover:text-haven-deep font-display font-semibold transition-colors cursor-pointer"
        >
          I'll add this later &rarr;
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
          <ShieldCheck className="w-3.5 h-3.5 text-haven-orchid" />
          <span>Calculations run locally and safely on your device</span>
        </div>
      </div>
    </div>
  );
};
