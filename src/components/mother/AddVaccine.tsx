import React, { useState } from 'react';
import { ChevronLeft, Syringe, Calendar, MapPin, Check, AlertCircle } from 'lucide-react';
import { ImmunizationRecordDoc } from '../../types';

interface AddVaccineProps {
  childId: string;
  onBack: () => void;
  onSave: (record: Omit<ImmunizationRecordDoc, 'id'>) => Promise<void> | void;
}

const COMMON_VACCINES = [
  { name: 'BCG', doses: ['Single Dose'], period: 'At Birth' },
  { name: 'OPV (Oral Polio)', doses: ['Birth Dose (OPV 0)', 'OPV 1', 'OPV 2', 'OPV 3'], period: '0–14 Weeks' },
  { name: 'DPT-HepB-Hib (Pentavalent)', doses: ['1st dose (6w)', '2nd dose (10w)', '3rd dose (14w)'], period: '6–14 Weeks' },
  { name: 'PCV (Pneumococcal)', doses: ['1st dose (6w)', '2nd dose (10w)', '3rd dose (14w)'], period: '6–14 Weeks' },
  { name: 'Rotavirus', doses: ['1st dose (6w)', '2nd dose (10w)', '3rd dose (14w)'], period: '6–14 Weeks' },
  { name: 'Inactivated Polio (IPV)', doses: ['1st dose (14w)', '2nd dose (9m)'], period: '14 Weeks & 9 Months' },
  { name: 'Measles Rubella (MR)', doses: ['1st dose (9m)', '2nd dose (18m)'], period: '9 & 18 Months' },
  { name: 'Yellow Fever', doses: ['Single dose (9m)'], period: '9 Months' },
  { name: 'Vitamin A', doses: ['6 months', '12 months', '18 months', '24 months'], period: 'Every 6 Months' },
];

export const AddVaccine: React.FC<AddVaccineProps> = ({ childId, onBack, onSave }) => {
  const [selectedVaccine, setSelectedVaccine] = useState(COMMON_VACCINES[0].name);
  const [dose, setDose] = useState(COMMON_VACCINES[0].doses[0]);
  const [dateGiven, setDateGiven] = useState(new Date().toISOString().split('T')[0]);
  const [site, setSite] = useState('Left Upper Arm (Intradermal)');
  const [facilityName, setFacilityName] = useState('Kariokor Health Centre');
  const [batchNumber, setBatchNumber] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleVaccineChange = (vName: string) => {
    setSelectedVaccine(vName);
    const found = COMMON_VACCINES.find((item) => item.name === vName);
    if (found && found.doses.length > 0) {
      setDose(found.doses[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccine || !dose || !dateGiven) {
      setError('Please fill in all required fields (vaccine, dose, date).');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await onSave({
        childId,
        vaccine: selectedVaccine,
        dose,
        dateGiven,
        minimumEligibleDate: dateGiven,
        scheduledDate: dateGiven,
        recommendedActionDate: dateGiven,
        status: 'given',
        provenance: {
          status: 'REPORTED',
          enteredBy: 'mother',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
          facilityName: facilityName || undefined,
        },
      });
    } catch (err) {
      console.error(err);
      setError('Could not save vaccine record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentVaccineObj = COMMON_VACCINES.find((v) => v.name === selectedVaccine);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Record Vaccine</h1>
        <div className="w-10" />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Vaccine Picker */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Vaccine Name *
          </label>
          <select
            value={selectedVaccine}
            onChange={(e) => handleVaccineChange(e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
          >
            {COMMON_VACCINES.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.period})
              </option>
            ))}
          </select>
        </div>

        {/* Dose Selector */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Dose Number / Stage *
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {currentVaccineObj?.doses.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDose(d)}
                className={`py-3 px-3 rounded-2xl border text-xs font-display font-bold transition-all text-center ${
                  dose === d
                    ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                    : 'bg-white text-ink-900 border-border-hairline hover:bg-lavender-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Date Given */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Date Administered *
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateGiven}
              onChange={(e) => setDateGiven(e.target.value)}
              className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              required
            />
          </div>
        </div>

        {/* Administration Site */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Injection Site / Administration
          </label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
          >
            <option value="Oral">Oral drops</option>
            <option value="Left Upper Arm (Intradermal)">Left Upper Arm (Intradermal / BCG)</option>
            <option value="Right Upper Arm">Right Upper Arm</option>
            <option value="Left Outer Thigh (Intramuscular)">Left Outer Thigh (Intramuscular)</option>
            <option value="Right Outer Thigh (Intramuscular)">Right Outer Thigh (Intramuscular)</option>
          </select>
        </div>

        {/* Facility & Batch */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-4">
          <div>
            <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider mb-1">
              Facility / Clinic Given
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              placeholder="e.g. Kariokor Health Centre"
              className="w-full px-4 py-3 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            />
          </div>

          <div>
            <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider mb-1">
              Batch / Lot Number (Optional)
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. VAX-2026-09A"
              className="w-full px-4 py-3 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save vaccine'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
