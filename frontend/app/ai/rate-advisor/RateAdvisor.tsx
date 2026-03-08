// @AI-HINT: AI Rate Advisor – multi-step wizard for personalized freelancer rate recommendations
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ArrowRight, ArrowLeft, RotateCcw, CheckCircle,
  TrendingUp, BarChart2, Globe, Briefcase, Clock, Zap,
  Target, Star, Award, Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './RateAdvisor.common.module.css';
import lightStyles from './RateAdvisor.light.module.css';
import darkStyles from './RateAdvisor.dark.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ServiceOption { key: string; label: string }
interface PlatformOption { key: string; label: string; fee_pct: number }

interface OptionsData {
  service_types: ServiceOption[];
  experience_levels: string[];
  platforms: PlatformOption[];
  portfolio_strengths: string[];
}

interface RateResult {
  rates: { minimum: number; recommended: number; premium: number; currency: string };
  income: {
    hourly_net: number;
    projections: {
      conservative: { label: string; billable_hours_week: number; weekly: number; monthly: number; annual: number };
      average: { label: string; billable_hours_week: number; weekly: number; monthly: number; annual: number };
      optimistic: { label: string; billable_hours_week: number; weekly: number; monthly: number; annual: number };
    };
  };
  platform: {
    platform: string; gross_rate: number; fee_pct: number; take_home_rate: number; fee_per_hour: number; note: string;
  };
  platform_comparison: {
    platform: string; fee_pct: number; net_hourly: number; monthly_estimate: number; annual_estimate: number;
  }[];
  market_comparison: {
    comparisons: { benchmark: string; rate: number; your_position: string; difference_pct: number }[];
    estimated_percentile: number;
  };
  rate_breakdown: {
    step: string; value: number; description: string;
  }[];
  tips: { type: string; title: string; detail: string }[];
  meta: {
    service_type: string; experience_level: string; country_code: string;
    target_platform: string; weekly_hours: number;
  };
}

const STEPS = ['Service & Experience', 'Location & Platform', 'Results'];

const EXPERIENCE_LEVELS = [
  { key: 'junior', label: 'Junior', desc: '0-2 years' },
  { key: 'mid', label: 'Mid-Level', desc: '2-5 years' },
  { key: 'senior', label: 'Senior', desc: '5-10 years' },
  { key: 'expert', label: 'Expert', desc: '10+ years' },
];

