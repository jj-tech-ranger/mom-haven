import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Square, 
  FileText, 
  HelpCircle, 
  Plus, 
  Sparkles, 
  Bookmark, 
  Check, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { AppointmentPrepPlan, ClinicianQuestion } from '../../types/advancedPersonalization';

interface AppointmentPrepModalProps {
  prepPlan: AppointmentPrepPlan;
  onClose: () => void;
  onSaveQuestions?: (questions: string[]) => Promise<void> | void;
  onAskHaven?: (prompt: string) => void;
}

export default function AppointmentPrepModal({
  prepPlan,
  onClose,
  onSaveQuestions,
  onAskHaven,
}: AppointmentPrepModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [savedQuestions, setSavedQuestions] = useState<string[]>(prepPlan.savedQuestions || []);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const toggleChecklist = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddQuestion = (question: string) => {
    if (!question.trim()) return;
    if (savedQuestions.includes(question.trim())) return;
    const updated = [...savedQuestions, question.trim()];
    setSavedQuestions(updated);
    if (onSaveQuestions) onSaveQuestions(updated);
    setSavedFeedback('Question added to your personal clinic list!');
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  const handleRemoveQuestion = (idx: number) => {
    const updated = savedQuestions.filter((_, i) => i !== idx);
    setSavedQuestions(updated);
    if (onSaveQuestions) onSaveQuestions(updated);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    handleAddQuestion(newQuestionText.trim());
    setNewQuestionText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-wider text-[var(--haven-orchid)]">
              <FileText className="w-3.5 h-3.5" />
              <span>{prepPlan.upcomingMilestone}</span>
            </div>
            <h2 className="font-display font-extrabold text-[20px] text-[var(--ink-900)] mt-0.5">
              Prepare for Your Clinician Visit
            </h2>
            <p className="font-body text-[12px] text-[var(--ink-600)] mt-0.5">
              Grounded checklist & questions for your next doctor or midwife appointment
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {/* 1. What to Bring Checklist */}
        <div className="space-y-2.5">
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--haven-deep)]" />
            <span>Essential Items Checklist</span>
          </h3>

          <div className="space-y-2">
            {prepPlan.recommendedChecklist.map((item) => {
              const isChecked = Boolean(checkedItems[item.id]);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleChecklist(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleChecklist(item.id);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200 text-[var(--ink-700)]'
                      : 'bg-stone-50 border-[var(--border-hairline)] hover:bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChecklist(item.id);
                    }}
                    className="mt-0.5 text-[var(--ink-500)]"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-display font-semibold text-[13px] ${isChecked ? 'line-through text-emerald-900' : 'text-[var(--ink-900)]'}`}>
                        {item.item}
                      </span>
                      {item.mandatory && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold uppercase">
                          Required
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="font-body text-[11px] text-[var(--ink-500)] mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Suggested Questions for Your Clinician */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>Recommended Questions to Ask</span>
            </h3>
            <span className="text-[10px] text-[var(--ink-500)] font-medium">
              Grounded in Kenya MCH Guidelines
            </span>
          </div>

          <div className="space-y-2">
            {prepPlan.suggestedQuestions.map((q) => {
              const alreadySaved = savedQuestions.includes(q.question);
              return (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-white border border-[var(--border-hairline)] shadow-xs space-y-1.5"
                >
                  <p className="font-display font-medium text-[13px] text-[var(--ink-900)]">
                    "{q.question}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[var(--ink-500)] font-medium">
                      {q.relevanceReason}
                    </span>

                    <div className="flex items-center gap-2">
                      {onAskHaven && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onAskHaven(`Help me understand this before my clinic visit: "${q.question}"`);
                          }}
                          className="text-[11px] font-display font-semibold text-[var(--haven-orchid)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ask Haven</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddQuestion(q.question)}
                        disabled={alreadySaved}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-display font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          alreadySaved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[var(--lavender-100)] text-[var(--haven-deep)] hover:bg-[var(--lavender-200)]'
                        }`}
                      >
                        {alreadySaved ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. My Saved Questions List */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
          <h3 className="font-display font-bold text-[14px] text-[var(--ink-900)] flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-emerald-600" />
            <span>My Clinic Notes & Questions ({savedQuestions.length})</span>
          </h3>

          {savedQuestions.length === 0 ? (
            <p className="font-body text-[12px] text-[var(--ink-400)] italic">
              No questions saved yet. Tap "Save" on suggestions above or add your own below.
            </p>
          ) : (
            <div className="space-y-1.5">
              {savedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--lavender-50)] text-[12px] font-body text-[var(--ink-800)]"
                >
                  <span className="flex-1 pr-2">{q}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom question input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Add your own custom question for the doctor..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border-hairline)] focus:outline-none focus:border-[var(--haven-orchid)]"
            />
            <button
              type="submit"
              disabled={!newQuestionText.trim()}
              className="px-3 py-2 rounded-xl bg-[var(--haven-deep)] text-white text-xs font-display font-bold disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[var(--lavender-100)] text-[var(--haven-deep)] font-display font-bold text-xs hover:bg-[var(--lavender-200)] transition-colors cursor-pointer"
          >
            Done Preparing
          </button>
        </div>
      </div>
    </div>
  );
}
