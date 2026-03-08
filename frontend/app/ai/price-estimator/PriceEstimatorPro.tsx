// @AI-HINT: General-purpose AI Price Estimator Pro — multi-step wizard with market-aware estimation, breakdown, ROI insights
'use client';

import React, { useState, useEffect, useCallback, useMemo, KeyboardEvent } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronLeft, ChevronRight, Check, Loader2, ArrowLeft,
  Code, Palette, Megaphone, PenTool, Video, Briefcase, BarChart3,
  Settings, GraduationCap, Camera, DollarSign, Clock, TrendingUp,
  Target, Layers, MapPin, Shield, Zap, Star, RotateCcw, Copy,
  Info, X, Plus, AlertTriangle, HelpCircle, BookOpen, Calculator,
  ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';

import commonStyles from './PriceEstimatorPro.common.module.css';
import lightStyles from './PriceEstimatorPro.light.module.css';
import darkStyles from './PriceEstimatorPro.dark.module.css';

/* ============================================================================
   Types
   ============================================================================ */

interface CategoryInfo {
  key: string;
  label: string;
  description: string;
  services: ServiceInfo[];
}

interface ServiceInfo {
  key: string;
  label: string;
  avg_rate: string;
  demand: string;
}

interface CountryInfo {
  code: string;
  name: string;
  region: string;
  flag: string;
  rate_multiplier: number;
  client_budget_multiplier: number;
  currency: string;
  ppp_index: number;
  cost_of_living: number;
}

interface RegionGroupInfo {
  key: string;
  label: string;
  icon: string;
  multiplier: number;
  countries: {
    code: string;
    name: string;
    flag: string;
    rate_multiplier: number;
    client_budget_multiplier: number;
    currency: string;
    cost_of_living: number;
  }[];
}

interface CategoriesData {
  categories: CategoryInfo[];
  experience_levels: string[];
  regions: RegionGroupInfo[];
  countries: CountryInfo[];
  urgency_options: string[];
  quality_tiers: string[];
  scope_options: string[];
}

interface RegionalAnalysis {
  has_country_data: boolean;
  client_country?: {
    code: string;
    name: string;
    flag: string;
    currency: string;
    cost_of_living: number;
    ppp_index: number;
    budget_multiplier: number;
  };
  freelancer_country?: {
    code: string;
    name: string;
    flag: string;
    currency: string;
    cost_of_living: number;
    rate_multiplier: number;
  };
  local_value_context?: {
    usd_total: number;
    ppp_adjusted: number;
    ppp_ratio: number;
    description: string;
  };
  pricing_context: { type: string; title: string; message: string }[];
  comparison_countries: {
    code: string;
    name: string;
    flag: string;
    hourly_rate: number;
    rate_multiplier: number;
    cost_of_living: number;
  }[];
}

interface EstimateResult {
  estimate: {
    hourly_rate: number;
    total_hours: number;
    total_estimate: number;
    low_estimate: number;
    high_estimate: number;
    currency: string;
  };
  breakdown: { label: string; category: string; hours: number; cost: number; percentage: number }[];
  confidence: { score: number; level: string; factors: { factor: string; impact: string }[] };
  market_comparison: {
    tiers: Record<string, { label: string; total: number; hourly: number }>;
    your_position: string;
    your_position_label: string;
  };
  factors: { label: string; value: string; impact: string; description: string; multiplier?: number }[];
  roi_insights: { type: string; title: string; message: string }[];
  timeline: { working_days: number; weeks: number; label: string; team_size: number; hours_per_day: number };
  regional_analysis?: RegionalAnalysis;
  demand_level: string;
  meta: {
    category: string;
    service_type: string;
    experience_level: string;
    region: string;
    client_country?: string;
    freelancer_country?: string;
    urgency: string;
    quality_tier: string;
    scope: string;
    team_size: number;
    generated_at: string;
  };
}

interface HoursQuestionOption {
  value: string;
  label: string;
  hours: number;
}

interface HoursQuestion {
  id: string;
  label: string;
  type: string;
  options: HoursQuestionOption[];
}

interface SmartHoursResult {
  estimated_hours: number;
  question_hours: number;
  adjusted_hours: number;
  template_hours: number | null;
  breakdown: { question: string; answer: string; hours: number }[];
  scope_multiplier: number;
  feature_bonus: number;
  low_hours: number;
  high_hours: number;
  confidence: string;
}

/* ============================================================================
   Constants
   ============================================================================ */

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  software_development: Code,
  design_creative: Palette,
  marketing_growth: Megaphone,
  writing_content: PenTool,
  video_animation: Video,
  consulting_strategy: Briefcase,
  data_analytics: BarChart3,
  engineering_technical: Settings,
  education_training: GraduationCap,
  photography_media: Camera,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  software_development: 'Web, mobile, APIs, DevOps & cloud',
  design_creative: 'UI/UX, branding, illustrations & print',
  marketing_growth: 'SEO, social media, PPC & email',
  writing_content: 'Copywriting, technical docs & translation',
  video_animation: 'Production, motion graphics & editing',
  consulting_strategy: 'Business, management & HR',
  data_analytics: 'Analysis, ML, visualization & BI',
  engineering_technical: 'CAD, electrical, mechanical & civil',
  education_training: 'Course creation, tutoring & e-learning',
  photography_media: 'Photo, editing, drone & events',
};

const STEP_LABELS = ['Category', 'Details', 'Settings', 'Results'];

const OPTION_IMPACTS: Record<string, Record<string, { desc: string; impact: string }>> = {
  experience: {
    junior: { desc: '0–2 years experience', impact: '−40% rate' },
    mid: { desc: '2–5 years experience', impact: 'Baseline rate' },
    senior: { desc: '5–10 years experience', impact: '+40% rate' },
    expert: { desc: '10+ years, specialist', impact: '+75% rate' },
  },
  urgency: {
    critical: { desc: 'Need it ASAP (24–48h)', impact: '+50% premium' },
    urgent: { desc: 'Fast turnaround (< 1 week)', impact: '+25% premium' },
    standard: { desc: 'Normal timeline', impact: 'No surcharge' },
    relaxed: { desc: 'Flexible deadline (> 1 month)', impact: '−15% discount' },
    ongoing: { desc: 'Long-term / retainer', impact: '−20% discount' },
  },
  quality: {
    budget: { desc: 'Basic quality, functional', impact: '−30% cost' },
    standard: { desc: 'Professional quality', impact: 'Baseline cost' },
    premium: { desc: 'Top-tier, polished output', impact: '+40% cost' },
    enterprise: { desc: 'Mission-critical, best-in-class', impact: '+80% cost' },
  },
  scope: {
    minimal: { desc: 'Quick task or micro-project', impact: '~10 hours base' },
    small: { desc: 'A few days of work', impact: '~25 hours base' },
    medium: { desc: '1–2 weeks of work', impact: '~60 hours base' },
    large: { desc: '1–2 months of work', impact: '~120 hours base' },
    enterprise: { desc: '3+ months, large team', impact: '~250 hours base' },
  },
};

