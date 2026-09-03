import React, { useState } from 'react';
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { auth } from '../../lib/firebase';

interface AdminMfaModalProps {
  adminEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminMfaModal({ adminEmail, onSuccess, onCancel }: AdminMfaModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  const isGoogleUser = user?.providerData.some(provider => provider.providerId === 'google.com') ?? false;

  const verify = async () => {
    if (!user) {
      setError('Your session has expired. Please sign in again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isGoogleUser) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else if (user.email && password) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      } else {
        setError('Enter your account password to continue.');
        setLoading(false);
        return;
      }
      onSuccess();
    } catch (err) {
      console.error('Admin step-up verification failed', err);
      setError('Verification failed. Please authenticate again and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
        <div className="w-12 h-12 rounded-2xl bg-[var(--lavender-100)] flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-[var(--haven-orchid)]" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--haven-deep)]">Administrative step-up verification</p>
        <h2 className="text-xl font-bold text-gray-900 mt-1">Confirm your identity</h2>
        <p className="text-sm text-gray-600 mt-2">Elevated administrative actions require fresh authentication for <strong>{adminEmail}</strong>.</p>

        {!isGoogleUser && (
          <label className="block mt-5">
            <span className="text-xs font-semibold text-gray-700">Account password</span>
            <div className="relative mt-1.5">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--haven-deep)]" />
            </div>
          </label>
        )}

        {isGoogleUser && <p className="mt-5 text-xs text-gray-600 bg-gray-50 rounded-xl p-3">Continue with Google to complete the secure step-up check.</p>}
        {error && <p className="mt-3 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl p-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Cancel</button>
          <button type="button" onClick={verify} disabled={loading} className="flex-1 py-3 rounded-xl bg-[var(--haven-deep)] text-white text-sm font-semibold disabled:opacity-50">{loading ? 'Verifying…' : isGoogleUser ? 'Continue with Google' : 'Verify identity'}</button>
        </div>
      </div>
    </div>
  );
}
