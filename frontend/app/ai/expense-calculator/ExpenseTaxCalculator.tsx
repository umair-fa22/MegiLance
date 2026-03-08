// @AI-HINT: Standalone Expense & Tax Calculator – multi-step wizard (v2)
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, ArrowRight, ArrowLeft, RotateCcw, Download, CheckCircle,
  DollarSign, BarChart2, TrendingUp, PieChart, Calendar, Shield,
  FileText, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './ExpenseTaxCalculator.common.module.css';
import lightStyles from './ExpenseTaxCalculator.light.module.css';
import darkStyles from './ExpenseTaxCalculator.dark.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RegionOption { key: string; label: string; currency: string }
interface FilingStatus { key: string; label: string }
interface DeductionCategory { key: string; label: string; description: string }

interface UsState { key: string; label: string; rate: number }

interface OptionsData {
  regions: RegionOption[];
  filing_statuses: FilingStatus[];
  deduction_categories: DeductionCategory[];
  us_state_taxes: UsState[];
}

interface TaxResult {
  income: { gross_business_income: number; other_income: number; total_income: number };
  deductions: { business_expenses: number; se_tax_deduction: number; retirement_contribution: number; health_insurance: number; additional: number; standard_deduction: number; total_deductions: number; using_standard: boolean };
  expenses: { total: number; total_deductible: number; breakdown: { category: string; amount: number; deductible: boolean; label: string }[] };
  taxes: { self_employment_tax: number; federal_income_tax: number; state_tax: number; state_label: string; total_tax: number; effective_rate: number; marginal_rate: number };
  quarterly: { estimated_quarterly: number; taxes_already_paid: number; remaining_tax: number; per_remaining_quarter: number; current_quarter: number };
  net_income: { annual: number; monthly: { gross_income: number; expenses: number; tax_set_aside: number; net_take_home: number } };
  profit_loss: { revenue: number; cost_of_goods: number; gross_profit: number; operating_expenses: number; operating_income: number; taxes: number; net_profit: number; profit_margin: number };
  year_over_year: { previous_year: number; current_year: number; growth_percent: number; growth_direction: string } | null;
  recommendations: { type: string; title: string; message: string; potential_savings: number }[];
  meta: { region: string; currency: string; filing_status: string; tax_year: number; generated_at: string; generator: string; disclaimer: string };
}

const STEPS = ['Income', 'Expenses', 'Tax Settings', 'Results'];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepIncome({
  cs, ts, form, onChange,
}: { cs: typeof commonStyles; ts: typeof lightStyles; form: Record<string, any>; onChange: (f: string, v: any) => void }) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Income Details</h3>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Gross Freelance Income</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.gross_income} onChange={e => onChange('gross_income', e.target.value)} placeholder="100000" min={0} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Other Income</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.other_income} onChange={e => onChange('other_income', e.target.value)} placeholder="0" min={0} />
        </div>
      </div>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Previous Year Income <span className={cn(cs.labelHint, ts.labelHint)}>(for YoY comparison)</span></label>
        <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.previous_year_income} onChange={e => onChange('previous_year_income', e.target.value)} placeholder="0" min={0} />
      </div>
    </div>
  );
}

