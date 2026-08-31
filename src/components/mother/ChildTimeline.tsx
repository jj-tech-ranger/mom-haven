import React, { useState } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  Baby,
  Heart,
  Syringe,
  Scale,
  Smile,
  Info,
  Calendar,
  X,
} from 'lucide-react';
import { ChildDoc } from '../../types';

interface ChildTimelineProps {
  child?: ChildDoc | null;
  onBack: () => void;
  onSelectCategory?: (category: string) => void;
}

interface ChildMilestone {
  id: string;
  ageWeeksOrMonths: number;
  ageLabel: string;
  category: 'newborn' | 'pnc' | 'immunization' | 'growth' | 'development';
  title: string;
  subtitle: string;
  details: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
}

export const ChildTimeline: React.FC<ChildTimelineProps> = ({
  child,
  onBack,
  onSelectCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<ChildMilestone | null>(
    null
  );

  // Default to 7 months for sample display or calculate from child.dateOfBirth
  const currentAgeMonths = child?.dateOfBirth
    ? Math.max(
        0,
        Math.floor(
          (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
            (1000 * 60 * 60 * 24 * 30.4375)
        )
      )
    : 7;

  const allMilestones: ChildMilestone[] = [
    {
      id: 'm-birth',
      ageWeeksOrMonths: 0,
      ageLabel: 'At Birth (Day 0)',
      category: 'newborn',
      title: 'Birth & Immediate Newborn Care',
      subtitle: 'BCG, OPV-0, Vitamin K1 & 7.1% Chlorhexidine cord care',
      details:
        'Immediate skin-to-skin contact within 1 hour. Administration of BCG vaccine (right upper arm), OPV 0 (oral drops), Vitamin K1 intramuscularly to prevent hemorrhagic disease, and 1% Tetracycline eye ointment for ophthalmia neonatorum prevention.',
      isCompleted: true,
    },
    {
      id: 'm-pnc-48h',
      ageWeeksOrMonths: 0.1,
      ageLabel: '48 Hours',
      category: 'pnc',
      title: 'PNC Contact 1 (Within 48h)',
      subtitle: 'Maternal recovery, umbilical stump check & latch assessment',
      details:
        'Critical check for maternal postpartum hemorrhage, lochia bleeding, blood pressure, infant breastfeeding latch, cord stump hygiene, and neonatal jaundice screening.',
      isCompleted: true,
    },
    {
      id: 'm-pnc-2w',
      ageWeeksOrMonths: 0.5,
      ageLabel: '1–2 Weeks',
      category: 'pnc',
      title: 'PNC Contact 2 (1–2 Weeks)',
      subtitle: 'Cord separation, neonatal jaundice & maternal mood check',
      details:
        'Verification of clean cord healing, infant weight gain velocity, maternal emotional wellbeing (EPDS post-partum depression screening), and exclusive breastfeeding support.',
      isCompleted: true,
    },
    {
      id: 'm-imm-6w',
      ageWeeksOrMonths: 1.5,
      ageLabel: '6 Weeks',
      category: 'immunization',
      title: '6-Week KEPI Immunization & PNC 3',
      subtitle: 'OPV 1, Pentavalent 1, PCV 1, Rotavirus 1',
      details:
        'First primary immunization round protecting against Diphtheria, Pertussis, Tetanus, Hep B, Hib, Pneumococcal pneumonia, and Rotavirus diarrhea. Postpartum family planning counseling for mother.',
      isCompleted: true,
    },
    {
      id: 'm-imm-10w',
      ageWeeksOrMonths: 2.5,
      ageLabel: '10 Weeks',
      category: 'immunization',
      title: '10-Week Immunization',
      subtitle: 'OPV 2, Pentavalent 2, PCV 2, Rotavirus 2',
      details:
        'Second booster series for DPT-HepB-Hib, Pneumococcal, and Rotavirus vaccine. Monitoring for mild post-vaccine fever management with paracetamol.',
      isCompleted: true,
    },
    {
      id: 'm-imm-14w',
      ageWeeksOrMonths: 3.5,
      ageLabel: '14 Weeks',
      category: 'immunization',
      title: '14-Week Immunization',
      subtitle: 'OPV 3, Pentavalent 3, PCV 3, IPV 1',
      details:
        'Completion of primary pentavalent and pneumococcal series, plus Inactivated Polio Vaccine (IPV) injection for enhanced systemic immunity.',
      isCompleted: true,
    },
    {
      id: 'm-pnc-6m',
      ageWeeksOrMonths: 6,
      ageLabel: '6 Months',
      category: 'growth',
      title: '6-Month Vitamin A & Complementary Feeding',
      subtitle: 'Vitamin A 100,000 IU & WHO growth assessment',
      details:
        'Introduction of diverse, nutrient-rich complementary foods while continuing breastfeeding up to 2 years. First bi-annual Vitamin A capsule administered.',
      isCompleted: true,
    },
    {
      id: 'm-dev-7m',
      ageWeeksOrMonths: 7,
      ageLabel: '7 Months (Current)',
      category: 'development',
      title: 'Sitting Unsupported & Object Transfer',
      subtitle: 'Active motor development and babbling consonants',
      details:
        'Baby sits steadily without support, transfers toys from hand to hand, responds to familiar voices, and produces consonant sounds like "ba-ba", "ma-ma".',
      isCompleted: false,
      isCurrent: true,
    },
    {
      id: 'm-imm-9m',
      ageWeeksOrMonths: 9,
      ageLabel: '9 Months',
      category: 'immunization',
      title: '9-Month Measles-Rubella & Yellow Fever',
      subtitle: 'MR 1 & Yellow Fever vaccines (Critical milestone)',
      details:
        'Life-saving immunization against Measles and Rubella (MR Dose 1) and Yellow Fever in endemic regions. MUAC mid-upper arm circumference measurement.',
      isCompleted: false,
    },
    {
      id: 'm-imm-12m',
      ageWeeksOrMonths: 12,
      ageLabel: '12 Months (1 Year)',
      category: 'growth',
      title: '1-Year Milestone & Deworming',
      subtitle: 'Vitamin A 200,000 IU, Albendazole & walking exploration',
      details:
        'First dose of Albendazole deworming, high-dose Vitamin A, standing with assistance, first meaningful words, and WHO 1-year growth chart audit.',
      isCompleted: false,
    },
    {
      id: 'm-imm-18m',
      ageWeeksOrMonths: 18,
      ageLabel: '18 Months',
      category: 'immunization',
      title: '18-Month Measles-Rubella Booster',
      subtitle: 'MR 2 vaccine & developmental speech evaluation',
      details:
        'Second dose of Measles-Rubella vaccine ensuring >98% lifetime immunity. Assessment of two-word combinations and active toddler play.',
      isCompleted: false,
    },
    {
      id: 'm-dev-24m',
      ageWeeksOrMonths: 24,
      ageLabel: '24 Months (2 Years)',
      category: 'development',
      title: '2-Year Development & Nutrition Check',
      subtitle: 'Running, climbing stairs, 50+ word vocabulary',
      details:
        'Complete assessment of 2-year physical growth (stunting prevention check), motor agility, social imitation, and bi-annual Vitamin A + Deworming.',
      isCompleted: false,
    },
  ];

  const filteredMilestones = allMilestones.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'newborn':
        return <Baby className="w-3.5 h-3.5" />;
      case 'pnc':
        return <Heart className="w-3.5 h-3.5" />;
      case 'immunization':
        return <Syringe className="w-3.5 h-3.5" />;
      case 'growth':
        return <Scale className="w-3.5 h-3.5" />;
      case 'development':
        return <Smile className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

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
            Child Timeline
          </h1>
          <p className="font-body text-[11px] text-ink-600">
            0 to 5-Year Healthcare & Growth Path
          </p>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Content Container */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Journey' },
            { id: 'newborn', label: 'Newborn (0–28d)' },
            { id: 'pnc', label: 'PNC Contacts' },
            { id: 'immunization', label: 'Immunization' },
            { id: 'growth', label: 'Growth' },
            { id: 'development', label: 'Development' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-pill font-display font-semibold text-xs whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-haven-deep text-white shadow-sm'
                  : 'bg-white text-ink-700 border border-border-hairline hover:bg-lavender-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Haven Ribbon Timeline Card */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 relative overflow-hidden">
          {/* Vertical Haven Ribbon Gradient Line */}
          <div className="absolute left-[34px] top-8 bottom-8 w-[3px] bg-gradient-to-b from-haven-deep via-haven-orchid to-lavender-200 rounded-full" />

          <div className="space-y-6 relative z-10">
            {filteredMilestones.map((milestone) => {
              const isCompleted = milestone.isCompleted;
              const isCurrent = milestone.isCurrent;

              return (
                <div
                  key={milestone.id}
                  onClick={() => setSelectedMilestone(milestone)}
                  className={`flex items-start gap-4 p-2.5 -mx-2 rounded-2xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-lavender-50/80 border border-haven-orchid/40'
                      : 'hover:bg-lavender-50/40'
                  }`}
                >
                  {/* Node Icon on Ribbon */}
                  <div className="flex-shrink-0 relative">
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-haven-deep text-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-haven-orchid flex items-center justify-center shadow-md animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-haven-orchid text-white flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-lavender-200 text-ink-600 flex items-center justify-center">
                        <Circle className="w-3 h-3 text-lavender-300" />
                      </div>
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-display font-semibold text-xs text-haven-deep">
                        {milestone.ageLabel}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-haven-orchid text-white font-display font-bold text-[10px]">
                          Now
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lavender-100 text-haven-deep text-[10px] font-body capitalize">
                        {getCategoryIcon(milestone.category)}
                        {milestone.category}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-ink-900 leading-tight">
                      {milestone.title}
                    </h4>
                    <p className="font-body text-xs text-ink-600 mt-0.5 leading-snug">
                      {milestone.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Context Info */}
        <div className="p-3.5 bg-lavender-100/70 border border-border-hairline rounded-[20px] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-haven-orchid flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-ink-700 leading-relaxed">
            Every encounter on the Child Timeline follows the Kenya MOH 216
            Mother-Child booklet. Tap any milestone to view detailed clinical
            rationale and guidance.
          </p>
        </div>
      </div>

      {/* Milestone Detail Drawer / Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[28px] sm:rounded-[24px] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border-hairline">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-lavender-100 text-haven-deep font-display font-bold text-xs">
                  {selectedMilestone.ageLabel}
                </span>
                <span className="text-xs font-body text-ink-600 capitalize">
                  {selectedMilestone.category} Care
                </span>
              </div>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="w-8 h-8 rounded-full bg-lavender-100 text-ink-600 flex items-center justify-center hover:bg-lavender-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg text-ink-900">
                {selectedMilestone.title}
              </h3>
              <p className="font-body text-xs text-haven-deep font-semibold">
                {selectedMilestone.subtitle}
              </p>
            </div>

            <div className="p-4 rounded-[20px] bg-lavender-50 border border-border-hairline space-y-2">
              <span className="text-xs font-display font-bold text-ink-900 block">
                Kenya MOH 216 Clinical Guidance
              </span>
              <p className="font-body text-xs text-ink-700 leading-relaxed">
                {selectedMilestone.details}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedMilestone(null);
                  if (onSelectCategory) {
                    onSelectCategory(selectedMilestone.category);
                  }
                }}
                className="w-full py-3 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-sm shadow-btn-primary hover:opacity-95 transition-opacity cursor-pointer"
              >
                Explore {selectedMilestone.category} Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
