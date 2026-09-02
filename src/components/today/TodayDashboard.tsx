import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  CalendarClock, 
  Sparkles, 
  ShieldCheck, 
  Syringe, 
  Pill, 
  Baby, 
  ArrowRight, 
  Plus, 
  HeartHandshake,
  ChevronDown,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Pregnancy, Reminder, AncEncounter } from '../../types';
import { getActivePregnancy, calculateGestationFromLmp } from '../../services/pregnancyService';
import { getUpcomingReminders } from '../../services/reminderService';
import EmptyState from '../EmptyState';

interface TodayDashboardProps {
  userId?: string;
  userName?: string;
  pregnancy?: Pregnancy | null;
  ancEncounters?: AncEncounter[];
  onNavigate?: (tab: 'Today' | 'Journey' | 'Haven' | 'Records' | 'Profile') => void;
  onOpenNotifications?: () => void;
  onOpenContextSelector?: () => void;
  onOpenReminderDetail?: (reminder: Reminder | any) => void;
  onOpenAskHaven?: (prompt?: string) => void;
  onOpenAddAnc?: () => void;
  onLogAncVisit?: () => void;
  onOpenAncVisit?: (visit: AncEncounter) => void;
  onOpenTimeline?: () => void;
  onOpenBirthPlan?: () => void;
  onOpenEmergency?: () => void;
}

// Fruit/Veggie and developmental size milestones by gestational week
const BABY_SIZE_MILESTONES: Record<number, { size: string; emoji: string; fact: string }> = {
  4: { size: 'a poppy seed', emoji: '🌱', fact: 'Blastocyst implanting in the uterine lining.' },
  8: { size: 'a raspberry', emoji: '🫐', fact: 'Little fingers and toes are starting to form.' },
  12: { size: 'a plum', emoji: '🍑', fact: 'Baby has all essential organs and reflexes.' },
  16: { size: 'an avocado', emoji: '🥑', fact: 'Baby can make facial expressions and suck thumb.' },
  20: { size: 'a banana', emoji: '🍌', fact: 'Halfway! You might feel fluttery kicks now.' },
  24: { size: 'an ear of corn', emoji: '🌽', fact: 'Baby can hear your voice and sound vibrations.' },
  28: { size: 'an eggplant', emoji: '🍆', fact: 'Baby can open eyes and practice breathing movements.' },
  32: { size: 'a jicama / butternut', emoji: '🥥', fact: 'Bones are fully developed, though soft.' },
  36: { size: 'a papaya', emoji: '🍈', fact: 'Rapid brain development and lungs maturing.' },
  40: { size: 'a small pumpkin', emoji: '🎃', fact: 'Full term and ready to meet the world!' },
};

function getBabySizeForWeek(week: number) {
  const availableWeeks = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  const closest = availableWeeks.reduce((prev, curr) => 
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );
  return BABY_SIZE_MILESTONES[closest] || {
    size: 'an ear of corn',
    emoji: '🌽',
    fact: "Baby's hearing and senses are developing rapidly."
  };
}

