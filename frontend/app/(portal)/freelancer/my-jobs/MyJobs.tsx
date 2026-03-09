// @AI-HINT: Enhanced 'My Jobs' page with KPI stats, milestone tracking, status filters, job detail drawer, and quick actions.
'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useFreelancerData } from '@/hooks/useFreelancer';
import PaginatedJobGrid from './components/PaginatedJobGrid/PaginatedJobGrid';
import { JobStatusCardProps } from './components/JobStatusCard/JobStatusCard';
import { SortOption } from '@/app/components/DataToolbar/DataToolbar';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import {
  Briefcase, CheckCircle, Clock, DollarSign, TrendingUp, AlertCircle,
  MessageCircle, FileText, Calendar, Filter, BarChart3,
  ChevronDown, X, ExternalLink, Star, Timer,
} from 'lucide-react';

import commonStyles from './MyJobs.common.module.css';
import lightStyles from './MyJobs.light.module.css';
import darkStyles from './MyJobs.dark.module.css';

interface APIContract {
  id: string;
  project_id: number;
  freelancer_id: number;
  client_id: number;
  total_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  milestones: string;
  terms: string;
  created_at: string;
  updated_at: string;
  job_title?: string;
  client_name?: string;
  title?: string;
}

interface JobDetail {
  id: string;
  title: string;
  client: string;
  status: string;
  progress: number;
  amount: number;
  startDate: string;
  endDate: string;
  description: string;
  milestones: Milestone[];
}

interface Milestone {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  amount: number;
  dueDate: string;
}

type StatusFilterType = 'all' | 'active' | 'review' | 'completed' | 'cancelled';
type TabType = 'active' | 'completed';

const activeSortOptions: SortOption[] = [
  { value: 'progress:desc', label: 'Progress: High to Low' },
  { value: 'progress:asc', label: 'Progress: Low to High' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'client:asc', label: 'Client A–Z' },
  { value: 'client:desc', label: 'Client Z–A' },
];

const completedSortOptions: SortOption[] = [
  { value: 'completionDate:desc', label: 'Newest' },
  { value: 'completionDate:asc', label: 'Oldest' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
  { value: 'client:asc', label: 'Client A–Z' },
  { value: 'client:desc', label: 'Client Z–A' },
];

const getStatusAndProgress = (status: string): { displayStatus: string; progress: number } => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'negotiation':
      return { displayStatus: 'Negotiation', progress: 10 };
    case 'active':
    case 'in_progress':
      return { displayStatus: 'Development', progress: 50 };
    case 'review':
    case 'client_review':
      return { displayStatus: 'Client Review', progress: 85 };
    case 'completed':
    case 'finished':
      return { displayStatus: 'Completed', progress: 100 };
    case 'cancelled':
    case 'terminated':
      return { displayStatus: 'Cancelled', progress: 0 };
    default:
      return { displayStatus: 'In Progress', progress: 50 };
  }
};

