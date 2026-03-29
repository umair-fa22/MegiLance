// @AI-HINT: Premium visualizer for freelancer rank with radial progress, animations, and detailed stats
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import DashboardWidget from '@/app/components/molecules/DashboardWidget/DashboardWidget';
import { Award, Gem, Medal, Shield, Trophy, TrendingUp, Zap } from 'lucide-react'

import commonStyles from './FreelancerRankVisualizer.common.module.css';
import lightStyles from './FreelancerRankVisualizer.light.module.css';
import darkStyles from './FreelancerRankVisualizer.dark.module.css';

interface FreelancerRankVisualizerProps {
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'N/A';
  score: number; // A score from 0 to 1000
  className?: string;
  percentile?: number;
  projectsCompleted?: number;
}

const rankTiers = {
  'Bronze': { icon: Medal, next: 'Silver', goal: 450, styleClass: 'rankBronze' },
  'Silver': { icon: Award, next: 'Gold', goal: 650, styleClass: 'rankSilver' },
  'Gold': { icon: Trophy, next: 'Platinum', goal: 850, styleClass: 'rankGold' },
  'Platinum': { icon: Shield, next: 'Diamond', goal: 950, styleClass: 'rankPlatinum' },
  'Diamond': { icon: Gem, next: null, goal: 1000, styleClass: 'rankDiamond' },
  'N/A': { icon: Medal, next: 'Bronze', goal: 250, styleClass: 'rankBronze' },
};

const FreelancerRankVisualizer: React.FC<FreelancerRankVisualizerProps> = ({ 
  rank, 
  score, 
  className,
  percentile = 0,
  projectsCompleted = 0
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const currentRank = rankTiers[rank] || rankTiers['N/A'];
  const RankIcon = currentRank.icon;
  
  const normalizedScore = Math.min(Math.max(score, 0), 1000);
  const progressPercentage = (normalizedScore / 1000) * 100;
  const pointsToNext = currentRank.next ? currentRank.goal - score : 0;
  const nextRankGoal = currentRank.goal;
  const prevRankGoal = rank === 'Bronze' || rank === 'N/A' ? 0 : 
    Object.values(rankTiers).find(r => r.next === rank)?.goal || 0;
  
  // Calculate progress within current tier for the bar
  const tierProgress = currentRank.next 
    ? Math.max(0, Math.min(100, ((score - prevRankGoal) / (nextRankGoal - prevRankGoal)) * 100))
    : 100;

  const radius = 70;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <DashboardWidget 
      title="Freelancer Rank" 
      icon={RankIcon} 
      className={cn(commonStyles.widgetContainer, themeStyles[currentRank.styleClass], className)}
    >
      <div className={commonStyles.contentWrapper}>
        <div className={commonStyles.progressContainer}>
          <svg height={radius * 2} width={radius * 2} className={commonStyles.radialSvg}>
            <circle
              className={cn(commonStyles.radialBg, themeStyles.radialBg)}
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              className={cn(commonStyles.radialProgress, themeStyles.radialProgress)}
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              stroke="var(--rank-color)"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          
          <div className={commonStyles.progressTextContainer}>
            <div className={cn(commonStyles.rankIconWrapper, commonStyles.rankColor)}>
              <RankIcon size={24} />
            </div>
            <p className={cn(commonStyles.scoreValue, themeStyles.scoreValue)}>{score}</p>
            <p className={cn(commonStyles.scoreLabel, themeStyles.scoreLabel)}>Reputation</p>
          </div>
        </div>

        <div className={commonStyles.detailsContainer}>
          <h3 className={commonStyles.rankName}>{rank} Tier</h3>
          
          {currentRank.next ? (
            <>
              <div className={cn(commonStyles.nextRankInfo, themeStyles.nextRankInfo)}>
                <span>{score}</span>
                <div className={cn(commonStyles.progressBarContainer, themeStyles.progressBarContainer)}>
                  <div 
                    className={commonStyles.progressBarFill} 
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
                <span>{currentRank.goal}</span>
              </div>
              <p className={cn(commonStyles.scoreLabel, themeStyles.scoreLabel, commonStyles.topSpacing)}>
                {pointsToNext} points to {currentRank.next}
              </p>
            </>
          ) : (
            <p className={cn(commonStyles.nextRankInfo, themeStyles.nextRankInfo)}>
              Max Rank Achieved!
            </p>
          )}

          <div className={cn(commonStyles.statsGrid, themeStyles.statsGrid)}>
            <div className={commonStyles.statItem}>
              <TrendingUp size={16} className={themeStyles.statLabel} />
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>Top {100 - percentile}%</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Percentile</span>
            </div>
            <div className={commonStyles.statItem}>
              <Zap size={16} className={themeStyles.statLabel} />
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{projectsCompleted}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Projects</span>
            </div>
          </div>

          <button className={cn(commonStyles.benefitsButton, themeStyles.benefitsButton)}>
            View Tier Benefits
          </button>
        </div>
      </div>
    </DashboardWidget>
  );
};

export default FreelancerRankVisualizer;