export default function TodayDashboard({
  userId,
  userName = 'Mama Jemimah',
  pregnancy: passedPregnancy,
  ancEncounters: passedAncEncounters,
  onNavigate,
  onOpenNotifications,
  onOpenContextSelector,
  onOpenReminderDetail,
  onOpenAskHaven,
  onOpenAddAnc,
  onLogAncVisit,
  onOpenAncVisit,
  onOpenTimeline,
  onOpenBirthPlan,
  onOpenEmergency,
}: TodayDashboardProps) {
  const [internalPregnancy, setInternalPregnancy] = useState<Pregnancy | null>(passedPregnancy || null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(!passedPregnancy);

  useEffect(() => {
    if (passedPregnancy) {
      setInternalPregnancy(passedPregnancy);
      setLoading(false);
      return;
    }
    async function loadData() {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const preg = await getActivePregnancy(userId);
        const rems = await getUpcomingReminders(userId);
        setInternalPregnancy(preg);
        setReminders(rems);
      } catch (err) {
        console.error('Error loading today data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId, passedPregnancy]);

  const pregnancy = passedPregnancy || internalPregnancy;

  if (loading) {
    return (
      <div className="p-5 space-y-4 animate-pulse max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-[var(--lavender-200)] rounded-lg w-1/2" />
          <div className="h-10 w-10 bg-[var(--lavender-200)] rounded-full" />
        </div>
        <div className="h-56 bg-[var(--lavender-200)] rounded-[24px]" />
        <div className="h-28 bg-[var(--lavender-100)] rounded-[20px]" />
        <div className="h-28 bg-[var(--lavender-100)] rounded-[20px]" />
      </div>
    );
  }

  // If no active pregnancy document found
  if (!pregnancy) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <EmptyState
          icon={HeartHandshake}
          title="No Active Pregnancy"
          message="Set up your pregnancy journey to track weekly milestones, appointments, and baby growth."
          actionLabel="Set Up Pregnancy"
          onAction={() => onNavigate('Journey')}
        />
      </div>
    );
  }

  const gestationalWeeks = pregnancy.gestationalAgeWeeks || 24;
  const progressRatio = Math.min(1, Math.max(0.05, gestationalWeeks / 40));
  const progressPercent = Math.round(progressRatio * 100);

  const eddDate = pregnancy.edd ? new Date(pregnancy.edd) : new Date();
  const formattedEdd = eddDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const formattedFullEdd = eddDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const babyInfo = getBabySizeForWeek(gestationalWeeks);

  // Default contextual priorities if none in Firestore
  const displayPriorities = reminders.length > 0 ? reminders : [
    {
      id: 'priority-1',
      userId,
      title: `ANC visit ${Math.min(8, Math.ceil(gestationalWeeks / 5))} — due this month`,
      description: 'IPTp-SP dose & routine maternal lab review · Kariokor Health Centre',
      dueDate: 'Due in 5 days',
      category: 'anc',
      completed: false,
      color: 'red',
      icon: Syringe,
    },
    {
      id: 'priority-2',
      userId,
      title: 'Take your iron & folic acid (IFAS)',
      description: '1 tablet daily with a light meal or water · 30 tablets remaining',
      dueDate: 'Daily routine',
      category: 'custom',
      completed: false,
      color: 'green',
      icon: Pill,
    },
    {
      id: 'priority-3',
      userId,
      title: `This week: baby can hear you`,
      description: 'Talk or sing gently — baby’s inner ear cochlea is developing rapidly.',
      dueDate: `Week ${gestationalWeeks} milestone`,
      category: 'custom',
      completed: false,
      color: 'purple',
      icon: Baby,
    }
  ];

  return (
    <div className="flex flex-col space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      {/* Top Header matching M-TODAY-001 visual */}
      <div className="flex justify-between items-center pt-1">
        <div>
          <span className="font-body text-[11px] font-bold text-[var(--ink-400)] tracking-widest uppercase block">
            Good Morning
          </span>
          <h1 className="font-display font-extrabold text-[24px] sm:text-[26px] text-[var(--ink-900)] leading-tight">
            {userName || 'Jemimah'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-white border border-[var(--border-hairline)] flex items-center justify-center text-[var(--haven-deep)] shadow-xs hover:bg-[var(--lavender-100)] transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* User Avatar Pill / Context Switcher */}
          <button
            type="button"
            onClick={onOpenContextSelector}
            className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white font-display font-bold text-[16px] flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="Profile context"
          >
            {(userName || 'J').charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* ================= HERO GESTATION CARD WITH THE ORGANIC HAVEN RIBBON ================= */}
      <div
        className="rounded-[24px] p-5 sm:p-6 text-white shadow-card-2 relative overflow-hidden transition-transform duration-300"
        style={{
          background: 'linear-gradient(135deg, #33178A 0%, #4B27A8 45%, #6E3CB9 80%, #9167C2 100%)'
        }}
      >
        {/* Soft background glow decoration */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-display font-bold tracking-widest uppercase text-[#E5DFF0]">
              Your Pregnancy
            </span>
            <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-display font-semibold backdrop-blur-xs">
              Trimester {gestationalWeeks >= 28 ? '3' : gestationalWeeks >= 13 ? '2' : '1'}
            </span>
          </div>

          <h2 className="font-display font-extrabold text-[32px] text-white tracking-tight leading-none mt-1">
            Week {gestationalWeeks}
          </h2>

          <p className="font-body text-[14px] text-[#F7F3FC] mt-1.5 flex items-center gap-1.5 font-normal">
            Baby is about the size of {babyInfo.size} <span className="text-[16px]">{babyInfo.emoji}</span>
          </p>

          {/* Organic Haven Ribbon Curve SVG with Dot Indicator */}
          <div className="my-5 relative">
            <svg 
              className="w-full h-12 overflow-visible" 
              viewBox="0 0 300 40" 
              fill="none" 
              preserveAspectRatio="none"
            >
              {/* Background faint wave track */}
              <path
                d="M 10 28 C 75 14, 150 36, 225 18 C 260 10, 280 14, 290 16"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Foreground glowing wave track up to progress */}
              <path
                d="M 10 28 C 75 14, 150 36, 225 18 C 260 10, 280 14, 290 16"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="300"
                strokeDashoffset={300 - (300 * progressRatio)}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Live glowing white milestone dot placed on the curve */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] ring-4 ring-[#4B27A8] transition-all duration-700"
              style={{
                left: `clamp(12px, ${progressPercent}%, calc(100% - 16px))`
              }}
            />
          </div>

          {/* Ribbon Axis Footer */}
          <div className="flex justify-between items-center text-[12px] font-display font-semibold text-[#E5DFF0] pt-1">
            <span>Week 1</span>
            <span>Week 40 · EDD {formattedEdd}</span>
          </div>
        </div>
      </div>

      {/* ================= TODAY'S PRIORITIES SECTION ================= */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="font-display font-extrabold text-[17px] text-[var(--ink-900)] tracking-tight">
            Today's Priorities
          </h3>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="text-[12px] font-display font-semibold text-[var(--haven-orchid)] hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {displayPriorities.map((item: any, idx: number) => {
            const Icon = item.icon || (idx === 0 ? Syringe : idx === 1 ? Pill : Baby);
            const borderAccentClass = idx === 0 
              ? 'before:bg-rose-500' 
              : idx === 1 
              ? 'before:bg-emerald-500' 
              : 'before:bg-[var(--haven-orchid)]';

            const iconBgClass = idx === 0 
              ? 'bg-rose-50 text-rose-600' 
              : idx === 1 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-[var(--lavender-100)] text-[var(--haven-deep)]';

            return (
              <div
                key={item.id || idx}
                onClick={() => onOpenReminderDetail(item)}
                className={`bg-white rounded-[18px] border border-[var(--border-hairline)] p-4 flex items-center justify-between shadow-card-1 hover:shadow-card-2 transition-all cursor-pointer relative overflow-hidden pl-5 before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:rounded-r-full ${borderAccentClass}`}
              >
                <div className="flex items-center gap-3.5 pr-2">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 ${iconBgClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-[14px] sm:text-[15px] text-[var(--ink-900)] leading-snug">
                      {item.title}
                    </h4>
                    <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5 line-clamp-1">
                      {item.description || item.dueDate}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-400)] shrink-0 group-hover:text-[var(--haven-deep)]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= QUICK ACTION SHORTCUTS (2x2 GRID) ================= */}
      <div>
        <h3 className="font-display font-extrabold text-[15px] text-[var(--ink-900)] mb-3 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Ask Haven */}
          <button
            type="button"
            onClick={() => onOpenAskHaven && onOpenAskHaven()}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)] mb-2.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Ask Haven
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              AI Care Companion
            </div>
          </button>

          {/* Log ANC Visit */}
          <button
            type="button"
            onClick={() => {
              if (onLogAncVisit) onLogAncVisit();
              else if (onOpenAddAnc) onOpenAddAnc();
            }}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)] mb-2.5 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Log ANC Visit
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Self-entry record
            </div>
          </button>

          {/* Health Vault */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('Records')}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-[var(--haven-orchid)] hover:shadow-card-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2.5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Health Vault
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Verified records
            </div>
          </button>

          {/* Emergency Guide */}
          <button
            type="button"
            onClick={() => onOpenEmergency && onOpenEmergency()}
            className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 text-left shadow-card-1 hover:border-rose-400 hover:shadow-card-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 mb-2.5 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-[14px] text-[var(--ink-900)]">
              Emergency Guide
            </div>
            <div className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Danger signs & 1199
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
