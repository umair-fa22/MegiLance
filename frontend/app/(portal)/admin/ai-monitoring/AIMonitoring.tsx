// @AI-HINT: Admin AI Monitoring page. Theme-aware, accessible, animated KPIs, SVG charts, and logs list.
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useAdminData } from '@/hooks/useAdmin';
import common from './AIMonitoring.common.module.css';
import light from './AIMonitoring.light.module.css';
import dark from './AIMonitoring.dark.module.css';

interface KPI { id: string; label: string; value: string; trend?: 'up' | 'down' | 'flat'; delta?: string; }
interface LogRow { id: string; ts: string; level: 'info' | 'warn' | 'error'; message: string; model: string; latencyMs: number; }

const LEVELS = ['All', 'info', 'warn', 'error'] as const;
const TIME_RANGES = ['24h', '7d', '30d'] as const;

// Chart rendering functions reserved for when monitoring API provides time-series data

const AIMonitoring: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { ai, loading, error } = useAdminData();

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All');
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGES)[number]>('24h');

  const kpis: KPI[] = useMemo(() => {
    const stats = ai?.aiStats;
    const totalCalls = (stats?.fraudDetections ?? 0) + (stats?.priceEstimations ?? 0) + (stats?.chatbotSessions ?? 0);
    return [
      { id: 'k1', label: 'Model Accuracy', value: stats?.rankModelAccuracy ?? '0%' },
      { id: 'k2', label: 'Total API Calls', value: totalCalls.toLocaleString() },
      { id: 'k3', label: 'Avg Latency', value: '—' },
      { id: 'k4', label: 'Error Rate', value: '—' },
      { id: 'k5', label: 'Fraud Detections', value: String(stats?.fraudDetections ?? 0) },
      { id: 'k6', label: 'Active Models', value: totalCalls > 0 ? '4' : '0' },
    ];
  }, [ai?.aiStats]);

  const logs: LogRow[] = useMemo(() => {
    if (!Array.isArray(ai?.recentFraudAlerts) || ai.recentFraudAlerts.length === 0) return [];
    return (ai.recentFraudAlerts as any[]).map((l, idx) => ({
      id: String(l.id ?? idx),
      ts: l.timestamp ?? '',
      level: 'warn' as LogRow['level'],
      message: l.reason ?? '',
      model: 'Fraud Detection',
      latencyMs: 0,
    }));
  }, [ai?.recentFraudAlerts]);

  const modelStats = useMemo(() => {
    const stats = ai?.aiStats;
    if (!stats) return [];
    return [
      { name: 'Fraud Detection', calls: stats.fraudDetections ?? 0 },
      { name: 'Price Estimation', calls: stats.priceEstimations ?? 0 },
      { name: 'Rank & Match', calls: 0 },
      { name: 'Chatbot NLP', calls: stats.chatbotSessions ?? 0 },
    ].filter(m => m.calls > 0);
  }, [ai?.aiStats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter(l =>
      (level === 'All' || l.level === level) &&
      (!q || l.message.toLowerCase().includes(q) || l.model.toLowerCase().includes(q))
    );
  }, [logs, query, level]);

  const handleExport = useCallback(() => {
    const csv = ['Timestamp,Level,Model,Message,Latency(ms)',
      ...filtered.map(l => `"${l.ts}","${l.level}","${l.model}","${l.message}",${l.latencyMs}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const trendIcon = (t?: 'up' | 'down' | 'flat') => {
    if (t === 'up') return '↑';
    if (t === 'down') return '↓';
    return '–';
  };

  const levelBadgeClass = (l: string) => {
    if (l === 'error') return cn(common.badge, common.badgeError);
    if (l === 'warn') return cn(common.badge, common.badgeWarn);
    return cn(common.badge, common.badgeInfo);
  };


  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>AI Monitoring</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Track AI model performance, latency, errors, and throughput across all services.</p>
          </div>
          <div className={common.controls} aria-label="AI monitoring controls">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search logs…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="level">Level</label>
            <select id="level" className={cn(common.select, themed.select)} value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}>
              {LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className={common.srOnly} htmlFor="timeRange">Time range</label>
            <select id="timeRange" className={cn(common.select, themed.select)} value={timeRange} onChange={(e) => setTimeRange(e.target.value as (typeof TIME_RANGES)[number])}>
              {TIME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)} onClick={handleExport}>Export CSV</button>
          </div>
        </ScrollReveal>

        <StaggerContainer>
          {/* ── KPI Cards ── */}
          <ScrollReveal className={common.kpis} aria-label="AI KPIs">
            {loading && <div className={common.skeletonRow} aria-busy="true" />}
            {error && <div className={common.error}>Failed to load AI metrics.</div>}
            {kpis.map(k => (
              <div key={k.id} className={cn(common.card, themed.card)} tabIndex={0} aria-labelledby={`kpi-${k.id}-label`}>
                <div id={`kpi-${k.id}-label`} className={cn(common.cardLabel, themed.cardTitle)}>{k.label}</div>
                <div className={cn(common.metric, themed.metric)}>{k.value}</div>
                {k.delta && (
                  <div className={cn(common.trend, k.trend === 'up' ? common.trendUp : k.trend === 'down' ? common.trendDown : common.trendFlat)}>
                    {trendIcon(k.trend)} {k.delta}
                  </div>
                )}
              </div>
            ))}
          </ScrollReveal>

          {/* ── Charts Row ── */}
          <ScrollReveal className={common.grid}>
            {/* Latency Chart */}
            <div className={cn(common.panel, themed.panel)} aria-label="Latency chart">
              <div className={common.panelHeader}>
                <div className={cn(common.cardTitle, themed.cardTitle)}>Latency (ms)</div>
              </div>
              <div className={common.emptyState} role="status">No latency monitoring data available yet.</div>
            </div>

            {/* Error Rate Chart */}
            <div className={cn(common.panel, themed.panel)} aria-label="Error rate chart">
              <div className={common.panelHeader}>
                <div className={cn(common.cardTitle, themed.cardTitle)}>Error Rate (%)</div>
              </div>
              <div className={common.emptyState} role="status">No error rate monitoring data available yet.</div>
            </div>
          </ScrollReveal>

          {/* ── Throughput Chart ── */}
          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Throughput chart">
            <div className={common.panelHeader}>
              <div className={cn(common.cardTitle, themed.cardTitle)}>Throughput (requests/min)</div>
            </div>
            <div className={common.emptyState} role="status">No throughput monitoring data available yet.</div>
          </ScrollReveal>

          {/* ── Model Performance Table ── */}
          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Model performance breakdown">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Model Performance</div>
            <div className={common.tableWrap}>
              <table className={common.table} role="table">
                <thead>
                  <tr>
                    <th className={cn(common.th, themed.th)}>Model</th>
                    <th className={cn(common.th, themed.th)}>API Calls</th>
                    <th className={cn(common.th, themed.th)}>Avg Latency</th>
                    <th className={cn(common.th, themed.th)}>Error Rate</th>
                    <th className={cn(common.th, themed.th)}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {modelStats.length === 0 ? (
                    <tr><td colSpan={5} className={common.td}><div className={common.emptyState}>No model performance data available.</div></td></tr>
                  ) : (
                    modelStats.map(m => (
                      <tr key={m.name} className={cn(common.tr, themed.tr)}>
                        <td className={common.td}>{m.name}</td>
                        <td className={common.td}>{m.calls.toLocaleString()}</td>
                        <td className={common.td}>—</td>
                        <td className={common.td}>—</td>
                        <td className={common.td}>—</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* ── Logs ── */}
          <ScrollReveal className={cn(common.panel, themed.panel)} aria-label="Recent logs">
            <div className={cn(common.cardTitle, themed.cardTitle)}>Recent Logs</div>
            {loading && <div className={common.skeletonRow} aria-busy="true" />}
            {error && <div className={common.error}>Failed to load logs.</div>}
            <div className={cn(common.list)} role="list">
              {filtered.map(l => (
                <div key={l.id} role="listitem" className={cn(common.item, themed.item)}>
                  <div className={common.logHeader}>
                    <span className={levelBadgeClass(l.level)}>{l.level.toUpperCase()}</span>
                    <span className={common.logModel}>{l.model}</span>
                    <span className={common.logTs}>{new Date(l.ts).toLocaleString()}</span>
                  </div>
                  <div className={common.meta}>{l.message}{l.latencyMs > 0 && ` • ${l.latencyMs}ms`}</div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading && (
              <div role="status" aria-live="polite" className={common.emptyState}>No logs match your filters.</div>
            )}
          </ScrollReveal>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default AIMonitoring;
