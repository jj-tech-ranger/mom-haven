import React, { useState } from 'react';
import { ChevronLeft, Lock, Delete, CheckCircle2 } from 'lucide-react';

interface AppLockPinSetupProps {
  onBack: () => void;
  onPinSetSuccess: (pin: string) => void;
}

export const AppLockPinSetup: React.FC<AppLockPinSetupProps> = ({
  onBack,
  onPinSetSuccess,
}) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentPin = step === 'create' ? pin : confirmPin;

  const handleKeyPress = (num: string) => {
    if (currentPin.length >= 4) return;
    const nextPin = currentPin + num;
    setErrorMsg('');

    if (step === 'create') {
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          setStep('confirm');
        }, 300);
      }
    } else {
      setConfirmPin(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === pin) {
          setTimeout(() => {
            onPinSetSuccess(nextPin);
          }, 300);
        } else {
          setErrorMsg('PINs did not match. Please try again.');
          setTimeout(() => {
            setConfirmPin('');
            setStep('create');
            setPin('');
          }, 1200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
    setErrorMsg('');
  };

  const handleClear = () => {
    if (step === 'create') {
      setPin('');
    } else {
      setConfirmPin('');
    }
    setErrorMsg('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in flex flex-col items-center min-h-[580px] justify-between">
      {/* Top App Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-ink-900">
          {step === 'create' ? 'Set your App Lock PIN' : 'Confirm your App Lock PIN'}
        </h1>
        <div className="w-10" />
      </div>

      {/* Lock Icon & Explicit Caption */}
      <div className="text-center space-y-3 max-w-[280px]">
        <div className="w-14 h-14 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <p className="font-body text-xs text-ink-600 leading-relaxed">
          This PIN stays on this device. It's never shared with a clinician and is completely separate from your Clinic Share Code.
        </p>
      </div>

      {/* 4-dot Progress Indicator */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = currentPin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-haven-deep scale-110 shadow-xs'
                    : 'bg-lavender-200 border border-lavender-300'
                }`}
              />
            );
          })}
        </div>
        {errorMsg ? (
          <p className="text-xs font-display font-bold text-red-600 animate-shake">
            {errorMsg}
          </p>
        ) : (
          <p className="text-xs font-display font-medium text-ink-600">
            {step === 'create' ? 'Enter 4 digits' : 'Re-enter your 4 digits'}
          </p>
        )}
      </div>

      {/* 3x3 Numeric Keypad with large rounded lavender number keys in Baloo 2 */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3.5 pt-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="h-16 rounded-[20px] bg-lavender-100/90 text-haven-deep font-display font-bold text-2xl active:bg-haven-orchid active:text-white transition-all shadow-xs hover:bg-lavender-200 flex items-center justify-center cursor-pointer"
          >
            {num}
          </button>
        ))}

        <button
          onClick={handleClear}
          className="h-16 rounded-[20px] bg-white border border-border-hairline text-ink-600 font-display font-bold text-xs uppercase tracking-wider active:bg-lavender-50 transition-all flex items-center justify-center cursor-pointer"
        >
          Clear
        </button>

        <button
          onClick={() => handleKeyPress('0')}
          className="h-16 rounded-[20px] bg-lavender-100/90 text-haven-deep font-display font-bold text-2xl active:bg-haven-orchid active:text-white transition-all shadow-xs hover:bg-lavender-200 flex items-center justify-center cursor-pointer"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          className="h-16 rounded-[20px] bg-white border border-border-hairline text-ink-700 active:bg-lavender-50 transition-all flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-5 h-5 text-ink-700" />
        </button>
      </div>
    </div>
  );
};
