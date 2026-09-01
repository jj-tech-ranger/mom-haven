import React from 'react';
import { ArrowRight, BookOpen, CalendarCheck2, FileCheck2, LockKeyhole, PhoneCall, ShieldCheck, Syringe, Baby, HeartPulse, Languages } from 'lucide-react';

interface LandingPageProps {
  onMother: () => void;
  onPartner: () => void;
  onAdmin: () => void;
}

const provenance = 'MOH Kenya 2020 aligned';

export const LandingPage: React.FC<LandingPageProps> = ({ onMother, onPartner, onAdmin }) => (
  <main className="min-h-screen bg-surface-canvas text-text-primary font-consumer">
    <header className="sticky top-0 z-30 h-16 border-b border-border-light bg-white">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <button onClick={onMother} className="flex min-h-12 items-center gap-3" aria-label="MomHaven home">
          <img src="/logo.svg" alt="MomHaven" className="h-9 w-auto" />
          <span className="hidden rounded-md border border-border-light bg-brand-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary sm:inline-flex">{provenance}</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden min-h-12 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-text-muted hover:bg-brand-surface hover:text-brand-primary sm:inline-flex" aria-label="Language: English">
            <Languages className="h-4 w-4" /> English / Kiswahili
          </button>
          <button onClick={onAdmin} className="hidden min-h-12 rounded-md px-3 text-sm font-semibold text-text-muted hover:bg-brand-surface hover:text-brand-primary sm:inline-flex">Clinician Login</button>
          <button onClick={onMother} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-primary px-4 text-sm font-bold text-white shadow-sm hover:bg-brand-primary-hover sm:px-5">Access Maternal Records <ArrowRight className="h-4 w-4" /></button>
        </div>
      </nav>
    </header>

    <section className="border-b border-border-light bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-border-light bg-brand-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
            <FileCheck2 className="h-4 w-4" /> Kenya Mother & Child Health Handbook
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-text-primary lg:text-5xl">Your Digital Kenya Mother & Child Health Handbook.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-text-muted">Track 8 ANC contacts, KEPI immunizations, and child growth milestones with a calm, offline-resilient digital companion grounded in Ministry of Health guidelines.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onMother} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-primary px-6 font-bold text-white shadow-sm hover:bg-brand-primary-hover">Start Mother Registration <ArrowRight className="h-4 w-4" /></button>
            <button onClick={onMother} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border-light bg-white px-6 font-bold text-text-primary hover:bg-brand-surface"><BookOpen className="h-4 w-4 text-brand-primary" /> View Sample MCH Record</button>
          </div>
          <p className="mt-4 text-xs leading-5 text-text-muted">A digital companion to the Kenya Mother-Child Health Handbook. MomHaven does not replace care from a qualified health professional.</p>
        </div>

        <div className="lg:col-span-5">
          <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between border-b border-border-light pb-4">
              <div><p className="text-sm font-semibold text-text-muted">Today</p><h2 className="mt-1 text-xl font-bold text-text-primary">Pregnancy Week <span className="font-mono">24</span></h2></div>
              <span className="rounded-md bg-clinical-normal-bg px-2.5 py-1 text-xs font-bold text-clinical-normal">On track</span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-brand-surface p-4"><div className="flex items-center gap-3"><CalendarCheck2 className="h-5 w-5 text-brand-primary" /><div><p className="text-xs font-semibold text-text-muted">Upcoming visit</p><p className="font-bold text-text-primary">ANC Contact 3 · <span className="font-mono">14 Sep 2026</span></p></div></div></div>
              <div className="rounded-xl border border-border-light p-4"><div className="flex items-center gap-3"><HeartPulse className="h-5 w-5 text-clinical-normal" /><div><p className="text-xs font-semibold text-text-muted">Last blood pressure</p><p className="font-mono text-lg font-bold text-text-primary">120/80 <span className="font-sans text-xs font-semibold text-text-muted">mmHg</span></p></div></div></div>
              <div className="flex items-center justify-between pt-2 text-xs text-text-muted"><span>Digital MCH record</span><span className="font-mono font-semibold">MOH 2020</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">MOH 2020 handbook verification ledger</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">A structured digital record, grounded in the handbook.</h2><p className="mt-4 text-sm leading-7 text-text-muted">Core maternal and child health workflows follow the structure and guidance of the Kenya Mother-Child Health Handbook.</p></div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm"><CalendarCheck2 className="h-5 w-5 text-brand-primary" /><p className="mt-4 font-mono text-xs font-semibold text-text-muted">01 / ANC 1–8</p><h3 className="mt-2 text-lg font-bold">Antenatal Care</h3><p className="mt-2 text-sm leading-6 text-text-muted">Track all 8 recommended contacts, vital trends, and lab test results.</p></div>
          <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm"><Syringe className="h-5 w-5 text-brand-primary" /><p className="mt-4 font-mono text-xs font-semibold text-text-muted">02 / KEPI</p><h3 className="mt-2 text-lg font-bold">Immunization Schedule</h3><p className="mt-2 text-sm leading-6 text-text-muted">Complete vaccine schedules from birth through 24 months, with recorded doses and due dates.</p></div>
          <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm"><Baby className="h-5 w-5 text-brand-primary" /><p className="mt-4 font-mono text-xs font-semibold text-text-muted">03 / GROWTH</p><h3 className="mt-2 text-lg font-bold">Child Growth Tracking</h3><p className="mt-2 text-sm leading-6 text-text-muted">Track weight, height, and MUAC measurements with growth trends and malnutrition alerts.</p></div>
          <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm"><HeartPulse className="h-5 w-5 text-brand-primary" /><p className="mt-4 font-mono text-xs font-semibold text-text-muted">04 / PNC 1–4</p><h3 className="mt-2 text-lg font-bold">Postnatal Care</h3><p className="mt-2 text-sm leading-6 text-text-muted">Follow maternal recovery and newborn safety checks through structured postnatal contacts.</p></div>
        </div>
      </div>
    </section>

    <section className="px-6 pb-16 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#D5C2E0] bg-brand-surface p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Privacy, security & data sovereignty</p><h2 className="mt-3 text-3xl font-bold text-text-primary">Your health record stays yours.</h2><p className="mt-4 text-sm leading-7 text-text-muted">MomHaven is designed around the Kenya Data Protection Act 2019 and privacy-conscious local storage patterns.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#D5C2E0] bg-white p-5"><ShieldCheck className="h-5 w-5 text-clinical-normal" /><h3 className="mt-3 font-bold">Kenya DPA 2019</h3><p className="mt-2 text-xs leading-5 text-text-muted">Privacy and data protection principles built into the product.</p></div>
            <div className="rounded-xl border border-[#D5C2E0] bg-white p-5"><LockKeyhole className="h-5 w-5 text-brand-primary" /><h3 className="mt-3 font-bold">Local-first storage</h3><p className="mt-2 text-xs leading-5 text-text-muted">Offline-resilient record access using browser-local IndexedDB storage where supported.</p></div>
            <div className="rounded-xl border border-[#D5C2E0] bg-white p-5"><FileCheck2 className="h-5 w-5 text-brand-primary" /><h3 className="mt-3 font-bold">No third-party tracking</h3><p className="mt-2 text-xs leading-5 text-text-muted">No advertising or third-party analytics scripts are presented as part of the public experience.</p></div>
          </div>
        </div>
      </div>
    </section>

    <footer className="bg-slate-900 px-6 py-12 text-slate-300 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_.8fr_1fr]">
        <div><img src="/logo.svg" alt="MomHaven" className="h-9 w-auto brightness-0 invert" /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">A digital companion for maternal and child health records, grounded in Kenya's Mother-Child Health Handbook.</p><button onClick={onPartner} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-md border border-slate-700 px-4 text-sm font-semibold text-white hover:bg-slate-800">Partner access</button></div>
        <div><h3 className="font-bold text-white">Emergency support</h3><a href="tel:1190" className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-md bg-clinical-danger px-4 font-bold text-white hover:opacity-90"><PhoneCall className="h-4 w-4" /> Direct dial 1190</a></div>
        <div><h3 className="font-bold text-white">Trust & provenance</h3><p className="mt-3 text-sm leading-6 text-slate-400">Clinical content is presented with reference to the Kenya Ministry of Health Mother-Child Health Handbook (2020).</p><div className="mt-4 flex flex-wrap gap-4 text-sm"><button onClick={onAdmin} className="min-h-12 text-slate-300 underline underline-offset-4 hover:text-white">Clinician Verification Portal</button><span className="text-slate-600">|</span><span className="text-slate-500">Privacy Policy</span><span className="text-slate-500">Terms of Service</span></div></div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-800 pt-5 text-xs text-slate-500">MomHaven · MOH Kenya 2020 aligned · For health information and record support, not a replacement for professional care.</div>
    </footer>
  </main>
);
