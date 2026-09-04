import React, { useState } from 'react';
import { 
  Baby, 
  Syringe, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  AlertTriangle,
  Plus,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { Child, ChildVaccineRecord, GrowthMeasurement } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';

interface ChildOverviewProps {
  child: Child;
  vaccines: ChildVaccineRecord[];
  growthRecords: GrowthMeasurement[];
  onOpenImmunization: () => void;
  onOpenGrowthTracker: () => void;
  onOpenMilestones: () => void;
  onOpenIllnessLog: () => void;
  onLogGrowthMeasurement: () => void;
  onOpenMuacAssessment?: () => void;
  onOpenNewbornDangerSigns?: () => void;
}

export default function ChildOverview({
  child,
  vaccines,
  growthRecords,
  onOpenImmunization,
  onOpenGrowthTracker,
  onOpenMilestones,
  onOpenIllnessLog,
  onLogGrowthMeasurement,
  onOpenMuacAssessment,
  onOpenNewbornDangerSigns,
}: ChildOverviewProps) {
  // Calculate age string
  const dob = child.dateOfBirth ? new Date(child.dateOfBirth) : new Date();
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dob.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30.4);
  const weeks = Math.floor(diffDays / 7);

  const ageLabel = months < 2 
    ? `${weeks} weeks old` 
    : months < 24 
    ? `${months} months old` 
    : `${Math.floor(months / 12)} yrs ${months % 12} mos`;

  // Latest Growth record
  const latestGrowth = growthRecords[growthRecords.length - 1];

  // Next vaccine calculation
  const completedVaccinesCount = vaccines.filter(v => v.status === 'GIVEN').length;
  const verifiedVaccinesCount = vaccines.filter(v => v.provenance?.status === 'VERIFIED').length;

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      {/* Child Identity Card */}
      <div className="bg-gradient-to-br from-white via-[var(--lavender-50)] to-purple-50/50 rounded-[26px] p-5 sm:p-6 border border-[var(--border-hairline)] shadow-card-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-800 font-display font-extrabold text-[20px] shadow-xs">
              {child.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                Child Health Passport (MOH 216)
              </span>
              <h2 className="font-display font-black text-[22px] text-[var(--ink-900)] leading-tight">
                {child.name}
              </h2>
              <p className="font-body text-[13px] text-[var(--ink-600)]">
                {ageLabel} · {child.sex === 'female' ? 'Girl' : 'Boy'} · Born {dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Vitals Strip */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[var(--border-hairline)]">
          <div className="bg-white p-2.5 rounded-md text-center border border-[var(--border-hairline)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ink-500)] uppercase block">Weight</span>
            <span className="font-display font-extrabold text-[15px] text-[var(--ink-900)]">
              {latestGrowth?.weightKg ? `${latestGrowth.weightKg} kg` : child.birthWeightKg ? `${child.birthWeightKg} kg` : '—'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-md text-center border border-[var(--border-hairline)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ink-500)] uppercase block">Height</span>
            <span className="font-display font-extrabold text-[15px] text-[var(--ink-900)]">
              {latestGrowth?.heightCm ? `${latestGrowth.heightCm} cm` : child.birthLengthCm ? `${child.birthLengthCm} cm` : '—'}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-md text-center border border-[var(--border-hairline)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ink-500)] uppercase block">Vaccines</span>
            <span className="font-display font-extrabold text-[15px] text-emerald-700">
              {completedVaccinesCount} Done
            </span>
          </div>
        </div>
      </div>

      {/* Newborn Danger Signs Warning Banner (For young infants) */}
      {diffDays <= 45 && onOpenNewbornDangerSigns && (
        <div 
          onClick={onOpenNewbornDangerSigns}
          className="bg-[#FCE7EA] border border-[#C4283C]/30 p-4 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-[#F9D6DC] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C4283C] text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-[14px] text-[#C4283C]">
                Newborn Danger Signs Checklist
              </h4>
              <p className="font-body text-[11px] text-[var(--ink-800)]">
                Key warning signs for the first 28 days of life
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C4283C]" />
        </div>
      )}

      {/* ================= 4 CORE ACTION CARDS ================= */}
      <div className="grid grid-cols-2 gap-3">
        {/* Immunization Passport */}
        <div
          onClick={onOpenImmunization}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Syringe className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            KEPI Immunization
          </h3>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            {completedVaccinesCount} of 14 doses given ({verifiedVaccinesCount} verified)
          </p>
        </div>

        {/* Growth & Nutrition Tracker */}
        <div
          onClick={onOpenGrowthTracker}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            Growth Curves (WHO)
          </h3>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            Z-score curves &amp; history
          </p>
        </div>

        {/* Developmental Milestones (5 Domains) */}
        <div
          onClick={onOpenMilestones}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--haven-deep)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            5-Year Milestones
          </h3>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            Motor, language &amp; social
          </p>
        </div>

        {/* Illness & Symptom Log */}
        <div
          onClick={onOpenIllnessLog}
          className="bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 hover:border-[var(--haven-orchid)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
          </div>
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
            Illness &amp; IMCI Log
          </h3>
          <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
            Fever, diarrhea &amp; red flags
          </p>
        </div>
      </div>

      {/* MUAC & Danger Signs Quick Row */}
      <div className="grid grid-cols-2 gap-3">
        {onOpenMuacAssessment && (
          <button
            type="button"
            onClick={onOpenMuacAssessment}
            className="p-3 bg-white rounded-[18px] border border-[var(--border-hairline)] shadow-xs flex items-center gap-2.5 text-left hover:border-[var(--haven-orchid)] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-[12px] text-[var(--ink-900)] block">
                MUAC Assessment
              </span>
              <span className="font-body text-[10px] text-[var(--ink-500)] block">
                Color band screening
              </span>
            </div>
          </button>
        )}

        {onOpenNewbornDangerSigns && diffDays > 45 && (
          <button
            type="button"
            onClick={onOpenNewbornDangerSigns}
            className="p-3 bg-white rounded-[18px] border border-[var(--border-hairline)] shadow-xs flex items-center gap-2.5 text-left hover:border-red-300 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-[12px] text-[var(--ink-900)] block">
                Danger Signs
              </span>
              <span className="font-body text-[10px] text-[var(--ink-500)] block">
                Emergency review
              </span>
            </div>
          </button>
        )}
      </div>

      {/* ================= IMMUNIZATION STATUS BANNER ================= */}
      <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--haven-orchid)]" />
            <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
              Next Upcoming Immunization
            </h4>
          </div>
          <span className="text-[12px] font-display font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Due at 6 Months
          </span>
        </div>

        <p className="font-body text-[13px] text-[var(--ink-700)]">
          <strong>Vitamin A (100,000 IU) First Dose:</strong> Essential for boosting vision, immune response, and protection from severe childhood infections.
        </p>

        <div className="pt-1 flex items-center justify-between border-t border-[var(--border-hairline)]">
          <span className="text-[12px] text-[var(--ink-500)] font-body">
            Recommended location: Local Dispensary / Health Centre
          </span>
          <button
            type="button"
            onClick={onOpenImmunization}
            className="text-[12px] font-display font-bold text-[var(--haven-deep)] hover:underline cursor-pointer"
          >
            View schedule &rarr;
          </button>
        </div>
      </div>

      {/* ================= QUICK LOG GROWTH CTA ================= */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onLogGrowthMeasurement}
          className="w-full py-3.5 px-4 rounded-full bg-[var(--haven-deep)] text-white font-display font-bold text-[14px] flex items-center justify-center gap-2 shadow-card-2 cursor-pointer hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Growth Measurement (Weight / Height)</span>
        </button>
      </div>
    </div>
  );
}
