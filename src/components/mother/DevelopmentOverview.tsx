import React, { useState } from 'react';
import { ChevronLeft, Smile, CheckCircle2, AlertCircle, Plus, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { ChildDoc, DevelopmentRecordDoc } from '../../types';

interface DevelopmentOverviewProps {
  child?: ChildDoc | null;
  onBack: () => void;
  onAddRecord: () => void;
  onViewGuidance: () => void;
  onAskHaven: (query: string) => void;
}

const AGE_BANDS = [
  { id: '6-9m', label: '6–9 Months (Current)' },
  { id: '9-12m', label: '9–12 Months' },
  { id: '12-18m', label: '12–18 Months' },
  { id: '18-24m', label: '18–24 Months' },
];

export const DevelopmentOverview: React.FC<DevelopmentOverviewProps> = ({
  child,
  onBack,
  onAddRecord,
  onViewGuidance,
  onAskHaven,
}) => {
  const [selectedBand, setSelectedBand] = useState('6-9m');

  const milestones69 = [
    { title: 'Sits without support for a short time', category: 'Motor', achieved: true },
    { title: 'Passes objects from one hand to the other', category: 'Fine Motor', achieved: true },
    { title: 'Responds to own name by turning head', category: 'Social & Language', achieved: true },
    { title: 'Makes babbling consonant sounds (ba-ba, da-da)', category: 'Language', achieved: true },
    { title: 'Shows curiosity for toys and reaches out', category: 'Cognitive', achieved: true },
  ];

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
        <h1 className="font-display font-bold text-xl text-ink-900">Development</h1>
        <button
          onClick={onAddRecord}
          className="w-10 h-10 rounded-full bg-white border border-haven-deep/20 shadow-sm flex items-center justify-center text-haven-deep active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Status Card */}
      <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-white/90" />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-white/80">
              6–9 Month Milestones
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-display font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All on track
          </span>
        </div>
        <p className="font-display font-bold text-lg text-white">5 of 5 milestones achieved</p>
        <p className="font-body text-xs text-white/85 leading-relaxed">
          Baby is developing motor, communication, and social cues appropriate for the 6 to 9-month window according to MOH handbook guidelines.
        </p>
      </div>

      {/* Age Band Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {AGE_BANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBand(b.id)}
            className={`px-4 py-2 rounded-pill font-display font-bold text-xs whitespace-nowrap transition-all ${
              selectedBand === b.id
                ? 'bg-haven-deep text-white shadow-sm'
                : 'bg-white text-ink-600 border border-border-hairline hover:bg-lavender-50'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Milestone Checklist */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          MILESTONES CHECKLIST
        </span>

        <div className="space-y-2.5">
          {milestones69.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900 leading-snug">
                    {m.title}
                  </h4>
                  <span className="inline-block font-body text-[11px] text-haven-orchid mt-0.5">
                    {m.category}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Achieved
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Guidance Card */}
      <div
        onClick={onViewGuidance}
        className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              MOH Milestone Guidance
            </h4>
            <p className="font-body text-xs text-ink-600">
              Stimulation activities, play ideas & red flags to watch
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-ink-600" />
      </div>

      {/* Primary Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onAddRecord}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add development record</span>
        </button>

        <button
          onClick={() => onAskHaven('What developmental milestones and fun stimulation games are recommended for a 7-month-old?')}
          className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-haven-orchid" />
          <span>Ask Haven about milestones</span>
        </button>
      </div>
    </div>
  );
};
