import React, { useState } from 'react';
import { ArrowLeft, Mail, AlertCircle, Loader2, ShieldCheck, CheckCircle2, ExternalLink, RotateCw } from 'lucide-react';
import Button from '../Button';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSendResetEmail: (email: string) => Promise<void>;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onSendResetEmail,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [resendTimer, setResendTimer] = useState<number>(0);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setErrorMessage(null);

    if (!isEmailValid) {
      setErrorMessage('Invalid email error: Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await onSendResetEmail(email.trim());
      setEmailSent(true);
      startResendCountdown();
    } catch (err: any) {
      console.error('Password reset error:', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMessage('No account was found with this email address.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Invalid email error: Please enter a valid email address.');
      } else {
        setErrorMessage(err?.message || 'Failed to send reset link. Please check your email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startResendCountdown = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOpenEmailApp = () => {
    window.open('mailto:', '_blank');
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await onSendResetEmail(email.trim());
      startResendCountdown();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Resend failed. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  // M-AUTH-005 — Account Recovery State (Embedded within parent screen)
  if (emailSent) {
    return (
      <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0]">
        <div>
          {/* Top App Bar */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-[#E5DFF0] flex items-center justify-center text-[#33178A] hover:bg-[#EAE3F7] transition-colors cursor-pointer"
              aria-label="Back to sign in"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-display font-bold text-[#9167C2] tracking-wider uppercase">
              M-AUTH-005 · Recovery State
            </span>
          </div>

          {/* Recovery Content Card */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E5DFF0] shadow-card-1 flex flex-col items-center text-center mt-4">
            {/* Success Illustration Moment (One per screen maximum) */}
            <div className="w-20 h-20 rounded-full bg-[#ECFDF5] border-2 border-[#10B981] flex items-center justify-center mb-5 text-[#10B981] shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="font-display font-bold text-2xl text-[#241451] tracking-tight mb-2">
              Check your email
            </h1>

            <p className="font-body text-xs text-[#6D6380] leading-relaxed mb-5 max-w-[260px]">
              We have sent a secure password reset link to <span className="font-semibold text-[#33178A]">{email}</span>.
            </p>

            {errorMessage && (
              <div className="w-full mb-4 p-3 rounded-[16px] bg-[#FFF1F2] border border-[#E11D3C] text-[#E11D3C] text-xs text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions Stack */}
            <div className="w-full space-y-3">
              {/* Primary Action: Open email app */}
              <Button
                variant="primary"
                onClick={handleOpenEmailApp}
                className="flex items-center justify-center gap-2"
              >
                <span>Open email app</span>
                <ExternalLink className="w-4 h-4" />
              </Button>

              {/* Secondary Action: Resend with timer */}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendTimer > 0}
                className="w-full py-3 rounded-pill bg-white border-[1.5px] border-[#33178A] text-[#33178A] font-display font-semibold text-xs hover:bg-[#EAE3F7] flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
              >
                <RotateCw className={`w-3.5 h-3.5 text-[#9167C2] ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {loading
                    ? 'Resending...'
                    : resendTimer > 0
                    ? `Resend link in ${resendTimer}s`
                    : "Didn't get the email? Resend link"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary: Back to sign in */}
        <div className="pt-6 pb-2 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-[#33178A] font-display font-semibold text-sm hover:underline cursor-pointer"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // M-AUTH-004 — Forgot Password Screen
  return (
    <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0]">
      <div>
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-[#E5DFF0] flex items-center justify-center text-[#33178A] hover:bg-[#EAE3F7] transition-colors cursor-pointer"
            aria-label="Back to sign in"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-display font-bold text-[#9167C2] tracking-wider uppercase">
            M-AUTH-004
          </span>
        </div>

        {/* Hero Card Accent (135° Gradient on Hero Blocks only) */}
        <div className="rounded-[20px] p-5 mb-5 text-white shadow-card-1 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, #33178A 0%, #5B2CA0 60%, #9167C2 100%)',
          }}
        >
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Forgot password?
          </h1>
          <p className="font-body text-xs text-white/85 mt-1 leading-relaxed">
            Enter your account email to receive safe password recovery instructions.
          </p>
        </div>

        {/* Invalid Email Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-[20px] bg-[#FFF1F2] border border-[#E11D3C] text-[#E11D3C] text-xs flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form Container Card */}
        <div className="bg-white rounded-[20px] p-5 border border-[#E5DFF0] shadow-card-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-bold text-[#241451] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6D6380]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-3.5 py-3 bg-[#F7F3FC] rounded-input border text-sm text-[#241451] focus:outline-none transition-colors ${
                    emailTouched && !isEmailValid
                      ? 'border-[#E11D3C] focus:border-[#E11D3C]'
                      : 'border-[#E5DFF0] focus:border-[#9167C2]'
                  }`}
                />
              </div>
              {/* Helper text */}
              <p className="text-[11px] text-[#6D6380] mt-1.5">
                We'll email you a secure link to reset your account password.
              </p>
              {emailTouched && !isEmailValid && (
                <p className="text-[11px] text-[#E11D3C] mt-1">Invalid email error: Please provide a valid email.</p>
              )}
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="mt-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending reset link...</span>
                </span>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Secondary Action: Back to sign in */}
      <div className="pt-6 pb-2 text-center space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-[#33178A] font-display font-semibold text-sm hover:underline cursor-pointer"
        >
          Back to sign in
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6D6380]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9167C2]" />
          <span>Secured by Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};
