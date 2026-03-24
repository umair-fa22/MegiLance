// @AI-HINT: Premium sentiment analysis component with gauge visualization, keywords, and detailed feedback
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Smile, Meh, Frown, Activity } from 'lucide-react';
import commonStyles from './SentimentAnalyzer.common.module.css';
import lightStyles from './SentimentAnalyzer.light.module.css';
import darkStyles from './SentimentAnalyzer.dark.module.css';

interface SentimentAnalyzerProps {
  // A score from -1 (very negative) to 1 (very positive)
  score: number;
  className?: string;
  keywords?: string[];
  analysis?: string;
}

const SentimentAnalyzer: React.FC<SentimentAnalyzerProps> = ({ 
  score, 
  className,
  keywords = [],
  analysis
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Normalize score to 0-100 for gauge
  const percentage = Math.min(100, Math.max(0, ((score + 1) / 2) * 100));

  const getSentimentDetails = (score: number) => {
    if (score > 0.2) {
      return { 
        label: 'Positive', 
        icon: Smile, 
        styleClass: themeStyles.positive,
        fillClass: themeStyles.positiveFill
      };
    }
    if (score < -0.2) {
      return { 
        label: 'Negative', 
        icon: Frown, 
        styleClass: themeStyles.negative,
        fillClass: themeStyles.negativeFill
      };
    }
    return { 
      label: 'Neutral', 
      icon: Meh, 
      styleClass: themeStyles.neutral,
      fillClass: themeStyles.neutralFill
    };
  };

  const { label, icon: Icon, styleClass, fillClass } = getSentimentDetails(score);

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      <div className={commonStyles.header}>
        <div className={cn(commonStyles.title, themeStyles.title)}>
          <Activity size={16} />
          Tone Analysis
        </div>
        <div className={cn(commonStyles.scoreBadge, styleClass)}>
          <Icon size={12} />
          {label}
        </div>
      </div>

      <div className={cn(commonStyles.gaugeContainer, themeStyles.gaugeContainer)}>
        <div 
          className={cn(commonStyles.gaugeFill, fillClass)} 
          style={{ width: `${percentage}%` }}
        />
        <div className={commonStyles.marker} />
      </div>

      <div className={commonStyles.labels}>
        <span>Negative</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>

      {analysis && (
        <p className={cn(commonStyles.analysisText, themeStyles.analysisText)}>
          {analysis}
        </p>
      )}

      {keywords.length > 0 && (
        <div className={commonStyles.keywordsContainer}>
          {keywords.map((keyword, index) => (
            <span key={index} className={cn(commonStyles.keyword, themeStyles.keyword)}>
              #{keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentimentAnalyzer;
