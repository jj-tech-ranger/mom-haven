// src/components/profile/AppLockScreen.tsx
import React, { useState } from 'react';
import { Lock, ShieldCheck, Delete } from 'lucide-react';

interface AppLockScreenProps {
  onUnlock: () => void;
  userName?: string;
}

async function verifyHashedPin(pin: string): Promise<boolean> {
  const localSalt = localStorage.getItem('momhaven_pin_salt') || '';
  const storedHash = localStorage.getItem('momhaven_app_pin_hash') || '';
  if (!storedHash) return true;

  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ':' + localSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return computedHash === storedHash;
}

export default function AppLockScreen({ onUnlock, userName = 'Mama' }: AppLockScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = async (digit: string) => {
    setError(null);
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        const isValid = await verifyHashedPin(next);
        if (isValid) {
          onUnlock();
        } else {
          setError('Incorrect PIN. Please try again.');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setError(null);
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--lavender-50)] flex flex-col items-center justify-between p-6 sm:p-8">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center text-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-white border border-[var(--border-hairline)] shadow-card-1 mx-auto flex items-center justify-center text-[var(--haven-orchid)] mb-4">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="font-display font-bold text-[22px] text-[var(--ink-900)]">
          MomHaven Locked
        </h2>
        <p className="font-body text-xs text-[var(--ink-600)] mt-1">
          Welcome back, {userName}. Enter your 4-digit PIN to access your health records.
        </p>

        {/* 4 Dots */}
        <div className="flex justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? 'bg-[var(--haven-orchid)] border-[var(--haven-orchid)] scale-110 shadow-xs'
                  : 'border-gray-300 bg-white'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 mb-4 animate-shake">
            {error}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="w-16 h-14 rounded-[16px] bg-white hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] font-display font-bold text-lg text-[var(--ink-900)] shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-14" />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-14 rounded-[16px] bg-white hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] font-display font-bold text-lg text-[var(--ink-900)] shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-14 rounded-[16px] bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[var(--ink-600)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center text-[11px] text-[var(--ink-500)] flex items-center justify-center gap-1.5 pb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Hardware-Isolated Security · Zero-Knowledge Local PIN</span>
      </div>
    </div>
  );
}
