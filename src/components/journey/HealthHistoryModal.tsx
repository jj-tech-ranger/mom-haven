import React, { useState } from 'react';
import { X, Heart, Shield, Plus, Trash2, CheckCircle2, AlertCircle, Baby, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Pregnancy, PreviousPregnancyRecord } from '../../types';
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

  // Previous Pregnancies (MOH Handbook p.6 table) with automatic migration from string array
  const [previousPregnancies, setPreviousPregnancies] = useState<PreviousPregnancyRecord[]>(() => {
    if (pregnancy.previousPregnancies && pregnancy.previousPregnancies.length > 0) {
      return pregnancy.previousPregnancies;
    }
    if (pregnancy.previousOutcomes && pregnancy.previousOutcomes.length > 0) {
      return pregnancy.previousOutcomes.map((outcomeStr, idx) => ({
        id: `migrated-${idx + 1}`,
        pregnancyOrder: idx + 1,
        outcome: outcomeStr.includes('Alive') ? 'Alive and well'
          : outcomeStr.includes('Stillbirth') ? 'Fresh stillbirth'
          : outcomeStr.includes('Miscarriage') ? 'Abortion / Miscarriage'
          : outcomeStr,
        notes: outcomeStr,
      }));
    }
    return [];
  });

  // State for adding a new previous pregnancy entry
  const [showAddPregnancyForm, setShowAddPregnancyForm] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [newAncVisits, setNewAncVisits] = useState<number | ''>('');
  const [newPlace, setNewPlace] = useState('');
  const [newGestation, setNewGestation] = useState<number | ''>('');
  const [newLabourDuration, setNewLabourDuration] = useState('');
  const [newDeliveryMode, setNewDeliveryMode] = useState<string>('SVD');
  const [newBirthWeight, setNewBirthWeight] = useState<number | ''>('');
  const [newBabySex, setNewBabySex] = useState<'Male' | 'Female' | 'Unknown'>('Female');
  const [newOutcome, setNewOutcome] = useState<string>('Alive and well');
  const [newPuerperiumNotes, setNewPuerperiumNotes] = useState('');

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

  const handleAddPreviousPregnancy = () => {
    const nextOrder = previousPregnancies.length + 1;
    const newRecord: PreviousPregnancyRecord = {
      id: `prev-${Date.now()}`,
      pregnancyOrder: nextOrder,
      year: newYear ? parseInt(newYear, 10) || newYear : undefined,
      ancVisitsAttended: newAncVisits !== '' ? Number(newAncVisits) : undefined,
      placeOfChildbirth: newPlace.trim() || undefined,
      gestationWeeks: newGestation !== '' ? Number(newGestation) : undefined,
      durationOfLabour: newLabourDuration.trim() || undefined,
      modeOfDelivery: newDeliveryMode || 'SVD',
      birthWeightGrams: newBirthWeight !== '' ? Number(newBirthWeight) : undefined,
      sex: newBabySex,
      outcome: newOutcome || 'Alive and well',
      puerperiumNotes: newPuerperiumNotes.trim() || undefined,
      notes: `${newOutcome}${newYear ? ` (${newYear})` : ''}`,
    };

    setPreviousPregnancies([...previousPregnancies, newRecord]);
    // Reset form
    setNewYear('');
    setNewAncVisits('');
    setNewPlace('');
    setNewGestation('');
    setNewLabourDuration('');
    setNewDeliveryMode('SVD');
    setNewBirthWeight('');
    setNewBabySex('Female');
    setNewOutcome('Alive and well');
    setNewPuerperiumNotes('');
    setShowAddPregnancyForm(false);
  };

  const removePreviousPregnancy = (idx: number) => {
    const updated = previousPregnancies.filter((_, i) => i !== idx).map((p, i) => ({
      ...p,
      pregnancyOrder: i + 1,
    }));
    setPreviousPregnancies(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Synchronize both structured previousPregnancies and legacy previousOutcomes strings
      const legacyOutcomes = previousPregnancies.map(p =>
        `${p.outcome || 'Pregnancy'}${p.year ? ` (${p.year})` : ''} - ${p.modeOfDelivery || 'Delivery'}`
      );

      await updatePregnancy(pregnancy.id, {
        bloodGroup,
        rhesusFactor,
        chronicConditions: selectedConditions,
        currentMedications: medications,
        allergies,
        previousPregnancies,
        previousOutcomes: legacyOutcomes,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="font-display font-extrabold text-[19px] text-[var(--ink-900)]">
              Pregnancy Health History (MOH 216 pp.6–7)
            </h2>
            <p className="font-body text-[12px] text-[var(--ink-600)]">
              Baseline medical history &amp; previous pregnancies aligned with Kenya Ministry of Health standards
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

        <form onSubmit={handleSave} className="space-y-6 pt-4">
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

          {/* Previous Pregnancies Section (MOH Handbook p.6 Table) */}
          <div className="p-4 rounded-[18px] bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-teal-700" />
                <h4 className="font-display font-bold text-[13px] text-slate-900">
                  Previous Pregnancies History (MOH Handbook p.6)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPregnancyForm(!showAddPregnancyForm)}
                className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Previous Pregnancy</span>
              </button>
            </div>

            {/* List of Previous Pregnancies */}
            {previousPregnancies.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-slate-200">
                No previous pregnancies recorded (Primigravida / 1st pregnancy). If you have had previous pregnancies, click above to add them.
              </p>
            ) : (
              <div className="space-y-2">
                {previousPregnancies.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          #{p.pregnancyOrder}
                        </span>
                        <span className="font-bold text-slate-800">
                          {p.outcome || 'Pregnancy'}
                        </span>
                        {p.year && (
                          <span className="text-slate-500 font-mono">({p.year})</span>
                        )}
                        {p.sex && (
                          <span className="text-[11px] bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded font-medium border border-teal-100">
                            {p.sex}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
                        {p.modeOfDelivery && <span>Delivery: <strong>{p.modeOfDelivery}</strong></span>}
                        {p.placeOfChildbirth && <span>Place: <strong>{p.placeOfChildbirth}</strong></span>}
                        {p.birthWeightGrams && <span>Weight: <strong>{p.birthWeightGrams}g</strong></span>}
                        {p.gestationWeeks && <span>Gestation: <strong>{p.gestationWeeks} wks</strong></span>}
                        {p.ancVisitsAttended !== undefined && <span>ANC: <strong>{p.ancVisitsAttended} visits</strong></span>}
                        {p.durationOfLabour && <span>Labour: <strong>{p.durationOfLabour}</strong></span>}
                      </div>
                      {p.puerperiumNotes && (
                        <p className="text-[11px] text-slate-500 italic">Notes: {p.puerperiumNotes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePreviousPregnancy(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 self-end sm:self-center cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Expandable Add Pregnancy Form */}
            {showAddPregnancyForm && (
              <div className="p-4 bg-white border border-teal-200 rounded-xl space-y-3 mt-2 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-bold text-xs text-teal-900">
                    Record Previous Pregnancy #{previousPregnancies.length + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPregnancyForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Year of Birth</label>
                    <input
                      type="number"
                      placeholder="e.g. 2021"
                      value={newYear}
                      onChange={e => setNewYear(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Outcome</label>
                    <select
                      value={newOutcome}
                      onChange={e => setNewOutcome(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                    >
                      <option value="Alive and well">Alive and well</option>
                      <option value="Fresh stillbirth">Fresh stillbirth</option>
                      <option value="Macerated stillbirth">Macerated stillbirth</option>
                      <option value="Neonatal death">Neonatal death</option>
                      <option value="Abortion / Miscarriage">Abortion / Miscarriage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Mode of Delivery</label>
                    <select
                      value={newDeliveryMode}
                      onChange={e => setNewDeliveryMode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                    >
                      <option value="SVD">SVD (Spontaneous Vaginal)</option>
                      <option value="Caesarean section">Caesarean section</option>
                      <option value="Vacuum extraction">Vacuum extraction</option>
                      <option value="Breech delivery">Breech delivery</option>
                      <option value="Assisted vaginal">Assisted vaginal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Place of Childbirth</label>
                    <input
                      type="text"
                      placeholder="e.g. Hospital / Clinic / Home"
                      value={newPlace}
                      onChange={e => setNewPlace(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Birth Weight (grams)</label>
                    <input
                      type="number"
                      placeholder="e.g. 3200"
                      value={newBirthWeight}
                      onChange={e => setNewBirthWeight(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Baby Sex</label>
                    <select
                      value={newBabySex}
                      onChange={e => setNewBabySex(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Gestation (Weeks)</label>
                    <input
                      type="number"
                      placeholder="e.g. 39"
                      value={newGestation}
                      onChange={e => setNewGestation(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ANC Visits Attended</label>
                    <input
                      type="number"
                      placeholder="e.g. 4"
                      value={newAncVisits}
                      onChange={e => setNewAncVisits(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Duration of Labour</label>
                    <input
                      type="text"
                      placeholder="e.g. 8 hrs"
                      value={newLabourDuration}
                      onChange={e => setNewLabourDuration(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Puerperium Notes / Complications</label>
                  <input
                    type="text"
                    placeholder="e.g. Normal recovery, PPH managed, perineal tear healed"
                    value={newPuerperiumNotes}
                    onChange={e => setNewPuerperiumNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPregnancyForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPreviousPregnancy}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
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
