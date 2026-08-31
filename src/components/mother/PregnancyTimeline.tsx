import React from 'react';
import { ArrowLeft, Check, Clock, Calendar, Stethoscope, Heart } from 'lucide-react';
import { AncEncounterDoc, BirthPlanDoc } from '../../types';

interface PregnancyTimelineProps {
  currentWeek: number;
  encounters?: AncEncounterDoc[];
  birthPlan?: BirthPlanDoc | null;
  onBack?: () => void;
  onSelectMilestone?: (milestone: TimelineItem) => void;
}

export interface TimelineItem {
  id: string;
  week: number;
  title: string;
  description: string;
  ancContactNumber?: number;
}

export const PregnancyTimeline: React.FC<PregnancyTimelineProps> = ({ currentWeek, encounters = [], birthPlan, onBack, onSelectMilestone }) => {
  const safeWeek = Math.max(1, Math.min(42, currentWeek));
  const milestones: TimelineItem[] = [
    { id: 'confirmed', week: 1, title: 'Confirmed pregnancy', description: 'Your pregnancy record was created and the journey began.' },
    { id: 'trimester-1', week: 13, title: 'First trimester complete', description: 'Weeks 1–13 completed.' },
    { id: 'trimester-2', week: 27, title: 'Second trimester complete', description: 'Weeks 14–27 completed.' },
    { id: 'trimester-3', week: 40, title: 'Third trimester complete', description: 'Weeks 28–40 completed.' },
    ...encounters.map((enc, index) => ({ id: enc.id, week: enc.gestationWeeks || safeWeek, title: `ANC Contact ${enc.visitNumber || index + 1}`, description: enc.facilityName ? `Recorded at ${enc.facilityName}.` : 'ANC encounter recorded.', ancContactNumber: enc.visitNumber || index + 1 })),
    { id: 'birth-plan', week: 36, title: 'Birth plan finalized', description: birthPlan ? 'Birth plan has been saved.' : 'Birth plan has not yet been saved.' },
    { id: 'childbirth', week: 40, title: 'Childbirth', description: 'Pregnancy completion and birth outcome.' },
  ];

  const ordered = [...milestones].sort((a, b) => a.week - b.week || a.title.localeCompare(b.title));
  const currentIndex = ordered.reduce((best, item, index) => item.week <= safeWeek ? index : best, 0);

  const status = (item: TimelineItem, index: number) => {
    if (item.id === 'confirmed') return 'completed';
    if (item.id === 'childbirth') return 'upcoming';
    if (item.id === 'birth-plan') return birthPlan ? 'completed' : (safeWeek >= item.week ? 'current' : 'upcoming');
    if (item.ancContactNumber) return item.week < safeWeek ? 'completed' : item.week === safeWeek ? 'current' : 'upcoming';
    if (item.week < safeWeek) return 'completed';
    if (index === currentIndex || item.week === safeWeek) return 'current';
    return 'upcoming';
  };

  return <div className="min-h-screen bg-lavender-50 pb-24">
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border-hairline px-4 py-3.5 flex items-center gap-3"><button onClick={onBack} className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline text-haven-deep flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button><div><h1 className="font-display font-bold text-xl text-ink-900">Pregnancy Timeline</h1><p className="font-body text-xs text-ink-600">Week {safeWeek} · milestones and care contacts</p></div></header>
    <main className="p-4 max-w-[420px] mx-auto">
      <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 relative overflow-hidden"><div className="flex items-center justify-between pb-4 border-b border-border-hairline mb-5"><div><h2 className="font-display font-bold text-base text-ink-900">Your pregnancy journey</h2><p className="font-body text-xs text-ink-600 mt-0.5">Real milestones from your pregnancy record and ANC visits.</p></div><div className="w-10 h-10 rounded-full bg-lavender-100 flex items-center justify-center"><Heart className="w-5 h-5 text-haven-orchid" /></div></div>
        <div className="relative"><svg className="absolute left-[18px] top-2 bottom-2 h-[calc(100%-16px)] w-10" viewBox="0 0 40 760" preserveAspectRatio="none" aria-hidden="true"><path d="M20 0 C34 80 6 150 20 230 C34 310 6 390 20 470 C34 550 6 630 20 760" stroke="#E5DFF0" strokeWidth="7" fill="none" strokeLinecap="round"/><path d="M20 0 C34 80 6 150 20 230 C34 310 6 390 20 470 C34 550 6 630 20 760" stroke="url(#pregnancyRibbon)" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="760" strokeDashoffset={760 - Math.min(760, ((currentIndex + 1) / ordered.length) * 760)} /><defs><linearGradient id="pregnancyRibbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#33178A"/><stop offset="1" stopColor="#9167C2"/></linearGradient></defs></svg>
          <div className="space-y-5 relative z-10">{ordered.map((item, index) => { const s = status(item,index); return <button key={item.id} onClick={() => onSelectMilestone?.(item)} className={`w-full text-left flex items-start gap-4 p-2 rounded-2xl ${s === 'current' ? 'bg-lavender-50 border border-haven-orchid/30' : ''}`}><div className="w-8 flex-shrink-0 flex justify-center">{s === 'completed' ? <span className="w-8 h-8 rounded-full bg-haven-deep text-white flex items-center justify-center"><Check className="w-4 h-4 stroke-[3]" /></span> : s === 'current' ? <span className="w-9 h-9 rounded-full border-2 border-haven-orchid bg-white flex items-center justify-center"><span className="w-4 h-4 rounded-full bg-haven-orchid" /></span> : <span className="w-8 h-8 rounded-full border-2 border-[#D8CEE8] bg-white" />}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className={`font-display font-bold text-sm ${s === 'upcoming' ? 'text-ink-600' : 'text-ink-900'}`}>{item.title}</span>{s === 'current' && <span className="px-2 py-0.5 rounded-pill bg-haven-orchid text-white text-[10px] font-display font-bold">Now</span>}{item.ancContactNumber && <span className="px-2 py-0.5 rounded-pill bg-lavender-100 text-haven-deep text-[10px] font-display font-bold"><Stethoscope className="inline w-3 h-3 mr-1" />ANC {item.ancContactNumber}</span>}</div><p className="font-body text-xs text-ink-600 mt-1">{item.description}</p><span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-ink-600"><Calendar className="w-3 h-3" />Week {item.week}</span>{s === 'upcoming' && <span className="ml-3 inline-flex items-center gap-1 text-[10px] text-ink-600"><Clock className="w-3 h-3" />Upcoming</span>}</div></button>; })}</div>
        </div>
      </section>
    </main>
  </div>;
};