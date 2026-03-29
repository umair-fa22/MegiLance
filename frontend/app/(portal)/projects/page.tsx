// @AI-HINT: Universal portal route for Projects page - shows all projects with pagination, sorting, and navigation
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { projectsApi } from '@/lib/api';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Button from '@/app/components/atoms/Button/Button';
import { Badge } from '@/app/components/atoms/Badge';
import Loading from '@/app/components/atoms/Loading/Loading';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { ProjectsIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.common.module.css';
import { Briefcase, Search, ChevronRight, Calendar, DollarSign, Users, ArrowUpDown, ChevronLeft } from 'lucide-react';
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

const PAGE_SIZE = 12;

type SortField = 'newest' | 'budget_high' | 'budget_low' | 'deadline' | 'proposals';

const SORT_OPTIONS: { key: SortField; label: string }[] = [
  { key: 'newest', label: 'Newest First' },
  { key: 'budget_high', label: 'Budget: High → Low' },
  { key: 'budget_low', label: 'Budget: Low → High' },
  { key: 'deadline', label: 'Deadline (Soonest)' },
  { key: 'proposals', label: 'Most Proposals' },
];

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'primary' | 'secondary' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'secondary'> = {
    open: 'success', active: 'primary', in_progress: 'warning', completed: 'secondary', closed: 'danger'
  };
  return map[status?.toLowerCase()] || 'primary';
};

export default function PortalProjectsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.list({ page: 1, page_size: 100 });
      setProjects(Array.isArray(data) ? data : (data as any)?.items || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load projects:', error);
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = projects.filter(p => {
      if (statusFilter !== 'all' && (p.status || 'open').toLowerCase() !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'budget_high': return (b.budget || 0) - (a.budget || 0);
        case 'budget_low': return (a.budget || 0) - (b.budget || 0);
        case 'deadline': {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        case 'proposals': return (b.proposals_count || 0) - (a.proposals_count || 0);
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return result;
  }, [projects, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const paginatedProjects = filteredAndSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sortBy]);

  const statusCounts = useMemo(() => ({
    open: projects.filter(p => (p.status || 'open').toLowerCase() === 'open').length,
    active: projects.filter(p => ['active', 'in_progress'].includes((p.status || '').toLowerCase())).length,
  }), [projects]);

  const handleCardClick = useCallback((projectId: string) => {
    router.push(`/projects/${projectId}`);
  }, [router]);

  if (!mounted) return null;

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themed.page)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div className={commonStyles.headerRow}>
              <div>
                <h1 className={commonStyles.title}>Browse Projects</h1>
                <p className={cn(commonStyles.subtitle, themed.subtitle)}>
                  {filteredAndSorted.length} project{filteredAndSorted.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className={cn(commonStyles.sortWrapper, themed.sortWrapper)}>
                <ArrowUpDown size={14} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                  className={cn(commonStyles.sortSelect, themed.sortSelect)}
                  aria-label="Sort projects"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.toolbar, themed.toolbar)}>
            <div className={commonStyles.searchWrapper}>
              <Search className={cn(commonStyles.searchIcon, themed.searchIcon)} />
              <input
                type="text"
                placeholder="Search projects by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themed.searchInput)}
                aria-label="Search projects"
              />
            </div>
            <div className={commonStyles.filterTabs} role="tablist" aria-label="Filter by status">
              {[
                { key: 'all', label: 'All' },
                { key: 'open', label: 'Open', count: statusCounts.open },
                { key: 'active', label: 'Active', count: statusCounts.active },
              ].map(f => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={statusFilter === f.key}
                  className={cn(commonStyles.filterTab, themed.filterTab, statusFilter === f.key && commonStyles.filterTabActive, statusFilter === f.key && themed.filterTabActive)}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span className={commonStyles.filterCount}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {loading ? <Loading /> : paginatedProjects.length > 0 ? (
          <>
            <StaggerContainer className={commonStyles.grid}>
              {paginatedProjects.map((project, idx) => (
                <StaggerItem key={project.id || idx}>
                  <article
                    className={cn(commonStyles.projectCard, themed.projectCard)}
                    onClick={() => handleCardClick(project.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(project.id); } }}
                    tabIndex={0}
                    role="link"
                    aria-label={`View project: ${project.title || 'Untitled'}`}
                  >
                    <div className={commonStyles.cardTop}>
                      <div className={cn(commonStyles.iconWrapper, themed.iconWrapper)}>
                        <Briefcase className={cn(commonStyles.projectIcon, themed.projectIcon)} />
                      </div>
                      <Badge variant={getStatusVariant(project.status || 'open')}>
                        {(project.status || 'Open').replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className={commonStyles.cardTitle}>{project.title || 'Untitled Project'}</h3>
                    <p className={cn(commonStyles.cardDescription, themed.cardDescription)}>
                      {project.description || 'No description available.'}
                    </p>
                    
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div className={commonStyles.skillTags}>
                        {project.required_skills.slice(0, 3).map((skill: string, i: number) => (
                          <span key={i} className={cn(commonStyles.skillTag, themed.skillTag)}>{skill}</span>
                        ))}
                        {project.required_skills.length > 3 && (
                          <span className={cn(commonStyles.skillTag, themed.skillTag)}>+{project.required_skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className={commonStyles.cardFooter}>
                      <div className={commonStyles.cardMeta}>
                        <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                          <DollarSign size={14} />
                          ${project.budget?.toLocaleString() || '0'}
                        </span>
                        {project.deadline && (
                          <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                            <Calendar size={14} />
                            {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {project.proposals_count !== undefined && (
                          <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                            <Users size={14} />
                            {project.proposals_count} proposals
                          </span>
                        )}
                      </div>
                      <ChevronRight className={cn(commonStyles.chevron, themed.chevron)} />
                    </div>
                  </article>
                </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className={cn(commonStyles.pagination, themed.pagination)} aria-label="Projects pagination">
              <button
                className={cn(commonStyles.pageBtn, themed.pageBtn)}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className={cn(commonStyles.pageInfo, themed.pageInfo)}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={cn(commonStyles.pageBtn, themed.pageBtn)}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                Next <ChevronRight size={16} />
              </button>
            </nav>
          )}
          </>
        ) : (
          <EmptyState
            icon={<ProjectsIllustration className={illustrationStyles.emptyStateIllustration} />}
            title="No projects found"
            description={searchQuery ? 'Try adjusting your search or filter' : 'Check back later for new opportunities'}
          />
        )}
      </div>
    </PageTransition>
  );
}
