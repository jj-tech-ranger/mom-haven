import React from 'react';
import { FileText, Plus, Share2, Printer } from 'lucide-react';
import { DocumentRecord } from '../../types';
import EmptyState from '../EmptyState';

interface RecordsVaultProps {
  records: DocumentRecord[];
  onOpenUpload: () => void;
  onOpenRecordDetail: (record: DocumentRecord) => void;
  onOpenShareCode: () => void;
  onOpenExportReport: () => void;
}

export default function RecordsVault({
  records,
  onOpenUpload,
  onOpenRecordDetail: _onOpenRecordDetail,
  onOpenShareCode,
  onOpenExportReport,
}: RecordsVaultProps) {
  if (records.length === 0) {
    return (
      <div className="space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">Secure Digital Vault</span>
            <h1 className="font-display font-extrabold text-[24px] text-[var(--ink-900)] leading-tight">Health Records</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenShareCode} aria-label="Open sharing" className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center cursor-pointer"><Share2 className="w-4 h-4" /></button>
            <button type="button" onClick={onOpenExportReport} aria-label="Export records" className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center cursor-pointer"><Printer className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden">
          <EmptyState icon={FileText} title="No health records yet" message="Your health documents will appear here after you add them. No example records are preloaded." actionLabel="Upload a document" onAction={onOpenUpload} />
        </div>
        <button type="button" onClick={onOpenUpload} className="w-full py-3.5 rounded-[18px] bg-[var(--haven-deep)] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Upload clinic document or photo</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      <div className="flex items-center justify-between"><h1 className="font-display font-extrabold text-[24px] text-[var(--ink-900)]">Health Records</h1><button type="button" onClick={onOpenUpload} className="w-10 h-10 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center cursor-pointer"><Plus className="w-4 h-4" /></button></div>
      {records.map(record => <button key={record.id} type="button" onClick={() => _onOpenRecordDetail(record)} className="w-full text-left bg-white p-4 rounded-[20px] border border-[var(--border-hairline)] shadow-card-1 cursor-pointer"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-[var(--haven-orchid)]" /><div><h3 className="font-display font-bold text-sm text-[var(--ink-900)]">{record.title}</h3><p className="text-xs text-[var(--ink-600)]">{record.category}</p></div></div></button>)}
    </div>
  );
}
