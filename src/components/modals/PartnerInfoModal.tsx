import React from 'react';
import { X, Users, Calendar, ShieldCheck, HeartHandshake, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface PartnerInfoModalProps {
  onClose: () => void;
  onStartPartnerFlow: () => void;
}

export default function PartnerInfoModal({ onClose, onStartPartnerFlow }: PartnerInfoModalProps) {
  const { t, language } = usePreferences();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-2xl bg-[var(--surface-1)] rounded-[28px] border border-[var(--border)] p-6 sm:p-8 shadow-2xl animate-fade-in text-[var(--text-primary)] max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2.5 shadow-2xs flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
              {language === 'sw' ? 'Jinsi Ushirikiano wa Mwenzi Unavyofanya Kazi' : 'How Partner Support Works'}
            </h2>
            <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
              {t('partner.heading')}
            </p>
          </div>
        </div>

        {/* 3 Step Explanation */}
        <div className="space-y-4 text-left font-body text-xs sm:text-sm">
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] text-[var(--haven-deep)] font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              1
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                {language === 'sw' ? 'Mama Anatoa Msimbo Salama wa Tarakimu 6' : 'Mother Generates a 6-Character Code'}
              </h3>
              <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">
                {language === 'sw' 
                  ? 'Kutoka kwenye ukurasa wake wa MomHaven, mama anaweza kutengeneza nambari ya siri ya uunganishaji inayodumu kwa muda maalum.'
                  : 'From her profile, a mother generates a time-limited pairing code to share directly with her partner or trusted family member.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] text-[var(--haven-deep)] font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              2
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                {language === 'sw' ? 'Mwenzi Anaingiza Msimbo Kwenye Lango la Wenza' : 'Partner Enters the Code in Partner Access'}
              </h3>
              <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">
                {language === 'sw'
                  ? 'Mwenzi anaingiza jina lake na nambari hiyo ili kuunganisha bila kuhitaji manenosiri au kuingilia akaunti ya mama.'
                  : 'The partner enters their name and the 6-character code to link instantly without needing passwords or compromising account privacy.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] text-[var(--haven-deep)] font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              3
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                {language === 'sw' ? 'Mwenzi Anapata Miongozo na Tarehe za Kliniki' : 'Partner Receives Tailored Tips & Clinic Schedules'}
              </h3>
              <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">
                {language === 'sw'
                  ? 'Mwenzi anaona maendeleo ya kila wiki, vikumbusho vya kliniki, nambari za dharura, na vidokezo vya kusaidia kupunguza uchovu wa mama.'
                  : 'The partner sees weekly milestone guides, ANC visit reminders, hospital packing readiness, and actionable ways to support the mother.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-7 pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-display font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartPartnerFlow();
            }}
            className="px-6 py-2.5 rounded-full bg-[var(--haven-deep)] hover:opacity-90 text-white text-xs font-display font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{t('partner.cta')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
