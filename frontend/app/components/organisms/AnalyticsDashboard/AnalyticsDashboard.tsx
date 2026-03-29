// @AI-HINT: Admin analytics dashboard with metrics, charts, and real-time insights
"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './AnalyticsDashboard.common.module.css';
import lightStyles from './AnalyticsDashboard.light.module.css';
import darkStyles from './AnalyticsDashboard.dark.module.css';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const { resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);

  // Theme guard
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
        if (response.ok) {
          const data = await response.json();

          // Build metrics
          setMetrics({
            revenue: {
              label: 'Total Revenue',
              value: `$${(data.total_revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
              change: data.revenue_change || 0,
              icon: '💰',
              color: '#27ae60'
            },
            users: {
              label: 'Active Users',
              value: data.active_users || 0,
              change: data.users_change || 0,
              icon: '👥',
              color: '#4573df'
            },
            projects: {
              label: 'Total Projects',
              value: data.total_projects || 0,
              change: data.projects_change || 0,
              icon: '📋',
              color: '#ff9800'
            },
            transactions: {
              label: 'Transactions',
              value: data.total_transactions || 0,
              change: data.transactions_change || 0,
              icon: '📊',
              color: '#9c27b0'
            },
            avgValue: {
              label: 'Avg. Project Value',
              value: `$${(data.avg_project_value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
              change: data.avg_value_change || 0,
              icon: '📈',
              color: '#f2a93e'
            },
            completion: {
              label: 'Completion Rate',
              value: `${(data.completion_rate || 0).toFixed(1)}%`,
              change: data.completion_change || 0,
              icon: '✅',
              color: '#1abc9c'
            }
          });

          // Revenue trend chart
          setChartData(data.revenue_trend || []);
          setTopFreelancers(data.top_freelancers || []);
          setTopProjects(data.top_projects || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?format=csv&range=${dateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?format=pdf&range=${dateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // Simple bar chart renderer (without external library)
  const renderChart = (data: ChartData[]) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
      <div className={commonStyles.chart}>
        {data.map((item, idx) => (
          <div key={idx} className={commonStyles.chartBar}>
            <div className={commonStyles.chartBarLabel}>{item.name}</div>
            <div className={commonStyles.chartBarContainer}>
              <div
                className={cn(commonStyles.chartBarFill, themeStyles.chartBarFill)}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className={commonStyles.chartBarValue}>{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      {/* Header */}
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h1 className={commonStyles.title}>📊 Analytics Dashboard</h1>
          <p className={commonStyles.subtitle}>Real-time platform metrics and business intelligence</p>
        </div>
        <div className={commonStyles.headerActions}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={cn(commonStyles.dateSelect, themeStyles.dateSelect)}
            aria-label="Select date range"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            📥 CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            📄 PDF
          </Button>
        </div>
      </div>

      {/* Loading / Error States */}
      {isLoading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          <div className={commonStyles.spinner}>⏳</div>
          <p>Loading analytics...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          ⚠️ {error}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className={commonStyles.metricsGrid}>
            {Object.entries(metrics).map(([key, metric]) => (
              <div
                key={key}
                className={cn(commonStyles.metricCard, themeStyles.metricCard)}
              >
                <div className={commonStyles.metricHeader}>
                  <div className={commonStyles.metricIcon}>{metric.icon}</div>
                  <div className={commonStyles.metricChange}>
                    {metric.change !== undefined && (
                      <>
                        <span className={metric.change >= 0 ? commonStyles.changeUp : commonStyles.changeDown}>
                          {metric.change >= 0 ? '📈' : '📉'} {Math.abs(metric.change)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={commonStyles.metricLabel}>{metric.label}</div>
                <div className={cn(commonStyles.metricValue, `metric-${key}`)}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Trend */}
          {chartData.length > 0 && (
            <div className={cn(commonStyles.card, themeStyles.card)}>
              <h2 className={commonStyles.cardTitle}>💹 Revenue Trend</h2>
              {renderChart(chartData)}
            </div>
          )}

          {/* Two Column Layout */}
          <div className={commonStyles.gridTwo}>
            {/* Top Freelancers */}
            <div className={cn(commonStyles.card, themeStyles.card)}>
              <h2 className={commonStyles.cardTitle}>⭐ Top Freelancers</h2>
              {topFreelancers.length > 0 ? (
                <div className={commonStyles.list}>
                  {topFreelancers.map((freelancer, idx) => (
                    <div key={idx} className={commonStyles.listItem}>
                      <div className={commonStyles.listRank}>{idx + 1}</div>
                      <div className={commonStyles.listContent}>
                        <div className={commonStyles.listName}>{freelancer.name}</div>
                        <div className={commonStyles.listMeta}>${freelancer.earnings?.toLocaleString()}</div>
                      </div>
                      <div className={commonStyles.listValue}>{freelancer.projects} projects</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={commonStyles.empty}>No data available</div>
              )}
            </div>

            {/* Top Projects */}
            <div className={cn(commonStyles.card, themeStyles.card)}>
              <h2 className={commonStyles.cardTitle}>🏆 Top Projects</h2>
              {topProjects.length > 0 ? (
                <div className={commonStyles.list}>
                  {topProjects.map((project, idx) => (
                    <div key={idx} className={commonStyles.listItem}>
                      <div className={commonStyles.listRank}>{idx + 1}</div>
                      <div className={commonStyles.listContent}>
                        <div className={commonStyles.listName}>{project.title}</div>
                        <div className={commonStyles.listMeta}>{project.category}</div>
                      </div>
                      <div className={commonStyles.listValue}>${project.budget?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={commonStyles.empty}>No data available</div>
              )}
            </div>
          </div>
        </>
      )}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          borderRadius: 8, color: '#fff', zIndex: 9999, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#27AE60' : '#e81123',
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
