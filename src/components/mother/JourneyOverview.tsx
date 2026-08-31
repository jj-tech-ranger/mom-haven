import React, { useState } from 'react';
import { Baby, Calendar, ChevronDown, ChevronRight, Compass, Heart, ShieldCheck, Sparkles, Stethoscope, Activity, Award } from 'lucide-react';
import { PregnancyDoc, ChildDoc, MotherProfileDoc, AncEncounterDoc } from '../../types';
import { HavenRibbon } from '../HavenRibbon';
import EmptyState from '../EmptyState';

interface JourneyOverviewProps {
  pregnancy?: PregnancyDoc | null;
  childrenList?: ChildDoc[];
  motherProfile?: MotherProfileDoc | null;
  encounters?: AncEncounterDoc[];
  onOpenContextSelector: () => void;
  onOpenPregnancyOverview: () => void;
  onOpenTimeline: () => void;
  onOpenAncOverview: () => void;
  onOpenHealthHistory: () => void;
  onOpenBirthPlan: () => void;
  onOpenBirthOutcome: () => void;
  onOpenAddChild: () => void;
  onOpenChildDashboard?: () => void;
  onOpenNewbornRecord?: () => void;
  onOpenPncOverview?: () => void;
  onOpenChildTimeline?: () => void;
}

