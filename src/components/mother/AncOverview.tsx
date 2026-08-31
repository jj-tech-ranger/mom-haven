import React from 'react';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Heart,
  FileSpreadsheet,
} from 'lucide-react';
import { AncEncounterDoc } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';
import EmptyState from '../EmptyState';

interface AncOverviewProps {
  encounters: AncEncounterDoc[];
  currentWeek?: number;
  onBack: () => void;
  onAddVisit: () => void;
  onSelectVisit: (visit: AncEncounterDoc) => void;
}

export const AncOverview: React.FC<AncOverviewProps> = ({
  encounters,
  currentWeek = 24,
  onBack,
  onAddVisit,
  onSelectVisit,
}) => {
  const attendedCount = encounters.length;
  const targetCount = 8;
  const progressPct = Math.min(100, Math.round((attendedCount / targetCount) * 100));

  // Determine next visit based on attended count or current week
  const nextVisitNumber = attendedCount + 1 <= 8 ? attendedCount + 1 : 8;

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
              ANC Overview
            </h1>
            <p className="font-body text-xs text-ink-600">
              MOH 216 Clinical Records & Schedule
            </p>
          </div>
        </div>

        <button
          onClick={onAddVisit}
          className="w-9 h-9 rounded-full bg-haven-deep text-white flex items-center justify-center hover:bg-haven-orchid transition-colors cursor-pointer shadow-sm"
          title="Add ANC Visit"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {/* 1. Contacts-Attended Counter Banner (of 8) */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-lavender-200 font-semibold font-body">
                MOH 216 Antenatal Standard
              </span>
              <h2 className="font-display font-bold text-2xl mt-0.5">
                {attendedCount} of {targetCount} Contacts
              </h2>
              <p className="text-xs text-lavender-100 font-body mt-1">
                {attendedCount >= 4
                  ? 'Great progress! You are on track with Kenya clinical targets.'
                  : 'Routine visits ensure optimal maternal & newborn health.'}
              </p>
            </div>

            {/* Circular Progress Ring */}
            <div className="w-14 h-14 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeDasharray={`${progressPct}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-display font-bold text-xs text-white">
                {progressPct}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Next-Visit Banner */}
        {nextVisitNumber <= 8 && (
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-haven-orchid" />
              </div>
              <div>
                <span className="text-[10px] font-display font-bold text-haven-orchid uppercase tracking-wider">
                  Upcoming Next
                </span>
                <h3 className="font-display font-bold text-sm text-ink-900">
                  ANC Contact {nextVisitNumber}
                </h3>
                <p className="font-body text-xs text-ink-600">
                  Includes BP check, IPTp-SP malaria dose & growth review.
                </p>
              </div>
            </div>

            <button
              onClick={onAddVisit}
              className="px-3 py-1.5 rounded-pill bg-lavender-100 border border-border-hairline text-haven-deep font-display font-bold text-xs hover:bg-lavender-200 transition-colors cursor-pointer flex-shrink-0"
            >
              Log Visit
            </button>
          </div>
        )}

        {/* 3. Primary Action Button */}
        <button
          onClick={onAddVisit}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-sm rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add ANC visit</span>
        </button>

        {/* 4. Visits List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-base text-ink-900">
              Recorded Visits History
            </h3>
            <span className="text-xs font-body text-ink-600">
              {encounters.length} recorded
            </span>
          </div>

          {encounters.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-6">
              <EmptyState
                icon={Stethoscope}
                title="No ANC Visits Logged Yet"
                message="Start tracking your prenatal checkups. You can log vital measurements from your Ministry of Health booklet."
                actionLabel="Log First ANC Visit"
                onAction={onAddVisit}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {encounters.map((encounter, idx) => (
                <div
                  key={encounter.id || idx}
                  onClick={() => onSelectVisit(encounter)}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 hover:border-haven-orchid/40 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-ink-900">
                          ANC Visit {encounter.visitNumber || idx + 1}
                        </span>
                        {encounter.gestationWeeks && (
                          <span className="px-2 py-0.5 rounded-pill bg-lavender-100 text-haven-deep text-[10px] font-display font-semibold">
                            Week {encounter.gestationWeeks}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-ink-600 mt-0.5">
                        {encounter.date ? new Date(encounter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'} · {encounter.facilityName || 'Health Centre'}
                      </p>
                    </div>

                    <ProvenanceBadge provenance={encounter.provenance} compact showCaption={false} />
                  </div>

                  {/* Vitals Summary Pill Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-lavender-50/70 p-2.5 rounded-xl text-center">
                    <div>
                      <span className="block text-[10px] text-ink-600 font-body">Weight</span>
                      <span className="font-display font-bold text-xs text-ink-900">
                        {encounter.weight ? `${encounter.weight} kg` : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-ink-600 font-body">BP</span>
                      <span className="font-display font-bold text-xs text-ink-900">
                        {encounter.bloodPressure || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-ink-600 font-body">Fundal</span>
                      <span className="font-display font-bold text-xs text-ink-900">
                        {encounter.fundalHeight ? `${encounter.fundalHeight} cm` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom link */}
                  <div className="flex items-center justify-between text-xs font-display font-semibold text-haven-orchid pt-1">
                    <span>View clinical detail & notes</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
