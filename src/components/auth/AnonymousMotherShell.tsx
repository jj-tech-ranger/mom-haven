// src/components/auth/AnonymousMotherShell.tsx
import React, { useState } from 'react';
import {
  Home,
  Milestone,
  MessageSquare,
  FileText,
  User,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  PhoneCall,
  Calendar,
  Apple,
  Baby,
  Heart,
  Lock,
  ArrowRight,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import Button from '../Button';
import AnonymousOnboarding from '../onboarding/AnonymousOnboarding';
import GuestDailyCheckInCard from './GuestDailyCheckInCard';
import { GuestStorageNotice } from '../common/OfflineSyncNotice';
import {
  getAnonymousContextDraft,
  clearAnonymousContextDraft,
  hasAnonymousContextDraft,
} from '../../services/anonymousContextService';

type MotherTab = 'today' | 'journey' | 'haven' | 'records' | 'profile';

interface AnonymousMotherShellProps {
  onBackToLanding: () => void;
  onCreateAccount: () => void;
  initialTab?: MotherTab;
  initialPrompt?: string;
}

const tabs: Array<{ id: MotherTab; label: string; icon: LucideIcon }> = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'journey', label: 'Journey', icon: Milestone },
  { id: 'haven', label: 'Haven', icon: MessageSquare },
  { id: 'records', label: 'Records', icon: FileText },
  { id: 'profile', label: 'Profile', icon: User },
];

const LIFECYCLE_STAGES_INFO = [
  {
    id: 'pregnancy',
    title: 'Pregnancy',
    desc: 'Trimester guidance, symptoms & preparation',
    icon: '🤰',
  },
  {
    id: 'anc',
    title: 'Antenatal care',
    desc: 'MOH 216 visit tracking, clinical records & care preparation',
    icon: '🏥',
  },
  {
    id: 'birth',
    title: 'Birth',
    desc: 'Delivery preparedness & birth planning',
    icon: '👶',
  },
  {
    id: 'newborn',
    title: 'Newborn',
    desc: 'Feeding, cord care, danger signs & early care',
    icon: '🍼',
  },
  {
    id: 'child_health',
    title: 'Child health',
    desc: 'Immunization, illness tracking & preventive care',
    icon: '🩺',
  },
  {
    id: 'growth',
    title: 'Growth & milestones',
    desc: 'Weight, height, development & developmental milestones',
    icon: '📈',
  },
  {
    id: 'ongoing',
    title: 'Ongoing care',
    desc: 'Maternal wellness, family nutrition & next steps',
    icon: '🌸',
  },
];

