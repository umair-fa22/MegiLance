// @AI-HINT: AI Insights Panel - Displays AI-powered insights, recommendations, and analysis results with beautiful visualizations
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
  ExternalLink,
  Clock,
  BarChart2,
  Users,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './AIInsightsPanel.common.module.css';
import lightStyles from './AIInsightsPanel.light.module.css';
import darkStyles from './AIInsightsPanel.dark.module.css';

export interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  confidence?: number;
  tags?: string[];
  actionLabel?: string;
  actionUrl?: string;
}

export interface AIRecommendation {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface AIStats {
  matchRate?: number;
  avgResponseTime?: string;
  activeMatches?: number;
  successRate?: number;
}

interface AIInsightsPanelProps {
  title?: string;
  subtitle?: string;
  insights: AIInsight[];
  recommendations?: AIRecommendation[];
  stats?: AIStats;
  isLoading?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  showActions?: boolean;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  title = 'AI Insights',
  subtitle = 'Powered by Machine Learning',
  insights,
  recommendations = [],
  stats,
  isLoading = false,
  lastUpdated,
  onRefresh,
  showActions = true
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'warning':
        return <AlertCircle />;
      case 'tip':
        return <Lightbulb />;
      default:
        return <TrendingUp />;
    }
  };

  const getInsightIconClass = (type: AIInsight['type']) => {
    switch (type) {
      case 'success':
        return themeStyles.insightIconWrapperSuccess;
      case 'warning':
        return themeStyles.insightIconWrapperWarning;
      default:
        return themeStyles.insightIconWrapperInfo;
    }
  };

  if (isLoading) {
    return (
      <div className={cn(commonStyles.panel, themeStyles.panel)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          <div className={cn(commonStyles.loadingSpinner, themeStyles.loadingSpinner)} />
          <span className={commonStyles.loadingText}>Analyzing with AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.panel, themeStyles.panel)}>
      {/* Header */}
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div className={commonStyles.headerLeft}>
          <div className={cn(commonStyles.aiIcon, themeStyles.aiIcon)}>
            <Sparkles />
          </div>
          <div>
            <div className={cn(commonStyles.headerTitle, themeStyles.headerTitle)}>
              {title}
            </div>
            <div className={cn(commonStyles.headerSubtitle, themeStyles.headerSubtitle)}>
              {subtitle}
            </div>
          </div>
        </div>
        <div className={cn(commonStyles.statusBadge, themeStyles.statusBadge)}>
          <span className={cn(commonStyles.statusDot, themeStyles.statusDot)} />
          <span>Active</span>
        </div>
      </div>

      {/* Content */}
      <div className={commonStyles.content}>
        {/* Insights List */}
        <div className={commonStyles.insightsList}>
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className={cn(commonStyles.insightCard, themeStyles.insightCard)}
            >
              <div className={cn(
                commonStyles.insightIconWrapper, 
                themeStyles.insightIconWrapper,
                getInsightIconClass(insight.type)
              )}>
                {getInsightIcon(insight.type)}
              </div>
              <div className={commonStyles.insightContent}>
                <div className={cn(commonStyles.insightTitle, themeStyles.insightTitle)}>
                  {insight.title}
                </div>
                <div className={cn(commonStyles.insightDescription, themeStyles.insightDescription)}>
                  {insight.description}
                </div>
                {(insight.tags || insight.confidence) && (
                  <div className={cn(commonStyles.insightMeta, themeStyles.insightMeta)}>
                    {insight.confidence && (
                      <span className={cn(
                        commonStyles.insightTag, 
                        themeStyles.insightTag,
                        themeStyles.insightTagSuccess
                      )}>
                        <Zap size={10} /> {insight.confidence}% confident
                      </span>
                    )}
                    {insight.tags?.map((tag) => (
                      <span 
                        key={tag} 
                        className={cn(commonStyles.insightTag, themeStyles.insightTag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className={cn(commonStyles.recommendationsSection, themeStyles.recommendationsSection)}>
            <div className={cn(commonStyles.sectionLabel, themeStyles.sectionLabel)}>
              <Target size={14} />
              Quick Actions
            </div>
            <div className={commonStyles.recommendationsList}>
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  className={cn(commonStyles.recommendationChip, themeStyles.recommendationChip)}
                  onClick={rec.onClick}
                >
                  {rec.icon}
                  <span>{rec.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className={commonStyles.statsGrid}>
            {stats.matchRate !== undefined && (
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {stats.matchRate}%
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
                  Match Rate
                </div>
              </div>
            )}
            {stats.activeMatches !== undefined && (
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {stats.activeMatches}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
                  Active Matches
                </div>
              </div>
            )}
            {stats.successRate !== undefined && (
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {stats.successRate}%
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
                  Success Rate
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className={cn(commonStyles.actions, themeStyles.actions)}>
          <button 
            className={cn(commonStyles.actionBtn, themeStyles.actionBtnPrimary)}
            onClick={onRefresh}
          >
            <RefreshCw size={16} />
            Refresh Insights
          </button>
          <button className={cn(commonStyles.actionBtn, themeStyles.actionBtnSecondary)}>
            <ExternalLink size={16} />
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
