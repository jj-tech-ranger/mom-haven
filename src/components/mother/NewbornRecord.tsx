import React, { useState } from 'react';
import {
  ChevronLeft,
  Baby,
  Scale,
  Ruler,
  ShieldCheck,
  Heart,
  Eye,
  Syringe,
  Info,
  Check,
  Clock,
} from 'lucide-react';
import { ChildDoc, NewbornRecordDoc, Provenance } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

interface NewbornRecordProps {
  child?: ChildDoc | null;
  initialRecord?: NewbornRecordDoc | null;
  onBack: () => void;
  onSave: (recordData: Omit<NewbornRecordDoc, 'id'>) => Promise<void> | void;
}

export const NewbornRecord: React.FC<NewbornRecordProps> = ({
  child,
  initialRecord,
  onBack,
  onSave,
}) => {
  const isVerified = initialRecord?.provenance?.status === 'VERIFIED';

  const [date, setDate] = useState(
    initialRecord?.date || child?.dateOfBirth || new Date().toISOString().split('T')[0]
  );
  const [apgar1, setApgar1] = useState(
    initialRecord?.apgarScore1Min?.toString() || '8'
  );
  const [apgar5, setApgar5] = useState(
    initialRecord?.apgarScore5Min?.toString() || '9'
  );
  const [headCircumference, setHeadCircumference] = useState(
    initialRecord?.headCircumferenceCm?.toString() || '34.5'
  );
  const [eyeProphylaxis, setEyeProphylaxis] = useState(
    initialRecord ? initialRecord.eyeProphylaxisGiven : true
  );
  const [vitaminK, setVitaminK] = useState(
    initialRecord ? initialRecord.vitaminKGiven : true
  );
  const [bcg, setBcg] = useState(
    initialRecord ? initialRecord.bcgGiven : true
  );
  const [opv0, setOpv0] = useState(
    initialRecord ? initialRecord.opv0Given : true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live preview provenance object
  const previewProvenance: Provenance = initialRecord?.provenance || {
    status: 'REPORTED',
    enteredBy: 'mother',
    enteredAt: new Date().toISOString(),
    verifiedBy: null,
    verifiedAt: null,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerified) {
      onBack();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const recordPayload: Omit<NewbornRecordDoc, 'id'> = {
        childId: child?.id || 'default_child',
        date,
        apgarScore1Min: apgar1 ? parseInt(apgar1) : undefined,
        apgarScore5Min: apgar5 ? parseInt(apgar5) : undefined,
        headCircumferenceCm: headCircumference
          ? parseFloat(headCircumference)
          : undefined,
        eyeProphylaxisGiven: eyeProphylaxis,
        vitaminKGiven: vitaminK,
        bcgGiven: bcg,
        opv0Given: opv0,
        provenance: initialRecord?.provenance || {
          status: 'REPORTED',
          enteredBy: 'mother',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
          facilityName: child?.facilityName || 'Kariokor Health Centre',
        },
      };

      await onSave(recordPayload);
      onBack();
    } catch (err: any) {
      console.error('Error saving newborn record:', err);
      setError(err?.message || 'Failed to save newborn record.');
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
            Newborn Clinical Record
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            {child?.name || 'Baby Amara'} · MOH 216
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Provenance Status Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-body text-ink-600 uppercase tracking-wider block">
              Record Verification Status
            </span>
            <span className="font-display font-bold text-sm text-ink-900 mt-0.5 block">
              {isVerified
                ? 'Clinician Verified Record (Locked)'
                : 'Caregiver Reported (Editable)'}
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
          {/* Card 1: Delivery & Physical Examination */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3.5">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Baby className="w-4 h-4 text-haven-orchid" />
              Birth Vitals & Measurements
            </h3>

            {/* Date of Record */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Date of Birth / Examination *
              </label>
              <input
                type="date"
                value={date}
                disabled={isVerified}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid disabled:opacity-60"
              />
            </div>

            {/* APGAR Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  APGAR at 1 Min (0–10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={apgar1}
                  disabled={isVerified}
                  onChange={(e) => setApgar1(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  APGAR at 5 Min (0–10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={apgar5}
                  disabled={isVerified}
                  onChange={(e) => setApgar5(e.target.value)}
                  placeholder="e.g. 9"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid disabled:opacity-60"
                />
              </div>
            </div>

            {/* Head Circumference */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Head Circumference (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="50"
                value={headCircumference}
                disabled={isVerified}
                onChange={(e) => setHeadCircumference(e.target.value)}
                placeholder="e.g. 34.5"
                className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid disabled:opacity-60"
              />
            </div>
          </div>

          {/* Card 2: Essential Newborn Care Interventions */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-haven-orchid" />
              Prophylaxis & Immunization Checklist
            </h3>

            <div className="space-y-2.5 pt-1">
              {/* 1. Vitamin K1 */}
              <label
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  vitaminK
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-lavender-50/50 border-border-hairline text-ink-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Syringe className="w-4 h-4 text-haven-orchid flex-shrink-0" />
                  <div>
                    <span className="font-display font-bold text-xs block">
                      Vitamin K1 (1mg Intramuscular)
                    </span>
                    <span className="font-body text-[11px] text-ink-600">
                      Prevents neonatal hemorrhagic disease
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={vitaminK}
                  disabled={isVerified}
                  onChange={(e) => setVitaminK(e.target.checked)}
                  className="w-5 h-5 rounded text-haven-deep focus:ring-haven-orchid accent-haven-deep"
                />
              </label>

              {/* 2. Eye Tetracycline 1% */}
              <label
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  eyeProphylaxis
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-lavender-50/50 border-border-hairline text-ink-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-haven-orchid flex-shrink-0" />
                  <div>
                    <span className="font-display font-bold text-xs block">
                      1% Tetracycline Eye Ointment
                    </span>
                    <span className="font-body text-[11px] text-ink-600">
                      Prevents ophthalmia neonatorum
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={eyeProphylaxis}
                  disabled={isVerified}
                  onChange={(e) => setEyeProphylaxis(e.target.checked)}
                  className="w-5 h-5 rounded text-haven-deep focus:ring-haven-orchid accent-haven-deep"
                />
              </label>

              {/* 3. BCG Vaccine */}
              <label
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  bcg
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-lavender-50/50 border-border-hairline text-ink-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Syringe className="w-4 h-4 text-haven-orchid flex-shrink-0" />
                  <div>
                    <span className="font-display font-bold text-xs block">
                      BCG Vaccine (Tuberculosis)
                    </span>
                    <span className="font-body text-[11px] text-ink-600">
                      Administered intradermally at right upper arm
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={bcg}
                  disabled={isVerified}
                  onChange={(e) => setBcg(e.target.checked)}
                  className="w-5 h-5 rounded text-haven-deep focus:ring-haven-orchid accent-haven-deep"
                />
              </label>

              {/* 4. OPV-0 Dose */}
              <label
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  opv0
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-lavender-50/50 border-border-hairline text-ink-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Syringe className="w-4 h-4 text-haven-orchid flex-shrink-0" />
                  <div>
                    <span className="font-display font-bold text-xs block">
                      OPV 0 (Oral Polio Birth Dose)
                    </span>
                    <span className="font-body text-[11px] text-ink-600">
                      2 drops administered orally at birth
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={opv0}
                  disabled={isVerified}
                  onChange={(e) => setOpv0(e.target.checked)}
                  className="w-5 h-5 rounded text-haven-deep focus:ring-haven-orchid accent-haven-deep"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {!isVerified && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Save record</span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm hover:bg-lavender-50 transition-colors cursor-pointer"
            >
              {isVerified ? 'Back to Overview' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
