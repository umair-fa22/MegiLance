// @AI-HINT: Standalone Invoice Generator — multi-step wizard for creating professional invoices
'use client';

import React, { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronLeft, ChevronRight, Check, Loader2,
  User, Building, Mail, Phone, MapPin, Plus, X, Trash2,
  DollarSign, Percent, Clock, Copy, RotateCcw, Info,
  Sparkles, AlertTriangle, Receipt, CreditCard, Hash,
  Calendar, Download, Palette, Shield
} from 'lucide-react';

import commonStyles from './InvoiceGenerator.common.module.css';
import lightStyles from './InvoiceGenerator.light.module.css';
import darkStyles from './InvoiceGenerator.dark.module.css';

/* ============================================================================
   Types
   ============================================================================ */

interface CurrencyOption { key: string; symbol: string; name: string; }
interface TaxOption { key: string; label: string; rate: number; type: string; }
interface TemplateOption { key: string; label: string; description: string; accent_color: string; }
interface PaymentTermOption { key: string; label: string; days: number; }

interface OptionsData {
  currencies: CurrencyOption[];
  tax_rates: TaxOption[];
  templates: TemplateOption[];
  payment_terms: PaymentTermOption[];
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

interface InvoiceResult {
  invoice: { number: string; issue_date: string; due_date: string; payment_terms: string; status: string };
  sender: { name: string; email: string; address: string; phone: string };
  recipient: { name: string; email: string; address: string };
  items: { index: number; description: string; quantity: number; unit: string; rate: number; total: number }[];
  calculations: {
    subtotal: number;
    discount: { type: string; value: number; amount: number; label: string };
    taxable_amount: number;
    tax: { preset: string; rate: number; amount: number; label: string; type: string };
    grand_total: number;
    amount_in_words: string;
  };
  currency: { code: string; symbol: string; name: string; decimal_places: number; position: string };
  template: { key: string; label: string; accent_color: string };
  notes: string;
  summary: { item_count: number; total_hours: number | null; avg_item_value: number; effective_tax_rate: number; discount_savings: number };
  meta: { generated_at: string };
}

/* ============================================================================
   Constants
   ============================================================================ */

const STEP_LABELS = ['Sender', 'Recipient', 'Items', 'Settings', 'Preview'];

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  professional: Building,
  minimal: FileText,
  creative: Palette,
  classic: Shield,
  freelancer: User,
};

/* ============================================================================
   Component
   ============================================================================ */

