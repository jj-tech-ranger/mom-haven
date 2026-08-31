import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, Baby, Brain, Check, Droplets, Hand, HeartCrack, HeartPulse, MapPin, Phone, Plus, ShieldAlert, Stethoscope, Sun, Thermometer, UserRound, Waves, Wind, WifiOff, X } from 'lucide-react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { DANGER_SIGNS, type DangerSign, type DangerSignCategory } from '../lib/safetyPatterns';
import type { EmergencyContactDoc, SavedEmergencyFacilityDoc } from '../types';
import { readEmergencyCache, writeEmergencyCache } from '../lib/emergencyOffline';

const BASELINE_GUIDANCE = { message: 'Go to the nearest health facility now, or call for emergency transport.', fallbackNumber: '1199', fallbackLabel: 'Kenya Red Cross emergency response' };
const SELF_HARM_NUMBER = '1199';
const icons: Record<string, React.ComponentType<{ className?: string }>> = { droplets: Droplets, brain: Brain, 'user-round': UserRound, thermometer: Thermometer, stethoscope: Stethoscope, hand: Hand, baby: Baby, waves: Waves, activity: Activity, 'alert-triangle': AlertTriangle, 'heart-crack': HeartCrack, wind: Wind, 'shield-alert': ShieldAlert, sun: Sun };
const targetLabels: Record<Exclude<DangerSignCategory, 'selfharm'>, string> = { mother: 'Me', newborn: 'My newborn', child: 'My child' };
type Step = 'home' | 'target' | 'signs' | 'action' | 'guidance';
type Target = 'mother' | 'newborn' | 'child';

