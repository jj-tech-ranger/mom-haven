import React from 'react';
import {
  Bell,
  Sparkles,
  ChevronRight,
  Leaf,
  Calendar,
  Pill,
  Baby,
  Heart,
  ShieldAlert,
  ChevronDown,
  Info,
} from 'lucide-react';
import EmptyState from '../EmptyState';
import { PregnancyDoc, ReminderDoc, UserDoc, MotherProfileDoc, NotificationDoc } from '../../types';
import { weekFact, formatEddDisplay } from '../../data/pregnancyWeeks';

interface TodayDashboardProps {
  mother: UserDoc | { displayName: string; email?: string; uid?: string };
  motherProfile?: MotherProfileDoc | null;
  pregnancy: PregnancyDoc | null;
  reminders: ReminderDoc[] | null;
  notifications?: NotificationDoc[];
  onOpenNotifications: () => void;
  onOpenContextSelector: () => void;
  onOpenReminderDetail: (reminder: ReminderDoc) => void;
  onOpenAskHaven: (initialQuery?: string) => void;
  onOpenAddPregnancy: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  mother,
  pregnancy,
  reminders,
  notifications = [],
  onOpenNotifications,
  onOpenContextSelector,
  onOpenReminderDetail,
  onOpenAskHaven,
  onOpenAddPregnancy,
}) => {
  // Calculate Gestational Week according to MOH 216 / Naegele's rule
  const week = pregnancy?.lmp
    ? Math.max(1, Math.min(42, Math.floor((Date.now() - new Date(pregnancy.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1))
    : pregnancy?.edd
    ? Math.max(1, Math.min(42, Math.floor((Date.now() - (new Date(pregnancy.edd).getTime() - 280 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000)) + 1))
    : null;

  // Unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper colors for reminder cards
  const getAccentColor = (urgency?: string) => {
    if (urgency === 'urgent') return 'var(--status-urgent)';
    if (urgency === 'normal') return 'var(--status-normal)';
    return 'var(--haven-orchid)';
  };

  const getAccentBg = (urgency?: string) => {
    if (urgency === 'urgent') return 'var(--status-urgent-bg)';
    if (urgency === 'normal') return 'var(--status-normal-bg)';
    return 'var(--lavender-100)';
  };

  const getReminderIcon = (category?: string, urgency?: string) => {
    if (category === 'ANC') {
      return <Calendar className="w-5 h-5 text-status-urgent" />;
    }
    if (category === 'Medication' || urgency === 'normal') {
      return <Leaf className="w-5 h-5 text-status-normal" />;
    }
    if (category === 'Milestone' || urgency === 'info') {
      return <Baby className="w-5 h-5 text-haven-orchid" />;
    }
    return <Sparkles className="w-5 h-5 text-haven-deep" />;
  };

  // S-Curved Hero Ribbon Calculations
  const progressPercent = week ? Math.min(100, Math.max(2, (week / 40) * 100)) : 0;
  // Bezier curve: M 10,22 C 100,6 200,34 310,12 C 340,6 370,18 385,22
  const pathD = "M 10,22 C 100,6 200,34 310,12 C 340,6 370,18 385,22";
  // Marker coordinate approximation
  const t = progressPercent / 100;
  const markerX = 10 + t * 375;
  const markerY = 22 + Math.sin(t * Math.PI * 2) * 6 - (t > 0.5 ? 3 : 0);

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      {/* 1. Header: Greeting, Context Switcher, Notification Bell & Avatar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2.5">
        <button
          onClick={onOpenContextSelector}
          className="text-left group cursor-pointer"
          title="Switch Context"
        >
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600">
            {getGreeting()}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <h1 className="font-display font-bold text-[22px] text-ink-900 leading-tight">
              {mother.displayName || 'Mama'}
            </h1>
            <ChevronDown className="w-4 h-4 text-ink-400 group-hover:text-haven-orchid transition-colors" />
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Bell Icon button */}
          <button
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-white shadow-card-1 border border-border-hairline flex items-center justify-center relative hover:bg-lavender-100 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px] text-haven-deep" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-status-urgent ring-2 ring-white" />
            )}
          </button>

          {/* Context Avatar */}
          <button
            onClick={onOpenContextSelector}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-bold text-[16px] shadow-card-1 ring-2 ring-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{ background: 'var(--grad-haven)' }}
            aria-label="Active Context"
          >
            {(mother.displayName?.[0] || 'M').toUpperCase()}
          </button>
        </div>
      </div>

      {/* 2. Hero Card: Purple Gradient Card with Week, Trivia & Curved Ribbon */}
      <div className="px-5">
        {pregnancy ? (
          <div
            className="rounded-card p-[18px] text-white mb-4 shadow-card-2 border border-white/10 relative overflow-hidden"
            style={{ background: 'var(--grad-haven)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-white/75">
                Your pregnancy
              </p>
              <span className="text-[10px] font-display font-bold bg-white/20 px-2 py-0.5 rounded-pill text-white">
                MOH 216
              </span>
            </div>

            <p className="font-display font-bold text-[28px] mt-1 leading-tight tracking-tight">
              Week {week}
            </p>

            <p className="font-body text-[13px] text-white/90 mt-0.5 font-medium">
              {week ? weekFact(week) : 'Baby is growing strong every day ✨'}
            </p>

            {/* Horizontal Haven Ribbon SVG Wave */}
            <div className="relative w-full h-11 my-1.5 flex items-center justify-center">
              <svg
                viewBox="0 0 395 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full overflow-visible"
              >
                {/* Remaining Track */}
                <path
                  d={pathD}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                {/* Active Filled Gradient Wave */}
                <path
                  d={pathD}
                  stroke="#FFFFFF"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="395"
                  strokeDashoffset={395 - (395 * progressPercent) / 100}
                  className="transition-all duration-700 ease-out"
                />

                {/* Marker Dot at Current Position */}
                {progressPercent > 0 && (
                  <g className="transition-all duration-700 ease-out">
                    {/* Outer glow */}
                    <circle
                      cx={markerX}
                      cy={markerY}
                      r="8.5"
                      fill="rgba(255, 255, 255, 0.4)"
                    />
                    {/* Inner white dot */}
                    <circle
                      cx={markerX}
                      cy={markerY}
                      r="5.5"
                      fill="#FFFFFF"
                    />
                    <circle
                      cx={markerX}
                      cy={markerY}
                      r="2.5"
                      fill="#33178A"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* Ribbon Labels */}
            <div className="flex justify-between font-body text-[11px] text-white/80 mt-1 font-medium">
              <span>Week 1</span>
              <span>Week 40 · EDD {formatEddDisplay(pregnancy.edd)}</span>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <EmptyState
              icon={Sparkles}
              title="Nothing tracked yet"
              message="Add a pregnancy or a child to see your journey here."
              actionLabel="Add pregnancy or child"
              onAction={onOpenContextSelector}
            />
          </div>
        )}

        {/* 3. Today's Priorities Section (3 distinct states) */}
        <div className="flex items-center justify-between mt-3 mb-2 px-0.5">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600">
            Today's priorities
          </p>
          <span className="text-[10px] font-display font-semibold text-haven-orchid">
            {reminders && reminders.length > 0 ? `${reminders.length} items` : ''}
          </span>
        </div>

        {/* State 1: Loading skeleton */}
        {reminders === null ? (
          <div className="space-y-3">
            <div className="h-20 rounded-card bg-lavender-100 animate-pulse" />
            <div className="h-20 rounded-card bg-lavender-100 animate-pulse" />
          </div>
        ) : reminders.length === 0 ? (
          /* State 2: Genuinely empty */
          <div className="bg-white rounded-card p-6 shadow-card-1 border border-border-hairline">
            <EmptyState
              icon={Leaf}
              title="Nothing urgent today"
              message="Once you have an appointment or reminder, it will show up here."
            />
          </div>
        ) : (
          /* State 3: Real Reminder Cards with colored left edge */
          <div className="space-y-3">
            {reminders.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenReminderDetail(r)}
                className="w-full text-left bg-white rounded-card p-[16px] shadow-card-1 flex items-center gap-3 border border-border-hairline border-l-4 hover:shadow-card-2 transition-all cursor-pointer group"
                style={{ borderLeftColor: getAccentColor(r.urgency) }}
              >
                {/* Icon Tile */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: getAccentBg(r.urgency) }}
                >
                  {getReminderIcon(r.category, r.urgency)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-[14px] text-ink-900 leading-snug group-hover:text-haven-deep transition-colors truncate">
                    {r.title}
                  </p>
                  <p className="font-body text-[12px] text-ink-600 mt-0.5 truncate">
                    {r.detail}
                  </p>
                </div>

                {/* Right Arrow */}
                <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-haven-orchid group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* 4. Closing Row: Soft Lavender "Ask Haven anything about today" */}
        <div className="mt-4">
          <button
            onClick={() => onOpenAskHaven()}
            className="w-full text-left bg-white rounded-card p-4 shadow-card-1 border border-border-hairline hover:border-haven-orchid/60 hover:bg-lavender-100/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ background: 'var(--grad-haven)' }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-ink-900 group-hover:text-haven-deep transition-colors">
                  Ask Haven anything about today
                </p>
                <p className="font-body text-xs text-ink-600">
                  Diet, common symptoms, ANC prep & handbook tips
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep group-hover:bg-haven-deep group-hover:text-white transition-colors shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
