import React from 'react';
import { ArrowRight, Heart, ShieldCheck, UsersRound } from 'lucide-react';

interface LandingPageProps {
  onMother: () => void;
  onPartner: () => void;
  onAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onMother, onPartner, onAdmin }) => (
  <main className="min-h-screen bg-slate-50 text-slate-900 font-body">
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <button onClick={onMother} className="flex items-center gap-3" aria-label="MomHaven home">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#33178A] text-white">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-[#33178A]">MomHaven</span>
        </button>
        <button onClick={onAdmin} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50">
          Admin access
        </button>
      </nav>
    </header>

    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="font-body text-xs font-bold uppercase tracking-[0.16em] text-[#6C3EAC]">Maternal & child health support</p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl font-bold leading-[1.04] tracking-tight text-slate-900 sm:text-6xl">
            A clearer care journey for every mother.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            MomHaven brings pregnancy guidance, child health records, reminders and safety support into one calm, private place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onMother} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#33178A] px-6 py-3.5 font-display font-bold text-white shadow-sm hover:bg-[#241451]">
              Continue as mother <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onPartner} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3.5 font-display font-bold text-slate-800 hover:bg-slate-50">
              Partner access <UsersRound className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Care journey</p>
                <p className="mt-0.5 text-xs text-slate-500">Structured around your current stage</p>
              </div>
              <span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Private</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-6 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Current care</p>
                <p className="mt-2 font-display text-2xl font-bold text-slate-900">Pregnancy follow-up</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Appointments, reminders and health information stay together.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#F0EBFA] text-[#33178A]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="border-t border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Care record</span><span className="font-mono text-slate-700">READY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-slate-50 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6C3EAC]">Care framework</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">Guidance with a clear source of truth.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Clinical content and safety pathways are designed to remain understandable, traceable and separate from the brand layer.</p>
          </div>
          <div className="border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
              <div className="bg-white p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">01 / GUIDANCE</p>
                <h3 className="mt-3 font-display text-lg font-bold">Practical health information</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Pregnancy and child health information presented around the moments a mother needs it.</p>
              </div>
              <div className="bg-white p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">02 / RECORD</p>
                <h3 className="mt-3 font-display text-lg font-bold">One connected record</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Keep relevant milestones, measurements, reminders and care history together.</p>
              </div>
              <div className="bg-white p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">03 / SAFETY</p>
                <h3 className="mt-3 font-display text-lg font-bold">Clear escalation pathways</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Recognize concerning symptoms and reach appropriate support when it matters.</p>
              </div>
              <div className="bg-white p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">04 / CONNECTION</p>
                <h3 className="mt-3 font-display text-lg font-bold">Trusted participation</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Connect partners and care teams without turning a mother's experience into a dashboard of noise.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display font-bold text-[#33178A]">MomHaven</span>
        <span>Maternal & child health support, designed with care.</span>
      </div>
    </footer>
  </main>
);
