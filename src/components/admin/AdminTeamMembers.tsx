import React from 'react';
import { Users } from 'lucide-react';
import EmptyState from '../EmptyState';

export interface AdminUser { id: string; name: string; email: string; phone: string; role: string; status?: string; lastLogin: string; }

export const AdminTeamMembers: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={Users}
      title="No additional admin records yet"
      message="The Admin Team view is intentionally empty until administrator records are provisioned from the live identity and authorization source. Your current authenticated administrator identity remains shown in the Admin Hub header."
    />
  </div>
);
