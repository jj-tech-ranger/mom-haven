import React, { useEffect, useState } from 'react';
import { X, Heart, Baby, Plus, Check } from 'lucide-react';
import { Child, Pregnancy } from '../../types';
import { getChildren } from '../../services/childService';

interface ContextSelectorModalProps {
  userId: string;
  activePregnancy: Pregnancy | null;
  activeContextId: string;
  onSelectContext: (type: 'pregnancy' | 'child', id: string, label: string) => void;
  onClose: () => void;
  onAddNew: () => void;
}

export default function ContextSelectorModal({
  userId,
  activePregnancy,
  activeContextId,
  onSelectContext,
  onClose,
  onAddNew,
}: ContextSelectorModalProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChildren() {
      try {
        const list = await getChildren(userId);
        setChildren(list);
      } catch (err) {
        console.error('Error loading children', err);
      } finally {
        setLoading(false);
      }
    }
    loadChildren();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
          <h2 className="font-display font-extrabold text-[18px] text-[var(--ink-900)]">
            Select Profile Context
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--lavender-50)] flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--ink-900)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          {/* Active Pregnancy Option */}
          {activePregnancy && (
            <div
              onClick={() => {
                onSelectContext('pregnancy', activePregnancy.id, `Pregnancy (Week ${activePregnancy.gestationalAgeWeeks || 24})`);
                onClose();
              }}
              className={`p-4 rounded-[18px] border flex items-center justify-between cursor-pointer transition-all ${
                activeContextId === activePregnancy.id || !activeContextId
                  ? 'border-[var(--haven-deep)] bg-[var(--lavender-50)] shadow-xs'
                  : 'border-[var(--border-hairline)] hover:border-[var(--haven-orchid)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--lavender-100)] flex items-center justify-center text-[var(--haven-deep)]">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                    Current Pregnancy
                  </h4>
                  <p className="font-body text-[12px] text-[var(--ink-600)]">
                    Week {activePregnancy.gestationalAgeWeeks || 24} · Due {activePregnancy.edd ? new Date(activePregnancy.edd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '2026'}
                  </p>
                </div>
              </div>

              {(activeContextId === activePregnancy.id || !activeContextId) && (
                <div className="w-6 h-6 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          )}

          {/* Child Profiles */}
          {children.map(child => (
            <div
              key={child.id}
              onClick={() => {
                onSelectContext('child', child.id, child.name);
                onClose();
              }}
              className={`p-4 rounded-[18px] border flex items-center justify-between cursor-pointer transition-all ${
                activeContextId === child.id
                  ? 'border-[var(--haven-deep)] bg-[var(--lavender-50)] shadow-xs'
                  : 'border-[var(--border-hairline)] hover:border-[var(--haven-orchid)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-[15px] text-[var(--ink-900)]">
                    {child.name}
                  </h4>
                  <p className="font-body text-[12px] text-[var(--ink-600)]">
                    Born {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '2026'} · {child.sex === 'female' ? 'Girl' : 'Boy'}
                  </p>
                </div>
              </div>

              {activeContextId === child.id && (
                <div className="w-6 h-6 rounded-full bg-[var(--haven-deep)] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Add Another Child or Pregnancy */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddNew();
            }}
            className="w-full py-3.5 px-4 rounded-[18px] border border-dashed border-[var(--haven-orchid)] text-[var(--haven-deep)] font-display font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[var(--lavender-50)] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add another child or pregnancy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