export default function InvoiceGenerator() {
  const { resolvedTheme } = useTheme();
  const t = resolvedTheme === 'light' ? lightStyles : darkStyles;

  /* ----- State ----- */
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sender
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderTaxId, setSenderTaxId] = useState('');

  // Recipient
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, unit: 'unit' },
  ]);

  // Settings
  const [currency, setCurrency] = useState('USD');
  const [taxRegion, setTaxRegion] = useState('none');
  const [customTaxRate, setCustomTaxRate] = useState<number | ''>('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState<number | ''>(0);
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [template, setTemplate] = useState('professional');
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Processing
  const [processingStep, setProcessingStep] = useState(0);

  /* ----- Load options ----- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/invoice-generator/options');
        if (!res.ok) throw new Error('Failed to fetch options');
        const data: OptionsData = await res.json();
        if (!cancelled) setOptions(data);
      } catch {
        if (!cancelled) setError('Could not load invoice options. Is the backend running?');
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ----- Handlers ----- */
  const addItem = useCallback(() => {
    if (items.length >= 50) return;
    setItems(prev => [...prev, {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unit_price: 0,
      unit: 'unit',
    }]);
  }, [items.length]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  }, []);

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, []);

  const itemsSubtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
  const hasValidItems = items.some(i => i.description.trim() && i.unit_price > 0);

  /* ----- Submit ----- */
  const submitInvoice = useCallback(async () => {
    setStep(4);
    setLoadingGenerate(true);
    setProcessingStep(0);
    setResult(null);
    setError(null);

    const timers = [
      setTimeout(() => setProcessingStep(1), 500),
      setTimeout(() => setProcessingStep(2), 1200),
      setTimeout(() => setProcessingStep(3), 1800),
    ];

    try {
      const body = {
        sender_name: senderName,
        sender_email: senderEmail,
        sender_address: senderAddress,
        sender_phone: senderPhone,
        sender_tax_id: senderTaxId,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_address: recipientAddress,
        items: items.filter(i => i.description.trim()).map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit: i.unit,
        })),
        currency,
        tax_region: taxRegion,
        custom_tax_rate: taxRegion === 'custom' ? (customTaxRate || 0) : undefined,
        discount_type: discountType,
        discount_value: discountValue || 0,
        payment_terms: paymentTerms,
        template,
        notes,
        issue_date: issueDate,
        custom_invoice_number: invoiceNumber,
      };

      const res = await fetch('/api/invoice-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Invoice generation failed');
      }

      const data: InvoiceResult = await res.json();
      await new Promise(r => setTimeout(r, 600));
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invoice generation failed');
    } finally {
      timers.forEach(clearTimeout);
      setLoadingGenerate(false);
    }
  }, [senderName, senderEmail, senderAddress, senderPhone, senderTaxId,
      recipientName, recipientEmail, recipientAddress, items, currency,
      taxRegion, customTaxRate, discountType, discountValue, paymentTerms,
      template, notes, issueDate, invoiceNumber]);

  /* ----- Reset ----- */
  const resetAll = useCallback(() => {
    setStep(0);
    setSenderName(''); setSenderEmail(''); setSenderAddress(''); setSenderPhone(''); setSenderTaxId('');
    setRecipientName(''); setRecipientEmail(''); setRecipientAddress('');
    setItems([{ id: '1', description: '', quantity: 1, unit_price: 0, unit: 'unit' }]);
    setCurrency('USD'); setTaxRegion('none'); setCustomTaxRate('');
    setDiscountType('none'); setDiscountValue(0); setPaymentTerms('net_30');
    setTemplate('professional'); setNotes(''); setIssueDate(''); setInvoiceNumber('');
    setResult(null); setError(null);
  }, []);

  const copyInvoice = useCallback(() => {
    if (!result) return;
    const c = result.calculations;
    const sym = result.currency.symbol;
    const text = [
      `Invoice ${result.invoice.number}`,
      `Date: ${result.invoice.issue_date} | Due: ${result.invoice.due_date}`,
      `From: ${result.sender.name}`,
      `To: ${result.recipient.name}`,
      '',
      'Items:',
      ...result.items.map(i => `  ${i.description}: ${sym}${fmt(i.total)}`),
      '',
      `Subtotal: ${sym}${fmt(c.subtotal)}`,
      c.discount.amount > 0 ? `Discount: -${sym}${fmt(c.discount.amount)}` : '',
      c.tax.amount > 0 ? `Tax (${c.tax.label}): ${sym}${fmt(c.tax.amount)}` : '',
      `Total: ${sym}${fmt(c.grand_total)}`,
      `Amount in words: ${c.amount_in_words}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
  }, [result]);

  /* ----- Guard ----- */

  if (loadingOptions) {
    return (
      <div className={cn(commonStyles.container, t.container)}>
        <div className={commonStyles.loadingContainer}>
          <Loader2 className={commonStyles.loadingIcon} />
          <span>Loading invoice generator…</span>
        </div>
      </div>
    );
  }

  if (error && !result && step !== 4) {
    return (
      <div className={cn(commonStyles.container, t.container)}>
        <div className={commonStyles.loadingContainer}>
          <AlertTriangle size={32} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  /* ----- Render ----- */
  return (
    <div className={cn(commonStyles.container, t.container)}>
      <div className={commonStyles.innerContainer}>
        {/* Header */}
        <header className={commonStyles.header}>
          <span className={cn(commonStyles.headerBadge, t.headerBadge)}>
            <FileText /> Professional Invoice Builder
          </span>
          <h1 className={cn(commonStyles.title, t.title)}>
            Invoice <span className={commonStyles.titleAccent}>Generator</span>
          </h1>
          <p className={cn(commonStyles.subtitle, t.subtitle)}>
            Create professional invoices instantly — multi-currency, tax-aware, with 5 beautiful templates and 30+ currencies.
          </p>
        </header>

        {/* Stepper */}
        <div className={commonStyles.stepper}>
          {STEP_LABELS.map((label, i) => (
            <div className={commonStyles.stepItem} key={label}>
              {i > 0 && (
                <div className={cn(commonStyles.stepLine, i <= step ? t.stepLineActive : t.stepLine)} />
              )}
              <div
                className={cn(
                  commonStyles.stepDot,
                  i < step ? t.stepDotCompleted : i === step ? t.stepDotActive : t.stepDot
                )}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className={cn(commonStyles.stepLabel, i === step ? t.stepLabelActive : t.stepLabel)}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className={commonStyles.stepContent}
          >
            {step === 0 && (
              <StepSender
                senderName={senderName} setSenderName={setSenderName}
                senderEmail={senderEmail} setSenderEmail={setSenderEmail}
                senderAddress={senderAddress} setSenderAddress={setSenderAddress}
                senderPhone={senderPhone} setSenderPhone={setSenderPhone}
                senderTaxId={senderTaxId} setSenderTaxId={setSenderTaxId}
                cs={commonStyles} ts={t}
              />
            )}
            {step === 1 && (
              <StepRecipient
                recipientName={recipientName} setRecipientName={setRecipientName}
                recipientEmail={recipientEmail} setRecipientEmail={setRecipientEmail}
                recipientAddress={recipientAddress} setRecipientAddress={setRecipientAddress}
                cs={commonStyles} ts={t}
              />
            )}
            {step === 2 && (
              <StepItems
                items={items}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
                subtotal={itemsSubtotal}
                currencySymbol={options?.currencies.find(c => c.key === currency)?.symbol || '$'}
                cs={commonStyles} ts={t}
              />
            )}
            {step === 3 && options && (
              <StepSettings
                options={options}
                currency={currency} setCurrency={setCurrency}
                taxRegion={taxRegion} setTaxRegion={setTaxRegion}
                customTaxRate={customTaxRate} setCustomTaxRate={setCustomTaxRate}
                discountType={discountType} setDiscountType={setDiscountType}
                discountValue={discountValue} setDiscountValue={setDiscountValue}
                paymentTerms={paymentTerms} setPaymentTerms={setPaymentTerms}
                template={template} setTemplate={setTemplate}
                notes={notes} setNotes={setNotes}
                issueDate={issueDate} setIssueDate={setIssueDate}
                invoiceNumber={invoiceNumber} setInvoiceNumber={setInvoiceNumber}
                cs={commonStyles} ts={t}
              />
            )}
            {step === 4 && (
              loadingGenerate || !result ? (
                <ProcessingView step={processingStep} error={error} cs={commonStyles} ts={t} />
              ) : (
                <ResultsDashboard
                  result={result}
                  onReset={resetAll}
                  onCopy={copyInvoice}
                  cs={commonStyles} ts={t}
                />
              )
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 4 && (
          <div className={commonStyles.navigation}>
            <button
              className={cn(commonStyles.navButton, t.navButtonBack)}
              disabled={step === 0}
              onClick={() => setStep(s => s - 1)}
            >
              <ChevronLeft size={18} /> Back
            </button>
            <button
              className={cn(commonStyles.navButton, t.navButtonNext)}
              disabled={step === 2 && !hasValidItems}
              onClick={() => {
                if (step === 3) submitInvoice();
                else setStep(s => s + 1);
              }}
            >
              {step === 3 ? 'Generate Invoice' : 'Continue'} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className={cn(commonStyles.disclaimer, t.disclaimer)}>
          <Info size={14} />
          <span>
            Invoices are generated locally for reference. Review all details before sending to clients.
            This tool does not store your data.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Step 0: Sender Info
   ============================================================================ */

interface StepSenderProps {
  senderName: string; setSenderName: (v: string) => void;
  senderEmail: string; setSenderEmail: (v: string) => void;
  senderAddress: string; setSenderAddress: (v: string) => void;
  senderPhone: string; setSenderPhone: (v: string) => void;
  senderTaxId: string; setSenderTaxId: (v: string) => void;
  cs: typeof commonStyles; ts: typeof lightStyles;
}

function StepSender({ senderName, setSenderName, senderEmail, setSenderEmail, senderAddress, setSenderAddress, senderPhone, setSenderPhone, senderTaxId, setSenderTaxId, cs, ts }: StepSenderProps) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h2 className={cn(cs.formTitle, ts.formTitle)}>
        <User size={20} /> Your Details
      </h2>
      <div className={cs.formGrid}>
        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><User size={16} /> Full Name / Business Name</label>
            <input className={cn(cs.textInput, ts.textInput)} placeholder="John Doe or Acme Inc." value={senderName} onChange={e => setSenderName(e.target.value)} />
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Mail size={16} /> Email</label>
            <input className={cn(cs.textInput, ts.textInput)} type="email" placeholder="you@example.com" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} />
          </div>
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}><MapPin size={16} /> Address</label>
          <textarea className={cn(cs.textarea, ts.textarea)} placeholder="123 Main St, City, Country" value={senderAddress} onChange={e => setSenderAddress(e.target.value)} rows={2} />
        </div>
        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Phone size={16} /> Phone <span className={cn(cs.labelHint, ts.labelHint)}>Optional</span></label>
            <input className={cn(cs.textInput, ts.textInput)} placeholder="+1 555 123 4567" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} />
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Hash size={16} /> Tax ID <span className={cn(cs.labelHint, ts.labelHint)}>Optional</span></label>
            <input className={cn(cs.textInput, ts.textInput)} placeholder="EIN / VAT number" value={senderTaxId} onChange={e => setSenderTaxId(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Step 1: Recipient Info
   ============================================================================ */

interface StepRecipientProps {
  recipientName: string; setRecipientName: (v: string) => void;
  recipientEmail: string; setRecipientEmail: (v: string) => void;
  recipientAddress: string; setRecipientAddress: (v: string) => void;
  cs: typeof commonStyles; ts: typeof lightStyles;
}

function StepRecipient({ recipientName, setRecipientName, recipientEmail, setRecipientEmail, recipientAddress, setRecipientAddress, cs, ts }: StepRecipientProps) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h2 className={cn(cs.formTitle, ts.formTitle)}>
        <Building size={20} /> Client Details
      </h2>
      <div className={cs.formGrid}>
        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><User size={16} /> Client Name / Company</label>
            <input className={cn(cs.textInput, ts.textInput)} placeholder="Client name or company" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Mail size={16} /> Client Email</label>
            <input className={cn(cs.textInput, ts.textInput)} type="email" placeholder="client@example.com" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
          </div>
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}><MapPin size={16} /> Client Address <span className={cn(cs.labelHint, ts.labelHint)}>Optional</span></label>
          <textarea className={cn(cs.textarea, ts.textarea)} placeholder="Client's billing address" value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} rows={2} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Step 2: Line Items
   ============================================================================ */

interface StepItemsProps {
  items: LineItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof LineItem, value: string | number) => void;
  subtotal: number;
  currencySymbol: string;
  cs: typeof commonStyles; ts: typeof lightStyles;
}

function StepItems({ items, onAddItem, onRemoveItem, onUpdateItem, subtotal, currencySymbol, cs, ts }: StepItemsProps) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h2 className={cn(cs.formTitle, ts.formTitle)}>
        <Receipt size={20} /> Line Items
      </h2>
      <div className={cs.itemsList}>
        {items.map((item, idx) => (
          <div key={item.id} className={cn(cs.itemRow, ts.itemRow)}>
            <div className={cn(cs.itemIndex, ts.itemIndex)}>{idx + 1}</div>
            <div className={cs.itemFields}>
              <input
                className={cn(cs.textInput, ts.textInput, cs.itemDesc)}
                placeholder="Description (e.g., Website Design)"
                value={item.description}
                onChange={e => onUpdateItem(item.id, 'description', e.target.value)}
              />
              <div className={cs.itemNumbers}>
                <div className={cs.itemField}>
                  <label className={cn(cs.itemFieldLabel, ts.itemFieldLabel)}>Qty</label>
                  <input
                    type="number" min={0.01} step="any"
                    className={cn(cs.numberInput, ts.numberInput)}
                    value={item.quantity}
                    onChange={e => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={cs.itemField}>
                  <label className={cn(cs.itemFieldLabel, ts.itemFieldLabel)}>Unit</label>
                  <select
                    className={cn(cs.select, ts.select)}
                    value={item.unit}
                    onChange={e => onUpdateItem(item.id, 'unit', e.target.value)}
                  >
                    <option value="unit">Unit</option>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="project">Project</option>
                    <option value="page">Page</option>
                    <option value="word">Word</option>
                  </select>
                </div>
                <div className={cs.itemField}>
                  <label className={cn(cs.itemFieldLabel, ts.itemFieldLabel)}>Rate ({currencySymbol})</label>
                  <input
                    type="number" min={0} step="any"
                    className={cn(cs.numberInput, ts.numberInput)}
                    value={item.unit_price || ''}
                    onChange={e => onUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className={cs.itemField}>
                  <label className={cn(cs.itemFieldLabel, ts.itemFieldLabel)}>Total</label>
                  <div className={cn(cs.itemTotal, ts.itemTotal)}>
                    {currencySymbol}{fmt(item.quantity * item.unit_price)}
                  </div>
                </div>
              </div>
            </div>
            {items.length > 1 && (
              <button className={cn(cs.itemRemove, ts.itemRemove)} onClick={() => onRemoveItem(item.id)} aria-label="Remove item">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className={cs.itemActions}>
        <button className={cn(cs.addItemBtn, ts.addItemBtn)} onClick={onAddItem}>
          <Plus size={16} /> Add Item
        </button>
        <div className={cn(cs.subtotalDisplay, ts.subtotalDisplay)}>
          Subtotal: <strong>{currencySymbol}{fmt(subtotal)}</strong>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Step 3: Settings
   ============================================================================ */

interface StepSettingsProps {
  options: OptionsData;
  currency: string; setCurrency: (v: string) => void;
  taxRegion: string; setTaxRegion: (v: string) => void;
  customTaxRate: number | ''; setCustomTaxRate: (v: number | '') => void;
  discountType: string; setDiscountType: (v: string) => void;
  discountValue: number | ''; setDiscountValue: (v: number | '') => void;
  paymentTerms: string; setPaymentTerms: (v: string) => void;
  template: string; setTemplate: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  issueDate: string; setIssueDate: (v: string) => void;
  invoiceNumber: string; setInvoiceNumber: (v: string) => void;
  cs: typeof commonStyles; ts: typeof lightStyles;
}

function StepSettings({ options, currency, setCurrency, taxRegion, setTaxRegion, customTaxRate, setCustomTaxRate, discountType, setDiscountType, discountValue, setDiscountValue, paymentTerms, setPaymentTerms, template, setTemplate, notes, setNotes, issueDate, setIssueDate, invoiceNumber, setInvoiceNumber, cs, ts }: StepSettingsProps) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h2 className={cn(cs.formTitle, ts.formTitle)}>
        <CreditCard size={20} /> Invoice Settings
      </h2>
      <div className={cs.formGrid}>
        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><DollarSign size={16} /> Currency</label>
            <select className={cn(cs.select, ts.select)} value={currency} onChange={e => setCurrency(e.target.value)}>
              {options.currencies.map(c => (
                <option key={c.key} value={c.key}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Clock size={16} /> Payment Terms</label>
            <select className={cn(cs.select, ts.select)} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
              {options.payment_terms.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Percent size={16} /> Tax Region</label>
            <select className={cn(cs.select, ts.select)} value={taxRegion} onChange={e => setTaxRegion(e.target.value)}>
              {options.tax_rates.map(t => (
                <option key={t.key} value={t.key}>{t.label} {t.rate > 0 ? `(${t.rate}%)` : ''}</option>
              ))}
            </select>
          </div>
          {taxRegion === 'custom' && (
            <div className={cs.formGroup}>
              <label className={cn(cs.label, ts.label)}>Custom Tax Rate (%)</label>
              <input type="number" className={cn(cs.numberInput, ts.numberInput)} min={0} max={100} step="0.1"
                value={customTaxRate} onChange={e => setCustomTaxRate(e.target.value ? parseFloat(e.target.value) : '')} placeholder="0.0" />
            </div>
          )}
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Percent size={16} /> Discount</label>
            <select className={cn(cs.select, ts.select)} value={discountType} onChange={e => setDiscountType(e.target.value)}>
              <option value="none">No Discount</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>

        {discountType !== 'none' && (
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              Discount Value {discountType === 'percentage' ? '(%)' : '(Amount)'}
            </label>
            <input type="number" className={cn(cs.numberInput, ts.numberInput)} min={0} step="any"
              value={discountValue} onChange={e => setDiscountValue(e.target.value ? parseFloat(e.target.value) : '')} placeholder="0" />
          </div>
        )}

        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Calendar size={16} /> Issue Date <span className={cn(cs.labelHint, ts.labelHint)}>Auto if blank</span></label>
            <input type="date" className={cn(cs.textInput, ts.textInput)} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}><Hash size={16} /> Invoice # <span className={cn(cs.labelHint, ts.labelHint)}>Auto if blank</span></label>
            <input className={cn(cs.textInput, ts.textInput)} placeholder="INV-001" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
          </div>
        </div>

        {/* Template Selection */}
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}><Palette size={16} /> Template</label>
          <div className={cs.templateGrid}>
            {options.templates.map(tmpl => {
              const Icon = TEMPLATE_ICONS[tmpl.key] || FileText;
              return (
                <div
                  key={tmpl.key}
                  className={cn(cs.templateCard, ts.templateCard, template === tmpl.key && ts.templateCardSelected)}
                  onClick={() => setTemplate(tmpl.key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setTemplate(tmpl.key); }}
                  aria-label={`Select ${tmpl.label} template`}
                >
                  <div className={cs.templateAccent} style={{ background: tmpl.accent_color }} />
                  <Icon size={18} />
                  <span className={cn(cs.templateLabel, ts.templateLabel)}>{tmpl.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}><FileText size={16} /> Notes <span className={cn(cs.labelHint, ts.labelHint)}>Optional</span></label>
          <textarea className={cn(cs.textarea, ts.textarea)} placeholder="Additional notes, bank details, thank you message..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Processing View
   ============================================================================ */

interface ProcessingViewProps {
  step: number; error: string | null;
  cs: typeof commonStyles; ts: typeof lightStyles;
}

const PROCESSING_LABELS = [
  'Preparing invoice layout…',
  'Calculating totals & taxes…',
  'Applying template styling…',
  'Finalizing invoice…',
];

function ProcessingView({ step: pStep, error, cs, ts }: ProcessingViewProps) {
  if (error) {
    return (
      <div className={cn(cs.processingContainer, ts.processingContainer)}>
        <AlertTriangle size={48} />
        <h3 className={cs.processingTitle}>Generation Failed</h3>
        <p className={cs.processingSubtitle}>{error}</p>
      </div>
    );
  }
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cn(cs.processingOrb, ts.processingOrb)}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}>
          <FileText size={32} />
        </div>
      </div>
      <h3 className={cs.processingTitle}>Creating Your Invoice</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>Building your professional invoice</p>
      <div className={cs.processingSteps}>
        {PROCESSING_LABELS.map((label, i) => (
          <div key={label} className={cn(cs.processingStep, i <= pStep && cs.active)} style={{ opacity: i <= pStep ? 1 : 0.35 }}>
            {i < pStep ? <Check size={20} className={cs.processingStepCheck} /> : <div className={cn(cs.processingStepCircle, ts.processingStepCircle)} />}
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Results Dashboard
   ============================================================================ */

interface ResultsDashboardProps {
  result: InvoiceResult;
  onReset: () => void;
  onCopy: () => void;
  cs: typeof commonStyles; ts: typeof lightStyles;
}

function ResultsDashboard({ result, onReset, onCopy, cs, ts }: ResultsDashboardProps) {
  const { invoice, sender, recipient, items, calculations, currency: curr, template: tmpl, summary } = result;
  const sym = curr.symbol;
  const maxItemTotal = Math.max(...items.map(i => i.total));

  return (
    <div className={cs.resultsContainer}>
      {/* Invoice Hero */}
      <motion.div
        className={cn(cs.priceHero, ts.priceHero)}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={cn(cs.priceHeroGlow, ts.priceHeroGlow)} />
        <div className={cs.invoiceHeroTop}>
          <div>
            <p className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>Invoice {invoice.number}</p>
            <p className={cn(cs.invoiceHeroDate, ts.invoiceHeroDate)}>
              Issued: {invoice.issue_date} · Due: {invoice.due_date}
            </p>
          </div>
          <div className={cn(cs.invoiceHeroTemplate, ts.invoiceHeroTemplate)} style={{ borderColor: tmpl.accent_color }}>
            {tmpl.label}
          </div>
        </div>
        <div className={cs.priceHeroRange}>
          <span className={cn(cs.priceHeroValue, ts.priceHeroValue)}>
            {sym}{fmt(calculations.grand_total)}
          </span>
        </div>
        <p className={cn(cs.invoiceHeroWords, ts.invoiceHeroWords)}>{calculations.amount_in_words}</p>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <Receipt size={14} /> {summary.item_count} items
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <DollarSign size={14} /> {curr.code}
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <Clock size={14} /> {invoice.payment_terms}
          </span>
        </div>
      </motion.div>

      {/* Grid */}
      <div className={cs.resultsGrid}>
        {/* Parties Card */}
        <motion.div className={cn(cs.resultCard, ts.resultCard)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><User size={20} /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Parties</h3>
          </div>
          <div className={cs.partiesGrid}>
            <div className={cn(cs.partyBox, ts.partyBox)}>
              <span className={cn(cs.partyLabel, ts.partyLabel)}>From</span>
              <p className={cn(cs.partyName, ts.partyName)}>{sender.name || 'Not specified'}</p>
              {sender.email && <p className={cn(cs.partyDetail, ts.partyDetail)}>{sender.email}</p>}
              {sender.address && <p className={cn(cs.partyDetail, ts.partyDetail)}>{sender.address}</p>}
            </div>
            <div className={cn(cs.partyBox, ts.partyBox)}>
              <span className={cn(cs.partyLabel, ts.partyLabel)}>To</span>
              <p className={cn(cs.partyName, ts.partyName)}>{recipient.name || 'Not specified'}</p>
              {recipient.email && <p className={cn(cs.partyDetail, ts.partyDetail)}>{recipient.email}</p>}
              {recipient.address && <p className={cn(cs.partyDetail, ts.partyDetail)}>{recipient.address}</p>}
            </div>
          </div>
        </motion.div>

        {/* Line Items Card */}
        <motion.div className={cn(cs.resultCard, ts.resultCard)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Receipt size={20} /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Line Items</h3>
          </div>
          <div className={cs.breakdownList}>
            {items.map(item => (
              <div key={item.index} className={cs.breakdownItem}>
                <div className={cs.breakdownItemRow}>
                  <span className={cn(cs.breakdownItemLabel, ts.breakdownItemLabel)}>{item.description}</span>
                  <span className={cn(cs.breakdownItemValue, ts.breakdownItemValue)}>
                    {sym}{fmt(item.total)}
                    <span className={cn(cs.breakdownItemHours, ts.breakdownItemHours)}> · {item.quantity} × {sym}{fmt(item.rate)}</span>
                  </span>
                </div>
                <div className={cn(cs.progressBar, ts.progressBar)}>
                  <div className={cn(cs.progressFill, ts.progressFill)} style={{ width: `${maxItemTotal > 0 ? (item.total / maxItemTotal) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Calculations Card */}
        <motion.div className={cn(cs.resultCard, ts.resultCard)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><DollarSign size={20} /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Calculations</h3>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}>
              <span>Subtotal</span>
              <span>{sym}{fmt(calculations.subtotal)}</span>
            </div>
            {calculations.discount.amount > 0 && (
              <div className={cn(cs.calcRow, ts.calcRow, cs.calcDiscount)}>
                <span>{calculations.discount.label}</span>
                <span>-{sym}{fmt(calculations.discount.amount)}</span>
              </div>
            )}
            {calculations.tax.amount > 0 && (
              <div className={cn(cs.calcRow, ts.calcRow)}>
                <span>{calculations.tax.label} ({calculations.tax.rate}%)</span>
                <span>{sym}{fmt(calculations.tax.amount)}</span>
              </div>
            )}
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcTotal)}>
              <span>Grand Total</span>
              <span>{sym}{fmt(calculations.grand_total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div className={cn(cs.resultCard, ts.resultCard)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Sparkles size={20} /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Summary</h3>
          </div>
          <div className={cs.timelineDisplay}>
            <div className={cs.timelineStat}>
              <p className={cn(cs.timelineStatValue, ts.timelineStatValue)}>{summary.item_count}</p>
              <p className={cn(cs.timelineStatLabel, ts.timelineStatLabel)}>Items</p>
            </div>
            <div className={cn(cs.timelineDivider, ts.timelineDivider)} />
            <div className={cs.timelineStat}>
              <p className={cn(cs.timelineStatValue, ts.timelineStatValue)}>{sym}{fmt(summary.avg_item_value)}</p>
              <p className={cn(cs.timelineStatLabel, ts.timelineStatLabel)}>Avg Value</p>
            </div>
            <div className={cn(cs.timelineDivider, ts.timelineDivider)} />
            <div className={cs.timelineStat}>
              <p className={cn(cs.timelineStatValue, ts.timelineStatValue)}>{summary.effective_tax_rate}%</p>
              <p className={cn(cs.timelineStatLabel, ts.timelineStatLabel)}>Tax Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className={cs.actionsBar}>
        <button className={cn(cs.actionBtn, ts.actionBtnPrimary)} onClick={onReset}>
          <RotateCcw size={18} /> New Invoice
        </button>
        <button className={cn(cs.actionBtn, ts.actionBtnSecondary)} onClick={onCopy}>
          <Copy size={18} /> Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   Helpers
   ============================================================================ */

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
