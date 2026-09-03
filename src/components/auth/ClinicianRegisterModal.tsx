import React, { useState } from 'react';
import { X, Stethoscope, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { KENYA_KMHFL_FACILITIES, registerClinician } from '../../services/clinicianService';
import { KENYA_COUNTIES } from '../../types';

interface ClinicianRegisterModalProps { onClose: () => void; onSuccess: (clinicianUid: string) => void; }

export default function ClinicianRegisterModal({ onClose, onSuccess }: ClinicianRegisterModalProps) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [licenseNumber, setLicenseNumber] = useState('');
  const [cadre, setCadre] = useState(''); const [facilityCode, setFacilityCode] = useState(''); const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !licenseNumber.trim() || !cadre || !county || !facilityCode) { setError('Please complete all required professional and facility fields.'); return; }
    const selectedFacility = KENYA_KMHFL_FACILITIES.find(f => f.code === facilityCode);
    if (!selectedFacility) { setError('No live facility records are available yet.'); return; }
    try { setLoading(true); setError(null); const clinicianUid = `clinician-${Date.now()}`; await registerClinician(clinicianUid, { name: name.trim(), email: email.trim().toLowerCase(), licenseNumber: licenseNumber.trim().toUpperCase(), cadre, facilityId: selectedFacility.code, facilityName: selectedFacility.name }); onSuccess(clinicianUid); }
    catch (err: any) { console.error('Clinician registration error', err); setError(err?.message || 'Failed to submit clinician verification. Please try again.'); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-body"><div className="bg-white w-full max-w-lg rounded-[28px] shadow-card-3 border border-[var(--border-hairline)] overflow-hidden flex flex-col max-h-[90vh]">
    <div className="p-5 border-b border-[var(--border-hairline)] flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-[var(--lavender-100)] flex items-center justify-center"><Stethoscope className="w-5 h-5 text-[var(--haven-orchid)]" /></div><div><h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">Healthcare Professional Access</h3><p className="font-body text-xs text-[var(--ink-600)]">Credential verification request</p></div></div><button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"><X className="w-5 h-5" /></button></div>
    <div className="p-6 overflow-y-auto space-y-4"><div className="bg-[var(--lavender-50)] border border-[var(--border-hairline)] p-3.5 rounded-[16px] text-xs text-[var(--ink-900)] flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0 mt-0.5" /><span><strong>Verified clinicians only:</strong> access is granted after live credential review.</span></div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        <input type="text" placeholder="Full official name" value={name} onChange={e => setName(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" />
        <input type="email" placeholder="Professional email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]" />
        <input type="text" placeholder="Council license number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] font-mono uppercase" />
        <select value={cadre} onChange={e => setCadre(e.target.value)} required className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]"><option value="">Select cadre</option><option value="Medical Officer (MO)">Medical Officer (MO)</option><option value="Consultant Obstetrician/Gynaecologist">Consultant Obstetrician/Gynaecologist</option><option value="Registered Midwife (KRCHN)">Registered Midwife (KRCHN)</option><option value="Clinical Officer (RCO)">Clinical Officer (RCO)</option><option value="Paediatrician">Paediatrician</option><option value="Community Health Officer">Community Health Officer</option></select>
        <select value={county} onChange={e => setCounty(e.target.value)} required className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]"><option value="">Select county</option>{KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={facilityCode} onChange={e => setFacilityCode(e.target.value)} required disabled={!KENYA_KMHFL_FACILITIES.length} className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)]"><option value="">{KENYA_KMHFL_FACILITIES.length ? 'Select facility' : 'No facilities provisioned yet'}</option>{KENYA_KMHFL_FACILITIES.map(f => <option key={f.code} value={f.code}>{f.name}</option>)}</select>
        <Button type="submit" variant="primary" disabled={loading || !KENYA_KMHFL_FACILITIES.length} className="w-full py-3.5 text-xs font-display font-bold">{loading ? 'Submitting...' : 'Submit Verification Request'}</Button>
      </form>
    </div>
  </div></div>;
}
