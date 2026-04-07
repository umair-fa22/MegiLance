// @AI-HINT: Gamification and Leaderboards component for displaying top freelancers based on metrics like earnings, ratings, and completed projects.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './FreelancerLeaderboard.common.module.css';
import lightStyles from './FreelancerLeaderboard.light.module.css';
import darkStyles from './FreelancerLeaderboard.dark.module.css';
import { Trophy, Star, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  score: number;
  projectsCompleted: number;
  rating: number;
  badges: string[];
  trend: 'up' | 'down' | 'same';
}

interface FreelancerLeaderboardProps {
  timeframe?: 'weekly' | 'monthly' | 'all-time';
}

export default function FreelancerLeaderboard({ timeframe = 'monthly' }: FreelancerLeaderboardProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const [activeTimeframe, setActiveTimeframe] = useState(timeframe);

  // Mock data representing freelancers
  const freelancers: LeaderboardUser[] = [
    { id: '1', name: 'Alice Walker', avatar: 'AW', rank: 1, score: 9850, projectsCompleted: 45, rating: 5.0, badges: ['Top Rated', 'Fast Responder'], trend: 'same' },
    { id: '2', name: 'Bob Singer', avatar: 'BS', rank: 2, score: 9120, projectsCompleted: 38, rating: 4.9, badges: ['Top 1%'], trend: 'up' },
    { id: '3', name: 'Charlie Day', avatar: 'CD', rank: 3, score: 8740, projectsCompleted: 42, rating: 4.8, badges: ['Rising Talent'], trend: 'up' },
    { id: '4', name: 'Diana Prince', avatar: 'DP', rank: 4, score: 8400, projectsCompleted: 30, rating: 4.9, badges: [], trend: 'down' },
  ];

  return (
    <div className={cn(commonStyles.leaderboardContainer, themeStyles.leaderboardContainer)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.headerTitle}>
          <Trophy size={24} className={commonStyles.trophyIcon} />
          <h2>Top Freelancers</h2>
        </div>
        <div className={commonStyles.timeframeToggle}>
          <Button 
            variant={activeTimeframe === 'weekly' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTimeframe('weekly')}
          >
            Weekly
          </Button>
          <Button 
            variant={activeTimeframe === 'monthly' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTimeframe('monthly')}
          >
            Monthly
          </Button>
          <Button 
            variant={activeTimeframe === 'all-time' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTimeframe('all-time')}
          >
            All Time
          </Button>
        </div>
      </div>

      <div className={commonStyles.listContainer}>
        {freelancers.map((user) => (
          <div key={user.id} className={cn(commonStyles.userCard, themeStyles.userCard)}>
            <div className={commonStyles.rankBadge}>
              <span className={commonStyles.rankNumber}>#{user.rank}</span>
              {user.trend === 'up' && <ChevronUp size={14} className={commonStyles.trendUp} />}
              {user.trend === 'down' && <ChevronDown size={14} className={commonStyles.trendDown} />}
            </div>
            
            <div className={commonStyles.userInfo}>
              <div className={commonStyles.avatar}>{user.avatar}</div>
              <div className={commonStyles.details}>
                <h4>{user.name}</h4>
                <div className={commonStyles.badges}>
                  {user.badges.map(badge => (
                    <span key={badge} className={cn(commonStyles.badge, themeStyles.badge)}>{badge}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={commonStyles.stats}>
              <div className={commonStyles.statItem}>
                <span className={commonStyles.statLabel}>Score</span>
                <span className={commonStyles.statValue}>{user.score.toLocaleString()}</span>
              </div>
              <div className={commonStyles.statItem}>
                <span className={commonStyles.statLabel}>Projects</span>
                <span className={commonStyles.statValue}>
                  <CheckCircle size={14} className={commonStyles.iconInline} /> {user.projectsCompleted}
                </span>
              </div>
              <div className={commonStyles.statItem}>
                <span className={commonStyles.statLabel}>Rating</span>
                <span className={commonStyles.statValue}>
                  <Star size={14} className={commonStyles.iconInlineStar} /> {user.rating}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
