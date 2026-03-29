// @AI-HINT: Freelancer Proposals component - card-based grid with advanced filtering, sorting, pagination and API integration for managing job proposals.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { usePersistedState } from '@/app/lib/hooks/usePersistedState';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';

import { apiFetch } from '@/lib/api/core';
import DataToolbar, { SortOption } from '@/app/components/organisms/DataToolbar/DataToolbar';
import PaginationBar from '@/app/components/molecules/PaginationBar/PaginationBar';
import Modal from '@/app/components/organisms/Modal/Modal';
import Button from '@/app/components/atoms/Button/Button';
import TableSkeleton from '@/app/components/organisms/DataTableExtras/TableSkeleton';
import ProposalCard, { Proposal } from './components/ProposalCard/ProposalCard';
import StatusFilter from './components/StatusFilter/StatusFilter';

import commonStyles from './Proposals.common.module.css';
import lightStyles from './Proposals.light.module.css';
import darkStyles from './Proposals.dark.module.css';

// API response type
interface APIProposal {
  id: number;
  project_id: number;
  freelancer_id: number;
  cover_letter: string;
  bid_amount: number;
  estimated_hours: number;
  hourly_rate: number;
  availability: string;
  attachments: string;
  status: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

interface APIProject {
  id: number;
  title: string;
  client_id: number;
  client_name?: string;
  budget_max?: number;
  client_verified?: boolean;
}

const sortOptions: SortOption[] = [
  { value: 'dateSubmitted:desc', label: 'Newest' },
  { value: 'dateSubmitted:asc', label: 'Oldest' },
  { value: 'bidAmount:desc', label: 'Bid: High to Low' },
  { value: 'bidAmount:asc', label: 'Bid: Low to High' },
  { value: 'jobTitle:asc', label: 'Job Title A-Z' },
  { value: 'jobTitle:desc', label: 'Job Title Z-A' },
];

const allStatuses: Proposal['status'][] = ['Draft', 'Submitted', 'Interview', 'Rejected'];

// Map API status to UI status
const mapAPIStatus = (status: string, isDraft: boolean): Proposal['status'] => {
  if (isDraft) return 'Draft';
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === 'pending' || normalizedStatus === 'submitted') return 'Submitted';
  if (normalizedStatus === 'interview' || normalizedStatus === 'shortlisted') return 'Interview';
  if (normalizedStatus === 'rejected' || normalizedStatus === 'declined') return 'Rejected';
  return 'Submitted';
};

