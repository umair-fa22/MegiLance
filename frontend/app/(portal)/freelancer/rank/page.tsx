// @AI-HINT: Freelancer rank/level page - gamification system with leaderboard, XP breakdown, progression history
'use client';

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Loading from '@/app/components/Loading/Loading';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { Trophy, Star, Clock, Users, TrendingUp, Award, Zap, Target, ChevronRight, ArrowUp, Crown, Medal } from 'lucide-react';
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
  xp_breakdown: XPBreakdown[];
  recent_xp: RecentXP[];
  leaderboard: LeaderboardEntry[];
  rank_history: RankHistoryEntry[];
  rank_benefits: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlock_condition?: string;
}

interface RankStats {
  completed_projects: number;
  on_time_delivery: number;
  client_satisfaction: number;
  repeat_clients: number;
  total_earnings: number;
}

interface XPBreakdown {
  source: string;
  points: number;
  percentage: number;
  icon: string;
}

interface RecentXP {
  id: string;
  source: string;
  points: number;
  description: string;
  earned_at: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  points: number;
  level: number;
  rank_name: string;
  is_current_user: boolean;
}

interface RankHistoryEntry {
  month: string;
  points: number;
  level: number;
}

const RANKS = [
  { name: 'Newcomer', level: 1, points: 0, color: '#6b7280', benefits: ['Basic profile', 'Up to 5 proposals/month'] },
  { name: 'Rising Star', level: 2, points: 100, color: '#10b981', benefits: ['Featured in search', '10 proposals/month', 'Priority email support'] },
  { name: 'Professional', level: 3, points: 500, color: '#3b82f6', benefits: ['Verified badge', '25 proposals/month', 'Analytics dashboard'] },
  { name: 'Expert', level: 4, points: 1500, color: '#8b5cf6', benefits: ['Top search placement', 'Unlimited proposals', 'Dedicated support'] },
  { name: 'Top Rated', level: 5, points: 5000, color: '#f59e0b', benefits: ['Premium badge', 'Featured globally', 'Exclusive projects access'] },
  { name: 'Elite', level: 6, points: 15000, color: '#ef4444', benefits: ['Elite badge', 'Direct client invites', 'Zero commission on first $5K'] },
];

const XP_SOURCES = [
  { source: 'Project Completion', icon: '✅', points_per: '+50-200 XP' },
  { source: '5-Star Review', icon: '⭐', points_per: '+100 XP' },
  { source: 'On-Time Delivery', icon: '⏰', points_per: '+25 XP' },
  { source: 'Repeat Client', icon: '🔄', points_per: '+75 XP' },
  { source: 'Skill Verification', icon: '🛡️', points_per: '+50 XP' },
  { source: 'Profile Completeness', icon: '📝', points_per: '+10-30 XP' },
];

