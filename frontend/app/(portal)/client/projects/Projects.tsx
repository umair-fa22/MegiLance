// @AI-HINT: Corporate client projects page with KPI summary, enterprise controls, and polished card grid
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PlusCircle, Download, Search, AlertTriangle, SearchX, Briefcase, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useClientData } from '@/hooks/useClient';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import ProjectCard, { ProjectCardProps } from '@/app/components/ProjectCard/ProjectCard';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import Pagination from '@/app/components/Pagination/Pagination';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { errorAlertAnimation, searchingAnimation } from '@/app/components/Animations/LottieAnimation';
import common from './Projects.common.module.css';
import light from './Projects.light.module.css';
import dark from './Projects.dark.module.css';

// Data transformation
const transformProjectData = (projects: any[]): ProjectCardProps[] => {
  if (!Array.isArray(projects)) return [];
  return projects.map(p => ({
    id: p.id,
    title: p.title || 'Untitled Project',
    status: p.status || 'Pending',
    progress: p.progress ?? 0,
    budget: typeof p.budget === 'number' ? p.budget : parseFloat(String(p.budget).replace(/[$,]/g, '')) || 0,
    paid: p.paid ?? 0,
    freelancers: p.freelancers || [],
    updatedAt: p.updatedAt || new Date().toLocaleDateString(),
  }));
};

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'title', label: 'Title' },
  { value: 'budget', label: 'Budget' },
  { value: 'progress', label: 'Progress' },
];

const Projects: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const router = useRouter();
  const { projects: rawProjects, loading, error } = useClientData();
  const projects = useMemo(() => transformProjectData(rawProjects || []), [rawProjects]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  // Strongly type the sort key to the allowed fields
  const [sortKey, setSortKey] = useState<'updatedAt' | 'title' | 'budget' | 'progress'>('updatedAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => statusFilter === 'All' || p.status === statusFilter)
      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, statusFilter, searchQuery]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      // Sort descending by selected key
      switch (sortKey) {
        case 'budget':
        case 'progress': {
          const av = a[sortKey] as number;
          const bv = b[sortKey] as number;
          return bv - av;
        }
        case 'title':
        case 'updatedAt':
        default: {
          const av = String(a[sortKey] ?? '');
          const bv = String(b[sortKey] ?? '');
          return bv.localeCompare(av);
        }
      }
    });
  }, [filteredProjects, sortKey]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProjects.slice(start, start + itemsPerPage);
  }, [sortedProjects, currentPage, itemsPerPage]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    return { total, active, completed, totalBudget };
  }, [projects]);

  if (error) {
    return (
      <EmptyState
        title="Unable to Load Projects"
        description="We couldn't connect to the server. Please check your connection and try again."
        icon={<AlertTriangle size={48} />}
        animationData={errorAlertAnimation}
        animationWidth={120}
        animationHeight={120}
        action={
          <Button variant="primary" size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        }
      />
    );
  }

  return (
    <PageTransition>
      <div className={cn(common.page, themed.theme)}>
        <ScrollReveal>
          <header className={common.header}>
            <div>
              <h1 className={common.title}>Projects</h1>
              <p className={common.subtitle}>Track progress, manage budgets, and review proposals across all your projects.</p>
            </div>
            <div className={common.actions}>
              <Button variant="secondary" iconBefore={<Download size={16} />} onClick={() => {
                const csv = ['Title,Status,Budget,Progress'].concat(
                  projects.map(p => `"${p.title}",${p.status},${p.budget},${p.progress}%`)
                ).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'projects.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}>Export</Button>
              <Button iconBefore={<PlusCircle size={16} />} onClick={() => router.push('/client/post-job')}>New Project</Button>
            </div>
          </header>
        </ScrollReveal>

        {/* KPI Summary Strip */}
        <ScrollReveal delay={0.05}>
          <div className={cn(common.kpiStrip, themed.kpiStrip)}>
            <div className={cn(common.kpiItem, themed.kpiItem)}>
              <Briefcase size={16} className={common.kpiIcon} />
              <span className={cn(common.kpiValue, themed.kpiValue)}>{kpis.total}</span>
              <span className={cn(common.kpiLabel, themed.kpiLabel)}>Total</span>
            </div>
            <div className={cn(common.kpiDivider, themed.kpiDivider)} />
            <div className={cn(common.kpiItem, themed.kpiItem)}>
              <Clock size={16} className={common.kpiIcon} />
              <span className={cn(common.kpiValue, themed.kpiValue)}>{kpis.active}</span>
              <span className={cn(common.kpiLabel, themed.kpiLabel)}>Active</span>
            </div>
            <div className={cn(common.kpiDivider, themed.kpiDivider)} />
            <div className={cn(common.kpiItem, themed.kpiItem)}>
              <CheckCircle2 size={16} className={common.kpiIcon} />
              <span className={cn(common.kpiValue, themed.kpiValue)}>{kpis.completed}</span>
              <span className={cn(common.kpiLabel, themed.kpiLabel)}>Completed</span>
            </div>
            <div className={cn(common.kpiDivider, themed.kpiDivider)} />
            <div className={cn(common.kpiItem, themed.kpiItem)}>
              <TrendingUp size={16} className={common.kpiIcon} />
              <span className={cn(common.kpiValue, themed.kpiValue)}>${kpis.totalBudget.toLocaleString()}</span>
              <span className={cn(common.kpiLabel, themed.kpiLabel)}>Total Budget</span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={common.controls}>
            <Input
              iconBefore={<Search size={18} />}
              placeholder="Search by project title..."
              aria-label="Search projects"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={common.searchInput}
            />
            <div className={common.filtersRow}>
              <span className={cn(common.resultsCount, themed.resultsCount)}>
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </span>
              <div className={common.filters}>
                <Select id="status-filter" aria-label="Filter by status" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
                <Select
                  id="sort-key"
                  aria-label="Sort projects by"
                  options={SORT_OPTIONS}
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as 'updatedAt' | 'title' | 'budget' | 'progress')}
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={common.grid}>
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className={common.skeletonCard} />)}
          </div>
        ) : paginatedProjects.length > 0 ? (
          <StaggerContainer delay={0.2} className={common.grid}>
            {paginatedProjects.map(project => <ProjectCard key={project.id} {...project} />)}
          </StaggerContainer>
        ) : (
          <EmptyState
            title={searchQuery || statusFilter !== 'All' ? 'No Matching Projects' : 'No Projects Yet'}
            description={searchQuery || statusFilter !== 'All'
              ? `No projects match your current filters. Try adjusting your search or status filter.`
              : 'Get started by posting your first project. It only takes a few minutes to describe what you need.'
            }
            icon={<SearchX size={48} />}
            animationData={searchingAnimation}
            animationWidth={120}
            animationHeight={120}
            action={
              searchQuery || statusFilter !== 'All' ? (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}>Clear Filters</Button>
              ) : (
                <Button variant="primary" size="sm" iconBefore={<PlusCircle size={14} />} onClick={() => router.push('/client/post-job')}>Post a Project</Button>
              )
            }
          />
        )}

        {paginatedProjects.length > 0 && (
          <div className={common.paginationContainer}>
            <span className={cn(common.paginationInfo, themed.paginationInfo)}>
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, sortedProjects.length)} of {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedProjects.length / itemsPerPage)}
              onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
              onNext={() => setCurrentPage(p => Math.min(Math.ceil(sortedProjects.length / itemsPerPage), p + 1))}
            />
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Projects;
