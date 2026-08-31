import React, { useState } from 'react';
import { X, Sparkles, Send, MessageCircle, HelpCircle, ShieldCheck } from 'lucide-react';

interface AskHavenSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (query: string) => void;
}

export const AskHavenSheet: React.FC<AskHavenSheetProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const suggestedQuestions = [
    "What should I pack in my maternity bag for Pumwani?",
    "Is mild swelling in my feet normal around week 24?",
    "When should I take my iron tablet with meals?",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSendToChat(query.trim());
    setQuery('');
    onClose();
  };

  const handleChipClick = (q: string) => {
    onSendToChat(q);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-[#241451]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-card-3 border border-border-hairline p-5 max-h-[90vh] overflow-y-auto flex flex-col z-10 animate-in slide-in-from-bottom duration-250">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#E5DFF0] rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--grad-haven)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                  Ask Haven
                </h2>
                <span className="text-[10px] font-display font-bold text-haven-orchid uppercase bg-lavender-100 px-2 py-0.5 rounded-pill">
                  M-TODAY-005
                </span>
              </div>
              <p className="font-body text-xs text-ink-600">
                Supportive guidance from the Kenya MCH Handbook
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Question Chips */}
        <div className="py-4 space-y-2">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600">
            Suggested questions
          </p>
          <div className="flex flex-col gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(q)}
                className="text-left p-3 rounded-card bg-lavender-50 border border-border-hairline hover:bg-lavender-100 hover:border-haven-orchid text-xs text-ink-900 font-body transition-all flex items-center justify-between gap-2 group cursor-pointer"
              >
                <span>{q}</span>
                <Sparkles className="w-3.5 h-3.5 text-haven-orchid shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="pt-2 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about today's symptoms, diet, visits..."
              className="w-full pl-4 pr-12 py-3 bg-lavender-50 rounded-pill border border-border-hairline text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-haven-orchid focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-1.5 top-1.5 w-9 h-9 rounded-full text-white flex items-center justify-center transition-opacity disabled:opacity-40 cursor-pointer"
              style={{ background: 'var(--grad-haven)' }}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Clinical Non-replacement notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-400 text-center pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-haven-orchid shrink-0" />
            <span>Haven provides educational support and never replaces your clinician.</span>
          </div>
        </form>
      </div>
    </div>
  );
};
