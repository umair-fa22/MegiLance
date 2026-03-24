// @AI-HINT: Admin analytics dashboard v2.0 — health gauge, growth summary, conversion funnel, engagement metrics, charts
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Users, DollarSign, CheckCircle, Trophy, Activity,
  TrendingUp, TrendingDown, Minus, BarChart3, Heart,
  Zap, MessageSquare, FileText, Briefcase
} from 'lucide-react';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';

import commonStyles from './AnalyticsDashboard.common.module.css';
import lightStyles from './AnalyticsDashboard.light.module.css';
import darkStyles from './AnalyticsDashboard.dark.module.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

type TabKey = 'overview' | 'growth' | 'funnel' | 'engagement';

interface PlatformHealth {
  health_score: number;
  health_status: string;
  active_disputes: number;
  pending_support_tickets: number;
  user_satisfaction_rating: number;
  daily_active_users: number;
  total_users: number;
  dau_ratio: number;
}

interface GrowthMetric {
  label: string;
  current: number;
  wow_pct: number;
  mom_pct: number;
}

interface FunnelStep {
  stage: string;
  count: number;
  label: string;
}

interface EngagementData {
  period_days: number;
  messages_sent: number;
  proposals_submitted: number;
  projects_posted: number;
  contracts_created: number;
  reviews_posted: number;
  growth: Record<string, number>;
}

const AnalyticsDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [growth, setGrowth] = useState<GrowthMetric[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [userDistribution, setUserDistribution] = useState<any>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const s = (key: string) => cn(
    (commonStyles as any)[key],
    (themeStyles as any)[key]
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        healthRes, growthRes, funnelRes, engagementRes,
        regRes, revRes, userStatsRes
      ] = await Promise.allSettled([
        api.analytics.getPlatformHealth(),
        api.analytics.getGrowthSummary(),
        api.analytics.getConversionFunnel(),
        api.analytics.getEngagementMetrics(30),
        api.analytics.getRegistrationTrends(startDate, endDate),
        api.analytics.getRevenueTrends(startDate, endDate),
        api.analytics.getActiveUserStats()
      ]);

      // Platform Health
      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value as PlatformHealth);
      }

      // Growth Summary
      if (growthRes.status === 'fulfilled') {
        const g = growthRes.value as any;
        const metrics: GrowthMetric[] = [];
        if (g.users) metrics.push({ label: 'Users', current: g.users.total || 0, wow_pct: g.users.wow_pct || 0, mom_pct: g.users.mom_pct || 0 });
        if (g.projects) metrics.push({ label: 'Projects', current: g.projects.total || 0, wow_pct: g.projects.wow_pct || 0, mom_pct: g.projects.mom_pct || 0 });
        if (g.proposals) metrics.push({ label: 'Proposals', current: g.proposals.total || 0, wow_pct: g.proposals.wow_pct || 0, mom_pct: g.proposals.mom_pct || 0 });
        if (g.revenue) metrics.push({ label: 'Revenue', current: g.revenue.total || 0, wow_pct: g.revenue.wow_pct || 0, mom_pct: g.revenue.mom_pct || 0 });
        setGrowth(metrics);
      }

      // Conversion Funnel
      if (funnelRes.status === 'fulfilled') {
        const f = funnelRes.value as any;
        const steps = f.stages || f.funnel || [];
        setFunnel(Array.isArray(steps) ? steps : []);
      }

      // Engagement
      if (engagementRes.status === 'fulfilled') {
        setEngagement(engagementRes.value as EngagementData);
      }

      // Registration Trends
      if (regRes.status === 'fulfilled') {
        const data = regRes.value;
        setRegistrationData({
          labels: Array.isArray(data) ? data.map((d: any) => d.date) : [],
          datasets: [{
            label: 'New Registrations',
            data: Array.isArray(data) ? data.map((d: any) => d.total) : [],
            borderColor: '#4573df',
            backgroundColor: 'rgba(69, 115, 223, 0.1)',
            fill: true,
            tension: 0.4,
          }],
        });
      }

      // Revenue Trends
      if (revRes.status === 'fulfilled') {
        const data = revRes.value;
        setRevenueData({
          labels: Array.isArray(data) ? data.map((d: any) => d.date) : [],
          datasets: [{
            label: 'Revenue ($)',
            data: Array.isArray(data) ? data.map((d: any) => d.revenue) : [],
            backgroundColor: '#27AE60',
            borderColor: '#27AE60',
            borderWidth: 2,
          }],
        });
      }

      // User Distribution
      if (userStatsRes.status === 'fulfilled') {
        const data = userStatsRes.value as any;
        const types = data.user_types || {};
        setUserDistribution({
          labels: ['Freelancers', 'Clients', 'Admins'],
          datasets: [{
            data: [types.freelancer || 0, types.client || 0, types.admin || 0],
            backgroundColor: ['#4573df', '#ff9800', '#e81123'],
            borderColor: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
            borderWidth: 2,
          }],
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching analytics:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#27AE60';
    if (score >= 60) return '#4573df';
    if (score >= 40) return '#F2C94C';
    return '#e81123';
  };

  const GrowthBadge = ({ value }: { value: number }) => {
    const cls = value > 0 ? commonStyles.growthUp : value < 0 ? commonStyles.growthDown : commonStyles.growthNeutral;
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
    return (
      <span className={cn(commonStyles.growthBadge, cls)}>
        <Icon size={10} />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563' },
      },
    },
    scales: {
      x: {
        ticks: { color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563' },
        grid: { color: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb' },
      },
      y: {
        ticks: { color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563' },
        grid: { color: resolvedTheme === 'dark' ? '#334155' : '#e5e7eb' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: resolvedTheme === 'dark' ? '#cbd5e1' : '#4b5563' },
      },
    },
  };

  if (loading) {
    return (
      <div className={s('container')}>
        <div className={s('loadingState')}>
          <div className={commonStyles.spinner} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const healthScore = health?.health_score ?? 0;
  const healthRadius = 54;
  const healthCirc = 2 * Math.PI * healthRadius;
  const healthOffset = healthCirc - (healthScore / 100) * healthCirc;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'growth', label: 'Growth', icon: <TrendingUp size={16} /> },
    { key: 'funnel', label: 'Funnel', icon: <Zap size={16} /> },
    { key: 'engagement', label: 'Engagement', icon: <Activity size={16} /> },
  ];

  const funnelColors = ['#4573df', '#6b93f5', '#27AE60', '#F2C94C', '#ff9800', '#e81123'];
  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <PageTransition>
      <div className={s('container')}>
        <ScrollReveal>
          <div className={s('header')}>
            <div className={commonStyles.headerLeft}>
              <h1 className={s('title')}>Analytics Dashboard</h1>
              <p className={s('subtitle')}>Platform performance and growth insights</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <div className={commonStyles.tabBar}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={cn(commonStyles.tab, themeStyles.tab, activeTab === tab.key && cn(commonStyles.tabActive, themeStyles.tabActive))}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Health + Growth Summary */}
            <ScrollReveal delay={0.1}>
              <div className={commonStyles.healthSection}>
                {/* Health Gauge */}
                <div className={cn(commonStyles.healthGauge, themeStyles.healthGauge)}>
                  <div className={commonStyles.gaugeCircle}>
                    <svg className={commonStyles.gaugeSvg} viewBox="0 0 120 120">
                      <circle
                        className={cn(commonStyles.gaugeTrack, themeStyles.gaugeTrack)}
                        cx="60" cy="60" r={healthRadius}
                      />
                      <circle
                        className={commonStyles.gaugeProgress}
                        cx="60" cy="60" r={healthRadius}
                        stroke={getHealthColor(healthScore)}
                        strokeDasharray={healthCirc}
                        strokeDashoffset={healthOffset}
                      />
                    </svg>
                    <div className={commonStyles.gaugeValue}>
                      <span className={cn(commonStyles.gaugeNumber, themeStyles.gaugeNumber)}>
                        {Math.round(healthScore)}
                      </span>
                      <span className={cn(commonStyles.gaugeLabel, themeStyles.gaugeLabel)}>
                        {health?.health_status || 'unknown'}
                      </span>
                    </div>
                  </div>

                  <div className={commonStyles.healthMeta}>
                    <div className={commonStyles.healthMetaItem}>
                      <div className={cn(commonStyles.healthMetaValue, themeStyles.healthMetaValue)}>
                        {health?.daily_active_users || 0}
                      </div>
                      <div className={cn(commonStyles.healthMetaLabel, themeStyles.healthMetaLabel)}>DAU</div>
                    </div>
                    <div className={commonStyles.healthMetaItem}>
                      <div className={cn(commonStyles.healthMetaValue, themeStyles.healthMetaValue)}>
                        {(health?.dau_ratio || 0).toFixed(1)}%
                      </div>
                      <div className={cn(commonStyles.healthMetaLabel, themeStyles.healthMetaLabel)}>DAU Ratio</div>
                    </div>
                    <div className={commonStyles.healthMetaItem}>
                      <div className={cn(commonStyles.healthMetaValue, themeStyles.healthMetaValue)}>
                        {health?.active_disputes || 0}
                      </div>
                      <div className={cn(commonStyles.healthMetaLabel, themeStyles.healthMetaLabel)}>Disputes</div>
                    </div>
                    <div className={commonStyles.healthMetaItem}>
                      <div className={cn(commonStyles.healthMetaValue, themeStyles.healthMetaValue)}>
                        {(health?.user_satisfaction_rating || 0).toFixed(1)}
                      </div>
                      <div className={cn(commonStyles.healthMetaLabel, themeStyles.healthMetaLabel)}>Avg Rating</div>
                    </div>
                  </div>
                </div>

                {/* Growth Cards */}
                <div className={commonStyles.growthGrid}>
                  {growth.map(metric => (
                    <div key={metric.label} className={cn(commonStyles.growthCard, themeStyles.growthCard)}>
                      <div className={commonStyles.growthCardHeader}>
                        <span className={cn(commonStyles.growthCardTitle, themeStyles.growthCardTitle)}>
                          {metric.label}
                        </span>
                      </div>
                      <div className={cn(commonStyles.growthCardValue, themeStyles.growthCardValue)}>
                        {metric.label === 'Revenue' ? `$${metric.current.toLocaleString()}` : metric.current.toLocaleString()}
                      </div>
                      <div className={commonStyles.growthRow}>
                        <span>WoW <GrowthBadge value={metric.wow_pct} /></span>
                        <span>MoM <GrowthBadge value={metric.mom_pct} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Charts */}
            <StaggerContainer delay={0.2} className={s('chartsGrid')}>
              <div className={s('chartCard')}>
                <h2 className={s('chartTitle')}>Registration Trends (30 Days)</h2>
                {registrationData && (
                  <div className={commonStyles.chartContainer}>
                    <Line data={registrationData} options={chartOptions} />
                  </div>
                )}
              </div>

              <div className={s('chartCard')}>
                <h2 className={s('chartTitle')}>Revenue Trends (30 Days)</h2>
                {revenueData && (
                  <div className={commonStyles.chartContainer}>
                    <Bar data={revenueData} options={chartOptions} />
                  </div>
                )}
              </div>

              <div className={s('chartCard')}>
                <h2 className={s('chartTitle')}>User Distribution</h2>
                {userDistribution && (
                  <div className={commonStyles.chartContainer}>
                    <Doughnut data={userDistribution} options={doughnutOptions} />
                  </div>
                )}
              </div>
            </StaggerContainer>
          </>
        )}

        {/* GROWTH TAB */}
        {activeTab === 'growth' && (
          <ScrollReveal>
            <h2 className={s('sectionTitle')}>
              <TrendingUp size={20} /> Growth Summary
            </h2>
            <div className={commonStyles.metricsGrid}>
              {growth.map(metric => (
                <div key={metric.label} className={s('metricCard')}>
                  <div className={cn(commonStyles.metricIcon, metric.label === 'Revenue' ? 'bg-green-500' : 'bg-blue-500')}>
                    {metric.label === 'Users' && <Users size={24} color="#fff" />}
                    {metric.label === 'Projects' && <Briefcase size={24} color="#fff" />}
                    {metric.label === 'Proposals' && <FileText size={24} color="#fff" />}
                    {metric.label === 'Revenue' && <DollarSign size={24} color="#fff" />}
                  </div>
                  <div>
                    <div className={s('metricValue')}>
                      {metric.label === 'Revenue' ? `$${metric.current.toLocaleString()}` : metric.current.toLocaleString()}
                    </div>
                    <div className={s('metricLabel')}>{metric.label}</div>
                    <div className={commonStyles.growthRow} style={{ marginTop: '0.5rem' }}>
                      <span>WoW <GrowthBadge value={metric.wow_pct} /></span>
                      <span>MoM <GrowthBadge value={metric.mom_pct} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* FUNNEL TAB */}
        {activeTab === 'funnel' && (
          <ScrollReveal>
            <div className={cn(commonStyles.funnelContainer, themeStyles.funnelContainer)}>
              <h2 className={cn(commonStyles.funnelTitle, themeStyles.funnelTitle)}>
                <Zap size={18} style={{ display: 'inline', marginRight: 8 }} />
                Conversion Funnel
              </h2>
              {funnel.length === 0 ? (
                <p className={s('metricLabel')}>No funnel data available yet.</p>
              ) : (
                <div className={commonStyles.funnelSteps}>
                  {funnel.map((step, i) => {
                    const pct = maxFunnelCount > 0 ? (step.count / maxFunnelCount) * 100 : 0;
                    const convPct = i === 0 ? 100 : funnel[0].count > 0 ? (step.count / funnel[0].count * 100) : 0;
                    return (
                      <div key={step.stage} className={commonStyles.funnelStep}>
                        <span className={cn(commonStyles.funnelLabel, themeStyles.funnelLabel)}>
                          {step.label || step.stage}
                        </span>
                        <div className={cn(commonStyles.funnelBarOuter, themeStyles.funnelBarOuter)}>
                          <div
                            className={commonStyles.funnelBarInner}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: funnelColors[i % funnelColors.length],
                            }}
                          />
                        </div>
                        <span className={cn(commonStyles.funnelCount, themeStyles.funnelCount)}>
                          {step.count.toLocaleString()}
                        </span>
                        <span className={cn(commonStyles.funnelPct, themeStyles.funnelPct)}>
                          {convPct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* ENGAGEMENT TAB */}
        {activeTab === 'engagement' && engagement && (
          <ScrollReveal>
            <h2 className={s('sectionTitle')}>
              <Activity size={20} /> Engagement (Last {engagement.period_days} Days)
            </h2>
            <div className={commonStyles.engagementGrid}>
              {[
                { label: 'Messages Sent', value: engagement.messages_sent, icon: <MessageSquare size={18} />, growthKey: 'messages_growth_pct' },
                { label: 'Proposals', value: engagement.proposals_submitted, icon: <FileText size={18} />, growthKey: 'proposals_growth_pct' },
                { label: 'Projects Posted', value: engagement.projects_posted, icon: <Briefcase size={18} />, growthKey: 'projects_growth_pct' },
                { label: 'Contracts', value: engagement.contracts_created, icon: <CheckCircle size={18} />, growthKey: '' },
                { label: 'Reviews', value: engagement.reviews_posted, icon: <Heart size={18} />, growthKey: '' },
              ].map(item => (
                <div key={item.label} className={cn(commonStyles.engagementCard, themeStyles.engagementCard)}>
                  {item.icon}
                  <div className={cn(commonStyles.engagementValue, themeStyles.engagementValue)}>
                    {item.value.toLocaleString()}
                  </div>
                  <div className={cn(commonStyles.engagementLabel, themeStyles.engagementLabel)}>
                    {item.label}
                  </div>
                  {item.growthKey && engagement.growth?.[item.growthKey] !== undefined && (
                    <div className={commonStyles.engagementGrowth}>
                      <GrowthBadge value={engagement.growth[item.growthKey]} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
};

export default AnalyticsDashboard;
