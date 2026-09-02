import React from 'react';
import { Provenance } from '../../types';

interface ProvenanceCaptionProps {
  provenance?: Provenance | null;
  className?: string;
}

export default function ProvenanceCaption({ provenance, className = '' }: ProvenanceCaptionProps) {
  if (provenance?.status === 'VERIFIED') {
    const verifiedDate = provenance.verifiedAt
      ? new Date(provenance.verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'recently';
    return (
      <p className={`font-body text-[12px] text-[#1E8F5F] ${className}`}>
        Reviewed &amp; verified by Healthcare Provider on {verifiedDate}.
      </p>
    );
  }

  const enteredDate = provenance?.enteredAt
    ? new Date(provenance.enteredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'recently';

  return (
    <p className={`font-body text-[12px] text-[#A15E06] ${className}`}>
      Entered by you on {enteredDate} · not yet verified by a clinician.
    </p>
  );
}
