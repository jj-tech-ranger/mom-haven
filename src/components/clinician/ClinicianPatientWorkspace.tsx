import React from 'react';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import EmptyState from '../EmptyState';

interface ClinicianPatientWorkspaceProps { motherName?: string; gestationWeeks?: number; bloodGroup?: string; clinicianName: string; facilityName: string; onCloseSession: () => void; }

export default function ClinicianPatientWorkspace({ motherName, gestationWeeks, bloodGroup, clinicianName, facilityName, onCloseSession }: ClinicianPatientWorkspaceProps) {
  const hasPatient = Boolean(motherName || gestationWeeks !== undefined || bloodGroup);
  return <div className="min-h-screen bg-[var(--lavender-50)] p-4 sm:p-6"><div className="max-w-4xl mx-auto"><button type="button" onClick={onCloseSession} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--haven-deep)] cursor-pointer"><ArrowLeft className="w-4 h-4" />Close clinical session</button><div className="bg-white rounded-2xl border border-[var(--border-hairline)] shadow-card-1 overflow-hidden"><EmptyState icon={Stethoscope} title={hasPatient ? 'Clinical record ready' : 'No patient record yet'} message={hasPatient ? `Live patient data is available for the current session. Clinician: ${clinicianName || 'Current clinician'}${facilityName ? ` · ${facilityName}` : ''}.` : 'No patient has been connected to this clinical workspace. Patient demographics, ANC encounters, measurements, immunizations, and notes will appear only from the live clinical data source. No demo patient is loaded.'} /></div></div></div>;
}
