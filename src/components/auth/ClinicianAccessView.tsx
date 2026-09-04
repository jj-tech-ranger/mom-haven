import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, Stethoscope, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { auth, signInAsGuest, signInWithEmail } from '../../lib/firebase';
import { registerClinician } from '../../services/clinicianService';
import { getClinicianProfile, KENYA_KMHFL_FACILITIES } from '../../services/clinicianService';
import { KENYA_COUNTIES } from '../../types';

interface Props { onBack: () => void; onSignedIn: () => void; }
type Mode = 'choose' | 'request' | 'status' | 'signin';

export default function ClinicianAccessView({ onBack, onSignedIn }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cadre, setCadre] = useState('Medical Officer (MO)');
  const [facilityCode, setFacilityCode] = useState(KENYA_KMHFL_FACILITIES[0].code);
  const [county, setCounty] = useState('Nairobi');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setError(null); setStatus(null); };
  const selectedFacility = KENYA_KMHFL_FACILITIES.find(f => f.code === facilityCode) || KENYA_KMHFL_FACILITIES[0];

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault(); reset();
    if (!name.trim() || !email.trim() || !licenseNumber.trim()) { setError('Full name, email and council license number are required.'); return; }
    try {
      setLoading(true);
      let user = auth.currentUser;
      if (!user) user = (await signInAsGuest()).user;
      await registerClinician(user.uid, { name: name.trim(), email: email.trim().toLowerCase(), licenseNumber: licenseNumber.trim().toUpperCase(), cadre, facilityId: selectedFacility.code, facilityName: selectedFacility.name });
      setStatus('Your clinician verification request has been submitted and is pending review.');
      setMode('status');
    } catch (err: any) {
      console.error('Clinician verification request error', err);
      setError(err?.message || 'We could not submit your verification request. Please try again.');
    } finally { setLoading(false); }
  };

  const checkStatus = async () => {
    reset();
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) { setError('For security, status can only be checked from the clinician session that submitted the request.'); return; }
      const profile = await getClinicianProfile(user.uid);
      if (!profile) { setStatus('No clinician verification request is linked to this session.'); return; }
      const value = profile.verificationStatus || 'pending';
      setStatus(value === 'approved' ? 'Your clinician account is verified. You can sign in to the clinician portal.' : value === 'rejected' ? 'Your verification request was not approved. Please review your credentials and submit a new request.' : 'Your verification request is still pending review.');
    } catch (err: any) {
      console.error('Clinician status check error', err);
      setError('We could not check your verification status. Please try again.');
    } finally { setLoading(false); }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); reset();
    if (!email.trim() || !password) { setError('Enter your clinician email and password.'); return; }
    try { setLoading(true); await signInWithEmail(email.trim(), password); onSignedIn(); }
    catch (err: any) { console.error('Clinician sign-in error', err); setError(err?.code === 'auth/invalid-credential' ? 'Invalid email or password.' : (err?.message || 'Unable to sign in.')); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-lg rounded-[28px] bg-[var(--surface-1)] border border-[var(--border)] shadow-card-2 overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
          <button type="button" onClick={onBack} className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--haven-deep)]"><Stethoscope className="w-5 h-5" /></div>
          <div><h1 className="font-display font-extrabold text-lg">Clinician Access</h1><p className="text-xs text-[var(--text-secondary)]">Verification is required before patient access.</p></div>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {status && <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{status}</div>}

          {mode === 'choose' && <div className="grid gap-3">
            <button type="button" onClick={() => { reset(); setMode('request'); }} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-left hover:border-[var(--haven-orchid)]"><ShieldCheck className="w-5 h-5 mb-2 text-[var(--haven-orchid)]" /><div className="font-display font-bold text-sm">Submit verification request</div><div className="text-xs text-[var(--text-secondary)] mt-1">Register your professional credentials for review.</div></button>
            <button type="button" onClick={() => { reset(); setMode('status'); void checkStatus(); }} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-left hover:border-[var(--haven-orchid)]"><Clock3 className="w-5 h-5 mb-2 text-[var(--haven-orchid)]" /><div className="font-display font-bold text-sm">Check verification status</div><div className="text-xs text-[var(--text-secondary)] mt-1">See whether your clinician request is pending, approved or rejected.</div></button>
            <button type="button" onClick={() => { reset(); setMode('signin'); }} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-left hover:border-[var(--haven-orchid)]"><Stethoscope className="w-5 h-5 mb-2 text-[var(--haven-orchid)]" /><div className="font-display font-bold text-sm">Sign in if verified</div><div className="text-xs text-[var(--text-secondary)] mt-1">Use your clinician account credentials.</div></button>
          </div>}

          {mode === 'request' && <form onSubmit={submitRequest} className="space-y-3">
            <Field label="Full official name"><input value={name} onChange={e => setName(e.target.value)} required /></Field>
            <div className="grid sm:grid-cols-2 gap-3"><Field label="Professional email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field><Field label="Council license number"><input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required /></Field></div>
            <div className="grid sm:grid-cols-2 gap-3"><Field label="Cadre"><select value={cadre} onChange={e => setCadre(e.target.value)}><option>Medical Officer (MO)</option><option>Consultant Obstetrician/Gynaecologist</option><option>Registered Midwife (KRCHN)</option><option>Clinical Officer (RCO)</option><option>Paediatrician</option><option>Community Health Officer</option></select></Field><Field label="County"><select value={county} onChange={e => setCounty(e.target.value)}>{KENYA_COUNTIES.map(c => <option key={c}>{c}</option>)}</select></Field></div>
            <Field label="Facility"><select value={facilityCode} onChange={e => setFacilityCode(e.target.value)}>{KENYA_KMHFL_FACILITIES.map(f => <option key={f.code} value={f.code}>{f.name} ({f.level})</option>)}</select></Field>
            <div className="flex gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setMode('choose')}>Back</Button><Button type="submit" variant="primary" disabled={loading} className="flex-1">{loading ? 'Submitting…' : 'Submit verification request'}</Button></div>
          </form>}

          {mode === 'status' && <div className="space-y-3"><div className="p-4 rounded-2xl bg-[var(--surface-2)] text-sm">{loading ? 'Checking your verification status…' : status || 'Select check status to refresh.'}</div><Button type="button" variant="primary" onClick={checkStatus} disabled={loading} className="w-full">Check status</Button><Button type="button" variant="secondary" onClick={() => setMode('choose')} className="w-full">Back</Button></div>}

          {mode === 'signin' && <form onSubmit={signIn} className="space-y-3"><Field label="Clinician email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field><Field label="Password"><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></Field><div className="flex gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setMode('choose')}>Back</Button><Button type="submit" variant="primary" disabled={loading} className="flex-1">{loading ? 'Signing in…' : 'Sign in'}</Button></div></form>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-display font-semibold"><span className="block mb-1">{label}</span>{React.cloneElement(children as React.ReactElement<any>, { className: 'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-sm focus:outline-none focus:border-[var(--haven-orchid)]' })}</label>;
}
