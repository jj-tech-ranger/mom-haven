import React from 'react';
import { BookOpen } from 'lucide-react';
import EmptyState from '../EmptyState';

export interface ContentArticle {
  id: string;
  title: string;
  titleSwahili: string;
  category: 'NUTRITION_SUPERFOODS' | 'DANGER_SIGNS' | 'POSTPARTUM_CARE' | 'NEWBORN_DEVELOPMENT' | 'PARTNER_GUIDE';
  trimesterStage: 'Trimester 1' | 'Trimester 2' | 'Trimester 3' | 'Postnatal (0-6m)' | 'Child (6m-5yr)';
  summary: string;
  summarySwahili: string;
  keyNutrients: string[];
  reviewedBy: string;
  status: 'PUBLISHED' | 'DRAFT' | 'NEEDS_CLINICAL_REVIEW';
  lastUpdated: string;
}

export const ContentLibrary: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <EmptyState
      icon={BookOpen}
      title="No educational content yet"
      message="Educational guides will appear here when they are created, reviewed, and published from the live content source. No seeded articles are shown."
    />
  </div>
);
