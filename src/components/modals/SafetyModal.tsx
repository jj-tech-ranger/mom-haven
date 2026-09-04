import React from 'react';
import { X, AlertTriangle, AlertCircle, PhoneCall, ShieldAlert, HeartHandshake } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface SafetyModalProps {
  onClose: () => void;
}

export default function SafetyModal({ onClose }: SafetyModalProps) {
  const { t } = usePreferences();

  const dangerSigns: string[] = [
    t('modals.safety.dangerSignsList.0'),
    t('modals.safety.dangerSignsList.1'),
    t('modals.safety.dangerSignsList.2'),
    t('modals.safety.dangerSignsList.3'),
    t('modals.safety.dangerSignsList.4'),
  ];

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
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2.5 shadow-2xs flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
              {t('modals.safety.title')}
            </h2>
            <p className="font-body text-xs text-[var(--text-secondary)] mt-0.5">
              {t('modals.safety.subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-left font-body text-xs sm:text-sm">
          {/* Disclaimer */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--haven-deep)]">
              <HeartHandshake className="w-4 h-4 text-[var(--haven-orchid)]" />
              <span>{t('modals.safety.disclaimerTitle')}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {t('modals.safety.disclaimerText')}
            </p>
          </div>

          {/* Danger Signs */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{t('modals.safety.dangerSignsTitle')}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-rose-900 dark:text-rose-100">
              {dangerSigns.map((sign, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold shrink-0">•</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-rose-500/20 text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{t('modals.safety.emergencyAction')}</span>
            </div>
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
