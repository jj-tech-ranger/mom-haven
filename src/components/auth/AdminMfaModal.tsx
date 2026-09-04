// src/components/auth/AdminMfaModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  X, 
  Copy,
  Check,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import Button from '../Button';
import { auth } from '../../lib/firebase';

// TODO(PROD-MFA-204): Full self-service QR code enrollment UI, recovery codes, and hardware key (WebAuthn) support (tracked in MOH-SEC-1049).
// Per security mandate, all hardcoded/any-6-digit bypasses are removed. Every token must be verified server-side against the user's TOTP secret.

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
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadMfaSetup = async () => {
      try {
        setLoadingSetup(true);
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken(true);
        const res = await fetch('/api/v1/admin/mfa/setup', {
          headers: {
            authorization: `Bearer ${idToken}`,
            'x-firebase-id-token': idToken,
          },
        });
        if (res.ok && mounted) {
          const data = await res.json();
          if (data.secret) {
            setMfaSecret(data.secret);
          }
        }
      } catch (err) {
        console.warn('Unable to load MFA setup details:', err);
      } finally {
        if (mounted) setLoadingSetup(false);
      }
    };
    loadMfaSetup();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopySecret = async () => {
    if (!mfaSecret) return;
    try {
      await navigator.clipboard.writeText(mfaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError('Please enter the 6-digit MOH administrative security token.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Active admin session required.');
      }
      const idToken = await user.getIdToken(true);

      const res = await fetch('/api/v1/admin/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${idToken}`,
          'x-firebase-id-token': idToken,
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Invalid security token. Please check the code on your authenticator app.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please verify the code on your authenticator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 font-body">
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
                MOH TOTP Authenticator Token
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
            title="Cancel"
            aria-label="Cancel"
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
                Elevated privileges require a 6-digit TOTP token from your authenticator app for <strong>{adminEmail}</strong>.
              </p>
            </div>
          </div>

          {/* Key details toggle for admin enrollment */}
          {mfaSecret && (
            <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  Authenticator Key
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
                >
                  {showSecret ? 'Hide Key' : 'Show Key'}
                </button>
              </div>

              {showSecret && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-[11px] text-gray-500 mb-1">
                    Enter this secret key in Google Authenticator or Microsoft Authenticator:
                  </p>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                    <code className="font-mono text-xs text-gray-900 tracking-wider break-all select-all flex-1">
                      {mfaSecret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 text-gray-500 hover:text-purple-700 cursor-pointer"
                      title="Copy Secret"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-2">
                6-Digit Security Token
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
                Codes refresh every 30 seconds on your authenticator device
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
                {loading ? 'Verifying with Server...' : 'Authorize Admin'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
