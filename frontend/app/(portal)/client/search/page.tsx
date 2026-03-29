// @AI-HINT: Client Search page - talent search for finding freelancers with sorting, pagination, advanced filters
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Loading from '@/app/components/atoms/Loading/Loading';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { searchingAnimation } from '@/app/components/Animations/LottieAnimation';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { searchApi } from '@/lib/api';
import {
  Search,
  Filter,
  Star,
  MapPin,
  DollarSign,
  Briefcase,
  MessageSquare,
  Heart,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Users,
} from 'lucide-react';

import commonStyles from './Search.common.module.css';
import lightStyles from './Search.light.module.css';
import darkStyles from './Search.dark.module.css';

interface Freelancer {
  id: string;
  name: string;
  title: string;
  avatar_url?: string;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  location: string;
  skills: string[];
  completed_jobs: number;
  availability?: boolean;
}

type SortOption = 'relevance' | 'rating' | 'rate_low' | 'rate_high' | 'jobs';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest Rating' },
  { value: 'rate_low', label: 'Lowest Rate' },
  { value: 'rate_high', label: 'Highest Rate' },
  { value: 'jobs', label: 'Most Jobs Completed' },
];

const ITEMS_PER_PAGE = 12;

export default function ClientSearchPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    minRate: '',
    maxRate: '',
    skills: '',
    location: '',
    minRating: '',
    availableOnly: false,
  });

  useEffect(() => { setMounted(true); }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setCurrentPage(1);
      const response = await searchApi.freelancers(searchQuery, {
        hourly_rate_min: filters.minRate ? parseFloat(filters.minRate) : undefined,
        hourly_rate_max: filters.maxRate ? parseFloat(filters.maxRate) : undefined,
        skills: filters.skills ? filters.skills.split(',').map(s => s.trim()) : undefined,
      });
      const results = Array.isArray(response) ? response : (response as any).freelancers || [];
      setFreelancers(results.map((f: any) => ({
        id: f.id?.toString() || '',
        name: f.name || f.full_name || 'Freelancer',
        title: f.title || f.headline || 'Freelancer',
        avatar_url: f.avatar_url || f.profile_image_url,
        rating: f.rating || f.avg_rating || 0,
        reviews_count: f.reviews_count || 0,
        hourly_rate: f.hourly_rate || 0,
        location: f.location || 'Remote',
        skills: f.skills || [],
        completed_jobs: f.completed_jobs || f.completed_projects || 0,
        availability: f.availability ?? true,
      })));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Search failed:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedFreelancers = useMemo(() => {
    const list = [...freelancers];
    // Apply additional client-side filters
    const filtered = list.filter(f => {
      if (filters.location && !f.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.minRating && f.rating < parseFloat(filters.minRating)) return false;
      if (filters.availableOnly && f.availability === false) return false;
      return true;
    });
    switch (sortBy) {
      case 'rating': return filtered.sort((a, b) => b.rating - a.rating);
      case 'rate_low': return filtered.sort((a, b) => a.hourly_rate - b.hourly_rate);
      case 'rate_high': return filtered.sort((a, b) => b.hourly_rate - a.hourly_rate);
      case 'jobs': return filtered.sort((a, b) => b.completed_jobs - a.completed_jobs);
      default: return filtered;
    }
  }, [freelancers, sortBy, filters.location, filters.minRating, filters.availableOnly]);

  const totalPages = Math.max(1, Math.ceil(sortedFreelancers.length / ITEMS_PER_PAGE));
  const paginatedFreelancers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFreelancers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFreelancers, currentPage]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearFilters = () => {
    setFilters({ minRate: '', maxRate: '', skills: '', location: '', minRating: '', availableOnly: false });
    setCurrentPage(1);
  };

  const activeFilterCount = [filters.minRate, filters.maxRate, filters.skills, filters.location, filters.minRating].filter(Boolean).length + (filters.availableOnly ? 1 : 0);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;
  if (!mounted) return <Loading />;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Find Talent</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Search for skilled freelancers to work on your projects
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Search Bar */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.searchSection, themeStyles.searchSection)}>
            <div className={commonStyles.searchWrapper}>
              <Search size={20} className={commonStyles.searchIcon} />
              <input
                type="text"
                placeholder="Search by skill, title, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                aria-label="Search freelancers"
              />
              <Button variant="primary" onClick={handleSearch} isLoading={loading}>
                Search
              </Button>
            </div>

            {/* Filter Toggle */}
            <div className={commonStyles.filterToggleRow}>
              <button
                className={cn(commonStyles.filterToggle, themeStyles.filterToggle)}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                aria-expanded={showAdvancedFilters}
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className={commonStyles.filterBadge}>{activeFilterCount}</span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button className={cn(commonStyles.clearFilters, themeStyles.clearFilters)} onClick={clearFilters}>
                  <X size={14} /> Clear all
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className={commonStyles.filtersRow}>
                <div className={commonStyles.filterItem}>
                  <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Min Rate</label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.minRate}
                    onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
                    className={cn(commonStyles.filterInput, themeStyles.filterInput)}
                  />
                </div>
                <div className={commonStyles.filterItem}>
                  <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Max Rate</label>
                  <input
                    type="number"
                    placeholder="$200"
                    value={filters.maxRate}
                    onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                    className={cn(commonStyles.filterInput, themeStyles.filterInput)}
                  />
                </div>
                <div className={commonStyles.filterItem}>
                  <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Skills</label>
                  <input
                    type="text"
                    placeholder="React, Python, Design..."
                    value={filters.skills}
                    onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                    className={cn(commonStyles.filterInput, themeStyles.filterInput)}
                  />
                </div>
                <div className={commonStyles.filterItem}>
                  <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, London..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className={cn(commonStyles.filterInput, themeStyles.filterInput)}
                  />
                </div>
                <div className={commonStyles.filterItem}>
                  <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                    className={cn(commonStyles.filterInput, themeStyles.filterInput)}
                  >
                    <option value="">Any</option>
                    <option value="4.5">4.5+</option>
                    <option value="4">4.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="3">3.0+</option>
                  </select>
                </div>
                <div className={commonStyles.filterItem}>
                  <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>&nbsp;</label>
                  <button
                    className={cn(commonStyles.availabilityToggle, themeStyles.availabilityToggle, filters.availableOnly && commonStyles.availabilityActive)}
                    onClick={() => setFilters({ ...filters, availableOnly: !filters.availableOnly })}
                  >
                    <CheckCircle size={14} />
                    Available now
                  </button>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Results Bar */}
        {freelancers.length > 0 && (
          <ScrollReveal delay={0.15}>
            <div className={cn(commonStyles.resultsBar, themeStyles.resultsBar)}>
              <span className={cn(commonStyles.resultCount, themeStyles.resultCount)}>
                <Users size={16} />
                {sortedFreelancers.length} freelancer{sortedFreelancers.length !== 1 ? 's' : ''} found
              </span>
              <div className={commonStyles.sortWrapper}>
                <ArrowUpDown size={14} />
                <select
                  className={cn(commonStyles.sortSelect, themeStyles.sortSelect)}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
                  aria-label="Sort results"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Results */}
        {loading ? (
          <Loading />
        ) : freelancers.length === 0 ? (
          <EmptyState
            title="Search for freelancers"
            description="Enter keywords to find talented freelancers for your projects."
            icon={<Search size={48} />}
            animationData={searchingAnimation}
            animationWidth={130}
            animationHeight={130}
          />
        ) : sortedFreelancers.length === 0 ? (
          <EmptyState
            title="No freelancers match your filters"
            description="Try adjusting your filter criteria."
            icon={<Filter size={48} />}
            action={<Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>}
          />
        ) : (
          <>
            <StaggerContainer className={commonStyles.resultsGrid}>
              {paginatedFreelancers.map((freelancer) => (
                <StaggerItem key={freelancer.id} className={cn(commonStyles.freelancerCard, themeStyles.freelancerCard)}>
                  <div className={commonStyles.cardHeader}>
                    <div className={commonStyles.avatar}>
                      {freelancer.avatar_url ? (
                        <img src={freelancer.avatar_url} alt={freelancer.name} />
                      ) : (
                        <span>{freelancer.name.charAt(0)}</span>
                      )}
                    </div>
                    <button
                      className={cn(commonStyles.favoriteBtn, favorites.has(freelancer.id) && commonStyles.favoriteBtnActive)}
                      onClick={() => toggleFavorite(freelancer.id)}
                      aria-label={favorites.has(freelancer.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={18} fill={favorites.has(freelancer.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h3 className={cn(commonStyles.name, themeStyles.name)}>{freelancer.name}</h3>
                  <p className={cn(commonStyles.titleText, themeStyles.titleText)}>{freelancer.title}</p>

                  <div className={commonStyles.meta}>
                    <span className={commonStyles.rating}>
                      <Star size={14} fill="#F2C94C" stroke="#F2C94C" />
                      {freelancer.rating.toFixed(1)} ({freelancer.reviews_count})
                    </span>
                    <span className={commonStyles.location}>
                      <MapPin size={14} />
                      {freelancer.location}
                    </span>
                  </div>

                  <div className={commonStyles.rateRow}>
                    <div className={commonStyles.rate}>
                      <DollarSign size={16} />
                      ${freelancer.hourly_rate}/hr
                    </div>
                    {freelancer.completed_jobs > 0 && (
                      <span className={cn(commonStyles.jobCount, themeStyles.jobCount)}>
                        <Briefcase size={13} />
                        {freelancer.completed_jobs} jobs
                      </span>
                    )}
                  </div>

                  <div className={commonStyles.skills}>
                    {freelancer.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <span className={cn(commonStyles.moreSkills, themeStyles.moreSkills)}>+{freelancer.skills.length - 3}</span>
                    )}
                  </div>

                  <div className={commonStyles.cardActions}>
                    <Link href={`/freelancers/${freelancer.id}`}>
                      <Button variant="outline" size="sm" fullWidth>View Profile</Button>
                    </Link>
                    <Button variant="primary" size="sm" iconBefore={<MessageSquare size={14} />}>
                      Contact
                    </Button>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <ScrollReveal>
                <div className={commonStyles.pagination}>
                  <button
                    className={cn(commonStyles.pageBtn, themeStyles.pageBtn)}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      typeof p === 'string' ? (
                        <span key={`ellipsis-${i}`} className={commonStyles.pageEllipsis}>...</span>
                      ) : (
                        <button
                          key={p}
                          className={cn(commonStyles.pageBtn, themeStyles.pageBtn, currentPage === p && commonStyles.pageBtnActive, currentPage === p && themeStyles.pageBtnActive)}
                          onClick={() => setCurrentPage(p)}
                          aria-current={currentPage === p ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    className={cn(commonStyles.pageBtn, themeStyles.pageBtn)}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </ScrollReveal>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
