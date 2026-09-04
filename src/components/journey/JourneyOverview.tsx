import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  Calendar, 
  Scale, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  ShieldCheck, 
  FileText,
  Clock
} from 'lucide-react';
import { Pregnancy, AncEncounter } from '../../types';

interface JourneyOverviewProps {
  pregnancy: Pregnancy;
  ancEncounters: AncEncounter[];
  onOpenTimeline: () => void;
  onOpenAncOverview: () => void;
  onOpenHealthHistory: () => void;
  onOpenBirthPlan: () => void;
  onOpenDeliveryTransition: () => void;
}

export default function JourneyOverview({
  pregnancy,
  ancEncounters,
  onOpenTimeline,
  onOpenAncOverview,
  onOpenHealthHistory,
  onOpenBirthPlan,
  onOpenDeliveryTransition,
}: JourneyOverviewProps) {
  const [expandedTrimester, setExpandedTrimester] = useState<number>(() => {
    const weeks = pregnancy.gestationalAgeWeeks || 24;
    return weeks >= 28 ? 3 : weeks >= 13 ? 2 : 1;
  });

  const gestationalWeeks = pregnancy.gestationalAgeWeeks || 24;
  const daysRemaining = pregnancy.edd 
    ? Math.max(0, Math.ceil((new Date(pregnancy.edd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 112;

  const verifiedVisitsCount = ancEncounters.filter(e => e.provenance?.status === 'VERIFIED').length;

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
            Pregnancy Hub
          </span>
          <h1 className="font-display font-extrabold text-[24px] text-[var(--ink-900)] leading-tight">
            Your Pregnancy Journey
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenDeliveryTransition}
          className="px-3.5 py-1.5 rounded-full bg-[var(--lavender-100)] border border-[var(--haven-orchid)]/30 text-[var(--haven-deep)] font-display font-bold text-[12px] hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
        >
          Delivery Outcome
        </button>
      </div>

      {/* ================= M-PREG-002: CLINICAL VITALS SNAPSHOT ================= */}
      <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
              Clinical Snapshot
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenHealthHistory}
            className="text-[12px] font-display font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
          >
            Health history &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Gestational Age */}
          <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)]">
            <span className="text-[11px] font-semibold text-[var(--ink-600)] block">
              Gestational Age
            </span>
            <p className="font-display font-bold text-[17px] text-[var(--haven-deep)] mt-0.5">
              Week {gestationalWeeks}
            </p>
            <span className="text-[11px] text-[var(--ink-500)]">
              {daysRemaining} days to EDD
            </span>
          </div>

          {/* Last Recorded Weight */}
          <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)]">
            <span className="text-[11px] font-semibold text-[var(--ink-600)] block">
              Maternal Weight
            </span>
            <p className="font-display font-bold text-[17px] text-[var(--ink-900)] mt-0.5">
              {ancEncounters.length > 0 && ancEncounters[ancEncounters.length - 1]?.weight
                ? `${ancEncounters[ancEncounters.length - 1].weight} kg`
                : 'Not recorded'}
            </p>
            <span className="text-[11px] text-[var(--ink-500)] font-medium">
              {ancEncounters.length > 0 ? 'Latest checkup' : 'Log at ANC visit'}
            </span>
          </div>

          {/* Last Blood Pressure */}
          <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)]">
            <span className="text-[11px] font-semibold text-[var(--ink-600)] block">
              Blood Pressure
            </span>
            <p className="font-display font-bold text-[17px] text-[var(--ink-900)] mt-0.5">
              {ancEncounters.length > 0 && (ancEncounters[ancEncounters.length - 1]?.bloodPressure || (ancEncounters[ancEncounters.length - 1]?.systolicBp && ancEncounters[ancEncounters.length - 1]?.diastolicBp ? `${ancEncounters[ancEncounters.length - 1].systolicBp}/${ancEncounters[ancEncounters.length - 1].diastolicBp}` : null))
                ? (ancEncounters[ancEncounters.length - 1]?.bloodPressure || `${ancEncounters[ancEncounters.length - 1].systolicBp}/${ancEncounters[ancEncounters.length - 1].diastolicBp}`)
                : 'Not recorded'}
            </p>
            <span className="text-[11px] text-[var(--ink-500)] font-medium">
              {ancEncounters.length > 0 ? 'Normal range' : 'Log at ANC visit'}
            </span>
          </div>

          {/* Next Scheduled ANC */}
          <div className="p-3 bg-[var(--lavender-50)] rounded-[16px] border border-[var(--border-hairline)]">
            <span className="text-[11px] font-semibold text-[var(--ink-600)] block">
              Next ANC Visit
            </span>
            <p className="font-display font-bold text-[17px] text-[var(--haven-deep)] mt-0.5">
              Contact {Math.min(8, Math.max(1, ancEncounters.length + 1))}
            </p>
            <span className="text-[11px] text-[var(--ink-500)]">
              {pregnancy.edd ? new Date(pregnancy.edd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Upcoming'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= FAST NAVIGATION CARDS ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* Antenatal Care Card */}
        <div
          onClick={onOpenAncOverview}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Calendar className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            ANC Contacts (8)
          </h4>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            {ancEncounters.length} of 8 logged ({verifiedVisitsCount} verified)
          </p>
        </div>

        {/* Individualized Birth Plan Card */}
        <div
          onClick={onOpenBirthPlan}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)]">
              <FileText className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            Birth Plan (BPCR)
          </h4>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            Facility, driver &amp; emergency fund
          </p>
        </div>

        {/* Maternal Health History */}
        <div
          onClick={onOpenHealthHistory}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            Health History
          </h4>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            Blood group ({pregnancy.bloodGroup ? `${pregnancy.bloodGroup}${pregnancy.rhesusFactor || ''}` : 'Not set'}), allergies &amp; meds
          </p>
        </div>

        {/* Delivery / Birth Outcome */}
        <div
          onClick={onOpenDeliveryTransition}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Baby className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            {pregnancy.status === 'completed' ? 'Birth Outcome Record' : 'Log Delivery / Baby'}
          </h4>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            {pregnancy.status === 'completed' ? 'Delivered · View details' : 'Transition to child passport'}
          </p>
        </div>
      </div>

      {/* ================= M-PREG-001: TRIMESTER ACCORDION CARDS ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-extrabold text-[16px] text-[var(--ink-900)]">
            Trimester Progression
          </h3>
          <button
            type="button"
            onClick={onOpenTimeline}
            className="text-[12px] font-display font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
          >
            Vertical Timeline &rarr;
          </button>
        </div>

        {/* 1st Trimester */}
        <div className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 shadow-card-1">
          <div 
            onClick={() => setExpandedTrimester(expandedTrimester === 1 ? 0 : 1)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[12px]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                  First Trimester
                </h4>
                <span className="text-[12px] text-[var(--ink-600)] font-body">Weeks 1 – 12 · Completed</span>
              </div>
            </div>
            <span className="text-[12px] font-display font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Complete
            </span>
          </div>

          {expandedTrimester === 1 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] text-[13px] text-[var(--ink-700)] font-body space-y-1.5">
              <p>• Baseline laboratory tests completed (Blood group, Hb, HIV, Syphilis, Hepatitis B).</p>
              <p>• IFAS daily supplementation initiated.</p>
              <p>• Dating ultrasound scan performed.</p>
            </div>
          )}
        </div>

        {/* 2nd Trimester (Current) */}
        <div className="bg-white rounded-[20px] border-2 border-[var(--haven-deep)] p-4 shadow-card-2 relative overflow-hidden">
          <div 
            onClick={() => setExpandedTrimester(expandedTrimester === 2 ? 0 : 2)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center font-display font-bold text-[12px]">
                2
              </div>
              <div>
                <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                  Second Trimester
                </h4>
                <span className="text-[12px] text-[var(--haven-orchid)] font-body font-semibold">Weeks 13 – 27 · Active</span>
              </div>
            </div>
            <span className="text-[12px] font-display font-bold text-white bg-[var(--haven-deep)] px-3 py-0.5 rounded-full">
              Week {gestationalWeeks}
            </span>
          </div>

          {expandedTrimester === 2 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] text-[13px] text-[var(--ink-700)] font-body space-y-2">
              <p className="font-semibold text-[var(--haven-deep)]">Key Second Trimester Milestones:</p>
              <p>• Anomaly ultrasound scan (Weeks 18–22).</p>
              <p>• Fetal movement quickening and sensation of kicks.</p>
              <p>• IPTp-SP malaria prophylaxis dose 1 &amp; 2 administered in endemic regions.</p>
              <p>• Gestational diabetes oral glucose challenge screening.</p>
            </div>
          )}
        </div>

        {/* 3rd Trimester */}
        <div className="bg-white rounded-[20px] border border-[var(--border-hairline)] p-4 shadow-card-1 opacity-90">
          <div 
            onClick={() => setExpandedTrimester(expandedTrimester === 3 ? 0 : 3)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] text-[var(--ink-600)] flex items-center justify-center font-display font-bold text-[12px]">
                3
              </div>
              <div>
                <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                  Third Trimester
                </h4>
                <span className="text-[12px] text-[var(--ink-600)] font-body">Weeks 28 – 40+ · Upcoming</span>
              </div>
            </div>
            <span className="text-[12px] font-display font-medium text-[var(--ink-500)] bg-[var(--lavender-50)] px-2.5 py-0.5 rounded-full">
              Upcoming
            </span>
          </div>

          {expandedTrimester === 3 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] text-[13px] text-[var(--ink-700)] font-body space-y-1.5">
              <p>• Individualized birth preparedness &amp; hospital bag finalization.</p>
              <p>• Increased frequency of ANC checkups (every 2 weeks, then weekly).</p>
              <p>• Fetal presentation &amp; growth assessment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
