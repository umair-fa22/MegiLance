// @AI-HINT: Freelancer Projects page - shows projects the freelancer is working on with KPIs, sorting, pagination, export
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations/';
import { errorAlertAnimation, emptyBoxAnimation } from '@/app/components/Animations/LottieAnimation';
import { contractsApi } from '@/lib/api';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  FolderKanban,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

interface Project {
  id: string;
  title: string;
  client_name: string;
  status: string;
  budget: number;
  progress: number;
  deadline: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 6;

export default function FreelancerProjectsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await contractsApi.list({ status: statusFilter === 'all' ? undefined : statusFilter });
        const contractsList = Array.isArray(response) ? response : (response as any).contracts || [];
        
        const mappedProjects = contractsList.map((contract: any) => ({
          id: contract.id?.toString() || '',
          title: contract.title || contract.project_title || 'Untitled Project',
          client_name: contract.client_name || 'Client',
          status: contract.status || 'active',
          budget: contract.rate || contract.budget || 0,
          progress: contract.progress || 0,
          deadline: contract.end_date || contract.deadline || '',
          created_at: contract.created_at || new Date().toISOString(),
        }));
        
        setProjects(mappedProjects);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch projects:', err);
        }
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchProjects();
    }
  }, [mounted, statusFilter]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const filteredAndSortedProjects = useMemo(() => {
    let result = projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'budget-high': return b.budget - a.budget;
        case 'budget-low': return a.budget - b.budget;
        case 'progress': return b.progress - a.progress;
        case 'deadline': return new Date(a.deadline || '9999').getTime() - new Date(b.deadline || '9999').getTime();
        default: return 0;
      }
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProjects.length / ITEMS_PER_PAGE));
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // KPI stats
  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    return { total: projects.length, active, completed, totalBudget };
  }, [projects]);

  const handleExportCSV = useCallback(() => {
    if (filteredAndSortedProjects.length === 0) return;
    const headers = ['Title', 'Client', 'Status', 'Budget', 'Progress', 'Deadline', 'Created'];
    const rows = filteredAndSortedProjects.map(p => [
      p.title,
      p.client_name,
      p.status,
      p.budget.toString(),
      `${p.progress}%`,
      p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/A',
      new Date(p.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-projects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredAndSortedProjects]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: 'success', icon: <CheckCircle size={14} /> },
      completed: { color: 'primary', icon: <CheckCircle size={14} /> },
      pending: { color: 'warning', icon: <Clock size={14} /> },
      cancelled: { color: 'danger', icon: <AlertCircle size={14} /> },
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    return (
      <span className={cn(commonStyles.statusBadge, commonStyles[`status${config.color}`])}>
        {config.icon}
        {status}
      </span>
    );
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages.map((p, idx) =>
      typeof p === 'string' ? (
        <span key={`e${idx}`} className={commonStyles.pageEllipsis}>...</span>
      ) : (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={cn(commonStyles.pageBtn, themeStyles.pageBtn, p === currentPage && cn(commonStyles.pageBtnActive, themeStyles.pageBtnActive))}
        >
          {p}
        </button>
      )
    );
  };

  if (!mounted) {
    return <Loading />;
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>My Projects</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your ongoing and completed projects
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="outline" iconBefore={<Download size={16} />} onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Link href="/freelancer/jobs">
                <Button variant="primary" iconBefore={<Briefcase size={18} />}>
                  Find New Projects
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* KPI Stats */}
        {!loading && !error && (
          <ScrollReveal delay={0.1}>
            <div className={commonStyles.statsRow}>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <FolderKanban size={20} className={commonStyles.statIcon} />
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.total}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Projects</span>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <CheckCircle size={20} className={cn(commonStyles.statIcon, commonStyles.statIconActive)} />
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.active}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <TrendingUp size={20} className={cn(commonStyles.statIcon, commonStyles.statIconCompleted)} />
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.completed}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Completed</span>
                </div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <DollarSign size={20} className={cn(commonStyles.statIcon, commonStyles.statIconBudget)} />
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                    ${stats.totalBudget.toLocaleString()}
                  </span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Budget</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Filters */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.filters, themeStyles.filters)}>
            <div className={commonStyles.searchWrapper}>
              <Search size={18} className={commonStyles.searchIcon} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                aria-label="Search projects"
              />
            </div>
            <div className={commonStyles.filterGroup}>
              <Filter size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className={commonStyles.filterGroup}>
              <ArrowUpDown size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
                aria-label="Sort projects"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
                <option value="progress">Progress</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>
        </ScrollReveal>

        {/* Results bar */}
        {!loading && !error && filteredAndSortedProjects.length > 0 && (
          <div className={cn(commonStyles.resultsBar, themeStyles.resultsBar)}>
            <span className={cn(commonStyles.resultCount, themeStyles.resultCount)}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProjects.length)} of {filteredAndSortedProjects.length} projects
            </span>
          </div>
        )}

        {/* Projects List */}
        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState
            title="Error loading projects"
            description={error}
            animationData={errorAlertAnimation}
            animationWidth={110}
            animationHeight={110}
            action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
          />
        ) : filteredAndSortedProjects.length === 0 ? (
          <EmptyState
            title={searchQuery || statusFilter !== 'all' ? 'No matching projects' : 'No projects found'}
            description={searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'You don\'t have any active projects yet. Start by finding new job opportunities.'}
            animationData={emptyBoxAnimation}
            animationWidth={120}
            animationHeight={120}
            action={
              searchQuery || statusFilter !== 'all' ? (
                <Button variant="secondary" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                  Clear Filters
                </Button>
              ) : (
                <Link href="/freelancer/jobs">
                  <Button variant="primary">Browse Jobs</Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            <StaggerContainer className={commonStyles.projectsGrid}>
              {paginatedProjects.map((project) => (
                <StaggerItem key={project.id}>
                  <div className={cn(commonStyles.projectCard, themeStyles.projectCard)}>
                    <div className={commonStyles.projectHeader}>
                      <h3 className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
                        {project.title}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>
                    
                    <p className={cn(commonStyles.clientName, themeStyles.clientName)}>
                      Client: {project.client_name}
                    </p>
                    
                    <div className={commonStyles.projectMeta}>
                      <div className={commonStyles.metaItem}>
                        <DollarSign size={16} />
                        <span>${project.budget.toLocaleString()}</span>
                      </div>
                      {project.deadline && (
                        <div className={commonStyles.metaItem}>
                          <Calendar size={16} />
                          <span>{new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={commonStyles.progressWrapper}>
                      <div className={commonStyles.progressBar}>
                        <div 
                          className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className={commonStyles.progressText}>{project.progress}%</span>
                    </div>
                    
                    <div className={commonStyles.projectActions}>
                      <Link href={`/freelancer/contracts/${project.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      <Link href={`/freelancer/messages?project=${project.id}`}>
                        <Button variant="ghost" size="sm">Message Client</Button>
                      </Link>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={commonStyles.pagination}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(commonStyles.pageBtn, themeStyles.pageBtn)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(commonStyles.pageBtn, themeStyles.pageBtn)}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
