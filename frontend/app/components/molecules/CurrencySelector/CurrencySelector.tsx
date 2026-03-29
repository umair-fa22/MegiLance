// @AI-HINT: Multi-currency selector with real-time exchange rates and crypto support
"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './CurrencySelector.common.module.css';
import lightStyles from './CurrencySelector.light.module.css';
import darkStyles from './CurrencySelector.dark.module.css';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  type: 'fiat' | 'crypto';
  flag?: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  amount?: number;
  targetCurrency?: string;
  showConversion?: boolean;
  showCryptoToggle?: boolean;
  className?: string;
}

export default function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  amount = 0,
  targetCurrency = 'USD',
  showConversion = true,
  showCryptoToggle = true,
  className = ''
}: CurrencySelectorProps) {
  const { resolvedTheme } = useTheme();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [cryptoCurrencies, setCryptoCurrencies] = useState<Currency[]>([]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [showCrypto, setShowCrypto] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  // Theme guard
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Fetch available currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/multicurrency/currencies');
        if (response.ok) {
          const data = await response.json();
          setCurrencies(data.fiat || []);
          setCryptoCurrencies(data.crypto || []);
        }
      } catch {
        // Failed to fetch currencies, will use defaults or empty list
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Fetch exchange rate when currencies change
  useEffect(() => {
    if (!selectedCurrency || !targetCurrency || selectedCurrency === targetCurrency) {
      setExchangeRate(null);
      setConvertedAmount(amount);
      return;
    }

    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          `/api/multicurrency/exchange-rate/${selectedCurrency}/${targetCurrency}`
        );
        if (response.ok) {
          const data = await response.json();
          setExchangeRate(data);
          setConvertedAmount(amount * data.rate);
        }
      } catch {
        // Failed to fetch exchange rate, will show cached rate or none
      }
    };

    fetchExchangeRate();
  }, [selectedCurrency, targetCurrency, amount]);

  const currentCurrencies = showCrypto ? cryptoCurrencies : currencies;
  const filteredCurrencies = currentCurrencies.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCurrencyData = currentCurrencies.find((c) => c.code === selectedCurrency);

  const handleCurrencySelect = (code: string) => {
    onCurrencyChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      {/* Currency Type Toggle */}
      {showCryptoToggle && (
        <div className={cn(commonStyles.toggleContainer, themeStyles.toggleContainer)}>
          <button
            type="button"
            onClick={() => setShowCrypto(false)}
            className={cn(
              commonStyles.toggleButton,
              themeStyles.toggleButton,
              !showCrypto && commonStyles.toggleButtonActive,
              !showCrypto && themeStyles.toggleButtonActive
            )}
          >
            💵 Fiat ({currencies.length})
          </button>
          <button
            type="button"
            onClick={() => setShowCrypto(true)}
            className={cn(
              commonStyles.toggleButton,
              themeStyles.toggleButton,
              showCrypto && commonStyles.toggleButtonActive,
              showCrypto && themeStyles.toggleButtonActive
            )}
          >
            ₿ Crypto ({cryptoCurrencies.length})
          </button>
        </div>
      )}

      {/* Currency Selector */}
      <div className={cn(commonStyles.selectorContainer, themeStyles.selectorContainer)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(commonStyles.selectorButton, themeStyles.selectorButton)}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={commonStyles.spinner}>⏳</span>
          ) : selectedCurrencyData ? (
            <>
              {selectedCurrencyData.flag && (
                <span className={commonStyles.flag}>{selectedCurrencyData.flag}</span>
              )}
              <span className={commonStyles.currencyCode}>{selectedCurrencyData.code}</span>
              <span className={commonStyles.currencyName}>{selectedCurrencyData.name}</span>
              <span className={commonStyles.currencySymbol}>{selectedCurrencyData.symbol}</span>
            </>
          ) : (
            <span>Select Currency</span>
          )}
          <svg
            className={cn(commonStyles.chevron, isOpen && commonStyles.chevronOpen)}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className={cn(commonStyles.dropdown, themeStyles.dropdown)}>
            {/* Search */}
            <div className={cn(commonStyles.searchContainer, themeStyles.searchContainer)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder={`Search ${showCrypto ? 'cryptocurrencies' : 'currencies'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                autoFocus
              />
            </div>

            {/* Currency List */}
            <div className={cn(commonStyles.currencyList, themeStyles.currencyList)}>
              {filteredCurrencies.length === 0 ? (
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  No currencies found
                </div>
              ) : (
                filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => handleCurrencySelect(currency.code)}
                    className={cn(
                      commonStyles.currencyItem,
                      themeStyles.currencyItem,
                      selectedCurrency === currency.code && commonStyles.currencyItemActive,
                      selectedCurrency === currency.code && themeStyles.currencyItemActive
                    )}
                  >
                    {currency.flag && <span className={commonStyles.flag}>{currency.flag}</span>}
                    <div className={commonStyles.currencyInfo}>
                      <span className={commonStyles.currencyCode}>{currency.code}</span>
                      <span className={commonStyles.currencyName}>{currency.name}</span>
                    </div>
                    <span className={commonStyles.currencySymbol}>{currency.symbol}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conversion Display */}
      {showConversion && exchangeRate && amount > 0 && (
        <div className={cn(commonStyles.conversionContainer, themeStyles.conversionContainer)}>
          <div className={cn(commonStyles.conversionRow, themeStyles.conversionRow)}>
            <span className={commonStyles.conversionLabel}>Exchange Rate:</span>
            <span className={commonStyles.conversionValue}>
              1 {selectedCurrency} = {exchangeRate.rate.toFixed(6)} {targetCurrency}
            </span>
          </div>
          <div className={cn(commonStyles.conversionRow, themeStyles.conversionRow)}>
            <span className={commonStyles.conversionLabel}>Converted Amount:</span>
            <span className={commonStyles.conversionValue}>
              {selectedCurrencyData?.symbol}
              {amount.toFixed(2)} = {convertedAmount.toFixed(2)} {targetCurrency}
            </span>
          </div>
          <div className={cn(commonStyles.conversionTimestamp, themeStyles.conversionTimestamp)}>
            Updated: {new Date(exchangeRate.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
