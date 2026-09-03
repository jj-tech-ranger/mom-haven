import React from 'react';
import { Settings } from 'lucide-react';
import EmptyState from '../EmptyState';

export const SystemSettings: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={Settings}
      title="No configurable settings provisioned"
      message="System settings are intentionally empty until they are backed by the live configuration source. No seeded timeouts, gateways, retention values, safety thresholds, or infrastructure values are displayed here."
    />
  </div>
);
