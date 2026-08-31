import React, { useState } from 'react';
import { X, Plus, Check, Baby, Heart, Sparkles, Calendar, ChevronRight } from 'lucide-react';
import { PregnancyDoc, ChildDoc } from '../../types';
import EmptyState from '../EmptyState';

export interface ActiveContext {
  type: 'pregnancy' | 'child';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  data?: PregnancyDoc | ChildDoc;
}

interface ActiveContextSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pregnancies: PregnancyDoc[];
  children: ChildDoc[];
  selectedContextId: string | null;
  onSelectContext: (context: ActiveContext) => void;
  onAddPregnancy: () => void;
  onAddChild: () => void;
}

export const ActiveContextSelector: React.FC<ActiveContextSelectorProps> = ({
  isOpen,
  onClose,
  pregnancies,
  children,
  selectedContextId,
  onSelectContext,
  onAddPregnancy,
  onAddChild,
}) => {
  if (!isOpen) return null;

  // Build context list
  const contexts: ActiveContext[] = [
    ...pregnancies.map((p) => {
      const week = p.lmp
        ? Math.floor((Date.now() - new Date(p.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
        : null;
      return {
        type: 'pregnancy' as const,
        id: p.id,
        title: week ? `Pregnancy · Week ${week}` : 'Current Pregnancy',
        subtitle: p.edd ? `Due ${new Date(p.edd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'EDD Pending',
        status: p.status === 'active' ? 'Active' : 'Completed',
        data: p,
      };
    }),
    ...children.map((c) => ({
      type: 'child' as const,
      id: c.id,
      title: c.name || 'Baby',
      subtitle: `Born ${new Date(c.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${c.sex === 'boy' ? 'Boy' : 'Girl'}`,
      status: 'Child',
      data: c,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[#241451]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet container with 24px top radius */}
      <div className="relative w-full max-w-[420px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-card-3 border border-border-hairline p-5 max-h-[85vh] overflow-y-auto flex flex-col z-10 animate-in slide-in-from-bottom duration-250">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#E5DFF0] rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-ink-900">
                Active Context
              </h2>
              <span className="text-[10px] font-display font-bold text-haven-orchid uppercase bg-lavender-100 px-2 py-0.5 rounded-pill">
                M-TODAY-002
              </span>
            </div>
            <p className="font-body text-xs text-ink-600 mt-0.5">
              Switch between your tracked pregnancy and children
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context List or Empty State */}
        <div className="py-4 space-y-2.5">
          {contexts.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No context tracked yet"
              message="Add your pregnancy or baby profile to begin tracking milestones and clinic visits."
              actionLabel="Add Pregnancy"
              onAction={() => {
                onClose();
                onAddPregnancy();
              }}
            />
          ) : (
            contexts.map((ctx) => {
              const isSelected = ctx.id === selectedContextId || (selectedContextId === null && ctx === contexts[0]);
              return (
                <button
                  key={ctx.id}
                  onClick={() => {
                    onSelectContext(ctx);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-card border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-lavender-100/80 border-haven-orchid shadow-card-1 ring-1 ring-haven-orchid'
                      : 'bg-white border-border-hairline hover:bg-lavender-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'var(--grad-haven)' }}
                    >
                      {ctx.type === 'pregnancy' ? (
                        <Heart className="w-5 h-5 fill-white/20 text-white" />
                      ) : (
                        <Baby className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display font-bold text-sm text-ink-900">
                          {ctx.title}
                        </p>
                        <span
                          className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-pill ${
                            ctx.status === 'Active'
                              ? 'bg-status-normal-bg text-status-normal'
                              : 'bg-lavender-200 text-haven-deep'
                          }`}
                        >
                          {ctx.status}
                        </span>
                      </div>
                      <p className="font-body text-xs text-ink-600 mt-0.5">
                        {ctx.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-haven-deep text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-ink-400" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Secondary Actions: Add Pregnancy / Add Child */}
        <div className="pt-2 border-t border-border-hairline space-y-2">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-ink-600 mb-1">
            Add New Record
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onAddPregnancy();
              }}
              className="w-full py-2.5 px-3 rounded-pill bg-white border-1.5 border-haven-deep text-haven-deep font-display font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-lavender-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add pregnancy</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onAddChild();
              }}
              className="w-full py-2.5 px-3 rounded-pill bg-white border-1.5 border-haven-deep text-haven-deep font-display font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-lavender-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add child</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
