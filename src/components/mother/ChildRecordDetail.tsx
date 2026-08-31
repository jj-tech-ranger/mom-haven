import React from 'react';
import { ChevronLeft, Baby, Calendar, Share2, MapPin, CheckCircle2 } from 'lucide-react';
import { ProvenanceBadge } from '../ProvenanceBadge';
import { ProvenanceCaption } from '../ProvenanceCaption';

interface ChildRecordDetailProps {
  record: any;
  onBack: () => void;
  onShareWithClinician?: () => void;
}

export const ChildRecordDetail: React.FC<ChildRecordDetailProps> = ({
  record,
  onBack,
  onShareWithClinician,
}) => {
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
        <h1 className="font-display font-bold text-xl text-ink-900">Child Record</h1>
        <div className="w-10" />
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                {record?.title || 'Child Health Encounter'}
              </h2>
              <p className="font-body text-xs text-ink-600 mt-0.5">{record?.date}</p>
            </div>
          </div>
          <ProvenanceBadge provenance={record?.provenance} />
        </div>

        <ProvenanceCaption provenance={record?.provenance} />
      </div>

      {/* Details List */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-ink-900 uppercase tracking-wider">
          Encounter Record Details
        </h3>

        <div className="divide-y divide-border-hairline/60 text-sm">
          <div className="py-3 flex justify-between">
            <span className="text-ink-600">Encounter Type</span>
            <span className="font-display font-bold text-ink-900">
              {record?.category || 'Clinical Encounter'}
            </span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-600">Facility</span>
            <span className="font-display font-bold text-ink-900">
              {record?.provenance?.facilityName || 'Kariokor Health Centre'}
            </span>
          </div>
          {record?.provenance?.clinicianName && (
            <div className="py-3 flex justify-between">
              <span className="text-ink-600">Reviewed By</span>
              <span className="font-display font-bold text-ink-900">
                {record.provenance.clinicianName}
              </span>
            </div>
          )}
          <div className="py-3 flex flex-col gap-1">
            <span className="text-ink-600">Findings & Notes</span>
            <p className="font-body text-ink-900 text-xs bg-lavender-50/70 p-3 rounded-xl border border-border-hairline mt-1">
              {record?.summary || 'Routine checkup completed with all age-appropriate interventions.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          onClick={onShareWithClinician}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Share with clinician</span>
        </button>
      </div>
    </div>
  );
};
