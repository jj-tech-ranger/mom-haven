import React, { useEffect, useRef, useState } from 'react';
import { getMultiFactorResolver, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, MultiFactorResolver, MultiFactorError, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AlertCircle, ArrowLeft, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { auth, db, googleProvider } from '../lib/firebase';

interface AdminAuthProps { onSuccess?: () => void; }
type AuthStep = 'signin' | 'enroll' | 'verify';

export default function AdminAuth({ onSuccess }: AdminAuthProps) {
  const [step, setStep] = useState<AuthStep>('signin');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [phone, setPhone] = useState('');
  const [code, setCode] = useState(''); const [hint, setHint] = useState(''); const [verificationId, setVerificationId] = useState('');
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null); const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => { recaptcha.current?.clear(); recaptcha.current = null; }, []);
  const ensureAdmin = async (nextUser: User) => {
    const snap = await getDoc(doc(db, 'users', nextUser.uid));
    if (!snap.exists() || snap.data()?.role !== 'ADMIN') { await auth.signOut(); throw new Error('This account is not provisioned for MomHaven Admin access.'); }
    setUser(nextUser);
    if (multiFactor(nextUser).enrolledFactors.length === 0) setStep('enroll'); else onSuccess?.();
  };
  const getRecaptcha = () => { if (!recaptcha.current) recaptcha.current = new RecaptchaVerifier(auth, 'admin-recaptcha', { size: 'invisible' }); return recaptcha.current; };
  const sendEnrollmentCode = async () => {
    if (!user || !phone.trim()) return; setBusy(true); setError('');
    try { const provider = new PhoneAuthProvider(auth); const id = await provider.verifyPhoneNumber({ phoneNumber: phone.trim(), session: await multiFactor(user).getSession() }, getRecaptcha()); setVerificationId(id); setHint(phone.trim()); }
    catch (e: any) { setError(e?.message || 'Unable to send the verification code.'); } finally { setBusy(false); }
  };
  const confirmEnrollment = async () => {
    if (!user || !verificationId || code.length !== 6) return; setBusy(true); setError('');
    try { const credential = PhoneAuthProvider.credential(verificationId, code); await multiFactor(user).enroll(PhoneMultiFactorGenerator.assertion(credential), 'Admin phone'); onSuccess?.(); }
    catch (e: any) { setError(e?.message || 'That code is invalid or expired.'); } finally { setBusy(false); }
  };
  const startMfaChallenge = async (mfaResolver: MultiFactorResolver) => {
    setResolver(mfaResolver); const firstHint = mfaResolver.hints.find((x: any) => x.factorId === PhoneMultiFactorGenerator.FACTOR_ID); setHint(firstHint?.phoneNumber || 'your enrolled phone'); setBusy(true); setError('');
    try { if (!firstHint) throw new Error('No supported administrator two-factor method is enrolled.'); const provider = new PhoneAuthProvider(auth); const id = await provider.verifyPhoneNumber({ multiFactorHint: firstHint, session: mfaResolver.session }, getRecaptcha()); setVerificationId(id); setStep('verify'); }
    catch (e: any) { setError(e?.message || 'Unable to send the verification code.'); } finally { setBusy(false); }
  };
  const signIn = async (fn: () => Promise<User>) => {
    setBusy(true); setError('');
    try { await ensureAdmin(await fn()); }
    catch (e: any) { if (e?.code === 'auth/multi-factor-auth-required') await startMfaChallenge(getMultiFactorResolver(auth, e as MultiFactorError)); else setError(e?.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  };
  const verifyChallenge = async () => {
    if (!resolver || !verificationId || code.length !== 6) return; setBusy(true); setError('');
    try { const credential = PhoneAuthProvider.credential(verificationId, code); await resolver.resolveSignIn(PhoneMultiFactorGenerator.assertion(credential)); onSuccess?.(); }
    catch (e: any) { setError(e?.message || 'Invalid or expired verification code.'); } finally { setBusy(false); }
  };
  const title = step === 'signin' ? 'Sign in' : step === 'enroll' ? 'Set up two-factor verification' : 'Two-factor verification';
  const description = step === 'signin' ? 'Restricted platform-operations access for authorized MomHaven administrators.' : step === 'enroll' ? 'Admin accounts must enroll a phone-based Firebase MFA factor before platform access is granted.' : `Enter the 6-digit code sent to ${hint || 'your enrolled phone'}.`;
  return <div className="min-h-screen bg-[#F7F3FC] flex items-center justify-center p-6"><div className="w-full max-w-md bg-white border border-[#E5DFF0] rounded-2xl shadow-[0_16px_48px_rgba(36,20,81,0.12)] p-8">
    <div className="flex items-center gap-3 mb-7"><div className="w-11 h-11 rounded-2xl bg-[#EEE7F8] flex items-center justify-center"><LockKeyhole className="w-5 h-5 text-[#33178A]" /></div><div><p className="font-body text-[11px] uppercase tracking-[0.12em] font-bold text-[#6D6380]">MomHaven Admin</p><h1 className="font-display font-bold text-2xl text-[#241451]">{title}</h1></div></div>
    <p className="font-body text-sm leading-relaxed text-[#6D6380] mb-6">{description}</p>
    {step === 'signin' && <form onSubmit={e => { e.preventDefault(); void signIn(() => signInWithEmailAndPassword(auth, email.trim(), password).then(r => r.user)); }} className="space-y-4">
      <label className="block"><span className="font-body text-xs font-bold text-[#241451]">Work email</span><input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" required className="mt-1.5 w-full rounded-[14px] border border-[#E5DFF0] px-4 py-3 text-sm outline-none focus:border-[#9167C2]" /></label>
      <label className="block"><span className="font-body text-xs font-bold text-[#241451]">Password</span><input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-[14px] border border-[#E5DFF0] px-4 py-3 text-sm outline-none focus:border-[#9167C2]" /></label>
      <button disabled={busy} className="w-full rounded-full py-3.5 text-white font-display font-bold disabled:opacity-50" style={{ background: 'var(--grad-haven)' }}>{busy ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Sign in'}</button>
      <button type="button" onClick={() => { void signIn(async () => (await signInWithPopup(auth, googleProvider)).user); }} disabled={busy} className="w-full rounded-full py-3 border border-[#E5DFF0] text-[#33178A] font-display font-bold disabled:opacity-50">Continue with Google</button>
      <button type="button" onClick={() => { if (!email.trim()) { setError('Enter your work email first.'); return; } void sendPasswordResetEmail(auth, email.trim()).then(() => setError('If that work email is registered, a password-reset message has been sent.')).catch((e: any) => setError(e?.message || 'Unable to send reset email.')); }} className="w-full text-sm text-[#33178A] font-display font-semibold">Forgot password?</button>
    </form>}
    {step === 'enroll' && <div className="space-y-4"><div className="rounded-xl bg-[#F7F3FC] p-4 flex gap-3"><ShieldCheck className="w-5 h-5 text-[#33178A] shrink-0"/><p className="text-xs text-[#6D6380]">This uses Firebase Authentication's phone-based multi-factor support. No weaker local code is substituted for MFA.</p></div><label className="block"><span className="font-body text-xs font-bold text-[#241451]">Mobile number</span><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+254…" className="mt-1.5 w-full rounded-[14px] border border-[#E5DFF0] px-4 py-3 text-sm outline-none focus:border-[#9167C2]" /></label><button onClick={() => void sendEnrollmentCode()} disabled={busy || !phone.trim()} className="w-full rounded-full py-3.5 text-white font-display font-bold disabled:opacity-50" style={{ background: 'var(--grad-haven)' }}>{busy ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Send code'}</button>{verificationId && <><label className="block"><span className="font-body text-xs font-bold text-[#241451]">6-digit code</span><input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-1.5 w-full rounded-[14px] border border-[#E5DFF0] px-4 py-3 text-center tracking-[0.35em] text-lg font-bold" /></label><button onClick={() => void confirmEnrollment()} disabled={busy || code.length !== 6} className="w-full rounded-full py-3.5 text-white font-display font-bold disabled:opacity-50" style={{ background: 'var(--grad-haven)' }}>Verify code</button></>}</div>}
    {step === 'verify' && <div className="space-y-4"><div className="rounded-xl bg-[#F7F3FC] p-4"><p className="text-xs text-[#6D6380]">Code sent to <span className="font-bold text-[#241451]">{hint}</span>.</p></div><label className="block"><span className="font-body text-xs font-bold text-[#241451]">6-digit code</span><input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-1.5 w-full rounded-[14px] border border-[#E5DFF0] px-4 py-3 text-center tracking-[0.35em] text-lg font-bold" /></label><button onClick={() => void verifyChallenge()} disabled={busy || code.length !== 6} className="w-full rounded-full py-3.5 text-white font-display font-bold disabled:opacity-50" style={{ background: 'var(--grad-haven)' }}>{busy ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Verify code'}</button><button onClick={() => { setCode(''); if (resolver) void startMfaChallenge(resolver); }} className="w-full text-sm text-[#33178A] font-display font-semibold">Resend code</button></div>}
    {error && <div className="mt-5 rounded-xl bg-[#FCE7EA] px-4 py-3 flex gap-2 text-sm text-[#C4283C]"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/><span>{error}</span></div>}
    {step !== 'signin' && <button onClick={() => { setStep('signin'); setCode(''); setVerificationId(''); setResolver(null); void auth.signOut(); }} className="mt-5 flex items-center gap-2 text-sm text-[#6D6380] font-display font-semibold"><ArrowLeft className="w-4 h-4"/>Back to sign in</button>}<div id="admin-recaptcha" /></div></div>;
}
