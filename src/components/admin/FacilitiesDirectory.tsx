import React from 'react';
import { Building2 } from 'lucide-react';
import EmptyState from '../EmptyState';

export interface HealthFacility { id: string; mflCode: string; name: string; county: string; status: 'OPERATIONAL' | 'UPGRADING' | 'TEMPORARILY_CLOSED'; }

export const FacilitiesDirectory: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={Building2}
      title="No facility records yet"
      message="The KMHFL directory will display facilities from the live platform data source. No facilities are currently loaded into this production environment."
    />
  </div>
);
