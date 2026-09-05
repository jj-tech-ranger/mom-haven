import React, { useMemo, useState } from 'react';
import { Baby, CalendarDays, Check, ChevronLeft, ChevronRight, Heart, MapPin, Sparkles } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Button from '../Button';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { KENYA_COUNTIES } from '../../types';
import { KENYA_KMHFL_FACILITIES } from '../../services/clinicianService';
import { createActivePregnancy, getActivePregnancy, calculateGestationFromLmp } from '../../services/pregnancyService';
import { saveHealthContext } from '../../services/healthContextService';
import type { AgeBracket, HealthContext, LifecycleStage } from '../../types/healthContext';

interface PremiumOnboardingWizardProps {
  userId: string;
  initialDisplayName?: string;
  initialLanguage?: 'en' | 'sw';
  onCompleted: () => void;
  onCancel?: () => void;
}

const INTERESTS = [
  ['pregnancy', 'Pregnancy week-by-week'],
  ['anc', 'ANC & appointments'],
  ['nutrition', 'Nutrition & healthy eating'],
  ['development', 'Baby development'],
  ['birth_prep', 'Birth preparation'],
  ['breastfeeding', 'Breastfeeding'],
  ['postpartum', 'Postpartum recovery'],
  ['wellbeing', 'Mental wellbeing'],
  ['warning_signs', 'Warning signs & when to seek care'],
  ['facilities', 'Finding health facilities'],
  ['records', 'Understanding my records'],
  ['clinician_prep', 'Preparing for clinician visits'],
] as const;

const STAGES: Array<{ id: LifecycleStage; title: string; description: string }> = [
  { id: 'pregnancy', title: "I'm pregnant", description: 'Personalize my pregnancy journey' },
  { id: 'planning', title: 'Planning a pregnancy', description: 'Prepare my body, mind and care plan' },
  { id: 'postpartum', title: 'I recently gave birth', description: 'Support my recovery and transition' },
  { id: 'parenting', title: "I'm caring for a baby or child", description: 'Follow growth, development and care' },
  { id: 'supporter', title: "I'm supporting a mother", description: 'Learn how to be a better support person' },
  { id: 'exploring', title: 'I want to learn', description: 'Explore trusted maternal and child health information' },
];

