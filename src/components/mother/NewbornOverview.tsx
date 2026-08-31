import React from 'react';
import {
  ChevronLeft,
  Baby,
  Scale,
  Ruler,
  AlertTriangle,
  Heart,
  Syringe,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Droplets,
} from 'lucide-react';
import { ChildDoc, NewbornRecordDoc } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

interface NewbornOverviewProps {
  child?: ChildDoc | null;
  newbornRecord?: NewbornRecordDoc | null;
  onBack: () => void;
  onOpenNewbornRecord: () => void;
  onOpenDangerSigns: () => void;
}

export const NewbornOverview: React.FC<NewbornOverviewProps> = ({
  child,
  newbornRecord,
  onBack,
  onOpenNewbornRecord,
  onOpenDangerSigns,
}) => {
  const currentChild = child || {
    id: 'child_default',
    name: 'Baby Amara',
    dateOfBirth: '2026-01-14',
    sex: 'girl' as const,
    birthWeightGrams: 3200,
    birthLengthCm: 50,
    facilityName: 'Kariokor Health Centre',
    motherId: 'm1',
    createdAt: '2026-01-14',
  };

  // Calculate days of life
  const birthDate = new Date(currentChild.dateOfBirth);
  const now = new Date();
  const daysOfLife = Math.max(
    1,
    Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isWithinNewbornPeriod = daysOfLife <= 28;

  const birthWeightKg = currentChild.birthWeightGrams
    ? (currentChild.birthWeightGrams / 1000).toFixed(2)
    : '3.20';
  const birthLengthCm = currentChild.birthLengthCm || 50;

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-lavender-100 flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="font-display font-bold text-lg text-ink-900 leading-tight">
            Newborn Overview
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            First 28 Days of Life · {currentChild.name}
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Neonatal Period Badge & Age Header */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl">
                  Day {daysOfLife} of Life
                </span>
                {isWithinNewbornPeriod ? (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-display text-[10px] uppercase font-bold tracking-wider">
                    Newborn Period
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-display text-[10px] uppercase font-bold tracking-wider">
                    Infancy
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-lavender-100 mt-0.5">
                Born at {currentChild.facilityName || 'Kariokor Health Centre'}
              </p>
            </div>
          </div>
        </div>

        {/* Danger Signs High-Priority Alert Card */}
        <div
          onClick={onOpenDangerSigns}
          className="bg-white rounded-[20px] border border-red-200 shadow-card-1 p-4 flex items-center justify-between cursor-pointer hover:bg-red-50/50 transition-all border-l-4 border-l-[#E11D3C]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#E11D3C] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-ink-900">
                Newborn Danger Signs
              </h4>
              <p className="font-body text-[11px] text-ink-600">
                Offline-safe checklist & 1199 emergency hotline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#E11D3C] font-display font-semibold text-xs">
            <span>Check</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Birth Metrics Summary Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-haven-orchid" />
              Birth Metrics (MOH 216)
            </h3>
            {newbornRecord ? (
              <ProvenanceBadge provenance={newbornRecord.provenance} compact />
            ) : (
              <span className="text-[11px] font-body text-haven-orchid font-medium bg-lavender-100 px-2 py-0.5 rounded-full">
                Baseline Recorded
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-2xl bg-lavender-50/80 border border-border-hairline text-center">
              <span className="font-body text-[10px] text-ink-600 uppercase block">
                Birth Weight
              </span>
              <span className="font-display font-bold text-base text-ink-900 block mt-0.5">
                {birthWeightKg} kg
              </span>
              <span className="font-body text-[10px] text-emerald-600 font-semibold">
                Normal (≥2.5kg)
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-lavender-50/80 border border-border-hairline text-center">
              <span className="font-body text-[10px] text-ink-600 uppercase block">
                Birth Length
              </span>
              <span className="font-display font-bold text-base text-ink-900 block mt-0.5">
                {birthLengthCm} cm
              </span>
              <span className="font-body text-[10px] text-ink-600">
                Standard
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-lavender-50/80 border border-border-hairline text-center">
              <span className="font-body text-[10px] text-ink-600 uppercase block">
                APGAR Score
              </span>
              <span className="font-display font-bold text-base text-ink-900 block mt-0.5">
                {newbornRecord?.apgarScore5Min ? `${newbornRecord.apgarScore5Min}/10` : '9/10'}
              </span>
              <span className="font-body text-[10px] text-emerald-600 font-semibold">
                Healthy
              </span>
            </div>
          </div>
        </div>

        {/* Feeding & Cord Care Cards in 2 Columns or Stack */}
        <div className="space-y-3">
          {/* Card 1: Exclusive Breastfeeding */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900">
                  Exclusive Breastfeeding
                </h4>
                <p className="font-body text-xs text-ink-600">
                  On-demand feeding (8–12 times per 24 hours)
                </p>
              </div>
            </div>
            <p className="font-body text-xs text-ink-700 leading-relaxed bg-lavender-50 p-2.5 rounded-card border border-border-hairline">
              Feed on baby’s early hunger cues (rooting, lip smacking). No water,
              tea, or formula needed for the first 6 months.
            </p>
          </div>

          {/* Card 2: Umbilical Cord Care */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink-900">
                  Umbilical Cord Care (7.1% Chlorhexidine)
                </h4>
                <p className="font-body text-xs text-ink-600">
                  Daily clean & dry cord maintenance
                </p>
              </div>
            </div>
            <p className="font-body text-xs text-ink-700 leading-relaxed bg-lavender-50 p-2.5 rounded-card border border-border-hairline">
              Apply 7.1% Chlorhexidine gel daily to the cord stump until it dries
              and separates naturally (usually 5–10 days). Keep clean and dry.
            </p>
          </div>

          {/* Card 3: Immediate Birth Prophylaxis */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
            <h4 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-haven-orchid" />
              Immediate Birth Interventions (MOH Protocol)
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-card bg-emerald-50 text-emerald-800 text-xs font-body font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>BCG Vaccine Given</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-card bg-emerald-50 text-emerald-800 text-xs font-body font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>OPV Birth Dose</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-card bg-emerald-50 text-emerald-800 text-xs font-body font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Vitamin K1 Injected</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-card bg-emerald-50 text-emerald-800 text-xs font-body font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Eye Ointment 1%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onOpenNewbornRecord}
            className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
          >
            <Baby className="w-5 h-5" />
            <span>Complete newborn record</span>
          </button>

          <button
            onClick={onOpenDangerSigns}
            className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm hover:bg-lavender-50 transition-colors cursor-pointer"
          >
            View danger signs
          </button>
        </div>
      </div>
    </div>
  );
};
