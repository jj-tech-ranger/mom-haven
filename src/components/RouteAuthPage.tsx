import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Heart, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from '../routes';
import { createAccountWithEmail, resetPassword, signInWithEmail, signInWithGoogle } from '../lib/firebase';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

export type AuthRouteMode = 'login' | 'signup' | 'forgot';

interface Props {
  mode: AuthRouteMode;
}

export default function RouteAuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [mode]);

  const goHome = () => navigate('/');

  const friendlyError = (err: any) => {
    if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') return 'Invalid email or password. Please try again.';
    if (err?.code === 'auth/email-already-in-use') return 'An account with this email already exists. Please sign in instead.';
    if (err?.code === 'auth/weak-password') return 'Choose a password with at least 6 characters.';
    if (err?.code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (err?.code === 'auth/popup-closed-by-user') return 'Google sign-in was cancelled.';
    return err?.message || 'Something went wrong. Please try again.';
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Please enter your email address.');
        await resetPassword(email.trim());
        setMessage('If an account exists for that email, password reset instructions have been sent.');
        return;
      }

      if (!email.trim() || !password) throw new Error('Please enter your email and password.');
      if (mode === 'signup') {
        const displayName = name.trim() || email.split('@')[0];
        await createAccountWithEmail(email.trim(), password, displayName);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      navigate('/home', true);
    } catch (err: any) {
      console.error('Route authentication error', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/home', true);
    } catch (err: any) {
      console.error('Route Google authentication error', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password';
  const subtitle = mode === 'login'
    ? 'Your care journey, records, reminders, and Haven support in one place.'
    : mode === 'signup'
      ? 'Start a secure MomHaven journey for your health and family.'
      : 'We will send a secure reset link to your email address.';

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] font-body flex flex-col">
      <header className="w-full border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button type="button" onClick={goHome} className="flex items-center gap-3 cursor-pointer" aria-label="Back to MomHaven home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] p-2"><img src="/assets/logo.png" alt="MomHaven" className="h-full w-full object-contain" /></span>
            <span className="font-display text-lg font-extrabold text-[var(--haven-deep)]">MomHaven</span>
          </button>
          <div className="flex items-center gap-2"><LanguageToggle /><ThemeToggle /></div>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-1)] shadow-card-2 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden bg-[var(--haven-deep)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Heart className="h-6 w-6" /></div>
              <p className="text-xs font-display font-bold uppercase tracking-[0.18em] text-white/70">Every Mother, Every Child, Every Milestone.</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight">Calm guidance. Organized care. A place to begin.</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/75">MomHaven helps you keep your maternal and child health journey organized while keeping professional care at the center.</p>
            </div>
            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Consent-aware health sharing</div>
              <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Secure Firebase authentication</div>
            </div>
          </aside>

          <div className="p-6 sm:p-10">
            <button type="button" onClick={goHome} className="mb-6 inline-flex items-center gap-1.5 text-xs font-display font-bold text-[var(--text-secondary)] hover:text-[var(--haven-deep)] cursor-pointer"><ArrowLeft className="h-4 w-4" /> Home</button>
            <div className="max-w-md">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>

              {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>}
              {message && <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">{message}</div>}

              {mode !== 'forgot' && (
                <button type="button" onClick={google} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 py-3.5 text-sm font-display font-bold hover:bg-[var(--surface-2)] disabled:opacity-60 cursor-pointer">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-[11px] font-bold">G</span>
                  Continue with Google
                </button>
              )}

              {mode !== 'forgot' && <div className="my-5 flex items-center gap-3 text-[11px] text-[var(--text-muted)]"><span className="h-px flex-1 bg-[var(--border)]" /><span>OR</span><span className="h-px flex-1 bg-[var(--border)]" /></div>}

              <form onSubmit={submit} className="space-y-4">
                {mode === 'signup' && <div><label htmlFor="route-name" className="mb-1.5 block text-xs font-display font-bold">Name <span className="font-normal text-[var(--text-secondary)]">(optional)</span></label><input id="route-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3.5 text-sm outline-none focus:border-[var(--haven-orchid)]" placeholder="Your preferred name" /></div>}
                <div><label htmlFor="route-email" className="mb-1.5 block text-xs font-display font-bold">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" /><input id="route-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[var(--haven-orchid)]" placeholder="you@example.com" /></div></div>
                {mode !== 'forgot' && <div><label htmlFor="route-password" className="mb-1.5 block text-xs font-display font-bold">Password</label><div className="relative"><input id="route-password" type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3.5 pr-11 text-sm outline-none focus:border-[var(--haven-orchid)]" placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] cursor-pointer" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>}

                <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--haven-deep)] px-5 py-3.5 text-sm font-display font-bold text-white shadow-card-1 hover:opacity-90 disabled:opacity-60 cursor-pointer">{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}{!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}</button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
                {mode === 'login' && <button type="button" onClick={() => navigate('/forgot-password')} className="font-display font-bold text-[var(--haven-deep)] hover:underline cursor-pointer">Forgot password?</button>}
                {mode !== 'login' && <button type="button" onClick={() => navigate('/login')} className="font-display font-bold text-[var(--haven-deep)] hover:underline cursor-pointer">Already have an account? Sign in</button>}
                {mode === 'login' && <button type="button" onClick={() => navigate('/signup')} className="font-display font-bold text-[var(--haven-deep)] hover:underline cursor-pointer">Create an account</button>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
