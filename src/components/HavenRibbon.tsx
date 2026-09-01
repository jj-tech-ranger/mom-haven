import React from 'react';

interface HavenRibbonProps {
  progress: number;
  totalSteps?: number;
  currentStep?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  showMarkerTooltip?: boolean;
}

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
  const pathD = 'M 10,24 C 110,8 200,38 310,14 C 350,6 380,20 390,24';
  const t = clampedProgress / 100;
  const x = 10 + t * 380;
  const y = 24 + Math.sin(t * Math.PI * 2) * 8 - (t > 0.5 ? 4 : 0);

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      {(label || sublabel) && (
        <div className="flex items-baseline justify-between px-1">
          {label && <span className="font-heading text-sm font-semibold text-slate-900">{label}</span>}
          {sublabel && <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">{sublabel}</span>}
        </div>
      )}

      <div className="relative flex h-12 w-full items-center justify-center">
        <svg viewBox="0 0 400 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full overflow-visible">
          <path d={pathD} stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
          <path d={pathD} stroke="#6C3EAC" strokeWidth="8" strokeLinecap="round" pathLength="100" strokeDasharray={`${clampedProgress} 100`} className="transition-all duration-500 ease-out" />
          {clampedProgress > 0 && (
            <circle cx={x} cy={y} r="6" fill="#FFFFFF" stroke="#33178A" strokeWidth="3" className="transition-all duration-500 ease-out" />
          )}
        </svg>

        {showMarkerTooltip && currentStep && totalSteps && (
          <div
            style={{ left: `calc(${clampedProgress}% - 20px)` }}
            className="absolute -top-2 rounded-md border border-slate-200 bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-slate-100 shadow-sm transition-all duration-500 ease-out"
          >
            {currentStep}/{totalSteps}
          </div>
        )}
      </div>
    </div>
  );
};
