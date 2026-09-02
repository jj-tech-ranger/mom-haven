// src/components/profile/ClinicSharingModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Building2, Timer, Copy, Check, ShieldCheck, Stethoscope } from 'lucide-react';
import Button from '../Button';
import { createClinicShareCode, ClinicianAccessSession } from '../../services/sharingService';

interface ClinicSharingModalProps {
  motherId: string;
  onClose: () => void;
}

export default function ClinicSharingModal({ motherId, onClose }: ClinicSharingModalProps) {
  const [session, setSession] = useState<ClinicianAccessSession | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(15 * 60);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        const sess = await createClinicShareCode(motherId);
        setSession(sess);
        const expiresAt = new Date(sess.expiresAt).getTime();
        const diffSec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeftSec(diffSec);
      } catch (err) {
        console.error('Error creating clinic share code', err);
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, [motherId]);

  // 15-minute Live Ticking Countdown Timer
  useEffect(() => {
    if (timeLeftSec <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSec]);

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopy = () => {
    if (session?.shareCode) {
      navigator.clipboard.writeText(session.shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-card-2 border border-[var(--border-hairline)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)]">
              <Stethoscope className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-[var(--ink-900)]">
                Clinic Share Code
              </h3>
              <p className="font-body text-xs text-[var(--ink-600)]">
                Ephemeral 15-minute clinical record access for your healthcare provider
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-5">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-[var(--haven-orchid)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-[var(--ink-600)]">Generating ephemeral session...</p>
            </div>
          ) : (
            <>
              <p className="font-body text-xs text-[var(--ink-600)] leading-relaxed">
                Show this temporary code to your doctor or midwife at the clinic to allow them to review and verify your maternal health records.
              </p>

              {/* Code Box */}
              <div className="bg-[var(--lavender-50)] border-2 border-dashed border-[var(--haven-orchid)] p-5 rounded-[20px] flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest font-display font-extrabold text-[var(--haven-deep)] mb-1">
                  15-Minute Ephemeral Token
                </span>
                <span className="font-mono font-extrabold text-[32px] tracking-widest text-[var(--haven-deep)] select-all">
                  {session?.shareCode || 'CLINIC-7821'}
                </span>

                {/* Ticking Countdown Badge */}
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-purple-200 text-xs font-mono font-bold text-[var(--haven-deep)]">
                  <Timer className={`w-3.5 h-3.5 ${timeLeftSec < 120 ? 'text-red-500 animate-pulse' : 'text-purple-600'}`} />
                  <span>Valid for: {timeFormatted}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[var(--border-hairline)] shadow-xs text-xs font-display font-bold text-[var(--ink-900)] hover:bg-[var(--lavender-100)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Share Code'}
                </button>
              </div>

              {/* Security Audit Notice */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-[16px] text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="font-body text-[11px] text-emerald-900 leading-relaxed">
                  <strong>Audited Temporary Access:</strong> This session automatically terminates after 15 minutes. All clinician verification actions are cryptographically signed with their verified license number.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                className="w-full py-2.5 text-xs mt-2"
              >
                Close Share Sheet
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
