import React from 'react';
import { ChevronLeft, Plus, LineChart, Scale, ArrowUpRight, TrendingUp, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import { ChildDoc, GrowthMeasurementDoc } from '../../types';

interface GrowthOverviewProps {
  child?: ChildDoc | null;
  latestMeasurement?: GrowthMeasurementDoc | null;
  onBack: () => void;
  onAddMeasurement: () => void;
  onViewChart: () => void;
  onOpenMuac: () => void;
}

export const GrowthOverview: React.FC<GrowthOverviewProps> = ({
  child,
  latestMeasurement,
  onBack,
  onAddMeasurement,
  onViewChart,
  onOpenMuac,
}) => {
  const weight = latestMeasurement?.weightKg || 7.4;
  const height = latestMeasurement?.heightCm || 67.5;
  const hc = latestMeasurement?.headCircumferenceCm || 43.0;
  const date = latestMeasurement?.date || '2026-08-15';

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
        <h1 className="font-display font-bold text-xl text-ink-900">Growth Tracking</h1>
        <button
          onClick={onAddMeasurement}
          className="w-10 h-10 rounded-full bg-white border border-haven-deep/20 shadow-sm flex items-center justify-center text-haven-deep active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Latest Status & Trend Card */}
      <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-white/90" />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-white/80">
              Latest Assessment · {date}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-display font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            On track (Normal)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
            <p className="font-body text-[11px] text-white/70">Weight</p>
            <p className="font-display font-bold text-xl text-white mt-0.5">{weight} kg</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
            <p className="font-body text-[11px] text-white/70">Length / Height</p>
            <p className="font-display font-bold text-xl text-white mt-0.5">{height} cm</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
            <p className="font-body text-[11px] text-white/70">Head Circ.</p>
            <p className="font-display font-bold text-xl text-white mt-0.5">{hc} cm</p>
          </div>
        </div>
      </div>

      {/* Shortcuts & Action Cards */}
      <div className="space-y-3">
        {/* Growth Chart View */}
        <div
          onClick={onViewChart}
          className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
              <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-ink-900">
                WHO Growth Chart
              </h4>
              <p className="font-body text-xs text-ink-600">
                Plotted weight-for-age & height-for-age curves
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-600" />
        </div>

        {/* MUAC Assessment */}
        <div
          onClick={onOpenMuac}
          className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-ink-900">
                MUAC Nutrition Assessment
              </h4>
              <p className="font-body text-xs text-ink-600">
                Mid-upper arm circumference measurement tape
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-pill bg-amber-100 text-amber-800 text-xs font-display font-bold">
            12.9 cm
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          onClick={onAddMeasurement}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add growth measurement</span>
        </button>
      </div>
    </div>
  );
};