export default function PremiumOnboardingWizard({ userId, initialDisplayName = '', initialLanguage = 'en', onCompleted, onCancel }: PremiumOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('pregnancy');
  const [ageBracket, setAgeBracket] = useState<AgeBracket>('prefer_not_to_say');
  const [county, setCounty] = useState('Nairobi');
  const [primaryHospitalFacilityId, setPrimaryHospitalFacilityId] = useState('');
  const [primaryHospitalName, setPrimaryHospitalName] = useState('');
  const [language, setLanguage] = useState<'en' | 'sw'>(initialLanguage);
  const [lmp, setLmp] = useState('');
  const [edd, setEdd] = useState('');
  const [multiplePregnancy, setMultiplePregnancy] = useState(false);
  const [childAgeBracket, setChildAgeBracket] = useState<HealthContext['childAgeBracket']>();
  const [supportSystem, setSupportSystem] = useState<HealthContext['supportSystem']>('prefer_not_to_say');
  const [interests, setInterests] = useState<string[]>([]);
  const [havenResponseStyle, setHavenResponseStyle] = useState<HealthContext['havenResponseStyle']>('concise');

  const availableHospitals = useMemo(() => {
    return KENYA_KMHFL_FACILITIES.filter(
      f => f.county.trim().toLowerCase() === county.trim().toLowerCase()
    );
  }, [county]);

  const handleCountyChange = (newCounty: string) => {
    setCounty(newCounty);
    if (primaryHospitalFacilityId) {
      const match = KENYA_KMHFL_FACILITIES.find(
        f => f.code === primaryHospitalFacilityId && f.county.trim().toLowerCase() === newCounty.trim().toLowerCase()
      );
      if (!match) {
        setPrimaryHospitalFacilityId('');
        setPrimaryHospitalName('');
      }
    }
  };

  const pregnancyPreview = useMemo(() => {
    if (!lmp) return null;
    try { return calculateGestationFromLmp(lmp); } catch { return null; }
  }, [lmp]);

  const toggleInterest = (id: string) => setInterests(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  const canContinue = () => {
    if (step === 1) return Boolean(lifecycleStage && county);
    if (step === 2 && lifecycleStage === 'pregnancy') return Boolean(lmp || edd);
    return true;
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);
      let dueDate = edd || pregnancyPreview?.edd;
      let dueDateSource: 'LMP' | 'PROVIDER_CONFIRMED' | 'UNKNOWN' = lmp ? 'LMP' : edd ? 'PROVIDER_CONFIRMED' : 'UNKNOWN';

      if (lifecycleStage === 'pregnancy' && lmp && !edd) dueDate = pregnancyPreview?.edd;

      // Preserve the existing clinical record as the source of truth. Only create a
      // pregnancy here when the mother does not already have an active pregnancy.
      if (lifecycleStage === 'pregnancy' && lmp && dueDate) {
        const existing = await getActivePregnancy(userId);
        if (!existing) await createActivePregnancy(userId, lmp, dueDate);
        else {
          dueDate = existing.edd || dueDate;
          dueDateSource = existing.edd === edd ? 'PROVIDER_CONFIRMED' : dueDateSource;
        }
      }

      const now = new Date().toISOString();
      const context: Omit<HealthContext, 'version' | 'updatedAt'> = {
        lifecycleStage,
        userMode: 'authenticated',
        preferredName: displayName.trim() || 'Mama',
        ageBracket,
        county,
        primaryHospitalFacilityId: primaryHospitalFacilityId || undefined,
        primaryHospitalName: primaryHospitalName || undefined,
        language,
        pregnancy: lifecycleStage === 'pregnancy' ? {
          pregnancyWeek: pregnancyPreview?.gestationalAgeWeeks,
          dueDate,
          dueDateSource,
          multiplePregnancy,
        } : undefined,
        childAgeBracket: lifecycleStage === 'parenting' ? childAgeBracket : undefined,
        interests,
        dietaryPreferences: [],
        supportSystem,
        havenResponseStyle,
        onboardingCompletedAt: now,
      };

      await saveHealthContext(userId, context, 'initial_onboarding');
      await setDoc(doc(db, 'users', userId), {
        displayName: displayName.trim() || 'Mama',
        onboarded: true,
        onboardingVersion: 1,
        onboardingCompletedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, 'motherProfiles', userId), {
        userId,
        county,
        primaryHospitalFacilityId: primaryHospitalFacilityId || null,
        primaryHospitalName: primaryHospitalName || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      onCompleted();
    } catch (err: any) {
      console.error('Premium onboarding error', err);
      setError(err?.message || 'We could not save your setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    setLoading(true);
    try {
      // Mark onboarding as bypassed/complete in Firestore so user isn't prompted again
      await setDoc(doc(db, 'users', userId), {
        displayName: displayName.trim() || 'Mama',
        onboarded: true,
        onboardingVersion: 1,
        onboardingSkippedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, 'motherProfiles', userId), {
        userId,
        county: county || 'Nairobi',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not persist skipped onboarding status', err);
    } finally {
      setLoading(false);
      if (onCancel) {
        onCancel();
      } else {
        onCompleted();
      }
    }
  };

  const next = () => {
    if (!canContinue()) {
      setError(step === 2 && lifecycleStage === 'pregnancy' ? 'Add your last period or due date so we can personalize your pregnancy journey.' : 'Please complete the required fields.');
      return;
    }
    setError(null);
    if (step < 4) setStep(step + 1);
    else void handleComplete();
  };

  const back = () => { setError(null); setStep(Math.max(1, step - 1)); };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-6 sm:px-6 sm:py-10 font-body">
      <div className="mx-auto max-w-xl">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                disabled={loading}
                className="inline-flex items-center gap-1 text-xs font-display font-bold text-[var(--haven-deep)] hover:underline cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors mr-1"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 text-[var(--haven-orchid)] text-xs font-display font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> MomHaven setup
              </div>
              <h1 className="mt-1 font-display font-extrabold text-2xl text-[var(--text-primary)]">
                Make MomHaven yours
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-display font-bold text-[var(--text-secondary)]">
              {step} of 4
            </span>
            <button
              type="button"
              onClick={handleExit}
              disabled={loading}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-display font-bold px-3 py-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
              aria-label="Exit setup and continue to MomHaven"
            >
              Exit Setup
            </button>
          </div>
        </div>
        <div className="mb-7 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]"><div className="h-full rounded-full bg-[var(--haven-deep)] transition-all" style={{ width: `${(step / 4) * 100}%` }} /></div>

        {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-card-1 sm:p-7">
          {step === 1 && <section className="space-y-5">
            <div><h2 className="font-display font-extrabold text-xl">First, tell us what brings you here</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">This helps us choose the right journey without asking you for a long medical intake.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {STAGES.map(stage => <button key={stage.id} type="button" onClick={() => setLifecycleStage(stage.id)} className={`rounded-2xl border p-4 text-left transition-all ${lifecycleStage === stage.id ? 'border-[var(--haven-deep)] bg-[var(--surface-2)] ring-2 ring-[var(--haven-deep)]/10' : 'border-[var(--border)] hover:bg-[var(--surface-2)]'}`}><div className="font-display font-bold text-sm">{stage.title}</div><div className="mt-1 text-xs text-[var(--text-secondary)]">{stage.description}</div></button>)}
            </div>
            <div><label className="mb-1 block text-xs font-display font-bold">What should we call you?</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Preferred name" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm outline-none focus:border-[var(--haven-orchid)]" /></div>
            <div><label className="mb-1 block text-xs font-display font-bold">Age range <span className="font-normal text-[var(--text-secondary)]">(optional)</span></label><select value={ageBracket} onChange={e => setAgeBracket(e.target.value as AgeBracket)} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm"><option value="prefer_not_to_say">Prefer not to say</option><option value="under_18">Under 18</option><option value="18_24">18–24</option><option value="25_34">25–34</option><option value="35_44">35–44</option><option value="45_plus">45+</option></select></div>
          </section>}

          {step === 2 && <section className="space-y-5">
            <div><h2 className="font-display font-extrabold text-xl">{lifecycleStage === 'pregnancy' ? 'Anchor your pregnancy' : lifecycleStage === 'parenting' ? 'Tell us about your child’s stage' : 'Help us understand your journey'}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">You can change your preferences later. We keep detailed clinical information in your records, not in this survey.</p></div>
            {lifecycleStage === 'pregnancy' && <>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-xs font-display font-bold">Last menstrual period</label><input type="date" value={lmp} onChange={e => { setLmp(e.target.value); setEdd(''); }} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" /></div><div><label className="mb-1 block text-xs font-display font-bold">Provider-confirmed due date</label><input type="date" value={edd} onChange={e => { setEdd(e.target.value); setLmp(''); }} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" /></div></div>
              {pregnancyPreview && <div className="rounded-2xl bg-[var(--surface-2)] p-4"><div className="flex items-center gap-2 text-xs font-display font-bold text-[var(--haven-orchid)]"><CalendarDays className="h-4 w-4" /> YOUR PREVIEW</div><div className="mt-2 font-display font-extrabold text-lg">Week {pregnancyPreview.gestationalAgeWeeks}, Day {pregnancyPreview.gestationalAgeDays}</div><div className="mt-1 text-sm text-[var(--text-secondary)]">Estimated due date: {new Date(pregnancyPreview.edd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>}
              <button type="button" onClick={() => setMultiplePregnancy(!multiplePregnancy)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${multiplePregnancy ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}><span><span className="block text-sm font-display font-bold">Are you expecting more than one baby?</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">This is personalization context, not a clinical diagnosis.</span></span><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${multiplePregnancy ? 'border-[var(--haven-deep)] bg-[var(--haven-deep)] text-white' : 'border-[var(--border)]'}`}>{multiplePregnancy && <Check className="h-4 w-4" />}</span></button>
            </>}
            {lifecycleStage === 'parenting' && <div className="grid gap-3 sm:grid-cols-2">{[['newborn','Newborn'],['0_5_months','0–5 months'],['6_11_months','6–11 months'],['1_2_years','1–2 years'],['3_5_years','3–5 years']].map(([id,label]) => <button key={id} type="button" onClick={() => setChildAgeBracket(id as HealthContext['childAgeBracket'])} className={`rounded-2xl border p-4 text-left text-sm font-display font-bold ${childAgeBracket === id ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}><Baby className="mb-2 h-5 w-5" />{label}</button>)}</div>}
            {(lifecycleStage === 'postpartum' || lifecycleStage === 'supporter' || lifecycleStage === 'planning') && <div className="rounded-2xl bg-[var(--surface-2)] p-5 text-sm text-[var(--text-secondary)]"><Heart className="mb-3 h-5 w-5 text-[var(--haven-orchid)]" />We’ll keep this lightweight for now and personalize more as you use MomHaven.</div>}
          </section>}

          {step === 3 && <section className="space-y-5">
            <div><h2 className="font-display font-extrabold text-xl">Choose what matters to you</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Select as many as you like. These choices shape Today, resources and Haven conversations.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">{INTERESTS.map(([id,label]) => <button key={id} type="button" onClick={() => toggleInterest(id)} className={`flex items-center justify-between rounded-2xl border p-3.5 text-left text-sm ${interests.includes(id) ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}><span>{label}</span>{interests.includes(id) && <Check className="h-4 w-4 text-[var(--haven-deep)]" />}</button>)}</div>
            <div><label className="mb-1 block text-xs font-display font-bold">Who supports you most?</label><select value={supportSystem} onChange={e => setSupportSystem(e.target.value as HealthContext['supportSystem'])} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm"><option value="prefer_not_to_say">Prefer not to say</option><option value="partner">Partner</option><option value="family">Family</option><option value="friends">Friends</option><option value="community">Community</option><option value="health_worker">Health worker</option><option value="mostly_alone">Mostly on my own</option></select></div>
          </section>}

          {step === 4 && <section className="space-y-5">
            <div><h2 className="font-display font-extrabold text-xl">Make your experience feel right</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">These are preferences, not medical records. You can refine them later.</p></div>
            <div><label className="mb-2 block text-xs font-display font-bold">Language</label><div className="grid grid-cols-2 gap-3">{[['en','English'],['sw','Kiswahili']].map(([id,label]) => <button key={id} type="button" onClick={() => setLanguage(id as 'en'|'sw')} className={`rounded-2xl border p-4 font-display font-bold ${language === id ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}>{label}</button>)}</div></div>
            <div><label className="mb-2 block text-xs font-display font-bold">How should Haven respond?</label><div className="space-y-2">{[['concise','Short and simple'],['detailed','Detailed explanations'],['appointment_prep','Help me prepare for appointments'],['record_explanations','Help me understand my records'],['daily_guidance','Give me daily guidance']].map(([id,label]) => <button key={id} type="button" onClick={() => setHavenResponseStyle(id as HealthContext['havenResponseStyle'])} className={`w-full rounded-2xl border p-4 text-left text-sm font-display font-bold ${havenResponseStyle === id ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}>{label}</button>)}</div></div>
            <div>
              <label className="mb-1 block text-xs font-display font-bold">County of Residence</label>
              <div className="flex gap-2">
                <MapPin className="mt-3 h-5 w-5 text-[var(--haven-orchid)]" />
                <select value={county} onChange={e => handleCountyChange(e.target.value)} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm">
                  {KENYA_COUNTIES.map(item => <option key={item} value={item}>{item} County</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-display font-bold">
                Primary Hospital / Health Facility <span className="text-[var(--text-secondary)] font-normal">(Optional)</span>
              </label>
              <select
                value={primaryHospitalFacilityId}
                onChange={e => {
                  const val = e.target.value;
                  setPrimaryHospitalFacilityId(val);
                  const match = KENYA_KMHFL_FACILITIES.find(f => f.code === val);
                  setPrimaryHospitalName(match ? match.name : '');
                }}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm"
              >
                <option value="">None / Select later</option>
                {availableHospitals.map(f => (
                  <option key={f.code} value={f.code}>{f.name} ({f.level})</option>
                ))}
              </select>
              {availableHospitals.length === 0 && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">No KMHFL facilities listed for {county} County.</p>
              )}
            </div>
            <div className="rounded-2xl bg-[var(--surface-2)] p-4 text-xs text-[var(--text-secondary)]">Your setup creates a versioned personalization context. Pregnancy and child clinical records remain separate and authoritative.</div>
          </section>}

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-display font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}
            <Button
              type="button"
              variant="primary"
              onClick={next}
              disabled={loading}
              className="px-6 py-3"
            >
              {loading
                ? 'Saving your setup…'
                : step === 4
                ? 'Finish my setup'
                : 'Continue'}
              {!loading && step < 4 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
