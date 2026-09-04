import React, { useState } from 'react';
import { ArrowLeft, HeartHandshake, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { redeemPartnerConnectionCode } from '../../services/sharingService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, signInAsGuest } from '../../lib/firebase';

interface PartnerConnectFlowProps {
  onBack: () => void;
  onConnected: (partnerId: string, partnerName: string, motherInfo: { motherId: string; motherName: string }) => void;
}

export default function PartnerConnectFlow({ onBack, onConnected }: PartnerConnectFlowProps) {
  const [step, setStep] = useState<'details' | 'pair'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Partner / Husband');
  const [connectionCode, setConnectionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) return setError('Please enter your full name.');
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError('Please enter a valid email address.');
    setEmail(normalizedEmail);
    setError(null);
    setStep('pair');
  };

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToRedeem = connectionCode.trim().toUpperCase();
    if (!/^HAVEN-[A-Z0-9]{3}$/.test(codeToRedeem)) {
      setError('Enter the 6-character code shown by the mother, for example HAVEN-942.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      // Partner access uses an anonymous Firebase identity so no password is required.
      // The partner email is retained as the contact identity for the relationship.
      const authRes = await signInAsGuest();
      const partnerUid = authRes.user.uid;

      await setDoc(doc(db, 'users', partnerUid), {
        uid: partnerUid,
        displayName: name.trim(),
        email,
        relationship,
        role: 'PARTNER',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const res = await redeemPartnerConnectionCode(partnerUid, name.trim(), codeToRedeem);
      if (!res.success || !res.motherId) {
        setError(res.message || 'We could not verify that connection code. Ask the mother to generate a new code.');
        return;
      }

      const motherInfo = { motherId: res.motherId, motherName: res.motherName || 'Mother' };
      localStorage.setItem('momhaven_partner_link', JSON.stringify(motherInfo));
      setSuccessMsg(`Successfully connected to ${motherInfo.motherName}.`);
      window.setTimeout(() => onConnected(partnerUid, name.trim(), motherInfo), 500);
    } catch (err: any) {
      console.error('Partner connection error', err);
      const code = err?.code;
      if (code === 'permission-denied') setError('The connection code could not be authorized. Please ask the mother to generate a new code.');
      else if (code === 'auth/operation-not-allowed') setError('Partner access is temporarily unavailable. Please try again later.');
      else setError('We could not connect you right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-4 sm:p-6 font-body">
      <div className="w-full max-w-md bg-[var(--surface-1)] rounded-[28px] border border-[var(--border)] p-6 sm:p-7 shadow-card-1 space-y-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={step === 'pair' ? () => { setError(null); setStep('details'); } : onBack} className="w-9 h-9 rounded-full bg-[var(--surface-2)] flex items-center justify-center cursor-pointer" aria-label="Go back"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-1.5"><img src="/assets/logo.png" alt="MomHaven" className="w-6 h-6 object-contain" /><span className="font-display font-extrabold text-xs text-[var(--haven-deep)]">MomHaven Partner</span></div>
          <div className="w-9" />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] mx-auto flex items-center justify-center"><HeartHandshake className="w-7 h-7 text-[var(--haven-orchid)]" /></div>

        {step === 'details' ? <>
          <div className="text-center"><h2 className="font-display font-extrabold text-[22px] text-[var(--text-primary)]">Support a Mother's Journey</h2><p className="text-xs text-[var(--text-secondary)] mt-1">Enter your email so your partner identity can be recovered and associated with the connection.</p></div>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
          <form onSubmit={handleDetailsSubmit} className="space-y-3.5">
            <div><label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Your Full Name</label><input type="text" placeholder="e.g. Michael Ochieng" value={name} onChange={e => setName(e.target.value)} required className="w-full text-sm py-3 px-3.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Email Address</label><input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full text-sm py-3 px-3.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Relationship to Mother</label><select value={relationship} onChange={e => setRelationship(e.target.value)} className="w-full text-sm py-3 px-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] focus:bg-[var(--surface-1)] focus:outline-none focus:border-[var(--haven-deep)]"><option>Partner / Husband</option><option>Sister / Family Member</option><option>Mother / Mother-in-law</option><option>Birth Companion / Doula</option><option>Friend / Supporter</option></select></div>
            <Button type="submit" variant="primary" className="w-full py-3.5 text-xs font-display font-bold">Continue to Connection Code</Button>
          </form>
        </> : <>
          <div className="text-center"><h2 className="font-display font-extrabold text-[22px] text-[var(--text-primary)]">Enter Connection Code</h2><p className="text-xs text-[var(--text-secondary)] mt-1">Ask the mother to open Profile → Connect Partner and show you her code.</p></div>
          <div className="p-3 bg-[var(--surface-2)] rounded-[16px] border border-[var(--border)] text-left text-[11px] flex gap-2.5"><ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0" /><span><strong>Privacy:</strong> partners receive only the logistics and support information the mother chooses to share. Clinical records remain private.</span></div>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
          {successMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[14px] flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span></div>}
          <form onSubmit={handlePairSubmit} className="space-y-4"><input type="text" aria-label="Partner connection code" placeholder="HAVEN-942" value={connectionCode} onChange={e => setConnectionCode(e.target.value.toUpperCase())} maxLength={9} autoFocus className="w-full text-center font-mono font-extrabold text-[26px] tracking-widest py-3.5 px-4 rounded-[16px] border-2 border-[var(--border)] bg-[var(--surface-2)] focus:bg-[var(--surface-1)] focus:border-[var(--haven-deep)] focus:outline-none" /><p className="text-[11px] text-[var(--text-secondary)] text-center">Format: HAVEN-XXX</p><Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 text-xs font-display font-bold">{loading ? 'Verifying & Connecting…' : 'Connect to Mother'}</Button></form>
        </>}
      </div>
    </div>
  );
}
