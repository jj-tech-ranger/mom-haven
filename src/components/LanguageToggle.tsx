import React from 'react';
import { usePreferences } from '../context/PreferencesContext';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = usePreferences();

  return (
    <div
      role="group"
      aria-label="Language selector / Kiteuzi cha lugha"
      className={`inline-flex items-center p-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] shadow-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        aria-label="English language"
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[var(--haven-orchid)] ${
          language === 'en'
            ? 'bg-[var(--haven-deep)] text-white shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
        }`}
      >
        EN
      </button>

      <span className="text-[var(--text-muted)] text-xs font-medium px-0.5 select-none" aria-hidden="true">
        |
      </span>

      <button
        type="button"
        onClick={() => setLanguage('sw')}
        aria-pressed={language === 'sw'}
        aria-label="Lugha ya Kiswahili"
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[var(--haven-orchid)] ${
          language === 'sw'
            ? 'bg-[var(--haven-deep)] text-white shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
        }`}
      >
        SW
      </button>
    </div>
  );
};
