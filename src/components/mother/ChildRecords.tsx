import React from 'react';
import { ChevronLeft, Baby, Syringe, Scale, Heart, ChevronRight } from 'lucide-react';
import { ChildDoc } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

interface ChildRecordsProps {
  child?: ChildDoc | null;
  onBack: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenRecordDetail: (rec: any) => void;
}

export const ChildRecords: React.FC<ChildRecordsProps> = ({
  child,
  onBack,
  onSelectCategory,
  onOpenRecordDetail,
}) => {
  const childEncounters = [
    {
      id: 'enc_1',
      title: 'Newborn Clinical Examination',
      category: 'Newborn',
      date: '14 Jan 2026',
      provenance: {
        source: 'verified_clinician' as const,
        clinicianName: 'Dr. M. Kimani',
        facilityName: 'Pumwani Maternity Hospital',
        recordedAt: '2026-01-14',
      },
      summary: 'Birth weight 3,300g, APGAR 9/10, BCG & OPV0 administered',
    },
    {
      id: 'enc_2',
      title: '6-Week PNC & Immunization Contact',
      category: 'Immunization',
      date: '25 Feb 2026',
      provenance: {
        source: 'verified_clinician' as const,
        clinicianName: 'Nurse A. Wanjiru',
        facilityName: 'Kariokor Health Centre',
        recordedAt: '2026-02-25',
      },
      summary: 'Pentavalent 1, PCV 1, Rota 1 given. Cord healed.',
    },
    {
      id: 'enc_3',
      title: '6-Month Growth & MUAC Check',
      category: 'Growth',
      date: '14 Jul 2026',
      provenance: {
        source: 'reported_caregiver' as const,
        recordedAt: '2026-07-14',
      },
      summary: 'Weight 7.1 kg, Length 65.5 cm, MUAC 13.0 cm',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">
          {child?.name || 'Baby Amara'}'s Records
        </h1>
        <div className="w-10" />
      </div>

      {/* Category Shortcuts */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onSelectCategory('newborn')}
          className="bg-white rounded-[18px] border border-border-hairline shadow-card-1 p-3 text-center hover:bg-lavender-50 transition-colors"
        >
          <Baby className="w-5 h-5 text-haven-orchid mx-auto mb-1" />
          <span className="font-display font-bold text-xs text-ink-900 block">Newborn</span>
        </button>
        <button
          onClick={() => onSelectCategory('immunization')}
          className="bg-white rounded-[18px] border border-border-hairline shadow-card-1 p-3 text-center hover:bg-lavender-50 transition-colors"
        >
          <Syringe className="w-5 h-5 text-haven-orchid mx-auto mb-1" />
          <span className="font-display font-bold text-xs text-ink-900 block">Vaccines</span>
        </button>
        <button
          onClick={() => onSelectCategory('growth')}
          className="bg-white rounded-[18px] border border-border-hairline shadow-card-1 p-3 text-center hover:bg-lavender-50 transition-colors"
        >
          <Scale className="w-5 h-5 text-haven-orchid mx-auto mb-1" />
          <span className="font-display font-bold text-xs text-ink-900 block">Growth</span>
        </button>
      </div>

      {/* Grouped Encounters */}
      <div className="space-y-3">
        <span className="font-body text-[11px] font-bold tracking-wider text-ink-600 uppercase px-1">
          RECORD HISTORY
        </span>

        <div className="space-y-2.5">
          {childEncounters.map((enc) => (
            <div
              key={enc.id}
              onClick={() => onOpenRecordDetail(enc)}
              className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2.5 cursor-pointer hover:border-haven-orchid/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-ink-900">
                    {enc.title}
                  </h4>
                  <p className="font-body text-xs text-ink-600 mt-0.5">{enc.date}</p>
                </div>
                <ProvenanceBadge provenance={enc.provenance} />
              </div>
              <p className="font-body text-xs text-ink-700 bg-lavender-50/50 p-2.5 rounded-xl border border-border-hairline/50">
                {enc.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
