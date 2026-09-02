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
  Plus
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
          <div className="bg-white/80 p-2.5 rounded-[14px] text-center border border-[var(--border-hairline)]">
            <span className="text-[10px] font-bold text-[var(--ink-500)] uppercase block">Weight</span>
            <span className="font-display font-extrabold text-[15px] text-[var(--ink-900)]">
              {latestGrowth?.weightKg || child.birthWeightKg || '6.8'} kg
            </span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-[14px] text-center border border-[var(--border-hairline)]">
            <span className="text-[10px] font-bold text-[var(--ink-500)] uppercase block">Height</span>
            <span className="font-display font-extrabold text-[15px] text-[var(--ink-900)]">
              {latestGrowth?.heightCm || child.birthLengthCm || '64'} cm
            </span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-[14px] text-center border border-[var(--border-hairline)]">
            <span className="text-[10px] font-bold text-[var(--ink-500)] uppercase block">Vaccines</span>
            <span className="font-display font-extrabold text-[15px] text-emerald-700">
              {completedVaccinesCount} Done
            </span>
          </div>
        </div>
      </div>

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
            Z-score curves &amp; MUAC
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
