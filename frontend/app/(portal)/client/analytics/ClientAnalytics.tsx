// @AI-HINT: Client Analytics component with spending, project, and freelancer metrics. Fetches from client APIs.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, Users, Clock, 
  Download, Calendar, ArrowUpRight, ArrowDownRight, Star, Loader2
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import common from './ClientAnalytics.common.module.css';
import light from './ClientAnalytics.light.module.css';
import dark from './ClientAnalytics.dark.module.css';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

interface SpendingData {
  month: string;
  amount: number;
}

interface ProjectMetric {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface TopFreelancer {
  name: string;
  role: string;
  projects: number;
  rating: number;
  spent: string;
}

const ClientAnalytics: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [dateRange, setDateRange] = useState('6m');
  const { projects, payments, freelancers, loading, error } = useClientData();

  // Calculate metrics from real data
  const metrics = useMemo<MetricCard[]>(() => {
    const totalSpent = Array.isArray(payments) 
      ? payments.reduce((sum, p) => sum + parseFloat(p.amount?.replace(/[$,]/g, '') || '0'), 0)
      : 0;
    const activeProjects = Array.isArray(projects) 
      ? projects.filter(p => p.status === 'In Progress' || p.status === 'Open').length
      : 0;
    const freelancersHired = Array.isArray(freelancers) ? freelancers.length : 0;

    return [
      { title: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, change: 12.5, icon: <DollarSign size={20} />, trend: 'up' },
      { title: 'Active Projects', value: String(activeProjects), change: 3, icon: <Briefcase size={20} />, trend: 'up' },
      { title: 'Freelancers Hired', value: String(freelancersHired), change: 8, icon: <Users size={20} />, trend: 'up' },
      { title: 'Avg. Project Time', value: '2.3 weeks', change: -15, icon: <Clock size={20} />, trend: 'down' },
    ];
  }, [projects, payments, freelancers]);

