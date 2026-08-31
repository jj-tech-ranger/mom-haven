import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Provenance } from '../types';

interface ProvenanceBadgeProps { provenance?: Provenance | null; compact?: boolean; className?: string; showCaption?: boolean; }

const formatDate = (value: unknown) => {
  if (!value) return 'date not recorded';
  const date = typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as {toDate?:unknown}).toDate === 'function'
    ? (value as {toDate:()=>Date}).toDate()
    : new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'date not recorded';
  return date.toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, compact = false, className = '', showCaption = true }) => {
  const isVerified = provenance?.status === 'VERIFIED';
  const verifiedName = (provenance as (Provenance & { verifiedByName?: string }) | null | undefined)?.verifiedByName || provenance?.verifiedBy || 'a clinician';
  return <div className={`inline-flex flex-col gap-1 ${className}`}>
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body font-semibold text-[12px] ${compact?'px-2.5 py-1':''}`} style={{background:isVerified?'var(--status-normal-bg)':'var(--status-info-bg)',color:isVerified?'var(--status-normal)':'var(--status-info)'}}>
      {isVerified?<CheckCircle className="w-[13px] h-[13px]"/>:<Clock className="w-[13px] h-[13px]"/>}
      {isVerified?'Verified':'Reported'}
    </span>
    {!compact && showCaption && <ProvenanceCaption provenance={provenance}/>} 
  </div>;
};

export const ProvenanceCaption: React.FC<{provenance?:Provenance|null;className?:string}> = ({provenance,className=''}) => {
  const isVerified=provenance?.status==='VERIFIED';
  const verifiedName=(provenance as (Provenance & {verifiedByName?:string}) | null | undefined)?.verifiedByName || provenance?.verifiedBy || 'a clinician';
  return <p className={`font-body text-[12px] text-ink-600 mt-1 ${className}`}>{isVerified?`Reviewed by ${verifiedName}, ${formatDate(provenance?.verifiedAt)}`:'Entered by you · not yet verified by a clinician'}</p>;
};

export default ProvenanceBadge;
