import React, { useEffect, useMemo, useState } from 'react';
import { Share2, Clock, ShieldCheck, X, Copy, CheckCircle2 } from 'lucide-react';
import { addDoc, collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ClinicianAccessSessionDoc } from '../../types';

interface ClinicShareCodeSheetProps { isOpen: boolean; onClose: () => void; }
const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));
const asMillis = (value: unknown) => value instanceof Date ? value.getTime() : typeof value === 'string' || typeof value === 'number' ? new Date(value).getTime() : NaN;

export const ClinicShareCodeSheet: React.FC<ClinicShareCodeSheetProps> = ({ isOpen, onClose }) => {
  const [session, setSession] = useState<ClinicianAccessSessionDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const uid = auth.currentUser?.uid;
    if (!uid) { setError('Please sign in again to create a Clinic Share Code.'); return; }
    let cancelled = false;
    setLoading(true); setError(''); setCopied(false);
    const load = async () => {
      const existing = await getDocs(query(collection(db, 'clinicianAccessSessions'), where('motherId', '==', uid), where('status', '==', 'active')));
      const current = existing.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ClinicianAccessSessionDoc, 'id'>) })).find(s => asMillis(s.expiresAt) > Date.now());
      if (current) { if (!cancelled) setSession(current); setLoading(false); return; }
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
      const code = makeCode();
      const data = { motherId: uid, clinicianId: null, shareCode: code, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString(), status: 'active' as const };
      const ref = await addDoc(collection(db, 'clinicianAccessSessions'), data);
      if (!cancelled) setSession({ id: ref.id, ...data });
      setLoading(false);
    };
    void load().catch(() => { if (!cancelled) setError('Could not create a Clinic Share Code. Please try again.'); setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const secondsLeft = useMemo(() => session ? Math.max(0, Math.ceil((asMillis(session.expiresAt) - now) / 1000)) : 0, [session, now]);
  const expired = !!session && secondsLeft === 0;
  const timerDisplay = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (!session || !expired || session.status !== 'active') return;
    void updateDoc(doc(db, 'clinicianAccessSessions', session.id), { status: 'expired' }).catch(() => undefined);
    setSession(prev => prev ? { ...prev, status: 'expired' } : prev);
  }, [expired, session]);

  const copyCode = async () => {
    if (!session?.shareCode || expired) return;
    try { await navigator.clipboard.writeText(session.shareCode); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setError('Copy is unavailable. Please share the code manually.'); }
  };

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4">
    <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 space-y-5 shadow-2xl border-t sm:border border-border-hairline">
      <div className="w-12 h-1.5 bg-lavender-200 rounded-full mx-auto" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5"><div className="w-10 h-10 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid"><Share2 className="w-5 h-5"/></div><div><h3 className="font-display font-bold text-lg text-ink-900">Clinic Share Code</h3><p className="font-body text-[11px] text-ink-600 leading-relaxed">This is <strong>not</strong> your App Lock PIN. Only share this temporary code with your clinician.</p></div></div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center shrink-0"><X className="w-4 h-4"/></button>
      </div>
      <div className={`border rounded-[20px] p-6 text-center space-y-3 ${expired ? 'bg-lavender-50 border-lavender-200' : 'bg-lavender-50/80 border-lavender-200'}`}>
        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600">Temporary clinician access</p>
        <h2 className="font-display font-bold text-4xl text-haven-deep tracking-[0.25em]">{loading ? '••••••' : session?.shareCode || '—'}</h2>
        {session && <div className={`flex items-center justify-center gap-1.5 font-display font-bold text-sm ${expired ? 'text-ink-600' : 'text-[#C4283C]'}`}><Clock className="w-4 h-4"/><span>{expired ? 'Access code expired' : `Expires in ${timerDisplay}`}</span></div>}
        <div className="flex items-center justify-center gap-2 pt-1"><span className="px-3 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-xs font-display font-bold"><ShieldCheck className="inline w-3.5 h-3.5 mr-1"/>Auditable</span><span className="px-3 py-1 rounded-pill bg-lavender-100 text-haven-deep text-xs font-display font-bold">15 minutes</span></div>
      </div>
      {session && !expired && <button onClick={copyCode} className="w-full py-3.5 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill flex items-center justify-center gap-2">{copied ? <CheckCircle2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}{copied ? 'Code copied' : 'Copy / share code'}</button>}
      {error && <p className="font-body text-sm text-[#C4283C]">{error}</p>}
      <button onClick={onClose} className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button">Done</button>
    </div>
  </div>;
};
