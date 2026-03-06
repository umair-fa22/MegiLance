import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

// @AI-HINT: Hook to fetch dashboard data for metrics, recent projects, and activity feed.
// Fetches activity feed from /activity-feed API and unread messages from /messages/unread/count.
// Supports: auto-refresh polling, manual refresh, AbortController cleanup, role-awareness.

interface DashboardStatsResponse {
  active_projects?: number;
  total_earnings?: number;
  pending_proposals?: number;
  completed_projects?: number;
}

interface DashboardProjectResponse {
  id?: number;
  title?: string;
  client_name?: string;
  client_id?: number;
  status?: string;
  progress?: number;
  deadline?: string;
  updated_at?: string;
  budget_max?: number;
}

interface ActivityFeedItem {
  id: number;
  activity_type?: string;
  type?: string;
  description?: string;
  message?: string;
  amount?: number;
  created_at?: string;
}

export type DashboardMetric = {
  id: number;
  label: string;
  value: string;
  icon: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
};

export type DashboardProject = {
  id: number;
  title: string;
  client: string;
  status: 'In Progress' | 'Review' | 'Completed' | 'Overdue';
  progress: number;
  deadline: string;
  budget?: string;
};

export type DashboardActivity = {
  id: number;
  message: string;
  time: string;
  icon: string;
  amount?: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  recentProjects: DashboardProject[];
  activityFeed: DashboardActivity[];
  unreadMessages: number;
};

function getActivityIcon(type: string): string {
  switch (type) {
    case 'payment': case 'payment_received': return 'FaDollarSign';
    case 'project': case 'project_created': return 'FaBriefcase';
    case 'proposal': case 'proposal_submitted': return 'FaFileAlt';
    case 'contract': case 'contract_created': return 'FaHandshake';
    case 'review': case 'review_received': return 'FaStar';
    case 'milestone': case 'milestone_completed': return 'FaCheckCircle';
    case 'message': return 'FaEnvelope';
    default: return 'FaBell';
  }
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function useDashboardData(options?: { 
  /** Auto-refresh interval in ms (0 = disabled, default: 60000) */
  refreshInterval?: number;
  /** User role for role-specific data fetching */
  userRole?: 'client' | 'freelancer' | 'admin';
}) {
  const { refreshInterval = 60000, userRole = 'freelancer' } = options || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      // Role-aware dashboard stats fetch
      const statsPromise = userRole === 'client'
        ? api.portal.client.getDashboardStats().catch(() => ({}))
        : userRole === 'admin'
          ? api.admin.getDashboardStats().catch(() => ({}))
          : api.portal.freelancer.getDashboardStats().catch(() => ({}));

      const projectsPromise = userRole === 'client'
        ? api.portal.client.getProjects().catch(() => ({ projects: [] }))
        : api.portal.freelancer.getProjects().catch(() => ({ projects: [] }));

      const [statsRes, projectsRes, activityRes, unreadRes] = await Promise.all([
        statsPromise,
        projectsPromise,
        api.activityFeed.list({ page: 1, page_size: 10 }).catch(() => ({ activities: [] })),
        api.messages.getUnreadCount().catch(() => ({ unread_count: 0 })),
      ]);

        const stats = statsRes as DashboardStatsResponse;
        const projects: DashboardProjectResponse[] = ((projectsRes as { projects?: DashboardProjectResponse[] }).projects) || [];

        // Transform stats to metrics format
        const metrics: DashboardMetric[] = [
          { 
            id: 1, 
            label: "Active Projects", 
            value: String(stats.active_projects || projects.filter((p) => p.status === 'in_progress').length || 0), 
            icon: "FaBriefcase" 
          },
          { 
            id: 2, 
            label: "Total Earnings", 
            value: `$${((stats.total_earnings || 0) / 1000).toFixed(1)}K`, 
            icon: "FaChartBar" 
          },
          { 
            id: 3, 
            label: "Pending Proposals", 
            value: String(stats.pending_proposals || 0), 
            icon: "FaTasks" 
          },
          { 
            id: 4, 
            label: "Completed", 
            value: String(stats.completed_projects || projects.filter((p) => p.status === 'completed').length || 0), 
            icon: "FaUsers" 
          }
        ];

        // Transform projects
        const recentProjects: DashboardProject[] = projects.slice(0, 4).map((p, idx) => ({
          id: p.id || idx + 1,
          title: p.title || 'Untitled Project',
          client: p.client_name || `Client #${p.client_id}`,
          status: p.status === 'in_progress' ? 'In Progress' : 
                  p.status === 'completed' ? 'Completed' : 
                  p.status === 'review' ? 'Review' : 'In Progress',
          progress: p.progress || 0,
          deadline: p.deadline || p.updated_at || new Date().toISOString(),
          budget: p.budget_max ? `$${p.budget_max.toLocaleString()}` : undefined
        }));

        // Transform activity feed from API
        const rawActivities: ActivityFeedItem[] = (activityRes as any)?.activities || (activityRes as any)?.items || [];
        const activityFeed: DashboardActivity[] = rawActivities.map((item, idx) => ({
          id: item.id || idx + 1,
          message: item.description || item.message || 'Activity recorded',
          time: formatTimeAgo(item.created_at || ''),
          icon: getActivityIcon(item.activity_type || item.type || ''),
          amount: item.amount ? `$${item.amount.toLocaleString()}` : undefined,
        }));

        const unreadMessages = (unreadRes as Record<string, unknown>)?.unread_count ?? (unreadRes as Record<string, unknown>)?.count ?? 0;

        if (isMounted.current) {
          setData({ metrics, recentProjects, activityFeed, unreadMessages: unreadMessages as number });
          setLastFetched(new Date());
        }
      } catch (err: unknown) {
        console.error('[useDashboardData] API error:', err);
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
          // Keep stale data on refresh errors instead of clearing
          if (!isRefresh) {
            setData({ metrics: [], recentProjects: [], activityFeed: [], unreadMessages: 0 });
          }
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }, [userRole]);

  // Manual refresh exposed to consumers
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Auto-refresh polling
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        // Only poll if page is visible
        if (document.visibilityState === 'visible') {
          fetchData(true);
        }
      }, refreshInterval);
    }

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refresh, lastFetched } as const;
} 