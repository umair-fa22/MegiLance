// @AI-HINT: Audit Logs page. Theme-aware, accessible, animated table with filters. Fetches from admin activity API.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { Loader2 } from 'lucide-react';
import common from './AuditLogs.common.module.css';
import light from './AuditLogs.light.module.css';
import dark from './AuditLogs.dark.module.css';

interface LogItem {
  id: string;
  time: string;
  actor: string;
  action: 'Login' | 'Logout' | 'Role Change' | 'Password Reset' | 'Project Update' | 'Invoice Paid' | 'Other';
  resource: string;
  ip: string;
  meta?: Record<string, string>;
}

const ACTIONS = ['All', 'Login', 'Logout', 'Role Change', 'Password Reset', 'Project Update', 'Invoice Paid', 'Other'] as const;
const RANGES = ['Any time', 'Past week', 'Past month', 'Past year'] as const;

const AuditLogs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [allLogs, setAllLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<(typeof ACTIONS)[number]>('All');
  const [range, setRange] = useState<(typeof RANGES)[number]>('Past month');
  const [actor, setActor] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch audit logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.admin.getRecentActivity(50);

        // Transform API data to LogItem format
        const logs: LogItem[] = (Array.isArray(data) ? data : []).map((activity: any, idx: number) => {
          const activityType = (activity.type || '').toLowerCase();
          let actionType: LogItem['action'] = 'Other';
          
          if (activityType.includes('login')) actionType = 'Login';
          else if (activityType.includes('logout')) actionType = 'Logout';
          else if (activityType.includes('role')) actionType = 'Role Change';
          else if (activityType.includes('password')) actionType = 'Password Reset';
          else if (activityType.includes('project') || activityType.includes('job')) actionType = 'Project Update';
          else if (activityType.includes('payment') || activityType.includes('invoice')) actionType = 'Invoice Paid';
          
          return {
            id: `log-${idx}`,
            time: activity.timestamp || new Date().toISOString(),
            actor: activity.user_name || activity.user_email || 'System',
            action: actionType,
            resource: activity.description || activity.type || 'Platform',
            ip: activity.ip_address || '0.0.0.0',
            meta: activity.amount ? { amount: `$${activity.amount}` } : undefined,
          };
        });

        setAllLogs(logs);
        setError(null);
      } catch (err) {
        setError('Failed to load audit logs');
        setAllLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const logs = useMemo(() => {
    const byAction = action === 'All' ? allLogs : allLogs.filter(l => l.action === action);
    const byActor = actor.trim() ? byAction.filter(l => l.actor.toLowerCase().includes(actor.trim().toLowerCase())) : byAction;
    const dayMs = 24 * 60 * 60 * 1000;
    const within = (d: string) => {
      if (range === 'Any time') return true;
      const now = new Date();
      const dt = new Date(d);
      const diff = now.getTime() - dt.getTime();
      if (range === 'Past week') return diff <= 7 * dayMs;
      if (range === 'Past month') return diff <= 31 * dayMs;
      if (range === 'Past year') return diff <= 365 * dayMs;
      return true;
    };
    return byActor.filter(l => within(l.time));
  }, [action, actor, range, allLogs]);

  const selected = logs.find(l => l.id === selectedId) || null;


  if (loading) {
    return (
      <PageTransition className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.loadingState}>
            <Loader2 className={common.spinner} size={32} />
            <span>Loading audit logs...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        {error && (
          <div className={cn(common.errorBanner, themed.errorBanner)}>
            {error}
          </div>
        )}
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>Audit Logs</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Track important security and activity events across your account.</p>
          </div>
          <div className={common.controls} aria-label="Audit log filters">
            <label className={common.srOnly} htmlFor="actor">Actor</label>
            <input id="actor" className={cn(common.input, themed.input)} type="search" placeholder="Search actor…" value={actor} onChange={(e) => setActor(e.target.value)} />

            <label className={common.srOnly} htmlFor="action">Action</label>
            <select id="action" className={cn(common.select, themed.select)} value={action} onChange={(e) => setAction(e.target.value as (typeof ACTIONS)[number])}>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <label className={common.srOnly} htmlFor="range">Date range</label>
            <select id="range" className={cn(common.select, themed.select)} value={range} onChange={(e) => setRange(e.target.value as (typeof RANGES)[number])}>
              {RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </ScrollReveal>

        <StaggerContainer>
          <ScrollReveal className={common.tableWrap}>
            <table className={cn(common.table, themed.table)}>
              <thead>
                <tr>
                  <th scope="col" className={themed.th + ' ' + common.th}>Time</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Actor</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Action</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>Resource</th>
                  <th scope="col" className={themed.th + ' ' + common.th}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr
                    key={l.id}
                    tabIndex={0}
                    className={cn(common.row)}
                    onClick={() => setSelectedId(l.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(l.id); } }}
                    aria-selected={selectedId === l.id}
                  >
                    <td className={themed.td + ' ' + common.td}>{new Date(l.time).toLocaleString()}</td>
                    <td className={themed.td + ' ' + common.td}>{l.actor}</td>
                    <td className={themed.td + ' ' + common.td}>{l.action}</td>
                    <td className={themed.td + ' ' + common.td}>{l.resource}</td>
                    <td className={themed.td + ' ' + common.td}>{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollReveal>

          {logs.length === 0 && (
            <div role="status" aria-live="polite" className={cn(common.details, themed.details)}>
              No matching audit logs.
            </div>
          )}

          {selected && (
            <ScrollReveal className={cn(common.details, themed.details)} aria-label={`Details for event ${selected.id}`}>
              <div className={cn(common.detailsTitle)}>Event Details</div>
              <div className={common.kv}><div>Event ID</div><div>{selected.id}</div></div>
              <div className={common.kv}><div>Time</div><div>{new Date(selected.time).toLocaleString()}</div></div>
              <div className={common.kv}><div>Actor</div><div>{selected.actor}</div></div>
              <div className={common.kv}><div>Action</div><div>{selected.action}</div></div>
              <div className={common.kv}><div>Resource</div><div>{selected.resource}</div></div>
              <div className={common.kv}><div>IP Address</div><div>{selected.ip}</div></div>
              {selected.meta && Object.entries(selected.meta).map(([k,v]) => (
                <div key={k} className={common.kv}><div>{k}</div><div>{v}</div></div>
              ))}
              <button type="button" className={cn(common.button, themed.button, 'secondary')} onClick={() => setSelectedId(null)}>Close</button>
            </ScrollReveal>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default AuditLogs;
