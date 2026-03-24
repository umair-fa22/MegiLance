// @AI-HINT: Premium AI Fraud Check page with production-ready quality UI. Calls backend /api/ai/fraud-check for real pattern analysis, with client-side fallback.
'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Zap } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';

import commonStyles from './FraudCheck.common.module.css';
import lightStyles from './FraudCheck.light.module.css';
import darkStyles from './FraudCheck.dark.module.css';

interface Warning {
  category: string;
  severity: string;
  detail: string;
}

interface AnalysisResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  warnings: string[];
  confidence: number;
  details?: Warning[];
}

const SAMPLE_TEXTS = {
  clean: `We are looking for an experienced React developer to help us build a modern web application. The project involves creating responsive UI components, integrating with REST APIs, and implementing state management with Redux. The timeline is 3 months with bi-weekly milestones. Budget: $5,000-$8,000. Please submit your portfolio and relevant experience.`,
  suspicious: `URGENT! Need developer ASAP! Payment guaranteed $50,000 for simple task! Contact me on telegram @quickmoney123 for immediate payment. No portfolio needed. Just send your bank details and we can start immediately. This is 100% legitimate work from a Fortune 500 company!`,
};

const FraudCheck: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [text, setText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <CheckCircle size={24} />;
      case 'Medium':
        return <AlertTriangle size={24} />;
      case 'High':
      case 'Critical':
        return <XCircle size={24} />;
      default:
        return <Shield size={24} />;
    }
  };

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'This content appears to be legitimate with no significant red flags detected.';
      case 'Medium':
        return 'Some potential concerns were identified. Review the warnings before proceeding.';
      case 'High':
        return 'Multiple warning signs detected. Exercise caution and verify the source.';
      case 'Critical':
        return 'Strong indicators of fraudulent content. We recommend avoiding this listing.';
      default:
        return '';
    }
  };

  const handleAnalysis = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const params = new URLSearchParams({ text: text.trim() });
      const res = await fetch(`/api/ai/fraud-check?${params.toString()}`, { method: 'POST' });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();

      const warningStrings: string[] = Array.isArray(data.warnings)
        ? data.warnings.map((w: Warning | string) => (typeof w === 'string' ? w : w.detail))
        : data.flags ?? [];

      setAnalysisResult({
        score: data.score ?? data.risk_score ?? 0,
        riskLevel: (data.risk_level as AnalysisResult['riskLevel']) ?? 'Low',
        warnings: warningStrings,
        confidence: data.confidence ?? 85,
        details: Array.isArray(data.warnings) && typeof data.warnings[0] === 'object' ? data.warnings : undefined,
      });
    } catch {
      // Fallback: client-side basic analysis if backend is unreachable
      const lowerText = text.toLowerCase();
      let score = 0;
      const warnings: string[] = [];

      if (/urgent|asap|immediately|right now/i.test(text)) { score += 20; warnings.push('Uses high-pressure urgency language'); }
      if (/guaranteed|100%|easy money|quick money/i.test(text)) { score += 25; warnings.push('Contains unrealistic payment promises'); }
      if (/telegram|whatsapp|signal|contact me at/i.test(text)) { score += 30; warnings.push('Attempts to move communication off-platform'); }
      if (/bank details|bank account|ssn|social security/i.test(lowerText)) { score += 35; warnings.push('Requests sensitive personal information'); }
      if (/\$\d{5,}/.test(text) && /simple|easy|quick/i.test(text)) { score += 20; warnings.push('Offers unusually high payment for described work'); }
      if (/no portfolio|no experience needed/i.test(text)) { score += 15; warnings.push('No credentials required for professional work'); }

      score = Math.min(score, 100);
      let riskLevel: AnalysisResult['riskLevel'] = 'Low';
      if (score > 70) riskLevel = 'Critical';
      else if (score > 50) riskLevel = 'High';
      else if (score > 25) riskLevel = 'Medium';

      setAnalysisResult({ score, riskLevel, warnings, confidence: 70 });
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  const loadSample = (type: 'clean' | 'suspicious') => {
    setText(SAMPLE_TEXTS[type]);
    setAnalysisResult(null);
  };

  const handleReset = () => {
    setText('');
    setAnalysisResult(null);
  };

  const riskClass = analysisResult ? commonStyles[`risk${analysisResult.riskLevel}`] : '';
  const riskThemeClass = analysisResult ? themeStyles[`risk${analysisResult.riskLevel}`] : '';

  // Calculate stroke-dashoffset for SVG ring
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = analysisResult 
    ? circumference - (analysisResult.score / 100) * circumference 
    : circumference;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.innerContainer}>
          {/* Header */}
          <ScrollReveal>
            <header className={commonStyles.header}>
              <div className={cn(commonStyles.headerIcon, themeStyles.headerIcon)}>
                <Shield size={32} />
              </div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>AI Fraud & Spam Analyzer</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Powered by advanced AI to detect fraudulent patterns, spam indicators, and suspicious content in project descriptions, messages, and user profiles.
              </p>
            </header>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={0.1}>
            <form className={cn(commonStyles.form, themeStyles.form)} onSubmit={handleAnalysis}>
              <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                <FileText size={16} />
                Content to Analyze
              </label>
              <textarea
                className={cn(commonStyles.textarea, themeStyles.textarea)}
                rows={8}
                placeholder="Paste the project description, message content, or user bio you want to analyze for potential fraud or spam..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                disabled={isLoading}
              />
              
              <div className={commonStyles.formActions}>
                <Button 
                  variant="primary" 
                  type="submit" 
                  isLoading={isLoading}
                  iconBefore={<Zap size={18} />}
                  disabled={!text.trim()}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Content'}
                </Button>
                
                <button 
                  type="button"
                  className={cn(commonStyles.sampleButton, themeStyles.sampleButton)}
                  onClick={() => loadSample('clean')}
                  disabled={isLoading}
                >
                  Load Clean Sample
                </button>
                <button 
                  type="button"
                  className={cn(commonStyles.sampleButton, themeStyles.sampleButton)}
                  onClick={() => loadSample('suspicious')}
                  disabled={isLoading}
                >
                  Load Suspicious Sample
                </button>
              </div>
            </form>
          </ScrollReveal>

          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isLoading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(commonStyles.form, themeStyles.form)}
              >
                <div className={commonStyles.loadingState}>
                  <div className={cn(commonStyles.loadingSpinner, themeStyles.loadingSpinner)} />
                  <p className={cn(commonStyles.loadingText, themeStyles.loadingText)}>Analyzing content patterns...</p>
                  <p className={cn(commonStyles.loadingSubtext, themeStyles.loadingSubtext)}>Our AI is scanning for fraud indicators</p>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {analysisResult && !isLoading && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(commonStyles.result, themeStyles.result, riskClass, riskThemeClass)}
              >
                <div className={cn(commonStyles.resultHeader, themeStyles.resultHeader)}>
                  <div className={cn(commonStyles.resultIcon, themeStyles.resultIcon)}>
                    {getRiskIcon(analysisResult.riskLevel)}
                  </div>
                  <div>
                    <h2 className={cn(commonStyles.resultTitle, themeStyles.resultTitle)}>Analysis Complete</h2>
                    <p className={cn(commonStyles.resultSubtitle, themeStyles.resultSubtitle)}>
                      {analysisResult.confidence}% confidence score
                    </p>
                  </div>
                </div>

                <div className={commonStyles.resultSummary}>
                  {/* Animated Score Circle */}
                  <div className={commonStyles.scoreCircle}>
                    <svg className={commonStyles.scoreRing} viewBox="0 0 140 140">
                      <circle 
                        cx="70" 
                        cy="70" 
                        r="60" 
                        className={cn(commonStyles.scoreRingBg, themeStyles.scoreRingBg)}
                      />
                      <motion.circle 
                        cx="70" 
                        cy="70" 
                        r="60" 
                        className={cn(commonStyles.scoreRingProgress, themeStyles.scoreRingProgress)}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className={commonStyles.scoreValue}>
                      <motion.p 
                        className={cn(commonStyles.resultScore, themeStyles.resultScore)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {analysisResult.score}
                      </motion.p>
                      <span className={cn(commonStyles.scoreLabel, themeStyles.scoreLabel)}>Risk Score</span>
                    </div>
                  </div>

                  {/* Risk Info */}
                  <div className={commonStyles.riskMeter}>
                    <p className={cn(commonStyles.resultLevel, themeStyles.resultLevel)}>
                      {analysisResult.riskLevel} Risk
                      <span className={cn(commonStyles.riskBadge, themeStyles.riskBadge)}>
                        {analysisResult.riskLevel}
                      </span>
                    </p>
                    <p className={cn(commonStyles.riskDescription, themeStyles.riskDescription)}>
                      {getRiskDescription(analysisResult.riskLevel)}
                    </p>
                  </div>
                </div>

                {/* Warnings */}
                {analysisResult.warnings.length > 0 && (
                  <div className={cn(commonStyles.resultWarnings, themeStyles.resultWarnings)}>
                    <h3>
                      <AlertTriangle size={18} />
                      {analysisResult.warnings.length} Issue{analysisResult.warnings.length > 1 ? 's' : ''} Detected
                    </h3>
                    <ul className={commonStyles.warningsList}>
                      {analysisResult.warnings.map((warning, index) => (
                        <motion.li 
                          key={index} 
                          className={cn(commonStyles.warningItem, themeStyles.warningItem)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + (index * 0.1) }}
                        >
                          <span className={cn(commonStyles.warningIcon, themeStyles.warningIcon)}>!</span>
                          {warning}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className={cn(commonStyles.resultActions, themeStyles.resultActions)}>
                  <Button 
                    variant="secondary" 
                    iconBefore={<RefreshCw size={18} />}
                    onClick={handleReset}
                  >
                    Analyze Another
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default FraudCheck;
