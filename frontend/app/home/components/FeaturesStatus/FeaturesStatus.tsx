// @AI-HINT: Homepage section showcasing all platform features and modules with status indicators for FYP evaluation clarity

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  Briefcase, Users, MessageSquare, CreditCard, Shield, 
  Brain, Search, BarChart3, Zap, Lock, FileText, Star,
  TrendingUp, Activity, Settings, Globe, Bot, Sparkles
} from 'lucide-react';
import FeatureStatusPill from '@/app/components/molecules/FeatureStatusPill/FeatureStatusPill';

import commonStyles from './FeaturesStatus.common.module.css';
import lightStyles from './FeaturesStatus.light.module.css';
import darkStyles from './FeaturesStatus.dark.module.css';

// All platform features organized by category
const featureCategories = [
  {
    category: 'Core Platform',
    icon: Globe,
    features: [
      { name: 'Project Marketplace', status: 'complete' as const, icon: Briefcase },
      { name: 'User Profiles', status: 'complete' as const, icon: Users },
      { name: 'Real-time Messaging', status: 'advanced' as const, icon: MessageSquare },
      { name: 'Payment System', status: 'complete' as const, icon: CreditCard },
      { name: 'Contract Management', status: 'working' as const, icon: FileText },
      { name: 'Reviews & Ratings', status: 'complete' as const, icon: Star },
    ]
  },
  {
    category: 'AI Features',
    icon: Brain,
    features: [
      { name: 'AI Chatbot Assistant', status: 'advanced' as const, icon: Bot },
      { name: 'Smart Matching Algorithm', status: 'advanced' as const, icon: Search },
      { name: 'Price Estimator ML', status: 'advanced' as const, icon: BarChart3 },
      { name: 'Fraud Detection', status: 'working' as const, icon: Shield },
      { name: 'AI Content Moderation', status: 'working' as const, icon: Sparkles },
    ]
  },
  {
    category: 'Security & Payment',
    icon: Lock,
    features: [
      { name: 'Blockchain Escrow', status: 'complete' as const, icon: Lock },
      { name: 'Crypto Payments', status: 'working' as const, icon: CreditCard },
      { name: 'Multi-Signature Wallet', status: 'basic' as const, icon: Shield },
      { name: 'Dispute Resolution', status: 'working' as const, icon: Activity },
      { name: 'Milestone Payments', status: 'complete' as const, icon: TrendingUp },
    ]
  },
  {
    category: 'Admin & Management',
    icon: Settings,
    features: [
      { name: 'Admin Dashboard', status: 'complete' as const, icon: Settings },
      { name: 'User Management', status: 'complete' as const, icon: Users },
      { name: 'Analytics & Reports', status: 'working' as const, icon: BarChart3 },
      { name: 'Content Moderation', status: 'working' as const, icon: Shield },
      { name: 'System Health Monitor', status: 'complete' as const, icon: Activity },
    ]
  }
];

const FeaturesStatus: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Calculate statistics
  const totalFeatures = featureCategories.reduce((sum, cat) => sum + cat.features.length, 0);
  const completeFeatures = featureCategories.reduce(
    (sum, cat) => sum + cat.features.filter(f => f.status === 'complete').length, 0
  );
  const advancedFeatures = featureCategories.reduce(
    (sum, cat) => sum + cat.features.filter(f => f.status === 'advanced').length, 0
  );
  const workingFeatures = featureCategories.reduce(
    (sum, cat) => sum + cat.features.filter(f => f.status === 'working').length, 0
  );

  return (
    <section className={cn(commonStyles.section, themeStyles.section)}>
      <div className={commonStyles.container}>
        <div className={commonStyles.header}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Platform Features Overview
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Complete feature implementation status for FYP evaluation
          </p>
          
          {/* Summary Stats */}
          <div className={commonStyles.stats}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{totalFeatures}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Features</div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{completeFeatures}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Complete</div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{advancedFeatures}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Advanced AI</div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{workingFeatures}</div>
              <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Working</div>
            </div>
          </div>
        </div>

        {/* Feature Categories Grid */}
        <div className={commonStyles.categoriesGrid}>
          {featureCategories.map((category, idx) => {
            const CategoryIcon = category.icon;
            return (
              <div 
                key={idx} 
                className={cn(commonStyles.categoryCard, themeStyles.categoryCard)}
              >
                <div className={commonStyles.categoryHeader}>
                  <CategoryIcon className={cn(commonStyles.categoryIcon, themeStyles.categoryIcon)} size={24} />
                  <h3 className={cn(commonStyles.categoryTitle, themeStyles.categoryTitle)}>
                    {category.category}
                  </h3>
                </div>
                <ul className={commonStyles.featuresList}>
                  {category.features.map((feature, featureIdx) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <li 
                        key={featureIdx} 
                        className={cn(commonStyles.featureItem, themeStyles.featureItem)}
                      >
                        <FeatureIcon size={16} className={commonStyles.featureIcon} />
                        <span className={commonStyles.featureName}>{feature.name}</span>
                        <FeatureStatusPill status={feature.status} size="xs" compact />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={cn(commonStyles.legend, themeStyles.legend)}>
          <div className={commonStyles.legendTitle}>Status Legend:</div>
          <div className={commonStyles.legendItems}>
            <div className={commonStyles.legendItem}>
              <FeatureStatusPill status="complete" size="xs" compact />
              <span>Fully Implemented</span>
            </div>
            <div className={commonStyles.legendItem}>
              <FeatureStatusPill status="advanced" size="xs" compact />
              <span>AI/ML Powered</span>
            </div>
            <div className={commonStyles.legendItem}>
              <FeatureStatusPill status="working" size="xs" compact />
              <span>Functional</span>
            </div>
            <div className={commonStyles.legendItem}>
              <FeatureStatusPill status="basic" size="xs" compact />
              <span>Basic Version</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesStatus;
