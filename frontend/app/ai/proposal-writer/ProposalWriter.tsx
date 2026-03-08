// @AI-HINT: AI Proposal Writer – multi-step wizard for generating winning freelancer proposals
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ArrowRight, ArrowLeft, RotateCcw, CheckCircle,
  Copy, Star, Target, Briefcase, User, Sparkles, Zap,
  Clock, Award, TrendingUp, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './ProposalWriter.common.module.css';
import lightStyles from './ProposalWriter.light.module.css';
import darkStyles from './ProposalWriter.dark.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ToneOption { key: string; label: string; description: string }
interface LengthOption { key: string; label: string; description: string }

interface OptionsData {
  tones: ToneOption[];
  lengths: LengthOption[];
  experience_levels: string[];
}

interface MatchedSkill { skill: string; mentioned_in_description: boolean; relevant_to_type: boolean }

interface ProposalResult {
  proposal: string;
  word_count: number;
  detected_project_type: { primary: string; confidence: number; all_matches: { type: string; keyword_matches: number }[] };
  skill_match: { matched_skills: MatchedSkill[]; other_skills: string[]; match_percentage: number; match_level: string; missing_signals: string[] };
  suggested_rate: { recommended: number; range_low: number; range_high: number; currency: string; basis: string };
  proposal_score: { total: number; max: number; level: string; breakdown: Record<string, number> };
  tips: { type: string; tip: string; detail: string }[];
  meta: { tone: string; length: string; word_count: number; experience_level: string };
}

const STEPS = ['Project Details', 'Your Profile', 'Results'];

