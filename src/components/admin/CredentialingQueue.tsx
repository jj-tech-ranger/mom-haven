import React from 'react';
import { UserCheck } from 'lucide-react';
import EmptyState from '../EmptyState';

export interface ClinicianProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cadre: 'OBSTETRICIAN' | 'MIDWIFE' | 'CLINICAL_OFFICER' | 'NURSE' | 'PEDIATRICIAN';
  licenseNumber: string;
  boardName: string;
  facilityAffiliation: string;
  county: string;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  submissionDate: string;
  verificationAuditDate?: string;
  verifierAdminId?: string;
  rejectionReason?: string;
  documents: { licenseDocUrl?: string; idDocUrl?: string };
}

export const CredentialingQueue: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={UserCheck}
      title="No clinician records yet"
      message="The credentialing queue is connected to live platform data. No clinician applications or authorized clinician records are currently available in this production environment."
    />
  </div>
);
