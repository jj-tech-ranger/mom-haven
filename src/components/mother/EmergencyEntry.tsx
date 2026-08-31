import React, { useEffect, useState } from 'react';
import { ArrowLeft, PhoneCall, ShieldCheck, ChevronRight, User, Baby, Heart, WifiOff, Building2 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface EmergencyEntryProps { isOpen: boolean; onClose: () => void; savedFacilityName?: string; savedFacilityPhone?: string; nextOfKinName?: string; nextOfKinPhone?: string; }
type Target = 'me' | 'newborn' | 'child';

type Contact = { name: string; phone: string; label: string };

const MOTHER_SIGNS = ['Vaginal bleeding', 'Severe headache', 'Blurred vision', 'Convulsions', 'Severe abdominal pain', 'Reduced baby movement', 'Fever'];
const CHILD_SIGNS = ['Difficulty breathing', 'Convulsions', 'Unconscious or unusually sleepy', 'Unable to feed', 'Fever', 'Severe vomiting', 'Blue or very pale skin'];

export const EmergencyEntry: React.FC<EmergencyEntryProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'home' | 'target' | 'signs' | 'action' | 'guidance'>('home');
  const [target, setTarget] = useState<Target | null>(null);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);
  const [facility, setFacility] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('home'); setTarget(null); setSelectedSigns([]);
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLoadingContacts(true);
    Promise.all([
      getDocs(query(collection(db, 'savedEmergencyFacilities'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'emergencyContacts'), where('userId', '==', uid))),
    ]).then(([facilitySnapshot, contactSnapshot]) => {
      const saved = facilitySnapshot.docs[0]?.data();
      setFacility(saved ? { name: saved.facilityName, phone: saved.phone, label: 'Saved emergency facility' } : null);
      setContacts(contactSnapshot.docs.map((d) => { const c = d.data(); return { name: c.name, phone: c.phone, label: c.relationship || 'Emergency contact' }; }).filter((c) => c.name && c.phone));
    }).catch((error) => console.error('Could not load emergency contacts:', error)).finally(() => setLoadingContacts(false));
  }, [isOpen]);

  if (!isOpen) return null;
  const signs = target === 'me' ? MOTHER_SIGNS : CHILD_SIGNS;
  const callNumber = (phone: string) => { window.location.href = `tel:${phone.replace(/\s+/g, '')}`; };

  const toggleSign = (sign: string) => setSelectedSigns((current) => current.includes(sign) ? current.filter((item) => item !== sign) : [...current, sign]);

  const header = (title: string, subtitle?: string) => <div className="bg-[#E11D3C] text-white p-5 pt-6"><div className="flex items-center justify-between mb-4"><button onClick={() => step === 'home' ? onClose() : setStep(step === 'target' ? 'home' : step === 'signs' ? 'target' : step === 'action' ? 'signs' : 'action')} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back"><ArrowLeft className="w-5 h-5" /></button><span className="bg-black/20 px-3 py-1.5 rounded-pill text-[10px] font-display font-bold tracking-wider">EMERGENCY</span></div><h1 className="font-display font-black text-2xl leading-tight">{title}</h1>{subtitle && <p className="font-body text-xs text-white/90 mt-1">{subtitle}</p>}<div className="inline-flex items-center gap-1.5 mt-3 bg-white/15 rounded-pill px-2.5 py-1.5 text-[10px] font-body"><WifiOff className="w-3.5 h-3.5" /> Works offline</div></div>;

  const body = () => {
    if (step === 'home') return <><div className="p-5 space-y-4"><div className="rounded-[20px] bg-[#E11D3C] p-5 text-white"><p className="font-body text-[11px] uppercase tracking-wider text-white/75">Immediate care</p><h2 className="font-display font-black text-3xl mt-1">If you feel this is an emergency, act now.</h2><p className="font-body text-sm text-white/90 mt-2">This pathway does not use HavenChat or require an internet connection.</p></div><button onClick={() => setStep('target')} className="w-full min-h-14 rounded-pill bg-[#E11D3C] text-white font-display font-bold text-base flex items-center justify-center gap-2">Continue <ChevronRight className="w-5 h-5" /></button><button onClick={() => callNumber('1199')} className="w-full min-h-14 rounded-pill bg-white border-[1.5px] border-[#E11D3C] text-[#E11D3C] font-display font-bold flex items-center justify-center gap-2"><PhoneCall className="w-5 h-5" /> Call emergency dispatch</button></div></>;
    if (step === 'target') return <><div className="p-5 space-y-3"><h2 className="font-display font-bold text-2xl text-ink-900">Who needs help?</h2><p className="font-body text-sm text-ink-600">Choose one person so we can show the right danger signs.</p>{([['me','Me',User],['newborn','My newborn',Baby],['child','My child',Heart]] as const).map(([value,label,Icon]) => <button key={value} onClick={() => { setTarget(value); setSelectedSigns([]); setStep('signs'); }} className="w-full min-h-16 p-4 rounded-[20px] bg-white border border-border-hairline shadow-card-1 flex items-center gap-3 text-left"><div className="w-11 h-11 rounded-2xl bg-[#FDE8EC] text-[#E11D3C] flex items-center justify-center"><Icon className="w-5 h-5" /></div><span className="flex-1 font-display font-bold text-base text-ink-900">{label}</span><ChevronRight className="w-5 h-5 text-ink-400" /></button>)}</div></>;
    if (step === 'signs') return <><div className="p-5 space-y-3"><h2 className="font-display font-bold text-2xl text-ink-900">Do you have any of these signs?</h2><div className="space-y-2">{signs.map((sign) => <label key={sign} className="w-full min-h-14 p-3.5 rounded-[18px] bg-white border border-border-hairline flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={selectedSigns.includes(sign)} onChange={() => toggleSign(sign)} className="w-6 h-6 accent-[#E11D3C]" /><span className="font-display font-bold text-sm text-ink-900">{sign}</span></label>)}</div><button onClick={() => setStep('action')} className="w-full min-h-14 rounded-pill bg-[#E11D3C] text-white font-display font-bold disabled:opacity-50" disabled={!selectedSigns.length}>I see this sign — Get action</button><button onClick={() => { setSelectedSigns([]); setStep('home'); }} className="w-full py-3 text-[#E11D3C] font-display font-bold">None of these</button></div></>;
    if (step === 'action') return <><div className="p-5 space-y-4"><div className="rounded-[20px] bg-[#FDE8EC] border border-[#E11D3C]/25 p-5"><p className="font-display font-black text-xl text-[#A9122B]">Please get urgent care now.</p><p className="font-body text-sm text-ink-700 mt-2">Selected: {selectedSigns.join(', ')}. Do not wait for Haven or an internet connection.</p></div><button onClick={() => facility ? callNumber(facility.phone) : callNumber('1199')} className="w-full min-h-16 rounded-pill bg-[#E11D3C] text-white font-display font-black text-lg flex items-center justify-center gap-2"><PhoneCall className="w-6 h-6" /> {facility ? 'Call facility / Go now' : 'Call emergency dispatch'}</button><button onClick={() => setStep('guidance')} className="w-full min-h-14 rounded-pill bg-white border-[1.5px] border-[#E11D3C] text-[#E11D3C] font-display font-bold">View facility guidance</button></div></>;
    return <><div className="p-5 space-y-4"><div className="rounded-[20px] bg-white border border-border-hairline p-5 shadow-card-1"><div className="flex items-center gap-2 text-[#E11D3C]"><Building2 className="w-5 h-5" /><h2 className="font-display font-bold text-lg">Contact / Facility Guidance</h2></div>{loadingContacts ? <p className="font-body text-sm text-ink-600 mt-3">Checking your saved emergency contacts…</p> : facility ? <div className="mt-4 p-4 rounded-2xl bg-lavender-50"><p className="font-display font-bold text-ink-900">{facility.name}</p><p className="font-body text-xs text-ink-600 mt-1">{facility.label}</p><button onClick={() => callNumber(facility.phone)} className="mt-3 w-full min-h-12 rounded-pill bg-[#E11D3C] text-white font-display font-bold">Call facility</button></div> : <p className="font-body text-sm text-ink-600 mt-3">No emergency facility is saved for this account yet. Use emergency dispatch or save a facility in your profile.</p>}{contacts.length > 0 && <div className="mt-4 space-y-2">{contacts.map((contact) => <button key={`${contact.name}-${contact.phone}`} onClick={() => callNumber(contact.phone)} className="w-full p-3 rounded-2xl bg-white border border-border-hairline flex items-center justify-between"><span className="text-left"><b className="font-display text-sm text-ink-900">{contact.name}</b><span className="block font-body text-xs text-ink-600">{contact.label}</span></span><PhoneCall className="w-5 h-5 text-[#E11D3C]" /></button>)}</div>}</div><div className="rounded-[18px] bg-[#FDE8EC] p-4"><p className="font-body text-sm text-[#7D1022]">If symptoms are severe or worsening, go to the nearest appropriate emergency service now. This guidance is deterministic and remains available offline.</p></div><button onClick={onClose} className="w-full py-3 rounded-pill bg-white border-[1.5px] border-[#E11D3C] text-[#E11D3C] font-display font-bold">Close</button></div></>;
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70"><div className="w-full max-w-[420px] h-full sm:h-auto sm:max-h-[90vh] bg-lavender-50 sm:rounded-[28px] overflow-y-auto flex flex-col shadow-2xl">{step === 'home' ? header('Emergency', 'Immediate choices · no AI required') : header(step === 'target' ? 'Who needs help?' : step === 'signs' ? 'Danger signs' : step === 'action' ? 'Get help now' : 'Contact / Facility Guidance')}{body()}<div className="px-5 pb-5 flex items-center justify-center gap-2 text-[10px] text-ink-500"><ShieldCheck className="w-3.5 h-3.5 text-status-normal" /> Deterministic emergency pathway</div></div></div>;
};
