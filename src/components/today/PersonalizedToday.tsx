import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, Heart, MessageCircle, MapPin, Sparkles } from 'lucide-react';
import { getHealthContext } from '../../services/healthContextService';
import { getActivePregnancy } from '../../services/pregnancyService';
import type { HealthContext } from '../../types/healthContext';
import type { Pregnancy } from '../../types';

interface Props {
  userId: string;
  userName?: string;
  onNavigate: (tab: 'haven' | 'journey' | 'records' | 'profile') => void;
}

function formatDate(value?: string) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PersonalizedToday({ userId, userName, onNavigate }: Props) {
  const [context, setContext] = useState<HealthContext | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getHealthContext(userId), getActivePregnancy(userId)])
      .then(([nextContext, nextPregnancy]) => {
        if (!mounted) return;
        setContext(nextContext);
        setPregnancy(nextPregnancy);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <div className="space-y-4" aria-label="Loading your MomHaven home"><div className="h-36 animate-pulse rounded-[28px] bg-[var(--surface-2)]" /><div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-2)]" /><div className="grid gap-3 sm:grid-cols-2"><div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-2)]" /><div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></div></div>;

  const name = context?.preferredName || userName || 'Mama';
  const week = pregnancy?.gestationalAgeWeeks ?? context?.pregnancy?.pregnancyWeek;
  const stage = context?.lifecycleStage;
  const stageTitle: Record<NonNullable<HealthContext['lifecycleStage']>, string> = {
    pregnancy: 'Your pregnancy', planning: 'Planning ahead', postpartum: 'Your recovery', parenting: 'Your parenting journey', supporter: 'Supporting a mother', exploring: 'Your learning space',
  };

  return <div className="space-y-4">
    <section className="rounded-[28px] bg-[var(--haven-deep)] p-5 text-white shadow-card-1 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-display font-bold uppercase tracking-[0.16em] text-white/70">{stage ? stageTitle[stage] : 'MomHaven'}</p><h2 className="mt-1 font-display text-2xl font-extrabold">Good to see you, {name}.</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/80">A calmer place to keep your journey, understand your records and get help when you need it.</p></div><div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/10 sm:flex"><Sparkles className="h-5 w-5" /></div></div>
    </section>

    {stage === 'pregnancy' && pregnancy ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-xs"><div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[var(--haven-orchid)]"><CalendarDays className="h-4 w-4" /> Pregnancy snapshot</div><div className="mt-3 flex items-end justify-between gap-4"><div><p className="font-display text-2xl font-extrabold">Week {week ?? '—'}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">EDD {formatDate(pregnancy.edd)}</p></div><button type="button" onClick={() => onNavigate('journey')} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-display font-bold text-[var(--haven-deep)] hover:bg-[var(--surface-2)]">View journey <ChevronRight className="h-4 w-4" /></button></div><p className="mt-3 text-xs text-[var(--text-secondary)]">Pregnancy dates shown here come from your clinical pregnancy record.</p></section> : <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-xs"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--haven-deep)]"><Heart className="h-5 w-5" /></div><div><h3 className="font-display font-bold">Your next step</h3><p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">MomHaven will build around your journey as you add information. You do not need to complete everything today.</p></div></div></section>}

    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => onNavigate('haven')} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-card-1"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--haven-deep)]"><MessageCircle className="h-4 w-4" /></div><h3 className="mt-3 font-display font-bold">Talk to Haven</h3><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Haven can use your saved personalization and verified records without treating them as the same thing.</p><ChevronRight className="mt-2 h-4 w-4 text-[var(--ink-400)]" /></button>
      <button type="button" onClick={() => onNavigate('records')} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-card-1"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--haven-deep)]"><CalendarDays className="h-4 w-4" /></div><h3 className="mt-3 font-display font-bold">Keep records close</h3><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Clinical records stay authoritative and separate from personalization preferences.</p><ChevronRight className="mt-2 h-4 w-4 text-[var(--ink-400)]" /></button>
    </div>

    {(context?.location?.county || context?.interests?.length) ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"><div className="flex items-center gap-2 text-xs font-display font-bold text-[var(--text-secondary)]"><Sparkles className="h-4 w-4 text-[var(--haven-orchid)]" /> Your personalization</div><div className="mt-3 flex flex-wrap gap-2">{context.location?.county && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> {context.location.county}</span>}{context.interests.slice(0, 6).map(interest => <span key={interest} className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs capitalize">{interest.replaceAll('_', ' ')}</span>)}</div></section> : null}
  </div>;
}
