import React, { useEffect, useState } from 'react';
import { Baby, Syringe, Scale, Smile, ChevronRight, ChevronDown, Heart } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ChildDoc } from '../../types';
import EmptyState from '../EmptyState';

interface ChildDashboardProps { child?: ChildDoc | null; childrenList?: ChildDoc[]; onSwitchChild: () => void; onOpenNewbornRecord: () => void; onOpenPncOverview: () => void; onOpenImmunization: () => void; onOpenGrowth: () => void; onOpenDevelopment: () => void; onOpenTimeline: () => void; }

const getAgeText = (dob: string) => {
  const birth = new Date(`${dob}T00:00:00`), now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  months = Math.max(0, months);
  if (months === 0) { const days = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / 86400000)); return `${days} day${days === 1 ? '' : 's'} old`; }
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} old`;
  const years = Math.floor(months / 12), remainder = months % 12;
  return remainder ? `${years}y ${remainder}m old` : `${years} year${years === 1 ? '' : 's'} old`;
};

export const ChildDashboard: React.FC<ChildDashboardProps> = ({ child, childrenList = [], onSwitchChild, onOpenNewbornRecord, onOpenPncOverview, onOpenImmunization, onOpenGrowth, onOpenDevelopment, onOpenTimeline }) => {
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  useEffect(() => { setNameDraft(child?.name || ''); setNameError(''); }, [child?.id, child?.name]);

  if (!child) return <div className="min-h-screen bg-lavender-50 p-5"><EmptyState icon={Baby} title="No child record selected" message="Add a child from the Journey tab before opening a child dashboard." /></div>;
  const isUnnamed = !child.name;
  const sex = child.sex === 'boy' ? 'Boy' : 'Girl';
  const dob = new Date(`${child.dateOfBirth}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  const statuses = [{ label: 'Immunization', icon: Syringe, action: onOpenImmunization }, { label: 'Growth', icon: Scale, action: onOpenGrowth }, { label: 'Development', icon: Smile, action: onOpenDevelopment }];
  const areas = [{ label: 'Newborn record', detail: 'Birth and immediate newborn record', icon: Baby, action: onOpenNewbornRecord }, { label: 'Postnatal care', detail: 'Recorded postnatal contacts', icon: Heart, action: onOpenPncOverview }, { label: 'Immunization', detail: 'Vaccination records and schedule', icon: Syringe, action: onOpenImmunization }, { label: 'Growth & nutrition', detail: 'Growth measurements and nutrition', icon: Scale, action: onOpenGrowth }, { label: 'Development', detail: 'Developmental milestones', icon: Smile, action: onOpenDevelopment }];

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim(), uid = auth.currentUser?.uid;
    if (!name || !uid || !child.id) return;
    setSavingName(true); setNameError('');
    try { await updateDoc(doc(db, 'children', child.id), { name }); }
    catch (error) { console.error('Could not save child name:', error); setNameError('We could not save the name. Please try again.'); }
    finally { setSavingName(false); }
  };

  return <div className="min-h-screen bg-lavender-50 pb-24">
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border-hairline px-4 py-3.5 flex items-center justify-between"><div><h1 className="font-display font-bold text-2xl text-ink-900">{child.name || 'Your baby'}</h1><p className="font-body text-xs text-ink-600">Child health journey</p></div>{childrenList.length > 1 && <button onClick={onSwitchChild} className="flex items-center gap-1.5 px-3 py-2 rounded-pill bg-lavender-100 border border-border-hairline text-haven-deep font-display font-bold text-xs">Switch child <ChevronDown className="w-3.5 h-3.5" /></button>}</header>
    <main className="p-4 space-y-4 max-w-lg mx-auto">
      {isUnnamed && <section className="rounded-[20px] bg-white border border-haven-orchid/30 shadow-card-1 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-haven-orchid">One quick step</p><h2 className="font-display font-bold text-xl text-ink-900 mt-1">What’s your baby’s name?</h2><p className="font-body text-sm text-ink-600 mt-1">Give this child record a name so it is easy to recognise later.</p></div><Baby className="w-7 h-7 text-haven-orchid shrink-0" /></div><form onSubmit={saveName} className="mt-4 flex gap-2"><input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="flex-1 min-w-0 p-3 rounded-xl border border-border-hairline bg-lavender-50 font-body text-sm text-ink-900" placeholder="Baby’s name" aria-label="Baby's name" /><button disabled={savingName || !nameDraft.trim()} className="px-4 rounded-pill text-white font-display font-bold text-sm disabled:opacity-50" style={{ background: 'var(--grad-haven)' }}>{savingName ? 'Saving…' : 'Save'}</button></form>{nameError && <p className="font-body text-xs text-status-urgent mt-2">{nameError}</p>}</section>}
      <section className="rounded-[20px] p-5 text-white shadow-card-1 bg-gradient-to-r from-haven-deep to-haven-orchid"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Baby className="w-8 h-8" /></div><div><h2 className="font-display font-bold text-2xl">{getAgeText(child.dateOfBirth)}</h2><p className="font-body text-xs text-white/80">Born {dob} · {sex}</p></div></div></section>
      <div className="grid grid-cols-3 gap-2.5">{statuses.map(({ label, icon: Icon, action }) => <button key={label} onClick={action} className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center"><Icon className="w-5 h-5 text-haven-orchid mx-auto mb-2" /><span className="font-display font-bold text-xs text-ink-900 block">Not started</span><span className="font-body text-[10px] text-ink-600">{label}</span></button>)}</div>
      <div className="space-y-2.5"><p className="font-display font-bold text-sm text-ink-900 px-1">Care areas</p>{areas.map(({ label, detail, icon: Icon, action }) => <button key={label} onClick={action} className="w-full bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center gap-3 text-left"><div className="w-10 h-10 rounded-2xl bg-lavender-100 flex items-center justify-center"><Icon className="w-5 h-5 text-haven-orchid" /></div><span className="flex-1"><b className="font-display font-bold text-sm text-ink-900">{label}</b><span className="block font-body text-xs text-ink-600 mt-0.5">{detail}</span></span><ChevronRight className="w-4 h-4 text-ink-600" /></button>)}</div>
      <button onClick={onOpenTimeline} className="w-full py-3.5 rounded-pill text-white font-display font-bold" style={{ background: 'var(--grad-haven)' }}>View first-five-years timeline</button>
    </main>
  </div>;
};
