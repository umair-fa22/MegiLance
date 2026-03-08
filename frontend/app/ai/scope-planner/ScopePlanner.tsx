// @AI-HINT: Standalone Project Scope & Budget Planner – multi-step wizard
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, ArrowRight, ArrowLeft, RotateCcw, Download, CheckCircle,
  Calendar, DollarSign, Users, AlertTriangle, Target, Plus, X,
  TrendingUp, Shield, BarChart2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './ScopePlanner.common.module.css';
import lightStyles from './ScopePlanner.light.module.css';
import darkStyles from './ScopePlanner.dark.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryOption { key: string; label: string; description: string }
interface ComplexityOption { key: string; label: string; multiplier: number }
interface RoleOption { key: string; label: string; default_rate: number }

interface OptionsData {
  categories: CategoryOption[];
  complexity_levels: ComplexityOption[];
  team_roles: RoleOption[];
}

interface TeamMember { role: string; rate: string; hours_per_week: number }
interface PlanResult {
  project: { name: string; category: string; category_label: string; complexity: string; complexity_label: string; multiplier: number };
  timeline: { total_weeks: number; total_months: number; start_date: string; phases: { number: number; name: string; weeks: number; start_week: number; end_week: number; description: string; percent_of_total: number; status: string }[] };
  budget: { labor_cost: number; risk_buffer: number; risk_buffer_percent: number; total: number; team_breakdown: { role: string; rate: number; total_hours: number; cost: number }[]; phase_budgets: { phase: string; budget: number; percent: number }[]; budget_status: string; monthly_burn_rate: number; currency: string };
  resources: { team_size: number; allocation: { phase: string; resources: { role: string; involvement_percent: number; hours: number }[] }[] };
  risks: { category: string; severity: string; title: string; message: string; mitigation: string }[];
  features: { feature: string; phase: string }[];
  deliverables: string[];
  completeness: { score: number; level: string; factors: { factor: string; points: number }[] };
  recommendations: { type: string; title: string; message: string }[];
  meta: { currency: string; generated_at: string };
}

const STEPS = ['Project', 'Budget & Timeline', 'Team & Features', 'Results'];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepProject({
  cs, ts, form, categories, complexityLevels, onChange,
}: { cs: typeof commonStyles; ts: typeof lightStyles; form: Record<string, any>; categories: CategoryOption[]; complexityLevels: ComplexityOption[]; onChange: (f: string, v: any) => void }) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Project Details</h3>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Project Name</label>
        <input type="text" className={cn(cs.textInput, ts.textInput)} value={form.project_name} onChange={e => onChange('project_name', e.target.value)} placeholder="My Awesome Project" maxLength={200} />
      </div>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Category</label>
        <div className={cs.typeGrid}>
          {categories.map(c => (
            <button key={c.key} type="button" onClick={() => onChange('category', c.key)}
              className={cn(cs.typeCard, ts.typeCard, form.category === c.key && cs.typeCardSelected, form.category === c.key && ts.typeCardSelected)}>
              <span className={cs.typeCardLabel}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Complexity</label>
        <div className={cs.complexityRow}>
          {complexityLevels.map(cl => (
            <button key={cl.key} type="button" onClick={() => onChange('complexity', cl.key)}
              className={cn(cs.complexityCard, ts.complexityCard, form.complexity === cl.key && cs.complexityCardSelected, form.complexity === cl.key && ts.complexityCardSelected)}>
              <span className={cs.complexityLabel}>{cl.label}</span>
              <span className={cn(cs.complexityMult, ts.complexityMult)}>{cl.multiplier}x</span>
            </button>
          ))}
        </div>
      </div>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Description <span className={cn(cs.labelHint, ts.labelHint)}>(optional)</span></label>
        <textarea className={cn(cs.textarea, ts.textarea)} value={form.description} onChange={e => onChange('description', e.target.value)} rows={3} placeholder="Brief project description..." maxLength={5000} />
      </div>
    </div>
  );
}

function StepBudget({
  cs, ts, form, onChange,
}: { cs: typeof commonStyles; ts: typeof lightStyles; form: Record<string, any>; onChange: (f: string, v: any) => void }) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Budget & Timeline</h3>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Total Weeks</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.total_weeks} onChange={e => onChange('total_weeks', e.target.value)} min={1} max={104} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Start Date</label>
          <input type="date" className={cn(cs.textInput, ts.textInput)} value={form.start_date} onChange={e => onChange('start_date', e.target.value)} />
        </div>
      </div>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Total Budget <span className={cn(cs.labelHint, ts.labelHint)}>(optional)</span></label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.total_budget} onChange={e => onChange('total_budget', e.target.value)} placeholder="50000" min={0} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Currency</label>
          <select className={cn(cs.select, ts.select)} value={form.currency} onChange={e => onChange('currency', e.target.value)}>
            {['USD','EUR','GBP','AUD','CAD','PKR','INR','SGD'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Hourly Rate</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.hourly_rate} onChange={e => onChange('hourly_rate', e.target.value)} min={0} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Risk Buffer (%)</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={form.risk_buffer_percent} onChange={e => onChange('risk_buffer_percent', e.target.value)} min={0} max={50} />
        </div>
      </div>
    </div>
  );
}

