import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, KeyRound, Users, ClipboardList, Building2, UserCheck, Shield,
  Share2, Camera, Clock3, CheckCircle2, XCircle, Search, ChevronRight, LogOut,
  AlertTriangle, Activity, Baby, Syringe, Scale, HeartPulse, Plus,
} from 'lucide-react';
import {
  collection, collectionGroup, doc, getDoc, getDocs, limit, onSnapshot, query,
  updateDoc, where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ClinicianDoc, ClinicianAccessSessionDoc, UserDoc, MotherProfileDoc, ChildDoc, AncEncounterDoc, Provenance } from '../types';
import EmptyState from './EmptyState';
import ProvenanceBadge from './ProvenanceBadge';
import { classifyMUAC, MUAC_BANDS } from '../utils/muac';

type View =
  | 'signin' | 'verification' | 'facility' | 'dashboard' | 'access' | 'scanner'
  | 'confirmation' | 'session' | 'patients' | 'patient_summary' | 'clinical'
  | 'pregnancy' | 'anc' | 'child' | 'newborn' | 'pnc' | 'immunization' | 'growth' | 'muac';

type SessionStatus = 'active' | 'expiring' | 'expired';

const fmtDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (value?: string | null) => value ? new Date(value).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '—';
const sessionStatus = (expiresAt?: string | null): SessionStatus => {
  if (!expiresAt) return 'expired';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  return ms <= 120000 ? 'expiring' : 'active';
};
const remaining = (expiresAt?: string | null) => {
  if (!expiresAt) return 'Expired';
  const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <section className={`bg-white border border-[#E5DFF0] rounded-2xl shadow-sm ${className}`}>{children}</section>
);

