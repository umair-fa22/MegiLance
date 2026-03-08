// @AI-HINT: Redesigned Freelancer Dashboard with modern UI/UX, quick actions, seller stats, sparklines, timeline, progress rings
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useFreelancerData } from '@/hooks/useFreelancer';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api/core';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { searchingAnimation, emptyBoxAnimation } from '@/app/components/Animations/LottieAnimation';
import StatCard from '@/app/components/StatCard/StatCard';
import SellerStats, { SellerStatsData } from '@/app/components/SellerStats/SellerStats';
import ActivityTimeline, { type TimelineEvent } from '@/app/components/ActivityTimeline/ActivityTimeline';
import ProgressRing from '@/app/components/ProgressRing/ProgressRing';
import EarningsChart from './components/EarningsChart/EarningsChart';
import JobCard from './components/JobCard';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Eye,
  Search,
  ArrowRight,
  Package,
  MessageSquare,
  User,
  BarChart3,
  Circle,
  CheckCircle2,
  Zap,
  Star,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

import commonStyles from './Dashboard.common.module.css';
import lightStyles from './Dashboard.light.module.css';
import darkStyles from './Dashboard.dark.module.css';

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  new_seller: 'Welcome! Complete orders and build your reputation to level up.',
  bronze: 'Rising seller with a proven track record.',
  silver: 'Experienced seller delivering great results.',
  gold: 'Top-rated seller with an outstanding reputation.',
  platinum: 'Elite seller — among the very best on the platform.',
};

const BASE_COMMISSION = 20;

/** Map flat backend /seller-stats/me response → SellerStatsData expected by <SellerStats>. */
function transformSellerStats(raw: Record<string, unknown>): SellerStatsData {
  const level = (raw.level as string) || 'new_seller';
  const benefits = (raw.benefits ?? {}) as Record<string, unknown>;
  const levelProgress = raw.level_progress as Record<string, unknown> | null;

  return {
    userId: raw.user_id as number,
    level: {
      level: level as SellerStatsData['level']['level'],
      jssScore: (raw.jss_score as number) ?? 0,
      benefits: {
        commissionRate: BASE_COMMISSION - ((benefits.reduced_fees as number) ?? 0),
        featuredGigs: (benefits.featured_gigs as number) ?? 0,
        prioritySupport: (benefits.priority_support as boolean) ?? false,
        badges: (raw.badges as string[]) ?? (benefits.badges as string[]) ?? [],
        description: LEVEL_DESCRIPTIONS[level] ?? LEVEL_DESCRIPTIONS.new_seller,
      },
      ...(levelProgress
        ? {
            levelProgress: {
              nextLevel: levelProgress.next_level as string,
              requirements: levelProgress.requirements as Record<string, { current: number; required: number; percent: number }>,
            },
          }
        : {}),
    },
    totalOrders: (raw.total_orders as number) ?? 0,
    completedOrders: (raw.completed_orders as number) ?? 0,
    cancelledOrders: (raw.cancelled_orders as number) ?? 0,
    averageRating: (raw.average_rating as number) ?? 0,
    totalReviews: (raw.total_reviews as number) ?? 0,
    completionRate: (raw.completion_rate as number) ?? 100,
    onTimeDeliveryRate: (raw.on_time_delivery_rate as number) ?? 100,
    responseRate: (raw.response_rate as number) ?? 100,
    avgResponseTimeHours: (raw.avg_response_time_hours as number) ?? 0,
    totalEarnings: (raw.total_earnings as number) ?? 0,
    uniqueClients: (raw.unique_clients as number) ?? 0,
    repeatClients: (raw.repeat_clients as number) ?? 0,
    repeatClientRate: (raw.repeat_client_rate as number) ?? 0,
  };
}

const Dashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { analytics, recommendedJobs, proposals, loading, error } = useFreelancerData();
  const { user } = useAuth();
  const [sellerStats, setSellerStats] = useState<SellerStatsData | null>(null);
  const [earningsData, setEarningsData] = useState<{ month: string; amount: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    
    const fetchSellerStats = async () => {
      try {
        const data = await apiFetch('/seller-stats/me');
        setSellerStats(transformSellerStats(data as Record<string, unknown>));
      } catch {
        // Seller stats are optional - don't block dashboard
      }
    };

    const fetchEarnings = async () => {
      try {
        const data = await apiFetch('/portal/freelancer/earnings/monthly?months=6') as { earnings?: { month: string; amount: number }[] };
        setEarningsData(data.earnings || []);
      } catch {
        // Earnings chart is optional
      }
    };
    
    fetchSellerStats();
    fetchEarnings();
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const metrics = useMemo(() => ({
    earnings: analytics?.totalEarnings || '$0',
    earningsNum: parseFloat(String(analytics?.totalEarnings || '0').replace(/[$,]/g, '')),
    activeJobs: analytics?.activeProjects || 0,
    proposalsSent: analytics?.pendingProposals || 0,
    profileViews: analytics?.profileViews || 0,
    completionRate: sellerStats?.completionRate ?? 100,
    responseRate: sellerStats?.responseRate ?? 100,
    onTimeRate: sellerStats?.onTimeDeliveryRate ?? 100,
    jssScore: sellerStats?.level.jssScore ?? 0,
    profileCompleteness: analytics?.profileCompleteness ?? 0,
  }), [analytics, sellerStats]);

  // Generate sparkline data from earnings history
  const earningsSparkline = useMemo(() => {
    if (earningsData.length === 0) return [0, 0, 0, 0, 0, 0];
    return earningsData.slice(-7).map(d => d.amount);
  }, [earningsData]);

  // Generate activity timeline from proposals
  const recentActivity = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    if (proposals) {
      proposals.slice(0, 3).forEach(p => {
        const statusLower = p.status.toLowerCase();
        events.push({
          id: `proposal-${p.id}`,
          actor: 'You',
          action: statusLower === 'accepted' ? 'got accepted on' : statusLower === 'rejected' ? 'proposal declined for' : 'submitted proposal for',
          target: p.projectTitle,
          targetHref: '/freelancer/proposals',
          timestamp: p.sentDate || new Date().toISOString(),
          type: statusLower === 'accepted' ? 'success' : statusLower === 'rejected' ? 'danger' : 'info',
        });
      });
    }
    
    if (recommendedJobs && recommendedJobs.length > 0) {
      events.push({
        id: 'match-1',
        actor: 'AI',
        action: `found ${recommendedJobs.length} new job matches`,
        target: 'based on your skills',
        targetHref: '/jobs',
        timestamp: new Date().toISOString(),
        type: 'purple',
        badge: `${recommendedJobs.length} jobs`,
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }, [proposals, recommendedJobs]);
  // Quick actions for the grid
  const quickActions = [
    { label: 'Find Work', href: '/jobs', icon: Search, color: 'primary' as const, desc: 'Browse jobs' },
    { label: 'My Gigs', href: '/freelancer/gigs', icon: Package, color: 'success' as const, desc: 'Manage offerings' },
    { label: 'Proposals', href: '/freelancer/proposals', icon: FileText, color: 'info' as const, desc: `${metrics.proposalsSent} sent` },
    { label: 'Messages', href: '/freelancer/messages', icon: MessageSquare, color: 'purple' as const, desc: 'Chat with clients' },
    { label: 'Analytics', href: '/freelancer/analytics', icon: BarChart3, color: 'warning' as const, desc: 'View insights' },
    { label: 'Profile', href: '/freelancer/profile', icon: User, color: 'danger' as const, desc: `${metrics.profileCompleteness}% complete` },
  ];

  if (!mounted) {
    return (
      <div className={cn(commonStyles.dashboardContainer, commonStyles.loadingContainer)}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {error && (
        <div className={cn(commonStyles.errorBanner, themeStyles.errorBanner)} role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <div className={commonStyles.welcomeRow}>
            <h1>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            {analytics?.availabilityStatus === 'available' && (
              <span className={cn(commonStyles.availabilityBadge, themeStyles.availabilityBadge)} aria-label="Status: Available">
                <Circle size={8} fill="#27AE60" aria-hidden="true" /> Available
              </span>
            )}
          </div>
          {analytics?.headline ? (
            <p>{analytics.headline}</p>
          ) : (
            <p>You have new job matches waiting for you.</p>
          )}
          {analytics?.profileCompleteness != null && analytics.profileCompleteness < 80 && (
            <div className={commonStyles.profileProgressRow}>
              <div
                className={cn(commonStyles.progressTrack, themeStyles.progressTrack)}
                role="progressbar"
                aria-valuenow={analytics.profileCompleteness}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Profile ${analytics.profileCompleteness}% complete`}
              >
                <div
                  className={cn(commonStyles.progressFill, analytics.profileCompleteness >= 60 ? commonStyles.progressFillGreen : commonStyles.progressFillYellow)}
                  style={{ width: `${analytics.profileCompleteness}%` }}
                />
              </div>
              <span className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>Profile {analytics.profileCompleteness}% complete</span>
              <Link href="/freelancer/profile" className={cn(commonStyles.progressLink, themeStyles.progressLink)}>
                Complete it <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
        <div className={commonStyles.headerActions}>
          <Link href="/freelancer/gigs">
            <Button variant="outline" size="lg" iconBefore={<Package size={18} />}>
              My Gigs
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="primary" size="lg" iconBefore={<Search size={18} />}>
              Find Work
            </Button>
          </Link>
        </div>
      </div>

      {/* Seller Stats Section */}
      {sellerStats && <SellerStats stats={sellerStats} />}

      {/* Stats Grid — with sparklines */}
      <section aria-label="Performance statistics">
      <div className={commonStyles.statsGrid}>
        <StatCard 
          title="Total Earnings" 
          value={metrics.earnings} 
          icon={DollarSign}
          sparklineData={earningsSparkline}
          sparklineColor="success"
          href="/freelancer/earnings"
        />
        <StatCard 
          title="Active Jobs" 
          value={metrics.activeJobs.toString()} 
          icon={Briefcase}
          sparklineColor="primary"
        />
        <StatCard 
          title="Proposals Sent" 
          value={metrics.proposalsSent.toString()} 
          icon={FileText}
          href="/freelancer/proposals"
        />
        <StatCard 
          title="Profile Views" 
          value={metrics.profileViews.toString()} 
          icon={Eye}
          sparklineColor="warning"
          href="/freelancer/analytics"
        />
      </div>
      </section>

      {/* Performance Metrics — Progress Rings */}
      <section aria-label="Performance metrics">
      <div className={commonStyles.metricsRow}>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <ProgressRing value={metrics.completionRate} label="Completion Rate" size="lg" color="success" />
        </div>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <ProgressRing value={metrics.responseRate} label="Response Rate" size="lg" color="primary" />
        </div>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <ProgressRing value={metrics.onTimeRate} label="On-Time Delivery" size="lg" color="warning" />
        </div>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <div className={commonStyles.metricStats}>
            <div className={commonStyles.metricStatItem}>
              <Star size={16} className={commonStyles.metricIconWarning} />
              <span className={cn(commonStyles.metricStatValue, themeStyles.metricStatValue)}>{sellerStats?.averageRating?.toFixed(1) ?? '—'}</span>
              <span className={cn(commonStyles.metricStatLabel, themeStyles.metricStatLabel)}>Rating</span>
            </div>
            <div className={commonStyles.metricStatItem}>
              <TrendingUp size={16} className={commonStyles.metricIconSuccess} />
              <span className={cn(commonStyles.metricStatValue, themeStyles.metricStatValue)}>{metrics.jssScore}%</span>
              <span className={cn(commonStyles.metricStatLabel, themeStyles.metricStatLabel)}>JSS Score</span>
            </div>
            <div className={commonStyles.metricStatItem}>
              <Zap size={16} className={commonStyles.metricIconPrimary} />
              <span className={cn(commonStyles.metricStatValue, themeStyles.metricStatValue)}>{sellerStats?.totalOrders ?? 0}</span>
              <span className={cn(commonStyles.metricStatLabel, themeStyles.metricStatLabel)}>Total Orders</span>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Earnings Chart */}
      {earningsData.length > 0 && (
        <div className={commonStyles.sectionContainer}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Monthly Earnings</h2>
          <EarningsChart data={earningsData} />
        </div>
      )}

      {/* Quick Actions */}
      <section aria-label="Quick actions">
      <div className={commonStyles.quickActionsSection}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Quick Actions</h2>
        <div className={commonStyles.quickActionsGrid}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={cn(commonStyles.quickActionCard, themeStyles.quickActionCard)} aria-label={`${action.label}: ${action.desc}`}>
              <div className={cn(commonStyles.quickActionIcon, commonStyles[`quickActionIcon-${action.color}`])} aria-hidden="true">
                <action.icon size={20} />
              </div>
              <span className={cn(commonStyles.quickActionLabel, themeStyles.quickActionLabel)}>{action.label}</span>
              <span className={cn(commonStyles.quickActionDesc, themeStyles.quickActionDesc)}>{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>
      </section>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recommended Jobs</h2>
            <Link href="/jobs" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className={commonStyles.jobList}>
            {loading ? (
              <Loading />
            ) : recommendedJobs && recommendedJobs.length > 0 ? (
              recommendedJobs.slice(0, 3).map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <EmptyState
                title="No jobs found"
                description="We couldn&apos;t find any jobs matching your skills."
                animationData={searchingAnimation}
                animationWidth={120}
                animationHeight={120}
                action={
                  <Link href="/freelancer/profile">
                    <Button variant="outline" size="sm">Update Profile</Button>
                  </Link>
                }
              />
            )}
          </div>

          {/* Activity Timeline */}
          <div className={cn(commonStyles.timelineSection, themeStyles.timelineSection)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h3>
            <ActivityTimeline events={recentActivity} maxItems={5} emptyMessage="No recent activity" />
          </div>
        </div>

        {/* Right Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Proposals</h2>
            <Link href="/freelancer/proposals" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All
            </Link>
          </div>

          <div className={commonStyles.proposalList}>
            {proposals && proposals.length > 0 ? (
              proposals.slice(0, 5).map((proposal) => (
                <div key={proposal.id} className={cn(commonStyles.proposalCard, themeStyles.proposalCard)}>
                  <div className={commonStyles.proposalInfo}>
                    <h4 className={cn(themeStyles.proposalTitle)}>{proposal.projectTitle}</h4>
                    <span className={cn(commonStyles.proposalDate, themeStyles.proposalDate)}>
                      {new Date(proposal.sentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={cn(commonStyles.proposalStatus, themeStyles.proposalStatus)}>
                    {proposal.status}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No proposals yet"
                description="Start applying to jobs to see them here."
                animationData={emptyBoxAnimation}
                animationWidth={100}
                animationHeight={100}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
