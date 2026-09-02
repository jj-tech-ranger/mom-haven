// src/components/auth/ClinicianRegisterModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import Button from '../Button';
import { KENYA_KMHFL_FACILITIES, registerClinician } from '../../services/clinicianService';
import { KENYA_COUNTIES } from '../../types';

interface ClinicianRegisterModalProps {
  onClose: () => void;
  onSuccess: (clinicianUid: string) => void;
}

export default function ClinicianRegisterModal({ onClose, onSuccess }: ClinicianRegisterModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cadre, setCadre] = useState('Medical Officer (MO)');
  const [facilityCode, setFacilityCode] = useState(KENYA_KMHFL_FACILITIES[0].code);
  const [county, setCounty] = useState('Nairobi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !licenseNumber.trim()) {
      setError('Please fill in your full name, email, and council license number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const selectedFacility = KENYA_KMHFL_FACILITIES.find(f => f.code === facilityCode) || KENYA_KMHFL_FACILITIES[0];
      const clinicianUid = `clinician-${Date.now()}`;

      await registerClinician(clinicianUid, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        cadre,
        facilityId: selectedFacility.code,
        facilityName: selectedFacility.name,
      });

      onSuccess(clinicianUid);
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
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Stethoscope className="w-5 h-5 text-[var(--haven-orchid)]" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
                Healthcare Professional Access
              </h3>
              <p className="font-body text-xs text-[var(--ink-600)]">
                KMPDC / NCK / COC Credential Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[var(--ink-600)] hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-[var(--lavender-50)] border border-[var(--border-hairline)] p-3.5 rounded-[16px] text-xs text-[var(--ink-900)] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[var(--haven-deep)] shrink-0 mt-0.5" />
            <span>
              <strong>Verified Clinicians Only:</strong> Access to patient ANC, immunization, and growth charts is strictly audited and requires verification by MOH Clinical Governance.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                Full Official Name (as on Council License)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Sarah Kimani / Midwife Wanjiru"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                  Professional Cadre
                </label>
                <select
                  value={cadre}
                  onChange={(e) => setCadre(e.target.value)}
                  className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
                >
                  <option value="Medical Officer (MO)">Medical Officer (MO)</option>
                  <option value="Consultant Obstetrician/Gynaecologist">Consultant Obstetrician/Gynaecologist</option>
                  <option value="Registered Midwife (KRCHN)">Registered Midwife (KRCHN)</option>
                  <option value="Clinical Officer (RCO)">Clinical Officer (RCO)</option>
                  <option value="Paediatrician">Paediatrician</option>
                  <option value="Community Health Officer">Community Health Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                  Council License No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. KMPDC A-14920 / NCK 44921"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                  className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)] font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                Official Email (Hospital / MOH / Personal)
              </label>
              <input
                type="email"
                placeholder="dr.kimani@knh.or.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs py-3 px-3.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                  County
                </label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)]"
                >
                  {KENYA_COUNTIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-900)] uppercase tracking-wider mb-1">
                  Facility (KMHFL Database)
                </label>
                <select
                  value={facilityCode}
                  onChange={(e) => setFacilityCode(e.target.value)}
                  className="w-full text-xs py-3 px-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] focus:bg-white focus:outline-none focus:border-[var(--haven-deep)] truncate"
                >
                  {KENYA_KMHFL_FACILITIES.map(f => (
                    <option key={f.code} value={f.code}>{f.name} ({f.level})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-3.5 text-xs font-display font-bold shadow-md"
              >
                {loading ? 'Submitting Credentials...' : 'Submit Verification Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
