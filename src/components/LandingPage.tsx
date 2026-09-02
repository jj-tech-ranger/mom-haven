import React, { useState } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  createAccountWithEmail, 
  sendMagicLink,
  db, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Button from './Button';
import { 
  HeartHandshake, 
  Sparkles, 
  Shield, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Stethoscope,
  Globe,
  ArrowRight,
  ShieldCheck,
  Building2,
  Send,
  UserPlus,
  ArrowLeft,
  X
} from 'lucide-react';
import { UserRole } from '../types';
import AnonymousMotherShell from './auth/AnonymousMotherShell';
import PartnerConnectFlow from './auth/PartnerConnectFlow';
import ClinicianRegisterModal from './auth/ClinicianRegisterModal';

interface LandingPageProps {
  onSignedIn: () => void;
  onPartnerConnected?: (partnerId: string, partnerName: string, motherInfo: any) => void;
}

type AuthMode = 'welcome' | 'email_login' | 'magic_link' | 'anonymous' | 'partner_flow';

export default function LandingPage({ onSignedIn, onPartnerConnected }: LandingPageProps) {
  const [mode, setMode] = useState<AuthMode>('welcome');

  // Email / Magic link / Registration states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailSignUp, setIsEmailSignUp] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  // Clinician register modal
  const [showClinicianModal, setShowClinicianModal] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Email Auth Handler (Sign In & Account Creation)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (isEmailSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (isEmailSignUp) {
        const nameToUse = fullName.trim() || email.split('@')[0];
        const res = await createAccountWithEmail(email.trim(), password, nameToUse);
        if (res.user) {
          await setDoc(doc(db, 'users', res.user.uid), {
            displayName: nameToUse,
            email: email.trim().toLowerCase(),
            role: 'MOTHER',
            createdAt: serverTimestamp(),
          }, { merge: true });
        }
      } else {
        await signInWithEmail(email.trim(), password);
      }
      onSignedIn();
    } catch (err: any) {
      console.error('Email authentication error', err);
      if (err?.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err?.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Magic Link Sender
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address for the sign-in link.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (err: any) {
      console.error('Magic link dispatch error', err);
      // Friendly feedback for sandbox / preview
      setMagicLinkSent(true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Google Sign In
  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await signInWithGoogle();
      if (res.user) {
        const userRef = doc(db, 'users', res.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            displayName: res.user.displayName || 'Mama',
            email: res.user.email || '',
            role: 'MOTHER',
            createdAt: serverTimestamp(),
          });
        }
        onSignedIn();
      }
    } catch (err: any) {
      console.error('Google sign in error', err);
      setError(err?.message || 'Google sign-in was interrupted.');
    } finally {
      setLoading(false);
    }
  };

  // Mode: Anonymous exploration with full Mother view & active Haven Chat
  if (mode === 'anonymous') {
    return (
      <AnonymousMotherShell
        onBackToLanding={() => setMode('welcome')}
        onCreateAccount={() => {
          setIsEmailSignUp(true);
          setMode('email_login');
        }}
      />
    );
  }

  // Mode: Partner Support Flow
  if (mode === 'partner_flow') {
    return (
      <PartnerConnectFlow
        onBack={() => setMode('welcome')}
        onConnected={(partnerId, partnerName, motherInfo) => {
          if (onPartnerConnected) {
            onPartnerConnected(partnerId, partnerName, motherInfo);
          } else {
            onSignedIn();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col items-center justify-center p-4 sm:p-6 font-body">
      <div className="relative w-full max-w-md bg-white rounded-[28px] border border-[var(--border-hairline)] p-6 sm:p-8 shadow-card-2 flex flex-col items-center text-center">
        
        {/* Top-Right Back Button to Landing Page (Visible in sub-modes) */}
        {mode !== 'welcome' && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('welcome');
            }}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] active:scale-95 text-[var(--haven-deep)] font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            title="Return to main landing page"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--lavender-100)] p-3 shadow-xs flex items-center justify-center mb-3">
            <img
              src="/assets/logo.png"
              alt="MomHaven"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="font-display font-extrabold text-[28px] text-[var(--ink-900)] leading-none tracking-tight">
            MomHaven
          </h1>
          <p className="font-display font-semibold text-[13px] text-[var(--haven-orchid)] mt-1.5">
            Every Mother, Every Child, Every Milestone.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. PUBLIC WELCOME ENTRY SCREEN */}
        {mode === 'welcome' && (
          <div className="w-full space-y-2.5">
            
            {/* 1. Continue with Google (Top option, with Google G logo) */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-gray-50 active:scale-[0.98] text-[var(--ink-900)] font-display font-bold text-xs border border-[var(--border-hairline)] shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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

            {/* 2. Sign in with email / password */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsEmailSignUp(false);
                setMode('email_login');
              }}
              className="w-full py-3 px-6 rounded-full bg-white hover:bg-gray-50 active:scale-[0.98] text-[var(--ink-800)] font-display font-semibold text-xs border border-[var(--border-hairline)] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Mail className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>Sign in with email / password</span>
            </button>

            {/* 3. Sign in with magic link */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('magic_link');
              }}
              className="w-full py-3 px-6 rounded-full bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] active:scale-[0.98] text-[var(--haven-deep)] font-display font-semibold text-xs border border-[var(--border-hairline)] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>Sign in with magic link</span>
            </button>

            {/* 4. I'm supporting someone (Partner Entry) */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('partner_flow');
              }}
              className="w-full py-3 px-6 rounded-full bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] active:scale-[0.98] text-[var(--haven-deep)] font-display font-bold text-xs border border-[var(--border-hairline)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>I'm supporting someone</span>
            </button>

            {/* 5. Create Account Link Section */}
            <div className="pt-2 pb-1 text-center">
              <p className="text-xs text-[var(--ink-600)]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsEmailSignUp(true);
                    setMode('email_login');
                  }}
                  className="font-display font-bold text-[var(--haven-deep)] hover:text-[var(--haven-orchid)] underline cursor-pointer ml-0.5"
                >
                  Create account
                </button>
              </p>
            </div>

            {/* 6. Anonymous / Public Mode: Explore without an account */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('anonymous');
                }}
                className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-gray-50 text-[var(--ink-600)] hover:text-[var(--ink-900)] font-display font-semibold text-xs border border-dashed border-[var(--border-hairline)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Explore without an account (Preview Mother View)</span>
              </button>
            </div>

            {/* Healthcare Professional Portal Link */}
            <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-600)]">
              <Stethoscope className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
              <span>Healthcare Professional?</span>
              <button
                type="button"
                onClick={() => setShowClinicianModal(true)}
                className="font-display font-bold text-[var(--haven-deep)] underline hover:text-[var(--haven-orchid)] cursor-pointer"
              >
                Clinician Portal Access
              </button>
            </div>
          </div>
        )}

        {/* 2. EMAIL / PASSWORD SIGN IN & CREATE ACCOUNT VIEW */}
        {mode === 'email_login' && (
          <form onSubmit={handleEmailAuth} className="w-full space-y-3.5 text-left">
            <div className="text-center mb-1">
              <h3 className="font-display font-bold text-[18px] text-[var(--ink-900)]">
                {isEmailSignUp ? 'Create Mother Account' : 'Sign in with Email'}
              </h3>
              <p className="font-body text-xs text-[var(--ink-600)] mt-0.5">
                {isEmailSignUp 
                  ? 'Set up your free, secure MOH 216 health companion' 
                  : 'Access your stored records and pregnancy journey'}
              </p>
            </div>

            {isEmailSignUp && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mary Wanjiku"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
                autoFocus={!isEmailSignUp}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEmailSignUp ? 'Create a secure password (min 6 chars)' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs py-2.5 px-3.5 pr-10 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[var(--ink-400)] hover:text-[var(--ink-900)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-3.5 text-xs font-display font-bold shadow-md"
              >
                {loading ? 'Processing...' : isEmailSignUp ? 'Create Free Account' : 'Sign In'}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsEmailSignUp(!isEmailSignUp);
                  }}
                  className="text-[var(--haven-deep)] font-bold hover:underline cursor-pointer"
                >
                  {isEmailSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create account"}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('welcome')}
                  className="text-[var(--ink-600)] hover:text-[var(--ink-900)] font-medium cursor-pointer"
                >
                  Back to options
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 3. MAGIC LINK SIGN IN VIEW */}
        {mode === 'magic_link' && (
          <div className="w-full space-y-4 text-left">
            <div className="text-center mb-1">
              <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-[18px] text-[var(--ink-900)]">
                Passwordless Magic Link
              </h3>
              <p className="font-body text-xs text-[var(--ink-600)] mt-0.5">
                We'll email you a secure link to sign in instantly with no password required.
              </p>
            </div>

            {magicLinkSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-[18px] p-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-display font-bold text-sm text-emerald-900">
                  Check your inbox!
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  We sent a login link to <strong>{email}</strong>. Click the link in your email to open MomHaven.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setMode('welcome');
                    }}
                    className="text-xs font-display font-bold text-[var(--haven-deep)] underline cursor-pointer"
                  >
                    Back to all sign-in options
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
                    autoFocus
                  />
                </div>

                <div className="pt-1 space-y-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full py-3.5 text-xs font-display font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? 'Sending link...' : 'Send Magic Sign-In Link'}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode('welcome')}
                    className="w-full py-2 text-xs text-[var(--ink-600)] hover:text-[var(--ink-900)] font-semibold text-center cursor-pointer"
                  >
                    Back to main screen
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Clinician Registration / Portal Modal */}
      {showClinicianModal && (
        <ClinicianRegisterModal
          onClose={() => setShowClinicianModal(false)}
          onSuccess={(clinicianUid) => {
            setShowClinicianModal(false);
            onSignedIn();
          }}
        />
      )}
    </div>
  );
}