export default function EmergencyFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('home');
  const [target, setTarget] = useState<Target | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<SavedEmergencyFacilityDoc[]>([]);
  const [contacts, setContacts] = useState<EmergencyContactDoc[]>([]);
  const [source, setSource] = useState<'local cache' | 'live fetch' | 'baseline only'>('baseline only');
  const [online, setOnline] = useState(navigator.onLine);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); }; }, []);

  useEffect(() => {
    if (step !== 'guidance') return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    void (async () => {
      const cached = await readEmergencyCache(uid);
      if (cached) {
        if (!cancelled) { setFacilities(cached.facilities); setContacts(cached.contacts); setSource('local cache'); }
        return; // Strict cache-first: a populated cache is authoritative for this offline-capable surface.
      }
      if (!navigator.onLine) { if (!cancelled) setSource('baseline only'); return; }
      try {
        const [fs, cs] = await Promise.all([
          getDocs(query(collection(db, 'savedEmergencyFacilities'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'emergencyContacts'), where('userId', '==', uid))),
        ]);
        const facilitiesFromNetwork = fs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedEmergencyFacilityDoc, 'id'>) }));
        const contactsFromNetwork = cs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EmergencyContactDoc, 'id'>) }));
        if (!cancelled) { setFacilities(facilitiesFromNetwork); setContacts(contactsFromNetwork); setSource('live fetch'); }
        await writeEmergencyCache(uid, facilitiesFromNetwork, contactsFromNetwork);
      } catch { if (!cancelled) setSource('baseline only'); }
    })();
    return () => { cancelled = true; };
  }, [step]);

  const signs = useMemo(() => target ? DANGER_SIGNS.filter((s) => s.category === target || (target === 'mother' && s.category === 'selfharm')) : [], [target]);
  const selected = signs.filter((s) => selectedIds.includes(s.id));
  const selfHarm = selected.some((s) => s.category === 'selfharm');
  const call = (number: string) => { window.location.href = `tel:${number.replace(/\s+/g, '')}`; };
  const back = () => setStep(step === 'home' ? 'home' : step === 'target' ? 'home' : step === 'signs' ? 'target' : step === 'action' ? 'signs' : 'action');
  const reset = () => { setStep('home'); setTarget(null); setSelectedIds([]); setAddOpen(false); };
  const toggle = (id: string) => setSelectedIds((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);

  const saveFacility = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !name.trim() || !phone.trim() || !online) return;
    setSaving(true);
    try {
      const facilityId = `mother-${uid}-${Date.now()}`;
      const resolvedMapsUrl = mapsUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim())}`;
      const ref = await addDoc(collection(db, 'savedEmergencyFacilities'), { userId: uid, facilityId, facilityName: name.trim(), phone: phone.trim(), mapsUrl: resolvedMapsUrl });
      const saved: SavedEmergencyFacilityDoc = { id: ref.id, userId: uid, facilityId, facilityName: name.trim(), phone: phone.trim(), mapsUrl: resolvedMapsUrl };
      const next = [...facilities, saved];
      setFacilities(next); await writeEmergencyCache(uid, next, contacts); setSource('local cache');
      setName(''); setPhone(''); setMapsUrl(''); setAddOpen(false);
    } finally { setSaving(false); }
  };

  const title = step === 'home' ? 'Get help quickly' : step === 'target' ? 'Who needs help?' : step === 'signs' ? 'Danger signs' : step === 'action' ? 'Get help now' : 'Contact / Facility Guidance';
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 sm:p-4" role="dialog" aria-modal="true" aria-label="Emergency">
    <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#F7F3FC] sm:h-[min(92vh,760px)] sm:rounded-[28px] sm:shadow-2xl">
      <header className="shrink-0 bg-[#E11D3C] px-5 pb-5 pt-4 text-white"><div className="flex items-center justify-between"><button onClick={() => step === 'home' ? onClose() : setStep(back as never)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><span className="rounded-full bg-black/15 px-3 py-1.5 text-[10px] font-bold tracking-wider">EMERGENCY</span><button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Close"><X className="h-5 w-5" /></button></div><h1 className="mt-4 font-display text-2xl font-black">{title}</h1><div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] font-body"><WifiOff className="h-3.5 w-3.5" />{online ? 'Works offline too' : "You're offline"}</div></header>
      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {step === 'home' && <div className="space-y-4"><div className="rounded-[24px] bg-[#E11D3C] p-6 text-white"><p className="font-body text-[11px] font-bold uppercase tracking-wider text-white/75">Immediate care</p><h2 className="mt-1 font-display text-3xl font-black">If this feels like an emergency, act now.</h2><p className="mt-3 font-body text-sm leading-6 text-white/90">This pathway is deterministic. It does not use Haven or a network connection.</p></div><button onClick={() => setStep('target')} className="w-full rounded-[28px] bg-[#E11D3C] px-5 py-4 font-display font-bold text-white">Continue</button><button onClick={() => call(BASELINE_GUIDANCE.fallbackNumber)} className="flex w-full items-center justify-center gap-2 rounded-[28px] border-2 border-[#E11D3C] bg-white px-5 py-4 font-display font-bold text-[#E11D3C]"><Phone className="h-5 w-5" />Call facility / emergency transport</button></div>}
        {step === 'target' && <div className="space-y-3"><p className="font-body text-sm leading-6 text-[#6D6380]">Choose who needs help. We will only show the relevant danger signs.</p>{(['mother','newborn','child'] as Target[]).map((value) => <button key={value} onClick={() => { setTarget(value); setSelectedIds([]); setStep('signs'); }} className="flex min-h-[84px] w-full items-center gap-4 rounded-[20px] border border-[#E5DFF0] bg-white p-5 text-left"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDE8EC] text-[#E11D3C]">{value === 'mother' ? <UserRound /> : value === 'newborn' ? <Baby /> : <HeartPulse />}</span><span className="flex-1 font-display text-lg font-bold text-[#241451]">{targetLabels[value]}</span><span className="text-2xl text-[#A79CBC]">›</span></button>)}</div>}
        {step === 'signs' && target && <div className="space-y-4"><p className="font-body text-sm leading-6 text-[#6D6380]">Tap every sign you can see or are experiencing.</p>{target === 'child' && <div className="rounded-[18px] bg-[#EEE7F8] px-4 py-3 font-body text-xs leading-5 text-[#6D6380]">For children, fast breathing is age-specific: 50+ breaths/min for 2–11 months, or 40+ for 12–59 months.</div>}<div className="space-y-2">{signs.map((s) => <DangerRow key={s.id} sign={s} selected={selectedIds.includes(s.id)} onToggle={() => toggle(s.id)} />)}</div><button disabled={!selectedIds.length} onClick={() => setStep('action')} className="w-full rounded-[28px] bg-[#E11D3C] px-5 py-4 font-display font-bold text-white disabled:opacity-40">I see this sign — Get action</button><button onClick={reset} className="w-full py-3 font-display font-semibold text-[#E11D3C]">None of these</button></div>}
        {step === 'action' && <div className="space-y-4">{selfHarm ? <div className="rounded-[22px] bg-white p-5"><div className="flex items-start gap-3"><HeartCrack className="h-6 w-6 shrink-0 text-[#E11D3C]"/><div><h2 className="font-display text-2xl font-bold text-[#241451]">You deserve support right now.</h2><p className="mt-2 font-body text-sm leading-6 text-[#6D6380]">You do not have to handle these thoughts alone. If you can, stay with someone you trust and contact support now.</p></div></div><div className="mt-4 rounded-[18px] bg-[#FDE8EC] p-4"><p className="font-body text-xs font-semibold uppercase tracking-wide text-[#A9122B]">Kenya Red Cross psychosocial support</p><p className="mt-1 font-display text-2xl font-bold text-[#241451]">{SELF_HARM_NUMBER}</p></div></div> : <div className="rounded-[22px] bg-white p-5"><div className="flex items-start gap-3"><AlertTriangle className="h-6 w-6 shrink-0 text-[#E11D3C]"/><div><h2 className="font-display text-2xl font-bold text-[#241451]">Please get urgent care now.</h2><p className="mt-2 font-body text-sm leading-6 text-[#6D6380]">One danger sign is enough. Do not wait for Haven or an internet connection.</p></div></div><div className="mt-4 rounded-[18px] bg-[#FDE8EC] p-4"><p className="font-body text-xs text-[#6D6380]">Selected sign{selected.length > 1 ? 's' : ''}</p><p className="mt-1 font-display font-bold text-[#241451]">{selected.map((s) => s.label).join(', ')}</p></div></div>}<button onClick={() => call(selfHarm ? SELF_HARM_NUMBER : (facilities[0]?.phone || BASELINE_GUIDANCE.fallbackNumber))} className="flex w-full items-center justify-center gap-2 rounded-[28px] bg-[#E11D3C] px-5 py-4 font-display text-lg font-black text-white"><Phone className="h-6 w-6" />{selfHarm ? `Call ${SELF_HARM_NUMBER}` : facilities[0] ? 'Call saved facility' : 'Call emergency transport'}</button><button onClick={() => setStep('guidance')} className="w-full rounded-[28px] border-[1.5px] border-[#E11D3C] bg-white px-5 py-4 font-display font-bold text-[#E11D3C]">View facility guidance</button></div>}
        {step === 'guidance' && <div className="space-y-4"><div className="rounded-[20px] bg-[#FDE8EC] p-[18px]"><p className="font-body text-[13px] leading-relaxed text-[#241451]">{BASELINE_GUIDANCE.message}</p><button onClick={() => call(BASELINE_GUIDANCE.fallbackNumber)} className="mt-2 inline-flex items-center gap-2 font-display text-sm font-semibold text-[#E11D3C]"><Phone className="h-4 w-4"/>{BASELINE_GUIDANCE.fallbackNumber} · {BASELINE_GUIDANCE.fallbackLabel}</button></div>{facilities.length > 0 && <><p className="font-body text-[11px] font-semibold uppercase tracking-wide text-[#6D6380]">Your saved facilities</p>{facilities.map((f) => <div key={f.id} className="flex items-center justify-between rounded-[20px] bg-white p-4"><div><p className="font-body text-sm font-semibold text-[#241451]">{f.facilityName}</p><p className="font-body text-xs text-[#6D6380]">{f.phone}</p></div><div className="flex gap-2"><button onClick={() => call(f.phone)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE7F8] text-[#33178A]" aria-label={`Call ${f.facilityName}`}><Phone className="h-4 w-4"/></button><a href={f.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.facilityName)}`} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE7F8] text-[#33178A]" aria-label={`Map ${f.facilityName}`}><MapPin className="h-4 w-4"/></a></div></div>)}</>}{contacts.length > 0 && <><p className="font-body text-[11px] font-semibold uppercase tracking-wide text-[#6D6380]">Your emergency contacts</p>{contacts.map((c) => <button key={c.id} onClick={() => call(c.phone)} className="flex w-full items-center justify-between rounded-[18px] border border-[#E5DFF0] bg-white p-4 text-left"><span><span className="block font-display text-sm font-bold text-[#241451]">{c.name}</span><span className="block font-body text-xs text-[#6D6380]">{c.relationship} · {c.phone}</span></span><Phone className="h-5 w-5 text-[#E11D3C]"/></button>)}</>}{addOpen ? <div className="rounded-[20px] bg-white p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-display font-bold text-[#241451]">Add a facility</h2><button onClick={() => setAddOpen(false)}><X className="h-5 w-5"/></button></div><div className="space-y-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Facility name" className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] px-4 py-3 text-sm"/><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Facility phone" inputMode="tel" className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] px-4 py-3 text-sm"/><input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="Maps link (optional)" className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] px-4 py-3 text-sm"/></div><button disabled={!online || saving || !name.trim() || !phone.trim()} onClick={() => void saveFacility()} className="mt-3 w-full rounded-[28px] bg-[#33178A] px-4 py-3 font-display font-bold text-white disabled:opacity-40">{saving ? 'Saving…' : 'Save facility'}</button>{!online && <p className="mt-2 font-body text-xs text-[#6D6380]">Reconnect to save a new facility. Emergency guidance itself remains fully available offline.</p>}</div> : <button onClick={() => setAddOpen(true)} className="flex w-full items-center justify-center gap-2 py-3 font-display text-sm font-semibold text-[#33178A]"><Plus className="h-4 w-4"/>Add a facility</button>}{import.meta.env.DEV && <div className="rounded-[12px] border border-dashed border-[#A79CBC] bg-white px-3 py-2 font-body text-[10px] text-[#6D6380]">DEV DEBUG · facility/contact data source: {source}</div>}</div>}
      </main><footer className="shrink-0 border-t border-[#E5DFF0] bg-white/95 px-5 py-3 text-center font-body text-[10px] text-[#6D6380]">Emergency guidance is deterministic and remains usable without a network connection.</footer>
    </div>
  </div>;
}

function DangerRow({ sign, selected, onToggle }: { sign: DangerSign; selected: boolean; onToggle: () => void }) { const Icon = icons[sign.icon] || ShieldAlert; return <button type="button" onClick={onToggle} className={`flex min-h-[64px] w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left ${selected ? 'border-[#E11D3C] bg-[#FDE8EC]' : 'border-[#E5DFF0] bg-white'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-[#E11D3C] text-white' : 'bg-[#F7F3FC] text-[#E11D3C]'}`}><Icon className="h-5 w-5"/></span><span className="flex-1 font-display text-sm font-bold text-[#241451]">{sign.label}</span><span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${selected ? 'border-[#E11D3C] bg-[#E11D3C] text-white' : 'border-[#E5DFF0] bg-white'}`}>{selected && <Check className="h-4 w-4"/>}</span></button>; }
