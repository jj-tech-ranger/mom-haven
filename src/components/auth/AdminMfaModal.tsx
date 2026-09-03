// src/components/auth/AdminMfaModal.tsx
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  X, 
  Sparkles 
} from 'lucide-react';
import Button from '../Button';

interface AdminMfaModalProps {
  adminEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminMfaModal({
  adminEmail,
  onSuccess,
  onCancel,
}: AdminMfaModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit MOH administrative security token.');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate step-up TOTP verification (accept any 6-digit code or default MOH token '123456' / '254000')
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-body">
      <div className="bg-white w-full max-w-md rounded-[28px] shadow-card-3 border border-[var(--border-hairline)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[var(--haven-deep)]" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
                Admin Step-Up MFA
              </h3>
              <p className="font-body text-xs text-[var(--ink-600)]">
                MOH Security Token Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-[16px] text-left text-xs text-purple-950 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Administrative Level 4 Access</p>
              <p className="text-purple-800 text-[11px] mt-0.5">
                Elevated privileges require a 6-digit security token sent to <strong>{adminEmail}</strong> or your MOH Authenticator.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-2">
                6-Digit MOH Security Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="• • • • • •"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center font-mono font-extrabold text-[26px] tracking-widest py-3 px-4 rounded-[16px] border-2 border-[var(--border-hairline)] focus:border-[var(--haven-deep)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none"
                autoFocus
              />
              <p className="text-[11px] text-[var(--ink-600)] mt-1.5">
                (Demo token: enter any 6 digits e.g. <span className="font-mono font-bold text-[var(--haven-deep)]">123456</span>)
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 py-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 text-xs font-display font-bold shadow-md"
              >
                {loading ? 'Verifying...' : 'Authorize Admin'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
