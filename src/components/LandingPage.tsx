import React, { useState } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  createAccountWithEmail, 
  sendMagicLink,
  resetPassword,
  db, 
} from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Button from './Button';
import { 
  Heart, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Activity,
  MessageSquare,
  Users,
  ShieldCheck,
  Stethoscope,
  Lock,
  Baby,
  Calendar,
  Share2,
  FileCheck,
  ChevronRight,
  X
} from 'lucide-react';
import AnonymousMotherShell from './auth/AnonymousMotherShell';
import PartnerConnectFlow from './auth/PartnerConnectFlow';
import ClinicianRegisterModal from './auth/ClinicianRegisterModal';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { usePreferences } from '../context/PreferencesContext';

interface LandingPageProps {
  onSignedIn: () => void;
  onPartnerConnected?: (partnerId: string, partnerName: string, motherInfo: any) => void;
}

type AuthModalMode = 'signin' | 'signup' | 'magic_link' | 'forgot_password' | null;

export default function LandingPage({ onSignedIn, onPartnerConnected }: LandingPageProps) {
  const { t, language } = usePreferences();

  // Navigation & view states
  const [view, setView] = useState<'landing' | 'anonymous' | 'partner_flow'>('landing');
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);
  
  // Anonymous shell initial tab & prompt config
  const [anonTab, setAnonTab] = useState<'today' | 'journey' | 'haven' | 'records' | 'profile'>('today');
  const [anonPrompt, setAnonPrompt] = useState<string | undefined>(undefined);

  // Auth form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Clinician register modal
  const [showClinicianModal, setShowClinicianModal] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick helper to launch anonymous exploration
  const handleLaunchAnonymous = (tab: 'today' | 'journey' | 'haven' | 'records' | 'profile' = 'today', prompt?: string) => {
    setAnonTab(tab);
    setAnonPrompt(prompt);
    setView('anonymous');
  };

  // 1. Email Auth Handler (Sign In & Account Creation)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(language === 'sw' ? 'Tafadhali weka barua pepe na nenosiri.' : 'Please enter both email and password.');
      return;
    }

    if (authModal === 'signup' && password.length < 6) {
      setError(language === 'sw' ? 'Nenosiri lazima liwe na herufi zisizopungua 6.' : 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (authModal === 'signup') {
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
      setAuthModal(null);
      onSignedIn();
    } catch (err: any) {
      console.error('Email authentication error', err);
      if (err?.code === 'auth/email-already-in-use') {
        setError(language === 'sw' ? 'Akaunti yenye barua pepe hii tayari ipo. Tafadhali ingia.' : 'An account with this email already exists. Please sign in instead.');
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setError(language === 'sw' ? 'Barua pepe au nenosiri si sahihi. Tafadhali jaribu tena.' : 'Invalid email or password. Please try again.');
      } else {
        setError(err?.message || (language === 'sw' ? 'Hitilafu ya uthibitishaji. Tafadhali jaribu tena.' : 'Authentication error. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Magic Link Sender
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'sw' ? 'Tafadhali weka barua pepe yako.' : 'Please enter your email address for the sign-in link.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (err: any) {
      console.error('Magic link dispatch error', err);
      setMagicLinkSent(true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'sw' ? 'Tafadhali weka barua pepe yako kubadilisha nenosiri.' : 'Please enter your email address to reset your password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await resetPassword(email.trim());
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error', err);
      setResetEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  // 4. Google Sign In
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
        setAuthModal(null);
        onSignedIn();
      }
    } catch (err: any) {
      console.error('Google sign in error', err);
      setError(err?.message || (language === 'sw' ? 'Kuingia kwa Google kulikatizwa.' : 'Google sign-in was interrupted.'));
    } finally {
      setLoading(false);
    }
  };

  // Mode: Anonymous exploration with full Mother view & active Haven Chat
  if (view === 'anonymous') {
    return (
      <AnonymousMotherShell
        onBackToLanding={() => setView('landing')}
        onCreateAccount={() => {
          setView('landing');
          setError(null);
          setAuthModal('signup');
        }}
        initialTab={anonTab}
        initialPrompt={anonPrompt}
      />
    );
  }

  // Mode: Supporting someone (Partner connect / pairing)
  if (view === 'partner_flow') {
    return (
      <PartnerConnectFlow
        onBack={() => setView('landing')}
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
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] font-body selection:bg-[var(--surface-3)]">
      
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR WITH GLOBAL PREFERENCE CONTROLS */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[var(--surface-1)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] p-2 shadow-2xs flex items-center justify-center">
            <img
              src="/assets/logo.png"
              alt="MomHaven Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg sm:text-xl text-[var(--haven-deep)] tracking-tight block leading-tight">
              MomHaven
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-[var(--haven-orchid)]">
              {t('header.tagline')}
            </span>
          </div>
        </div>

        {/* Global Preference Controls + Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle (EN | SW) */}
          <LanguageToggle />

          {/* Theme Toggle (☀️ / 🌙) */}
          <ThemeToggle />

          <button
            type="button"
            onClick={() => handleLaunchAnonymous('today')}
            className="text-xs font-display font-semibold text-[var(--text-primary)] hover:text-[var(--haven-orchid)] px-3 py-1.5 rounded-full hover:bg-[var(--surface-2)] transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1.5"
          >
            <span>{t('header.preview')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setAuthModal('signin');
            }}
            className="text-xs font-display font-bold text-[var(--text-primary)] px-3.5 sm:px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-all cursor-pointer shadow-2xs"
          >
            {t('header.signIn')}
          </button>

          <button
            type="button"
            onClick={() => handleLaunchAnonymous('today')}
            className="text-xs font-display font-bold text-white bg-[var(--haven-deep)] hover:opacity-90 px-4 sm:px-5 py-2 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {t('header.explore')}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: IMMEDIATELY ESTABLISH THE PROMISE */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--haven-deep)] font-display font-semibold text-xs mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
          <span>{t('hero.badge')}</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-[var(--text-primary)] tracking-tight leading-[1.15] mb-4">
          {t('hero.title')}
        </h1>

        <p className="font-display font-bold text-lg sm:text-2xl text-[var(--haven-orchid)] tracking-tight mb-4">
          {t('hero.subtitle')}
        </p>

        <p className="font-body text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed mb-8">
          {t('hero.description')}
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          {/* Dominant Primary CTA */}
          <button
            type="button"
            onClick={() => handleLaunchAnonymous('today')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--haven-deep)] hover:opacity-90 active:scale-[0.98] text-white font-display font-bold text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
          >
            <span>{t('hero.primaryCta')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Secondary CTA */}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAuthModal('signin');
            }}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] active:scale-[0.98] text-[var(--text-primary)] font-display font-bold text-base border border-[var(--border)] shadow-xs transition-all cursor-pointer"
          >
            {t('hero.secondaryCta')}
          </button>
        </div>

        {/* Quieter Create an account */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAuthModal('signup');
            }}
            className="text-xs font-display font-medium text-[var(--text-secondary)] hover:text-[var(--haven-deep)] hover:underline cursor-pointer"
          >
            {t('hero.createAccountPrompt')}{' '}
            <span className="font-bold text-[var(--haven-deep)]">{t('hero.createAccountLink')}</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PRODUCT VALUE: WHAT CAN MOMHAVEN HELP ME WITH? */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[var(--border)]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
            {t('valueProps.heading')}
          </h2>
          <p className="font-body text-sm sm:text-base text-[var(--text-secondary)] mt-2">
            {t('valueProps.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Learn */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-6 border border-[var(--border)] shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[var(--surface-2)] text-[var(--haven-deep)] flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-[var(--haven-orchid)]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                {t('valueProps.learn.title')}
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('valueProps.learn.desc')}
              </p>
            </div>
            <div className="pt-4 mt-2">
              <button
                type="button"
                onClick={() => handleLaunchAnonymous('records')}
                className="text-xs font-display font-bold text-[var(--haven-deep)] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('valueProps.learn.action')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Track */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-6 border border-[var(--border)] shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                {t('valueProps.track.title')}
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('valueProps.track.desc')}
              </p>
            </div>
            <div className="pt-4 mt-2">
              <button
                type="button"
                onClick={() => handleLaunchAnonymous('records')}
                className="text-xs font-display font-bold text-[var(--haven-deep)] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('valueProps.track.action')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Ask Haven */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-6 border border-[var(--border)] shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[var(--surface-2)] text-[var(--haven-deep)] flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-[var(--haven-orchid)]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                {t('valueProps.askHaven.title')}
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('valueProps.askHaven.desc')}
              </p>
            </div>
            <div className="pt-4 mt-2">
              <button
                type="button"
                onClick={() => handleLaunchAnonymous('haven')}
                className="text-xs font-display font-bold text-[var(--haven-deep)] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('valueProps.askHaven.action')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Stay Connected */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-6 border border-[var(--border)] shadow-xs flex flex-col justify-between hover:shadow-card transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                {t('valueProps.stayConnected.title')}
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('valueProps.stayConnected.desc')}
              </p>
            </div>
            <div className="pt-4 mt-2">
              <button
                type="button"
                onClick={() => setView('partner_flow')}
                className="text-xs font-display font-bold text-[var(--haven-deep)] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{t('valueProps.stayConnected.action')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MOTHER + CHILD JOURNEY: FROM PREGNANCY TO GROWING UP */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[var(--haven-orchid)]">
            {t('lifecycle.badge')}
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight mt-1">
            {t('lifecycle.heading')}
          </h2>
          <p className="font-body text-sm sm:text-base text-[var(--text-secondary)] mt-2">
            {t('lifecycle.subheading')}
          </p>
        </div>

        {/* Visual Timeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-center">
          {[
            { step: '1', key: 'pregnancy', icon: Heart },
            { step: '2', key: 'anc', icon: Calendar },
            { step: '3', key: 'birth', icon: ShieldCheck },
            { step: '4', key: 'newborn', icon: Baby },
            { step: '5', key: 'childHealth', icon: Activity },
            { step: '6', key: 'growth', icon: FileCheck },
            { step: '7', key: 'ongoing', icon: Users },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={idx} 
                className="bg-[var(--surface-1)] rounded-[20px] p-4 border border-[var(--border)] shadow-2xs flex flex-col items-center hover:border-[var(--haven-orchid)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] text-[var(--haven-deep)] flex items-center justify-center font-display font-bold text-xs mb-2.5">
                  <IconComponent className="w-4 h-4 text-[var(--haven-orchid)]" />
                </div>
                <h4 className="font-display font-bold text-xs text-[var(--text-primary)] mb-1">
                  {t(`lifecycle.steps.${item.key}.title`)}
                </h4>
                <p className="font-body text-[11px] text-[var(--text-secondary)] leading-tight">
                  {t(`lifecycle.steps.${item.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HAVEN FEATURE SHOWCASE: QUESTIONS DON'T ALWAYS WAIT FOR AN APPOINTMENT */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[var(--surface-1)] via-[var(--surface-1)] to-[var(--surface-2)] rounded-[32px] border border-[var(--border)] p-6 sm:p-10 shadow-card flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          
          <div className="flex-1 text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--haven-deep)] font-display font-semibold text-xs border border-[var(--border)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
              <span>{t('havenShowcase.badge')}</span>
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight leading-tight">
              {t('havenShowcase.heading')}
            </h2>

            <p className="font-display font-bold text-base text-[var(--haven-orchid)]">
              {t('havenShowcase.companionTitle')}
            </p>

            <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('havenShowcase.description')}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleLaunchAnonymous('haven', language === 'sw' ? 'Habari Haven, ni dalili zipi kuu za hatari wakati wa ujauzito?' : 'Hello Haven, what are the key danger signs during pregnancy?')}
                className="px-7 py-3.5 rounded-full bg-[var(--haven-deep)] hover:opacity-90 text-white font-display font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer group"
              >
                <span>{t('havenShowcase.tryHaven')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Interactive Chat Sample Preview */}
          <div className="w-full lg:w-80 bg-[var(--surface-1)] rounded-[24px] border border-[var(--border)] p-4 shadow-sm space-y-3 text-left">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--border)]">
              <div className="w-7 h-7 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center font-bold text-xs">
                H
              </div>
              <div>
                <span className="font-display font-bold text-xs text-[var(--text-primary)] block leading-none">
                  Haven
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {language === 'sw' ? 'Tayari kujibu' : 'Ready to answer'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="bg-[var(--surface-2)] rounded-2xl rounded-tr-none p-3 text-xs text-[var(--text-primary)] ml-auto max-w-[85%] border border-[var(--border)]">
                "{t('havenShowcase.sampleQuestion')}"
              </div>

              <div className="bg-[var(--surface-1)] rounded-2xl rounded-tl-none p-3 text-xs text-[var(--text-primary)] border border-[var(--border)] shadow-2xs space-y-1.5">
                <p>
                  {t('havenShowcase.sampleAnswer')}
                </p>
                <div className="p-2 bg-amber-500/10 rounded-lg text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {t('havenShowcase.sampleWarning')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchAnonymous('haven')}
              className="w-full py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--haven-deep)] font-display font-bold text-[11px] text-center transition-colors cursor-pointer"
            >
              {t('havenShowcase.sampleAskOwn')}
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. KNOWLEDGE LIBRARY: KNOW WHAT TO EXPECT. KNOW WHAT TO ASK. */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
            {t('knowledge.heading')}
          </h2>
          <p className="font-body text-sm sm:text-base text-[var(--text-secondary)] mt-2">
            {t('knowledge.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Pregnancy */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-5 border border-[var(--border)] shadow-xs hover:border-[var(--haven-orchid)] transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--haven-deep)] flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 text-[var(--haven-orchid)]" />
              </div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
                {t('knowledge.categories.pregnancy.title')}
              </h3>
              <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('knowledge.categories.pregnancy.desc')}
              </p>
            </div>
            <div className="pt-4">
              <span className="text-[11px] font-bold text-[var(--haven-deep)]">
                {t('knowledge.categories.pregnancy.tag')}
              </span>
            </div>
          </div>

          {/* 2. Newborn Care */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-5 border border-[var(--border)] shadow-xs hover:border-[var(--haven-orchid)] transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                <Baby className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
                {t('knowledge.categories.newborn.title')}
              </h3>
              <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('knowledge.categories.newborn.desc')}
              </p>
            </div>
            <div className="pt-4">
              <span className="text-[11px] font-bold text-[var(--haven-deep)]">
                {t('knowledge.categories.newborn.tag')}
              </span>
            </div>
          </div>

          {/* 3. Child Health */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-5 border border-[var(--border)] shadow-xs hover:border-[var(--haven-orchid)] transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--haven-deep)] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-[var(--haven-orchid)]" />
              </div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
                {t('knowledge.categories.childHealth.title')}
              </h3>
              <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('knowledge.categories.childHealth.desc')}
              </p>
            </div>
            <div className="pt-4">
              <span className="text-[11px] font-bold text-[var(--haven-deep)]">
                {t('knowledge.categories.childHealth.tag')}
              </span>
            </div>
          </div>

          {/* 4. Mother's Health */}
          <div className="bg-[var(--surface-1)] rounded-[24px] p-5 border border-[var(--border)] shadow-xs hover:border-[var(--haven-orchid)] transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
                {t('knowledge.categories.motherHealth.title')}
              </h3>
              <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('knowledge.categories.motherHealth.desc')}
              </p>
            </div>
            <div className="pt-4">
              <span className="text-[11px] font-bold text-[var(--haven-deep)]">
                {t('knowledge.categories.motherHealth.tag')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => handleLaunchAnonymous('records')}
            className="inline-flex items-center gap-2 text-sm font-display font-bold text-[var(--haven-deep)] hover:opacity-80 underline underline-offset-4 cursor-pointer"
          >
            <span>{t('knowledge.cta')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRUST & EVIDENCE: BUILT AROUND TRUSTED CARE */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto bg-[var(--surface-1)] rounded-[32px] border border-[var(--border)] shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[var(--haven-orchid)]">
            {t('trust.badge')}
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight mt-1">
            {t('trust.heading')}
          </h2>
          <p className="font-body text-sm sm:text-base text-[var(--text-secondary)] mt-2">
            {t('trust.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-1)] text-[var(--haven-deep)] flex items-center justify-center mb-3.5 shadow-2xs">
              <BookOpen className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
              {t('trust.pillars.evidence.title')}
            </h3>
            <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
              {t('trust.pillars.evidence.desc')}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-1)] text-[var(--haven-deep)] flex items-center justify-center mb-3.5 shadow-2xs">
              <Lock className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
              {t('trust.pillars.privacy.title')}
            </h3>
            <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
              {t('trust.pillars.privacy.desc')}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-1)] text-[var(--haven-deep)] flex items-center justify-center mb-3.5 shadow-2xs">
              <Stethoscope className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1.5">
              {t('trust.pillars.care.title')}
            </h3>
            <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed">
              {t('trust.pillars.care.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CLINICIAN CONNECTION: YOUR INFORMATION CAN TRAVEL WITH YOU */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-[var(--surface-2)] rounded-[32px] border border-[var(--border)] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-left space-y-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-[var(--haven-orchid)]">
              {t('clinician.badge')}
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
              {t('clinician.heading')}
            </h2>
            <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('clinician.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowClinicianModal(true)}
              className="px-6 py-3 rounded-full bg-[var(--surface-1)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] font-display font-bold text-xs border border-[var(--border)] shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('clinician.portalButton')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleLaunchAnonymous('records')}
              className="text-xs font-display font-bold text-[var(--haven-deep)] hover:underline px-3 py-2 cursor-pointer flex items-center gap-1"
            >
              <span>{t('clinician.learnMore')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PARTNER SUPPORT: MOTHERHOOD DOESN'T HAVE TO BE CARRIED ALONE */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-[var(--surface-1)] rounded-[32px] border border-[var(--border)] p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-3 text-left max-w-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
              {t('partner.heading')}
            </h2>

            <p className="font-body text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('partner.description')}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setView('partner_flow')}
                className="px-6 py-3 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] font-display font-bold text-xs border border-[var(--border)] flex items-center gap-2 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-[var(--haven-orchid)]" />
                <span>{t('partner.cta')}</span>
              </button>
            </div>
          </div>

          <div className="w-full md:w-72 bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)] text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-display font-bold text-[var(--text-primary)]">
              <Share2 className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('partner.cardTitle')}</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {t('partner.cardDesc')}
            </p>
            <div className="pt-1 text-[11px] font-bold text-[var(--haven-orchid)]">
              {t('partner.cardCheck')}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. ACCOUNT CTA: READY TO MAKE MOMHAVEN YOURS? */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center border-t border-[var(--border)]">
        <div className="bg-gradient-to-br from-[var(--haven-deep)] to-[#22104E] text-white rounded-[32px] p-8 sm:p-12 shadow-xl space-y-6">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight">
            {t('accountCta.heading')}
          </h2>

          <p className="font-body text-sm sm:text-base text-purple-100 max-w-xl mx-auto leading-relaxed">
            {t('accountCta.description')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAuthModal('signup');
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-gray-100 active:scale-[0.98] text-[var(--haven-deep)] font-display font-bold text-base shadow-md transition-all cursor-pointer"
            >
              {t('accountCta.createButton')}
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setAuthModal('signin');
              }}
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-display font-bold text-base border border-white/20 transition-all cursor-pointer"
            >
              {t('accountCta.signInButton')}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-[var(--surface-1)] border-t border-[var(--border)] py-10 px-4 sm:px-8 font-body text-xs text-[var(--text-secondary)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] p-1.5 flex items-center justify-center">
              <img
                src="/assets/logo.png"
                alt="MomHaven"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-[var(--text-primary)] block leading-tight">
                MomHaven
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {t('common.appTagline')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 font-display font-medium text-xs">
            <button
              type="button"
              onClick={() => handleLaunchAnonymous('today')}
              className="hover:text-[var(--text-primary)] cursor-pointer"
            >
              {t('footer.about')}
            </button>
            <button
              type="button"
              onClick={() => handleLaunchAnonymous('records')}
              className="hover:text-[var(--text-primary)] cursor-pointer"
            >
              {t('footer.privacy')}
            </button>
            <button
              type="button"
              onClick={() => handleLaunchAnonymous('today')}
              className="hover:text-[var(--text-primary)] cursor-pointer"
            >
              {t('footer.safety')}
            </button>
            <button
              type="button"
              onClick={() => setShowClinicianModal(true)}
              className="hover:text-[var(--haven-deep)] font-bold text-[var(--haven-deep)] cursor-pointer"
            >
              {t('footer.clinicianPortal')}
            </button>
            <button
              type="button"
              onClick={() => setView('partner_flow')}
              className="hover:text-[var(--text-primary)] cursor-pointer"
            >
              {t('footer.partnerAccess')}
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] text-center md:text-right">
            <span>© {new Date().getFullYear()} {t('footer.copyright')}</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* AUTHENTICATION MODAL (SIGN IN / SIGN UP / MAGIC LINK / FORGOT PASSWORD) */}
      {/* ========================================================================= */}
      {authModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-md bg-[var(--surface-1)] rounded-[28px] border border-[var(--border)] p-6 sm:p-8 shadow-2xl animate-fade-in text-[var(--text-primary)]"
            role="dialog"
            aria-modal="true"
          >
            {/* Close modal button */}
            <button
              type="button"
              onClick={() => {
                setAuthModal(null);
                setError(null);
                setMagicLinkSent(false);
                setResetEmailSent(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Brand icon and title */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] p-2.5 mx-auto mb-2.5 shadow-2xs flex items-center justify-center">
                <img
                  src="/assets/logo.png"
                  alt="MomHaven Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="font-display font-extrabold text-xl text-[var(--text-primary)]">
                {authModal === 'signup' 
                  ? t('auth.createAccount') 
                  : authModal === 'magic_link' 
                  ? t('auth.passwordlessLink') 
                  : authModal === 'forgot_password'
                  ? t('auth.resetPassword')
                  : t('auth.welcomeBack')}
              </h2>
              <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
                {authModal === 'signup' 
                  ? t('auth.createSubtitle') 
                  : authModal === 'magic_link'
                  ? t('auth.magicSubtitle')
                  : authModal === 'forgot_password'
                  ? t('auth.resetSubtitle')
                  : t('auth.welcomeSubtitle')}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-left text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* 1. SIGN IN & SIGN UP FORM */}
            {(authModal === 'signin' || authModal === 'signup') && (
              <div className="space-y-4">
                {/* Google Auth Button */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] active:scale-[0.98] text-[var(--text-primary)] font-display font-bold text-xs border border-[var(--border)] shadow-2xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
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
                  <span>{t('auth.continueWithGoogle')}</span>
                </button>

                <div className="relative flex py-1 items-center justify-center">
                  <div className="flex-grow border-t border-[var(--border)]" />
                  <span className="flex-shrink mx-3 text-[11px] text-[var(--text-muted)] font-medium">{t('common.or')}</span>
                  <div className="flex-grow border-t border-[var(--border)]" />
                </div>

                {/* Email Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
                  {authModal === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                        {t('auth.fullName')}
                      </label>
                      <input
                        type="text"
                        placeholder="Mama Zawadi"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                      {t('auth.emailAddress')}
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        {t('auth.password')}
                      </label>
                      {authModal === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setAuthModal('forgot_password');
                          }}
                          className="text-[11px] text-[var(--haven-orchid)] hover:underline cursor-pointer"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full text-xs py-2.5 px-3.5 pr-10 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
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
                      className="w-full py-3 text-xs font-display font-bold shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? t('common.processing') : authModal === 'signup' ? t('common.createFreeAccount') : t('common.signIn')}
                    </Button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setAuthModal('magic_link');
                        }}
                        className="text-xs font-display font-medium text-[var(--haven-deep)] hover:underline cursor-pointer"
                      >
                        {t('auth.useMagicLinkInstead')}
                      </button>
                    </div>

                    <div className="text-center text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                      <span>{authModal === 'signup' ? t('auth.alreadyHaveAccount') + ' ' : t('auth.dontHaveAccount') + ' '}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setAuthModal(authModal === 'signup' ? 'signin' : 'signup');
                        }}
                        className="text-[var(--haven-deep)] font-bold hover:underline cursor-pointer ml-1"
                      >
                        {authModal === 'signup' ? t('common.signIn') : t('common.createAccount')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 2. MAGIC LINK FORM */}
            {authModal === 'magic_link' && (
              <div className="space-y-4 text-left">
                {magicLinkSent ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[18px] p-4 text-center space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h4 className="font-display font-bold text-sm text-emerald-800 dark:text-emerald-200">
                      {t('auth.checkInbox')}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      {t('auth.magicLinkSentMessage')} <strong>{email}</strong>.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMagicLinkSent(false);
                          setAuthModal('signin');
                        }}
                        className="text-xs font-display font-bold text-[var(--haven-deep)] underline cursor-pointer"
                      >
                        {t('auth.backToSignIn')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMagicLink} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                        {t('auth.emailAddress')}
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]"
                        autoFocus
                      />
                    </div>

                    <div className="pt-1 space-y-2.5">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="w-full py-3 text-xs font-display font-bold shadow-md flex items-center justify-center gap-2"
                      >
                        <span>{loading ? t('common.processing') : t('auth.sendMagicLink')}</span>
                      </Button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setAuthModal('signin');
                          }}
                          className="text-xs text-[var(--haven-deep)] hover:underline font-semibold cursor-pointer"
                        >
                          {t('auth.signInWithPassword')}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {authModal === 'forgot_password' && (
              <div className="space-y-4 text-left">
                {resetEmailSent ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[18px] p-4 text-center space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h4 className="font-display font-bold text-sm text-emerald-800 dark:text-emerald-200">
                      {t('auth.resetSentTitle')}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      {t('auth.resetSentMessage')} <strong>{email}</strong>.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmailSent(false);
                          setAuthModal('signin');
                        }}
                        className="text-xs font-display font-bold text-[var(--haven-deep)] underline cursor-pointer"
                      >
                        {t('auth.backToSignIn')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                        {t('auth.emailAddress')}
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full text-xs py-2.5 px-3.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]"
                        autoFocus
                      />
                    </div>

                    <div className="pt-1 space-y-2.5">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="w-full py-3 text-xs font-display font-bold shadow-md flex items-center justify-center gap-2"
                      >
                        <span>{loading ? t('common.processing') : t('auth.sendResetLink')}</span>
                      </Button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setAuthModal('signin');
                          }}
                          className="text-xs text-[var(--haven-deep)] hover:underline font-semibold cursor-pointer"
                        >
                          {t('auth.backToSignIn')}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Clinician Registration Modal */}
      {showClinicianModal && (
        <ClinicianRegisterModal
          onClose={() => setShowClinicianModal(false)}
          onSuccess={() => {
            setShowClinicianModal(false);
            onSignedIn();
          }}
        />
      )}

    </div>
  );
}