export const ClinicianLayout: React.FC = () => {
  const clinicianId = auth.currentUser?.uid || '';
  const [view, setView] = useState<View>('dashboard');
  const [clinician, setClinician] = useState<ClinicianDoc | null>(null);
  const [facilityName, setFacilityName] = useState('');
  const [sessions, setSessions] = useState<ClinicianAccessSessionDoc[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [encountersToday, setEncountersToday] = useState(0);
  const [code, setCode] = useState('');
  const [pendingSession, setPendingSession] = useState<ClinicianAccessSessionDoc | null>(null);
  const [activeSession, setActiveSession] = useState<ClinicianAccessSessionDoc | null>(null);
  const [mother, setMother] = useState<MotherProfileDoc | null>(null);
  const [motherUser, setMotherUser] = useState<UserDoc | null>(null);
  const [children, setChildren] = useState<ChildDoc[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildDoc | null>(null);
  const [anc, setAnc] = useState<AncEncounterDoc[]>([]);
  const [scannerError, setScannerError] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cadre, setCadre] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    if (!clinicianId) return;
    const unsub = onSnapshot(doc(db, 'clinicians', clinicianId), async (snap) => {
      if (!snap.exists()) {
        setClinician(null);
        return;
      }
      const c = { uid: clinicianId, ...(snap.data() as Omit<ClinicianDoc, 'uid'>) };
      setClinician(c);
      if (c.facilityId) {
        const facilitySnap = await getDoc(doc(db, 'facilities', c.facilityId));
        setFacilityName(facilitySnap.exists() ? String(facilitySnap.data().name || '') : String(c.facilityName || ''));
      }
    });
    return () => unsub();
  }, [clinicianId]);

  useEffect(() => {
    if (!clinicianId) return;
    const unsub = onSnapshot(query(collection(db, 'clinicianAccessSessions'), where('clinicianId', '==', clinicianId)), (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClinicianAccessSessionDoc, 'id'>) })));
    });
    return () => unsub();
  }, [clinicianId]);

  useEffect(() => {
    if (!clinicianId) return;
    const today = new Date().toISOString().slice(0, 10);
    const unsub = onSnapshot(query(collectionGroup(db, 'ancEncounters'), where('date', '==', today)), (snap) => setEncountersToday(snap.size), () => setEncountersToday(0));
    const auditUnsub = onSnapshot(query(collection(db, 'auditEvents'), where('actorId', '==', clinicianId), limit(100)), (snap) => setAuditCount(snap.size), () => setAuditCount(0));
    return () => { unsub(); auditUnsub(); };
  }, [clinicianId]);

  useEffect(() => {
    if (!activeSession?.expiresAt) return;
    const timer = window.setInterval(() => setActiveSession((s) => s ? { ...s } : s), 1000);
    return () => window.clearInterval(timer);
  }, [activeSession?.expiresAt]);

  useEffect(() => {
    if (!activeSession?.motherId) return;
    const loadPatient = async () => {
      const [mSnap, uSnap, cSnap] = await Promise.all([
        getDoc(doc(db, 'motherProfiles', activeSession.motherId)),
        getDoc(doc(db, 'users', activeSession.motherId)),
        getDocs(query(collection(db, 'children'), where('motherId', '==', activeSession.motherId))),
      ]);
      setMother(mSnap.exists() ? mSnap.data() as MotherProfileDoc : null);
      setMotherUser(uSnap.exists() ? uSnap.data() as UserDoc : null);
      setChildren(cSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChildDoc, 'id'>) })));
    };
    void loadPatient();
  }, [activeSession?.motherId]);

  useEffect(() => {
    if (!activeSession?.motherId) return;
    const q = query(collectionGroup(db, 'ancEncounters'), where('provenance.enteredBy', '==', activeSession.motherId));
    const unsub = onSnapshot(q, (snap) => setAnc(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AncEncounterDoc, 'id'>) }))));
    return () => unsub();
  }, [activeSession?.motherId]);

  const patientName = mother?.fullName || motherUser?.displayName || 'Patient';
  const activeStatus = sessionStatus(activeSession?.expiresAt);
  const authorized = !!clinician && clinician.verificationStatus === 'approved';

  const nav = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['access', 'Patient Access', KeyRound],
    ['patients', 'Patients', Users],
    ['session', 'Audit', ClipboardList],
  ] as const;

  const openSession = async () => {
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6) return;
    const snap = await getDocs(query(collection(db, 'clinicianAccessSessions'), where('shareCode', '==', normalized), limit(5)));
    const found = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClinicianAccessSessionDoc, 'id'>) })).find((s) => s.status === 'active' && new Date(s.expiresAt).getTime() > Date.now());
    setPendingSession(found || null);
    setView('confirmation');
  };

  const confirmSession = async () => {
    if (!pendingSession || pendingSession.clinicianId !== clinicianId) return;
    setActiveSession(pendingSession);
    setPendingSession(null);
    setView('patient_summary');
  };

  const endSession = async () => {
    if (!activeSession) return;
    await updateDoc(doc(db, 'clinicianAccessSessions', activeSession.id), { status: 'expired' });
    setActiveSession(null);
    setMother(null);
    setChildren([]);
    setAnc([]);
    setView('dashboard');
  };

  const submitVerification = async () => {
    if (!clinicianId || !licenseNumber.trim() || !cadre.trim()) return;
    await updateDoc(doc(db, 'clinicians', clinicianId), { licenseNumber: licenseNumber.trim(), cadre: cadre.trim(), verificationStatus: 'pending' });
    setVerificationMessage('Credentials submitted. Your verification is pending.');
  };

  const sidebar = (
    <aside className="w-[230px] bg-white border-r border-[#E5DFF0] flex flex-col justify-between p-4 shrink-0">
      <div>
        <div className="flex items-center gap-2.5 px-2 pb-6 border-b border-[#E5DFF0]">
          <img src="/logo.svg" alt="MomHaven" className="w-8 h-8 rounded-xl object-contain" />
          <div><h1 className="font-display font-bold text-sm text-[#241451]">MomHaven</h1><span className="font-body text-[11px] text-[#33178A] font-semibold">Clinician Portal</span></div>
        </div>
        <nav className="space-y-1.5 pt-4" aria-label="Clinician workspace navigation">
          {nav.map(([id, label, Icon]) => <button key={id} onClick={() => setView(id as View)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full font-display text-[14px] font-semibold ${view === id ? 'bg-[#EEE7F8] text-[#33178A]' : 'text-[#6D6380] hover:bg-[#F7F3FC]'}`}><Icon className="w-4 h-4"/><span>{label}</span></button>)}
        </nav>
      </div>
      <div className="pt-4 border-t border-[#E5DFF0] px-2"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-[#EEE7F8] flex items-center justify-center text-[#33178A]"><UserCheck className="w-4 h-4"/></div><div className="overflow-hidden"><p className="font-display font-bold text-xs text-[#241451] truncate">{auth.currentUser?.displayName || 'Clinician'}</p><p className="font-body text-[11px] text-[#6D6380] truncate">{facilityName || 'Facility not selected'}</p></div></div></div>
    </aside>
  );

  const patientHeader = activeSession && (
    <div className="sticky top-0 z-20 bg-white border-b border-[#E5DFF0] px-6 py-3 flex items-center justify-between gap-4">
      <div><p className="font-display font-bold text-sm text-[#241451]">{patientName}</p><p className="font-body text-xs text-[#6D6380]">{mother?.ancNumber || 'ANC number not recorded'}</p></div>
      <div className="flex items-center gap-2"><span className={`px-3 py-1.5 rounded-full text-xs font-display font-bold ${activeStatus === 'active' ? 'bg-[#E6F6EE] text-[#1E8F5F]' : activeStatus === 'expiring' ? 'bg-[#FBF0DC] text-[#A15E06]' : 'bg-[#FCE7EA] text-[#C4283C]'}`}><Clock3 className="inline w-3.5 h-3.5 mr-1"/>Session {activeStatus} · {remaining(activeSession.expiresAt)} left</span><button onClick={endSession} className="px-3 py-1.5 rounded-full border border-[#E11D3C] text-[#E11D3C] text-xs font-display font-bold">End session</button></div>
    </div>
  );

  if (!clinicianId) return <div className="min-h-[640px] bg-[#F7F3FC] rounded-2xl flex items-center justify-center p-8"><Card className="max-w-md w-full p-8 text-center"><Shield className="w-10 h-10 mx-auto text-[#33178A]"/><h2 className="font-display font-bold text-2xl text-[#241451] mt-3">Clinical workspace</h2><p className="font-body text-sm text-[#6D6380] mt-2">Sign in with your authorized clinician account to continue.</p></Card></div>;

  if (!clinician) return <div className="min-h-[640px] bg-[#F7F3FC] flex items-center justify-center p-8"><Card className="w-full max-w-xl p-8"><p className="font-body text-xs font-semibold uppercase tracking-wide text-[#6D6380]">MomHaven Clinician</p><h2 className="font-display font-bold text-3xl text-[#241451] mt-2">Sign in</h2><p className="font-body text-sm text-[#6D6380] mt-2">Your account is authenticated, but no clinician profile is attached yet.</p><button onClick={() => setView('verification')} className="mt-6 w-full py-3.5 rounded-full bg-gradient-to-r from-[#33178A] to-[#9167C2] text-white font-display font-bold">Continue to verification</button></Card></div>;

  if (clinician.verificationStatus !== 'approved' && (view === 'verification' || clinician.verificationStatus === 'pending')) {
    return <div className="min-h-[640px] bg-[#F7F3FC] flex">{sidebar}<main className="flex-1 p-8 overflow-y-auto"><Card className="max-w-2xl p-7"><p className="font-body text-xs font-semibold uppercase tracking-wide text-[#6D6380]">Authorized identity</p><h2 className="font-display font-bold text-2xl text-[#241451] mt-2">Account verification</h2><p className="font-body text-sm text-[#6D6380] mt-2">Submit your professional registration details for review before opening mother-approved records.</p>{clinician.verificationStatus === 'pending' ? <div className="mt-6 rounded-2xl bg-[#FBF0DC] p-5 text-[#A15E06]"><Clock3 className="w-5 h-5"/><p className="font-display font-bold mt-2">Pending verification</p><p className="font-body text-sm mt-1">Your credentials are awaiting review.</p></div> : <div className="mt-6 space-y-4"><label className="block font-body text-sm font-semibold text-[#241451]">License / registration number<input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E5DFF0] p-3 outline-none"/></label><label className="block font-body text-sm font-semibold text-[#241451]">Professional cadre<input value={cadre} onChange={e => setCadre(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E5DFF0] p-3 outline-none"/></label><label className="block font-body text-sm font-semibold text-[#241451]">Credential document<input type="file" accept="image/*,.pdf" className="mt-1.5 w-full rounded-xl border border-[#E5DFF0] p-3 bg-white"/></label><button onClick={submitVerification} className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#33178A] to-[#9167C2] text-white font-display font-bold">Submit credentials for verification</button>{verificationMessage && <p className="font-body text-sm text-[#1E8F5F]">{verificationMessage}</p>}</div>}</Card></main></div>;
  }

  const renderDashboard = () => <div className="space-y-6"><div><h2 className="font-display font-bold text-2xl text-[#241451]">Dashboard</h2><p className="font-body text-sm text-[#6D6380]">Clinical workspace activity from your real authorized sessions.</p></div><div className="grid grid-cols-4 gap-4">{[[sessions.filter(s => s.status === 'active' && new Date(s.expiresAt).getTime() > Date.now()).length, 'Active access sessions', KeyRound],[clinician.verificationStatus === 'pending' ? 1 : 0, 'Pending verification', Clock3],[encountersToday, 'Encounters today', Activity],[sessions.filter(s => sessionStatus(s.expiresAt) === 'expiring').length, 'Alerts requiring attention', AlertTriangle]].map(([n,l,I]) => <Card key={String(l)} className="p-4"><div className="w-9 h-9 rounded-xl bg-[#EEE7F8] flex items-center justify-center text-[#33178A]"><I className="w-4 h-4"/></div><p className="font-display font-bold text-2xl text-[#241451] mt-3">{n as number}</p><p className="font-body text-xs text-[#6D6380] mt-0.5">{l as string}</p></Card>)}</div><Card><div className="p-5 border-b border-[#E5DFF0]"><h3 className="font-display font-bold text-base text-[#241451]">Recent activity</h3></div>{sessions.length === 0 ? <EmptyState icon={Activity} title="No activity yet" message="Mother-approved access sessions will appear here after a valid Clinic Share Code is used."/> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-[#6D6380] border-b border-[#E5DFF0]"><th className="p-4">Time</th><th className="p-4">Patient</th><th className="p-4">Activity</th><th className="p-4">Status</th></tr></thead><tbody>{sessions.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,10).map(s=><tr key={s.id} className="border-b border-[#E5DFF0]/70"><td className="p-4 text-sm">{fmtTime(s.createdAt)}</td><td className="p-4 text-sm">Mother-approved session</td><td className="p-4 text-sm">Record access</td><td className="p-4"><span className="px-2.5 py-1 rounded-full bg-[#EEE7F8] text-[#33178A] text-xs font-display font-bold">{sessionStatus(s.expiresAt) === 'expired' ? 'Expired' : 'Active'}</span></td></tr>)}</tbody></table></div>}</Card></div>;

  const renderAccess = () => <div className="max-w-2xl space-y-6"><div><h2 className="font-display font-bold text-2xl text-[#241451]">Enter Clinic Share Code</h2><p className="font-body text-sm text-[#6D6380]">The code is mother-generated, temporary and fully audited. It is not an App Lock PIN.</p></div><Card className="p-8 text-center"><Share2 className="w-9 h-9 mx-auto text-[#33178A]"/><div className="grid grid-cols-6 gap-2 mt-6">{Array.from({length:6}).map((_,i)=><input key={i} inputMode="numeric" maxLength={1} value={code[i] || ''} onChange={e=>{const v=e.target.value.replace(/\D/g,''); const next=code.split(''); next[i]=v; setCode(next.join('').slice(0,6));}} className="w-full aspect-square text-center text-2xl font-display font-bold rounded-xl border border-[#E5DFF0] outline-none focus:border-[#33178A]" aria-label={`Code digit ${i+1}`}/>)}</div><button onClick={openSession} disabled={code.length !== 6} className="mt-6 w-full py-3.5 rounded-full bg-gradient-to-r from-[#33178A] to-[#9167C2] text-white font-display font-bold disabled:opacity-40">Enter access session</button><button onClick={()=>setView('scanner')} className="mt-3 text-sm font-display font-bold text-[#33178A]">Scan QR instead</button></Card></div>;

  const renderConfirmation = () => <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-6"><Card className="max-w-md w-full p-7"><h2 className="font-display font-bold text-xl text-[#241451]">Confirm and open patient</h2>{!pendingSession ? <EmptyState icon={XCircle} title="Code unavailable" message="This Clinic Share Code is invalid, expired, revoked, or not assigned to your clinician account." actionLabel="Try another code" onAction={()=>{setCode('');setView('access')}}/> : <><div className="mt-5 space-y-3 rounded-2xl bg-[#F7F3FC] p-4"><p className="font-body text-sm"><strong>Patient:</strong> Mother-approved record</p><p className="font-body text-sm"><strong>Scope:</strong> Clinical record for this temporary session</p><p className="font-body text-sm"><strong>Expires:</strong> {fmtDate(pendingSession.expiresAt)} {fmtTime(pendingSession.expiresAt)}</p></div><div className="flex gap-3 mt-6"><button onClick={()=>setView('access')} className="flex-1 py-3 rounded-full border-[1.5px] border-[#33178A] text-[#33178A] font-display font-bold">Cancel</button><button onClick={confirmSession} className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#33178A] to-[#9167C2] text-white font-display font-bold">Confirm and open patient</button></div></>}</Card></div>;

  const renderPatients = () => <div className="space-y-5"><div className="flex items-center justify-between"><div><h2 className="font-display font-bold text-2xl text-[#241451]">Patients</h2><p className="font-body text-sm text-[#6D6380]">Patients available through current mother-approved access sessions.</p></div><Search className="w-5 h-5 text-[#6D6380]"/></div>{sessions.filter(s=>s.status==='active' && new Date(s.expiresAt).getTime()>Date.now()).length===0 ? <EmptyState icon={Users} title="No active patient access" message="Enter a current Clinic Share Code to open a mother-approved patient record." actionLabel="Enter Clinic Share Code" onAction={()=>setView('access')}/> : <div className="grid grid-cols-2 gap-4">{sessions.filter(s=>s.status==='active' && new Date(s.expiresAt).getTime()>Date.now()).map(s=><button key={s.id} onClick={()=>{setActiveSession(s);setView('patient_summary')}} className="text-left"><Card className="p-5 hover:border-[#9167C2]"><div className="flex items-center justify-between"><div className="w-10 h-10 rounded-xl bg-[#EEE7F8] flex items-center justify-center text-[#33178A]"><Users className="w-5 h-5"/></div><ChevronRight className="w-4 h-4 text-[#6D6380]"/></div><p className="font-display font-bold mt-4">Mother-approved patient</p><p className="font-body text-xs text-[#6D6380] mt-1">Session expires in {remaining(s.expiresAt)}</p></Card></button>)}</div>}</div>;

  const patientTabs = [['patient_summary','Summary',HeartPulse],['clinical','Clinical record',ClipboardList],['pregnancy','Pregnancy',HeartPulse],['anc','ANC history',ClipboardList],['child','Child summary',Baby],['newborn','Newborn',Baby],['pnc','PNC history',Activity],['immunization','Immunization',Syringe],['growth','Growth',Scale],['muac','MUAC',Activity]] as const;
  const renderPatientSummary = () => <div className="space-y-5"><Card className="p-6"><div className="flex items-start justify-between"><div><p className="font-body text-xs uppercase tracking-wide text-[#6D6380]">Approved patient summary</p><h2 className="font-display font-bold text-2xl text-[#241451] mt-1">{patientName}</h2><p className="font-body text-sm text-[#6D6380] mt-1">{mother?.ancNumber || 'ANC number not recorded'}</p></div><div className="px-3 py-1.5 rounded-full bg-[#E6F6EE] text-[#1E8F5F] text-xs font-display font-bold">Session active</div></div></Card><div className="grid grid-cols-3 gap-4">{[['Pregnancies', mother?.gravida ?? 0, HeartPulse],['Children', children.length, Baby],['Recent encounters', anc.length, ClipboardList]].map(([label,n,I])=><Card key={String(label)} className="p-5"><I className="w-5 h-5 text-[#33178A]"/><p className="font-display font-bold text-2xl mt-3">{n as number}</p><p className="font-body text-xs text-[#6D6380]">{label as string}</p></Card>)}</div><button onClick={()=>setView('clinical')} className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#33178A] to-[#9167C2] text-white font-display font-bold">Open clinical record</button></div>;

  const renderClinical = () => <div className="space-y-5"><Card><div className="p-5 border-b border-[#E5DFF0] flex items-center justify-between"><h2 className="font-display font-bold text-lg">Clinical record</h2><button className="px-3 py-2 rounded-full border-[1.5px] border-[#33178A] text-[#33178A] text-xs font-display font-bold"><Plus className="inline w-3.5 h-3.5 mr-1"/>New encounter</button></div>{anc.length===0 ? <EmptyState icon={ClipboardList} title="No ANC encounters" message="There are no ANC encounters in this approved record yet."/> : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-xs text-[#6D6380] border-b border-[#E5DFF0]"><th className="p-4">Field</th><th className="p-4">Value</th><th className="p-4">Status</th><th className="p-4">Provenance</th><th className="p-4">Action</th></tr></thead><tbody>{anc.slice(-1).map(v=><React.Fragment key={v.id}>{[['Date',v.date],['Visit',v.visitNumber ? `ANC visit ${v.visitNumber}` : 'ANC encounter'],['Weight',v.weight ? `${v.weight} kg` : '—'],['Blood pressure',v.bloodPressure || '—'],['Notes',v.notes || '—']].map(([field,value])=><tr key={String(field)} className="border-b border-[#E5DFF0]/70"><td className="p-4 text-sm font-semibold">{field}</td><td className="p-4 text-sm">{value}</td><td className="p-4"><ProvenanceBadge provenance={v.provenance}/></td><td className="p-4 text-xs text-[#6D6380]">{v.provenance?.enteredBy || '—'} · {fmtDate(v.provenance?.enteredAt)}</td><td className="p-4"><button className="px-3 py-1.5 rounded-full border border-[#33178A] text-[#33178A] text-xs font-display font-bold">Verify</button></td></tr>)}</React.Fragment>)}</tbody></table></div>}</Card></div>;

  const renderPregnancy = () => <Card className="p-6"><h2 className="font-display font-bold text-xl">Pregnancy summary</h2><div className="grid grid-cols-3 gap-4 mt-5"><div><p className="font-body text-xs text-[#6D6380]">EDD</p><p className="font-display font-bold mt-1">{fmtDate(undefined)}</p></div><div><p className="font-body text-xs text-[#6D6380]">IFAS / TD</p><p className="font-display font-bold mt-1">Use recorded ANC fields</p></div><div><p className="font-body text-xs text-[#6D6380]">Risk flags</p><p className="font-display font-bold mt-1">Only recorded flags</p></div></div><button onClick={()=>setView('anc')} className="mt-6 w-full py-3 rounded-full border-[1.5px] border-[#33178A] text-[#33178A] font-display font-bold">Open ANC history</button></Card>;

  const renderAnc = () => <Card><div className="p-5 border-b border-[#E5DFF0]"><h2 className="font-display font-bold text-xl">ANC history</h2></div>{anc.length===0?<EmptyState icon={ClipboardList} title="No ANC encounters" message="No encounters have been recorded for this approved pregnancy."/>:<div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-xs text-[#6D6380] border-b border-[#E5DFF0]"><th className="p-4">Date</th><th className="p-4">Key vitals</th><th className="p-4">Provenance</th><th className="p-4">Action</th></tr></thead><tbody>{anc.map(v=><tr key={v.id} className="border-b border-[#E5DFF0]/70"><td className="p-4 text-sm">{fmtDate(v.date)}</td><td className="p-4 text-sm">{v.weight ? `${v.weight} kg` : '—'} · {v.bloodPressure || '—'}</td><td className="p-4"><ProvenanceBadge provenance={v.provenance} compact/></td><td className="p-4"><button className="px-3 py-1.5 rounded-full border border-[#33178A] text-[#33178A] text-xs font-display font-bold">Verify encounter</button></td></tr>)}</tbody></table></div>}</Card>;

  const renderChild = () => <Card className="p-6"><h2 className="font-display font-bold text-xl">Child summary</h2>{children.length===0?<EmptyState icon={Baby} title="No children recorded" message="This mother-approved record does not contain a child yet."/>:<div className="space-y-3 mt-5">{children.map(c=><button key={c.id} onClick={()=>{setSelectedChild(c);setView('newborn')}} className="w-full text-left rounded-2xl border border-[#E5DFF0] p-4 flex items-center justify-between"><div><p className="font-display font-bold">{c.name || 'Unnamed child'}</p><p className="font-body text-xs text-[#6D6380]">Born {fmtDate(c.dateOfBirth)} · {c.sex}</p></div><ChevronRight className="w-4 h-4"/></button>)}</div>}</Card>;

  const renderNewborn = () => selectedChild ? <Card className="p-6"><h2 className="font-display font-bold text-xl">Newborn record</h2><p className="font-body text-sm text-[#6D6380] mt-1">{selectedChild.name || 'Unnamed child'}</p><p className="font-body text-sm mt-5">Birth weight: {selectedChild.birthWeightGrams ? `${selectedChild.birthWeightGrams} g` : 'Not recorded'}</p><p className="font-body text-sm mt-2">Birth length: {selectedChild.birthLengthCm ? `${selectedChild.birthLengthCm} cm` : 'Not recorded'}</p><button className="mt-6 px-4 py-2.5 rounded-full border border-[#33178A] text-[#33178A] font-display font-bold">Verify record</button></Card> : <EmptyState icon={Baby} title="Select a child" message="Choose a child from the approved patient summary first."/>;
  const renderPnc = () => <Card className="p-6"><h2 className="font-display font-bold text-xl">PNC history</h2><EmptyState icon={Activity} title="No PNC encounters" message="No postnatal encounters are available in this approved record yet."/></Card>;
  const renderImmunization = () => <Card className="p-6"><h2 className="font-display font-bold text-xl">Immunization history</h2><EmptyState icon={Syringe} title="No vaccine records" message="No immunization records are available for the selected child." actionLabel="Add vaccine record" onAction={()=>{}}/></Card>;
  const renderGrowth = () => <Card className="p-6"><h2 className="font-display font-bold text-xl">Growth history</h2><EmptyState icon={Scale} title="No growth measurements" message="No growth measurements are available for the selected child." actionLabel="Add measurement" onAction={()=>{}}/></Card>;
  const renderMuac = () => <Card className="p-6"><h2 className="font-display font-bold text-xl">MUAC assessment</h2><div className="grid grid-cols-4 gap-2 mt-5">{MUAC_BANDS.map(b=><div key={b.key} className="rounded-xl p-3" style={{background:b.bg,color:b.color}}><p className="font-display font-bold text-sm">{b.label}</p><p className="font-body text-xs mt-1">{b.range}</p></div>)}</div><p className="font-body text-sm text-[#6D6380] mt-5">Classification is shared with the mother-facing MUAC utility; 12.9 cm remains At Risk.</p></Card>;

  const renderSession = () => <div className="space-y-5"><h2 className="font-display font-bold text-2xl">Access session status</h2>{activeSession ? <Card className="p-6"><div className="flex items-center gap-3"><Clock3 className="text-[#33178A]"/><div><p className="font-display font-bold">{activeStatus === 'expired' ? 'Session expired' : activeStatus === 'expiring' ? 'Session expiring soon' : 'Session active'}</p><p className="font-body text-sm text-[#6D6380]">{remaining(activeSession.expiresAt)} remaining</p></div></div><button onClick={endSession} className="mt-6 w-full py-3 rounded-full border border-[#E11D3C] text-[#E11D3C] font-display font-bold">End session now</button></Card> : <EmptyState icon={ClipboardList} title="No active access session" message="Open a mother-approved Clinic Share Code to start a temporary audited session." actionLabel="Enter Clinic Share Code" onAction={()=>setView('access')}/>}</div>;

  const renderScanner = () => <div className="max-w-2xl"><Card className="p-6"><h2 className="font-display font-bold text-xl">QR / Code Scanner</h2>{scannerError ? <div className="mt-5 rounded-2xl bg-[#FCE7EA] p-5 text-[#C4283C]"><AlertTriangle className="w-5 h-5"/><p className="font-display font-bold mt-2">Camera permission denied</p><p className="font-body text-sm mt-1">You can still enter the Clinic Share Code manually.</p></div> : <div className="mt-5 aspect-video rounded-2xl border-2 border-dashed border-[#E5DFF0] bg-[#F7F3FC] flex items-center justify-center"><Camera className="w-10 h-10 text-[#6D6380]"/></div>}<button onClick={()=>setView('access')} className="mt-5 w-full py-3 rounded-full border-[1.5px] border-[#33178A] text-[#33178A] font-display font-bold">Enter code manually instead</button></Card></div>;

  let content: React.ReactNode = renderDashboard();
  if (view === 'access') content = renderAccess();
  else if (view === 'scanner') content = renderScanner();
  else if (view === 'confirmation') content = renderConfirmation();
  else if (view === 'session') content = renderSession();
  else if (view === 'patients') content = renderPatients();
  else if (view === 'patient_summary') content = renderPatientSummary();
  else if (view === 'clinical') content = renderClinical();
  else if (view === 'pregnancy') content = renderPregnancy();
  else if (view === 'anc') content = renderAnc();
  else if (view === 'child') content = renderChild();
  else if (view === 'newborn') content = renderNewborn();
  else if (view === 'pnc') content = renderPnc();
  else if (view === 'immunization') content = renderImmunization();
  else if (view === 'growth') content = renderGrowth();
  else if (view === 'muac') content = renderMuac();

  return <div className="w-full flex min-h-[720px] bg-white rounded-[24px] border border-[#E5DFF0] shadow-card-2 overflow-hidden my-2 sm:my-6">{sidebar}<div className="flex-1 bg-[#F7F3FC] min-w-0 overflow-y-auto"><div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#E5DFF0] px-6 py-3 flex items-center justify-between"><div className="font-display font-bold text-sm text-[#241451]">{view === 'dashboard' ? 'Dashboard' : activeSession ? 'Patient workspace' : 'Clinical workspace'}</div><div className="flex items-center gap-3"><span className="text-xs font-body text-[#6D6380]">{clinician.cadre || 'Clinician'}</span><button onClick={()=>auth.signOut()} className="text-[#6D6380]" title="Sign out"><LogOut className="w-4 h-4"/></button></div></div>{patientHeader}<main className="p-6 sm:p-8">{content}</main></div></div>;
};
