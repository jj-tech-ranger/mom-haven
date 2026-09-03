// src/types/educationalResource.ts
import { LifecycleStage, ChildAgeBracket } from './healthContext';

export type ResourceCategory =
  | 'NUTRITION_SUPERFOODS'
  | 'DANGER_SIGNS'
  | 'POSTPARTUM_CARE'
  | 'NEWBORN_DEVELOPMENT'
  | 'PARTNER_GUIDE'
  | 'CLINICAL_VISITS'
  | 'PRECONCEPTION'
  | 'RIGHTS_AND_POLICY';

export type ResourceReviewStatus =
  | 'PUBLISHED'
  | 'DRAFT'
  | 'NEEDS_CLINICAL_REVIEW';

export interface EducationalResource {
  id: string;
  title: string;
  titleSwahili?: string;
  summary: string;
  summarySwahili?: string;
  body?: string;
  bodySwahili?: string;
  category: ResourceCategory;
  lifecycleStages: LifecycleStage[];
  pregnancyWeeks?: number[];
  postpartumWeeks?: number[];
  childAgeMonthsRange?: {
    minMonths: number;
    maxMonths: number;
  };
  childAgeBracket?: ChildAgeBracket[];
  topics: string[];
  languages: Array<'en' | 'sw'>;
  audience?: Array<'mother' | 'partner' | 'supporter' | 'general'>;
  reviewedBy: string;
  reviewStatus: ResourceReviewStatus;
  lastUpdated: string;
  counties?: string[];
  priority?: number; // 0 - 100 base editorial weight (default 50)
  keyNutrients?: string[];
  trimesterStage?: string;
}

export interface UserRecommendationContext {
  lifecycleStage: LifecycleStage;
  language: 'en' | 'sw';
  interests?: string[];
  pregnancyWeek?: number;
  postpartumWeeks?: number;
  childAgeMonths?: number;
  childAgeBracket?: ChildAgeBracket;
  county?: string;
  subcounty?: string;
  audience?: 'mother' | 'partner' | 'supporter' | 'general';
  limit?: number;
}

export interface RankedResource {
  resource: EducationalResource;
  score: number;
  matchBreakdown: {
    lifecycle: number;
    weekOrStage: number;
    interests: number;
    language: number;
    location: number;
    priority: number;
  };
  relevanceReasons: string[];
  primaryReason: string;
  isFallback?: boolean;
}
