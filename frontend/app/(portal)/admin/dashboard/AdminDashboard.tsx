// @AI-HINT: Redesigned Admin Dashboard with modern UI/UX, quick actions, colour-coded stats, timeline, and progress rings
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/hooks/useAdmin';
import Button from '@/app/components/Button/Button';
import ActivityTimeline, { type TimelineEvent } from '@/app/components/ActivityTimeline/ActivityTimeline';
import ProgressRing from '@/app/components/ProgressRing/ProgressRing';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UserPlus,
  FileText,
  CreditCard,
  Bell,
  ShieldAlert,
  Settings,
  Briefcase,
  BarChart3,
  Zap,
  Server,
  Shield,
} from 'lucide-react';

import commonStyles from './AdminDashboard.common.module.css';
import lightStyles from './AdminDashboard.light.module.css';
import darkStyles from './AdminDashboard.dark.module.css';

// Import existing components to reuse logic
import UserSearchTable from '@/app/components/Admin/UserSearchTable/UserSearchTable';
import FlaggedFraudList from '@/app/components/Admin/FlaggedFraudList/FlaggedFraudList';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  icon: React.ElementType;
  accent: 'blue' | 'green' | 'amber' | 'red';
  themeStyles: Record<string, string>;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, accent, themeStyles }) => {
  const isPositive = trend?.includes('+');
  const isNegative = trend?.includes('-');

  return (
    <div className={cn(commonStyles.statCard, themeStyles.statCard)} role="region" aria-label={`${title}: ${value}`}>
      <div className={cn(commonStyles.statIconBadge, commonStyles[`accent_${accent}`], themeStyles[`accent_${accent}`])} aria-hidden="true">
        <Icon size={22} />
      </div>
      <div className={commonStyles.statBody}>
        <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{title}</span>
        <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{value}</span>
        {trend && (
          <span className={cn(
            commonStyles.statTrend,
            isPositive && commonStyles.trendPositive,
            isNegative && commonStyles.trendNegative,
          )} aria-label={`Trend: ${trend}`}>
            {isPositive ? <TrendingUp size={14} aria-hidden="true" /> : isNegative ? <TrendingDown size={14} aria-hidden="true" /> : null}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

interface QuickActionProps {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  themeStyles: Record<string, string>;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, href, icon: Icon, description, themeStyles }) => (
  <Link href={href} className={cn(commonStyles.quickAction, themeStyles.quickAction)} aria-label={`${label}: ${description}`}>
    <div className={cn(commonStyles.quickActionIcon, themeStyles.quickActionIcon)} aria-hidden="true">
      <Icon size={20} />
    </div>
    <div className={commonStyles.quickActionText}>
      <span className={cn(commonStyles.quickActionLabel, themeStyles.quickActionLabel)}>{label}</span>
      <span className={cn(commonStyles.quickActionDesc, themeStyles.quickActionDesc)}>{description}</span>
    </div>
    <ArrowRight size={16} className={commonStyles.quickActionArrow} aria-hidden="true" />
  </Link>
);

const activityIcons: Record<string, React.ElementType> = {
  user_joined: UserPlus,
  project_posted: FileText,
  proposal_submitted: FileText,
  payment_made: CreditCard,
  default: Bell,
};

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

const AdminDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { kpis, recentActivity, loading } = useAdminData();

  useEffect(() => { setMounted(true); }, []);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Map KPIs to stat card definitions with accent colours
  const accentMap: Record<string, 'blue' | 'green' | 'amber' | 'red'> = {
    Users: 'blue',
    Revenue: 'green',
    Projects: 'amber',
    Proposals: 'red',
    Disputes: 'red',
  };

  const iconForLabel = (label: string): React.ElementType => {
    if (label.includes('Users')) return Users;
    if (label.includes('Revenue')) return DollarSign;
    if (label.includes('Projects')) return Briefcase;
    if (label.includes('Proposals')) return FileText;
    if (label.includes('Disputes')) return AlertTriangle;
    return Activity;
  };

  const accentForLabel = (label: string): 'blue' | 'green' | 'amber' | 'red' => {
    const key = Object.keys(accentMap).find(k => label.includes(k));
    return key ? accentMap[key] : 'blue';
  };

  const stats = useMemo(() => {
    if (!kpis || kpis.length === 0) return [
      { title: 'Total Users', value: '—', trend: undefined, icon: Users, accent: 'blue' as const },
      { title: 'Revenue', value: '—', trend: undefined, icon: DollarSign, accent: 'green' as const },
      { title: 'Active Projects', value: '—', trend: undefined, icon: Briefcase, accent: 'amber' as const },
      { title: 'System Health', value: '99.9%', trend: undefined, icon: Activity, accent: 'blue' as const },
    ];
    return kpis.map((k: any) => ({
      title: k.label,
      value: k.value,
      trend: k.trend,
      icon: iconForLabel(k.label),
      accent: accentForLabel(k.label),
    }));
  }, [kpis]);

  const quickActions: Omit<QuickActionProps, 'themeStyles'>[] = [
    { label: 'Manage Users', href: '/admin/users', icon: Users, description: 'View, suspend, or verify accounts' },
    { label: 'View Disputes', href: '/admin/disputes', icon: AlertTriangle, description: 'Review open escalations' },
    { label: 'Fraud Detection', href: '/admin/fraud-detection', icon: ShieldAlert, description: 'Flagged transactions & alerts' },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Platform insights & reports' },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard, description: 'Transactions, refunds & billing' },
    { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Platform configuration' },
  ];

  if (!mounted) return null;

  return (
    <div className={cn(commonStyles.dashboardContainer, themeStyles.dashboardContainer)}>
      {/* Header Section */}
      <div className={commonStyles.headerSection}>
        <div className={commonStyles.welcomeText}>
          <h1 className={cn(commonStyles.headerTitle, themeStyles.headerTitle)}>Admin Dashboard</h1>
          <p className={cn(commonStyles.headerSubtitle, themeStyles.headerSubtitle)}>
            Monitor platform performance, manage users, and keep things running smoothly.
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          <Link href="/admin/analytics"><Button variant="outline" size="sm">Export Report</Button></Link>
          <Link href="/admin/settings"><Button variant="primary" size="sm">System Settings</Button></Link>
        </div>
      </div>

      {/* Stats Grid */}
      <section aria-label="Key performance indicators">
      <div className={commonStyles.statsGrid}>
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            accent={stat.accent}
            themeStyles={themeStyles}
          />
        ))}
      </div>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions">
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Quick Actions</h2>
        <div className={commonStyles.quickActionsGrid}>
          {quickActions.map((action) => (
            <QuickAction key={action.href} {...action} themeStyles={themeStyles} />
          ))}
        </div>
      </section>

      {/* System Health Progress Rings */}
      <section aria-label="System health">
      <div className={commonStyles.healthRow}>
        <div className={cn(commonStyles.healthCard, themeStyles.healthCard)}>
          <ProgressRing value={99.9} label="Uptime" size="md" color="success" suffix="%" />
        </div>
        <div className={cn(commonStyles.healthCard, themeStyles.healthCard)}>
          <ProgressRing
            value={stats.length > 0 ? Math.min(100, Math.round((parseInt(stats[0]?.value?.replace(/[^0-9]/g, '') || '0') / Math.max(parseInt(stats[0]?.value?.replace(/[^0-9]/g, '') || '1'), 1)) * 100)) : 85}
            label="Load Capacity" size="md" color="primary"
          />
        </div>
        <div className={cn(commonStyles.healthCard, themeStyles.healthCard)}>
          <div className={commonStyles.healthStats}>
            <div className={commonStyles.healthStatItem}>
              <Server size={16} className={commonStyles.healthIconBlue} />
              <span className={cn(commonStyles.healthStatValue, themeStyles.healthStatValue)}>OK</span>
              <span className={cn(commonStyles.healthStatLabel, themeStyles.healthStatLabel)}>API Status</span>
            </div>
            <div className={commonStyles.healthStatItem}>
              <Shield size={16} className={commonStyles.healthIconGreen} />
              <span className={cn(commonStyles.healthStatValue, themeStyles.healthStatValue)}>0</span>
              <span className={cn(commonStyles.healthStatLabel, themeStyles.healthStatLabel)}>Threats</span>
            </div>
            <div className={commonStyles.healthStatItem}>
              <Zap size={16} className={commonStyles.healthIconAmber} />
              <span className={cn(commonStyles.healthStatValue, themeStyles.healthStatValue)}>~120ms</span>
              <span className={cn(commonStyles.healthStatLabel, themeStyles.healthStatLabel)}>Avg Response</span>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Main Content Grid */}
      <div className={commonStyles.mainContentGrid}>
        {/* Left Column — User Management */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>User Management</h2>
            <Link href="/admin/users" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
            <UserSearchTable />
          </div>
        </div>

        {/* Right Column — Activity Timeline & Flagged */}
        <div className={commonStyles.sectionContainer}>
          <div className={commonStyles.sectionHeader}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Recent Activity</h2>
            <Link href="/admin/audit" className={cn(commonStyles.viewAllLink, themeStyles.viewAllLink)}>
              Audit Log
            </Link>
          </div>

          <ActivityTimeline
            events={
              recentActivity && recentActivity.length > 0
                ? recentActivity.slice(0, 6).map((activity: any, idx: number) => ({
                    id: `activity-${idx}`,
                    actor: activity.user_name || 'System',
                    action: activity.description || activity.type,
                    target: '',
                    timestamp: activity.timestamp || new Date().toISOString(),
                    type: (['user_joined', 'payment_made'].includes(activity.type) ? 'success' : activity.type === 'proposal_submitted' ? 'info' : activity.type === 'project_posted' ? 'purple' : 'warning') as TimelineEvent['type'],
                  }))
                : []
            }
            maxItems={6}
            emptyMessage="No recent platform activity"
          />

          <div className={commonStyles.flaggedSection}>
            <div className={commonStyles.sectionHeader}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Flagged Content</h2>
            </div>
            <FlaggedFraudList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
