// @AI-HINT: Redesigned Client Dashboard with modern UI/UX, sparkline stats, activity timeline, progress rings, quick actions.
// Production-ready: Uses real API data, no mock fallbacks.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCounts } from '@/contexts/UnreadCountContext';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import ActivityTimeline, { TimelineEvent } from '@/app/components/ActivityTimeline/ActivityTimeline';
import ProgressRing from '@/app/components/ProgressRing/ProgressRing';
import { emptyBoxAnimation, aiSparkleAnimation } from '@/app/components/Animations/LottieAnimation';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  Plus,
  ArrowRight,
  Search,
  FileText,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3,
  Zap,
  Star,
} from 'lucide-react';

import StatCard from './components/StatCard';
import ProjectCard from './components/ProjectCard';
import TalentCard from './components/TalentCard';

import commonStyles from './ClientDashboard.common.module.css';
import lightStyles from './ClientDashboard.light.module.css';
import darkStyles from './ClientDashboard.dark.module.css';

const ClientDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { projects, payments, loading, error } = useClientData();
  const { recommendations: freelancers, loading: recLoading, error: recError } = useRecommendations(5);
  const { user } = useAuth();
  const { counts } = useUnreadCounts();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const displayProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects;
  }, [projects]);

  const metrics = useMemo(() => {
    const totalProjects = displayProjects.length;
    const activeProjects = displayProjects.filter(p => 
      (p.status as string) === 'In Progress' || (p.status as string) === 'in_progress' || (p.status as string) === 'active'
    ).length;
    const completedProjects = displayProjects.filter(p =>
      (p.status as string) === 'Completed' || (p.status as string) === 'completed'
    ).length;
    const totalSpent = Array.isArray(payments) ? payments.reduce((sum, p) => {
      const amount = typeof p.amount === 'number' ? p.amount : parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0) : 0;
    
    const pendingProposals = displayProjects.reduce((sum, p) => sum + (p.proposals_count || 0), 0);
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
    
    return {
      totalSpent: `$${totalSpent.toLocaleString()}`,
      totalSpentNum: totalSpent,
      activeProjects,
      completedProjects,
      totalProjects,
      pendingProposals,
      unreadMessages: counts.messages,
      completionRate,
    };
  }, [displayProjects, payments, counts.messages]);

  // Generate sparkline data from payments history
  const spendingSparkline = useMemo(() => {
    if (!Array.isArray(payments) || payments.length === 0) return [0, 0, 0, 0, 0, 0];
    const amounts = payments.slice(0, 7).map(p => {
      const amount = typeof p.amount === 'number' ? p.amount : parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return amount;
    });
    return amounts.length >= 2 ? amounts.reverse() : [0, ...amounts, 0];
  }, [payments]);

  // Generate activity timeline from projects and payments
  const recentActivity = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    displayProjects.slice(0, 3).forEach(p => {
      const status = (p.status as string).toLowerCase();
      events.push({
        id: `project-${p.id}`,
        actor: 'You',
        action: status === 'completed' ? 'completed' : status === 'in_progress' ? 'started work on' : 'posted',
        target: p.title,
        targetHref: `/client/projects`,
        timestamp: p.updatedAt || p.updated || new Date().toISOString(),
        type: status === 'completed' ? 'success' : status === 'in_progress' ? 'info' : 'purple',
        badge: p.budget,
      });
    });

    if (Array.isArray(payments)) {
      payments.slice(0, 2).forEach(p => {
        events.push({
          id: `payment-${p.id}`,
          actor: 'Payment',
          action: p.status === 'Completed' || p.status === 'Paid' ? 'processed for' : 'pending for',
          target: p.project || p.description,
          timestamp: p.date || new Date().toISOString(),
          type: p.status === 'Completed' || p.status === 'Paid' ? 'success' : 'warning',
          badge: p.amount,
        });
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }, [displayProjects, payments]);

  // Quick actions for the grid
  const quickActions = [
    { label: 'Post a Job', href: '/client/post-job', icon: Plus, color: 'primary' as const, desc: 'Create job listing' },
    { label: 'Find Talent', href: '/client/hire', icon: Search, color: 'success' as const, desc: 'Browse freelancers' },
    { label: 'My Projects', href: '/client/projects', icon: Briefcase, color: 'info' as const, desc: `${metrics.activeProjects} active` },
    { label: 'Contracts', href: '/client/contracts', icon: FileText, color: 'warning' as const, desc: 'Manage agreements' },
    { label: 'Payments', href: '/client/payments', icon: CreditCard, color: 'danger' as const, desc: 'View transactions' },
    { label: 'Messages', href: '/client/messages', icon: MessageSquare, color: 'purple' as const, desc: `${counts.messages} unread` },
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
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}>
          <h1>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
          <p>Here&apos;s what&apos;s happening with your projects today.</p>
        </div>
        <div className={commonStyles.headerActions}>
          <Link href="/client/hire">
            <Button variant="outline" size="lg" iconBefore={<Search size={18} />}>
              Find Talent
            </Button>
          </Link>
          <Link href="/client/post-job">
            <Button variant="primary" size="lg" iconBefore={<Plus size={20} />}>
              Post a Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid — with sparklines */}
      <section aria-label="Key statistics">
      <div className={commonStyles.statsGrid}>
        <StatCard 
          title="Total Spent" 
          value={metrics.totalSpent} 
          icon={DollarSign}
          sparklineData={spendingSparkline}
          sparklineColor="primary"
          href="/client/payments"
        />
        <StatCard 
          title="Active Projects" 
          value={metrics.activeProjects.toString()} 
          icon={Briefcase}
          sparklineColor="success"
          href="/client/projects"
        />
        <StatCard 
          title="Pending Proposals" 
          value={metrics.pendingProposals.toString()} 
          icon={Clock}
          href="/client/projects"
        />
        <StatCard 
          title="Unread Messages" 
          value={metrics.unreadMessages.toString()} 
          icon={MessageSquare}
          href="/client/messages"
        />
      </div>
      </section>

      {error && (
        <div className={commonStyles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <p>Failed to load dashboard data. Please try refreshing the page.</p>
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

      {/* Project Completion Metrics */}
      <section aria-label="Project metrics">
      <div className={commonStyles.metricsRow}>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <ProgressRing value={metrics.completionRate} label="Completion Rate" size="lg" color="success" />
        </div>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <ProgressRing
            value={metrics.totalProjects > 0 ? Math.round((metrics.activeProjects / metrics.totalProjects) * 100) : 0}
            label="Active Rate"
            size="lg"
            color="primary"
          />
        </div>
        <div className={cn(commonStyles.metricCard, themeStyles.metricCard)}>
          <div className={commonStyles.metricStats}>
            <div className={commonStyles.metricStatItem}>
              <CheckCircle2 size={16} className={commonStyles.metricIconSuccess} />
              <span className={cn(commonStyles.metricStatValue, themeStyles.metricStatValue)}>{metrics.completedProjects}</span>
              <span className={cn(commonStyles.metricStatLabel, themeStyles.metricStatLabel)}>Completed</span>
            </div>
            <div className={commonStyles.metricStatItem}>
              <Zap size={16} className={commonStyles.metricIconPrimary} />
              <span className={cn(commonStyles.metricStatValue, themeStyles.metricStatValue)}>{metrics.activeProjects}</span>
              <span className={cn(commonStyles.metricStatLabel, themeStyles.metricStatLabel)}>Active</span>
            </div>
            <div className={commonStyles.metricStatItem}>
              <Clock size={16} className={commonStyles.metricIconWarning} />
              <span className={cn(commonStyles.metricStatValue, themeStyles.metricStatValue)}>{metrics.pendingProposals}</span>
              <span className={cn(commonStyles.metricStatLabel, themeStyles.metricStatLabel)}>Proposals</span>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Active Projects</h2>
            <Link href="/client/projects" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className={commonStyles.projectList}>
            {loading ? (
              <Loading />
            ) : displayProjects.length > 0 ? (
              displayProjects.slice(0, 3).map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <EmptyState
                title="No active projects"
                description="Get started by posting your first job."
                animationData={emptyBoxAnimation}
                animationWidth={120}
                animationHeight={120}
                action={
                  <Link href="/client/post-job">
                    <Button variant="primary" size="md">Post a Job</Button>
                  </Link>
                }
              />
            )}
          </div>

          {/* Activity Timeline */}
          <div className={cn(commonStyles.timelineSection, themeStyles.timelineSection)}>
            <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h3>
            <ActivityTimeline events={recentActivity} maxItems={5} emptyMessage="No recent activity on your projects" />
          </div>
        </div>

        {/* Right Column */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recommended Talent</h2>
            <Link href="/client/hire" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              Browse All
            </Link>
          </div>

          <div className={commonStyles.talentList}>
            {freelancers && freelancers.length > 0 ? (
              freelancers.slice(0, 3).map((freelancer) => (
                <TalentCard 
                  key={freelancer.id}
                  name={freelancer.name} 
                  role={freelancer.title} 
                  avatar={freelancer.avatarUrl || '/avatars/default.jpg'} 
                  rating={freelancer.rating}
                  location={freelancer.location}
                  hourlyRate={freelancer.hourlyRate}
                />
              ))
            ) : (
              <EmptyState
                title="No recommendations yet"
                description="Complete your profile to get AI matches."
                animationData={aiSparkleAnimation}
                animationWidth={100}
                animationHeight={100}
              />
            )}
          </div>

          {/* Platform Insights Mini Card */}
          <div className={cn(commonStyles.insightCard, themeStyles.insightCard)}>
            <div className={commonStyles.insightHeader}>
              <BarChart3 size={18} />
              <h3 className={cn(commonStyles.insightTitle, themeStyles.insightTitle)}>Platform Insights</h3>
            </div>
            <div className={commonStyles.insightGrid}>
              <div className={commonStyles.insightItem}>
                <span className={cn(commonStyles.insightValue, themeStyles.insightValue)}>
                  {metrics.totalProjects}
                </span>
                <span className={cn(commonStyles.insightLabel, themeStyles.insightLabel)}>Total Projects</span>
              </div>
              <div className={commonStyles.insightItem}>
                <span className={cn(commonStyles.insightValue, themeStyles.insightValue)}>
                  {metrics.totalSpent}
                </span>
                <span className={cn(commonStyles.insightLabel, themeStyles.insightLabel)}>Total Invested</span>
              </div>
              <div className={commonStyles.insightItem}>
                <span className={cn(commonStyles.insightValue, themeStyles.insightValue)}>
                  {freelancers?.length ?? 0}
                </span>
                <span className={cn(commonStyles.insightLabel, themeStyles.insightLabel)}>AI Matches</span>
              </div>
              <div className={commonStyles.insightItem}>
                <span className={cn(commonStyles.insightValue, themeStyles.insightValue)}>
                  {metrics.completionRate}%
                </span>
                <span className={cn(commonStyles.insightLabel, themeStyles.insightLabel)}>Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
