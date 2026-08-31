import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
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

export const SignInScreen: React.FC<SignInScreenProps> = ({ onBack, onCreateAccount, onForgotPassword, onGoogleSignIn, onEmailSignIn, googleLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPassValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPassTouched(true);
    setErrorMessage(null);
    if (!isEmailValid) return setErrorMessage('Please enter a valid email address.');
    if (!isPassValid) return setErrorMessage('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await onEmailSignIn(email.trim(), password);
    } catch (err: any) {
      const code = err?.code || '';
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(code)) {
        setErrorMessage('The email or password is not correct. Please try again or reset your password.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many unsuccessful attempts. Please wait a moment or reset your password.');
      } else {
        setErrorMessage(err?.message || 'Sign in failed. Please check your connection and try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-[760px] w-full max-w-[430px] mx-auto rounded-[32px] overflow-hidden bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0] shadow-[0_24px_70px_rgba(51,23,138,0.14)]">
      <div className="px-6 pt-6 pb-7">
        <button type="button" onClick={onBack} aria-label="Back to welcome" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DFF0] bg-white text-[#33178A] shadow-sm hover:bg-[#F7F3FC]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-7">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#9167C2]">Welcome back</p>
          <h1 className="mt-1 font-display text-[32px] font-bold leading-tight text-[#241451]">Sign in to MomHaven</h1>
          <p className="mt-2 max-w-[330px] font-body text-sm leading-6 text-[#6D6380]">Pick up where you left off in your mother and baby journey.</p>
        </div>
      </div>

      <div className="mx-4 rounded-[24px] border border-[#E5DFF0] bg-white p-5 shadow-[0_8px_24px_rgba(51,23,138,0.07)]">
        {errorMessage && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-[16px] border border-[#E11D3C]/40 bg-[#FCE7EA] p-3.5 text-xs leading-5 text-[#C4283C]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="mb-1.5 block font-display text-xs font-bold text-[#241451]">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A79CBC]" />
              <input id="signin-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setErrorMessage(null); }} onBlur={() => setEmailTouched(true)} placeholder="you@example.com" autoComplete="email" className={`w-full rounded-[14px] border bg-[#F7F3FC] py-3 pl-10 pr-3.5 text-sm outline-none transition-colors ${emailTouched && !isEmailValid ? 'border-[#E11D3C]' : 'border-[#E5DFF0] focus:border-[#9167C2]'}`} />
            </div>
            {emailTouched && !isEmailValid && <p className="mt-1 text-[11px] text-[#C4283C]">Enter a valid email address.</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="signin-password" className="font-display text-xs font-bold text-[#241451]">Password</label>
              <button type="button" onClick={onForgotPassword} className="font-display text-xs font-semibold text-[#33178A] hover:underline">Forgot password?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A79CBC]" />
              <input id="signin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrorMessage(null); }} onBlur={() => setPassTouched(true)} placeholder="Your password" autoComplete="current-password" className={`w-full rounded-[14px] border bg-[#F7F3FC] py-3 pl-10 pr-11 text-sm outline-none transition-colors ${passTouched && !isPassValid ? 'border-[#E11D3C]' : 'border-[#E5DFF0] focus:border-[#9167C2]'}`} />
              <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-3 text-[#6D6380]">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passTouched && !isPassValid && <p className="mt-1 text-[11px] text-[#C4283C]">Password must be at least 8 characters.</p>}
          </div>

          <Button type="submit" variant="primary" disabled={loading || googleLoading} className="mt-2">{loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Signing in…</span> : 'Sign in'}</Button>
        </form>

        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-[#E5DFF0]" /><span className="font-body text-[11px] text-[#A79CBC]">or</span><span className="h-px flex-1 bg-[#E5DFF0]" /></div>

        <button type="button" onClick={onGoogleSignIn} disabled={loading || googleLoading} className="flex w-full items-center justify-center gap-3 rounded-[28px] border-[1.5px] border-[#33178A] bg-white px-5 py-3.5 font-display text-sm font-semibold text-[#33178A] hover:bg-[#F7F3FC] disabled:opacity-60">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#E5DFF0] text-xs font-bold">G</span>
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>
      </div>

      <div className="px-6 pb-7 pt-6 text-center">
        <p className="font-body text-sm text-[#6D6380]">New to MomHaven? <button type="button" onClick={onCreateAccount} className="font-display font-bold text-[#33178A] hover:underline">Create account</button></p>
        <div className="mt-5 flex items-center justify-center gap-2 font-body text-[11px] text-[#6D6380]"><ShieldCheck className="h-4 w-4 text-[#9167C2]" />Your health information stays private and yours.</div>
      </div>
    </main>
  );
};