const STEP_GUIDANCE: Record<number, { icon: React.ElementType; title: string; text: string }> = {
  0: {
    icon: Lightbulb,
    title: 'Category & Service',
    text: 'Your choice here sets the base hourly rate range. Different categories have vastly different market rates — software development averages $50–200/hr while writing may be $25–100/hr.',
  },
  1: {
    icon: Calculator,
    title: 'Details Improve Accuracy',
    text: 'Adding features and a description helps the engine break down costs more precisely. Don\'t know your hours? Use the Smart Hours Calculator below to get an AI-assisted estimate based on your project\'s complexity.',
  },
  2: {
    icon: Settings,
    title: 'Settings Fine-Tune Price',
    text: 'Each setting applies a multiplier to the base rate. Experience level has the biggest impact (±75%), followed by quality tier (±80%), urgency (±50%), and scope (project size). Country selection overrides regional pricing.',
  },
};

/* ============================================================================
   Component
   ============================================================================ */

export default function PriceEstimatorPro() {
  const { resolvedTheme } = useTheme();
  const t = resolvedTheme === 'light' ? lightStyles : darkStyles;

  /* ----- State ----- */
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<CategoriesData | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [region, setRegion] = useState('north_america');
  const [urgency, setUrgency] = useState('standard');
  const [qualityTier, setQualityTier] = useState('standard');
  const [scope, setScope] = useState('medium');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [teamSize, setTeamSize] = useState(1);

  // Country selectors
  const [clientCountry, setClientCountry] = useState('');
  const [freelancerCountry, setFreelancerCountry] = useState('');

  // Smart Hours Wizard
  const [showHoursWizard, setShowHoursWizard] = useState(false);
  const [hoursQuestions, setHoursQuestions] = useState<HoursQuestion[]>([]);
  const [hoursAnswers, setHoursAnswers] = useState<Record<string, string>>({});
  const [hoursResult, setHoursResult] = useState<SmartHoursResult | null>(null);
  const [loadingHours, setLoadingHours] = useState(false);

  // Processing animation
  const [processingStep, setProcessingStep] = useState(0);

  /* ----- Load categories from backend ----- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/price-estimator/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data: CategoriesData = await res.json();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setError('Could not load categories. Is the backend running?');
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ----- Derived ----- */
  const currentCategoryServices = useMemo(() => {
    if (!categories || !selectedCategory) return [];
    return categories.categories.find(c => c.key === selectedCategory)?.services ?? [];
  }, [categories, selectedCategory]);

  /* ----- Fetch hours questions when category changes ----- */
  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/price-estimator/hours-questions/${encodeURIComponent(selectedCategory)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setHoursQuestions(data.questions || []);
          setHoursAnswers({});
          setHoursResult(null);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [selectedCategory]);

  /* ----- Calculate smart hours ----- */
  const calculateSmartHours = useCallback(async () => {
    if (Object.keys(hoursAnswers).length === 0) return;
    setLoadingHours(true);
    try {
      const res = await fetch('/api/price-estimator/estimate-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          service_type: selectedService,
          scope,
          answers: hoursAnswers,
          features: features.length > 0 ? features : undefined,
        }),
      });
      if (!res.ok) return;
      const data: SmartHoursResult = await res.json();
      setHoursResult(data);
    } catch { /* ignore */ }
    finally { setLoadingHours(false); }
  }, [hoursAnswers, selectedCategory, selectedService, scope, features]);

  const applySmartHours = useCallback(() => {
    if (hoursResult) {
      setEstimatedHours(hoursResult.estimated_hours);
    }
  }, [hoursResult]);

  /* ----- Handlers ----- */
  const selectCategory = useCallback((key: string) => {
    setSelectedCategory(key);
    setSelectedService('');
  }, []);

  const selectService = useCallback((key: string) => {
    setSelectedService(key);
    setStep(1); // auto-advance to details
  }, []);

  const addFeature = useCallback(() => {
    const val = featureInput.trim();
    if (val && !features.includes(val) && features.length < 20) {
      setFeatures(prev => [...prev, val]);
      setFeatureInput('');
    }
  }, [featureInput, features]);

  const removeFeature = useCallback((f: string) => {
    setFeatures(prev => prev.filter(x => x !== f));
  }, []);

  const handleFeatureKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addFeature(); }
  }, [addFeature]);

  const canProceedStep1 = selectedCategory && selectedService;
  const canProceedStep2 = true; // details are all optional

  /* ----- Submit estimate ----- */
  const submitEstimate = useCallback(async () => {
    setStep(3);
    setLoadingEstimate(true);
    setProcessingStep(0);
    setResult(null);
    setError(null);

    // Animate processing steps
    const timers = [
      setTimeout(() => setProcessingStep(1), 600),
      setTimeout(() => setProcessingStep(2), 1400),
      setTimeout(() => setProcessingStep(3), 2200),
    ];

    try {
      const body = {
        category: selectedCategory,
        service_type: selectedService,
        experience_level: experienceLevel,
        region,
        urgency,
        quality_tier: qualityTier,
        scope,
        estimated_hours: estimatedHours || undefined,
        description: description || "",
        features: features.length > 0 ? features : undefined,
        team_size: teamSize,
        client_country: clientCountry || undefined,
        freelancer_country: freelancerCountry || undefined,
      };

      const res = await fetch('/api/price-estimator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Estimation failed');
      }

      const data: EstimateResult = await res.json();
      // Min delay so the processing animation is visible
      await new Promise(r => setTimeout(r, 800));
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Estimation failed');
    } finally {
      timers.forEach(clearTimeout);
      setLoadingEstimate(false);
    }
  }, [selectedCategory, selectedService, experienceLevel, region, urgency, qualityTier, scope, estimatedHours, description, features, teamSize, clientCountry, freelancerCountry]);

  /* ----- Reset ----- */
  const resetAll = useCallback(() => {
    setStep(0);
    setSelectedCategory('');
    setSelectedService('');
    setExperienceLevel('mid');
    setRegion('north_america');
    setUrgency('standard');
    setQualityTier('standard');
    setScope('medium');
    setEstimatedHours('');
    setDescription('');
    setFeatures([]);
    setFeatureInput('');
    setTeamSize(1);
    setClientCountry('');
    setFreelancerCountry('');
    setShowHoursWizard(false);
    setHoursQuestions([]);
    setHoursAnswers({});
    setHoursResult(null);
    setResult(null);
    setError(null);
  }, []);

  const copyEstimate = useCallback(() => {
    if (!result) return;
    const ra = result.regional_analysis;
    const text = [
      `AI Price Estimate — ${result.meta.category} / ${result.meta.service_type}`,
      `Total: $${fmt(result.estimate.total_estimate)} ($${fmt(result.estimate.low_estimate)} – $${fmt(result.estimate.high_estimate)})`,
      `Hourly Rate: $${result.estimate.hourly_rate}/hr`,
      `Hours: ${result.estimate.total_hours}`,
      `Confidence: ${result.confidence.score}%`,
      `Region: ${result.meta.region}`,
      ...(ra?.client_country ? [`Client Country: ${ra.client_country.flag} ${ra.client_country.name}`] : []),
      ...(ra?.freelancer_country ? [`Freelancer Country: ${ra.freelancer_country.flag} ${ra.freelancer_country.name}`] : []),
      `Experience: ${result.meta.experience_level}`,
      '',
      'Breakdown:',
      ...result.breakdown.map(b => `  ${b.label}: $${fmt(b.cost)} (${b.hours}h)`),
      ...(ra?.local_value_context ? ['', `PPP Context: ${ra.local_value_context.description}`] : []),
    ].join('\n');
    navigator.clipboard.writeText(text);
  }, [result]);

  /* ----- Guard ----- */

  if (loadingCats) {
    return (
      <div className={cn(commonStyles.container, t.container)}>
        <div className={commonStyles.loadingContainer}>
          <Loader2 className={commonStyles.loadingIcon} />
          <span>Loading price estimator…</span>
        </div>
      </div>
    );
  }

  if (error && !result && step !== 3) {
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
            <Sparkles /> AI-Powered Estimation Engine
          </span>
          <h1 className={cn(commonStyles.title, t.title)}>
            Price <span className={commonStyles.titleAccent}>Estimator Pro</span>
          </h1>
          <p className={cn(commonStyles.subtitle, t.subtitle)}>
            Get instant, market-aware pricing for any service — powered by real industry data across 10 categories and 100+ service types.
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
            {/* Contextual guidance tip */}
            {step < 3 && STEP_GUIDANCE[step] && (
              <GuidanceTip
                icon={STEP_GUIDANCE[step].icon}
                title={STEP_GUIDANCE[step].title}
                text={STEP_GUIDANCE[step].text}
                cs={commonStyles}
                ts={t}
              />
            )}

            {step === 0 && (
              <StepCategory
                categories={categories!}
                selectedCategory={selectedCategory}
                selectedService={selectedService}
                currentCategoryServices={currentCategoryServices}
                onSelectCategory={selectCategory}
                onSelectService={selectService}
                onBack={() => { setSelectedCategory(''); setSelectedService(''); }}
                cs={commonStyles}
                ts={t}
              />
            )}

            {step === 1 && (
              <StepDetails
                description={description}
                setDescription={setDescription}
                features={features}
                featureInput={featureInput}
                setFeatureInput={setFeatureInput}
                onAddFeature={addFeature}
                onRemoveFeature={removeFeature}
                onFeatureKeyDown={handleFeatureKeyDown}
                estimatedHours={estimatedHours}
                setEstimatedHours={setEstimatedHours}
                teamSize={teamSize}
                setTeamSize={setTeamSize}
                showHoursWizard={showHoursWizard}
                setShowHoursWizard={setShowHoursWizard}
                hoursQuestions={hoursQuestions}
                hoursAnswers={hoursAnswers}
                setHoursAnswers={setHoursAnswers}
                hoursResult={hoursResult}
                loadingHours={loadingHours}
                onCalculateHours={calculateSmartHours}
                onApplyHours={applySmartHours}
                cs={commonStyles}
                ts={t}
              />
            )}

            {step === 2 && (
              <StepSettings
                categories={categories!}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                region={region}
                setRegion={setRegion}
                urgency={urgency}
                setUrgency={setUrgency}
                qualityTier={qualityTier}
                setQualityTier={setQualityTier}
                scope={scope}
                setScope={setScope}
                clientCountry={clientCountry}
                setClientCountry={setClientCountry}
                freelancerCountry={freelancerCountry}
                setFreelancerCountry={setFreelancerCountry}
                cs={commonStyles}
                ts={t}
              />
            )}

            {step === 3 && (
              loadingEstimate || !result ? (
                <ProcessingView step={processingStep} error={error} cs={commonStyles} ts={t} />
              ) : (
                <ResultsDashboard
                  result={result}
                  onReset={resetAll}
                  onCopy={copyEstimate}
                  cs={commonStyles}
                  ts={t}
                />
              )
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 3 && (
          <div className={commonStyles.navigation}>
            <button
              className={cn(commonStyles.navButton, t.navButtonBack)}
              disabled={step === 0 && !selectedCategory}
              onClick={() => {
                if (step === 0 && selectedCategory && !selectedService) {
                  setSelectedCategory('');
                } else if (step > 0) {
                  setStep(s => s - 1);
                }
              }}
            >
              <ChevronLeft size={18} /> Back
            </button>
            <button
              className={cn(commonStyles.navButton, t.navButtonNext)}
              disabled={step === 0 ? !canProceedStep1 : step === 1 ? !canProceedStep2 : false}
              onClick={() => {
                if (step === 2) {
                  submitEstimate();
                } else {
                  setStep(s => s + 1);
                }
              }}
            >
              {step === 2 ? 'Generate Estimate' : 'Continue'} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className={cn(commonStyles.disclaimer, t.disclaimer)}>
          <Info size={14} />
          <span>
            Estimates are based on global market rate data and may vary based on specific requirements,
            provider expertise, and market conditions. Use as a reference guide for budgeting purposes.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Step 0: Category & Service Selection
   ============================================================================ */

interface StepCategoryProps {
  categories: CategoriesData;
  selectedCategory: string;
  selectedService: string;
  currentCategoryServices: ServiceInfo[];
  onSelectCategory: (key: string) => void;
  onSelectService: (key: string) => void;
  onBack: () => void;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function StepCategory({ categories, selectedCategory, currentCategoryServices, onSelectCategory, onSelectService, selectedService, onBack, cs, ts }: StepCategoryProps) {
  if (!selectedCategory) {
    return (
      <>
        <div className={cs.categoryGrid}>
          {categories.categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat.key] || Briefcase;
            return (
              <motion.div
                key={cat.key}
                className={cn(cs.categoryCard, ts.categoryCard)}
                onClick={() => onSelectCategory(cat.key)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectCategory(cat.key); }}
                aria-label={`Select ${cat.label}`}
              >
                <div className={cn(cs.categoryIconBox, ts.categoryIconBox)}>
                  <Icon />
                </div>
                <div className={cs.categoryInfo}>
                  <p className={cn(cs.categoryName, ts.categoryName)}>{cat.label}</p>
                  <p className={cn(cs.categoryDescription, ts.categoryDescription)}>
                    {CATEGORY_DESCRIPTIONS[cat.key] || cat.description}
                  </p>
                  <p className={cn(cs.categoryServiceCount, ts.categoryServiceCount)}>
                    {cat.services.length} services
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </>
    );
  }

  // Service selection sub-view
  const catLabel = categories.categories.find(c => c.key === selectedCategory)?.label ?? selectedCategory;

  return (
    <>
      <button className={cn(cs.backLink, ts.backLink)} onClick={onBack} aria-label="Back to categories">
        <ArrowLeft /> {catLabel}
      </button>
      <div className={cs.serviceGrid}>
        {currentCategoryServices.map(svc => (
          <motion.div
            key={svc.key}
            className={cn(
              cs.serviceCard,
              ts.serviceCard,
              selectedService === svc.key && ts.serviceCardSelected
            )}
            onClick={() => onSelectService(svc.key)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectService(svc.key); }}
            aria-label={`Select ${svc.label}`}
          >
            <p className={cn(cs.serviceLabel, ts.serviceLabel)}>{svc.label}</p>
            <span className={cn(cs.serviceRate, ts.serviceRate)}>${typeof svc.avg_rate === 'number' ? svc.avg_rate : svc.avg_rate}/hr</span>
            <span
              className={cn(
                cs.serviceDemand,
                svc.demand === 'high' ? ts.serviceDemandHigh :
                svc.demand === 'medium' ? ts.serviceDemandMedium : ts.serviceDemandLow
              )}
            >
              {svc.demand}
            </span>
          </motion.div>
        ))}
      </div>
    </>
  );
}

/* ============================================================================
   Step 1: Project Details
   ============================================================================ */

interface StepDetailsProps {
  description: string;
  setDescription: (v: string) => void;
  features: string[];
  featureInput: string;
  setFeatureInput: (v: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (f: string) => void;
  onFeatureKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  estimatedHours: number | '';
  setEstimatedHours: (v: number | '') => void;
  teamSize: number;
  setTeamSize: (v: number) => void;
  showHoursWizard: boolean;
  setShowHoursWizard: (v: boolean) => void;
  hoursQuestions: HoursQuestion[];
  hoursAnswers: Record<string, string>;
  setHoursAnswers: (v: Record<string, string>) => void;
  hoursResult: SmartHoursResult | null;
  loadingHours: boolean;
  onCalculateHours: () => void;
  onApplyHours: () => void;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function StepDetails({ description, setDescription, features, featureInput, setFeatureInput, onAddFeature, onRemoveFeature, onFeatureKeyDown, estimatedHours, setEstimatedHours, teamSize, setTeamSize, showHoursWizard, setShowHoursWizard, hoursQuestions, hoursAnswers, setHoursAnswers, hoursResult, loadingHours, onCalculateHours, onApplyHours, cs, ts }: StepDetailsProps) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <div className={cs.formGrid}>
        {/* Description */}
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>
            <PenTool /> Project Description
            <span className={cn(cs.labelHint, ts.labelHint)}>Optional — improves accuracy</span>
          </label>
          <textarea
            className={cn(cs.textarea, ts.textarea)}
            placeholder="Briefly describe what you need — e.g., 'E-commerce website with user accounts, product catalog, cart, and payments'"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Features */}
        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>
            <Layers /> Key Features / Deliverables
            <span className={cn(cs.labelHint, ts.labelHint)}>{features.length}/20</span>
          </label>
          <p className={cn(cs.fieldHint, ts.fieldHint)}>
            Each feature adds ~3% to the estimated hours (capped at +50%). Add core features for better accuracy.
          </p>
          {features.length > 0 && (
            <div className={cs.featuresList}>
              {features.map(f => (
                <span key={f} className={cn(cs.featureTag, ts.featureTag)}>
                  {f}
                  <button className={cn(cs.featureTagRemove, ts.featureTagRemove)} onClick={() => onRemoveFeature(f)} aria-label={`Remove ${f}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={cs.addFeatureRow}>
            <input
              className={cn(cs.addFeatureInput, ts.addFeatureInput)}
              placeholder="Add a feature and press Enter"
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              onKeyDown={onFeatureKeyDown}
            />
            <button className={cn(cs.addFeatureBtn, ts.addFeatureBtn)} onClick={onAddFeature} type="button">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Hours & Team */}
        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              <Clock /> Estimated Hours
              <span className={cn(cs.labelHint, ts.labelHint)}>Optional</span>
            </label>
            <input
              type="number"
              className={cn(cs.numberInput, ts.numberInput)}
              placeholder="e.g. 160"
              value={estimatedHours}
              onChange={e => setEstimatedHours(e.target.value ? parseInt(e.target.value, 10) : '')}
              min={1}
              max={10000}
            />
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              <Briefcase /> Team Size
            </label>
            <p className={cn(cs.fieldHint, ts.fieldHint)}>
              More team members = coordination overhead (+70% hours per person)
            </p>
            <input
              type="number"
              className={cn(cs.numberInput, ts.numberInput)}
              value={teamSize}
              onChange={e => setTeamSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min={1}
              max={50}
            />
          </div>
        </div>

        {/* Smart Hours Wizard Toggle */}
        {hoursQuestions.length > 0 && (
          <div className={cs.hoursWizardSection}>
            <button
              className={cn(cs.hoursWizardToggle, ts.hoursWizardToggle)}
              onClick={() => setShowHoursWizard(!showHoursWizard)}
              type="button"
            >
              <HelpCircle size={18} />
              <span>Don&apos;t know your hours? Use the Smart Hours Calculator</span>
              {showHoursWizard ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showHoursWizard && (
              <motion.div
                className={cn(cs.hoursWizard, ts.hoursWizard)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <p className={cn(cs.hoursWizardIntro, ts.hoursWizardIntro)}>
                  Answer these questions about your project and we&apos;ll estimate the hours for you.
                </p>

                <div className={cs.wizardQuestions}>
                  {hoursQuestions.map(q => (
                    <div key={q.id} className={cs.wizardQuestionGroup}>
                      <label className={cn(cs.wizardQuestionLabel, ts.wizardQuestionLabel)}>
                        {q.label}
                      </label>
                      <div className={cs.wizardOptionGrid}>
                        {q.options.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            className={cn(
                              cs.wizardOption,
                              ts.wizardOption,
                              hoursAnswers[q.id] === opt.value && cs.wizardOptionSelected,
                              hoursAnswers[q.id] === opt.value && ts.wizardOptionSelected,
                            )}
                            onClick={() => setHoursAnswers({ ...hoursAnswers, [q.id]: opt.value })}
                          >
                            <span className={cs.wizardOptionLabel}>{opt.label}</span>
                            <span className={cn(cs.wizardOptionHours, ts.wizardOptionHours)}>
                              +{opt.hours}h
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className={cn(cs.wizardCalcBtn, ts.wizardCalcBtn)}
                  onClick={onCalculateHours}
                  disabled={Object.keys(hoursAnswers).length === 0 || loadingHours}
                  type="button"
                >
                  {loadingHours ? <Loader2 size={16} className={cs.loadingIcon} /> : <Calculator size={16} />}
                  {loadingHours ? 'Calculating…' : 'Calculate Hours'}
                </button>

                {hoursResult && (
                  <div className={cn(cs.hoursResultCard, ts.hoursResultCard)}>
                    <div className={cs.hoursResultHeader}>
                      <div className={cs.hoursResultMain}>
                        <span className={cn(cs.hoursResultValue, ts.hoursResultValue)}>
                          {hoursResult.estimated_hours}h
                        </span>
                        <span className={cn(cs.hoursResultRange, ts.hoursResultRange)}>
                          ({hoursResult.low_hours}–{hoursResult.high_hours} hours range)
                        </span>
                      </div>
                      <span className={cn(
                        cs.hoursConfidence,
                        hoursResult.confidence === 'high' ? ts.confidenceHigh :
                        hoursResult.confidence === 'medium' ? ts.confidenceMedium : ts.confidenceLow
                      )}>
                        {hoursResult.confidence} confidence
                      </span>
                    </div>
                    <div className={cs.hoursBreakdown}>
                      {hoursResult.breakdown.map((b, i) => (
                        <div key={i} className={cn(cs.hoursBreakdownItem, ts.hoursBreakdownItem)}>
                          <span>{b.answer}</span>
                          <span className={cn(cs.hoursBreakdownHours, ts.hoursBreakdownHours)}>+{b.hours}h</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className={cn(cs.hoursApplyBtn, ts.hoursApplyBtn)}
                      onClick={onApplyHours}
                      type="button"
                    >
                      <Check size={16} /> Use {hoursResult.estimated_hours} hours
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   Step 2: Settings (Experience, Region, Urgency, Quality, Scope)
   ============================================================================ */

interface StepSettingsProps {
  categories: CategoriesData;
  experienceLevel: string;
  setExperienceLevel: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  urgency: string;
  setUrgency: (v: string) => void;
  qualityTier: string;
  setQualityTier: (v: string) => void;
  scope: string;
  setScope: (v: string) => void;
  clientCountry: string;
  setClientCountry: (v: string) => void;
  freelancerCountry: string;
  setFreelancerCountry: (v: string) => void;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function StepSettings({ categories, experienceLevel, setExperienceLevel, region, setRegion, urgency, setUrgency, qualityTier, setQualityTier, scope, setScope, clientCountry, setClientCountry, freelancerCountry, setFreelancerCountry, cs, ts }: StepSettingsProps) {
  return (
    <div className={cn(cs.formCard, ts.formCard)}>
      <div className={cs.formGrid}>
        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              <Star /> Experience Level
            </label>
            <select
              className={cn(cs.select, ts.select)}
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}
            >
              {categories.experience_levels.map(l => (
                <option key={l} value={l}>
                  {formatLabel(l)}
                </option>
              ))}
            </select>
            {OPTION_IMPACTS.experience[experienceLevel] && (
              <OptionImpact
                desc={OPTION_IMPACTS.experience[experienceLevel].desc}
                impact={OPTION_IMPACTS.experience[experienceLevel].impact}
                cs={cs}
                ts={ts}
              />
            )}
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              <MapPin /> Fallback Region
            </label>
            <select
              className={cn(cs.select, ts.select)}
              value={region}
              onChange={e => setRegion(e.target.value)}
            >
              {categories.regions.map(r => (
                <option key={r.key} value={r.key}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
            <p className={cn(cs.fieldHint, ts.fieldHint)}>
              Used only if no country is selected below
            </p>
          </div>
        </div>

        {/* Country Selectors */}
        <div className={cs.countrySection}>
          <label className={cn(cs.label, ts.label)} style={{ marginBottom: '4px' }}>
            <MapPin /> Location-Based Pricing
            <span className={cn(cs.labelHint, ts.labelHint)}>Optional — overrides region</span>
          </label>
          <div className={cs.countryRow}>
            <CountrySelector
              label="Client Location"
              placeholder="Where is the client based?"
              regions={categories.regions}
              selectedCode={clientCountry}
              onSelect={setClientCountry}
              cs={cs}
              ts={ts}
            />
            <CountrySelector
              label="Freelancer Location"
              placeholder="Where is the freelancer based?"
              regions={categories.regions}
              selectedCode={freelancerCountry}
              onSelect={setFreelancerCountry}
              cs={cs}
              ts={ts}
            />
          </div>
        </div>

        <div className={cs.formRow}>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              <Zap /> Urgency
            </label>
            <select
              className={cn(cs.select, ts.select)}
              value={urgency}
              onChange={e => setUrgency(e.target.value)}
            >
              {categories.urgency_options.map(u => (
                <option key={u} value={u}>
                  {formatLabel(u)}
                </option>
              ))}
            </select>
            {OPTION_IMPACTS.urgency[urgency] && (
              <OptionImpact
                desc={OPTION_IMPACTS.urgency[urgency].desc}
                impact={OPTION_IMPACTS.urgency[urgency].impact}
                cs={cs}
                ts={ts}
              />
            )}
          </div>
          <div className={cs.formGroup}>
            <label className={cn(cs.label, ts.label)}>
              <Shield /> Quality Tier
            </label>
            <select
              className={cn(cs.select, ts.select)}
              value={qualityTier}
              onChange={e => setQualityTier(e.target.value)}
            >
              {categories.quality_tiers.map(q => (
                <option key={q} value={q}>
                  {formatLabel(q)}
                </option>
              ))}
            </select>
            {OPTION_IMPACTS.quality[qualityTier] && (
              <OptionImpact
                desc={OPTION_IMPACTS.quality[qualityTier].desc}
                impact={OPTION_IMPACTS.quality[qualityTier].impact}
                cs={cs}
                ts={ts}
              />
            )}
          </div>
        </div>

        <div className={cs.formGroup}>
          <label className={cn(cs.label, ts.label)}>
            <Target /> Project Scope
          </label>
          <select
            className={cn(cs.select, ts.select)}
            value={scope}
            onChange={e => setScope(e.target.value)}
          >
            {categories.scope_options.map(s => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
          {OPTION_IMPACTS.scope[scope] && (
            <OptionImpact
              desc={OPTION_IMPACTS.scope[scope].desc}
              impact={OPTION_IMPACTS.scope[scope].impact}
              cs={cs}
              ts={ts}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Processing View
   ============================================================================ */

interface ProcessingViewProps {
  step: number;
  error: string | null;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

const PROCESSING_LABELS = [
  'Analyzing market data…',
  'Calculating regional pricing…',
  'Building cost breakdown…',
  'Generating insights…',
];

function ProcessingView({ step: pStep, error, cs, ts }: ProcessingViewProps) {
  if (error) {
    return (
      <div className={cn(cs.processingContainer, ts.processingContainer)}>
        <AlertTriangle size={48} />
        <h3 className={cs.processingTitle}>Estimation Failed</h3>
        <p className={cs.processingSubtitle}>{error}</p>
      </div>
    );
  }
  return (
    <div className={cn(cs.processingContainer, ts.processingContainer)}>
      <div className={cn(cs.processingOrb, ts.processingOrb)}>
        <div className={cn(cs.processingOrbInner, ts.processingOrbInner)}>
          <Sparkles />
        </div>
      </div>
      <h3 className={cs.processingTitle}>Crunching the Numbers</h3>
      <p className={cn(cs.processingSubtitle, ts.processingSubtitle)}>
        Analyzing industry rates from global market data
      </p>
      <div className={cs.processingSteps}>
        {PROCESSING_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(cs.processingStep, i <= pStep && cs.active)}
            style={{ opacity: i <= pStep ? 1 : 0.35 }}
          >
            {i < pStep ? (
              <Check size={20} className={cs.processingStepCheck} />
            ) : (
              <div className={cn(cs.processingStepCircle, ts.processingStepCircle)} />
            )}
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
  result: EstimateResult;
  onReset: () => void;
  onCopy: () => void;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function ResultsDashboard({ result, onReset, onCopy, cs, ts }: ResultsDashboardProps) {
  const { estimate, breakdown, confidence, market_comparison, factors: pricingFactors, roi_insights, timeline, regional_analysis } = result;
  const maxBreakdownCost = Math.max(...breakdown.map(b => b.cost));

  // Build market tier bars (relative widths)
  const tierEntries = Object.entries(market_comparison.tiers);
  const tierMaxTotal = Math.max(
    ...tierEntries.map(([, v]) => v.total)
  );

  return (
    <div className={cs.resultsContainer}>
      {/* Price Hero */}
      <motion.div
        className={cn(cs.priceHero, ts.priceHero)}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={cn(cs.priceHeroGlow, ts.priceHeroGlow)} />
        <p className={cn(cs.priceHeroLabel, ts.priceHeroLabel)}>Estimated Project Cost</p>
        <div className={cs.priceHeroRange}>
          <span className={cn(cs.priceHeroValue, ts.priceHeroValue)}>
            ${fmt(estimate.low_estimate)}
          </span>
          <span className={cn(cs.priceHeroDivider, ts.priceHeroDivider)}>—</span>
          <span className={cn(cs.priceHeroValue, ts.priceHeroValue)}>
            ${fmt(estimate.high_estimate)}
          </span>
        </div>
        <div className={cs.priceHeroMeta}>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <DollarSign /> ${estimate.hourly_rate}/hr
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <Clock /> {estimate.total_hours} hours
          </span>
          <span className={cn(cs.priceHeroMetaItem, ts.priceHeroMetaItem)}>
            <TrendingUp /> {confidence.score}% confidence
          </span>
        </div>
      </motion.div>

      {/* Grid */}
      <div className={cs.resultsGrid}>
        {/* Breakdown Card */}
        <motion.div
          className={cn(cs.resultCard, ts.resultCard)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Layers /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Cost Breakdown</h3>
          </div>
          <div className={cs.breakdownList}>
            {breakdown.map(item => (
              <div key={item.label} className={cs.breakdownItem}>
                <div className={cs.breakdownItemRow}>
                  <span className={cn(cs.breakdownItemLabel, ts.breakdownItemLabel)}>{item.label}</span>
                  <span className={cn(cs.breakdownItemValue, ts.breakdownItemValue)}>
                    ${fmt(item.cost)}
                    <span className={cn(cs.breakdownItemHours, ts.breakdownItemHours)}> · {item.hours}h</span>
                  </span>
                </div>
                <div className={cn(cs.progressBar, ts.progressBar)}>
                  <div
                    className={cn(cs.progressFill, ts.progressFill)}
                    style={{ width: `${maxBreakdownCost > 0 ? (item.cost / maxBreakdownCost) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Market Comparison Card */}
        <motion.div
          className={cn(cs.resultCard, ts.resultCard)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><BarChart3 /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Market Comparison</h3>
          </div>
          <div className={cs.marketTiers}>
            {tierEntries.map(([tier, data]) => {
              const width = tierMaxTotal > 0 ? (data.total / tierMaxTotal) * 100 : 0;
              const isYours = tier === market_comparison.your_position;
              return (
                <div key={tier} className={cn(cs.marketTier, ts.marketTier, isYours && ts.marketTierActive)}>
                  <span className={cn(cs.marketTierLabel, ts.marketTierLabel)}>{data.label}</span>
                  <div className={cn(cs.marketTierBar, ts.marketTierBar)}>
                    <div className={cn(cs.marketTierFill, ts.marketTierFill)} style={{ width: `${width}%` }} />
                  </div>
                  <span className={cn(cs.marketTierValue, ts.marketTierValue)}>${fmt(data.total)}</span>
                </div>
              );
            })}
          </div>
          <div className={cn(cs.marketPosition, ts.marketPosition)}>
            <Target size={16} />
            Your estimate: ${fmt(estimate.total_estimate)} (${estimate.hourly_rate}/hr)
          </div>
        </motion.div>

        {/* Pricing Factors */}
        <motion.div
          className={cn(cs.resultCard, ts.resultCard)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><TrendingUp /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Pricing Factors</h3>
          </div>
          <div className={cs.factorsGrid}>
            {pricingFactors.map((f) => {
              const indicator = f.impact === 'premium' ? 'factorUp' : f.impact === 'cost_saver' ? 'factorDown' : 'factorNeutral';
              return (
                <div key={f.label} className={cn(cs.factorItem, ts.factorItem)}>
                  <div className={cn(cs.factorIndicator, ts[indicator])} />
                  <div className={cs.factorContent}>
                    <div className={cn(cs.factorName, ts.factorName)}>{f.label}</div>
                    <div className={cn(cs.factorVal, ts.factorVal)}>{f.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          className={cn(cs.resultCard, ts.resultCard)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className={cs.resultCardHeader}>
            <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Clock /></div>
            <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Timeline Estimate</h3>
          </div>
          <div className={cs.timelineDisplay}>
            <div className={cs.timelineStat}>
              <p className={cn(cs.timelineStatValue, ts.timelineStatValue)}>
                {timeline.label}
              </p>
              <p className={cn(cs.timelineStatLabel, ts.timelineStatLabel)}>Duration</p>
            </div>
            <div className={cn(cs.timelineDivider, ts.timelineDivider)} />
            <div className={cs.timelineStat}>
              <p className={cn(cs.timelineStatValue, ts.timelineStatValue)}>
                {estimate.total_hours}
              </p>
              <p className={cn(cs.timelineStatLabel, ts.timelineStatLabel)}>Total Hours</p>
            </div>
            <div className={cn(cs.timelineDivider, ts.timelineDivider)} />
            <div className={cs.timelineStat}>
              <p className={cn(cs.timelineStatValue, ts.timelineStatValue)}>
                {timeline.team_size}
              </p>
              <p className={cn(cs.timelineStatLabel, ts.timelineStatLabel)}>Team Size</p>
            </div>
          </div>
        </motion.div>

        {/* ROI Insights - full width */}
        {roi_insights.length > 0 && (
          <motion.div
            className={cn(cs.resultCard, ts.resultCard, cs.fullWidthCard)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className={cs.resultCardHeader}>
              <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><Sparkles /></div>
              <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>ROI Insights</h3>
            </div>
            <div className={cs.roiList}>
              {roi_insights.map(insight => (
                <div key={insight.title} className={cn(cs.roiItem, ts.roiItem)}>
                  <div className={cn(cs.roiItemIcon, ts.roiItemIcon)}>
                    <TrendingUp />
                  </div>
                  <div className={cs.roiItemContent}>
                    <p className={cn(cs.roiItemTitle, ts.roiItemTitle)}>{insight.title}</p>
                    <p className={cn(cs.roiItemMessage, ts.roiItemMessage)}>{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regional Analysis - full width */}
        {regional_analysis?.has_country_data && (
          <RegionalAnalysisCard analysis={regional_analysis} cs={cs} ts={ts} />
        )}

        {/* Pricing Guide - full width */}
        <PricingGuideCard cs={cs} ts={ts} />
      </div>

      {/* Action Buttons */}
      <div className={cs.actionsBar}>
        <button className={cn(cs.actionBtn, ts.actionBtnPrimary)} onClick={onReset}>
          <RotateCcw /> New Estimate
        </button>
        <button className={cn(cs.actionBtn, ts.actionBtnSecondary)} onClick={onCopy}>
          <Copy /> Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   Country Selector — searchable dropdown grouped by region
   ============================================================================ */

interface CountrySelectorProps {
  label: string;
  placeholder: string;
  regions: RegionGroupInfo[];
  selectedCode: string;
  onSelect: (code: string) => void;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function CountrySelector({ label, placeholder, regions, selectedCode, onSelect, cs, ts }: CountrySelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Find selected country info
  const selectedInfo = useMemo(() => {
    if (!selectedCode) return null;
    for (const rg of regions) {
      const c = rg.countries.find(c => c.code === selectedCode);
      if (c) return c;
    }
    return null;
  }, [selectedCode, regions]);

  // Filter regions/countries by search
  const filteredRegions = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return regions;
    return regions
      .map(rg => ({
        ...rg,
        countries: rg.countries.filter(c =>
          c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        ),
      }))
      .filter(rg => rg.countries.length > 0);
  }, [search, regions]);

  return (
    <div className={cs.countrySelectWrapper} ref={ref}>
      <span className={cn(cs.label, ts.label)} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>{label}</span>

      {selectedInfo ? (
        <div className={cn(cs.selectedCountryBadge, ts.selectedCountryBadge)}>
          <span className={cs.countryFlag}>{selectedInfo.flag}</span>
          <span className={cs.countryName}>{selectedInfo.name}</span>
          <button
            className={cn(cs.selectedCountryRemove, ts.selectedCountryRemove)}
            onClick={() => { onSelect(''); setSearch(''); }}
            aria-label={`Remove ${selectedInfo.name}`}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <input
          className={cn(cs.countrySearchInput, ts.countrySearchInput)}
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      )}

      {open && !selectedCode && (
        <div className={cn(cs.countryDropdown, ts.countryDropdown)}>
          {filteredRegions.length === 0 ? (
            <div className={cn(cs.countryOption, ts.countryOption)} style={{ justifyContent: 'center', opacity: 0.5 }}>
              No countries found
            </div>
          ) : (
            filteredRegions.map(rg => (
              <div key={rg.key} className={cs.countryRegionGroup}>
                <div className={cn(cs.countryRegionLabel, ts.countryRegionLabel)}>
                  {rg.icon} {rg.label}
                </div>
                {rg.countries.map(c => (
                  <button
                    key={c.code}
                    className={cn(cs.countryOption, ts.countryOption)}
                    onClick={() => { onSelect(c.code); setOpen(false); setSearch(''); }}
                  >
                    <span className={cs.countryFlag}>{c.flag}</span>
                    <span className={cs.countryName}>{c.name}</span>
                    <span className={cn(cs.countryMult, ts.countryMult)}>×{c.rate_multiplier.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Regional Analysis Card (in results)
   ============================================================================ */

interface RegionalAnalysisCardProps {
  analysis: RegionalAnalysis;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function RegionalAnalysisCard({ analysis, cs, ts }: RegionalAnalysisCardProps) {
  return (
    <motion.div
      className={cn(cs.resultCard, ts.resultCard, cs.fullWidthCard)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className={cs.resultCardHeader}>
        <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><MapPin /></div>
        <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>Regional Pricing Analysis</h3>
      </div>

      {/* Selected countries info */}
      <div className={cs.regionalHeader}>
        {analysis.client_country && (
          <div className={cn(cs.selectedCountryBadge, ts.selectedCountryBadge)}>
            <span className={cs.countryFlag}>{analysis.client_country.flag}</span>
            Client: {analysis.client_country.name}
          </div>
        )}
        {analysis.freelancer_country && (
          <div className={cn(cs.selectedCountryBadge, ts.selectedCountryBadge)}>
            <span className={cs.countryFlag}>{analysis.freelancer_country.flag}</span>
            Freelancer: {analysis.freelancer_country.name}
          </div>
        )}
      </div>

      {/* PPP Local Value Context */}
      {analysis.local_value_context && (
        <div className={cn(cs.pppContext, ts.pppContext)}>
          <span className={cn(cs.pppLabel, ts.pppLabel)}>Purchasing Power Context</span>
          <p className={cs.pppDescription}>{analysis.local_value_context.description}</p>
        </div>
      )}

      {/* Pricing Context Tips */}
      {analysis.pricing_context.length > 0 && (
        <div className={cs.regionalContextList}>
          {analysis.pricing_context.map((ctx, i) => (
            <div key={i} className={cn(cs.regionalContextItem, ts.regionalContextItem)}>
              <p className={cn(cs.regionalContextTitle, ts.regionalContextTitle)}>
                {ctx.type === 'warning' ? '⚠️' : ctx.type === 'positive' ? '✅' : 'ℹ️'} {ctx.title}
              </p>
              <p className={cn(cs.regionalContextMsg, ts.regionalContextMsg)}>{ctx.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Country Comparison Grid */}
      {analysis.comparison_countries.length > 0 && (
        <>
          <p className={cn(cs.label, ts.label)} style={{ marginTop: '16px', marginBottom: '8px' }}>
            Hourly Rate Comparison (10 key markets)
          </p>
          <div className={cs.regionCompareGrid}>
            {analysis.comparison_countries.map(c => (
              <div key={c.code} className={cn(cs.regionCompareItem, ts.regionCompareItem)}>
                <span className={cs.regionCompareFlag}>{c.flag}</span>
                <div className={cs.regionCompareInfo}>
                  <span className={cn(cs.regionCompareName, ts.regionCompareName)}>{c.name}</span>
                  <span className={cn(cs.regionCompareRate, ts.regionCompareRate)}>${c.hourly_rate}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ============================================================================
   Guidance Tip — contextual help shown at each step
   ============================================================================ */

interface GuidanceTipProps {
  icon: React.ElementType;
  title: string;
  text: string;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function GuidanceTip({ icon: Icon, title, text, cs, ts }: GuidanceTipProps) {
  return (
    <div className={cn(cs.guidanceTip, ts.guidanceTip)}>
      <div className={cn(cs.guidanceTipIcon, ts.guidanceTipIcon)}>
        <Icon size={18} />
      </div>
      <div className={cs.guidanceTipContent}>
        <span className={cn(cs.guidanceTipTitle, ts.guidanceTipTitle)}>{title}</span>
        <span className={cn(cs.guidanceTipText, ts.guidanceTipText)}>{text}</span>
      </div>
    </div>
  );
}

/* ============================================================================
   Option Impact — inline impact indicator below select fields
   ============================================================================ */

interface OptionImpactProps {
  desc: string;
  impact: string;
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function OptionImpact({ desc, impact, cs, ts }: OptionImpactProps) {
  return (
    <div className={cn(cs.optionImpact, ts.optionImpact)}>
      <span className={cs.optionImpactDesc}>{desc}</span>
      <span className={cn(cs.optionImpactBadge, ts.optionImpactBadge)}>{impact}</span>
    </div>
  );
}

/* ============================================================================
   Pricing Guide Card — teaches users how to calculate prices manually
   ============================================================================ */

interface PricingGuideCardProps {
  cs: typeof commonStyles;
  ts: typeof lightStyles;
}

function PricingGuideCard({ cs, ts }: PricingGuideCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={cn(cs.resultCard, ts.resultCard, cs.fullWidthCard)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
    >
      <button
        className={cs.guideToggle}
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <div className={cs.resultCardHeader} style={{ marginBottom: 0 }}>
          <div className={cn(cs.resultCardIcon, ts.resultCardIcon)}><BookOpen /></div>
          <h3 className={cn(cs.resultCardTitle, ts.resultCardTitle)}>How to Calculate Project Pricing Manually</h3>
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {expanded && (
        <motion.div
          className={cs.guideContent}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn(cs.guideFormula, ts.guideFormula)}>
            <span className={cs.guideFormulaLabel}>The Formula</span>
            <span className={cs.guideFormulaText}>
              Total Price = Hourly Rate × Hours × Experience × Urgency × Quality × Regional Adjustment
            </span>
          </div>

          <div className={cs.guideSections}>
            <div className={cn(cs.guideSection, ts.guideSection)}>
              <h4 className={cn(cs.guideSectionTitle, ts.guideSectionTitle)}>
                <DollarSign size={16} /> 1. Determine Hourly Rate
              </h4>
              <p className={cn(cs.guideSectionText, ts.guideSectionText)}>
                Research the market rate for your service type. Rates vary widely: web development ($40–180/hr),
                graphic design ($25–120/hr), copywriting ($30–100/hr). Check platforms like Upwork, Fiverr, and
                Glassdoor for current averages.
              </p>
            </div>

            <div className={cn(cs.guideSection, ts.guideSection)}>
              <h4 className={cn(cs.guideSectionTitle, ts.guideSectionTitle)}>
                <Clock size={16} /> 2. Estimate Hours
              </h4>
              <p className={cn(cs.guideSectionText, ts.guideSectionText)}>
                Break your project into phases: planning (10–15%), design (15–25%), development/execution (40–50%),
                testing/review (15–20%), and deployment/delivery (5–10%). Estimate each phase separately, then
                add 15–25% buffer for unexpected complexity.
              </p>
            </div>

            <div className={cn(cs.guideSection, ts.guideSection)}>
              <h4 className={cn(cs.guideSectionTitle, ts.guideSectionTitle)}>
                <TrendingUp size={16} /> 3. Apply Multipliers
              </h4>
              <p className={cn(cs.guideSectionText, ts.guideSectionText)}>
                <strong>Experience:</strong> Junior (×0.6), Mid (×1.0), Senior (×1.4), Expert (×1.75).{' '}
                <strong>Urgency:</strong> Rush jobs add 25–50%.{' '}
                <strong>Quality:</strong> Premium/enterprise tier adds 40–80%.{' '}
                <strong>Region:</strong> North America/Western Europe rates are 2–4× higher than South Asia/Africa.
              </p>
            </div>

            <div className={cn(cs.guideSection, ts.guideSection)}>
              <h4 className={cn(cs.guideSectionTitle, ts.guideSectionTitle)}>
                <Target size={16} /> 4. Key Things to Keep in Mind
              </h4>
              <ul className={cn(cs.guideList, ts.guideList)}>
                <li>Always quote a range (±20–30%), not a fixed number</li>
                <li>Include revision rounds in your hours estimate (typically 2–3 rounds)</li>
                <li>Factor in communication and project management overhead (~10–15%)</li>
                <li>Consider ongoing maintenance costs (10–20% of build cost annually)</li>
                <li>Get at least 3 quotes to validate your estimate</li>
                <li>Document scope clearly to avoid scope creep</li>
                <li>Larger projects often have volume discounts (5–15% off)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   Helpers
   ============================================================================ */

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
