import React from 'react';
import { HeartPulse } from 'lucide-react';
import EmptyState from '../EmptyState';

interface PartnerBirthPlanViewProps { motherName?: string; initialHospital?: string; initialDriverName?: string; initialDriverPhone?: string; initialBackupDriver?: string; initialBackupPhone?: string; initialTransportMode?: string; onSaveTransportPlan?: (data: { hospital: string; driverName: string; driverPhone: string; backupDriver: string; backupPhone: string; transportMode: string; }) => void; }

export default function PartnerBirthPlanView({ motherName, initialHospital, initialDriverName, initialDriverPhone, initialBackupDriver, initialBackupPhone, initialTransportMode, onSaveTransportPlan: _onSaveTransportPlan }: PartnerBirthPlanViewProps) {
  const hasLivePlan = Boolean(motherName && (initialHospital || initialDriverName || initialDriverPhone || initialBackupDriver || initialBackupPhone || initialTransportMode));
  return <div className="p-4 sm:p-6 max-w-lg mx-auto"><div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden"><EmptyState icon={HeartPulse} title={hasLivePlan ? 'Birth plan data available' : 'No shared birth plan yet'} message={hasLivePlan ? 'A shared birth plan exists for the connected mother and can be rendered from live data.' : 'Transport, facility, and companion details will appear here only after the mother shares a live birth plan. No example people, phone numbers, or facilities are preloaded.'} /></div></div>;
}
