import React, { useEffect, useState } from 'react';
import { ChevronLeft, Share2, Key, Shield, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ClinicianAccessSessionDoc } from '../../types';

interface ClinicianSharingProps { onBack: () => void; onGenerateClinicShareCode: () => void; }
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const ClinicianSharing: React.FC<ClinicianSharingProps> = ({ onBack, onGenerateClinicShareCode }) => {
  const [sessions, setSessions] = useState<ClinicianAccessSessionDoc[] | null>(null);
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(query(collection(db, 'clinicianAccessSessions'), where('motherId', '==', uid)), snapshot => {
      setSessions(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ClinicianAccessSessionDoc, 'id'>) })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, () => setSessions([]));
  }, []);

  const active = (sessions || []).filter(s => s.status === 'active' && new Date(s.expiresAt).getTime() > Date.now());
  const history = (sessions || []).filter(s => !active.some(a => a.id === s.id));

  return <div className="space-y-6 pb-12 animate-fade-in">
    <div className="flex items-center justify-between"><button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center"><ChevronLeft className="w-5 h-5"/></button><h1 className="font-display font-bold text-xl text-ink-900">Clinician Sharing</h1><div className="w-10"/></div>
    <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-3"><div className="flex items-center gap-2"><Shield className="w-5 h-5"/><span className="font-display font-bold text-xs uppercase tracking-wider text-white/80">Temporary clinical access</span></div><h2 className="font-display font-bold text-lg">You control every clinician session</h2><p className="font-body text-xs text-white/85 leading-relaxed">Generate a 6-digit Clinic Share Code when you are with your clinician. It grants temporary access for 15 minutes and is separate from your App Lock PIN.</p></div>
    <button onClick={onGenerateClinicShareCode} className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button flex items-center justify-center gap-2"><Key className="w-5 h-5"/>Generate Clinic Share Code</button>
    <section className="space-y-3"><span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">ACTIVE CLINICIAN SESSIONS</span>{sessions===null?<div className="h-24 rounded-[20px] bg-lavender-100 animate-pulse"/>:active.length?active.map(s=><div key={s.id} className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-display font-bold text-sm text-ink-900">Clinic Share Session</h4><p className="font-body text-xs text-ink-600">Created {dateLabel(s.createdAt)}</p></div><span className="px-2.5 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-[10px] font-display font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Active</span></div><p className="mt-3 font-body text-xs text-ink-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>Expires {dateLabel(s.expiresAt)}</p></div>):<div className="bg-white rounded-[20px] border border-border-hairline p-5 text-sm text-ink-600">No active clinician access sessions.</div>}</section>
    <section className="space-y-3"><span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">PAST ACCESS SESSIONS</span>{sessions===null?<div className="h-20 rounded-[20px] bg-lavender-100 animate-pulse"/>:history.length?history.map(s=><div key={s.id} className="bg-white rounded-[20px] border border-border-hairline p-4 flex items-center justify-between gap-3"><div><h4 className="font-display font-bold text-sm text-ink-900">Clinic Share Session</h4><p className="font-body text-xs text-ink-600">Created {dateLabel(s.createdAt)}</p><p className="font-body text-[11px] text-ink-600">{s.status === 'revoked' ? 'Access revoked' : `Expired ${dateLabel(s.expiresAt)}`}</p></div><span className="px-2.5 py-1 rounded-pill bg-lavender-100 text-ink-600 text-[10px] font-display font-bold capitalize">{s.status}</span></div>):<div className="bg-white rounded-[20px] border border-border-hairline p-5 text-sm text-ink-600">No previous clinician sessions yet.</div>}</section>
  </div>;
};
