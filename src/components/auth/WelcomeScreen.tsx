import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onGoogleSignIn: () => void;
  googleLoading?: boolean;
}

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M21.35 12.27c0-.78-.07-1.53-.22-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.93v2.42h3.14c1.84-1.7 2.93-4.2 2.93-7.38Z" />
    <path fill="#34A853" d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.42c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.74 9.74 0 0 0 12 21.67Z" />
    <path fill="#FBBC05" d="M6.54 13.78A5.84 5.84 0 0 1 6.23 12c0-.62.11-1.22.31-1.78v-2.5H3.3A9.74 9.74 0 0 0 2.26 12c0 1.57.38 3.05 1.04 4.28l3.24-2.5Z" />
    <path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.27 14.63 2.33 12 2.33A9.74 9.74 0 0 0 3.3 7.72l3.24 2.5C7.31 7.91 9.46 6.19 12 6.19Z" />
  </svg>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateAccount,
  onSignIn,
  onGoogleSignIn,
  googleLoading = false,
}) => {
  return (
    <main className="relative min-h-[760px] w-full max-w-[430px] mx-auto overflow-hidden rounded-[32px] bg-[#F7F3FC] text-[#241451] shadow-[0_24px_70px_rgba(51,23,138,0.18)] border border-[#E5DFF0] flex flex-col">
      <section className="relative px-7 pt-12 pb-20 text-center text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #33178A 0%, #9167C2 100%)' }}>
        <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-white/8" />
        <div className="relative flex flex-col items-center">
          <div className="mb-7 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[28px] border border-white/25 bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-sm">
            <img src="/assets/favicon-source-800x800.png" alt="" className="h-full w-full object-cover" />
          </div>
          <img src="/logo.svg" alt="MomHaven" className="h-[74px] w-auto max-w-[250px] object-contain brightness-0 invert" />
          <p className="mt-3 font-display text-[18px] font-semibold leading-tight text-white/95">
            Every Mother, Every Child,<br />Every Milestone
          </p>
        </div>
      </section>

      <section className="relative -mt-8 flex flex-1 flex-col rounded-t-[30px] bg-white px-6 pb-6 pt-7 shadow-[0_-10px_35px_rgba(36,20,81,0.08)]">
        <div className="mx-auto max-w-[330px] text-center">
          <p className="font-body text-[13px] leading-6 text-[#6D6380]">
            MomHaven is your companion to the Kenyan Mother &amp; Child Health Handbook — helping you keep track of your journey alongside, never instead of, clinical care.
          </p>
        </div>

        <div className="mt-auto space-y-3.5 pt-7">
          <button type="button" onClick={onCreateAccount} className="w-full rounded-[28px] bg-[linear-gradient(135deg,#33178A_0%,#9167C2_100%)] px-6 py-4 font-display text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(51,23,138,0.24)] transition-transform hover:-translate-y-0.5 active:translate-y-0">
            Create account
          </button>

          <button type="button" onClick={onGoogleSignIn} disabled={googleLoading} className="flex w-full items-center justify-center gap-3 rounded-[28px] border-[1.5px] border-[#33178A] bg-white px-6 py-3.5 font-display text-[15px] font-semibold text-[#33178A] transition-colors hover:bg-[#F7F3FC] disabled:cursor-not-allowed disabled:opacity-60">
            <GoogleMark />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <button type="button" onClick={onSignIn} className="block w-full pt-1 text-center font-body text-[13px] text-[#6D6380]">
            Already have an account? <span className="font-semibold text-[#33178A] underline underline-offset-4">Sign in</span>
          </button>

          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#6D6380]">
            <ShieldCheck className="h-4 w-4 text-[#9167C2]" strokeWidth={2} />
            <span>Your health information stays private and yours.</span>
          </div>
        </div>
      </section>
    </main>
  );
};
