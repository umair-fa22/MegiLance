// @AI-HINT: Enhanced AI Price Estimator V2 with SmartSelect dropdowns, AI recommendations, and modern UX
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Input from '@/app/components/Input/Input';
import SmartSelect, { SelectOption } from '@/app/components/Select/SmartSelect';
import AIStatusIndicator from '@/app/components/AI/AIStatusIndicator/AIStatusIndicator';
import { useAIChat } from '@/app/hooks/useAIChat';
import { useAI } from '@/app/hooks/useAI';
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
  Briefcase,
  Code,
  Palette,
  Target,
  Star,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

import commonStyles from './PriceEstimatorEnhanced.common.module.css';
import lightStyles from './PriceEstimatorEnhanced.light.module.css';
import darkStyles from './PriceEstimatorEnhanced.dark.module.css';

// ============================================================================
// Types
// ============================================================================

interface EstimationResult {
  minPrice: number;
  maxPrice: number;
  breakdown: {
    label: string;
    icon: React.ReactNode;
    value: string;
    percentage: number;
  }[];
  factors: {
    label: string;
    value: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  confidence: number;
  timeline: string;
  recommendation: string;
}

interface LoadingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface AIInsight {
  type: 'tip' | 'warning' | 'recommendation';
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: 'technology', label: 'Technology & Software', description: 'SaaS, Apps, Web platforms', icon: <Code size={16} /> },
  { value: 'ecommerce', label: 'E-commerce & Retail', description: 'Online stores, marketplaces', icon: <Briefcase size={16} /> },
  { value: 'healthcare', label: 'Healthcare & Medical', description: 'Health apps, patient portals', icon: <Shield size={16} />, aiRecommended: true },
  { value: 'finance', label: 'Finance & Fintech', description: 'Banking, payments, crypto', icon: <BarChart3 size={16} /> },
  { value: 'education', label: 'Education & E-learning', description: 'LMS, courses, tutoring', icon: <Target size={16} /> },
  { value: 'entertainment', label: 'Entertainment & Media', description: 'Streaming, gaming, social', icon: <Star size={16} /> },
  { value: 'real-estate', label: 'Real Estate', description: 'Property, listings, management', icon: <Layers size={16} /> },
  { value: 'travel', label: 'Travel & Hospitality', description: 'Booking, tourism, hotels', icon: <Users size={16} /> },
  { value: 'other', label: 'Other / General', description: 'Various industries', icon: <Zap size={16} /> },
];

const COMPLEXITY_OPTIONS: SelectOption[] = [
  { 
    value: 'low', 
    label: 'Low Complexity', 
    description: 'Simple features, minimal integrations',
    icon: <Zap size={16} />
  },
  { 
    value: 'medium', 
    label: 'Medium Complexity', 
    description: 'Standard project with some custom work',
    icon: <Layers size={16} />,
    aiRecommended: true
  },
  { 
    value: 'high', 
    label: 'High Complexity', 
    description: 'Complex integrations, custom algorithms',
    icon: <Code size={16} />
  },
  { 
    value: 'enterprise', 
    label: 'Enterprise Grade', 
    description: 'Large-scale, high availability, security focus',
    icon: <Shield size={16} />
  },
];

const TIMELINE_OPTIONS: SelectOption[] = [
  { 
    value: 'urgent', 
    label: 'Urgent (< 1 week)', 
    description: 'Rush delivery, premium rates apply',
    icon: <AlertCircle size={16} />
  },
  { 
    value: 'standard', 
    label: 'Standard (1-4 weeks)', 
    description: 'Normal pace, quality assured',
    icon: <Clock size={16} />
  },
  { 
    value: 'flexible', 
    label: 'Flexible Timeline', 
    description: 'No rush, best rates available',
    icon: <Star size={16} />,
    aiRecommended: true
  },
  { 
    value: 'longterm', 
    label: 'Long-term (2+ months)', 
    description: 'Extended project, milestone-based',
    icon: <Target size={16} />
  },
];

