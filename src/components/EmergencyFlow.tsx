import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, Baby, Brain, Check, Droplets, Hand, HeartCrack,
  MapPin, Phone, Plus, ShieldAlert, Stethoscope, Sun, Thermometer, UserRound, Waves, Wind,
  WifiOff, X, HeartPulse,
} from 'lucide-react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { DangerSign, DangerSignCategory } from '../lib/safetyPatterns';
import { DANGER_SIGNS } from '../lib/safetyPatterns';
import type { EmergencyContactDoc, SavedEmergencyFacilityDoc } from '../types';
import { readEmergencyCache, writeEmergencyCache } from '../lib/emergencyOffline';

const BASELINE_GUIDANCE = {
  message: 'Go to the nearest health facility now, or call for emergency transport.',
  fallbackNumber: '1199',
  fallbackLabel: 'Kenya Red Cross emergency response',
};

const SELF_HARM_NUMBER = '1199';
const SELF_HARM_LABEL = 'Kenya Red Cross psychosocial support';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  droplets: Droplets, brain: Brain, 'user-round': UserRound, thermometer: Thermometer, stethoscope: Stethoscope,
  hand: Hand, baby: Baby, waves: Waves, activity: Activity, 'alert-triangle': AlertTriangle,
  'heart-crack': HeartCrack, wind: Wind, 'shield-alert': ShieldAlert, sun: Sun, 'heart-pulse': HeartPulse,
};

const targetLabels: Record<Exclude<DangerSignCategory, 'selfharm'>, string> = {
  mother: 'Me', newborn: 'My newborn', child: 'My child',
};

type Step = 'home' | 'target' | 'signs' | 'action' | 'guidance';
type Target = 'mother' | 'newborn' | 'child';

interface EmergencyFlowProps { onClose: () => void; }

