// @AI-HINT: Public Jobs search page with advanced filtering, sorting, pagination, and URL-driven state.
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  Search, Briefcase, Clock, DollarSign, Tag, Filter, X,
  ChevronLeft, ChevronRight, Grid3X3, List,
  SlidersHorizontal, RefreshCw, Zap, Shield,
  Code, Palette, PenTool, Megaphone, BarChart3, Cpu,
  Globe, BookOpen, Gamepad2
} from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';

import commonStyles from './PublicJobs.common.module.css';
import lightStyles from './PublicJobs.light.module.css';
import darkStyles from './PublicJobs.dark.module.css';

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: Grid3X3 },
  { id: 'web-development', name: 'Web Development', icon: Code },
  { id: 'mobile-development', name: 'Mobile Development', icon: Cpu },
  { id: 'design', name: 'Design & Creative', icon: Palette },
  { id: 'writing', name: 'Writing & Content', icon: PenTool },
  { id: 'marketing', name: 'Digital Marketing', icon: Megaphone },
  { id: 'data-science', name: 'Data & Analytics', icon: BarChart3 },
  { id: 'ai-ml', name: 'AI & Machine Learning', icon: Zap },
  { id: 'devops', name: 'DevOps & Cloud', icon: Globe },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: Shield },
  { id: 'education', name: 'Education & Training', icon: BookOpen },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
];

const EXPERIENCE_LEVELS = [
  { id: 'all', label: 'Any Level' },
  { id: 'entry', label: 'Entry Level' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
];

const BUDGET_RANGES = [
  { id: 'all', label: 'Any Budget', min: undefined as number | undefined, max: undefined as number | undefined },
  { id: 'micro', label: 'Under $500', min: 0, max: 500 },
  { id: 'small', label: '$500 - $2,000', min: 500, max: 2000 },
  { id: 'medium', label: '$2,000 - $10,000', min: 2000, max: 10000 },
  { id: 'large', label: '$10,000 - $50,000', min: 10000, max: 50000 },
  { id: 'enterprise', label: '$50,000+', min: 50000, max: undefined as number | undefined },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'budget_high', label: 'Budget: High to Low' },
  { id: 'budget_low', label: 'Budget: Low to High' },
];

const DURATION_OPTIONS = [
  { id: 'all', label: 'Any Duration' },
  { id: 'less_than_1_week', label: 'Less than 1 week' },
  { id: '1_to_4_weeks', label: '1 - 4 weeks' },
  { id: '1_to_3_months', label: '1 - 3 months' },
  { id: '3_to_6_months', label: '3 - 6 months' },
  { id: 'more_than_6_months', label: '6+ months' },
];

const PAGE_SIZE = 20;

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_type: string;
  budget_min: number;
  budget_max: number;
  experience_level: string;
  estimated_duration: string;
  skills: string[];
  client_id: number;
  status: string;
  created_at: string;
}

interface Filters {
  search: string;
  category: string;
  experience: string;
  budgetRange: string;
  budgetType: string;
  duration: string;
  sortBy: string;
}

