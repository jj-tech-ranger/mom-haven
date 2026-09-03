import React from 'react';
import { BookOpenCheck } from 'lucide-react';
import EmptyState from '../EmptyState';

export const ClinicalDecisionRegister: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={BookOpenCheck}
      title="No live decision records yet"
      message="Clinical decision rules must be loaded from the governed, versioned source before they are presented as verified operational records. No seeded rules are shown in production."
    />
  </div>
);
