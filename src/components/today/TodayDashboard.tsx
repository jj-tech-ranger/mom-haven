// src/components/today/TodayDashboard.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  Syringe, 
  Pill, 
  Baby, 
  ArrowRight, 
  Plus, 
  Calendar, 
  AlertTriangle,
  Heart,
  BookOpen,
  RefreshCw,
  MapPin,
  ChevronRight,
  Activity,
  TrendingUp,
  PhoneCall,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { Pregnancy, Reminder, Child, AncEncounter } from '../../types';
import { HealthContext } from '../../types/healthContext';
import { getHealthContext, saveHealthContext } from '../../services/healthContextService';
import { getActivePregnancy } from '../../services/pregnancyService';
import { getChildren } from '../../services/childService';
import { getUpcomingReminders, createReminder } from '../../services/reminderService';
import { deriveTodayContext, TodayContext } from '../../services/todayContextService';
import { DailyHealthLog, SymptomsValues } from '../../types/healthLog';
import { getTodaysMoodLog, getMoodStreak, getConsecutiveNegativeMoodCount, getDailyHealthLogsByType } from '../../services/healthLogService';
import { DailyPlanItem, SuggestedReminder } from '../../types/advancedPersonalization';

// Modals & Cards
import ProgressRibbon from './ProgressRibbon';
import DailyCheckInCard from './DailyCheckInCard';
import EmergencySafetyHub from '../emergency/EmergencySafetyHub';
import NotificationCenter from './NotificationCenter';
import ReminderDetailModal from './ReminderDetailModal';
import ContextSelectorModal from './ContextSelectorModal';
import AskHavenLauncherSheet from './AskHavenLauncherSheet';
import PersonalizedDailyPlanView from './PersonalizedDailyPlanView';
import AppointmentPrepModal from './AppointmentPrepModal';
import { PersonalizedResources } from '../resources/PersonalizedResources';
import { HealthLogModal } from '../health/HealthLogModal';

export interface TodayDashboardProps {
  userId?: string;
  userName?: string;
  healthContext?: HealthContext | null;
  pregnancy?: Pregnancy | null;
  children?: Child[];
  reminders?: Reminder[];
  ancEncounters?: AncEncounter[];
  onNavigate?: (tab: 'today' | 'journey' | 'haven' | 'records' | 'profile' | 'Today' | 'Journey' | 'Haven' | 'Records' | 'Profile') => void;
  onOpenNotifications?: () => void;
  onOpenContextSelector?: () => void;
  onOpenReminderDetail?: (reminder: Reminder) => void;
  onOpenAskHaven?: (prompt?: string) => void;
  onOpenAddAnc?: () => void;
  onLogAncVisit?: () => void;
  onOpenAncVisit?: (visit: AncEncounter) => void;
  onOpenTimeline?: () => void;
  onOpenBirthPlan?: () => void;
  onOpenEmergency?: () => void;
  onRefresh?: () => void;
}

function getIconComponent(iconType: string): LucideIcon {
  switch (iconType) {
    case 'calendar': return Calendar;
    case 'pill': return Pill;
    case 'syringe': return Syringe;
    case 'baby': return Baby;
    case 'heart': return Heart;
    case 'shield': return ShieldCheck;
    case 'alert': return AlertTriangle;
    case 'book': return BookOpen;
    case 'sparkles': return Sparkles;
    default: return Sparkles;
  }
}

function getPriorityEmoji(iconType: string, category?: string): string {
  switch (iconType) {
    case 'syringe': return '💉';
    case 'pill': return '💊';
    case 'calendar': return '🗓️';
    case 'baby': return '👶';
    case 'heart': return '🩺';
    case 'shield': return '🛡️';
    case 'alert': return '⚠️';
    case 'book': return '📖';
    case 'sparkles': return '✨';
    case 'activity': return '📊';
    default:
      if (category === 'clinical') return '🩺';
      if (category === 'reminder') return '🔔';
      if (category === 'education') return '💡';
      if (category === 'danger_sign') return '🚨';
      return '🌸';
  }
}

