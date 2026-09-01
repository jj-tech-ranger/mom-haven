import React from 'react';
import { ChevronLeft, Heart, Baby, Building2, Calendar, Share2, Edit3, CheckCircle2, Lock } from 'lucide-react';
import { PostnatalEncounterDoc } from '../../types';
import { ProvenanceBadge, ProvenanceCaption } from '../ProvenanceBadge';

interface PncEncounterDetailProps { encounter: PostnatalEncounterDoc; onBack: () => void; onEdit?: () => void; }

export const PncEncounterDetail: React.FC<PncEncounterDetailProps> = ({ encounter, onBack, onEdit }) => {
  const isVerified = encounter.provenance?.status === 'VERIFIED';
  const visitTitle = encounter.visit === '48h' ? 'PNC Contact 1 (Within 48h)' : encounter.visit === '1-2w' ? 'PNC Contact 2 (1–2 Weeks)' : encounter.visit === '4-6w' ? 'PNC Contact 3 (4–6 Weeks)' : 'PNC Contact 4 (4–6 Months)';
  const formattedDate = new Date(encounter.date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col pb-24">
      <header className="sticky top-0 bg-white/95 border-b border-border-light px-4 py-3.5 z-20 flex items-center justify-between">
        <button onClick={onBack} className="w-9 h-9 rounded-card bg-brand-surface flex items-center justify-center text-brand-primary hover:bg-[#EADCF0] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center"><h1 className="font-consumer font-bold text-lg text-text-primary leading-tight">PNC Encounter Detail</h1><p className="font-clinical text-[11px] text-text-muted">MOH 216 Clinical Record</p></div>
        <div className="w-9" />
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-card border border-border-light shadow-sm p-5 space-y-3">
          <div className="flex items-start justify-between gap-3"><div><span className="font-clinical text-xs text-brand-primary font-semibold uppercase tracking-wider block">Postnatal Visit Record</span><h2 className="font-consumer font-bold text-xl text-text-primary leading-tight mt-0.5">{visitTitle}</h2></div><ProvenanceBadge provenance={encounter.provenance} compact /></div>
          <div className="flex items-center gap-4 text-xs font-clinical text-text-muted pt-1 border-t border-border-light"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand-accent"/><span>{formattedDate}</span></div><div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-brand-accent"/><span>{encounter.provenance?.facilityName || 'Kariokor Health Centre'}</span></div></div>
          <ProvenanceCaption provenance={encounter.provenance} />
        </div>

        <div className="bg-white rounded-card border border-border-light shadow-sm p-4 space-y-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-card bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0"><Heart className="w-4 h-4" /></div><h3 className="font-consumer font-bold text-sm text-text-primary">Maternal Health Findings</h3></div><div className="p-3.5 rounded-card bg-surface-canvas border border-border-light text-sm font-clinical text-text-primary leading-relaxed">{encounter.motherFindings}</div></div>

        <div className="bg-white rounded-card border border-border-light shadow-sm p-4 space-y-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-card bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0"><Baby className="w-4 h-4" /></div><h3 className="font-consumer font-bold text-sm text-text-primary">Infant Examination Findings</h3></div><div className="p-3.5 rounded-card bg-surface-canvas border border-border-light text-sm font-clinical text-text-primary leading-relaxed">{encounter.babyFindings}</div></div>

        <div className="bg-white rounded-card border border-border-light shadow-sm p-4 flex items-center gap-3">
          {isVerified ? <><div className="w-10 h-10 rounded-card bg-clinical-normal-bg text-clinical-normal flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div><div className="flex-1 min-w-0"><h4 className="font-consumer font-bold text-sm text-text-primary">Record Clinically Verified</h4><p className="font-clinical text-xs text-text-muted">This record is locked and part of the official MOH facility audit trail.</p></div><Lock className="w-4 h-4 text-clinical-normal flex-shrink-0" /></> : <><div className="w-10 h-10 rounded-card bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0"><Edit3 className="w-5 h-5" /></div><div className="flex-1 min-w-0"><h4 className="font-consumer font-bold text-sm text-text-primary">Caregiver-Reported Entry</h4><p className="font-clinical text-xs text-text-muted">You can edit this entry until reviewed and signed off by your healthcare provider.</p></div></>}
        </div>

        <div className="space-y-2.5 pt-2">
          {!isVerified && onEdit && <button onClick={onEdit} className="w-full py-3.5 px-6 rounded-card bg-brand-primary text-white font-consumer font-semibold text-base hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"><Edit3 className="w-4 h-4"/><span>Edit encounter</span></button>}
          <button onClick={() => console.log('Share encounter with clinician triggered')} className="w-full py-3 px-6 rounded-card bg-white border border-brand-primary text-brand-primary font-consumer font-semibold text-sm hover:bg-brand-surface transition-colors flex items-center justify-center gap-2 cursor-pointer"><Share2 className="w-4 h-4 text-brand-accent"/><span>Share with clinician</span></button>
        </div>
      </div>
    </div>
  );
};
