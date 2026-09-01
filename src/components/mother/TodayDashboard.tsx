import React, { useEffect, useState } from 'react';
import { Bell, Sparkles, ChevronRight, Leaf, Calendar, Baby, ChevronDown } from 'lucide-react';
import EmptyState from '../EmptyState';
import { PregnancyDoc, ChildDoc, ReminderDoc, UserDoc, MotherProfileDoc, NotificationDoc } from '../../types';
import { weekFact, formatEddDisplay } from '../../data/pregnancyWeeks';
import { getActivePregnancy, getCurrentGestationWeeks, getPregnancyProgress } from '../../utils/pregnancy';

interface TodayDashboardProps { mother: UserDoc | { displayName: string; email?: string; uid?: string }; motherProfile?: MotherProfileDoc | null; pregnancy: PregnancyDoc | null; reminders: ReminderDoc[] | null; notifications?: NotificationDoc[]; onOpenNotifications: () => void; onOpenContextSelector: () => void; onOpenReminderDetail: (reminder: ReminderDoc) => void; onOpenAskHaven: (initialQuery?: string) => void; onOpenAddPregnancy: () => void; }

export const TodayDashboard: React.FC<TodayDashboardProps> = ({ mother, pregnancy, reminders, notifications = [], onOpenNotifications, onOpenContextSelector, onOpenReminderDetail, onOpenAskHaven }) => {
  const [selectedChild, setSelectedChild] = useState<ChildDoc | null>(null);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ type: 'pregnancy' | 'child'; data?: PregnancyDoc | ChildDoc }>).detail;
      if (detail.type === 'child' && detail.data && 'dateOfBirth' in detail.data) setSelectedChild(detail.data as ChildDoc);
      else if (detail.type === 'pregnancy') setSelectedChild(null);
    };
    window.addEventListener('mom-haven-context-selected', handler);
    return () => window.removeEventListener('mom-haven-context-selected', handler);
  }, []);

  const activePregnancy = selectedChild ? null : getActivePregnancy(pregnancy);
  const week = getCurrentGestationWeeks(activePregnancy);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const progress = getPregnancyProgress(activePregnancy);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayReminders = reminders === null ? null : reminders.filter((r) => r.dueDate && r.dueDate.slice(0, 10) <= todayKey);
  const iconFor = (category?: string, urgency?: string) => category === 'ANC' ? <Calendar className="h-5 w-5 text-red-700" /> : category === 'Milestone' || urgency === 'info' ? <Baby className="h-5 w-5 text-[#6C3EAC]" /> : <Leaf className="h-5 w-5 text-green-700" />;

  return <div className="min-h-screen bg-slate-50 pb-28">
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
      <button onClick={onOpenContextSelector} className="text-left group" aria-label="Switch active context"><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">{greeting}</p><div className="mt-0.5 flex items-center gap-1.5"><h1 className="font-display text-[22px] font-bold leading-tight text-slate-900">{mother.displayName || 'Mama'}</h1><ChevronDown className="h-4 w-4 text-slate-400" /></div></button>
      <div className="flex items-center gap-2.5"><button onClick={onOpenNotifications} className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm" aria-label="Notifications"><Bell className="h-[18px] w-[18px] text-[#33178A]" />{unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-700 ring-2 ring-white" />}</button><button onClick={onOpenContextSelector} className="flex h-11 w-11 items-center justify-center rounded-md bg-[#33178A] font-display text-[16px] font-bold text-white shadow-sm" aria-label="Active context">{(mother.displayName?.[0] || 'M').toUpperCase()}</button></div>
    </header>
    <main className="px-5 pt-5">
      {activePregnancy ? <section className="mb-5 rounded-md border border-slate-200 bg-white p-[18px] shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Your pregnancy</p><p className="mt-1 font-display text-[28px] font-bold leading-tight text-slate-900">Week {week}</p><p className="mt-1 font-body text-[13px] text-slate-600">{weekFact(week || 1)}</p></div><span className="rounded-md bg-[#F0EBFA] px-2.5 py-1 font-mono text-xs font-semibold text-[#33178A]">{progress}%</span></div><div className="mt-5 h-2 overflow-hidden rounded-md bg-slate-200"><div className="h-full bg-[#6C3EAC] transition-all duration-500" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500"><span>Week 1</span><span>Week 40 · EDD {formatEddDisplay(activePregnancy.edd)}</span></div></section> : selectedChild ? <section className="mb-5 rounded-md border border-slate-200 bg-white p-[18px] shadow-sm"><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Child journey</p><p className="mt-1 font-display text-[28px] font-bold leading-tight text-slate-900">{selectedChild.name || 'Your baby'}</p><p className="mt-1 font-mono text-[12px] text-slate-600">Born {new Date(`${selectedChild.dateOfBirth}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} · {selectedChild.sex === 'boy' ? 'Boy' : 'Girl'}</p><p className="mt-3 font-body text-xs text-slate-600">Child health records are ready to continue.</p></section> : <div className="mb-5"><EmptyState icon={Baby} title="Your next chapter starts here" message="Your pregnancy is complete. Choose a child from Active Context to continue their health journey." actionLabel="Choose active context" onAction={onOpenContextSelector} /></div>}
      <p className="mb-2 px-0.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">Today's priorities</p>
      {todayReminders === null ? <div className="h-20 rounded-md border border-slate-200 bg-white animate-pulse" aria-label="Loading today's priorities" /> : todayReminders.length === 0 ? <EmptyState icon={Leaf} title="Nothing urgent today" message="Once you have an appointment or reminder, it will show up here." /> : <div className="space-y-3">{todayReminders.map((r) => <button key={r.id} onClick={() => onOpenReminderDetail(r)} className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${r.urgency === 'urgent' ? 'bg-red-50' : r.urgency === 'normal' ? 'bg-green-50' : 'bg-slate-50'}`}>{iconFor(r.category, r.urgency)}</div><div className="min-w-0 flex-1"><p className="truncate font-body text-[14px] font-semibold text-slate-900">{r.title}</p><p className="mt-0.5 truncate font-body text-[12px] text-slate-600">{r.detail}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /></button>)}</div>}
      <button onClick={() => onOpenAskHaven()} className="mt-5 flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#33178A] text-white"><Sparkles className="h-4 w-4" /></div><div className="flex-1"><p className="font-display text-sm font-bold text-slate-900">Ask Haven about today</p><p className="mt-0.5 font-body text-xs text-slate-600">A quick place to start a question.</p></div><ChevronRight className="h-4 w-4 text-[#33178A]" /></button>
    </main>
  </div>;
};
