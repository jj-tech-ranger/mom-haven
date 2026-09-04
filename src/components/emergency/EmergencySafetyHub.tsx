// src/components/emergency/EmergencySafetyHub.tsx
import React, { useState } from 'react';
import { 
  PhoneCall, 
  AlertTriangle, 
  HeartCrack, 
  Baby, 
  User, 
  ShieldAlert, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Ambulance, 
  Search,
  ExternalLink,
  ArrowLeft 
} from 'lucide-react';
import { EMERGENCY_DANGER_SIGNS, DangerSignItem } from '../../data/emergencyDangerSigns';
import { NATIONAL_BASELINE_CONTACTS, REGIONAL_REFERRAL_FACILITIES } from '../../services/emergencyGuidance';

interface EmergencySafetyHubProps {
  initialCategory?: 'MOTHER' | 'NEWBORN' | 'CHILD';
  driverPhone?: string;
  driverName?: string;
  facilityName?: string;
  onClose?: () => void;
}

export default function EmergencySafetyHub({ 
  initialCategory = 'MOTHER', 
  driverPhone,
  driverName,
  facilityName,
  onClose 
}: EmergencySafetyHubProps) {
  const [activeCategory, setActiveCategory] = useState<'MOTHER' | 'NEWBORN' | 'CHILD'>(initialCategory);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);
  const [expandedSignId, setExpandedSignId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSigns = EMERGENCY_DANGER_SIGNS.filter(
    (s) => s.category === activeCategory && (
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleSign = (id: string) => {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setExpandedSignId(id);
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] p-4 sm:p-6 pb-28">
      <div className="max-w-md mx-auto space-y-5">
        {/* Top Emergency Red Banner */}
        <div className="bg-[#E11D3C] text-white p-5 rounded-[24px] shadow-emergency space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-[19px] tracking-tight">
                  Emergency Safety Hub
                </h1>
                <p className="font-body text-[11px] text-white/90">
                  100% Offline Clinical Guidance & Dispatch
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                aria-label="Back / Exit Emergency Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Rapid Direct Dispatch Call Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="tel:1199"
              className="bg-white text-[#C4283C] hover:bg-gray-50 font-display font-bold py-3 px-3 rounded-[16px] text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <Ambulance className="w-4 h-4 text-[#C4283C]" />
              Call Red Cross (1199)
            </a>
            <a
              href="tel:999"
              className="bg-white text-[#1E293B] hover:bg-gray-50 font-display font-bold py-3 px-3 rounded-[16px] text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4 text-[#1E293B]" />
              Police / Medical (999)
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:116"
              className="bg-white/15 hover:bg-white/25 text-white font-display font-semibold py-2 px-2.5 rounded-[12px] text-[11px] flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3 h-3" />
              Childline: 116
            </a>
            <a
              href="tel:1195"
              className="bg-white/15 hover:bg-white/25 text-white font-display font-semibold py-2 px-2.5 rounded-[12px] text-[11px] flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3 h-3" />
              GBV Helpline: 1195
            </a>
          </div>
        </div>

        {/* Triage Category Selector */}
        <div className="bg-white border border-[var(--border-hairline)] p-1.5 rounded-[18px] grid grid-cols-3 gap-1 shadow-card-1">
          <button
            type="button"
            onClick={() => { setActiveCategory('MOTHER'); setExpandedSignId(null); }}
            className={`py-2.5 px-2 rounded-[14px] text-xs font-display font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeCategory === 'MOTHER'
                ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)] shadow-xs'
                : 'text-[var(--ink-600)] hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mother Signs</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveCategory('NEWBORN'); setExpandedSignId(null); }}
            className={`py-2.5 px-2 rounded-[14px] text-xs font-display font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeCategory === 'NEWBORN'
                ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)] shadow-xs'
                : 'text-[var(--ink-600)] hover:bg-gray-50'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>Newborn (0-28d)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveCategory('CHILD'); setExpandedSignId(null); }}
            className={`py-2.5 px-2 rounded-[14px] text-xs font-display font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeCategory === 'CHILD'
                ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)] shadow-xs'
                : 'text-[var(--ink-600)] hover:bg-gray-50'
            }`}
          >
            <HeartCrack className="w-4 h-4" />
            <span>Child (1m-5y)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search symptoms or danger signs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--border-hairline)] rounded-[14px] text-xs shadow-xs"
          />
        </div>

        {/* Danger Signs Interactive Checklist & Action Cards */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--ink-600)] px-1">
            Check matching symptoms for immediate triage guidance:
          </h3>

          {filteredSigns.map((sign) => {
            const isChecked = selectedSigns.includes(sign.id);
            const isExpanded = expandedSignId === sign.id;

            return (
              <div
                key={sign.id}
                className={`bg-white border rounded-[18px] p-4 transition-all shadow-card-1 ${
                  isChecked
                    ? 'border-[#E11D3C] bg-red-50/40 ring-1 ring-red-200'
                    : 'border-[var(--border-hairline)] hover:border-[var(--haven-orchid)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSign(sign.id)}
                      className="w-4 h-4 accent-[#E11D3C] mt-0.5 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                          {sign.title}
                        </span>
                        {sign.urgency === 'CRITICAL' && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-[var(--ink-600)] mt-1">
                        {sign.description}
                      </p>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedSignId(isExpanded ? null : sign.id)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Immediate Clinical Action Banner */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-red-200/60 bg-white/90 p-3 rounded-[12px] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-display font-bold text-[#C4283C]">
                      <AlertTriangle className="w-4 h-4 text-[#C4283C]" />
                      Immediate Action Required:
                    </div>
                    <p className="font-body text-xs text-gray-800 leading-relaxed">
                      {sign.immediateAction}
                    </p>
                    <a
                      href="tel:1199"
                      className="mt-2 w-full bg-[#E11D3C] hover:bg-[#BE123C] text-white py-2 px-3 rounded-full text-xs font-display font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      Dispatch Ambulance to Hospital
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verified Referral Facilities Directory */}
        <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] shadow-card-1 space-y-3">
          <h4 className="font-display font-bold text-sm text-[var(--ink-900)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--haven-orchid)]" />
            24-Hour Maternity & Referral Facilities
          </h4>
          <div className="divide-y divide-gray-100">
            {REGIONAL_REFERRAL_FACILITIES.map((fac) => (
              <div key={fac.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h5 className="font-display font-bold text-xs text-[var(--ink-900)]">{fac.name}</h5>
                  <p className="font-body text-[11px] text-[var(--ink-600)]">{fac.level} · {fac.location}</p>
                </div>
                <a
                  href={`tel:${fac.phone}`}
                  className="px-3 py-1.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-xs flex items-center gap-1 hover:bg-[var(--lavender-200)]"
                >
                  <PhoneCall className="w-3 h-3" />
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
