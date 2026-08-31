import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import Button from '../Button';

interface CreateAccountScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onSignIn: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignUp: (email: string, pass: string, name: string) => Promise<void>;
  googleLoading?: boolean;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ onBack, onSignIn, onGoogleSignIn, onEmailSignUp, googleLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 8;
  const validConfirm = confirmPassword.length > 0 && confirmPassword === password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    setErrorMessage(null);
    if (!validEmail) return setErrorMessage('Please enter a valid email address.');
    if (!validPassword) return setErrorMessage('Password must be at least 8 characters.');
    if (!validConfirm) return setErrorMessage('Passwords do not match.');
    if (!agreeTerms) return setErrorMessage('Please accept the Terms & Privacy Policy to continue.');
    setLoading(true);
    try {
      await onEmailSignUp(email.trim(), password, '');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setErrorMessage('This email is already in use. Try signing in instead.');
      else if (code === 'auth/weak-password') setErrorMessage('That password is too weak. Please choose a stronger password.');
      else setErrorMessage(err?.message || 'We could not create your account. Please try again.');
    } finally { setLoading(false); }
  };

  const fieldClass = (invalid: boolean) => `w-full rounded-[14px] border bg-[#F7F3FC] py-3 text-sm text-[#241451] outline-none transition-colors ${invalid ? 'border-[#E11D3C]' : 'border-[#E5DFF0] focus:border-[#9167C2]'}`;

  return (
    <main className="min-h-[760px] w-full max-w-[430px] mx-auto rounded-[32px] overflow-hidden bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0] shadow-[0_24px_70px_rgba(51,23,138,0.14)]">
      <div className="px-6 pt-6 pb-6">
        <button type="button" onClick={onBack} aria-label="Back to welcome" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DFF0] bg-white text-[#33178A] shadow-sm"><ArrowLeft className="h-5 w-5" /></button>
        <div className="mt-7">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#9167C2]">Your space, your journey</p>
          <h1 className="mt-1 font-display text-[32px] font-bold leading-tight">Create your account</h1>
          <p className="mt-2 font-body text-sm leading-6 text-[#6D6380]">A private place to keep your MomHaven journey together.</p>
        </div>
      </div>

      <div className="mx-4 rounded-[24px] border border-[#E5DFF0] bg-white p-5 shadow-[0_8px_24px_rgba(51,23,138,0.07)]">
        {errorMessage && <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-[16px] border border-[#E11D3C]/40 bg-[#FCE7EA] p-3.5 text-xs leading-5 text-[#C4283C]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="create-email" className="mb-1.5 block font-display text-xs font-bold">Email address</label>
            <div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A79CBC]" /><input id="create-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setErrorMessage(null); }} onBlur={() => setTouched(t => ({ ...t, email: true }))} placeholder="you@example.com" autoComplete="email" className={`${fieldClass(touched.email && !validEmail)} pl-10 pr-3.5`} /></div>
            {touched.email && !validEmail && <p className="mt-1 text-[11px] text-[#C4283C]">Enter a valid email address.</p>}
          </div>

          <div>
            <label htmlFor="create-password" className="mb-1.5 block font-display text-xs font-bold">Password</label>
            <div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A79CBC]" /><input id="create-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrorMessage(null); }} onBlur={() => setTouched(t => ({ ...t, password: true }))} placeholder="At least 8 characters" autoComplete="new-password" className={`${fieldClass(touched.password && !validPassword)} pl-10 pr-11`} /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-3 text-[#6D6380]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            <p className={`mt-1 text-[11px] ${touched.password && !validPassword ? 'text-[#C4283C]' : 'text-[#6D6380]'}`}>Use 8 or more characters.</p>
          </div>

          <div>
            <label htmlFor="create-confirm" className="mb-1.5 block font-display text-xs font-bold">Confirm password</label>
            <div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A79CBC]" /><input id="create-confirm" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrorMessage(null); }} onBlur={() => setTouched(t => ({ ...t, confirm: true }))} placeholder="Repeat your password" autoComplete="new-password" className={`${fieldClass(touched.confirm && !validConfirm)} pl-10 pr-11`} /><button type="button" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-3 text-[#6D6380]">{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {touched.confirm && !validConfirm && <p className="mt-1 text-[11px] text-[#C4283C]">Passwords do not match.</p>}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#F7F3FC] p-3">
            <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#33178A]" />
            <span className="font-body text-xs leading-5 text-[#6D6380]">I agree to the <span className="font-semibold text-[#33178A] underline underline-offset-2">Terms &amp; Privacy Policy</span>.</span>
          </label>

          <Button type="submit" variant="primary" disabled={loading || googleLoading}>{loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating account…</span> : 'Create account'}</Button>
        </form>

        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-[#E5DFF0]" /><span className="font-body text-[11px] text-[#A79CBC]">or</span><span className="h-px flex-1 bg-[#E5DFF0]" /></div>
        <button type="button" onClick={onGoogleSignIn} disabled={loading || googleLoading} className="flex w-full items-center justify-center gap-3 rounded-[28px] border-[1.5px] border-[#33178A] bg-white px-5 py-3.5 font-display text-sm font-semibold text-[#33178A] hover:bg-[#F7F3FC] disabled:opacity-60"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#E5DFF0] text-xs font-bold">G</span>{googleLoading ? 'Connecting…' : 'Continue with Google'}</button>
      </div>

      <div className="px-6 pb-7 pt-6 text-center"><p className="font-body text-sm text-[#6D6380]">Already have an account? <button type="button" onClick={onSignIn} className="font-display font-bold text-[#33178A] hover:underline">Sign in</button></p><div className="mt-5 flex items-center justify-center gap-2 font-body text-[11px] text-[#6D6380]"><ShieldCheck className="h-4 w-4 text-[#9167C2]" />Your health information stays private and yours.</div></div>
    </main>
  );
};
