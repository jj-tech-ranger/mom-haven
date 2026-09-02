import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

// src/components/EmptyState.tsx
// The ONE empty-state component used everywhere in the app. Never invent a
// screen-specific empty state — always use this, with different icon/copy/action.
export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-20 h-20 rounded-[24px] bg-[var(--lavender-100)] flex items-center justify-center mb-5 shadow-sm">
        {Icon ? <Icon className="w-8 h-8 text-[var(--haven-orchid)]" strokeWidth={2} /> : null}
      </div>
      <h3 className="font-display font-bold text-[18px] leading-snug text-[var(--ink-900)] mb-1.5">
        {title}
      </h3>
      <p className="font-body text-[14px] leading-relaxed text-[var(--ink-600)] max-w-[280px] mb-6">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="font-display font-semibold text-[15px] text-white rounded-[28px] px-6 py-3.5 transition-transform active:scale-98"
          style={{ background: 'var(--grad-haven)', boxShadow: '0 6px 16px rgba(51,23,138,0.28)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
