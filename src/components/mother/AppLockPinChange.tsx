import React, { useState } from 'react';
import { ChevronLeft, Lock, Delete } from 'lucide-react';

interface AppLockPinChangeProps {
  onBack: () => void;
  onPinChangeSuccess: (newPin: string) => void;
}

export const AppLockPinChange: React.FC<AppLockPinChangeProps> = ({
  onBack,
  onPinChangeSuccess,
}) => {
  const [stage, setStage] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeValue =
    stage === 'current' ? currentPin : stage === 'new' ? newPin : confirmPin;

  const handleKeyPress = (num: string) => {
    if (activeValue.length >= 4) return;
    const nextVal = activeValue + num;
    setErrorMsg('');

    if (stage === 'current') {
      setCurrentPin(nextVal);
      if (nextVal.length === 4) {
        setTimeout(() => setStage('new'), 300);
      }
    } else if (stage === 'new') {
      setNewPin(nextVal);
      if (nextVal.length === 4) {
        setTimeout(() => setStage('confirm'), 300);
      }
    } else {
      setConfirmPin(nextVal);
      if (nextVal.length === 4) {
        if (nextVal === newPin) {
          setTimeout(() => onPinChangeSuccess(nextVal), 300);
        } else {
          setErrorMsg('PINs did not match. Please re-enter new PIN.');
          setTimeout(() => {
            setConfirmPin('');
            setNewPin('');
            setStage('new');
          }, 1200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (stage === 'current') setCurrentPin((p) => p.slice(0, -1));
    else if (stage === 'new') setNewPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
    setErrorMsg('');
  };

  const stageTitles = {
    current: 'Enter Current PIN',
    new: 'Enter New 4-digit PIN',
    confirm: 'Confirm New PIN',
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
        <h1 className="font-display font-bold text-lg text-ink-900">{stageTitles[stage]}</h1>
        <div className="w-10" />
      </div>

      {/* Lock Icon */}
      <div className="text-center space-y-2 max-w-[280px]">
        <div className="w-14 h-14 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <p className="font-body text-xs text-ink-600">
          {stage === 'current'
            ? 'Verify your identity before changing device PIN'
            : 'Choose a memorable 4-digit device PIN'}
        </p>
      </div>

      {/* 4-dot Progress Indicator */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                activeValue.length > index
                  ? 'bg-haven-deep scale-110 shadow-xs'
                  : 'bg-lavender-200 border border-lavender-300'
              }`}
            />
          ))}
        </div>
        {errorMsg && (
          <p className="text-xs font-display font-bold text-red-600 animate-shake">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Numeric Keypad */}
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

        <div className="h-16" />

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
