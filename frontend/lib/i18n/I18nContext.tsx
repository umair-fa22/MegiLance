// @AI-HINT: Custom i18n Context since next-intl is heavy and we just want simple client-side switching.
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import ar from '@/locales/ar.json';

type Locale = 'en' | 'es' | 'ar';
type Dictionary = Record<string, any>;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  es,
  ar,
};

interface I18nContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('megilance-locale') as Locale;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
    } else {
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (dictionaries[browserLang]) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('megilance-locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (keypath: string, variables?: Record<string, string>): string => {
    const keys = keypath.split('.');
    let value: any = dictionaries[locale];
    
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    if (typeof value !== 'string') {
      // Fallback to English if key missing in target language
      let fallbackValue: any = dictionaries['en'];
      for (const k of keys) {
        if (fallbackValue === undefined) break;
        fallbackValue = fallbackValue[k];
      }
      value = typeof fallbackValue === 'string' ? fallbackValue : keypath;
    }
    
    if (variables && typeof value === 'string') {
      return Object.entries(variables).reduce(
        (acc, [key, val]) => acc.replace(new RegExp(`{${key}}`, 'g'), val),
        value
      );
    }
    
    return value as string;
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      <div dir={dir}>{children}</div>
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