function StepTeam({
  cs, ts, form, roles, members, setMembers, features, setFeatures, deliverables, setDeliverables, onChange,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles; form: Record<string, any>; roles: RoleOption[];
  members: TeamMember[]; setMembers: (m: TeamMember[]) => void;
  features: string[]; setFeatures: (f: string[]) => void;
  deliverables: string[]; setDeliverables: (d: string[]) => void;
  onChange: (f: string, v: any) => void;
}) {
  const addMember = () => setMembers([...members, { role: roles[0]?.key || 'developer', rate: '', hours_per_week: 40 }]);
  const removeMember = (i: number) => setMembers(members.filter((_, j) => j !== i));
  const updateMember = (i: number, f: string, v: any) => { const copy = [...members]; (copy[i] as any)[f] = v; setMembers(copy); };

  const [featureInput, setFeatureInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');

  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Team & Features</h3>

      {/* Team */}
      <div className={cs.sectionHeader}>
        <span className={cn(cs.sectionLabel, ts.sectionLabel)}>Team Members</span>
        <button type="button" className={cn(cs.addBtn, ts.addBtn)} onClick={addMember}><Plus size={14} /> Add</button>
      </div>
      {members.map((m, i) => (
        <div key={i} className={cn(cs.memberRow, ts.memberRow)}>
          <select className={cn(cs.smallSelect, ts.smallSelect)} value={m.role} onChange={e => updateMember(i, 'role', e.target.value)}>
            {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <input type="number" className={cn(cs.smallInput, ts.smallInput)} value={m.rate} onChange={e => updateMember(i, 'rate', e.target.value)} placeholder="Rate/hr" min={0} />
          <input type="number" className={cn(cs.smallInput, ts.smallInput)} value={m.hours_per_week} onChange={e => updateMember(i, 'hours_per_week', parseInt(e.target.value) || 40)} placeholder="Hrs/wk" min={1} max={80} />
          <button type="button" className={cn(cs.removeBtn, ts.removeBtn)} onClick={() => removeMember(i)}><X size={14} /></button>
        </div>
      ))}

      {/* Features */}
      <div className={cs.sectionHeader}>
        <span className={cn(cs.sectionLabel, ts.sectionLabel)}>Features</span>
      </div>
      <div className={cs.tagInputRow}>
        <input type="text" className={cn(cs.textInput, ts.textInput)} value={featureInput} onChange={e => setFeatureInput(e.target.value)}
          placeholder="Add a feature..." onKeyDown={e => { if (e.key === 'Enter' && featureInput.trim()) { setFeatures([...features, featureInput.trim()]); setFeatureInput(''); } }} />
        <button type="button" className={cn(cs.addBtn, ts.addBtn)} onClick={() => { if (featureInput.trim()) { setFeatures([...features, featureInput.trim()]); setFeatureInput(''); } }}><Plus size={14} /></button>
      </div>
      <div className={cs.tagList}>
        {features.map((f, i) => (
          <span key={i} className={cn(cs.tag, ts.tag)}>{f} <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))}><X size={12} /></button></span>
        ))}
      </div>

      {/* Deliverables */}
      <div className={cs.sectionHeader}>
        <span className={cn(cs.sectionLabel, ts.sectionLabel)}>Deliverables</span>
      </div>
      <div className={cs.tagInputRow}>
        <input type="text" className={cn(cs.textInput, ts.textInput)} value={deliverableInput} onChange={e => setDeliverableInput(e.target.value)}
          placeholder="Add a deliverable..." onKeyDown={e => { if (e.key === 'Enter' && deliverableInput.trim()) { setDeliverables([...deliverables, deliverableInput.trim()]); setDeliverableInput(''); } }} />
        <button type="button" className={cn(cs.addBtn, ts.addBtn)} onClick={() => { if (deliverableInput.trim()) { setDeliverables([...deliverables, deliverableInput.trim()]); setDeliverableInput(''); } }}><Plus size={14} /></button>
      </div>
      <div className={cs.tagList}>
        {deliverables.map((d, i) => (
          <span key={i} className={cn(cs.tag, ts.tag)}>{d} <button type="button" onClick={() => setDeliverables(deliverables.filter((_, j) => j !== i))}><X size={12} /></button></span>
        ))}
      </div>
    </div>
  );
}

