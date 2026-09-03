import React from 'react';
import { ShieldAlert } from 'lucide-react';
import EmptyState from '../EmptyState';

export const SafetyMonitoring: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={ShieldAlert}
      title="No safety monitoring records yet"
      message="Safety monitoring results will appear when backed by live verification evidence. The underlying safety interceptor and automated test suite remain part of the application; this portal does not display seeded scores or synthetic cases."
    />
  </div>
);
