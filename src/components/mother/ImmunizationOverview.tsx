import React from 'react';
import { ChevronLeft, AlertTriangle, Syringe, CheckCircle2, Clock, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { ChildDoc, ImmunizationRecordDoc } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

interface ImmunizationOverviewProps {
  child?: ChildDoc | null;
  records?: ImmunizationRecordDoc[];
  onBack: () => void;
  onSelectRecord: (record: ImmunizationRecordDoc) => void;
  onAddVaccine: () => void;
  onOpenCatchUp: (vaccineName: string) => void;
  onAskHaven?: (query: string) => void;
}

export const ImmunizationOverview: React.FC<ImmunizationOverviewProps> = ({
  child,
  records = [],
  onBack,
  onSelectRecord,
  onAddVaccine,
  onOpenCatchUp,
  onAskHaven,
}) => {
  // Sample MOH KEPI schedule if no records exist
  const overdueVaccines = [
    {
      id: 'imm_overdue_1',
      childId: child?.id || 'default',
      vaccine: 'Measles Rubella (MR) — 9 months',
      dose: '1st dose',
      minimumEligibleDate: '2026-08-01',
      scheduledDate: '2026-08-01',
      recommendedActionDate: '2026-08-20',
      status: 'missed' as const,
      dueNote: 'Was due 3 weeks ago',
      provenance: { source: 'reported_caregiver' as const, recordedAt: '2026-08-10' },
    },
  ];

  const completedVaccines = [
    {
      id: 'imm_comp_1',
      childId: child?.id || 'default',
      vaccine: 'PCV — 3rd dose',
      dose: '3rd dose',
      dateGiven: '2 Mar 2026',
      minimumEligibleDate: '2026-03-01',
      scheduledDate: '2026-03-02',
      recommendedActionDate: '2026-03-02',
      status: 'given' as const,
      timeAgo: 'Given 14 weeks · 2 Mar 2026',
      provenance: {
        source: 'verified_clinician' as const,
        clinicianName: 'Nurse A. Wanjiru',
        facilityName: 'Kariokor Health Centre',
        recordedAt: '2026-03-02',
      },
    },
    {
      id: 'imm_comp_2',
      childId: child?.id || 'default',
      vaccine: 'DPT-HepB-Hib — 3rd dose',
      dose: '3rd dose',
      dateGiven: '2 Mar 2026',
      minimumEligibleDate: '2026-03-01',
      scheduledDate: '2026-03-02',
      recommendedActionDate: '2026-03-02',
      status: 'given' as const,
      timeAgo: 'Given 14 weeks · 2 Mar 2026',
      provenance: {
        source: 'reported_caregiver' as const,
        recordedAt: '2026-03-02',
      },
    },
  ];

  const upcomingVaccines = [
    {
      id: 'imm_up_1',
      childId: child?.id || 'default',
      vaccine: 'Vitamin A supplementation',
      dose: '100,000 IU',
      minimumEligibleDate: '2026-11-01',
      scheduledDate: '2026-11-14',
      recommendedActionDate: '2026-11-14',
      status: 'upcoming' as const,
      dueNote: 'Due at 12 months',
      provenance: { source: 'reported_caregiver' as const, recordedAt: '2026-08-01' },
    },
  ];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Immunization</h1>
        <button
          onClick={onAddVaccine}
          className="w-10 h-10 rounded-full bg-white border border-haven-deep/20 shadow-sm flex items-center justify-center text-haven-deep active:scale-95 transition-transform"
          title="Add vaccine record"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Overdue Alert Banner (M-IMM-001) */}
      <div
        onClick={() => onOpenCatchUp('Measles Rubella (MR)')}
        className="bg-red-50/90 border border-red-200 rounded-[20px] p-4 flex items-start gap-3.5 shadow-sm cursor-pointer hover:bg-red-100/60 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-display font-bold text-sm text-red-950">1 vaccine is overdue</h4>
          <p className="font-body text-xs text-red-800 leading-relaxed mt-0.5">
            Book a catch-up visit — it's safe to catch up now.
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-red-400 flex-shrink-0 self-center" />
      </div>

      {/* OVERDUE Section */}
      <div className="space-y-2.5">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase">
          OVERDUE
        </span>
        {overdueVaccines.map((v) => (
          <div
            key={v.id}
            onClick={() => onOpenCatchUp(v.vaccine)}
            className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between border-l-4 border-l-red-500 cursor-pointer hover:border-haven-orchid/40 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0 text-red-600">
                <Syringe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900 leading-snug">
                  {v.vaccine}
                </h4>
                <p className="font-body text-xs text-ink-600 mt-0.5">{v.dueNote}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-red-100 text-red-700 text-xs font-display font-bold">
              Overdue
            </span>
          </div>
        ))}
      </div>

      {/* COMPLETED Section */}
      <div className="space-y-2.5">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase">
          COMPLETED
        </span>
        <div className="space-y-2.5">
          {completedVaccines.map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectRecord(v as unknown as ImmunizationRecordDoc)}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900 leading-snug">
                    {v.vaccine}
                  </h4>
                  <p className="font-body text-xs text-ink-600 mt-0.5">{v.timeAgo}</p>
                </div>
              </div>
              <ProvenanceBadge provenance={v.provenance} />
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING Section */}
      <div className="space-y-2.5">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase">
          UPCOMING
        </span>
        {upcomingVaccines.map((v) => (
          <div
            key={v.id}
            onClick={() => onSelectRecord(v as unknown as ImmunizationRecordDoc)}
            className="bg-white/80 rounded-[20px] border border-border-hairline shadow-sm p-4 flex items-center justify-between opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center flex-shrink-0 text-haven-orchid">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900 leading-snug">
                  {v.vaccine}
                </h4>
                <p className="font-body text-xs text-ink-600 mt-0.5">{v.dueNote}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-600" />
          </div>
        ))}
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          onClick={onAddVaccine}
          className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Record vaccine given</span>
        </button>
      </div>
    </div>
  );
};
