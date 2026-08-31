import React from 'react';
import { ChevronLeft, Sparkles, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MuacAssessmentProps {
  onBack: () => void;
  onAskHaven: (query: string) => void;
}

export const MuacAssessment: React.FC<MuacAssessmentProps> = ({ onBack, onAskHaven }) => {
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
        <h1 className="font-display font-bold text-xl text-ink-900">MUAC Assessment</h1>
        <div className="w-10" />
      </div>

      {/* Top Measurement Card (M-GRO-004) */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-6 text-center space-y-3">
        <span className="font-body text-xs font-semibold text-ink-600 uppercase tracking-wider">
          Mid-upper arm circumference
        </span>
        <h2 className="font-display font-bold text-5xl text-ink-900 tracking-tight">
          12.9 <span className="text-2xl font-medium text-ink-600">cm</span>
        </h2>
        <div>
          <span className="inline-flex items-center px-4 py-1.5 rounded-pill bg-amber-100 border border-amber-300 text-amber-900 text-xs font-display font-bold shadow-xs">
            At Risk — keep monitoring
          </span>
        </div>
      </div>

      {/* What This Measurement Means */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          WHAT THIS MEASUREMENT MEANS
        </span>

        <div className="space-y-2.5">
          {/* SAM Band */}
          <div className="bg-white rounded-[18px] border border-border-hairline shadow-xs p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900">
                  SAM (Severe Acute Malnutrition)
                </h4>
                <p className="font-body text-xs text-ink-600">Immediate facility referral required</p>
              </div>
            </div>
            <span className="font-display font-bold text-xs text-red-600">&lt; 11.5 cm</span>
          </div>

          {/* MAM Band */}
          <div className="bg-white rounded-[18px] border border-border-hairline shadow-xs p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-amber-500 flex-shrink-0" />
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900">
                  MAM (Moderate Acute Malnutrition)
                </h4>
                <p className="font-body text-xs text-ink-600">Supplementary feeding program</p>
              </div>
            </div>
            <span className="font-display font-bold text-xs text-amber-700">11.5–12.4 cm</span>
          </div>

          {/* AT RISK Band (Visually highlighted with thicker border and "Current" tag) */}
          <div className="bg-amber-50/70 rounded-[18px] border-2 border-amber-400 shadow-card-1 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#D97706] flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-amber-950">
                    At Risk
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-display font-bold">
                    Current
                  </span>
                </div>
                <p className="font-body text-xs text-amber-800">Close weekly monitoring & nutrition review</p>
              </div>
            </div>
            <span className="font-display font-bold text-xs text-amber-900">12.5–13.5 cm</span>
          </div>

          {/* NORMAL Band */}
          <div className="bg-white rounded-[18px] border border-border-hairline shadow-xs p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900">
                  Normal
                </h4>
                <p className="font-body text-xs text-ink-600">Healthy nutritional status</p>
              </div>
            </div>
            <span className="font-display font-bold text-xs text-emerald-700">&gt; 13.5 cm</span>
          </div>
        </div>
      </div>

      {/* Soft Lavender Note */}
      <div className="p-4 bg-lavender-100/70 border border-lavender-200 rounded-[18px] flex items-start gap-3">
        <Info className="w-5 h-5 text-haven-orchid flex-shrink-0 mt-0.5" />
        <p className="font-body text-xs text-ink-900 leading-relaxed">
          The <strong>At Risk</strong> band is highlighted on its own so that early nutritional support can be provided before moderate or severe malnutrition develops.
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          onClick={() => onAskHaven('What does a 12.9 cm MUAC measurement mean for my 7-month-old, and what nutritious foods should I introduce in Kenya?')}
          className="w-full py-4 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-button"
        >
          <Sparkles className="w-4 h-4 text-haven-orchid" />
          <span>Ask Haven what this means</span>
        </button>
      </div>
    </div>
  );
};