const PublicJobs: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    experience: searchParams.get('level') || 'all',
    budgetRange: searchParams.get('budget') || 'all',
    budgetType: searchParams.get('type') || 'all',
    duration: searchParams.get('duration') || 'all',
    sortBy: searchParams.get('sort') || 'newest',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Debounced search
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Sync URL with filters
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.experience !== 'all') params.set('level', filters.experience);
    if (filters.budgetRange !== 'all') params.set('budget', filters.budgetRange);
    if (filters.budgetType !== 'all') params.set('type', filters.budgetType);
    if (filters.duration !== 'all') params.set('duration', filters.duration);
    if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    const newUrl = params.toString() ? `/jobs?${params.toString()}` : '/jobs';
    window.history.replaceState({}, '', newUrl);
  }, [filters, currentPage]);

  // Fetch projects
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.experience, filters.budgetRange, filters.budgetType, filters.sortBy, currentPage]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const budgetConfig = BUDGET_RANGES.find(b => b.id === filters.budgetRange);
      const params: Record<string, any> = { page_size: PAGE_SIZE };

      if (debouncedSearch) params.q = debouncedSearch;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.experience !== 'all') params.experience_level = filters.experience;
      if (budgetConfig?.min !== undefined) params.budget_min = budgetConfig.min;
      if (budgetConfig?.max !== undefined) params.budget_max = budgetConfig.max;
      if (filters.budgetType !== 'all') params.budget_type = filters.budgetType;

      let data: any;
      if (debouncedSearch) {
        data = await api.search.projects(debouncedSearch, params);
      } else {
        data = await api.projects.list(params);
      }

      const items = Array.isArray(data) ? data : (data?.results || data?.projects || []);
      setProjects(items);
      setTotalCount(data?.total || items.length);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering + sorting
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (filters.duration !== 'all') {
      result = result.filter(p => {
        const d = (p.estimated_duration || '').toLowerCase();
        switch (filters.duration) {
          case 'less_than_1_week': return d.includes('day') || d.includes('< 1 week') || d.includes('less than 1');
          case '1_to_4_weeks': return d.includes('week') || d.includes('1-4');
          case '1_to_3_months': return d.includes('1-3 month') || d.includes('month');
          case '3_to_6_months': return d.includes('3-6 month') || d.includes('6 month');
          case 'more_than_6_months': return d.includes('6+') || d.includes('ongoing') || d.includes('long');
          default: return true;
        }
      });
    }

    if (filters.budgetType !== 'all') {
      result = result.filter(p => p.budget_type === filters.budgetType);
    }

    switch (filters.sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'budget_high': result.sort((a, b) => (b.budget_max || 0) - (a.budget_max || 0)); break;
      case 'budget_low': result.sort((a, b) => (a.budget_min || 0) - (b.budget_min || 0)); break;
    }
    return result;
  }, [projects, filters.duration, filters.budgetType, filters.sortBy]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') setCurrentPage(1);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', category: 'all', experience: 'all', budgetRange: 'all', budgetType: 'all', duration: 'all', sortBy: 'newest' });
    setCurrentPage(1);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.experience !== 'all') count++;
    if (filters.budgetRange !== 'all') count++;
    if (filters.budgetType !== 'all') count++;
    if (filters.duration !== 'all') count++;
    return count;
  }, [filters]);

  const formatBudget = (project: Project) => {
    if (project.budget_type === 'fixed') {
      if (project.budget_max) return `$${project.budget_max.toLocaleString()}`;
      if (project.budget_min) return `$${project.budget_min.toLocaleString()}`;
      return 'Fixed Price';
    }
    if (project.budget_min && project.budget_max) return `$${project.budget_min} - $${project.budget_max}/hr`;
    if (project.budget_max) return `Up to $${project.budget_max}/hr`;
    return 'Hourly';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderFilters = () => (
    <div className={commonStyles.filterGroups}>
      {/* Experience Level */}
      <div className={commonStyles.filterGroup}>
        <h4 className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Experience Level</h4>
        <div className={commonStyles.filterOptions}>
          {EXPERIENCE_LEVELS.map(level => (
            <label key={level.id} className={cn(commonStyles.filterOption, themeStyles.filterOption)}>
              <input type="radio" name="experience" checked={filters.experience === level.id} onChange={() => handleFilterChange('experience', level.id)} className={commonStyles.filterRadio} />
              <span className={cn(commonStyles.filterRadioCustom, themeStyles.filterRadioCustom, filters.experience === level.id && commonStyles.filterRadioActive)} />
              <span>{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div className={commonStyles.filterGroup}>
        <h4 className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Budget Range</h4>
        <div className={commonStyles.filterOptions}>
          {BUDGET_RANGES.map(range => (
            <label key={range.id} className={cn(commonStyles.filterOption, themeStyles.filterOption)}>
              <input type="radio" name="budget" checked={filters.budgetRange === range.id} onChange={() => handleFilterChange('budgetRange', range.id)} className={commonStyles.filterRadio} />
              <span className={cn(commonStyles.filterRadioCustom, themeStyles.filterRadioCustom, filters.budgetRange === range.id && commonStyles.filterRadioActive)} />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Project Type */}
      <div className={commonStyles.filterGroup}>
        <h4 className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Project Type</h4>
        <div className={commonStyles.filterChips}>
          {[{ id: 'all', label: 'All' }, { id: 'fixed', label: 'Fixed Price' }, { id: 'hourly', label: 'Hourly' }].map(type => (
            <button key={type.id} onClick={() => handleFilterChange('budgetType', type.id)} className={cn(commonStyles.filterChip, themeStyles.filterChip, filters.budgetType === type.id && commonStyles.filterChipActive, filters.budgetType === type.id && themeStyles.filterChipActive)}>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className={commonStyles.filterGroup}>
        <h4 className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Project Duration</h4>
        <div className={commonStyles.filterOptions}>
          {DURATION_OPTIONS.map(dur => (
            <label key={dur.id} className={cn(commonStyles.filterOption, themeStyles.filterOption)}>
              <input type="radio" name="duration" checked={filters.duration === dur.id} onChange={() => handleFilterChange('duration', dur.id)} className={commonStyles.filterRadio} />
              <span className={cn(commonStyles.filterRadioCustom, themeStyles.filterRadioCustom, filters.duration === dur.id && commonStyles.filterRadioActive)} />
              <span>{dur.label}</span>
            </label>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <button className={cn(commonStyles.clearFilters, themeStyles.clearFilters)} onClick={handleClearFilters}>
          <RefreshCw size={14} /> Clear all filters ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <SectionGlobe variant="blue" size="md" position="right" />
        {/* Hero Header */}
        <ScrollReveal>
          <header className={cn(commonStyles.header, themeStyles.header)}>
            <h1 className={cn(commonStyles.title, themeStyles.title)}>Find Your Next Project</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              Browse {totalCount > 0 ? `${totalCount.toLocaleString()}+` : ''} freelance jobs across all categories
            </p>
            <div className={commonStyles.searchSection}>
              <div className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
                <Search className={commonStyles.searchIcon} size={20} />
                <input type="text" placeholder="Search by title, skill, or keyword..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className={cn(commonStyles.searchInput, themeStyles.searchInput)} aria-label="Search jobs" />
                {filters.search && (
                  <button onClick={() => handleFilterChange('search', '')} className={commonStyles.searchClear} aria-label="Clear search"><X size={16} /></button>
                )}
              </div>
              <button className={cn(commonStyles.mobileFilterBtn, themeStyles.mobileFilterBtn)} onClick={() => setShowMobileFilters(true)}>
                <SlidersHorizontal size={18} /> Filters
                {activeFiltersCount > 0 && <span className={cn(commonStyles.filterBadge, themeStyles.filterBadge)}>{activeFiltersCount}</span>}
              </button>
            </div>
          </header>
        </ScrollReveal>

        {/* Category Pills */}
        <div className={commonStyles.categoriesSection}>
          <div className={commonStyles.categoriesScroll}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} onClick={() => handleFilterChange('category', cat.id)} className={cn(commonStyles.categoryPill, themeStyles.categoryPill, filters.category === cat.id && commonStyles.categoryPillActive, filters.category === cat.id && themeStyles.categoryPillActive)}>
                  <Icon size={16} /><span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className={commonStyles.mainLayout}>
          {/* Sidebar Desktop */}
          <aside className={cn(commonStyles.sidebar, themeStyles.sidebar)}>
            <div className={cn(commonStyles.sidebarCard, themeStyles.sidebarCard)}>
              <h3 className={cn(commonStyles.sidebarTitle, themeStyles.sidebarTitle)}><Filter size={18} /> Filters</h3>
              {renderFilters()}
            </div>
          </aside>

          {/* Content */}
          <div className={commonStyles.contentArea}>
            {/* Toolbar */}
            <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
              <div className={cn(commonStyles.resultCount, themeStyles.resultCount)}>
                <strong>{filteredProjects.length}</strong> jobs found
                {filters.search && <span> for &ldquo;{filters.search}&rdquo;</span>}
              </div>
              <div className={commonStyles.toolbarActions}>
                <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className={cn(commonStyles.sortSelect, themeStyles.sortSelect)} aria-label="Sort results">
                  {SORT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
                <div className={cn(commonStyles.viewToggle, themeStyles.viewToggle)}>
                  <button onClick={() => setViewMode('list')} className={cn(commonStyles.viewBtn, themeStyles.viewBtn, viewMode === 'list' && commonStyles.viewBtnActive, viewMode === 'list' && themeStyles.viewBtnActive)} aria-label="List view"><List size={18} /></button>
                  <button onClick={() => setViewMode('grid')} className={cn(commonStyles.viewBtn, themeStyles.viewBtn, viewMode === 'grid' && commonStyles.viewBtnActive, viewMode === 'grid' && themeStyles.viewBtnActive)} aria-label="Grid view"><Grid3X3 size={18} /></button>
                </div>
              </div>
            </div>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <div className={commonStyles.activeFilters}>
                {filters.category !== 'all' && <span className={cn(commonStyles.activeTag, themeStyles.activeTag)}>{CATEGORIES.find(c => c.id === filters.category)?.name}<button onClick={() => handleFilterChange('category', 'all')} aria-label="Remove category filter"><X size={12} /></button></span>}
                {filters.experience !== 'all' && <span className={cn(commonStyles.activeTag, themeStyles.activeTag)}>{EXPERIENCE_LEVELS.find(e => e.id === filters.experience)?.label}<button onClick={() => handleFilterChange('experience', 'all')} aria-label="Remove experience filter"><X size={12} /></button></span>}
                {filters.budgetRange !== 'all' && <span className={cn(commonStyles.activeTag, themeStyles.activeTag)}>{BUDGET_RANGES.find(b => b.id === filters.budgetRange)?.label}<button onClick={() => handleFilterChange('budgetRange', 'all')} aria-label="Remove budget filter"><X size={12} /></button></span>}
                {filters.budgetType !== 'all' && <span className={cn(commonStyles.activeTag, themeStyles.activeTag)}>{filters.budgetType === 'fixed' ? 'Fixed Price' : 'Hourly'}<button onClick={() => handleFilterChange('budgetType', 'all')} aria-label="Remove type filter"><X size={12} /></button></span>}
                {filters.duration !== 'all' && <span className={cn(commonStyles.activeTag, themeStyles.activeTag)}>{DURATION_OPTIONS.find(d => d.id === filters.duration)?.label}<button onClick={() => handleFilterChange('duration', 'all')} aria-label="Remove duration filter"><X size={12} /></button></span>}
                <button className={cn(commonStyles.clearAllBtn, themeStyles.clearAllBtn)} onClick={handleClearFilters}>Clear all</button>
              </div>
            )}

            {/* Job Cards */}
            {loading ? (
              <div className={commonStyles.skeletonGrid}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn(commonStyles.skeletonCard, themeStyles.skeletonCard)}>
                    <div className={cn(commonStyles.skeletonLine, themeStyles.skeletonLine, commonStyles.skeletonTitle)} />
                    <div className={cn(commonStyles.skeletonLine, themeStyles.skeletonLine, commonStyles.skeletonMeta)} />
                    <div className={cn(commonStyles.skeletonLine, themeStyles.skeletonLine, commonStyles.skeletonDesc)} />
                    <div className={commonStyles.skeletonTags}>
                      {[...Array(3)].map((_, j) => <div key={j} className={cn(commonStyles.skeletonTag, themeStyles.skeletonTag)} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
                <div className="w-full flex justify-center py-12">
                  <EmptyState 
                    title="Something went wrong" 
                    description={error}
                    icon={<Shield size={48} />}
                    action={<Button variant="primary" size="md" onClick={fetchProjects}>Retry</Button>}
                  />
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="w-full flex justify-center py-12">
                  <EmptyState 
                    title="No jobs found" 
                    description="Try adjusting your search or filter criteria."
                    icon={<Briefcase size={48} />}
                    action={<Button variant="outline" size="md" onClick={handleClearFilters}><RefreshCw size={16} /> Clear all filters</Button>}
                  />
              </div>
            ) : (
              <StaggerContainer className={cn(viewMode === 'list' ? commonStyles.jobsList : commonStyles.jobsGrid)}>
                {filteredProjects.map(project => (
                  <StaggerItem key={project.id}>
                    <Link href={`/jobs/${project.id}`} className={cn(commonStyles.card, themeStyles.card)} aria-label={`View ${project.title}`}>
                      <div className={commonStyles.cardTop}>
                        <div className={commonStyles.cardTopLeft}>
                          <h3 className={cn(commonStyles.jobTitle, themeStyles.jobTitle)}>{project.title}</h3>
                          <div className={commonStyles.cardMeta}>
                            <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}><Clock size={14} /> {formatTimeAgo(project.created_at)}</span>
                            {project.category && <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}><Tag size={14} /> {project.category}</span>}
                            {project.experience_level && <span className={cn(commonStyles.experienceBadge, themeStyles.experienceBadge)}>{project.experience_level}</span>}
                          </div>
                        </div>
                        <div className={cn(commonStyles.budget, themeStyles.budget)}><DollarSign size={16} /><span>{formatBudget(project)}</span></div>
                      </div>
                      <p className={cn(commonStyles.description, themeStyles.description)}>{project.description}</p>
                      <div className={commonStyles.tags}>
                        {(project.skills || []).slice(0, 6).map((skill, idx) => <span key={idx} className={cn(commonStyles.tag, themeStyles.tag)}>{skill}</span>)}
                        {(project.skills || []).length > 6 && <span className={cn(commonStyles.tag, commonStyles.tagMore, themeStyles.tagMore)}>+{project.skills.length - 6} more</span>}
                      </div>
                      <div className={cn(commonStyles.cardFooter, themeStyles.cardFooter)}>
                        <div className={commonStyles.footerLeft}>
                          <span className={cn(commonStyles.footerItem, themeStyles.footerItem)}><Briefcase size={14} />{project.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price'}</span>
                          {project.estimated_duration && <span className={cn(commonStyles.footerItem, themeStyles.footerItem)}><Clock size={14} />{project.estimated_duration}</span>}
                        </div>
                        <Button variant="primary" size="sm" tabIndex={-1}>Apply Now</Button>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Pagination */}
            {!loading && filteredProjects.length > 0 && totalPages > 1 && (
              <nav className={cn(commonStyles.pagination, themeStyles.pagination)} aria-label="Job listing pages">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={cn(commonStyles.pageBtn, themeStyles.pageBtn)} aria-label="Previous page"><ChevronLeft size={18} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (currentPage <= 4) pageNum = i + 1;
                  else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = currentPage - 3 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={cn(commonStyles.pageBtn, themeStyles.pageBtn, currentPage === pageNum && commonStyles.pageBtnActive, currentPage === pageNum && themeStyles.pageBtnActive)} aria-label={`Page ${pageNum}`} aria-current={currentPage === pageNum ? 'page' : undefined}>{pageNum}</button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={cn(commonStyles.pageBtn, themeStyles.pageBtn)} aria-label="Next page"><ChevronRight size={18} /></button>
              </nav>
            )}
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className={commonStyles.mobileOverlay}>
            <div className={commonStyles.mobileBackdrop} onClick={() => setShowMobileFilters(false)} />
            <div className={cn(commonStyles.mobilePanel, themeStyles.mobilePanel)}>
              <div className={cn(commonStyles.mobilePanelHeader, themeStyles.mobilePanelHeader)}>
                <h3>Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} aria-label="Close filters"><X size={20} /></button>
              </div>
              <div className={commonStyles.mobilePanelBody}>{renderFilters()}</div>
              <div className={cn(commonStyles.mobilePanelFooter, themeStyles.mobilePanelFooter)}>
                <Button variant="ghost" size="md" onClick={handleClearFilters}>Clear all</Button>
                <Button variant="primary" size="md" onClick={() => setShowMobileFilters(false)}>Show {filteredProjects.length} results</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default PublicJobs;
