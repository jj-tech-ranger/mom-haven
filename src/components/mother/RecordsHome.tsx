import React from 'react';
import { Shield, Heart, Baby, Syringe, Scale, Download, ChevronRight } from 'lucide-react';
import { ChildDoc, PregnancyDoc } from '../../types';

interface RecordsHomeProps {
  pregnancyCount?: number;
  pregnancyVerified?: number;
  childCount?: number;
  childVerified?: number;
  immunizationCount?: number;
  immunizationVerified?: number;
  growthCount?: number;
  growthVerified?: number;
  onOpenPregnancyRecords: () => void;
  onOpenChildRecords: () => void;
  onOpenImmunizationRecords: () => void;
  onOpenGrowthRecords: () => void;
  onOpenExportManager: () => void;
}

export const RecordsHome: React.FC<RecordsHomeProps> = ({
  pregnancyCount = 6,
  pregnancyVerified = 4,
  childCount = 14,
  childVerified = 9,
  immunizationCount = 8,
  immunizationVerified = 7,
  growthCount = 5,
  growthVerified = 3,
  onOpenPregnancyRecords,
  onOpenChildRecords,
  onOpenImmunizationRecords,
  onOpenGrowthRecords,
  onOpenExportManager,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header with Export icon on top-right */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-ink-900">Records</h1>
        <button
          onClick={onOpenExportManager}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
          title="Export Records"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Card — Your secure health vault */}
      <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-6 rounded-[20px] text-white shadow-card-1 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-white">
            Your secure health vault
          </h2>
          <p className="font-body text-xs text-white/85 mt-1 max-w-[260px] mx-auto leading-relaxed">
            Everything you and your clinicians have recorded, in one place
          </p>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          CATEGORIES
        </span>

        <div className="space-y-2.5">
          {/* Pregnancy Row */}
          <div
            onClick={onOpenPregnancyRecords}
            className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-ink-900">Pregnancy</h4>
                <p className="font-body text-xs text-ink-600 mt-0.5">
                  {pregnancyCount} records · {pregnancyVerified} verified
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-600" />
          </div>

          {/* Child Row */}
          <div
            onClick={onOpenChildRecords}
            className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-ink-900">Child</h4>
                <p className="font-body text-xs text-ink-600 mt-0.5">
                  {childCount} records · {childVerified} verified
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-600" />
          </div>

          {/* Immunization Row */}
          <div
            onClick={onOpenImmunizationRecords}
            className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
                <Syringe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-ink-900">Immunization</h4>
                <p className="font-body text-xs text-ink-600 mt-0.5">
                  {immunizationCount} records · {immunizationVerified} verified
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-600" />
          </div>

          {/* Growth Row */}
          <div
            onClick={onOpenGrowthRecords}
            className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:border-haven-orchid/40 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-lavender-100 flex items-center justify-center text-haven-orchid flex-shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-ink-900">Growth</h4>
                <p className="font-body text-xs text-ink-600 mt-0.5">
                  {growthCount} records · {growthVerified} verified
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-600" />
          </div>
        </div>
      </div>

      {/* Export Records Secondary Action */}
      <div className="pt-2">
        <button
          onClick={onOpenExportManager}
          className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4 text-haven-orchid" />
          <span>Export records</span>
        </button>
      </div>
    </div>
  );
};
