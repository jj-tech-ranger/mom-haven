import React, { useEffect, useState } from 'react';
import { ChevronLeft, Baby, Scale, Ruler, ShieldCheck, Heart, Syringe, Info, Lock } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ChildDoc, NewbornFeedingStatus, NewbornHivStatus, NewbornRecordDoc, Provenance } from '../../types';
import ProvenanceBadge from '../ProvenanceBadge';

interface NewbornRecordProps { child?: ChildDoc | null; initialRecord?: NewbornRecordDoc | null; onBack: () => void; onSave?: (recordData: Omit<NewbornRecordDoc, 'id'>) => Promise<void> | void; }
const today = () => new Date().toISOString().slice(0, 10);

export const NewbornRecord: React.FC<NewbornRecordProps> = ({ child, initialRecord, onBack, onSave }) => {
  const [record, setRecord] = useState<NewbornRecordDoc | null>(initialRecord || null);
  const [date, setDate] = useState(initialRecord?.date || child?.dateOfBirth || today());
  const [weight, setWeight] = useState(initialRecord?.birthWeightGrams?.toString() || '');
  const [length, setLength] = useState(initialRecord?.birthLengthCm?.toString() || '');
  const [headCircumference, setHeadCircumference] = useState(initialRecord?.headCircumferenceCm?.toString() || '');
  const [feedingStatus, setFeedingStatus] = useState<NewbornFeedingStatus | ''>(initialRecord?.feedingStatus || '');
  const [hivStatus, setHivStatus] = useState<NewbornHivStatus | ''>(initialRecord?.hivStatus || '');
  const [tbScreened, setTbScreened] = useState<boolean | undefined>(initialRecord?.tbScreened);
  const [apgar1, setApgar1] = useState(initialRecord?.apgarScore1Min?.toString() || '');
  const [apgar5, setApgar5] = useState(initialRecord?.apgarScore5Min?.toString() || '');
  const [eyeProphylaxis, setEyeProphylaxis] = useState<boolean | undefined>(initialRecord?.eyeProphylaxisGiven);
  const [vitaminK, setVitaminK] = useState<boolean | undefined>(initialRecord?.vitaminKGiven);
  const [bcg, setBcg] = useState<boolean | undefined>(initialRecord?.bcgGiven);
  const [opv0, setOpv0] = useState<boolean | undefined>(initialRecord?.opv0Given);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!child?.id) return;
    return onSnapshot(collection(db, 'children', child.id, 'newbornRecords'), snapshot => {
      const records = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<NewbornRecordDoc, 'id'>) }));
      records.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      const latest = records[0] || null;
      setRecord(latest);
      if (!latest) return;
      setDate(latest.date || child.dateOfBirth || today());
      setWeight(latest.birthWeightGrams?.toString() || '');
      setLength(latest.birthLengthCm?.toString() || '');
      setHeadCircumference(latest.headCircumferenceCm?.toString() || '');
      setFeedingStatus(latest.feedingStatus || '');
      setHivStatus(latest.hivStatus || '');
      setTbScreened(latest.tbScreened);
      setApgar1(latest.apgarScore1Min?.toString() || '');
      setApgar5(latest.apgarScore5Min?.toString() || '');
      setEyeProphylaxis(latest.eyeProphylaxisGiven);
      setVitaminK(latest.vitaminKGiven);
      setBcg(latest.bcgGiven);
      setOpv0(latest.opv0Given);
    }, snapshotError => setError(snapshotError.message));
  }, [child?.id, child?.dateOfBirth]);

  const isVerified = record?.provenance?.status === 'VERIFIED';
  const previewProvenance: Provenance = record?.provenance || { status: 'REPORTED', enteredBy: auth.currentUser?.uid || '', enteredAt: new Date().toISOString(), verifiedBy: null, verifiedAt: null, source: 'reported_caregiver' };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!child?.id || !auth.currentUser || isVerified) return;
    setIsSubmitting(true); setError(null);
    try {
      const provenance: Provenance = { status: 'REPORTED', enteredBy: auth.currentUser.uid, enteredAt: new Date().toISOString(), verifiedBy: null, verifiedAt: null, source: 'reported_caregiver' };
      const payload: Omit<NewbornRecordDoc, 'id'> = {
        childId: child.id, date,
        birthWeightGrams: weight ? Math.round(Number(weight)) : undefined,
        birthLengthCm: length ? Number(length) : undefined,
        headCircumferenceCm: headCircumference ? Number(headCircumference) : undefined,
        feedingStatus: feedingStatus || undefined,
        hivStatus: hivStatus || undefined,
        tbScreened,
        apgarScore1Min: apgar1 ? Number(apgar1) : undefined,
        apgarScore5Min: apgar5 ? Number(apgar5) : undefined,
        eyeProphylaxisGiven: eyeProphylaxis === true,
        vitaminKGiven: vitaminK === true,
        bcgGiven: bcg === true,
        opv0Given: opv0 === true,
        provenance,
      };
      if (onSave) await onSave(payload); else await addDoc(collection(db, 'children', child.id, 'newbornRecords'), { ...payload, createdAt: serverTimestamp() });
      onBack();
    } catch (err: any) { setError(err?.message || 'Could not save the newborn record.'); } finally { setIsSubmitting(false); }
  };

  if (!child) return <div className="min-h-screen bg-lavender-50 p-5"><div className="bg-white rounded-[20px] border border-border-hairline p-5 text-center"><Baby className="w-8 h-8 text-haven-orchid mx-auto mb-2" /><h1 className="font-display font-bold text-lg text-ink-900">No child selected</h1><p className="font-body text-sm text-ink-600 mt-1">Select a real child record before entering newborn information.</p><button onClick={onBack} className="mt-4 w-full py-3 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold">Back</button></div></div>;

  return <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
    <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between"><button onClick={onBack} className="w-9 h-9 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep"><ChevronLeft className="w-5 h-5" /></button><div className="text-center"><h1 className="font-display font-bold text-lg text-ink-900">Newborn Record</h1><p className="font-body text-[11px] text-ink-600">{child.name}</p></div><div className="w-9" /></header>
    <main className="p-4 space-y-4 max-w-lg mx-auto w-full">
      <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between gap-3"><div><p className="font-body text-[11px] text-ink-600 uppercase tracking-wider">Record status</p><p className="font-display font-bold text-sm text-ink-900 mt-0.5">{isVerified ? 'Verified and locked' : record ? 'Reported · partially complete' : 'Reported · not yet saved'}</p></div><div className="text-right"><ProvenanceBadge provenance={previewProvenance} compact />{isVerified && <Lock className="w-4 h-4 text-status-normal ml-auto mt-1" />}</div></section>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-[16px] text-xs text-red-700 font-body flex items-center gap-2"><Info className="w-4 h-4 flex-shrink-0" />{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3"><h2 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2"><Baby className="w-4 h-4 text-haven-orchid" /> Birth measurements</h2>
          <div><label className="block font-body text-xs font-semibold text-ink-900 mb-1">Date of record *</label><input type="date" value={date} disabled={isVerified} required onChange={e=>setDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-body text-xs font-semibold text-ink-900 mb-1">Weight (g)</label><div className="relative"><Scale className="absolute left-3 top-3 w-4 h-4 text-haven-orchid" /><input type="number" min="0" step="1" value={weight} disabled={isVerified} onChange={e=>setWeight(e.target.value)} placeholder="Enter weight" className="w-full pl-9 pr-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60" /></div></div><div><label className="block font-body text-xs font-semibold text-ink-900 mb-1">Length (cm)</label><div className="relative"><Ruler className="absolute left-3 top-3 w-4 h-4 text-haven-orchid" /><input type="number" min="0" step="0.1" value={length} disabled={isVerified} onChange={e=>setLength(e.target.value)} placeholder="Enter length" className="w-full pl-9 pr-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60" /></div></div></div>
          <div><label className="block font-body text-xs font-semibold text-ink-900 mb-1">Head circumference (cm)</label><input type="number" min="0" step="0.1" value={headCircumference} disabled={isVerified} onChange={e=>setHeadCircumference(e.target.value)} placeholder="Enter measurement" className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-body text-xs font-semibold text-ink-900 mb-1">APGAR 1 min</label><input type="number" min="0" max="10" value={apgar1} disabled={isVerified} onChange={e=>setApgar1(e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60" /></div><div><label className="block font-body text-xs font-semibold text-ink-900 mb-1">APGAR 5 min</label><input type="number" min="0" max="10" value={apgar5} disabled={isVerified} onChange={e=>setApgar5(e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60" /></div></div>
        </section>
        <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3"><h2 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2"><Heart className="w-4 h-4 text-haven-orchid" /> Feeding</h2><label className="font-body text-xs font-semibold text-ink-900">Breastfeeding status<select value={feedingStatus} disabled={isVerified} onChange={e=>setFeedingStatus(e.target.value as NewbornFeedingStatus | '')} className="mt-1 w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60"><option value="">Not yet recorded</option><option value="well">Breastfeeding well</option><option value="poorly">Breastfeeding poorly</option><option value="unable">Unable to breastfeed</option></select></label></section>
        <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3"><h2 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-haven-orchid" /> Screening</h2><label className="font-body text-xs font-semibold text-ink-900">HIV status<select value={hivStatus} disabled={isVerified} onChange={e=>setHivStatus(e.target.value as NewbornHivStatus | '')} className="mt-1 w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-sm font-body disabled:opacity-60"><option value="">Not yet recorded</option><option value="exposed">Exposed</option><option value="reactive">Reactive</option><option value="non_reactive">Non-reactive</option><option value="unknown">Unknown</option></select></label><div className="flex items-center justify-between rounded-2xl border border-border-hairline p-3"><div><p className="font-body text-xs font-semibold text-ink-900">TB screening</p><p className="font-body text-[11px] text-ink-600">Record only if this has actually been assessed.</p></div><select value={tbScreened === undefined ? '' : tbScreened ? 'yes' : 'no'} disabled={isVerified} onChange={e=>setTbScreened(e.target.value === '' ? undefined : e.target.value === 'yes')} className="px-2.5 py-2 rounded-card border border-border-hairline bg-white text-xs font-body disabled:opacity-60"><option value="">Not recorded</option><option value="yes">Yes</option><option value="no">No</option></select></div></section>
        <section className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2.5"><h2 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2"><Syringe className="w-4 h-4 text-haven-orchid" /> Immediate newborn care</h2>{[['Vitamin K given', vitaminK, setVitaminK],['Eye prophylaxis given', eyeProphylaxis, setEyeProphylaxis],['BCG given', bcg, setBcg],['OPV birth dose given', opv0, setOpv0]].map(([label,value,setter])=><label key={String(label)} className="flex items-center justify-between rounded-2xl border border-border-hairline p-3"><span className="font-body text-xs font-semibold text-ink-900">{String(label)}</span><input type="checkbox" checked={value === true} disabled={isVerified} onChange={e=>(setter as React.Dispatch<React.SetStateAction<boolean | undefined>>)(e.target.checked)} className="w-5 h-5 accent-haven-deep disabled:opacity-60" /></label>)}</section>
        <div className="space-y-2.5 pt-1">{!isVerified && <button type="submit" disabled={isSubmitting || !auth.currentUser} className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary disabled:opacity-50">{isSubmitting ? 'Saving…' : 'Save record'}</button>}<button type="button" onClick={onBack} className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm">{isVerified ? 'Back to Overview' : 'Cancel'}</button></div>
      </form>
    </main>
  </div>;
};

export default NewbornRecord;
