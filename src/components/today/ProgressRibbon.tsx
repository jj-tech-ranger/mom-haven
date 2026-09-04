import React from 'react';

export interface ProgressRibbonProps {
  progressRatio: number; // 0 to 1
  progressPercent?: number; // 0 to 100
  startLabel: string;
  endLabel: string;
  ringColorClass?: string; // e.g. 'ring-[#4B27A8]', 'ring-[#2563EB]', 'ring-[#059669]'
  labelColorClass?: string; // e.g. 'text-[#E5DFF0]', 'text-blue-100', 'text-emerald-100'
  className?: string;
}

export const ProgressRibbon: React.FC<ProgressRibbonProps> = ({
  progressRatio,
  progressPercent,
  startLabel,
  endLabel,
  ringColorClass = 'ring-[#4B27A8]',
  labelColorClass = 'text-[#E5DFF0]',
  className = '',
}) => {
  const safeRatio = Math.max(0, Math.min(1, progressRatio));
  const safePercent = progressPercent !== undefined 
    ? Math.max(0, Math.min(100, progressPercent)) 
    : Math.round(safeRatio * 100);

  return (
    <div className={`w-full ${className}`} aria-hidden="true">
      {/* Organic Haven Ribbon Curve SVG with Dot Indicator */}
      <div className="my-3 sm:my-4 relative">
        <svg 
          className="w-full h-11 sm:h-12 overflow-visible" 
          viewBox="0 0 300 40" 
          fill="none" 
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 10 28 C 75 14, 150 36, 225 18 C 260 10, 280 14, 290 16"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 10 28 C 75 14, 150 36, 225 18 C 260 10, 280 14, 290 16"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="300"
            strokeDashoffset={300 - (300 * safeRatio)}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] ring-4 ${ringColorClass} transition-all duration-700`}
          style={{
            left: `clamp(12px, ${safePercent}%, calc(100% - 16px))`
          }}
        />
      </div>

      <div className={`flex justify-between items-center text-[11px] sm:text-[12px] font-display font-semibold ${labelColorClass} pt-0.5`}>
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
};

export default ProgressRibbon;
