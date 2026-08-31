import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Plus, Trash2, Check } from 'lucide-react';
import Button from '../Button';
import { HavenRibbon } from '../HavenRibbon';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Provenance } from '../../types';

interface AddPregnancyHistoryProps {
  userId: string;
  pregnancyId?: string;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

interface PriorPregnancyEntry {
  year: string;
  deliveryType: string;
  outcome: string;
  birthWeightKg?: string;
  facility?: string;
}

export const AddPregnancyHistory: React.FC<AddPregnancyHistoryProps> = ({
  userId,
  onBack,
  onComplete,
  onSkip,
}) => {
  // Stepper Sub-steps
  // 1: Obstetric History (Gravida / Para / Prior deliveries)
  // 2: Pre-existing health conditions / Blood group
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Obstetric summary
  const [isFirstPregnancy, setIsFirstPregnancy] = useState<boolean | null>(null);
  const [gravida, setGravida] = useState<number>(1); // Total number of pregnancies including current
  const [para, setPara] = useState<number>(0); // Total number of viable births
  const [priorDeliveries, setPriorDeliveries] = useState<PriorPregnancyEntry[]>([]);

  // Step 2: Basic health indicators
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [rhesus, setRhesus] = useState<'+' | '-' | ''>('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState<string>('');

  const commonConditions = [
    'Hypertension',
    'Diabetes',
    'Asthma',
    'Sickle Cell Trait / Disease',
    'Cardiac Disease',
    'None known',
  ];

  const handleAddDelivery = () => {
    setPriorDeliveries([
      ...priorDeliveries,
      {
        year: new Date().getFullYear().toString(),
        deliveryType: 'vaginal',
        outcome: 'live_birth',
      },
    ]);
  };

  const handleRemoveDelivery = (index: number) => {
    setPriorDeliveries(priorDeliveries.filter((_, i) => i !== index));
  };

  const handleToggleCondition = (cond: string) => {
    if (cond === 'None known') {
      setConditions(['None known']);
      return;
    }
    const filtered = conditions.filter((c) => c !== 'None known');
    if (filtered.includes(cond)) {
      setConditions(filtered.filter((c) => c !== cond));
    } else {
      setConditions([...filtered, cond]);
    }
  };

  const handleSaveAndComplete = async () => {
    setSaving(true);
    try {
      // Build provenance object
      const provenance: Provenance = {
        status: 'REPORTED',
        enteredBy: userId,
        enteredAt: new Date().toISOString(),
        verifiedBy: null,
        verifiedAt: null,
      };

      // 1. Update motherProfile with obstetric history & blood group
      const motherRef = doc(db, 'motherProfiles', userId);
      const profileUpdates = {
        isFirstPregnancy: isFirstPregnancy === true,
        gravida: isFirstPregnancy ? 1 : Math.max(1, gravida),
        para: isFirstPregnancy ? 0 : Math.max(0, para),
        bloodGroup: bloodGroup ? `${bloodGroup}${rhesus}` : undefined,
        preExistingConditions: conditions.length > 0 ? conditions : undefined,
        surgicalHistory: surgicalHistory.trim() || undefined,
        priorDeliveries: priorDeliveries.length > 0 ? priorDeliveries : undefined,
        provenance,
        serverTimestamp: serverTimestamp(),
      };
      await setDoc(motherRef, profileUpdates, { merge: true });

      onComplete();
    } catch (err) {
      console.error('Error saving pregnancy history:', err);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0]">
      {/* Top App Bar with screen code and back chevron */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-2">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : onBack}
            className="w-10 h-10 rounded-full bg-white border border-[#E5DFF0] flex items-center justify-center text-[#33178A] hover:bg-[#EAE3F7] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-display font-bold text-[#9167C2] tracking-wider uppercase">
            M-AUTH-008
          </span>
        </div>

        {/* Signature Haven Ribbon: Smooth organic S-curved path progress */}
        <div className="my-2">
          <HavenRibbon
            progress={step === 1 ? 75 : 100}
            currentStep={step === 1 ? 1 : 2}
            totalSteps={2}
            label={step === 1 ? 'Obstetric History' : 'Basic Health History'}
            sublabel={`Step ${step} of 2`}
            showMarkerTooltip={false}
          />
        </div>

        {/* Stepper Sub-step 1: Obstetric History */}
        {step === 1 && (
          <div className="mt-1 space-y-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-[#33178A] tracking-tight">
                Prior pregnancy history
              </h1>
              <p className="font-body text-xs text-[#6D6380] mt-1 leading-relaxed">
                From MOH 216 page 3: Previous pregnancies help clinical providers tailor your ANC plan. All fields are optional.
              </p>
            </div>

            {/* Is this your first pregnancy? */}
            <div className="p-4 rounded-[20px] bg-white border border-[#E5DFF0] shadow-card-1 space-y-3">
              <label className="block text-xs font-display font-bold text-[#241451]">
                Is this your first pregnancy?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstPregnancy(true);
                    setGravida(1);
                    setPara(0);
                    setPriorDeliveries([]);
                  }}
                  className={`py-3 px-4 rounded-[16px] text-xs font-display font-bold border transition-all cursor-pointer ${
                    isFirstPregnancy === true
                      ? 'bg-[#EAE3F7] border-[#33178A] text-[#33178A] shadow-sm'
                      : 'bg-white border-[#E5DFF0] text-[#6D6380] hover:border-[#9167C2]'
                  }`}
                >
                  Yes, first pregnancy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstPregnancy(false);
                    if (gravida === 1) setGravida(2);
                    if (para === 0) setPara(1);
                  }}
                  className={`py-3 px-4 rounded-[16px] text-xs font-display font-bold border transition-all cursor-pointer ${
                    isFirstPregnancy === false
                      ? 'bg-[#EAE3F7] border-[#33178A] text-[#33178A] shadow-sm'
                      : 'bg-white border-[#E5DFF0] text-[#6D6380] hover:border-[#9167C2]'
                  }`}
                >
                  No, I have been pregnant before
                </button>
              </div>
            </div>

            {/* If not first pregnancy, show Gravida / Para and prior deliveries */}
            {isFirstPregnancy === false && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-[16px] border border-[#E5DFF0] shadow-card-1">
                    <label className="block text-[11px] font-display font-bold text-[#241451] mb-1">
                      Total Pregnancies (Gravida)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={gravida}
                      onChange={(e) => setGravida(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-[#F7F3FC] rounded-input border border-[#E5DFF0] text-sm font-bold text-[#33178A] text-center"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-[16px] border border-[#E5DFF0] shadow-card-1">
                    <label className="block text-[11px] font-display font-bold text-[#241451] mb-1">
                      Live Births (Para)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={para}
                      onChange={(e) => setPara(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#F7F3FC] rounded-input border border-[#E5DFF0] text-sm font-bold text-[#33178A] text-center"
                    />
                  </div>
                </div>

                {/* Optional Prior Deliveries List */}
                <div className="p-3.5 bg-white rounded-[20px] border border-[#E5DFF0] shadow-card-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display font-bold text-[#33178A]">
                      Previous Birth Records (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddDelivery}
                      className="text-xs font-display font-bold text-[#9167C2] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add birth</span>
                    </button>
                  </div>

                  {priorDeliveries.map((delivery, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-[16px] bg-[#F7F3FC] border border-[#E5DFF0] space-y-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveDelivery(index)}
                        className="absolute top-2 right-2 text-[#6D6380] hover:text-[#E11D3C] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6D6380] mb-0.5">Year</label>
                          <input
                            type="text"
                            value={delivery.year}
                            onChange={(e) => {
                              const updated = [...priorDeliveries];
                              updated[index].year = e.target.value;
                              setPriorDeliveries(updated);
                            }}
                            placeholder="e.g. 2022"
                            className="w-full px-2.5 py-1.5 bg-white rounded-input border border-[#E5DFF0] text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#6D6380] mb-0.5">Delivery Type</label>
                          <select
                            value={delivery.deliveryType}
                            onChange={(e) => {
                              const updated = [...priorDeliveries];
                              updated[index].deliveryType = e.target.value;
                              setPriorDeliveries(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-white rounded-input border border-[#E5DFF0] text-xs"
                          >
                            <option value="vaginal">Vaginal (SVD)</option>
                            <option value="cesarean">Caesarean Section</option>
                            <option value="assisted">Assisted / Vacuum</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-2"
              >
                <span>Continue to Health Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Stepper Sub-step 2: Basic Health History & Blood Group */}
        {step === 2 && (
          <div className="mt-1 space-y-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-[#33178A] tracking-tight">
                Basic health profile
              </h1>
              <p className="font-body text-xs text-[#6D6380] mt-1 leading-relaxed">
                Optional clinical details recorded on MOH 216 page 4 for maternal monitoring.
              </p>
            </div>

            {/* Blood Group & Rhesus */}
            <div className="p-4 rounded-[20px] bg-white border border-[#E5DFF0] shadow-card-1 space-y-3">
              <label className="block text-xs font-display font-bold text-[#241451]">
                Blood Group &amp; Rhesus Factor (optional)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'AB', 'O'].map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                    className={`py-2 px-3 rounded-[12px] text-xs font-display font-bold border transition-all cursor-pointer ${
                      bloodGroup === bg
                        ? 'bg-[#33178A] text-white shadow-sm border-[#33178A]'
                        : 'bg-[#F7F3FC] border-[#E5DFF0] text-[#6D6380] hover:border-[#9167C2]'
                    }`}
                  >
                    Group {bg}
                  </button>
                ))}
              </div>

              {bloodGroup && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-display font-bold text-[#6D6380]">Rhesus:</span>
                  <button
                    type="button"
                    onClick={() => setRhesus('+')}
                    className={`py-1 px-3 rounded-pill text-xs font-display font-bold cursor-pointer ${
                      rhesus === '+' ? 'bg-[#9167C2] text-white' : 'bg-[#F7F3FC] text-[#6D6380] border'
                    }`}
                  >
                    Positive (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRhesus('-')}
                    className={`py-1 px-3 rounded-pill text-xs font-display font-bold cursor-pointer ${
                      rhesus === '-' ? 'bg-[#9167C2] text-white' : 'bg-[#F7F3FC] text-[#6D6380] border'
                    }`}
                  >
                    Negative (-)
                  </button>
                </div>
              )}
            </div>

            {/* Pre-existing Conditions */}
            <div className="p-4 rounded-[20px] bg-white border border-[#E5DFF0] shadow-card-1 space-y-2.5">
              <label className="block text-xs font-display font-bold text-[#241451]">
                Pre-existing medical conditions (optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {commonConditions.map((cond) => {
                  const selected = conditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleToggleCondition(cond)}
                      className={`p-2.5 rounded-[12px] text-left text-xs font-display font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                        selected
                          ? 'bg-[#EAE3F7] border-[#33178A] text-[#33178A] font-bold'
                          : 'bg-white border-[#E5DFF0] text-[#6D6380] hover:border-[#9167C2]'
                      }`}
                    >
                      <span className="truncate">{cond}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-[#33178A] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleSaveAndComplete}
                disabled={saving}
                className="flex items-center justify-center gap-2"
              >
                <span>{saving ? 'Saving history...' : 'Save and continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer secondary action */}
      <div className="pt-4 pb-1 text-center space-y-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-[#6D6380] hover:text-[#33178A] font-display font-semibold transition-colors cursor-pointer"
        >
          Skip for now and enter dashboard &rarr;
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6D6380]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9167C2]" />
          <span>Compliant with Kenya MOH 216 Clinical Record Formats</span>
        </div>
      </div>
    </div>
  );
};
