import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Check, Circle, Baby, Heart, Syringe, Scale, Smile, Loader2 } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChildDoc, DevelopmentRecordDoc, GrowthMeasurementDoc, ImmunizationRecordDoc, NewbornRecordDoc, PostnatalEncounterDoc } from '../../types';
import EmptyState from '../EmptyState';

interface ChildTimelineProps { child?: ChildDoc | null; onBack: () => void; onSelectCategory?: (category: string) => void; }
type Category = 'newborn' | 'pnc' | 'immunization' | 'growth' | 'development';
type TimelineItem = { id: string; date: Date; ageLabel: string; category: Category; title: string; detail: string; };

const iconFor = (category: Category) => category === 'newborn' ? Baby : category === 'pnc' ? Heart : category === 'immunization' ? Syringe : category === 'growth' ? Scale : Smile;
const formatDate = (date: Date) => date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const ageInDays = (dob: string) => Math.max(0, Math.floor((Date.now() - new Date(`${dob}T00:00:00`).getTime()) / 86400000));
const ageLabel = (dob: string, date: Date) => {
  const birth = new Date(`${dob}T00:00:00`);
  const days = Math.max(0, Math.floor((date.getTime() - birth.getTime()) / 86400000));
  if (days < 60) return `${days} day${days === 1 ? '' : 's'} old`;
  const months = Math.floor(days / 30.4375);
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} old`;
  return `${Math.floor(months / 12)} years old`;
};

export const ChildTimeline: React.FC<ChildTimelineProps> = ({ child, onBack, onSelectCategory }) => {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [newbornRecords, setNewbornRecords] = useState<NewbornRecordDoc[]>([]);
  const [pncRecords, setPncRecords] = useState<PostnatalEncounterDoc[]>([]);
  const [immunizations, setImmunizations] = useState<ImmunizationRecordDoc[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthMeasurementDoc[]>([]);
  const [developmentRecords, setDevelopmentRecords] = useState<DevelopmentRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!child?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let loaded = 0;
    const done = () => { loaded += 1; if (loaded === 5) setLoading(false); };
    const base = ['newbornRecords', 'postnatalEncounters', 'immunizationRecords', 'growthMeasurements', 'developmentRecords'] as const;
    const unsubs = base.map((subcollection) => onSnapshot(
      collection(db, 'children', child.id, subcollection),
      (snapshot) => {
        if (subcollection === 'newbornRecords') setNewbornRecords(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewbornRecordDoc, 'id'>) })));
        if (subcollection === 'postnatalEncounters') setPncRecords(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PostnatalEncounterDoc, 'id'>) })));
        if (subcollection === 'immunizationRecords') setImmunizations(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImmunizationRecordDoc, 'id'>) })));
        if (subcollection === 'growthMeasurements') setGrowthRecords(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GrowthMeasurementDoc, 'id'>) })));
        if (subcollection === 'developmentRecords') setDevelopmentRecords(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DevelopmentRecordDoc, 'id'>) })));
        done();
      }, (error) => { console.error(`Could not load ${subcollection}:`, error); done(); }
    ));
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [child?.id]);

  const items = useMemo<TimelineItem[]>(() => {
    if (!child) return [];
    const birth = new Date(`${child.dateOfBirth}T00:00:00`);
    const result: TimelineItem[] = [{ id: 'newborn-period', date: birth, ageLabel: 'Birth–28 days', category: 'newborn', title: 'Newborn period', detail: 'The first 28 days of your child’s journey.' }];
    newbornRecords.forEach((record) => result.push({ id: `newborn-${record.id}`, date: new Date(record.date), ageLabel: ageLabel(child.dateOfBirth, new Date(record.date)), category: 'newborn', title: 'Newborn record', detail: `Recorded ${formatDate(new Date(record.date))}.` }));
    pncRecords.forEach((record) => result.push({ id: `pnc-${record.id}`, date: new Date(record.date), ageLabel: ageLabel(child.dateOfBirth, new Date(record.date)), category: 'pnc', title: `PNC · ${record.visit}`, detail: `Postnatal contact recorded ${formatDate(new Date(record.date))}.` }));
    immunizations.forEach((record) => {
      if (!record.dateGiven) return;
      const date = new Date(record.dateGiven);
      result.push({ id: `immunization-${record.id}`, date, ageLabel: ageLabel(child.dateOfBirth, date), category: 'immunization', title: `${record.vaccine} · ${record.dose}`, detail: `Dose recorded ${formatDate(date)}.` });
    });
    growthRecords.forEach((record) => result.push({ id: `growth-${record.id}`, date: new Date(record.date), ageLabel: ageLabel(child.dateOfBirth, new Date(record.date)), category: 'growth', title: 'Growth check-in', detail: `${record.weightKg} kg${record.heightCm ? ` · ${record.heightCm} cm` : ''} recorded ${formatDate(new Date(record.date))}.` }));
    developmentRecords.forEach((record) => result.push({ id: `development-${record.id}`, date: new Date(record.date), ageLabel: ageLabel(child.dateOfBirth, new Date(record.date)), category: 'development', title: record.milestoneTitle, detail: `${record.achieved ? 'Achieved' : 'Not yet achieved'} · recorded ${formatDate(new Date(record.date))}.` }));
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [child, newbornRecords, pncRecords, immunizations, growthRecords, developmentRecords]);

  const visibleItems = filter === 'all' ? items : items.filter((item) => item.category === filter);
  const nowId = useMemo(() => {
    if (!child || !items.length) return null;
    if (ageInDays(child.dateOfBirth) <= 28) return 'newborn-period';
    const datedRecords = items.filter((item) => item.id !== 'newborn-period');
    return datedRecords.length ? datedRecords[datedRecords.length - 1].id : null;
  }, [child, items]);

  if (!child) return <div className="min-h-screen bg-lavender-50 p-5"><button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-border-hairline text-haven-deep flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button><div className="mt-10"><EmptyState icon={Baby} title="No child selected" message="Add a child record before opening the first-five-years journey." /></div></div>;

  return (
    <div className="min-h-screen bg-lavender-50 pb-24">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border-hairline px-4 py-3.5 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline text-haven-deep flex items-center justify-center" aria-label="Back"><ChevronLeft className="w-5 h-5" /></button>
        <div><h1 className="font-display font-bold text-xl text-ink-900">Child Timeline</h1><p className="font-body text-xs text-ink-600">First five years · real recorded care</p></div>
      </header>
      <main className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1">{(['all', 'newborn', 'pnc', 'immunization', 'growth', 'development'] as const).map((category) => <button key={category} onClick={() => { setFilter(category); if (category !== 'all') onSelectCategory?.(category); }} className={`px-3 py-1.5 rounded-pill whitespace-nowrap text-xs font-display font-bold ${filter === category ? 'bg-haven-deep text-white' : 'bg-white text-ink-700 border border-border-hairline'}`}>{category === 'all' ? 'All' : category[0].toUpperCase() + category.slice(1)}</button>)}</div>
        {loading ? <div className="bg-white rounded-[20px] border border-border-hairline p-8 flex flex-col items-center gap-2 text-ink-600"><Loader2 className="w-6 h-6 animate-spin text-haven-orchid" /><span className="font-body text-sm">Loading your recorded milestones…</span></div> : visibleItems.length === 0 ? <EmptyState icon={Baby} title="No milestones in this area yet" message="Recorded newborn care, PNC, immunizations, growth and development will appear here as you add them." /> : (
          <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 relative overflow-hidden">
            <div className="absolute left-[22px] top-8 bottom-8 w-10 pointer-events-none"><svg viewBox="0 0 40 760" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true"><path d="M20 0 C34 80 6 160 20 240 C34 320 6 400 20 480 C34 560 6 640 20 760" stroke="#E5DFF0" strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M20 0 C34 80 6 160 20 240 C34 320 6 400 20 480 C34 560 6 640 20 760" stroke="url(#childRibbon)" strokeWidth="7" fill="none" strokeLinecap="round" /><defs><linearGradient id="childRibbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#33178A" /><stop offset="1" stopColor="#9167C2" /></linearGradient></defs></svg></div>
            <div className="relative z-10 space-y-5">
              {visibleItems.map((item) => {
                const isPast = item.id !== nowId && item.date.getTime() < Date.now();
                const isNow = item.id === nowId;
                const Icon = iconFor(item.category);
                return <button key={item.id} onClick={() => onSelectCategory?.(item.category)} className="w-full flex items-start gap-4 text-left p-2 rounded-2xl">
                  <div className="w-8 flex-shrink-0 flex justify-center">{isNow ? <span className="w-9 h-9 rounded-full border-2 border-haven-orchid bg-white flex items-center justify-center"><span className="w-4 h-4 rounded-full bg-haven-orchid" /></span> : isPast ? <span className="w-8 h-8 rounded-full bg-haven-deep text-white flex items-center justify-center"><Check className="w-4 h-4 stroke-[3]" /></span> : <span className="w-8 h-8 rounded-full border-2 border-[#D8CEE8] bg-white flex items-center justify-center"><Circle className="w-2 h-2 text-[#D8CEE8]" /></span>}</div>
                  <div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><span className={`font-display font-bold text-sm ${isPast || isNow ? 'text-ink-900' : 'text-ink-600'}`}>{item.title}</span>{isNow && <span className="px-2 py-0.5 rounded-pill bg-haven-orchid text-white text-[10px] font-display font-bold">Now</span>}</div><p className="font-body text-xs text-ink-600 mt-1">{item.detail}</p><span className="inline-flex items-center gap-1 mt-1 text-[10px] text-ink-600"><Icon className="w-3 h-3 text-haven-orchid" />{item.ageLabel}</span></div>
                </button>;
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
