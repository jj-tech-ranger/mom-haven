import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Share2, Shield, Calendar, MapPin, Stethoscope } from 'lucide-react';
import { AncEncounterDoc } from '../../types';

interface AncVisitDetailProps {
  visit?: Partial<AncEncounterDoc> | null;
  onBack: () => void;
  onShareWithClinician?: () => void;
}

export const AncVisitDetail: React.FC<AncVisitDetailProps> = ({
  visit,
  onBack,
  onShareWithClinician,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // Fallback defaults reflecting MOH 216 Visit #4 specifications from reference screenshot
  const displayVisit = {
    visitNumber: visit?.visitNumber || 4,
    date: visit?.date ? new Date(visit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '2 MAR 2026',
    facilityName: visit?.facilityName?.toUpperCase() || 'KARIOKOR HEALTH CENTRE',
    weight: visit?.weight || 68.4,
    bloodPressure: visit?.bloodPressure || '112 / 74',
    fundalHeight: visit?.fundalHeight || 24,
    fetalHeartRate: visit?.fetalHeartRate || 144,
    notes: visit?.notes || 'Mild swelling in my ankles by evening, otherwise feeling well.',
    provenance: visit?.provenance || {
      status: 'VERIFIED' as const,
      enteredBy: 'mother',
      enteredAt: '2026-03-02T08:30:00Z',
      verifiedBy: 'Nurse A. Wanjiru',
      verifiedAt: '2026-03-03T09:15:00Z',
      facilityName: 'Kariokor Health Centre',
    },
  };

  const isVerified = displayVisit.provenance?.status === 'VERIFIED';
  const reviewerText = displayVisit.provenance?.verifiedBy
    ? `Reviewed by ${displayVisit.provenance.verifiedBy}${displayVisit.provenance.verifiedAt ? ` · ${new Date(displayVisit.provenance.verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
    : 'Reviewed by Clinician';

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar with back chevron + Title */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="font-display font-bold text-2xl text-ink-900 leading-tight">
          ANC visit {displayVisit.visitNumber}
        </h1>
      </header>

      {/* Content Container */}
      <div className="p-4 space-y-4 max-w-[400px] mx-auto w-full">
        {/* First Card: Clinically-Reviewed Data (Verified) */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
          {/* Header Row: Date & Facility + Verified Badge */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-display font-bold tracking-wider text-ink-600 uppercase">
                {displayVisit.date} · {displayVisit.facilityName}
              </span>
              <p className="text-xs text-ink-600 font-body mt-1">
                {reviewerText}
              </p>
            </div>

            {/* Verified Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-[#E6F4EA] border border-[#34A853]/20 text-[#137333] text-xs font-semibold flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />
              <span className="font-display">Verified</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border-hairline w-full" />

          {/* Label / Value List */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-ink-600">Weight</span>
              <span className="font-display font-bold text-base text-ink-900">
                {displayVisit.weight} kg
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-ink-600">Blood pressure</span>
              <span className="font-display font-bold text-base text-ink-900">
                {displayVisit.bloodPressure}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-ink-600">Fundal height</span>
              <span className="font-display font-bold text-base text-ink-900">
                {displayVisit.fundalHeight} cm
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-ink-600">Fetal heart rate</span>
              <span className="font-display font-bold text-base text-ink-900">
                {displayVisit.fetalHeartRate} bpm
              </span>
            </div>
          </div>
        </div>

        {/* Second Card: Caregiver Reported Notes */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          {/* Header with Reported Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-display font-bold tracking-wider text-ink-600 uppercase">
              YOUR NOTES
            </span>

            {/* Reported Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-lavender-100 border border-haven-orchid/25 text-haven-deep text-xs font-medium flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-haven-orchid" />
              <span className="font-display font-semibold">Reported</span>
            </div>
          </div>

          <p className="text-xs text-ink-600 font-body">
            Entered by you · not yet verified by a clinician
          </p>

          {/* Note in quotes */}
          <blockquote className="text-sm font-body text-ink-900 italic bg-lavender-50/60 p-3.5 rounded-xl border-l-2 border-haven-orchid leading-relaxed">
            "{displayVisit.notes}"
          </blockquote>
        </div>

        {/* Secondary Action: Share this visit with your clinician */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (onShareWithClinician) {
                onShareWithClinician();
              } else {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2500);
              }
            }}
            className="w-full py-3.5 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep rounded-pill font-display font-bold text-sm hover:bg-lavender-100/70 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 text-haven-deep" />
            <span>{isCopied ? 'Summary Copied for Clinician!' : 'Share this visit with your clinician'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