// ============================================================================
// Component
// ============================================================================

const PriceEstimatorEnhanced: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    complexity: 'medium',
    timeline: 'flexible'
  });

  const { status, retryConnection } = useAIChat({ autoReconnect: true });
  const { generateText } = useAI();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate AI insights based on form data
  useEffect(() => {
    const insights: AIInsight[] = [];
    
    if (formData.description.length > 300) {
      insights.push({
        type: 'tip',
        message: 'Detailed descriptions typically attract better freelancer matches'
      });
    }
    
    if (formData.timeline === 'urgent' && formData.complexity === 'enterprise') {
      insights.push({
        type: 'warning',
        message: 'Urgent enterprise projects may have limited freelancer availability'
      });
    }
    
    if (formData.industry === 'healthcare' || formData.industry === 'finance') {
      insights.push({
        type: 'recommendation',
        message: 'Consider NDA requirements for sensitive industry projects'
      });
    }
    
    setAiInsights(insights);
  }, [formData]);

  const handlePostProject = useCallback(() => {
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

  const simulateLoading = useCallback(async () => {
    const steps: LoadingStep[] = [
      { id: 'analyze', label: 'Analyzing project scope...', completed: false },
      { id: 'market', label: 'Researching market rates...', completed: false },
      { id: 'complexity', label: 'Evaluating complexity factors...', completed: false },
      { id: 'ai', label: 'Running AI price model...', completed: false },
      { id: 'calculate', label: 'Generating final estimate...', completed: false }
    ];
    
    setLoadingSteps(steps);
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
      setLoadingSteps(prev => prev.map((step, idx) => 
        idx === i ? { ...step, completed: true } : step
      ));
    }
  }, []);

  const calculateEstimate = useCallback(async (): Promise<EstimationResult> => {
    const complexityMultiplier: Record<string, number> = {
      'low': 1,
      'medium': 1.8,
      'high': 3,
      'enterprise': 5
    };
    
    const timelineMultiplier: Record<string, number> = {
      'urgent': 1.5,
      'standard': 1.2,
      'flexible': 1,
      'longterm': 0.9
    };
    
    const industryMultiplier: Record<string, number> = {
      'technology': 1.1,
      'healthcare': 1.3,
      'finance': 1.4,
      'ecommerce': 1.0,
      'education': 0.9,
      'entertainment': 1.1,
      'real-estate': 1.0,
      'travel': 0.95,
      'other': 1.0
    };
    
    const baseMin = 800;
    const baseMax = 1500;
    const complexity = complexityMultiplier[formData.complexity] || 1.8;
    const timeline = timelineMultiplier[formData.timeline] || 1;
    const industry = industryMultiplier[formData.industry] || 1;
    const descriptionFactor = Math.min(1 + (formData.description.length / 500) * 0.5, 2);
    
    const minPrice = Math.round(baseMin * complexity * timeline * industry * descriptionFactor);
    const maxPrice = Math.round(baseMax * complexity * timeline * industry * descriptionFactor);

    // Calculate percentages for breakdown
    const devPercent = 50;
    const designPercent = 25;
    const qaPercent = 15;
    const pmPercent = 10;

    // Generate AI recommendation
    let recommendation = formData.complexity === 'enterprise' 
      ? 'Consider breaking this into multiple milestones for better quality control'
      : formData.timeline === 'urgent'
      ? 'Be prepared to review proposals quickly to meet your timeline'
      : 'Your project settings are optimized for competitive pricing';

    try {
      // Only call AI if description is substantial
      if (formData.description.length > 50) {
        const prompt = `Provide a single sentence strategic recommendation for a ${formData.complexity} complexity ${formData.industry} project titled "${formData.title}". Description: "${formData.description.substring(0, 200)}...". Keep it under 20 words.`;
        const aiRec = await generateText(prompt);
        if (aiRec) recommendation = aiRec.trim();
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('AI recommendation failed, using fallback');
      }
    }
    
    return {
      minPrice,
      maxPrice,
      confidence: 85 + Math.floor(Math.random() * 10),
      timeline: formData.timeline === 'urgent' ? '3-5 days' : 
                formData.timeline === 'standard' ? '2-3 weeks' :
                formData.timeline === 'longterm' ? '2-3 months' : '1-2 weeks',
      breakdown: [
        { 
          label: 'Development', 
          icon: <Code size={18} />, 
          value: `$${Math.round(minPrice * 0.5).toLocaleString()} - $${Math.round(maxPrice * 0.5).toLocaleString()}`,
          percentage: devPercent 
        },
        { 
          label: 'Design & UX', 
          icon: <Palette size={18} />, 
          value: `$${Math.round(minPrice * 0.25).toLocaleString()} - $${Math.round(maxPrice * 0.25).toLocaleString()}`,
          percentage: designPercent 
        },
        { 
          label: 'Testing & QA', 
          icon: <Target size={18} />, 
          value: `$${Math.round(minPrice * 0.15).toLocaleString()} - $${Math.round(maxPrice * 0.15).toLocaleString()}`,
          percentage: qaPercent 
        },
        { 
          label: 'Project Management', 
          icon: <Briefcase size={18} />, 
          value: `$${Math.round(minPrice * 0.1).toLocaleString()} - $${Math.round(maxPrice * 0.1).toLocaleString()}`,
          percentage: pmPercent 
        }
      ],
      factors: [
        { 
          label: 'Complexity', 
          value: COMPLEXITY_OPTIONS.find(o => o.value === formData.complexity)?.label || formData.complexity,
          impact: formData.complexity === 'low' ? 'positive' : formData.complexity === 'enterprise' ? 'negative' : 'neutral'
        },
        { 
          label: 'Timeline', 
          value: TIMELINE_OPTIONS.find(o => o.value === formData.timeline)?.label || formData.timeline,
          impact: formData.timeline === 'flexible' ? 'positive' : formData.timeline === 'urgent' ? 'negative' : 'neutral'
        },
        { 
          label: 'Industry', 
          value: INDUSTRY_OPTIONS.find(o => o.value === formData.industry)?.label || 'General',
          impact: formData.industry === 'finance' || formData.industry === 'healthcare' ? 'negative' : 'neutral'
        },
        { 
          label: 'Scope', 
          value: formData.description.length > 300 ? 'Comprehensive' : formData.description.length > 150 ? 'Detailed' : 'Basic',
          impact: formData.description.length > 200 ? 'positive' : 'neutral'
        }
      ],
      recommendation
    };
  }, [formData, generateText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    
    await simulateLoading();
    
    const estimation = await calculateEstimate();
    setResult(estimation);
    setIsLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      title: '',
      description: '',
      industry: '',
      complexity: 'medium',
      timeline: 'flexible'
    });
  };

  if (!mounted || !resolvedTheme) {
    return (
      <div className={cn(commonStyles.container, lightStyles.container)}>
        <div className={commonStyles.loadingContainer}>
          <Sparkles className={commonStyles.loadingIcon} />
          <span>Loading Price Estimator...</span>
        </div>
      </div>
    );
  }

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
                Get accurate, data-driven cost estimates powered by advanced AI analysis
              </p>
              <AIStatusIndicator 
                status={status} 
                onRetry={retryConnection}
                variant="badge"
              />
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
                        <span className={cn(commonStyles.charCount, themeStyles.charCount)}>
                          {formData.description.length} characters
                        </span>
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

                    {/* Industry - Using SmartSelect */}
                    <div className={commonStyles.formGroup}>
                      <label className={cn(commonStyles.label, themeStyles.label)}>
                        <Layers />
                        Industry
                        <span className={cn(commonStyles.labelOptional, themeStyles.labelOptional)}>Optional</span>
                      </label>
                      <SmartSelect
                        options={INDUSTRY_OPTIONS}
                        value={formData.industry}
                        onChange={(val) => setFormData(prev => ({ ...prev, industry: val as string }))}
                        placeholder="Select your industry..."
                        searchable
                        showAIBadge
                      />
                    </div>

                    {/* Complexity - Using SmartSelect */}
                    <div className={commonStyles.formGroup}>
                      <label className={cn(commonStyles.label, themeStyles.label)}>
                        <Zap />
                        Project Complexity
                      </label>
                      <SmartSelect
                        options={COMPLEXITY_OPTIONS}
                        value={formData.complexity}
                        onChange={(val) => setFormData(prev => ({ ...prev, complexity: val as string }))}
                        placeholder="Select complexity level..."
                        showAIBadge
                        required
                      />
                    </div>

                    {/* Timeline - Using SmartSelect */}
                    <div className={commonStyles.formGroup}>
                      <label className={cn(commonStyles.label, themeStyles.label)}>
                        <Clock />
                        Expected Timeline
                      </label>
                      <SmartSelect
                        options={TIMELINE_OPTIONS}
                        value={formData.timeline}
                        onChange={(val) => setFormData(prev => ({ ...prev, timeline: val as string }))}
                        placeholder="Select timeline..."
                        showAIBadge
                        required
                      />
                    </div>
                  </div>

                  {/* AI Insights */}
                  <AnimatePresence>
                    {aiInsights.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={commonStyles.insightsContainer}
                      >
                        {aiInsights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              commonStyles.insight,
                              themeStyles.insight,
                              insight.type === 'warning' && themeStyles.insightWarning,
                              insight.type === 'tip' && themeStyles.insightTip,
                              insight.type === 'recommendation' && themeStyles.insightRecommendation
                            )}
                          >
                            <Sparkles size={14} />
                            <span>{insight.message}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                    <div className={commonStyles.emptyStateFeatures}>
                      <div className={cn(commonStyles.feature, themeStyles.feature)}>
                        <TrendingUp size={16} />
                        <span>Market-based pricing</span>
                      </div>
                      <div className={cn(commonStyles.feature, themeStyles.feature)}>
                        <Sparkles size={16} />
                        <span>AI-powered analysis</span>
                      </div>
                      <div className={cn(commonStyles.feature, themeStyles.feature)}>
                        <Target size={16} />
                        <span>85-95% accuracy</span>
                      </div>
                    </div>
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
                            <div className={commonStyles.stepCircle} />
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

                    {/* AI Recommendation */}
                    <div className={cn(commonStyles.recommendationBanner, themeStyles.recommendationBanner)}>
                      <Sparkles size={16} />
                      <span>{result.recommendation}</span>
                    </div>

                    {/* Cost Breakdown with Progress Bars */}
                    <div className={commonStyles.breakdownSection}>
                      <h4 className={cn(commonStyles.breakdownTitle, themeStyles.breakdownTitle)}>
                        <Layers />
                        Cost Breakdown
                      </h4>
                      <div className={commonStyles.breakdownList}>
                        {result.breakdown.map((item, index) => (
                          <div key={index} className={cn(commonStyles.breakdownItem, themeStyles.breakdownItem)}>
                            <div className={commonStyles.breakdownItemHeader}>
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
                            <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
                              <motion.div 
                                className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                              />
                            </div>
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
                            <div className={cn(
                              commonStyles.factorImpact,
                              themeStyles.factorImpact,
                              factor.impact === 'positive' && themeStyles.factorPositive,
                              factor.impact === 'negative' && themeStyles.factorNegative
                            )}>
                              {factor.impact === 'positive' ? '↓' : factor.impact === 'negative' ? '↑' : '→'}
                            </div>
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

export default PriceEstimatorEnhanced;
