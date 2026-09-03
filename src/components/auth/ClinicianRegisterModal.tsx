import React, { useEffect, useMemo, useState } from 'react';
import { X, Stethoscope, ShieldCheck, AlertCircle, CheckCircle2, Clock3, RefreshCw, LockKeyhole } from 'lucide-react';
import Button from '../Button';
import { createAccountWithEmail } from '../../lib/firebase';
import { checkClinicianVerification, claimApprovedClinician, getKenyaFacilities, registerClinician, KMHFLFacility } from '../../services/clinicianService';
import { KENYA_COUNTIES } from '../../types';

interface ClinicianRegisterModalProps { onClose: () => void; onSuccess: (clinicianUid: string) => void; }
type Mode = 'register' | 'submitted' | 'status' | 'setup';

export default function ClinicianRegisterModal({ onClose, onSuccess }: ClinicianRegisterModalProps) {
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cadre, setCadre] = useState('');
  const [facilityCode, setFacilityCode] = useState('');
  const [county, setCounty] = useState('');
  const [facilities, setFacilities] = useState<KMHFLFacility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void getKenyaFacilities().then(result => { if (mounted) setFacilities(result); }).catch(err => { console.error(err); if (mounted) setError('Unable to load the Kenya facility directory. Please try again.'); }).finally(() => { if (mounted) setLoadingFacilities(false); });
    return () => { mounted = false; };
  }, []);

  const countyFacilities = useMemo(() => county ? facilities.filter(f => f.county.toLowerCase() === county.toLowerCase()) : facilities, [county, facilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !licenseNumber.trim() || !cadre || !county || !facilityCode) { setError('Please complete all required professional and facility fields.'); return; }
    const selectedFacility = facilities.find(f => f.code === facilityCode);
    if (!selectedFacility) { setError('Please select a facility from the current Kenya facility directory.'); return; }
    try { setLoading(true); setError(null); await registerClinician({ name: name.trim(), email: email.trim().toLowerCase(), licenseNumber: licenseNumber.trim().toUpperCase(), cadre: cadre.trim(), facilityId: selectedFacility.id || selectedFacility.code, facilityName: selectedFacility.name }); setMode('submitted'); }
    catch (err: any) { console.error('Clinician registration error', err); setError(err?.message || 'Failed to submit clinician verification. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter the email used on your clinician application.'); return; }
    try { setLoading(true); setError(null); const result = await checkClinicianVerification(email); setStatus(result); if (result.status === 'approved') setMode('setup'); else setMode('status'); }
    catch (err: any) { setError(err?.message || 'Unable to check verification status.'); }
    finally { setLoading(false); }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    try {
      setLoading(true); setError(null);
      const credential = await createAccountWithEmail(email.trim().toLowerCase(), password, status?.name || name || undefined);
      const result = await claimApprovedClinician();
      onSuccess(result.uid);
    } catch (err: any) {
      console.error('Clinician account creation error', err);
      if (err?.code === 'auth/email-already-in-use') setError('An account already exists for this email. Sign in with that account, then check your clinician status again.');
      else setError(err?.message || 'Unable to create or activate the clinician account.');
    } finally { setLoading(false); }
  };

  const renderHeader = () => <div className="p-5 border-b border-[var(--border-hairline)] flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-[var(--lavender-100)] flex items-center justify-center"><Stethoscope className="w-5 h-5 text-[var(--haven-orchid)]" /></div><div><h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">Healthcare Professional Access</h3><p className="font-body text-xs text-[var(--ink-600)]">KMPDC / NCK / COC Credential Verification</p></div></div><button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button></div>;

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-body"><div className="bg-white w-full max-w-lg rounded-[28px] shadow-card-3 border border-[var(--border-hairline)] overflow-hidden flex flex-col max-h-[90vh]">{renderHeader()}<div className="p-6 overflow-y-auto space-y-4">
    {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}

    {mode === 'register' && <>
      <div className="bg-[var(--lavender-50)] border border-[var(--border-hairline)] p-3.5 rounded-[16px] text-xs text-[var(--ink-900)] flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0 mt-0.5" /><span><strong>Verified Clinicians Only:</strong> Submit your professional details for administrator review. No clinician account is created until the request is approved.</span></div>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        <input type="text" placeholder="Full official name" value={name} onChange={e => setName(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" />
        <input type="email" placeholder="Professional email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" />
        <input type="text" placeholder="Council license number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] font-mono uppercase" />
        <select value={cadre} onChange={e => setCadre(e.target.value)} required className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]"><option value="">Select professional cadre</option><option value="Medical Officer (MO)">Medical Officer (MO)</option><option value="Consultant Obstetrician/Gynaecologist">Consultant Obstetrician/Gynaecologist</option><option value="Registered Midwife (KRCHN)">Registered Midwife (KRCHN)</option><option value="Clinical Officer (RCO)">Clinical Officer (RCO)</option><option value="Paediatrician">Paediatrician</option><option value="Community Health Officer">Community Health Officer</option></select>
        <select value={county} onChange={e => { setCounty(e.target.value); setFacilityCode(''); }} required className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]"><option value="">Select county</option>{KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={facilityCode} onChange={e => setFacilityCode(e.target.value)} required disabled={loadingFacilities || countyFacilities.length === 0} className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] disabled:opacity-60"><option value="">{loadingFacilities ? 'Loading Kenya facilities...' : countyFacilities.length ? 'Select facility' : county ? 'No facilities listed for this county' : 'Select a county first'}</option>{countyFacilities.map(f => <option key={f.id || f.code} value={f.code}>{f.name} — {f.subcounty || f.county}{f.level ? ` (${f.level})` : ''}</option>)}</select>
        <Button type="submit" variant="primary" disabled={loading || loadingFacilities || !countyFacilities.length} className="w-full py-3.5 text-xs font-display font-bold">{loading ? 'Submitting...' : 'Submit Verification Request'}</Button>
      </form>
      <button type="button" onClick={() => { setError(null); setMode('status'); }} className="w-full text-xs font-display font-bold text-[var(--haven-deep)] hover:underline cursor-pointer">Already applied? Check your verification status</button>
    </>}

    {mode === 'submitted' && <div className="text-center space-y-4 py-4"><div className="w-14 h-14 rounded-full bg-amber-50 mx-auto flex items-center justify-center"><Clock3 className="w-7 h-7 text-amber-600" /></div><h4 className="font-display font-extrabold text-xl text-[var(--ink-900)]">Application submitted</h4><p className="text-sm text-[var(--ink-600)] leading-relaxed">Your clinician details have been sent to the MomHaven administrator. Your account is <strong>pending review</strong>. You can return here later to check the verification status using your email.</p><div className="flex flex-col gap-2"><Button type="button" variant="primary" onClick={() => setMode('status')} className="w-full py-3">Check verification status</Button><button type="button" onClick={onClose} className="text-xs font-semibold text-[var(--ink-600)] hover:underline">Close</button></div></div>}

    {mode === 'status' && <div className="space-y-4"><div className="text-center"><RefreshCw className="w-7 h-7 text-[var(--haven-orchid)] mx-auto mb-2" /><h4 className="font-display font-extrabold text-xl">Check verification status</h4><p className="text-xs text-[var(--ink-600)] mt-1">Enter the email used on your clinician application.</p></div><form onSubmit={handleStatusCheck} className="space-y-3"><input type="email" placeholder="Professional email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" /><Button type="submit" variant="primary" disabled={loading} className="w-full py-3">{loading ? 'Checking...' : 'Check status'}</Button></form>{status?.status === 'pending' && <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2"><Clock3 className="w-4 h-4 shrink-0" /><span>Your application is <strong>pending review</strong>. An administrator still needs to approve or reject your credentials.</span></div>}{status?.status === 'rejected' && <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs"><strong>Verification not approved.</strong>{status.rejectionReason ? ` ${status.rejectionReason}` : ' Please contact the MomHaven administrator if you need clarification.'}</div>}{status?.status === 'not_found' && <div className="p-4 rounded-2xl bg-[var(--lavender-50)] border border-[var(--border-hairline)] text-[var(--ink-700)] text-xs">No clinician application was found for that email.</div>}<button type="button" onClick={() => { setStatus(null); setError(null); setMode('register'); }} className="text-xs text-[var(--haven-deep)] hover:underline">Back to clinician application</button></div>}

    {mode === 'setup' && <div className="space-y-4"><div className="text-center"><div className="w-14 h-14 rounded-full bg-emerald-50 mx-auto flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div><h4 className="font-display font-extrabold text-xl mt-3">Your application is approved</h4><p className="text-xs text-[var(--ink-600)] mt-1">{status?.name || 'Clinician'}, you can now create your MomHaven clinician password.</p></div><div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs"><strong>{status?.facilityName || 'Approved facility'}</strong> · {status?.cadre || 'Clinician'}</div><form onSubmit={handleCreatePassword} className="space-y-3"><div className="relative"><LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-[var(--ink-500)]" /><input type="password" placeholder="Create password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full text-xs py-3 pl-9 pr-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" /></div><input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" /><Button type="submit" variant="primary" disabled={loading} className="w-full py-3">{loading ? 'Creating account...' : 'Create clinician account'}</Button></form><p className="text-[11px] text-[var(--ink-600)] leading-relaxed">Your password is created only after administrator approval. The new Firebase account is then linked to the approved clinician record.</p></div>}
  </div></div></div>;
}
