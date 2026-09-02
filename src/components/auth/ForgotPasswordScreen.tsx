import React, { useState } from 'react';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../Button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset failed', err);
      setError(err?.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // M-AUTH-005: Account Recovery State
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col justify-between p-6 sm:p-8">
        <div className="w-full max-w-sm mx-auto text-center pt-8">
          <div className="w-20 h-20 rounded-full bg-[var(--lavender-100)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--haven-deep)] mx-auto mb-5 shadow-sm">
            <Mail className="w-9 h-9" />
          </div>

          <h2 className="font-display font-bold text-[26px] text-[var(--ink-900)] leading-tight">
            Check your email
          </h2>
          <p className="font-body text-[14px] text-[var(--ink-600)] mt-2 leading-relaxed">
            We have sent password reset instructions to <strong className="text-[var(--ink-900)]">{email}</strong>. Follow the link in that email to choose a new password.
          </p>

          <div className="mt-8 space-y-3">
            <Button variant="primary" onClick={onBack} className="w-full py-3.5">
              Back to sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError(null);
              }}
              className="text-[13px] font-display font-semibold text-[var(--haven-deep)] hover:underline cursor-pointer pt-2"
            >
              Didn't receive the email? Resend
            </button>
          </div>
        </div>

        <div className="text-center text-[12px] text-[var(--ink-400)]">
          Need help? <a href="mailto:support@momhaven.ke" className="underline">Contact support</a>
        </div>
      </div>
    );
  }

  // M-AUTH-004: Forgot Password Request Form
  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col justify-between p-6 sm:p-8">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6">
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

        <div className="mb-6">
          <h2 className="font-display font-bold text-[26px] text-[var(--ink-900)] leading-tight">
            Reset password
          </h2>
          <p className="font-body text-[14px] text-[var(--ink-600)] mt-1">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendReset} className="space-y-4">
          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Registered Email
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs text-[var(--ink-900)]"
              required
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Sending link...' : 'Send reset link'}
          </Button>
        </form>
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] font-display font-semibold text-[var(--haven-deep)] hover:underline cursor-pointer"
        >
          Return to sign in
        </button>
      </div>
    </div>
  );
}
