import React, { useState } from 'react';
import { ChevronLeft, Baby, Calendar, Check } from 'lucide-react';
import { ChildDoc } from '../../types';

interface ProfileChildDetailProps {
  child: ChildDoc;
  onBack: () => void;
  onUpdate: (updated: Partial<ChildDoc>) => Promise<void> | void;
}

export const ProfileChildDetail: React.FC<ProfileChildDetailProps> = ({
  child,
  onBack,
  onUpdate,
}) => {
  const [name, setName] = useState(child.name || '');
  const [dob, setDob] = useState(child.dateOfBirth);
  const [sex, setSex] = useState<'boy' | 'girl'>(child.sex);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate({
        name,
        dateOfBirth: dob,
        sex,
      });
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
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Child Profile</h1>
        <div className="w-10" />
      </div>

      {/* Avatar Card */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-6 text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-lavender-100 flex items-center justify-center text-haven-orchid mx-auto relative border-2 border-lavender-200">
          <Baby className="w-10 h-10" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-ink-900">
            {name || 'Baby Profile'}
          </h2>
          <p className="font-body text-xs text-ink-600">Child ID: {child.id}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Child Full Name */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Child's Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amara Jepkemoi"
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
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Sex */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Sex assigned at birth *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSex('girl')}
              className={`py-3 rounded-2xl border font-display font-bold text-sm transition-all cursor-pointer ${
                sex === 'girl'
                  ? 'bg-haven-deep text-white border-haven-deep'
                  : 'bg-white text-ink-900 border-border-hairline hover:bg-lavender-50'
              }`}
            >
              Girl (Female)
            </button>
            <button
              type="button"
              onClick={() => setSex('boy')}
              className={`py-3 rounded-2xl border font-display font-bold text-sm transition-all cursor-pointer ${
                sex === 'boy'
                  ? 'bg-haven-deep text-white border-haven-deep'
                  : 'bg-white text-ink-900 border-border-hairline hover:bg-lavender-50'
              }`}
            >
              Boy (Male)
            </button>
          </div>
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
