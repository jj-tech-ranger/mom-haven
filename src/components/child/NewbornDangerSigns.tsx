// src/components/child/NewbornDangerSigns.tsx
import React from 'react';
import { AlertTriangle, Thermometer, Wind, Activity, HeartCrack, Sun, Droplets } from 'lucide-react';

export const NEWBORN_DANGER_SIGNS = [
  { 
    id: 'feeding', 
    label: 'Unable to feed or suckle at breast / vomiting everything', 
    icon: HeartCrack, 
    urgent: true,
    action: 'Keep baby skin-to-skin and proceed immediately to hospital.' 
  },
  { 
    id: 'breathing', 
    label: 'Fast breathing (> 60 breaths/min) or severe chest in-drawing', 
    icon: Wind, 
    urgent: true,
    action: 'Keep airway clear and head neutral; seek immediate pediatric oxygen care.'
  },
  { 
    id: 'fits', 
    label: 'Convulsions, abnormal fits, or rhythmic limb twitching', 
    icon: Activity, 
    urgent: true,
    action: 'Turn baby on side, do not put anything in mouth; urgent transfer to Newborn Unit.'
  },
  { 
    id: 'temp_high', 
    label: 'High fever (> 37.5°C) or baby feels unusually hot', 
    icon: Thermometer, 
    urgent: true,
    action: 'Remove excess wrapping (do not sponge with cold water) and visit health facility.'
  },
  { 
    id: 'temp_low', 
    label: 'Low body temperature (< 35.5°C) or baby feels cold', 
    icon: Thermometer, 
    urgent: true,
    action: 'Practice immediate Kangaroo Mother Care (skin-to-skin under warm blanket).'
  },
  { 
    id: 'jaundice', 
    label: 'Yellow palms or yellow soles of feet in first 24h', 
    icon: Sun, 
    urgent: true,
    action: 'Urgent phototherapy evaluation to prevent neonatal brain complications.'
  },
  { 
    id: 'umbilicus', 
    label: 'Red, swollen umbilicus draining pus with foul smell', 
    icon: Droplets, 
    urgent: false,
    action: 'Sign of umbilical infection; requires urgent clinic antibiotic review.'
  },
];

interface NewbornDangerSignsProps {
  onEmergencyTrigger?: () => void;
}

export default function NewbornDangerSigns({ onEmergencyTrigger }: NewbornDangerSignsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[#FCE7EA] border border-[#C4283C]/30 p-4 rounded-[20px]">
        <h3 className="font-display font-bold text-[16px] text-[#C4283C] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#C4283C] shrink-0" />
          Newborn Emergency Warning Signs (First 28 Days)
        </h3>
        <p className="font-body text-xs text-[var(--ink-900)] mt-1">
          If your newborn shows <strong>ANY</strong> of these critical danger signs, seek immediate medical care at the nearest hospital maternity / newborn unit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {NEWBORN_DANGER_SIGNS.map((sign) => {
          const Icon = sign.icon;
          return (
            <div key={sign.id} className="bg-white border border-[var(--border-hairline)] p-3.5 rounded-[16px] flex items-start gap-3 shadow-card-1">
              <div className="w-9 h-9 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)] shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-[13px] font-semibold text-[var(--ink-900)]">{sign.label}</span>
                  {sign.urgent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-[#FCE7EA] text-[#C4283C] shrink-0">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="font-body text-[11px] text-[var(--ink-600)] mt-0.5">{sign.action}</p>
              </div>
            </div>
          );
        })}
      </div>

      {onEmergencyTrigger && (
        <button
          type="button"
          onClick={onEmergencyTrigger}
          className="w-full bg-[#E11D3C] hover:bg-[#BE123C] text-white font-display font-bold py-3.5 px-4 rounded-full shadow-emergency flex items-center justify-center gap-2 text-[14px] transition-all cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          Open Emergency Safety Guide
        </button>
      )}
    </div>
  );
}
