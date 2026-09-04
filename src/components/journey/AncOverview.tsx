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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Official Kenya MOH Handbook Banner */}
      <div className="bg-slate-800 text-slate-200 px-4 py-1.5 border-b border-slate-700 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <span className="flex items-center gap-1.5 font-semibold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          REPUBLIC OF KENYA · MINISTRY OF HEALTH
        </span>
        <span className="text-slate-400 font-mono">MOH 216 · PART 2</span>
      </div>

      {/* Clinical Subheader */}
      <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h1 className="font-display font-bold text-base text-slate-900">
            Antenatal Care Register
          </h1>
          <span className="text-[11px] font-mono font-medium text-teal-700">
            WHO &amp; MOH 8-Contact Model
          </span>
        </div>
        <button
          type="button"
          onClick={onAddNewVisit}
          className="w-9 h-9 rounded-lg bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
          aria-label="Add new ANC visit"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* Clinical Adherence Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider">
                Clinical Adherence
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900">
                <span className="font-mono text-teal-700 font-bold">{completedCount}</span> of 8 Contacts Logged
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold">
              {Math.round(progressRatio * 100)}% Complete
            </span>
          </div>

          {/* 8-Segment Clinical Contact Indicators */}
          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {WHO_8_SCHEDULE.map((s, idx) => {
              const hasEncounter = encounters.some(e => e.visitNumber === s.visitNumber);
              return (
                <div
                  key={s.visitNumber}
                  className={`h-2 rounded transition-all ${
                    hasEncounter
                      ? 'bg-teal-700 shadow-xs'
                      : idx === completedCount
                      ? 'bg-amber-500 ring-2 ring-amber-200'
                      : 'bg-slate-200'
                  }`}
                  title={`Contact ${s.visitNumber} (${s.idealTiming})`}
                />
              );
            })}
          </div>

          <p className="font-body text-xs text-slate-600 leading-relaxed">
            Kenya National Guidelines recommend at least 8 contacts during pregnancy for early risk screening, nutritional IFAS supplements, malaria IPTp, and birth preparation.
          </p>
        </div>

        {/* Schedule of Contacts Table / Register */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              Contacts Registry
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              MOH 216 pp. 14–21
            </span>
          </div>

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
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  recorded
                    ? 'bg-white border-slate-200 shadow-xs hover:border-teal-700'
                    : 'bg-white/70 border-dashed border-slate-300 hover:bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                        recorded
                          ? recorded.provenance?.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      #{scheduleItem.visitNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          Contact {scheduleItem.visitNumber} <span className="font-mono text-xs font-normal text-slate-500">({scheduleItem.idealTiming})</span>
                        </h4>
                        {recorded && (
                          <ProvenanceBadge provenance={recorded.provenance} />
                        )}
                      </div>

                      <p className="font-body text-xs text-slate-600 mt-1">
                        {recorded ? (
                          <span className="font-mono text-[11px] text-slate-700">
                            Recorded: {new Date(recorded.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {recorded.bloodPressure ? ` · BP: ${recorded.bloodPressure}` : ''}
                            {recorded.facilityName ? ` · ${recorded.facilityName}` : ''}
                          </span>
                        ) : (
                          <span>{scheduleItem.focus}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddNewVisit}
            className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record ANC Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
}
