// @AI-HINT: Standalone Contract Builder – multi-step wizard for contract generation
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ArrowRight, ArrowLeft, RotateCcw, Download,
  Shield, Users, Scale, CheckCircle, AlertTriangle,
  Briefcase, Key, GitBranch, MessageCircle, UserCheck,
  ShoppingCart, ChevronDown, ChevronUp, Plus, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './ContractBuilder.common.module.css';
import lightStyles from './ContractBuilder.light.module.css';
import darkStyles from './ContractBuilder.dark.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ContractType {
  key: string;
  label: string;
  description: string;
  icon: string;
  common_for: string[];
}

interface Clause {
  key: string;
  category: string;
  label: string;
  description: string;
}

interface Jurisdiction {
  key: string;
  label: string;
}

interface OptionsData {
  contract_types: ContractType[];
  clause_categories: { key: string; label: string; count: number }[];
  jurisdictions: Jurisdiction[];
}

interface RiskItem {
  severity: string;
  title: string;
  message: string;
  recommendation: string;
}

interface ClauseContent {
  section: number;
  title: string;
  content: string;
  type: string;
}

interface ContractResult {
  contract: { id: string; type_label: string; created_at: string; status: string };
  parties: {
    party_a: { name: string; role: string; address: string; email: string };
    party_b: { name: string; role: string; address: string; email: string };
  };
  terms: { start_date: string; end_date: string; auto_renew: boolean; jurisdiction: { label: string }; notice_period_days: number };
  financial: { total_value: number | null; currency: string; payment_schedule_label: string };
  scope: { description: string; deliverables: string[]; revision_rounds: number; warranty_days: number };
  clauses: ClauseContent[];
  selected_clause_keys: string[];
  risk_analysis: RiskItem[];
  completeness: { score: number; level: string; factors: { factor: string; points: number }[] };
  meta: { generated_at: string; generator: string };
}

const STEPS = ['Type', 'Parties', 'Terms', 'Clauses', 'Preview'];

