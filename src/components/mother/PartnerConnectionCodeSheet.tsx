import React, { useState } from 'react';
import { Copy, RefreshCw, Check, QrCode, X } from 'lucide-react';

interface PartnerConnectionCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerConnectionCodeSheet: React.FC<PartnerConnectionCodeSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [code, setCode] = useState('HAVEN-7824');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setCode(`HAVEN-${randomDigits}`);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 space-y-5 shadow-2xl animate-slide-up border-t sm:border border-border-hairline">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-lavender-200 rounded-full mx-auto" />

        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xl text-ink-900">
            Partner Connection Code
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-ink-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-body text-xs text-ink-600 leading-relaxed">
          Ask your partner to enter this code in their MomHaven Partner app to securely link your accounts.
        </p>

        {/* Big Code Box */}
        <div className="bg-lavender-50/70 border border-lavender-200 rounded-[20px] p-6 text-center space-y-2">
          {showQr ? (
            <div className="py-2 flex flex-col items-center">
              <div className="w-36 h-36 bg-white p-3 rounded-2xl border border-border-hairline shadow-xs flex items-center justify-center">
                <QrCode className="w-28 h-28 text-haven-deep" />
              </div>
              <p className="font-display font-bold text-base text-ink-900 mt-2">{code}</p>
            </div>
          ) : (
            <h2 className="font-display font-bold text-3xl text-haven-deep tracking-wider font-mono">
              {code}
            </h2>
          )}
          <p className="font-body text-[11px] text-ink-600">Valid for 48 hours · Single use</p>
        </div>

        {/* QR Toggle button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowQr(!showQr)}
            className="text-xs font-display font-bold text-haven-deep flex items-center gap-1.5 hover:underline"
          >
            <QrCode className="w-4 h-4" />
            <span>{showQr ? 'Show text code' : 'Show partner QR code'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleCopy}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Code copied!' : 'Copy / share code'}</span>
          </button>

          <button
            onClick={handleRegenerate}
            className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Regenerate code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
