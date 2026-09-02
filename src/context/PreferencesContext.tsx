import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from '../i18n/en';
import { sw } from '../i18n/sw';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'sw';

interface PreferencesContextValue {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (keyPath: string, fallback?: string) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'momhaven-theme';
const LANGUAGE_STORAGE_KEY = 'momhaven-language';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
    return 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'sw') {
        return stored;
      }
    } catch {
      // Ignore localStorage read errors
    }
    return 'en';
  });

  // Apply theme to <html> data-theme attribute and persist
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage write errors
    }
  }, [theme]);

  // Apply language to <html> lang attribute and persist
  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore localStorage write errors
    }
  }, [language]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'sw' : 'en'));
  };

  // Translation lookup helper (e.g. t("hero.title") or t("auth.signIn"))
  const t = (keyPath: string, fallback?: string): string => {
    const dict = language === 'sw' ? sw : en;
    const parts = keyPath.split('.');
    let curr: any = dict;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && part in curr) {
        curr = curr[part];
      } else {
        // Fallback to English dictionary before defaulting to fallback/keyPath
        let enCurr: any = en;
        for (const enPart of parts) {
          if (enCurr && typeof enCurr === 'object' && enPart in enCurr) {
            enCurr = enCurr[enPart];
          } else {
            enCurr = undefined;
            break;
          }
        }
        return (typeof enCurr === 'string' ? enCurr : fallback || keyPath);
      }
    }
    return typeof curr === 'string' ? curr : (fallback || keyPath);
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        language,
        setTheme,
        toggleTheme,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
