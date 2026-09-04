import React, { useMemo } from 'react';
import { 
  Baby, 
  Calendar, 
  Clock, 
  Heart, 
  Plus, 
  Sparkles, 
  Settings, 
  ChevronRight, 
  ShieldCheck, 
  Stethoscope, 
  Apple, 
  Footprints 
} from 'lucide-react';

export interface CircularPregnancyTrackerProps {
  gestationalWeeks: number; // e.g. 24
  gestationalDays?: number; // e.g. 3
  trimester?: number; // 1, 2, or 3
  babySize?: {
    size: string; // e.g. "an ear of corn"
    emoji: string; // e.g. "🌽"
    fact?: string;
  };
  eddFormatted?: string; // e.g. "14 Nov"
  daysToEdd?: number; // e.g. 112
  isAuthoritative?: boolean;
  language?: 'en' | 'sw';
  variant?: 'full' | 'compact'; // 'compact' for phone mockups, 'full' for main dashboard
  onLogAction?: () => void;
  onNavigate?: (tab: string) => void;
  onOpenAskHaven?: (prompt?: string) => void;
  className?: string;
}

export const CircularPregnancyTracker: React.FC<CircularPregnancyTrackerProps> = ({
  gestationalWeeks,
  gestationalDays = 0,
  trimester = 2,
  babySize = { size: 'an ear of corn', emoji: '🌽', fact: 'Baby is developing taste buds and hearing sounds from outside the womb.' },
  eddFormatted = '14 Nov',
  daysToEdd,
  isAuthoritative = false,
  language = 'en',
  variant = 'full',
  onLogAction,
  onNavigate,
  onOpenAskHaven,
  className = '',
}) => {
  const isSw = language === 'sw';

  // Safe gestational week between 1 and 40 (standard full term)
  const safeWeek = Math.max(1, Math.min(40, gestationalWeeks || 24));
  const progressRatio = safeWeek / 40;
  const progressPercent = Math.round(progressRatio * 100);

  // SVG Geometry configuration
  const isCompact = variant === 'compact';
  const size = isCompact ? 240 : 290;
  const center = size / 2;
  const radius = isCompact ? 88 : 106;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = isCompact ? 11 : 14;

  // The circular arc goes clockwise starting at 12 o'clock (-90 degrees)
  // Circumference stroke dash offset calculation
  const strokeDashoffset = circumference - (circumference * progressRatio);

  // Calculate position of the floating indicator node on the circle perimeter
  const indicatorAngleDeg = -90 + (progressRatio * 360);
  const indicatorAngleRad = (indicatorAngleDeg * Math.PI) / 180;
  const indicatorX = center + radius * Math.cos(indicatorAngleRad);
  const indicatorY = center + radius * Math.sin(indicatorAngleRad);

  // Key milestones to display around the circumference (matching the dial ticks in the reference)
  // For 40 weeks: milestone labels at weeks 1, 5, 10, 15, 20, 25, 30, 35, 40
  const tickWeeks = useMemo(() => {
    return [1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  }, []);

  // Today formatted string
  const todayFormatted = useMemo(() => {
    try {
      const now = new Date();
      return now.toLocaleDateString(isSw ? 'sw-KE' : 'en-GB', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Today';
    }
  }, [isSw]);

  return (
    <div 
      id="circular-pregnancy-tracker"
      className={`bg-white rounded-[28px] border border-[var(--border-hairline)] shadow-card-1 overflow-hidden transition-all duration-300 ${
        isCompact ? 'p-3.5' : 'p-5 sm:p-6'
      } ${className}`}
    >
      {/* Top Header Bar (Welcome / ChatAI shortcut / Settings) */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-2xs">
            🌸
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-wider text-[var(--haven-deep)] flex items-center gap-1">
              <span>{isSw ? 'Ujauzito Wako' : 'Your Pregnancy'}</span>
              {isAuthoritative && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-semibold">
                  MOH 216
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenAskHaven && (
            <button
              type="button"
              onClick={() => onOpenAskHaven()}
              className="px-2.5 py-1 rounded-full bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-colors border border-[var(--haven-orchid)]/20 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-[var(--haven-orchid)]" />
              <span>Haven AI</span>
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="w-7 h-7 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-500)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Circular Dial Wheel Visualization */}
      <div className="relative flex flex-col items-center justify-center my-2 sm:my-3">
        <div 
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {/* SVG Circular Ring with Ticks & Progress */}
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
            aria-hidden="true"
          >
            {/* Soft Outer Dial Drop-Shadow Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius + (strokeWidth / 2) + 8}
              fill="none"
              stroke="#F5F2FA"
              strokeWidth="1"
            />

            {/* Inactive Track Background (Soft Lavender Gray) */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#F1EDF9"
              strokeWidth={strokeWidth}
            />

            {/* Outer Tick Numbers (1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40) */}
            {tickWeeks.map((wk) => {
              const angleDeg = -90 + (wk / 40) * 360;
              const angleRad = (angleDeg * Math.PI) / 180;
              const tickRadius = radius + (strokeWidth / 2) + (isCompact ? 10 : 13);
              const tx = center + tickRadius * Math.cos(angleRad);
              const ty = center + tickRadius * Math.sin(angleRad);
              const isPast = wk <= safeWeek;

              return (
                <text
                  key={wk}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isCompact ? 7.5 : 9}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={isPast ? '700' : '500'}
                  fill={isPast ? '#6B3DB8' : '#94A3B8'}
                  className="select-none transition-colors duration-300"
                >
                  {wk}
                </text>
              );
            })}

            {/* Active Progress Arc (Deep Haven Purple / Slate Charcoal) */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="url(#pregnancyArcGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-all duration-700 ease-out"
            />

            {/* Gradient definition for the arc */}
            <defs>
              <linearGradient id="pregnancyArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4B27A8" />
                <stop offset="50%" stopColor="#6E3CB9" />
                <stop offset="100%" stopColor="#33178A" />
              </linearGradient>
            </defs>

            {/* Floating Indicator Badge / Node on the Wheel Perimeter (like "Day 9" in reference) */}
            <g 
              transform={`translate(${indicatorX}, ${indicatorY})`}
              className="transition-all duration-700 ease-out cursor-pointer"
            >
              {/* Outer white ring with shadow */}
              <circle
                r={isCompact ? 16 : 19}
                fill="#FFFFFF"
                stroke="#4B27A8"
                strokeWidth={isCompact ? 2 : 2.5}
                filter="drop-shadow(0 2px 6px rgba(51, 23, 138, 0.25))"
              />
              <text
                x="0"
                y={isCompact ? -5 : -6}
                textAnchor="middle"
                fontSize={isCompact ? 6.5 : 8}
                fontWeight="700"
                fill="#6B7280"
                fontFamily="system-ui, sans-serif"
                className="select-none tracking-tight"
              >
                {isSw ? 'WIKI' : 'WEEK'}
              </text>
              <text
                x="0"
                y={isCompact ? 6 : 7}
                textAnchor="middle"
                fontSize={isCompact ? 10 : 12}
                fontWeight="800"
                fill="#33178A"
                fontFamily="system-ui, sans-serif"
                className="select-none"
              >
                {safeWeek}
              </text>
            </g>
          </svg>

          {/* Center Content of the Circular Wheel */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none select-none"
            style={{ padding: isCompact ? '24px' : '32px' }}
          >
            {/* Top Icon Badge (drop/baby silhouette with clock motif) */}
            <div className={`rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shadow-2xs mb-1 ${
              isCompact ? 'w-8 h-8' : 'w-10 h-10'
            }`}>
              <div className="relative">
                <Baby className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-[var(--haven-deep)]`} />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center shadow-2xs">
                  <Clock className="w-2 h-2 text-[var(--haven-orchid)]" />
                </span>
              </div>
            </div>

            {/* Date & Trimester Badge */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-display font-semibold text-[var(--ink-500)] mt-0.5">
              <Calendar className="w-3 h-3 text-[var(--haven-orchid)]" />
              <span>{todayFormatted}</span>
              <span>•</span>
              <span className="text-[var(--haven-deep)] font-bold">
                {isSw ? `Miezi 3 ya ${trimester}` : `Trimester ${trimester}`}
              </span>
            </div>

            {/* Bold Status Headline */}
            <div className={`font-display font-extrabold text-[var(--ink-900)] tracking-tight leading-none mt-1 ${
              isCompact ? 'text-[22px]' : 'text-[28px]'
            }`}>
              {isSw ? `Wiki ya ${safeWeek}` : `Week ${safeWeek}`}
            </div>

            {/* Subtext description & Baby Size */}
            <p className={`font-body text-[var(--ink-600)] mt-1 flex items-center justify-center gap-1 leading-snug line-clamp-2 max-w-[180px] ${
              isCompact ? 'text-[10px]' : 'text-[12px]'
            }`}>
              <span>{isSw ? 'Mtoto ana ukubwa wa' : 'Baby is the size of'} {babySize.size}</span>
              <span className="shrink-0">{babySize.emoji}</span>
            </p>

            {/* EDD or Days remaining */}
            <div className="mt-1 text-[9px] sm:text-[10px] font-display font-semibold text-[var(--haven-orchid)]">
              {daysToEdd ? (
                <span>{daysToEdd} {isSw ? 'siku zilizosalia' : 'days to estimated due date'}</span>
              ) : (
                <span>{isSw ? 'Tarehe ya Kujifungua:' : 'EDD:'} {eddFormatted}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Button: + Log Daily Check-In (matching reference "+ Log Period") */}
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={onLogAction || (() => onNavigate?.('today'))}
          className="w-full max-w-xs mx-auto py-3 px-5 rounded-full bg-[#E1146B] hover:bg-[#D01060] active:scale-[0.98] text-white font-display font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white" />
          </span>
          <span>{isSw ? 'Rekodi Dalili na Mwendo' : 'Log Daily Check-In & Symptoms'}</span>
        </button>
      </div>

      {/* 3 Quick Cards Below Tracker (Matching the 3 cards in reference) */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--border-hairline)]">
        {/* Card 1: Baby Development */}
        <button
          type="button"
          onClick={() => onOpenAskHaven?.(`Tell me about baby development at week ${safeWeek}`)}
          className="p-2.5 rounded-2xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-rose-100 text-left transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <span className="text-[9px] font-display font-bold uppercase tracking-wider text-rose-600 block">
              {isSw ? 'Mtoto' : 'Development'}
            </span>
            <span className="text-[11px] font-display font-bold text-[var(--ink-900)] block mt-0.5 leading-tight line-clamp-1">
              {babySize.emoji} {babySize.size}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-rose-700 font-semibold">
            <span>{isSw ? 'Mwongozo' : 'Milestones'}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 2: Clinical ANC Guidance */}
        <button
          type="button"
          onClick={() => onNavigate?.('records')}
          className="p-2.5 rounded-2xl bg-[#FEF9C3] hover:bg-[#FEF08A] border border-amber-200 text-left transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <span className="text-[9px] font-display font-bold uppercase tracking-wider text-amber-800 block">
              MOH 216
            </span>
            <span className="text-[11px] font-display font-bold text-[var(--ink-900)] block mt-0.5 leading-tight line-clamp-1">
              {isSw ? 'Kliniki ya ANC' : 'ANC Contact'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-amber-900 font-semibold">
            <span>{isSw ? 'Ratiba' : 'Care Plan'}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 3: Nutrition & Wellness */}
        <button
          type="button"
          onClick={() => onOpenAskHaven?.(`What nutrition and hydration tips are recommended at week ${safeWeek}?`)}
          className="p-2.5 rounded-2xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-emerald-200 text-left transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <span className="text-[9px] font-display font-bold uppercase tracking-wider text-emerald-700 block">
              {isSw ? 'Lishe' : 'Nutrition'}
            </span>
            <span className="text-[11px] font-display font-bold text-[var(--ink-900)] block mt-0.5 leading-tight line-clamp-1">
              {isSw ? 'Madini & Maji' : 'Iron & Water'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-emerald-800 font-semibold">
            <span>{isSw ? 'Ushauri' : 'Daily Tips'}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default CircularPregnancyTracker;
