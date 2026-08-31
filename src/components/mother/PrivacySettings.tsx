import React, { useState } from 'react';
import { ChevronLeft, Shield, Check, Lock, Database, EyeOff } from 'lucide-react';

interface PrivacySettingsProps {
  onBack: () => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onBack }) => {
  const [dataSharing, setDataSharing] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <h1 className="font-display font-bold text-xl text-ink-900">Privacy & Consent</h1>
        <div className="w-10" />
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-display font-bold">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Privacy preferences updated</span>
        </div>
      )}

      {/* Explainer Hero */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender-100 text-haven-orchid flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ink-900">
              Your Health Data Governance
            </h3>
            <p className="font-body text-xs text-ink-600">
              Kenya Data Protection Act (2019) Compliant
            </p>
          </div>
        </div>
        <p className="font-body text-xs text-ink-700 leading-relaxed pt-1">
          MomHaven encrypts all personal and child health records. Data is strictly owned by you and is never sold to third parties or advertisers.
        </p>
      </div>

      {/* Consent Toggles */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 divide-y divide-border-hairline/60">
        <div className="p-4 flex items-center justify-between">
          <div className="pr-4">
            <h4 className="font-display font-bold text-sm text-ink-900">
              MOH Clinical Integration Sync
            </h4>
            <p className="font-body text-xs text-ink-600">
              Allow verified healthcare workers at accredited facilities to review records when authorized with your temporary Clinic Share Code.
            </p>
          </div>
          <input
            type="checkbox"
            checked={dataSharing}
            onChange={() => setDataSharing(!dataSharing)}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid flex-shrink-0"
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="pr-4">
            <h4 className="font-display font-bold text-sm text-ink-900">
              Anonymous Health Quality Research
            </h4>
            <p className="font-body text-xs text-ink-600">
              Share de-identified aggregate statistics to help improve public maternal health outcomes in Kenya.
            </p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={() => setAnalytics(!analytics)}
            className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid flex-shrink-0"
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
          <span>Manage data & consent</span>
        </button>
      </div>
    </div>
  );
};
