import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Share2, 
  Printer, 
  Download, 
  ShieldCheck, 
  UserCheck, 
  Calendar, 
  Filter,
  Eye,
  Lock
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import ProvenanceBadge from '../common/ProvenanceBadge';
import Button from '../Button';

interface RecordsVaultProps {
  records?: DocumentRecord[];
  onOpenUpload: () => void;
  onOpenRecordDetail: (record: DocumentRecord) => void;
  onOpenShareCode: () => void;
  onOpenExportReport: () => void;
}

export default function RecordsVault({
  records = [],
  onOpenUpload,
  onOpenRecordDetail,
  onOpenShareCode,
  onOpenExportReport,
}: RecordsVaultProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [provenanceFilter, setProvenanceFilter] = useState<'All' | 'VERIFIED' | 'REPORTED'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = records.filter(r => {
    if (activeCategory !== 'All' && r.category !== activeCategory) return false;
    if (provenanceFilter !== 'All' && r.provenance?.status !== provenanceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchFacility = (r.facilityName || '').toLowerCase().includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchFacility && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto">
      {/* Vault Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-display font-bold text-[var(--haven-orchid)] uppercase tracking-wider">
            Secure Digital Vault
          </span>
          <h1 className="font-display font-extrabold text-[24px] text-[var(--ink-900)] leading-tight">
            Health Records
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShareCode}
            title="Clinician Fast Share PIN"
            className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenExportReport}
            title="Export Medical Summary"
            className="w-10 h-10 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--ink-400)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search ultrasound, lab test, facility..."
          className="w-full pl-10 pr-4 py-2.5 rounded-[16px] bg-white border border-[var(--border-hairline)] text-[13px] shadow-xs focus:outline-none focus:border-[var(--haven-orchid)]"
        />
      </div>

      {/* Category Pills Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['All', 'Ultrasound', 'Lab Results', 'Immunization', 'Clinical Notes', 'Prescriptions'].map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-display font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-[var(--haven-deep)] text-white shadow-xs'
                : 'bg-white border border-[var(--border-hairline)] text-[var(--ink-600)] hover:bg-[var(--lavender-50)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Provenance Filter Chips */}
      <div className="flex items-center gap-2 text-[11px] font-display font-semibold">
        <span className="text-[var(--ink-400)] uppercase tracking-wider">Provenance:</span>
        <button
          type="button"
          onClick={() => setProvenanceFilter('All')}
          className={`px-2.5 py-1 rounded-full cursor-pointer ${
            provenanceFilter === 'All' ? 'bg-[var(--haven-deep)] text-white' : 'bg-[var(--lavender-100)] text-[var(--ink-600)]'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setProvenanceFilter('VERIFIED')}
          className={`px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1 ${
            provenanceFilter === 'VERIFIED' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          Verified Only
        </button>
        <button
          type="button"
          onClick={() => setProvenanceFilter('REPORTED')}
          className={`px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1 ${
            provenanceFilter === 'REPORTED' ? 'bg-[#A15E06] text-white' : 'bg-[#FBF0DC] text-[#A15E06]'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          Self-Reported
        </button>
      </div>

      {/* Record Cards Feed */}
      {records.length === 0 ? (
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[var(--border-hairline)] text-center space-y-4 shadow-card-1">
          <div className="w-14 h-14 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-[var(--haven-orchid)]" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
              Your Digital Vault is Empty
            </h3>
            <p className="font-body text-xs text-[var(--ink-600)] max-w-sm mx-auto mt-1 leading-relaxed">
              Upload photos or PDFs of ultrasound scans, laboratory reports, immunization cards, or prescription records to keep them safe and organized.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={onOpenUpload}
            className="py-3 px-6 text-xs mx-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Upload Your First Document
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[22px] p-6 border border-[var(--border-hairline)] text-center space-y-2">
          <FileText className="w-8 h-8 text-[var(--ink-400)] mx-auto opacity-60" />
          <h4 className="font-display font-bold text-sm text-[var(--ink-800)]">
            No matching documents found
          </h4>
          <p className="text-xs text-[var(--ink-500)]">
            Try adjusting your search query or selected category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('All');
              setProvenanceFilter('All');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-[var(--haven-deep)] hover:underline mt-2 inline-block cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => (
            <div
              key={record.id}
              onClick={() => onOpenRecordDetail(record)}
              className="bg-white p-4 rounded-[22px] border border-[var(--border-hairline)] shadow-card-1 hover:shadow-card-2 hover:border-[var(--haven-orchid)] transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--lavender-100)] text-[var(--haven-deep)] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] leading-tight">
                      {record.title}
                    </h3>
                    <span className="text-[11px] text-[var(--ink-500)] mt-0.5 block">
                      {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {record.facilityName ? ` · ${record.facilityName}` : ''}
                    </span>
                  </div>
                </div>

                <ProvenanceBadge provenance={record.provenance} />
              </div>

              {record.notes && (
                <p className="font-body text-[12px] text-[var(--ink-600)] line-clamp-2 bg-[var(--lavender-50)]/50 p-2.5 rounded-[12px]">
                  {record.notes}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-[var(--haven-orchid)] font-display font-semibold pt-1 border-t border-[var(--border-hairline)]/60">
                <span>Category: {record.category}</span>
                <span className="flex items-center gap-1 text-[var(--haven-deep)]">
                  <Eye className="w-3.5 h-3.5" />
                  View details
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Upload Floating Action */}
      <div className="pt-2">
        <Button
          variant="primary"
          onClick={onOpenUpload}
          className="w-full py-3.5 flex items-center justify-center gap-2 shadow-card-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Clinic Document / Photo</span>
        </Button>
      </div>
    </div>
  );
}
