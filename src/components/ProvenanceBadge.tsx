import React from 'react';
import { FileText } from 'lucide-react';
import { Provenance } from '../types';

interface ProvenanceBadgeProps {
  section?: string;
  page?: string | number;
  provenance?: Provenance | null;
  compact?: boolean;
  className?: string;
  showCaption?: boolean;
}

const formatDate = (value: unknown) => {
  if (!value) return 'date not recorded';
  const date = typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as {toDate?: unknown}).toDate === 'function'
    ? (value as {toDate: () => Date}).toDate()
    : new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'date not recorded';
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  section = 'MOH 2020 Guidelines', page, provenance, compact = false, className = '', showCaption = true,
}) => {
  const isVerified = provenance?.status === 'VERIFIED';
  const verifiedName = (provenance as (Provenance & {verifiedByName?: string}) | null | undefined)?.verifiedByName || provenance?.verifiedBy || 'a clinician';
  const label = `MOH Kenya ${section}${page ? `, Pg ${page}` : ''}`;
  return <div className={`inline-flex flex-col gap-1 ${className}`}>
    <span className={`inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono px-2.5 py-1 rounded-md ${compact ? 'px-2 py-1' : ''}`}>
      <FileText className="w-3.5 h-3.5 text-[#5B2C6F]" aria-hidden="true" />
      <span>{provenance ? `${isVerified ? 'Verified · ' : 'Reported · '}` : ''}{label}</span>
    </span>
    {provenance && !compact && showCaption && <ProvenanceCaption provenance={provenance} />}
  </div>;
};

export const ProvenanceCaption: React.FC<{provenance?: Provenance | null; className?: string}> = ({provenance, className = ''}) => {
  const isVerified = provenance?.status === 'VERIFIED';
  const verifiedName = (provenance as (Provenance & {verifiedByName?: string}) | null | undefined)?.verifiedByName || provenance?.verifiedBy || 'a clinician';
  return <p className={`font-clinical text-[12px] text-[#566573] mt-1 ${className}`}>{isVerified ? `Reviewed by ${verifiedName}, ${formatDate(provenance?.verifiedAt)}` : 'Entered by you · not yet verified by a clinician'}</p>;
};

export default ProvenanceBadge;
