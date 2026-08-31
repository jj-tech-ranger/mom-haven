import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  Calendar,
  Stethoscope,
  Heart,
  Activity,
  ShieldCheck,
  Award,
  Baby,
  Scale,
  Syringe,
  Smile,
  FileSpreadsheet,
  Plus,
  Compass,
} from 'lucide-react';
import { PregnancyDoc, ChildDoc, MotherProfileDoc, AncEncounterDoc } from '../../types';
import { HavenRibbon } from '../HavenRibbon';

interface JourneyOverviewProps {
  pregnancy?: PregnancyDoc | null;
  childrenList?: ChildDoc[];
  motherProfile?: MotherProfileDoc | null;
  encounters?: AncEncounterDoc[];
  onOpenContextSelector: () => void;
  onOpenPregnancyOverview: () => void;
  onOpenTimeline: () => void;
  onOpenAncOverview: () => void;
  onOpenHealthHistory: () => void;
  onOpenBirthPlan: () => void;
  onOpenBirthOutcome: () => void;
  onOpenAddChild: () => void;
  onOpenChildDashboard?: () => void;
  onOpenNewbornRecord?: () => void;
  onOpenPncOverview?: () => void;
  onOpenChildTimeline?: () => void;
}

export const JourneyOverview: React.FC<JourneyOverviewProps> = ({
  pregnancy,
  childrenList = [],
  motherProfile,
  encounters = [],
  onOpenContextSelector,
  onOpenPregnancyOverview,
  onOpenTimeline,
  onOpenAncOverview,
  onOpenHealthHistory,
  onOpenBirthPlan,
  onOpenBirthOutcome,
  onOpenAddChild,
  onOpenChildDashboard,
  onOpenNewbornRecord,
  onOpenPncOverview,
  onOpenChildTimeline,
}) => {
  // Mode: Pregnancy Active or Child Active
  const [activeMode, setActiveMode] = useState<'pregnancy' | 'child'>(
    pregnancy ? 'pregnancy' : childrenList.length > 0 ? 'child' : 'pregnancy'
  );

  const selectedChild = childrenList[0] || {
    id: 'c1',
    name: 'Baby Amara',
    dateOfBirth: '2026-01-14',
    sex: 'girl' as const,
    motherId: 'm1',
    createdAt: '2026-01-14',
  };

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

  const progressPercent = Math.min(100, Math.round((week / 40) * 100));

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar with Context Switcher */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900 leading-tight">
            Journey
          </h1>
          <p className="font-body text-xs text-ink-600">
            MOH 216 Maternal & Child Healthcare Path
          </p>
        </div>

        {/* Context Switcher Pill */}
        <button
          onClick={onOpenContextSelector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-lavender-100 border border-border-hairline text-haven-deep font-display font-bold text-xs hover:bg-lavender-200 transition-colors cursor-pointer"
        >
          <span>
            {activeMode === 'pregnancy'
              ? `Pregnancy (Week ${week})`
              : `${selectedChild.name}`}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-haven-orchid" />
        </button>
      </header>

      {/* Mode Switcher Tabs: Pregnancy Active vs Child Active */}
      <div className="px-4 pt-3">
        <div className="bg-lavender-100 p-1 rounded-pill flex items-center">
          <button
            onClick={() => setActiveMode('pregnancy')}
            className={`flex-1 py-2 rounded-pill font-display font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'pregnancy'
                ? 'bg-white text-haven-deep shadow-sm'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-haven-orchid" />
            <span>Pregnancy Journey</span>
          </button>

          <button
            onClick={() => setActiveMode('child')}
            className={`flex-1 py-2 rounded-pill font-display font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'child'
                ? 'bg-white text-haven-deep shadow-sm'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-haven-orchid" />
            <span>Child Journey</span>
          </button>
        </div>
      </div>

      {/* Main Mode Content */}
      <div className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {activeMode === 'pregnancy' ? (
          /* PREGNANCY ACTIVE VIEW */
          <>
            {/* Haven Ribbon Hero Card */}
            <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-lavender-200 font-semibold font-body">
                    Pregnancy Road · Trimester {week <= 13 ? '1' : week <= 27 ? '2' : '3'}
                  </span>
                  <h2 className="font-display font-bold text-2xl mt-0.5">
                    Week {week} of 40
                  </h2>
                  <p className="text-xs text-lavender-100 font-body mt-0.5">
                    {pregnancy?.edd
                      ? `Due ${new Date(pregnancy.edd).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Estimated due date: 12 Oct 2026'}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Organic S-Curved Haven Ribbon */}
              <div className="pt-1">
                <HavenRibbon
                  progress={progressPercent}
                  currentStep={week}
                  totalSteps={40}
                  showMarkerTooltip={false}
                />
                <div className="flex justify-between text-[11px] text-lavender-200 font-body mt-1">
                  <span>Conception</span>
                  <span className="font-display font-bold text-white">Week {week} (Now)</span>
                  <span>Full Term</span>
                </div>
              </div>
            </div>

            {/* Primary & Secondary Action Block */}
            <div className="space-y-2.5">
              <button
                onClick={onOpenPregnancyOverview}
                className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Compass className="w-5 h-5" />
                <span>Continue pregnancy journey</span>
              </button>

              <button
                onClick={() => setActiveMode('child')}
                className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-100/60 transition-colors cursor-pointer text-center"
              >
                Switch to a child's journey
              </button>
            </div>

            {/* Section Shortcuts */}
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-display font-bold text-ink-900 block px-1">
                Journey Shortcuts
              </span>

              {/* Pregnancy Overview */}
              <div
                onClick={onOpenPregnancyOverview}
                className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-haven-orchid" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-ink-900">
                      Pregnancy Overview
                    </h4>
                    <p className="font-body text-[11px] text-ink-600">
                      Current week summary, EDD & nutrition chips
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-600" />
              </div>

              {/* Vertical Pregnancy Timeline */}
              <div
                onClick={onOpenTimeline}
                className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-haven-orchid" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-ink-900">
                      Pregnancy Timeline
                    </h4>
                    <p className="font-body text-[11px] text-ink-600">
                      Vertical Haven Ribbon with 8 milestone nodes
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-600" />
              </div>

              {/* ANC History */}
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
                      ANC Overview ({encounters.length}/8 Contacts)
                    </h4>
                    <p className="font-body text-[11px] text-ink-600">
                      Reported vs Verified checkups and vitals
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-600" />
              </div>

              {/* Maternal Health History */}
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

              {/* Birth Plan */}
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
                      Birth Plan & Preparedness
                    </h4>
                    <p className="font-body text-[11px] text-ink-600">
                      Delivery facility, transport & partner sharing
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-600" />
              </div>

              {/* Pregnancy Completion & Outcome */}
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
                      Pregnancy Completion / Birth Outcome
                    </h4>
                    <p className="font-body text-[11px] text-ink-600">
                      Record birth and create child health record
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-haven-deep" />
              </div>
            </div>
          </>
        ) : (
          /* CHILD ACTIVE VIEW (Matching mother-child-dashboard.png reference!) */
          <>
            {/* Child Hero Card */}
            <div
              onClick={onOpenChildDashboard}
              className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 flex items-center gap-4 cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-2xl leading-tight">
                  7 months old
                </h2>
                <p className="font-body text-xs text-lavender-100 mt-0.5">
                  Born 14 Jan 2026 · Girl
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>

            {/* "This Month" 3-Card Status Row */}
            <div className="space-y-2">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-ink-600 block px-1">
                THIS MONTH
              </span>

              <div className="grid grid-cols-3 gap-2">
                {/* Immunization Card (1 overdue) */}
                <div
                  onClick={onOpenChildDashboard}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center relative overflow-hidden border-l-4 border-l-[#E11D3C] cursor-pointer hover:bg-lavender-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 text-[#E11D3C] flex items-center justify-center mx-auto mb-1">
                    <Syringe className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-xs text-ink-900 block leading-tight">
                    1 overdue
                  </span>
                  <span className="text-[10px] font-body text-ink-600 block mt-0.5">
                    Immunization
                  </span>
                </div>

                {/* Growth Card (On track) */}
                <div
                  onClick={onOpenChildDashboard}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center relative overflow-hidden border-l-4 border-l-[#137333] cursor-pointer hover:bg-lavender-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#137333] flex items-center justify-center mx-auto mb-1">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-xs text-ink-900 block leading-tight">
                    On track
                  </span>
                  <span className="text-[10px] font-body text-ink-600 block mt-0.5">
                    Growth
                  </span>
                </div>

                {/* Development Card (On track) */}
                <div
                  onClick={onOpenChildDashboard}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center relative overflow-hidden border-l-4 border-l-haven-orchid cursor-pointer hover:bg-lavender-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-lavender-100 text-haven-orchid flex items-center justify-center mx-auto mb-1">
                    <Smile className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-xs text-ink-900 block leading-tight">
                    On track
                  </span>
                  <span className="text-[10px] font-body text-ink-600 block mt-0.5">
                    Development
                  </span>
                </div>
              </div>
            </div>

            {/* Care Areas List */}
            <div className="space-y-2">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-ink-600 block px-1">
                CARE AREAS
              </span>

              <div className="space-y-2.5">
                <div
                  onClick={onOpenNewbornRecord}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                      <Baby className="w-5 h-5 text-haven-orchid" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-ink-900">
                        Newborn record
                      </h4>
                      <p className="font-body text-[11px] text-ink-600">
                        Birth weight, APGAR & initial prophylaxis
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-600" />
                </div>

                <div
                  onClick={onOpenPncOverview}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-haven-orchid" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-ink-900">
                        Postnatal care (PNC)
                      </h4>
                      <p className="font-body text-[11px] text-ink-600">
                        48h, 2-week & 6-week mother-baby checkups
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-600" />
                </div>

                <div
                  onClick={onOpenChildTimeline}
                  className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                      <Syringe className="w-5 h-5 text-haven-orchid" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-ink-900">
                        Immunization & Timeline
                      </h4>
                      <p className="font-body text-[11px] text-ink-600">
                        Kenya KEPI 0 to 5-year vaccines & milestones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-pill bg-red-100 text-red-700 text-[10px] font-display font-bold">
                      1 overdue
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action to switch back or add child */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onOpenChildDashboard}
                className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Baby className="w-5 h-5" />
                <span>Open Child Dashboard</span>
              </button>

              <button
                onClick={onOpenAddChild}
                className="w-full py-3 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-haven-orchid" />
                <span>Add another child</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
