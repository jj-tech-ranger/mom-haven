import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, Calendar, Stethoscope, Heart } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AncEncounterDoc, BirthPlanLogistics, PregnancyDoc } from '../../types';

interface PregnancyTimelineProps {
  pregnancy?: PregnancyDoc | null;
  currentWeek?: number;
  onBack?: () => void;
  onSelectMilestone?: (milestone: TimelineItem) => void;
}
export interface TimelineItem { id:string; week:number; title:string; description:string; ancContactNumber?:number; }

const getWeek = (p?: PregnancyDoc | null) => {
  if (!p?.lmp) return null;
  const lmp = new Date(p.lmp).getTime();
  if (!Number.isFinite(lmp)) return null;
  return Math.max(1, Math.floor((Date.now() - lmp) / (7 * 24 * 60 * 60 * 1000)) + 1);
};

export const PregnancyTimeline: React.FC<PregnancyTimelineProps> = ({ pregnancy, onBack, onSelectMilestone }) => {
  const [encounters, setEncounters] = useState<AncEncounterDoc[] | null>(null);
  const [birthPlan, setBirthPlan] = useState<BirthPlanLogistics | null>(null);

  useEffect(() => {
    if (!pregnancy?.id) { setEncounters([]); return; }
    return onSnapshot(collection(db, 'pregnancies', pregnancy.id, 'ancEncounters'), snap => {
      setEncounters(snap.docs.map(d => ({ id:d.id, ...(d.data() as Omit<AncEncounterDoc,'id'>) })));
    }, err => { console.error('Error loading pregnancy timeline ANC:', err); setEncounters([]); });
  }, [pregnancy?.id]);

  useEffect(() => {
    setBirthPlan((pregnancy?.birthPlan as BirthPlanLogistics) || null);
  }, [pregnancy?.birthPlan]);

  const week = getWeek(pregnancy);
  const items = useMemo<TimelineItem[]>(() => {
    if (!week) return [{id:'confirmed',week:1,title:'Confirmed pregnancy',description: pregnancy?.createdAt ? `Pregnancy record created ${new Date(String(pregnancy.createdAt)).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}.` : 'Your pregnancy record was created and the journey began.'}];
    const anc = (encounters || []).map((e,i) => ({ id:e.id, week:Math.max(1, e.gestationWeeks || week), title:`ANC Contact ${e.visitNumber || i+1}`, description:e.facilityName ? `Recorded at ${e.facilityName}.` : 'ANC encounter recorded.', ancContactNumber:e.visitNumber || i+1 }));
    return [
      {id:'confirmed',week:1,title:'Confirmed pregnancy',description: pregnancy?.createdAt ? `Pregnancy record created ${new Date(String(pregnancy.createdAt)).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}.` : 'Your pregnancy record was created and the journey began.'},
      {id:'tri1',week:13,title:'First trimester complete',description:'Weeks 1–13 completed.'},
      {id:'tri2',week:27,title:'Second trimester complete',description:'Weeks 14–27 completed.'},
      {id:'tri3',week:40,title:'Third trimester complete',description:'Weeks 28–40 completed.'},
      ...anc,
      {id:'birth-plan',week:36,title:'Birth plan finalized',description:birthPlan?'Birth plan has been saved.':'Birth plan has not yet been saved.'},
      {id:'childbirth',week:40,title:'Childbirth',description: pregnancy?.status === 'completed' ? 'Pregnancy completion and birth outcome recorded.' : 'Pregnancy completion and birth outcome.'},
    ].sort((a,b)=>a.week-b.week || a.title.localeCompare(b.title));
  }, [week, encounters, birthPlan, pregnancy]);

  const currentId = useMemo(() => {
    if (!week) return 'confirmed';
    if (pregnancy?.status === 'completed') return 'childbirth';
    const completed = items.filter(i => i.id !== 'confirmed' && i.id !== 'childbirth' && i.week <= week);
    return completed.filter(i => i.ancContactNumber).at(-1)?.id || completed.at(-1)?.id || 'confirmed';
  }, [items, week, pregnancy?.status]);

  const status = (i:TimelineItem) => {
    if (i.id === 'confirmed') return 'completed';
    if (i.id === 'childbirth') return pregnancy?.status === 'completed' ? 'completed' : 'upcoming';
    if (i.id === 'birth-plan') return birthPlan ? 'completed' : i.id === currentId ? 'current' : i.week < (week || 0) ? 'completed' : 'upcoming';
    return i.id === currentId ? 'current' : i.week <= (week || 0) ? 'completed' : 'upcoming';
  };

  return <div className="min-h-screen bg-lavender-50 pb-24">
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border-hairline px-4 py-3.5 flex items-center gap-3">
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline text-haven-deep flex items-center justify-center"><ArrowLeft className="w-5 h-5"/></button>
      <div><h1 className="font-display font-bold text-xl text-ink-900">Pregnancy Timeline</h1><p className="font-body text-xs text-ink-600">{week?`Week ${week}`:'Pregnancy week not available'} · milestones and care contacts</p></div>
    </header>
    <main className="p-4 max-w-[420px] mx-auto">
      <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-border-hairline mb-5"><div><h2 className="font-display font-bold text-base text-ink-900">Your pregnancy journey</h2><p className="font-body text-xs text-ink-600 mt-0.5">Milestones are derived from your pregnancy record and recorded ANC visits.</p></div><div className="w-10 h-10 rounded-full bg-lavender-100 flex items-center justify-center"><Heart className="w-5 h-5 text-haven-orchid"/></div></div>
        <div className="relative"><svg className="absolute left-[18px] top-2 bottom-2 h-[calc(100%-16px)] w-10" viewBox="0 0 48 720" preserveAspectRatio="none"><defs><linearGradient id="pregnancyRibbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#33178A"/><stop offset="1" stopColor="#9167C2"/></linearGradient></defs><path d="M24 0 C38 90 10 180 24 270 C38 360 10 450 24 540 C38 620 18 680 24 720" stroke="#E5DFF0" strokeWidth="8" fill="none" strokeLinecap="round"/><path d="M24 0 C38 90 10 180 24 270 C38 360 10 450 24 540 C38 620 18 680 24 720" stroke="url(#pregnancyRibbon)" strokeWidth="8" fill="none" strokeLinecap="round"/></svg>
          <div className="relative z-10 space-y-5">{items.map(i=>{const s=status(i);return <button key={i.id} onClick={()=>onSelectMilestone?.(i)} className={`w-full text-left flex items-start gap-4 p-2 rounded-2xl ${s==='current'?'bg-lavender-50 border border-haven-orchid/30':''}`}><div className="w-8 flex-shrink-0 flex justify-center">{s==='completed'?<span className="w-8 h-8 rounded-full bg-haven-deep text-white flex items-center justify-center"><Check className="w-4 h-4 stroke-[3]"/></span>:s==='current'?<span className="w-9 h-9 rounded-full border-2 border-haven-orchid bg-white flex items-center justify-center"><span className="w-4 h-4 rounded-full bg-haven-orchid"/></span>:<span className="w-8 h-8 rounded-full border-2 border-[#D8CEE8] bg-white"/>}</div><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><span className={`font-display font-bold text-sm ${s==='upcoming'?'text-ink-600':'text-ink-900'}`}>{i.title}</span>{s==='current'&&<span className="px-2 py-0.5 rounded-pill bg-haven-orchid text-white text-[10px] font-display font-bold">Now</span>}{i.ancContactNumber&&<span className="px-2 py-0.5 rounded-pill bg-lavender-100 text-haven-deep text-[10px] font-display font-bold"><Stethoscope className="inline w-3 h-3 mr-1"/>ANC {i.ancContactNumber}</span>}</div><p className="font-body text-xs text-ink-600 mt-1">{i.description}</p><span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-ink-600"><Calendar className="w-3 h-3"/>Week {i.week}</span>{s==='upcoming'&&<span className="ml-3 inline-flex items-center gap-1 text-[10px] text-ink-600"><Clock className="w-3 h-3"/>Upcoming</span>}</div></button>})}</div>
        </div>
      </section>
    </main>
  </div>;
};
