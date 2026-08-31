import React from 'react';
import {
  ChevronLeft,
  Heart,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { PostnatalEncounterDoc, ChildDoc } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';
import EmptyState from '../EmptyState';

interface PncOverviewProps {
  child?: ChildDoc | null;
  encounters?: PostnatalEncounterDoc[] | null;
  onBack: () => void;
  onAddEncounter: () => void;
  onSelectEncounter: (encounter: PostnatalEncounterDoc) => void;
}

export const PncOverview: React.FC<PncOverviewProps> = ({
  child,
  encounters,
  onBack,
  onAddEncounter,
  onSelectEncounter,
}) => {
  const currentChild = child || {
    id: 'child_default',
    name: 'Baby Amara',
    dateOfBirth: '2026-01-14',
    sex: 'girl' as const,
    motherId: 'm1',
    createdAt: '2026-01-14',
  };

  const pncSchedule = [
    {
      id: '48h',
      label: 'Contact 1',
      timing: 'Within 48h',
      focus: 'Maternal recovery, bleeding & newborn latch',
    },
    {
      id: '1-2w',
      label: 'Contact 2',
      timing: '1–2 Weeks',
      focus: 'Cord separation, jaundice & maternal mood',
    },
    {
      id: '4-6w',
      label: 'Contact 3',
      timing: '4–6 Weeks',
      focus: 'Maternal FP, 6-week infant immunization',
    },
    {
      id: '4-6mo',
      label: 'Contact 4',
      timing: '4–6 Months',
      focus: 'Development & complementary feeding prep',
    },
  ];

  // Default sample encounters if none passed or empty state demonstration
  const sampleEncounters: PostnatalEncounterDoc[] = encounters || [
    {
      id: 'pnc-1',
      childId: currentChild.id,
      visit: '48h',
      date: '2026-01-16',
      motherFindings: 'Normal lochia bleeding. BP 115/75. Uterus well contracted. Initiated exclusive breastfeeding.',
      babyFindings: 'Weight 3.25kg. Cord clean and dry. No jaundice. Active suckling.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: 'nurse_mary',
        enteredAt: '2026-01-16T10:30:00Z',
        verifiedBy: 'Nurse Mary Wanjiku',
        verifiedAt: '2026-01-16T11:00:00Z',
        facilityName: 'Kariokor Health Centre',
      },
    },
    {
      id: 'pnc-2',
      childId: currentChild.id,
      visit: '1-2w',
      date: '2026-01-26',
      motherFindings: 'EPDS score 2 (low risk). Lochia serosa. Surgical wound healed cleanly.',
      babyFindings: 'Weight 3.55kg. Umbilical stump separated without discharge. Feeding well.',
      provenance: {
        status: 'VERIFIED',
        enteredBy: 'nurse_mary',
        enteredAt: '2026-01-26T09:15:00Z',
        verifiedBy: 'Nurse Mary Wanjiku',
        verifiedAt: '2026-01-26T09:40:00Z',
        facilityName: 'Kariokor Health Centre',
      },
    },
    {
      id: 'pnc-3',
      childId: currentChild.id,
      visit: '4-6w',
      date: '2026-02-24',
      motherFindings: 'Counselled on Postpartum Family Planning (Progestin-only implant selected). Routine vitals normal.',
      babyFindings: 'Weight 4.40kg. 6-Week KEPI vaccines administered (Penta 1, OPV 1, PCV 1, Rota 1).',
      provenance: {
        status: 'REPORTED',
        enteredBy: 'mother',
        enteredAt: '2026-02-24T14:00:00Z',
        verifiedBy: null,
        verifiedAt: null,
        facilityName: 'Kariokor Health Centre',
      },
    },
  ];

  const attendedCount = sampleEncounters.length;

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
            Postnatal Care (PNC)
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            Kenya MOH 4-Contact Mother & Infant Schedule
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Next Visit Banner */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-lavender-100">
              MOH Postnatal Progress
            </span>
            <span className="text-xs font-display font-bold px-2.5 py-0.5 rounded-full bg-white/20">
              {attendedCount} of 4 Contacts
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base leading-tight">
                {attendedCount >= 4
                  ? 'All 4 Core PNC Contacts Completed!'
                  : 'Contact 4 Due at 4–6 Months'}
              </h3>
              <p className="font-body text-xs text-lavender-100 mt-0.5">
                {attendedCount >= 4
                  ? 'Maternal recovery confirmed & infant transitioning safely'
                  : 'Focus on growth velocity & complementary feeding introduction'}
              </p>
            </div>
          </div>
        </div>

        {/* 4-Step Mini Haven Ribbon Timeline */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
          <span className="text-xs font-display font-bold text-ink-900 block">
            4-Contact Postnatal Schedule
          </span>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {pncSchedule.map((step, idx) => {
              const isAttended = idx < attendedCount;
              const isCurrent = idx === attendedCount;

              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isAttended
                      ? 'bg-haven-deep text-white border-haven-deep'
                      : isCurrent
                      ? 'bg-lavender-100 border-haven-orchid text-haven-deep font-semibold'
                      : 'bg-lavender-50/60 border-border-hairline text-ink-600'
                  }`}
                >
                  <span className="text-[10px] font-display font-bold block uppercase tracking-tight">
                    {step.label}
                  </span>
                  <span
                    className={`text-[11px] font-body block mt-0.5 font-bold ${
                      isAttended ? 'text-white' : isCurrent ? 'text-haven-deep' : 'text-ink-700'
                    }`}
                  >
                    {step.timing}
                  </span>
                  <div className="mt-1 flex justify-center">
                    {isAttended ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-haven-orchid animate-pulse" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-lavender-200 mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Encounter List Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h3 className="font-display font-bold text-base text-ink-900">
            Recorded PNC Encounters
          </h3>
          <span className="font-body text-xs font-semibold text-haven-deep">
            {sampleEncounters.length} logged
          </span>
        </div>

        {/* Encounters List / Empty State */}
        {sampleEncounters.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No PNC encounters logged yet"
            message="Record your 48h, 2-week, or 6-week postnatal checkup to track recovery."
            actionLabel="Add PNC encounter"
            onAction={onAddEncounter}
          />
        ) : (
          <div className="space-y-3">
            {sampleEncounters.map((encounter) => {
              const visitLabel =
                encounter.visit === '48h'
                  ? 'Contact 1 (Within 48h)'
                  : encounter.visit === '1-2w'
                  ? 'Contact 2 (1–2 Weeks)'
                  : encounter.visit === '4-6w'
                  ? 'Contact 3 (4–6 Weeks)'
                  : 'Contact 4 (4–6 Months)';

              return (
                <div
                  key={encounter.id}
                  onClick={() => onSelectEncounter(encounter)}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 hover:border-haven-orchid/40 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-ink-900">
                          {visitLabel}
                        </h4>
                        <span className="text-xs font-body text-ink-600">
                          · {new Date(encounter.date).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="font-body text-xs text-ink-600 mt-0.5">
                        {encounter.provenance?.facilityName || 'Kariokor Health Centre'}
                      </p>
                    </div>

                    <ProvenanceBadge provenance={encounter.provenance} compact />
                  </div>

                  <div className="p-2.5 rounded-card bg-lavender-50/70 border border-border-hairline text-xs font-body text-ink-700 leading-snug line-clamp-2">
                    <span className="font-semibold text-ink-900">Mother:</span> {encounter.motherFindings}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border-hairline/60 text-xs font-display font-semibold text-haven-deep">
                    <span>View encounter record</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            onClick={onAddEncounter}
            className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add PNC encounter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
