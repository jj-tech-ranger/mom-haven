import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Provenance } from '../types';

interface ProvenanceBadgeProps {
  provenance?: Provenance | null;
  compact?: boolean;
  className?: string;
  showCaption?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  compact = false,
  className = '',
  showCaption = true,
}) => {
  const isVerified = provenance?.status === 'VERIFIED';

  if (isVerified) {
    const verifiedDetails = provenance?.verifiedBy
      ? `Reviewed by ${provenance.verifiedBy}${
          provenance.verifiedAt
            ? `, ${new Date(provenance.verifiedAt).toLocaleDateString('en-KE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}`
            : ''
        }`
      : 'Reviewed by Clinician';

    return (
      <div className={`inline-flex flex-col gap-1 ${className}`}>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-normal-bg border border-status-normal text-status-normal text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-display font-semibold tracking-wide">Verified</span>
        </div>
        {!compact && showCaption && (
          <span className="text-[11px] text-status-normal px-1 font-body leading-tight">
            {verifiedDetails}
          </span>
        )}
      </div>
    );
  }

  // Reported status (default)
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-lavender-100 border border-border-hairline text-haven-deep text-xs font-medium">
        <Clock className="w-3.5 h-3.5 text-haven-orchid flex-shrink-0" />
        <span className="font-display font-semibold tracking-wide">Reported</span>
      </div>
      {!compact && showCaption && (
        <span className="text-[11px] text-ink-600 px-1 font-body leading-tight">
          Entered by you · not yet verified by a clinician
        </span>
      )}
    </div>
  );
};

export const ProvenanceCaption: React.FC<{ provenance?: Provenance | null; className?: string }> = ({
  provenance,
  className = '',
}) => {
  const isVerified = provenance?.status === 'VERIFIED';
  return (
    <p className={`font-body text-[12px] text-ink-600 mt-1 ${className}`}>
      {isVerified
        ? `Reviewed by ${provenance?.verifiedBy || 'a clinician'}${
            provenance?.verifiedAt
              ? `, ${new Date(provenance.verifiedAt).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}`
              : ''
          }`
        : 'Entered by you · not yet verified by a clinician'}
    </p>
  );
};

export default ProvenanceBadge;
