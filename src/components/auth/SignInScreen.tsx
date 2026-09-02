import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Mail, Sparkles, UserCheck, Shield } from 'lucide-react';
import Button from '../Button';

interface SignInScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn?: () => Promise<void>;
  onMagicLinkSignIn?: (email: string) => Promise<void>;
}

export default function SignInScreen({
  onBack,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  onEmailSignIn,
  onGoogleSignIn,
  onGuestSignIn,
  onMagicLinkSignIn,
}: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    if (useMagicLink) {
      try {
        setLoading(true);
        setError(null);
        if (onMagicLinkSignIn) {
          await onMagicLinkSignIn(email);
          setMagicLinkSent(true);
        }
      } catch (err: any) {
        console.error('Magic link error', err);
        setError(err?.message || 'Failed to send magic link. Please verify your email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onEmailSignIn(email, password);
    } catch (err: any) {
      console.error('Sign in error', err);
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await onGoogleSignIn();
    } catch (err: any) {
      console.error('Google sign in error', err);
      setError(err?.message || 'Google sign-in was interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    if (!onGuestSignIn) return;
    try {
      setLoading(true);
      setError(null);
      await onGuestSignIn();
    } catch (err: any) {
      console.error('Guest sign in error', err);
      setError(err?.message || 'Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col justify-between p-4 sm:p-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-900)] shadow-xs hover:bg-[var(--lavender-100)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <img src="/assets/logo.png" alt="MomHaven" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            <span className="font-display font-extrabold text-[15px] text-[var(--haven-deep)]">MomHaven</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Title */}
        <div className="mb-4 text-center sm:text-left">
          <h2 className="font-display font-bold text-[22px] text-[var(--ink-900)] leading-tight">
            Sign In
          </h2>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            Access maternal &amp; child health records and birth support.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-[12px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Magic Link Sent Success Screen */}
        {magicLinkSent ? (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-[20px] text-center space-y-2.5 mb-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-sm text-emerald-950">
              Magic Link Sent!
            </h4>
            <p className="font-body text-xs text-emerald-800 leading-relaxed">
              We emailed a 1-click sign-in link to <strong>{email}</strong>. Open the link on this device to sign in passwordless.
            </p>
            <button
              type="button"
              onClick={() => { setMagicLinkSent(false); setUseMagicLink(false); }}
              className="text-xs text-emerald-700 font-bold underline cursor-pointer pt-1"
            >
              Sign in with password instead
            </button>
          </div>
        ) : (
          /* Sign In Form */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[13px] shadow-xs text-[var(--ink-900)]"
                required
              />
            </div>

            {!useMagicLink && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseMagicLink(true)}
                    className="text-[11px] font-medium text-[var(--haven-orchid)] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Use 1-click Magic Link
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[13px] shadow-xs text-[var(--ink-900)] pr-10"
                    required={!useMagicLink}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[11px] font-display font-medium text-[var(--ink-600)] hover:text-[var(--haven-deep)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {useMagicLink && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(false)}
                  className="text-[11px] text-[var(--haven-deep)] font-medium hover:underline cursor-pointer"
                >
                  Use password instead
                </button>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="w-full py-3 text-xs mt-1">
              {loading
                ? 'Processing...'
                : useMagicLink
                ? 'Send Magic Sign-in Link'
                : 'Sign In'}
            </Button>
          </form>
        )}

        <div className="flex items-center gap-2 my-3">
          <div className="h-[1px] bg-[var(--border-hairline)] flex-1" />
          <span className="text-[10px] font-semibold text-[var(--ink-400)] uppercase tracking-wider">or 1-tap sign-in</span>
          <div className="h-[1px] bg-[var(--border-hairline)] flex-1" />
        </div>

        {/* Google & Guest Auth Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[var(--border-hairline)] hover:border-[var(--haven-orchid)] text-[var(--ink-900)] font-display font-semibold text-[12px] py-2.5 px-3 rounded-[12px] shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          {onGuestSignIn && (
            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] text-[var(--haven-deep)] font-display font-bold text-[12px] py-2.5 px-3 rounded-[12px] shadow-xs transition-all cursor-pointer border border-[var(--haven-orchid)]/30"
            >
              <UserCheck className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
              <span>Guest Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-3">
        <button
          type="button"
          onClick={onNavigateToSignUp}
          className="text-[12px] font-body text-[var(--ink-600)] cursor-pointer"
        >
          New to MomHaven? <strong className="font-display font-bold text-[var(--haven-deep)] hover:underline">Create an account</strong>
        </button>
      </div>
    </div>
  );
}
