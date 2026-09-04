import React, { useState } from 'react';
import { CalendarDays, Check, ChevronRight, Sparkles } from 'lucide-react';
import type { HealthContext, LifecycleStage } from '../../types/healthContext';
import { saveAnonymousContextDraft } from '../../services/anonymousContextService';

interface Props { onDone: () => void; }

const interests = [
  ['pregnancy', 'Pregnancy week-by-week'], ['anc', 'ANC & appointments'], ['nutrition', 'Nutrition'],
  ['development', 'Baby development'], ['birth_prep', 'Birth preparation'], ['breastfeeding', 'Breastfeeding'],
  ['postpartum', 'Postpartum recovery'], ['wellbeing', 'Mental wellbeing'], ['warning_signs', 'Warning signs'],
] as const;

export default function AnonymousPersonalization({ onDone }: Props) {
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState<LifecycleStage>('pregnancy');
  const [lmp, setLmp] = useState('');
  const [interestsSelected, setInterestsSelected] = useState<string[]>([]);
  const [style, setStyle] = useState<HealthContext['havenResponseStyle']>('concise');

  const toggle = (id: string) => setInterestsSelected(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const save = () => {
    let pregnancyWeek: number | undefined;
    let dueDate: string | undefined;
    if (lmp) {
      const date = new Date(`${lmp}T00:00:00`);
      const today = new Date();
      const days = Math.max(0, Math.floor((today.getTime() - date.getTime()) / 86400000));
      pregnancyWeek = Math.floor(days / 7);
      const edd = new Date(date.getTime()); edd.setDate(edd.getDate() + 280);
      dueDate = edd.toISOString().slice(0, 10);
    }
    saveAnonymousContextDraft({ lifecycleStage: stage, language: 'en', pregnancyWeek, dueDate, interests: interestsSelected, havenResponseStyle: style });
    onDone();
  };

  return <div className="space-y-5">
    <div className="flex items-center gap-2 text-[var(--haven-orchid)] text-xs font-display font-bold uppercase tracking-wider"><Sparkles className="h-4 w-4" /> Personalize your visit</div>
    <div><h2 className="font-display font-extrabold text-xl">Make your guest visit more useful</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">These preferences stay on this device until you choose to create an account.</p></div>
    {step === 1 && <div className="grid gap-3 sm:grid-cols-2">{[
      ['pregnancy', "I'm pregnant"], ['planning', 'Planning a pregnancy'], ['postpartum', 'Recently gave birth'], ['parenting', 'Caring for a baby or child'], ['supporter', 'Supporting a mother'], ['exploring', 'Just exploring'],
    ].map(([id, label]) => <button key={id} type="button" onClick={() => setStage(id as LifecycleStage)} className={`rounded-2xl border p-4 text-left text-sm font-display font-bold ${stage === id ? 'border-[var(--haven-deep)] bg-[var(--surface-2)] ring-2 ring-[var(--haven-deep)]/10' : 'border-[var(--border)]'}`}>{label}</button>)}</div>}
    {step === 2 && stage === 'pregnancy' && <div className="space-y-4"><div><label className="mb-1 block text-xs font-display font-bold">Last menstrual period <span className="font-normal text-[var(--text-secondary)]">(optional)</span></label><div className="relative"><CalendarDays className="absolute left-4 top-3.5 h-4 w-4 text-[var(--ink-400)]" /><input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] py-3 pl-11 pr-4 text-sm" /></div></div><p className="text-xs text-[var(--text-secondary)]">We'll use this only to estimate your pregnancy stage. It does not replace a clinical record.</p></div>}
    {step === 2 && stage !== 'pregnancy' && <div className="rounded-2xl bg-[var(--surface-2)] p-5 text-sm text-[var(--text-secondary)]">You can personalize more later. For now, we'll tailor the guest experience to your selected journey.</div>}
    {step === 3 && <div className="grid gap-2 sm:grid-cols-2">{interests.map(([id, label]) => <button key={id} type="button" onClick={() => toggle(id)} className={`flex items-center justify-between rounded-2xl border p-3.5 text-left text-sm ${interestsSelected.includes(id) ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}><span>{label}</span>{interestsSelected.includes(id) && <Check className="h-4 w-4 text-[var(--haven-deep)]" />}</button>)}</div>}
    {step === 4 && <div className="space-y-3"><p className="text-sm font-display font-bold">How should Haven respond?</p>{[['concise','Short and simple'],['detailed','Detailed explanations'],['appointment_prep','Help me prepare for appointments'],['record_explanations','Help me understand records'],['daily_guidance','Daily guidance']].map(([id,label]) => <button key={id} type="button" onClick={() => setStyle(id as HealthContext['havenResponseStyle'])} className={`w-full rounded-2xl border p-4 text-left text-sm ${style === id ? 'border-[var(--haven-deep)] bg-[var(--surface-2)]' : 'border-[var(--border)]'}`}>{label}</button>)}</div>}
    <div className="flex gap-2"><button type="button" disabled={step === 1} onClick={() => setStep(s => s - 1)} className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-display font-bold disabled:opacity-40">Back</button><button type="button" onClick={() => step < 4 ? setStep(s => s + 1) : save()} className="flex-1 rounded-full bg-[var(--haven-deep)] px-5 py-3 text-sm font-display font-bold text-white">{step < 4 ? <>Continue <ChevronRight className="ml-1 inline h-4 w-4" /></> : 'Personalize my visit'}</button></div>
  </div>;
}