export default function EmergencyFlow({ onClose }: EmergencyFlowProps) {
  const [step, setStep] = useState<Step>('home');
  const [target, setTarget] = useState<Target | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<SavedEmergencyFacilityDoc[]>([]);
  const [contacts, setContacts] = useState<EmergencyContactDoc[]>([]);
  const [dataSource, setDataSource] = useState<'local cache' | 'live fetch' | 'baseline only'>('baseline only');
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [savingFacility, setSavingFacility] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [facilityName, setFacilityName] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');
  const [facilityMapsUrl, setFacilityMapsUrl] = useState('');

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    if (step !== 'guidance') return;
    let cancelled = false;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const load = async () => {
      const cached = await readEmergencyCache(uid);
      if (cached && !cancelled) {
        setFacilities(cached.facilities);
        setContacts(cached.contacts);
        setDataSource('local cache');
      }
      if (!navigator.onLine) {
        if (!cached && !cancelled) setDataSource('baseline only');
        return;
      }
      try {
        const [facilitySnap, contactSnap] = await Promise.all([
          getDocs(query(collection(db, 'savedEmergencyFacilities'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'emergencyContacts'), where('userId', '==', uid))),
        ]);
        const freshFacilities = facilitySnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<SavedEmergencyFacilityDoc, 'id'>) }));
        const freshContacts = contactSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<EmergencyContactDoc, 'id'>) }));
        if (!cancelled) {
          setFacilities(freshFacilities);
          setContacts(freshContacts);
          setDataSource('live fetch');
        }
        await writeEmergencyCache(uid, freshFacilities, freshContacts);
      } catch {
        if (!cached && !cancelled) setDataSource('baseline only');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [step]);

  const signs = useMemo(() => target ? DANGER_SIGNS.filter((sign) => sign.category === target || (target === 'mother' && sign.category === 'selfharm')) : [], [target]);
  const selectedSigns = signs.filter((sign) => selectedIds.includes(sign.id));
  const hasSelfHarm = selectedSigns.some((sign) => sign.category === 'selfharm');

  const reset = () => {
    setStep('home'); setTarget(null); setSelectedIds([]); setShowAddFacility(false);
    setFacilityName(''); setFacilityPhone(''); setFacilityMapsUrl('');
  };

  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  const addFacility = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !facilityName.trim() || !facilityPhone.trim()) return;
    setSavingFacility(true);
    try {
      const mapsUrl = facilityMapsUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facilityName.trim())}`;
      const ref = await addDoc(collection(db, 'savedEmergencyFacilities'), {
        userId: uid,
        facilityId: `mother-${uid}-${Date.now()}`,
        facilityName: facilityName.trim(),
        phone: facilityPhone.trim(),
        mapsUrl,
      });
      const saved: SavedEmergencyFacilityDoc = {
        id: ref.id,
        userId: uid,
        facilityId: `mother-${uid}-${Date.now()}`,
        facilityName: facilityName.trim(),
        phone: facilityPhone.trim(),
      };
      const next = [...facilities, saved];
      setFacilities(next);
      await writeEmergencyCache(uid, next, contacts);
      setDataSource('local cache');
      setShowAddFacility(false);
      setFacilityName(''); setFacilityPhone(''); setFacilityMapsUrl('');
    } finally {
      setSavingFacility(false);
    }
  };

  const call = (number: string) => { window.location.href = `tel:${number.replace(/\s+/g, '')}`; };

  const goBack = () => {
    if (step === 'home') onClose();
    else if (step === 'target') setStep('home');
    else if (step === 'signs') setStep('target');
    else if (step === 'action') setStep('signs');
    else setStep('action');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Emergency">
      <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#F7F3FC] sm:h-[min(92vh,760px)] sm:rounded-[28px] sm:shadow-2xl">
        <header className="shrink-0 bg-[#E11D3C] px-5 pb-5 pt-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
            <div className="rounded-full bg-black/15 px-3 py-1.5 text-[10px] font-bold tracking-wider">EMERGENCY</div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <h1 className="mt-4 font-display text-2xl font-black">{step === 'home' ? 'Get help quickly' : step === 'target' ? 'Who needs help?' : step === 'signs' ? 'Danger signs' : step === 'action' ? 'Get help now' : 'Contact / Facility Guidance'}</h1>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] font-body"><WifiOff className="h-3.5 w-3.5" />{online ? 'Works offline too' : "You're offline"}</div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          {step === 'home' && <div className="space-y-4">
            <div className="rounded-[24px] bg-[#E11D3C] p-6 text-white">
              <p className="font-body text-[11px] font-bold uppercase tracking-wider text-white/75">Immediate care</p>
              <h2 className="mt-1 font-display text-3xl font-black">If this feels like an emergency, act now.</h2>
              <p className="mt-3 font-body text-sm leading-6 text-white/90">This pathway is deterministic. It does not use Haven or a network connection.</p>
            </div>
            <button onClick={() => setStep('target')} className="w-full rounded-[28px] bg-[#E11D3C] px-5 py-4 font-display text-base font-bold text-white">Continue</button>
            <button onClick={() => call(BASELINE_GUIDANCE.fallbackNumber)} className="flex w-full items-center justify-center gap-2 rounded-[28px] border-2 border-[#E11D3C] bg-white px-5 py-4 font-display font-bold text-[#E11D3C]"><Phone className="h-5 w-5" />Call facility / emergency transport</button>
          </div>}

          {step === 'target' && <div className="space-y-3">
            <p className="font-body text-sm leading-6 text-[#6D6380]">Choose who needs help. We will only show the relevant danger signs.</p>
            {(['mother', 'newborn', 'child'] as Target[]).map((value) => <button key={value} onClick={() => { setTarget(value); setSelectedIds([]); setStep('signs'); }} className="flex min-h-[84px] w-full items-center gap-4 rounded-[20px] border border-[#E5DFF0] bg-white p-5 text-left shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDE8EC] text-[#E11D3C]">{value === 'mother' ? <UserRound /> : value === 'newborn' ? <Baby /> : <HeartPulse />}</span>
              <span className="flex-1 font-display text-lg font-bold text-[#241451]">{targetLabels[value]}</span><span className="text-2xl text-[#A79CBC]">›</span>
            </button>)}
          </div>}

          {step === 'signs' && target && <div className="space-y-4">
            <p className="font-body text-sm leading-6 text-[#6D6380]">Tap every sign you can see or are experiencing.</p>
            {target === 'child' && <div className="rounded-[18px] bg-[#EEE7F8] px-4 py-3 font-body text-xs leading-5 text-[#6D6380]">For children, fast breathing is age-specific: 50+ breaths/min for 2–11 months, or 40+ for 12–59 months.</div>}
            <div className="space-y-2">
              {signs.map((sign) => <DangerRow key={sign.id} sign={sign} selected={selectedIds.includes(sign.id)} onToggle={() => toggle(sign.id)} />)}
            </div>
            <button disabled={!selectedIds.length} onClick={() => setStep('action')} className="w-full rounded-[28px] bg-[#E11D3C] px-5 py-4 font-display font-bold text-white disabled:opacity-40">I see this sign — Get action</button>
            <button onClick={reset} className="w-full py-3 font-display font-semibold text-[#E11D3C]">None of these</button>
          </div>}

          {step === 'action' && <div className="space-y-4">
            {hasSelfHarm ? <div className="rounded-[22px] border border-[#E11D3C]/20 bg-white p-5">
              <div className="flex items-start gap-3"><HeartCrack className="mt-0.5 h-6 w-6 shrink-0 text-[#E11D3C]" /><div><h2 className="font-display text-2xl font-bold text-[#241451]">You deserve support right now.</h2><p className="mt-2 font-body text-sm leading-6 text-[#6D6380]">You do not have to handle these thoughts alone. If you can, stay with someone you trust and contact support now.</p></div></div>
              <div className="mt-4 rounded-[18px] bg-[#FDE8EC] p-4"><p className="font-body text-xs font-semibold uppercase tracking-wide text-[#A9122B]">Kenya Red Cross psychosocial support</p><p className="mt-1 font-display text-2xl font-bold text-[#241451]">{SELF_HARM_NUMBER}</p></div>
            </div> : <div className="rounded-[22px] border border-[#E11D3C]/20 bg-white p-5">
              <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[#E11D3C]" /><div><h2 className="font-display text-2xl font-bold text-[#241451]">Please get urgent care now.</h2><p className="mt-2 font-body text-sm leading-6 text-[#6D6380]">One danger sign is enough. Do not wait for Haven or an internet connection.</p></div></div>
              <div className="mt-4 rounded-[18px] bg-[#FDE8EC] p-4"><p className="font-body text-xs text-[#6D6380]">Selected sign{selectedSigns.length > 1 ? 's' : ''}</p><p className="mt-1 font-display font-bold text-[#241451]">{selectedSigns.map((s) => s.label).join(', ')}</p></div>
            </div>}
            <button onClick={() => call(hasSelfHarm ? SELF_HARM_NUMBER : (facilities[0]?.phone || BASELINE_GUIDANCE.fallbackNumber))} className="flex w-full items-center justify-center gap-2 rounded-[28px] bg-[#E11D3C] px-5 py-4 font-display text-lg font-black text-white"><Phone className="h-6 w-6" />{hasSelfHarm ? `Call ${SELF_HARM_NUMBER}` : facilities[0] ? 'Call saved facility' : 'Call emergency transport'}</button>
            <button onClick={() => setStep('guidance')} className="w-full rounded-[28px] border-[1.5px] border-[#E11D3C] bg-white px-5 py-4 font-display font-bold text-[#E11D3C]">View facility guidance</button>
          </div>}

          {step === 'guidance' && <div className="space-y-4">
            <div className="rounded-[20px] bg-[#FDE8EC] p-[18px]">
              <p className="font-body text-[13px] leading-relaxed text-[#241451]">{BASELINE_GUIDANCE.message}</p>
              <button onClick={() => call(BASELINE_GUIDANCE.fallbackNumber)} className="mt-2 inline-flex items-center gap-2 font-display text-sm font-semibold text-[#E11D3C]"><Phone className="h-4 w-4" />{BASELINE_GUIDANCE.fallbackNumber} · {BASELINE_GUIDANCE.fallbackLabel}</button>
            </div>

            {facilities.length > 0 && <><p className="px-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-[#6D6380]">Your saved facilities</p>{facilities.map((facility) => <div key={facility.id} className="flex items-center justify-between rounded-[20px] bg-white p-4 shadow-sm">
              <div className="min-w-0"><p className="font-body text-sm font-semibold text-[#241451]">{facility.facilityName}</p><p className="mt-0.5 font-body text-xs text-[#6D6380]">{facility.phone}</p></div>
              <div className="ml-3 flex gap-2"><button onClick={() => call(facility.phone)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE7F8] text-[#33178A]" aria-label={`Call ${facility.facilityName}`}><Phone className="h-4 w-4" /></button><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.facilityName)}`} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEE7F8] text-[#33178A]" aria-label={`Map ${facility.facilityName}`}><MapPin className="h-4 w-4" /></a></div>
            </div>)}</>}

            {contacts.length > 0 && <><p className="px-0.5 pt-1 font-body text-[11px] font-semibold uppercase tracking-wide text-[#6D6380]">Your emergency contacts</p>{contacts.map((contact) => <button key={contact.id} onClick={() => call(contact.phone)} className="flex w-full items-center justify-between rounded-[18px] border border-[#E5DFF0] bg-white p-4 text-left"><span><span className="block font-display font-bold text-sm text-[#241451]">{contact.name}</span><span className="block font-body text-xs text-[#6D6380]">{contact.relationship} · {contact.phone}</span></span><Phone className="h-5 w-5 text-[#E11D3C]" /></button>)}</>}

            {showAddFacility ? <div className="rounded-[20px] border border-[#E5DFF0] bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-display font-bold text-[#241451]">Add a facility</h2><button onClick={() => setShowAddFacility(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
              <div className="space-y-2"><input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="Facility name" className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] px-4 py-3 text-sm outline-none" /><input value={facilityPhone} onChange={(e) => setFacilityPhone(e.target.value)} placeholder="Facility phone" inputMode="tel" className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] px-4 py-3 text-sm outline-none" /><input value={facilityMapsUrl} onChange={(e) => setFacilityMapsUrl(e.target.value)} placeholder="Maps link (optional)" className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] px-4 py-3 text-sm outline-none" /></div>
              <button disabled={!online || savingFacility || !facilityName.trim() || !facilityPhone.trim()} onClick={() => void addFacility()} className="mt-3 w-full rounded-[28px] bg-[#33178A] px-4 py-3 font-display font-bold text-white disabled:opacity-40">{savingFacility ? 'Saving…' : 'Save facility'}</button>
              {!online && <p className="mt-2 font-body text-xs text-[#6D6380]">Reconnect to save a new facility. Your emergency guidance remains fully available offline.</p>}
            </div> : <button onClick={() => setShowAddFacility(true)} className="flex w-full items-center justify-center gap-2 py-3 font-display text-sm font-semibold text-[#33178A]"><Plus className="h-4 w-4" />Add a facility</button>}

            {import.meta.env.DEV && <div className="rounded-[12px] border border-dashed border-[#A79CBC] bg-white px-3 py-2 font-body text-[10px] text-[#6D6380]">DEV DEBUG · facility/contact data source: {dataSource}</div>}
          </div>}
        </main>

        <footer className="shrink-0 border-t border-[#E5DFF0] bg-white/95 px-5 py-3 text-center font-body text-[10px] text-[#6D6380]">
          Emergency guidance is deterministic and remains usable without a network connection.
        </footer>
      </div>
    </div>
  );
}

function DangerRow({ sign, selected, onToggle }: { sign: DangerSign; selected: boolean; onToggle: () => void }) {
  const Icon = iconMap[sign.icon] || ShieldAlert;
  return <button type="button" onClick={onToggle} className={`flex min-h-[64px] w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition ${selected ? 'border-[#E11D3C] bg-[#FDE8EC]' : 'border-[#E5DFF0] bg-white'}`}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-[#E11D3C] text-white' : 'bg-[#F7F3FC] text-[#E11D3C]'}`}><Icon className="h-5 w-5" /></span>
    <span className="flex-1 font-display text-sm font-bold text-[#241451]">{sign.label}</span>
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${selected ? 'border-[#E11D3C] bg-[#E11D3C] text-white' : 'border-[#E5DFF0] bg-white'}`}>{selected && <Check className="h-4 w-4" />}</span>
  </button>;
}
