import React, { useState } from 'react';
import { ChevronLeft, Lock, Key, ShieldCheck, Check, Smartphone } from 'lucide-react';

interface SecuritySettingsProps {
  onBack: () => void;
  onOpenPinSetup: () => void;
  onOpenPinChange: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onBack,
  onOpenPinSetup,
  onOpenPinChange,
}) => {
  const [isPinSet, setIsPinSet] = useState(true);

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
        <h1 className="font-display font-bold text-xl text-ink-900">Security</h1>
        <div className="w-10" />
      </div>

      {/* App Lock PIN Control Card (M-PRO-013) */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink-900">
                App Lock PIN
              </h3>
              <p className="font-body text-xs text-ink-600 mt-0.5">
                Stays on this device
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-pill text-xs font-display font-bold ${
              isPinSet
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-lavender-100 text-haven-deep'
            }`}
          >
            {isPinSet ? 'PIN Active' : 'Not Set'}
          </span>
        </div>

        <p className="font-body text-xs text-ink-700 leading-relaxed bg-lavender-50/60 p-3 rounded-2xl border border-border-hairline/60">
          This 4-digit PIN secures MomHaven when you open the app on your phone. It stays strictly on this device and is never sent to the cloud or shared with anyone.
        </p>

        <div className="pt-1">
          {isPinSet ? (
            <button
              onClick={onOpenPinChange}
              className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Change App Lock PIN</span>
            </button>
          ) : (
            <button
              onClick={onOpenPinSetup}
              className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              <span>Set up App Lock PIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Device Biometrics note */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-2">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-haven-orchid" />
          <h4 className="font-display font-bold text-sm text-ink-900">
            Biometric Fast Unlock
          </h4>
        </div>
        <p className="font-body text-xs text-ink-600 leading-relaxed">
          You can also use Face ID or Fingerprint on supported devices to quickly unlock MomHaven alongside your 4-digit PIN.
        </p>
      </div>
    </div>
  );
};
