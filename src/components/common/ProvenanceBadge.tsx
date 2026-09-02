import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
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
