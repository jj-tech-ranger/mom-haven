import React, { useState } from 'react';
import { Lock, Shield, Check, X, Eye, EyeOff } from 'lucide-react';

interface AppLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ isOpen, onClose }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [error, setError] = useState('');
  const [isPinSaved, setIsPinSaved] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (step === 'create') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => {
            setStep('confirm');
            setError('');
          }, 200);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            setIsPinSaved(true);
            setStep('success');
            setError('');
          } else {
            setError('PINs do not match. Try again.');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
      setError('');
    } else if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
      setError('');
    }
  };

  const handleReset = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
    setError('');
    setIsPinSaved(false);
  };

  const activeValue = step === 'create' ? pin : confirmPin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl border border-[#E5DFF0] overflow-hidden p-6 text-center">
        {/* Top Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-[#6D6380] hover:text-[#241451] hover:bg-[#F7F3FC]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-full bg-[#F7F3FC] border border-[#E5DFF0] flex items-center justify-center text-[#33178A] mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-[#241451] font-heading">
          {step === 'create' && 'Set App Lock PIN'}
          {step === 'confirm' && 'Confirm Your PIN'}
          {step === 'success' && 'App Lock Enabled'}
        </h3>

        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-xs text-[#33178A] font-medium my-2">
          <Shield className="w-3 h-3" />
          <span>Stays on this device</span>
        </div>

        <p className="text-xs text-[#6D6380] mb-6 px-4">
          {step === 'create' && 'Choose a 4-digit PIN to protect your personal notes and health history on this phone.'}
          {step === 'confirm' && 'Re-enter your 4-digit PIN to verify.'}
          {step === 'success' && 'Your PIN is now saved locally. You will need it to open MomHaven on this device.'}
        </p>

        {step !== 'success' ? (
          <>
            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-4 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    activeValue.length > idx
                      ? 'bg-[#33178A] border-[#33178A] scale-110'
                      : 'border-[#E5DFF0] bg-transparent'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 mb-4 animate-shake">
                {error}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleDigit(num.toString())}
                  className="h-12 rounded-2xl bg-[#F7F3FC] hover:bg-[#EAE3F7] active:bg-[#DDD4ED] text-[#241451] text-lg font-bold font-heading transition-colors tabular-nums shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleReset}
                className="h-12 rounded-2xl text-xs font-semibold text-[#6D6380] hover:text-[#241451] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="h-12 rounded-2xl bg-[#F7F3FC] hover:bg-[#EAE3F7] active:bg-[#DDD4ED] text-[#241451] text-lg font-bold font-heading transition-colors tabular-nums shadow-sm"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-12 rounded-2xl text-xs font-semibold text-[#6D6380] hover:text-[#241451] transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-[28px] haven-gradient text-white font-heading font-semibold text-sm shadow-md hover:opacity-95 transition-all"
            >
              Finish & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
