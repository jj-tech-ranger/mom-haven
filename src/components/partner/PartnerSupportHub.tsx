// src/components/partner/PartnerSupportHub.tsx
import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Smile, 
  ShieldAlert, 
  Coffee, 
  Utensils, 
  Users, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';

interface GuideModule {
  id: string;
  title: string;
  trimester: string;
  category: 'Emotional' | 'Logistics' | 'Labor' | 'Postpartum' | 'Nutrition';
  summary: string;
  content: string[];
  actionChecklist: string[];
}

const PARTNER_GUIDES: GuideModule[] = [
  {
    id: 'g-nausea',
    title: 'First-Trimester Support: Managing Morning Sickness & Fatigue',
    trimester: 'Trimester 1 (Weeks 1-12)',
    category: 'Nutrition',
    summary: 'Practical Kenyan household tips to relieve early pregnancy nausea and support energy levels.',
    content: [
      'Morning sickness is caused by surging pregnancy hormones (hCG and progesterone) and can happen at any time of day.',
      'Small, frequent meals are much gentler on her digestive system than large heavy plates of food.',
      'Keep plain dry crackers, ginger biscuits, or roasted groundnuts on her bedside table so she can eat a few bites before stepping out of bed in the morning.',
      'Take over strong-smelling kitchen tasks like frying onions or handling raw meat if the aroma triggers nausea.'
    ],
    actionChecklist: [
      'Stock ginger tea and fresh lemon at home',
      'Encourage her to take naps without feeling guilty',
      'Offer water or diluted fresh fruit juice between meals',
      'Remind her gently about her daily IFAS (Iron & Folic Acid) supplement'
    ]
  },
  {
    id: 'g-blood',
    title: 'Nutritional Foods on a Budget: Building Strong Maternal Blood',
    trimester: 'Trimester 2 (Weeks 13-27)',
    category: 'Nutrition',
    summary: 'Affordable local Kenyan superfoods that prevent maternal anaemia (iron deficiency).',
    content: [
      'During pregnancy, her blood volume expands by nearly 50%, requiring substantial iron to deliver oxygen to the baby.',
      'Affordable local leafy greens (Managu, Terere/Amaranth, Kunde, Saga/Spider plant) are packed with iron and minerals.',
      'Pair plant-based iron with Vitamin C (oranges, tomatoes, lemons) to enhance iron absorption.',
      'Avoid giving her black tea or coffee within two hours of meals or iron pills, as tannins block iron absorption.'
    ],
    actionChecklist: [
      'Shop at local markets for fresh traditional greens 2-3 times a week',
      'Cook liver, eggs, or small dried fish (omena) twice weekly if affordable',
      'Ensure clean drinking water is always boiled or filtered',
      'Accompany her to her scheduled ANC Visit 2 or 3'
    ]
  },
  {
    id: 'g-companion',
    title: 'Being an Effective Birth Companion in the Delivery Ward',
    trimester: 'Trimester 3 & Labor (Weeks 28-40+)',
    category: 'Labor',
    summary: 'How to be a calming, protective advocate and physical comfort provider during childbirth.',
    content: [
      'Your physical presence, calm voice, and continuous encouragement can significantly reduce her labor anxiety and perception of pain.',
      'Apply firm circular counter-pressure on her lower sacrum (lower back) with the heel of your palm during contractions.',
      'Help her change positions — walking, leaning forward against you, or gentle rhythmic swaying.',
      'Be her polite, clear advocate with doctors and midwives: keep her ID, SHA/NHIF card, and MOH 216 Handbook readily accessible.'
    ],
    actionChecklist: [
      'Memorize the fastest route to your chosen maternity hospital at night',
      'Pack change of clothes, phone chargers, and warm socks in the maternity bag',
      'Save M-Pesa hospital emergency transport funds',
      'Encourage slow, deep breathing ("in through nose, out through relaxed mouth")'
    ]
  },
  {
    id: 'g-postpartum',
    title: 'Postpartum Support: Spotting Baby Blues & Supporting Recovery',
    trimester: 'Postnatal (0 - 6 Months)',
    category: 'Postpartum',
    summary: 'Supporting mother healing, breastfeeding, and emotional wellbeing after childbirth.',
    content: [
      'Her body has undergone major physical changes and hormonal shifts. Physical recovery takes weeks.',
      'Around 80% of new mothers experience "baby blues" (tearfulness, mood swings) in the first 1-2 weeks due to hormonal plunge.',
      'Postpartum depression is deeper and longer-lasting (severe anxiety, detachment, hopelessness). Professional clinical support is essential and effective.',
      'Take charge of household chores, laundry, meal prep, and visitors so she can rest and bond with the baby.'
    ],
    actionChecklist: [
      'Bring her a glass of warm water or soup whenever she sits to breastfeed',
      'Learn burping, swaddling, and diapering techniques to give her uninterrupted sleep',
      'Screen for postpartum warning signs (heavy bleeding, foul lochia, fever, severe sadness)',
      'Ensure baby attends the 48-hour and 2-week postnatal clinical checkups'
    ]
  }
];

