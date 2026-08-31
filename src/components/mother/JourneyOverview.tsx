import React, { useEffect, useState } from 'react';
import { Baby, ChevronDown, ChevronRight, Compass, Heart, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { PregnancyDoc, ChildDoc, MotherProfileDoc, AncEncounterDoc, BirthPlanDoc } from '../../types';
import { HavenRibbon } from '../HavenRibbon';
import { PregnancyOverview } from './PregnancyOverview';
import { PregnancyTimeline } from './PregnancyTimeline';
import EmptyState from '../EmptyState';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

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

const weekFromPregnancy = (pregnancy?: PregnancyDoc | null) => pregnancy?.lmp ? Math.max(1, Math.floor((Date.now() - new Date(pregnancy.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1) : null;

export const JourneyOverview: React.FC<JourneyOverviewProps> = ({ pregnancy, childrenList = [], motherProfile, encounters = [], onOpenContextSelector, onOpenPregnancyOverview, onOpenTimeline, onOpenAncOverview, onOpenHealthHistory, onOpenBirthPlan, onOpenBirthOutcome, onOpenAddChild, onOpenChildDashboard, onOpenChildTimeline }) => {
  const [mode, setMode] = useState<'pregnancy' | 'child'>(pregnancy ? 'pregnancy' : childrenList.length ? 'child' : 'pregnancy');
  const [screen, setScreen] = useState<'overview' | 'pregnancy' | 'timeline'>('overview');
  const [birthPlan, setBirthPlan] = useState<BirthPlanDoc | null>(null);
  const week = weekFromPregnancy(pregnancy);
  const child = childrenList[0];

  useEffect(() => {
    if (!pregnancy?.id) { setBirthPlan(null); return; }
    const q = query(collection(db, 'birthPlans'), where('pregnancyId', '==', pregnancy.id));
    return onSnapshot(q, snapshot => {
      const first = snapshot.docs[0];
      setBirthPlan(first ? ({ id: first.id, ...(first.data() as Omit<BirthPlanDoc, 'id'>) }) : null);
    });
  }, [pregnancy?.id]);

  if (screen === 'pregnancy' && pregnancy) return <PregnancyOverview pregnancy={pregnancy} motherProfile={motherProfile} encounters={encounters} birthPlan={birthPlan} onBack={() => setScreen('overview')} onOpenAddVisit={() => onOpenPregnancyOverview()} onOpenTimeline={() => setScreen('timeline')} onOpenAncOverview={onOpenAncOverview} onOpenHealthHistory={onOpenHealthHistory} onOpenBirthPlan={onOpenBirthPlan} onOpenBirthOutcome={onOpenBirthOutcome} />;
  if (screen === 'timeline' && pregnancy) return <PregnancyTimeline currentWeek={week || 1} encounters={encounters} birthPlan={birthPlan} onBack={() => setScreen('pregnancy')} onSelectMilestone={m => m.ancContactNumber ? onOpenAncOverview() : undefined} />;

  return <div className="min-h-screen bg-lavender-50 pb-28">
    <header className="px-5 pt-5 pb-3 flex items-center justify-between"><div><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">Your journey</p><h1 className="font-display font-bold text-[24px] text-ink-900">Journey</h1></div><button onClick={onOpenContextSelector} className="flex items-center gap-1.5 rounded-pill bg-white border border-border-hairline px-3 py-2 font-display font-bold text-xs text-haven-deep shadow-card-1"><span>{mode === 'pregnancy' ? (week ? `Pregnancy · Week ${week}` : 'Pregnancy') : child?.name || 'Child'}</span><ChevronDown className="w-3.5 h-3.5" /></button></header>
    <main className="px-5 space-y-4">
      {pregnancy && mode === 'pregnancy' ? <>
        <section className="rounded-[20px] p-5 text-white shadow-card-1" style={{background:'var(--grad-haven)'}}><div className="flex items-start justify-between"><div><p className="font-body text-[11px] uppercase tracking-wider text-white/70">Pregnancy journey</p><h2 className="font-display font-bold text-[26px] mt-1">{week ? `Week ${week} of 40` : 'Pregnancy progress'}</h2><p className="font-body text-xs text-white/75 mt-1">{pregnancy.edd ? `EDD ${new Date(pregnancy.edd).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}` : 'EDD not recorded'}</p></div><div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"><Heart className="w-5 h-5" /></div></div>{week && <HavenRibbon progress={(week/40)*100} currentStep={week} totalSteps={40} showMarkerTooltip={false} className="mt-4" />}</section>
        <button onClick={() => setScreen('pregnancy')} className="w-full py-3.5 rounded-pill text-white font-display font-bold shadow-button" style={{background:'var(--grad-haven)'}}><Compass className="inline w-4 h-4 mr-2" />Continue pregnancy journey</button>
        <div className="grid gap-2.5"><button onClick={() => setScreen('timeline')} className="w-full bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center gap-3 text-left"><Sparkles className="w-5 h-5 text-haven-orchid" /><span className="flex-1"><b className="font-display text-sm text-ink-900">Pregnancy timeline</b><span className="block font-body text-xs text-ink-600">Milestones and ANC contacts</span></span><ChevronRight className="w-4 h-4" /></button><button onClick={onOpenAncOverview} className="w-full bg-white rounded-[20px] border border-border-hairline p-4 flex items-center gap-3 text-left"><Stethoscope className="w-5 h-5 text-haven-orchid" /><span className="flex-1"><b className="font-display text-sm text-ink-900">ANC visits</b><span className="block font-body text-xs text-ink-600">{encounters.length} recorded contact{encounters.length === 1 ? '' : 's'}</span></span><ChevronRight className="w-4 h-4" /></button><button onClick={onOpenBirthPlan} className="w-full bg-white rounded-[20px] border border-border-hairline p-4 flex items-center gap-3 text-left"><ShieldCheck className="w-5 h-5 text-haven-orchid" /><span className="flex-1"><b className="font-display text-sm text-ink-900">Birth plan</b><span className="block font-body text-xs text-ink-600">{birthPlan ? 'Saved' : 'Not yet recorded'}</span></span><ChevronRight className="w-4 h-4" /></button></div>
      </> : childrenList.length && mode === 'child' ? <><button onClick={onOpenChildDashboard} className="w-full rounded-[20px] p-5 text-left text-white shadow-card-1" style={{background:'var(--grad-haven)'}}><p className="font-body text-[11px] uppercase tracking-wider text-white/70">Child journey</p><h2 className="font-display font-bold text-2xl mt-1">{child?.name}</h2><p className="font-body text-xs text-white/75 mt-1">Born {new Date(child!.dateOfBirth).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</p></button><button onClick={onOpenChildDashboard} className="w-full py-3.5 rounded-pill text-white font-display font-bold" style={{background:'var(--grad-haven)'}}>Continue child journey</button><button onClick={onOpenChildTimeline} className="w-full bg-white rounded-[20px] border border-border-hairline p-4 flex items-center gap-3 text-left"><Baby className="w-5 h-5 text-haven-orchid" /><span className="flex-1"><b className="font-display text-sm text-ink-900">Child timeline</b><span className="block font-body text-xs text-ink-600">Newborn to first five years</span></span><ChevronRight className="w-4 h-4" /></button></> : <EmptyState icon={pregnancy ? Baby : Sparkles} title={pregnancy ? 'No child journey yet' : 'No pregnancy recorded'} message={pregnancy ? 'Add a child record when you are ready to begin the child journey.' : 'Add a pregnancy to begin tracking your maternal journey.'} actionLabel={pregnancy ? 'Add child' : 'Add pregnancy'} onAction={pregnancy ? onOpenAddChild : onOpenContextSelector} />}
      {pregnancy && childrenList.length > 0 && <button onClick={() => setMode(mode === 'pregnancy' ? 'child' : 'pregnancy')} className="w-full py-3 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold">Switch to {mode === 'pregnancy' ? 'child' : 'pregnancy'} journey</button>}
    </main>
  </div>;
};