function StepExpenses({
  cs, ts, categories, deductions, onChange,
}: { cs: typeof commonStyles; ts: typeof lightStyles; categories: DeductionCategory[]; deductions: Record<string, string>; onChange: (k: string, v: string) => void }) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Deductions & Expenses</h3>
      <p className={cn(cs.formHint, ts.formHint)}>Enter annual amounts for each category</p>
      <div className={cs.expenseGrid}>
        {categories.map(cat => (
          <div key={cat.key} className={cs.expenseItem}>
            <label className={cn(cs.label, ts.label)} title={cat.description}>{cat.label}</label>
            <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={deductions[cat.key] || ''} onChange={e => onChange(cat.key, e.target.value)} placeholder="0" min={0} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTaxSettings({
  cs, ts, form, regions, filingStatuses, usStates, onChange,
}: { cs: typeof commonStyles; ts: typeof lightStyles; form: Record<string, any>; regions: RegionOption[]; filingStatuses: FilingStatus[]; usStates: UsState[]; onChange: (f: string, v: any) => void }) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Tax Settings</h3>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Tax Region</label>
          <select className={cn(cs.select, ts.select)} value={form.tax_region} onChange={e => onChange('tax_region', e.target.value)}>
            {regions.map(r => <option key={r.key} value={r.key}>{r.label} ({r.currency})</option>)}
          </select>
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Filing Status</label>
          <select className={cn(cs.select, ts.select)} value={form.filing_status} onChange={e => onChange('filing_status', e.target.value)}>
            {filingStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>
      {form.tax_region === 'us' && (
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>US State</label>
          <select className={cn(cs.select, ts.select)} value={form.us_state} onChange={e => onChange('us_state', e.target.value)}>
            {usStates.map(s => (
              <option key={s.key} value={s.key}>{s.label} ({s.rate}%)</option>
            ))}
          </select>
        </div>
      )}
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Retirement Contribution</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.retirement_contribution} onChange={e => onChange('retirement_contribution', e.target.value)} placeholder="0" min={0} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Health Insurance Premium</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.health_insurance_premium} onChange={e => onChange('health_insurance_premium', e.target.value)} placeholder="0" min={0} />
        </div>
      </div>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Quarterly Tax Already Paid</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.quarterly_tax_paid} onChange={e => onChange('quarterly_tax_paid', e.target.value)} placeholder="0" min={0} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Quarters Remaining</label>
          <select className={cn(cs.select, ts.select)} value={form.quarters_remaining} onChange={e => onChange('quarters_remaining', e.target.value)}>
            {[4,3,2,1].map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function ProcessingView({ cs, ts }: { cs: typeof commonStyles; ts: typeof lightStyles }) {
  const steps = ['Computing deductible expenses...', 'Calculating tax obligations...', 'Generating P&L statement...', 'Building recommendations...'];
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cs.processingOrb}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}><Receipt size={32} /></div>
      </div>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Calculating Your Taxes</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>Analyzing expenses, deductions, and tax brackets</p>
      <div className={cs.processingSteps}>
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5, duration: 0.4 }} className={cs.processingStep}>
            <div className={cn(cs.processingStepCircle, ts.processingStepCircle)}><CheckCircle size={14} /></div>
            <span>{s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ResultsDashboard({
  cs, ts, result, fmt,
}: { cs: typeof commonStyles; ts: typeof lightStyles; result: TaxResult; fmt: (n: number) => string }) {
  const cur = result.meta.currency;

  return (
    <div className={cs.resultsContainer}>
      {/* Hero */}
      <div className={cn(cs.priceHero, ts.priceHero)}>
        <div className={cs.priceHeroGlow} />
        <div className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>Total Tax Liability</div>
        <div className={cn(cs.priceHeroValue, ts.priceHeroValue)}>{cur} {fmt(result.taxes.total_tax)}</div>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.taxes.effective_rate}% effective rate</span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.taxes.marginal_rate}% marginal rate</span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.meta.region.toUpperCase()}</span>
        </div>
      </div>

      <div className={cs.resultsGrid}>
        {/* Income */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><DollarSign size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Income</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Gross Income</span><span>{cur} {fmt(result.income.gross_business_income)}</span></div>
            {result.income.other_income > 0 && <div className={cn(cs.calcRow, ts.calcRow)}><span>Other Income</span><span>{cur} {fmt(result.income.other_income)}</span></div>}
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>Total Income</span><span>{cur} {fmt(result.income.total_income)}</span></div>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><BarChart2 size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Tax Breakdown</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Self-Employment Tax</span><span>{cur} {fmt(result.taxes.self_employment_tax)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Federal / Income Tax</span><span>{cur} {fmt(result.taxes.federal_income_tax)}</span></div>
            {result.taxes.state_tax > 0 && <div className={cn(cs.calcRow, ts.calcRow)}><span>{result.taxes.state_label || 'State Tax'}</span><span>{cur} {fmt(result.taxes.state_tax)}</span></div>}
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>Total Tax</span><span>{cur} {fmt(result.taxes.total_tax)}</span></div>
          </div>
        </div>

        {/* Quarterly Estimates */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Calendar size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Quarterly Estimates</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Total Estimated</span><span>{cur} {fmt(result.quarterly.estimated_quarterly)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Already Paid</span><span>{cur} {fmt(result.quarterly.taxes_already_paid)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Remaining</span><span>{cur} {fmt(result.quarterly.remaining_tax)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>Per Quarter</span><span>{cur} {fmt(result.quarterly.per_remaining_quarter)}</span></div>
          </div>
        </div>

        {/* P&L */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><PieChart size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Profit & Loss</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Revenue</span><span>{cur} {fmt(result.profit_loss.revenue)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Operating Expenses</span><span>-{cur} {fmt(result.profit_loss.operating_expenses)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Taxes</span><span>-{cur} {fmt(result.profit_loss.taxes)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>Net Profit</span><span>{cur} {fmt(result.profit_loss.net_profit)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Profit Margin</span><span>{result.profit_loss.profit_margin}%</span></div>
          </div>
        </div>

        {/* Net Income */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><TrendingUp size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Net Income</h4>
          </div>
          <div className={cn(cs.bigStat, ts.bigStat)}>{cur} {fmt(result.net_income.annual)}</div>
          <div className={cn(cs.calcRow, ts.calcRow)}><span>Monthly</span><span>{cur} {fmt(result.net_income.monthly.net_take_home)}</span></div>
          {result.year_over_year && (
            <div className={cn(cs.yoyBox, ts.yoyBox, result.year_over_year.growth_direction === 'up' ? ts.yoyUp : ts.yoyDown)}>
              <span>{result.year_over_year.growth_direction === 'up' ? '↑' : '↓'} {Math.abs(result.year_over_year.growth_percent)}% vs last year</span>
            </div>
          )}
        </div>

        {/* Deductions */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><FileText size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Deductions ({cur} {fmt(result.deductions.total_deductions)})</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Business Expenses</span><span>{cur} {fmt(result.deductions.business_expenses)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>SE Tax Deduction</span><span>{cur} {fmt(result.deductions.se_tax_deduction)}</span></div>
            {result.deductions.retirement_contribution > 0 && <div className={cn(cs.calcRow, ts.calcRow)}><span>Retirement</span><span>{cur} {fmt(result.deductions.retirement_contribution)}</span></div>}
            {result.deductions.health_insurance > 0 && <div className={cn(cs.calcRow, ts.calcRow)}><span>Health Insurance</span><span>{cur} {fmt(result.deductions.health_insurance)}</span></div>}
            {result.deductions.standard_deduction > 0 && <div className={cn(cs.calcRow, ts.calcRow)}><span>Standard Deduction</span><span>{cur} {fmt(result.deductions.standard_deduction)}</span></div>}
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>Total Deductions</span><span>{cur} {fmt(result.deductions.total_deductions)}</span></div>
          </div>
        </div>

        {/* Recommendations */}
        <div className={cn(cs.resultCard, ts.resultCard, cs.resultCardFullWidth)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Shield size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Recommendations</h4>
          </div>
          <div className={cs.recsGrid}>
            {result.recommendations.map((r, i) => (
              <div key={i} className={cn(cs.recItem, ts.recItem, ts[`rec_${r.type}`])}>
                <div className={cn(cs.recTitle, ts.recTitle)}>{r.title}</div>
                <div className={cn(cs.recMsg, ts.recMsg)}>{r.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ExpenseTaxCalculator() {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [result, setResult] = useState<TaxResult | null>(null);

  const [form, setForm] = useState<Record<string, any>>({
    gross_income: '', other_income: '', previous_year_income: '',
    tax_region: 'us', filing_status: 'single', us_state: '',
    retirement_contribution: '', health_insurance_premium: '',
    quarterly_tax_paid: '', quarters_remaining: 4,
  });
  const [deductions, setDeductions] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/expense-tax-calculator/options').then(r => r.json()).then(setOptions).catch(() => {});
  }, []);

  const handleChange = useCallback((f: string, v: any) => setForm(p => ({ ...p, [f]: v })), []);
  const handleDeduction = useCallback((k: string, v: string) => setDeductions(p => ({ ...p, [k]: v })), []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async () => {
    setStep(3);
    setLoading(true);
    try {
      const deductionMap: Record<string, number> = {};
      for (const [k, v] of Object.entries(deductions)) {
        const n = parseFloat(v);
        if (n > 0) deductionMap[k] = n;
      }
      const body = {
        gross_income: parseFloat(form.gross_income) || 0,
        other_income: parseFloat(form.other_income) || 0,
        previous_year_income: parseFloat(form.previous_year_income) || 0,
        region: form.tax_region,
        filing_status: form.filing_status,
        us_state: form.us_state || 'none',
        expenses: deductionMap,
        retirement_contribution: parseFloat(form.retirement_contribution) || 0,
        health_insurance_premium: parseFloat(form.health_insurance_premium) || 0,
        taxes_already_paid: parseFloat(form.quarterly_tax_paid) || 0,
        current_quarter: parseInt(form.quarters_remaining) || 1,
      };
      const res = await fetch('/api/expense-tax-calculator/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      setTimeout(() => { setResult(data); setLoading(false); }, 2200);
    } catch { setLoading(false); }
  };

  const reset = () => { setStep(0); setResult(null); setLoading(false); };

  const cs = commonStyles;
  const ts = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(cs.container, ts.container)}>
      <header className={cs.header}>
        <div className={cn(cs.headerBadge, ts.headerBadge)}><Receipt size={14} /> AI-Powered</div>
        <h1 className={cn(cs.title, ts.title)}>Expense & Tax Calculator</h1>
        <p className={cn(cs.subtitle, ts.subtitle)}>Track expenses, deductions, and estimate your tax obligations</p>
      </header>

      <div className={cs.stepper}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={cs.stepItem}>
              <div className={cn(cs.stepDot, ts.stepDot, i === step && cs.stepDotActive, i === step && ts.stepDotActive, i < step && cs.stepDotCompleted, i < step && ts.stepDotCompleted)}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={cn(cs.stepLabel, ts.stepLabel, i === step && cs.stepLabelActive, i === step && ts.stepLabelActive)}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn(cs.stepLine, ts.stepLine, i < step && cs.stepLineActive, i < step && ts.stepLineActive)} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          {step === 0 && <StepIncome cs={cs} ts={ts} form={form} onChange={handleChange} />}
          {step === 1 && options && <StepExpenses cs={cs} ts={ts} categories={options.deduction_categories} deductions={deductions} onChange={handleDeduction} />}
          {step === 2 && options && <StepTaxSettings cs={cs} ts={ts} form={form} regions={options.regions} filingStatuses={options.filing_statuses} usStates={options.us_state_taxes} onChange={handleChange} />}
          {step === 3 && loading && <ProcessingView cs={cs} ts={ts} />}
          {step === 3 && !loading && result && <ResultsDashboard cs={cs} ts={ts} result={result} fmt={fmt} />}
        </motion.div>
      </AnimatePresence>

      {!(step === 3 && loading) && (
        <div className={cs.navBar}>
          {step > 0 && step < 3 && <button className={cn(cs.navButtonBack, ts.navButtonBack)} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>}
          <div className={cs.navSpacer} />
          {step < 2 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={() => setStep(step + 1)}>Next <ArrowRight size={16} /></button>}
          {step === 2 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={handleSubmit}>Calculate <ArrowRight size={16} /></button>}
          {step === 3 && result && (
            <div className={cs.actionsBar}>
              <button className={cn(cs.actionBtnSecondary, ts.actionBtnSecondary)} onClick={reset}><RotateCcw size={16} /> Recalculate</button>
              <button className={cn(cs.actionBtnPrimary, ts.actionBtnPrimary)} onClick={() => window.print()}><Download size={16} /> Export</button>
            </div>
          )}
        </div>
      )}

      <div className={cn(cs.disclaimer, ts.disclaimer)}>
        Estimates for planning purposes only. Consult a qualified tax professional.
      </div>
    </div>
  );
}
