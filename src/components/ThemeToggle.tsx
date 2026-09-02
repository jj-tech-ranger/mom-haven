import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, language } = usePreferences();
  const isDark = theme === 'dark';

  const label = isDark
    ? language === 'sw' ? 'Badili kwenda mandhari ya mchana (Nuru)' : 'Switch to light mode'
    : language === 'sw' ? 'Badili kwenda mandhari ya giza' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-[var(--haven-orchid)] ${
        isDark
          ? 'bg-[var(--surface-2)] text-amber-300 border-[var(--border)] hover:bg-[var(--surface-3)] hover:text-amber-200'
          : 'bg-[var(--surface-1)] text-[var(--ink-600)] border-[var(--border)] hover:text-[var(--haven-deep)] hover:bg-[var(--lavender-100)] shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};
