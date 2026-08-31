import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Heart,
  FileText,
  Activity,
  Plus,
  ShieldCheck,
  Pill,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';
import { PregnancyDoc, AncEncounterDoc, MotherProfileDoc } from '../../types';
import { HavenRibbon } from '../HavenRibbon';
import { PREGNANCY_WEEKS } from '../../data/pregnancyWeeks';

interface PregnancyOverviewProps {
  pregnancy?: PregnancyDoc | null;
  motherProfile?: MotherProfileDoc | null;
  encounters?: AncEncounterDoc[];
  onBack: () => void;
  onOpenAddVisit: () => void;
  onOpenTimeline: () => void;
  onOpenAncOverview: () => void;
  onOpenHealthHistory: () => void;
  onOpenBirthPlan: () => void;
  onOpenBirthOutcome: () => void;
}

export const PregnancyOverview: React.FC<PregnancyOverviewProps> = ({
  pregnancy,
  motherProfile,
  encounters = [],
  onBack,
  onOpenAddVisit,
  onOpenTimeline,
  onOpenAncOverview,
  onOpenHealthHistory,
  onOpenBirthPlan,
  onOpenBirthOutcome,
}) => {
  // Calculate Gestational Week according to MOH 216 / Naegele's rule
  const week = pregnancy?.lmp
    ? Math.min(
        42,
        Math.max(
          1,
          Math.floor(
            (new Date().getTime() - new Date(pregnancy.lmp).getTime()) /
              (1000 * 60 * 60 * 24 * 7)
          )
        )
      )
    : 24;

  const weekInfo = PREGNANCY_WEEKS[week] || {
    week,
    sizeFact: 'Baby is growing actively 🌱',
    fruitComparison: 'An ear of corn',
    developmentNote: 'Auditory development',
    developmentDetail: 'Baby can recognize mama’s voice and reacts to soothing sounds.',
    nutritionTip: 'Continue taking 1 IFAS tablet daily with meals.',
  };

  const eddDate = pregnancy?.edd
    ? new Date(pregnancy.edd).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '12 Oct 2026';

  const daysRemaining = pregnancy?.edd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(pregnancy.edd).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 112;

  const progressPercent = Math.min(100, Math.round((week / 40) * 100));
  const attendedCount = encounters.length;
  const isAttentionNeeded = attendedCount === 0 && week >= 20;

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
              Pregnancy Overview
            </h1>
            <p className="font-body text-xs text-ink-600">
              Week {week} · 2nd Trimester
            </p>
          </div>
        </div>

        {/* On-track or attention needed status badge */}
        <div
          className={`px-3 py-1 rounded-pill text-xs font-display font-bold flex items-center gap-1.5 ${
            isAttentionNeeded
              ? 'bg-amber-100 border border-amber-300 text-amber-800'
              : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isAttentionNeeded ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span>{isAttentionNeeded ? 'Attention needed' : 'On-track'}</span>
        </div>
      </header>

      {/* Content Body */}
      <div className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {/* 1. Week Card Hero */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-lavender-200 font-semibold font-body">
                Gestational Age · Trimester {week <= 13 ? '1' : week <= 27 ? '2' : '3'}
              </span>
              <h2 className="font-display font-bold text-3xl mt-0.5">
                Week {week}
              </h2>
              <p className="text-xs text-lavender-100 font-body mt-0.5">
                {weekInfo.fruitComparison} ({weekInfo.sizeFact})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase text-lavender-200 block font-body">
                Due Date (EDD)
              </span>
              <span className="font-display font-bold text-sm text-white">
                {eddDate}
              </span>
              <span className="text-[11px] text-lavender-100 block mt-0.5 font-body">
                {daysRemaining} days to go
              </span>
            </div>
          </div>

          {/* Fetal development note */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-xs text-white/90 font-body leading-relaxed border border-white/15">
            <strong>Baby Development:</strong> {weekInfo.developmentDetail}
          </div>

          {/* Haven Ribbon Progress */}
          <div className="pt-1">
            <HavenRibbon
              progress={progressPercent}
              currentStep={week}
              totalSteps={40}
              showMarkerTooltip={false}
            />
            <div className="flex justify-between text-[11px] text-lavender-200 font-body mt-1">
              <span>Week 1 (Conception)</span>
              <span className="font-display font-bold text-white">Week {week}</span>
              <span>Week 40 (EDD)</span>
            </div>
          </div>
        </div>

        {/* 2. Next-Appointment Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-haven-orchid" />
              </div>
              <div>
                <span className="text-[10px] font-display font-bold text-haven-orchid uppercase tracking-wider block">
                  Next Scheduled ANC Contact
                </span>
                <h3 className="font-display font-bold text-sm text-ink-900">
                  ANC Contact 5 · Week 24
                </h3>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-pill bg-lavender-100 text-haven-deep text-[10px] font-display font-semibold">
              Due this week
            </span>
          </div>

          <p className="font-body text-xs text-ink-600 pl-11">
            IPTp-SP dose 3 · Kariokor Health Centre · BP & Maternal screening
          </p>

          <div className="pt-2 flex gap-2">
            <button
              onClick={onOpenAddVisit}
              className="flex-1 py-2.5 px-3 bg-lavender-100 border border-border-hairline text-haven-deep text-xs font-display font-bold rounded-pill hover:bg-lavender-200 transition-colors cursor-pointer text-center"
            >
              Log This Visit
            </button>
            <button
              onClick={onOpenAncOverview}
              className="py-2.5 px-3 bg-white border border-border-hairline text-ink-600 text-xs font-display font-bold rounded-pill hover:bg-lavender-50 transition-colors cursor-pointer"
            >
              All ANC (8)
            </button>
          </div>
        </div>

        {/* 3. IFAS & TD Status Chips */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2.5">
          <span className="text-xs font-display font-bold text-ink-900 block">
            MOH Essential Supplementation & Immunization
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* IFAS Chip */}
            <div className="p-3 rounded-2xl bg-lavender-50/80 border border-border-hairline space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-display font-bold text-haven-orchid uppercase">
                  Daily IFAS
                </span>
                <span className="w-2 h-2 rounded-full bg-status-normal" />
              </div>
              <span className="font-display font-bold text-xs text-ink-900 block">
                Iron & Folic Acid
              </span>
              <span className="text-[11px] font-body text-ink-600 block">
                1 tablet daily · On-track
              </span>
            </div>

            {/* TD Chip */}
            <div className="p-3 rounded-2xl bg-lavender-50/80 border border-border-hairline space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-display font-bold text-haven-orchid uppercase">
                  Tetanus (TD)
                </span>
                <span className="w-2 h-2 rounded-full bg-status-normal" />
              </div>
              <span className="font-display font-bold text-xs text-ink-900 block">
                TD Dose 2
              </span>
              <span className="text-[11px] font-body text-ink-600 block">
                Received at Booking
              </span>
            </div>
          </div>
        </div>

        {/* 4. Section Shortcuts Grid */}
        <div className="space-y-2">
          <span className="text-xs font-display font-bold text-ink-900 block px-1">
            Pregnancy Care Areas
          </span>

          <div className="space-y-2">
            <div
              onClick={onOpenTimeline}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Pregnancy Timeline
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Milestones & 8-contact vertical Haven Ribbon
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            <div
              onClick={onOpenAncOverview}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-4 h-4 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    ANC Encounters ({encounters.length}/8)
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Verified clinical vitals, blood pressure & scans
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            <div
              onClick={onOpenHealthHistory}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Maternal Health History
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Blood group {motherProfile?.bloodGroup || 'O+'}, allergies & obstetric baseline
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            <div
              onClick={onOpenBirthPlan}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Birth Plan & Delivery Ready
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Pumwani Maternity, transport fund, blood donor
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            {/* Birth Completion Button */}
            <div
              onClick={onOpenBirthOutcome}
              className="bg-gradient-to-r from-haven-deep/5 to-haven-orchid/10 border border-haven-orchid/30 rounded-[20px] p-3.5 flex items-center justify-between hover:bg-lavender-100/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-haven-deep text-white flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-haven-deep">
                    Record Birth Outcome
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Complete pregnancy & transition to Child's Journey
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-haven-deep" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Action */}
          <button
            onClick={onOpenAddVisit}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Log ANC visit</span>
          </button>

          {/* Secondary Action */}
          <button
            onClick={onOpenBirthPlan}
            className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-100/60 transition-colors cursor-pointer text-center"
          >
            View birth plan
          </button>
        </div>
      </div>
    </div>
  );
};
