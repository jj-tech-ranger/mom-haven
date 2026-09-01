import React from 'react';
import { FileText, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon | React.ComponentType<{className?: string; strokeWidth?: number}>;
}

export default function EmptyState({title, description, message, actionLabel, onAction, icon: Icon = FileText}: EmptyStateProps) {
  return <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-6 shadow-sm">
    <div className="w-12 h-12 bg-[#F5EEF8] text-[#5B2C6F] rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
    </div>
    <h3 className="text-lg font-bold text-[#1C2833] mb-2">{title}</h3>
    <p className="text-sm text-[#566573] mb-6 leading-relaxed">{description ?? message}</p>
    {actionLabel && onAction && <button onClick={onAction} className="min-h-12 bg-[#5B2C6F] text-white text-sm font-medium px-5 rounded-xl hover:bg-[#4A235A] transition-colors focus-visible:outline-none">{actionLabel}</button>}
  </div>;
}