export default function PartnerSupportHub() {
  const [selectedGuideId, setSelectedGuideId] = useState<string>('g-nausea');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const activeGuide = PARTNER_GUIDES.find(g => g.id === selectedGuideId) || PARTNER_GUIDES[0];

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-[var(--border-hairline)] p-4 sm:p-5 rounded-[22px] shadow-card-1">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[16px] text-[var(--ink-900)] leading-tight">
              Kenyan Partner Support Guides
            </h2>
            <p className="text-[11px] text-[var(--ink-600)]">
              Evidence-based, practical actions for maternal companionship and fatherhood.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Modules List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PARTNER_GUIDES.map(guide => {
          const isSelected = guide.id === selectedGuideId;
          return (
            <button
              key={guide.id}
              type="button"
              onClick={() => setSelectedGuideId(guide.id)}
              className={`text-left p-3.5 rounded-[18px] border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--haven-deep)] text-white border-[var(--haven-deep)] shadow-card-1'
                  : 'bg-white text-[var(--ink-900)] border-[var(--border-hairline)] hover:border-[var(--haven-orchid)] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[var(--lavender-100)] text-[var(--haven-deep)]'
                }`}>
                  {guide.category}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                  {guide.trimester.split(' ')[0]} {guide.trimester.split(' ')[1]}
                </span>
              </div>
              <h4 className="font-display font-bold text-[13px] leading-snug line-clamp-2">
                {guide.title}
              </h4>
            </button>
          );
        })}
      </div>

      {/* Selected Guide Details & Action Checklist */}
      <div className="bg-white border border-[var(--border-hairline)] p-5 rounded-[22px] shadow-card-1 space-y-4">
        <div className="border-b border-[var(--border-hairline)] pb-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--haven-orchid)] mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{activeGuide.trimester}</span>
          </div>
          <h3 className="font-display font-bold text-[17px] text-[var(--ink-900)]">
            {activeGuide.title}
          </h3>
          <p className="text-[12px] text-[var(--ink-600)] mt-1 font-body">
            {activeGuide.summary}
          </p>
        </div>

        {/* Clinical Knowledge Points */}
        <div className="space-y-2.5">
          <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
            Key Knowledge for Partners
          </h4>
          <div className="space-y-2 text-[12px] text-[var(--ink-700)] leading-relaxed">
            {activeGuide.content.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-[var(--lavender-50)] p-2.5 rounded-[12px]">
                <span className="w-5 h-5 rounded-full bg-[var(--lavender-200)] text-[var(--haven-deep)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Partner Checklist */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
          <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Your Action Checklist Today
          </h4>
          <div className="space-y-2">
            {activeGuide.actionChecklist.map((task, idx) => {
              const taskId = `${activeGuide.id}-${idx}`;
              const isChecked = !!completedItems[taskId];
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-[12px] border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-white border-[var(--border-hairline)] hover:border-[var(--haven-orchid)] text-[var(--ink-800)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(taskId)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span className={`text-[12px] font-body ${isChecked ? 'line-through text-emerald-700/70' : 'font-medium'}`}>
                    {task}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
