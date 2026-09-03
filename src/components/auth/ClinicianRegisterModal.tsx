import React, { useEffect, useMemo, useState } from 'react';
import { X, Stethoscope, ShieldCheck, AlertCircle, CheckCircle2, Chrome, Loader2 } from 'lucide-react';
import Button from '../Button';
import { auth, signInWithGoogle } from '../../lib/firebase';
import { getKenyaFacilities, registerClinician, KMHFLFacility } from '../../services/clinicianService';
import { KENYA_COUNTIES } from '../../types';

interface ClinicianRegisterModalProps { onClose: () => void; onSuccess: (clinicianUid: string) => void; }

export default function ClinicianRegisterModal({ onClose, onSuccess }: ClinicianRegisterModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cadre, setCadre] = useState('');
  const [facilityCode, setFacilityCode] = useState('');
  const [county, setCounty] = useState('');
  const [facilities, setFacilities] = useState<KMHFLFacility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(Boolean(auth.currentUser && !auth.currentUser.isAnonymous));

  useEffect(() => {
    let mounted = true;
    const loadFacilities = async () => {
      try {
        const result = await getKenyaFacilities();
        if (mounted) setFacilities(result);
      } catch (err) {
        console.error('Facility directory load error', err);
        if (mounted) setError('Unable to load the Kenya facility directory. Please try again.');
      } finally {
        if (mounted) setLoadingFacilities(false);
      }
    };
    void loadFacilities();

    const user = auth.currentUser;
    if (user && !user.isAnonymous) {
      setName(user.displayName || user.email?.split('@')[0] || '');
      setEmail(user.email || '');
    }
    return () => { mounted = false; };
  }, []);

  const countyFacilities = useMemo(
    () => county ? facilities.filter(f => f.county.toLowerCase() === county.toLowerCase()) : facilities,
    [county, facilities],
  );

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      if (!result.user) throw new Error('Google sign-in did not return a user account.');
      setAuthenticated(true);
      setName(result.user.displayName || result.user.email?.split('@')[0] || '');
      setEmail(result.user.email || '');
    } catch (err: any) {
      console.error('Clinician Google sign-in error', err);
      setError(err?.message || 'Google sign-in was interrupted.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      setError('Continue with Google first so MomHaven can create the clinician account with your real Firebase identity.');
      return;
    }
    if (!name.trim() || !email.trim() || !licenseNumber.trim() || !cadre || !county || !facilityCode) {
      setError('Please complete all required professional and facility fields.');
      return;
    }
    const selectedFacility = facilities.find(f => f.code === facilityCode);
    if (!selectedFacility) {
      setError('Please select a facility from the current Kenya facility directory.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await registerClinician({
        licenseNumber: licenseNumber.trim().toUpperCase(),
        cadre: cadre.trim(),
        facilityId: selectedFacility.code,
        facilityName: selectedFacility.name,
      });
      onSuccess(result.uid);
    } catch (err: any) {
      console.error('Clinician registration error', err);
      setError(err?.message || 'Failed to submit clinician verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-body">
      <div className="bg-white w-full max-w-lg rounded-[28px] shadow-card-3 border border-[var(--border-hairline)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--lavender-100)] flex items-center justify-center"><Stethoscope className="w-5 h-5 text-[var(--haven-orchid)]" /></div>
            <div><h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">Healthcare Professional Access</h3><p className="font-body text-xs text-[var(--ink-600)]">Credential verification request</p></div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-[var(--lavender-50)] border border-[var(--border-hairline)] p-3.5 rounded-[16px] text-xs text-[var(--ink-900)] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0 mt-0.5" />
            <span><strong>Verified clinicians only:</strong> your Google account provides the real Firebase identity used for credential review. Access remains pending until an administrator approves you.</span>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}

          {!authenticated && (
            <div className="space-y-2">
              <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full py-3.5 text-xs font-display font-bold flex items-center justify-center gap-2">
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </Button>
              <p className="text-[11px] text-[var(--ink-600)] text-center">Use the Google account that should belong to this clinician profile.</p>
            </div>
          )}

          {authenticated && auth.currentUser && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[14px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Signed in as <strong>{auth.currentUser.email}</strong></span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <input type="text" placeholder="Full official name" value={name} onChange={e => setName(e.target.value)} required disabled={!authenticated} className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] disabled:opacity-60" />
            <input type="email" placeholder="Professional email" value={email} onChange={e => setEmail(e.target.value)} required disabled={!authenticated} className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] disabled:opacity-60" />
            <input type="text" placeholder="Council license number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required disabled={!authenticated} className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] font-mono uppercase disabled:opacity-60" />
            <select value={cadre} onChange={e => setCadre(e.target.value)} required disabled={!authenticated} className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] disabled:opacity-60">
              <option value="">Select professional cadre</option>
              <option value="Doctor">Doctor</option>
              <option value="Medical Officer (MO)">Medical Officer (MO)</option>
              <option value="Consultant Obstetrician/Gynaecologist">Consultant Obstetrician/Gynaecologist</option>
              <option value="Registered Midwife (KRCHN)">Registered Midwife (KRCHN)</option>
              <option value="Clinical Officer (RCO)">Clinical Officer (RCO)</option>
              <option value="Paediatrician">Paediatrician</option>
              <option value="Community Health Officer">Community Health Officer</option>
            </select>
            <select value={county} onChange={e => { setCounty(e.target.value); setFacilityCode(''); }} required disabled={!authenticated} className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] disabled:opacity-60">
              <option value="">Select county</option>{KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={facilityCode} onChange={e => setFacilityCode(e.target.value)} required disabled={!authenticated || loadingFacilities || countyFacilities.length === 0} className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] disabled:opacity-60">
              <option value="">{loadingFacilities ? 'Loading Kenya facilities...' : countyFacilities.length ? 'Select facility' : county ? 'No facilities listed for this county' : 'Select a county first'}</option>
              {countyFacilities.map(f => <option key={f.code} value={f.code}>{f.name} — {f.subcounty || f.county}</option>)}
            </select>
            <Button type="submit" variant="primary" disabled={!authenticated || loading || loadingFacilities || !countyFacilities.length} className="w-full py-3.5 text-xs font-display font-bold">
              {loading ? 'Submitting...' : 'Submit Verification Request'}
            </Button>
          </form>

          <p className="text-[11px] text-[var(--ink-600)] leading-relaxed">A license number is required for credential review. Do not enter a made-up number; if you do not have it yet, you can sign in with Google first and return once you have the required professional credential.</p>
        </div>
      </div>
    </div>
  );
}