const MyJobs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const { analytics } = useFreelancerData();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<JobStatusCardProps[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobStatusCardProps[]>([]);
  const [allContracts, setAllContracts] = useState<APIContract[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalActive = activeJobs.length;
    const totalCompleted = completedJobs.length;
    const totalEarnings = parseFloat(analytics?.totalEarnings?.replace(/[$,]/g, '') || '0');
    const avgProgress = activeJobs.length > 0
      ? Math.round(activeJobs.reduce((sum, j) => sum + (j.progress || 0), 0) / activeJobs.length)
      : 0;
    const inReview = activeJobs.filter(j => j.status === 'Client Review').length;
    const thisMonthCompleted = completedJobs.filter(j => {
      if (!j.completionDate) return false;
      const d = new Date(j.completionDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return { totalActive, totalCompleted, totalEarnings, avgProgress, inReview, thisMonthCompleted };
  }, [activeJobs, completedJobs, analytics]);

  // Filtered jobs based on status
  const filteredActiveJobs = useMemo(() => {
    if (statusFilter === 'all' || statusFilter === 'completed') return activeJobs;
    if (statusFilter === 'review') return activeJobs.filter(j => j.status === 'Client Review');
    if (statusFilter === 'active') return activeJobs.filter(j => j.status === 'Development' || j.status === 'In Progress');
    return activeJobs;
  }, [activeJobs, statusFilter]);

  const filteredCompletedJobs = useMemo(() => {
    if (statusFilter === 'all' || statusFilter === 'active' || statusFilter === 'review') return completedJobs;
    if (statusFilter === 'completed') return completedJobs;
    return completedJobs;
  }, [completedJobs, statusFilter]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await (api as any).portal?.freelancer?.getProjects?.();
      const contracts = response?.projects || [];
      setAllContracts(contracts);
      
      const active: JobStatusCardProps[] = [];
      const completed: JobStatusCardProps[] = [];
      
      contracts.forEach((contract: any) => {
        const { displayStatus, progress } = getStatusAndProgress(contract.status);
        
        const jobCard: JobStatusCardProps = {
          title: contract.title || `Project #${contract.project_id}`,
          client: contract.client_name || 'Client',
          status: displayStatus,
          progress,
        };
        
        if (progress === 100 || contract.status.toLowerCase() === 'completed') {
          jobCard.completionDate = contract.end_date || contract.updated_at?.split('T')[0];
          completed.push(jobCard);
        } else if (contract.status.toLowerCase() !== 'cancelled' && contract.status.toLowerCase() !== 'terminated') {
          active.push(jobCard);
        }
      });
      
      setActiveJobs(active);
      setCompletedJobs(completed);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const openJobDetail = useCallback((title: string) => {
    const contract = allContracts.find(c => (c.title || `Project #${c.project_id}`) === title);
    if (!contract) return;

    let milestones: Milestone[] = [];
    try {
      const parsed = JSON.parse(contract.milestones || '[]');
      milestones = Array.isArray(parsed) ? parsed.map((m: any) => ({
        name: m.name || m.title || 'Milestone',
        status: m.status || 'pending',
        amount: m.amount || 0,
        dueDate: m.due_date || m.dueDate || '',
      })) : [];
    } catch {
      milestones = [];
    }

    setSelectedJob({
      id: contract.id,
      title: contract.title || `Project #${contract.project_id}`,
      client: contract.client_name || 'Client',
      status: getStatusAndProgress(contract.status).displayStatus,
      progress: getStatusAndProgress(contract.status).progress,
      amount: contract.total_amount || 0,
      startDate: contract.start_date || '',
      endDate: contract.end_date || '',
      description: contract.description || 'No description available.',
      milestones,
    });
  }, [allContracts]);

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, styles.container)}>
        {/* Header */}
        <ScrollReveal>
          <header className={cn(commonStyles.header, styles.header)}>
            <div className={commonStyles.headerLeft}>
              <h1 className={cn(commonStyles.title, styles.title)}>
                <Briefcase size={28} />
                My Jobs
              </h1>
              <p className={cn(commonStyles.subtitle, styles.subtitle)}>
                Track active projects, review completed work, and manage milestones.
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} /> Filters {showFilters ? <ChevronDown size={14} /> : null}
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/freelancer/jobs'}>
                <Briefcase size={16} /> Browse Jobs
              </Button>
            </div>
          </header>
        </ScrollReveal>

        {/* KPI Stats */}
        <StaggerContainer className={commonStyles.kpiGrid}>
          <StaggerItem>
            <div className={cn(commonStyles.kpiCard, styles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, commonStyles.kpiIconBlue)}><Briefcase size={20} /></div>
              <div className={commonStyles.kpiContent}>
                <span className={cn(commonStyles.kpiValue, styles.kpiValue)}>{kpis.totalActive}</span>
                <span className={cn(commonStyles.kpiLabel, styles.kpiLabel)}>Active Jobs</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.kpiCard, styles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, commonStyles.kpiIconGreen)}><CheckCircle size={20} /></div>
              <div className={commonStyles.kpiContent}>
                <span className={cn(commonStyles.kpiValue, styles.kpiValue)}>{kpis.totalCompleted}</span>
                <span className={cn(commonStyles.kpiLabel, styles.kpiLabel)}>Completed</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.kpiCard, styles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, commonStyles.kpiIconPurple)}><DollarSign size={20} /></div>
              <div className={commonStyles.kpiContent}>
                <span className={cn(commonStyles.kpiValue, styles.kpiValue)}>${kpis.totalEarnings.toLocaleString()}</span>
                <span className={cn(commonStyles.kpiLabel, styles.kpiLabel)}>Total Earned</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.kpiCard, styles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, commonStyles.kpiIconOrange)}><TrendingUp size={20} /></div>
              <div className={commonStyles.kpiContent}>
                <span className={cn(commonStyles.kpiValue, styles.kpiValue)}>{kpis.avgProgress}%</span>
                <span className={cn(commonStyles.kpiLabel, styles.kpiLabel)}>Avg Progress</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.kpiCard, styles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, commonStyles.kpiIconAmber)}><Clock size={20} /></div>
              <div className={commonStyles.kpiContent}>
                <span className={cn(commonStyles.kpiValue, styles.kpiValue)}>{kpis.inReview}</span>
                <span className={cn(commonStyles.kpiLabel, styles.kpiLabel)}>In Review</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.kpiCard, styles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, commonStyles.kpiIconTeal)}><BarChart3 size={20} /></div>
              <div className={commonStyles.kpiContent}>
                <span className={cn(commonStyles.kpiValue, styles.kpiValue)}>{kpis.thisMonthCompleted}</span>
                <span className={cn(commonStyles.kpiLabel, styles.kpiLabel)}>Completed This Month</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Status Filter Bar */}
        {showFilters && (
          <ScrollReveal>
            <div className={cn(commonStyles.filterBar, styles.filterBar)}>
              {(['all', 'active', 'review', 'completed'] as StatusFilterType[]).map(filter => (
                <button
                  key={filter}
                  className={cn(commonStyles.filterBtn, styles.filterBtn, statusFilter === filter && commonStyles.filterBtnActive, statusFilter === filter && styles.filterBtnActive)}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === 'all' && 'All Jobs'}
                  {filter === 'active' && `Active (${activeJobs.filter(j => j.status === 'Development' || j.status === 'In Progress').length})`}
                  {filter === 'review' && `In Review (${kpis.inReview})`}
                  {filter === 'completed' && `Completed (${completedJobs.length})`}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Tabs */}
        <div className={commonStyles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'active'}
            className={cn(commonStyles.tab, styles.tab, activeTab === 'active' && commonStyles.tabActive, activeTab === 'active' && styles.tabActive)}
            onClick={() => setActiveTab('active')}
          >
            <Briefcase size={16} />
            Active Jobs ({filteredActiveJobs.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'completed'}
            className={cn(commonStyles.tab, styles.tab, activeTab === 'completed' && commonStyles.tabActive, activeTab === 'completed' && styles.tabActive)}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={16} />
            Completed ({filteredCompletedJobs.length})
          </button>
        </div>

        {/* Main Content */}
        {error ? (
          <ScrollReveal delay={0.1}>
            <div className={cn(commonStyles.emptyState, styles.emptyState)}>
              <AlertCircle size={32} />
              <h3>Error Loading Jobs</h3>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchJobs}>Try Again</Button>
            </div>
          </ScrollReveal>
        ) : loading ? (
          <div className={cn(commonStyles.loadingState, styles.loadingState)}>
            <div className={cn(commonStyles.spinner, styles.spinner)} />
            <p>Loading your jobs...</p>
          </div>
        ) : (
          <div className={cn(commonStyles.gridsContainer, styles.gridsContainer)}>
            {activeTab === 'active' && (
              <ScrollReveal delay={0.1}>
                {filteredActiveJobs.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, styles.emptyState)}>
                    <Briefcase size={40} strokeWidth={1.5} opacity={0.5} />
                    <h3>No Active Jobs</h3>
                    <p>Start browsing projects to find your next opportunity.</p>
                    <Button variant="primary" onClick={() => window.location.href = '/freelancer/jobs'}>Browse Jobs</Button>
                  </div>
                ) : (
                  <PaginatedJobGrid
                    storageKey="freelancer:my-jobs:active"
                    jobs={filteredActiveJobs}
                    sortOptions={activeSortOptions}
                    defaultSortKey="progress"
                    searchKeys={['title', 'client', 'status']}
                    title="Active Jobs"
                  />
                )}
              </ScrollReveal>
            )}

            {activeTab === 'completed' && (
              <ScrollReveal delay={0.1}>
                {filteredCompletedJobs.length === 0 ? (
                  <div className={cn(commonStyles.emptyState, styles.emptyState)}>
                    <CheckCircle size={40} strokeWidth={1.5} opacity={0.5} />
                    <h3>No Completed Jobs Yet</h3>
                    <p>Complete your active projects to see them here.</p>
                  </div>
                ) : (
                  <PaginatedJobGrid
                    storageKey="freelancer:my-jobs:completed"
                    jobs={filteredCompletedJobs}
                    sortOptions={completedSortOptions}
                    defaultSortKey="completionDate"
                    searchKeys={['title', 'client', 'completionDate']}
                    title="Completed Jobs"
                  />
                )}
              </ScrollReveal>
            )}
          </div>
        )}

        {/* Quick Actions Bar */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.quickActions, styles.quickActions)}>
            <h3 className={commonStyles.quickActionsTitle}>Quick Actions</h3>
            <div className={commonStyles.quickActionsGrid}>
              <a href="/freelancer/time-entries" className={cn(commonStyles.quickAction, styles.quickAction)}>
                <Timer size={18} />
                <span>Time Tracking</span>
              </a>
              <a href="/freelancer/messages" className={cn(commonStyles.quickAction, styles.quickAction)}>
                <MessageCircle size={18} />
                <span>Messages</span>
              </a>
              <a href="/freelancer/invoices" className={cn(commonStyles.quickAction, styles.quickAction)}>
                <FileText size={18} />
                <span>Invoices</span>
              </a>
              <a href="/freelancer/contracts" className={cn(commonStyles.quickAction, styles.quickAction)}>
                <FileText size={18} />
                <span>Contracts</span>
              </a>
              <a href="/freelancer/earnings" className={cn(commonStyles.quickAction, styles.quickAction)}>
                <DollarSign size={18} />
                <span>Earnings</span>
              </a>
              <a href="/freelancer/reviews" className={cn(commonStyles.quickAction, styles.quickAction)}>
                <Star size={18} />
                <span>Reviews</span>
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Job Detail Drawer */}
        {selectedJob && (
          <div className={commonStyles.drawerOverlay} onClick={() => setSelectedJob(null)}>
            <div className={cn(commonStyles.drawer, styles.drawer)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.drawerHeader}>
                <h2>{selectedJob.title}</h2>
                <button className={commonStyles.drawerClose} onClick={() => setSelectedJob(null)} aria-label="Close detail">
                  <X size={20} />
                </button>
              </div>
              <div className={commonStyles.drawerBody}>
                <div className={commonStyles.drawerRow}>
                  <span className={commonStyles.drawerLabel}>Client</span>
                  <span>{selectedJob.client}</span>
                </div>
                <div className={commonStyles.drawerRow}>
                  <span className={commonStyles.drawerLabel}>Status</span>
                  <span className={cn(commonStyles.statusBadge, styles.statusBadge)}>{selectedJob.status}</span>
                </div>
                <div className={commonStyles.drawerRow}>
                  <span className={commonStyles.drawerLabel}>Amount</span>
                  <span>${selectedJob.amount.toLocaleString()}</span>
                </div>
                <div className={commonStyles.drawerRow}>
                  <span className={commonStyles.drawerLabel}>Timeline</span>
                  <span>{selectedJob.startDate ? new Date(selectedJob.startDate).toLocaleDateString() : 'N/A'}{' — '}{selectedJob.endDate ? new Date(selectedJob.endDate).toLocaleDateString() : 'Ongoing'}</span>
                </div>
                <div className={commonStyles.drawerRow}>
                  <span className={commonStyles.drawerLabel}>Progress</span>
                  <div className={commonStyles.progressBarWrap}>
                    <div className={cn(commonStyles.progressBar, styles.progressBar)} style={{ width: `${selectedJob.progress}%` }} />
                  </div>
                  <span>{selectedJob.progress}%</span>
                </div>
                <div className={commonStyles.drawerSection}>
                  <h3>Description</h3>
                  <p>{selectedJob.description}</p>
                </div>
                {selectedJob.milestones.length > 0 && (
                  <div className={commonStyles.drawerSection}>
                    <h3>Milestones</h3>
                    <div className={commonStyles.milestoneList}>
                      {selectedJob.milestones.map((m, i) => (
                        <div key={i} className={cn(commonStyles.milestoneItem, styles.milestoneItem)}>
                          <div className={cn(commonStyles.milestoneStatus, commonStyles[`ms_${m.status}`])}>
                            {m.status === 'completed' ? <CheckCircle size={14} /> : m.status === 'in-progress' ? <Clock size={14} /> : <AlertCircle size={14} />}
                          </div>
                          <div className={commonStyles.milestoneInfo}>
                            <span className={commonStyles.milestoneName}>{m.name}</span>
                            <span className={commonStyles.milestoneMeta}>
                              ${m.amount.toLocaleString()} • {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className={commonStyles.drawerActions}>
                  <Button variant="primary" size="sm" onClick={() => window.location.href = `/freelancer/contracts`}>
                    <ExternalLink size={14} /> View Contract
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = `/freelancer/messages`}>
                    <MessageCircle size={14} /> Message Client
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default MyJobs;
