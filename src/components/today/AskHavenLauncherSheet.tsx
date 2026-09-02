import React, { useState } from 'react';
import { X, Sparkles, Send, Mic, ArrowUpRight } from 'lucide-react';
import Button from '../Button';

interface AskHavenLauncherSheetProps {
  onClose: () => void;
  onOpenFullChat: (initialPrompt?: string) => void;
}

const SUGGESTED_PROMPTS = [
  "Is mild pelvic cramping normal at 24 weeks?",
  "What essentials should I pack in my hospital bag?",
  "How should I take my iron and folic acid supplements?",
  "What are the warning signs of pre-eclampsia?"
];

export default function AskHavenLauncherSheet({
  onClose,
  onOpenFullChat,
}: AskHavenLauncherSheetProps) {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onClose();
    onOpenFullChat(inputText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-display font-extrabold text-[17px] text-[var(--ink-900)]">
              Ask Haven anything
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="font-body text-[13px] text-[var(--ink-600)]">
            Your clinical companion powered by MOH-aligned maternal health knowledge. Select a topic or type your question:
          </p>

          {/* Quick prompts */}
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullChat(prompt);
                }}
                className="w-full text-left p-3 rounded-[14px] bg-[var(--lavender-50)] hover:bg-[var(--lavender-100)] border border-[var(--border-hairline)] text-[13px] font-display font-medium text-[var(--haven-deep)] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="line-clamp-1">{prompt}</span>
                <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--haven-orchid)]" />
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="pt-2">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about pregnancy symptoms, diet, tests..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full pl-4 pr-20 py-3 rounded-full border border-[var(--border-hairline)] bg-white text-[14px] focus:outline-none focus:border-[var(--haven-orchid)] shadow-xs"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
