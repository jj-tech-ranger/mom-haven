import React from 'react';
import { ShieldCheck } from 'lucide-react';
import EmptyState from '../EmptyState';

export const ReleaseReadinessDashboard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={ShieldCheck}
      title="Release verification data unavailable"
      message="Release readiness is intentionally not reported as passed until live verification gates and their evidence are available from the production system."
    />
  </div>
);
