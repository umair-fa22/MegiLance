// @AI-HINT: Freelancer rank/level page - gamification system showing progress and achievements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Loading from '@/app/components/Loading/Loading';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { Trophy, Star, Clock, Users, DollarSign, TrendingUp } from 'lucide-react';
import { gamificationApi as _gamificationApi } from '@/lib/api';
import commonStyles from './Rank.common.module.css';
import lightStyles from './Rank.light.module.css';
import darkStyles from './Rank.dark.module.css';

const gamificationApi: any = _gamificationApi;

interface RankData {
  current_rank: string;
  rank_level: number;
  total_points: number;
  points_to_next: number;
  next_rank: string;
  progress_percent: number;
  badges: Badge[];
  stats: RankStats;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface RankStats {
  completed_projects: number;
  on_time_delivery: number;
  client_satisfaction: number;
  repeat_clients: number;
  total_earnings: number;
}

const RANKS = [
  { name: 'Newcomer', level: 1, points: 0, color: '#6b7280' },
  { name: 'Rising Star', level: 2, points: 100, color: '#10b981' },
  { name: 'Professional', level: 3, points: 500, color: '#3b82f6' },
  { name: 'Expert', level: 4, points: 1500, color: '#8b5cf6' },
  { name: 'Top Rated', level: 5, points: 5000, color: '#f59e0b' },
  { name: 'Elite', level: 6, points: 15000, color: '#ef4444' },
];

export default function RankPage() {
  const { resolvedTheme } = useTheme();
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankData();
  }, []);

  const loadRankData = async () => {
    try {
      setLoading(true);
      const [rankRes, badgesRes] = await Promise.all([
        gamificationApi.getMyRank().catch(() => null),
        gamificationApi.getBadges().catch(() => null),
      ]);

      if (!rankRes) {
        setRankData(null);
        return;
      }

      const badgesList = Array.isArray(badgesRes) ? badgesRes : badgesRes?.badges || [];
      const currentLevel = rankRes.level || 1;
      const currentRankInfo = RANKS[currentLevel - 1] || RANKS[0];
      const nextRankInfo = RANKS[currentLevel] || RANKS[RANKS.length - 1];
      const points = rankRes.points || 0;
      const pointsForNext = nextRankInfo.points - points;
      const progressRange = nextRankInfo.points - currentRankInfo.points;
      const progressPercent = progressRange > 0 ? Math.round(((points - currentRankInfo.points) / progressRange) * 100) : 100;

      setRankData({
        current_rank: rankRes.rank || currentRankInfo.name,
        rank_level: currentLevel,
        total_points: points,
        points_to_next: Math.max(0, pointsForNext),
        next_rank: nextRankInfo.name,
        progress_percent: Math.min(100, Math.max(0, progressPercent)),
        badges: badgesList.map((b: any) => ({
          id: String(b.id),
          name: b.name || 'Badge',
          description: b.description || '',
          icon: b.icon || '🏅',
          earned_at: b.earned_at || b.created_at || '',
          rarity: b.rarity || 'common',
        })),
        stats: {
          completed_projects: rankRes.completed_projects || rankRes.stats?.completed_projects || 0,
          on_time_delivery: rankRes.on_time_delivery || rankRes.stats?.on_time_delivery || 0,
          client_satisfaction: rankRes.client_satisfaction || rankRes.stats?.client_satisfaction || 0,
          repeat_clients: rankRes.repeat_clients || rankRes.stats?.repeat_clients || 0,
          total_earnings: rankRes.total_earnings || rankRes.stats?.total_earnings || 0,
        },
      });
    } catch (error) {
      console.error('Failed to load rank data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (level: number) => {
    return RANKS[level - 1]?.color || '#6b7280';
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading || !rankData) {
    return <Loading />;
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <h1 className={cn(commonStyles.title, themeStyles.title)}>Your Rank & Progress</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Level up by completing projects and earning great reviews
            </p>
          </div>
        </ScrollReveal>

        {/* Rank Card */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.rankCard, themeStyles.rankCard)}>
            <div className={commonStyles.rankBadge} style={{ background: getRankColor(rankData.rank_level) }}>
              <span className={commonStyles.rankLevel}>{rankData.rank_level}</span>
            </div>
            <div className={commonStyles.rankInfo}>
              <h2 className={cn(commonStyles.rankName, themeStyles.rankName)} style={{ color: getRankColor(rankData.rank_level) }}>
                {rankData.current_rank}
              </h2>
              <p className={cn(commonStyles.rankPoints, themeStyles.rankPoints)}>
                {rankData.total_points.toLocaleString()} XP
              </p>
            </div>
            <div className={commonStyles.progressSection}>
              <div className={commonStyles.progressHeader}>
                <span className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>
                  Progress to {rankData.next_rank}
                </span>
                <span className={cn(commonStyles.progressValue, themeStyles.progressValue)}>
                  {rankData.points_to_next} XP to go
                </span>
              </div>
              <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
                <div 
                  className={commonStyles.progressFill}
                  style={{ 
                    width: `${rankData.progress_percent}%`,
                    background: getRankColor(rankData.rank_level + 1)
                  }}
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.section, themeStyles.section)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              <TrendingUp size={18} /> Your Stats
            </h3>
            <div className={commonStyles.statsGrid}>
              {[
                { value: rankData.stats.completed_projects, label: 'Projects Completed', icon: <Trophy size={20} /> },
                { value: `${rankData.stats.on_time_delivery}%`, label: 'On-Time Delivery', icon: <Clock size={20} /> },
                { value: `${rankData.stats.client_satisfaction}%`, label: 'Client Satisfaction', icon: <Star size={20} /> },
                { value: rankData.stats.repeat_clients, label: 'Repeat Clients', icon: <Users size={20} /> },
              ].map((stat, i) => (
                <div key={i} className={cn(commonStyles.statCard, themeStyles.statCard)}>
                  <div className={cn(commonStyles.statIconWrapper, themeStyles.statIconWrapper)}>
                    {stat.icon}
                  </div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stat.value}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Rank Tiers */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.section, themeStyles.section)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Rank Tiers</h3>
            <div className={commonStyles.tiersGrid}>
              {RANKS.map((rank) => (
                <div 
                  key={rank.name}
                  className={cn(
                    commonStyles.tierCard,
                    themeStyles.tierCard,
                    rankData.rank_level >= rank.level && commonStyles.tierUnlocked,
                    rankData.rank_level >= rank.level && themeStyles.tierUnlocked,
                    rankData.rank_level === rank.level && commonStyles.tierCurrent,
                    rankData.rank_level === rank.level && themeStyles.tierCurrent
                  )}
                >
                  <div className={commonStyles.tierBadge} style={{ background: rank.color }}>
                    {rank.level}
                  </div>
                  <div className={commonStyles.tierInfo}>
                    <span className={cn(commonStyles.tierName, themeStyles.tierName)}>{rank.name}</span>
                    <span className={cn(commonStyles.tierPoints, themeStyles.tierPoints)}>
                      {rank.points.toLocaleString()} XP
                    </span>
                  </div>
                  {rankData.rank_level >= rank.level && (
                    <svg className={commonStyles.checkIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={rank.color} strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Badges */}
        <ScrollReveal delay={0.25}>
          <div className={cn(commonStyles.section, themeStyles.section)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Earned Badges</h3>
            <StaggerContainer className={commonStyles.badgesGrid}>
              {rankData.badges.map(badge => (
                <StaggerItem key={badge.id}>
                  <div 
                    className={cn(
                      commonStyles.badgeCard,
                      themeStyles.badgeCard,
                      commonStyles[`badge_${badge.rarity}`],
                      themeStyles[`badge_${badge.rarity}`]
                    )}
                  >
                    <span className={commonStyles.badgeIcon}>{badge.icon}</span>
                    <div className={commonStyles.badgeInfo}>
                      <span className={cn(commonStyles.badgeName, themeStyles.badgeName)}>{badge.name}</span>
                      <span className={cn(commonStyles.badgeDesc, themeStyles.badgeDesc)}>{badge.description}</span>
                    </div>
                    <span className={cn(commonStyles.badgeRarity, themeStyles.badgeRarity, commonStyles[`rarity_${badge.rarity}`])}>
                      {badge.rarity}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}
