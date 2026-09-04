// src/components/onboarding/AnonymousOnboarding.tsx
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Baby,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  ShieldCheck,
  Heart,
  Apple,
  ShieldAlert,
  PhoneCall,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import Button from '../Button';
import type { LifecycleStage, HealthContext } from '../../types/healthContext';
import {
  saveAnonymousContextDraft,
  getAnonymousContextDraft,
} from '../../services/anonymousContextService';

interface AnonymousOnboardingProps {
  onComplete: () => void;
  onCreateAccount: () => void;
  onCancel?: () => void;
}

const STAGES: Array<{ id: LifecycleStage; title: string; subtitle: string; icon: string }> = [
  { id: 'pregnancy', title: "I'm pregnant", subtitle: 'Track trimester, ANC visits & prepare for birth', icon: '🤰' },
  { id: 'postpartum', title: 'Recently gave birth', subtitle: 'Newborn care, recovery & feeding guidance', icon: '👶' },
  { id: 'parenting', title: 'Caring for a child', subtitle: 'Vaccines, growth milestones & nutrition', icon: '🧸' },
  { id: 'planning', title: 'Planning pregnancy', subtitle: 'Preconception nutrition & health preparation', icon: '🌱' },
  { id: 'supporter', title: 'Supporting a mother', subtitle: 'Partner & family guidance to support her care', icon: '🤝' },
  { id: 'exploring', title: 'Just learning', subtitle: 'MOH 216 guidelines & maternal health information', icon: '📖' },
];

const TOPICS = [
  { id: 'pregnancy', label: 'Pregnancy week-by-week' },
  { id: 'anc', label: 'ANC clinic visits (MOH 216)' },
  { id: 'nutrition', label: 'Kenyan maternal superfoods' },
  { id: 'warning_signs', label: 'Danger signs & emergencies' },
  { id: 'birth_prep', label: 'Birth preparation & packing' },
  { id: 'breastfeeding', label: 'Breastfeeding & newborn care' },
  { id: 'development', label: 'Child growth & milestones' },
  { id: 'wellbeing', label: 'Mental wellbeing & support' },
];

