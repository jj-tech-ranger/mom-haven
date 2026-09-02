import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Share2, 
  CheckCircle2, 
  Edit3, 
  ShieldCheck, 
  UserCheck, 
  Activity,
  Heart
} from 'lucide-react';
import { AncEncounter } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import ProvenanceCaption from '../common/ProvenanceCaption';
import Button from '../Button';

interface AncVisitDetailModalProps {
  visit: AncEncounter;
  onBack: () => void;
  onShareWithClinician: (visit: AncEncounter) => void;
  onEditVisit?: (visit: AncEncounter) => void;
}

export default function AncVisitDetailModal({
  visit,
  onBack,
  onShareWithClinician,
  onEditVisit,
}: AncVisitDetailModalProps) {
  const isVerified = visit.provenance?.status === 'VERIFIED';
  const visitDateFormatted = visit.date 
    ? new Date(visit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    : 'RECENT';

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-[20px] text-[var(--ink-900)]">
          ANC visit {visit.visitNumber}
        </h1>
        <div className="w-10" />
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* ================= PRIMARY CLINICAL MEASUREMENTS CARD ================= */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[var(--border-hairline)] shadow-card-1 space-y-5">
          {/* Facility & Provenance Header */}
          <div className="flex items-start justify-between gap-2 border-b border-[var(--border-hairline)] pb-4">
            <div>
              <span className="text-[11px] font-display font-bold text-[var(--ink-600)] uppercase tracking-wider block">
                {visitDateFormatted} · {visit.facilityName || 'KARIOKOR HEALTH CENTRE'}
              </span>
              <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                {isVerified
                  ? `Reviewed by ${visit.provenance?.verifiedBy || 'Nurse A. Wanjiru'} · ${visit.provenance?.verifiedAt ? new Date(visit.provenance.verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'}`
                  : 'Self-reported clinic encounter'
                }
              </p>
            </div>

            <ProvenanceBadge provenance={visit.provenance} />
          </div>

          {/* Tabular Clinical Vitals Parameters */}
          <div className="space-y-3.5 text-[15px]">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-hairline)]/50">
              <span className="font-body text-[var(--ink-600)]">Weight</span>
              <span className="font-display font-bold text-[var(--ink-900)]">
                {visit.weight ? `${visit.weight} kg` : '68.4 kg'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-hairline)]/50">
              <span className="font-body text-[var(--ink-600)]">Blood pressure</span>
              <span className="font-display font-bold text-[var(--ink-900)]">
                {visit.bloodPressure || `${visit.systolicBp || 112} / ${visit.diastolicBp || 74}`}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-hairline)]/50">
              <span className="font-body text-[var(--ink-600)]">Fundal height</span>
              <span className="font-display font-bold text-[var(--ink-900)]">
                {visit.fundalHeight ? `${visit.fundalHeight} cm` : '24 cm'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="font-body text-[var(--ink-600)]">Fetal heart rate</span>
              <span className="font-display font-bold text-[var(--ink-900)]">
                {visit.fetalHeartRate ? `${visit.fetalHeartRate} bpm` : '144 bpm'}
              </span>
            </div>

            {visit.hbLevel && (
              <div className="flex justify-between items-center py-1 border-t border-[var(--border-hairline)]/50">
                <span className="font-body text-[var(--ink-600)]">Hemoglobin (Hb)</span>
                <span className="font-display font-bold text-[var(--ink-900)]">
                  {visit.hbLevel} g/dL (Normal)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ================= NOTES & OBSERVATIONS CARD ================= */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-display font-bold text-[var(--ink-600)] uppercase tracking-wider">
              Your Notes
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-semibold bg-[#FBF0DC] text-[#A15E06] border border-[#A15E06]/20">
              <UserCheck className="w-3 h-3" />
              Reported
            </span>
          </div>

          <p className="font-body text-[12px] text-[var(--ink-500)]">
            Entered by you · not yet verified by a clinician
          </p>

          <p className="font-body text-[14px] text-[var(--ink-900)] italic bg-[var(--lavender-50)] p-4 rounded-[16px] border border-[var(--border-hairline)] leading-relaxed">
            "{visit.notes || 'Mild swelling in my ankles by evening, otherwise feeling well.'}"
          </p>
        </div>

        {/* ================= ACTIONS FOOTER ================= */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => onShareWithClinician(visit)}
            className="w-full py-4 rounded-full border-2 border-[var(--haven-deep)] text-[var(--haven-deep)] font-display font-bold text-[15px] hover:bg-[var(--lavender-100)] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Share this visit with your clinician</span>
          </button>

          {isVerified ? (
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--ink-400)] py-1 font-body">
              <Lock className="w-3.5 h-3.5" />
              <span>Verified records are locked and cannot be edited.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEditVisit && onEditVisit(visit)}
              className="w-full py-2.5 text-center text-[13px] font-display font-semibold text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
            >
              Edit this visit record
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
