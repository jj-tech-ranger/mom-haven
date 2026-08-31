import React from 'react';
import {
  Baby,
  Syringe,
  Scale,
  Smile,
  ChevronRight,
  ChevronDown,
  Heart,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ChildDoc } from '../../types';

interface ChildDashboardProps {
  child?: ChildDoc | null;
  childrenList?: ChildDoc[];
  onSwitchChild: () => void;
  onOpenNewbornRecord: () => void;
  onOpenPncOverview: () => void;
  onOpenImmunization: () => void;
  onOpenGrowth: () => void;
  onOpenDevelopment: () => void;
  onOpenTimeline: () => void;
}

export const ChildDashboard: React.FC<ChildDashboardProps> = ({
  child,
  childrenList = [],
  onSwitchChild,
  onOpenNewbornRecord,
  onOpenPncOverview,
  onOpenImmunization,
  onOpenGrowth,
  onOpenDevelopment,
  onOpenTimeline,
}) => {
  const currentChild = child || {
    id: 'child_default',
    name: 'Baby Amara',
    dateOfBirth: '2026-01-14',
    sex: 'girl' as const,
    birthWeightGrams: 3200,
    facilityName: 'Kariokor Health Centre',
    motherId: 'm1',
    createdAt: '2026-01-14',
  };

  // Compute age from DOB
  const calculateAgeText = (dobString: string) => {
    if (!dobString) return '7 months old';
    const dob = new Date(dobString);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());

    if (diffMonths < 1) {
      const diffDays = Math.max(
        0,
        Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24))
      );
      return `${diffDays} days old`;
    }
    if (diffMonths < 24) {
      return `${diffMonths} months old`;
    }
    const years = Math.floor(diffMonths / 12);
    const remMonths = diffMonths % 12;
    return remMonths > 0 ? `${years}y ${remMonths}m old` : `${years} years old`;
  };

  const formatDob = (dobString: string) => {
    if (!dobString) return '14 Jan 2026';
    const date = new Date(dobString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const ageText = calculateAgeText(currentChild.dateOfBirth);
  const formattedDob = formatDob(currentChild.dateOfBirth);
  const sexLabel = currentChild.sex === 'boy' ? 'Boy' : 'Girl';

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900 leading-tight">
            {currentChild.name}
          </h1>
          <p className="font-body text-xs text-ink-600">
            Kenya MOH 216 Child Health Record
          </p>
        </div>

        {/* Switch Child Chip */}
        <button
          onClick={onSwitchChild}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-lavender-100 border border-border-hairline text-haven-deep font-display font-semibold text-xs hover:bg-lavender-200 transition-colors cursor-pointer"
        >
          <span>Switch child</span>
          <ChevronDown className="w-3.5 h-3.5 text-haven-deep" />
        </button>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Purple-Gradient Hero Card (Pixel-matched with M-CHILD-001) */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 flex items-center gap-4 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-2xl leading-tight">
              {ageText}
            </h2>
            <p className="font-body text-xs text-lavender-100 mt-0.5">
              Born {formattedDob} · {sexLabel}
            </p>
          </div>

          <button
            onClick={onOpenTimeline}
            className="absolute top-3 right-3 text-white/80 hover:text-white p-1"
            title="View Child Timeline"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* THIS MONTH: 3 Compact Square Status Cards */}
        <div className="space-y-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-ink-600 block px-1">
            THIS MONTH
          </span>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Immunization Card (1 overdue) */}
            <div
              onClick={onOpenImmunization}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center relative overflow-hidden border-l-4 border-l-[#E11D3C] cursor-pointer hover:border-r hover:border-r-[#E11D3C]/40 transition-all"
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
              onClick={onOpenGrowth}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center relative overflow-hidden border-l-4 border-l-[#137333] cursor-pointer hover:border-r hover:border-r-[#137333]/40 transition-all"
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
              onClick={onOpenDevelopment}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3 text-center relative overflow-hidden border-l-4 border-l-haven-orchid cursor-pointer hover:border-r hover:border-r-haven-orchid/40 transition-all"
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

        {/* CARE AREAS: Full-Width Card List */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-ink-600 block px-1">
            CARE AREAS
          </span>

          <div className="space-y-2.5">
            {/* 1. Newborn Record */}
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
                    Birth metrics, APGAR & initial prophylaxis
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            {/* 2. Postnatal Care (PNC) */}
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
                    48h, 2-week, 6-week & 6-month mother-baby contacts
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            {/* 3. Immunization (with 1 overdue badge matching screenshot) */}
            <div
              onClick={onOpenImmunization}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <Syringe className="w-5 h-5 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Immunization
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Kenya KEPI schedule (0 to 5 years)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#E11D3C] font-display font-bold text-xs">
                  1 overdue
                </span>
                <ChevronRight className="w-4 h-4 text-ink-600" />
              </div>
            </div>

            {/* 4. Growth & Nutrition */}
            <div
              onClick={onOpenGrowth}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <Scale className="w-5 h-5 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Growth & nutrition
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    WHO Z-scores, weight, height & MUAC
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>

            {/* 5. Development */}
            <div
              onClick={onOpenDevelopment}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-3.5 flex items-center justify-between hover:border-haven-orchid/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lavender-100 text-haven-deep flex items-center justify-center flex-shrink-0">
                  <Smile className="w-5 h-5 text-haven-orchid" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    Development
                  </h4>
                  <p className="font-body text-[11px] text-ink-600">
                    Motor, language, cognitive & social milestones
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-600" />
            </div>
          </div>
        </div>

        {/* Child Timeline Navigation Banner */}
        <div
          onClick={onOpenTimeline}
          className="bg-gradient-to-r from-haven-deep/5 to-haven-orchid/10 border border-haven-orchid/20 rounded-[20px] p-4 flex items-center justify-between cursor-pointer hover:bg-lavender-100/60 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-haven-deep text-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-haven-deep">
                Child 5-Year Journey Ribbon
              </h4>
              <p className="font-body text-[11px] text-ink-600">
                Explore milestones along the Haven Ribbon timeline
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-haven-deep" />
        </div>
      </div>
    </div>
  );
};
