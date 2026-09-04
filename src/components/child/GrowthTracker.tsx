import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  Scale, 
  Ruler, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Info
} from 'lucide-react';
import { GrowthMeasurement } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';

interface GrowthTrackerProps {
  childName: string;
  childSex: 'female' | 'male';
  measurements: GrowthMeasurement[];
  onBack: () => void;
  onAddMeasurement: () => void;
}

// Standard WHO median references for 0 to 24 months
const WHO_MEDIAN_WEIGHT_FEMALE = [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.9, 9.2, 10.2, 11.5];
const WHO_MEDIAN_HEIGHT_FEMALE = [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 74.0, 78.0, 85.0];

export default function GrowthTracker({
  childName,
  childSex,
  measurements,
  onBack,
  onAddMeasurement,
}: GrowthTrackerProps) {
  const [metricTab, setMetricTab] = useState<'weight' | 'height' | 'muac' | 'head'>('weight');

  const latest = measurements[measurements.length - 1];

  // MUAC interpretation helper (MOH / UNICEF color bands)
  const getMuacStatus = (muacCm?: number) => {
    if (!muacCm) return null;
    if (muacCm < 11.5) return { color: 'bg-red-500 text-white', label: 'Severe Acute Malnutrition (< 11.5 cm)', alert: true };
    if (muacCm < 12.5) return { color: 'bg-amber-500 text-white', label: 'Moderate Acute Malnutrition (11.5 – 12.4 cm)', alert: true };
    return { color: 'bg-emerald-600 text-white', label: 'Adequate Nutrition (≥ 12.5 cm)', alert: false };
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
              Growth &amp; Nutrition
            </h1>
            <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
              {childName} · WHO Standards
            </span>
          </div>
          <button
            type="button"
            onClick={onAddMeasurement}
            className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2">
          {(
            [
              { id: 'weight', label: 'Weight (kg)' },
              { id: 'height', label: 'Height (cm)' },
              { id: 'muac', label: 'MUAC Tape' },
              { id: 'head', label: 'Head (cm)' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMetricTab(tab.id)}
              className={`flex-1 py-1.5 rounded-full text-[12px] font-display font-bold text-center transition-all cursor-pointer ${
                metricTab === tab.id
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'bg-[var(--lavender-100)] text-[var(--ink-600)] hover:bg-[var(--lavender-200)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* Latest Metric Summary Card */}
        <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
              Current Trajectory
            </span>
            {latest ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-display font-bold">
                WHO Standard Recorded
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-display font-bold">
                No Entries Yet
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display font-black text-[30px] text-[var(--ink-900)]">
              {metricTab === 'weight'
                ? (latest?.weightKg ? `${latest.weightKg} kg` : 'Not recorded')
                : metricTab === 'height'
                ? (latest?.heightCm ? `${latest.heightCm} cm` : 'Not recorded')
                : metricTab === 'muac'
                ? (latest?.muacCm ? `${latest.muacCm} cm` : 'Not recorded')
                : (latest?.headCircumferenceCm ? `${latest.headCircumferenceCm} cm` : 'Not recorded')}
            </span>
            {latest && (
              <span className="text-[13px] text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Latest measurement
              </span>
            )}
          </div>

          {/* MUAC Specific Color Band Visualizer */}
          {metricTab === 'muac' && (
            <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-600)]">
                <span>Red (&lt;11.5cm)</span>
                <span>Yellow (11.5-12.4cm)</span>
                <span className="text-emerald-700 font-bold">Green (&ge;12.5cm)</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex">
                <div className="w-1/4 bg-red-500" />
                <div className="w-1/4 bg-amber-400" />
                <div className="w-2/4 bg-emerald-500" />
              </div>
              <p className="text-[12px] text-emerald-800 font-medium">
                ✓ Green Zone: Well nourished with healthy mid-upper arm circumference.
              </p>
            </div>
          )}
        </div>

        {/* Historical Measurements Log */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-[16px] text-[var(--ink-900)] px-1">
            Recorded Measurement History
          </h3>

          {measurements.length === 0 ? (
            <div className="bg-white p-6 rounded-[20px] text-center border border-[var(--border-hairline)] space-y-2">
              <Scale className="w-8 h-8 text-[var(--haven-orchid)] mx-auto" />
              <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                No growth measurements yet
              </h4>
              <p className="text-[12px] text-[var(--ink-600)]">
                Take your baby for regular weight checks at your local child welfare clinic (CWC).
              </p>
            </div>
          ) : (
            measurements.map(m => (
              <div
                key={m.id}
                className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                    Age: {m.ageMonths} Months ({new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </span>
                  <ProvenanceBadge provenance={m.provenance} />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1 text-[12px]">
                  <div className="bg-[var(--lavender-50)] p-2 rounded-[10px] text-center">
                    <span className="text-[10px] text-[var(--ink-500)] block">Weight</span>
                    <strong className="text-[var(--ink-900)]">{m.weightKg} kg</strong>
                  </div>
                  <div className="bg-[var(--lavender-50)] p-2 rounded-[10px] text-center">
                    <span className="text-[10px] text-[var(--ink-500)] block">Height</span>
                    <strong className="text-[var(--ink-900)]">{m.heightCm || '—'} cm</strong>
                  </div>
                  <div className="bg-[var(--lavender-50)] p-2 rounded-[10px] text-center">
                    <span className="text-[10px] text-[var(--ink-500)] block">MUAC</span>
                    <strong className="text-[var(--ink-900)]">{m.muacCm || '—'} cm</strong>
                  </div>
                  <div className="bg-[var(--lavender-50)] p-2 rounded-[10px] text-center">
                    <span className="text-[10px] text-[var(--ink-500)] block">Head</span>
                    <strong className="text-[var(--ink-900)]">{m.headCircumferenceCm || '—'} cm</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={onAddMeasurement}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log New Growth Measurement</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
