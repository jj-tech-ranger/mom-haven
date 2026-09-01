import React from 'react';
import { ArrowRight, ShieldCheck, UsersRound } from 'lucide-react';

interface LandingPageProps { onMother: () => void; onPartner: () => void; onAdmin: () => void; }

export const LandingPage: React.FC<LandingPageProps> = ({ onMother, onPartner, onAdmin }) => (
  <main className="min-h-screen bg-surface-canvas text-text-primary font-clinical">
    <header className="border-b border-border-light bg-surface-card">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <button onClick={onMother} className="flex min-h-12 items-center gap-3" aria-label="MomHaven home">
          <img src="/assets/favicon-source-800x800.png" alt="" className="h-10 w-10 rounded-card object-cover" />
          <span className="font-consumer text-2xl font-bold tracking-tight text-brand-primary">MomHaven</span>
        </button>
        <button onClick={onAdmin} className="rounded-card border border-border-light bg-surface-card px-4 py-2 text-sm font-semibold text-text-muted hover:bg-brand-surface hover:text-brand-primary">Admin access</button>
      </nav>
    </header>
    <section className="border-b border-border-light bg-surface-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="font-clinical text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Kenya maternal & child health</p>
          <h1 className="mt-4 max-w-2xl font-consumer text-5xl font-bold leading-[1.04] tracking-tight text-text-primary sm:text-6xl">Digital companion for the Kenya Mother-Child Health Handbook.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-text-muted">Track ANC visits, immunizations, and child growth milestones with MomHaven.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onMother} className="inline-flex items-center justify-center gap-2 rounded-card bg-brand-primary px-6 py-3.5 font-consumer font-bold text-white shadow-sm hover:bg-brand-primary-hover">Access Maternal Records <ArrowRight className="h-4 w-4" /></button>
            <button onClick={onMother} className="inline-flex items-center justify-center gap-2 rounded-card border border-border-light bg-surface-card px-6 py-3.5 font-consumer font-bold text-text-primary hover:bg-brand-surface">View Immunization Schedule</button>
          </div>
        </div>
        <div className="border border-border-light bg-surface-canvas p-5 shadow-sm">
          <div className="border border-border-light bg-surface-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border-light px-5 py-4"><div><p className="font-consumer text-lg font-bold text-text-primary">Handbook alignment</p><p className="mt-0.5 text-xs text-text-muted">Clinical content and record structure</p></div><span className="rounded-card bg-clinical-normal-bg px-2.5 py-1 text-xs font-semibold text-clinical-normal">MOH source</span></div>
            <div className="divide-y divide-border-light">
              <div className="flex items-center justify-between px-5 py-4"><div><p className="font-consumer text-sm font-bold">ANC visits</p><p className="mt-0.5 text-xs text-text-muted">Visits, measurements and follow-up</p></div><span className="font-numeric text-xs font-semibold text-clinical-normal">TRACK</span></div>
              <div className="flex items-center justify-between px-5 py-4"><div><p className="font-consumer text-sm font-bold">Immunization</p><p className="mt-0.5 text-xs text-text-muted">Child schedule and recorded doses</p></div><span className="font-numeric text-xs font-semibold text-clinical-normal">TRACK</span></div>
              <div className="flex items-center justify-between px-5 py-4"><div><p className="font-consumer text-sm font-bold">Growth milestones</p><p className="mt-0.5 text-xs text-text-muted">Measurements and developmental history</p></div><span className="font-numeric text-xs font-semibold text-clinical-normal">TRACK</span></div>
            </div>
            <div className="border-t border-border-light px-5 py-4 text-xs leading-5 text-text-muted">Content is presented as a digital companion to the Kenya Mother-Child Health Handbook; it does not replace care from a qualified health professional.</div>
          </div>
        </div>
      </div>
    </section>
    <section className="bg-surface-canvas px-6 py-16 lg:px-8"><div className="mx-auto max-w-6xl"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Care framework</p><h2 className="mt-3 font-consumer text-3xl font-bold text-text-primary sm:text-4xl">Guidance with a clear source of truth.</h2><p className="mt-4 text-sm leading-7 text-text-muted">Clinical content and safety pathways are designed to remain understandable, traceable and separate from the brand layer.</p></div><div className="border border-border-light bg-surface-card shadow-sm"><div className="grid gap-px bg-border-light sm:grid-cols-2"><div className="bg-surface-card p-6"><p className="font-numeric text-xs font-semibold text-text-muted">01 / GUIDANCE</p><h3 className="mt-3 font-consumer text-lg font-bold">Practical health information</h3><p className="mt-2 text-sm leading-6 text-text-muted">Pregnancy and child health information presented around the moments a mother needs it.</p></div><div className="bg-surface-card p-6"><p className="font-numeric text-xs font-semibold text-text-muted">02 / RECORD</p><h3 className="mt-3 font-consumer text-lg font-bold">One connected record</h3><p className="mt-2 text-sm leading-6 text-text-muted">Keep relevant milestones, measurements, reminders and care history together.</p></div><div className="bg-surface-card p-6"><p className="font-numeric text-xs font-semibold text-text-muted">03 / SAFETY</p><h3 className="mt-3 font-consumer text-lg font-bold">Clear escalation pathways</h3><p className="mt-2 text-sm leading-6 text-text-muted">Recognize concerning symptoms and reach appropriate support when it matters.</p></div><div className="bg-surface-card p-6"><p className="font-numeric text-xs font-semibold text-text-muted">04 / CONNECTION</p><h3 className="mt-3 font-consumer text-lg font-bold">Trusted participation</h3><p className="mt-2 text-sm leading-6 text-text-muted">Connect partners and care teams without turning a mother's experience into a dashboard of noise.</p></div></div></div></div></div></section>
    <footer className="border-t border-border-light bg-surface-card px-6 py-8 lg:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between"><span className="font-consumer font-bold text-brand-primary">MomHaven</span><span>Maternal & child health support, designed with care.</span></div></footer>
  </main>
);
