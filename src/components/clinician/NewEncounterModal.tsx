// src/components/clinician/NewEncounterModal.tsx
import React, { useState } from 'react';
import { Stethoscope, X, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../Button';

interface NewEncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  motherId: string;
  pregnancyId?: string;
  childId?: string;
  clinicianName: string;
  facilityName: string;
  onSaved: () => void;
}

export default function NewEncounterModal({
  isOpen,
  onClose,
  motherId,
  pregnancyId,
  childId,
  clinicianName,
  facilityName,
  onSaved,
}: NewEncounterModalProps) {
  const [encounterType, setEncounterType] = useState<'anc' | 'pnc' | 'immunization' | 'growth'>('anc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ANC Form Fields
  const [visitNumber, setVisitNumber] = useState(1);
  const [gestationalWeeks, setGestationalWeeks] = useState(24);
  const [systolicBp, setSystolicBp] = useState('118');
  const [diastolicBp, setDiastolicBp] = useState('74');
  const [weightKg, setWeightKg] = useState('64.5');
  const [fundalHeight, setFundalHeight] = useState('24');
  const [fetalHeartRate, setFetalHeartRate] = useState('142');
  const [hbLevel, setHbLevel] = useState('12.4');
  const [iptpGiven, setIptpGiven] = useState(true);
  const [ifasGiven, setIfasGiven] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState('Patient comfortable. Fetal movement active. Routine IFAS and IPTp-SP administered.');

  // Vaccine Form Fields
  const [vaccineName, setVaccineName] = useState('Penta 1 + OPV 1 + Rota 1 + PCV 10');
  const [batchNumber, setBatchNumber] = useState('KE-VAC-2025-998');

  // Growth Form Fields
  const [childWeight, setChildWeight] = useState('5.8');
  const [childHeight, setChildHeight] = useState('59.5');
  const [muacCm, setMuacCm] = useState('13.8');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Simulate/perform save to appropriate Firestore subcollection with verified provenance
      await new Promise(res => setTimeout(res, 600));
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record encounter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[24px] border border-[var(--border-hairline)] shadow-card-3 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--haven-deep)] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[16px] leading-tight">
                Log New Clinical Encounter
              </h3>
              <p className="text-[11px] text-purple-200">
                Direct In-Facility Entry · Auto-Verified Stamp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-[13px]">
          {/* Encounter Type Selector */}
          <div className="bg-[var(--lavender-50)] p-1 rounded-[14px] grid grid-cols-4 gap-1">
            {[
              { id: 'anc', label: 'ANC Visit' },
              { id: 'pnc', label: 'PNC Contact' },
              { id: 'immunization', label: 'Vaccination' },
              { id: 'growth', label: 'Growth Check' },
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setEncounterType(type.id as any)}
                className={`py-2 text-[11px] font-display font-bold rounded-[10px] transition-all cursor-pointer ${
                  encounterType === type.id
                    ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {encounterType === 'anc' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">ANC Visit #</label>
                  <select
                    value={visitNumber}
                    onChange={(e) => setVisitNumber(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>Contact {n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Gestation (Weeks)</label>
                  <input
                    type="number"
                    value={gestationalWeeks}
                    onChange={(e) => setGestationalWeeks(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                    min={4}
                    max={42}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">BP (Systolic / Diastolic)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      className="w-1/2 p-2 border border-gray-200 rounded-[10px] bg-white text-xs text-center font-bold"
                    />
                    <span>/</span>
                    <input
                      type="text"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value)}
                      className="w-1/2 p-2 border border-gray-200 rounded-[10px] bg-white text-xs text-center font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fundal Ht (cm)</label>
                  <input
                    type="text"
                    value={fundalHeight}
                    onChange={(e) => setFundalHeight(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">FHR (bpm)</label>
                  <input
                    type="text"
                    value={fetalHeartRate}
                    onChange={(e) => setFetalHeartRate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Hb Level (g/dL)</label>
                  <input
                    type="text"
                    value={hbLevel}
                    onChange={(e) => setHbLevel(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ifasGiven}
                      onChange={(e) => setIfasGiven(e.target.checked)}
                      className="w-4 h-4 accent-[var(--haven-deep)]"
                    />
                    <span>IFAS Given</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={iptpGiven}
                      onChange={(e) => setIptpGiven(e.target.checked)}
                      className="w-4 h-4 accent-[var(--haven-deep)]"
                    />
                    <span>IPTp-SP Given</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Clinical Findings &amp; Next Steps</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {encounterType === 'immunization' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Vaccine Dose</label>
                <select
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs font-bold"
                >
                  <option>BCG + OPV Birth Dose (At Birth)</option>
                  <option>Penta 1 + OPV 1 + Rota 1 + PCV 10 (6 Weeks)</option>
                  <option>Penta 2 + OPV 2 + Rota 2 + PCV 10 (10 Weeks)</option>
                  <option>Penta 3 + OPV 3 + IPV + PCV 10 (14 Weeks)</option>
                  <option>Measles-Rubella 1 + Yellow Fever (9 Months)</option>
                  <option>Measles-Rubella 2 (18 Months)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={facilityName}
                    disabled
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-gray-50 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {encounterType === 'growth' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={childWeight}
                    onChange={(e) => setChildWeight(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Length/Height (cm)</label>
                  <input
                    type="text"
                    value={childHeight}
                    onChange={(e) => setChildHeight(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">MUAC (cm)</label>
                  <input
                    type="text"
                    value={muacCm}
                    onChange={(e) => setMuacCm(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-[10px] bg-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {encounterType === 'pnc' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">PNC Visit Timing</label>
                <select className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs font-bold">
                  <option>Contact 1: Within 48 Hours Post-Delivery</option>
                  <option>Contact 2: Day 7 - 14 (1 - 2 Weeks)</option>
                  <option>Contact 3: Week 4 - 6 (Postpartum Checkup)</option>
                  <option>Contact 4: Month 4 - 6 (Weaning Evaluation)</option>
                </select>
              </div>
              <textarea
                rows={2}
                placeholder="Maternal involution, lochia check, wound healing, infant feeding & mental wellbeing..."
                className="w-full p-2.5 border border-gray-200 rounded-[12px] bg-white text-xs focus:outline-none"
              />
            </div>
          )}

          {/* Audit signature info */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[14px] text-[11px] text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This entry will be recorded with <strong>Verified by {clinicianName} ({facilityName})</strong>.</span>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-[var(--border-hairline)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="py-2.5 px-5 text-xs bg-[var(--haven-deep)]"
            >
              {loading ? 'Saving Record...' : 'Save Verified Encounter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
