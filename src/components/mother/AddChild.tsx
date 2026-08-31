import React, { useState } from 'react';
import {
  ChevronLeft,
  Baby,
  Calendar,
  Building2,
  Scale,
  Ruler,
  FileText,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { ChildDoc } from '../../types';

interface AddChildProps {
  onBack: () => void;
  onSave: (childData: {
    name: string;
    dateOfBirth: string;
    sex: 'boy' | 'girl';
    birthWeightGrams?: number;
    birthLengthCm?: number;
    headCircumferenceCm?: number;
    cwcNumber?: string;
    facilityName?: string;
  }) => Promise<void> | void;
  existingChildrenCount?: number;
}

export const AddChild: React.FC<AddChildProps> = ({
  onBack,
  onSave,
  existingChildrenCount = 0,
}) => {
  const isFirstChild = existingChildrenCount === 0;

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sex, setSex] = useState<'boy' | 'girl'>('girl');
  const [birthWeightKg, setBirthWeightKg] = useState('');
  const [birthLengthCm, setBirthLengthCm] = useState('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('');
  const [facilityName, setFacilityName] = useState('Kariokor Health Centre');
  const [cwcNumber, setCwcNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your child’s name or baby nickname.');
      return;
    }
    if (!dateOfBirth) {
      setError('Please select a valid date of birth.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const weightGrams = birthWeightKg
        ? Math.round(parseFloat(birthWeightKg) * 1000)
        : undefined;

      await onSave({
        name: name.trim(),
        dateOfBirth,
        sex,
        birthWeightGrams: weightGrams,
        birthLengthCm: birthLengthCm ? parseFloat(birthLengthCm) : undefined,
        headCircumferenceCm: headCircumferenceCm
          ? parseFloat(headCircumferenceCm)
          : undefined,
        cwcNumber: cwcNumber.trim() || undefined,
        facilityName: facilityName.trim() || undefined,
      });
    } catch (err: any) {
      console.error('Error saving child record:', err);
      setError(err?.message || 'Failed to save child record. Please try again.');
      setIsSubmitting(false);
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

        <h1 className="font-display font-bold text-lg text-ink-900">
          {isFirstChild ? 'Welcome Your Baby' : 'Add Child Record'}
        </h1>

        <div className="w-9" />
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Banner State: First Child vs Additional Child */}
        <div
          className={`p-4 rounded-[20px] border shadow-card-1 flex items-start gap-3 ${
            isFirstChild
              ? 'bg-gradient-to-r from-haven-deep/10 via-haven-orchid/15 to-lavender-100 border-haven-orchid/30'
              : 'bg-white border-border-hairline'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-haven-deep text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-ink-900">
              {isFirstChild
                ? 'Beginning Your Child’s 5-Year Journey'
                : `Adding Child #${existingChildrenCount + 1} to Household`}
            </h3>
            <p className="font-body text-xs text-ink-600 mt-0.5 leading-relaxed">
              {isFirstChild
                ? 'MomHaven will initialize the Kenya MOH 216 immunization calendar, WHO growth curves, and developmental milestone tracking.'
                : 'Manage multiple children seamlessly with instant switching and individual health records.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[16px] text-xs text-red-700 font-body flex items-center gap-2">
            <Info className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Basic Identity */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3.5">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Baby className="w-4 h-4 text-haven-orchid" />
              Child Information
            </h3>

            {/* Full Name */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Child’s Full Name / Baby Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Baby Amara Kipchoge"
                required
                className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid focus:ring-1 focus:ring-haven-orchid"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid focus:ring-1 focus:ring-haven-orchid"
              />
            </div>

            {/* Sex Selection */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1.5">
                Sex *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSex('girl')}
                  className={`py-2.5 px-4 rounded-pill font-display font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${
                    sex === 'girl'
                      ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                      : 'bg-white text-ink-700 border-border-hairline hover:bg-lavender-50'
                  }`}
                >
                  <span>👧 Girl</span>
                  {sex === 'girl' && <Check className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSex('boy')}
                  className={`py-2.5 px-4 rounded-pill font-display font-semibold text-sm transition-all flex items-center justify-center gap-2 border ${
                    sex === 'boy'
                      ? 'bg-haven-deep text-white border-haven-deep shadow-sm'
                      : 'bg-white text-ink-700 border-border-hairline hover:bg-lavender-50'
                  }`}
                >
                  <span>👦 Boy</span>
                  {sex === 'boy' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Birth Details (MOH 216) */}
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3.5">
            <h3 className="font-display font-bold text-sm text-ink-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-haven-orchid" />
              Birth Metrics & Facility
            </h3>

            {/* Birth Weight & Length */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Birth Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="7.0"
                  value={birthWeightKg}
                  onChange={(e) => setBirthWeightKg(e.target.value)}
                  placeholder="e.g. 3.2"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>

              <div>
                <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                  Birth Length (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="70"
                  value={birthLengthCm}
                  onChange={(e) => setBirthLengthCm(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
                />
              </div>
            </div>

            {/* Head Circumference */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Head Circumference (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="50"
                value={headCircumferenceCm}
                onChange={(e) => setHeadCircumferenceCm(e.target.value)}
                placeholder="e.g. 34.5"
                className="w-full px-3 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
              />
            </div>

            {/* Delivery Facility */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                Birth Facility Name
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g. Kariokor Health Centre / Pumwani Hospital"
                className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
              />
            </div>

            {/* CWC MOH 216 Number */}
            <div>
              <label className="block font-body text-xs font-semibold text-ink-900 mb-1">
                MOH 216 Child Welfare Card (CWC) No. (Optional)
              </label>
              <input
                type="text"
                value={cwcNumber}
                onChange={(e) => setCwcNumber(e.target.value)}
                placeholder="e.g. CWC-2026-8812"
                className="w-full px-3.5 py-2.5 rounded-card border border-border-hairline bg-lavender-50/50 text-ink-900 text-sm font-body focus:outline-none focus:border-haven-orchid"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-pill bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-semibold text-base shadow-btn-primary hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Save child</span>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-pill bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-semibold text-sm hover:bg-lavender-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
