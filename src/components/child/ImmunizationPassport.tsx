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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Official Kenya MOH Handbook Banner */}
      <div className="bg-slate-800 text-slate-200 px-4 py-1.5 border-b border-slate-700 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <span className="flex items-center gap-1.5 font-semibold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          REPUBLIC OF KENYA · MINISTRY OF HEALTH
        </span>
        <span className="text-slate-400 font-mono">MOH 216 · KEPI PASSPORT</span>
      </div>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h1 className="font-display font-bold text-base text-slate-900">
              Immunization Register
            </h1>
            <span className="text-[11px] font-mono text-teal-700 font-medium">
              {childName} · KEPI Protocol (pp. 31–34)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onLogVaccine()}
            className="w-9 h-9 rounded-lg bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            aria-label="Record vaccine"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['All', 'Given', 'Pending'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* Compliance Summary Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider">
                KEPI Protection Status
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900">
                <span className="font-mono text-teal-700 font-bold">{givenCount}</span> of {KEPI_SCHEDULE.length} Doses Recorded
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
              {verifiedCount} Clinician Verified
            </span>
          </div>

          <p className="font-body text-xs text-slate-600 leading-relaxed">
            Immunizations provide lifelong defense against preventable childhood diseases. Ensure entries match your official MOH 216 card stamps.
          </p>
        </div>

        {/* Schedule List */}
        <div className="space-y-2.5">
          {filteredSchedule.map(item => {
            const recorded = vaccines.find(
              v => v.vaccineName.toLowerCase().includes(item.id) || v.vaccineName.toLowerCase() === item.name.toLowerCase()
            );
            const isGiven = Boolean(recorded && recorded.status === 'GIVEN');

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isGiven
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-white/70 border-dashed border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isGiven
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isGiven ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Syringe className="w-4 h-4 text-teal-700" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          {item.ageBracket}
                        </span>
                        {recorded && (
                          <ProvenanceBadge provenance={recorded.provenance} />
                        )}
                      </div>

                      <p className="font-mono text-[10px] uppercase text-slate-500 mt-0.5">
                        Route: {item.route} · Target: {item.targetDisease}
                      </p>

                      {isGiven && recorded ? (
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                          <span>
                            Given: {recorded.dateAdministered ? new Date(recorded.dateAdministered).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recorded'}
                            {recorded.facilityName ? ` at ${recorded.facilityName}` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 block mt-1">
                          Route: {item.route}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isGiven && (
                    <button
                      type="button"
                      onClick={() => onLogVaccine(item.name, item.ageBracket)}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 shrink-0 cursor-pointer transition-colors"
                    >
                      Record
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onLogVaccine()}
            className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Administered Vaccine</span>
          </button>
        </div>
      </div>
    </div>
  );
}
