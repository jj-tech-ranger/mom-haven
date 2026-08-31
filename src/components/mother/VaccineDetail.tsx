import React from 'react';
import { ChevronLeft, Syringe, Calendar, MapPin, Edit3, Share2, CheckCircle2, Clock } from 'lucide-react';
import { ImmunizationRecordDoc } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';
import { ProvenanceCaption } from '../ProvenanceCaption';

interface VaccineDetailProps {
  record: ImmunizationRecordDoc;
  onBack: () => void;
  onEdit?: (record: ImmunizationRecordDoc) => void;
  onShareWithClinician?: () => void;
}

export const VaccineDetail: React.FC<VaccineDetailProps> = ({
  record,
  onBack,
  onEdit,
  onShareWithClinician,
}) => {
  const isVerified = record.provenance?.source === 'verified_clinician';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Vaccine Detail</h1>
        <div className="w-10" />
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
              <Syringe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                {record.vaccine}
              </h2>
              <p className="font-body text-xs text-ink-600 mt-0.5">{record.dose}</p>
            </div>
          </div>
          <ProvenanceBadge provenance={record.provenance} />
        </div>

        {/* Provenance Caption Component */}
        <ProvenanceCaption provenance={record.provenance} />
      </div>

      {/* Field List Details */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-ink-900 uppercase tracking-wider">
          Administration Information
        </h3>

        <div className="divide-y divide-border-hairline/60">
          <div className="py-3 flex justify-between items-center text-sm">
            <span className="text-ink-600 font-body">Date given</span>
            <span className="font-display font-bold text-ink-900">
              {record.dateGiven || record.scheduledDate || 'Not recorded'}
            </span>
          </div>

          <div className="py-3 flex justify-between items-center text-sm">
            <span className="text-ink-600 font-body">Next dose / follow-up</span>
            <span className="font-display font-bold text-haven-deep">
              {record.recommendedActionDate || 'As per KEPI schedule'}
            </span>
          </div>

          <div className="py-3 flex justify-between items-center text-sm">
            <span className="text-ink-600 font-body">Facility</span>
            <span className="font-display font-bold text-ink-900">
              {record.provenance?.facilityName || 'Kariokor Health Centre'}
            </span>
          </div>

          {record.provenance?.clinicianName && (
            <div className="py-3 flex justify-between items-center text-sm">
              <span className="text-ink-600 font-body">Administering clinician</span>
              <span className="font-display font-bold text-ink-900">
                {record.provenance.clinicianName}
              </span>
            </div>
          )}

          <div className="py-3 flex justify-between items-center text-sm">
            <span className="text-ink-600 font-body">Status</span>
            <span className="capitalize font-display font-bold text-emerald-700">
              {record.status}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {!isVerified && onEdit && (
          <button
            onClick={() => onEdit(record)}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Edit3 className="w-5 h-5" />
            <span>Edit record (Unverified)</span>
          </button>
        )}

        <button
          onClick={onShareWithClinician}
          className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share with clinician</span>
        </button>
      </div>
    </div>
  );
};
