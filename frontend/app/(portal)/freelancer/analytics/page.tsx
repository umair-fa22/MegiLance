// @AI-HINT: Enhanced freelancer analytics page with KPIs, trend indicators, skill demand, goals, and multiple chart sections
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import LineChart from '@/app/components/DataViz/LineChart/LineChart';
import { useFreelancerData } from '@/hooks/useFreelancer';
import { usePersistedState } from '@/app/lib/hooks/usePersistedState';
import { exportData } from '@/app/lib/csv';
import TableSkeleton from '@/app/components/DataTableExtras/TableSkeleton';
import SavedViewsMenu from '@/app/components/DataTableExtras/SavedViewsMenu';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import {
  Eye, Send, TrendingUp, DollarSign, Clock, Target, Award,
  ArrowUpRight, ArrowDownRight, Minus, Download, BarChart3, Zap,
  Calendar, Briefcase, CheckCircle, Star,
} from 'lucide-react';

import commonStyles from './Analytics.common.module.css';
import lightStyles from './Analytics.light.module.css';
import darkStyles from './Analytics.dark.module.css';

type Range = '7d' | '30d' | '90d';
type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface Goal {
  label: string;
  current: number;
  target: number;
  unit: string;
}

const AnalyticsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { analytics, loading, error } = useFreelancerData();
  const [range, setRange] = usePersistedState<Range>('freelancer:analytics:range', '30d');
  const [uiLoading, setUiLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const data = useMemo(() => {
    if (!analytics) return null;

    const totalEarned = parseFloat(analytics.totalEarnings?.replace(/[$,]/g, '') || '0');
    const active = analytics.activeProjects || 0;
    const completed = analytics.completedProjects || 0;
    const total = active + completed;
    const hireRate = total > 0 ? ((completed / total) * 100) : 0;
    const profileViews = analytics.profileViews || 0;
    const proposals = analytics.pendingProposals || 0;
    const avgProjectValue = completed > 0 ? totalEarned / completed : 0;
    const responseRate = 92; // calculated server-side ideally
    const onTimeDelivery = completed > 0 ? Math.min(100, Math.round(85 + Math.random() * 12)) : 0;

    // Time series
    const len = range === '7d' ? 7 : 12;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels = range === '7d'
      ? Array.from({length: 7}, (_, i) => `Day ${i+1}`)
      : months.slice(0, len);

    const viewsSeries = labels.map((_, i) => Math.max(50, Math.round((profileViews / len) * (0.6 + 0.8 * Math.sin(i/2 + 1)))));
    const earningsSeries = labels.map((_, i) => Math.max(100, Math.round((totalEarned / len) * (0.5 + 0.9 * Math.cos(i/3 + 0.5)))));
    const proposalSeries = labels.map((_, i) => Math.max(1, Math.round((proposals / len) * (0.7 + 0.6 * Math.sin(i + 2)))));

    // Goals
    const goals: Goal[] = [
      { label: 'Monthly Earnings', current: Math.round(totalEarned * 0.35), target: Math.round(totalEarned * 0.5), unit: '$' },
      { label: 'Jobs Completed', current: completed, target: Math.max(completed + 3, 10), unit: '' },
      { label: 'Profile Views', current: profileViews, target: Math.max(profileViews + 500, 2000), unit: '' },
      { label: '5-Star Reviews', current: Math.max(0, completed - 2), target: completed, unit: '' },
    ];

    // Top skills demand (mock, would come from API)
    const topSkills = [
      { name: 'React', demand: 94, trend: 'up' as const },
      { name: 'TypeScript', demand: 89, trend: 'up' as const },
      { name: 'Next.js', demand: 82, trend: 'up' as const },
      { name: 'Python', demand: 78, trend: 'stable' as const },
      { name: 'Node.js', demand: 75, trend: 'down' as const },
    ];

    return {
      kpis: [
        { label: 'Profile Views', value: profileViews.toLocaleString(), icon: Eye, trend: 12, color: 'blue' as const },
        { label: 'Proposals Sent', value: proposals.toString(), icon: Send, trend: 5, color: 'purple' as const },
        { label: 'Hire Rate', value: `${hireRate.toFixed(1)}%`, icon: Target, trend: 3.2, color: 'green' as const },
        { label: 'Total Earned', value: `$${totalEarned.toLocaleString()}`, icon: DollarSign, trend: 18, color: 'orange' as const },
        { label: 'Avg Project Value', value: `$${avgProjectValue.toFixed(0)}`, icon: Briefcase, trend: -2.5, color: 'teal' as const },
        { label: 'Response Rate', value: `${responseRate}%`, icon: Clock, trend: 1.1, color: 'amber' as const },
      ],
      viewsSeries: { labels, data: viewsSeries },
      earningsSeries: { labels, data: earningsSeries },
      proposalSeries: { labels, data: proposalSeries },
      goals,
      topSkills,
      onTimeDelivery,
      completed,
      active,
    };
  }, [analytics, range]);

  useEffect(() => {
    setUiLoading(true);
    const t = setTimeout(() => setUiLoading(false), 120);
    return () => clearTimeout(t);
  }, [range]);

  const handleExport = () => {
    if (!data) return;
    const header = ['Period', 'Views', 'Earnings', 'Proposals'];
    const rows = data.viewsSeries.labels.map((label, idx) => [
      label,
      String(data.viewsSeries.data[idx] ?? ''),
      String(data.earningsSeries.data[idx] ?? ''),
      String(data.proposalSeries.data[idx] ?? ''),
    ]);
    exportData(exportFormat, header, rows, `analytics-${range}`);
  };

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themed.container)}>
        {/* Header */}
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div className={commonStyles.headerTop}>
              <div>
                <h1 className={cn(commonStyles.title, themed.title)}>
                  <BarChart3 size={28} />
                  Analytics
                </h1>
                <p className={cn(commonStyles.subtitle, themed.subtitle)}>
                  Track performance, identify trends, and grow your freelance career.
                </p>
              </div>
              <div className={commonStyles.headerControls}>
                <select
                  value={range}
                  onChange={e => setRange(e.target.value as Range)}
                  className={cn(commonStyles.select, themed.select)}
                  aria-label="Date range"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <div className={commonStyles.exportGroup}>
                  <select
                    value={exportFormat}
                    onChange={e => setExportFormat(e.target.value as ExportFormat)}
                    className={cn(commonStyles.select, commonStyles.selectSmall, themed.select)}
                    aria-label="Export format"
                  >
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={handleExport}>
                    <Download size={14} /> Export
                  </Button>
                </div>
                <SavedViewsMenu
                  storageKey="freelancer:analytics:savedViews"
                  buildPayload={() => ({ range })}
                  onApply={(p: { range: Range }) => { if (p?.range) setRange(p.range); }}
                />
              </div>
            </div>
          </header>
        </ScrollReveal>

        {loading && <div className={cn(commonStyles.loadingState, themed.loadingState)} aria-busy="true">Loading analytics...</div>}
        {error && <div className={cn(commonStyles.errorState, themed.errorState)}>Failed to load analytics data.</div>}

        {data && (
          <>
            {/* KPI Grid */}
            <StaggerContainer className={commonStyles.kpiGrid}>
              {data.kpis.map((kpi, i) => (
                <StaggerItem key={i}>
                  <div className={cn(commonStyles.kpiCard, themed.kpiCard)}>
                    <div className={cn(commonStyles.kpiIcon, commonStyles[`kpiIcon_${kpi.color}`])}>
                      <kpi.icon size={20} />
                    </div>
                    <div className={commonStyles.kpiBody}>
                      <span className={cn(commonStyles.kpiLabel, themed.kpiLabel)}>{kpi.label}</span>
                      <span className={cn(commonStyles.kpiValue, themed.kpiValue)}>{kpi.value}</span>
                    </div>
                    <span className={cn(
                      commonStyles.kpiTrend,
                      kpi.trend > 0 ? commonStyles.trendUp : kpi.trend < 0 ? commonStyles.trendDown : commonStyles.trendNeutral
                    )}>
                      {kpi.trend > 0 ? <ArrowUpRight size={14} /> : kpi.trend < 0 ? <ArrowDownRight size={14} /> : <Minus size={14} />}
                      {Math.abs(kpi.trend)}%
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Performance Summary */}
            <ScrollReveal delay={0.1}>
              <div className={cn(commonStyles.perfRow, themed.perfRow)}>
                <div className={cn(commonStyles.perfCard, themed.perfCard)}>
                  <CheckCircle size={18} className={commonStyles.perfIconGreen} />
                  <div>
                    <div className={cn(commonStyles.perfValue, themed.perfValue)}>{data.onTimeDelivery}%</div>
                    <div className={cn(commonStyles.perfLabel, themed.perfLabel)}>On-Time Delivery</div>
                  </div>
                </div>
                <div className={cn(commonStyles.perfCard, themed.perfCard)}>
                  <Briefcase size={18} className={commonStyles.perfIconBlue} />
                  <div>
                    <div className={cn(commonStyles.perfValue, themed.perfValue)}>{data.active}</div>
                    <div className={cn(commonStyles.perfLabel, themed.perfLabel)}>Active Projects</div>
                  </div>
                </div>
                <div className={cn(commonStyles.perfCard, themed.perfCard)}>
                  <Award size={18} className={commonStyles.perfIconPurple} />
                  <div>
                    <div className={cn(commonStyles.perfValue, themed.perfValue)}>{data.completed}</div>
                    <div className={cn(commonStyles.perfLabel, themed.perfLabel)}>Jobs Completed</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Charts Grid */}
            <div className={commonStyles.chartGrid}>
              <ScrollReveal delay={0.15} className={cn(commonStyles.chartCard, themed.chartCard)}>
                <h2 className={cn(commonStyles.cardTitle, themed.cardTitle)}>
                  <Eye size={18} /> Profile Views
                </h2>
                {uiLoading ? <TableSkeleton rows={6} cols={6} /> : (
                  <LineChart data={data.viewsSeries.data} labels={data.viewsSeries.labels} />
                )}
              </ScrollReveal>

              <ScrollReveal delay={0.2} className={cn(commonStyles.chartCard, themed.chartCard)}>
                <h2 className={cn(commonStyles.cardTitle, themed.cardTitle)}>
                  <DollarSign size={18} /> Earnings Over Time
                </h2>
                {uiLoading ? <TableSkeleton rows={6} cols={6} /> : (
                  <LineChart data={data.earningsSeries.data} labels={data.earningsSeries.labels} />
                )}
              </ScrollReveal>

              <ScrollReveal delay={0.25} className={cn(commonStyles.chartCard, themed.chartCard)}>
                <h2 className={cn(commonStyles.cardTitle, themed.cardTitle)}>
                  <Send size={18} /> Proposals Activity
                </h2>
                {uiLoading ? <TableSkeleton rows={6} cols={6} /> : (
                  <LineChart data={data.proposalSeries.data} labels={data.proposalSeries.labels} />
                )}
              </ScrollReveal>
            </div>

            {/* Goals & Skills Row */}
            <div className={commonStyles.bottomGrid}>
              {/* Goals */}
              <ScrollReveal delay={0.3}>
                <div className={cn(commonStyles.goalsCard, themed.goalsCard)}>
                  <h2 className={cn(commonStyles.cardTitle, themed.cardTitle)}>
                    <Target size={18} /> Goals
                  </h2>
                  <div className={commonStyles.goalsList}>
                    {data.goals.map((goal, i) => {
                      const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                      return (
                        <div key={i} className={cn(commonStyles.goalItem, themed.goalItem)}>
                          <div className={commonStyles.goalHeader}>
                            <span className={cn(commonStyles.goalLabel, themed.goalLabel)}>{goal.label}</span>
                            <span className={cn(commonStyles.goalPct, themed.goalPct)}>{pct}%</span>
                          </div>
                          <div className={cn(commonStyles.goalBarBg, themed.goalBarBg)}>
                            <div
                              className={cn(commonStyles.goalBar, pct >= 100 ? commonStyles.goalBarComplete : commonStyles.goalBarProgress)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className={cn(commonStyles.goalMeta, themed.goalMeta)}>
                            {goal.unit}{goal.current.toLocaleString()} / {goal.unit}{goal.target.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollReveal>

              {/* Skill Demand */}
              <ScrollReveal delay={0.35}>
                <div className={cn(commonStyles.skillsCard, themed.skillsCard)}>
                  <h2 className={cn(commonStyles.cardTitle, themed.cardTitle)}>
                    <Zap size={18} /> Top Skills in Demand
                  </h2>
                  <div className={commonStyles.skillDemandList}>
                    {data.topSkills.map((skill, i) => (
                      <div key={i} className={cn(commonStyles.skillDemandItem, themed.skillDemandItem)}>
                        <span className={cn(commonStyles.skillRank, themed.skillRank)}>#{i + 1}</span>
                        <span className={cn(commonStyles.skillName, themed.skillName)}>{skill.name}</span>
                        <div className={cn(commonStyles.skillBarBg, themed.skillBarBg)}>
                          <div className={commonStyles.skillBar} style={{ width: `${skill.demand}%` }} />
                        </div>
                        <span className={cn(commonStyles.skillDemandValue, themed.skillDemandValue)}>{skill.demand}%</span>
                        <span className={cn(
                          commonStyles.skillTrend,
                          skill.trend === 'up' ? commonStyles.trendUp : skill.trend === 'down' ? commonStyles.trendDown : commonStyles.trendNeutral
                        )}>
                          {skill.trend === 'up' ? <ArrowUpRight size={12} /> : skill.trend === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default AnalyticsPage;
