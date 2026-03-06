// @AI-HINT: This is the AI Price Estimator utility page. Premium production-ready design with animated results and detailed breakdown.
'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Input from '@/app/components/Input/Input';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import {
  Calculator,
  FileText,
  Sparkles,
  Clock,
  Users,
  Layers,
  Zap,
  Shield,
  Info,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Download,
  Briefcase,
  Code,
  Palette,
  Target
} from 'lucide-react';

import commonStyles from './PriceEstimator.common.module.css';
import lightStyles from './PriceEstimator.light.module.css';
import darkStyles from './PriceEstimator.dark.module.css';

interface EstimationResult {
  minPrice: number;
  maxPrice: number;
  breakdown: {
    label: string;
    icon: React.ReactNode;
    value: string;
  }[];
  factors: {
    label: string;
    value: string;
  }[];
  confidence: number;
  timeline: string;
}

type LoadingStep = {
  id: string;
  label: string;
  completed: boolean;
};

const PriceEstimator: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    complexity: 'Medium',
    timeline: 'Flexible'
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handlePostProject = useCallback(() => {
    // Store the form data in sessionStorage to prefill the post-job form
    if (formData.title || formData.description) {
      sessionStorage.setItem('prefill_project', JSON.stringify({
        title: formData.title,
        description: formData.description,
        industry: formData.industry,
        estimatedBudgetMin: result?.minPrice,
        estimatedBudgetMax: result?.maxPrice
      }));
    }
    router.push('/client/post-job');
  }, [formData, result, router]);

  const animateLoadingSteps = useCallback(async () => {
    const steps: LoadingStep[] = [
      { id: 'analyze', label: 'Analyzing project scope...', completed: false },
      { id: 'market', label: 'Researching market rates...', completed: false },
      { id: 'complexity', label: 'Evaluating complexity...', completed: false },
      { id: 'calculate', label: 'Calculating estimate...', completed: false }
    ];
    setLoadingSteps(steps);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setLoadingSteps(prev => prev.map((step, idx) =>
        idx === i ? { ...step, completed: true } : step
      ));
    }
  }, []);

  // Map frontend form values to backend API fields
  const mapComplexityToScope = (complexity: string) => {
    const map: Record<string, string> = { 'Low': 'small', 'Medium': 'medium', 'High': 'large', 'Enterprise': 'enterprise' };
    return map[complexity] || 'medium';
  };
  const mapTimelineToUrgency = (timeline: string) => {
    const map: Record<string, string> = { 'Urgent (< 1 week)': 'urgent', 'Standard (1-4 weeks)': 'standard', 'Flexible': 'relaxed', 'Long-term (> 2 months)': 'ongoing' };
    return map[timeline] || 'standard';
  };

  const buildResultFromApi = useCallback((data: any): EstimationResult => {
    const est = data.estimate || {};
    const minPrice = Math.round(est.low_estimate || est.total_estimate * 0.75 || 0);
    const maxPrice = Math.round(est.high_estimate || est.total_estimate * 1.35 || 0);
    const confidence = data.confidence?.score ?? data.confidence?.percentage ?? 80;
    const timeline = data.timeline?.estimated_duration || data.timeline?.range || '2-4 weeks';

    // Build breakdown from API response or derive from total
    const apiBreakdown = data.breakdown;
    let breakdown: EstimationResult['breakdown'];
    if (Array.isArray(apiBreakdown) && apiBreakdown.length > 0) {
      const iconMap: Record<string, React.ReactNode> = {
        'development': <Code size={18} />, 'design': <Palette size={18} />,
        'testing': <Target size={18} />, 'management': <Briefcase size={18} />,
      };
      breakdown = apiBreakdown.slice(0, 6).map((item: any) => ({
        label: item.label || item.phase || item.name || 'Phase',
        icon: iconMap[String(item.label || item.phase || '').toLowerCase()] || <Layers size={18} />,
        value: item.cost ? `$${Math.round(item.cost).toLocaleString()}` : item.range || item.value || '',
      }));
    } else {
      breakdown = [
        { label: 'Development', icon: <Code size={18} />, value: `$${Math.round(minPrice * 0.5).toLocaleString()} - $${Math.round(maxPrice * 0.5).toLocaleString()}` },
        { label: 'Design', icon: <Palette size={18} />, value: `$${Math.round(minPrice * 0.25).toLocaleString()} - $${Math.round(maxPrice * 0.25).toLocaleString()}` },
        { label: 'Testing & QA', icon: <Target size={18} />, value: `$${Math.round(minPrice * 0.15).toLocaleString()} - $${Math.round(maxPrice * 0.15).toLocaleString()}` },
        { label: 'Project Management', icon: <Briefcase size={18} />, value: `$${Math.round(minPrice * 0.1).toLocaleString()} - $${Math.round(maxPrice * 0.1).toLocaleString()}` },
      ];
    }

    // Build factors from API or form data
    const apiFactors = data.factors;
    let factors: EstimationResult['factors'];
    if (Array.isArray(apiFactors) && apiFactors.length > 0) {
      factors = apiFactors.slice(0, 6).map((f: any) => ({
        label: f.label || f.name || 'Factor',
        value: f.value || f.impact || '',
      }));
    } else {
      factors = [
        { label: 'Demand', value: data.demand_level || 'moderate' },
        { label: 'Hourly Rate', value: `$${Math.round(est.hourly_rate || 0)}/hr` },
        { label: 'Hours', value: `${est.total_hours || 0}h` },
        { label: 'Scope', value: data.meta?.scope || formData.complexity },
      ];
    }

    return { minPrice, maxPrice, confidence, timeline: String(timeline), breakdown, factors };
  }, [formData.complexity]);

  // Client-side fallback when API is unavailable
  const calculateFallbackEstimate = useCallback((): EstimationResult => {
    const complexityMult: Record<string, number> = { 'Low': 1, 'Medium': 1.8, 'High': 3, 'Enterprise': 5 };
    const timelineMult: Record<string, number> = { 'Urgent (< 1 week)': 1.5, 'Standard (1-4 weeks)': 1.2, 'Flexible': 1, 'Long-term (> 2 months)': 0.9 };
    const c = complexityMult[formData.complexity] || 1.8;
    const t = timelineMult[formData.timeline] || 1;
    const d = Math.min(1 + (formData.description.length / 500) * 0.5, 2);
    const minPrice = Math.round(800 * c * t * d);
    const maxPrice = Math.round(1500 * c * t * d);
    return {
      minPrice, maxPrice, confidence: 65,
      timeline: formData.timeline === 'Urgent (< 1 week)' ? '3-5 days' : formData.timeline === 'Standard (1-4 weeks)' ? '2-3 weeks' : formData.timeline === 'Long-term (> 2 months)' ? '2-3 months' : '1-2 weeks',
      breakdown: [
        { label: 'Development', icon: <Code size={18} />, value: `$${Math.round(minPrice * 0.5).toLocaleString()} - $${Math.round(maxPrice * 0.5).toLocaleString()}` },
        { label: 'Design', icon: <Palette size={18} />, value: `$${Math.round(minPrice * 0.25).toLocaleString()} - $${Math.round(maxPrice * 0.25).toLocaleString()}` },
        { label: 'Testing & QA', icon: <Target size={18} />, value: `$${Math.round(minPrice * 0.15).toLocaleString()} - $${Math.round(maxPrice * 0.15).toLocaleString()}` },
        { label: 'Project Management', icon: <Briefcase size={18} />, value: `$${Math.round(minPrice * 0.1).toLocaleString()} - $${Math.round(maxPrice * 0.1).toLocaleString()}` },
      ],
      factors: [
        { label: 'Complexity', value: formData.complexity },
        { label: 'Timeline', value: formData.timeline === 'Flexible' ? '1-2 weeks' : formData.timeline },
        { label: 'Industry', value: formData.industry || 'General' },
        { label: 'Scope', value: formData.description.length > 200 ? 'Large' : formData.description.length > 100 ? 'Medium' : 'Small' },
      ],
    };
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    const loadingPromise = animateLoadingSteps();

    try {
      const res = await fetch('/api/price-estimator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.industry ? formData.industry.toLowerCase().replace(/\s+/g, '_') : 'software_development',
          service_type: 'web_application',
          scope: mapComplexityToScope(formData.complexity),
          urgency: mapTimelineToUrgency(formData.timeline),
          description: `${formData.title}. ${formData.description}`,
          quality_tier: formData.complexity === 'Enterprise' ? 'enterprise' : formData.complexity === 'High' ? 'premium' : 'standard',
          experience_level: 'mid',
        }),
      });

      await loadingPromise;

      if (res.ok) {
        const data = await res.json();
        setResult(buildResultFromApi(data));
      } else {
        setResult(calculateFallbackEstimate());
      }
    } catch {
      await loadingPromise;
      setResult(calculateFallbackEstimate());
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      title: '',
      description: '',
      industry: '',
      complexity: 'Medium',
      timeline: 'Flexible'
    });
  };

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.innerContainer}>
          {/* Header */}
          <ScrollReveal>
            <header className={commonStyles.header}>
              <div className={cn(commonStyles.headerIcon, themeStyles.headerIcon)}>
                <Calculator />
              </div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                AI Price Estimator
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Get accurate, data-driven cost estimates for your project powered by AI analysis
              </p>
            </header>
          </ScrollReveal>

          {/* Main Grid */}
          <div className={commonStyles.mainGrid}>
            {/* Form Card */}
            <ScrollReveal delay={0.1}>
              <div className={cn(commonStyles.formCard, themeStyles.formCard)}>
                <div className={commonStyles.formHeader}>
                  <div className={cn(commonStyles.formIconWrapper, themeStyles.formIconWrapper)}>
                    <FileText />
                  </div>
                  <div>
                    <h2 className={cn(commonStyles.formTitle, themeStyles.formTitle)}>
                      Project Details
                    </h2>
                    <p className={cn(commonStyles.formSubtitle, themeStyles.formSubtitle)}>
                      Describe your project for accurate pricing
                    </p>
                  </div>
                </div>

                <form className={commonStyles.form} onSubmit={handleSubmit}>
                  <div className={commonStyles.formGrid}>
                    {/* Project Title */}
                    <div className={commonStyles.formGroup}>
                      <label className={cn(commonStyles.label, themeStyles.label)}>
                        <Briefcase />
                        Project Title
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., E-commerce Website Redesign"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                        fullWidth
                      />
                    </div>

                    {/* Description */}
                    <div className={commonStyles.formGroup}>
                      <label className={cn(commonStyles.label, themeStyles.label)}>
                        <FileText />
                        Project Description
                      </label>
                      <textarea
                        className={cn(commonStyles.textarea, themeStyles.textarea)}
                        placeholder="Describe the project scope, key features, deliverables, and any specific requirements..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={5}
                        required
                      />
                    </div>

                    {/* Industry & Complexity Row */}
                    <div className={commonStyles.formRow}>
                      <div className={commonStyles.formGroup}>
                        <label className={cn(commonStyles.label, themeStyles.label)}>
                          <Layers />
                          Industry
                          <span className={cn(commonStyles.labelOptional, themeStyles.labelOptional)}>Optional</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., SaaS, Retail, Healthcare"
                          value={formData.industry}
                          onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                          fullWidth
                        />
                      </div>

                      <div className={commonStyles.formGroup}>
                        <label className={cn(commonStyles.label, themeStyles.label)}>
                          <Zap />
                          Complexity
                        </label>
                        <select
                          className={cn(commonStyles.select, themeStyles.select)}
                          value={formData.complexity}
                          onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value }))}
                          required
                        >
                          <option value="Low">Low - Simple features</option>
                          <option value="Medium">Medium - Standard project</option>
                          <option value="High">High - Complex integrations</option>
                          <option value="Enterprise">Enterprise - Large scale</option>
                        </select>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className={commonStyles.formGroup}>
                      <label className={cn(commonStyles.label, themeStyles.label)}>
                        <Clock />
                        Expected Timeline
                      </label>
                      <select
                        className={cn(commonStyles.select, themeStyles.select)}
                        value={formData.timeline}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                        required
                      >
                        <option value="Urgent (< 1 week)">Urgent (less than 1 week)</option>
                        <option value="Standard (1-4 weeks)">Standard (1-4 weeks)</option>
                        <option value="Flexible">Flexible</option>
                        <option value="Long-term (> 2 months)">Long-term (2+ months)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className={cn(commonStyles.submitSection, themeStyles.submitSection)}>
                    <button
                      type="submit"
                      className={cn(commonStyles.submitButton, themeStyles.submitButton)}
                      disabled={isLoading || !formData.title || !formData.description}
                    >
                      <Sparkles />
                      {isLoading ? 'Analyzing...' : 'Get AI Estimate'}
                    </button>
                    <p className={cn(commonStyles.privacyNote, themeStyles.privacyNote)}>
                      <Shield />
                      Your project details are analyzed securely
                    </p>
                  </div>
                </form>
              </div>
            </ScrollReveal>

            {/* Results Panel */}
            <div className={cn(commonStyles.resultsPanel, themeStyles.resultsPanel)}>
              <AnimatePresence mode="wait">
                {/* Empty State */}
                {!isLoading && !result && (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={commonStyles.emptyState}
                  >
                    <div className={cn(commonStyles.emptyStateIcon, themeStyles.emptyStateIcon)}>
                      <Calculator />
                    </div>
                    <h3 className={cn(commonStyles.emptyStateTitle, themeStyles.emptyStateTitle)}>
                      Ready to Estimate
                    </h3>
                    <p className={cn(commonStyles.emptyStateText, themeStyles.emptyStateText)}>
                      Fill in your project details and our AI will calculate an accurate price range
                    </p>
                  </motion.div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={commonStyles.loadingState}
                  >
                    <div className={cn(commonStyles.loadingOrb, themeStyles.loadingOrb)}>
                      <div className={cn(commonStyles.loadingOrbInner, themeStyles.loadingOrbInner)}>
                        <Sparkles />
                      </div>
                    </div>
                    <h3 className={cn(commonStyles.loadingTitle, themeStyles.loadingTitle)}>
                      AI is analyzing...
                    </h3>
                    <p className={cn(commonStyles.loadingText, themeStyles.loadingText)}>
                      Processing your project requirements
                    </p>
                    <div className={commonStyles.loadingSteps}>
                      {loadingSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className={cn(
                            commonStyles.loadingStep,
                            themeStyles.loadingStep,
                            step.completed && themeStyles.completed,
                            !step.completed && index === loadingSteps.findIndex(s => !s.completed) && commonStyles.active,
                            !step.completed && index === loadingSteps.findIndex(s => !s.completed) && themeStyles.active
                          )}
                        >
                          {step.completed ? (
                            <CheckCircle2 className={cn(commonStyles.loadingStepCheck, themeStyles.loadingStepCheck)} />
                          ) : (
                            <div className={commonStyles.miniSpinner} />
                          )}
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Results State */}
                {!isLoading && result && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={commonStyles.resultsState}
                  >
                    {/* Price Header */}
                    <div className={cn(commonStyles.priceHeader, themeStyles.priceHeader)}>
                      <p className={cn(commonStyles.priceLabel, themeStyles.priceLabel)}>
                        Estimated Price Range
                      </p>
                      <div className={commonStyles.priceRange}>
                        <span className={cn(commonStyles.priceValue, themeStyles.priceValue)}>
                          ${result.minPrice.toLocaleString()}
                        </span>
                        <span className={cn(commonStyles.priceDivider, themeStyles.priceDivider)}>—</span>
                        <span className={cn(commonStyles.priceValue, themeStyles.priceValue)}>
                          ${result.maxPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className={cn(commonStyles.priceConfidence, themeStyles.priceConfidence)}>
                        <TrendingUp />
                        {result.confidence}% Confidence
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className={commonStyles.breakdownSection}>
                      <h4 className={cn(commonStyles.breakdownTitle, themeStyles.breakdownTitle)}>
                        <Layers />
                        Cost Breakdown
                      </h4>
                      <div className={commonStyles.breakdownList}>
                        {result.breakdown.map((item, index) => (
                          <div key={index} className={cn(commonStyles.breakdownItem, themeStyles.breakdownItem)}>
                            <div className={commonStyles.breakdownItemLeft}>
                              <div className={cn(commonStyles.breakdownItemIcon, themeStyles.breakdownItemIcon)}>
                                {item.icon}
                              </div>
                              <span className={cn(commonStyles.breakdownItemLabel, themeStyles.breakdownItemLabel)}>
                                {item.label}
                              </span>
                            </div>
                            <span className={cn(commonStyles.breakdownItemValue, themeStyles.breakdownItemValue)}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Project Factors */}
                    <div className={commonStyles.factorsSection}>
                      <h4 className={cn(commonStyles.factorsTitle, themeStyles.factorsTitle)}>
                        <Users />
                        Project Factors
                      </h4>
                      <div className={commonStyles.factorsGrid}>
                        {result.factors.map((factor, index) => (
                          <div key={index} className={cn(commonStyles.factorCard, themeStyles.factorCard)}>
                            <p className={cn(commonStyles.factorValue, themeStyles.factorValue)}>
                              {factor.value}
                            </p>
                            <p className={cn(commonStyles.factorLabel, themeStyles.factorLabel)}>
                              {factor.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={cn(commonStyles.actionsSection, themeStyles.actionsSection)}>
                      <button 
                        className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                        onClick={handlePostProject}
                      >
                        <ArrowRight />
                        Post This Project
                      </button>
                      <button 
                        className={cn(commonStyles.actionButton, themeStyles.actionButton, themeStyles.secondary)}
                        onClick={handleReset}
                      >
                        <RefreshCw />
                        New Estimate
                      </button>
                    </div>

                    {/* Disclaimer */}
                    <div className={cn(commonStyles.disclaimer, themeStyles.disclaimer)}>
                      <Info />
                      <span>
                        This is an AI-generated estimate based on market data. 
                        Final prices may vary based on freelancer bids and detailed requirements.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PriceEstimator;
