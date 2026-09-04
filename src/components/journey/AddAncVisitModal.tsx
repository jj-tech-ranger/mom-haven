import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Info, ShieldCheck, UserCheck } from 'lucide-react';
import { AncEncounter, Provenance } from '../../types';
import { KENYA_FACILITIES } from '../../data/kenyaFacilities';
import { addAncEncounter } from '../../services/pregnancyService';
import Button from '../Button';

interface AddAncVisitModalProps {
  pregnancyId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
  initialVisitNumber?: number;
}

export default function AddAncVisitModal({
  pregnancyId,
  userId,
  onClose,
  onSaved,
  initialVisitNumber = 1,
}: AddAncVisitModalProps) {
  const [visitNumber, setVisitNumber] = useState<number>(initialVisitNumber);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState('');
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState(16);
  const [weight, setWeight] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [fundalHeight, setFundalHeight] = useState('');
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [hbLevel, setHbLevel] = useState('');
  const [urineAlbumin, setUrineAlbumin] = useState('Nil');
  const [urineGlucose, setUrineGlucose] = useState('Nil');

  // Interventions checkboxes
  const [ironFolicGiven, setIronFolicGiven] = useState(false);
  const [tdBoosterGiven, setTdBoosterGiven] = useState(false);
  const [iptpGiven, setIptpGiven] = useState(false);
  const [mosquitoNetGiven, setMosquitoNetGiven] = useState(false);
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const provenance: Provenance = {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      };

      await addAncEncounter(pregnancyId, {
        pregnancyId,
        visitNumber: Number(visitNumber),
        date,
        facilityName,
        gestationalAgeWeeks: Number(gestationalAgeWeeks),
        weight: weight ? parseFloat(weight) : undefined,
        systolicBp: systolicBp ? parseInt(systolicBp) : undefined,
        diastolicBp: diastolicBp ? parseInt(diastolicBp) : undefined,
        bloodPressure: systolicBp && diastolicBp ? `${systolicBp} / ${diastolicBp}` : undefined,
        fundalHeight: fundalHeight ? parseFloat(fundalHeight) : undefined,
        fetalHeartRate: fetalHeartRate ? parseInt(fetalHeartRate) : undefined,
        hbLevel: hbLevel ? parseFloat(hbLevel) : undefined,
        urineAlbumin,
        urineGlucose,
        ironFolicGiven,
        tdBoosterGiven,
        iptpGiven,
        mosquitoNetGiven,
        nextAppointmentDate: nextAppointmentDate || undefined,
        notes: notes.trim(),
        provenance,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save ANC record', err);
      setError(err?.message || 'Failed to save visit record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="font-display font-extrabold text-[19px] text-[var(--ink-900)]">
              Log Antenatal Care Visit
            </h2>
            <p className="font-body text-[12px] text-[var(--ink-600)]">
              Record measurements directly from your MOH 216 clinic card
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provenance Disclaimer Banner */}
        <div className="mt-3 p-3.5 rounded-[16px] bg-[#FBF0DC] border border-[#A15E06]/30 flex items-start gap-2.5 text-[12px] text-[#A15E06]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A15E06]" />
          <div>
            <span className="font-bold font-display block">Self-Reported Entry</span>
            Entries you record here are marked as <strong>Self-Reported</strong>. A healthcare provider can review and verify them during your next clinic visit.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Contact Number & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                ANC Contact #
              </label>
              <select
                value={visitNumber}
                onChange={e => setVisitNumber(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px] shadow-xs"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>Contact #{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Visit Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px] shadow-xs"
                required
              />
            </div>
          </div>

          {/* Health Facility */}
          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Healthcare Facility
            </label>
            <input
              type="text"
              list="facilities-list"
              value={facilityName}
              onChange={e => setFacilityName(e.target.value)}
              placeholder="Select or enter health facility name"
              className="w-full px-4 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px] shadow-xs"
              required
            />
            <datalist id="facilities-list">
              {KENYA_FACILITIES.map(f => (
                <option key={f.id} value={f.name} />
              ))}
            </datalist>
          </div>

          {/* Clinical Measurements */}
          <div className="p-3.5 bg-[var(--lavender-50)] rounded-[18px] border border-[var(--border-hairline)] space-y-3">
            <h4 className="font-display font-bold text-[13px] text-[var(--haven-deep)]">
              Vital Signs &amp; Measurements
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-0.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 68.4"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-0.5">
                  Blood Pressure (mmHg)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={e => setSystolicBp(e.target.value)}
                    placeholder="120"
                    className="w-1/2 px-2.5 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                  />
                  <span className="text-[var(--ink-400)]">/</span>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={e => setDiastolicBp(e.target.value)}
                    placeholder="80"
                    className="w-1/2 px-2.5 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-0.5">
                  Fundal Height (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={fundalHeight}
                  onChange={e => setFundalHeight(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-0.5">
                  Fetal Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={fetalHeartRate}
                  onChange={e => setFetalHeartRate(e.target.value)}
                  placeholder="e.g. 144"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-0.5">
                  Hemoglobin Hb (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hbLevel}
                  onChange={e => setHbLevel(e.target.value)}
                  placeholder="e.g. 12.0"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-0.5">
                  Urine Albumin / Protein
                </label>
                <select
                  value={urineAlbumin}
                  onChange={e => setUrineAlbumin(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                >
                  <option value="Nil">Nil (Normal)</option>
                  <option value="Trace">Trace</option>
                  <option value="1+">1+ (Mild)</option>
                  <option value="2+">2+ (Moderate)</option>
                  <option value="3+">3+ (Severe)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interventions Given */}
          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-2">
              Interventions Given Today
            </label>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <label className="flex items-center gap-2 p-2 rounded-[12px] border border-[var(--border-hairline)] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={ironFolicGiven}
                  onChange={e => setIronFolicGiven(e.target.checked)}
                  className="rounded text-[var(--haven-deep)]"
                />
                <span>Iron &amp; Folic Acid (IFAS)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-[12px] border border-[var(--border-hairline)] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={iptpGiven}
                  onChange={e => setIptpGiven(e.target.checked)}
                  className="rounded text-[var(--haven-deep)]"
                />
                <span>IPTp (Malaria dose)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-[12px] border border-[var(--border-hairline)] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={tdBoosterGiven}
                  onChange={e => setTdBoosterGiven(e.target.checked)}
                  className="rounded text-[var(--haven-deep)]"
                />
                <span>Tetanus (Td) Booster</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-[12px] border border-[var(--border-hairline)] bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={mosquitoNetGiven}
                  onChange={e => setMosquitoNetGiven(e.target.checked)}
                  className="rounded text-[var(--haven-deep)]"
                />
                <span>Mosquito Net (ITN)</span>
              </label>
            </div>
          </div>

          {/* Notes & Comments */}
          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Your Notes &amp; Symptoms
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Any concerns discussed with the nurse, advice given..."
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px] shadow-xs"
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Saving record...' : 'Save ANC Record'}
          </Button>
        </form>
      </div>
    </div>
  );
}
