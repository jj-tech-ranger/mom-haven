import React, { useState } from 'react';
import {
  ChevronLeft,
  AlertTriangle,
  PhoneCall,
  Flame,
  ThermometerSnowflake,
  Wind,
  Droplets,
  Activity,
  HeartCrack,
  WifiOff,
  Building2,
  Phone,
  ShieldAlert,
} from 'lucide-react';

interface NewbornDangerSignsProps {
  onBack: () => void;
  onOpenEmergency: () => void;
  facilityPhone?: string;
  facilityName?: string;
}

interface DangerSignItem {
  id: string;
  title: string;
  plainDescription: string;
  actionInstruction: string;
  icon: React.ReactNode;
  isUrgentRed: boolean;
}

export const NewbornDangerSigns: React.FC<NewbornDangerSignsProps> = ({
  onBack,
  onOpenEmergency,
  facilityPhone = '+254700000000',
  facilityName = 'Kariokor Health Centre',
}) => {
  const [checkedSigns, setCheckedSigns] = useState<Record<string, boolean>>({});

  const dangerSignsList: DangerSignItem[] = [
    {
      id: 'feeding',
      title: 'Unable to feed or suckle at breast',
      plainDescription:
        'Baby is completely refusing to feed or too weak to suckle at the breast.',
      actionInstruction:
        'Immediate risk of severe hypoglycemia (low blood sugar) and dehydration.',
      icon: <HeartCrack className="w-5 h-5 text-[#E11D3C]" />,
      isUrgentRed: true,
    },
    {
      id: 'convulsions',
      title: 'Convulsions, fits, or abnormal twitching',
      plainDescription:
        'Repeated spasms, abnormal rolling of eyes, or rhythmic jerking of limbs.',
      actionInstruction:
        'Keep airway open. Do not put anything in baby’s mouth. Seek hospital care immediately.',
      icon: <Activity className="w-5 h-5 text-[#E11D3C]" />,
      isUrgentRed: true,
    },
    {
      id: 'breathing',
      title: 'Fast breathing or deep chest indrawing',
      plainDescription:
        'Baby breathes faster than 60 breaths in a minute, grunts on breathing out, or the lower chest pulls in deeply when breathing in.',
      actionInstruction: 'Sign of severe neonatal pneumonia or respiratory distress.',
      icon: <Wind className="w-5 h-5 text-[#E11D3C]" />,
      isUrgentRed: true,
    },
    {
      id: 'fever',
      title: 'High fever (>37.5°C) or body feels very hot',
      plainDescription:
        'Baby’s body is burning hot to the touch or armpit thermometer reads 37.5°C or higher.',
      actionInstruction:
        'Never wrap baby in heavy blankets if hot. Do not give cold baths.',
      icon: <Flame className="w-5 h-5 text-[#E11D3C]" />,
      isUrgentRed: true,
    },
    {
      id: 'hypothermia',
      title: 'Body feels abnormally cold (<35.5°C)',
      plainDescription:
        'Baby’s hands, feet, and tummy feel cold or thermometer reads below 35.5°C.',
      actionInstruction:
        'Place baby skin-to-skin against mother’s bare chest (Kangaroo Care) and cover with warm blanket on way to hospital.',
      icon: <ThermometerSnowflake className="w-5 h-5 text-blue-600" />,
      isUrgentRed: true,
    },
    {
      id: 'jaundice',
      title: 'Yellow skin or yellow eyes within first 24 hours',
      plainDescription:
        'Baby looks visibly yellow on palms, soles, or face within the very first day of life.',
      actionInstruction:
        'Early jaundice requires urgent bilirubin check and phototherapy.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      isUrgentRed: true,
    },
    {
      id: 'cord',
      title: 'Umbilical stump bleeding, foul smell, or pus',
      plainDescription:
        'Skin around the belly button is swollen red, leaking pus, or bleeding continuously.',
      actionInstruction:
        'Sign of omphalitis / systemic newborn infection. Requires urgent antibiotic evaluation.',
      icon: <Droplets className="w-5 h-5 text-[#E11D3C]" />,
      isUrgentRed: true,
    },
    {
      id: 'lethargy',
      title: 'Extreme limpness, floppiness, or unconsciousness',
      plainDescription:
        'Baby is unusually quiet, floppy like a ragdoll, or does not wake up even when touched.',
      actionInstruction: 'Critical emergency. Go to hospital maternity/newborn unit immediately.',
      icon: <ShieldAlert className="w-5 h-5 text-[#E11D3C]" />,
      isUrgentRed: true,
    },
  ];

  const toggleCheck = (id: string) => {
    setCheckedSigns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedCount = Object.values(checkedSigns).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="font-display font-bold text-lg text-ink-900 leading-tight">
            Newborn Danger Signs
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            Kenya MOH & WHO IMCI Emergency Guide
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Offline-Safe Guarantee Banner */}
        <div className="p-3 rounded-2xl bg-lavender-100 border border-border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2 text-haven-deep">
            <WifiOff className="w-4 h-4 text-haven-orchid" />
            <span className="font-display font-semibold text-xs">
              Works 100% Offline
            </span>
          </div>
          <span className="font-body text-[11px] text-ink-600">
            Always accessible anywhere
          </span>
        </div>

        {/* Emergency Call to Action Alert Banner */}
        <div className="p-4 rounded-[20px] bg-red-600 text-white shadow-card-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-white animate-bounce flex-shrink-0" />
            <div>
              <h3 className="font-display font-bold text-base leading-tight">
                Any ONE danger sign is a medical emergency
              </h3>
              <p className="font-body text-xs text-white/90 mt-0.5">
                If your baby exhibits any symptom below, do not wait. Go to the
                nearest health facility immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Signs Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-ink-600">
              IMCI Danger Sign Checklist
            </span>
            {selectedCount > 0 && (
              <span className="font-display font-bold text-xs text-[#E11D3C] px-2 py-0.5 rounded-full bg-red-100">
                {selectedCount} sign{selectedCount > 1 ? 's' : ''} checked
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {dangerSignsList.map((sign) => {
              const isChecked = !!checkedSigns[sign.id];

              return (
                <div
                  key={sign.id}
                  onClick={() => toggleCheck(sign.id)}
                  className={`p-4 rounded-[20px] border shadow-card-1 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-red-50/90 border-[#E11D3C] ring-1 ring-[#E11D3C]'
                      : 'bg-white border-border-hairline hover:border-haven-orchid/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isChecked ? 'bg-red-100' : 'bg-lavender-50'
                      }`}
                    >
                      {sign.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-bold text-sm text-ink-900 leading-tight">
                          {sign.title}
                        </h4>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-5 h-5 rounded text-[#E11D3C] focus:ring-[#E11D3C] accent-[#E11D3C] flex-shrink-0 cursor-pointer"
                        />
                      </div>

                      <p className="font-body text-xs text-ink-700 mt-1 leading-relaxed">
                        {sign.plainDescription}
                      </p>

                      <div className="mt-2 pt-2 border-t border-border-hairline/60">
                        <p className="font-body text-[11px] text-[#E11D3C] font-semibold flex items-center gap-1">
                          <span>Action:</span>
                          <span className="font-normal text-ink-600">
                            {sign.actionInstruction}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary and Secondary Emergency Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onOpenEmergency}
            className="w-full py-4 px-6 rounded-pill bg-gradient-to-r from-red-600 to-[#E11D3C] text-white font-display font-bold text-base shadow-btn-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2.5 cursor-pointer animate-pulse"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Go to Emergency now</span>
          </button>

          <a
            href={`tel:${facilityPhone}`}
            className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2 text-center"
          >
            <Building2 className="w-4 h-4 text-haven-orchid" />
            <span>Call Facility ({facilityName})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
