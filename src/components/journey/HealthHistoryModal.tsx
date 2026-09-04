import React, { useState } from 'react';
import { X, Heart, Shield, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Pregnancy } from '../../types';
import { updatePregnancy } from '../../services/pregnancyService';
import Button from '../Button';

interface HealthHistoryModalProps {
  pregnancy: Pregnancy;
  onClose: () => void;
  onUpdated: () => void;
}

const COMMON_CHRONIC_CONDITIONS = [
  'Hypertension / Pre-eclampsia history',
  'Diabetes Mellitus / Gestational diabetes',
  'Asthma',
  'Sickle Cell Trait / Disease',
  'Cardiac condition',
  'Thyroid disorder',
  'None'
];

export default function HealthHistoryModal({
  pregnancy,
  onClose,
  onUpdated,
}: HealthHistoryModalProps) {
  const [bloodGroup, setBloodGroup] = useState(pregnancy.bloodGroup || 'O');
  const [rhesusFactor, setRhesusFactor] = useState<'+' | '-'>(pregnancy.rhesusFactor || '+');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(pregnancy.chronicConditions || ['None']);
  const [medications, setMedications] = useState<string[]>(pregnancy.currentMedications || []);
  const [newMed, setNewMed] = useState('');
  const [allergies, setAllergies] = useState<string[]>(pregnancy.allergies || []);
  const [newAllergy, setNewAllergy] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCondition = (cond: string) => {
    if (cond === 'None') {
      setSelectedConditions(['None']);
      return;
    }
    const filtered = selectedConditions.filter(c => c !== 'None');
    if (filtered.includes(cond)) {
      const next = filtered.filter(c => c !== cond);
      setSelectedConditions(next.length === 0 ? ['None'] : next);
    } else {
      setSelectedConditions([...filtered, cond]);
    }
  };

  const addMedication = () => {
    if (newMed.trim()) {
      setMedications([...medications, newMed.trim()]);
      setNewMed('');
    }
  };

  const removeMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (idx: number) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await updatePregnancy(pregnancy.id, {
        bloodGroup,
        rhesusFactor,
        chronicConditions: selectedConditions,
        currentMedications: medications,
        allergies,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Failed to update health history', err);
      setError(err?.message || 'Failed to update health history.');
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
              Pregnancy Health History
            </h2>
            <p className="font-body text-[12px] text-[var(--ink-600)]">
              Baseline medical history aligned with MOH maternal standards
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

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 pt-4">
          {/* Blood Group & Rhesus Factor */}
          <div className="p-4 rounded-[18px] bg-[var(--lavender-50)] border border-[var(--border-hairline)] space-y-3">
            <h4 className="font-display font-bold text-[13px] text-[var(--haven-deep)] flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Blood Group &amp; Rhesus Factor</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  ABO Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[14px] font-display font-bold text-[var(--ink-900)]"
                >
                  <option value="O">Group O</option>
                  <option value="A">Group A</option>
                  <option value="B">Group B</option>
                  <option value="AB">Group AB</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  Rhesus (Rh) Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRhesusFactor('+')}
                    className={`flex-1 py-2 rounded-[12px] text-[13px] font-display font-bold border transition-all cursor-pointer ${
                      rhesusFactor === '+'
                        ? 'bg-[var(--haven-deep)] text-white border-[var(--haven-deep)] shadow-xs'
                        : 'bg-white border-[var(--border-hairline)] text-[var(--ink-600)]'
                    }`}
                  >
                    Rh (+) Positive
                  </button>
                  <button
                    type="button"
                    onClick={() => setRhesusFactor('-')}
                    className={`flex-1 py-2 rounded-[12px] text-[13px] font-display font-bold border transition-all cursor-pointer ${
                      rhesusFactor === '-'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white border-[var(--border-hairline)] text-[var(--ink-600)]'
                    }`}
                  >
                    Rh (-) Negative
                  </button>
                </div>
              </div>
            </div>

            {rhesusFactor === '-' && (
              <p className="text-[11px] text-rose-700 font-body bg-rose-50 p-2.5 rounded-[10px] border border-rose-200">
                Note: Rh-negative mothers require Anti-D immunoglobulin injection around Week 28 and post-delivery to prevent hemolytic sensitization.
              </p>
            )}
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-2">
              Chronic Medical Conditions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_CHRONIC_CONDITIONS.map(cond => {
                const selected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`p-2.5 rounded-[12px] text-[12px] font-display font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'bg-[var(--lavender-100)] border-[var(--haven-deep)] text-[var(--haven-deep)] font-bold shadow-xs'
                        : 'bg-white border-[var(--border-hairline)] text-[var(--ink-700)] hover:bg-[var(--lavender-50)]'
                    }`}
                  >
                    <span>{cond}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--haven-deep)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Medications */}
          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Current Daily Medications &amp; Supplements
            </label>
            <div className="space-y-2 mb-2">
              {medications.map((med, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-[var(--border-hairline)] rounded-[12px] text-[13px]">
                  <span>{med}</span>
                  <button
                    type="button"
                    onClick={() => removeMedication(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMed}
                onChange={e => setNewMed(e.target.value)}
                placeholder="e.g. Methyldopa 250mg, Calcium 500mg"
                className="flex-1 px-3 py-2 rounded-[12px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
              <button
                type="button"
                onClick={addMedication}
                className="px-4 py-2 rounded-[12px] bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-[12px] hover:bg-[var(--lavender-200)] cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Known Allergies */}
          <div>
            <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Known Drug &amp; Environmental Allergies
            </label>
            <div className="space-y-2 mb-2">
              {allergies.map((allg, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-[var(--border-hairline)] rounded-[12px] text-[13px]">
                  <span>{allg}</span>
                  <button
                    type="button"
                    onClick={() => removeAllergy(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={e => setNewAllergy(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, Latex"
                className="flex-1 px-3 py-2 rounded-[12px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-4 py-2 rounded-[12px] bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-[12px] hover:bg-[var(--lavender-200)] cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5">
            {loading ? 'Saving history...' : 'Update Health History'}
          </Button>
        </form>
      </div>
    </div>
  );
}
