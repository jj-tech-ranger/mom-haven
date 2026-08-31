import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import Button from '../Button';

interface SignInScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
  googleLoading?: boolean;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onBack,
  onCreateAccount,
  onForgotPassword,
  onGoogleSignIn,
  onEmailSignIn,
  googleLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPassValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPassTouched(true);
    setErrorMessage(null);

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isPassValid) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await onEmailSignIn(email.trim(), password);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMessage('Invalid credentials. Please check your email and password or reset your password.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many unsuccessful sign-in attempts. Please wait a moment or reset your password.');
      } else {
        setErrorMessage(err?.message || 'Sign in failed. Please check your network connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0]">
      {/* Top App Bar: Back Chevron + Title */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-[#E5DFF0] flex items-center justify-center text-[#33178A] hover:bg-[#EAE3F7] transition-colors cursor-pointer"
            aria-label="Back to welcome"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-display font-bold text-[#9167C2] tracking-wider uppercase">
            M-AUTH-002
          </span>
        </div>

        {/* Hero Card Accent (135° Gradient on Hero Blocks only) */}
        <div className="rounded-[20px] p-5 mb-5 text-white shadow-card-1 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, #33178A 0%, #5B2CA0 60%, #9167C2 100%)',
          }}
        >
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Welcome back, Mama
          </h1>
          <p className="font-body text-xs text-white/85 mt-1 leading-relaxed">
            Sign in to access your maternal health records and care journey.
          </p>
        </div>

        {/* Error Banner for Invalid Credentials */}
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
              {emailTouched && !isEmailValid && (
                <p className="text-[11px] text-[#E11D3C] mt-1">Please provide a valid email address.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-display font-bold text-[#241451]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-[#33178A] font-display font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
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
                  className={`w-full pl-10 pr-11 py-3 bg-[#F7F3FC] rounded-input border text-sm text-[#241451] focus:outline-none transition-colors ${
                    passTouched && !isPassValid
                      ? 'border-[#E11D3C] focus:border-[#E11D3C]'
                      : 'border-[#E5DFF0] focus:border-[#9167C2]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#6D6380] hover:text-[#241451] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passTouched && !isPassValid && (
                <p className="text-[11px] text-[#E11D3C] mt-1">Password must be at least 8 characters.</p>
              )}
            </div>

            {/* Primary Full-pill Gradient Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || googleLoading}
              className="mt-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#E5DFF0]" />
            <span className="text-[11px] text-[#6D6380] font-body">or</span>
            <div className="flex-1 h-px bg-[#E5DFF0]" />
          </div>

          {/* Secondary Action: White with 1.5px deep-purple border */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 rounded-pill bg-white border-[1.5px] border-[#33178A] text-[#33178A] font-display font-semibold text-sm hover:bg-[#EAE3F7] active:scale-[0.98] flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
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

      {/* Bottom Footer */}
      <div className="pt-4 pb-1 text-center">
        <p className="text-sm font-body text-[#6D6380]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onCreateAccount}
            className="text-[#33178A] font-display font-bold hover:underline cursor-pointer ml-1"
          >
            Create account
          </button>
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#6D6380]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9167C2]" />
          <span>Encrypted with Kenyan data protection standards</span>
        </div>
      </div>
    </div>
  );
};
