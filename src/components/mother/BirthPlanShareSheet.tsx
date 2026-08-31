import React, { useState } from 'react';
import {
  X,
  Share2,
  Users,
  CheckCircle2,
  Shield,
  Send,
  Building2,
  Car,
  Package,
  Coins,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { BirthPlanDoc } from '../../types';

interface BirthPlanShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName?: string;
  isPartnerConnected?: boolean;
  birthPlan?: Partial<BirthPlanDoc> | null;
  onShareConfirmed?: () => void;
}

export const BirthPlanShareSheet: React.FC<BirthPlanShareSheetProps> = ({
  isOpen,
  onClose,
  partnerName = 'Brian Kipchoge',
  isPartnerConnected = true,
  birthPlan,
  onShareConfirmed,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);

  if (!isOpen) return null;

  const handleShare = () => {
    setIsShared(true);
    if (onShareConfirmed) onShareConfirmed();
    setTimeout(() => {
      setIsShared(false);
      onClose();
    }, 1800);
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[28px] border-t border-border-hairline shadow-card-2 p-5 z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-lavender-200 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-haven-orchid">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                Share Birth Logistics
              </h2>
              <p className="font-body text-xs text-ink-600">
                Logistics & Emergency Preparedness Subset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-lavender-100 text-ink-600 hover:text-ink-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Partner Connection Status Card */}
        <div className="bg-lavender-50/90 border border-border-hairline rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-haven-deep text-white flex items-center justify-center font-display font-bold text-sm">
                {partnerName ? partnerName.charAt(0) : 'P'}
              </div>
              <div>
                <span className="text-xs font-display font-bold text-ink-900 block">
                  {partnerName || 'Partner'}
                </span>
                <span className="text-[11px] font-body text-status-normal flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isPartnerConnected ? 'Connected via MomHaven Partner' : 'Not yet connected'}
                </span>
              </div>
            </div>

            {!isPartnerConnected && (
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-pill bg-white border border-haven-orchid text-haven-deep text-xs font-display font-bold hover:bg-lavender-100 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Link Copied!' : 'Invite Partner'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Shareable Fields Checklist */}
        <div className="space-y-3 mb-5">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-ink-600 block px-1">
            Logistics Included in Share:
          </span>

          <div className="space-y-2 text-xs font-body text-ink-900">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-lavender-50/60 border border-border-hairline">
              <Building2 className="w-4 h-4 text-haven-orchid flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block">Primary Facility & Route</span>
                <span className="text-[11px] text-ink-600">
                  {birthPlan?.facilityName || 'Pumwani Maternity Hospital'}
                </span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-status-normal" />
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-lavender-50/60 border border-border-hairline">
              <Car className="w-4 h-4 text-haven-orchid flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block">Emergency Transport & Driver Contact</span>
                <span className="text-[11px] text-ink-600">
                  {birthPlan?.driverName || 'John Kamau (Trusted Taxi)'} · {birthPlan?.driverPhone || '+254 722 987 654'}
                </span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-status-normal" />
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-lavender-50/60 border border-border-hairline">
              <Package className="w-4 h-4 text-haven-orchid flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block">Hospital Bag & Baby Essentials Status</span>
                <span className="text-[11px] text-ink-600">Bag packed and ready by the door</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-status-normal" />
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-lavender-50/60 border border-border-hairline">
              <Coins className="w-4 h-4 text-haven-orchid flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block">Emergency Transport Savings</span>
                <span className="text-[11px] text-ink-600">Dedicated hospital transport reserve</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-status-normal" />
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-lavender-50/80 p-3 rounded-xl border border-border-hairline flex items-start gap-2 text-[11px] text-ink-600 mb-5">
          <Shield className="w-4 h-4 text-haven-orchid flex-shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Protected:</strong> Confidential clinician private notes and sensitive test records are never included in partner logistics shares.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleShare}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isShared ? 'Shared with Partner!' : 'Share with partner'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-100/60 transition-colors cursor-pointer text-center"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
