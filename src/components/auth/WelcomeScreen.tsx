import React from 'react';
import { Heart, Sparkles, Shield } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onGoogleSignIn: () => void;
  loading?: boolean;
}

export default function WelcomeScreen({
  onCreateAccount,
  onSignIn,
  onGoogleSignIn,
  loading = false,
}: WelcomeScreenProps) {
  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-8 text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #33178A 0%, #4B27A8 45%, #6B3DB8 80%, #9167C2 100%)'
      }}
    >
      {/* Top subtle decorative pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-72 h-72 bg-[#B79CDA]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto z-10 max-w-sm mx-auto">
        {/* Logo Container */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-3.5 mb-6 shadow-md flex items-center justify-center border border-white/30 transition-transform hover:scale-105 duration-300">
          <img
            src="/assets/logo.png"
            alt="MomHaven Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Wordmark */}
        <h1 className="font-display font-extrabold text-[36px] sm:text-[40px] text-white leading-none tracking-tight">
          MomHaven
        </h1>

        {/* Tagline */}
        <p className="font-display font-medium text-[16px] sm:text-[17px] text-[#E5DFF0] mt-2.5 mb-6">
          Every Mother, Every Child, Every Milestone.
        </p>

        {/* Value Proposition Statement */}
        <p className="font-body text-[14px] sm:text-[15px] leading-relaxed text-[#F7F3FC]/90 px-2 font-normal">
          A companion for your pregnancy, childbirth and your child's first five years — alongside your Mother &amp; Child Health Handbook.
        </p>
      </div>

      {/* Action Buttons & Footer */}
      <div className="w-full max-w-sm mx-auto space-y-3.5 z-10 pb-4">
        {/* Create Account Button */}
        <button
          type="button"
          onClick={onCreateAccount}
          disabled={loading}
          className="w-full py-4 px-6 rounded-full bg-white text-[#241451] font-display font-bold text-[16px] shadow-lg hover:bg-white/95 active:scale-[0.98] transition-all cursor-pointer"
        >
          Create account
        </button>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/30 text-white font-display font-semibold text-[15px] flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Continue with Google</span>
        </button>

        {/* Sign In Link */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onSignIn}
            className="text-[14px] font-body text-[#F7F3FC] hover:text-white transition-colors cursor-pointer"
          >
            Already have an account? <strong className="font-display font-bold text-white underline decoration-white/40 underline-offset-4">Sign in</strong>
          </button>
        </div>

        {/* Privacy Assurance Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#E5DFF0]/80 pt-2">
          <Shield className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span>Your health information stays private and yours.</span>
        </div>
      </div>
    </div>
  );
}
