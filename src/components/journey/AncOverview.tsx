import React from 'react';
import { ArrowLeft, Plus, Calendar, ShieldCheck, UserCheck, ChevronRight, Lock } from 'lucide-react';
import { AncEncounter } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';

interface AncOverviewProps {
  pregnancyId: string;
  encounters: AncEncounter[];
  onBack: () => void;
  onAddNewVisit: () => void;
  onSelectVisit: (visit: AncEncounter) => void;
}

// WHO 8-contact Antenatal Care guidelines recommended schedule
const WHO_8_SCHEDULE = [
  { visitNumber: 1, idealTiming: '< 12 weeks', focus: 'Baseline health assessment, dating scan, lab profiles, IFAS' },
  { visitNumber: 2, idealTiming: '20 weeks', focus: 'Anomaly scan, maternal wellbeing, Td booster 1, IPTp 1' },
  { visitNumber: 3, idealTiming: '26 weeks', focus: 'Glucose screening, anemia check, fetal growth palpation' },
  { visitNumber: 4, idealTiming: '30 weeks', focus: 'Pre-eclampsia check, fetal movement assessment, Td booster 2' },
  { visitNumber: 5, idealTiming: '34 weeks', focus: 'Fetal presentation, growth tracking, repeat Hb screening' },
  { visitNumber: 6, idealTiming: '36 weeks', focus: 'Birth preparedness plan finalization, pelvis assessment' },
  { visitNumber: 7, idealTiming: '38 weeks', focus: 'Labor signs awareness, emergency logistics review' },
  { visitNumber: 8, idealTiming: '40 weeks', focus: 'Term assessment, delivery transition, post-term planning' },
];

export default function AncOverview({
  pregnancyId,
  encounters,
  onBack,
  onAddNewVisit,
  onSelectVisit,
}: AncOverviewProps) {
  const completedCount = encounters.length;
  const progressRatio = Math.min(1, completedCount / 8);

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
            Antenatal Care (ANC)
          </h1>
          <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
            WHO &amp; MOH 8-Contact Model
          </span>
        </div>
        <button
          type="button"
          onClick={onAddNewVisit}
          className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-5 max-w-lg mx-auto">
        {/* Progress Tracker Card */}
        <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                Adherence Tracker
              </span>
              <h3 className="font-display font-bold text-[20px] text-[var(--ink-900)]">
                {completedCount} of 8 Contacts Logged
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[12px] font-display font-bold">
              {Math.round(progressRatio * 100)}% Complete
            </span>
          </div>

          {/* 8-Segment Progress Bar */}
          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {WHO_8_SCHEDULE.map((s, idx) => {
              const hasEncounter = encounters.some(e => e.visitNumber === s.visitNumber);
              return (
                <div
                  key={s.visitNumber}
                  className={`h-2.5 rounded-full transition-all ${
                    hasEncounter
                      ? 'bg-emerald-500 shadow-xs'
                      : idx === completedCount
                      ? 'bg-[var(--haven-deep)] ring-2 ring-purple-200'
                      : 'bg-[var(--lavender-200)]'
                  }`}
                  title={`Contact ${s.visitNumber} (${s.idealTiming})`}
                />
              );
            })}
          </div>

          <p className="font-body text-[12px] text-[var(--ink-600)]">
            Regular antenatal contacts ensure early detection of complications and optimal health for you and your baby.
          </p>
        </div>

        {/* List of 8 Contacts */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-[16px] text-[var(--ink-900)] px-1">
            Schedule of Contacts
          </h3>

          {WHO_8_SCHEDULE.map(scheduleItem => {
            const recorded = encounters.find(e => e.visitNumber === scheduleItem.visitNumber);

            return (
              <div
                key={scheduleItem.visitNumber}
                onClick={() => {
                  if (recorded) {
                    onSelectVisit(recorded);
                  } else {
                    onAddNewVisit();
                  }
                }}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer ${
                  recorded
                    ? 'bg-white border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)]'
                    : 'bg-white/80 border-dashed border-[var(--border-hairline)] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-[13px] shrink-0 ${
                        recorded
                          ? recorded.provenance?.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                          : 'bg-[var(--lavender-100)] text-[var(--ink-600)]'
                      }`}
                    >
                      #{scheduleItem.visitNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                          Contact {scheduleItem.visitNumber} ({scheduleItem.idealTiming})
                        </h4>
                        {recorded && (
                          <ProvenanceBadge provenance={recorded.provenance} />
                        )}
                      </div>

                      <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                        {recorded ? (
                          <span>
                            Visited on {new Date(recorded.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {recorded.facilityName ? ` at ${recorded.facilityName}` : ''}
                          </span>
                        ) : (
                          scheduleItem.focus
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-400)] shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating CTA */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={onAddNewVisit}
            className="w-full py-3.5 flex items-center justify-center gap-2 shadow-card-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log ANC Visit</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
