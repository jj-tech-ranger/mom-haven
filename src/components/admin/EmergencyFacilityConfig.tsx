import React from 'react';
import { PhoneCall } from 'lucide-react';
import EmptyState from '../EmptyState';

export const EmergencyFacilityConfig: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={PhoneCall}
      title="No emergency facility records provisioned"
      message="Admin-managed emergency facility records are empty until connected to the authoritative live directory. The application's safety-critical emergency guidance remains separate and is not replaced with fabricated contacts."
    />
  </div>
);
