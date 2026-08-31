import React, { useState, useEffect } from 'react';
import { AlertOctagon, Phone, X, ShieldAlert, HeartHandshake, MapPin } from 'lucide-react';
import Button from './Button';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerPhone?: string;
  transportPlan?: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  partnerPhone,
  transportPlan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'pregnancy' | 'newborn'>('pregnancy');

  useEffect(() => {
    const handleKeyDown萃 = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown萃);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown萃);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pregnancyDangerSigns = [
    { title: 'Vaginal Bleeding', desc: 'Any bleeding during pregnancy is an emergency. Do not wait.' },
    { title: 'Severe Headache or Blurred Vision', desc: 'Sign of pre-eclampsia / dangerously high blood pressure.' },
    { title: 'Fits or Convulsions', desc: 'Life-threatening emergency. Keep airway clear and rush to facility.' },
    { title: 'Reduced or No Baby Movement', desc: 'Unborn baby should move regularly in third trimester.' },
    { title: 'Severe Abdominal Pain', desc: 'Constant sharp or severe cramps.' },
    { title: 'Breaking Water (Fluid Leaking)', desc: 'Water breaking before term or prolonged labor.' },
    { title: 'High Fever & Chills', desc: 'High risk of severe malaria or sepsis.' },
  ];

  const newbornDangerSigns = [
    { title: 'Stops Breastfeeding / Unable to Suck', desc: 'Infant refuses or is too weak to feed.' },
    { title: 'Difficult or Fast Breathing', desc: 'Chest indrawing, grunting, or over 60 breaths/min.' },
    { title: 'Unusually Cold or Hot (High Fever)', desc: 'Hypothermia or neonatal sepsis.' },
    { title: 'Yellow Palms, Soles, or Eyes', desc: 'Severe neonatal jaundice.' },
    { title: 'Lethargic / Less Active / Floppy', desc: 'Baby does not wake or respond.' },
    { title: 'Umbilicus Bleeding or Pus with Bad Smell', desc: 'Cord infection requiring immediate antibiotics.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl border-2 border-status-emergency overflow-hidden flex flex-col max-h-[92vh]">
        {/* Emergency Header - Solid #E11D3C */}
        <div className="bg-status-emergency text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-100 font-sans">
                Immediate Action Required
              </span>
              <h2 className="text-xl font-bold font-display text-white">
                Emergency & Danger Signs
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close emergency modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Triage / Speed Dial Bar */}
        <div className="p-4 bg-status-urgent-bg border-b border-rose-100 flex flex-col gap-2">
          <div className="text-xs font-semibold text-status-urgent flex items-center gap-1.5 font-display">
            <ShieldAlert className="w-4 h-4 text-status-emergency" />
            <span>National Emergency Speed Dial (Kenya)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:1199"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-status-emergency text-white rounded-pill font-display font-semibold text-sm shadow-md hover:bg-rose-700 active:scale-95 transition-all text-center"
            >
              <Phone className="w-4 h-4" />
              <span>Red Cross: 1199</span>
            </a>
            <a
              href="tel:999"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-ink-900 text-white rounded-pill font-display font-semibold text-sm shadow-md hover:bg-purple-950 active:scale-95 transition-all text-center"
            >
              <Phone className="w-4 h-4" />
              <span>Emergency: 999</span>
            </a>
          </div>

          {/* Partner & Transport quick links if configured */}
          {partnerPhone ? (
            <div className="mt-1 flex items-center justify-between text-xs text-rose-900 bg-white/80 px-3 py-2 rounded-card border border-rose-200">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-haven-deep" />
                <span className="font-medium">Birth Plan Contact:</span>
              </div>
              <a
                href={`tel:${partnerPhone}`}
                className="font-bold text-haven-deep hover:underline tabular-nums"
              >
                {partnerPhone}
              </a>
            </div>
          ) : (
            <div className="mt-1 text-center text-[11px] text-ink-600 bg-white/80 py-2 rounded-card border border-rose-200">
              {transportPlan || 'No birth plan contact configured yet. Set up in your maternal profile.'}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Category Tabs */}
          <div className="flex rounded-chip p-1 bg-lavender-50 border border-border-hairline">
            <button
              onClick={() => setSelectedCategory('pregnancy')}
              className={`flex-1 py-1.5 text-xs font-display font-semibold rounded-chip transition-all cursor-pointer ${
                selectedCategory === 'pregnancy'
                  ? 'bg-white text-haven-deep shadow-sm'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Pregnancy Danger Signs
            </button>
            <button
              onClick={() => setSelectedCategory('newborn')}
              className={`flex-1 py-1.5 text-xs font-display font-semibold rounded-chip transition-all cursor-pointer ${
                selectedCategory === 'newborn'
                  ? 'bg-white text-haven-deep shadow-sm'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Newborn Danger Signs
            </button>
          </div>

          {/* Danger Signs List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-600">
              {selectedCategory === 'pregnancy' ? 'MOH 216 Page 14 Danger Signs' : 'MOH 216 Page 19 & 43 Danger Signs'}
            </h4>
            
            {(selectedCategory === 'pregnancy' ? pregnancyDangerSigns : newbornDangerSigns).map((sign, idx) => (
              <div
                key={idx}
                className="p-3 rounded-card border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition-colors flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-status-emergency mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-rose-950 font-display">
                    {sign.title}
                  </h5>
                  <p className="text-xs text-rose-900/80 leading-relaxed mt-0.5 font-body">
                    {sign.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency protocol guidance */}
          <div className="p-3.5 bg-lavender-50 rounded-card border border-border-hairline text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-display font-bold text-haven-deep">
              <MapPin className="w-3.5 h-3.5" />
              <span>Facility Action</span>
            </div>
            <p className="text-ink-600 text-[11px] leading-relaxed">
              If any danger sign is present, proceed immediately to the nearest health facility with maternity/neonatal emergency services.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-lavender-50 border-t border-border-hairline flex justify-between items-center text-xs text-ink-600">
          <span>MOH Kenya Emergency Protocol</span>
          <div className="w-24">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
