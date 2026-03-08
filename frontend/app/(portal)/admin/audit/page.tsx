// @AI-HINT: Admin audit trail page for activity logging and compliance
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { auditTrailApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import commonStyles from './Audit.common.module.css';
import lightStyles from './Audit.light.module.css';
import darkStyles from './Audit.dark.module.css';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

interface AuditStats {
  total_logs: number;
  logs_today: number;
  critical_events: number;
  unique_users: number;
}

const SEVERITY_CONFIG = {
  info: { label: 'Info', color: '#4573df', icon: 'ℹ️' },
  warning: { label: 'Warning', color: '#f59e0b', icon: '⚠️' },
  critical: { label: 'Critical', color: '#e81123', icon: '🚨' }
};

const ACTION_ICONS: Record<string, string> = {
  'login': '🔐',
  'logout': '🚪',
  'create': '➕',
  'update': '✏️',
  'delete': '🗑️',
  'view': '👁️',
  'export': '📤',
  'import': '📥',
  'payment': '💳',
  'approve': '✅',
  'reject': '❌',
  'suspend': '🚫',
  'restore': '♻️'
};

export default function AuditTrailPage() {
  const { resolvedTheme } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    action: '',
    resource_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, [filters, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        auditTrailApi.getEvents({ ...filters, skip: (page - 1) * 50, limit: 50 } as any),
        auditTrailApi.getSummary()
      ]);
      setLogs((logsRes as any)?.data || []);
      setTotalPages((logsRes as any)?.total_pages || 1);
      setStats(statsRes as any);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await auditTrailApi.exportLogs(filters) as any;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export logs:', err);
      showToast('Failed to export audit logs', 'error');
    }
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      action: '',
      resource_type: '',
      user_id: '',
      date_from: '',
      date_to: '',
      search: ''
    });
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getActionIcon = (action: string) => {
    const key = Object.keys(ACTION_ICONS).find(k => action.toLowerCase().includes(k));
    return key ? ACTION_ICONS[key] : '📋';
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Audit Trail</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Monitor all system activities and user actions
              </p>
            </div>
            <Button variant="primary" onClick={handleExport}>
              📤 Export Logs
            </Button>
          </header>
        </ScrollReveal>

        {/* Stats */}
        {stats && (
          <ScrollReveal delay={0.1}>
            <div className={commonStyles.statsRow}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <span className={commonStyles.statIcon}>📊</span>
                <div className={commonStyles.statInfo}>
                  <strong>{stats.total_logs.toLocaleString()}</strong>
                  <span>Total Logs</span>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <span className={commonStyles.statIcon}>📅</span>
                <div className={commonStyles.statInfo}>
                  <strong>{stats.logs_today}</strong>
                  <span>Today</span>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <span className={commonStyles.statIcon}>🚨</span>
                <div className={commonStyles.statInfo}>
                  <strong>{stats.critical_events}</strong>
                  <span>Critical</span>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <span className={commonStyles.statIcon}>👥</span>
                <div className={commonStyles.statInfo}>
                  <strong>{stats.unique_users}</strong>
                  <span>Active Users</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Filters */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.filtersCard, themeStyles.filtersCard)}>
            <div className={commonStyles.filtersRow}>
              <div className={commonStyles.filterGroup}>
                <label>Severity</label>
                <Select
                  aria-label="Severity"
                  value={filters.severity}
                  onChange={e => { setFilters({ ...filters, severity: e.target.value }); setPage(1); }}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'info', label: 'Info' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label>Resource Type</label>
                <Select
                  aria-label="Resource type"
                  value={filters.resource_type}
                  onChange={e => { setFilters({ ...filters, resource_type: e.target.value }); setPage(1); }}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'user', label: 'User' },
                    { value: 'project', label: 'Project' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'payment', label: 'Payment' },
                    { value: 'proposal', label: 'Proposal' },
                    { value: 'message', label: 'Message' },
                  ]}
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label htmlFor="audit-date-from">Date From</label>
                <Input
                  id="audit-date-from"
                  type="date"
                  value={filters.date_from}
                  onChange={e => { setFilters({ ...filters, date_from: e.target.value }); setPage(1); }}
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label htmlFor="audit-date-to">Date To</label>
                <Input
                  id="audit-date-to"
                  type="date"
                  value={filters.date_to}
                  onChange={e => { setFilters({ ...filters, date_to: e.target.value }); setPage(1); }}
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label htmlFor="audit-search">Search</label>
                <Input
                  id="audit-search"
                  value={filters.search}
                  onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                  placeholder="Search actions, users..."
                />
              </div>
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Logs Table */}
        <ScrollReveal delay={0.3}>
          <div className={cn(commonStyles.logsCard, themeStyles.logsCard)}>
            {loading ? (
              <div className={commonStyles.loading}>Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className={commonStyles.emptyState}>
                <span>📭</span>
                <p>No audit logs found matching your filters.</p>
              </div>
            ) : (
              <>
                <table className={commonStyles.logsTable}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Severity</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>IP Address</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const severity = SEVERITY_CONFIG[log.severity];
                      return (
                        <tr key={log.id} className={cn(themeStyles.logRow)}>
                          <td className={commonStyles.timeCell}>
                            {formatDate(log.created_at)}
                          </td>
                          <td>
                            <span
                              className={commonStyles.severityBadge}
                              style={{ backgroundColor: severity.color }}
                            >
                              {severity.icon} {severity.label}
                            </span>
                          </td>
                          <td>
                            <div className={commonStyles.userCell}>
                              <strong>{log.user_email}</strong>
                              <span className={commonStyles.userRole}>{log.user_role}</span>
                            </div>
                          </td>
                          <td>
                            <span className={commonStyles.actionCell}>
                              {getActionIcon(log.action)} {log.action}
                            </span>
                          </td>
                          <td>
                            <span className={cn(commonStyles.resourceBadge, themeStyles.resourceBadge)}>
                              {log.resource_type}
                            </span>
                            {log.resource_id && (
                              <span className={commonStyles.resourceId}>#{log.resource_id.slice(-8)}</span>
                            )}
                          </td>
                          <td className={commonStyles.ipCell}>{log.ip_address}</td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className={commonStyles.pagination}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Previous
                  </Button>
                  <span className={commonStyles.pageInfo}>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollReveal>

        {/* Detail Modal */}
        {selectedLog && (
          <div className={commonStyles.modalOverlay} onClick={() => setSelectedLog(null)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <h2>Audit Log Details</h2>
              
              <div className={commonStyles.detailSection}>
                <h3>Basic Info</h3>
                <div className={commonStyles.detailGrid}>
                  <div>
                    <label>Log ID</label>
                    <span>{selectedLog.id}</span>
                  </div>
                  <div>
                    <label>Timestamp</label>
                    <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <label>Severity</label>
                    <span
                      className={commonStyles.severityBadge}
                      style={{ backgroundColor: SEVERITY_CONFIG[selectedLog.severity].color }}
                    >
                      {SEVERITY_CONFIG[selectedLog.severity].icon} {SEVERITY_CONFIG[selectedLog.severity].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className={commonStyles.detailSection}>
                <h3>User Info</h3>
                <div className={commonStyles.detailGrid}>
                  <div>
                    <label>User ID</label>
                    <span>{selectedLog.user_id}</span>
                  </div>
                  <div>
                    <label>Email</label>
                    <span>{selectedLog.user_email}</span>
                  </div>
                  <div>
                    <label>Role</label>
                    <span>{selectedLog.user_role}</span>
                  </div>
                </div>
              </div>

              <div className={commonStyles.detailSection}>
                <h3>Action Details</h3>
                <div className={commonStyles.detailGrid}>
                  <div>
                    <label>Action</label>
                    <span>{selectedLog.action}</span>
                  </div>
                  <div>
                    <label>Resource Type</label>
                    <span>{selectedLog.resource_type}</span>
                  </div>
                  <div>
                    <label>Resource ID</label>
                    <span>{selectedLog.resource_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className={commonStyles.detailSection}>
                <h3>Request Info</h3>
                <div className={commonStyles.detailGrid}>
                  <div>
                    <label>IP Address</label>
                    <span>{selectedLog.ip_address}</span>
                  </div>
                  <div className={commonStyles.fullWidth}>
                    <label>User Agent</label>
                    <span className={commonStyles.userAgent}>{selectedLog.user_agent}</span>
                  </div>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className={commonStyles.detailSection}>
                  <h3>Additional Details</h3>
                  <pre className={cn(commonStyles.jsonBlock, themeStyles.jsonBlock)}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className={commonStyles.modalActions}>
                <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
}
