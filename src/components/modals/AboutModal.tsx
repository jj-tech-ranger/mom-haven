import React from 'react';
import { X, Heart, Sparkles, BookOpen, ShieldCheck, Stethoscope } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface AboutModalProps {
  onClose: () => void;
  onExplore: () => void;
}

export default function AboutModal({ onClose, onExplore }: AboutModalProps) {
  const { t } = usePreferences();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] p-2.5 shadow-2xs flex items-center justify-center shrink-0">
            <img
              src="/assets/logo.png"
              alt="MomHaven Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
              {t('modals.about.title')}
            </h2>
            <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
              {t('modals.about.subtitle')}
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-5 text-left font-body text-xs sm:text-sm">
          {/* Mission */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <Sparkles className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('modals.about.missionTitle')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.about.missionText')}
            </p>
          </div>

          {/* MOH 216 Alignment */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <BookOpen className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('modals.about.mohTitle')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.about.mohText')}
            </p>
          </div>

          {/* Philosophy */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <Heart className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('modals.about.philosophyTitle')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.about.philosophyText')}
            </p>
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
              onExplore();
            }}
            className="px-6 py-2.5 rounded-full bg-[var(--haven-deep)] hover:opacity-90 text-white text-xs font-display font-bold shadow-xs transition-all cursor-pointer"
          >
            {t('common.exploreMomHaven')}
          </button>
        </div>
      </div>
    </div>
  );
}
