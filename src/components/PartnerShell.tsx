// src/components/PartnerShell.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Home, 
  HeartHandshake, 
  MapPin, 
  ShieldAlert, 
  User, 
  CheckCircle2, 
  PhoneCall, 
  Sparkles, 
  LogOut,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Heart,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { redeemPartnerConnectionCode, getPartnerActiveRelationship } from '../services/sharingService';
import { getHealthContext } from '../services/healthContextService';
import { getActivePregnancy } from '../services/pregnancyService';
import { getSharedPartnerReminders } from '../services/reminderService';
import { getPartnerShare, PartnerShareData, PARTNER_MOOD_TIPS } from '../services/partnerContextService';
import { computeGestationalHeroMetrics } from '../utils/clinicalCalculations';
import { Pregnancy, Reminder } from '../types';
import { HealthContext } from '../types/healthContext';
import EmergencySafetyHub from './emergency/EmergencySafetyHub';
import PartnerSupportHub from './partner/PartnerSupportHub';
import PartnerBirthPlanView from './partner/PartnerBirthPlanView';
import Button from './Button';

function formatAppointmentDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}

interface PartnerShellProps {
  partnerId?: string;
  partnerName?: string;
  onSignOut?: () => void;
}

export default function PartnerShell({
  partnerId = 'partner-user',
  partnerName = 'Partner Support',
  onSignOut = () => {},
}: PartnerShellProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'birthplan' | 'emergency' | 'profile'>('home');
  const [linkedMother, setLinkedMother] = useState<{ motherId: string; motherName: string } | null>(() => {
    const saved = localStorage.getItem('momhaven_partner_link');
    return saved ? JSON.parse(saved) : null;
  });

  const [connectionCode, setConnectionCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real mother data states
  const [healthContext, setHealthContext] = useState<HealthContext | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [partnerShare, setPartnerShare] = useState<PartnerShareData | null>(null);
  const [motherDataLoading, setMotherDataLoading] = useState<boolean>(false);
  const [motherDataError, setMotherDataError] = useState<string | null>(null);

  const fetchMotherData = useCallback(async (motherId: string) => {
    if (!motherId) return;
    setMotherDataLoading(true);
    setMotherDataError(null);
    try {
      const [ctx, preg, rems, shareData] = await Promise.all([
        getHealthContext(motherId).catch(() => null),
        getActivePregnancy(motherId).catch(() => null),
        getSharedPartnerReminders(motherId).catch(() => []),
        getPartnerShare(motherId).catch(() => null),
      ]);
      setHealthContext(ctx);
      setPregnancy(preg);
      setReminders(rems);
      setPartnerShare(shareData);
    } catch (err) {
      console.warn('Failed to load mother data in PartnerShell', err);
      setMotherDataError('Unable to load latest updates right now.');
    } finally {
      setMotherDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (linkedMother?.motherId) {
      fetchMotherData(linkedMother.motherId);
    } else {
      setHealthContext(null);
      setPregnancy(null);
      setReminders([]);
      setPartnerShare(null);
    }
  }, [linkedMother?.motherId, fetchMotherData]);

  const gestationalMetrics = useMemo(() => {
    return computeGestationalHeroMetrics(pregnancy);
  }, [pregnancy]);

  const sharedReminders = useMemo(() => {
    return reminders.filter((r) => r.sharedWithPartner === true && !r.completed);
  }, [reminders]);

  const displayMotherName = healthContext?.preferredName || linkedMother?.motherName || 'Mother';

  useEffect(() => {
    if (!partnerId || partnerId === 'partner-user') return;
    let isMounted = true;
    getPartnerActiveRelationship(partnerId)
      .then((rel) => {
        if (!isMounted) return;
        if (rel && rel.status === 'active' && rel.motherId) {
          const linkData = { motherId: rel.motherId, motherName: rel.motherName || 'Mother' };
          setLinkedMother(linkData);
          localStorage.setItem('momhaven_partner_link', JSON.stringify(linkData));
        } else if (rel && rel.status === 'revoked') {
          setLinkedMother(null);
          localStorage.removeItem('momhaven_partner_link');
        }
      })
      .catch((err) => {
        console.warn('Could not query partner active relationship', err);
      });
    return () => { isMounted = false; };
  }, [partnerId]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionCode.trim()) return;
    setLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const result = await redeemPartnerConnectionCode(partnerId, partnerName, connectionCode);
      if (result.success && result.motherId) {
        const linkData = { motherId: result.motherId, motherName: result.motherName || 'Mother' };
        setLinkedMother(linkData);
        localStorage.setItem('momhaven_partner_link', JSON.stringify(linkData));
        setRedeemSuccess(result.message);
      } else {
        setRedeemError(result.message);
      }
    } catch (err) {
      setRedeemError('Error connecting. Please verify code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] text-[var(--ink-900)] flex flex-col font-body">
      {/* Top Header */}
      <header className="bg-white border-b border-[var(--border-hairline)] px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {activeTab !== 'home' && (
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="p-1 -ml-1 rounded-full text-[var(--haven-deep)] hover:bg-[var(--lavender-100)] flex items-center gap-0.5 font-display font-bold text-xs cursor-pointer transition-colors"
              aria-label="Back to Partner Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <img src="/assets/logo.png" alt="MomHaven" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          <div>
            <h1 className="font-display font-extrabold text-sm text-[var(--ink-900)] leading-none">
              MomHaven Partner
            </h1>
            <span className="text-[10px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
              Walk Every Step Together
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {linkedMother && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Connected:</span> {linkedMother.motherName}
            </div>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 rounded-full text-[var(--ink-500)] hover:bg-[var(--lavender-100)] hover:text-[var(--ink-800)] cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {!linkedMother ? (
          /* Redemption Pairing Flow */
          <div className="max-w-md mx-auto p-4 sm:p-6 space-y-5 pt-6">
            <div className="bg-white border border-[var(--border-hairline)] p-6 rounded-[24px] shadow-card-1 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] mx-auto flex items-center justify-center">
                <HeartHandshake className="w-7 h-7" />
              </div>

              <div>
                <h2 className="font-display font-bold text-[20px] text-[var(--ink-900)]">
                  Connect to Mother's Profile
                </h2>
                <p className="font-body text-[12px] text-[var(--ink-600)] mt-1">
                  Enter the 6-character connection code generated from the mother’s MomHaven app.
                </p>
              </div>

              {/* Privacy Boundary Assurance */}
              <div className="p-3 bg-purple-50 rounded-[14px] border border-purple-100 text-left text-[11px] text-purple-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Protected:</strong> You will only view birth logistics, emergency contacts, shared appointment dates, and optional mood signals if she chooses to share them. Medical clinical charts and notes remain strictly confidential between mother and clinicians.
                </span>
              </div>

              <form onSubmit={handleRedeem} className="space-y-3 pt-1">
                <input
                  type="text"
                  placeholder="HAVEN-XXX"
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono font-extrabold text-[22px] tracking-widest py-3 px-4 rounded-[14px] border-2 border-[var(--border-hairline)] focus:border-[var(--haven-deep)] uppercase bg-[var(--lavender-50)] focus:bg-white focus:outline-none"
                  maxLength={10}
                  required
                />

                {redeemError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[12px] text-left flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {redeemError}
                  </p>
                )}

                {redeemSuccess && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-[12px] text-left flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {redeemSuccess}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full py-3 text-xs"
                >
                  {loading ? 'Verifying Code...' : 'Connect to Mother'}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* Connected Partner Dashboard */
          <div className="max-w-md mx-auto p-4 space-y-4">
            {activeTab === 'home' && (
              <div className="space-y-4">
                {/* Refresh indicator or active syncing */}
                {motherDataLoading && (
                  <div className="flex items-center justify-center gap-2 p-2.5 bg-white border border-[var(--border-hairline)] rounded-md text-xs text-[var(--haven-deep)] shadow-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--haven-orchid)]" />
                    <span>Syncing {displayMotherName}’s latest updates...</span>
                  </div>
                )}

                {/* Error banner if fetching failed */}
                {motherDataError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-[16px] text-xs text-amber-800 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{motherDataError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => linkedMother && fetchMotherData(linkedMother.motherId)}
                      className="text-[11px] font-bold text-amber-900 underline hover:no-underline cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Hero Gestational Progress Card */}
                {gestationalMetrics ? (
                  <div className="bg-gradient-to-br from-[#241451] via-[#4B27A8] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-display font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Trimester {gestationalMetrics.trimester} · Week {gestationalMetrics.weeks}
                      </span>
                      <span className="text-xs font-medium text-purple-200">
                        {gestationalMetrics.eddFormatted
                          ? `Due ${gestationalMetrics.eddFormatted}`
                          : `~${gestationalMetrics.weeksRemaining} Weeks to Due Date`}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">
                        Supporting {displayMotherName}
                      </h3>
                      <p className="font-body text-xs text-purple-100 mt-1 leading-relaxed">
                        {gestationalMetrics.babySize.fact} Baby is about the size of {gestationalMetrics.babySize.size} {gestationalMetrics.babySize.emoji}. Ensure transport logistics and emergency funds are ready!
                      </p>
                    </div>

                    {/* Gestational journey progress bar */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[10px] text-purple-200 font-semibold mb-1">
                        <span>Week {gestationalMetrics.weeks} of 40</span>
                        <span>{gestationalMetrics.progressPercent}% of journey</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${gestationalMetrics.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Honest Empty State when mother has no active pregnancy or journey is not yet dated */
                  <div className="bg-gradient-to-br from-[#241451] via-[#352063] to-[#452778] text-white p-5 rounded-[24px] shadow-card-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-display font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                        Journey Not Started Yet
                      </span>
                      <span className="text-xs font-medium text-purple-200">
                        Partner Linked
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">
                        Supporting {displayMotherName}
                      </h3>
                      <p className="font-body text-xs text-purple-100 mt-1 leading-relaxed">
                        {displayMotherName} has not set up an active pregnancy record yet. As soon as clinical dating or gestational details are added, weeks and baby milestones will appear here.
                      </p>
                    </div>
                  </div>
                )}

                {/* Partner Mood Wellness Signal Card */}
                {partnerShare?.moodSignal ? (
                  <div className={`p-4 rounded-[22px] border shadow-card-1 space-y-3 transition-all ${
                    partnerShare.moodSignal === 'low'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : partnerShare.moodSignal === 'ok'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          partnerShare.moodSignal === 'low'
                            ? 'bg-rose-100 text-rose-700'
                            : partnerShare.moodSignal === 'ok'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Heart className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-[11px] font-display font-bold uppercase tracking-wider">
                          {partnerShare.moodSignal === 'low'
                            ? 'Gentle Care Signal'
                            : partnerShare.moodSignal === 'ok'
                            ? 'Daily Wellness Signal'
                            : 'Thriving Signal'}
                        </span>
                      </div>
                      {partnerShare.sharedAt && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          Shared today
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-[14px] leading-snug">
                        {partnerShare.moodSignal === 'low'
                          ? `She might be feeling a bit low today — here's how you can help`
                          : partnerShare.moodSignal === 'ok'
                          ? `She’s taking things one step at a time today`
                          : `She is feeling bright and grounded today!`}
                      </h4>
                      <p className="text-[12px] opacity-85 mt-1 leading-relaxed">
                        {PARTNER_MOOD_TIPS[partnerShare.moodSignal].description}
                      </p>
                    </div>

                    {/* Actionable Partner Guidance */}
                    <div className="space-y-1.5 pt-1 border-t border-black/5">
                      <span className="text-[11px] font-display font-bold uppercase tracking-wider opacity-70">
                        Ways You Can Help Today
                      </span>
                      <ul className="space-y-1.5 text-[12px] leading-relaxed">
                        {PARTNER_MOOD_TIPS[partnerShare.moodSignal].actionTips.slice(0, 2).map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold shrink-0">•</span>
                            <span>{tip.en}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('support')}
                      className="w-full py-2 px-3 text-[12px] font-display font-bold rounded-xl bg-white border border-[var(--border-hairline)] hover:bg-white/80 transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Open Partner Support Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}

                {/* Shared Appointments Feed */}
                <div className="bg-white border border-[var(--border-hairline)] p-4 sm:p-5 rounded-[22px] shadow-card-1 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                    <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[var(--haven-orchid)]" />
                      Shared Clinical Appointments
                    </h4>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                      {sharedReminders.length > 0 ? `${sharedReminders.length} Shared` : 'None Shared'}
                    </span>
                  </div>

                  {sharedReminders.length > 0 ? (
                    <div className="space-y-2">
                      {sharedReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="p-3 bg-[var(--lavender-50)] rounded-[14px] border border-[var(--border-hairline)] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-xs text-[var(--ink-900)]">
                              {reminder.title}
                            </span>
                            <span className="text-[11px] text-[var(--haven-orchid)] font-bold">
                              {reminder.dueDate ? formatAppointmentDate(reminder.dueDate) : 'Upcoming'}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-[11px] text-[var(--ink-600)]">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Honest Empty State when no appointments have been shared with partner yet */
                    <div className="p-5 bg-[var(--lavender-50)] rounded-[14px] border border-[var(--border-hairline)] text-center space-y-1.5">
                      <Calendar className="w-6 h-6 text-purple-400 mx-auto opacity-70" />
                      <p className="font-display font-bold text-xs text-[var(--ink-800)]">
                        No shared appointments yet
                      </p>
                      <p className="font-body text-[11px] text-[var(--ink-500)] max-w-xs mx-auto">
                        When {displayMotherName} marks an upcoming clinic visit or antenatal contact to share with you, it will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('birthplan')}
                    className="p-3.5 bg-white border border-[var(--border-hairline)] rounded-[18px] text-left hover:border-[var(--haven-orchid)] shadow-xs cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-[var(--haven-deep)] mb-1.5" />
                    <h5 className="font-display font-bold text-[13px]">Birth Logistics</h5>
                    <p className="text-[11px] text-gray-500">Taxi, hospital &amp; bag checklist</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('support')}
                    className="p-3.5 bg-white border border-[var(--border-hairline)] rounded-[18px] text-left hover:border-[var(--haven-orchid)] shadow-xs cursor-pointer"
                  >
                    <HeartHandshake className="w-5 h-5 text-emerald-600 mb-1.5" />
                    <h5 className="font-display font-bold text-[13px]">Support Guide</h5>
                    <p className="text-[11px] text-gray-500">Massage, foods &amp; mood tips</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <PartnerSupportHub />
            )}

            {activeTab === 'birthplan' && (
              <PartnerBirthPlanView
                motherName={displayMotherName}
                onSaveTransportPlan={() => {}}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencySafetyHub />
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center font-display font-bold text-lg">
                    {partnerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">{partnerName}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">Active Partner Link</p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--lavender-50)] rounded-[14px] text-xs text-[var(--ink-700)] space-y-1">
                  <p><strong>Linked Mother:</strong> {displayMotherName}</p>
                  <p><strong>Connection Scope:</strong> Birth Logistics, Emergency Transport, Shared Reminders</p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('momhaven_partner_link');
                      setLinkedMother(null);
                    }}
                    className="w-full py-2.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Unlink from Mother Profile
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSignOut}
                    className="w-full py-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Partner Bottom Navigation */}
      {linkedMother && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border-hairline)] shadow-xs py-2 px-3 z-40">
          <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'support', label: 'Support', icon: HeartHandshake },
              { id: 'birthplan', label: 'Birth Plan', icon: MapPin },
              { id: 'emergency', label: 'Emergency', icon: ShieldAlert, urgent: true },
              { id: 'profile', label: 'Profile', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-[12px] transition-all cursor-pointer ${
                    isActive
                      ? tab.urgent
                        ? 'text-[#E11D3C] font-bold'
                        : 'text-[var(--haven-orchid)] font-bold'
                      : tab.urgent
                      ? 'text-red-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
