import React, { useState } from 'react';
import { Calendar, ArrowLeft, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import Button from '../Button';
import { HavenRibbon } from '../HavenRibbon';

interface PregnancySetupProps { onBack: () => void; onContinue: (data: { method: 'LMP' | 'EDD'; date: string; calculatedEDD: string; calculatedWeeks: number }) => void; onSkip: () => void; }

export const PregnancySetup: React.FC<PregnancySetupProps> = ({ onBack, onContinue, onSkip }) => {
  const [method, setMethod] = useState<'LMP' | 'EDD'>('LMP');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const details = (() => {
    if (!selectedDate) return null;
    const input = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(input.getTime())) return null;
    const lmp = new Date(input);
    if (method === 'EDD') lmp.setDate(lmp.getDate() - 280);
    const edd = new Date(lmp);
    edd.setDate(edd.getDate() + 280);
    const today = new Date();
    const days = Math.floor((today.getTime() - lmp.getTime()) / 86400000);
    const weeks = Math.max(0, Math.floor(days / 7));
    return { edd: edd.toISOString().slice(0, 10), weeks, days: Math.max(0, days % 7), lmp: lmp.toISOString().slice(0, 10) };
  })();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details) return setError('Please choose a valid date to continue.');
    onContinue({ method, date: selectedDate, calculatedEDD: details.edd, calculatedWeeks: details.weeks });
  };

  return (
    <main className="min-h-[760px] w-full max-w-[430px] mx-auto rounded-[32px] overflow-hidden bg-[#F7F3FC] text-[#241451] border border-[#E5DFF0] shadow-[0_24px_70px_rgba(51,23,138,0.14)]">
      <div className="px-6 pt-6"><button type="button" onClick={onBack} aria-label="Back to profile setup" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DFF0] bg-white text-[#33178A] shadow-sm"><ArrowLeft className="h-5 w-5" /></button></div>
      <div className="px-6 pt-5"><HavenRibbon progress={50} currentStep={1} totalSteps={2} label="Pregnancy setup" sublabel="Step 1 of 2" showMarkerTooltip={false} /></div>
      <div className="px-6 pt-5"><p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#9167C2]">Your pregnancy</p><h1 className="mt-1 font-display text-[30px] font-bold leading-tight">When is baby expected?</h1><p className="mt-2 font-body text-sm leading-6 text-[#6D6380]">Use either your last period date or a due date from your clinician. We only need one.</p></div>

      <div className="mx-4 mt-6 rounded-[24px] border border-[#E5DFF0] bg-white p-5 shadow-[0_8px_24px_rgba(51,23,138,0.07)]">
        <div className="flex rounded-[28px] bg-[#EEE7F8] p-1">
          {(['LMP', 'EDD'] as const).map(option => <button key={option} type="button" onClick={() => { setMethod(option); setSelectedDate(''); setError(null); }} className={`flex-1 rounded-[24px] px-3 py-2.5 font-display text-xs font-bold transition-colors ${method === option ? 'bg-[#33178A] text-white shadow-sm' : 'text-[#6D6380]'}`}>{option === 'LMP' ? 'Last period' : 'Due date'}</button>)}
        </div>
        <p className="mt-3 font-body text-xs leading-5 text-[#6D6380]">Not sure of your due date? Use your last period date instead.</p>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="pregnancy-date" className="mb-1.5 block font-display text-xs font-bold">{method === 'LMP' ? 'First day of your last period' : 'Your estimated due date'}</label>
          <div className="relative"><Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A79CBC]" /><input id="pregnancy-date" type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setError(null); }} className="w-full rounded-[14px] border border-[#E5DFF0] bg-[#F7F3FC] py-3 pl-10 pr-3.5 text-sm outline-none focus:border-[#9167C2]" /></div>
          {error && <p className="mt-1.5 text-xs text-[#C4283C]">{error}</p>}

          <div className="mt-5 rounded-[18px] bg-[#F7F3FC] p-4"><div className="flex items-center gap-2 font-display text-xs font-bold text-[#33178A]"><Info className="h-4 w-4 text-[#9167C2]" />How we work it out</div><p className="mt-1.5 font-body text-xs leading-5 text-[#6D6380]">We use a standard 280-day pregnancy calculation to anchor your timeline. Your clinician’s dates remain the clinical source of truth.</p></div>

          {details && <div className="mt-4 flex items-center justify-between rounded-[18px] border border-[#E5DFF0] bg-white p-4"><div><p className="font-body text-[11px] text-[#6D6380]">Estimated due date</p><p className="font-display text-base font-bold text-[#33178A]">{new Date(`${details.edd}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><div className="text-right"><p className="font-body text-[11px] text-[#6D6380]">Current stage</p><p className="font-display text-base font-bold text-[#9167C2] tabular-nums">{details.weeks}w {details.days}d</p></div></div>}
          <Button type="submit" variant="primary" disabled={!selectedDate} className="mt-5 flex items-center justify-center gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </div>

      <div className="px-6 pb-6 pt-5 text-center"><button type="button" onClick={onSkip} className="font-display text-sm font-semibold text-[#33178A] hover:underline">I’ll add this later</button><div className="mt-4 flex items-center justify-center gap-2 font-body text-[11px] text-[#6D6380]"><ShieldCheck className="h-4 w-4 text-[#9167C2]" />You can update this later.</div></div>
    </main>
  );
};