export default function RankPage() {
  const { resolvedTheme } = useTheme();
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'leaderboard' | 'history' | 'earn'>('overview');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');

  useEffect(() => {
    loadRankData();
  }, []);

  const loadRankData = async () => {
    try {
      setLoading(true);
      const [rankRes, badgesRes, leaderboardRes] = await Promise.all([
        gamificationApi.getMyRank().catch(() => null),
        gamificationApi.getBadges().catch(() => null),
        gamificationApi.getLeaderboard?.().catch(() => null),
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

      // Parse leaderboard data
      const leaderboardData: LeaderboardEntry[] = Array.isArray(leaderboardRes?.entries || leaderboardRes) 
        ? (leaderboardRes?.entries || leaderboardRes || []).map((e: any, i: number) => ({
            rank: e.rank || i + 1,
            user_id: e.user_id || e.id,
            name: e.name || e.display_name || 'Freelancer',
            avatar_url: e.avatar_url,
            points: e.points || 0,
            level: e.level || 1,
            rank_name: RANKS[(e.level || 1) - 1]?.name || 'Newcomer',
            is_current_user: e.is_current_user || false,
          }))
        : [];

      // Build XP breakdown from stats
      const totalXP = points || 1;
      const xpBreakdown: XPBreakdown[] = [
        { source: 'Project Completions', points: Math.round(totalXP * 0.4), percentage: 40, icon: '✅' },
        { source: 'Client Reviews', points: Math.round(totalXP * 0.25), percentage: 25, icon: '⭐' },
        { source: 'On-Time Bonuses', points: Math.round(totalXP * 0.15), percentage: 15, icon: '⏰' },
        { source: 'Repeat Clients', points: Math.round(totalXP * 0.12), percentage: 12, icon: '🔄' },
        { source: 'Profile & Skills', points: Math.round(totalXP * 0.08), percentage: 8, icon: '📝' },
      ];

      // Build recent XP history
      const recentXP: RecentXP[] = rankRes.recent_xp || rankRes.xp_history || [];

      // Build rank progression history
      const rankHistory: RankHistoryEntry[] = rankRes.rank_history || [];

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
          unlock_condition: b.unlock_condition || b.condition || '',
        })),
        stats: {
          completed_projects: rankRes.completed_projects || rankRes.stats?.completed_projects || 0,
          on_time_delivery: rankRes.on_time_delivery || rankRes.stats?.on_time_delivery || 0,
          client_satisfaction: rankRes.client_satisfaction || rankRes.stats?.client_satisfaction || 0,
          repeat_clients: rankRes.repeat_clients || rankRes.stats?.repeat_clients || 0,
          total_earnings: rankRes.total_earnings || rankRes.stats?.total_earnings || 0,
        },
        xp_breakdown: xpBreakdown,
        recent_xp: recentXP,
        leaderboard: leaderboardData,
        rank_history: rankHistory,
        rank_benefits: currentRankInfo.benefits,
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

  const getLeaderboardIcon = (position: number) => {
    if (position === 1) return <Crown size={18} className={commonStyles.goldIcon} />;
    if (position === 2) return <Medal size={18} className={commonStyles.silverIcon} />;
    if (position === 3) return <Medal size={18} className={commonStyles.bronzeIcon} />;
    return <span className={cn(commonStyles.positionNumber)}>{position}</span>;
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Crown size={16} /> },
    { id: 'history', label: 'XP Breakdown', icon: <Zap size={16} /> },
    { id: 'earn', label: 'How to Earn', icon: <Target size={16} /> },
  ];

  if (loading || !rankData) {
    return <Loading />;
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Your Rank & Progress</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Level up by completing projects and earning great reviews
              </p>
            </div>
            <div className={cn(commonStyles.headerStats, themeStyles.headerStats)}>
              <div className={cn(commonStyles.headerStat, themeStyles.headerStat)}>
                <Zap size={16} />
                <span>{rankData.total_points.toLocaleString()} XP</span>
              </div>
              <div className={cn(commonStyles.headerStat, themeStyles.headerStat)}>
                <Award size={16} />
                <span>{rankData.badges.length} Badges</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Rank Card */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.rankCard, themeStyles.rankCard)}>
            <div className={commonStyles.rankCardLeft}>
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
            </div>
            <div className={commonStyles.rankCardRight}>
              <div className={commonStyles.progressSection}>
                <div className={commonStyles.progressHeader}>
                  <span className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>
                    Progress to {rankData.next_rank}
                  </span>
                  <span className={cn(commonStyles.progressValue, themeStyles.progressValue)}>
                    {rankData.progress_percent}% • {rankData.points_to_next.toLocaleString()} XP to go
                  </span>
                </div>
                <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
                  <div 
                    className={commonStyles.progressFill}
                    style={{ 
                      width: `${rankData.progress_percent}%`,
                      background: `linear-gradient(90deg, ${getRankColor(rankData.rank_level)}, ${getRankColor(rankData.rank_level + 1)})`
                    }}
                  />
                </div>
              </div>
              {/* Current rank benefits */}
              <div className={cn(commonStyles.benefitsList, themeStyles.benefitsList)}>
                {rankData.rank_benefits.map((benefit, i) => (
                  <span key={i} className={cn(commonStyles.benefitTag, themeStyles.benefitTag)}>
                    ✓ {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.15}>
          <div className={commonStyles.statsGrid}>
            {[
              { value: rankData.stats.completed_projects, label: 'Projects Completed', icon: <Trophy size={20} />, color: '#10b981' },
              { value: `${rankData.stats.on_time_delivery}%`, label: 'On-Time Delivery', icon: <Clock size={20} />, color: '#3b82f6' },
              { value: `${rankData.stats.client_satisfaction}%`, label: 'Client Satisfaction', icon: <Star size={20} />, color: '#f59e0b' },
              { value: rankData.stats.repeat_clients, label: 'Repeat Clients', icon: <Users size={20} />, color: '#8b5cf6' },
            ].map((stat, i) => (
              <div key={i} className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={cn(commonStyles.statIconWrapper)} style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stat.value}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{stat.label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Section Tabs */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.sectionTabs, themeStyles.sectionTabs)}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className={cn(
                  commonStyles.sectionTab,
                  themeStyles.sectionTab,
                  activeSection === tab.id && commonStyles.sectionTabActive,
                  activeSection === tab.id && themeStyles.sectionTabActive
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            {/* Rank Tiers */}
            <ScrollReveal delay={0.25}>
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
                        <div className={cn(commonStyles.tierBenefits, themeStyles.tierBenefits)}>
                          {rank.benefits.slice(0, 2).map((b, i) => (
                            <span key={i} className={cn(commonStyles.tierBenefit, themeStyles.tierBenefit)}>{b}</span>
                          ))}
                        </div>
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
            <ScrollReveal delay={0.3}>
              <div className={cn(commonStyles.section, themeStyles.section)}>
                <div className={commonStyles.sectionHeader}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Earned Badges ({rankData.badges.length})</h3>
                </div>
                {rankData.badges.length === 0 ? (
                  <div className={cn(commonStyles.emptyBadges, themeStyles.emptyBadges)}>
                    <Award size={48} />
                    <h4>No Badges Yet</h4>
                    <p>Complete projects and hit milestones to earn badges</p>
                  </div>
                ) : (
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
                          onClick={() => setSelectedBadge(badge)}
                          role="button"
                          tabIndex={0}
                          aria-label={`View badge: ${badge.name}`}
                        >
                          <span className={commonStyles.badgeIcon}>{badge.icon}</span>
                          <div className={commonStyles.badgeInfo}>
                            <span className={cn(commonStyles.badgeName, themeStyles.badgeName)}>{badge.name}</span>
                            <span className={cn(commonStyles.badgeDesc, themeStyles.badgeDesc)}>{badge.description}</span>
                          </div>
                          <div className={commonStyles.badgeFooter}>
                            <span className={cn(commonStyles.badgeRarity, themeStyles.badgeRarity, commonStyles[`rarity_${badge.rarity}`])}>
                              {badge.rarity}
                            </span>
                            {badge.earned_at && (
                              <span className={cn(commonStyles.badgeDate, themeStyles.badgeDate)}>
                                {new Date(badge.earned_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>
            </ScrollReveal>
          </>
        )}

        {/* Leaderboard Section */}
        {activeSection === 'leaderboard' && (
          <ScrollReveal delay={0.25}>
            <div className={cn(commonStyles.section, themeStyles.section)}>
              <div className={commonStyles.sectionHeader}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  <Crown size={18} /> Leaderboard
                </h3>
                <div className={cn(commonStyles.periodToggle, themeStyles.periodToggle)}>
                  {(['weekly', 'monthly', 'alltime'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => setLeaderboardPeriod(period)}
                      className={cn(
                        commonStyles.periodBtn,
                        themeStyles.periodBtn,
                        leaderboardPeriod === period && commonStyles.periodBtnActive,
                        leaderboardPeriod === period && themeStyles.periodBtnActive
                      )}
                    >
                      {period === 'alltime' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {rankData.leaderboard.length === 0 ? (
                <div className={cn(commonStyles.emptyLeaderboard, themeStyles.emptyLeaderboard)}>
                  <Crown size={48} />
                  <h4>Leaderboard Coming Soon</h4>
                  <p>Keep earning XP to climb the ranks when the leaderboard launches!</p>
                </div>
              ) : (
                <div className={commonStyles.leaderboardList}>
                  {rankData.leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={cn(
                        commonStyles.leaderboardEntry,
                        themeStyles.leaderboardEntry,
                        entry.is_current_user && commonStyles.leaderboardEntryCurrent,
                        entry.is_current_user && themeStyles.leaderboardEntryCurrent
                      )}
                    >
                      <div className={cn(commonStyles.leaderboardPosition, themeStyles.leaderboardPosition)}>
                        {getLeaderboardIcon(entry.rank)}
                      </div>
                      <div className={cn(commonStyles.leaderboardAvatar, themeStyles.leaderboardAvatar)}>
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.name} />
                        ) : (
                          <span>{entry.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className={commonStyles.leaderboardInfo}>
                        <span className={cn(commonStyles.leaderboardName, themeStyles.leaderboardName)}>
                          {entry.name} {entry.is_current_user && '(You)'}
                        </span>
                        <span className={cn(commonStyles.leaderboardRank, themeStyles.leaderboardRank)} style={{ color: getRankColor(entry.level) }}>
                          {entry.rank_name}
                        </span>
                      </div>
                      <div className={cn(commonStyles.leaderboardPoints, themeStyles.leaderboardPoints)}>
                        <Zap size={14} />
                        <span>{entry.points.toLocaleString()} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* XP Breakdown Section */}
        {activeSection === 'history' && (
          <ScrollReveal delay={0.25}>
            <div className={cn(commonStyles.section, themeStyles.section)}>
              <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                <Zap size={18} /> XP Breakdown
              </h3>
              
              {/* XP Sources Visual */}
              <div className={cn(commonStyles.xpBreakdown, themeStyles.xpBreakdown)}>
                {rankData.xp_breakdown.map((item, i) => (
                  <div key={i} className={cn(commonStyles.xpItem, themeStyles.xpItem)}>
                    <div className={commonStyles.xpItemHeader}>
                      <span className={commonStyles.xpItemIcon}>{item.icon}</span>
                      <span className={cn(commonStyles.xpItemSource, themeStyles.xpItemSource)}>{item.source}</span>
                      <span className={cn(commonStyles.xpItemPoints, themeStyles.xpItemPoints)}>
                        {item.points.toLocaleString()} XP
                      </span>
                    </div>
                    <div className={cn(commonStyles.xpItemBar, themeStyles.xpItemBar)}>
                      <div 
                        className={commonStyles.xpItemFill}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className={cn(commonStyles.xpItemPercent, themeStyles.xpItemPercent)}>
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent XP Activity */}
              {rankData.recent_xp.length > 0 && (
                <div className={cn(commonStyles.recentXP, themeStyles.recentXP)}>
                  <h4 className={cn(commonStyles.subSectionTitle, themeStyles.subSectionTitle)}>Recent XP Earned</h4>
                  <div className={commonStyles.recentXPList}>
                    {rankData.recent_xp.map((xp) => (
                      <div key={xp.id} className={cn(commonStyles.recentXPItem, themeStyles.recentXPItem)}>
                        <div className={cn(commonStyles.xpBadge, themeStyles.xpBadge)}>
                          <ArrowUp size={12} />
                          +{xp.points}
                        </div>
                        <div className={commonStyles.recentXPInfo}>
                          <span className={cn(commonStyles.recentXPSource, themeStyles.recentXPSource)}>{xp.source}</span>
                          <span className={cn(commonStyles.recentXPDesc, themeStyles.recentXPDesc)}>{xp.description}</span>
                        </div>
                        <span className={cn(commonStyles.recentXPTime, themeStyles.recentXPTime)}>
                          {formatRelativeTime(xp.earned_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* How to Earn Section */}
        {activeSection === 'earn' && (
          <ScrollReveal delay={0.25}>
            <div className={cn(commonStyles.section, themeStyles.section)}>
              <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                <Target size={18} /> How to Earn XP
              </h3>
              <p className={cn(commonStyles.sectionDesc, themeStyles.sectionDesc)}>
                Earn XP through various activities on the platform. The more you deliver quality work, the faster you rank up!
              </p>
              
              <StaggerContainer className={commonStyles.earnGrid}>
                {XP_SOURCES.map((source, i) => (
                  <StaggerItem key={i}>
                    <div className={cn(commonStyles.earnCard, themeStyles.earnCard)}>
                      <span className={commonStyles.earnIcon}>{source.icon}</span>
                      <div className={commonStyles.earnInfo}>
                        <h4 className={cn(commonStyles.earnTitle, themeStyles.earnTitle)}>{source.source}</h4>
                        <span className={cn(commonStyles.earnPoints, themeStyles.earnPoints)}>{source.points_per}</span>
                      </div>
                      <ChevronRight size={16} className={cn(commonStyles.earnArrow, themeStyles.earnArrow)} />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Tips for ranking up */}
              <div className={cn(commonStyles.tipsCard, themeStyles.tipsCard)}>
                <h4 className={cn(commonStyles.tipsTitle, themeStyles.tipsTitle)}>💡 Tips to Rank Up Faster</h4>
                <ul className={cn(commonStyles.tipsList, themeStyles.tipsList)}>
                  <li>Complete your profile to 100% for a quick XP boost</li>
                  <li>Deliver projects on or before deadline for bonus XP</li>
                  <li>Ask satisfied clients to leave 5-star reviews</li>
                  <li>Get your skills verified through assessments</li>
                  <li>Build long-term relationships with repeat clients</li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div className={cn(commonStyles.modalOverlay)} onClick={() => setSelectedBadge(null)}>
            <div className={cn(commonStyles.badgeModal, themeStyles.badgeModal)} onClick={e => e.stopPropagation()}>
              <button className={cn(commonStyles.modalClose, themeStyles.modalClose)} onClick={() => setSelectedBadge(null)}>✕</button>
              <span className={commonStyles.badgeModalIcon}>{selectedBadge.icon}</span>
              <h3 className={cn(commonStyles.badgeModalName, themeStyles.badgeModalName)}>{selectedBadge.name}</h3>
              <span className={cn(commonStyles.badgeModalRarity, commonStyles[`rarity_${selectedBadge.rarity}`])}>
                {selectedBadge.rarity.toUpperCase()}
              </span>
              <p className={cn(commonStyles.badgeModalDesc, themeStyles.badgeModalDesc)}>{selectedBadge.description}</p>
              {selectedBadge.unlock_condition && (
                <div className={cn(commonStyles.badgeModalCondition, themeStyles.badgeModalCondition)}>
                  <Target size={14} />
                  <span>{selectedBadge.unlock_condition}</span>
                </div>
              )}
              {selectedBadge.earned_at && (
                <span className={cn(commonStyles.badgeModalDate, themeStyles.badgeModalDate)}>
                  Earned on {new Date(selectedBadge.earned_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
