import React, { useState } from 'react';
import { ChevronLeft, Plus, TrendingUp, Info } from 'lucide-react';
import { ChildDoc, GrowthMeasurementDoc } from '../../types';

interface GrowthChartProps {
  child?: ChildDoc | null;
  measurements?: GrowthMeasurementDoc[];
  onBack: () => void;
  onAddMeasurement: () => void;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  child,
  measurements = [],
  onBack,
  onAddMeasurement,
}) => {
  const [metric, setMetric] = useState<'weight' | 'height'>('weight');

  // Sample data points across months
  const weightPoints = [
    { month: 'Birth', ageMonth: 0, value: 3.3, whoP50: 3.3, whoP3: 2.4, whoP97: 4.2 },
    { month: '6w', ageMonth: 1.5, value: 4.5, whoP50: 4.5, whoP3: 3.4, whoP97: 5.5 },
    { month: '10w', ageMonth: 2.5, value: 5.4, whoP50: 5.3, whoP3: 4.1, whoP97: 6.4 },
    { month: '14w', ageMonth: 3.5, value: 6.2, whoP50: 6.0, whoP3: 4.7, whoP97: 7.2 },
    { month: '6m', ageMonth: 6, value: 7.1, whoP50: 7.3, whoP3: 5.7, whoP97: 8.8 },
    { month: '7m', ageMonth: 7, value: 7.4, whoP50: 7.6, whoP3: 6.0, whoP97: 9.2 },
  ];

  const heightPoints = [
    { month: 'Birth', ageMonth: 0, value: 49.5, whoP50: 49.1, whoP3: 45.4, whoP97: 52.9 },
    { month: '6w', ageMonth: 1.5, value: 54.0, whoP50: 54.0, whoP3: 50.5, whoP97: 57.5 },
    { month: '10w', ageMonth: 2.5, value: 57.8, whoP50: 57.3, whoP3: 53.8, whoP97: 60.8 },
    { month: '14w', ageMonth: 3.5, value: 61.0, whoP50: 60.2, whoP3: 56.6, whoP97: 63.8 },
    { month: '6m', ageMonth: 6, value: 65.5, whoP50: 65.7, whoP3: 61.8, whoP97: 69.6 },
    { month: '7m', ageMonth: 7, value: 67.5, whoP50: 67.3, whoP3: 63.5, whoP97: 71.2 },
  ];

  const activePoints = metric === 'weight' ? weightPoints : heightPoints;
  const unit = metric === 'weight' ? 'kg' : 'cm';

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
        <h1 className="font-display font-bold text-xl text-ink-900">WHO Growth Chart</h1>
        <div className="w-10" />
      </div>

      {/* Metric Selector Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-border-hairline shadow-sm flex">
        <button
          onClick={() => setMetric('weight')}
          className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs transition-all ${
            metric === 'weight'
              ? 'bg-haven-deep text-white shadow-sm'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Weight-for-Age ({unit})
        </button>
        <button
          onClick={() => setMetric('height')}
          className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs transition-all ${
            metric === 'height'
              ? 'bg-haven-deep text-white shadow-sm'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Length/Height-for-Age (cm)
        </button>
      </div>

      {/* Visual Chart Card with WHO band shading and Ribbon Line */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-haven-orchid" />
            <span className="font-display font-bold text-xs text-ink-900 uppercase tracking-wider">
              {metric === 'weight' ? 'Weight' : 'Height'} Curve
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-pill bg-emerald-100 text-emerald-800 text-[10px] font-display font-bold">
            WHO 50th Percentile
          </span>
        </div>

        {/* SVG WHO Growth Curve with shaded percentiles and plotted curve */}
        <div className="w-full h-56 relative bg-lavender-50/40 rounded-2xl p-2 border border-border-hairline/60 flex flex-col justify-end">
          <svg className="w-full h-44 overflow-visible" viewBox="0 0 300 140">
            <defs>
              <linearGradient id="ribbonLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#33178A" />
                <stop offset="100%" stopColor="#9167C2" />
              </linearGradient>
              <linearGradient id="bandNormal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D1FAE5" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* WHO Normal Band (+2SD to -2SD) */}
            <path
              d="M 20,110 Q 90,85 160,55 T 280,20 L 280,75 Q 160,110 20,135 Z"
              fill="url(#bandNormal)"
            />

            {/* WHO Median Guideline (dashed) */}
            <path
              d="M 20,120 Q 90,95 160,68 T 280,35"
              fill="none"
              stroke="#A78BFA"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />

            {/* Haven Ribbon Plotted Measurement Line (S-curve interpolation) */}
            <path
              d="M 20,118 Q 80,96 150,70 T 280,38"
              fill="none"
              stroke="url(#ribbonLineGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Data Points */}
            <circle cx="20" cy="118" r="4" fill="#33178A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="70" cy="102" r="4" fill="#43229E" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="120" cy="88" r="4" fill="#5F33B8" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="170" cy="74" r="4" fill="#7C47C7" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="230" cy="52" r="4" fill="#8B55C4" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="280" cy="38" r="6" fill="#9167C2" stroke="#FFFFFF" strokeWidth="2.5" />
          </svg>

          {/* Age Axis Labels */}
          <div className="flex justify-between px-2 pt-2 border-t border-border-hairline text-[10px] font-display font-bold text-ink-600">
            <span>Birth</span>
            <span>6w</span>
            <span>10w</span>
            <span>14w</span>
            <span>6m</span>
            <span>7m</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-body text-ink-600 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-haven-deep inline-block" />
            <span>Child's measurements</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-haven-orchid inline-block" />
            <span>WHO median</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-100 inline-block" />
            <span>Normal range</span>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
        <h3 className="font-display font-bold text-sm text-ink-900 uppercase tracking-wider">
          Measurement Log
        </h3>
        <div className="divide-y divide-border-hairline/60">
          {activePoints.map((p, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="font-body text-ink-600">{p.month}</span>
              <span className="font-display font-bold text-ink-900">
                {p.value} {unit}
              </span>
              <span className="font-body text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Normal (P50)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Action */}
      <div className="pt-2">
        <button
          onClick={onAddMeasurement}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add measurement</span>
        </button>
      </div>
    </div>
  );
};