  // Calculate spending data from payments
  const spendingData = useMemo<SpendingData[]>(() => {
    if (!Array.isArray(payments) || payments.length === 0) {
      return [
        { month: 'Jan', amount: 0 },
        { month: 'Feb', amount: 0 },
        { month: 'Mar', amount: 0 },
        { month: 'Apr', amount: 0 },
        { month: 'May', amount: 0 },
        { month: 'Jun', amount: 0 },
      ];
    }

    const monthlySpending: Record<string, number> = {};
    payments.forEach((payment) => {
      const date = new Date(payment.date || Date.now());
      const monthKey = date.toLocaleString('default', { month: 'short' });
      const amount = parseFloat(payment.amount?.replace(/[$,+]/g, '') || '0');
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + amount;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      spending: monthlySpending[month] || 0,
      amount: monthlySpending[month] || 0,
    }));
  }, [payments]);

  // Calculate project metrics from real data
  const projectMetrics = useMemo<ProjectMetric[]>(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return [
        { status: 'Completed', count: 0, percentage: 0, color: '#27AE60' },
        { status: 'In Progress', count: 0, percentage: 0, color: '#4573df' },
        { status: 'Pending Review', count: 0, percentage: 0, color: '#ff9800' },
        { status: 'Cancelled', count: 0, percentage: 0, color: '#e81123' },
      ];
    }

    const total = projects.length;
    const statusCounts: Record<string, number> = {};
    projects.forEach(p => {
      const status = p.status || 'Open';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return [
      { status: 'Completed', count: statusCounts['Completed'] || 0, percentage: Math.round(((statusCounts['Completed'] || 0) / total) * 100), color: '#27AE60' },
      { status: 'In Progress', count: statusCounts['In Progress'] || statusCounts['Active'] || 0, percentage: Math.round((((statusCounts['In Progress'] || 0) + (statusCounts['Active'] || 0)) / total) * 100), color: '#4573df' },
      { status: 'Pending Review', count: statusCounts['Open'] || 0, percentage: Math.round(((statusCounts['Open'] || 0) / total) * 100), color: '#ff9800' },
      { status: 'Cancelled', count: statusCounts['Cancelled'] || 0, percentage: Math.round(((statusCounts['Cancelled'] || 0) / total) * 100), color: '#e81123' },
    ];
  }, [projects]);

  // Top freelancers from API
  const topFreelancers = useMemo<TopFreelancer[]>(() => {
    if (!Array.isArray(freelancers) || freelancers.length === 0) {
      return [];
    }

    return freelancers.slice(0, 4).map(f => ({
      name: f.name,
      role: f.title || 'Freelancer',
      projects: f.completedProjects || 0,
      rating: f.rating || 0,
      spent: f.hourlyRate ? `$${parseFloat(f.hourlyRate.replace(/[$,]/g, '') || '0') * 40}` : '$0',
    }));
  }, [freelancers]);

  const maxSpending = Math.max(...spendingData.map(d => d.amount), 1);
  const totalProjects = Array.isArray(projects) ? projects.length : 0;
  const totalSpendingPeriod = spendingData.reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return (
      <main className={cn(common.main, themed.main)}>
        <header className={common.header}>
          <div>
            <h1 className={cn(common.title, themed.title)}>Analytics</h1>
          </div>
        </header>
        <div className={common.loading_state}>
          <Loader2 className={common.spinner} size={32} />
          <span>Loading analytics data...</span>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className={cn(common.main, themed.main)}>
        <ScrollReveal>
          <header className={common.header}>
            <div>
              <h1 className={cn(common.title, themed.title)}>Analytics</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Track your spending, project performance, and freelancer collaboration.
              </p>
            </div>
            <div className={common.header_actions}>
              <select 
                className={cn(common.date_select, themed.date_select)}
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                aria-label="Select date range"
                title="Date range filter"
              >
                <option value="1m">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <Button variant="secondary">
                <Download size={16} /> Export Report
              </Button>
            </div>
          </header>
        </ScrollReveal>

        {error && (
          <div className={common.error_banner}>
            Unable to load some analytics data. Showing available information.
          </div>
        )}

        {/* Metrics Cards */}
        <StaggerContainer className={common.metrics_grid}>
          {metrics.map((metric, idx) => (
            <StaggerItem key={idx} className={cn(common.metric_card, themed.metric_card)}>
              <div className={cn(common.metric_icon, themed.metric_icon)}>
                {metric.icon}
              </div>
              <div className={common.metric_content}>
                <span className={cn(common.metric_title, themed.metric_title)}>
                  {metric.title}
                </span>
                <span className={cn(common.metric_value, themed.metric_value)}>
                  {metric.value}
                </span>
                <span className={cn(
                  common.metric_change,
                  metric.trend === 'up' ? common.trend_up : common.trend_down,
                  metric.trend === 'up' ? themed.trend_up : themed.trend_down
                )}>
                  {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(metric.change)}% vs last period
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal delay={0.2}>
          <div className={common.charts_grid}>
            {/* Spending Chart */}
            <div className={cn(common.chart_card, themed.chart_card)}>
              <div className={common.chart_header}>
                <h3 className={cn(common.chart_title, themed.chart_title)}>Monthly Spending</h3>
                <span className={cn(common.chart_subtitle, themed.chart_subtitle)}>
                  Total: ${totalSpendingPeriod.toLocaleString()} this period
                </span>
              </div>
              <div className={common.bar_chart}>
                {spendingData.map((data, idx) => (
                  <div key={idx} className={common.bar_container}>
                    <div 
                      className={cn(common.bar, themed.bar)}
                      style={{ height: `${Math.round((data.amount / maxSpending) * 100)}%` }}
                    >
                      <span className={cn(common.bar_value, themed.bar_value)}>
                        ${(data.amount / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <span className={cn(common.bar_label, themed.bar_label)}>
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Status */}
            <div className={cn(common.chart_card, themed.chart_card)}>
              <div className={common.chart_header}>
                <h3 className={cn(common.chart_title, themed.chart_title)}>Project Status</h3>
                <span className={cn(common.chart_subtitle, themed.chart_subtitle)}>
                  {totalProjects} total projects
                </span>
              </div>
              <div className={common.project_stats}>
                {projectMetrics.map((metric, idx) => (
                  <div key={idx} className={common.project_stat}>
                    <div className={common.stat_header}>
                      <span 
                        className={cn(common.stat_dot, common[`stat_dot_${metric.status.toLowerCase().replace(' ', '_')}`])}
                      />
                      <span className={cn(common.stat_label, themed.stat_label)}>
                        {metric.status}
                      </span>
                      <span className={cn(common.stat_count, themed.stat_count)}>
                        {metric.count}
                      </span>
                    </div>
                    <div className={cn(common.stat_bar_bg, themed.stat_bar_bg)}>
                      <div 
                        className={cn(common.stat_bar_fill, common[`stat_bar_${metric.status.toLowerCase().replace(' ', '_')}`])}
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Top Freelancers */}
        <ScrollReveal delay={0.3}>
          <div className={cn(common.freelancers_section, themed.freelancers_section)}>
            <div className={common.section_header}>
              <h3 className={cn(common.section_title, themed.section_title)}>
                Top Freelancers
              </h3>
              <span className={cn(common.section_subtitle, themed.section_subtitle)}>
                Your most hired collaborators
              </span>
            </div>
            <StaggerContainer className={common.freelancers_list}>
              {topFreelancers.length === 0 ? (
                <div className={common.empty_state}>No freelancers hired yet.</div>
              ) : topFreelancers.map((freelancer, idx) => (
                <StaggerItem key={idx} className={cn(common.freelancer_card, themed.freelancer_card)}>
                  <div className={cn(common.freelancer_avatar, themed.freelancer_avatar)}>
                    {freelancer.name.charAt(0)}
                  </div>
                  <div className={common.freelancer_info}>
                    <span className={cn(common.freelancer_name, themed.freelancer_name)}>
                      {freelancer.name}
                    </span>
                    <span className={cn(common.freelancer_role, themed.freelancer_role)}>
                      {freelancer.role}
                    </span>
                  </div>
                  <div className={common.freelancer_stats}>
                    <div className={common.freelancer_stat}>
                      <span className={cn(common.stat_value_sm, themed.stat_value_sm)}>
                        {freelancer.projects}
                      </span>
                      <span className={cn(common.stat_label_sm, themed.stat_label_sm)}>
                        Projects
                      </span>
                    </div>
                    <div className={common.freelancer_stat}>
                      <span className={cn(common.stat_value_sm, themed.stat_value_sm)}>
                        <Star size={12} fill="currentColor" /> {freelancer.rating}
                      </span>
                      <span className={cn(common.stat_label_sm, themed.stat_label_sm)}>
                        Rating
                      </span>
                    </div>
                    <div className={common.freelancer_stat}>
                      <span className={cn(common.stat_value_sm, themed.stat_value_sm)}>
                        {freelancer.spent}
                      </span>
                      <span className={cn(common.stat_label_sm, themed.stat_label_sm)}>
                        Spent
                      </span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default ClientAnalytics;