const PORTFOLIO_OPTIONS = [
  { key: 'none', label: 'No portfolio yet' },
  { key: 'basic', label: 'A few projects (1-5)' },
  { key: 'strong', label: 'Solid portfolio (10+)' },
  { key: 'exceptional', label: 'Exceptional (awards)' },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepService({
  cs, ts, form, services, onChange,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  form: Record<string, any>; services: ServiceOption[];
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>
        <Briefcase size={18} /> Service & Experience
      </h3>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Service Type</label>
        <div className={cs.typeGrid}>
          {services.map(s => (
            <button
              key={s.key} type="button"
              onClick={() => onChange('service_type', s.key)}
              className={cn(
                cs.typeCard, ts.typeCard,
                form.service_type === s.key && cs.typeCardSelected,
                form.service_type === s.key && ts.typeCardSelected,
              )}
            >
              <span className={cs.typeCardLabel}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Experience Level</label>
        <div className={cs.expGrid}>
          {EXPERIENCE_LEVELS.map(e => (
            <button
              key={e.key} type="button"
              onClick={() => onChange('experience_level', e.key)}
              className={cn(
                cs.expCard, ts.expCard,
                form.experience_level === e.key && cs.expCardSelected,
                form.experience_level === e.key && ts.expCardSelected,
              )}
            >
              <span className={cs.expLabel}>{e.label}</span>
              <span className={cn(cs.expDesc, ts.expDesc)}>{e.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Portfolio Strength</label>
        <div className={cs.expGrid}>
          {PORTFOLIO_OPTIONS.map(p => (
            <button
              key={p.key} type="button"
              onClick={() => onChange('portfolio_strength', p.key)}
              className={cn(
                cs.expCard, ts.expCard,
                form.portfolio_strength === p.key && cs.expCardSelected,
                form.portfolio_strength === p.key && ts.expCardSelected,
              )}
            >
              <span className={cs.expLabel}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Weekly Hours</label>
          <input
            type="number" className={cn(cs.numberInput, ts.numberInput)}
            value={form.weekly_hours} onChange={e => onChange('weekly_hours', e.target.value)}
            min={5} max={60}
          />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Skills <span className={cn(cs.labelHint, ts.labelHint)}>(comma separated)</span></label>
          <input
            type="text" className={cn(cs.textInput, ts.textInput)}
            value={form.skills_text} onChange={e => onChange('skills_text', e.target.value)}
            placeholder="react, python, aws"
          />
        </div>
      </div>
    </div>
  );
}

function StepLocation({
  cs, ts, form, platforms, onChange,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  form: Record<string, any>; platforms: PlatformOption[];
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>
        <Globe size={18} /> Location & Platform
      </h3>

      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Country Code</label>
          <input
            type="text" className={cn(cs.textInput, ts.textInput)}
            value={form.country_code} onChange={e => onChange('country_code', e.target.value.toUpperCase())}
            placeholder="US" maxLength={2}
          />
          <span className={cn(cs.labelHint, ts.labelHint)}>ISO 2-letter code (US, PK, IN, GB...)</span>
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>City <span className={cn(cs.labelHint, ts.labelHint)}>(optional)</span></label>
          <input
            type="text" className={cn(cs.textInput, ts.textInput)}
            value={form.city} onChange={e => onChange('city', e.target.value)}
            placeholder="e.g. Lahore"
          />
        </div>
      </div>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Target Platform</label>
        <div className={cs.platformGrid}>
          {platforms.map(p => (
            <button
              key={p.key} type="button"
              onClick={() => onChange('target_platform', p.key)}
              className={cn(
                cs.platformCard, ts.platformCard,
                form.target_platform === p.key && cs.platformCardSelected,
                form.target_platform === p.key && ts.platformCardSelected,
              )}
            >
              <span className={cs.platformLabel}>{p.label}</span>
              <span className={cn(cs.platformFee, ts.platformFee)}>{p.fee_pct.toFixed(0)}% fee</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessingView({ cs, ts }: { cs: typeof commonStyles; ts: typeof lightStyles }) {
  const steps = ['Analyzing market rates...', 'Calculating geo adjustments...', 'Comparing platforms...', 'Building recommendations...'];
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cs.processingOrb}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}><DollarSign size={32} /></div>
      </div>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Calculating Your Rate</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>AI is analyzing platform data and regional markets</p>
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
}: { cs: typeof commonStyles; ts: typeof lightStyles; result: RateResult; fmt: (n: number) => string }) {
  const cur = result.rates.currency;

  return (
    <div className={cs.resultsContainer}>
      {/* Hero */}
      <div className={cn(cs.priceHero, ts.priceHero)}>
        <div className={cs.priceHeroGlow} />
        <div className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>Recommended Rate</div>
        <div className={cn(cs.priceHeroValue, ts.priceHeroValue)}>${fmt(result.rates.recommended)}/hr</div>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            Min ${fmt(result.rates.minimum)}
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            Premium ${fmt(result.rates.premium)}
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <Award size={14} /> {result.market_comparison.estimated_percentile}th percentile
          </span>
        </div>
      </div>

      <div className={cs.resultsGrid}>
        {/* Rate Breakdown */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><BarChart2 size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Rate Breakdown</h4>
          </div>
          <div className={cs.calcList}>
            {result.rate_breakdown.map((step, i) => (
              <div key={i} className={cn(cs.calcRow, ts.calcRow)}>
                <span>{step.step}</span>
                <span>${fmt(step.value)}/hr</span>
              </div>
            ))}
          </div>
        </div>

        {/* Income Projections */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><TrendingUp size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Income Projections</h4>
          </div>
          {(['conservative', 'average', 'optimistic'] as const).map(tier => {
            const p = result.income.projections[tier];
            return (
              <div key={tier} className={cs.incomeRow}>
                <div className={cs.incomeHeader}>
                  <span className={cn(cs.incomeLabel, ts.incomeLabel)}>{p.label}</span>
                  <span className={cn(cs.incomeUtil, ts.incomeUtil)}>{p.billable_hours_week}h/wk</span>
                </div>
                <div className={cs.incomeFigures}>
                  <span className={cn(cs.incomeFigure, ts.incomeFigure)}>${fmt(p.weekly)}/wk</span>
                  <span className={cn(cs.incomeFigure, ts.incomeFigure, cs.incomeHighlight)}>${fmt(p.monthly)}/mo</span>
                  <span className={cn(cs.incomeFigure, ts.incomeFigure)}>${fmt(p.annual)}/yr</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform Comparison */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Briefcase size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Platform Comparison</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowHeader)}>
              <span>Platform</span>
              <span>Fee</span>
              <span>Net/hr</span>
              <span>Net/mo</span>
            </div>
            {result.platform_comparison.map((pc, i) => (
              <div key={i} className={cn(cs.calcRow, ts.calcRow, pc.platform === result.platform.platform && cs.calcRowHighlight, pc.platform === result.platform.platform && ts.calcRowHighlight)}>
                <span>{pc.platform}</span>
                <span>{pc.fee_pct.toFixed(0)}%</span>
                <span>${fmt(pc.net_hourly)}</span>
                <span>${fmt(pc.monthly_estimate)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Position */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Target size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Market Position</h4>
          </div>
          <div className={cs.calcList}>
            {result.market_comparison.comparisons.map((c, i) => (
              <div key={i} className={cn(cs.calcRow, ts.calcRow)}>
                <span>{c.benchmark}</span>
                <span>${fmt(c.rate)}/hr ({c.difference_pct > 0 ? '+' : ''}{c.difference_pct}%)</span>
              </div>
            ))}
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowHighlight, ts.calcRowHighlight)}>
              <span>Your Percentile</span>
              <span>{result.market_comparison.estimated_percentile}th</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className={cn(cs.resultCard, ts.resultCard, cs.resultCardFullWidth)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Star size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Rate Tips</h4>
          </div>
          <div className={cs.recsGrid}>
            {result.tips.map((tip, i) => (
              <div key={i} className={cn(cs.recItem, ts.recItem)}>
                <div className={cn(cs.recTitle, ts.recTitle)}>{tip.title}</div>
                <div className={cn(cs.recMsg, ts.recMsg)}>{tip.detail}</div>
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

export default function RateAdvisor() {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [result, setResult] = useState<RateResult | null>(null);

  const [form, setForm] = useState<Record<string, any>>({
    service_type: 'web_app',
    experience_level: 'mid',
    portfolio_strength: 'basic',
    weekly_hours: 30,
    skills_text: '',
    country_code: 'US',
    city: '',
    target_platform: 'upwork',
  });

  useEffect(() => {
    fetch('/api/rate-advisor/options').then(r => r.json()).then(setOptions).catch(() => {});
  }, []);

  const handleChange = useCallback((f: string, v: any) => setForm(p => ({ ...p, [f]: v })), []);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async () => {
    setStep(2);
    setLoading(true);
    try {
      const skills = form.skills_text
        ? form.skills_text.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const body = {
        service_type: form.service_type,
        experience_level: form.experience_level,
        country_code: form.country_code || 'US',
        city: form.city || undefined,
        portfolio_strength: form.portfolio_strength,
        target_platform: form.target_platform,
        weekly_hours: parseInt(form.weekly_hours) || 30,
        skills,
      };
      const res = await fetch('/api/rate-advisor/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTimeout(() => { setResult(data); setLoading(false); }, 2000);
    } catch { setLoading(false); }
  };

  const reset = () => { setStep(0); setResult(null); setLoading(false); };

  const cs = commonStyles;
  const ts = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(cs.container, ts.container)}>
      <header className={cs.header}>
        <div className={cn(cs.headerBadge, ts.headerBadge)}><DollarSign size={14} /> AI-Powered</div>
        <h1 className={cn(cs.title, ts.title)}>Rate Advisor</h1>
        <p className={cn(cs.subtitle, ts.subtitle)}>Get personalized rate recommendations based on real market data</p>
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
          {step === 0 && options && <StepService cs={cs} ts={ts} form={form} services={options.service_types} onChange={handleChange} />}
          {step === 1 && options && <StepLocation cs={cs} ts={ts} form={form} platforms={options.platforms} onChange={handleChange} />}
          {step === 2 && loading && <ProcessingView cs={cs} ts={ts} />}
          {step === 2 && !loading && result && <ResultsDashboard cs={cs} ts={ts} result={result} fmt={fmt} />}
        </motion.div>
      </AnimatePresence>

      {!(step === 2 && loading) && (
        <div className={cs.navBar}>
          {step > 0 && step < 2 && <button className={cn(cs.navButtonBack, ts.navButtonBack)} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>}
          <div className={cs.navSpacer} />
          {step === 0 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={() => setStep(1)}>Next <ArrowRight size={16} /></button>}
          {step === 1 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={handleSubmit}>Get Rate Advice <ArrowRight size={16} /></button>}
          {step === 2 && result && (
            <div className={cs.actionsBar}>
              <button className={cn(cs.actionBtnSecondary, ts.actionBtnSecondary)} onClick={reset}><RotateCcw size={16} /> New Analysis</button>
            </div>
          )}
        </div>
      )}

      <div className={cn(cs.disclaimer, ts.disclaimer)}>
        Rates based on 2025 Upwork, Fiverr, Toptal &amp; Arc.dev market data. Individual results may vary.
      </div>
    </div>
  );
}
