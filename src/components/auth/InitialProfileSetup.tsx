import React, { useState } from 'react';
import { User, Phone, Camera, ArrowRight, ArrowLeft, ShieldCheck, Upload, Trash2 } from 'lucide-react';
import Button from '../Button';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserDoc, MotherProfileDoc } from '../../types';

interface InitialProfileSetupProps {
  user: UserDoc;
  onBack?: () => void;
  onContinue: (profile: Partial<MotherProfileDoc>) => void;
}

export const InitialProfileSetup: React.FC<InitialProfileSetupProps> = ({
  user,
  onBack,
  onContinue,
}) => {
  const [fullName, setFullName] = useState(user.displayName || '');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const motherRef = doc(db, 'motherProfiles', user.uid);
      const profileData: Partial<MotherProfileDoc> = {
        uid: user.uid,
        fullName: fullName.trim() || user.displayName || 'Mama',
        phone: phone.trim() || undefined,
        photoUrl: photoUrl || undefined,
      };
      await setDoc(motherRef, profileData, { merge: true });

      if (fullName.trim() && fullName.trim() !== user.displayName) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { displayName: fullName.trim(), serverTimestamp: serverTimestamp() }, { merge: true });
      }

      onContinue(profileData);
    } catch (err) {
      console.error('Error saving mother profile:', err);
      onContinue({ uid: user.uid, fullName: fullName.trim() || 'Mama' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-card-2 flex flex-col justify-between p-6 bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0]">
      {/* Top App Bar with back chevron and screen code */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white border border-[#E5DFF0] flex items-center justify-center text-[#33178A] hover:bg-[#EAE3F7] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
          <span className="text-xs font-display font-bold text-[#9167C2] tracking-wider uppercase">
            M-AUTH-006
          </span>
        </div>

        {/* Header Title */}
        <div className="mt-1 mb-5">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#33178A] tracking-tight">
            Tell us about you
          </h1>
          <p className="font-body text-sm text-[#6D6380] mt-1 leading-relaxed">
            Essential profile information to personalize your care journey.
          </p>
        </div>

        <form onSubmit={handleSaveAndContinue} className="space-y-4">
          {/* Optional Profile Photo Picker */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-[#9167C2]/40 flex items-center justify-center overflow-hidden shadow-card-1">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#9167C2]/70 p-2 text-center">
                    <Camera className="w-7 h-7 mb-1 text-[#9167C2]" />
                    <span className="text-[10px] font-display font-semibold">Add photo</span>
                  </div>
                )}
              </div>

              {/* Photo file input label */}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#33178A] text-white flex items-center justify-center shadow-md hover:bg-[#9167C2] transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#E11D3C] text-white flex items-center justify-center shadow hover:bg-red-700 transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] font-body text-[#6D6380]">Optional photo</span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="text-[11px] font-display font-semibold text-[#33178A] hover:underline cursor-pointer"
                >
                  Skip photo
                </button>
              )}
            </div>
          </div>

          {/* Name Field (Required) */}
          <div>
            <label className="block text-xs font-display font-bold text-[#241451] mb-1.5">
              Your name (or preferred name) <span className="text-[#E11D3C]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6D6380]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Grace Achieng"
                className="w-full pl-10 pr-3.5 py-3 bg-white rounded-input border border-[#E5DFF0] text-sm text-[#241451] focus:outline-none focus:border-[#9167C2] transition-colors"
              />
            </div>
          </div>

          {/* Phone Field (Optional) */}
          <div>
            <label className="block text-xs font-display font-bold text-[#241451] mb-1.5">
              Phone number <span className="text-[11px] font-normal text-[#6D6380]">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6D6380]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +254 712 345 678"
                className="w-full pl-10 pr-3.5 py-3 bg-white rounded-input border border-[#E5DFF0] text-sm text-[#241451] focus:outline-none focus:border-[#9167C2] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#6D6380] mt-1">Used for optional clinic SMS reminders and emergency dispatch.</p>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !fullName.trim()}
              className="flex items-center justify-center gap-2"
            >
              <span>{saving ? 'Saving...' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Footer reassurance */}
      <div className="pt-4 pb-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6D6380]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9167C2]" />
          <span>Your data stays on your device and private Firestore document</span>
        </div>
      </div>
    </div>
  );
};
