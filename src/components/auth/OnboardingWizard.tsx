import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Heart, 
  Baby, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { KENYA_COUNTIES } from '../../types';
import { KENYA_KMHFL_FACILITIES } from '../../services/clinicianService';
import { calculateGestationFromLmp, calculateLmpFromEdd, createActivePregnancy, GestationCalculation } from '../../services/pregnancyService';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import Button from '../Button';

interface OnboardingWizardProps {
  userId: string;
  initialDisplayName?: string;
  initialPhone?: string;
  onCompleted: () => void;
}

export default function OnboardingWizard({
  userId,
  initialDisplayName = '',
  initialPhone = '',
  onCompleted,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Profile Setup
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [county, setCounty] = useState('Nairobi');
  const [primaryHospitalFacilityId, setPrimaryHospitalFacilityId] = useState('');
  const [primaryHospitalName, setPrimaryHospitalName] = useState('');

  // Filter KMHFL facilities by the selected county
  const availableHospitals = useMemo(() => {
    return KENYA_KMHFL_FACILITIES.filter(
      f => f.county.trim().toLowerCase() === county.trim().toLowerCase()
    );
  }, [county]);

  const handleCountyChange = (newCounty: string) => {
    setCounty(newCounty);
    // If county changes, clear hospital selection if it doesn't belong to the new county
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

  // Step 2: Pregnancy Setup
  const [calculationMode, setCalculationMode] = useState<'LMP' | 'EDD'>('LMP');
  const [lmpDate, setLmpDate] = useState(() => {
    // Default to ~20 weeks ago for realistic initial preview if empty
    const d = new Date();
    d.setDate(d.getDate() - 140);
    return d.toISOString().split('T')[0];
  });
  const [knownEdd, setKnownEdd] = useState('');
  const [gestationInfo, setGestationInfo] = useState<GestationCalculation>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 140);
    return calculateGestationFromLmp(d.toISOString().split('T')[0]);
  });

  // Step 3: Pregnancy History
  const [isFirstPregnancy, setIsFirstPregnancy] = useState(true);
  const [gravida, setGravida] = useState(1);
  const [parity, setParity] = useState(0);
  const [previousOutcomes, setPreviousOutcomes] = useState<string[]>([]);
  const [createdPregnancyId, setCreatedPregnancyId] = useState<string | null>(null);

  // Recalculate when LMP or EDD changes
  const handleLmpChange = (val: string) => {
    setLmpDate(val);
    if (val) {
      setGestationInfo(calculateGestationFromLmp(val));
    }
  };

  const handleEddChange = (val: string) => {
    setKnownEdd(val);
    if (val) {
      const calc = calculateLmpFromEdd(val);
      setGestationInfo(calc);
      setLmpDate(calc.lmp);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!county) {
      setError('Please select your Kenyan county.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Save mother profile to Firestore
      const profileRef = doc(db, 'motherProfiles', userId);
      await setDoc(profileRef, {
        userId,
        phone: initialPhone,
        dateOfBirth: dateOfBirth || '',
        county,
        primaryHospitalFacilityId: primaryHospitalFacilityId || null,
        primaryHospitalName: primaryHospitalName || null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Update user doc display name
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        displayName: displayName || 'Mama',
      });

      setStep(2);
    } catch (err: any) {
      console.error('Step 1 error', err);
      setError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmpDate && !knownEdd) {
      setError('Please provide your Last Menstrual Period or Due Date.');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const computedLmp = calculationMode === 'LMP' ? lmpDate : gestationInfo.lmp;
      const computedEdd = calculationMode === 'LMP' ? gestationInfo.edd : knownEdd;

      const pregnancyId = await createActivePregnancy(userId, computedLmp, computedEdd);
      setCreatedPregnancyId(pregnancyId);
      setStep(3);
    } catch (err: any) {
      console.error('Step 2 error', err);
      setError(err?.message || 'Failed to initialize pregnancy record.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (createdPregnancyId) {
        const pregRef = doc(db, 'pregnancies', createdPregnancyId);
        await updateDoc(pregRef, {
          gravida: isFirstPregnancy ? 1 : gravida,
          parity: isFirstPregnancy ? 0 : parity,
          previousOutcomes: isFirstPregnancy ? [] : previousOutcomes,
        });
      }

      // Mark user as onboarded
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        onboarded: true,
      });

      onCompleted();
    } catch (err: any) {
      console.error('Step 3 error', err);
      setError(err?.message || 'Failed to finalize setup.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOutcome = (outcome: string) => {
    setPreviousOutcomes(prev => 
      prev.includes(outcome) ? prev.filter(o => o !== outcome) : [...prev, outcome]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--lavender-50)] flex flex-col justify-between p-6 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Step Progress Tracker */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[12px] font-display font-semibold text-[var(--haven-orchid)] uppercase tracking-wider mb-2">
            <span>
              {step === 1 && 'Step 1 of 3 — About You'}
              {step === 2 && 'Step 2 of 3 — Your Pregnancy'}
              {step === 3 && 'Step 3 of 3 — Pregnancy History'}
            </span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-[var(--lavender-200)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--haven-deep)] rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: ABOUT YOU (M-AUTH-006) ================= */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-[24px] text-[var(--ink-900)] leading-tight">
                Tell us about you
              </h2>
              <p className="font-body text-[14px] text-[var(--ink-600)] mt-1">
                Help us tailor maternal recommendations to your location in Kenya.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Your Preferred Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
                County of Residence (Kenya)
              </label>
              <select
                value={county}
                onChange={e => handleCountyChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs cursor-pointer"
                required
              >
                {KENYA_COUNTIES.map(c => (
                  <option key={c} value={c}>{c} County</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Primary Hospital / Health Facility <span className="font-normal text-[var(--ink-500)]">(Optional)</span>
              </label>
              <select
                value={primaryHospitalFacilityId}
                onChange={e => {
                  const val = e.target.value;
                  setPrimaryHospitalFacilityId(val);
                  const found = KENYA_KMHFL_FACILITIES.find(f => f.code === val);
                  setPrimaryHospitalName(found ? found.name : '');
                }}
                className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs cursor-pointer"
              >
                <option value="">None / Select later</option>
                {availableHospitals.map(f => (
                  <option key={f.code} value={f.code}>
                    {f.name} ({f.level})
                  </option>
                ))}
              </select>
              {availableHospitals.length === 0 ? (
                <p className="text-[12px] text-[var(--ink-500)] mt-1">
                  No catalogued KMHFL facilities found in {county} County. You can continue without selecting a facility.
                </p>
              ) : (
                <p className="text-[12px] text-[var(--ink-500)] mt-1">
                  Choose your preferred maternity facility in {county} County or leave blank.
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-4">
              {loading ? 'Saving...' : 'Continue to pregnancy setup'}
            </Button>
          </form>
        )}

        {/* ================= STEP 2: PREGNANCY SETUP (M-AUTH-007) ================= */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-[24px] text-[var(--ink-900)] leading-tight">
                Your Pregnancy
              </h2>
              <p className="font-body text-[14px] text-[var(--ink-600)] mt-1">
                Calculate your gestational age and Estimated Due Date (+280 days).
              </p>
            </div>

            {/* Calculation Mode Toggle */}
            <div className="flex bg-[var(--lavender-100)] p-1 rounded-full border border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setCalculationMode('LMP')}
                className={`flex-1 py-2 rounded-full text-[13px] font-display font-bold transition-all cursor-pointer ${
                  calculationMode === 'LMP'
                    ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                    : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
                }`}
              >
                Last Period (LMP)
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('EDD')}
                className={`flex-1 py-2 rounded-full text-[13px] font-display font-bold transition-all cursor-pointer ${
                  calculationMode === 'EDD'
                    ? 'bg-white text-[var(--haven-deep)] shadow-xs'
                    : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
                }`}
              >
                Known Due Date (EDD)
              </button>
            </div>

            {calculationMode === 'LMP' ? (
              <div>
                <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  First Day of Last Menstrual Period
                </label>
                <input
                  type="date"
                  value={lmpDate}
                  onChange={e => handleLmpChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-1">
                  Doctor's Estimated Due Date
                </label>
                <input
                  type="date"
                  value={knownEdd}
                  onChange={e => handleEddChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[14px] border border-[var(--border-hairline)] bg-white focus:outline-none focus:border-[var(--haven-orchid)] text-[14px] shadow-xs"
                  required
                />
              </div>
            )}

            {/* Live Calculation Output Card */}
            <div className="bg-white rounded-[20px] p-5 border border-[var(--border-hairline)] shadow-card-1 space-y-3 mt-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--haven-orchid)] uppercase tracking-wider">
                    Current Gestation
                  </span>
                  <p className="font-display font-bold text-[22px] text-[var(--haven-deep)]">
                    Week {gestationInfo.gestationalAgeWeeks}, Day {gestationInfo.gestationalAgeDays}
                  </p>
                </div>
                <span className="px-3 py-1 bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[12px] font-display font-bold rounded-full">
                  Trimester {gestationInfo.trimester}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[13px]">
                <span className="text-[var(--ink-600)]">Estimated Due Date:</span>
                <span className="font-display font-bold text-[var(--ink-900)]">
                  {new Date(gestationInfo.edd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--ink-600)]">Days remaining:</span>
                <span className="font-display font-bold text-[var(--haven-orchid)]">
                  {gestationInfo.daysRemaining} days
                </span>
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-4">
              {loading ? 'Calculating...' : 'Save & continue'}
            </Button>
          </form>
        )}

        {/* ================= STEP 3: PREGNANCY HISTORY (M-AUTH-008) ================= */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-[24px] text-[var(--ink-900)] leading-tight">
                Obstetric History
              </h2>
              <p className="font-body text-[14px] text-[var(--ink-600)] mt-1">
                Baseline obstetric details aligned with your MOH 216 Handbook.
              </p>
            </div>

            {/* Is this your first pregnancy */}
            <div>
              <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-2">
                Is this your first pregnancy?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFirstPregnancy(true)}
                  className={`py-3 rounded-[14px] text-[14px] font-display font-bold border transition-all cursor-pointer ${
                    isFirstPregnancy
                      ? 'bg-[var(--lavender-100)] border-[var(--haven-deep)] text-[var(--haven-deep)] shadow-xs'
                      : 'bg-white border-[var(--border-hairline)] text-[var(--ink-600)]'
                  }`}
                >
                  Yes, first pregnancy
                </button>
                <button
                  type="button"
                  onClick={() => setIsFirstPregnancy(false)}
                  className={`py-3 rounded-[14px] text-[14px] font-display font-bold border transition-all cursor-pointer ${
                    !isFirstPregnancy
                      ? 'bg-[var(--lavender-100)] border-[var(--haven-deep)] text-[var(--haven-deep)] shadow-xs'
                      : 'bg-white border-[var(--border-hairline)] text-[var(--ink-600)]'
                  }`}
                >
                  No, previous pregnancies
                </button>
              </div>
            </div>

            {!isFirstPregnancy && (
              <div className="space-y-4 pt-2">
                {/* Gravida & Parity Steppers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-[16px] border border-[var(--border-hairline)] shadow-xs">
                    <span className="text-[12px] font-semibold text-[var(--ink-600)] block mb-1">
                      Total Pregnancies (Gravida)
                    </span>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setGravida(Math.max(2, gravida - 1))}
                        className="w-8 h-8 rounded-full bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-display font-bold text-[18px] text-[var(--ink-900)]">{gravida}</span>
                      <button
                        type="button"
                        onClick={() => setGravida(gravida + 1)}
                        className="w-8 h-8 rounded-full bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-[16px] border border-[var(--border-hairline)] shadow-xs">
                    <span className="text-[12px] font-semibold text-[var(--ink-600)] block mb-1">
                      Living Children (Parity)
                    </span>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setParity(Math.max(0, parity - 1))}
                        className="w-8 h-8 rounded-full bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-display font-bold text-[18px] text-[var(--ink-900)]">{parity}</span>
                      <button
                        type="button"
                        onClick={() => setParity(parity + 1)}
                        className="w-8 h-8 rounded-full bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Previous outcomes checklist */}
                <div>
                  <label className="block text-[13px] font-display font-semibold text-[var(--ink-900)] mb-2">
                    Previous Delivery Types (Check all that apply)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Full Term (SVD)', 'Caesarean (CS)', 'Preterm Delivery'].map(outcome => {
                      const selected = previousOutcomes.includes(outcome);
                      return (
                        <button
                          key={outcome}
                          type="button"
                          onClick={() => toggleOutcome(outcome)}
                          className={`p-2.5 rounded-[12px] text-[11px] font-display font-semibold border text-center transition-all cursor-pointer ${
                            selected
                              ? 'bg-[var(--haven-deep)] text-white border-[var(--haven-deep)] shadow-xs'
                              : 'bg-white border-[var(--border-hairline)] text-[var(--ink-600)]'
                          }`}
                        >
                          {outcome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-4">
              {loading ? 'Completing...' : 'Finish setup & go to dashboard'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
