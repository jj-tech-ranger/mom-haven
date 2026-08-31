import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Users,
  Car,
  HeartHandshake,
  Save,
  AlertTriangle,
  Package,
  Check,
} from 'lucide-react';
import { BirthPlanDoc } from '../../types';

interface EditBirthPlanProps {
  initialPlan?: Partial<BirthPlanDoc> | null;
  onBack: () => void;
  onSave: (plan: Partial<BirthPlanDoc>) => Promise<void>;
}

export const EditBirthPlan: React.FC<EditBirthPlanProps> = ({
  initialPlan,
  onBack,
  onSave,
}) => {
  const [facilityName, setFacilityName] = useState(
    initialPlan?.facilityName || 'Pumwani Maternity Hospital'
  );
  const [backupFacilityName, setBackupFacilityName] = useState(
    initialPlan?.backupFacilityName || 'Kenyatta National Hospital (KNH)'
  );
  const [supportPersonName, setSupportPersonName] = useState(
    initialPlan?.supportPersonName || 'Brian Kipchoge'
  );
  const [supportPersonPhone, setSupportPersonPhone] = useState(
    initialPlan?.supportPersonPhone || '+254 712 345 678'
  );
  const [supportPersonRelationship, setSupportPersonRelationship] = useState(
    initialPlan?.supportPersonRelationship || 'Partner / Husband'
  );
  const [transportMode, setTransportMode] = useState(
    initialPlan?.transportMode || 'Designated Driver / Taxi Fund'
  );
  const [driverName, setDriverName] = useState(initialPlan?.driverName || 'John Kamau (Trusted Taxi)');
  const [driverPhone, setDriverPhone] = useState(initialPlan?.driverPhone || '+254 722 987 654');
  const [emergencyFundPrepared, setEmergencyFundPrepared] = useState(
    initialPlan?.emergencyFundPrepared ?? true
  );
  const [bloodDonorIdentified, setBloodDonorIdentified] = useState(
    initialPlan?.bloodDonorIdentified ?? true
  );
  const [bloodDonorName, setBloodDonorName] = useState(
    initialPlan?.bloodDonorName || 'David O. (Blood Group O+)'
  );
  const [hospitalBagPacked, setHospitalBagPacked] = useState(
    initialPlan?.hospitalBagPacked ?? true
  );
  const [babyClothesPacked, setBabyClothesPacked] = useState(
    initialPlan?.babyClothesPacked ?? true
  );
  const [delayedCordClamping, setDelayedCordClamping] = useState(
    initialPlan?.preferences?.delayedCordClamping ?? true
  );
  const [immediateSkinToSkin, setImmediateSkinToSkin] = useState(
    initialPlan?.preferences?.immediateSkinToSkin ?? true
  );
  const [specialNotes, setSpecialNotes] = useState(
    initialPlan?.specialNotes ||
      'Please facilitate partner presence in the delivery room as recommended in Kenya respectful maternity care guidelines.'
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setHasChanges(true);
  };

  const handleFormSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        facilityName,
        backupFacilityName,
        supportPersonName,
        supportPersonPhone,
        supportPersonRelationship,
        transportMode,
        driverName,
        driverPhone,
        emergencyFundPrepared,
        bloodDonorIdentified,
        bloodDonorName,
        hospitalBagPacked,
        babyClothesPacked,
        preferences: {
          delayedCordClamping,
          immediateSkinToSkin,
          exclusiveBreastfeeding: true,
        },
        specialNotes,
        status: 'complete',
        updatedAt: new Date().toISOString(),
      });
      onBack();
    } catch (err) {
      console.error('Error saving birth plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
            aria-label="Cancel edit"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-ink-900 leading-tight">
              Edit Birth Plan
            </h1>
            <p className="font-body text-xs text-ink-600">
              Update logistical preferences
            </p>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <form onSubmit={handleFormSave} className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {/* Card 1: Facility Selection */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Building2 className="w-4 h-4 text-haven-orchid" />
            <span>Delivery Facility</span>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Primary Facility Name *
            </label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => handleFieldChange(setFacilityName, e.target.value)}
              className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Backup Referral Facility
            </label>
            <input
              type="text"
              value={backupFacilityName}
              onChange={(e) => handleFieldChange(setBackupFacilityName, e.target.value)}
              className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            />
          </div>
        </div>

        {/* Card 2: Birth Companion & Support Person */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Users className="w-4 h-4 text-haven-orchid" />
            <span>Support Person & Companion</span>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={supportPersonName}
              onChange={(e) => handleFieldChange(setSupportPersonName, e.target.value)}
              className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={supportPersonRelationship}
                onChange={(e) => handleFieldChange(setSupportPersonRelationship, e.target.value)}
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={supportPersonPhone}
                onChange={(e) => handleFieldChange(setSupportPersonPhone, e.target.value)}
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Transport & Driver Plan */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Car className="w-4 h-4 text-haven-orchid" />
            <span>Transport Logistics</span>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Planned Mode of Transport
            </label>
            <select
              value={transportMode}
              onChange={(e) => handleFieldChange(setTransportMode, e.target.value)}
              className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            >
              <option value="Designated Driver / Taxi Fund">Designated Driver / Taxi Fund</option>
              <option value="Personal / Family Vehicle">Personal / Family Vehicle</option>
              <option value="Facility Ambulance Service (1199)">Facility Ambulance Service (1199)</option>
              <option value="Community Bodaboda / Partner Rider">Community Bodaboda / Partner Rider</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Driver Contact Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => handleFieldChange(setDriverName, e.target.value)}
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Driver Phone
              </label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => handleFieldChange(setDriverPhone, e.target.value)}
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Preparedness Toggles */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <Package className="w-4 h-4 text-haven-orchid" />
            <span>Essential Preparedness Status</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-lavender-50/70 cursor-pointer">
              <span className="font-body text-xs text-ink-900">
                Emergency Transport & Clinic Savings Fund Ready
              </span>
              <input
                type="checkbox"
                checked={emergencyFundPrepared}
                onChange={(e) => handleFieldChange(setEmergencyFundPrepared, e.target.checked)}
                className="w-5 h-5 accent-haven-deep rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-lavender-50/70 cursor-pointer">
              <span className="font-body text-xs text-ink-900">
                Identified Blood Donor in Advance
              </span>
              <input
                type="checkbox"
                checked={bloodDonorIdentified}
                onChange={(e) => handleFieldChange(setBloodDonorIdentified, e.target.checked)}
                className="w-5 h-5 accent-haven-deep rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-lavender-50/70 cursor-pointer">
              <span className="font-body text-xs text-ink-900">
                Hospital Bag & Clean Baby Clothes Packed
              </span>
              <input
                type="checkbox"
                checked={hospitalBagPacked}
                onChange={(e) => handleFieldChange(setHospitalBagPacked, e.target.checked)}
                className="w-5 h-5 accent-haven-deep rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Card 5: Care Preferences & Wishes */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
          <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
            <HeartHandshake className="w-4 h-4 text-haven-orchid" />
            <span>Care Preferences</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-lavender-50/70 cursor-pointer">
              <span className="font-body text-xs text-ink-900">
                Immediate Skin-to-Skin Contact after delivery
              </span>
              <input
                type="checkbox"
                checked={immediateSkinToSkin}
                onChange={(e) => handleFieldChange(setImmediateSkinToSkin, e.target.checked)}
                className="w-5 h-5 accent-haven-deep rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-lavender-50/70 cursor-pointer">
              <span className="font-body text-xs text-ink-900">
                Delayed Cord Clamping (1 to 3 minutes)
              </span>
              <input
                type="checkbox"
                checked={delayedCordClamping}
                onChange={(e) => handleFieldChange(setDelayedCordClamping, e.target.checked)}
                className="w-5 h-5 accent-haven-deep rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
              Special Wishes or Notes for Midwife / Doctor
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => handleFieldChange(setSpecialNotes, e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-xs text-ink-900 focus:outline-none focus:border-haven-orchid resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving Changes...' : 'Save changes'}</span>
          </button>

          {/* Secondary Action Button */}
          <button
            type="button"
            onClick={handleCancel}
            className="w-full py-3 px-5 bg-white border-[1.5px] border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-100/60 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-[340px] w-full text-center space-y-4 shadow-card-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-display font-bold text-lg text-ink-900">
              Unsaved Changes
            </h3>

            <p className="font-body text-xs text-ink-600 leading-relaxed">
              You have unsaved changes in your birth plan. Are you sure you want to discard them?
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={onBack}
                className="w-full py-3 bg-red-600 text-white font-display font-bold text-sm rounded-pill hover:bg-red-700 transition-colors cursor-pointer"
              >
                Discard & Leave
              </button>

              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-2.5 bg-white border border-border-hairline text-ink-600 font-display font-bold text-xs rounded-pill hover:bg-lavender-100 transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
