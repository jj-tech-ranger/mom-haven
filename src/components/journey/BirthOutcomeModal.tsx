import React, { useState } from 'react';
import { X, Sparkles, Baby, Heart, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Pregnancy } from '../../types';
import { completePregnancyTransition } from '../../services/pregnancyService';
import Button from '../Button';

interface BirthOutcomeModalProps {
  pregnancy: Pregnancy;
  userId: string;
  motherDisplayName?: string;
  onClose: () => void;
  onTransitionCompleted: (newChildId: string) => void;
}

export default function BirthOutcomeModal({
  pregnancy,
  userId,
  motherDisplayName = 'Mama',
  onClose,
  onTransitionCompleted,
}: BirthOutcomeModalProps) {
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [outcomeType, setOutcomeType] = useState<'Live Birth' | 'Multiple Birth' | 'Stillbirth'>('Live Birth');
  const [deliveryType, setDeliveryType] = useState<'SVD' | 'CS' | 'Assisted'>('SVD');
  const [facilityName, setFacilityName] = useState(pregnancy.birthPlan?.preferredFacility || '');
  const [attendantCadre, setAttendantCadre] = useState('Certified Midwife');

  // Baby Details
  const [babyName, setBabyName] = useState(pregnancy.babyName || `Baby of ${motherDisplayName}`);
  const [babySex, setBabySex] = useState<'female' | 'male'>('female');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthLength, setBirthLength] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [apgarScore, setApgarScore] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const childId = await completePregnancyTransition(
        userId,
        pregnancy.id,
        {
          deliveryDate,
          deliveryTime,
          deliveryType,
          outcomeType,
          facilityName,
          attendantCadre,
        },
        {
          name: babyName.trim(),
          sex: babySex,
          birthWeightKg: parseFloat(birthWeight) || 3.4,
          birthLengthCm: parseFloat(birthLength) || 50,
          headCircumferenceCm: parseFloat(headCircumference) || 34.5,
          apgarScore,
        }
      );

      onTransitionCompleted(childId);
    } catch (err: any) {
      console.error('Failed to complete birth outcome transition', err);
      setError(err?.message || 'Failed to complete delivery transition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">🎉</span>
            <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Delivery Outcome &amp; Newborn Record
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Celebration Banner */}
        <div className="mt-3 p-4 rounded-[18px] bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 border border-[var(--border-hairline)] text-center space-y-1">
          <h3 className="font-display font-bold text-[16px] text-[var(--haven-deep)]">
            Congratulations on your new arrival!
          </h3>
          <p className="font-body text-[12px] text-[var(--ink-600)]">
            Completing this record concludes your pregnancy journey and seamlessly activates your child's newborn health and immunization passport.
          </p>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Delivery Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Time of Birth
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={e => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
          </div>

          {/* Delivery Method & Cadre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Delivery Method
              </label>
              <select
                value={deliveryType}
                onChange={e => setDeliveryType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              >
                <option value="SVD">Spontaneous Vaginal (SVD)</option>
                <option value="CS">Caesarean Section (CS)</option>
                <option value="Assisted">Assisted Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
                Attendant Cadre
              </label>
              <input
                type="text"
                value={attendantCadre}
                onChange={e => setAttendantCadre(e.target.value)}
                placeholder="Midwife / Doctor"
                className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              />
            </div>
          </div>

          {/* Facility Name */}
          <div>
            <label className="block text-[12px] font-display font-semibold text-[var(--ink-900)] mb-1">
              Birth Health Facility
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={e => setFacilityName(e.target.value)}
              placeholder="e.g. Pumwani Maternity Hospital"
              className="w-full px-3 py-2 rounded-[14px] border border-[var(--border-hairline)] bg-white text-[13px]"
              required
            />
          </div>

          {/* Baby Details Section */}
          <div className="p-4 bg-[var(--lavender-50)] rounded-[20px] border border-[var(--border-hairline)] space-y-3">
            <h4 className="font-display font-bold text-[14px] text-[var(--haven-deep)] flex items-center gap-1.5">
              <Baby className="w-4 h-4" />
              <span>Baby's Baseline Information</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  Baby's Name
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={e => setBabyName(e.target.value)}
                  placeholder="e.g. Amara, Zawadi"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  Sex
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBabySex('female')}
                    className={`flex-1 py-1.5 rounded-[12px] text-[12px] font-display font-bold border ${
                      babySex === 'female'
                        ? 'bg-[var(--haven-deep)] text-white border-[var(--haven-deep)]'
                        : 'bg-white text-[var(--ink-600)] border-[var(--border-hairline)]'
                    }`}
                  >
                    Girl 👧
                  </button>
                  <button
                    type="button"
                    onClick={() => setBabySex('male')}
                    className={`flex-1 py-1.5 rounded-[12px] text-[12px] font-display font-bold border ${
                      babySex === 'male'
                        ? 'bg-[var(--haven-deep)] text-white border-[var(--haven-deep)]'
                        : 'bg-white text-[var(--ink-600)] border-[var(--border-hairline)]'
                    }`}
                  >
                    Boy 👦
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  Birth Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={birthWeight}
                  onChange={e => setBirthWeight(e.target.value)}
                  placeholder="3.2"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  Birth Length (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={birthLength}
                  onChange={e => setBirthLength(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  Head Circumference (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={headCircumference}
                  onChange={e => setHeadCircumference(e.target.value)}
                  placeholder="34.5"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-700)] mb-1">
                  APGAR Score (1m / 5m)
                </label>
                <input
                  type="text"
                  value={apgarScore}
                  onChange={e => setApgarScore(e.target.value)}
                  placeholder="9 / 10"
                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[var(--border-hairline)] text-[13px]"
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full py-3.5 mt-2">
            {loading ? 'Creating child profile...' : 'Create Child Profile & Start Newborn Journey'}
          </Button>
        </form>
      </div>
    </div>
  );
}
