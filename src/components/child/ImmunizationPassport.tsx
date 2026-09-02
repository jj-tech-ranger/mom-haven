import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Syringe, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Info, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { ChildVaccineRecord } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';

interface ImmunizationPassportProps {
  childName: string;
  vaccines: ChildVaccineRecord[];
  onBack: () => void;
  onLogVaccine: (vaccineName?: string, recommendedAge?: string) => void;
}

interface VaccineScheduleItem {
  id: string;
  name: string;
  ageBracket: string;
  targetDisease: string;
  route: string;
}

export const KEPI_SCHEDULE: VaccineScheduleItem[] = [
  { id: 'bcg', name: 'BCG', ageBracket: 'At Birth', targetDisease: 'Tuberculosis', route: 'Intradermal (Right Forearm)' },
  { id: 'opv0', name: 'OPV 0 (Oral Polio)', ageBracket: 'At Birth', targetDisease: 'Poliomyelitis', route: 'Oral drops' },
  { id: 'penta1', name: 'Pentavalent 1 (DTP-HepB-Hib)', ageBracket: '6 Weeks', targetDisease: 'Diphtheria, Tetanus, Pertussis, Hep B, Hib', route: 'Intramuscular (Left Thigh)' },
  { id: 'pcv1', name: 'PCV 1 (Pneumococcal)', ageBracket: '6 Weeks', targetDisease: 'Pneumonia & Meningitis', route: 'Intramuscular (Right Thigh)' },
  { id: 'rota1', name: 'Rotavirus 1', ageBracket: '6 Weeks', targetDisease: 'Rotavirus Diarrhea', route: 'Oral' },
  { id: 'opv1', name: 'OPV 1', ageBracket: '6 Weeks', targetDisease: 'Poliomyelitis', route: 'Oral drops' },
  { id: 'penta2', name: 'Pentavalent 2', ageBracket: '10 Weeks', targetDisease: 'DTP, Hep B, Hib booster', route: 'Intramuscular (Left Thigh)' },
  { id: 'pcv2', name: 'PCV 2', ageBracket: '10 Weeks', targetDisease: 'Pneumococcal booster', route: 'Intramuscular (Right Thigh)' },
  { id: 'rota2', name: 'Rotavirus 2', ageBracket: '10 Weeks', targetDisease: 'Rotavirus booster', route: 'Oral' },
  { id: 'opv2', name: 'OPV 2', ageBracket: '10 Weeks', targetDisease: 'Poliomyelitis', route: 'Oral drops' },
  { id: 'penta3', name: 'Pentavalent 3', ageBracket: '14 Weeks', targetDisease: 'DTP, Hep B, Hib', route: 'Intramuscular (Left Thigh)' },
  { id: 'pcv3', name: 'PCV 3', ageBracket: '14 Weeks', targetDisease: 'Pneumococcal', route: 'Intramuscular (Right Thigh)' },
  { id: 'ipv', name: 'IPV (Inactivated Polio)', ageBracket: '14 Weeks', targetDisease: 'Polio protection booster', route: 'Intramuscular (Left Arm)' },
  { id: 'vita1', name: 'Vitamin A (100,000 IU)', ageBracket: '6 Months', targetDisease: 'Vitamin A deficiency / Eye health', route: 'Oral capsule' },
  { id: 'mr1', name: 'Measles-Rubella 1 (MR1)', ageBracket: '9 Months', targetDisease: 'Measles & Congenital Rubella', route: 'Subcutaneous (Right Arm)' },
  { id: 'yf', name: 'Yellow Fever', ageBracket: '9 Months', targetDisease: 'Yellow Fever (in endemic regions)', route: 'Subcutaneous' },
  { id: 'mr2', name: 'Measles-Rubella 2 (MR2)', ageBracket: '18 Months', targetDisease: 'Measles-Rubella immunity consolidation', route: 'Subcutaneous' },
  { id: 'deworm', name: 'Deworming (Albendazole)', ageBracket: 'Every 6 mos (1-5 yrs)', targetDisease: 'Soil-transmitted helminths / Worms', route: 'Oral tablet' },
];

export default function ImmunizationPassport({
  childName,
  vaccines,
  onBack,
  onLogVaccine,
}: ImmunizationPassportProps) {
  const [filter, setFilter] = useState<'All' | 'Given' | 'Pending'>('All');

  const givenCount = vaccines.filter(v => v.status === 'GIVEN').length;
  const verifiedCount = vaccines.filter(v => v.provenance?.status === 'VERIFIED').length;

  const filteredSchedule = KEPI_SCHEDULE.filter(item => {
    const isGiven = vaccines.some(v => v.vaccineName.toLowerCase().includes(item.id) || v.vaccineName.toLowerCase() === item.name.toLowerCase());
    if (filter === 'Given') return isGiven;
    if (filter === 'Pending') return !isGiven;
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
              Immunization Passport
            </h1>
            <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
              {childName} · KEPI Protocol
            </span>
          </div>
          <button
            type="button"
            onClick={() => onLogVaccine()}
            className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {(['All', 'Given', 'Pending'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-display font-bold transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                  : 'bg-[var(--lavender-100)] text-[var(--ink-600)] hover:bg-[var(--lavender-200)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* Compliance Summary Card */}
        <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
                KEPI Protection Status
              </span>
              <h3 className="font-display font-bold text-[20px] text-[var(--ink-900)]">
                {givenCount} of {KEPI_SCHEDULE.length} Doses Recorded
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-display font-bold">
              {verifiedCount} Verified
            </span>
          </div>

          <p className="font-body text-[12px] text-[var(--ink-600)]">
            Immunizations provide lifelong defense against preventable childhood diseases. Carry your MOH 216 card to every clinic visit.
          </p>
        </div>

        {/* Schedule List */}
        <div className="space-y-3">
          {filteredSchedule.map(item => {
            const recorded = vaccines.find(
              v => v.vaccineName.toLowerCase().includes(item.id) || v.vaccineName.toLowerCase() === item.name.toLowerCase()
            );
            const isGiven = Boolean(recorded && recorded.status === 'GIVEN');

            return (
              <div
                key={item.id}
                className={`p-4 rounded-[20px] border transition-all ${
                  isGiven
                    ? 'bg-white border-[var(--border-hairline)] shadow-card-1'
                    : 'bg-white/80 border-dashed border-[var(--border-hairline)] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isGiven
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[var(--lavender-100)] text-[var(--ink-600)]'
                      }`}
                    >
                      {isGiven ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Syringe className="w-4 h-4 text-[var(--haven-deep)]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                          {item.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-[var(--haven-orchid)] bg-[var(--lavender-100)] px-2 py-0.5 rounded-full">
                          {item.ageBracket}
                        </span>
                      </div>

                      <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                        Protects against: {item.targetDisease}
                      </p>

                      {isGiven && recorded ? (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-[var(--ink-700)]">
                            Given: {recorded.dateAdministered ? new Date(recorded.dateAdministered).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recorded'}
                            {recorded.facilityName ? ` at ${recorded.facilityName}` : ''}
                          </span>
                          <ProvenanceBadge provenance={recorded.provenance} />
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--ink-400)] block mt-1">
                          Route: {item.route}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isGiven && (
                    <button
                      type="button"
                      onClick={() => onLogVaccine(item.name, item.ageBracket)}
                      className="px-3 py-1.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-[12px] hover:bg-[var(--lavender-200)] transition-colors shrink-0 cursor-pointer"
                    >
                      + Log
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => onLogVaccine()}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Administered Vaccine</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
