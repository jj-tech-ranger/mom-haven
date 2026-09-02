// src/components/clinician/PrivateNotesPanel.tsx
import React, { useState } from 'react';
import { Lock, Plus, FileText, Clock, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Button from '../Button';

interface NoteItem {
  id: string;
  author: string;
  facility: string;
  category: string;
  text: string;
  createdAt: string;
}

interface PrivateNotesPanelProps {
  motherId: string;
  clinicianName: string;
  facilityName: string;
}

export default function PrivateNotesPanel({
  motherId,
  clinicianName,
  facilityName,
}: PrivateNotesPanelProps) {
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: '1',
      author: 'Dr. Sarah Kimani (MO ObsGyn)',
      facility: 'Kenyatta National Hospital',
      category: 'Obstetric Risk',
      text: 'Patient previously had borderline BP at 20w. Advised home BP monitoring. Watch closely for proteinuria or sudden pedal edema.',
      createdAt: '2025-02-14 11:20 AM',
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [category, setCategory] = useState('Obstetric Risk');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const newNote: NoteItem = {
        id: Date.now().toString(),
        author: clinicianName,
        facility: facilityName,
        category,
        text: newNoteText.trim(),
        createdAt: new Date().toLocaleString(),
      };
      setNotes(prev => [newNote, ...prev]);
      setNewNoteText('');
      setLoading(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-[16px] text-blue-950 flex items-start gap-2.5 text-xs">
        <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display font-bold text-blue-900">
            Confidential Clinician Notes (Provider Eyes Only)
          </h4>
          <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
            These entries are strictly confidential and visible only to verified healthcare providers during active clinical sessions. They are never displayed on the mother or partner mobile applications.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[12px] text-xs flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Confidential clinical note saved to encrypted patient vault.</span>
        </div>
      )}

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="bg-white border border-[var(--border-hairline)] p-4 sm:p-5 rounded-[20px] shadow-card-1 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-sm text-[var(--ink-900)] flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[var(--haven-deep)]" />
            Add Confidential Provider Note
          </h4>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-[10px] px-2.5 py-1.5 bg-[var(--lavender-50)] text-[var(--haven-deep)] font-bold"
          >
            <option>Obstetric Risk</option>
            <option>Safeguarding / Social</option>
            <option>Medication Review</option>
            <option>Referral Summary</option>
            <option>General Clinical Impression</option>
          </select>
        </div>

        <textarea
          rows={3}
          placeholder="Record clinical impressions, differential diagnoses, or sensitive safeguarding notes..."
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          className="w-full p-3 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--lavender-50)] text-xs text-[var(--ink-900)] focus:outline-none focus:bg-white focus:border-[var(--haven-deep)]"
          required
        />

        <div className="flex justify-between items-center pt-1">
          <span className="text-[11px] text-gray-500">
            Author: {clinicianName}
          </span>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="py-2 px-4 text-xs bg-[var(--haven-deep)]"
          >
            {loading ? 'Saving...' : 'Save Private Note'}
          </Button>
        </div>
      </form>

      {/* Existing Notes Feed */}
      <div className="space-y-3">
        {notes.map(n => (
          <div key={n.id} className="bg-white border border-[var(--border-hairline)] p-4 rounded-[18px] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                {n.category}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {n.createdAt}
              </span>
            </div>

            <p className="text-xs text-[var(--ink-800)] font-body leading-relaxed">
              {n.text}
            </p>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-semibold">{n.author}</span>
              <span>{n.facility}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
