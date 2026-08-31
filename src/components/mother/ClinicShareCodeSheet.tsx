import React, { useState, useEffect } from 'react';
import { Share2, Clock, ShieldCheck, X } from 'lucide-react';

interface ClinicShareCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicShareCodeSheet: React.FC<ClinicShareCodeSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(872); // 14:32
  const code = '849 201';

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 space-y-5 shadow-2xl animate-slide-up border-t sm:border border-border-hairline">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-lavender-200 rounded-full mx-auto" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink-900 leading-tight">
                Clinic Share Code
              </h3>
              <p className="font-body text-[11px] text-ink-600">
                Share only with your clinician. This is not your App Lock PIN.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-ink-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Code Panel */}
        <div className="bg-lavender-50/80 border border-lavender-200 rounded-[20px] p-6 text-center space-y-3">
          <h2 className="font-display font-bold text-4xl text-haven-deep tracking-[0.25em]">
            {code}
          </h2>

          {/* Red Countdown Row */}
          <div className="flex items-center justify-center gap-1.5 text-red-600 font-display font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>Expires in {timerDisplay}</span>
          </div>

          {/* Green Badges: Auditable & Temporary */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-xs font-display font-bold">
              Auditable
            </span>
            <span className="px-3 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-xs font-display font-bold">
              Temporary
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1 text-center">
          <button
            onClick={onClose}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            <span>Share with clinician</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-display font-bold text-red-600 hover:underline pt-1"
          >
            Cancel session
          </button>
        </div>
      </div>
    </div>
  );
};
