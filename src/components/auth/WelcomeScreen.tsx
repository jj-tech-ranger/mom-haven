import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onGoogleSignIn: () => void;
  googleLoading?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateAccount,
  onSignIn,
  onGoogleSignIn,
  googleLoading = false,
}) => {
  return (
    <div
      className="relative min-h-[780px] w-full max-w-[420px] mx-auto rounded-[36px] overflow-hidden shadow-2xl flex flex-col justify-between p-6 text-white select-none border-4 border-slate-900"
      style={{
        background: 'linear-gradient(135deg, #33178A 0%, #5B2CA0 50%, #9167C2 100%)',
      }}
    >
      {/* Top Status Header Label */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase font-display">
          M-AUTH-001
        </span>
        <h2 className="text-sm font-semibold text-white/90 font-display">
          Welcome
        </h2>
      </div>

      {/* Center Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4">
        {/* Soft rounded icon badge holding simple heart glyph */}
        <div className="w-24 h-24 rounded-[28px] bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-6 shadow-inner">
          <svg
            className="w-12 h-12 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>

        {/* Brand Wordmark & Tagline in Baloo 2 */}
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight mb-2">
          MomHaven
        </h1>
        <p className="font-display font-medium text-white/95 text-lg leading-snug mb-5 max-w-xs">
          Every Mother, Every Child,<br />Every Milestone.
        </p>

        {/* Explanatory Sentence */}
        <p className="font-body text-white/85 text-sm leading-relaxed max-w-[290px] mx-auto">
          A companion for your pregnancy, childbirth and your child's first five years — alongside your Mother &amp; Child Health Handbook.
        </p>
      </div>

      {/* Bottom Actions Stack */}
      <div className="w-full flex flex-col items-center space-y-3 pb-2 pt-4">
        {/* Primary Action: White pill Create account button */}
        <button
          type="button"
          onClick={onCreateAccount}
          className="w-full py-4 px-6 rounded-full bg-white text-[#33178A] font-display font-bold text-base shadow-lg hover:bg-white/95 active:scale-[0.98] transition-all cursor-pointer"
        >
          Create account
        </button>

        {/* Secondary Action: Translucent-white-bordered Continue with Google button */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/40 text-white font-display font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <span className="text-sm font-medium">Connecting to Google...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white/90" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Tertiary Text Link: Already have an account? Sign in */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onSignIn}
            className="text-white/90 hover:text-white text-sm font-body cursor-pointer transition-colors"
          >
            Already have an account? <span className="font-bold underline decoration-white/50 underline-offset-4">Sign in</span>
          </button>
        </div>

        {/* Small privacy reassurance line with shield icon */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-white/70 text-xs font-body">
          <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
          <span>Your health information stays private and yours.</span>
        </div>
      </div>
    </div>
  );
};
