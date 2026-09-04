import React from 'react';
import { MoodType } from '../../types/healthLog';

export interface MoodMeta {
  type: MoodType;
  emoji: string;
  label: string;
  swLabel: string;
  colorName: 'emerald' | 'amber' | 'blue' | 'purple' | 'indigo' | 'rose';
  accentHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeBg: string;
}

export const MOOD_CONFIG: Record<MoodType, MoodMeta> = {
  calm: {
    type: 'calm',
    emoji: '😌',
    label: 'Calm',
    swLabel: 'Utulivu',
    colorName: 'emerald',
    accentHex: '#10B981',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    activeBg: 'bg-emerald-500 text-white',
  },
  happy: {
    type: 'happy',
    emoji: '😊',
    label: 'Happy',
    swLabel: 'Furaha',
    colorName: 'amber',
    accentHex: '#F59E0B',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/30',
    badgeBorder: 'border-amber-200 dark:border-amber-800/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    activeBg: 'bg-amber-500 text-white',
  },
  tired: {
    type: 'tired',
    emoji: '🥱',
    label: 'Tired',
    swLabel: 'Uchovu',
    colorName: 'blue',
    accentHex: '#3B82F6',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/30',
    badgeBorder: 'border-blue-200 dark:border-blue-800/50',
    badgeText: 'text-blue-700 dark:text-blue-300',
    activeBg: 'bg-blue-500 text-white',
  },
  anxious: {
    type: 'anxious',
    emoji: '😟',
    label: 'Anxious',
    swLabel: 'Wasiwasi',
    colorName: 'purple',
    accentHex: '#8B5CF6',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/30',
    badgeBorder: 'border-purple-200 dark:border-purple-800/50',
    badgeText: 'text-purple-700 dark:text-purple-300',
    activeBg: 'bg-purple-500 text-white',
  },
  sad: {
    type: 'sad',
    emoji: '😔',
    label: 'Sad',
    swLabel: 'Huzuni',
    colorName: 'indigo',
    accentHex: '#6366F1',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    activeBg: 'bg-indigo-500 text-white',
  },
  overwhelmed: {
    type: 'overwhelmed',
    emoji: '😣',
    label: 'Overwhelmed',
    swLabel: 'Kulemewa',
    colorName: 'rose',
    accentHex: '#F43F5E',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/30',
    badgeBorder: 'border-rose-200 dark:border-rose-800/50',
    badgeText: 'text-rose-700 dark:text-rose-300',
    activeBg: 'bg-rose-500 text-white',
  },
};

export const ALL_MOOD_TYPES: MoodType[] = [
  'calm',
  'happy',
  'tired',
  'anxious',
  'sad',
  'overwhelmed',
];

export interface MoodEmojiProps {
  mood: MoodType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  language?: 'en' | 'sw';
  className?: string;
}

const SIZE_MAP = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl sm:text-3xl',
};

export default function MoodEmoji({
  mood,
  size = 'md',
  showLabel = false,
  language = 'en',
  className = '',
}: MoodEmojiProps) {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.calm;
  const label = language === 'sw' ? config.swLabel : config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 leading-none select-none ${className}`}
      title={label}
      aria-label={label}
    >
      <span className={SIZE_MAP[size]} role="img" aria-hidden="true">
        {config.emoji}
      </span>
      {showLabel && (
        <span className="font-display font-semibold text-xs tracking-tight">
          {label}
        </span>
      )}
    </span>
  );
}