export default function TodayDashboard({
  userId,
  userName = 'Mama',
  healthContext: propContext,
  pregnancy: propPregnancy,
  children: propChildren,
  reminders: propReminders,
  onNavigate,
  onOpenNotifications,
  onOpenContextSelector,
  onOpenReminderDetail,
  onOpenAskHaven,
  onLogAncVisit,
  onOpenEmergency,
  onRefresh,
}: TodayDashboardProps) {
  // Loaded state
  const [internalContext, setInternalContext] = useState<HealthContext | null>(propContext ?? null);
  const [internalPregnancy, setInternalPregnancy] = useState<Pregnancy | null>(propPregnancy ?? null);
  const [internalChildren, setInternalChildren] = useState<Child[]>(propChildren ?? []);
  const [internalReminders, setInternalReminders] = useState<Reminder[]>(propReminders ?? []);
  const [todaysMoodLog, setTodaysMoodLog] = useState<DailyHealthLog | null>(null);
  const [moodStreak, setMoodStreak] = useState<number>(0);
  const [consecutiveNegativeDays, setConsecutiveNegativeDays] = useState<number>(0);
  const [flaggedDangerLog, setFlaggedDangerLog] = useState<DailyHealthLog | null>(null);
  const [loading, setLoading] = useState<boolean>(!propContext && !propPregnancy && !!userId);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showEmergencyHub, setShowEmergencyHub] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [showAskHavenSheet, setShowAskHavenSheet] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showHealthLogModal, setShowHealthLogModal] = useState(false);
  const [showAppointmentPrepModal, setShowAppointmentPrepModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [reminderAddFeedback, setReminderAddFeedback] = useState<string | null>(null);
  const [addingReminderId, setAddingReminderId] = useState<string | null>(null);
  const [showPersonalizationDetails, setShowPersonalizationDetails] = useState(false);

  // Safe navigation normalizer
  const handleNavigate = useCallback((targetTab: string) => {
    if (onNavigate) {
      onNavigate(targetTab.toLowerCase() as any);
    }
  }, [onNavigate]);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ctx, preg, kids, rems, moodLog, streak, negCount, recentSymptoms] = await Promise.all([
        propContext !== undefined ? Promise.resolve(propContext) : getHealthContext(userId).catch(() => null),
        propPregnancy !== undefined ? Promise.resolve(propPregnancy) : getActivePregnancy(userId).catch(() => null),
        propChildren !== undefined ? Promise.resolve(propChildren) : getChildren(userId).catch(() => []),
        propReminders !== undefined ? Promise.resolve(propReminders) : getUpcomingReminders(userId).catch(() => []),
        getTodaysMoodLog(userId).catch(() => null),
        getMoodStreak(userId).catch(() => 0),
        getConsecutiveNegativeMoodCount(userId).catch(() => 0),
        getDailyHealthLogsByType(userId, 'symptoms', 5).catch(() => []),
      ]);

      setInternalContext(ctx);
      setInternalPregnancy(preg);
      setInternalChildren(kids);
      setInternalReminders(rems);
      setTodaysMoodLog(moodLog);
      setMoodStreak(streak);
      setConsecutiveNegativeDays(negCount);

      const dangerLog = (recentSymptoms as DailyHealthLog[]).find(
        (l) => (l.values as SymptomsValues)?.hasDangerSigns === true
      );
      setFlaggedDangerLog(dangerLog || null);
    } catch (err) {
      console.error('Error fetching today dashboard data', err);
      setError('Unable to load some health updates right now.');
    } finally {
      setLoading(false);
    }
  }, [userId, propContext, propPregnancy, propChildren, propReminders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMoodLogged = useCallback((newLog: DailyHealthLog) => {
    setTodaysMoodLog(newLog);
    if (userId) {
      getMoodStreak(userId).then(setMoodStreak).catch(() => {});
      getConsecutiveNegativeMoodCount(userId).then(setConsecutiveNegativeDays).catch(() => {});
    }
  }, [userId]);

  // Derive Today Context deterministically
  const effectiveContext = propContext ?? internalContext;
  const effectivePregnancy = propPregnancy ?? internalPregnancy;
  const effectiveChildren = propChildren ?? internalChildren;
  const effectiveReminders = propReminders ?? internalReminders;

  const todayContext: TodayContext = deriveTodayContext({
    healthContext: effectiveContext,
    clinicalPregnancy: effectivePregnancy,
    children: effectiveChildren,
    reminders: effectiveReminders,
    userName,
    now: new Date(),
    todaysMoodLog,
  });

  const displayedPriorities = useMemo(() => {
    const list = [...todayContext.priorities];
    if (flaggedDangerLog) {
      const vals = flaggedDangerLog.values as SymptomsValues;
      const symptomsList = vals?.symptoms?.join(', ') || 'Reported red flag symptoms';
      const exists = list.some((p) => p.id === `danger-symptom-${flaggedDangerLog.id}`);
      if (!exists) {
        list.unshift({
          id: `danger-symptom-${flaggedDangerLog.id}`,
          title: todayContext.language === 'sw' ? 'Tahadhari ya Dalili za Hatari' : 'Flagged Red Flag Symptoms',
          description: todayContext.language === 'sw'
            ? `Ulirekodi: ${symptomsList}. Rekodi ya kliniki imesasishwa kwa uchunguzi wa daktari au mkunga.`
            : `You recorded: ${symptomsList}. A clinical record has been created for your healthcare provider.`,
          badge: todayContext.language === 'sw' ? 'Kwenye Rekodi' : 'Records Linked',
          category: 'danger_sign',
          iconType: 'alert',
          accentColor: 'rose',
          actionLabel: todayContext.language === 'sw' ? 'Tazama Rekodi' : 'View in Records',
          actionTab: 'records',
        });
      }
    }
    return list;
  }, [todayContext.priorities, todayContext.language, flaggedDangerLog]);

  const shouldShowCheckInNotification = !todaysMoodLog && new Date().getHours() >= 18;

  // Modal Handlers
  const handleOpenEmergency = () => {
    if (onOpenEmergency) onOpenEmergency();
    else setShowEmergencyHub(true);
  };

  const handleOpenAskHaven = (prompt?: string) => {
    if (onOpenAskHaven) onOpenAskHaven(prompt);
    else setShowAskHavenSheet(true);
  };

  const handleOpenNotifications = () => {
    if (onOpenNotifications) onOpenNotifications();
    else setShowNotifications(true);
  };

  const handleOpenContextSelector = () => {
    if (onOpenContextSelector) onOpenContextSelector();
    else setShowContextSelector(true);
  };

  const handleOpenReminder = (reminder: Reminder) => {
    if (onOpenReminderDetail) onOpenReminderDetail(reminder);
    else setSelectedReminder(reminder);
  };

  const handleDailyPlanAction = useCallback((item: DailyPlanItem) => {
    if (item.action.type === 'ask_haven') {
      handleOpenAskHaven(item.action.target || item.title);
    } else if (item.action.type === 'view_resource') {
      setShowResourcesModal(true);
    } else if (item.action.type === 'health_log') {
      setShowHealthLogModal(true);
    } else if (item.action.type === 'appointment_prep') {
      setShowAppointmentPrepModal(true);
    } else if (item.action.type === 'open_reminder' && item.action.target) {
      const found = effectiveReminders.find(r => r.id === item.action.target);
      if (found) handleOpenReminder(found);
    } else if (item.action.type === 'navigate') {
      handleNavigate(item.action.target || 'records');
    }
  }, [effectiveReminders, handleNavigate]);

  const handleAddSuggestedReminder = useCallback(async (suggestion: SuggestedReminder) => {
    if (!userId) return;
    try {
      setAddingReminderId(suggestion.id);
      await createReminder({
        userId,
        title: suggestion.title,
        description: suggestion.description,
        dueDate: suggestion.suggestedDate,
        category: suggestion.category === 'kepi' ? 'immunization' : suggestion.category,
        completed: false,
      });
      setReminderAddFeedback(`Scheduled reminder: "${suggestion.title}"`);
      setTimeout(() => setReminderAddFeedback(null), 3500);
      fetchData();
    } catch (err) {
      console.error('Failed to add suggested reminder', err);
    } finally {
      setAddingReminderId(null);
    }
  }, [userId, fetchData]);

  const handleSaveQuestionsForClinician = useCallback(async (questions: string[]) => {
    if (!userId || !effectiveContext) return;
    try {
      const updatedContext: HealthContext = {
        ...effectiveContext,
        questionsForClinician: questions,
        updatedAt: new Date().toISOString(),
      };
      await saveHealthContext(userId, updatedContext, 'preferences_update');
      setInternalContext(updatedContext);
    } catch (err) {
      console.error('Failed to save questions for clinician', err);
    }
  }, [userId, effectiveContext]);

  // Loading Skeleton
  if (loading) {
    return (
      <div 
        className="p-4 sm:p-6 space-y-4 animate-pulse max-w-lg mx-auto" 
        aria-busy="true" 
        aria-label="Loading your MomHaven daily home"
      >
        <div className="flex justify-between items-center pt-1">
          <div className="space-y-1.5 w-1/2">
            <div className="h-3.5 bg-[var(--lavender-200)] rounded-full w-24" />
            <div className="h-7 bg-[var(--lavender-200)] rounded-lg w-36" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-[var(--lavender-200)] rounded-full" />
            <div className="h-10 w-10 bg-[var(--lavender-200)] rounded-full" />
          </div>
        </div>
        <div className="h-56 bg-[var(--lavender-200)] rounded-[24px]" />
        <div className="h-28 bg-[var(--lavender-100)] rounded-[20px]" />
        <div className="h-28 bg-[var(--lavender-100)] rounded-[20px]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-[var(--lavender-100)] rounded-[20px]" />
          <div className="h-24 bg-[var(--lavender-100)] rounded-[20px]" />
        </div>
      </div>
    );
  }

  // Error Recovery View
  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-rose-900">
            Unable to load your updates
          </h3>
          <p className="font-body text-sm text-rose-700">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              if (onRefresh) onRefresh();
              fetchData();
            }}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white font-display font-bold text-xs hover:bg-rose-700 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 pb-10 max-w-lg mx-auto w-full">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GREETING */}
      {/* ========================================================================= */}
      <header className="flex justify-between items-center pt-1">
        <div>
          <span className="font-body text-[11px] font-bold text-[var(--ink-400)] tracking-widest uppercase block">
            {todayContext.greeting.salutation}
          </span>
          <h1 className="font-display font-extrabold text-[24px] sm:text-[26px] text-[var(--ink-900)] leading-tight">
            {todayContext.greeting.name}
          </h1>
          <p className="text-[11px] text-[var(--ink-500)] font-body">
            {todayContext.greeting.dateFormatted}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Emergency 1199 Persistent Chip */}
          <button
            type="button"
            onClick={handleOpenEmergency}
            className="h-10 px-2.5 sm:px-3 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-display font-bold text-[12px] flex items-center gap-1.5 shadow-xs hover:bg-rose-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label="Emergency Guide and Kenya MOH 1199 hotline"
            title="Kenya MOH Emergency Hotline 1199 & Danger Signs Guide"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-[11px] font-extrabold tracking-tight">1199</span>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={handleOpenNotifications}
            className="w-10 h-10 rounded-full bg-white border border-[var(--border-hairline)] flex items-center justify-center text-[var(--haven-deep)] shadow-xs hover:bg-[var(--lavender-100)] transition-colors relative cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
            aria-label="View notifications and reminders"
          >
            <Bell className="w-5 h-5" />
            {(effectiveReminders.some(r => !r.completed) || shouldShowCheckInNotification) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* User Avatar / Lifecycle Stage Context Switcher */}
          <button
            type="button"
            onClick={handleOpenContextSelector}
            className="h-10 px-3 rounded-full bg-[var(--haven-deep)] text-white font-display font-bold text-[12px] flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--haven-deep)]"
            aria-label={`Current stage: ${todayContext.stageTitle}. Tap to switch context.`}
          >
            <span className="capitalize">{todayContext.lifecycleStage}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC HERO SECTION PER LIFECYCLE STAGE */}
      {/* ========================================================================= */}
      {/* A. Pregnancy Stage Hero */}
      {todayContext.hero.type === 'pregnancy' && (
        <section 
          aria-label="Pregnancy progress"
          className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #33178A 0%, #4B27A8 45%, #6E3CB9 80%, #9167C2 100%)'
          }}
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-display font-bold tracking-widest uppercase text-[#E5DFF0] flex items-center gap-1.5">
                <span>Your Pregnancy</span>
                {todayContext.hero.isAuthoritative ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-semibold">
                    Verified Record
                  </span>
                ) : todayContext.hero.gestationalWeeks > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-semibold">
                    Self-Reported
                  </span>
                ) : null}
              </span>

              {todayContext.hero.gestationalWeeks > 0 && (
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
                  Trimester {todayContext.hero.trimester}
                </span>
              )}
            </div>

            {todayContext.hero.gestationalWeeks > 0 ? (
              <>
                <h2 className="font-display font-extrabold text-[32px] text-white tracking-tight leading-none mt-1">
                  Week {todayContext.hero.gestationalWeeks}
                </h2>

                <p className="font-body text-[14px] text-[#F7F3FC] mt-1.5 flex items-center gap-1.5 font-normal">
                  Baby is about the size of {todayContext.hero.babySize.size} <span className="text-[16px]">{todayContext.hero.babySize.emoji}</span>
                </p>

                <p className="text-[11px] text-white/80 mt-1 line-clamp-1">
                  {todayContext.hero.babySize.fact}
                </p>

                {/* Organic Haven Ribbon Curve SVG with Dot Indicator */}
                <ProgressRibbon
                  progressRatio={todayContext.hero.progressRatio}
                  progressPercent={todayContext.hero.progressPercent}
                  startLabel="Week 1"
                  endLabel={todayContext.hero.eddFormatted ? `EDD ${todayContext.hero.eddFormatted}` : 'Week 40'}
                  ringColorClass="ring-[#4B27A8]"
                  labelColorClass="text-[#E5DFF0]"
                />
              </>
            ) : (
              <div className="py-2">
                <h2 className="font-display font-extrabold text-[22px] text-white leading-tight">
                  Welcome to your pregnancy journey
                </h2>
                <p className="font-body text-xs text-[#F7F3FC] mt-1.5 leading-relaxed">
                  Record your Last Menstrual Period (LMP) or clinical ANC dates to track your weekly growth accurately.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate('journey')}
                    className="px-4 py-2 rounded-full bg-white text-[var(--haven-deep)] font-display font-bold text-xs hover:bg-white/90 cursor-pointer shadow-xs"
                  >
                    Set Up Pregnancy Dates
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* B. Postpartum Stage Hero */}
      {todayContext.hero.type === 'postpartum' && (
        <section 
          aria-label="Postpartum recovery"
          className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #4F46E5 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-display font-bold tracking-widest uppercase text-blue-200">
                Postpartum Recovery
              </span>
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
                MOH Postnatal Guidance
              </span>
            </div>

            <h2 className="font-display font-extrabold text-[26px] text-white tracking-tight leading-tight mt-1">
              {todayContext.hero.headline}
            </h2>

            <p className="font-body text-[14px] text-blue-100 mt-2 leading-relaxed">
              {todayContext.hero.subheadline}
            </p>

            {/* Organic Haven Ribbon Curve for Postpartum Recovery */}
            <ProgressRibbon
              progressRatio={todayContext.hero.progressRatio ?? 0.25}
              progressPercent={todayContext.hero.progressPercent ?? 25}
              startLabel={todayContext.hero.progressStartLabel || 'Birth (Day 1)'}
              endLabel={todayContext.hero.progressEndLabel || '6 Weeks PNC Check'}
              ringColorClass="ring-[#2563EB]"
              labelColorClass="text-blue-100"
            />

            <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs font-display text-blue-100">
              <span>Rest, hydration & gentle pelvic healing</span>
              <button
                type="button"
                onClick={() => handleNavigate('records')}
                className="text-white font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>PNC Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* C. Parenting Stage Hero */}
      {todayContext.hero.type === 'parenting' && (
        <section 
          aria-label="Parenting journey"
          className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-display font-bold tracking-widest uppercase text-emerald-200">
                Parenting & Child Health
              </span>
              {todayContext.hero.hasChildRecord && (
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
                  KEPI Schedule Active
                </span>
              )}
            </div>

            <h2 className="font-display font-extrabold text-[26px] text-white tracking-tight leading-tight mt-1">
              {todayContext.hero.headline}
            </h2>

            <p className="font-body text-[14px] text-emerald-100 mt-2 leading-relaxed">
              {todayContext.hero.subheadline}
            </p>

            {/* Organic Haven Ribbon Curve for Early Childhood Milestones */}
            <ProgressRibbon
              progressRatio={todayContext.hero.progressRatio ?? 0.35}
              progressPercent={todayContext.hero.progressPercent ?? 35}
              startLabel={todayContext.hero.progressStartLabel || 'Birth'}
              endLabel={todayContext.hero.progressEndLabel || 'KEPI Schedule'}
              ringColorClass="ring-[#059669]"
              labelColorClass="text-emerald-100"
            />

            <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs font-display text-emerald-100">
              <span>Growth & Immunization Tracking</span>
              <button
                type="button"
                onClick={() => handleNavigate('records')}
                className="text-white font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Child Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* D. Planning Stage Hero */}
      {todayContext.hero.type === 'planning' && (
        <section 
          aria-label="Preconception planning"
          className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #831843 0%, #BE185D 50%, #DB2777 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-display font-bold tracking-widest uppercase text-pink-200">
                Preconception Preparation
              </span>
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
                Baseline Wellness
              </span>
            </div>

            <h2 className="font-display font-extrabold text-[26px] text-white tracking-tight leading-tight mt-1">
              {todayContext.hero.headline}
            </h2>

            <p className="font-body text-[14px] text-pink-100 mt-2 leading-relaxed">
              {todayContext.hero.subheadline}
            </p>

            <p className="text-xs text-pink-200 mt-3 pt-3 border-t border-white/20">
              Primary focus: {todayContext.hero.primaryFocus}
            </p>
          </div>
        </section>
      )}

      {/* E. Supporter Stage Hero */}
      {todayContext.hero.type === 'supporter' && (
        <section 
          aria-label="Supporter guide"
          className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #8B5CF6 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-display font-bold tracking-widest uppercase text-purple-200">
                Supporter & Partner Guide
              </span>
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
                Care Companion
              </span>
            </div>

            <h2 className="font-display font-extrabold text-[26px] text-white tracking-tight leading-tight mt-1">
              {todayContext.hero.headline}
            </h2>

            <p className="font-body text-[14px] text-purple-100 mt-2 leading-relaxed">
              {todayContext.hero.subheadline}
            </p>

            <p className="text-xs text-purple-200 mt-3 pt-3 border-t border-white/20">
              Daily Tip: {todayContext.hero.supportTip}
            </p>
          </div>
        </section>
      )}

      {/* F. Exploring Stage Hero */}
      {todayContext.hero.type === 'exploring' && (
        <section 
          aria-label="Health learning"
          className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-display font-bold tracking-widest uppercase text-slate-300">
                Health Learning
              </span>
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
                Kenya MOH Guidance
              </span>
            </div>

            <h2 className="font-display font-extrabold text-[26px] text-white tracking-tight leading-tight mt-1">
              {todayContext.hero.headline}
            </h2>

            <p className="font-body text-[14px] text-slate-200 mt-2 leading-relaxed">
              {todayContext.hero.subheadline}
            </p>

            <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-white/20">
              Focus: {todayContext.hero.learningFocus}
            </p>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2.5 DAILY MOOD & ENERGY CHECK-IN */}
      {/* ========================================================================= */}
      {userId && (
        <section aria-label="Daily Check-In">
          <DailyCheckInCard
            userId={userId}
            lifecycleStage={todayContext.lifecycleStage}
            todaysMoodLog={todaysMoodLog}
            streak={moodStreak}
            consecutiveNegativeDays={consecutiveNegativeDays}
            microInsight={todayContext.checkInStatus?.microInsight}
            language={todayContext.language}
            onLogged={handleMoodLogged}
            onNavigate={handleNavigate}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2.8 INSIGHTS TEASER ENTRY POINT */}
      {/* ========================================================================= */}
      <section aria-label="Health and Wellbeing Insights Teaser">
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleNavigate('journey')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigate('journey');
            }
          }}
          className="bg-gradient-to-r from-[var(--lavender-50)] via-white to-white border border-[var(--border-hairline)] rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-white border border-[var(--lavender-200)] flex items-center justify-center text-[var(--haven-orchid)] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <TrendingUp className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-[13px] sm:text-[14px] text-[var(--ink-900)] truncate">
                  Wellbeing & Health Patterns
                </h4>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--lavender-100)] text-[var(--haven-deep)]">
                  Insights
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-600)] font-body truncate">
                See your patterns in mood reflections, vital checks, and milestones
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[12px] font-display font-bold text-[var(--haven-orchid)] group-hover:translate-x-0.5 transition-transform">
            <span className="hidden xs:inline">See patterns</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WHAT MATTERS TODAY (DETERMINISTIC PRIORITIES) */}
      {/* ========================================================================= */}
      <section aria-labelledby="priorities-heading">
        <div className="flex justify-between items-end mb-3 px-1">
          <div>
            <h3 
              id="priorities-heading" 
              className="font-display font-extrabold text-[17px] text-[var(--ink-900)] tracking-tight"
            >
              What Matters Today
            </h3>
            <p className="text-[11px] text-[var(--ink-500)] font-body">
              {todayContext.provenanceSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNotifications}
            className="text-[12px] font-display font-semibold text-[var(--haven-orchid)] hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {displayedPriorities.map((item) => {
            const Icon = getIconComponent(item.iconType);

            // Subtle color schemes matching MomHaven palette
            const borderAccentClass = item.accentColor === 'rose'
              ? 'before:bg-rose-500'
              : item.accentColor === 'emerald'
              ? 'before:bg-emerald-500'
              : item.accentColor === 'blue'
              ? 'before:bg-blue-500'
              : 'before:bg-[var(--haven-orchid)]';

            const iconBgClass = item.accentColor === 'rose'
              ? 'bg-rose-50 text-rose-600'
              : item.accentColor === 'emerald'
              ? 'bg-emerald-50 text-emerald-600'
              : item.accentColor === 'blue'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-[var(--lavender-100)] text-[var(--haven-deep)]';

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (item.specialAction === 'emergency') handleOpenEmergency();
                  else if (item.specialAction === 'askHaven') handleOpenAskHaven(item.title);
                  else if (item.reminderRef) handleOpenReminder(item.reminderRef);
                  else if (item.actionTab) handleNavigate(item.actionTab);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.specialAction === 'emergency') handleOpenEmergency();
                    else if (item.specialAction === 'askHaven') handleOpenAskHaven(item.title);
                    else if (item.reminderRef) handleOpenReminder(item.reminderRef);
                    else if (item.actionTab) handleNavigate(item.actionTab);
                  }
                }}
                className={`bg-white rounded-[18px] border border-[var(--border-hairline)] p-4 flex items-center justify-between shadow-card-1 hover:shadow-card-2 transition-all cursor-pointer relative overflow-hidden pl-5 before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:rounded-r-full ${borderAccentClass} focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]`}
              >
                <div className="flex items-center gap-3.5 pr-2 min-w-0">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 ${iconBgClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] select-none shrink-0" aria-hidden="true">
                        {getPriorityEmoji(item.iconType, item.category)}
                      </span>
                      <h4 className="font-display font-bold text-[14px] sm:text-[15px] text-[var(--ink-900)] leading-snug truncate">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-display font-semibold bg-[var(--lavender-50)] text-[var(--haven-deep)]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                    {item.category === 'danger_sign' && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate('records');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-display font-bold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          <span>View in Health Records</span>
                          <ArrowRight className="w-3 h-3 text-rose-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-400)] shrink-0 hover:text-[var(--haven-deep)] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3.5 ADVANCED PERSONALIZATION: DAILY PLAN & SUGGESTED REMINDERS */}
      {/* ========================================================================= */}
      {todayContext.advancedPersonalization?.dailyPlan && todayContext.advancedPersonalization.dailyPlan.length > 0 && (
        <PersonalizedDailyPlanView
          items={todayContext.advancedPersonalization.dailyPlan}
          topResource={todayContext.advancedPersonalization.topResourceRecommendation}
          onAction={handleDailyPlanAction}
          onOpenResource={() => setShowResourcesModal(true)}
          onOpenAppointmentPrep={() => setShowAppointmentPrepModal(true)}
        />
      )}

      {/* Suggested Reminders (Kenya MOH Guidance) */}
      {todayContext.advancedPersonalization?.suggestedReminders && todayContext.advancedPersonalization.suggestedReminders.length > 0 && (
        <section aria-labelledby="suggested-reminders-heading" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 id="suggested-reminders-heading" className="font-display font-extrabold text-[15px] text-[var(--ink-900)]">
                Kenya MOH Recommended Checkups
              </h3>
              <p className="text-[11px] text-[var(--ink-500)] font-body">
                Standard guidelines for your current milestone (not a confirmed clinic booking)
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] font-semibold">
              MOH Schedule
            </span>
          </div>

          {reminderAddFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reminderAddFeedback}</span>
            </div>
          )}

          <div className="space-y-2">
            {todayContext.advancedPersonalization.suggestedReminders.map((sug) => (
              <div
                key={sug.id}
                className="p-3.5 rounded-[18px] bg-white border border-[var(--border-hairline)] shadow-card-1 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--haven-orchid)]">
                      Target: {new Date(sug.suggestedDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 font-medium">
                      Guideline
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)] mt-0.5">
                    {sug.title}
                  </h4>
                  <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5 line-clamp-1">
                    {sug.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={addingReminderId === sug.id}
                  onClick={() => handleAddSuggestedReminder(sug)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--lavender-100)] hover:bg-[var(--lavender-200)] text-[var(--haven-deep)] font-display font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. QUICK ACTIONS GRID */}
      {/* ========================================================================= */}
      <section aria-labelledby="quick-actions-heading">
        <h3 
          id="quick-actions-heading" 
          className="font-display font-extrabold text-[15px] text-[var(--ink-900)] mb-3 px-1"
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Ask Haven */}
          <button
            type="button"
            onClick={() => handleOpenAskHaven()}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)] mb-2.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Ask Haven
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Clinical companion
            </div>
          </button>

          {/* Stage Primary Shortcut */}
          {todayContext.lifecycleStage === 'pregnancy' ? (
            <button
              type="button"
              onClick={() => {
                if (onLogAncVisit) onLogAncVisit();
                else handleNavigate('journey');
              }}
              className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)] mb-2.5 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                ANC Journey
              </div>
              <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                Contacts & timeline
              </div>
            </button>
          ) : todayContext.lifecycleStage === 'postpartum' || todayContext.lifecycleStage === 'parenting' ? (
            <button
              type="button"
              onClick={() => handleNavigate('records')}
              className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)] mb-2.5 group-hover:scale-105 transition-transform">
                <Baby className="w-5 h-5" />
              </div>
              <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Child Health
              </div>
              <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                Vaccines & growth
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowResourcesModal(true)}
              className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)] mb-2.5 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Health Topics
              </div>
              <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                Personalized guides
              </div>
            </button>
          )}

          {/* Health Vault */}
          <button
            type="button"
            onClick={() => handleNavigate('records')}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2.5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Health Vault
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Verified clinical records
            </div>
          </button>

          {/* Health Check-in (Progressive health log) */}
          <button
            type="button"
            onClick={() => setShowHealthLogModal(true)}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--haven-orchid)]"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-2.5 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Health Check-in
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Log BP, movement, rest
            </div>
          </button>
        </div>

        {/* Dedicated Emergency Safety Card */}
        <div className="mt-3 bg-rose-50/90 border border-rose-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-[13px] sm:text-[14px] text-rose-900 truncate">
                  Emergency Guide & 1199
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-200/70 text-rose-800 uppercase tracking-wider shrink-0">
                  MOH Hotline
                </span>
              </div>
              <p className="text-[11px] text-rose-700/90 font-body truncate mt-0.5">
                Immediate danger signs & toll-free emergency response
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:1199"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-display font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
              aria-label="Call Kenya MOH 1199 Emergency hotline"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 1199</span>
            </a>
            <button
              type="button"
              onClick={handleOpenEmergency}
              className="px-3 py-1.5 rounded-full bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 font-display font-bold text-xs transition-colors cursor-pointer"
            >
              Guide
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DETERMINISTIC PERSONALIZED RESOURCES */}
      {/* ========================================================================= */}
      <section aria-label="Personalized evidence-based health resources">
        <PersonalizedResources
          healthContext={internalContext}
          todayContext={todayContext}
          compact={false}
          limit={4}
          onAskHaven={(prompt) => {
            if (onOpenAskHaven) onOpenAskHaven(prompt);
            else handleNavigate('haven');
          }}
        />
      </section>

      {/* ========================================================================= */}
      {/* 6. PERSONALIZATION TAGS (LOCATION & INTERESTS) */}
      {/* ========================================================================= */}
      {(todayContext.county || todayContext.userInterests.length > 0) && (
        <aside 
          aria-label="Your personalization preferences"
          className="rounded-2xl border border-[var(--border-hairline)] bg-white p-3.5 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between text-xs font-display font-semibold text-[var(--ink-600)]">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-[var(--haven-orchid)] shrink-0" /> 
              <span className="truncate">
                {todayContext.county ? `${todayContext.county} · ` : ''}
                {todayContext.userInterests.length > 0 
                  ? `${todayContext.userInterests.length} topic${todayContext.userInterests.length > 1 ? 's' : ''}` 
                  : 'Personalized'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowPersonalizationDetails(!showPersonalizationDetails)}
                className="text-[11px] font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
              >
                {showPersonalizationDetails ? 'Hide' : 'View topics'}
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => handleNavigate('profile')}
                className="text-[11px] text-[var(--ink-500)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Edit</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          {showPersonalizationDetails && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--border-hairline)] flex flex-wrap gap-1.5">
              {todayContext.county && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--lavender-50)] px-2.5 py-0.5 text-xs text-[var(--ink-700)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--haven-orchid)]" /> 
                  <span>{todayContext.county}</span>
                </span>
              )}
              {todayContext.userInterests.slice(0, 5).map(interest => (
                <span 
                  key={interest} 
                  className="rounded-full bg-[var(--lavender-50)] px-2.5 py-0.5 text-xs text-[var(--ink-700)] capitalize"
                >
                  {interest.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALS */}
      {/* ========================================================================= */}
      {/* Emergency Safety Hub Modal */}
      {showEmergencyHub && (
        <EmergencySafetyHub 
          initialCategory={todayContext.lifecycleStage === 'postpartum' ? 'MOTHER' : todayContext.lifecycleStage === 'parenting' ? 'CHILD' : 'MOTHER'}
          onClose={() => setShowEmergencyHub(false)} 
        />
      )}

      {/* Notification Center */}
      {showNotifications && (
        <NotificationCenter
          onBack={() => setShowNotifications(false)}
          onNavigateRecords={() => {
            setShowNotifications(false);
            handleNavigate('records');
          }}
          onSelectReminder={(r) => {
            setShowNotifications(false);
            if (r.id === 'notif-checkin') {
              return;
            }
            if (r.id.startsWith('notif-danger-')) {
              handleNavigate('records');
              return;
            }
            setSelectedReminder(r);
          }}
          extraNotifications={[
            ...(flaggedDangerLog
              ? [
                  {
                    id: `notif-danger-${flaggedDangerLog.id}`,
                    userId: userId || 'user',
                    title:
                      todayContext.language === 'sw'
                        ? 'Tahadhari ya Dalili za Hatari'
                        : 'Urgent: Flagged Danger Signs Recorded',
                    description:
                      todayContext.language === 'sw'
                        ? 'Ulirekodi dalili zenye ishara za hatari. Tafadhali pitia rekodi zako za kliniki au tafuta msaada wa matibabu mara moja.'
                        : 'You recorded symptoms flagged with clinical danger signs. A provider summary has been updated in your Clinical Records.',
                    dueDate: todayContext.language === 'sw' ? 'Muhimu' : 'Urgent review',
                    category: 'Danger Signs' as const,
                    priority: 'urgent' as const,
                    read: false,
                    dateString: todayContext.language === 'sw' ? 'Kliniki' : 'Clinical priority',
                    hasDangerSigns: true,
                    recordsLink: true,
                  },
                ]
              : []),
            ...(shouldShowCheckInNotification
              ? [
                  {
                    id: 'notif-checkin',
                    userId: userId || 'user',
                    title:
                      todayContext.language === 'sw'
                        ? 'Ukumbusho wa Jioni: Kujichunguza'
                        : 'Evening Check-in: How was your day?',
                    description:
                      todayContext.language === 'sw'
                        ? 'Chukua muda mfupi kurekodi hisia na nguvu zako za leo ili kuelewa vyema safari yako.'
                        : 'Take a gentle moment to log your mood and energy today to track your wellness journey.',
                    dueDate: todayContext.language === 'sw' ? 'Leo jioni' : 'Tonight',
                    category: 'Insights' as const,
                    priority: 'high' as const,
                    read: false,
                    dateString: todayContext.language === 'sw' ? 'Ukumbusho wa jioni' : 'Evening reminder',
                  },
                ]
              : []),
          ]}
        />
      )}

      {/* Context Selector Modal */}
      {showContextSelector && userId && (
        <ContextSelectorModal
          userId={userId}
          activePregnancy={effectivePregnancy}
          activeContextId={effectivePregnancy?.id || ''}
          onSelectContext={() => setShowContextSelector(false)}
          onClose={() => setShowContextSelector(false)}
          onAddNew={() => {
            setShowContextSelector(false);
            handleNavigate('journey');
          }}
        />
      )}

      {/* Reminder Detail Modal */}
      {selectedReminder && (
        <ReminderDetailModal
          reminder={selectedReminder}
          onClose={() => setSelectedReminder(null)}
          onLogVisit={() => {
            setSelectedReminder(null);
            handleNavigate('records');
          }}
        />
      )}

      {/* Ask Haven Launcher Sheet */}
      {showAskHavenSheet && (
        <AskHavenLauncherSheet
          contextPrompts={todayContext.advancedPersonalization?.contextAwareHavenPrompts}
          onClose={() => setShowAskHavenSheet(false)}
          onOpenFullChat={(prompt) => {
            setShowAskHavenSheet(false);
            if (onOpenAskHaven) onOpenAskHaven(prompt);
            else handleNavigate('haven');
          }}
        />
      )}

      {/* Personalized Resources Full Modal */}
      {showResourcesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] shadow-2xl p-4 sm:p-6">
            <PersonalizedResources
              healthContext={internalContext}
              todayContext={todayContext}
              limit={12}
              onClose={() => setShowResourcesModal(false)}
              onAskHaven={(prompt) => {
                setShowResourcesModal(false);
                if (onOpenAskHaven) onOpenAskHaven(prompt);
                else handleNavigate('haven');
              }}
            />
          </div>
        </div>
      )}
      {/* Progressive Health Log Modal */}
      {showHealthLogModal && userId && (
        <HealthLogModal
          isOpen={showHealthLogModal}
          onClose={() => setShowHealthLogModal(false)}
          userId={userId}
          onTriggerEmergency={handleOpenEmergency}
        />
      )}

      {/* Appointment Prep Modal */}
      {showAppointmentPrepModal && todayContext.advancedPersonalization?.appointmentPrep && (
        <AppointmentPrepModal
          prepPlan={todayContext.advancedPersonalization.appointmentPrep}
          onClose={() => setShowAppointmentPrepModal(false)}
          onSaveQuestions={handleSaveQuestionsForClinician}
          onAskHaven={(prompt) => {
            setShowAppointmentPrepModal(false);
            if (onOpenAskHaven) onOpenAskHaven(prompt);
            else handleNavigate('haven');
          }}
        />
      )}
    </div>
  );
}
