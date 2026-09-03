import React from 'react';
import { BarChart3 } from 'lucide-react';
import EmptyState from '../EmptyState';

export const PlatformAnalytics: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={BarChart3}
      title="No live analytics yet"
      message="Platform analytics will appear when production events are available in the analytics data source. No synthetic users, clinical activity, or outcome metrics are displayed."
    />
  </div>
);
