import React from 'react';
import { Bell, Sparkles, ChevronRight, Leaf, Calendar, Baby, ChevronDown, Activity, ClipboardList } from 'lucide-react';
import EmptyState from '../EmptyState';
import { PregnancyDoc, ChildDoc, ReminderDoc, UserDoc, MotherProfileDoc, NotificationDoc } from '../../types';
import { weekFact, formatEddDisplay } from '../../data/pregnancyWeeks';
import { getActivePregnancy, getCurrentGestationWeeks, getPregnancyProgress } from '../../utils/pregnancy';

interface TodayDashboardProps {
  mother: UserDoc | { displayName: string; email?: string; uid?: string };
  motherProfile?: MotherProfileDoc | null;
  pregnancy: PregnancyDoc | null;
  reminders: ReminderDoc[] | null;
  notifications?: NotificationDoc[];
  onOpenNotifications: () => void;
  onOpenContextSelector: () => void;
  onOpenReminderDetail: (r: ReminderDoc) => void;
  onOpenAskHaven: (initialQuery?: string) => void;
  onOpenAddPregnancy: () => void;
}

const formatDate = (value?: string | null) => value
  ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not recorded';

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  mother,
  motherProfile,
  pregnancy,
  reminders,
  notifications = [],
  onOpenNotifications,
  onOpenContextSelector,
  onOpenReminderDetail,
  onOpenAskHaven,
}) => {
  const activePregnancy = getActivePregnancy(pregnancy);
  const week = getCurrentGestationWeeks(activePregnancy);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const progress = getPregnancyProgress(activePregnancy);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayReminders = reminders === null ? null : reminders.filter((r) => r.dueDate && r.dueDate.slice(0, 10) <= todayKey);
  const iconFor = (category?: string, urgency?: string) =>
    category === 'ANC'
      ? <Calendar className="h-5 w-5 text-clinical-warning" />
      : category === 'Milestone' || urgency === 'info'
        ? <Baby className="h-5 w-5 text-brand-primary" />
        : <Leaf className="h-5 w-5 text-clinical-normal" />;

  return (
    <div className="min-h-full bg-surface-canvas pb-4">
      <header className="mb-5 flex items-center justify-between border-b border-border-light bg-surface-card px-1 pb-4">
        <button onClick={onOpenContextSelector} className="group flex min-h-0 items-center gap-3 text-left" aria-label="Switch active context">
          <span className="inline-flex min-h-0 items-center gap-2 rounded-full border border-[#D5C2E0] bg-brand-surface px-4 py-2">
            <Activity className="h-4 w-4 text-brand-primary" />
            <span className="font-clinical text-xs font-semibold text-text-primary">
              {activePregnancy ? `Pregnancy: Week ${week || '—'}` : 'Choose active context'}
            </span>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </span>
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden font-clinical text-[11px] font-medium text-clinical-normal sm:inline">Synced</span>
          <button onClick={onOpenNotifications} className="relative flex h-12 w-12 min-h-0 items-center justify-center rounded-md border border-border-light bg-white shadow-sm" aria-label="Notifications">
            <Bell className="h-5 w-5 text-brand-primary" />
            {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-clinical-danger ring-2 ring-white" />}
          </button>
        </div>
      </header>

      <main>
        <div className="mb-5">
          <p className="font-clinical text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">{greeting}</p>
          <h1 className="mt-1 font-consumer text-3xl font-bold tracking-tight text-text-primary">{mother.displayName || 'Mama'}</h1>
        </div>

        {activePregnancy ? (
          <section className="mb-5 rounded-2xl border border-border-light bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-clinical text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">Your pregnancy</p>
                <p className="mt-1 font-consumer text-4xl font-bold leading-tight text-text-primary">Week {week || '—'}</p>
                <p className="mt-2 max-w-xl font-clinical text-sm text-text-muted">{weekFact(week || 1)}</p>
              </div>
              <span className="rounded-md bg-brand-surface px-2.5 py-1 font-mono text-xs font-semibold text-brand-primary">{progress}%</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-md bg-slate-100">
              <div className="h-full bg-brand-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-text-muted">
              <span>Week 01</span><span>Week 40 · EDD {formatEddDisplay(activePregnancy.edd)}</span>
            </div>
          </section>
        ) : (
          <div className="mb-5">
            <EmptyState icon={Baby} title="Choose a health context" message="Select a pregnancy or child profile to see your current health journey." actionLabel="Choose active context" onAction={onOpenContextSelector} />
          </div>
        )}

        <section className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand-primary" />
            <p className="font-clinical text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">Today's priorities</p>
          </div>
          {todayReminders === null ? (
            <div className="h-20 rounded-xl border border-border-light bg-white animate-pulse" aria-label="Loading today's priorities" />
          ) : todayReminders.length === 0 ? (
            <EmptyState icon={Leaf} title="Nothing due today" message="New appointments and reminders will appear here when they are recorded." />
          ) : (
            <div className="space-y-3">
              {todayReminders.map((r) => (
                <button key={r.id} onClick={() => onOpenReminderDetail(r)} className="flex w-full items-center gap-3 rounded-xl border border-border-light bg-white p-4 text-left shadow-sm">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${r.urgency === 'urgent' ? 'bg-clinical-danger-bg' : r.urgency === 'normal' ? 'bg-clinical-normal-bg' : 'bg-slate-50'}`}>{iconFor(r.category, r.urgency)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-clinical text-sm font-semibold text-text-primary">{r.title}</p>
                    <p className="mt-0.5 truncate font-clinical text-xs text-text-muted">{r.detail} · {formatDate(r.dueDate)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                </button>
              ))}
            </div>
          )}
        </section>

        <button onClick={() => onOpenAskHaven()} className="flex w-full items-center gap-3 rounded-xl border border-border-light bg-white p-4 text-left shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-primary text-white"><Sparkles className="h-4 w-4" /></div>
          <div className="flex-1"><p className="font-consumer text-sm font-bold text-text-primary">Ask Haven about today</p><p className="mt-0.5 font-clinical text-xs text-text-muted">Educational guidance grounded in the Kenya MOH handbook.</p></div>
          <ChevronRight className="h-4 w-4 text-brand-primary" />
        </button>

        {motherProfile && !activePregnancy && (
          <p className="mt-4 font-clinical text-xs text-text-muted">Profile updated locally. Add a pregnancy or child record when you are ready.</p>
        )}
      </main>
    </div>
  );
};
