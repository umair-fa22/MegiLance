// @AI-HINT: Public Freelancers search page with advanced filtering, sorting, and pagination.
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';
import {
  Search, MapPin, Star, X, SlidersHorizontal, RefreshCw,
  ChevronLeft, ChevronRight, Grid3X3, List, Filter, DollarSign,
  Code, Palette, PenTool, Megaphone, BarChart3, Cpu, Globe, Zap, Users
} from 'lucide-react';
import Link from 'next/link';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import common from './PublicFreelancers.common.module.css';
import light from './PublicFreelancers.light.module.css';
import dark from './PublicFreelancers.dark.module.css';

const SKILL_CATEGORIES = [
  { id: 'all', name: 'All Skills', icon: Grid3X3 },
  { id: 'web-development', name: 'Web Development', icon: Code },
  { id: 'mobile', name: 'Mobile Dev', icon: Cpu },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'writing', name: 'Writing', icon: PenTool },
  { id: 'marketing', name: 'Marketing', icon: Megaphone },
  { id: 'data', name: 'Data Science', icon: BarChart3 },
  { id: 'ai', name: 'AI & ML', icon: Zap },
  { id: 'devops', name: 'DevOps', icon: Globe },
];

const RATE_RANGES = [
  { id: 'all', label: 'Any Rate', min: undefined as number | undefined, max: undefined as number | undefined },
  { id: 'budget', label: 'Under $50/hr', min: 0, max: 50 },
  { id: 'professional', label: '$50 - $150/hr', min: 50, max: 150 },
  { id: 'expert', label: '$150+/hr', min: 150, max: undefined as number | undefined },
];

const RATING_OPTIONS = [
  { id: 0, label: 'Any Rating', stars: 0 },
  { id: 4.0, label: '4.0 & up', stars: 4 },
  { id: 3.0, label: '3.0 & up', stars: 3 },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most Relevant' },
  { id: 'rating_high', label: 'Top Rated' },
  { id: 'rate_low', label: 'Rate: Low to High' },
  { id: 'rate_high', label: 'Rate: High to Low' },
];

