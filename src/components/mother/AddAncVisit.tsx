import React, { useState } from 'react';
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, Save, FileText, Stethoscope } from 'lucide-react';
import { AncEncounterDoc } from '../../types';

interface AddAncVisitProps {
  pregnancyId?: string;
  onBack: () => void;
  onSave: (visit: Omit<AncEncounterDoc, 'id'>) => Promise<void>;
  onSaveDraft?: (draft: Partial<AncEncounterDoc>) => void;
}

export const AddAncVisit: React.FC<AddAncVisitProps> = ({
  pregnancyId = '',
  onBack,
  onSave,
  onSaveDraft,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [facilityName, setFacilityName] = useState<string>('Kariokor Health Centre');
  const [visitNumber, setVisitNumber] = useState<number>(5);
  const [gestationWeeks, setGestationWeeks] = useState<number>(24);
  const [weight, setWeight] = useState<string>('68.4');
  const [systolic, setSystolic] = useState<string>('112');
  const [diastolic, setDiastolic] = useState<string>('74');
  const [fundalHeight, setFundalHeight] = useState<string>('24');
  const [fetalHeartRate, setFetalHeartRate] = useState<string>('144');
  const [notes, setNotes] = useState<string>('Mild swelling in my ankles by evening, otherwise feeling well.');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Validation function
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!date) {
      errs.date = 'Please select a visit date.';
    }

    if (!facilityName.trim()) {
      errs.facilityName = 'Please provide the clinic or health facility name.';
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      errs.weight = 'Please enter a valid weight in kg (between 30kg and 200kg).';
    }

    const sysNum = parseInt(systolic, 10);
    const diaNum = parseInt(diastolic, 10);
    if (isNaN(sysNum) || isNaN(diaNum) || sysNum < 60 || sysNum > 240 || diaNum < 40 || diaNum > 150) {
      errs.bp = 'Please enter valid blood pressure numbers (e.g., 112 / 74).';
    }

    if (fundalHeight) {
      const fundalNum = parseFloat(fundalHeight);
      if (isNaN(fundalNum) || fundalNum < 8 || fundalNum > 50) {
        errs.fundalHeight = 'Fundal height should normally be between 8 and 50 cm.';
      }
    }

    if (fetalHeartRate) {
      const fhrNum = parseInt(fetalHeartRate, 10);
      if (isNaN(fhrNum) || fhrNum < 90 || fhrNum > 200) {
        errs.fhr = 'Fetal heart rate is typically between 110 and 160 bpm.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const bpCombined = `${systolic} / ${diastolic}`;
      const payload: Omit<AncEncounterDoc, 'id'> = {
        pregnancyId,
        date,
        facilityName: facilityName.trim(),
        visitNumber: Number(visitNumber),
        gestationWeeks: Number(gestationWeeks),
        weight: parseFloat(weight),
        bloodPressure: bpCombined,
        fundalHeight: fundalHeight ? parseFloat(fundalHeight) : undefined,
        fetalHeartRate: fetalHeartRate ? parseInt(fetalHeartRate, 10) : undefined,
        notes: notes.trim(),
        provenance: {
          status: 'REPORTED',
          enteredBy: 'mother',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
          facilityName: facilityName.trim(),
        },
      };

      await onSave(payload);
      setShowSuccessToast(true);
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (err) {
      console.error('Error saving ANC visit:', err);
      setErrors({ form: 'Could not save ANC visit. Please check network connection.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDraft = () => {
    if (onSaveDraft) {
      onSaveDraft({
        date,
        facilityName,
        visitNumber,
        gestationWeeks,
        weight: parseFloat(weight) || 0,
        bloodPressure: `${systolic}/${diastolic}`,
        notes,
      });
    }
    onBack();
  };

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-ink-900 leading-tight">
              Add ANC Visit
            </h1>
            <p className="font-body text-xs text-ink-600">
              Caregiver-entered clinic data
            </p>
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <form onSubmit={handleFormSubmit} className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {/* Reported Badge Preview Card */}
        <div className="bg-lavender-100/70 border border-haven-orchid/20 rounded-[20px] p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white border border-border-hairline flex items-center justify-center flex-shrink-0 text-haven-orchid">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-haven-deep">
                Reported Record Preview
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-lavender-200 text-haven-deep text-[10px] font-display font-semibold">
                Reported
              </span>
            </div>
            <p className="font-body text-xs text-ink-600 mt-0.5">
              Entered by you · not yet verified by a clinician. A nurse can verify this during your next facility contact.
            </p>
          </div>
        </div>

        {/* Validation error summary if form level error exists */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-display">Please correct the following:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 font-body">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Card 1: Visit Details */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-haven-orchid" />
            Visit Information
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Visit Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full p-2.5 bg-lavender-50/70 border ${
                  errors.date ? 'border-red-500' : 'border-border-hairline'
                } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid`}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                ANC Contact #
              </label>
              <select
                value={visitNumber}
                onChange={(e) => setVisitNumber(Number(e.target.value))}
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    Contact {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Health Facility / Clinic *
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              placeholder="e.g. Kariokor Health Centre, Pumwani Maternity"
              className={`w-full p-2.5 bg-lavender-50/70 border ${
                errors.facilityName ? 'border-red-500' : 'border-border-hairline'
              } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid`}
            />
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Gestation Weeks
            </label>
            <input
              type="number"
              min={4}
              max={43}
              value={gestationWeeks}
              onChange={(e) => setGestationWeeks(Number(e.target.value))}
              className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            />
          </div>
        </div>

        {/* Card 2: Maternal Vitals & Clinical Measurements */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-haven-orchid" />
            Maternal Vitals (From Mother-Baby Booklet)
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="68.4"
                className={`w-full p-2.5 bg-lavender-50/70 border ${
                  errors.weight ? 'border-red-500' : 'border-border-hairline'
                } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid`}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Blood Pressure (mmHg) *
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="112"
                  className={`w-1/2 p-2.5 bg-lavender-50/70 border ${
                    errors.bp ? 'border-red-500' : 'border-border-hairline'
                  } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid text-center`}
                />
                <span className="text-ink-600 font-bold">/</span>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="74"
                  className={`w-1/2 p-2.5 bg-lavender-50/70 border ${
                    errors.bp ? 'border-red-500' : 'border-border-hairline'
                  } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid text-center`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Fundal Height (cm)
              </label>
              <input
                type="number"
                value={fundalHeight}
                onChange={(e) => setFundalHeight(e.target.value)}
                placeholder="24"
                className={`w-full p-2.5 bg-lavender-50/70 border ${
                  errors.fundalHeight ? 'border-red-500' : 'border-border-hairline'
                } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid`}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Fetal Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={fetalHeartRate}
                onChange={(e) => setFetalHeartRate(e.target.value)}
                placeholder="144"
                className={`w-full p-2.5 bg-lavender-50/70 border ${
                  errors.fhr ? 'border-red-500' : 'border-border-hairline'
                } rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid`}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Free-Text Mother's Notes */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <label className="block text-xs font-display font-semibold text-ink-900">
            Mother's Notes & Symptoms
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Record symptoms, questions for your nurse, or special advice given..."
            className="w-full p-3 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving ANC Visit...' : 'Save visit'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-100/60 transition-colors cursor-pointer text-center"
          >
            Save as draft
          </button>
        </div>
      </form>
    </div>
  );
};
