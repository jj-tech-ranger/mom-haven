// src/components/today/PersonalizedToday.tsx
import React from 'react';
import TodayDashboard from './TodayDashboard';
export { default as AggregateInsightCard } from './AggregateInsightCard';

interface PersonalizedTodayProps {
  userId: string;
  userName?: string;
  onNavigate: (tab: 'today' | 'journey' | 'child' | 'haven' | 'records' | 'profile') => void;
  onOpenAskHaven?: (prompt?: string) => void;
}

/**
 * PersonalizedToday connects the authenticated user shell to the
 * comprehensive, context-aware TodayDashboard.
 */
export default function PersonalizedToday({
  userId,
  userName,
  onNavigate,
  onOpenAskHaven,
}: PersonalizedTodayProps) {
  const handleNavigate = (tab: 'today' | 'journey' | 'child' | 'haven' | 'records' | 'profile' | 'Today' | 'Journey' | 'Child' | 'Haven' | 'Records' | 'Profile') => {
    const normalized = tab.toLowerCase() as 'today' | 'journey' | 'child' | 'haven' | 'records' | 'profile';
    onNavigate(normalized);
  };

  return (
    <TodayDashboard
      userId={userId}
      userName={userName}
      onNavigate={handleNavigate}
      onOpenAskHaven={onOpenAskHaven}
    />
  );
}