function ProcessingView({ cs, ts }: { cs: typeof commonStyles; ts: typeof lightStyles }) {
  const steps = ['Analyzing scope requirements...', 'Estimating budget & timeline...', 'Allocating resources...', 'Assessing risks...'];
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cs.processingOrb}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}><Layers size={32} /></div>
      </div>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Planning Your Project</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>AI is generating your comprehensive project plan</p>
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
}: { cs: typeof commonStyles; ts: typeof lightStyles; result: PlanResult; fmt: (n: number) => string }) {
  const cur = result.meta.currency;
  const [openPhase, setOpenPhase] = useState<number | null>(null);

  return (
    <div className={cs.resultsContainer}>
      {/* Hero */}
      <div className={cn(cs.priceHero, ts.priceHero)}>
        <div className={cs.priceHeroGlow} />
        <div className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>{result.project.name}</div>
        <div className={cn(cs.priceHeroValue, ts.priceHeroValue)}>{cur} {fmt(result.budget.total)}</div>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.timeline.total_weeks} weeks</span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.project.complexity} ({result.project.multiplier}x)</span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{cur} {fmt(result.budget.monthly_burn_rate)}/mo burn</span>
        </div>
      </div>

      <div className={cs.resultsGrid}>
        {/* Timeline */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Calendar size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Timeline</h4>
          </div>
          {result.timeline.phases.map((p, i) => (
            <div key={i} className={cs.phaseRow} onClick={() => setOpenPhase(openPhase === i ? null : i)} style={{ cursor: 'pointer' }}>
              <div className={cs.phaseHeader}>
                <span className={cn(cs.phaseLabel, ts.phaseLabel)}>{p.name}</span>
                <span className={cn(cs.phaseWeeks, ts.phaseWeeks)}>{p.weeks}w</span>
              </div>
              <div className={cs.phaseBar}>
                <div className={cn(cs.phaseBarFill, ts.phaseBarFill)} style={{ width: `${(p.weeks / result.timeline.total_weeks) * 100}%` }} />
              </div>
              {openPhase === i && p.description && <p className={cn(cs.phaseDesc, ts.phaseDesc)}>{p.description}</p>}
            </div>
          ))}
        </div>

        {/* Budget */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><DollarSign size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Budget</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Labor</span><span>{cur} {fmt(result.budget.labor_cost)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Risk Buffer</span><span>{cur} {fmt(result.budget.risk_buffer)}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>Total</span><span>{cur} {fmt(result.budget.total)}</span></div>
          </div>
          <h5 className={cn(cs.miniTitle, ts.miniTitle)}>Team Costs</h5>
          {result.budget.team_breakdown.map((t, i) => (
            <div key={i} className={cn(cs.calcRow, ts.calcRow)}><span>{t.role} ({t.total_hours}h @ {cur}{fmt(t.rate)}/h)</span><span>{cur} {fmt(t.cost)}</span></div>
          ))}
        </div>

        {/* Resources */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Users size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Resources ({result.resources.team_size})</h4>
          </div>
          {result.resources.allocation.map((a, i) => (
            <div key={i}>
              <div className={cn(cs.calcRow, ts.calcRow, cs.calcRowTotal)}><span>{a.phase}</span><span></span></div>
              {a.resources.map((r, j) => (
                <div key={j} className={cn(cs.calcRow, ts.calcRow)}><span>{r.role}</span><span>{r.hours}h ({r.involvement_percent}%)</span></div>
              ))}
            </div>
          ))}
        </div>

        {/* Risks */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><AlertTriangle size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Risks</h4>
          </div>
          {result.risks.map((r, i) => (
            <div key={i} className={cn(cs.riskItem, ts.riskItem, ts[`risk_${r.severity}`])}>
              <div className={cn(cs.riskTitle, ts.riskTitle)}>{r.title} <span className={cn(cs.riskSeverity, ts.riskSeverity)}>{r.severity}</span></div>
              <div className={cn(cs.riskMsg, ts.riskMsg)}>{r.message}</div>
              <div className={cn(cs.riskMitigation, ts.riskMitigation)}>Mitigation: {r.mitigation}</div>
            </div>
          ))}
        </div>

        {/* Completeness & Recommendations */}
        <div className={cn(cs.resultCard, ts.resultCard, cs.resultCardFullWidth)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Target size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Completeness & Recommendations</h4>
          </div>
          <div className={cs.scoreBar}>
            <div className={cs.scoreBarTrack}>
              <div className={cs.scoreBarFill} style={{ width: `${result.completeness.score}%`, background: result.completeness.score >= 85 ? '#27ae60' : result.completeness.score >= 65 ? '#f39c12' : '#e81123' }} />
            </div>
            <span className={cn(cs.scoreValue, ts.scoreValue)}>{result.completeness.score}/100</span>
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

export default function ScopePlanner() {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);

  const [form, setForm] = useState<Record<string, any>>({
    project_name: '', category: 'web_app', complexity: 'moderate', description: '',
    total_weeks: 12, start_date: '', total_budget: '', currency: 'USD',
    hourly_rate: 75, risk_buffer_percent: 15,
  });
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/scope-planner/options').then(r => r.json()).then(setOptions).catch(() => {});
  }, []);

  const handleChange = useCallback((f: string, v: any) => setForm(p => ({ ...p, [f]: v })), []);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async () => {
    setStep(3);
    setLoading(true);
    try {
      const body = {
        project_name: form.project_name || 'Untitled Project',
        category: form.category,
        description: form.description,
        complexity: form.complexity,
        total_weeks: parseInt(form.total_weeks) || 12,
        start_date: form.start_date || '',
        total_budget: form.total_budget ? parseFloat(form.total_budget) : null,
        currency: form.currency,
        hourly_rate: parseFloat(form.hourly_rate) || 75,
        risk_buffer_percent: parseFloat(form.risk_buffer_percent) || 15,
        team_members: members.map(m => ({ role: m.role, rate: m.rate ? parseFloat(m.rate) : null, hours_per_week: m.hours_per_week })),
        features,
        deliverables,
      };
      const res = await fetch('/api/scope-planner/plan', {
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
        <div className={cn(cs.headerBadge, ts.headerBadge)}><Layers size={14} /> AI-Powered</div>
        <h1 className={cn(cs.title, ts.title)}>Scope & Budget Planner</h1>
        <p className={cn(cs.subtitle, ts.subtitle)}>Plan timelines, budgets, and resources for your projects</p>
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
          {step === 0 && options && <StepProject cs={cs} ts={ts} form={form} categories={options.categories} complexityLevels={options.complexity_levels} onChange={handleChange} />}
          {step === 1 && <StepBudget cs={cs} ts={ts} form={form} onChange={handleChange} />}
          {step === 2 && options && <StepTeam cs={cs} ts={ts} form={form} roles={options.team_roles} members={members} setMembers={setMembers} features={features} setFeatures={setFeatures} deliverables={deliverables} setDeliverables={setDeliverables} onChange={handleChange} />}
          {step === 3 && loading && <ProcessingView cs={cs} ts={ts} />}
          {step === 3 && !loading && result && <ResultsDashboard cs={cs} ts={ts} result={result} fmt={fmt} />}
        </motion.div>
      </AnimatePresence>

      {!(step === 3 && loading) && (
        <div className={cs.navBar}>
          {step > 0 && step < 3 && <button className={cn(cs.navButtonBack, ts.navButtonBack)} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>}
          <div className={cs.navSpacer} />
          {step < 2 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={() => setStep(step + 1)}>Next <ArrowRight size={16} /></button>}
          {step === 2 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={handleSubmit}>Plan Project <ArrowRight size={16} /></button>}
          {step === 3 && result && (
            <div className={cs.actionsBar}>
              <button className={cn(cs.actionBtnSecondary, ts.actionBtnSecondary)} onClick={reset}><RotateCcw size={16} /> New Plan</button>
              <button className={cn(cs.actionBtnPrimary, ts.actionBtnPrimary)} onClick={() => window.print()}><Download size={16} /> Export</button>
            </div>
          )}
        </div>
      )}

      <div className={cn(cs.disclaimer, ts.disclaimer)}>
        Estimates for planning purposes only. Actual project costs may vary.
      </div>
    </div>
  );
}
