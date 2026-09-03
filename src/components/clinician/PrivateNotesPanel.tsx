import React from 'react';
import { Lock, FileText } from 'lucide-react';
import EmptyState from '../EmptyState';

interface PrivateNotesPanelProps {
  motherId: string;
  clinicianName: string;
  facilityName: string;
}

export default function PrivateNotesPanel({ motherId: _motherId, clinicianName: _clinicianName, facilityName: _facilityName }: PrivateNotesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-[16px] text-blue-950 flex items-start gap-2.5 text-xs">
        <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display font-bold text-blue-900">Confidential Clinician Notes</h4>
          <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">Private provider notes are shown only when backed by the live clinical notes store.</p>
        </div>
      </div>
      <div className="bg-white border border-[var(--border-hairline)] rounded-[20px] shadow-card-1 overflow-hidden">
        <EmptyState icon={FileText} title="No private notes yet" message="No confidential clinical notes have been recorded for this patient. Seeded notes have been removed." />
      </div>
    </div>
  );
}
