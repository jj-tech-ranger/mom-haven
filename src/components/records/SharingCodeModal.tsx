import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Clock, Copy, QrCode, CheckCircle2, Lock } from 'lucide-react';
import Button from '../Button';

interface SharingCodeModalProps {
  onClose: () => void;
}

export default function SharingCodeModal({ onClose }: SharingCodeModalProps) {
  const [code] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 minutes
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--haven-deep)]" />
            <h2 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
              Clinician Bedside Fast Share
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <p className="font-body text-[13px] text-[var(--ink-600)] leading-relaxed">
            Show this temporary 6-digit access code or QR code to your doctor or nurse. It gives them 15-minute secure, read-only access to verify records.
          </p>

          {/* 6-Digit Code Box */}
          <div className="p-5 rounded-[22px] bg-[var(--lavender-50)] border-2 border-[var(--haven-deep)] inline-block w-full">
            <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider block mb-1">
              Temporary 6-Digit Access PIN
            </span>
            <div className="font-mono font-black text-[38px] text-[var(--haven-deep)] tracking-[0.25em] pl-2">
              {code}
            </div>

            {/* Countdown timer */}
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--ink-600)] font-semibold mt-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Expires in <strong className="text-[var(--ink-900)]">{formatTime(secondsRemaining)}</strong></span>
            </div>
          </div>

          {/* QR Code representation */}
          <div className="p-4 bg-white rounded-[18px] border border-[var(--border-hairline)] shadow-xs flex flex-col items-center justify-center">
            <div className="w-36 h-36 bg-slate-900 rounded-[14px] p-2 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-white stroke-[1.2]" />
            </div>
            <span className="text-[11px] text-[var(--ink-400)] mt-2">
              Scan with MomHaven Clinician Portal
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={copyCode}
            className="w-full py-3.5 px-4 rounded-full bg-[var(--haven-deep)] text-white font-display font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'PIN Copied!' : 'Copy 6-Digit PIN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
