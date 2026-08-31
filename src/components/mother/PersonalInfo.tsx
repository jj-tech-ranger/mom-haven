import React, { useState } from 'react';
import { ChevronLeft, User, Phone, Mail, Calendar, Check, AlertCircle } from 'lucide-react';
import { MotherProfileDoc } from '../../types';

interface PersonalInfoProps {
  motherProfile?: MotherProfileDoc | null;
  onBack: () => void;
  onSave: (data: Partial<MotherProfileDoc>) => Promise<void> | void;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({
  motherProfile,
  onBack,
  onSave,
}) => {
  const [fullName, setFullName] = useState(motherProfile?.fullName || 'Jemimah Cherotich');
  const [phone, setPhone] = useState(motherProfile?.phone || '+254 712 345 678');
  const [dateOfBirth, setDateOfBirth] = useState(motherProfile?.dateOfBirth || '1998-05-14');
  const [bloodGroup, setBloodGroup] = useState(motherProfile?.bloodGroup || 'O+');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, val: any) => {
    setter(val);
    setHasUnsavedChanges(true);
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        fullName,
        phone,
        dateOfBirth,
        bloodGroup: bloodGroup as any,
      });
      setHasUnsavedChanges(false);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Personal Information</h1>
        <div className="w-10" />
      </div>

      {hasUnsavedChanges && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-800 text-xs font-display font-bold">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>You have unsaved changes</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-display font-bold">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile updated successfully</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Full Name */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Full Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => handleChange(setFullName, e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Phone Number */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handleChange(setPhone, e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Date of Birth */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Date of Birth *
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => handleChange(setDateOfBirth, e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Blood Group */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Blood Group
          </label>
          <select
            value={bloodGroup}
            onChange={(e) => handleChange(setBloodGroup, e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
          >
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="Unknown">Unknown / Pending Lab Test</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isSaving ? 'Saving changes...' : 'Save changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
