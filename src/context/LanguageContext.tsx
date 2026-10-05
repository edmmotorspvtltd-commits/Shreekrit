import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key in override) {
    const b = base[key as keyof T];
    const o = override[key as keyof Partial<T>];
    if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object') {
      result[key as keyof T] = deepMerge(b as object, o as object) as T[keyof T];
    } else if (o !== undefined && o !== '') {
      result[key as keyof T] = o as T[keyof T];
    }
  }
  return result;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('mithila_lang') as Language;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'mai')) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('mithila_lang', lang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Optionally set lang attribute on document element
    document.documentElement.lang = language === 'mai' ? 'mai' : language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const t = language === 'en'
    ? TRANSLATIONS.en
    : deepMerge(TRANSLATIONS.en, TRANSLATIONS[language] as Partial<typeof TRANSLATIONS.en>);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
