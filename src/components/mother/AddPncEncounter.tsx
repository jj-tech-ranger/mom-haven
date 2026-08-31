import React, { useState } from 'react';
import {
  ChevronLeft,
  Heart,
  Baby,
  Calendar,
  Building2,
  Scale,
  Activity,
  AlertTriangle,
  Info,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { PostnatalEncounterDoc, Provenance } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

interface AddPncEncounterProps {
  childId: string;
  onBack: () => void;
  onSave: (encounter: Omit<PostnatalEncounterDoc, 'id'>) => Promise<void> | void;
  onSaveDraft?: (draft: Partial<PostnatalEncounterDoc>) => void;
}

export const AddPncEncounter: React.FC<AddPncEncounterProps> = ({
  childId,
  onBack,
  onSave,
  onSaveDraft,
}) => {
  const [visit, setVisit] = useState<'48h' | '1-2w' | '4-6w' | '4-6mo'>('4-6w');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState('Kariokor Health Centre');

  // Maternal Check Fields
  const [bpSystolic, setBpSystolic] = useState('118');
  const [bpDiastolic, setBpDiastolic] = useState('76');
  const [maternalTemp, setMaternalTemp] = useState('36.6');
  const [lochiaStatus, setLochiaStatus] = useState('Normal / Rubra resolving');
  const [woundHealing, setWoundHealing] = useState('Clean & intact');
  const [moodFeeling, setMoodFeeling] = useState('Coping well, good support');
  const [familyPlanning, setFamilyPlanning] = useState('Counselled / Decided');

  // Infant Check Fields
  const [babyWeightKg, setBabyWeightKg] = useState('4.40');
  const [babyTemp, setBabyTemp] = useState('36.8');
  const [feedingMethod, setFeedingMethod] = useState('Exclusive Breastfeeding');
  const [cordStumpStatus, setCordStumpStatus] = useState('Healed / Separated');
  const [jaundiceObserved, setJaundiceObserved] = useState(false);

  // General Notes
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Provenance preview
  const previewProvenance: Provenance = {
    status: 'REPORTED',
    enteredBy: 'mother',
    enteredAt: new Date().toISOString(),
    verifiedBy: null,
    verifiedAt: null,
    facilityName,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const sys = parseInt(bpSystolic);
    const dia = parseInt(bpDiastolic);
    if (isNaN(sys) || isNaN(dia) || sys < 70 || sys > 250 || dia < 40 || dia > 150) {
      setError('Please enter a valid maternal blood pressure (e.g. 118 / 76).');
      return;
    }

    const bWeight = parseFloat(babyWeightKg);
    if (isNaN(bWeight) || bWeight < 1.0 || bWeight > 20.0) {
      setError('Please enter a valid baby weight in kg (e.g. 4.40).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const motherSummary = `BP ${sys}/${dia} mmHg, Temp ${maternalTemp}°C. Lochia: ${lochiaStatus}. Wound: ${woundHealing}. Mood: ${moodFeeling}. FP: ${familyPlanning}. ${generalNotes ? `Notes: ${generalNotes}` : ''}`;
      const babySummary = `Weight ${bWeight} kg, Temp ${babyTemp}°C. Feeding: ${feedingMethod}. Cord: ${cordStumpStatus}. Jaundice: ${jaundiceObserved ? 'Observed' : 'None'}.`;

      const payload: Omit<PostnatalEncounterDoc, 'id'> = {
        childId,
        visit,
        date,
        motherFindings: motherSummary,
        babyFindings: babySummary,
        provenance: previewProvenance,
      };

      await onSave(payload);
    } catch (err: any) {
      console.error('Error saving PNC encounter:', err);
      setError(err?.message || 'Failed to save PNC encounter.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="font-display font-bold text-lg text-ink-900 leading-tight">
            Add PNC Encounter
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            Kenya MOH 216 Postnatal Record
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Provenance Live Preview */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-body text-ink-600 uppercase tracking-wider block">
              Provenance Preview
            </span>
            <span className="font-display font-bold text-sm text-ink-900 mt-0.5 block">
              Caregiver Entry (Reported)
            </span>
          </div>
          <ProvenanceBadge provenance={previewProvenance} compact />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[16px] text-xs text-red-700 font-body flex items-center gap-2">
            <Info className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Visit Schedule Selection */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-haven-orchid" />
              PNC Contact & Facility
            </h3>

            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1.5">
                PNC Contact Stage *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '48h', label: 'Contact 1: Within 48h' },
                  { id: '1-2w', label: 'Contact 2: 1–2 Weeks' },
                  { id: '4-6w', label: 'Contact 3: 4–6 Weeks' },
                  { id: '4-6mo', label: 'Contact 4: 4–6 Months' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVisit(item.id as any)}
                    className={`py-2 px-3 rounded-card text-xs font-display font-semibold transition-all border text-left ${
                      visit === item.id
                        ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                        : 'bg-lavender-50/50 text-ink-800 border-border-hairline hover:bg-lavender-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Encounter Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>

              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="Kariokor Health Centre"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Maternal Health & Recovery */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3.5">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-haven-orchid" />
              Maternal Health & Recovery
            </h3>

            {/* Blood Pressure */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Blood Pressure (mmHg) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(e.target.value)}
                  placeholder="118"
                  required
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body text-center focus:outline-none focus:border-haven-orchid"
                />
                <span className="text-ink-600 font-bold">/</span>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(e.target.value)}
                  placeholder="76"
                  required
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body text-center focus:outline-none focus:border-haven-orchid"
                />
              </div>
            </div>

            {/* Maternal Temperature & Lochia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Maternal Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={maternalTemp}
                  onChange={(e) => setMaternalTemp(e.target.value)}
                  placeholder="36.6"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>

              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Lochia / Bleeding Status
                </label>
                <select
                  value={lochiaStatus}
                  onChange={(e) => setLochiaStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-xs font-body focus:outline-none focus:border-haven-orchid"
                >
                  <option value="Normal / Rubra resolving">Normal / Resolving</option>
                  <option value="Light serosa / alba">Light serosa</option>
                  <option value="Heavier than usual">Heavier than usual</option>
                </select>
              </div>
            </div>

            {/* Mood & Postpartum Depression Check */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Maternal Emotional Wellbeing & Support
              </label>
              <select
                value={moodFeeling}
                onChange={(e) => setMoodFeeling(e.target.value)}
                className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-xs font-body focus:outline-none focus:border-haven-orchid"
              >
                <option value="Coping well, good support">Coping well, good partner support</option>
                <option value="Mild fatigue but manageable">Mild fatigue, manageable</option>
                <option value="Feeling overwhelmed / anxious">Feeling overwhelmed / tearful (Needs counseling)</option>
              </select>
            </div>
          </div>

          {/* Card 3: Infant Health & Vitals */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3.5">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Baby className="w-4 h-4 text-haven-orchid" />
              Infant Examination & Feeding
            </h3>

            {/* Baby Weight & Temp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Baby Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={babyWeightKg}
                  onChange={(e) => setBabyWeightKg(e.target.value)}
                  placeholder="4.40"
                  required
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>

              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Baby Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={babyTemp}
                  onChange={(e) => setBabyTemp(e.target.value)}
                  placeholder="36.8"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>
            </div>

            {/* Infant Feeding & Cord */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Feeding Method
                </label>
                <select
                  value={feedingMethod}
                  onChange={(e) => setFeedingMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-xs font-body focus:outline-none focus:border-haven-orchid"
                >
                  <option value="Exclusive Breastfeeding">Exclusive Breastfeeding</option>
                  <option value="Expressed Breastmilk">Expressed Milk</option>
                  <option value="Mixed Feeding">Mixed Feeding</option>
                </select>
              </div>

              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Cord Stump Condition
                </label>
                <select
                  value={cordStumpStatus}
                  onChange={(e) => setCordStumpStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-xs font-body focus:outline-none focus:border-haven-orchid"
                >
                  <option value="Healed / Cleanly separated">Healed / Separated</option>
                  <option value="Intact & clean with Chlorhexidine">Clean with Chlorhexidine</option>
                  <option value="Red / Discharging (Alert)">Red / Discharging</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Save encounter</span>
              )}
            </button>

            {onSaveDraft && (
              <button
                type="button"
                onClick={() => {
                  onSaveDraft({
                    visit,
                    date,
                    motherFindings: `BP ${bpSystolic}/${bpDiastolic}`,
                    babyFindings: `Weight ${babyWeightKg} kg`,
                  });
                  onBack();
                }}
                className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm hover:bg-lavender-50 transition-colors cursor-pointer"
              >
                Save as draft
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
