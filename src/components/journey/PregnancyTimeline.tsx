import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Calendar, 
  Activity, 
  Heart, 
  X, 
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Button from '../Button';

interface PregnancyTimelineProps {
  currentWeek: number;
  onBack: () => void;
  onLogVisitForWeek: (week: number) => void;
}

interface MilestoneNode {
  week: number;
  title: string;
  category: 'clinical' | 'development' | 'milestone';
  description: string;
  testsRecommended: string[];
  fetalDevelopment: string;
}

const MILESTONES: MilestoneNode[] = [
  {
    week: 8,
    title: 'First Ultrasound & Baseline Labs',
    category: 'clinical',
    description: 'Confirm viability, dating, and routine baseline tests (Hb, HIV, Syphilis, Blood Group).',
    testsRecommended: ['Ultrasound dating scan', 'Baseline Hemoglobin (Hb)', 'Urinalysis', 'Blood Group & Rh status'],
    fetalDevelopment: 'Little heart is beating at ~150 bpm. Webbed fingers and facial features are starting to emerge.',
  },
  {
    week: 12,
    title: 'End of 1st Trimester & Nuchal Scan',
    category: 'milestone',
    description: 'Transition into the second trimester. Organogenesis is complete.',
    testsRecommended: ['Early morphology assessment', 'Blood pressure monitoring', 'IFAS supply refill'],
    fetalDevelopment: 'Baby has fingernails, can swallow amniotic fluid, and all vital organs are fully formed.',
  },
  {
    week: 16,
    title: 'Fetal Growth & Td Booster',
    category: 'clinical',
    description: 'First maternal Tetanus Diphtheria (Td) booster and growth trajectory check.',
    testsRecommended: ['Td Vaccine dose 1', 'Blood pressure & weight gain check', 'Urine protein test'],
    fetalDevelopment: 'Baby can perceive bright light outside the womb and is making small grasping motions.',
  },
  {
    week: 20,
    title: 'Anomaly Scan & Quickening',
    category: 'milestone',
    description: 'Detailed anatomical survey ultrasound to assess baby’s organs, heart chambers, and spine.',
    testsRecommended: ['Detailed Mid-Trimester Anomaly Scan', 'IPTp-SP dose 1 (in malaria areas)'],
    fetalDevelopment: 'You can feel distinct fluttery kicks and rolls. Baby develops vernix caseosa to protect delicate skin.',
  },
  {
    week: 24,
    title: 'Glucose Screening & ANC Contact 4',
    category: 'clinical',
    description: 'Screening for gestational diabetes, fundal height tracking, and fetal movement rhythm.',
    testsRecommended: ['Oral Glucose Tolerance Test (OGTT)', 'Fundal height measurement', 'Fetal heart rate check'],
    fetalDevelopment: 'Hearing is fully operational. Baby reacts to voices and music with heartbeat changes.',
  },
  {
    week: 28,
    title: '3rd Trimester & Anti-D Injection',
    category: 'clinical',
    description: 'Start of final trimester. Anti-D prophylaxis if mother is Rhesus negative.',
    testsRecommended: ['Repeat Hemoglobin (Hb) screening', 'Anti-D immunoglobulin (if Rh negative)', 'IPTp-SP dose 2'],
    fetalDevelopment: 'Baby can open and close eyelids and practice breathing motions using amniotic fluid.',
  },
  {
    week: 32,
    title: 'Fetal Growth & Position Assessment',
    category: 'clinical',
    description: 'Assessing fetal position (cephalic vertex vs breech) and placental location.',
    testsRecommended: ['Fetal presentation palpation', 'Blood pressure check for pre-eclampsia'],
    fetalDevelopment: 'Rapid weight gain. Baby is gaining about 200 grams per week and accumulating protective fat layers.',
  },
  {
    week: 36,
    title: 'Birth Plan Finalization & Pelvic Check',
    category: 'milestone',
    description: 'Finalize delivery facility logistics, emergency transport driver, and birth companion.',
    testsRecommended: ['Group B Strep screening', 'Birth preparedness checklist review', 'Weekly checkup plan'],
    fetalDevelopment: 'Lungs are producing surfactant. Baby drops lower into the pelvis (lightening).',
  },
  {
    week: 40,
    title: 'Full Term & Labor Readiness',
    category: 'milestone',
    description: 'Baby is fully developed and ready to be born! Watch for active labor signs.',
    testsRecommended: ['Cervical status assessment', 'Fetal heart rate monitoring', 'Non-stress test if post-term'],
    fetalDevelopment: 'Full term newborn ready for life outside the womb with established sucking reflexes.',
  },
];

