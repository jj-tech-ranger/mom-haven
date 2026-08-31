import React, { useState, useEffect } from 'react';
import { Timer, Share2, Copy, Check, ShieldCheck, X, RefreshCw } from 'lucide-react';

interface ClinicShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  motherName?: string;
}

export const ClinicShareModal: React.FC<ClinicShareModalProps> = ({
  isOpen,
  onClose,
  motherName = 'Faith Chemutai',
}) => {
  const [shareCode, setShareCode] = useState('784-219');
  const [secondsRemaining, setSecondsRemaining] = useState(894); // ~14m 54s
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(shareCode.replace('-', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const randomCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    setShareCode(randomCode);
    setSecondsRemaining(900); // 15 minutes
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl border border-[#E5DFF0] overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DFF0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F7F3FC] border border-[#E5DFF0] flex items-center justify-center text-[#33178A]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#241451] font-heading">
                Clinic Share Code
              </h3>
              <p className="text-xs text-[#6D6380]">Temporary Health Worker Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#6D6380] hover:text-[#241451] hover:bg-[#F7F3FC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Code Display Card */}
        <div className="mt-5 p-6 rounded-[20px] bg-[#F7F3FC] border border-[#E5DFF0] text-center flex flex-col items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6D6380] mb-1">
            One-Time Access Code
          </span>
          <div className="text-4xl font-extrabold tracking-widest text-[#33178A] font-heading tabular-nums my-2">
            {shareCode}
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mt-1">
            <Timer className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Expires in <strong className="tabular-nums">{timeFormatted}</strong></span>
          </div>

          <div className="flex gap-2 w-full mt-5">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 rounded-full bg-white border border-[#E5DFF0] text-[#241451] text-xs font-semibold hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6D6380]" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleRegenerate}
              className="p-2.5 rounded-full bg-white border border-[#E5DFF0] text-[#6D6380] hover:text-[#33178A] hover:bg-gray-50 transition-colors shadow-sm"
              title="Generate new code"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-2.5 text-xs text-[#241451]">
          <ShieldCheck className="w-4 h-4 text-[#33178A] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[#6D6380]">
            <strong className="text-[#241451]">Share only with your clinician.</strong> This allows your licensed health care provider at the clinic to review your records and verify visits. Access automatically ends after 15 minutes or when you close the session.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[28px] haven-gradient text-white font-heading font-semibold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
