import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import Button from '../Button';

interface CreateAccountScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onSignIn: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignUp: (email: string, pass: string, name: string) => Promise<void>;
  googleLoading?: boolean;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({
  onBack,
  onSignIn,
  onGoogleSignIn,
  onEmailSignUp,
  googleLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation touched states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPassValid = password.length >= 8;
  const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPassTouched(true);
    setConfirmTouched(true);
    setErrorMessage(null);

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isPassValid) {
      setErrorMessage('Password must be at least 8 characters long (weak password error).');
      return;
    }
    if (!isConfirmValid) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      await onEmailSignUp(email.trim(), password, '');
    } catch (err: any) {
      console.error('Sign-up error:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('This email address is already taken. Please sign in or use another email.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Weak password error: Please choose a stronger password with at least 8 characters.');
      } else {
        setErrorMessage(err?.message || 'Account creation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0]">
      {/* Top App Bar with back chevron */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-[#E5DFF0] flex items-center justify-center text-[#33178A] hover:bg-[#EAE3F7] transition-colors cursor-pointer"
            aria-label="Back to welcome"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-display font-bold text-[#9167C2] tracking-wider uppercase">
            M-AUTH-003
          </span>
        </div>

        {/* Hero Card Accent (135° Gradient on Hero Blocks only) */}
        <div className="rounded-[20px] p-4 mb-4 text-white shadow-card-1 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, #33178A 0%, #5B2CA0 60%, #9167C2 100%)',
          }}
        >
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Create account
          </h1>
          <p className="font-body text-xs text-white/85 mt-1 leading-relaxed">
            Begin your maternal &amp; child health journey with Kenya MCH handbook standards.
          </p>
        </div>

        {/* Important Error Banner (Weak-password / Email-taken) */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-[20px] bg-[#FFF1F2] border border-[#E11D3C] text-[#E11D3C] text-xs flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#E5DFF0] shadow-card-1 space-y-3.5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-display font-bold text-[#241451] mb-1">
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
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[#F7F3FC] rounded-input border text-sm text-[#241451] focus:outline-none transition-colors ${
                    emailTouched && !isEmailValid
                      ? 'border-[#E11D3C] focus:border-[#E11D3C]'
                      : 'border-[#E5DFF0] focus:border-[#9167C2]'
                  }`}
                />
              </div>
              {emailTouched && !isEmailValid && (
                <p className="text-[11px] text-[#E11D3C] mt-0.5">Please enter a valid email address.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-[#241451] mb-1">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6D6380]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setPassTouched(true)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 bg-[#F7F3FC] rounded-input border text-sm text-[#241451] focus:outline-none transition-colors ${
                    passTouched && !isPassValid
                      ? 'border-[#E11D3C] focus:border-[#E11D3C]'
                      : 'border-[#E5DFF0] focus:border-[#9167C2]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[#6D6380] hover:text-[#241451] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passTouched && !isPassValid && (
                <p className="text-[11px] text-[#E11D3C] mt-0.5">Password must be at least 8 characters.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-[#241451] mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6D6380]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setConfirmTouched(true)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 bg-[#F7F3FC] rounded-input border text-sm text-[#241451] focus:outline-none transition-colors ${
                    confirmTouched && !isConfirmValid
                      ? 'border-[#E11D3C] focus:border-[#E11D3C]'
                      : 'border-[#E5DFF0] focus:border-[#9167C2]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-2.5 text-[#6D6380] hover:text-[#241451] cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmTouched && !isConfirmValid && (
                <p className="text-[11px] text-[#E11D3C] mt-0.5">Passwords do not match.</p>
              )}
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E5DFF0] text-[#33178A] focus:ring-[#9167C2]"
              />
              <span className="text-xs text-[#6D6380] leading-snug font-body">
                I agree to the <span className="text-[#33178A] font-semibold underline">Terms &amp; Privacy Policy</span>.
              </span>
            </label>

            {/* Primary Action Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || googleLoading}
              className="mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#E5DFF0]" />
            <span className="text-[11px] text-[#6D6380] font-body">or</span>
            <div className="flex-1 h-px bg-[#E5DFF0]" />
          </div>

          {/* Secondary Action: Continue with Google */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-pill bg-white border-[1.5px] border-[#33178A] text-[#33178A] font-display font-semibold text-sm hover:bg-[#EAE3F7] active:scale-[0.98] flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#33178A]" />
                <span>Connecting to Google...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#9167C2]" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Footer: Sign in instead */}
      <div className="pt-3 pb-1 text-center">
        <p className="text-sm font-body text-[#6D6380]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSignIn}
            className="text-[#33178A] font-display font-bold hover:underline cursor-pointer ml-1"
          >
            Sign in instead
          </button>
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#6D6380]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9167C2]" />
          <span>Compliant with Kenya Data Protection Act 2019</span>
        </div>
      </div>
    </div>
  );
};
