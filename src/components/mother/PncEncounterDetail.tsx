import React from 'react';
import {
  ChevronLeft,
  Heart,
  Baby,
  Building2,
  Calendar,
  Share2,
  Edit3,
  CheckCircle2,
  Lock,
  Activity,
  Smile,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { PostnatalEncounterDoc } from '../../types';
import { ProvenanceBadge, ProvenanceCaption } from '../ProvenanceBadge';

interface PncEncounterDetailProps {
  encounter: PostnatalEncounterDoc;
  onBack: () => void;
  onEdit?: () => void;
}

export const PncEncounterDetail: React.FC<PncEncounterDetailProps> = ({
  encounter,
  onBack,
  onEdit,
}) => {
  const isVerified = encounter.provenance?.status === 'VERIFIED';

  const visitTitle =
    encounter.visit === '48h'
      ? 'PNC Contact 1 (Within 48h)'
      : encounter.visit === '1-2w'
      ? 'PNC Contact 2 (1–2 Weeks)'
      : encounter.visit === '4-6w'
      ? 'PNC Contact 3 (4–6 Weeks)'
      : 'PNC Contact 4 (4–6 Months)';

  const formattedDate = new Date(encounter.date).toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
            PNC Encounter Detail
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            MOH 216 Clinical Record
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Top Header Card with Provenance Badge & Caption */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-body text-xs text-haven-deep font-semibold uppercase tracking-wider block">
                Postnatal Visit Record
              </span>
              <h2 className="font-display font-bold text-xl text-ink-900 leading-tight mt-0.5">
                {visitTitle}
              </h2>
            </div>
            <ProvenanceBadge provenance={encounter.provenance} compact />
          </div>

          <div className="flex items-center gap-4 text-xs font-body text-ink-600 pt-1 border-t border-border-hairline/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-haven-orchid" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-haven-orchid" />
              <span>{encounter.provenance?.facilityName || 'Kariokor Health Centre'}</span>
            </div>
          </div>

          <ProvenanceCaption provenance={encounter.provenance} />
        </div>

        {/* Maternal Findings Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-sm text-ink-900">
              Maternal Health Findings
            </h3>
          </div>

          <div className="p-3.5 rounded-2xl bg-lavender-50/70 border border-border-hairline text-sm font-body text-ink-800 leading-relaxed">
            {encounter.motherFindings}
          </div>
        </div>

        {/* Infant Findings Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Baby className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-sm text-ink-900">
              Infant Examination Findings
            </h3>
          </div>

          <div className="p-3.5 rounded-2xl bg-lavender-50/70 border border-border-hairline text-sm font-body text-ink-800 leading-relaxed">
            {encounter.babyFindings}
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center gap-3">
          {isVerified ? (
            <>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-sm text-ink-900">
                  Record Clinically Verified
                </h4>
                <p className="font-body text-xs text-ink-600">
                  This record is locked and part of the official MOH facility audit trail.
                </p>
              </div>
              <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-5 h-5 text-haven-orchid" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-sm text-ink-900">
                  Caregiver-Reported Entry
                </h4>
                <p className="font-body text-xs text-ink-600">
                  You can edit this entry until reviewed and signed off by your healthcare provider.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {!isVerified && onEdit && (
            <button
              onClick={onEdit}
              className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit encounter</span>
            </button>
          )}

          <button
            onClick={() => {
              // Clinical sharing stub
              console.log('Share encounter with clinician triggered');
            }}
            className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-haven-orchid" />
            <span>Share with clinician</span>
          </button>
        </div>
      </div>
    </div>
  );
};
