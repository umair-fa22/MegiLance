// @AI-HINT: Language switcher component using the custom I18nContext
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nContext';
import { cn } from '@/lib/utils';

import commonStyles from './LanguageSwitcher.common.module.css';
import lightStyles from './LanguageSwitcher.light.module.css';
import darkStyles from './LanguageSwitcher.dark.module.css';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪' },
];

export default function LanguageSwitcher() {
  const { resolvedTheme } = useTheme();
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    setLocale(code as any);
    setIsOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  if (!resolvedTheme) return null;

  return (
    <div className={commonStyles.container} ref={dropdownRef}>
      <button 
        type="button"
        className={cn(commonStyles.button, themeStyles.button)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        <Globe size={18} />
        <span className="hidden sm:inline-block">{currentLang.label}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(commonStyles.dropdown, themeStyles.dropdown)}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={cn(
                commonStyles.option,
                themeStyles.option,
                locale === lang.code && themeStyles.optionActive
              )}
              onClick={() => handleSelect(lang.code)}
            >
              <span>
                <span className="mr-2" aria-hidden="true">{lang.flag}</span>
                {lang.label}
              </span>
              {locale === lang.code && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