export default function PregnancyTimeline({
  currentWeek = 24,
  onBack,
  onLogVisitForWeek,
}: PregnancyTimelineProps) {
  const [selectedNode, setSelectedNode] = useState<MilestoneNode | null>(null);

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
            Pregnancy Timeline
          </h1>
          <span className="text-[11px] font-semibold text-[var(--haven-orchid)]">
            Currently in Week {currentWeek}
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Vertical Ribbon Timeline Container */}
      <div className="p-4 sm:p-6 max-w-lg mx-auto relative">
        {/* Continuous Vertical Haven Ribbon Line */}
        <div className="absolute left-[34px] sm:left-[42px] top-8 bottom-8 w-1.5 bg-gradient-to-b from-emerald-500 via-[var(--haven-deep)] to-[var(--lavender-200)] rounded-full -z-0" />

        <div className="space-y-6 relative z-10">
          {MILESTONES.map(node => {
            const isCompleted = node.week < currentWeek;
            const isCurrent = node.week === currentWeek || (currentWeek >= node.week - 2 && currentWeek <= node.week + 2 && !isCompleted);
            const isUpcoming = node.week > currentWeek && !isCurrent;

            return (
              <div
                key={node.week}
                onClick={() => setSelectedNode(node)}
                className="flex items-start gap-3.5 cursor-pointer group"
              >
                {/* Node Milestone Circle */}
                <div className="relative shrink-0">
                  {isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-4 ring-white">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center shadow-lg ring-4 ring-purple-200 animate-pulse">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-[var(--lavender-200)] text-[var(--ink-400)] flex items-center justify-center shadow-xs ring-4 ring-[var(--lavender-50)]">
                      <span className="font-display font-bold text-[12px]">{node.week}w</span>
                    </div>
                  )}
                </div>

                {/* Node Content Card */}
                <div
                  className={`flex-1 p-4 rounded-[20px] border transition-all ${
                    isCurrent
                      ? 'bg-white border-2 border-[var(--haven-deep)] shadow-card-2'
                      : isCompleted
                      ? 'bg-white border-[var(--border-hairline)] shadow-card-1'
                      : 'bg-white/80 border-[var(--border-hairline)] opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-display font-bold px-2.5 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-[var(--haven-deep)] text-white'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[var(--lavender-100)] text-[var(--ink-600)]'
                      }`}
                    >
                      Week {node.week} {isCurrent && '· CURRENT'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--ink-400)] group-hover:text-[var(--haven-deep)] transition-colors" />
                  </div>

                  <h3 className="font-display font-bold text-[15px] text-[var(--ink-900)] mt-1.5">
                    {node.title}
                  </h3>

                  <p className="font-body text-[12px] text-[var(--ink-600)] mt-1 line-clamp-2">
                    {node.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= NODE DETAIL DRAWER / MODAL ================= */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <span className="px-3 py-1 bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-[12px] rounded-full">
                Week {selectedNode.week} Milestone
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <h2 className="font-display font-bold text-[22px] text-[var(--ink-900)] leading-tight">
                  {selectedNode.title}
                </h2>
                <p className="font-body text-[13px] text-[var(--ink-600)] mt-1">
                  {selectedNode.description}
                </p>
              </div>

              {/* Fetal Development */}
              <div className="p-4 rounded-[18px] bg-[var(--lavender-50)] border border-[var(--border-hairline)] space-y-1.5">
                <h4 className="font-display font-bold text-[13px] text-[var(--haven-deep)] flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Baby Development this Week</span>
                </h4>
                <p className="font-body text-[13px] text-[var(--ink-700)] leading-relaxed">
                  {selectedNode.fetalDevelopment}
                </p>
              </div>

              {/* Recommended Clinical Tests */}
              <div className="p-4 rounded-[18px] bg-white border border-[var(--border-hairline)] shadow-xs space-y-2">
                <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[var(--haven-orchid)]" />
                  <span>MOH Recommended Tests &amp; Interventions</span>
                </h4>
                <ul className="space-y-1 text-[13px] text-[var(--ink-700)]">
                  {selectedNode.testsRecommended.map((test, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--haven-orchid)] shrink-0" />
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  const w = selectedNode.week;
                  setSelectedNode(null);
                  onLogVisitForWeek(w);
                }}
                className="w-full py-3.5"
              >
                Log encounter for Week {selectedNode.week}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