export const JourneyOverview: React.FC<JourneyOverviewProps> = ({
  pregnancy, childrenList = [], encounters = [], onOpenContextSelector, onOpenPregnancyOverview, onOpenTimeline,
  onOpenAncOverview, onOpenHealthHistory, onOpenBirthPlan, onOpenBirthOutcome, onOpenAddChild,
  onOpenChildDashboard, onOpenChildTimeline,
}) => {
  const [mode, setMode] = useState<'pregnancy' | 'child'>(pregnancy ? 'pregnancy' : childrenList.length ? 'child' : 'pregnancy');
  const child = childrenList[0];
  const week = pregnancy?.lmp ? Math.max(1, Math.floor((Date.now() - new Date(pregnancy.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1) : null;
  const shortcuts = [
    ['Pregnancy Overview', 'Current week, EDD and care snapshot', Sparkles, onOpenPregnancyOverview],
    ['Pregnancy Timeline', 'Milestones along the Haven Ribbon', Calendar, onOpenTimeline],
    ['ANC Overview', `${encounters.length} recorded visits`, Stethoscope, onOpenAncOverview],
    ['Health History', 'Conditions, allergies and prior pregnancies', Activity, onOpenHealthHistory],
    ['Birth Plan', 'Facility, support, transport and notes', ShieldCheck, onOpenBirthPlan],
  ] as const;

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">Your journey</p><h1 className="font-display font-bold text-[24px] text-ink-900">Journey</h1></div>
        <button onClick={onOpenContextSelector} className="flex items-center gap-1.5 rounded-pill bg-white border border-border-hairline px-3 py-2 font-display font-bold text-xs text-haven-deep shadow-card-1"><span>{mode === 'pregnancy' ? (week ? `Pregnancy · Week ${week}` : 'Pregnancy') : child?.name || 'Child'}</span><ChevronDown className="w-3.5 h-3.5" /></button>
      </header>
      <main className="px-5 space-y-4">
        <div className="bg-lavender-100 p-1 rounded-pill flex">
          <button onClick={() => setMode('pregnancy')} className={`flex-1 py-2.5 rounded-pill font-display font-bold text-xs ${mode === 'pregnancy' ? 'bg-white text-haven-deep shadow-sm' : 'text-ink-600'}`}><Heart className="inline w-3.5 h-3.5 mr-1.5" />Pregnancy</button>
          <button onClick={() => setMode('child')} className={`flex-1 py-2.5 rounded-pill font-display font-bold text-xs ${mode === 'child' ? 'bg-white text-haven-deep shadow-sm' : 'text-ink-600'}`}><Baby className="inline w-3.5 h-3.5 mr-1.5" />Child</button>
        </div>
        {mode === 'pregnancy' ? pregnancy ? (
          <>
            <section className="rounded-card p-5 text-white shadow-card-2" style={{ background: 'var(--grad-haven)' }}>
              <div className="flex items-start justify-between"><div><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">Pregnancy journey</p><h2 className="font-display font-bold text-[26px] mt-1">Week {week} of 40</h2><p className="font-body text-xs text-white/75 mt-1">{pregnancy.edd ? `EDD ${new Date(pregnancy.edd).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'EDD not available'}</p></div><div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"><Heart className="w-5 h-5" /></div></div>
              <HavenRibbon progress={Math.min(100, Math.max(0, ((week || 1) / 40) * 100))} currentStep={week || 1} totalSteps={40} showMarkerTooltip={false} className="mt-4" />
              <div className="flex justify-between text-[11px] text-white/70 mt-1"><span>Week 1</span><span>Week 40 · EDD</span></div>
            </section>
            <button onClick={onOpenPregnancyOverview} className="w-full py-3.5 rounded-pill text-white font-display font-bold shadow-button" style={{ background: 'var(--grad-haven)' }}><Compass className="inline w-4 h-4 mr-2" />Continue pregnancy journey</button>
            <div className="space-y-2.5">
              {shortcuts.map(([title, detail, Icon, action]) => <button key={title} onClick={action} className="w-full bg-white rounded-card border border-border-hairline shadow-card-1 p-4 flex items-center gap-3 text-left"><div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center"><Icon className="w-4 h-4 text-haven-orchid" /></div><div className="flex-1"><p className="font-display font-bold text-sm text-ink-900">{title}</p><p className="font-body text-xs text-ink-600 mt-0.5">{detail}</p></div><ChevronRight className="w-4 h-4 text-ink-400" /></button>)}
              <button onClick={onOpenBirthOutcome} className="w-full rounded-card border border-haven-orchid/30 bg-lavender-100/70 p-4 flex items-center gap-3 text-left"><div className="w-10 h-10 rounded-xl bg-haven-deep text-white flex items-center justify-center"><Award className="w-4 h-4" /></div><div className="flex-1"><p className="font-display font-bold text-sm text-haven-deep">Pregnancy completion</p><p className="font-body text-xs text-ink-600 mt-0.5">Record birth outcome when the journey reaches its end.</p></div><ChevronRight className="w-4 h-4 text-haven-deep" /></button>
            </div>
          </>
        ) : (
          <EmptyState icon={Sparkles} title="No pregnancy tracked" message="Add a pregnancy to begin a journey, or switch to your child's journey." actionLabel="Add pregnancy" onAction={onOpenContextSelector} />
        ) : child ? (
          <>
            <button onClick={onOpenChildDashboard} className="w-full rounded-card p-5 text-left text-white shadow-card-2" style={{ background: 'var(--grad-haven)' }}><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">Child journey</p><h2 className="font-display font-bold text-[26px] mt-1">{child.name || 'Child'}</h2><p className="font-body text-xs text-white/75 mt-1">Born {new Date(child.dateOfBirth).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p></button>
            <button onClick={onOpenChildDashboard} className="w-full py-3.5 rounded-pill text-white font-display font-bold" style={{ background: 'var(--grad-haven)' }}>Continue child's journey</button>
            <button onClick={onOpenChildTimeline} className="w-full bg-white rounded-card border border-border-hairline p-4 flex items-center gap-3 text-left"><div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center"><Baby className="w-4 h-4 text-haven-orchid" /></div><div className="flex-1"><p className="font-display font-bold text-sm text-ink-900">Child timeline</p><p className="font-body text-xs text-ink-600">See milestones and care records.</p></div><ChevronRight className="w-4 h-4 text-ink-400" /></button>
          </>
        ) : <EmptyState icon={Baby} title="No child tracked" message="Add a child record when you're ready to start a child's journey." actionLabel="Add child" onAction={onOpenAddChild} />}
      </main>
    </div>
  );
};
