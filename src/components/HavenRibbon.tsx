import React from 'react';

interface HavenRibbonProps {
  progress: number; // 0 to 100
  totalSteps?: number;
  currentStep?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  showMarkerTooltip?: boolean;
}

/**
 * Signature Haven Ribbon:
 * Soft organic curved ribbon (never a straight bar, never a plain ring)
 * Gradient-filled up to the current point, pale lavender for remainder,
 * with a small marker dot at the current position.
 */
export const HavenRibbon: React.FC<HavenRibbonProps> = ({
  progress,
  totalSteps,
  currentStep,
  label,
  sublabel,
  className = '',
  showMarkerTooltip = true,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  // Bezier curve calculations for a gentle organic wave
  // Width 400, Height 48
  // Start: (10, 24), Control1: (120, 10), Control2: (260, 38), End: (390, 24)
  const pathD = "M 10,24 C 110,8 200,38 310,14 C 350,6 380,20 390,24";

  // Calculate approximate marker position along curve
  const t = clampedProgress / 100;
  // Approximation for SVG cubic bezier point (10,24) -> (110,8) -> (200,38) -> (390,24)
  const x = 10 + t * 380;
  const y = 24 + Math.sin(t * Math.PI * 2) * 8 - (t > 0.5 ? 4 : 0);

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {(label || sublabel) && (
        <div className="flex justify-between items-baseline px-1">
          {label && <span className="text-sm font-semibold text-[#241451] font-heading">{label}</span>}
          {sublabel && (
            <span className="text-xs font-medium text-[#6D6380] tabular-nums">
              {sublabel}
            </span>
          )}
        </div>
      )}

      <div className="relative w-full h-12 flex items-center justify-center">
        <svg
          viewBox="0 0 400 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Background track gradient */}
            <linearGradient id="ribbonTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EAE3F7" />
              <stop offset="100%" stopColor="#F0EBFA" />
            </linearGradient>

            {/* Active filled gradient (Deep Purple #33178A -> Orchid #9167C2) */}
            <linearGradient id="ribbonActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#33178A" />
              <stop offset="65%" stopColor="#6C3EAC" />
              <stop offset="100%" stopColor="#9167C2" />
            </linearGradient>

            {/* Shadow filter for marker dot */}
            <filter id="ribbonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#33178A" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Pale Lavender Track */}
          <path
            d={pathD}
            stroke="url(#ribbonTrackGrad)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Gradient Filled Portion */}
          <path
            d={pathD}
            stroke="url(#ribbonActiveGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="400"
            strokeDashoffset={400 - (400 * clampedProgress) / 100}
            className="transition-all duration-700 ease-out"
          />

          {/* Small Marker Dot at current position */}
          {clampedProgress > 0 && (
            <g className="transition-all duration-700 ease-out">
              {/* Outer halo */}
              <circle
                cx={x}
                cy={y}
                r="9"
                fill="#FFFFFF"
                filter="url(#ribbonGlow)"
              />
              {/* Inner gradient dot */}
              <circle
                cx={x}
                cy={y}
                r="5.5"
                fill="#33178A"
              />
            </g>
          )}
        </svg>

        {/* Floating tooltip/current step indicator */}
        {showMarkerTooltip && currentStep && totalSteps && (
          <div
            style={{ left: `calc(${clampedProgress}% - 24px)` }}
            className="absolute -top-3 text-[10px] font-bold bg-[#241451] text-white px-2 py-0.5 rounded-full shadow-sm tabular-nums whitespace-nowrap pointer-events-none transition-all duration-700 ease-out"
          >
            {currentStep}/{totalSteps}
          </div>
        )}
      </div>
    </div>
  );
};
