import React from 'react';
import { ChevronLeft, Heart, Shield, FileText, Mail, ExternalLink } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border-hairline shadow-sm flex items-center justify-center text-ink-900 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink-900">About MomHaven</h1>
        <div className="w-10" />
      </div>

      {/* Brand Hero */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-haven-deep to-haven-orchid flex items-center justify-center text-white mx-auto shadow-md">
          <Heart className="w-8 h-8 fill-white/20" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-ink-900">MomHaven</h2>
          <p className="font-body text-xs text-ink-600 mt-0.5">
            Version 2.4.0 · Kenya MCH Edition
          </p>
        </div>
        <p className="font-body text-xs text-ink-700 leading-relaxed max-w-[280px] mx-auto pt-2">
          Empowering mothers across Kenya with dignified, secure, and guideline-aligned digital maternal and child health records.
        </p>
      </div>

      {/* Standards & Alignment */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 p-5 space-y-3">
        <h3 className="font-display font-bold text-sm text-ink-900 uppercase tracking-wider">
          Standards & Guidelines
        </h3>
        <p className="font-body text-xs text-ink-600 leading-relaxed">
          Designed in alignment with the Ministry of Health (MOH) Mother and Child Health (MCH) Handbook (MOH 216), Kenya Expanded Programme on Immunization (KEPI), and the Kenya Data Protection Act 2019.
        </p>
      </div>

      {/* Legal & Links */}
      <div className="bg-white rounded-[20px] border border-border-hairline shadow-card-1 divide-y divide-border-hairline/60">
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-lavender-50/50">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-haven-orchid" />
            <span className="font-display font-bold text-sm text-ink-900">Terms of Service</span>
          </div>
          <ExternalLink className="w-4 h-4 text-ink-600" />
        </div>

        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-lavender-50/50">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-haven-orchid" />
            <span className="font-display font-bold text-sm text-ink-900">Privacy Policy</span>
          </div>
          <ExternalLink className="w-4 h-4 text-ink-600" />
        </div>

        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-lavender-50/50">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-haven-orchid" />
            <span className="font-display font-bold text-sm text-ink-900">Support & Feedback</span>
          </div>
          <ExternalLink className="w-4 h-4 text-ink-600" />
        </div>
      </div>
    </div>
  );
};
