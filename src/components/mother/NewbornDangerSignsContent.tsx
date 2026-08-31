import React from 'react';
import { Activity, AlertTriangle, HeartCrack, ShieldAlert, Thermometer, Wind } from 'lucide-react';
import { DANGER_SIGNS } from '../../lib/safetyPatterns';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'heart-crack': HeartCrack,
  activity: Activity,
  wind: Wind,
  thermometer: Thermometer,
  'shield-alert': ShieldAlert,
  sun: AlertTriangle,
};

export const NEWBORN_DANGER_SIGNS = DANGER_SIGNS.filter((sign) => sign.category === 'newborn');

interface Props { selectedIds?: string[]; onChange?: (ids: string[]) => void; compact?: boolean; }

export const NewbornDangerSignsContent: React.FC<Props> = ({ selectedIds = [], onChange, compact = false }) => (
  <div className="space-y-2">
    {NEWBORN_DANGER_SIGNS.map((sign) => {
      const selected = selectedIds.includes(sign.id);
      const Icon = iconMap[sign.icon] || ShieldAlert;
      return (
        <button
          type="button"
          key={sign.id}
          onClick={() => onChange?.(selected ? selectedIds.filter((id) => id !== sign.id) : [...selectedIds, sign.id])}
          className={`w-full text-left ${compact ? 'p-3' : 'p-4'} rounded-[16px] border ${selected ? 'bg-red-50 border-red-500' : 'bg-white border-border-hairline'}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender-50">
              <Icon className="h-4 w-4 text-red-600" />
            </div>
            <span className="flex-1 font-display text-sm font-bold text-ink-900">{sign.label}</span>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${selected ? 'bg-red-600 border-red-600' : 'bg-white border-border-hairline'}`}>
              {selected ? <span className="text-[11px] font-bold text-white">✓</span> : null}
            </span>
          </div>
        </button>
      );
    })}
  </div>
);

export default NewbornDangerSignsContent;
