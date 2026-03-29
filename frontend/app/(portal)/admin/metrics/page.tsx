// @AI-HINT: Admin metrics dashboard with real-time KPIs, charts, and platform health monitoring
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import Loader from '@/app/components/atoms/Loader/Loader';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import {
  DollarSign, Users, FolderOpen, CheckCircle, Clock, BarChart3,
  RefreshCw, Download, TrendingUp, TrendingDown, Activity, Server,
  Database, HardDrive, Mail, CreditCard,
} from 'lucide-react';
import commonStyles from './Metrics.common.module.css';
import lightStyles from './Metrics.light.module.css';
import darkStyles from './Metrics.dark.module.css';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
}

interface ChartData {
  label: string;
  value: number;
}

interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  icon: React.ReactNode;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user?: string;
  timestamp: string;
}

type TimeRange = '24h' | '7d' | '30d' | '90d';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'API Server': <Server size={14} />,
  'Database': <Database size={14} />,
  'File Storage': <HardDrive size={14} />,
  'Email Service': <Mail size={14} />,
  'Payment Gateway': <CreditCard size={14} />,
};

export default function MetricsDashboardPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const METRIC_ICONS: React.ReactNode[] = [
    <DollarSign key="rev" size={18} />,
    <Users key="usr" size={18} />,
    <FolderOpen key="prj" size={18} />,
    <CheckCircle key="cmp" size={18} />,
    <Clock key="rsp" size={18} />,
    <BarChart3 key="fee" size={18} />,
  ];

  const METRIC_DEFS = [
    { id: '1', title: 'Total Revenue', key: 'total_revenue', changeKey: 'revenue_change', format: (v: number) => `$${(v / 100).toLocaleString()}` },
    { id: '2', title: 'Active Users', key: 'active_users', changeKey: 'users_change', format: (v: number) => v.toLocaleString() },
    { id: '3', title: 'New Projects', key: 'new_projects', changeKey: 'projects_change', format: (v: number) => v.toLocaleString() },
    { id: '4', title: 'Completion Rate', key: 'completion_rate', changeKey: 'completion_change', format: (v: number) => `${v}%` },
    { id: '5', title: 'Avg. Response Time', key: 'avg_response_time', changeKey: 'response_change', format: (v: number) => `${v}h` },
    { id: '6', title: 'Platform Fee', key: 'platform_fee', changeKey: 'fee_change', format: (v: number) => `$${(v / 100).toLocaleString()}` },
  ];

  const loadMetricsData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { metricsApi, adminApi } = await import('@/lib/api');

      const [overviewRes, revenueRes, usersRes, healthRes, activityRes] = await Promise.allSettled([
        metricsApi.getOverview(timeRange),
        (metricsApi as any).getRevenue?.(`2024-01-01`, new Date().toISOString().split('T')[0], timeRange === '24h' ? 'hour' : 'day'),
        metricsApi.getUsers(timeRange),
        (metricsApi as any).getRealtime?.(),
        (adminApi as any).getRecentActivity?.(),
      ]);

      // Build metric cards from API data only
      const apiData = overviewRes.status === 'fulfilled' && overviewRes.value
        ? ((overviewRes.value as any)?.metrics || overviewRes.value) as Record<string, number>
        : null;

      if (apiData) {
        const builtMetrics: MetricCard[] = METRIC_DEFS.map((def, idx) => {
          const value = apiData[def.key];
          const change = apiData[def.changeKey] ?? 0;
          return {
            id: def.id,
            title: def.title,
            value: value != null ? def.format(value) : '--',
            change,
            changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
            icon: METRIC_ICONS[idx],
          };
        });
        setMetrics(builtMetrics);
      } else {
        setMetrics([]);
      }

      // Revenue trend
      const revData = revenueRes.status === 'fulfilled' && revenueRes.value
        ? ((revenueRes.value as any)?.revenue_trend || (revenueRes.value as any)?.data || [])
        : (apiData as any)?.revenue_trend || [];
      setRevenueData(revData.map((r: any) => ({ label: r.label || r.date || '', value: r.value || r.amount || 0 })));

      // User growth
      const userData = usersRes.status === 'fulfilled' && usersRes.value
        ? ((usersRes.value as any)?.user_growth || (usersRes.value as any)?.data || [])
        : (apiData as any)?.user_growth || [];
      setUserGrowthData(userData.map((g: any) => ({ label: g.label || g.week || '', value: g.value || g.count || 0 })));

      // System health
      const healthData = healthRes.status === 'fulfilled' && healthRes.value
        ? ((healthRes.value as any)?.services || (healthRes.value as any)?.health || [])
        : [];
      setSystemHealth(healthData.map((h: any) => ({
        service: h.service || h.name,
        status: h.status as 'healthy' | 'degraded' | 'down',
        latency: h.latency ?? 0,
        uptime: h.uptime ?? 0,
        icon: SERVICE_ICONS[h.service || h.name] || <Server size={14} />,
      })));

      // Recent activity
      const actData = activityRes.status === 'fulfilled' && activityRes.value
        ? ((activityRes.value as any)?.activities || (activityRes.value as any)?.items || [])
        : [];
      setRecentActivity(actData.map((a: any) => ({
        id: String(a.id),
        type: a.type || 'event',
        description: a.description || a.message || '',
        user: a.user_email || a.user,
        timestamp: a.created_at || a.timestamp || new Date().toISOString(),
      })));

      if (silent) showToast('Metrics refreshed');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load metrics:', error);
      }
      if (silent) showToast('Failed to refresh metrics', 'error');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) loadMetricsData();
  }, [mounted, loadMetricsData]);

  useEffect(() => {
    if (!autoRefresh || !mounted) return;
    const interval = setInterval(() => loadMetricsData(true), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, mounted, loadMetricsData]);

  const handleExport = () => {
    try {
      const rows = metrics.map(m => ({
        Metric: m.title,
        Value: m.value,
        Change: `${m.change}%`,
        Direction: m.changeType,
      }));
      if (rows.length === 0) { showToast('No metrics data to export', 'error'); return; }
      const headers = Object.keys(rows[0]);
      const csvContent = [headers.join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report exported');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const getMaxValue = (data: ChartData[]) => {
    const max = Math.max(...data.map(d => d.value));
    return max > 0 ? max : 1;
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                Metrics Dashboard
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Real-time platform metrics and system health monitoring
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <button
                type="button"
                onClick={() => setAutoRefresh(v => !v)}
                className={cn(commonStyles.toggleBtn, themeStyles.toggleBtn, autoRefresh && commonStyles.toggleActive, autoRefresh && themeStyles.toggleActive)}
                aria-label="Toggle auto-refresh"
              >
                <span className={commonStyles.toggleKnob} />
              </button>
              <span className={cn(commonStyles.toggleLabel, themeStyles.toggleLabel)}>
                Auto-refresh
              </span>
              <Button variant="secondary" size="sm" iconBefore={<RefreshCw size={14} />} onClick={() => loadMetricsData(true)}>
                Refresh
              </Button>
              <Button variant="primary" size="sm" iconBefore={<Download size={14} />} onClick={handleExport}>
                Export
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Time Range Selector */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.timeRangeRow}>
            {(['24h', '7d', '30d', '90d'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrap}>
            <Loader size="lg" />
          </div>
        ) : metrics.length === 0 ? (
          <EmptyState
            title="No metrics available"
            description="Metrics data could not be loaded from the server. Try refreshing."
            action={<Button variant="secondary" size="sm" onClick={() => loadMetricsData()}>Refresh</Button>}
          />
        ) : (
          <>
            {/* Metric Cards */}
            <StaggerContainer className={commonStyles.metricsGrid}>
              {metrics.map(metric => (
                <StaggerItem
                  key={metric.id}
                  className={cn(commonStyles.metricCard, themeStyles.metricCard)}
                >
                  <div className={commonStyles.metricHeader}>
                    <span className={cn(commonStyles.metricIcon, themeStyles.metricIcon)}>{metric.icon}</span>
                    <span className={cn(commonStyles.metricTitle, themeStyles.metricTitle)}>
                      {metric.title}
                    </span>
                  </div>
                  <div className={cn(commonStyles.metricValue, themeStyles.metricValue)}>
                    {metric.value}
                  </div>
                  <div className={commonStyles.metricChange}>
                    {metric.changeType === 'increase' ? (
                      <span className={cn(commonStyles.changeIndicator, commonStyles.changeUp, themeStyles.changeUp)}>
                        <TrendingUp size={13} /> +{Math.abs(metric.change)}%
                      </span>
                    ) : metric.changeType === 'decrease' ? (
                      <span className={cn(commonStyles.changeIndicator, commonStyles.changeDown, themeStyles.changeDown)}>
                        <TrendingDown size={13} /> -{Math.abs(metric.change)}%
                      </span>
                    ) : (
                      <span className={cn(commonStyles.changeIndicator, themeStyles.changePeriod)}>
                        0%
                      </span>
                    )}
                    <span className={cn(commonStyles.changePeriod, themeStyles.changePeriod)}>
                      vs last period
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Charts Section */}
            <ScrollReveal delay={0.2}>
              <div className={commonStyles.chartsGrid}>
                {/* Revenue Chart */}
                <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
                  <h3 className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
                    Revenue Trend
                  </h3>
                  {revenueData.length > 0 ? (
                    <div className={commonStyles.barChart}>
                      {revenueData.map((item, index) => (
                        <div key={index} className={commonStyles.barColumn}>
                          <div
                            className={cn(commonStyles.bar, themeStyles.bar)}
                            style={{ height: `${(item.value / getMaxValue(revenueData)) * 100}%` }}
                          >
                            <span className={cn(commonStyles.barValue, themeStyles.barValue)}>
                              ${(item.value / 1000).toFixed(1)}k
                            </span>
                          </div>
                          <span className={cn(commonStyles.barLabel, themeStyles.barLabel)}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={cn(commonStyles.emptyChart, themeStyles.emptyChart)}>No revenue data for this period</p>
                  )}
                </div>

                {/* User Growth Chart */}
                <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
                  <h3 className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
                    User Growth
                  </h3>
                  {userGrowthData.length > 0 ? (
                    <div className={commonStyles.lineChart}>
                      {userGrowthData.map((item, index) => (
                        <div key={index} className={commonStyles.linePoint}>
                          <div
                            className={cn(commonStyles.point, themeStyles.point)}
                            style={{ bottom: `${(item.value / getMaxValue(userGrowthData)) * 80}%` }}
                          />
                          <span className={cn(commonStyles.pointLabel, themeStyles.pointLabel)}>
                            {item.label}
                          </span>
                          <span className={cn(commonStyles.pointValue, themeStyles.pointValue)}>
                            {item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={cn(commonStyles.emptyChart, themeStyles.emptyChart)}>No growth data for this period</p>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* System Health & Activity */}
            <ScrollReveal delay={0.3}>
              <div className={commonStyles.bottomGrid}>
                {/* System Health */}
                <div className={cn(commonStyles.healthCard, themeStyles.healthCard)}>
                  <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                    <Activity size={16} /> System Health
                  </h3>
                  {systemHealth.length > 0 ? (
                    <div className={commonStyles.healthList}>
                      {systemHealth.map((item, index) => (
                        <div key={index} className={cn(commonStyles.healthItem, themeStyles.healthItem)}>
                          <div className={commonStyles.healthInfo}>
                            <span className={cn(commonStyles.serviceIcon, themeStyles.serviceIcon)}>{item.icon}</span>
                            <span className={cn(commonStyles.serviceName, themeStyles.serviceName)}>
                              {item.service}
                            </span>
                            <Badge variant={item.status === 'healthy' ? 'success' : item.status === 'degraded' ? 'warning' : 'default'}>
                              {item.status}
                            </Badge>
                          </div>
                          <div className={commonStyles.healthMetrics}>
                            <span className={cn(commonStyles.latency, themeStyles.latency)}>
                              {item.latency}ms
                            </span>
                            <span className={cn(commonStyles.uptime, themeStyles.uptime)}>
                              {item.uptime}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={cn(commonStyles.emptyChart, themeStyles.emptyChart)}>Health monitoring data unavailable</p>
                  )}
                </div>

                {/* Recent Activity */}
                <div className={cn(commonStyles.activityCard, themeStyles.activityCard)}>
                  <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                    Recent Activity
                  </h3>
                  {recentActivity.length > 0 ? (
                    <div className={commonStyles.activityList}>
                      {recentActivity.map(activity => (
                        <div key={activity.id} className={cn(commonStyles.activityItem, themeStyles.activityItem)}>
                          <div className={cn(commonStyles.activityDot, themeStyles.activityDot)} />
                          <div className={commonStyles.activityContent}>
                            <p className={cn(commonStyles.activityDesc, themeStyles.activityDesc)}>
                              {activity.description}
                            </p>
                            <div className={commonStyles.activityMeta}>
                              {activity.user && (
                                <span className={cn(commonStyles.activityUser, themeStyles.activityUser)}>
                                  {activity.user}
                                </span>
                              )}
                              <span className={cn(commonStyles.activityTime, themeStyles.activityTime)}>
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={cn(commonStyles.emptyChart, themeStyles.emptyChart)}>No recent activity</p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </>
        )}

        {toast && (
          <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
