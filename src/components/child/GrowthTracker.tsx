// src/components/child/GrowthTracker.tsx
// WHO Child Growth Standards & Nutritional Monitoring (0 to 60 Months)
// Strictly follows Kenya Ministry of Health Mother-Child Health Handbook (MOH 216) pp. 28–35

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  Scale, 
  Ruler, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { GrowthMeasurement } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';
import {
  generateWhoSeries,
  interpolateWhoStandard,
  interpretZScore,
  WhoZScorePoint,
  ZScoreInterpretation
} from '../../data/whoGrowthStandards';

interface GrowthTrackerProps {
  childName: string;
  childSex: 'female' | 'male';
  measurements: GrowthMeasurement[];
  onBack: () => void;
  onAddMeasurement: () => void;
}

export default function GrowthTracker({
  childName,
  childSex,
  measurements,
  onBack,
  onAddMeasurement,
}: GrowthTrackerProps) {
  const [metricTab, setMetricTab] = useState<'weight' | 'height' | 'muac' | 'head'>('weight');
  const [timeRange, setTimeRange] = useState<'0-24' | '0-60'>('0-60');
  const [hoveredPoint, setHoveredPoint] = useState<{
    ageMonths: number;
    value: number;
    date: string;
    interpretation: ZScoreInterpretation;
  } | null>(null);

  const maxMonth = timeRange === '0-24' ? 24 : 60;

  // Filter measurements in range and sorted by age
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => a.ageMonths - b.ageMonths);
  }, [measurements]);

  const latest = sortedMeasurements[sortedMeasurements.length - 1];

  // Generate WHO reference series for selected metric
  const whoSeries: WhoZScorePoint[] = useMemo(() => {
    if (metricTab === 'weight') {
      return generateWhoSeries(childSex, 'weight', maxMonth);
    }
    if (metricTab === 'height') {
      return generateWhoSeries(childSex, 'height', maxMonth);
    }
    return [];
  }, [childSex, metricTab, maxMonth]);

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 280;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Compute Value Y-axis range
  const yDomain = useMemo(() => {
    if (metricTab === 'weight') {
      return { min: 1, max: timeRange === '0-24' ? 18 : 28 };
    }
    if (metricTab === 'height') {
      return { min: 40, max: timeRange === '0-24' ? 95 : 125 };
    }
    return { min: 0, max: 100 };
  }, [metricTab, timeRange]);

  const scaleX = (m: number) => padding.left + (m / maxMonth) * innerWidth;
  const scaleY = (v: number) => padding.top + innerHeight - ((v - yDomain.min) / (yDomain.max - yDomain.min)) * innerHeight;

  // Build SVG Paths for WHO Curves
  const generatePath = (accessor: (p: WhoZScorePoint) => number) => {
    if (whoSeries.length === 0) return '';
    return whoSeries.reduce((acc, point, idx) => {
      const x = scaleX(point.month);
      const y = scaleY(accessor(point));
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  // Build Area Path between two curves
  const generateArea = (
    upperAccessor: (p: WhoZScorePoint) => number,
    lowerAccessor: (p: WhoZScorePoint) => number
  ) => {
    if (whoSeries.length === 0) return '';
    const upperPoints = whoSeries.map(p => `${scaleX(p.month).toFixed(1)},${scaleY(upperAccessor(p)).toFixed(1)}`).join(' L ');
    const lowerPoints = [...whoSeries].reverse().map(p => `${scaleX(p.month).toFixed(1)},${scaleY(lowerAccessor(p)).toFixed(1)}`).join(' L ');
    return `M ${upperPoints} L ${lowerPoints} Z`;
  };

  // Extract Child Points
  const childPoints = useMemo(() => {
    return sortedMeasurements
      .filter(m => m.ageMonths <= maxMonth)
      .map(m => {
        const val = metricTab === 'weight' ? m.weightKg : metricTab === 'height' ? m.heightCm : undefined;
        if (val === undefined) return null;
        const ref = interpolateWhoStandard(whoSeries, m.ageMonths);
        const interp = interpretZScore(val, ref);
        return {
          id: m.id,
          date: m.date,
          ageMonths: m.ageMonths,
          val,
          x: scaleX(m.ageMonths),
          y: scaleY(val),
          interp,
        };
      })
      .filter(Boolean) as {
        id: string;
        date: string;
        ageMonths: number;
        val: number;
        x: number;
        y: number;
        interp: ZScoreInterpretation;
      }[];
  }, [sortedMeasurements, maxMonth, metricTab, whoSeries, yDomain]);

  // Latest status interpretation
  const latestInterpretation = useMemo(() => {
    if (!latest) return null;
    const val = metricTab === 'weight' ? latest.weightKg : metricTab === 'height' ? latest.heightCm : undefined;
    if (!val) return null;
    const ref = interpolateWhoStandard(whoSeries, latest.ageMonths);
    return interpretZScore(val, ref);
  }, [latest, metricTab, whoSeries]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Official Kenya MOH Handbook Banner */}
      <div className="bg-slate-800 text-slate-200 px-4 py-1.5 border-b border-slate-700 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <span className="flex items-center gap-1.5 font-semibold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          REPUBLIC OF KENYA · MINISTRY OF HEALTH
        </span>
        <span className="text-slate-400 font-mono">MOH 216 · WHO GROWTH &amp; NUTRITION</span>
      </div>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h1 className="font-display font-bold text-base text-slate-900">
              WHO Growth Standards (0–60m)
            </h1>
            <span className="text-[11px] font-mono text-teal-700 font-medium">
              {childName} ({childSex === 'female' ? 'Girl' : 'Boy'}) · MOH 216 pp. 28–35
            </span>
          </div>
          <button
            type="button"
            onClick={onAddMeasurement}
            className="w-9 h-9 rounded-lg bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            aria-label="Record measurement"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'weight', label: 'Weight (0–60m)' },
              { id: 'height', label: 'Length/Height' },
              { id: 'muac', label: 'MUAC Tape' },
              { id: 'head', label: 'Head Circ.' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMetricTab(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-mono font-medium text-center transition-colors whitespace-nowrap cursor-pointer ${
                metricTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-xl mx-auto">
        {/* Latest Metric Summary & Z-Score Band Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider">
              Current Trajectory &amp; Z-Score Band
            </span>
            {latestInterpretation ? (
              <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${latestInterpretation.badgeBg} ${latestInterpretation.badgeText}`}>
                {latestInterpretation.label}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono">
                No Entries Yet
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-2xl sm:text-3xl text-slate-900">
                {metricTab === 'weight'
                  ? (latest?.weightKg ? `${latest.weightKg} kg` : 'Not recorded')
                  : metricTab === 'height'
                  ? (latest?.heightCm ? `${latest.heightCm} cm` : 'Not recorded')
                  : metricTab === 'muac'
                  ? (latest?.muacCm ? `${latest.muacCm} cm` : 'Not recorded')
                  : (latest?.headCircumferenceCm ? `${latest.headCircumferenceCm} cm` : 'Not recorded')}
              </span>
              {latest && (
                <span className="text-xs font-mono text-slate-500">
                  at {latest.ageMonths} months
                </span>
              )}
            </div>

            {/* Time range toggle for charts */}
            {(metricTab === 'weight' || metricTab === 'height') && (
              <div className="flex bg-slate-100 p-0.5 rounded-md text-xs font-mono font-medium">
                <button
                  type="button"
                  onClick={() => setTimeRange('0-24')}
                  className={`px-2 py-0.5 rounded transition ${timeRange === '0-24' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
                >
                  0–24m
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('0-60')}
                  className={`px-2 py-0.5 rounded transition ${timeRange === '0-60' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'}`}
                >
                  0–60m
                </button>
              </div>
            )}
          </div>

          {latestInterpretation && (
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-[12px] border border-slate-100">
              {latestInterpretation.statusText}
            </p>
          )}

          {/* MUAC Specific Color Band Visualizer */}
          {metricTab === 'muac' && (
            <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-600)]">
                <span className="text-red-600 font-bold">Red (&lt;11.5cm SAM)</span>
                <span className="text-amber-600 font-bold">Yellow (11.5–12.4cm MAM)</span>
                <span className="text-emerald-700 font-bold">Green (&ge;12.5cm Normal)</span>
              </div>
              <div className="h-3.5 rounded-full overflow-hidden flex border border-slate-200">
                <div className="w-[30%] bg-red-500" title="Severe Acute Malnutrition" />
                <div className="w-[20%] bg-amber-400" title="Moderate Acute Malnutrition" />
                <div className="w-[50%] bg-emerald-500" title="Adequate Nutrition" />
              </div>
            </div>
          )}
        </div>

        {/* WHO Z-Score Bands SVG Chart (Weight & Height) */}
        {(metricTab === 'weight' || metricTab === 'height') && (
          <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
                  {metricTab === 'weight' ? 'Weight-for-Age' : 'Length/Height-for-Age'} Curve
                </h3>
                <p className="text-[11px] text-slate-500">
                  Full WHO 0 to {maxMonth} Month Standards with Z-Score Bands
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded-md">
                {childSex === 'female' ? 'Girls Reference' : 'Boys Reference'}
              </span>
            </div>

            {/* Interactive SVG Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto select-none"
              >
                <defs>
                  {/* Gradients for Z-score bands */}
                  <linearGradient id="normalBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.10" />
                  </linearGradient>
                  <linearGradient id="moderateBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.10" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 12, 24, 36, 48, 60]
                  .filter(m => m <= maxMonth)
                  .map(m => (
                    <g key={`grid-x-${m}`}>
                      <line
                        x1={scaleX(m)}
                        y1={padding.top}
                        x2={scaleX(m)}
                        y2={chartHeight - padding.bottom}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={scaleX(m)}
                        y={chartHeight - padding.bottom + 14}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        fontWeight="600"
                      >
                        {m}m
                      </text>
                    </g>
                  ))}

                {/* Y-Axis tick labels */}
                {Array.from({ length: 6 }).map((_, idx) => {
                  const val = yDomain.min + (idx / 5) * (yDomain.max - yDomain.min);
                  return (
                    <g key={`grid-y-${idx}`}>
                      <line
                        x1={padding.left}
                        y1={scaleY(val)}
                        x2={chartWidth - padding.right}
                        y2={scaleY(val)}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 6}
                        y={scaleY(val) + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="#64748b"
                        fontWeight="600"
                      >
                        {Math.round(val)}
                        {metricTab === 'weight' ? 'k' : 'c'}
                      </text>
                    </g>
                  );
                })}

                {/* Colored Z-Score Shaded Bands */}
                {/* Normal Band: -2 SD to +2 SD (Green) */}
                <path
                  d={generateArea(p => p.sd2pos, p => p.sd2neg)}
                  fill="url(#normalBandGrad)"
                />

                {/* Moderate Underweight / Stunting Band: -3 SD to -2 SD (Amber) */}
                <path
                  d={generateArea(p => p.sd2neg, p => p.sd3neg)}
                  fill="url(#moderateBandGrad)"
                />

                {/* Curve Lines */}
                {/* +3 SD Line (Deep Purple) */}
                <path
                  d={generatePath(p => p.sd3pos)}
                  fill="none"
                  stroke="#7e22ce"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />

                {/* +2 SD Line (Purple) */}
                <path
                  d={generatePath(p => p.sd2pos)}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="1.5"
                />

                {/* 0 SD / Median Line (Green - Target Reference) */}
                <path
                  d={generatePath(p => p.sd0)}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.2"
                />

                {/* -2 SD Line (Amber / Moderate Stunting threshold) */}
                <path
                  d={generatePath(p => p.sd2neg)}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.8"
                />

                {/* -3 SD Line (Red / Severe Malnutrition threshold) */}
                <path
                  d={generatePath(p => p.sd3neg)}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="1.8"
                />

                {/* Child Trajectory Path */}
                {childPoints.length > 1 && (
                  <path
                    d={childPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                  />
                )}

                {/* Child Data Points */}
                {childPoints.map((pt) => (
                  <g
                    key={pt.id}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setHoveredPoint({
                      ageMonths: pt.ageMonths,
                      value: pt.val,
                      date: pt.date,
                      interpretation: pt.interp,
                    })}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5.5"
                      fill={pt.interp.hexColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="shadow-xs"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Interactive Point Details */}
            {hoveredPoint && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between animate-fade-in">
                <div>
                  <span className="font-bold text-slate-900">
                    Age {hoveredPoint.ageMonths}m ({hoveredPoint.value} {metricTab === 'weight' ? 'kg' : 'cm'})
                  </span>
                  <p className="text-[11px] text-slate-500">Date: {hoveredPoint.date}</p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: hoveredPoint.interpretation.hexColor }}>
                    {hoveredPoint.interpretation.label}: {hoveredPoint.interpretation.statusText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHoveredPoint(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Standard WHO Reference Legend */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-4 rounded-full bg-emerald-600" />
                <span className="text-slate-700 font-semibold">Median (0 SD Average)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-4 rounded-full bg-emerald-100 border border-emerald-300" />
                <span className="text-slate-700">Normal Range (-2 to +2 SD)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-4 rounded-full bg-amber-500" />
                <span className="text-slate-700">-2 SD (Moderate Underweight)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-4 rounded-full bg-red-600" />
                <span className="text-slate-700 font-bold">-3 SD (Severe SAM)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-4 rounded-full bg-purple-600" />
                <span className="text-slate-700">+2 / +3 SD (High Curve)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-900 border border-white" />
                <span className="text-slate-900 font-bold">Child's Trajectory</span>
              </div>
            </div>
          </div>
        )}

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
            measurements.map(m => {
              const ref = interpolateWhoStandard(whoSeries, m.ageMonths);
              const interp = m.weightKg ? interpretZScore(m.weightKg, ref) : null;

              return (
                <div
                  key={m.id}
                  className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                        Age: {m.ageMonths} Months ({new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
                      </span>
                      {interp && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${interp.badgeBg} ${interp.badgeText}`}>
                          {interp.label}
                        </span>
                      )}
                    </div>
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
              );
            })
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
