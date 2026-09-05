import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../Button';
import { auth } from '../../lib/firebase';
import { migrateLocalHealthLogs } from '../../services/anonymousContextService';

interface CreateAccountScreenProps {
  onBack: () => void;
  onNavigateToSignIn: () => void;
  onSubmitCreate: (data: { displayName: string; email: string; phone: string; password: string }) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn?: () => Promise<void>;
}

export default function CreateAccountScreen({
  onBack,
  onNavigateToSignIn,
  onSubmitCreate,
  onGoogleSignIn,
  onGuestSignIn,
}: CreateAccountScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasswordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formattedPhone = phone.startsWith('0') 
        ? `+254${phone.slice(1)}` 
        : phone.startsWith('+') 
        ? phone 
        : phone ? `+254${phone}` : '';

      await onSubmitCreate({
        displayName,
        email,
        phone: formattedPhone,
        password,
      });

      if (auth?.currentUser?.uid) {
        try {
          await migrateLocalHealthLogs(auth.currentUser.uid);
        } catch (migErr) {
          console.warn('Failed to migrate local health logs on account creation:', migErr);
        }
      }
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err?.message || 'Failed to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col justify-between p-6 sm:p-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-900)] shadow-xs hover:bg-[var(--lavender-100)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <img src="/assets/logo.png" alt="MomHaven" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            <span className="font-display font-extrabold text-[16px] text-[var(--haven-deep)]">MomHaven</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Title */}
        <div className="mb-5">
          <h2 className="font-display font-bold text-[26px] text-[var(--ink-900)] leading-tight">
            Create your account
          </h2>
          <p className="font-body text-[14px] text-[var(--ink-600)] mt-1">
            Your personal companion for you and your baby's journey.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Jemutai"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs text-[var(--ink-900)]"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs text-[var(--ink-900)]"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Phone Number
            </label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 py-2.5 bg-white border border-[var(--border-hairline)] rounded-[14px] text-[14px] font-medium text-[var(--ink-600)] shadow-xs">
                🇰🇪 +254
              </span>
              <input
                type="tel"
                placeholder="712 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs text-[var(--ink-900)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs text-[var(--ink-900)] pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--ink-600)]">
              <CheckCircle2 className={`w-3.5 h-3.5 ${isPasswordValid ? 'text-emerald-600' : 'text-[var(--ink-400)]'}`} />
              <span>Must be at least 8 characters</span>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[var(--haven-deep)] focus:ring-[var(--haven-orchid)] border-[var(--border-hairline)] cursor-pointer"
              required
            />
            <label htmlFor="terms" className="text-[12px] text-[var(--ink-600)] leading-tight cursor-pointer">
              I agree to the <span className="text-[var(--haven-deep)] font-semibold">Terms of Service</span> and <span className="text-[var(--haven-deep)] font-semibold">Privacy Policy</span>.
            </label>
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-[var(--border-hairline)] flex-1" />
          <span className="text-[12px] font-medium text-[var(--ink-400)]">or</span>
          <div className="h-[1px] bg-[var(--border-hairline)] flex-1" />
        </div>

        {/* Google Sign In */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[var(--border-hairline)] hover:border-[var(--haven-orchid)] text-[var(--ink-900)] font-display font-semibold text-[13px] py-3 px-4 rounded-full shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {onGuestSignIn && (
            <button
              type="button"
              onClick={onGuestSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] text-[var(--haven-deep)] font-display font-bold text-[13px] py-3 px-4 rounded-full shadow-xs transition-all cursor-pointer border border-[var(--haven-orchid)]/30"
            >
              <span>Explore as Guest</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onNavigateToSignIn}
          className="text-[13px] font-body text-[var(--ink-600)] cursor-pointer"
        >
          Already have an account? <strong className="font-display font-bold text-[var(--haven-deep)] hover:underline">Sign in</strong>
        </button>
      </div>
    </div>
  );
}
