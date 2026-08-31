import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  FileText,
  Edit3,
  ShieldCheck,
  Activity,
  Plus,
  Save,
  X,
  Droplet,
  Baby,
} from 'lucide-react';
import { MotherProfileDoc } from '../../types';

interface PregnancyHealthHistoryProps {
  profile?: MotherProfileDoc | null;
  onBack: () => void;
  onSaveProfile?: (updatedProfile: Partial<MotherProfileDoc>) => Promise<void>;
}

export const PregnancyHealthHistory: React.FC<PregnancyHealthHistoryProps> = ({
  profile,
  onBack,
  onSaveProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || 'O');
  const [rhesus, setRhesus] = useState(profile?.rhesus || 'Positive (+)');
  const [gravida, setGravida] = useState(profile?.gravida !== undefined ? profile.gravida.toString() : '2');
  const [parity, setParity] = useState(profile?.parity !== undefined ? profile.parity.toString() : '1');
  const [conditions, setConditions] = useState(
    profile?.preExistingConditions && profile.preExistingConditions.length > 0
      ? profile.preExistingConditions.join(', ')
      : 'None reported'
  );
  const [allergies, setAllergies] = useState('No known drug allergies (NKDA)');
  const [surgicalHistory, setSurgicalHistory] = useState(
    profile?.surgicalHistory || 'No previous uterine or abdominal surgeries'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSaveProfile) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSaveProfile({
        bloodGroup,
        rhesus,
        gravida: parseInt(gravida, 10) || 1,
        parity: parseInt(parity, 10) || 0,
        preExistingConditions: conditions.split(',').map((s) => s.trim()).filter(Boolean),
        surgicalHistory,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving history:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isPopulated = Boolean(profile?.bloodGroup || profile?.gravida || profile?.preExistingConditions);

  return (
    <div className="min-h-screen bg-lavender-50 flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-hairline px-4 py-3.5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-lavender-100 border border-border-hairline flex items-center justify-center text-haven-deep hover:bg-lavender-200 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-ink-900 leading-tight">
              Health History
            </h1>
            <p className="font-body text-xs text-ink-600">
              Obstetric & Medical Baseline
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3.5 py-1.5 rounded-pill bg-lavender-100 border border-border-hairline text-haven-deep font-display font-bold text-xs hover:bg-lavender-200 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5 text-haven-orchid" />
          <span>{isEditing ? 'Cancel' : 'Edit'}</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4 max-w-[420px] mx-auto w-full">
        {/* Info Hero Banner */}
        <div className="bg-gradient-to-r from-haven-deep to-haven-orchid p-5 rounded-[20px] text-white shadow-card-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-lavender-200 font-semibold font-body">
                MOH 216 Maternal Profile
              </span>
              <h2 className="font-display font-bold text-xl mt-0.5">
                Obstetric Baseline
              </h2>
              <p className="text-xs text-lavender-100 font-body mt-1">
                Essential history shared with your delivery care team.
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {isEditing ? (
          /* Inline Edit Form */
          <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-ink-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-haven-orchid" />
              Edit Medical & Obstetric History
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                  Rhesus Factor
                </label>
                <select
                  value={rhesus}
                  onChange={(e) => setRhesus(e.target.value)}
                  className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
                >
                  <option value="Positive (+)">Positive (Rh+)</option>
                  <option value="Negative (-)">Negative (Rh-)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                  Gravida (Total Pregnancies)
                </label>
                <input
                  type="number"
                  value={gravida}
                  onChange={(e) => setGravida(e.target.value)}
                  className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                  Parity (Prior Births)
                </label>
                <input
                  type="number"
                  value={parity}
                  onChange={(e) => setParity(e.target.value)}
                  className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Pre-existing Conditions
              </label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Asthma, Hypertension, None"
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Known Drug Allergies
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, None"
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-ink-600 mb-1">
                Prior Surgeries
              </label>
              <input
                type="text"
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                placeholder="e.g. Previous C-Section (2023), Appendectomy, None"
                className="w-full p-2.5 bg-lavender-50/70 border border-border-hairline rounded-xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-sm rounded-pill shadow-button hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-3 bg-white border border-border-hairline text-ink-600 font-display font-bold text-sm rounded-pill hover:bg-lavender-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Populated Fact List Display */
          <div className="space-y-3">
            {/* Card 1: Blood & Serology */}
            <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
              <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
                <Droplet className="w-4 h-4 text-red-500" />
                <span>Blood Type & Serology</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-lavender-50/70 p-3 rounded-xl">
                  <span className="text-[10px] text-ink-600 font-body block uppercase tracking-wider">
                    Blood Group
                  </span>
                  <span className="font-display font-bold text-base text-ink-900">
                    Type {bloodGroup}
                  </span>
                </div>

                <div className="bg-lavender-50/70 p-3 rounded-xl">
                  <span className="text-[10px] text-ink-600 font-body block uppercase tracking-wider">
                    Rhesus Factor
                  </span>
                  <span className="font-display font-bold text-base text-ink-900">
                    {rhesus}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Obstetric History */}
            <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
              <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
                <Baby className="w-4 h-4 text-haven-orchid" />
                <span>Obstetric Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-lavender-50/70 p-3 rounded-xl">
                  <span className="text-[10px] text-ink-600 font-body block uppercase tracking-wider">
                    Gravida (Total Pregnancies)
                  </span>
                  <span className="font-display font-bold text-base text-ink-900">
                    G{gravida}
                  </span>
                </div>

                <div className="bg-lavender-50/70 p-3 rounded-xl">
                  <span className="text-[10px] text-ink-600 font-body block uppercase tracking-wider">
                    Parity (Prior Deliveries)
                  </span>
                  <span className="font-display font-bold text-base text-ink-900">
                    Para {parity}+0
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Conditions & Allergies */}
            <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
              <div className="flex items-center gap-2 text-haven-deep font-display font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-status-normal" />
                <span>Conditions, Allergies & Surgeries</span>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-start justify-between border-b border-border-hairline pb-2">
                  <span className="font-body text-ink-600">Pre-existing conditions</span>
                  <span className="font-display font-bold text-ink-900 text-right max-w-[200px]">
                    {conditions}
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-border-hairline pb-2">
                  <span className="font-body text-ink-600">Known drug allergies</span>
                  <span className="font-display font-bold text-ink-900 text-right max-w-[200px]">
                    {allergies}
                  </span>
                </div>

                <div className="flex items-start justify-between pt-0.5">
                  <span className="font-body text-ink-600">Surgical history</span>
                  <span className="font-display font-bold text-ink-900 text-right max-w-[200px]">
                    {surgicalHistory}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: Edit History */}
            <div className="pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-sm rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit history</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
