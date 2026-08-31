import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface EmptyRecordsStateProps {
  onAddRecord: () => void;
}

export const EmptyRecordsState: React.FC<EmptyRecordsStateProps> = ({ onAddRecord }) => {
  return (
    <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-8 text-center space-y-4 animate-fade-in my-6">
      <div className="w-16 h-16 rounded-2xl bg-lavender-100 flex items-center justify-center mx-auto text-haven-orchid">
        <FileText className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-[260px] mx-auto">
        <h3 className="font-display font-bold text-lg text-ink-900">No records yet</h3>
        <p className="font-body text-xs text-ink-600 leading-relaxed">
          Records will appear here automatically once an ANC visit, newborn check, or vaccine is logged.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onAddRecord}
          className="py-3.5 px-6 bg-gradient-to-r from-haven-deep to-haven-orchid text-white font-display font-bold text-sm rounded-pill shadow-button hover:opacity-95 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add your first record</span>
        </button>
      </div>
    </div>
  );
};
