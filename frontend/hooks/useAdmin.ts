import { useEffect, useState } from 'react';
import api from '@/lib/api';

// @AI-HINT: Hook to fetch admin portal datasets (users, projects, payments, support tickets, AI monitoring, dashboard KPIs, stats, recent activity).

interface AdminUserResponse {
  id: number | string;
  name?: string;
  email?: string;
  user_type?: string;
  is_active?: boolean;
  joined_at?: string;
}

interface AdminProjectResponse {
  id: number | string;
  title?: string;
  client_id?: number;
  status?: string;
  budget_min?: number;
  budget_max?: number;
  updated_at?: string;
}

interface AdminPaymentResponse {
  id: number | string;
  created_at?: string;
  description?: string;
  payment_type?: string;
  amount?: number;
  status?: string;
}

interface AdminTicketResponse {
  id: number | string;
  subject?: string;
  status?: string;
  created_at?: string;
  priority?: string;
}

export type AdminUser = { id: string; name: string; email: string; role: 'Admin' | 'Client' | 'Freelancer'; status: 'Active' | 'Suspended'; joined: string };
export type AdminProject = { id: string; title: string; client: string; status: string; budget?: string; updatedAt?: string };
export type AdminPayment = { id: string; date: string; description: string; amount: string; status: string };
export type AdminSupportTicket = { id: string; subject: string; status: string; createdAt: string; priority?: string };
export type AdminAIMetric = { 
  aiStats: { 
    rankModelAccuracy: string; 
    fraudDetections: number; 
    priceEstimations: number; 
    chatbotSessions: number; 
  }; 
  recentFraudAlerts: Array<{ 
    id: string; 
    referenceId: string; 
    reason: string; 
    timestamp: string; 
  }>; 
};
export type AdminKPI = { id: string; label: string; value: string; trend?: string };

// System stats from /admin/dashboard/stats endpoint
export type SystemStats = {
  total_users: number;
  total_clients: number;
  total_freelancers: number;
  total_projects: number;
  total_contracts: number;
  total_revenue: number;
  active_projects: number;
  pending_proposals: number;
};

// Recent activity from /admin/dashboard/recent-activity endpoint
export type RecentActivity = {
  type: string;
  description: string;
  timestamp: string;
  user_name: string;
  amount?: number | null;
};

export function useAdminData() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[] | null>(null);
  const [ai, setAI] = useState<AdminAIMetric | null>(null);
  const [kpis, setKPIs] = useState<AdminKPI[] | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Use the API client methods
        const fetchWithFallback = async <T>(promise: Promise<unknown>, fallback: T): Promise<T> => {
          try {
            return await promise as T;
          } catch {
            return fallback;
          }
        };
        
        const [usersJson, projJson, payJson, supJson, aiJson, dashJson, activityJson] = await Promise.all([
          fetchWithFallback(api.admin.getUsers(), { users: [] }),
          fetchWithFallback(api.admin.getProjects(), { projects: [] }),
          fetchWithFallback(api.admin.getPayments(), { payments: [] }),
          fetchWithFallback(api.supportTickets.list(), { tickets: [] }),
          fetchWithFallback(api.admin.getAnalytics(), {}), // Using analytics as proxy for AI usage for now
          fetchWithFallback<SystemStats | null>(api.admin.getDashboardStats(), null),
          fetchWithFallback<RecentActivity[]>(api.admin.getRecentActivity(), []),
        ]);
        
        if (!mounted) return;
        
        // Map users
        const mappedUsers: AdminUser[] = (usersJson.users || []).map((u: AdminUserResponse) => ({
          id: String(u.id),
          name: u.name || 'Unknown',
          email: u.email || '',
          role: (u.user_type || 'Client') as AdminUser['role'],
          status: u.is_active ? 'Active' as const : 'Suspended' as const,
          joined: u.joined_at || new Date().toISOString()
        }));
        setUsers(mappedUsers);

        // Map projects
        const mappedProjects: AdminProject[] = (projJson.projects || []).map((p: AdminProjectResponse) => ({
          id: String(p.id),
          title: p.title || 'Untitled',
          client: `Client #${p.client_id}`, // We might need to fetch client name separately or join in backend
          status: p.status || 'Unknown',
          budget: `$${p.budget_min} - $${p.budget_max}`,
          updatedAt: p.updated_at
        }));
        setProjects(mappedProjects);

        // Map payments
        const mappedPayments: AdminPayment[] = (payJson.payments || []).map((p: AdminPaymentResponse) => ({
          id: String(p.id),
          date: p.created_at || new Date().toISOString(),
          description: (p.description || p.payment_type) ?? '',
          amount: `$${p.amount}`,
          status: p.status || 'pending'
        }));
        setPayments(mappedPayments);

        // Map tickets
        const mappedTickets: AdminSupportTicket[] = (supJson.tickets || []).map((t: AdminTicketResponse) => ({
          id: String(t.id),
          subject: t.subject || 'No subject',
          status: t.status || 'open',
          createdAt: t.created_at || new Date().toISOString(),
          priority: t.priority || 'normal'
        }));
        setTickets(mappedTickets);

        setAI(aiJson && Object.keys(aiJson).length > 0 ? aiJson as AdminAIMetric : null); // Placeholder
        setSystemStats(dashJson);
        setRecentActivity(activityJson);
        
        // Transform systemStats into KPIs for backward compatibility
        if (dashJson) {
          const kpiList: AdminKPI[] = [
            { id: 'users', label: 'Total Users', value: dashJson.total_users?.toLocaleString() ?? '0' },
            { id: 'projects', label: 'Active Projects', value: dashJson.active_projects?.toLocaleString() ?? '0' },
            { id: 'revenue', label: 'Revenue', value: `$${((dashJson.total_revenue ?? 0) / 1000).toFixed(0)}k` },
            { id: 'proposals', label: 'Pending Proposals', value: dashJson.pending_proposals?.toLocaleString() ?? '0' },
          ];
          setKPIs(kpiList);
        } else {
          setKPIs([]);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load admin data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  return { users, projects, payments, tickets, ai, kpis, systemStats, recentActivity, loading, error, refetch } as const;
} 