import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Calendar, ChevronRight, Stethoscope } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { AncEncounterDoc } from '../../types';
import { auth, db } from '../../lib/firebase';
import { ProvenanceBadge } from '../ProvenanceBadge';
import EmptyState from '../EmptyState';

interface AncOverviewProps { encounters: AncEncounterDoc[]; onBack:()=>void; onAddVisit:()=>void; onSelectVisit:(visit:AncEncounterDoc)=>void; }
const fmt = (value?: string) => value ? new Date(value).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}) : 'Not recorded';

export const AncOverview:React.FC<AncOverviewProps>=({encounters: parentEncounters,onBack,onAddVisit,onSelectVisit})=>{
  const [encounters,setEncounters]=useState<AncEncounterDoc[]|null>(null);
  useEffect(()=>{
    const uid=auth.currentUser?.uid; if(!uid){setEncounters([]);return;}
    let childUnsubscribe: (()=>void)|undefined;
    const pregnancyQuery=query(collection(db,'pregnancies'),where('motherId','==',uid),where('status','==','active'));
    const unsubscribe=onSnapshot(pregnancyQuery,snapshot=>{
      childUnsubscribe?.();
      const pregnancy=snapshot.docs[0];
      if(!pregnancy){setEncounters([]);return;}
      childUnsubscribe=onSnapshot(collection(db,'pregnancies',pregnancy.id,'ancEncounters'),encSnapshot=>{
        const list=encSnapshot.docs.map(d=>({id:d.id,...(d.data() as Omit<AncEncounterDoc,'id'>)}));
        list.sort((a,b)=>Number(a.visitNumber||0)-Number(b.visitNumber||0)); setEncounters(list);
      },()=>setEncounters([]));
    },()=>setEncounters([]));
    return ()=>{childUnsubscribe?.();unsubscribe();};
  },[]);
  const next=encounters?.map(e=>e as AncEncounterDoc & {nextVisitDate?:string}).filter(e=>e.nextVisitDate&&new Date(e.nextVisitDate).getTime()>Date.now()).sort((a,b)=>new Date(a.nextVisitDate!).getTime()-new Date(b.nextVisitDate!).getTime())[0];
  const pct=encounters ? Math.min(100,Math.round(encounters.length/8*100)) : 0;
  return <div className="min-h-screen bg-lavender-50 pb-24"><header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border-hairline px-4 py-3.5 flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline text-haven-deep flex items-center justify-center"><ArrowLeft className="w-5 h-5"/></button><div><h1 className="font-display font-bold text-xl text-ink-900">ANC Overview</h1><p className="font-body text-xs text-ink-600">{encounters ? `${encounters.length} of 8 recommended contacts` : 'Loading your ANC records…'}</p></div></div><button onClick={onAddVisit} className="w-10 h-10 rounded-full text-white flex items-center justify-center" style={{background:'var(--grad-haven)'}}><Plus className="w-5 h-5"/></button></header><main className="p-4 space-y-4 max-w-[420px] mx-auto"><section className="rounded-[20px] p-5 text-white shadow-card-1" style={{background:'var(--grad-haven)'}}><p className="font-body text-[11px] uppercase tracking-wider text-white/70">ANC progress</p><h2 className="font-display font-bold text-2xl mt-1">{encounters ? `${encounters.length} of 8 contacts` : 'Loading…'}</h2><div className="h-2 bg-white/20 rounded-full mt-4 overflow-hidden">{encounters && <div className="h-full bg-white rounded-full" style={{width:`${pct}%`}}/>}</div><p className="font-body text-xs text-white/75 mt-2">Progress reflects visits you have actually recorded.</p></section>{next&&<section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center gap-3"><Calendar className="w-5 h-5 text-haven-orchid"/><div><p className="font-display font-bold text-sm text-ink-900">Next scheduled visit</p><p className="font-body text-xs text-ink-600 mt-1">{fmt(next.nextVisitDate)}{next.facilityName?` · ${next.facilityName}`:''}</p></div></section>}
    {encounters===null ? <div className="space-y-3"><div className="h-16 rounded-[20px] bg-lavender-100 animate-pulse"/><div className="h-16 rounded-[20px] bg-lavender-100 animate-pulse"/></div> : encounters.length===0 ? <div className="bg-white rounded-[20px] border border-border-hairline p-6"><EmptyState icon={Stethoscope} title="No ANC visits logged yet" message="Add your first antenatal visit to start tracking your care." actionLabel="Add ANC visit" onAction={onAddVisit}/></div> : <section className="space-y-3"><div className="flex items-center justify-between px-1"><h2 className="font-display font-bold text-base text-ink-900">ANC visits</h2><span className="font-body text-xs font-semibold text-haven-deep">{encounters.length} of 8 contacts attended</span></div>{encounters.map((e,i)=><button key={e.id||i} onClick={()=>onSelectVisit(e)} className="w-full text-left bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-display font-bold text-sm text-ink-900">{fmt(e.date)}</p><p className="font-body text-xs text-ink-600 mt-1">{e.facilityName||'Facility not recorded'}</p></div><ProvenanceBadge provenance={e.provenance} compact showCaption={false}/></div><div className="flex items-center justify-between mt-3"><span className="font-body text-xs text-ink-600">ANC Contact {e.visitNumber||i+1}</span><ChevronRight className="w-4 h-4 text-haven-orchid"/></div></button>)}</section>}
    <button onClick={onAddVisit} className="w-full py-3.5 rounded-pill text-white font-display font-bold" style={{background:'var(--grad-haven)'}}><Plus className="inline w-4 h-4 mr-2"/>Add ANC visit</button>
  </main></div>;
};
