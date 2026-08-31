import React from 'react';
import { Bell, Sparkles, ChevronRight, Leaf, Calendar, Baby, ChevronDown } from 'lucide-react';
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
}) => {
  const week = pregnancy?.lmp
    ? Math.floor((Date.now() - new Date(pregnancy.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    : null;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const progress = week ? Math.min(100, Math.max(0, (week / 40) * 100)) : 0;

  const accentColor = (urgency?: string) => urgency === 'urgent' ? 'var(--status-urgent)' : urgency === 'normal' ? 'var(--status-normal)' : 'var(--haven-orchid)';
  const accentBg = (urgency?: string) => urgency === 'urgent' ? 'var(--status-urgent-bg)' : urgency === 'normal' ? 'var(--status-normal-bg)' : 'var(--lavender-100)';
  const iconFor = (category?: string, urgency?: string) => {
    if (category === 'ANC') return <Calendar className="w-5 h-5 text-status-urgent" />;
    if (category === 'Milestone' || urgency === 'info') return <Baby className="w-5 h-5 text-haven-orchid" />;
    return <Leaf className="w-5 h-5 text-status-normal" />;
  };

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onOpenContextSelector} className="text-left group" aria-label="Switch active context">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">{greeting}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <h1 className="font-display font-bold text-[22px] leading-tight text-ink-900">{mother.displayName || 'Mama'}</h1>
            <ChevronDown className="w-4 h-4 text-ink-400 group-hover:text-haven-orchid" />
          </div>
        </button>
        <div className="flex items-center gap-2.5">
          <button onClick={onOpenNotifications} className="relative w-10 h-10 rounded-full bg-white border border-border-hairline shadow-card-1 flex items-center justify-center" aria-label="Notifications">
            <Bell className="w-[18px] h-[18px] text-haven-deep" strokeWidth={2} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-status-urgent ring-2 ring-white" />}
          </button>
          <button onClick={onOpenContextSelector} className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-bold text-[16px] ring-2 ring-white shadow-card-1" style={{ background: 'var(--grad-haven)' }} aria-label="Active context">
            {(mother.displayName?.[0] || 'M').toUpperCase()}
          </button>
        </div>
      </header>

      <main className="px-5">
        {pregnancy ? (
          <section className="rounded-card p-[18px] text-white mb-5 shadow-card-2 overflow-hidden" style={{ background: 'var(--grad-haven)' }}>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">Your pregnancy</p>
            <p className="font-display font-bold text-[28px] leading-tight mt-1">Week {week}</p>
            <p className="font-body text-[13px] text-white/85 mt-0.5">{weekFact(week || 1)}</p>
            <div className="relative h-12 mt-4">
              <svg viewBox="0 0 400 48" className="w-full h-full overflow-visible" aria-label={`Pregnancy progress: week ${week} of 40`}>
                <defs><linearGradient id="today-ribbon-active" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" /><stop offset="1" stopColor="#E9D8FF" stopOpacity="0.95" /></linearGradient></defs>
                <path d="M 10,25 C 90,7 190,39 285,16 C 330,5 365,18 390,25" stroke="#E5D9F2" strokeOpacity="0.35" strokeWidth="8" fill="none" strokeLinecap="round" />
                <path d="M 10,25 C 90,7 190,39 285,16 C 330,5 365,18 390,25" stroke="url(#today-ribbon-active)" strokeWidth="8" fill="none" strokeLinecap="round" pathLength="100" strokeDasharray={`${progress} 100`} />
                <circle cx={10 + (progress / 100) * 380} cy={25 + Math.sin((progress / 100) * Math.PI * 2) * 7} r="8" fill="rgba(255,255,255,.38)" />
                <circle cx={10 + (progress / 100) * 380} cy={25 + Math.sin((progress / 100) * Math.PI * 2) * 7} r="5" fill="#FFFFFF" />
                <circle cx={10 + (progress / 100) * 380} cy={25 + Math.sin((progress / 100) * Math.PI * 2) * 7} r="2.5" fill="#33178A" />
              </svg>
            </div>
            <div className="flex justify-between font-body text-[11px] text-white/75 mt-1"><span>Week 1</span><span>Week 40 · EDD {formatEddDisplay(pregnancy.edd)}</span></div>
          </section>
        ) : (
          <div className="mb-5"><EmptyState icon={Sparkles} title="Nothing tracked yet" message="Add a pregnancy or a child to see your journey here." actionLabel="Add pregnancy or child" onAction={onOpenContextSelector} /></div>
        )}

        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600 mb-2 px-0.5">Today's priorities</p>
        {reminders === null ? (
          <div className="h-20 rounded-card bg-lavender-100 animate-pulse" aria-label="Loading today's priorities" />
        ) : reminders.length === 0 ? (
          <EmptyState icon={Leaf} title="Nothing urgent today" message="Once you have an appointment or reminder, it will show up here." />
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <button key={r.id} onClick={() => onOpenReminderDetail(r)} className="w-full text-left bg-white rounded-card p-4 shadow-card-1 border border-border-hairline border-l-4 flex items-center gap-3 group" style={{ borderLeftColor: accentColor(r.urgency) }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: accentBg(r.urgency) }}>{iconFor(r.category, r.urgency)}</div>
                <div className="flex-1 min-w-0"><p className="font-body font-semibold text-[14px] text-ink-900 truncate">{r.title}</p><p className="font-body text-[12px] text-ink-600 mt-0.5 truncate">{r.detail}</p></div>
                <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-haven-deep shrink-0" />
              </button>
            ))}
          </div>
        )}

        <button onClick={() => onOpenAskHaven()} className="w-full mt-5 rounded-card p-4 text-left border border-[#E5DFF0] bg-lavender-100/80 flex items-center gap-3 shadow-card-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'var(--grad-haven)' }}><Sparkles className="w-4 h-4" /></div>
          <div className="flex-1"><p className="font-display font-bold text-sm text-ink-900">Ask Haven anything about today</p><p className="font-body text-xs text-ink-600 mt-0.5">A quick place to start a question.</p></div>
          <ChevronRight className="w-4 h-4 text-haven-deep" />
        </button>
      </main>
    </div>
  );
};
