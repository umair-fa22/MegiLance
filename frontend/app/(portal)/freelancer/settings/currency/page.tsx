// @AI-HINT: Multi-Currency Settings page - Manage currency preferences and view exchange rates
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { multiCurrencyApi as _multiCurrencyApi } from '@/lib/api';
import commonStyles from './Currency.common.module.css';
import lightStyles from './Currency.light.module.css';
import darkStyles from './Currency.dark.module.css';

const multiCurrencyApi: any = _multiCurrencyApi;

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_base: boolean;
}

interface UserCurrencySettings {
  primary_currency: string;
  display_currency: string;
  auto_convert: boolean;
  show_original_price: boolean;
}

export default function CurrencySettingsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [settings, setSettings] = useState<UserCurrencySettings>({
    primary_currency: 'USD',
    display_currency: 'USD',
    auto_convert: true,
    show_original_price: true,
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [convertAmount, setConvertAmount] = useState('100');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('EUR');

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currenciesRes, settingsRes] = await Promise.all([
        multiCurrencyApi.getRates().catch(() => null),
        multiCurrencyApi.getSettings().catch(() => null),
      ]);
      
      // Use API data if available
      let currencyData: Currency[] = [];
      
      if (currenciesRes && (currenciesRes.currencies?.length > 0 || Array.isArray(currenciesRes) && currenciesRes.length > 0)) {
        currencyData = currenciesRes.currencies || currenciesRes;
      }

      setCurrencies(currencyData);
      
      if (settingsRes?.settings) {
        setSettings(settingsRes.settings);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load currency data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await multiCurrencyApi.updateSettings(settings);
      // Show success message
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save settings:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  const convertCurrency = (amount: number, fromCode: string, toCode: string) => {
    const fromCurrency = currencies.find(c => c.code === fromCode);
    const toCurrency = currencies.find(c => c.code === toCode);
    
    if (!fromCurrency || !toCurrency) return 0;
    
    // Convert to base (USD) first, then to target
    const inBase = amount / fromCurrency.exchange_rate;
    return inBase * toCurrency.exchange_rate;
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  const formatCurrency = (amount: number, code: string) => {
    const currency = currencies.find(c => c.code === code);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const convertedAmount = convertCurrency(parseFloat(convertAmount) || 0, convertFrom, convertTo);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading currency settings...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Header */}
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Currency Settings</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Configure your currency preferences and view exchange rates
          </p>
        </div>
      </div>

      <div className={commonStyles.content}>
        {/* Settings Panel */}
        <div className={cn(commonStyles.settingsPanel, themeStyles.settingsPanel)}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Preferences</h2>
          
          <div className={commonStyles.formGroup}>
            <label>Primary Currency</label>
            <p className={cn(commonStyles.hint, themeStyles.hint)}>
              Currency you'll receive payments in
            </p>
            <select
              value={settings.primary_currency}
              onChange={(e) => setSettings({ ...settings, primary_currency: e.target.value })}
              className={cn(commonStyles.select, themeStyles.select)}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={commonStyles.formGroup}>
            <label>Display Currency</label>
            <p className={cn(commonStyles.hint, themeStyles.hint)}>
              Currency used for displaying prices
            </p>
            <select
              value={settings.display_currency}
              onChange={(e) => setSettings({ ...settings, display_currency: e.target.value })}
              className={cn(commonStyles.select, themeStyles.select)}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={commonStyles.toggleGroup}>
            <label className={commonStyles.toggle}>
              <input
                type="checkbox"
                checked={settings.auto_convert}
                onChange={(e) => setSettings({ ...settings, auto_convert: e.target.checked })}
              />
              <span className={commonStyles.toggleSlider}></span>
              <div>
                <span className={commonStyles.toggleLabel}>Auto-convert prices</span>
                <span className={cn(commonStyles.toggleHint, themeStyles.toggleHint)}>
                  Automatically convert all prices to your display currency
                </span>
              </div>
            </label>
          </div>

          <div className={commonStyles.toggleGroup}>
            <label className={commonStyles.toggle}>
              <input
                type="checkbox"
                checked={settings.show_original_price}
                onChange={(e) => setSettings({ ...settings, show_original_price: e.target.checked })}
              />
              <span className={commonStyles.toggleSlider}></span>
              <div>
                <span className={commonStyles.toggleLabel}>Show original price</span>
                <span className={cn(commonStyles.toggleHint, themeStyles.toggleHint)}>
                  Display original currency alongside converted price
                </span>
              </div>
            </label>
          </div>

          <button
            className={cn(commonStyles.saveButton, themeStyles.saveButton)}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Converter */}
        <div className={cn(commonStyles.converterPanel, themeStyles.converterPanel)}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Quick Converter</h2>
          
          <div className={commonStyles.converter}>
            <div className={commonStyles.converterInput}>
              <label>From</label>
              <div className={commonStyles.inputWithSelect}>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="Amount"
                />
                <select
                  value={convertFrom}
                  onChange={(e) => setConvertFrom(e.target.value)}
                  className={cn(commonStyles.selectSmall, themeStyles.selectSmall)}
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className={cn(commonStyles.swapButton, themeStyles.swapButton)}
              onClick={() => {
                setConvertFrom(convertTo);
                setConvertTo(convertFrom);
              }}
            >
              ⇄
            </button>

            <div className={commonStyles.converterInput}>
              <label>To</label>
              <div className={commonStyles.inputWithSelect}>
                <input
                  type="text"
                  value={formatCurrency(convertedAmount, convertTo)}
                  className={cn(commonStyles.input, themeStyles.input, commonStyles.inputReadonly)}
                  readOnly
                />
                <select
                  value={convertTo}
                  onChange={(e) => setConvertTo(e.target.value)}
                  className={cn(commonStyles.selectSmall, themeStyles.selectSmall)}
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className={cn(commonStyles.rateInfo, themeStyles.rateInfo)}>
            1 {convertFrom} = {convertCurrency(1, convertFrom, convertTo).toFixed(4)} {convertTo}
          </p>
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className={cn(commonStyles.ratesPanel, themeStyles.ratesPanel)}>
        <div className={commonStyles.ratesHeader}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Exchange Rates</h2>
          <input
            type="text"
            placeholder="Search currencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </div>

        <p className={cn(commonStyles.ratesSubtitle, themeStyles.ratesSubtitle)}>
          Rates are updated hourly. Base currency: USD
        </p>

        <div className={commonStyles.ratesTable}>
          <div className={cn(commonStyles.tableHeader, themeStyles.tableHeader)}>
            <span>Currency</span>
            <span>Rate (vs USD)</span>
            <span className={commonStyles.hideOnMobile}>100 USD =</span>
          </div>
          
          {filteredCurrencies.map((currency) => (
            <div key={currency.code} className={cn(commonStyles.tableRow, themeStyles.tableRow)}>
              <div className={commonStyles.currencyInfo}>
                <span className={commonStyles.currencySymbol}>{currency.symbol}</span>
                <div>
                  <span className={cn(commonStyles.currencyCode, themeStyles.currencyCode)}>
                    {currency.code}
                  </span>
                  <span className={cn(commonStyles.currencyName, themeStyles.currencyName)}>
                    {currency.name}
                  </span>
                </div>
              </div>
              <span className={cn(commonStyles.rate, themeStyles.rate)}>
                {currency.exchange_rate.toFixed(4)}
              </span>
              <span className={cn(commonStyles.converted, themeStyles.converted, commonStyles.hideOnMobile)}>
                {currency.symbol}{(100 * currency.exchange_rate).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
