import React from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  Building2, 
  Download, 
  Share2, 
  ShieldCheck, 
  Lock, 
  Printer 
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import ProvenanceCaption from '../common/ProvenanceCaption';
import Button from '../Button';

interface RecordDetailModalProps {
  record: DocumentRecord;
  onClose: () => void;
  onShareWithClinician: () => void;
}

export default function RecordDetailModal({
  record,
  onClose,
  onShareWithClinician,
}: RecordDetailModalProps) {
  const isVerified = record.provenance?.status === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] text-[11px] font-display font-bold uppercase tracking-wider">
              {record.category}
            </span>
            <ProvenanceBadge provenance={record.provenance} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <h2 className="font-display font-black text-[22px] text-[var(--ink-900)] leading-tight">
              {record.title}
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-[var(--ink-600)] mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
                {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {record.facilityName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[var(--haven-orchid)]" />
                  {record.facilityName}
                </span>
              )}
            </div>
          </div>

          <ProvenanceCaption provenance={record.provenance} />

          {/* Document Preview Image / File Container */}
          {record.fileUrl ? (
            <div className="rounded-[18px] overflow-hidden border border-[var(--border-hairline)] bg-slate-950/5">
              <img
                src={record.fileUrl}
                alt={record.title}
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-8 rounded-[18px] bg-[var(--lavender-50)] border border-[var(--border-hairline)] flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-[var(--haven-deep)] mb-2 opacity-80" />
              <span className="font-display font-bold text-[14px] text-[var(--ink-900)]">
                Structured Clinical Record
              </span>
              <span className="text-[12px] text-[var(--ink-500)]">
                Stored in MomHaven Health Vault
              </span>
            </div>
          )}

          {/* Notes & Clinical Summary */}
          {record.notes && (
            <div className="bg-white p-4 rounded-[18px] border border-[var(--border-hairline)] shadow-xs space-y-1.5">
              <h4 className="font-display font-bold text-[13px] text-[var(--ink-900)]">
                Clinical Notes &amp; Findings
              </h4>
              <p className="font-body text-[13px] text-[var(--ink-700)] leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onShareWithClinician();
            }}
            className="w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Generate Clinician Fast-Share Code</span>
          </Button>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-full border border-[var(--border-hairline)] text-[13px] font-display font-semibold text-[var(--ink-700)] hover:bg-[var(--lavender-50)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[var(--ink-500)]" />
            <span>Print or Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
