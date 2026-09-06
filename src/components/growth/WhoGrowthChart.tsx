// src/components/growth/WhoGrowthChart.tsx
import React, { useState, useMemo } from 'react';
import { AlertTriangle, Info, TrendingDown, TrendingUp, CheckCircle, ShieldAlert } from 'lucide-react';
import { GrowthMeasurement } from '../../types';
import { 
  calculateZScore, 
  interpretZScore, 
  generateGrowthCurveBands, 
  GrowthCurveBandPoint 
} from '../../utils/whoGrowthStandards';

interface WhoGrowthChartProps {
  measurements: GrowthMeasurement[];
  sex?: 'male' | 'female';
  childName?: string;
  defaultMetric?: 'wfa' | 'lhfa';
  className?: string;
}

export default function WhoGrowthChart({
  measurements,
  sex = 'female',
  childName = 'Baby',
  defaultMetric = 'wfa',
  className = '',
}: WhoGrowthChartProps) {
  const [metric, setMetric] = useState<'wfa' | 'lhfa'>(defaultMetric);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    ageMonths: number;
    val: number;
    zScore: number;
    date?: string;
    isFlagged: boolean;
  } | null>(null);

  // SVG dimensions
  const width = 640;
  const height = 360;
  const padding = { top: 30, right: 35, bottom: 45, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Max age on chart (up to 24 or 36 months)
  const maxAge = 24;
  // Dynamic Y domain
  const maxY = metric === 'wfa' ? 18 : 95;
  const minY = metric === 'wfa' ? 1.5 : 45;

  const xScale = (month: number) => padding.left + (month / maxAge) * innerWidth;
  const yScale = (val: number) => padding.top + innerHeight - ((val - minY) / (maxY - minY)) * innerHeight;

  // Generate WHO Standard curve bands
  const bands: GrowthCurveBandPoint[] = useMemo(() => {
    return generateGrowthCurveBands(sex, metric, maxAge);
  }, [sex, metric, maxAge]);

  // Create SVG path strings for bands
  const createPath = (key: keyof Omit<GrowthCurveBandPoint, 'month'>) => {
    return bands.reduce((acc, pt, i) => {
      const x = xScale(pt.month);
      const y = yScale(pt[key]);
      return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  };

  const pathMinus3 = useMemo(() => createPath('minus3'), [bands, metric]);
  const pathMinus2 = useMemo(() => createPath('minus2'), [bands, metric]);
  const pathMedian = useMemo(() => createPath('median'), [bands, metric]);
  const pathPlus2 = useMemo(() => createPath('plus2'), [bands, metric]);
  const pathPlus3 = useMemo(() => createPath('plus3'), [bands, metric]);

  // Process child's real measurements
  const plottedData = useMemo(() => {
    return measurements
      .map((m) => {
        const age = m.ageInMonths ?? m.ageMonths ?? 0;
        const val = metric === 'wfa' ? m.weightKg : (m.lengthHeightCm ?? m.heightCm);
        if (typeof val !== 'number' || isNaN(val) || val <= 0) return null;

        const zScore = calculateZScore(val, age, sex, metric);
        const interp = interpretZScore(zScore, metric);

        return {
          id: m.id,
          date: m.measurementDate || m.date,
          ageMonths: age,
          val,
          zScore,
          isFlagged: interp.isFlagged,
          interp,
          cx: xScale(age),
          cy: yScale(val),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.ageMonths - b.ageMonths);
  }, [measurements, metric, sex, innerWidth, innerHeight]);

  // Connect child's trajectory line
  const childTrajectoryPath = useMemo(() => {
    if (plottedData.length < 2) return '';
    return plottedData.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.cx},${pt.cy}` : `${acc} L ${pt.cx},${pt.cy}`;
    }, '');
  }, [plottedData]);

  // Any flagged point (< -2 SD)
  const hasSevereAlert = plottedData.some((p) => p.zScore < -2);
  const latestPoint = plottedData[plottedData.length - 1];

  return (
    <div id="who-growth-chart-container" className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-sm ${className}`}>
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-stone-900">
              WHO Growth Trajectory (MOH 216)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {sex === 'male' ? 'Boys' : 'Girls'} Standards
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Plotting {childName} against Kenya MOH 216 / WHO Child Growth z-score bands (-3 to +3 SD)
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('wfa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              metric === 'wfa'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Weight-for-Age (kg)
          </button>
          <button
            type="button"
            onClick={() => setMetric('lhfa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              metric === 'lhfa'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Length/Height-for-Age (cm)
          </button>
        </div>
      </div>

      {/* Flag Alert Banner if below -2 z-score */}
      {hasSevereAlert && (
        <div id="growth-severe-alert-banner" className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-amber-900">
              Clinical Alert: Measurement Below -2 SD (Moderate/Severe Growth Faltering)
            </p>
            <p className="text-amber-700 mt-0.5">
              One or more measurements plot below the -2 z-score line per MOH 216 Handbook guidelines. Recommend nutritional assessment and clinical review.
            </p>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[540px] select-none"
        >
          {/* Grid lines */}
          {Array.from({ length: 7 }, (_, i) => i * 4).map((m) => (
            <line
              key={`x-grid-${m}`}
              x1={xScale(m)}
              y1={padding.top}
              x2={xScale(m)}
              y2={height - padding.bottom}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          ))}

          {/* X Axis ticks & labels */}
          {Array.from({ length: 7 }, (_, i) => i * 4).map((m) => (
            <g key={`x-tick-${m}`} transform={`translate(${xScale(m)}, ${height - padding.bottom + 16})`}>
              <text textAnchor="middle" className="text-[10px] fill-stone-400 font-mono">
                {m}m
              </text>
            </g>
          ))}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            className="text-[11px] fill-stone-500 font-medium"
          >
            Age (Months)
          </text>

          {/* Y Axis ticks & labels */}
          <text
            transform={`rotate(-90)`}
            x={-height / 2}
            y={18}
            textAnchor="middle"
            className="text-[11px] fill-stone-500 font-medium"
          >
            {metric === 'wfa' ? 'Weight (kg)' : 'Length/Height (cm)'}
          </text>

          {/* WHO Reference Band Lines */}
          {/* +3 SD */}
          <path d={pathPlus3} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* +2 SD */}
          <path d={pathPlus2} fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Median (0 SD) */}
          <path d={pathMedian} fill="none" stroke="#10b981" strokeWidth="2" />
          {/* -2 SD */}
          <path d={pathMinus2} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
          {/* -3 SD */}
          <path d={pathMinus3} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />

          {/* Band End Labels */}
          <text x={width - padding.right + 4} y={yScale(bands[bands.length - 1]?.plus3 ?? 0) + 3} className="text-[9px] fill-purple-600 font-bold">
            +3 SD
          </text>
          <text x={width - padding.right + 4} y={yScale(bands[bands.length - 1]?.plus2 ?? 0) + 3} className="text-[9px] fill-blue-500 font-semibold">
            +2 SD
          </text>
          <text x={width - padding.right + 4} y={yScale(bands[bands.length - 1]?.median ?? 0) + 3} className="text-[9px] fill-emerald-600 font-bold">
            0 (Median)
          </text>
          <text x={width - padding.right + 4} y={yScale(bands[bands.length - 1]?.minus2 ?? 0) + 3} className="text-[9px] fill-amber-600 font-bold">
            -2 SD
          </text>
          <text x={width - padding.right + 4} y={yScale(bands[bands.length - 1]?.minus3 ?? 0) + 3} className="text-[9px] fill-red-600 font-bold">
            -3 SD
          </text>

          {/* Child Trajectory Path */}
          {childTrajectoryPath && (
            <path
              d={childTrajectoryPath}
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Child Measurement Points */}
          {plottedData.map((pt) => {
            const isFlagged = pt.isFlagged;
            return (
              <g
                key={pt.id}
                className="cursor-pointer group"
                onMouseEnter={() =>
                  setHoveredPoint({
                    x: pt.cx,
                    y: pt.cy,
                    ageMonths: pt.ageMonths,
                    val: pt.val,
                    zScore: pt.zScore,
                    date: pt.date,
                    isFlagged,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Alert glow if flagged below -2 SD */}
                {isFlagged && (
                  <circle
                    cx={pt.cx}
                    cy={pt.cy}
                    r="10"
                    fill="#ef4444"
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={pt.cx}
                  cy={pt.cy}
                  r={isFlagged ? '6.5' : '5'}
                  fill={isFlagged ? '#dc2626' : '#0f172a'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform group-hover:scale-125"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-stone-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-stone-700"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <span>{hoveredPoint.val} {metric === 'wfa' ? 'kg' : 'cm'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                hoveredPoint.isFlagged ? 'bg-red-500 text-white' : 'bg-stone-700 text-stone-300'
              }`}>
                z: {hoveredPoint.zScore > 0 ? `+${hoveredPoint.zScore}` : hoveredPoint.zScore}
              </span>
            </div>
            <div className="text-[10px] text-stone-300 mt-0.5">
              Age: {hoveredPoint.ageMonths} mo {hoveredPoint.date ? `• ${hoveredPoint.date}` : ''}
            </div>
            {hoveredPoint.isFlagged && (
              <div className="text-[10px] text-red-300 font-medium mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" /> Below -2 SD (Action Required)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Summary Info */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
            <span>Median (0 SD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed inline-block" />
            <span>-2 SD (Moderate Underweight / Stunting)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500 border-b border-dotted inline-block" />
            <span>-3 SD (Severe Undernutrition)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-900 inline-block" />
            <span>Recorded Measurement</span>
          </div>
        </div>

        {latestPoint && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-700">Latest Z-Score:</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold font-mono ${
              latestPoint.isFlagged
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {latestPoint.zScore > 0 ? `+${latestPoint.zScore}` : latestPoint.zScore} SD
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
