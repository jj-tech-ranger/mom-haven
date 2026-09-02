import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Sparkles, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { ChildMilestoneRecord } from '../../types';

interface MilestoneChecklistProps {
  childName: string;
  onBack: () => void;
}

interface MilestoneGroup {
  ageRange: string;
  domain: 'Gross Motor' | 'Fine Motor' | 'Language' | 'Cognitive' | 'Social-Emotional';
  items: { id: string; text: string; description: string }[];
}

const MILESTONE_DATA: MilestoneGroup[] = [
  {
    ageRange: '2 – 3 Months',
    domain: 'Social-Emotional',
    items: [
      { id: 'm1', text: 'Social Smile', description: 'Smiles spontaneously, especially at caregivers.' },
      { id: 'm2', text: 'Eye Tracking', description: 'Follows objects or moving faces across the field of vision.' },
    ],
  },
  {
    ageRange: '4 – 6 Months',
    domain: 'Gross Motor',
    items: [
      { id: 'm3', text: 'Steady Head Control', description: 'Holds head steady without support when held upright.' },
      { id: 'm4', text: 'Rolling Over', description: 'Rolls from tummy to back or back to tummy.' },
      { id: 'm5', text: 'Reaching & Grasping', description: 'Reaches for toys and brings objects to mouth.' },
    ],
  },
  {
    ageRange: '6 – 9 Months',
    domain: 'Language',
    items: [
      { id: 'm6', text: 'Babbling Sounds', description: 'Produces repetitive consonant-vowel sounds (ba-ba, ma-ma, da-da).' },
      { id: 'm7', text: 'Sitting Unsupported', description: 'Sits without support from pillows or hands.' },
      { id: 'm8', text: 'Stranger Awareness', description: 'Recognizes familiar faces and shows caution around strangers.' },
    ],
  },
  {
    ageRange: '9 – 12 Months',
    domain: 'Cognitive',
    items: [
      { id: 'm9', text: 'Object Permanence', description: 'Looks for hidden objects (e.g. peek-a-boo).' },
      { id: 'm10', text: 'Pincer Grasp', description: 'Picks up small pieces of soft food between thumb and index finger.' },
      { id: 'm11', text: 'Pulling to Stand', description: 'Pulls self up to standing position against furniture.' },
    ],
  },
  {
    ageRange: '12 – 18 Months',
    domain: 'Gross Motor',
    items: [
      { id: 'm12', text: 'First Independent Steps', description: 'Takes a few steps independently without holding on.' },
      { id: 'm13', text: 'First Words with Meaning', description: 'Says 1-3 specific words with clear meaning.' },
      { id: 'm14', text: 'Drinking from Cup', description: 'Holds and drinks from an open or sippy cup.' },
    ],
  },
];

export default function MilestoneChecklist({
  childName,
  onBack,
}: MilestoneChecklistProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(['m1', 'm2', 'm3', 'm4', 'm5', 'm6']);

  const toggleMilestone = (id: string) => {
    setCompletedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalItems = MILESTONE_DATA.reduce((acc, g) => acc + g.items.length, 0);
  const percentCompleted = Math.round((completedIds.length / totalItems) * 100);

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[var(--border-hairline)] sticky top-0 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-900)] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
            Developmental Milestones
          </h1>
          <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
            {childName} · 5 Domain Protocol
          </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
        {/* Progress Header */}
        <div className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
              5-Year Development Journey
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-[var(--haven-deep)] text-[12px] font-display font-bold">
              {completedIds.length} / {totalItems} Achieved
            </span>
          </div>

          <div className="h-2.5 w-full bg-[var(--lavender-100)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--haven-deep)] rounded-full transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>

          <p className="font-body text-[12px] text-[var(--ink-600)]">
            Every child develops at their own unique pace. If you notice persistent delays in multiple domains, discuss them with your pediatrician or clinic nurse.
          </p>
        </div>

        {/* Milestone Groups */}
        <div className="space-y-4">
          {MILESTONE_DATA.map((group, idx) => (
            <div key={idx} className="bg-white rounded-[22px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--haven-deep)]" />
                  <h3 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                    {group.ageRange}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-[var(--haven-orchid)] bg-[var(--lavender-50)] px-2.5 py-0.5 rounded-full">
                  {group.domain}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {group.items.map(item => {
                  const isChecked = completedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleMilestone(item.id)}
                      className={`p-3 rounded-[16px] border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[var(--lavender-50)] border-[var(--haven-orchid)]/40 shadow-xs'
                          : 'bg-white border-[var(--border-hairline)] hover:bg-[var(--lavender-50)]/40'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isChecked
                            ? 'bg-[var(--haven-deep)] text-white'
                            : 'border-2 border-[var(--lavender-200)] bg-white text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                          {item.text}
                        </h4>
                        <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
