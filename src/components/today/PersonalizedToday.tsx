// src/components/today/PersonalizedToday.tsx
import React from 'react';
import TodayDashboard from './TodayDashboard';

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
  return (
    <TodayDashboard
      userId={userId}
      userName={userName}
      onNavigate={onNavigate}
      onOpenAskHaven={onOpenAskHaven}
    />
  );
}
