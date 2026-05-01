// @AI-HINT: Unified Explore page - search freelancers and projects by category or query
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import {
  Search,
  MapPin,
  Star,
  X,
  SlidersHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  DollarSign,
  Code,
  Palette,
  Smartphone,
  BarChart3,
  PenTool,
  Video,
  Users,
  Briefcase,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import common from './Explore.common.module.css';
import light from './Explore.light.module.css';
import dark from './Explore.dark.module.css';

// Categories matching Hero component
const CATEGORIES = [
  { id: 'all', name: 'All', slug: 'all', icon: Grid3X3 },
  { id: 'web-development', name: 'Web Development', slug: 'web-development', icon: Code },
  { id: 'ui-ux-design', name: 'UI/UX Design', slug: 'ui-ux-design', icon: Palette },
  { id: 'mobile-apps', name: 'Mobile Apps', slug: 'mobile-apps', icon: Smartphone },
  { id: 'data-science', name: 'Data Science', slug: 'data-science', icon: BarChart3 },
  { id: 'content-writing', name: 'Content Writing', slug: 'content-writing', icon: PenTool },
  { id: 'video-animation', name: 'Video & Animation', slug: 'video-animation', icon: Video },
];

const RESULT_TYPES = [
  { id: 'all', label: 'All Results' },
  { id: 'freelancers', label: 'Freelancers' },
  { id: 'projects', label: 'Projects' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most Relevant' },
  { id: 'rating_high', label: 'Top Rated' },
  { id: 'newest', label: 'Newest First' },
];

const PAGE_SIZE = 20;

interface Freelancer {
  id: string;
  name: string;
  title: string;
  hourlyRate: number;
  skills: string[];
  rating: number;
  location: string;
  avatarUrl?: string;
  profileSlug?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  budgetType: 'fixed' | 'hourly';
  skills: string[];
  category: string;
  createdAt: string;
  proposalCount?: number;
}

interface Filters {
  query: string;
  category: string;
  resultType: string;
  sortBy: string;
}

const Explore: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    resultType: searchParams.get('type') || 'all',
    sortBy: searchParams.get('sort') || 'relevance',
  });

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);

  const themed = resolvedTheme === 'dark' ? dark : light;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.query]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.resultType !== 'all') params.set('type', filters.resultType);
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    const newUrl = params.toString() ? `/explore?${params.toString()}` : '/explore';
    window.history.replaceState({}, '', newUrl);
  }, [filters, currentPage]);

  // Fetch data
  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters.category, filters.resultType, filters.sortBy, currentPage]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchQuery = debouncedQuery || (filters.category !== 'all' ? filters.category.replace(/-/g, ' ') : '');

      // Fetch freelancers
      if (filters.resultType === 'all' || filters.resultType === 'freelancers') {
        try {
          const res = await api.search.freelancers(searchQuery, { page_size: PAGE_SIZE }) as any;
          const data = Array.isArray(res) ? res : (res?.freelancers || res?.results || []);
          const mapped: Freelancer[] = data.map((f: any) => {
            let skillsArray: string[] = [];
            if (Array.isArray(f.skills)) {
              skillsArray = f.skills.map((s: any) => String(s).trim()).filter(Boolean);
            } else if (typeof f.skills === 'string' && f.skills) {
              try {
                const parsed = JSON.parse(f.skills);
                if (Array.isArray(parsed)) skillsArray = parsed;
              } catch {
                skillsArray = f.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
              }
            }
            return {
              id: String(f.id),
              name: f.name || f.full_name || 'Unknown',
              title: f.headline || f.title || f.bio?.substring(0, 80) || 'Freelancer',
              hourlyRate: f.hourly_rate || f.hourlyRate || 0,
              skills: skillsArray,
              rating: f.rating || 4.5,
              location: f.location || 'Remote',
              avatarUrl: f.profile_image_url || f.avatarUrl,
              profileSlug: f.profile_slug || f.id,
            };
          });
          setFreelancers(mapped);
        } catch (err) {
          if (process.env.NODE_ENV === 'development') console.error('Freelancer search error:', err);
          setFreelancers([]);
        }
      } else {
        setFreelancers([]);
      }

      // Fetch projects
      if (filters.resultType === 'all' || filters.resultType === 'projects') {
        try {
          const res = await api.search.projects(searchQuery, {
            category: filters.category !== 'all' ? filters.category : undefined,
            page_size: PAGE_SIZE,
          }) as any;
          const data = Array.isArray(res) ? res : (res?.projects || res?.results || []);
          const mapped: Project[] = data.map((p: any) => {
            let skillsArray: string[] = [];
            if (Array.isArray(p.skills)) {
              skillsArray = p.skills.map((s: any) => String(s).trim()).filter(Boolean);
            } else if (typeof p.skills === 'string' && p.skills) {
              try {
                const parsed = JSON.parse(p.skills);
                if (Array.isArray(parsed)) skillsArray = parsed;
              } catch {
                skillsArray = p.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
              }
            }
            return {
              id: String(p.id),
              title: p.title || 'Untitled Project',
              description: p.description || '',
              budget: p.budget || p.budget_min || 0,
              budgetType: p.budget_type || 'fixed',
              skills: skillsArray,
              category: p.category || 'General',
              createdAt: p.created_at || new Date().toISOString(),
              proposalCount: p.proposal_count || 0,
            };
          });
          setProjects(mapped);
        } catch (err) {
          if (process.env.NODE_ENV === 'development') console.error('Project search error:', err);
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Search error:', err);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'query') setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ query: '', category: 'all', resultType: 'all', sortBy: 'relevance' });
    setCurrentPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.resultType !== 'all') count++;
    return count;
  }, [filters]);

  const totalResults = freelancers.length + projects.length;
  const currentCategory = CATEGORIES.find(c => c.slug === filters.category);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition>
      <div className={cn(common.page, themed.page)}>
        {/* 3D Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
          <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
          <ParticlesSystem count={12} className="absolute inset-0" />
          <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
            <FloatingCube size={40} />
          </div>
          <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
            <FloatingSphere size={30} variant="gradient" />
          </div>
        </div>

        {/* Header */}
        <ScrollReveal>
          <header className={cn(common.header, themed.header)}>
            <span className={cn(common.badge, themed.badge)}>
              {currentCategory && currentCategory.id !== 'all' ? currentCategory.name : 'Explore'}
            </span>
            <h1 className={cn(common.title, themed.title)}>
              {filters.query
                ? `Results for "${filters.query}"`
                : currentCategory && currentCategory.id !== 'all'
                  ? `${currentCategory.name} Talent & Projects`
                  : 'Explore Freelancers & Projects'}
            </h1>
            <p className={cn(common.subtitle, themed.subtitle)}>
              {totalResults > 0
                ? `${totalResults} results found. Find the perfect match for your needs.`
                : 'Search for freelancers, projects, and opportunities.'}
            </p>

            {/* Search Bar */}
            <div className={common.searchSection}>
              <div className={cn(common.searchBar, themed.searchBar)}>
                <Search className={common.searchIcon} size={20} />
                <input
                  type="text"
                  placeholder='Search for "React developer", "Logo design", "SEO expert"...'
                  value={filters.query}
                  onChange={e => handleFilterChange('query', e.target.value)}
                  className={cn(common.searchInput, themed.searchInput)}
                  aria-label="Search"
                />
                {filters.query && (
                  <button
                    onClick={() => handleFilterChange('query', '')}
                    className={common.searchClear}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                className={cn(common.mobileFilterBtn, themed.mobileFilterBtn)}
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal size={18} /> Filters
                {activeFiltersCount > 0 && (
                  <span className={cn(common.filterBadge, themed.filterBadge)}>{activeFiltersCount}</span>
                )}
              </button>
            </div>
          </header>
        </ScrollReveal>

        {/* Category Pills */}
        <div className={common.categoriesSection}>
          <div className={common.categoriesScroll}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange('category', cat.slug)}
                  className={cn(
                    common.categoryPill,
                    themed.categoryPill,
                    filters.category === cat.slug && common.categoryPillActive,
                    filters.category === cat.slug && themed.categoryPillActive
                  )}
                >
                  <Icon size={16} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className={common.mainLayout}>
          {/* Sidebar */}
          <aside className={cn(common.sidebar, themed.sidebar)}>
            <div className={cn(common.sidebarCard, themed.sidebarCard)}>
              <h3 className={cn(common.sidebarTitle, themed.sidebarTitle)}>
                <Filter size={18} /> Filters
              </h3>

              {/* Result Type */}
              <div className={common.filterGroup}>
                <h4 className={cn(common.filterLabel, themed.filterLabel)}>Show</h4>
                <div className={common.filterOptions}>
                  {RESULT_TYPES.map(type => (
                    <label key={type.id} className={cn(common.filterOption, themed.filterOption)}>
                      <input
                        type="radio"
                        name="resultType"
                        checked={filters.resultType === type.id}
                        onChange={() => handleFilterChange('resultType', type.id)}
                        className={common.filterRadio}
                      />
                      <span className={cn(
                        common.filterRadioCustom,
                        themed.filterRadioCustom,
                        filters.resultType === type.id && common.filterRadioActive
                      )} />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  className={cn(common.clearFilters, themed.clearFilters)}
                  onClick={handleClearFilters}
                >
                  <RefreshCw size={14} /> Clear all filters
                </button>
              )}
            </div>

            {/* Quick Links */}
            <div className={cn(common.sidebarCard, themed.sidebarCard)}>
              <h3 className={cn(common.sidebarTitle, themed.sidebarTitle)}>Quick Links</h3>
              <div className={common.quickLinks}>
                <Link href="/freelancers" className={cn(common.quickLink, themed.quickLink)}>
                  <Users size={16} /> Browse All Freelancers
                </Link>
                <Link href="/jobs" className={cn(common.quickLink, themed.quickLink)}>
                  <Briefcase size={16} /> Browse All Projects
                </Link>
                <Link href="/gigs" className={cn(common.quickLink, themed.quickLink)}>
                  <Grid3X3 size={16} /> Browse Gigs
                </Link>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className={common.contentArea}>
            {/* Toolbar */}
            <div className={cn(common.toolbar, themed.toolbar)}>
              <div className={cn(common.resultCount, themed.resultCount)}>
                <strong>{totalResults}</strong> results found
              </div>
              <div className={common.toolbarActions}>
                <select
                  value={filters.sortBy}
                  onChange={e => handleFilterChange('sortBy', e.target.value)}
                  className={cn(common.sortSelect, themed.sortSelect)}
                  aria-label="Sort results"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <div className={cn(common.viewToggle, themed.viewToggle)}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      common.viewBtn,
                      themed.viewBtn,
                      viewMode === 'grid' && common.viewBtnActive,
                      viewMode === 'grid' && themed.viewBtnActive
                    )}
                    aria-label="Grid view"
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      common.viewBtn,
                      themed.viewBtn,
                      viewMode === 'list' && common.viewBtnActive,
                      viewMode === 'list' && themed.viewBtnActive
                    )}
                    aria-label="List view"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className={common.skeletonGrid}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={cn(common.skeletonCard, themed.skeletonCard)}>
                    <div className={cn(common.skeletonAvatar, themed.skeletonAvatar)} />
                    <div className={cn(common.skeletonLine, common.skeletonShort, themed.skeletonLine)} />
                    <div className={cn(common.skeletonLine, common.skeletonLong, themed.skeletonLine)} />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="w-full flex justify-center py-12">
                <EmptyState 
                  title="Something went wrong" 
                  description={error}
                  icon={<Users size={48} />}
                  action={
                    <Button variant="primary" size="md" onClick={fetchResults}>
                      Retry
                    </Button>
                  }
                />
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && totalResults === 0 && (
              <div className="w-full flex justify-center py-12">
                <EmptyState 
                  title="No results found" 
                  description="Try adjusting your search terms or browse by category."
                  icon={<Search size={48} />}
                  action={
                    <Button variant="outline" size="md" onClick={handleClearFilters}>
                      <RefreshCw size={16} /> Clear filters
                    </Button>
                  }
                />
              </div>
            )}

            {/* Results */}
            {!loading && !error && totalResults > 0 && (
              <>
                {/* Freelancers Section */}
                {freelancers.length > 0 && (
                  <section className={common.resultSection}>
                    <div className={cn(common.sectionHeader, themed.sectionHeader)}>
                      <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                        <Users size={20} /> Freelancers ({freelancers.length})
                      </h2>
                      <Link href="/freelancers" className={cn(common.seeAllLink, themed.seeAllLink)}>
                        See all <ArrowRight size={14} />
                      </Link>
                    </div>
                    <StaggerContainer className={cn(viewMode === 'grid' ? common.grid : common.listView)}>
                      {freelancers.slice(0, 8).map(f => (
                        <StaggerItem key={f.id}>
                          <Link
                            href={`/freelancers/${f.profileSlug || f.id}`}
                            className={cn(common.freelancerCard, themed.freelancerCard)}
                          >
                            <div className={common.cardHeader}>
                              <img
                                src={f.avatarUrl || '/images/default-avatar.svg'}
                                alt={f.name}
                                className={common.avatar}
                                loading="lazy"
                                width={56}
                                height={56}
                              />
                              <div className={common.cardInfo}>
                                <h3 className={cn(common.name, themed.name)}>{f.name}</h3>
                                <p className={cn(common.role, themed.role)}>{f.title}</p>
                              </div>
                            </div>
                            <div className={common.skills}>
                              {f.skills.slice(0, 3).map(s => (
                                <span key={s} className={cn(common.skill, themed.skill)}>{s}</span>
                              ))}
                              {f.skills.length > 3 && (
                                <span className={cn(common.skill, common.skillMore, themed.skillMore)}>
                                  +{f.skills.length - 3}
                                </span>
                              )}
                            </div>
                            <div className={common.cardFooter}>
                              <span className={cn(common.rate, themed.rate)}>
                                <DollarSign size={14} />${f.hourlyRate}/hr
                              </span>
                              <span className={cn(common.rating, themed.rating)}>
                                <Star size={14} fill="var(--ml-yellow)" color="var(--ml-yellow)" />
                                {f.rating.toFixed(1)}
                              </span>
                              <span className={cn(common.location, themed.location)}>
                                <MapPin size={14} />{f.location}
                              </span>
                            </div>
                          </Link>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </section>
                )}

                {/* Projects Section */}
                {projects.length > 0 && (
                  <section className={common.resultSection}>
                    <div className={cn(common.sectionHeader, themed.sectionHeader)}>
                      <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
                        <Briefcase size={20} /> Projects ({projects.length})
                      </h2>
                      <Link href="/jobs" className={cn(common.seeAllLink, themed.seeAllLink)}>
                        See all <ArrowRight size={14} />
                      </Link>
                    </div>
                    <StaggerContainer className={common.projectsList}>
                      {projects.slice(0, 6).map(p => (
                        <StaggerItem key={p.id}>
                          <Link
                            href={`/jobs/${p.id}`}
                            className={cn(common.projectCard, themed.projectCard)}
                          >
                            <div className={common.projectHeader}>
                              <h3 className={cn(common.projectTitle, themed.projectTitle)}>{p.title}</h3>
                              <span className={cn(common.projectBudget, themed.projectBudget)}>
                                ${p.budget.toLocaleString()}
                                {p.budgetType === 'hourly' && '/hr'}
                              </span>
                            </div>
                            <p className={cn(common.projectDescription, themed.projectDescription)}>
                              {p.description.length > 150
                                ? p.description.substring(0, 150) + '...'
                                : p.description}
                            </p>
                            <div className={common.skills}>
                              {p.skills.slice(0, 4).map(s => (
                                <span key={s} className={cn(common.skill, themed.skill)}>{s}</span>
                              ))}
                            </div>
                            <div className={common.projectMeta}>
                              <span className={cn(common.projectMetaItem, themed.projectMetaItem)}>
                                <Clock size={14} /> {formatDate(p.createdAt)}
                              </span>
                              <span className={cn(common.projectMetaItem, themed.projectMetaItem)}>
                                <Users size={14} /> {p.proposalCount} proposals
                              </span>
                            </div>
                          </Link>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </section>
                )}
              </>
            )}

            {/* Pagination */}
            {!loading && totalResults > PAGE_SIZE && (
              <nav className={cn(common.pagination, themed.pagination)} aria-label="Results pages">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(common.pageBtn, themed.pageBtn)}
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className={common.pageInfo}>Page {currentPage}</span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={cn(common.pageBtn, themed.pageBtn)}
                  aria-label="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className={common.mobileOverlay}>
            <div className={common.mobileBackdrop} onClick={() => setShowMobileFilters(false)} />
            <div className={cn(common.mobilePanel, themed.mobilePanel)}>
              <div className={cn(common.mobilePanelHeader, themed.mobilePanelHeader)}>
                <h3>Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <div className={common.mobilePanelBody}>
                {/* Result Type */}
                <div className={common.filterGroup}>
                  <h4 className={cn(common.filterLabel, themed.filterLabel)}>Show</h4>
                  <div className={common.filterOptions}>
                    {RESULT_TYPES.map(type => (
                      <label key={type.id} className={cn(common.filterOption, themed.filterOption)}>
                        <input
                          type="radio"
                          name="mobileResultType"
                          checked={filters.resultType === type.id}
                          onChange={() => handleFilterChange('resultType', type.id)}
                          className={common.filterRadio}
                        />
                        <span className={cn(
                          common.filterRadioCustom,
                          themed.filterRadioCustom,
                          filters.resultType === type.id && common.filterRadioActive
                        )} />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className={cn(common.mobilePanelFooter, themed.mobilePanelFooter)}>
                <Button variant="ghost" size="md" onClick={handleClearFilters}>Clear all</Button>
                <Button variant="primary" size="md" onClick={() => setShowMobileFilters(false)}>
                  Show {totalResults} results
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Explore;
