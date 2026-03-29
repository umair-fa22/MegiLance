// @AI-HINT: This component displays a fully theme-aware, interactive audit log. It fetches platform activity from /admin/dashboard/recent-activity API.
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Card from '@/app/components/molecules/Card/Card';
import Badge from '@/app/components/atoms/Badge/Badge';
import Select from '@/app/components/molecules/Select/Select';
import Input from '@/app/components/atoms/Input/Input';
import Button from '@/app/components/atoms/Button/Button';
import { ChevronsUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'

import commonStyles from './AuditLog.common.module.css';
import lightStyles from './AuditLog.light.module.css';
import darkStyles from './AuditLog.dark.module.css';

interface LogEntry {
  id: string;
  timestamp: string;
  actor: { name: string; role: 'Admin' | 'Moderator' | 'System' | 'Support' | 'User' };
  action: 'Update' | 'Create' | 'Delete' | 'Suspend' | 'Resolve' | 'Approve' | 'Join' | 'Post' | 'Submit' | 'Payment';
  target: { type: 'User' | 'Job' | 'Setting' | 'Flag' | 'Payment' | 'Proposal'; id: string };
  details: string;
  amount?: number | null;
}

interface ApiActivity {
  type: string;
  description: string;
  timestamp: string;
  user_name: string;
  amount: number | null;
}

const ITEMS_PER_PAGE = 10;

function mapActivityTypeToAction(type: string): LogEntry['action'] {
  switch (type) {
    case 'user_joined': return 'Join';
    case 'project_posted': return 'Post';
    case 'proposal_submitted': return 'Submit';
    case 'payment_made': return 'Payment';
    default: return 'Create';
  }
}

function mapActivityTypeToTarget(type: string, description: string): LogEntry['target'] {
  switch (type) {
    case 'user_joined': return { type: 'User', id: description };
    case 'project_posted': return { type: 'Job', id: description.replace('Posted: ', '') };
    case 'proposal_submitted': return { type: 'Proposal', id: description };
    case 'payment_made': return { type: 'Payment', id: description };
    default: return { type: 'Setting', id: description };
  }
}

const AuditLog: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', role: '', action: '' });
  const [sort, setSort] = useState<{ key: keyof LogEntry; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    async function fetchActivityLogs() {
      try {
        setLoading(true);
        
        const activities: ApiActivity[] = await api.admin.getRecentActivity(100) as any;

        // Transform API data to LogEntry format
        const transformed: LogEntry[] = activities.map((activity, index) => ({
          id: `log_${index}_${Date.now()}`,
          timestamp: activity.timestamp,
          actor: {
            name: activity.user_name || 'System',
            role: activity.type.includes('user') ? 'User' : 'System' as LogEntry['actor']['role'],
          },
          action: mapActivityTypeToAction(activity.type),
          target: mapActivityTypeToTarget(activity.type, activity.description),
          details: activity.description,
          amount: activity.amount,
        }));

        setLogs(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    }

    fetchActivityLogs();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleSort = (key: keyof LogEntry) => {
    setSort(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => 
        (log.actor.name.toLowerCase().includes(filters.search.toLowerCase()) || 
         log.target.id.toLowerCase().includes(filters.search.toLowerCase()) ||
         log.details.toLowerCase().includes(filters.search.toLowerCase())) &&
        (filters.role ? log.actor.role === filters.role : true) &&
        (filters.action ? log.action === filters.action : true)
      )
      .sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [logs, filters, sort]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'Create':
      case 'Approve':
      case 'Join':
        return 'success';
      case 'Update':
      case 'Post':
      case 'Submit':
        return 'info';
      case 'Delete':
      case 'Suspend':
        return 'danger';
      case 'Payment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const SortableHeader: React.FC<{ tkey: keyof LogEntry; label: string }> = ({ tkey, label }) => (
    <th onClick={() => handleSort(tkey)}>
      <div className={commonStyles.headerCell}>
        {label}
        {sort.key === tkey ? (
          sort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        ) : (
          <ChevronsUpDown size={14} />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <Card className={cn(commonStyles.auditLogCard, themeStyles.auditLogCard)}>
        <header className={commonStyles.cardHeader}>
          <h2 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>System Audit Log</h2>
        </header>
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <Loader2 className={commonStyles.spinner} size={32} />
          <span>Loading activity logs...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(commonStyles.auditLogCard, themeStyles.auditLogCard)}>
        <header className={commonStyles.cardHeader}>
          <h2 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>System Audit Log</h2>
        </header>
        <div className={cn(commonStyles.errorState, themeStyles.errorState)}>
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(commonStyles.auditLogCard, themeStyles.auditLogCard)}>
      <header className={commonStyles.cardHeader}>
        <h2 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>System Audit Log</h2>
        <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
          A log of recent platform activity ({filteredLogs.length} entries).
        </p>
      </header>

      <div className={commonStyles.filterToolbar}>
        <Input
          name="search"
          placeholder="Search logs..."
          value={filters.search}
          onChange={handleFilterChange}
          className={commonStyles.searchInput}
        />
        <Select
          id="role-filter"
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'User', label: 'User' },
            { value: 'System', label: 'System' },
          ]}
        />
        <Select
          id="action-filter"
          name="action"
          value={filters.action}
          onChange={handleFilterChange}
          options={[
            { value: '', label: 'All Actions' },
            { value: 'Join', label: 'Join' },
            { value: 'Post', label: 'Post' },
            { value: 'Submit', label: 'Submit' },
            { value: 'Payment', label: 'Payment' },
          ]}
        />
      </div>

      <div className={commonStyles.tableWrapper}>
        <table className={cn(commonStyles.auditLogTable, themeStyles.auditLogTable)}>
          <thead>
            <tr>
              <SortableHeader tkey="timestamp" label="Timestamp" />
              <SortableHeader tkey="actor" label="Actor" />
              <SortableHeader tkey="action" label="Action" />
              <th>Target</th>
              <th>Details</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className={commonStyles.emptyRow}>No activity logs found</td>
              </tr>
            ) : paginatedLogs.map(log => (
              <tr key={log.id}>
                <td className={commonStyles.timestampCell}>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.actor.name} <Badge variant="secondary">{log.actor.role}</Badge></td>
                <td><Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge></td>
                <td>{log.target.type}: {log.target.id}</td>
                <td className={commonStyles.detailsCell}>{log.details}</td>
                <td>{log.amount != null ? `$${log.amount.toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className={commonStyles.paginationFooter}>
        <span className={cn(commonStyles.paginationInfo, themeStyles.paginationInfo)}>
          Page {currentPage} of {totalPages}
        </span>
        <div className={commonStyles.paginationControls}>
          <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </footer>
    </Card>
  );
};

export default AuditLog;
