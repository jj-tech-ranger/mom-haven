import React, { useState } from 'react';
import { ChevronLeft, Smile, Check, AlertCircle } from 'lucide-react';
import { DevelopmentRecordDoc } from '../../types';

interface DevelopmentRecordProps {
  childId: string;
  onBack: () => void;
  onSave: (record: Omit<DevelopmentRecordDoc, 'id'>) => Promise<void> | void;
}

const CHECKLIST_ITEMS = [
  { id: 'm1', title: 'Sits without support for 1+ minute', cat: 'Gross Motor' },
  { id: 'm2', title: 'Passes small toy from left hand to right hand', cat: 'Fine Motor' },
  { id: 'm3', title: 'Responds to caregiver name call and smiles', cat: 'Social' },
  { id: 'm4', title: 'Babbles syllables with consonants (ba, da, ma)', cat: 'Language' },
  { id: 'm5', title: 'Looks for dropped toys or hidden items', cat: 'Cognitive' },
];

export const DevelopmentRecord: React.FC<DevelopmentRecordProps> = ({
  childId,
  onBack,
  onSave,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    m1: true,
    m2: true,
    m3: true,
    m4: true,
    m5: true,
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const titles = CHECKLIST_ITEMS.filter((i) => checkedItems[i.id])
        .map((i) => i.title)
        .join('; ');
      await onSave({
        childId,
        date,
        milestoneTitle: titles || 'Development assessment completed',
        ageCategory: '6–9 Months',
        achieved: true,
        notes: notes || undefined,
        provenance: {
          status: 'REPORTED',
          enteredBy: 'mother',
          enteredAt: new Date().toISOString(),
          verifiedBy: null,
          verifiedAt: null,
        },
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
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">Record Development</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Date Field */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Observation Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
            required
          />
        </div>

        {/* Milestone Checklist */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-3">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Observed Milestones (6–9 Months)
          </label>
          <div className="space-y-2.5">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  checkedItems[item.id]
                    ? 'bg-lavender-50/60 border-haven-orchid/40'
                    : 'bg-white border-border-hairline hover:bg-lavender-50/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[item.id]}
                  onChange={() => {}}
                  className="w-5 h-5 rounded-md text-haven-deep focus:ring-haven-orchid mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-ink-900 leading-snug">
                    {item.title}
                  </p>
                  <span className="font-body text-[11px] text-ink-600">{item.cat}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-4 space-y-2">
          <label className="block font-display font-bold text-xs text-ink-600 uppercase tracking-wider">
            Caregiver Notes & Observations
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Loves rolling over to reach rattle, laughs aloud at peek-a-boo."
            className="w-full px-4 py-3 bg-lavender-50/50 border border-border-hairline rounded-2xl font-body text-sm text-ink-900 focus:outline-none focus:border-haven-orchid"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-base rounded-pill shadow-button hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save record'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 px-6 bg-white border border-haven-deep text-haven-deep font-display font-bold text-sm rounded-pill hover:bg-lavender-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
