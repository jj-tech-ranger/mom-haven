// src/components/records/CategoryRow.tsx
import React from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';

interface CategoryRowProps {
  title: string;
  count: number;
  verifiedCount: number;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export default function CategoryRow({ title, count, verifiedCount, icon: Icon, onClick }: CategoryRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white border border-[var(--border-hairline)] p-4 rounded-[20px] flex items-center justify-between shadow-card-1 hover:border-[var(--haven-orchid)] transition-all mb-3 text-left cursor-pointer group"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-[16px] bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)] group-hover:scale-105 transition-transform">
          <Icon className="w-6 h-6 text-[var(--haven-orchid)]" />
        </div>
        <div>
          <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">{title}</h4>
          <p className="font-body text-xs text-[var(--ink-600)] mt-0.5">
            {count === 0 ? (
              'No records yet'
            ) : (
              <>
                {count} {count === 1 ? 'record' : 'records'}
                {verifiedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[#1E8F5F] font-semibold ml-2">
                    <ShieldCheck className="w-3.5 h-3.5 inline" /> {verifiedCount} verified
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--ink-400)] group-hover:text-[var(--haven-orchid)] transition-colors" />
    </button>
  );
}
