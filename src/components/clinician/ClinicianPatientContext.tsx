import React from 'react';
import {
  ShieldAlert,
  Clock,
  Plus,
  CheckCircle,
  FileCheck,
  Printer,
  ChevronRight,
} from 'lucide-react';
import type { MomHavenHealthSummary } from '../../types/healthSummary';
import HealthSummary from '../records/HealthSummary';
import Button from '../Button';

interface ClinicianPatientContextProps {
  summary: MomHavenHealthSummary;
  onLogEncounter?: () => void;
  onVerifyRecord?: () => void;
  onCloseSession: () => void;
  onPrint?: () => void;
}

export default function ClinicianPatientContext({
  summary,
  onLogEncounter,
  onVerifyRecord,
  onCloseSession,
  onPrint,
}: ClinicianPatientContextProps) {
  // Check for critical flags in recent health logs
  const flaggedLogs = summary.recentHealthLogs.filter(l => l.hasDangerSigns);
  const screeningAlerts = summary.reproductiveScreening?.alerts || [];
  const hasScreeningFlag = Boolean(summary.reproductiveScreening?.hasSuspiciousOrPositive);

  return (
    <div className="space-y-4">
      {/* Clinician Reproductive Screening Alert */}
      {hasScreeningFlag && (
        <div className="bg-red-50 border-2 border-red-300 rounded-[18px] p-4 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-display font-bold text-xs text-red-900 uppercase tracking-wider">
              Urgent Referral Alert: Reproductive Organ Cancer Screening (MOH p.22)
            </h4>
            <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
              Positive or suspicious clinical finding recorded ({screeningAlerts.join('; ') || 'Screening positive/suspicious'}).
              Initiate or verify referral for colposcopy, biopsy, or surgical breast evaluation immediately per Kenya Cancer Screening Guidelines.
            </p>
          </div>
        </div>
      )}

      {/* Clinician Fast Action / Alert Bar */}
      {flaggedLogs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[18px] p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-display font-bold text-xs text-red-900">
              Maternal Health Attention Flagged
            </h4>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Patient reported {flaggedLogs.length} self-monitoring danger sign{flaggedLogs.length > 1 ? 's' : ''} in the past 30 days:{' '}
              <strong className="text-red-900">
                {flaggedLogs.flatMap(l => l.dangerSignsList || [l.type]).join(' · ')}
              </strong>. Please evaluate during this contact.
            </p>
          </div>
        </div>
      )}

      {/* Embedded High-Detail Health Summary */}
      <HealthSummary
        summary={summary}
        isClinicianView={true}
        onPrint={onPrint}
      />
    </div>
  );
}
