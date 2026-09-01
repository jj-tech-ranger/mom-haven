import React from 'react';
import { X, Plus, Check, Baby, Heart, ChevronRight } from 'lucide-react';
import { PregnancyDoc, ChildDoc } from '../../types';
import EmptyState from '../EmptyState';

export interface ActiveContext { type: 'pregnancy' | 'child'; id: string; title: string; subtitle: string; status: string; data?: PregnancyDoc | ChildDoc; }
interface ActiveContextSelectorProps { isOpen: boolean; onClose: () => void; pregnancies: PregnancyDoc[]; children: ChildDoc[]; selectedContextId: string | null; onSelectContext: (context: ActiveContext) => void; onAddPregnancy: () => void; onAddChild: () => void; }

export const ActiveContextSelector: React.FC<ActiveContextSelectorProps> = ({ isOpen, onClose, pregnancies, children, selectedContextId, onSelectContext, onAddPregnancy, onAddChild }) => {
  if (!isOpen) return null;
  const contexts: ActiveContext[] = [
    ...pregnancies.map((p) => {
      const week = p.lmp ? Math.floor((Date.now() - new Date(p.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1 : null;
      return { type: 'pregnancy' as const, id: p.id, title: week ? `Pregnancy · Week ${week}` : 'Pregnancy', subtitle: p.edd ? `Due ${new Date(p.edd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'EDD not recorded', status: p.status === 'active' ? 'Active' : 'Completed', data: p };
    }),
    ...children.map((c) => ({ type: 'child' as const, id: c.id, title: c.name || 'Child', subtitle: `Born ${new Date(c.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${c.sex === 'boy' ? 'Boy' : 'Girl'}`, status: 'Child', data: c })),
  ];
  const selectContext = (ctx: ActiveContext) => { onSelectContext(ctx); window.dispatchEvent(new CustomEvent('mom-haven-context-selected', { detail: { type: ctx.type, id: ctx.id, data: ctx.data } })); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-[420px] flex-col overflow-y-auto rounded-t-2xl border border-border-light bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between border-b border-border-light pb-3">
          <div><h2 className="font-consumer text-xl font-bold text-text-primary">Active context</h2><p className="mt-0.5 font-clinical text-xs text-text-muted">Switch between pregnancies and children</p></div>
          <button onClick={onClose} className="flex h-12 w-12 min-h-0 items-center justify-center rounded-md border border-border-light bg-white text-text-muted" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 py-4">
          {contexts.length === 0 ? <EmptyState icon={Heart} title="No health context yet" message="Add a pregnancy or child profile to begin tracking care." actionLabel="Add pregnancy" onAction={() => { onClose(); onAddPregnancy(); }} /> : contexts.map((ctx) => {
            const isSelected = ctx.id === selectedContextId;
            return <button key={`${ctx.type}:${ctx.id}`} onClick={() => selectContext(ctx)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${isSelected ? 'border-brand-primary bg-brand-surface' : 'border-border-light bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-primary text-white">{ctx.type === 'pregnancy' ? <Heart className="h-5 w-5" /> : <Baby className="h-5 w-5" />}</div><div><div className="flex items-center gap-2"><p className="font-consumer text-sm font-bold text-text-primary">{ctx.title}</p><span className={`rounded-md px-2 py-1 font-clinical text-[10px] font-bold ${ctx.status === 'Active' ? 'bg-clinical-normal-bg text-clinical-normal' : 'bg-slate-100 text-text-muted'}`}>{ctx.status}</span></div><p className="mt-0.5 font-clinical text-xs text-text-muted">{ctx.subtitle}</p></div></div>
              {isSelected ? <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-primary text-white"><Check className="h-4 w-4" /></div> : <ChevronRight className="h-4 w-4 text-text-muted" />}
            </button>;
          })}
        </div>
        <div className="space-y-2 border-t border-border-light pt-3"><p className="font-clinical text-[11px] font-semibold uppercase tracking-wide text-text-muted">Add a record</p><div className="grid grid-cols-2 gap-3"><button onClick={() => { onClose(); onAddPregnancy(); }} className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border border-brand-primary bg-white px-3 font-consumer text-xs font-bold text-brand-primary"><Plus className="h-4 w-4" />Add pregnancy</button><button onClick={() => { onClose(); onAddChild(); }} className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border border-brand-primary bg-white px-3 font-consumer text-xs font-bold text-brand-primary"><Plus className="h-4 w-4" />Add child</button></div></div>
      </div>
    </div>
  );
};
