import React from 'react';
import { ChevronLeft, AlertTriangle, Calendar, Sparkles, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

interface CatchUpGuidanceProps {
  vaccineName?: string;
  onBack: () => void;
  onBookVisit: () => void;
  onAskHaven: (query: string) => void;
}

export const CatchUpGuidance: React.FC<CatchUpGuidanceProps> = ({
  vaccineName = 'Measles Rubella (MR)',
  onBack,
  onBookVisit,
  onAskHaven,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Catch-up Guidance</h1>
        <div className="w-10" />
      </div>

      {/* Alert Header */}
      <div className="bg-red-50 border border-red-200 rounded-[20px] p-5 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-red-800 uppercase tracking-wider">
              Missed Dose Catch-up
            </span>
            <h2 className="font-display font-bold text-lg text-red-950 leading-snug">
              {vaccineName}
            </h2>
          </div>
        </div>
        <p className="font-body text-xs text-red-800 leading-relaxed pt-1">
          It is completely safe and effective to catch up on this vaccine now. You do not need to restart any previous doses.
        </p>
      </div>

      {/* Plain-English Explainer Card (No complex formulas shown to mother) */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-ink-900 uppercase tracking-wider">
          Recommended Action Date
        </h3>

        <div className="p-4 bg-lavender-50/70 rounded-2xl border border-lavender-200/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-haven-deep text-white flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-xs text-ink-600">Earliest recommended date</p>
              <p className="font-display font-bold text-base text-ink-900">
                Immediately / Today
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-xs font-display font-bold">
            Safe now
          </span>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-haven-orchid flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-ink-900 leading-relaxed">
              <strong>Single dose needed:</strong> Kenya National Immunization policy ensures full immunity protection once administered.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-haven-orchid flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-ink-900 leading-relaxed">
              <strong>Free at public facilities:</strong> All KEPI vaccines are provided at no cost at your local dispensary, health centre, or county hospital.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onBookVisit}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          <span>Book catch-up visit</span>
        </button>

        <button
          onClick={() => onAskHaven(`Can you explain why the ${vaccineName} vaccine is safe to catch up on now and what side effects to watch for?`)}
          className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-haven-orchid" />
          <span>Ask Haven about this</span>
        </button>
      </div>
    </div>
  );
};
