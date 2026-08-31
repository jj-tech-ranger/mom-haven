import React from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  Car,
  HeartHandshake,
  CheckCircle2,
  Edit3,
  Share2,
  Sparkles,
  ShieldCheck,
  Package,
  Coins,
  Droplet,
} from 'lucide-react';
import { BirthPlanDoc } from '../../types';

interface BirthPlanProps {
  birthPlan?: Partial<BirthPlanDoc> | null;
  onBack: () => void;
  onEditBirthPlan: () => void;
  onOpenShareSheet: () => void;
}

export const BirthPlan: React.FC<BirthPlanProps> = ({
  birthPlan,
  onBack,
  onEditBirthPlan,
  onOpenShareSheet,
}) => {
  // Default values suited for Kenya MOH birth preparedness
  const plan = {
    facilityName: birthPlan?.facilityName || 'Pumwani Maternity Hospital',
    backupFacilityName: birthPlan?.backupFacilityName || 'Kenyatta National Hospital (KNH)',
    supportPersonName: birthPlan?.supportPersonName || 'Brian Kipchoge',
    supportPersonPhone: birthPlan?.supportPersonPhone || '+254 712 345 678',
    supportPersonRelationship: birthPlan?.supportPersonRelationship || 'Partner / Husband',
    transportMode: birthPlan?.transportMode || 'Designated Driver / Taxi Fund',
    driverName: birthPlan?.driverName || 'John Kamau (Trusted Taxi)',
    driverPhone: birthPlan?.driverPhone || '+254 722 987 654',
    estimatedTravelTimeMinutes: birthPlan?.estimatedTravelTimeMinutes || 25,
    emergencyFundPrepared: birthPlan?.emergencyFundPrepared ?? true,
    bloodDonorIdentified: birthPlan?.bloodDonorIdentified ?? true,
    bloodDonorName: birthPlan?.bloodDonorName || 'David O. (Blood Group O+)',
    hospitalBagPacked: birthPlan?.hospitalBagPacked ?? true,
    babyClothesPacked: birthPlan?.babyClothesPacked ?? true,
    preferences: {
      delayedCordClamping: birthPlan?.preferences?.delayedCordClamping ?? true,
      immediateSkinToSkin: birthPlan?.preferences?.immediateSkinToSkin ?? true,
      exclusiveBreastfeeding: birthPlan?.preferences?.exclusiveBreastfeeding ?? true,
      painReliefPreference: birthPlan?.preferences?.painReliefPreference || 'Breathing & Warm Compress first',
    },
    specialNotes: birthPlan?.specialNotes || 'Please facilitate partner presence in the delivery room as recommended in Kenya respectful maternity care guidelines.',
    status: birthPlan?.status || 'complete',
  };

  const isComplete = plan.status === 'complete' || (plan.hospitalBagPacked && plan.emergencyFundPrepared);

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
              Birth Plan
            </h1>
            <p className="font-body text-xs text-ink-600">
              Delivery Logistics & Preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenShareSheet}
            className="w-9 h-9 rounded-full bg-lavender-100 border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
            title="Share with partner"
          >
            <Share2 className="w-4 h-4 text-haven-orchid" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {/* Status Hero Card */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-lavender-200 font-semibold font-body">
                  Kenya MOH Preparedness
                </span>
                <span className="px-2 py-0.5 rounded-pill bg-white/20 text-white text-[10px] font-display font-bold">
                  {isComplete ? 'Complete' : 'Draft'}
                </span>
              </div>
              <h2 className="font-display font-bold text-xl mt-1">
                {isComplete ? 'All 5 Logistics Areas Ready' : '3 of 5 Logistics Ready'}
              </h2>
              <p className="text-xs text-lavender-100 font-body mt-1">
                Facility, support team, and emergency transport established.
              </p>
            </div>

            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Card 1: Facility & Delivery Choice */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Building2 className="w-4 h-4 text-haven-orchid" />
            <span>Delivery Facility Choice</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="bg-lavender-50/70 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-ink-600 uppercase font-semibold block">
                Primary Facility
              </span>
              <span className="font-display font-bold text-sm text-ink-900 block">
                {plan.facilityName}
              </span>
              <span className="text-[11px] text-ink-600 font-body block">
                Maternity unit & 24/7 emergency theatre available
              </span>
            </div>

            <div className="bg-lavender-50/70 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-ink-600 uppercase font-semibold block">
                Backup Facility (Referral)
              </span>
              <span className="font-display font-bold text-sm text-ink-900 block">
                {plan.backupFacilityName}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Support Person & Companion */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Users className="w-4 h-4 text-haven-orchid" />
            <span>Birth Companion & Support Person</span>
          </div>

          <div className="bg-lavender-50/70 p-3 rounded-xl space-y-1 text-xs">
            <span className="font-display font-bold text-sm text-ink-900 block">
              {plan.supportPersonName}
            </span>
            <span className="text-ink-600 font-body block">
              {plan.supportPersonRelationship} · {plan.supportPersonPhone}
            </span>
            <div className="pt-1 flex items-center gap-1 text-status-normal font-medium text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Agreed to accompany during labor</span>
            </div>
          </div>
        </div>

        {/* Card 3: Transport & Travel Time */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Car className="w-4 h-4 text-haven-orchid" />
            <span>Transport & Route Plan</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-lavender-50/70 p-3 rounded-xl">
              <span className="text-[10px] text-ink-600 font-body block uppercase">Mode</span>
              <span className="font-display font-bold text-ink-900 text-xs mt-0.5 block">
                {plan.transportMode}
              </span>
            </div>

            <div className="bg-lavender-50/70 p-3 rounded-xl">
              <span className="text-[10px] text-ink-600 font-body block uppercase">Est. Travel Time</span>
              <span className="font-display font-bold text-ink-900 text-xs mt-0.5 block">
                ~{plan.estimatedTravelTimeMinutes} mins
              </span>
            </div>
          </div>

          <div className="bg-lavender-50/70 p-3 rounded-xl text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-ink-600 uppercase font-semibold block">Driver Contact</span>
              <span className="font-display font-bold text-ink-900 text-xs">
                {plan.driverName}
              </span>
            </div>
            <span className="font-body text-xs text-haven-deep font-semibold">
              {plan.driverPhone}
            </span>
          </div>
        </div>

        {/* Card 4: Emergency Logistics & Preparedness Checklist */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Package className="w-4 h-4 text-haven-orchid" />
            <span>Essential Readiness Checklist</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-lavender-50/70">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-body text-ink-900">Emergency Transport & Clinic Fund</span>
              </div>
              <span className="text-status-normal font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-lavender-50/70">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-red-500" />
                <div>
                  <span className="font-body text-ink-900 block">Identified Blood Donor</span>
                  <span className="text-[10px] text-ink-600">{plan.bloodDonorName}</span>
                </div>
              </div>
              <span className="text-status-normal font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-lavender-50/70">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-haven-orchid" />
                <span className="font-body text-ink-900">Hospital Bag & Baby Essentials Packed</span>
              </div>
              <span className="text-status-normal font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Care Wishes & Preferences */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <HeartHandshake className="w-4 h-4 text-haven-orchid" />
            <span>Care Preferences</span>
          </div>

          <div className="space-y-1.5 text-xs font-body text-ink-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-normal" />
              <span>Immediate skin-to-skin contact with baby</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-normal" />
              <span>Delayed umbilical cord clamping (1–3 minutes)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-normal" />
              <span>Early exclusive breastfeeding within 1st hour</span>
            </div>
          </div>

          {plan.specialNotes && (
            <p className="text-xs text-ink-600 italic bg-lavender-50/70 p-3 rounded-xl mt-2 leading-relaxed">
              "{plan.specialNotes}"
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Action Button */}
          <button
            onClick={onEditBirthPlan}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Edit3 className="w-5 h-5" />
            <span>Edit birth plan</span>
          </button>

          {/* Secondary Action Button */}
          <button
            onClick={onOpenShareSheet}
            className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-100/60 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share with partner</span>
          </button>
        </div>
      </div>
    </div>
  );
};
