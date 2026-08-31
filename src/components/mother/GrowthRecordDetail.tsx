import React from 'react';
import { ChevronLeft, Scale, Calendar, Share2, MapPin, TrendingUp } from 'lucide-react';
import { ProvenanceBadge } from '../ProvenanceBadge';
import { ProvenanceCaption } from '../ProvenanceCaption';

interface GrowthRecordDetailProps {
  record?: any;
  onBack: () => void;
  onShareWithClinician?: () => void;
}

export const GrowthRecordDetail: React.FC<GrowthRecordDetailProps> = ({
  record,
  onBack,
  onShareWithClinician,
}) => {
  const sampleRec = record || {
    weightKg: 7.4,
    heightCm: 67.5,
    headCircumferenceCm: 43.0,
    date: '15 Aug 2026',
    zScoreNote: 'Weight-for-age Z-score: +0.2 SD (Healthy standard)',
    provenance: {
      source: 'verified_clinician' as const,
      clinicianName: 'Nurse A. Wanjiru',
      facilityName: 'Kariokor Health Centre',
      recordedAt: '2026-08-15',
    },
  };

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
        <h1 className="font-display font-bold text-xl text-ink-900">Growth Record</h1>
        <div className="w-10" />
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                {sampleRec.weightKg} kg · {sampleRec.heightCm} cm
              </h2>
              <p className="font-body text-xs text-ink-600 mt-0.5">{sampleRec.date}</p>
            </div>
          </div>
          <ProvenanceBadge provenance={sampleRec.provenance} />
        </div>

        <ProvenanceCaption provenance={sampleRec.provenance} />
      </div>

      {/* Details & Z-Score note */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-ink-900 uppercase tracking-wider">
          Growth Measurements
        </h3>

        <div className="divide-y divide-border-hairline/60 text-sm">
          <div className="py-3 flex justify-between">
            <span className="text-ink-600">Weight</span>
            <span className="font-display font-bold text-ink-900">{sampleRec.weightKg} kg</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-600">Length / Height</span>
            <span className="font-display font-bold text-ink-900">{sampleRec.heightCm} cm</span>
          </div>
          {sampleRec.headCircumferenceCm && (
            <div className="py-3 flex justify-between">
              <span className="text-ink-600">Head Circumference</span>
              <span className="font-display font-bold text-ink-900">{sampleRec.headCircumferenceCm} cm</span>
            </div>
          )}
          <div className="py-3 flex justify-between">
            <span className="text-ink-600">WHO Z-Score / Percentile</span>
            <span className="font-display font-bold text-emerald-700">Normal (50th percentile)</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-600">Facility</span>
            <span className="font-display font-bold text-ink-900">
              {sampleRec.provenance?.facilityName || 'Kariokor Health Centre'}
            </span>
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
