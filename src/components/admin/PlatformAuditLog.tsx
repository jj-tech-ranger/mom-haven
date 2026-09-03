import React from 'react';
import { FileClock } from 'lucide-react';
import EmptyState from '../EmptyState';

export const PlatformAuditLog: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={FileClock}
      title="No audit events yet"
      message="Audit events are shown only when produced by the live platform audit store. No fabricated activity is displayed in production."
    />
  </div>
);
