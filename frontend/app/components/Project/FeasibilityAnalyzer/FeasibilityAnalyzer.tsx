// @AI-HINT: Component to analyze project feasibility using AI
'use client';

import { useState } from 'react'
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import api from '@/lib/api';

import commonStyles from './FeasibilityAnalyzer.common.module.css';
import lightStyles from './FeasibilityAnalyzer.light.module.css';
import darkStyles from './FeasibilityAnalyzer.dark.module.css';

interface FeasibilityAnalyzerProps {
  projectDescription: string;
  budgetMin: number;
  budgetMax: number;
  timelineDays: number;
}

interface AnalysisResult {
  complexity_score: number;
  budget_realism: string;
  timeline_realism: string;
  flags: string[];
  recommendations: string[];
}

export default function FeasibilityAnalyzer({
  projectDescription,
  budgetMin,
  budgetMax,
  timelineDays,
}: FeasibilityAnalyzerProps) {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    scoreContainer: cn(commonStyles.scoreContainer, themeStyles.scoreContainer),
    scoreLabel: cn(commonStyles.scoreLabel, themeStyles.scoreLabel),
    scoreValue: cn(commonStyles.scoreValue, themeStyles.scoreValue),
    flagsList: cn(commonStyles.flagsList, themeStyles.flagsList),
    flagItem: cn(commonStyles.flagItem, themeStyles.flagItem),
    recommendations: cn(commonStyles.recommendations, themeStyles.recommendations),
    headerIcon: themeStyles.headerIcon,
    emptyState: commonStyles.emptyState,
    emptyText: cn(commonStyles.emptyText, themeStyles.emptyText),
    resultArea: commonStyles.resultArea,
    scoresGrid: commonStyles.scoresGrid,
    scoreCard: cn(commonStyles.scoreCard, themeStyles.scoreCard),
    scoreCardLabel: cn(commonStyles.scoreCardLabel, themeStyles.scoreCardLabel),
    scoreCardValue: commonStyles.scoreCardValue,
    scoreCardValueHigh: themeStyles.scoreCardValueHigh,
    scoreCardValueLow: themeStyles.scoreCardValueLow,
    scoreCardValueWarning: themeStyles.scoreCardValueWarning,
    flagsSection: commonStyles.flagsSection,
    sectionTitle: commonStyles.sectionTitle,
    sectionTitleWarning: themeStyles.sectionTitleWarning,
    sectionTitleInfo: themeStyles.sectionTitleInfo,
    recList: cn(commonStyles.recList, themeStyles.recList),
    recItem: commonStyles.recItem,
    recIcon: cn(commonStyles.recIcon, themeStyles.recIcon),
    reanalyzeWrapper: commonStyles.reanalyzeWrapper,
  };

  const handleAnalyze = async () => {
    if (!projectDescription || !budgetMax || !timelineDays) return;

    setLoading(true);
    try {
      const response = await api.aiWriting.analyzeFeasibility({
        project_description: projectDescription,
        budget_min: budgetMin,
        budget_max: budgetMax,
        timeline_days: timelineDays,
      });
      setResult(response);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze when props change significantly (debounced in real app)
  // For now, manual trigger via button or effect if we want auto
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <TrendingUp className={styles.headerIcon} size={20} />
        <h3 className={styles.title}>Project Feasibility Check</h3>
      </div>

      {!result ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            Check if your budget and timeline align with your project scope.
          </p>
          <Button
            variant="primary"
            onClick={handleAnalyze}
            isLoading={loading}
            disabled={!projectDescription || loading}
            size="sm"
          >
            Analyze Feasibility
          </Button>
        </div>
      ) : (
        <div className={styles.resultArea}>
          <div className={styles.scoresGrid}>
            <div className={styles.scoreCard}>
              <div className={styles.scoreCardLabel}>Complexity</div>
              <div className={styles.scoreCardValue}>{result.complexity_score}/10</div>
            </div>
            <div className={styles.scoreCard}>
              <div className={styles.scoreCardLabel}>Budget</div>
              <div className={cn(
                styles.scoreCardValue,
                result.budget_realism === 'High' ? styles.scoreCardValueHigh : styles.scoreCardValueLow
              )}>
                {result.budget_realism}
              </div>
            </div>
            <div className={styles.scoreCard}>
              <div className={styles.scoreCardLabel}>Timeline</div>
              <div className={cn(
                styles.scoreCardValue,
                result.timeline_realism === 'Realistic' ? styles.scoreCardValueHigh : styles.scoreCardValueWarning
              )}>
                {result.timeline_realism}
              </div>
            </div>
          </div>

          {result.flags.length > 0 && (
            <div className={styles.flagsSection}>
              <h4 className={cn(styles.sectionTitle, styles.sectionTitleWarning)}>
                <AlertTriangle size={16} /> Potential Issues
              </h4>
              <ul className={styles.flagsList}>
                {result.flags.map((flag, idx) => (
                  <li key={idx} className={styles.flagItem}>
                    <span>•</span> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h4 className={cn(styles.sectionTitle, styles.sectionTitleInfo)}>
                <Lightbulb size={16} /> Recommendations
              </h4>
              <ul className={styles.recList}>
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className={styles.recItem}>
                    <CheckCircle className={styles.recIcon} size={12} />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={styles.reanalyzeWrapper}>
             <Button variant="ghost" size="sm" onClick={handleAnalyze} isLoading={loading}>
               Re-analyze
             </Button>
          </div>
        </div>
      )}
    </div>
  );
};