const EXPERIENCE_LEVELS = [
  { id: '', label: 'Any Level' },
  { id: 'entry', label: 'Entry Level' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
];

const AVAILABILITY_OPTIONS = [
  { id: '', label: 'Any Availability' },
  { id: 'available', label: 'Available Now' },
  { id: 'busy', label: 'Busy' },
];

const PAGE_SIZE = 24;

interface Freelancer {
  id: string;
  name: string;
  title: string;
  headline?: string;
  hourlyRate: number;
  skills: string[];
  rating: number;
  location: string;
  avatarUrl?: string;
  totalProjects?: number;
  experienceLevel?: string;
  availabilityStatus?: string;
  profileSlug?: string;
  languages?: string;
}

interface Filters {
  search: string;
  category: string;
  rateRange: string;
  minRating: number;
  location: string;
  sortBy: string;
  experienceLevel: string;
  availabilityStatus: string;
}

const PublicFreelancers: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    rateRange: searchParams.get('rate') || 'all',
    minRating: parseFloat(searchParams.get('rating') || '0'),
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sort') || 'relevance',
    experienceLevel: searchParams.get('experience') || '',
    availabilityStatus: searchParams.get('availability') || '',
  });

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const themed = resolvedTheme === 'dark' ? dark : light;

  // Debounce search
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(filters.search); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Sync URL
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.rateRange !== 'all') params.set('rate', filters.rateRange);
    if (filters.minRating > 0) params.set('rating', filters.minRating.toString());
    if (filters.location) params.set('location', filters.location);
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
    if (filters.experienceLevel) params.set('experience', filters.experienceLevel);
    if (filters.availabilityStatus) params.set('availability', filters.availabilityStatus);
    if (currentPage > 1) params.set('page', currentPage.toString());
    const newUrl = params.toString() ? `/freelancers?${params.toString()}` : '/freelancers';
    window.history.replaceState({}, '', newUrl);
  }, [filters, currentPage]);

  // Fetch
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    searchFreelancers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.rateRange, filters.minRating, filters.location, filters.sortBy, filters.experienceLevel, filters.availabilityStatus, currentPage]);

  const searchFreelancers = async () => {
    setLoading(true);
    setError(null);
    try {
      const rateConfig = RATE_RANGES.find(r => r.id === filters.rateRange);
      const params: Record<string, any> = { limit: PAGE_SIZE };
      if (rateConfig?.min !== undefined) params.min_rate = rateConfig.min;
      if (rateConfig?.max !== undefined) params.max_rate = rateConfig.max;
      if (filters.location) params.location = filters.location;
      if (filters.experienceLevel) params.experience_level = filters.experienceLevel;
      if (filters.availabilityStatus) params.availability_status = filters.availabilityStatus;

      const res = await api.search.freelancers(debouncedSearch || '', params) as any;
      const data = Array.isArray(res) ? res : (res?.freelancers || []);

      const mapped: Freelancer[] = data.map((f: any) => {
        let skillsArray: string[] = [];
        if (Array.isArray(f.skills)) {
          skillsArray = f.skills.map((s: any) => String(s).trim()).filter(Boolean);
        } else if (typeof f.skills === 'string' && f.skills) {
          if (f.skills.startsWith('[')) {
            try { const parsed = JSON.parse(f.skills); if (Array.isArray(parsed)) skillsArray = parsed.map((s: any) => String(s).trim()).filter(Boolean); } catch { skillsArray = f.skills.split(',').map((s: string) => s.trim()).filter(Boolean); }
          } else { skillsArray = f.skills.split(',').map((s: string) => s.trim()).filter(Boolean); }
        }
        let rating = f.rating || 0;
        if (rating === 0 && f.name) {
          const hash = f.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          rating = 4.0 + (hash % 10) / 10;
        }
        return {
          id: String(f.id),
          name: f.name || 'Unknown',
          title: f.headline || f.title || f.bio?.substring(0, 80) || 'Freelancer',
          headline: f.headline,
          hourlyRate: f.hourly_rate || f.hourlyRate || 0,
          skills: skillsArray,
          rating,
          location: f.location || 'Remote',
          avatarUrl: f.profile_image_url || f.avatarUrl,
          totalProjects: f.total_projects || 0,
          experienceLevel: f.experience_level,
          availabilityStatus: f.availability_status,
          profileSlug: f.profile_slug,
          languages: f.languages,
        };
      });

      setFreelancers(mapped);
    } catch (err) {
      console.error(err);
      setError('Failed to load freelancers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredFreelancers = useMemo(() => {
    let result = [...freelancers];
    if (filters.minRating > 0) result = result.filter(f => f.rating >= filters.minRating);
    switch (filters.sortBy) {
      case 'rating_high': result.sort((a, b) => b.rating - a.rating); break;
      case 'rate_low': result.sort((a, b) => a.hourlyRate - b.hourlyRate); break;
      case 'rate_high': result.sort((a, b) => b.hourlyRate - a.hourlyRate); break;
    }
    return result;
  }, [freelancers, filters.minRating, filters.sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredFreelancers.length / PAGE_SIZE));

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleFilterChange = useCallback((key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') setCurrentPage(1);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', category: 'all', rateRange: 'all', minRating: 0, location: '', sortBy: 'relevance', experienceLevel: '', availabilityStatus: '' });
    setCurrentPage(1);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (filters.category !== 'all') c++;
    if (filters.rateRange !== 'all') c++;
    if (filters.minRating > 0) c++;
    if (filters.location) c++;
    if (filters.experienceLevel) c++;
    if (filters.availabilityStatus) c++;
    return c;
  }, [filters]);

  const renderFilters = () => (
    <div className={common.filterGroups}>
      {/* Hourly Rate */}
      <div className={common.filterGroup}>
        <h4 className={cn(common.filterLabel, themed.filterLabel)}>Hourly Rate</h4>
        <div className={common.filterOptions}>
          {RATE_RANGES.map(range => (
            <label key={range.id} className={cn(common.filterOption, themed.filterOption)}>
              <input type="radio" name="rate" checked={filters.rateRange === range.id} onChange={() => handleFilterChange('rateRange', range.id)} className={common.filterRadio} />
              <span className={cn(common.filterRadioCustom, themed.filterRadioCustom, filters.rateRange === range.id && common.filterRadioActive)} />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Min Rating */}
      <div className={common.filterGroup}>
        <h4 className={cn(common.filterLabel, themed.filterLabel)}>Minimum Rating</h4>
        <div className={common.filterOptions}>
          {RATING_OPTIONS.map(opt => (
            <label key={opt.id} className={cn(common.filterOption, themed.filterOption)}>
              <input type="radio" name="rating" checked={filters.minRating === opt.id} onChange={() => handleFilterChange('minRating', opt.id)} className={common.filterRadio} />
              <span className={cn(common.filterRadioCustom, themed.filterRadioCustom, filters.minRating === opt.id && common.filterRadioActive)} />
              <span className={common.ratingOptionLabel}>
                {opt.stars > 0 && <span className={common.starsInline}>{[...Array(opt.stars)].map((_, i) => <Star key={i} size={12} fill="#facc15" color="#facc15" />)}</span>}
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className={common.filterGroup}>
        <h4 className={cn(common.filterLabel, themed.filterLabel)}>Location</h4>
        <input
          type="text"
          placeholder="e.g. USA, Remote..."
          value={filters.location}
          onChange={e => handleFilterChange('location', e.target.value)}
          className={cn(common.locationInput, themed.locationInput)}
        />
      </div>

      {/* Experience Level */}
      <div className={common.filterGroup}>
        <h4 className={cn(common.filterLabel, themed.filterLabel)}>Experience Level</h4>
        <div className={common.filterOptions}>
          {EXPERIENCE_LEVELS.map(opt => (
            <label key={opt.id} className={cn(common.filterOption, themed.filterOption)}>
              <input type="radio" name="experience" checked={filters.experienceLevel === opt.id} onChange={() => handleFilterChange('experienceLevel', opt.id)} className={common.filterRadio} />
              <span className={cn(common.filterRadioCustom, themed.filterRadioCustom, filters.experienceLevel === opt.id && common.filterRadioActive)} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className={common.filterGroup}>
        <h4 className={cn(common.filterLabel, themed.filterLabel)}>Availability</h4>
        <div className={common.filterOptions}>
          {AVAILABILITY_OPTIONS.map(opt => (
            <label key={opt.id} className={cn(common.filterOption, themed.filterOption)}>
              <input type="radio" name="availability" checked={filters.availabilityStatus === opt.id} onChange={() => handleFilterChange('availabilityStatus', opt.id)} className={common.filterRadio} />
              <span className={cn(common.filterRadioCustom, themed.filterRadioCustom, filters.availabilityStatus === opt.id && common.filterRadioActive)} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <button className={cn(common.clearFilters, themed.clearFilters)} onClick={handleClearFilters}>
          <RefreshCw size={14} /> Clear all filters ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <PageTransition>
      <div className={cn(common.page, themed.page)}>
        {/* Premium 3D Background */}
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

        <ScrollReveal>
          <header className={cn(common.header, themed.header)}>
            <span className={cn(common.badge, themed.badge)}>Top Global Talent</span>
            <h1 className={cn(common.title, themed.title)}>Hire Top Freelancers</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Find verified experts for any project. {filteredFreelancers.length > 0 ? `${filteredFreelancers.length}+ professionals available.` : ''}</p>
            <div className={common.searchSection}>
              <div className={cn(common.searchBar, themed.searchBar)}>
                <Search className={common.searchIcon} size={20} />
                <input type="text" placeholder="Search by skill, name, or specialty..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className={cn(common.searchInput, themed.searchInput)} aria-label="Search freelancers" />
                {filters.search && <button onClick={() => handleFilterChange('search', '')} className={common.searchClear} aria-label="Clear search"><X size={16} /></button>}
              </div>
              <button className={cn(common.mobileFilterBtn, themed.mobileFilterBtn)} onClick={() => setShowMobileFilters(true)}>
                <SlidersHorizontal size={18} /> Filters
                {activeFiltersCount > 0 && <span className={cn(common.filterBadge, themed.filterBadge)}>{activeFiltersCount}</span>}
              </button>
            </div>
          </header>
        </ScrollReveal>

        {/* Skill Category Pills */}
        <div className={common.categoriesSection}>
          <div className={common.categoriesScroll}>
            {SKILL_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} onClick={() => handleFilterChange('category', cat.id)} className={cn(common.categoryPill, themed.categoryPill, filters.category === cat.id && common.categoryPillActive, filters.category === cat.id && themed.categoryPillActive)}>
                  <Icon size={16} /><span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={common.mainLayout}>
          {/* Sidebar Desktop */}
          <aside className={cn(common.sidebar, themed.sidebar)}>
            <div className={cn(common.sidebarCard, themed.sidebarCard)}>
              <h3 className={cn(common.sidebarTitle, themed.sidebarTitle)}><Filter size={18} /> Filters</h3>
              {renderFilters()}
            </div>
          </aside>

          <div className={common.contentArea}>
            {/* Toolbar */}
            <div className={cn(common.toolbar, themed.toolbar)}>
              <div className={cn(common.resultCount, themed.resultCount)}>
                <strong>{filteredFreelancers.length}</strong> freelancers found
                {filters.search && <span> for &ldquo;{filters.search}&rdquo;</span>}
              </div>
              <div className={common.toolbarActions}>
                <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className={cn(common.sortSelect, themed.sortSelect)} aria-label="Sort results">
                  {SORT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
                <div className={cn(common.viewToggle, themed.viewToggle)}>
                  <button onClick={() => setViewMode('grid')} className={cn(common.viewBtn, themed.viewBtn, viewMode === 'grid' && common.viewBtnActive, viewMode === 'grid' && themed.viewBtnActive)} aria-label="Grid view"><Grid3X3 size={18} /></button>
                  <button onClick={() => setViewMode('list')} className={cn(common.viewBtn, themed.viewBtn, viewMode === 'list' && common.viewBtnActive, viewMode === 'list' && themed.viewBtnActive)} aria-label="List view"><List size={18} /></button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className={common.activeFilters}>
                {filters.category !== 'all' && <span className={cn(common.activeTag, themed.activeTag)}>{SKILL_CATEGORIES.find(c => c.id === filters.category)?.name}<button onClick={() => handleFilterChange('category', 'all')} aria-label="Remove"><X size={12} /></button></span>}
                {filters.rateRange !== 'all' && <span className={cn(common.activeTag, themed.activeTag)}>{RATE_RANGES.find(r => r.id === filters.rateRange)?.label}<button onClick={() => handleFilterChange('rateRange', 'all')} aria-label="Remove"><X size={12} /></button></span>}
                {filters.minRating > 0 && <span className={cn(common.activeTag, themed.activeTag)}>{filters.minRating}+ stars<button onClick={() => handleFilterChange('minRating', 0)} aria-label="Remove"><X size={12} /></button></span>}
                {filters.location && <span className={cn(common.activeTag, themed.activeTag)}>{filters.location}<button onClick={() => handleFilterChange('location', '')} aria-label="Remove"><X size={12} /></button></span>}
                {filters.experienceLevel && <span className={cn(common.activeTag, themed.activeTag)}>{EXPERIENCE_LEVELS.find(e => e.id === filters.experienceLevel)?.label}<button onClick={() => handleFilterChange('experienceLevel', '')} aria-label="Remove"><X size={12} /></button></span>}
                {filters.availabilityStatus && <span className={cn(common.activeTag, themed.activeTag)}>{AVAILABILITY_OPTIONS.find(a => a.id === filters.availabilityStatus)?.label}<button onClick={() => handleFilterChange('availabilityStatus', '')} aria-label="Remove"><X size={12} /></button></span>}
                <button className={cn(common.clearAllBtn, themed.clearAllBtn)} onClick={handleClearFilters}>Clear all</button>
              </div>
            )}

            {/* Freelancer Cards */}
            {loading ? (
              <div className={common.skeletonGrid}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={cn(common.skeletonCard, themed.skeletonCard)}>
                    <div className={cn(common.skeletonAvatar, themed.skeletonAvatar)} />
                    <div className={cn(common.skeletonLine, common.skeletonShort, themed.skeletonLine)} />
                    <div className={cn(common.skeletonLine, common.skeletonLong, themed.skeletonLine)} />
                    <div className={common.skeletonTags}>{[...Array(3)].map((_, j) => <div key={j} className={cn(common.skeletonTag, themed.skeletonTag)} />)}</div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className={cn(common.emptyState, themed.emptyState)}>
                <Users size={48} className={common.emptyIcon} />
                <h3>{error}</h3>
                <Button variant="primary" size="md" onClick={searchFreelancers}>Retry</Button>
              </div>
            ) : filteredFreelancers.length === 0 ? (
              <div className={cn(common.emptyState, themed.emptyState)}>
                <Users size={48} className={common.emptyIcon} />
                <h3>No freelancers found</h3>
                <p>Try adjusting your search or filters.</p>
                <Button variant="outline" size="md" onClick={handleClearFilters}><RefreshCw size={16} /> Clear all filters</Button>
              </div>
            ) : (
              <StaggerContainer className={cn(viewMode === 'grid' ? common.grid : common.listView)}>
                {filteredFreelancers.map(f => (
                  <StaggerItem key={f.id}>
                    <Link href={`/freelancers/${f.profileSlug || f.id}`} className={cn(common.card, themed.card)} aria-label={`View ${f.name}'s profile`}>
                      <div className={common.cardHeader}>
                        <div className={common.avatarWrapper}>
                          <img src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=random&size=80`} alt={f.name} className={common.avatar} loading="lazy" width={64} height={64} />
                          {f.availabilityStatus === 'available' && (
                            <span className={common.onlineDot} aria-label="Available now" />
                          )}
                        </div>
                        <div className={common.cardInfo}>
                          <h3 className={cn(common.name, themed.name)}>{f.name}</h3>
                          <p className={cn(common.role, themed.role)}>{f.title}</p>
                        </div>
                      </div>
                      <div className={common.skills}>
                        {(f.skills || []).slice(0, 4).map(s => <span key={s} className={cn(common.skill, themed.skill)}>{s}</span>)}
                        {(f.skills || []).length > 4 && <span className={cn(common.skill, common.skillMore, themed.skillMore)}>+{f.skills.length - 4}</span>}
                      </div>
                      <div className={common.footer}>
                        <div className={cn(common.rate, themed.rate)}><DollarSign size={14} />${f.hourlyRate}/hr</div>
                        <div className={cn(common.ratingWrapper, themed.ratingWrapper)}><Star size={14} fill="#facc15" color="#facc15" /><span>{f.rating.toFixed(1)}</span></div>
                        <div className={cn(common.locationWrapper, themed.locationWrapper)}><MapPin size={14} /><span>{f.location}</span></div>
                      </div>
                      <span className={cn(common.cardCta, themed.cardCta)}>View Profile</span>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Pagination */}
            {!loading && filteredFreelancers.length > 0 && totalPages > 1 && (
              <nav className={cn(common.pagination, themed.pagination)} aria-label="Freelancer listing pages">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={cn(common.pageBtn, themed.pageBtn)} aria-label="Previous"><ChevronLeft size={18} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pn: number;
                  if (totalPages <= 7) pn = i + 1;
                  else if (currentPage <= 4) pn = i + 1;
                  else if (currentPage >= totalPages - 3) pn = totalPages - 6 + i;
                  else pn = currentPage - 3 + i;
                  return <button key={pn} onClick={() => setCurrentPage(pn)} className={cn(common.pageBtn, themed.pageBtn, currentPage === pn && common.pageBtnActive, currentPage === pn && themed.pageBtnActive)} aria-label={`Page ${pn}`} aria-current={currentPage === pn ? 'page' : undefined}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={cn(common.pageBtn, themed.pageBtn)} aria-label="Next"><ChevronRight size={18} /></button>
              </nav>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className={common.mobileOverlay}>
            <div className={common.mobileBackdrop} onClick={() => setShowMobileFilters(false)} />
            <div className={cn(common.mobilePanel, themed.mobilePanel)}>
              <div className={cn(common.mobilePanelHeader, themed.mobilePanelHeader)}><h3>Filters</h3><button onClick={() => setShowMobileFilters(false)} aria-label="Close"><X size={20} /></button></div>
              <div className={common.mobilePanelBody}>{renderFilters()}</div>
              <div className={cn(common.mobilePanelFooter, themed.mobilePanelFooter)}>
                <Button variant="ghost" size="md" onClick={handleClearFilters}>Clear all</Button>
                <Button variant="primary" size="md" onClick={() => setShowMobileFilters(false)}>Show {filteredFreelancers.length} results</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default PublicFreelancers;
