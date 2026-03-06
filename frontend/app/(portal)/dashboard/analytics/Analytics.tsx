// @AI-HINT: Portal Analytics page. Theme-aware, accessible, animated KPIs and charts with filters.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { analyticsApi } from '@/lib/api';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import common from './Analytics.common.module.css';
import light from './Analytics.light.module.css';
import dark from './Analytics.dark.module.css';

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days'] as const;
const SEGMENTS = ['All', 'Clients', 'Freelancers'] as const;

interface AnalyticsData {
  kpis: { label: string; value: string; delta: string }[];
  bars: number[];
  points: { x: number; y: number }[];
  table: { metric: string; value: number }[];
}

const Analytics: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [range, setRange] = useState<(typeof RANGES)[number]>('Last 30 days');
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>('All');
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<any>(null);

  // Fetch real analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Get date range for API call
        const now = new Date();
        const days = range === 'Last 7 days' ? 7 : range === 'Last 90 days' ? 90 : 30;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const [summary, revenueTrends, userStats] = await Promise.all([
          analyticsApi.getDashboardSummary().catch((e: unknown) => { console.error('Dashboard summary failed:', e); return null; }),
          analyticsApi.getRevenueTrends(
            startDate.toISOString().split('T')[0],
            now.toISOString().split('T')[0],
            days <= 7 ? 'day' : days <= 30 ? 'day' : 'week'
          ).catch((e: unknown) => { console.error('Revenue trends failed:', e); return null; }),
          analyticsApi.getActiveUserStats(days).catch((e: unknown) => { console.error('User stats failed:', e); return null; }),
        ]);

        setApiData({ summary, revenueTrends, userStats });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [range]);

  // Transform API data or use fallback computed values
  const data = useMemo<AnalyticsData>(() => {
    // Use API data if available, otherwise show zeros
    if (apiData?.summary) {
      const s = apiData.summary;
      return {
        kpis: [
          { 
            label: 'Revenue', 
            value: `$${(s.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
            delta: s.revenue_growth ? `+${s.revenue_growth}%` : '—' 
          },
          { 
            label: 'Active Projects', 
            value: (s.active_projects || 0).toString(), 
            delta: s.projects_delta ? `+${s.projects_delta}` : '—' 
          },
          { 
            label: 'New Users', 
            value: (s.new_users || 0).toString(), 
            delta: s.users_delta ? `+${s.users_delta}` : '—' 
          },
          { 
            label: 'Conversion Rate', 
            value: s.conversion_rate ? `${Number(s.conversion_rate).toFixed(1)}%` : '0%', 
            delta: s.conversion_delta ? `+${s.conversion_delta}%` : '—' 
          },
        ],
        bars: apiData.revenueTrends?.data?.map((d: any) => d.value) || 
              Array.from({ length: 12 }, () => 0),
        points: apiData.userStats?.growth?.map((d: any, i: number) => ({ 
          x: (i + 1) * 10, 
          y: 20 + (d.value || 0) 
        })) || Array.from({ length: 10 }, (_, i) => ({ x: (i + 1) * 10, y: 20 })),
        table: [
          { metric: 'Signups', value: s.signups || 0 },
          { metric: 'Trials Started', value: s.trials || 0 },
          { metric: 'Upgrades', value: s.upgrades || 0 },
          { metric: 'Churned', value: s.churned || 0 },
        ],
      };
    }

    // No API data available - show zeros
    return {
      kpis: [
        { label: 'Revenue', value: '$0', delta: '—' },
        { label: 'Active Projects', value: '0', delta: '—' },
        { label: 'New Users', value: '0', delta: '—' },
        { label: 'Conversion Rate', value: '0%', delta: '—' },
      ],
      bars: Array.from({ length: 12 }, () => 0),
      points: Array.from({ length: 10 }, (_, i) => ({ x: (i + 1) * 10, y: 20 })),
      table: [
        { metric: 'Signups', value: 0 },
        { metric: 'Trials Started', value: 0 },
        { metric: 'Upgrades', value: 0 },
        { metric: 'Churned', value: 0 },
      ],
    };
  }, [range, segment, apiData]);

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>Analytics</h1>
            <p className={themed.subtitle}>Track revenue, users, and performance across your workspace.</p>
          </div>
          <div className={common.controls} aria-label="Analytics filters">
            <label className={common.srOnly} htmlFor="range">Date range</label>
            <select id="range" className={themed.select + ' ' + common.select} value={range} onChange={(e) => setRange(e.target.value as (typeof RANGES)[number])}>
              {RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <label className={common.srOnly} htmlFor="segment">Segment</label>
            <select id="segment" className={themed.select + ' ' + common.select} value={segment} onChange={(e) => setSegment(e.target.value as (typeof SEGMENTS)[number])}>
              {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </ScrollReveal>

        <section aria-label="Key performance indicators">
          <StaggerContainer className={common.kpis}>
            {data.kpis.map((k) => (
              <div key={k.label} tabIndex={0} className={cn(common.kpi, themed.kpi)}>
                <div className={cn(common.kpiLabel, themed.kpiLabel)}>{k.label}</div>
                <div className={common.kpiValue}>{k.value}</div>
                <div className={cn(common.kpiDelta, themed.kpiDelta)} aria-label={`Delta ${k.delta}`}>{k.delta}</div>
              </div>
            ))}
          </StaggerContainer>
        </section>

        <section aria-label="Analytics charts and breakdowns">
          <StaggerContainer className={common.grid} delay={0.2}>
            <div className={cn(common.card, themed.card)}>
              <div className={cn(common.cardTitle, themed.cardTitle)}>Monthly Revenue</div>
              {/* SVG bar chart to avoid inline styles */}
              <svg
                role="img"
                aria-label="Bar chart of monthly revenue"
                width="100%"
                height="220"
                viewBox="0 0 120 100"
                preserveAspectRatio="none"
              >
                {/* Bars */}
                {data.bars.map((val, i) => {
                  const x = i * (120 / data.bars.length) + 2; // spacing
                  const barWidth = (120 / data.bars.length) - 4;
                  const heightPct = Math.max(0, Math.min(100, val));
                  const h = (heightPct / 100) * 90; // leave some top padding
                  const y = 100 - h;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      className={cn(common.bar, themed.bar)}
                      rx={1.5}
                      ry={1.5}
                      aria-hidden="true"
                    />
                  );
                })}
              </svg>
            </div>

            <div className={cn(common.card, themed.card)}>
              <div className={cn(common.cardTitle, themed.cardTitle)}>User Growth</div>
              {/* SVG line chart to avoid inline styles */}
              <svg
                role="img"
                aria-label="Line chart of user growth"
                width="100%"
                height="240"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* Path */}
                {(() => {
                  const d = data.points
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${100 - p.y}`)
                    .join(' ');
                  return (
                    <path d={d} fill="none" stroke="var(--primary)" strokeWidth={1.5} aria-hidden="true" />
                  );
                })()}
                {/* Points */}
                {data.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={100 - p.y}
                    r={1.5}
                    className={cn(common.point, themed.point)}
                    aria-hidden="true"
                  />)
                )}
              </svg>
            </div>
          </StaggerContainer>
        </section>

        <section aria-label="Metrics table">
          <ScrollReveal className={cn(common.card, themed.card)} delay={0.4}>
            <div className={cn(common.cardTitle, themed.cardTitle)}>Breakdown</div>
            <table className={common.table}>
              <thead>
                <tr>
                  <th scope="col" className={themed.th + ' ' + common.th}>Metric</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.table.map((row) => (
                  <tr key={row.metric}>
                    <td className={themed.td + ' ' + common.td}>{row.metric}</td>
                    <td className={themed.td + ' ' + common.td}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollReveal>
        </section>
      </div>
    </PageTransition>
  );
};

export default Analytics;
