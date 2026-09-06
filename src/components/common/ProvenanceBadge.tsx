import React from 'react';
import { ShieldCheck, UserCheck, ArrowUpRight } from 'lucide-react';
import { Provenance } from '../../types';

interface ProvenanceBadgeProps {
  provenance?: Provenance | null;
  className?: string;
}

export default function ProvenanceBadge({ provenance, className = '' }: ProvenanceBadgeProps) {
  const isVerified = provenance?.status === 'VERIFIED';

  if (isVerified) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-display font-semibold bg-[#E6F6EE] text-[#1E8F5F] border border-[#1E8F5F]/20 shadow-xs ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-[#1E8F5F]" />
        Verified by Clinic
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-display font-semibold bg-[#FBF0DC] text-[#A15E06] border border-[#A15E06]/20 shadow-xs ${className}`}>
      <UserCheck className="w-3.5 h-3.5 text-[#A15E06]" />
      Self-Reported
    </span>
  );
}

export interface ReferralBadgeProps {
  label?: string;
  status?: string;
  className?: string;
}

export function ReferralBadge({
  label = 'Referred — awaiting follow-up',
  status = 'open',
  className = '',
}: ReferralBadgeProps) {
  const isCompleted = status === 'completed';
  if (isCompleted) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-display font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Referral Completed
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold tracking-tight bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
      <ArrowUpRight className="w-3 h-3 text-amber-700" />
      {label}
    </span>
  );
}