const ICON_MAP: Record<string, React.ReactNode> = {
  briefcase: <Briefcase size={20} />,
  shield: <Shield size={20} />,
  'check-circle': <CheckCircle size={20} />,
  users: <Users size={20} />,
  'message-circle': <MessageCircle size={20} />,
  'user-check': <UserCheck size={20} />,
  'git-branch': <GitBranch size={20} />,
  key: <Key size={20} />,
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepType({
  cs, ts, types, selected, onSelect,
}: { cs: typeof commonStyles; ts: typeof lightStyles; types: ContractType[]; selected: string; onSelect: (k: string) => void }) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Choose Contract Type</h3>
      <div className={cs.typeGrid}>
        {types.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className={cn(cs.typeCard, ts.typeCard, selected === t.key && cs.typeCardSelected, selected === t.key && ts.typeCardSelected)}
          >
            <span className={cn(cs.typeIcon, ts.typeIcon)}>{ICON_MAP[t.icon] || <FileText size={20} />}</span>
            <span className={cn(cs.typeLabel, ts.typeLabel)}>{t.label}</span>
            <span className={cn(cs.typeDesc, ts.typeDesc)}>{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepParties({
  cs, ts, partyA, partyB, onChangeA, onChangeB,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  partyA: Record<string, string>; partyB: Record<string, string>;
  onChangeA: (f: string, v: string) => void; onChangeB: (f: string, v: string) => void;
}) {
  const fields = [
    { key: 'name', label: 'Full Name', placeholder: 'John Doe' },
    { key: 'role', label: 'Role', placeholder: 'Client' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com' },
    { key: 'address', label: 'Address', placeholder: '123 Main St, City, Country' },
  ];
  return (
    <div className={cs.splitCards}>
      {[{ title: 'Party A (Client)', data: partyA, onChange: onChangeA, defaultRole: 'Client' },
        { title: 'Party B (Contractor)', data: partyB, onChange: onChangeB, defaultRole: 'Contractor' }].map((party, idx) => (
        <div key={idx} className={cn(cs.formCard, ts.formCard)}>
          <h3 className={cn(cs.formTitle, ts.formTitle)}>{party.title}</h3>
          {fields.map(f => (
            <div key={f.key} className={cs.formGroup}>
              <label className={cn(cs.label, ts.label)}>{f.label}</label>
              <input
                type="text"
                className={cn(cs.textInput, ts.textInput)}
                value={party.data[f.key] || ''}
                onChange={e => party.onChange(f.key, e.target.value)}
                placeholder={f.key === 'role' ? party.defaultRole : f.placeholder}
                maxLength={f.key === 'address' ? 500 : 200}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StepTerms({
  cs, ts, terms, jurisdictions, onChange,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  terms: Record<string, any>; jurisdictions: Jurisdiction[];
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Contract Terms</h3>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Start Date</label>
          <input type="date" className={cn(cs.textInput, ts.textInput)} value={terms.start_date} onChange={e => onChange('start_date', e.target.value)} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>End Date</label>
          <input type="date" className={cn(cs.textInput, ts.textInput)} value={terms.end_date} onChange={e => onChange('end_date', e.target.value)} />
        </div>
      </div>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Jurisdiction</label>
          <select className={cn(cs.select, ts.select)} value={terms.jurisdiction} onChange={e => onChange('jurisdiction', e.target.value)}>
            {jurisdictions.map(j => <option key={j.key} value={j.key}>{j.label}</option>)}
          </select>
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Currency</label>
          <select className={cn(cs.select, ts.select)} value={terms.currency} onChange={e => onChange('currency', e.target.value)}>
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR', 'INR'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Total Value</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={terms.total_value} onChange={e => onChange('total_value', e.target.value)} placeholder="e.g. 15000" min={0} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Payment Schedule</label>
          <select className={cn(cs.select, ts.select)} value={terms.payment_schedule} onChange={e => onChange('payment_schedule', e.target.value)}>
            {['milestone', 'monthly', 'weekly', 'on_completion', 'upfront'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Notice Period (days)</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={terms.notice_period_days} onChange={e => onChange('notice_period_days', e.target.value)} min={1} max={365} />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Warranty (days)</label>
          <input type="number" className={cn(cs.numberInput, ts.numberInput)} value={terms.warranty_days} onChange={e => onChange('warranty_days', e.target.value)} min={0} max={365} />
        </div>
      </div>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Scope Description</label>
        <textarea className={cn(cs.textarea, ts.textarea)} value={terms.scope_description} onChange={e => onChange('scope_description', e.target.value)} placeholder="Describe the project scope, objectives, and key deliverables..." rows={3} maxLength={5000} />
      </div>
      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Deliverables <span className={cn(cs.labelHint, ts.labelHint)}>(comma-separated)</span></label>
        <input type="text" className={cn(cs.textInput, ts.textInput)} value={terms.deliverables_text} onChange={e => onChange('deliverables_text', e.target.value)} placeholder="e.g. Website design, API development, Documentation" />
      </div>
      <div className={cs.checkboxRow}>
        <input type="checkbox" id="autoRenew" checked={terms.auto_renew} onChange={e => onChange('auto_renew', e.target.checked)} />
        <label htmlFor="autoRenew" className={cn(cs.label, ts.label)}>Auto-renew contract</label>
      </div>
    </div>
  );
}

function StepClauses({
  cs, ts, clauses, selected, onToggle,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  clauses: Clause[]; selected: string[];
  onToggle: (key: string) => void;
}) {
  const categories = Array.from(new Set(clauses.map(c => c.category)));
  const catLabels: Record<string, string> = {
    payment: 'Payment & Billing',
    intellectual_property: 'Intellectual Property',
    confidentiality: 'Confidentiality',
    liability: 'Liability & Warranty',
    termination: 'Termination',
    scope: 'Scope & Revisions',
    general: 'General Terms',
    sla: 'Service Level',
  };
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Select Clauses <span className={cn(cs.labelHint, ts.labelHint)}>({selected.length} selected)</span></h3>
      {categories.map(cat => (
        <div key={cat} className={cs.clauseCategory}>
          <h4 className={cn(cs.clauseCatTitle, ts.clauseCatTitle)}>{catLabels[cat] || cat}</h4>
          <div className={cs.clauseGrid}>
            {clauses.filter(c => c.category === cat).map(clause => (
              <button
                key={clause.key}
                type="button"
                onClick={() => onToggle(clause.key)}
                className={cn(cs.clauseCard, ts.clauseCard, selected.includes(clause.key) && cs.clauseCardSelected, selected.includes(clause.key) && ts.clauseCardSelected)}
              >
                <span className={cn(cs.clauseLabel, ts.clauseLabel)}>{clause.label}</span>
                <span className={cn(cs.clauseDesc, ts.clauseDesc)}>{clause.description}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProcessingView({ cs, ts }: { cs: typeof commonStyles; ts: typeof lightStyles }) {
  const steps = ['Analyzing contract type...', 'Building clause framework...', 'Assessing risks...', 'Generating document...'];
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cs.processingOrb}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}><Scale size={32} /></div>
      </div>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Building Your Contract</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>Our AI engine is drafting professional clauses</p>
      <div className={cs.processingSteps}>
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.6, duration: 0.4 }} className={cs.processingStep}>
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
}: { cs: typeof commonStyles; ts: typeof lightStyles; result: ContractResult; fmt: (n: number) => string }) {
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const toggleSection = (n: number) => setExpandedSections(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);

  const scoreColor = result.completeness.score >= 85 ? '#27ae60' : result.completeness.score >= 65 ? '#f39c12' : '#e81123';

  return (
    <div className={cs.resultsContainer}>
      {/* Hero */}
      <div className={cn(cs.priceHero, ts.priceHero)}>
        <div className={cs.priceHeroGlow} />
        <div className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>Contract Ready</div>
        <div className={cn(cs.priceHeroValue, ts.priceHeroValue)}>{result.contract.type_label}</div>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>ID: {result.contract.id}</span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.clauses.length} Sections</span>
          {result.financial.total_value && (
            <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>{result.financial.currency} {fmt(result.financial.total_value)}</span>
          )}
        </div>
      </div>

      <div className={cs.resultsGrid}>
        {/* Completeness */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><CheckCircle size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Completeness</h4>
          </div>
          <div className={cs.scoreBar}>
            <div className={cs.scoreBarTrack}>
              <div className={cs.scoreBarFill} style={{ width: `${result.completeness.score}%`, background: scoreColor }} />
            </div>
            <span className={cn(cs.scoreValue, ts.scoreValue)}>{result.completeness.score}%</span>
          </div>
          {result.completeness.factors.map((f, i) => (
            <div key={i} className={cn(cs.factorRow, ts.factorRow)}>
              <span>{f.factor}</span><span>+{f.points}</span>
            </div>
          ))}
        </div>

        {/* Risk Analysis */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><AlertTriangle size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Risk Analysis</h4>
          </div>
          {result.risk_analysis.map((r, i) => (
            <div key={i} className={cn(cs.riskItem, ts.riskItem, cs[`risk_${r.severity}`], ts[`risk_${r.severity}`])}>
              <div className={cn(cs.riskTitle, ts.riskTitle)}>{r.title}</div>
              <div className={cn(cs.riskMsg, ts.riskMsg)}>{r.message}</div>
              <div className={cn(cs.riskRec, ts.riskRec)}>{r.recommendation}</div>
            </div>
          ))}
        </div>

        {/* Parties */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Users size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Parties</h4>
          </div>
          <div className={cs.partiesGrid}>
            {[result.parties.party_a, result.parties.party_b].map((p, i) => (
              <div key={i} className={cn(cs.partyBox, ts.partyBox)}>
                <div className={cn(cs.partyLabel, ts.partyLabel)}>{p.role}</div>
                <div className={cn(cs.partyName, ts.partyName)}>{p.name || 'Not specified'}</div>
                {p.email && <div className={cn(cs.partyDetail, ts.partyDetail)}>{p.email}</div>}
                {p.address && <div className={cn(cs.partyDetail, ts.partyDetail)}>{p.address}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Contract Sections */}
        <div className={cn(cs.resultCard, ts.resultCard, cs.resultCardFullWidth)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><FileText size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Contract Document</h4>
          </div>
          {result.clauses.map(clause => (
            <div key={clause.section} className={cn(cs.clauseSection, ts.clauseSection)}>
              <button
                type="button"
                className={cn(cs.clauseSectionHeader, ts.clauseSectionHeader)}
                onClick={() => toggleSection(clause.section)}
              >
                <span>§{clause.section}. {clause.title}</span>
                {expandedSections.includes(clause.section) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {expandedSections.includes(clause.section) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={cn(cs.clauseSectionBody, ts.clauseSectionBody)}
                  >
                    {clause.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Key Terms */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Scale size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Key Terms</h4>
          </div>
          <div className={cs.calcList}>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Jurisdiction</span><span>{result.terms.jurisdiction.label}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Start Date</span><span>{result.terms.start_date}</span></div>
            {result.terms.end_date && <div className={cn(cs.calcRow, ts.calcRow)}><span>End Date</span><span>{result.terms.end_date}</span></div>}
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Payment</span><span>{result.financial.payment_schedule_label}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Notice Period</span><span>{result.terms.notice_period_days} days</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Auto-Renew</span><span>{result.terms.auto_renew ? 'Yes' : 'No'}</span></div>
            <div className={cn(cs.calcRow, ts.calcRow)}><span>Warranty</span><span>{result.scope.warranty_days} days</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ContractBuilder() {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [result, setResult] = useState<ContractResult | null>(null);

  // Form state
  const [contractType, setContractType] = useState('freelance_service');
  const [partyA, setPartyA] = useState<Record<string, string>>({ name: '', role: 'Client', email: '', address: '' });
  const [partyB, setPartyB] = useState<Record<string, string>>({ name: '', role: 'Contractor', email: '', address: '' });
  const [terms, setTerms] = useState<Record<string, any>>({
    start_date: '', end_date: '', jurisdiction: 'us_federal', currency: 'USD',
    total_value: '', payment_schedule: 'milestone', notice_period_days: 14, warranty_days: 30,
    scope_description: '', deliverables_text: '', auto_renew: false,
  });
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);

  // Fetch options
  useEffect(() => {
    fetch('/api/contract-builder-standalone/options')
      .then(r => r.json())
      .then(setOptions)
      .catch((e) => console.error('Contract builder options load failed:', e));
  }, []);

  // Fetch clauses when type changes
  useEffect(() => {
    fetch(`/api/contract-builder-standalone/clauses/${encodeURIComponent(contractType)}`)
      .then(r => r.json())
      .then(data => setClauses(data.clauses || []))
      .catch((e) => console.error('Contract clauses load failed:', e));
  }, [contractType]);

  const handleChangeA = useCallback((f: string, v: string) => setPartyA(prev => ({ ...prev, [f]: v })), []);
  const handleChangeB = useCallback((f: string, v: string) => setPartyB(prev => ({ ...prev, [f]: v })), []);
  const handleTermChange = useCallback((f: string, v: any) => setTerms(prev => ({ ...prev, [f]: v })), []);
  const toggleClause = useCallback((key: string) => {
    setSelectedClauses(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async () => {
    setStep(4);
    setLoading(true);
    try {
      const body = {
        contract_type: contractType,
        party_a_name: partyA.name, party_a_role: partyA.role || 'Client',
        party_a_address: partyA.address, party_a_email: partyA.email,
        party_b_name: partyB.name, party_b_role: partyB.role || 'Contractor',
        party_b_address: partyB.address, party_b_email: partyB.email,
        start_date: terms.start_date, end_date: terms.end_date,
        auto_renew: terms.auto_renew, jurisdiction: terms.jurisdiction,
        total_value: terms.total_value ? parseFloat(terms.total_value) : null,
        currency: terms.currency, payment_schedule: terms.payment_schedule,
        selected_clauses: selectedClauses,
        scope_description: terms.scope_description,
        deliverables: terms.deliverables_text ? terms.deliverables_text.split(',').map((d: string) => d.trim()).filter(Boolean) : [],
        notice_period_days: parseInt(terms.notice_period_days) || 14,
        warranty_days: parseInt(terms.warranty_days) || 30,
      };
      const res = await fetch('/api/contract-builder-standalone/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTimeout(() => { setResult(data); setLoading(false); }, 2400);
    } catch {
      setLoading(false);
    }
  };

  const reset = () => { setStep(0); setResult(null); setLoading(false); };

  if (!resolvedTheme) return null;
  const cs = commonStyles;
  const ts = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(cs.container, ts.container)}>
      <header className={cs.header}>
        <div className={cn(cs.headerBadge, ts.headerBadge)}>
          <Scale size={14} /> AI-Powered
        </div>
        <h1 className={cn(cs.title, ts.title)}>Contract Builder</h1>
        <p className={cn(cs.subtitle, ts.subtitle)}>Generate professional contracts, NDAs, and agreements in minutes</p>
      </header>

      {/* Stepper */}
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

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          {step === 0 && options && <StepType cs={cs} ts={ts} types={options.contract_types} selected={contractType} onSelect={setContractType} />}
          {step === 1 && <StepParties cs={cs} ts={ts} partyA={partyA} partyB={partyB} onChangeA={handleChangeA} onChangeB={handleChangeB} />}
          {step === 2 && options && <StepTerms cs={cs} ts={ts} terms={terms} jurisdictions={options.jurisdictions} onChange={handleTermChange} />}
          {step === 3 && <StepClauses cs={cs} ts={ts} clauses={clauses} selected={selectedClauses} onToggle={toggleClause} />}
          {step === 4 && loading && <ProcessingView cs={cs} ts={ts} />}
          {step === 4 && !loading && result && <ResultsDashboard cs={cs} ts={ts} result={result} fmt={fmt} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {!(step === 4 && loading) && (
        <div className={cs.navBar}>
          {step > 0 && step < 4 && (
            <button className={cn(cs.navButtonBack, ts.navButtonBack)} onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div className={cs.navSpacer} />
          {step < 3 && (
            <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={() => setStep(step + 1)}>
              Next <ArrowRight size={16} />
            </button>
          )}
          {step === 3 && (
            <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={handleSubmit}>
              Generate Contract <ArrowRight size={16} />
            </button>
          )}
          {step === 4 && result && (
            <div className={cs.actionsBar}>
              <button className={cn(cs.actionBtnSecondary, ts.actionBtnSecondary)} onClick={reset}>
                <RotateCcw size={16} /> New Contract
              </button>
              <button className={cn(cs.actionBtnPrimary, ts.actionBtnPrimary)} onClick={() => window.print()}>
                <Download size={16} /> Export
              </button>
            </div>
          )}
        </div>
      )}

      <div className={cn(cs.disclaimer, ts.disclaimer)}>
        Contracts generated are templates for reference only. Have a legal professional review before signing.
      </div>
    </div>
  );
}
