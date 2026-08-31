import React, { useState } from 'react';
import {
  ArrowLeft,
  PhoneCall,
  AlertOctagon,
  ShieldCheck,
  ChevronRight,
  User,
  Baby,
  Building,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import Button from '../Button';

interface EmergencyEntryProps {
  isOpen: boolean;
  onClose: () => void;
  savedFacilityName?: string;
  savedFacilityPhone?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
}

export const EmergencyEntry: React.FC<EmergencyEntryProps> = ({
  isOpen,
  onClose,
  savedFacilityName = "Kariokor Health Centre / Pumwani Hospital",
  savedFacilityPhone = "+254 722 000 000",
  nextOfKinName = "Next of Kin / Partner",
  nextOfKinPhone = "+254 712 345 678",
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'mother' | 'baby' | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      {/* Container */}
      <div className="w-full max-w-[420px] h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-[28px] overflow-y-auto flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Full-bleed Urgent Header */}
        <div className="bg-[#E11D3C] text-white p-5 pt-6 sm:rounded-t-[28px] relative">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-pill text-[10px] font-display font-bold uppercase tracking-wider">
              <span>M-TODAY-006</span>
              <span>·</span>
              <span>Deterministic Mode</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#E11D3C] flex items-center justify-center font-display font-black text-2xl shadow-lg shrink-0">
              !
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight leading-tight">
                Emergency & Danger Signs
              </h1>
              <p className="font-body text-xs text-white/90 mt-0.5">
                Immediate protocol · No AI chat · Offline ready
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 flex-1">
          {/* Step 1: Who Needs Help? */}
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600 mb-2">
              Who needs immediate help?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedTarget('mother')}
                className={`p-4 rounded-card border text-left transition-all cursor-pointer ${
                  selectedTarget === 'mother'
                    ? 'bg-status-urgent-bg border-status-urgent ring-2 ring-status-urgent shadow-card-1'
                    : 'bg-white border-border-hairline hover:bg-lavender-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-status-urgent/10 text-status-urgent flex items-center justify-center mb-2">
                  <User className="w-5 h-5" />
                </div>
                <p className="font-display font-bold text-sm text-ink-900">
                  Mother / Pregnancy
                </p>
                <p className="font-body text-[11px] text-ink-600 mt-0.5">
                  Bleeding, severe headache, reduced fetal movement
                </p>
              </button>

              <button
                onClick={() => setSelectedTarget('baby')}
                className={`p-4 rounded-card border text-left transition-all cursor-pointer ${
                  selectedTarget === 'baby'
                    ? 'bg-status-urgent-bg border-status-urgent ring-2 ring-status-urgent shadow-card-1'
                    : 'bg-white border-border-hairline hover:bg-lavender-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-status-urgent/10 text-status-urgent flex items-center justify-center mb-2">
                  <Baby className="w-5 h-5" />
                </div>
                <p className="font-display font-bold text-sm text-ink-900">
                  Baby / Child
                </p>
                <p className="font-body text-[11px] text-ink-600 mt-0.5">
                  Fever, fast breathing, lethargy, poor feeding
                </p>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <div>
            <Button
              variant="emergency"
              disabled={!selectedTarget}
              onClick={() => {
                // In full triage pathway this progresses to symptom checklist
              }}
              className="w-full py-3.5 flex items-center justify-center gap-2"
            >
              <span>Continue to Danger Signs Checklist</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed Dial Section */}
          <div className="pt-2 border-t border-border-hairline space-y-2.5">
            <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600">
              Direct Speed Dial
            </p>

            {/* National Ambulance 1199 */}
            <a
              href="tel:1199"
              className="p-3.5 rounded-card bg-status-urgent-bg border border-status-urgent/30 flex items-center justify-between text-ink-900 hover:bg-status-urgent-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-status-urgent text-white flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-status-urgent">
                    National Ambulance (Kenya Red Cross)
                  </p>
                  <p className="font-body text-xs text-ink-600">
                    Toll-free emergency dispatch: 1199 / 999
                  </p>
                </div>
              </div>
              <span className="font-display font-bold text-xs bg-status-urgent text-white px-2.5 py-1 rounded-pill">
                1199
              </span>
            </a>

            {/* Saved Facility */}
            <a
              href={`tel:${savedFacilityPhone.replace(/\s+/g, '')}`}
              className="p-3.5 rounded-card bg-white border border-border-hairline shadow-card-1 flex items-center justify-between text-ink-900 hover:bg-lavender-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-lavender-100 text-haven-deep flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-ink-900">
                    {savedFacilityName}
                  </p>
                  <p className="font-body text-xs text-ink-600">
                    Primary Maternal Maternity Ward
                  </p>
                </div>
              </div>
              <span className="font-display font-bold text-xs text-haven-deep underline">
                Call
              </span>
            </a>

            {/* Partner / Next of Kin */}
            <a
              href={`tel:${nextOfKinPhone.replace(/\s+/g, '')}`}
              className="p-3.5 rounded-card bg-white border border-border-hairline shadow-card-1 flex items-center justify-between text-ink-900 hover:bg-lavender-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-lavender-100 text-haven-deep flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-ink-900">
                    {nextOfKinName}
                  </p>
                  <p className="font-body text-xs text-ink-600">
                    Registered Emergency Contact
                  </p>
                </div>
              </div>
              <span className="font-display font-bold text-xs text-haven-deep underline">
                Call
              </span>
            </a>
          </div>

          {/* Offline Safe Guarantee */}
          <div className="bg-lavender-100/60 rounded-card p-3 border border-border-hairline flex items-center gap-2 text-xs text-ink-600">
            <ShieldCheck className="w-4 h-4 text-status-normal shrink-0" />
            <span>Emergency numbers and triage guides work fully offline without internet.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
