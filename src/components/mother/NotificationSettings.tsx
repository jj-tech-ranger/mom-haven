import React, { useState } from 'react';
import { ChevronLeft, Bell, Check } from 'lucide-react';

interface NotificationSettingsProps {
  onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const [toggles, setToggles] = useState({
    anc: true,
    pnc: true,
    immunization: true,
    growth: true,
    development: true,
    supplements: true,
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Notification Settings</h1>
        <div className="w-10" />
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-display font-bold">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Notification preferences saved</span>
        </div>
      )}

      {/* Category Toggles */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 divide-y divide-border-hairline/60">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Antenatal Care (ANC) Appointments
            </h4>
            <p className="font-body text-xs text-ink-600">
              Reminders 3 days and 1 day before your scheduled contact
            </p>
          </div>
          <input
            type="checkbox"
            checked={toggles.anc}
            onChange={() => handleToggle('anc')}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Postnatal Care (PNC) Checkups
            </h4>
            <p className="font-body text-xs text-ink-600">
              Critical newborn checks at 48h, 1–2w, 6w, and 6m
            </p>
          </div>
          <input
            type="checkbox"
            checked={toggles.pnc}
            onChange={() => handleToggle('pnc')}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Immunization & Vaccines
            </h4>
            <p className="font-body text-xs text-ink-600">
              Upcoming KEPI doses and catch-up reminders
            </p>
          </div>
          <input
            type="checkbox"
            checked={toggles.immunization}
            onChange={() => handleToggle('immunization')}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Growth & Nutrition Assessments
            </h4>
            <p className="font-body text-xs text-ink-600">
              Monthly weight check and MUAC screening alerts
            </p>
          </div>
          <input
            type="checkbox"
            checked={toggles.growth}
            onChange={() => handleToggle('growth')}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Development Milestones
            </h4>
            <p className="font-body text-xs text-ink-600">
              Age-based play and milestone tracking tips
            </p>
          </div>
          <input
            type="checkbox"
            checked={toggles.development}
            onChange={() => handleToggle('development')}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-ink-900">
              Daily Supplements (IFAS / Iron)
            </h4>
            <p className="font-body text-xs text-ink-600">
              Daily pill reminder with meal
            </p>
          </div>
          <input
            type="checkbox"
            checked={toggles.supplements}
            onChange={() => handleToggle('supplements')}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid"
          />
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Save preferences</span>
        </button>
      </div>
    </div>
  );
};