export default function AnonymousMotherShell({
  onBackToLanding,
  onCreateAccount,
  initialTab = 'today',
}: AnonymousMotherShellProps) {
  const [activeTab, setActiveTab] = useState<MotherTab>(initialTab);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [draft, setDraft] = useState(getAnonymousContextDraft());
  const [interactionCount, setInteractionCount] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const handleInteraction = () => {
    setInteractionCount((prev) => prev + 1);
  };

  const handleTabSwitch = (tabId: MotherTab) => {
    setActiveTab(tabId);
    handleInteraction();
  };

  const reloadDraft = () => setDraft(getAnonymousContextDraft());

  const handleClearDraft = () => {
    clearAnonymousContextDraft();
    reloadDraft();
  };

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  // If user requested personalization wizard
  if (showPersonalization) {
    return (
      <div className="min-h-screen bg-[var(--lavender-50)] p-4 sm:p-8">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-card-1 sm:p-7">
          <button
            type="button"
            onClick={() => setShowPersonalization(false)}
            className="mb-5 flex items-center gap-2 text-xs font-display font-bold text-[var(--haven-deep)] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to guest experience</span>
          </button>
          <AnonymousOnboarding
            onComplete={() => {
              reloadDraft();
              setShowPersonalization(false);
              handleInteraction();
            }}
            onCreateAccount={onCreateAccount}
            onCancel={() => setShowPersonalization(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-24 text-[var(--ink-900)] font-body selection:bg-[var(--surface-3)]">
      {/* ========================================================================= */}
      {/* HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-20 bg-white border-b border-[var(--border-hairline)] shadow-xs px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-9 h-9 rounded-full bg-[var(--lavender-50)] flex items-center justify-center cursor-pointer hover:bg-[var(--lavender-100)] transition-colors"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--ink-700)]" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-display font-bold text-[var(--haven-orchid)] leading-tight">
              MomHaven Guest Mode
            </p>
            <h1 className="font-display font-extrabold text-base leading-tight">
              {currentTab.label}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={onCreateAccount}
            className="px-3.5 py-1.5 text-xs font-display font-bold"
          >
            Create account
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Guest Storage Indicator */}
        <GuestStorageNotice onCreateAccount={onCreateAccount} />

        {/* Ephemeral Privacy Badge */}
        <div className="bg-white rounded-2xl border border-[var(--border-hairline)] p-3.5 flex items-start gap-3 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--ink-600)] leading-relaxed">
            <span className="font-bold text-[var(--ink-800)]">Private Exploration: </span>
            Your responses stay strictly on this device until you choose to create an account.
          </div>
        </div>

        {/* Soft "Save your journey" nudge (after 2-3 interactions, dismissible, non-modal) */}
        {interactionCount >= 2 && !nudgeDismissed && (
          <div
            id="guest-save-journey-nudge"
            className="bg-white border border-[var(--haven-orchid)]/40 rounded-2xl p-3.5 shadow-card-1 flex items-start justify-between gap-3 animate-fadeIn"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[var(--haven-orchid)]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-bold text-xs text-[var(--ink-900)]">
                  Save your journey
                </h4>
                <p className="text-[11px] text-[var(--ink-600)] mt-0.5 leading-relaxed">
                  You've started exploring and logging on this device. Create a free account anytime to keep your progress safe.
                </p>
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="mt-2 text-xs font-display font-bold text-[var(--haven-deep)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Create free account</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNudgeDismissed(true)}
              className="text-[var(--ink-400)] hover:text-[var(--ink-700)] p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 1: TODAY */}
        {/* ======================================================================= */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Daily Local Check-in Card */}
            <GuestDailyCheckInCard
              lifecycleStage={draft?.lifecycleStage || 'pregnancy'}
              language={draft?.language || 'en'}
              onLogged={() => handleInteraction()}
              onCreateAccount={onCreateAccount}
            />

            {/* Personalization Prompt Card */}
            <button
              type="button"
              onClick={() => setShowPersonalization(true)}
              className="w-full rounded-[22px] border border-[var(--haven-orchid)]/30 bg-white p-4 text-left shadow-xs hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--lavender-100)] text-[var(--haven-deep)] group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="h-5 w-5 text-[var(--haven-orchid)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-sm text-[var(--ink-900)]">
                    {draft
                      ? `Personalized: ${draft.lifecycleStage === 'pregnancy' && draft.pregnancyWeek ? `Week ${draft.pregnancyWeek} Pregnancy` : 'Journey configured'}`
                      : 'Personalize your visit (60 seconds)'}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ink-600)] truncate">
                    {draft
                      ? 'Tap to adjust your pregnancy week or topics anytime'
                      : 'Select your week and interests for tailored guidance'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--ink-400)] shrink-0" />
              </div>
            </button>

            {/* Personalized Stage Card (If Draft exists) */}
            {draft && (
              <div className="bg-gradient-to-br from-[#33178A] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-0.5 rounded-full text-[11px] font-display font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {draft.lifecycleStage === 'pregnancy'
                      ? `Week ${draft.pregnancyWeek || 16} • Trimester ${
                          (draft.pregnancyWeek || 16) <= 12
                            ? '1'
                            : (draft.pregnancyWeek || 16) <= 27
                            ? '2'
                            : '3'
                        }`
                      : 'Maternal Health Journey'}
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-xl leading-snug">
                  {draft.lifecycleStage === 'pregnancy'
                    ? (draft.pregnancyWeek || 16) <= 12
                      ? 'Early Growth & Cell Development'
                      : (draft.pregnancyWeek || 16) <= 24
                      ? 'Active Movements & Senses Awakening'
                      : 'Maturation & Birth Preparation'
                    : 'Personalized Care Guidelines'}
                </h2>
                <p className="font-body text-xs text-purple-100 leading-relaxed">
                  {draft.lifecycleStage === 'pregnancy'
                    ? 'Stay hydrated, take your iron & folic acid (IFAS) daily, and prepare questions for your upcoming ANC clinic contact.'
                    : 'Track milestones, feeding patterns, and preventive health checks.'}
                </p>
              </div>
            )}

            {/* Emergency Hotline Card */}
            <div className="bg-[#E11D3C] text-white p-4 rounded-2xl shadow-emergency flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs leading-tight">
                    MOH &amp; Red Cross Hotline
                  </h4>
                  <p className="text-[11px] text-white/90">24/7 Maternal Ambulance Dispatch</p>
                </div>
              </div>
              <a
                href="tel:1199"
                className="px-3 py-1.5 rounded-full bg-white text-[#C4283C] font-display font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs hover:bg-gray-100"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                1199
              </a>
            </div>

            {/* Stage Guidance & Superfoods */}
            <div className="bg-white border border-[var(--border-hairline)] rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <Apple className="w-4 h-4 text-emerald-600" />
                <h3 className="font-display font-bold text-sm">
                  Kenyan Maternal Superfoods
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-600)] leading-relaxed">
                Key nutrients recommended by Kenya Ministry of Health guidelines for strong maternal and fetal health:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hairline)]">
                  <span className="font-bold text-[var(--haven-deep)] block">Iron &amp; Folate</span>
                  <span className="text-[11px] text-[var(--ink-600)]">Managu, Terere, Kunde, Spinach</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hairline)]">
                  <span className="font-bold text-[var(--haven-deep)] block">Calcium &amp; Protein</span>
                  <span className="text-[11px] text-[var(--ink-600)]">Maziwa Lala, Omena, Eggs, Beans</span>
                </div>
              </div>
            </div>

            {/* Save Journey Callout Card */}
            <div className="bg-white border-2 border-[var(--haven-orchid)]/30 p-5 rounded-[24px] shadow-card-1 text-center space-y-3 mt-2">
              <div className="w-11 h-11 rounded-2xl bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
                <Heart className="w-5 h-5 text-[var(--haven-orchid)]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink-900)]">
                  Save your journey with an account
                </h3>
                <p className="font-body text-xs text-[var(--ink-600)] mt-1 max-w-sm mx-auto">
                  When you sign up, your guest preferences are seamlessly synchronized to your secure profile.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={onCreateAccount}
                className="w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: JOURNEY */}
        {/* ======================================================================= */}
        {activeTab === 'journey' && (
          <div className="space-y-4">
            <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[10px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                Continuous Care Lifecycle
              </span>
              <h2 className="font-display font-extrabold text-lg text-[var(--ink-900)]">
                From pregnancy to growing up
              </h2>
              <p className="text-xs text-[var(--ink-600)] leading-relaxed">
                Kenya MOH 216 continuous pathway supporting mothers and children across every milestone.
              </p>
            </div>

            <div className="space-y-2.5">
              {LIFECYCLE_STAGES_INFO.map((st, index) => {
                const isCurrent =
                  draft?.lifecycleStage === 'pregnancy'
                    ? st.id === 'pregnancy' || st.id === 'anc'
                    : draft?.lifecycleStage === 'postpartum'
                    ? st.id === 'newborn'
                    : draft?.lifecycleStage === 'parenting'
                    ? st.id === 'child_health' || st.id === 'growth'
                    : index === 0;

                return (
                  <div
                    key={st.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-white border-[var(--haven-deep)] ring-2 ring-[var(--haven-deep)]/10 shadow-xs'
                        : 'bg-white border-[var(--border-hairline)] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{st.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm text-[var(--ink-900)]">
                            {st.title}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--haven-deep)] text-[10px] font-display font-extrabold">
                              Your Stage
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--ink-600)] mt-0.5 leading-relaxed">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[var(--border-hairline)] text-center space-y-2">
              <p className="text-xs text-[var(--ink-600)]">
                Track personal ANC clinic appointments and child vaccines with an account.
              </p>
              <button
                type="button"
                onClick={onCreateAccount}
                className="text-xs font-display font-bold text-[var(--haven-deep)] hover:underline"
              >
                Sign up to begin digital tracking
              </button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: HAVEN */}
        {/* ======================================================================= */}
        {activeTab === 'haven' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#33178A] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-0.5 rounded-full text-[11px] font-display font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Haven Educational Sample</span>
              </div>
              <h2 className="font-display font-extrabold text-xl leading-tight">
                Meet Haven, your maternal health companion
              </h2>
              <p className="font-body text-xs text-purple-100 leading-relaxed">
                Haven offers calm, culturally grounded answers guided by Kenya Ministry of Health standards.
                Haven does not diagnose or prescribe medicine.
              </p>
            </div>

            <div className="bg-white border border-[var(--border-hairline)] rounded-2xl p-4 shadow-2xs space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--ink-500)]">
                Sample questions you can ask
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  'What are normal symptoms vs warning signs in week 18?',
                  'How many ANC visits are recommended in Kenya MOH 216?',
                  'What traditional Kenyan foods help boost low hemoglobin?',
                  'What should I pack in my hospital maternity bag?',
                ].map((q, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hairline)] text-[var(--ink-800)] font-medium"
                  >
                    &ldquo;{q}&rdquo;
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Gate for Active Chat */}
            <div className="bg-white border-2 border-[var(--haven-orchid)]/30 p-5 rounded-[24px] shadow-card-1 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
                <Lock className="w-5 h-5 text-[var(--haven-orchid)]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--ink-900)]">
                  Live chat requires account sign-in
                </h3>
                <p className="text-xs text-[var(--ink-600)] mt-1">
                  To protect your privacy and ensure your conversation stays personal and safe, sign in or create an account.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={onCreateAccount}
                className="w-full py-3 text-xs font-display font-bold"
              >
                Sign in or create account to chat
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: RECORDS */}
        {/* ======================================================================= */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[24px] shadow-2xs space-y-2">
              <span className="text-[10px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                MOH 216 Digital Handbook
              </span>
              <h2 className="font-display font-extrabold text-lg text-[var(--ink-900)]">
                Kenya Mother-Child Health Booklet
              </h2>
              <p className="text-xs text-[var(--ink-600)] leading-relaxed">
                MomHaven provides a complete digital companion to the official MOH 216 booklet used across Kenya health facilities.
              </p>
            </div>

            <div className="grid gap-2.5">
              {[
                { title: 'Antenatal Care (ANC)', desc: '8 contacts, blood pressure, fetal heart rate & IFAS' },
                { title: 'Clinical Laboratory Tests', desc: 'Blood group, Rhesus, hemoglobin, urinalysis & screening' },
                { title: 'KEPI Child Immunizations', desc: 'BCG, Polio, Pentavalent, PCV, Rota & Measles schedule' },
                { title: 'Child Growth & MUAC', desc: 'Weight-for-age, height curves & nutritional monitoring' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-white rounded-xl border border-[var(--border-hairline)] text-xs space-y-1 shadow-2xs"
                >
                  <div className="font-display font-bold text-[var(--ink-900)]">
                    {item.title}
                  </div>
                  <div className="text-[var(--ink-600)]">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border-2 border-[var(--haven-orchid)]/30 p-5 rounded-[24px] text-center space-y-3">
              <p className="text-xs text-[var(--ink-700)] font-medium">
                Clinical records require a verified account so your health data remains secure, private, and portable.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={onCreateAccount}
                className="w-full py-3 text-xs font-display font-bold"
              >
                Create account to digitize your card
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 5: PROFILE */}
        {/* ======================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[24px] shadow-2xs space-y-3">
              <h2 className="font-display font-extrabold text-base text-[var(--ink-900)]">
                Guest Session Settings
              </h2>
              <div className="space-y-2 text-xs divide-y divide-[var(--border-hairline)]">
                <div className="flex justify-between py-2">
                  <span className="text-[var(--ink-500)]">Session Mode:</span>
                  <span className="font-bold text-emerald-700">Guest Mode (On-Device)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[var(--ink-500)]">Lifecycle Stage:</span>
                  <span className="font-bold capitalize">{draft?.lifecycleStage || 'Pregnancy'}</span>
                </div>
                {draft?.pregnancyWeek && (
                  <div className="flex justify-between py-2">
                    <span className="text-[var(--ink-500)]">Estimated Week:</span>
                    <span className="font-bold">Week {draft.pregnancyWeek}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-[var(--ink-500)]">Language:</span>
                  <span className="font-bold uppercase">{draft?.language || 'EN'}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowPersonalization(true)}
                  className="w-full py-2.5 rounded-xl border border-[var(--haven-deep)] text-[var(--haven-deep)] font-display font-bold text-xs hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  Edit preferences
                </button>

                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-display font-bold text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear guest device preferences</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[24px] text-center space-y-3">
              <h3 className="font-display font-bold text-sm">
                Ready to save your progress?
              </h3>
              <p className="text-xs text-[var(--ink-600)]">
                Create an account anytime. Your current preferences and logs will automatically be preserved and linked.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={onCreateAccount}
                className="w-full py-3 text-xs"
              >
                Create account now
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[var(--border-hairline)] shadow-xs">
        <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-2">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'text-[var(--haven-deep)]'
                    : 'text-[var(--ink-400)] hover:text-[var(--ink-700)]'
                }`}
              >
                <TabIcon className={`w-5 h-5 ${isCurrent ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-display font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
