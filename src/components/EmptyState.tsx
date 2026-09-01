import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps { icon?: LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; message: string; actionLabel?: string; onAction?: () => void; }

export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return <div className="flex flex-col items-center justify-center text-center px-8 py-16"><div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center mb-5">{Icon ? <Icon className="w-7 h-7 text-[#6C3EAC]" strokeWidth={2} /> : null}</div><h3 className="font-display font-bold text-[18px] leading-snug text-slate-900 mb-1.5">{title}</h3><p className="font-body text-[14px] leading-relaxed text-slate-600 max-w-[280px] mb-6">{message}</p>{actionLabel && onAction && <button onClick={onAction} className="font-display font-semibold text-[15px] text-white rounded-md bg-[#33178A] px-6 py-3.5 shadow-sm cursor-pointer hover:bg-[#241451]">{actionLabel}</button>}</div>;
}
