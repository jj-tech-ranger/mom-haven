// src/components/profile/AppLockPinModal.tsx
import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Check, Delete } from 'lucide-react';
import Button from '../Button';

interface AppLockPinModalProps {
  onClose: () => void;
  onPinConfigured: () => void;
}

// Simple browser-native SHA-256 hashing with device salt
async function hashPinLocally(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ':' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AppLockPinModal({ onClose, onPinConfigured }: AppLockPinModalProps) {
  const [step, setStep] = useState<'ENTER' | 'CONFIRM'>('ENTER');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const currentEntry = step === 'ENTER' ? pin : confirmPin;

  const handleDigit = (digit: string) => {
    setError(null);
    if (step === 'ENTER') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => setStep('CONFIRM'), 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            savePin(pin);
          } else {
            setError('PINs do not match. Please try again.');
            setConfirmPin('');
            setPin('');
            setStep('ENTER');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError(null);
    if (step === 'ENTER') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const savePin = async (rawPin: string) => {
    try {
      let localSalt = localStorage.getItem('momhaven_pin_salt');
      if (!localSalt) {
        localSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('momhaven_pin_salt', localSalt);
      }
      const hashed = await hashPinLocally(rawPin, localSalt);
      localStorage.setItem('momhaven_app_pin_hash', hashed);
      localStorage.setItem('momhaven_pin_enabled', 'true');
      onPinConfigured();
      onClose();
    } catch (err) {
      console.error('Error hashing PIN locally', err);
      setError('Could not save PIN securely. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-card-2 border border-[var(--border-hairline)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
              {step === 'ENTER' ? 'Set 4-Digit PIN' : 'Confirm Your PIN'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Keypad & Dots */}
        <div className="p-6 text-center space-y-6">
          <p className="font-body text-xs text-[var(--ink-600)] leading-relaxed">
            {step === 'ENTER'
              ? 'Enter a 4-digit PIN to lock the app when backgrounded.'
              : 'Re-enter your 4-digit PIN to confirm.'}
          </p>

          {/* 4 Dots Indicator */}
          <div className="flex justify-center gap-4 my-4">
            {[0, 1, 2, 3].map((i) => {
              const isFilled = i < currentEntry.length;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isFilled
                      ? 'bg-[var(--haven-orchid)] border-[var(--haven-orchid)] scale-110 shadow-xs'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 animate-shake">
              {error}
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="w-16 h-14 rounded-[16px] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] font-display font-bold text-lg text-[var(--ink-900)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
            <div className="w-16 h-14" />
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="w-16 h-14 rounded-[16px] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] font-display font-bold text-lg text-[var(--ink-900)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-16 h-14 rounded-[16px] bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[var(--ink-600)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Security Guarantee */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 py-2 px-3 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local SHA-256 only · Never sent to servers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