const EXPERIENCE_LEVELS = [
  { key: 'junior', label: 'Junior', desc: '0-2 years' },
  { key: 'mid', label: 'Mid-Level', desc: '2-5 years' },
  { key: 'senior', label: 'Senior', desc: '5-10 years' },
  { key: 'expert', label: 'Expert', desc: '10+ years' },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepProject({
  cs, ts, form, tones, lengths, onChange,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  form: Record<string, any>; tones: ToneOption[]; lengths: LengthOption[];
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>
        <Briefcase size={18} /> Project Details
      </h3>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Project Title</label>
        <input
          type="text" className={cn(cs.textInput, ts.textInput)}
          value={form.project_title} onChange={e => onChange('project_title', e.target.value)}
          placeholder="e.g. Build a Next.js E-commerce Platform" maxLength={200}
        />
      </div>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Project Description</label>
        <textarea
          className={cn(cs.textarea, ts.textarea)}
          value={form.project_description} onChange={e => onChange('project_description', e.target.value)}
          rows={4} placeholder="Describe the project, requirements, and what you're looking for..."
          maxLength={5000}
        />
      </div>

      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Tone</label>
          <div className={cs.toneGrid}>
            {tones.map(t => (
              <button
                key={t.key} type="button"
                onClick={() => onChange('tone', t.key)}
                className={cn(
                  cs.toneCard, ts.toneCard,
                  form.tone === t.key && cs.toneCardSelected,
                  form.tone === t.key && ts.toneCardSelected,
                )}
              >
                <span className={cs.toneLabel}>{t.label}</span>
                <span className={cn(cs.toneDesc, ts.toneDesc)}>{t.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Proposal Length</label>
        <div className={cs.lengthGrid}>
          {lengths.map(l => (
            <button
              key={l.key} type="button"
              onClick={() => onChange('length', l.key)}
              className={cn(
                cs.lengthCard, ts.lengthCard,
                form.length === l.key && cs.lengthCardSelected,
                form.length === l.key && ts.lengthCardSelected,
              )}
            >
              <span className={cs.lengthLabel}>{l.label}</span>
              <span className={cn(cs.lengthRange, ts.lengthRange)}>{l.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepProfile({
  cs, ts, form, onChange,
}: {
  cs: typeof commonStyles; ts: typeof lightStyles;
  form: Record<string, any>;
  onChange: (f: string, v: any) => void;
}) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>
        <User size={18} /> Your Profile
      </h3>

      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Your Name <span className={cn(cs.labelHint, ts.labelHint)}>(optional)</span></label>
          <input
            type="text" className={cn(cs.textInput, ts.textInput)}
            value={form.freelancer_name} onChange={e => onChange('freelancer_name', e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Years of Experience</label>
          <input
            type="number" className={cn(cs.numberInput, ts.numberInput)}
            value={form.years_experience} onChange={e => onChange('years_experience', e.target.value)}
            min={0} max={40}
          />
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
        <label className={cn(cs.label, ts.label)}>Your Skills <span className={cn(cs.labelHint, ts.labelHint)}>(comma separated)</span></label>
        <input
          type="text" className={cn(cs.textInput, ts.textInput)}
          value={form.freelancer_skills_text} onChange={e => onChange('freelancer_skills_text', e.target.value)}
          placeholder="react, next.js, typescript, node.js"
        />
      </div>

      <div className={cs.formGroup}>
        <label className={cn(cs.label, ts.label)}>Highlight Points <span className={cn(cs.labelHint, ts.labelHint)}>(comma separated, optional)</span></label>
        <input
          type="text" className={cn(cs.textInput, ts.textInput)}
          value={form.highlight_points_text} onChange={e => onChange('highlight_points_text', e.target.value)}
          placeholder="e.g. Led team of 5, Built apps for Fortune 500"
        />
      </div>

      <div className={cs.formRow}>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Proposed Rate ($/hr) <span className={cn(cs.labelHint, ts.labelHint)}>(optional)</span></label>
          <input
            type="number" className={cn(cs.numberInput, ts.numberInput)}
            value={form.proposed_rate} onChange={e => onChange('proposed_rate', e.target.value)}
            placeholder="auto" min={0}
          />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Timeline <span className={cn(cs.labelHint, ts.labelHint)}>(optional)</span></label>
          <input
            type="text" className={cn(cs.textInput, ts.textInput)}
            value={form.proposed_timeline} onChange={e => onChange('proposed_timeline', e.target.value)}
            placeholder="e.g. 4-6 weeks"
          />
        </div>
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>Country</label>
          <input
            type="text" className={cn(cs.textInput, ts.textInput)}
            value={form.country_code} onChange={e => onChange('country_code', e.target.value.toUpperCase())}
            placeholder="US" maxLength={2}
          />
        </div>
      </div>
    </div>
  );
}

function ProcessingView({ cs, ts }: { cs: typeof commonStyles; ts: typeof lightStyles }) {
  const steps = ['Analyzing project requirements...', 'Matching your skills...', 'Composing proposal...', 'Scoring & optimizing...'];
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cs.processingOrb}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}><FileText size={32} /></div>
      </div>
      <h3 className={cn(cs.formTitle, ts.formTitle)}>Writing Your Proposal</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>AI is crafting a winning proposal for this project</p>
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
  cs, ts, result,
}: { cs: typeof commonStyles; ts: typeof lightStyles; result: ProposalResult }) {
  const [copied, setCopied] = useState(false);
  const proposalRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.proposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      if (proposalRef.current) {
        const range = document.createRange();
        range.selectNodeContents(proposalRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <div className={cs.resultsContainer}>
      {/* Hero - Proposal Score */}
      <div className={cn(cs.priceHero, ts.priceHero)}>
        <div className={cs.priceHeroGlow} />
        <div className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>Proposal Score</div>
        <div className={cn(cs.priceHeroValue, ts.priceHeroValue)}>{result.proposal_score.total}/{result.proposal_score.max}</div>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <Award size={14} /> {result.proposal_score.level}
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            {result.word_count || result.meta.word_count} words
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            {result.detected_project_type.primary.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className={cs.resultsGrid}>
        {/* Proposal Text */}
        <div className={cn(cs.resultCard, ts.resultCard, cs.resultCardFullWidth)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><FileText size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Your Proposal</h4>
            <button className={cn(cs.copyBtn, ts.copyBtn)} onClick={handleCopy}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <div ref={proposalRef} className={cn(cs.proposalText, ts.proposalText)}>
            {result.proposal.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
        </div>

        {/* Score Dimensions */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Target size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Score Breakdown</h4>
          </div>
          {Object.entries(result.proposal_score.breakdown).map(([name, score], i) => (
            <div key={i} className={cs.scoreRow}>
              <div className={cs.scoreRowHeader}>
                <span className={cn(cs.scoreLabel, ts.scoreLabel)}>{name}</span>
                <span className={cn(cs.scoreValue, ts.scoreValue)}>{score}/25</span>
              </div>
              <div className={cs.scoreBarTrack}>
                <div
                  className={cn(cs.scoreBarFill, ts.scoreBarFill)}
                  style={{
                    width: `${(score / 25) * 100}%`,
                    background: score >= 20 ? '#27ae60' : score >= 12 ? '#f39c12' : '#e81123',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Skill Match */}
        <div className={cn(cs.resultCard, ts.resultCard)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Zap size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Skill Match ({result.skill_match.match_percentage}%)</h4>
          </div>
          <div className={cs.scoreBarTrack}>
            <div
              className={cn(cs.scoreBarFill, ts.scoreBarFill)}
              style={{ width: `${result.skill_match.match_percentage}%` }}
            />
          </div>
          {result.skill_match.matched_skills.length > 0 && (
            <>
              <h5 className={cn(cs.miniTitle, ts.miniTitle)}>Matched Skills</h5>
              <div className={cs.tagList}>
                {result.skill_match.matched_skills.map((s, i) => (
                  <span key={i} className={cn(cs.tag, ts.tagMatch)}>{s.skill}</span>
                ))}
              </div>
            </>
          )}
          {result.skill_match.missing_signals.length > 0 && (
            <>
              <h5 className={cn(cs.miniTitle, ts.miniTitle)}>Missing Signals</h5>
              <div className={cs.tagList}>
                {result.skill_match.missing_signals.map((s, i) => (
                  <span key={i} className={cn(cs.tag, ts.tagMissing)}>{s}</span>
                ))}
              </div>
            </>
          )}
          <div className={cs.rateRow}>
            <span className={cn(cs.rateLabel, ts.rateLabel)}>Suggested Rate</span>
            <span className={cn(cs.rateValue, ts.rateValue)}>${result.suggested_rate.recommended.toFixed(2)}/hr</span>
          </div>
        </div>

        {/* Tips */}
        <div className={cn(cs.resultCard, ts.resultCard, cs.resultCardFullWidth)}>
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Star size={18} /></div>
            <h4 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Improvement Tips</h4>
          </div>
          <div className={cs.recsGrid}>
            {result.tips.map((tip, i) => (
              <div key={i} className={cn(cs.recItem, ts.recItem)}>
                <div className={cn(cs.recTitle, ts.recTitle)}>{tip.tip}</div>
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

export default function ProposalWriter() {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [result, setResult] = useState<ProposalResult | null>(null);

  const [form, setForm] = useState<Record<string, any>>({
    project_title: '',
    project_description: '',
    tone: 'professional',
    length: 'standard',
    freelancer_name: '',
    years_experience: 3,
    experience_level: 'mid',
    freelancer_skills_text: '',
    highlight_points_text: '',
    proposed_rate: '',
    proposed_timeline: '',
    country_code: 'US',
  });

  useEffect(() => {
    fetch('/api/proposal-writer/options').then(r => r.json()).then(setOptions).catch(() => {});
  }, []);

  const handleChange = useCallback((f: string, v: any) => setForm(p => ({ ...p, [f]: v })), []);

  const handleSubmit = async () => {
    setStep(2);
    setLoading(true);
    try {
      const skills = form.freelancer_skills_text
        ? form.freelancer_skills_text.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const highlights = form.highlight_points_text
        ? form.highlight_points_text.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const body = {
        project_title: form.project_title || 'Untitled Project',
        project_description: form.project_description,
        freelancer_skills: skills,
        experience_level: form.experience_level,
        tone: form.tone,
        length: form.length,
        freelancer_name: form.freelancer_name || undefined,
        years_experience: parseInt(form.years_experience) || undefined,
        highlight_points: highlights.length > 0 ? highlights : undefined,
        proposed_rate: form.proposed_rate ? parseFloat(form.proposed_rate) : undefined,
        proposed_timeline: form.proposed_timeline || undefined,
        country_code: form.country_code || 'US',
      };
      const res = await fetch('/api/proposal-writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        <div className={cn(cs.headerBadge, ts.headerBadge)}><Sparkles size={14} /> AI-Powered</div>
        <h1 className={cn(cs.title, ts.title)}>Proposal Writer</h1>
        <p className={cn(cs.subtitle, ts.subtitle)}>Generate winning proposals with market-data-backed pricing</p>
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
          {step === 0 && options && <StepProject cs={cs} ts={ts} form={form} tones={options.tones} lengths={options.lengths} onChange={handleChange} />}
          {step === 1 && <StepProfile cs={cs} ts={ts} form={form} onChange={handleChange} />}
          {step === 2 && loading && <ProcessingView cs={cs} ts={ts} />}
          {step === 2 && !loading && result && <ResultsDashboard cs={cs} ts={ts} result={result} />}
        </motion.div>
      </AnimatePresence>

      {!(step === 2 && loading) && (
        <div className={cs.navBar}>
          {step > 0 && step < 2 && <button className={cn(cs.navButtonBack, ts.navButtonBack)} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>}
          <div className={cs.navSpacer} />
          {step === 0 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} disabled={!form.project_title.trim()} onClick={() => setStep(1)}>Next <ArrowRight size={16} /></button>}
          {step === 1 && <button className={cn(cs.navButtonNext, ts.navButtonNext)} onClick={handleSubmit}>Generate Proposal <ArrowRight size={16} /></button>}
          {step === 2 && result && (
            <div className={cs.actionsBar}>
              <button className={cn(cs.actionBtnSecondary, ts.actionBtnSecondary)} onClick={reset}><RotateCcw size={16} /> New Proposal</button>
            </div>
          )}
        </div>
      )}

      <div className={cn(cs.disclaimer, ts.disclaimer)}>
        AI-generated proposals should be reviewed and personalized before submission.
      </div>
    </div>
  );
}
