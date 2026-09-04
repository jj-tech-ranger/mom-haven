// src/components/child/ChildTimeline.tsx
import React from 'react';
import { CheckCircle2, Circle, Sparkles, ArrowLeft } from 'lucide-react';
import { calculateChildAge } from '../../services/childService';

interface ChildTimelineProps {
  childName: string;
  childDob: string;
  onBack?: () => void;
}

interface MilestoneNode {
  id: string;
  ageWeeks: number;
  ageMonths: number;
  label: string;
  title: string;
  category: 'Vaccine' | 'Growth & Feeding' | 'Development';
  description: string;
}

const MILESTONE_ROADMAP: MilestoneNode[] = [
  { id: 'birth', ageWeeks: 0, ageMonths: 0, label: 'Birth', title: 'Newborn Arrival & First Shots', category: 'Vaccine', description: 'BCG, OPV 0, Vitamin K, eye ointment, initial weight & APGAR.' },
  { id: '6w', ageWeeks: 6, ageMonths: 1.5, label: '6 Weeks', title: 'First Immunization Wave & PNC 3', category: 'Vaccine', description: 'OPV 1, Pentavalent 1, PCV10 1, Rotavirus 1. Postnatal maternal & infant checkup.' },
  { id: '10w', ageWeeks: 10, ageMonths: 2.5, label: '10 Weeks', title: 'Second Immunization Wave', category: 'Vaccine', description: 'OPV 2, Pentavalent 2, PCV10 2, Rotavirus 2. Social smile & head lift control.' },
  { id: '14w', ageWeeks: 14, ageMonths: 3.5, label: '14 Weeks', title: 'Third Immunization Wave + IPV', category: 'Vaccine', description: 'OPV 3, Pentavalent 3, PCV10 3, Inactivated Polio (IPV). Rolling over & babbling.' },
  { id: '6m', ageWeeks: 26, ageMonths: 6, label: '6 Months', title: 'Complementary Feeding & Vitamin A', category: 'Growth & Feeding', description: 'Introduce mashed family foods while continuing breastfeeding. Vitamin A blue capsule.' },
  { id: '9m', ageWeeks: 39, ageMonths: 9, label: '9 Months', title: 'Measles-Rubella 1 & Yellow Fever', category: 'Vaccine', description: 'MR 1 protection, finger foods, sitting unassisted, pincer grasp development.' },
  { id: '12m', ageWeeks: 52, ageMonths: 12, label: '12 Months (1 Year)', title: '1-Year Milestone & Vitamin A', category: 'Development', description: 'Vitamin A red capsule, standing with support, first intentional words.' },
  { id: '18m', ageWeeks: 78, ageMonths: 18, label: '18 Months', title: 'Measles-Rubella 2 & Active Walking', category: 'Vaccine', description: 'MR 2 booster dose, running, climbing, 10+ words vocabulary.' },
  { id: '2y', ageWeeks: 104, ageMonths: 24, label: '2 Years', title: 'Toddler Milestone & Deworming', category: 'Growth & Feeding', description: '2-word phrases, jumping, bi-annual deworming and Vitamin A schedule.' },
  { id: '3y', ageWeeks: 156, ageMonths: 36, label: '3 Years', title: 'Preschool Language & Social Play', category: 'Development', description: 'Full sentences, dressing assistance, interactive imaginative play.' },
  { id: '4y', ageWeeks: 208, ageMonths: 48, label: '4 Years', title: 'Motor Precision & Pre-school', category: 'Development', description: 'Hopping on one foot, drawing circles, storytelling, cooperative play.' },
  { id: '5y', ageWeeks: 260, ageMonths: 60, label: '5 Years', title: 'School Readiness & Healthy Growth', category: 'Development', description: 'Full gross motor mastery, counting, independent self-care routines.' },
];

export default function ChildTimeline({ childName, childDob, onBack }: ChildTimelineProps) {
  const ageInfo = calculateChildAge(childDob);

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] p-4 sm:p-6 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-900)] shadow-xs hover:bg-[var(--lavender-100)] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="text-center flex-1">
            <h2 className="font-display font-bold text-[19px] text-[var(--ink-900)]">
              {childName}&apos;s 5-Year Journey
            </h2>
            <p className="font-body text-xs text-[var(--haven-deep)] font-semibold mt-0.5">
              Current age: {ageInfo.ageFormatted}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Haven Ribbon Timeline */}
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[var(--haven-orchid)] before:via-purple-300 before:to-gray-200">
          {MILESTONE_ROADMAP.map((milestone) => {
            const isCompleted = ageInfo.months > milestone.ageMonths;
            const isCurrent = Math.abs(ageInfo.months - milestone.ageMonths) <= 1 && !isCompleted;
            const isUpcoming = ageInfo.months < milestone.ageMonths;

            return (
              <div key={milestone.id} className="relative group">
                {/* Node Pin */}
                <div
                  className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-white text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[var(--haven-orchid)] border-white text-white ring-4 ring-purple-100 animate-pulse'
                      : 'bg-white border-purple-200 text-purple-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 fill-current" />
                  )}
                </div>

                {/* Content Card */}
                <div
                  className={`rounded-xl p-4 border transition-all ${
                    isCurrent
                      ? 'bg-white border-teal-600 shadow-xs ring-1 ring-teal-200'
                      : isCompleted
                      ? 'bg-white border-[var(--border-hairline)] shadow-xs'
                      : 'bg-slate-50 border-dashed border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] font-display font-bold px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {milestone.label}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--ink-400)] uppercase tracking-wider">
                      {milestone.category}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                    {milestone.title}
                  </h4>
                  <p className="font-body text-[12px] text-[var(--ink-600)] mt-1 leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