export default function AnonymousOnboarding({
  onComplete,
  onCreateAccount,
  onCancel,
}: AnonymousOnboardingProps) {
  const existingDraft = getAnonymousContextDraft();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stage, setStage] = useState<LifecycleStage>(existingDraft?.lifecycleStage || 'pregnancy');
  const [pregnancyWeek, setPregnancyWeek] = useState<number>(existingDraft?.pregnancyWeek || 16);
  const [useLmp, setUseLmp] = useState<boolean>(false);
  const [lmpDate, setLmpDate] = useState<string>('');
  const [childAge, setChildAge] = useState<HealthContext['childAgeBracket']>(existingDraft?.childAgeBracket || 'newborn');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    existingDraft?.interests?.length ? existingDraft.interests : ['pregnancy', 'anc', 'nutrition'],
  );
  const [language, setLanguage] = useState<'en' | 'sw'>(existingDraft?.language || 'en');

  // Calculate gestation from LMP if provided
  const lmpCalculation = useMemo(() => {
    if (!lmpDate) return null;
    const lmp = new Date(`${lmpDate}T00:00:00`);
    if (Number.isNaN(lmp.getTime())) return null;
    const today = new Date();
    const diffMs = today.getTime() - lmp.getTime();
    if (diffMs < 0) return null;
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.min(42, Math.floor(totalDays / 7));
    const edd = new Date(lmp.getTime());
    edd.setDate(edd.getDate() + 280);
    return {
      weeks: Math.max(1, weeks),
      edd: edd.toISOString().slice(0, 10),
    };
  }, [lmpDate]);

  const effectiveWeek = useLmp && lmpCalculation ? lmpCalculation.weeks : pregnancyWeek;

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSaveAndPreview = () => {
    saveAnonymousContextDraft({
      lifecycleStage: stage,
      language,
      pregnancyWeek: stage === 'pregnancy' ? effectiveWeek : undefined,
      dueDate: stage === 'pregnancy' && lmpCalculation ? lmpCalculation.edd : undefined,
      childAgeBracket: stage === 'parenting' || stage === 'postpartum' ? childAge : undefined,
      interests: selectedTopics,
      havenResponseStyle: 'concise',
    });
    setStep(4);
  };

  // Stage milestone helpers for Step 4 Preview
  const previewData = useMemo(() => {
    if (stage === 'pregnancy') {
      const trimester =
        effectiveWeek <= 12 ? 'First Trimester' : effectiveWeek <= 27 ? 'Second Trimester' : 'Third Trimester';
      let babySize = 'a sweet lemon';
      let milestone = 'Heartbeat is strong, fingers and toes are fully formed.';
      let nextAnc = 'ANC Contact 1 (before 12 weeks)';
      if (effectiveWeek > 12 && effectiveWeek <= 20) {
        babySize = 'a sweet bell pepper (~14 cm)';
        milestone = 'Baby can hear your voice and heart; tiny kicks are beginning.';
        nextAnc = 'ANC Contact 2 (recommended at 20 weeks)';
      } else if (effectiveWeek > 20 && effectiveWeek <= 28) {
        babySize = 'an ear of sweet corn (~35 cm)';
        milestone = 'Rapid brain development and responsive to light and sound.';
        nextAnc = 'ANC Contact 3 (recommended at 26 weeks)';
      } else if (effectiveWeek > 28) {
        babySize = 'a ripe butternut squash (~45 cm)';
        milestone = 'Practicing breathing movements and storing iron and calcium.';
        nextAnc = 'ANC Contact 4+ (close monitoring toward delivery)';
      }
      return {
        badge: `Week ${effectiveWeek} • ${trimester}`,
        title: `Baby is the size of ${babySize}`,
        milestone,
        ancReminder: nextAnc,
        nutritionFocus: 'Iron & Folate (IFAS): Managu, Terere, Spinach, Liver & Maziwa Lala',
        sampleQuestion: `Is mild backache normal at week ${effectiveWeek}?`,
      };
    }

    if (stage === 'postpartum') {
      return {
        badge: 'Postpartum & Newborn Recovery',
        title: 'Immediate Care & Healing',
        milestone: 'Exclusive breastfeeding, dry cord care, and maternal recovery checks.',
        ancReminder: 'PNC Visit 1 (within 24–48 hours) & PNC Visit 2 (at 1–2 weeks)',
        nutritionFocus: 'Hydration, traditional bone broths, Kunde, and protein for breastmilk.',
        sampleQuestion: 'How do I know my newborn is getting enough breastmilk?',
      };
    }

    if (stage === 'parenting') {
      return {
        badge: 'Child Health & Growth',
        title: 'KEPI Immunization & Milestones',
        milestone: 'Active developmental tracking, weight-for-age, and motor milestones.',
        ancReminder: 'Next KEPI clinic visit according to MOH 216 card schedule',
        nutritionFocus: 'Diverse complementary feeding after 6 months with fortified porridge and greens.',
        sampleQuestion: 'What vaccines are due at 6 weeks and 10 weeks in Kenya?',
      };
    }

    return {
      badge: 'Maternal & Child Health Knowledge',
      title: 'Trusted Kenyan MOH 216 Care Guide',
      milestone: 'Verified clinical standards covering pregnancy, birth preparedness and newborn care.',
      ancReminder: '8 ANC Contacts model endorsed by Kenya Ministry of Health',
      nutritionFocus: 'Balanced diet rich in leafy greens, protein and essential micronutrients.',
      sampleQuestion: 'What are the main danger signs to watch for during pregnancy?',
    };
  }, [stage, effectiveWeek]);

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--haven-orchid)] text-xs font-display font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Guest Personalization</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-semibold text-[var(--ink-500)]">
            Step {step} of 4
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[var(--ink-400)] hover:text-[var(--ink-700)] ml-2"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--haven-deep)] transition-all duration-300 rounded-full"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Ephemeral Privacy Guarantee Notice */}
      <div className="flex items-start gap-2.5 bg-white border border-[var(--border-hairline)] rounded-2xl p-3 text-xs text-[var(--ink-600)] shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Private &amp; Ephemeral:</strong> Your responses remain strictly on this device.
          No clinical record is created until you choose to register an account.
        </span>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: What brings you here? */}
      {/* ========================================================================= */}
      {step === 1 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-[var(--ink-900)]">
              What brings you to MomHaven today?
            </h2>
            <p className="text-sm text-[var(--ink-600)] mt-1">
              Select your journey so we can tailor your experience with relevant guidance.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {STAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStage(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  stage === item.id
                    ? 'border-[var(--haven-deep)] bg-[var(--surface-2)] ring-2 ring-[var(--haven-deep)]/10 shadow-xs'
                    : 'border-[var(--border-hairline)] bg-white hover:border-[var(--haven-orchid)]/50'
                }`}
              >
                <div className="text-2xl mb-1.5">{item.icon}</div>
                <div className="font-display font-bold text-sm text-[var(--ink-900)]">
                  {item.title}
                </div>
                <div className="text-xs text-[var(--ink-600)] mt-0.5 leading-relaxed">
                  {item.subtitle}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={() => setStep(2)}
              className="px-6 py-3 text-sm flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: What week are you? (or stage details) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <section className="space-y-5">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-[var(--ink-900)]">
              {stage === 'pregnancy'
                ? 'What week are you in your pregnancy?'
                : stage === 'parenting' || stage === 'postpartum'
                ? 'What is your child’s age bracket?'
                : 'Help us tune your visit'}
            </h2>
            <p className="text-sm text-[var(--ink-600)] mt-1">
              {stage === 'pregnancy'
                ? 'An estimate is fine. We will calculate your trimester and upcoming MOH 216 visit.'
                : 'This helps ensure you see the right milestones and reminders.'}
            </p>
          </div>

          {stage === 'pregnancy' && (
            <div className="bg-white border border-[var(--border-hairline)] rounded-2xl p-5 space-y-4 shadow-xs">
              {!useLmp ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-display font-bold text-[var(--ink-900)]">
                      Pregnancy Week
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--haven-deep)] font-display font-extrabold text-base">
                      Week {pregnancyWeek}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="42"
                    value={pregnancyWeek}
                    onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                    className="w-full accent-[var(--haven-deep)] cursor-pointer"
                  />

                  <div className="flex justify-between text-[11px] text-[var(--ink-500)] font-display font-medium">
                    <span>Week 1 (Early)</span>
                    <span>Week 20 (Mid)</span>
                    <span>Week 40 (Full Term)</span>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-hairline)]">
                    <button
                      type="button"
                      onClick={() => setUseLmp(true)}
                      className="text-xs font-display font-bold text-[var(--haven-orchid)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Or calculate from Last Menstrual Period (LMP)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-display font-bold text-[var(--ink-900)] mb-1">
                      First day of last menstrual period
                    </label>
                    <input
                      type="date"
                      value={lmpDate}
                      onChange={(e) => setLmpDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-hairline)] p-3 text-sm"
                    />
                  </div>

                  {lmpCalculation && (
                    <div className="p-3 bg-[var(--surface-2)] rounded-xl text-xs space-y-1">
                      <div className="font-display font-bold text-[var(--haven-deep)] text-sm">
                        Estimated: Week {lmpCalculation.weeks}
                      </div>
                      <div className="text-[var(--ink-600)]">
                        Estimated Due Date: {new Date(lmpCalculation.edd).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--border-hairline)]">
                    <button
                      type="button"
                      onClick={() => setUseLmp(false)}
                      className="text-xs font-display font-bold text-[var(--haven-orchid)] hover:underline cursor-pointer"
                    >
                      <span>Switch back to quick week selector</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(stage === 'parenting' || stage === 'postpartum') && (
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'newborn', label: 'Newborn (0–28 days)' },
                { id: '0_5_months', label: '1–5 months' },
                { id: '6_11_months', label: '6–11 months' },
                { id: '1_2_years', label: '1–2 years' },
                { id: '3_5_years', label: '3–5 years' },
              ].map((bracket) => (
                <button
                  key={bracket.id}
                  type="button"
                  onClick={() => setChildAge(bracket.id as HealthContext['childAgeBracket'])}
                  className={`p-3.5 rounded-xl border text-left text-xs font-display font-bold cursor-pointer transition-all ${
                    childAge === bracket.id
                      ? 'border-[var(--haven-deep)] bg-[var(--surface-2)] text-[var(--haven-deep)]'
                      : 'border-[var(--border-hairline)] bg-white text-[var(--ink-700)]'
                  }`}
                >
                  <Baby className="w-4 h-4 mb-1" />
                  {bracket.label}
                </button>
              ))}
            </div>
          )}

          {stage !== 'pregnancy' && stage !== 'parenting' && stage !== 'postpartum' && (
            <div className="bg-white border border-[var(--border-hairline)] rounded-2xl p-5 text-sm text-[var(--ink-600)] space-y-2">
              <p>
                We will configure your guest session for general maternal care, preconception
                health, and clinical preparedness.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-full border border-[var(--border-hairline)] text-xs font-display font-bold text-[var(--ink-700)] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <Button
              type="button"
              variant="primary"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 text-sm flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: What topics matter to you? */}
      {/* ========================================================================= */}
      {step === 3 && (
        <section className="space-y-5">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-[var(--ink-900)]">
              What matters to you right now?
            </h2>
            <p className="text-sm text-[var(--ink-600)] mt-1">
              Select key topics to shape your personalized preview and resources.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-display font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--haven-deep)] bg-[var(--surface-2)] text-[var(--haven-deep)] shadow-2xs'
                      : 'border-[var(--border-hairline)] bg-white text-[var(--ink-700)] hover:bg-gray-50'
                  }`}
                >
                  <span>{topic.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[var(--haven-deep)] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-[var(--border-hairline)] rounded-2xl p-4 space-y-2">
            <span className="text-xs font-display font-bold text-[var(--ink-900)] block">
              Preferred Language
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-lg text-xs font-display font-bold cursor-pointer ${
                  language === 'en'
                    ? 'bg-[var(--haven-deep)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--ink-700)]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('sw')}
                className={`py-2 px-3 rounded-lg text-xs font-display font-bold cursor-pointer ${
                  language === 'sw'
                    ? 'bg-[var(--haven-deep)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--ink-700)]'
                }`}
              >
                Kiswahili
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-full border border-[var(--border-hairline)] text-xs font-display font-bold text-[var(--ink-700)] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <Button
              type="button"
              variant="primary"
              onClick={handleSaveAndPreview}
              className="px-6 py-2.5 text-sm flex items-center gap-1.5"
            >
              <span>See my personalized preview</span>
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Personalized Preview & Continuity Call-to-Action */}
      {/* ========================================================================= */}
      {step === 4 && (
        <section className="space-y-4">
          {/* Milestone & Development Card */}
          <div className="bg-gradient-to-br from-[#33178A] to-[#6B3DB8] text-white p-5 rounded-[24px] shadow-card-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-display font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{previewData.badge}</span>
            </div>
            <h3 className="font-display font-extrabold text-xl leading-tight">
              {previewData.title}
            </h3>
            <p className="font-body text-xs text-purple-100 leading-relaxed">
              {previewData.milestone}
            </p>
          </div>

          {/* MOH 216 Clinical & Nutrition Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-[var(--haven-deep)] font-display font-bold text-xs">
                <Calendar className="w-4 h-4 text-[var(--haven-orchid)]" />
                <span>Next Recommended Clinic Visit</span>
              </div>
              <p className="text-xs text-[var(--ink-800)] font-medium leading-relaxed">
                {previewData.ancReminder}
              </p>
              <span className="text-[10px] text-[var(--ink-500)] block">
                Aligned with Kenya MOH 216 8-visit model
              </span>
            </div>

            <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-xs">
                <Apple className="w-4 h-4 text-emerald-600" />
                <span>Stage Nutrition Spotlight</span>
              </div>
              <p className="text-xs text-[var(--ink-800)] font-medium leading-relaxed">
                {previewData.nutritionFocus}
              </p>
              <span className="text-[10px] text-[var(--ink-500)] block">
                Locally sourced Kenyan superfoods
              </span>
            </div>
          </div>

          {/* Emergency Fast Banner */}
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>24/7 Red Cross &amp; MOH Hotline:</strong> Free emergency ambulance
              </span>
            </div>
            <a
              href="tel:1199"
              className="px-3 py-1 rounded-full bg-red-600 text-white font-display font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <PhoneCall className="w-3 h-3" />
              1199
            </a>
          </div>

          {/* Sample Haven Educational Prompt */}
          <div className="bg-white border border-[var(--border-hairline)] p-4 rounded-2xl shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold text-[var(--haven-deep)] uppercase tracking-wider">
                Ask Haven (Sample Preview)
              </span>
              <span className="text-[10px] bg-[var(--surface-2)] text-[var(--haven-orchid)] px-2 py-0.5 rounded-full font-bold">
                Preview Mode
              </span>
            </div>
            <div className="p-3 bg-[var(--surface-2)] rounded-xl text-xs text-[var(--ink-800)] italic">
              &ldquo;{previewData.sampleQuestion}&rdquo;
            </div>
            <p className="text-[11px] text-[var(--ink-500)] leading-relaxed">
              Haven is trained with Kenyan maternal protocols and MOH 216 guidelines. It answers
              with warmth and strict clinical safety boundaries.
            </p>
          </div>

          {/* Action Card: Save Journey vs Continue Privately */}
          <div className="bg-white border-2 border-[var(--haven-orchid)]/30 p-5 rounded-[24px] shadow-card-1 text-center space-y-3 pt-4">
            <div>
              <h4 className="font-display font-bold text-base text-[var(--ink-900)]">
                Create an account to save your journey
              </h4>
              <p className="text-xs text-[var(--ink-600)] mt-1 max-w-sm mx-auto">
                Save your personalized week, track digital MOH 216 records, and unlock full private
                conversations with Haven.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={onCreateAccount}
              className="w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Create account to save my journey</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <button
              type="button"
              onClick={onComplete}
              className="text-xs font-display font-bold text-[var(--haven-deep)] hover:underline pt-1 block mx-auto cursor-pointer"
            >
              Continue exploring privately on this device
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
