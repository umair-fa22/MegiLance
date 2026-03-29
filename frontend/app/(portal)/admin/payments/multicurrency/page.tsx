// @AI-HINT: Multi-Currency Payments Management Page
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './MultiCurrency.common.module.css';
import lightStyles from './MultiCurrency.light.module.css';
import darkStyles from './MultiCurrency.dark.module.css';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', enabled: true },
  { code: 'EUR', name: 'Euro', symbol: '€', enabled: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', enabled: true },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', enabled: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', enabled: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', enabled: false },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', enabled: false },
];

const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278.5,
  INR: 83.2,
  CAD: 1.35,
  AUD: 1.52,
};

export default function MultiCurrencyPage() {
  const { resolvedTheme } = useTheme();
  const [currencies, setCurrencies] = useState(SUPPORTED_CURRENCIES);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const toggleCurrency = (code: string) => {
    setCurrencies(prev =>
      prev.map(c => c.code === code ? { ...c, enabled: !c.enabled } : c)
    );
  };

  return (
    <PageTransition>
      <div className={commonStyles.pageContainer}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <h1 className={commonStyles.title}>
              Multi-Currency Management
            </h1>
            <p className={commonStyles.subtitle}>
              Configure supported currencies and exchange rates for the platform
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <h2 className={commonStyles.cardTitle}>
              Base Currency
            </h2>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className={cn(commonStyles.select, themeStyles.select)}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className={commonStyles.selectHint}>
              All amounts will be converted from this base currency
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <h2 className={commonStyles.cardTitle}>
              Supported Currencies
            </h2>
            <div className={commonStyles.currencyList}>
              {currencies.map(currency => (
                <div
                  key={currency.code}
                  className={cn(commonStyles.currencyRow, themeStyles.currencyRow)}
                >
                  <div>
                    <div className={commonStyles.currencyName}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </div>
                    <div className={commonStyles.currencyRate}>
                      1 {baseCurrency} = {(EXCHANGE_RATES[currency.code as keyof typeof EXCHANGE_RATES] / EXCHANGE_RATES[baseCurrency as keyof typeof EXCHANGE_RATES]).toFixed(4)} {currency.code}
                    </div>
                  </div>
                  <div className={commonStyles.currencyActions}>
                    <span className={cn(
                      commonStyles.badge,
                      currency.enabled ? themeStyles.badgeEnabled : themeStyles.badgeDisabled
                    )}>
                      {currency.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Button
                      variant={currency.enabled ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => toggleCurrency(currency.code)}
                    >
                      {currency.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <h2 className={commonStyles.cardTitle}>
              Exchange Rate Settings
            </h2>
            <p className={commonStyles.rateDescription}>
              Exchange rates are updated automatically from market data. Manual overrides can be configured below.
            </p>
            <div className={commonStyles.rateActions}>
              <Button variant="outline">Configure Rate Provider</Button>
              <Button variant="outline">Manual Rate Override</Button>
              <Button variant="primary">Update Rates Now</Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}
