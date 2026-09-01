import React from 'react';
import { Heart, ShieldCheck, UsersRound, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onMother: () => void;
  onPartner: () => void;
  onAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onMother, onPartner, onAdmin }) => (
  <main className="min-h-screen bg-white text-[#241451] font-body overflow-hidden">
    <section className="relative min-h-[720px] bg-gradient-to-br from-[#33178A] via-[#5B3AA8] to-[#9167C2] text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_75%_20%,white,transparent_32%)]" />
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <button onClick={onMother} className="flex items-center gap-3" aria-label="MomHaven home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Heart className="h-5 w-5 fill-white" />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">MomHaven</span>
        </button>
        <button onClick={onAdmin} className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/15">
          Admin
        </button>
      </nav>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-20">
        <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-white/75">A calmer place for motherhood</p>
          <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Every mother deserves a little more support.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/85 sm:text-xl">
            MomHaven brings trusted maternal and child health guidance, reminders, safety support, and a connected care journey into one gentle experience.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={onMother} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-display font-bold text-[#33178A] shadow-lg shadow-[#241451]/20 hover:bg-[#F7F3FC]">
              I'm a mother <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onPartner} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-display font-bold text-white backdrop-blur hover:bg-white/15">
              I'm a partner <UsersRound className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-white/20 bg-white/12 p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[25px] bg-[#F7F3FC] p-6 text-[#241451]">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold">Your Haven</span>
                <span className="rounded-full bg-[#EEE7F8] px-3 py-1 text-xs font-bold text-[#33178A]">Private</span>
              </div>
              <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E5DFF0]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9167C2]">Today</p>
                <p className="mt-2 font-display text-2xl font-bold">You're doing enough.</p>
                <p className="mt-2 text-sm leading-6 text-[#6D6380]">Gentle guidance, useful reminders, and a clear path to help when you need it.</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#EEE7F8] p-4"><ShieldCheck className="h-5 w-5 text-[#33178A]"/><p className="mt-3 text-sm font-bold">Safety support</p></div>
                <div className="rounded-2xl bg-[#EEE7F8] p-4"><Heart className="h-5 w-5 text-[#33178A]"/><p className="mt-3 text-sm font-bold">Care journey</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#F7F3FC] px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9167C2]">Built around her</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#33178A] sm:text-4xl">Support that feels human, not overwhelming.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ['Guidance when it matters', 'Clear, practical maternal and child health information designed for real moments.'],
            ['A safer way to stay connected', 'Bring trusted partners into the journey while keeping personal information protected.'],
            ['Help beyond the screen', 'Safety pathways make it easier to recognize when urgent or professional care is needed.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-[#E5DFF0] bg-white p-6">
              <div className="h-2 w-12 rounded-full bg-[#9167C2]" />
              <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6D6380]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <footer className="border-t border-[#E5DFF0] bg-white px-6 py-8 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-[#6D6380] sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display font-bold text-[#33178A]">MomHaven</span>
        <span>Maternal & child health support, designed with care.</span>
      </div>
    </footer>
  </main>
);