const Proposals: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  const [q, setQ] = usePersistedState<string>('freelancer:proposals:q', '');
  const [sortKey, setSortKey] = usePersistedState<keyof Proposal>('freelancer:proposals:sortKey', 'dateSubmitted');
  const [sortDir, setSortDir] = usePersistedState<'asc' | 'desc'>('freelancer:proposals:sortDir', 'desc');
  const [page, setPage] = usePersistedState<number>('freelancer:proposals:page', 1);
  const [pageSize, setPageSize] = usePersistedState<number>('freelancer:proposals:pageSize', 6);
  const [statusFilters, setStatusFilters] = usePersistedState<Proposal['status'][]>('freelancer:proposals:statusFilters', []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pendingWithdrawId, setPendingWithdrawId] = useState<string | null>(null);

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch proposals for current freelancer
      const apiProposals = await apiFetch<APIProposal[]>('/proposals/');
      
      // Get unique project IDs to fetch project details
      const projectIds = Array.from(new Set(apiProposals.map(p => p.project_id)));
      
      // Fetch project details for job titles and client names
      const projectPromises = projectIds.map(async (pid) => {
        try {
          return await apiFetch<APIProject>(`/projects/${pid}`);
        } catch {
          // Ignore individual project fetch errors
        }
        return null;
      });
      
      const projectsData = await Promise.all(projectPromises);
      const projectMap = new Map<number, APIProject>();
      projectsData.filter((p): p is APIProject => p !== null).forEach((project) => {
        projectMap.set(project.id, project);
      });
      
      // Transform API data to UI format
      const transformedProposals: Proposal[] = apiProposals.map((ap) => {
        const project = projectMap.get(ap.project_id);
        // Calculate match score based on bid vs budget alignment
        const budgetMatch = project?.budget_max ? 
          Math.min(100, Math.round((1 - Math.abs(ap.bid_amount - project.budget_max) / project.budget_max) * 100)) : 
          75;
        return {
          id: String(ap.id),
          jobTitle: project?.title || `Project #${ap.project_id}`,
          clientName: project?.client_name || 'Client',
          status: mapAPIStatus(ap.status, ap.is_draft),
          dateSubmitted: ap.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          bidAmount: ap.bid_amount,
          matchScore: Math.max(60, Math.min(95, budgetMatch)),
          isClientVerified: project?.client_verified ?? true,
        };
      });
      
      setProposals(transformedProposals);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch proposals:', err);
      }
      setError(err instanceof Error ? err.message : 'Unable to load your proposals. Please check your connection and try again.');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Filtering and Sorting Logic
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const byQuery = (p: Proposal) => !qLower || p.jobTitle.toLowerCase().includes(qLower) || p.clientName.toLowerCase().includes(qLower);
    const byStatus = (p: Proposal) => statusFilters.length === 0 || statusFilters.includes(p.status);
    return proposals.filter(byQuery).filter(byStatus);
  }, [q, statusFilters, proposals]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  // Action Handlers
  const handleWithdraw = (id: string) => {
    setPendingWithdrawId(id);
    setWithdrawOpen(true);
  };

  const confirmWithdraw = async () => {
    if (pendingWithdrawId) {
      try {
        await apiFetch(`/proposals/${pendingWithdrawId}`, { method: 'DELETE' });
        toaster.notify({ title: 'Success', description: 'Proposal successfully withdrawn.', variant: 'success' });
        fetchProposals();
      } catch (err) {
        toaster.notify({ title: 'Error', description: 'Could not withdraw this proposal. It may have already been accepted or removed.', variant: 'danger' });
      }
      setWithdrawOpen(false);
      setPendingWithdrawId(null);
    }
  };

  const handleView = (id: string) => {
    router.push(`/freelancer/proposals/${id}`);
  };
  
  const handleEdit = (id: string) => {
    router.push(`/freelancer/proposals/${id}/edit`);
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, styles.container)}>
        <ScrollReveal>
          <header className={cn(commonStyles.header, styles.header)}>
            <h1 className={cn(commonStyles.title, styles.title)}>My Proposals</h1>
            <p className={cn(commonStyles.subtitle, styles.subtitle)}>Track your submitted proposals, monitor their status, and manage pending bids.</p>
          </header>
        </ScrollReveal>

        {error ? (
          <ScrollReveal>
            <div className={cn(commonStyles.emptyState, styles.emptyState)}>
              <h3 className={cn(commonStyles.emptyTitle, styles.emptyTitle)}>Error Loading Proposals</h3>
              <p className={cn(commonStyles.emptyText, styles.emptyText)}>{error}</p>
              <Button variant="primary" onClick={fetchProposals}>Try Again</Button>
            </div>
          </ScrollReveal>
        ) : (
          <>
            <ScrollReveal delay={0.1}>
              <div className={cn(commonStyles.toolbarContainer, styles.toolbarContainer)}>
                <DataToolbar
                  query={q}
                  onQueryChange={(val) => { setQ(val); setPage(1); }}
                  sortValue={`${sortKey}:${sortDir}`}
                  onSortChange={(val) => {
                    const [k, d] = val.split(':') as [keyof Proposal, 'asc' | 'desc'];
                    setSortKey(k); setSortDir(d); setPage(1);
                  }}
                  pageSize={pageSize}
                  onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
                  sortOptions={sortOptions}
                  searchPlaceholder="Search by job or client..."
                />
              </div>

              <div className={cn(commonStyles.filterContainer, styles.filterContainer)}>
                <StatusFilter
                  allStatuses={allStatuses}
                  selectedStatuses={statusFilters}
                  onChange={(selected) => { setStatusFilters(selected); setPage(1); }}
                />
              </div>
            </ScrollReveal>

            {loading ? (
              <div className={cn(commonStyles.grid, styles.grid)}>
                  <TableSkeleton rows={pageSize} cols={1} useCards />
              </div>
            ) : sorted.length > 0 ? (
              <StaggerContainer delay={0.2} className={cn(commonStyles.grid, styles.grid)}>
                {paged.map(proposal => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onView={handleView}
                    onEdit={handleEdit}
                    onWithdraw={handleWithdraw}
                  />
                ))}
              </StaggerContainer>
            ) : (
              <ScrollReveal delay={0.2}>
                <div className={cn(commonStyles.emptyState, styles.emptyState)}>
                  <h3 className={cn(commonStyles.emptyTitle, styles.emptyTitle)}>No Proposals Found</h3>
                  <p className={cn(commonStyles.emptyText, styles.emptyText)}>
                    {proposals.length === 0 
                      ? "You haven't submitted any proposals yet. Browse available jobs to get started!"
                      : "Your search or filter criteria did not match any proposals."}
                  </p>
                  {proposals.length === 0 ? (
                    <Button variant="primary" onClick={() => router.push('/freelancer/find-work')}>Browse Projects</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => { setQ(''); setStatusFilters([]); }}>Clear All Filters</Button>
                  )}
                </div>
              </ScrollReveal>
            )}

            {sorted.length > 0 && (
              <ScrollReveal delay={0.3}>
                <PaginationBar
                  currentPage={pageSafe}
                  totalPages={totalPages}
                  totalResults={sorted.length}
                  onPrev={() => setPage(p => Math.max(1, p - 1))}
                  onNext={() => setPage(p => Math.min(totalPages, p + 1))}
                />
              </ScrollReveal>
            )}
          </>
        )}

        <Modal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Proposal" size="small">
          <p className={cn(commonStyles.modalText, styles.modalText)}>Are you sure you want to withdraw this proposal? This action cannot be undone.</p>
          <div className={cn(commonStyles.modalActions, styles.modalActions)}>
            <Button variant="secondary" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmWithdraw}>Confirm Withdraw</Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Proposals;
