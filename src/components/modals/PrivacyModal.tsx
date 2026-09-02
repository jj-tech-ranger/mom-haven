import React from 'react';
import { X, ShieldCheck, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface PrivacyModalProps {
  onClose: () => void;
}

export default function PrivacyModal({ onClose }: PrivacyModalProps) {
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 shadow-2xs flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
              {t('modals.privacy.title')}
            </h2>
            <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
              {t('modals.privacy.subtitle')}
            </p>
          </div>
        </div>

        {/* Privacy Commitments */}
        <div className="space-y-4 text-left font-body text-xs sm:text-sm">
          {/* Item 1: Ownership */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('modals.privacy.item1Title')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.privacy.item1Text')}
            </p>
          </div>

          {/* Item 2: Granular Consent */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <KeyRound className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('modals.privacy.item2Title')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.privacy.item2Text')}
            </p>
          </div>

          {/* Item 3: Encryption */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{t('modals.privacy.item3Title')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.privacy.item3Text')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 pt-4 border-t border-[var(--border)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[var(--haven-deep)] hover:opacity-90 text-white text-xs font-display font-bold shadow-xs transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
