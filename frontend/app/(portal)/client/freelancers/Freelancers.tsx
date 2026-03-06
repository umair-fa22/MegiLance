// @AI-HINT: Enterprise Client Freelancers - talent discovery with advanced filters, shortlisting, comparison, and AI match scoring
'use client';

import React, { useId, useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useClientData } from '@/hooks/useClient';
import { AIMatchCard } from '@/app/components/AI';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Badge from '@/app/components/Badge/Badge';
import {
  Search, Download, Star, MapPin, DollarSign,
  ChevronDown, ChevronUp, X, Users, BarChart3,
  Grid3X3, List, SlidersHorizontal, Bookmark, BookmarkCheck, Zap
} from 'lucide-react';

import common from './Freelancers.common.module.css';
import light from './Freelancers.light.module.css';
import dark from './Freelancers.dark.module.css';

const AVAILABILITIES = ['All', 'Full-time', 'Part-time', 'Contract'] as const;
type Availability = (typeof AVAILABILITIES)[number];
const EXP_LEVELS = ['All', 'Junior', 'Mid-Level', 'Senior', 'Expert'] as const;
type ExpLevel = (typeof EXP_LEVELS)[number];
type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'title' | 'rate' | 'location' | 'availability' | 'rating' | 'matchScore';

interface FreelancerRow {
  id: string;
  name: string;
  avatarUrl: string;
  title: string;
  hourlyRate: number;
  location: string;
  skills: string[];
  rating: number;
  availability: string;
  experienceLevel: string;
  languages: string;
  matchScore: number;
  isVerified: boolean;
  confidenceLevel?: number;
  matchReasons: string[];
}

const Freelancers: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { freelancers, loading, error } = useClientData();

  const headerId = useId();

  // --- Data mapping ---
  const rows = useMemo<FreelancerRow[]>(() => {
    if (!Array.isArray(freelancers)) return [];
    return (freelancers as any[]).map((f, idx) => ({
      id: String(f.id ?? idx),
      name: f.name ?? 'Unknown',
      avatarUrl: f.avatarUrl ?? '',
      title: f.headline ?? f.title ?? f.role ?? 'Freelancer',
      hourlyRate: typeof f.rate === 'number' ? f.rate : parseFloat(String(f.rate || '0').replace(/[^0-9.]/g, '')),
      location: f.location ?? 'Remote',
      skills: Array.isArray(f.skills) ? f.skills : [],
      rating: f.rating ?? 4.5,
      availability: (f.availability_status as string) ?? (f.availability as string) ?? 'available',
      experienceLevel: f.experience_level ?? '',
      languages: f.languages ?? '',
      matchScore: f.matchScore ?? 0,
      isVerified: f.isVerified ?? false,
      confidenceLevel: f.confidenceLevel ? Number(f.confidenceLevel) : undefined,
      matchReasons: f.matchReasons ?? [],
    }));
  }, [freelancers]);

  // --- Filter states ---
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState<Availability>('All');
  const [expLevel, setExpLevel] = useState<ExpLevel>('All');
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(500);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('matchScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // --- Shortlist ---
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleShortlist = useCallback((id: string) => {
    setShortlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  // --- Filtering ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(f => {
      if (showShortlistOnly && !shortlist.has(f.id)) return false;
      if (availability !== 'All' && f.availability !== availability) return false;
      if (expLevel !== 'All' && f.experienceLevel !== expLevel) return false;
      if (f.hourlyRate < minRate || f.hourlyRate > maxRate) return false;
      if (f.rating < minRating) return false;
      if (q && !(
        f.name.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.skills.join(' ').toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [rows, query, availability, expLevel, minRate, maxRate, minRating, showShortlistOnly, shortlist]);

  // --- Sorting ---
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'name': av = a.name; bv = b.name; break;
        case 'title': av = a.title; bv = b.title; break;
        case 'rate': av = a.hourlyRate; bv = b.hourlyRate; break;
        case 'location': av = a.location; bv = b.location; break;
        case 'availability': av = a.availability; bv = b.availability; break;
        case 'rating': av = a.rating; bv = b.rating; break;
        case 'matchScore': av = a.matchScore; bv = b.matchScore; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  React.useEffect(() => { setPage(1); }, [sortKey, sortDir, query, availability, pageSize, expLevel, minRate, maxRate, minRating, showShortlistOnly]);

  // --- Aggregate stats ---
  const stats = useMemo(() => {
    const total = rows.length;
    const avgRate = total > 0 ? rows.reduce((s, r) => s + r.hourlyRate, 0) / total : 0;
    const avgRating = total > 0 ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
    const verified = rows.filter(r => r.isVerified).length;
    return { total, avgRate, avgRating, verified };
  }, [rows]);

  const compareFreelancers = useMemo(() => {
    return compareIds.map(id => rows.find(r => r.id === id)).filter(Boolean) as FreelancerRow[];
  }, [compareIds, rows]);

  // --- CSV export ---
  const handleExport = useCallback(() => {
    const header = ['ID', 'Name', 'Title', 'Rate', 'Location', 'Availability', 'Skills', 'Rating', 'Experience', 'Match Score'];
    const data = sorted.map(f => [f.id, f.name, f.title, f.hourlyRate, f.location, f.availability, f.skills.join(' | '), f.rating.toFixed(1), f.experienceLevel, f.matchScore]);
    const csv = [header, ...data]
      .map(r => r.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freelancers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

  const clearFilters = () => {
    setQuery('');
    setAvailability('All');
    setExpLevel('All');
    setMinRate(0);
    setMaxRate(500);
    setMinRating(0);
    setShowShortlistOnly(false);
  };

  const hasActiveFilters = query || availability !== 'All' || expLevel !== 'All' || minRate > 0 || maxRate < 500 || minRating > 0 || showShortlistOnly;

  return (
    <PageTransition className={cn(common.page, themed.page)}>
      <div className={common.container}>
        {/* Header with stats */}
        <ScrollReveal className={common.header}>
          <div className={common.headerContent}>
            <div>
              <h1 id={headerId} className={cn(common.title, themed.title)}>Talent Discovery</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>Find, compare, and hire the perfect freelancers for your projects</p>
            </div>
            <div className={common.headerActions}>
              <Button variant="secondary" size="sm" iconBefore={<Download size={16} />} onClick={handleExport}>Export</Button>
            </div>
          </div>
          {/* Quick stats bar */}
          {!loading && (
            <div className={cn(common.quickStats, themed.quickStats)}>
              <div className={common.quickStatItem}>
                <Users size={16} />
                <span><strong>{stats.total}</strong> Freelancers</span>
              </div>
              <div className={common.quickStatItem}>
                <DollarSign size={16} />
                <span>Avg <strong>${stats.avgRate.toFixed(0)}</strong>/hr</span>
              </div>
              <div className={common.quickStatItem}>
                <Star size={16} />
                <span>Avg <strong>{stats.avgRating.toFixed(1)}</strong> Rating</span>
              </div>
              <div className={common.quickStatItem}>
                <Zap size={16} />
                <span><strong>{stats.verified}</strong> Verified</span>
              </div>
              {shortlist.size > 0 && (
                <div className={cn(common.quickStatItem, common.shortlistStat)}>
                  <BookmarkCheck size={16} />
                  <span><strong>{shortlist.size}</strong> Shortlisted</span>
                </div>
              )}
            </div>
          )}
        </ScrollReveal>

        {/* Search + Controls bar */}
        <ScrollReveal className={cn(common.controlsSection, themed.controlsSection)} delay={0.1}>
          <div className={common.searchRow}>
            <Input
              id="search-query"
              type="search"
              placeholder="Search by name, title, skills, or location..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              iconBefore={<Search size={18} />}
              className={common.searchInput}
            />
            <button
              className={cn(common.filterToggle, themed.filterToggle, showFilters && common.filterToggleActive)}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-label="Toggle advanced filters"
            >
              <SlidersHorizontal size={18} />
              Filters
              {hasActiveFilters && <span className={common.filterBadge}>{[query, availability !== 'All', expLevel !== 'All', minRate > 0, maxRate < 500, minRating > 0, showShortlistOnly].filter(Boolean).length}</span>}
            </button>
            <div className={common.viewToggle}>
              <button
                className={cn(common.viewBtn, themed.viewBtn, viewMode === 'grid' && common.viewBtnActive)}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              ><Grid3X3 size={18} /></button>
              <button
                className={cn(common.viewBtn, themed.viewBtn, viewMode === 'list' && common.viewBtnActive)}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              ><List size={18} /></button>
            </div>
          </div>

          {/* Sort + view controls */}
          <div className={common.sortRow}>
            <div className={common.sortGroup}>
              <Select
                id="sort-key"
                value={sortKey}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortKey(e.target.value as SortKey)}
                options={[
                  { value: 'matchScore', label: 'Best Match' },
                  { value: 'rating', label: 'Highest Rating' },
                  { value: 'rate', label: 'Hourly Rate' },
                  { value: 'name', label: 'Name' },
                ]}
                aria-label="Sort by"
              />
              <button
                className={cn(common.sortDirBtn, themed.sortDirBtn)}
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                aria-label={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            <div className={common.resultCount}>
              <span className={cn(common.resultText, themed.resultText)}>
                {sorted.length} result{sorted.length !== 1 ? 's' : ''} {hasActiveFilters ? '(filtered)' : ''}
              </span>
              {hasActiveFilters && (
                <button className={cn(common.clearBtn, themed.clearBtn)} onClick={clearFilters}>
                  <X size={14} /> Clear all
                </button>
              )}
            </div>
          </div>

          {/* Advanced filters panel */}
          {showFilters && (
            <div className={cn(common.advancedFilters, themed.advancedFilters)}>
              <div className={common.filterGroup}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Availability</label>
                <Select
                  id="availability-filter"
                  value={availability}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAvailability(e.target.value as Availability)}
                  options={AVAILABILITIES.map(a => ({ value: a, label: a }))}
                />
              </div>
              <div className={common.filterGroup}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Experience</label>
                <Select
                  id="exp-filter"
                  value={expLevel}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpLevel(e.target.value as ExpLevel)}
                  options={EXP_LEVELS.map(e => ({ value: e, label: e }))}
                />
              </div>
              <div className={common.filterGroup}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Rate Range ($/hr)</label>
                <div className={common.rateRange}>
                  <input
                    type="number"
                    min={0}
                    max={maxRate}
                    value={minRate}
                    onChange={e => setMinRate(Math.max(0, Number(e.target.value)))}
                    className={cn(common.rateInput, themed.rateInput)}
                    aria-label="Minimum rate"
                  />
                  <span className={common.rateSep}>—</span>
                  <input
                    type="number"
                    min={minRate}
                    max={1000}
                    value={maxRate}
                    onChange={e => setMaxRate(Math.max(minRate, Number(e.target.value)))}
                    className={cn(common.rateInput, themed.rateInput)}
                    aria-label="Maximum rate"
                  />
                </div>
              </div>
              <div className={common.filterGroup}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Min Rating</label>
                <div className={common.ratingFilter}>
                  {[0, 3, 3.5, 4, 4.5].map(r => (
                    <button
                      key={r}
                      className={cn(common.ratingBtn, themed.ratingBtn, minRating === r && common.ratingBtnActive)}
                      onClick={() => setMinRating(r)}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className={common.filterGroup}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Shortlist</label>
                <button
                  className={cn(common.shortlistToggle, themed.shortlistToggle, showShortlistOnly && common.shortlistToggleActive)}
                  onClick={() => setShowShortlistOnly(!showShortlistOnly)}
                >
                  <BookmarkCheck size={16} />
                  {showShortlistOnly ? 'Showing Shortlisted' : 'Show Shortlisted Only'}
                </button>
              </div>
            </div>
          )}
        </ScrollReveal>

        {/* Compare bar */}
        {compareIds.length > 0 && (
          <div className={cn(common.compareBar, themed.compareBar)}>
            <div className={common.compareInfo}>
              <BarChart3 size={18} />
              <span>{compareIds.length}/3 selected for comparison</span>
            </div>
            <div className={common.compareActions}>
              <Button variant="primary" size="sm" onClick={() => setShowCompare(true)} disabled={compareIds.length < 2}>
                Compare ({compareIds.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCompareIds([])}>Clear</Button>
            </div>
          </div>
        )}

        {/* Comparison panel */}
        {showCompare && compareFreelancers.length >= 2 && (
          <ScrollReveal>
            <div className={cn(common.comparePanel, themed.comparePanel)}>
              <div className={common.comparePanelHeader}>
                <h3 className={cn(common.comparePanelTitle, themed.comparePanelTitle)}>Freelancer Comparison</h3>
                <button className={cn(common.closeBtn, themed.closeBtn)} onClick={() => setShowCompare(false)} aria-label="Close comparison">
                  <X size={20} />
                </button>
              </div>
              <div className={common.compareGrid} style={{ gridTemplateColumns: `200px repeat(${compareFreelancers.length}, 1fr)` }}>
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Freelancer</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    <UserAvatar src={f.avatarUrl} name={f.name} size={48} />
                    <strong>{f.name}</strong>
                    <span className={common.compareSubtext}>{f.title}</span>
                  </div>
                ))}
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Hourly Rate</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    <span className={common.compareHighlight}>${f.hourlyRate}/hr</span>
                  </div>
                ))}
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Rating</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    <span className={common.compareHighlight}><Star size={14} /> {f.rating.toFixed(1)}</span>
                  </div>
                ))}
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Location</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    <MapPin size={14} /> {f.location}
                  </div>
                ))}
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Experience</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    {f.experienceLevel || 'N/A'}
                  </div>
                ))}
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Skills</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    <div className={common.compareSkills}>
                      {f.skills.slice(0, 6).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                ))}
                <div className={cn(common.compareCell, common.compareLabelCell, themed.compareLabelCell)}>Match Score</div>
                {compareFreelancers.map(f => (
                  <div key={f.id} className={cn(common.compareCell, common.compareValueCell, themed.compareValueCell)}>
                    <div className={common.matchScoreBar}>
                      <div className={common.matchScoreFill} style={{ width: `${Math.min(100, f.matchScore)}%` }} />
                    </div>
                    <span>{f.matchScore}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Freelancer grid/list */}
        <StaggerContainer
          className={cn(viewMode === 'grid' ? common.grid : common.listView)}
          aria-live="polite"
          aria-labelledby={headerId}
          delay={0.15}
        >
          {loading && (
            [...Array(12)].map((_, i) => (
              <div key={i} className={cn(common.skeletonCard, themed.skeletonCard)}>
                <div className={common.skeletonHeader}>
                  <Skeleton height={64} width={64} radius={999} />
                  <div className={common.skeletonHeaderText}>
                    <Skeleton height={24} width="70%" />
                    <Skeleton height={18} width="50%" />
                  </div>
                </div>
                <Skeleton height={20} width="90%" />
                <Skeleton height={40} width="100%" />
              </div>
            ))
          )}
          {!loading && error && <div className={cn(common.error, themed.error)}>Failed to load freelancers.</div>}
          {!loading && !error && paged.map(f => (
            <div key={f.id} className={cn(viewMode === 'list' ? common.listItem : common.gridItem, themed.cardWrapper)}>
              <div className={common.cardActions}>
                <button
                  className={cn(common.actionBtn, themed.actionBtn, shortlist.has(f.id) && common.actionBtnActive)}
                  onClick={() => toggleShortlist(f.id)}
                  aria-label={shortlist.has(f.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                >
                  {shortlist.has(f.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
                <button
                  className={cn(common.actionBtn, themed.actionBtn, compareIds.includes(f.id) && common.actionBtnActive)}
                  onClick={() => toggleCompare(f.id)}
                  aria-label={compareIds.includes(f.id) ? 'Remove from comparison' : 'Add to comparison'}
                  disabled={!compareIds.includes(f.id) && compareIds.length >= 3}
                >
                  <BarChart3 size={16} />
                </button>
              </div>
              <AIMatchCard freelancer={f as any} />
            </div>
          ))}
          {!loading && sorted.length === 0 && (
            <div className={cn(common.emptyState, themed.emptyState)}>
              <Search size={48} strokeWidth={1.5} />
              <h3>No Freelancers Found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={clearFilters}>Clear All Filters</Button>
              )}
            </div>
          )}
        </StaggerContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={common.paginationBar}>
            <Button variant="secondary" size="sm" onClick={() => setPage(1)} disabled={pageSafe === 1}>First</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe === 1}>Prev</Button>
            <div className={common.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(pageSafe - 2, totalPages - 4));
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    className={cn(common.pageNum, themed.pageNum, pageNum === pageSafe && common.pageNumActive)}
                    onClick={() => setPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === pageSafe ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>Next</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(totalPages)} disabled={pageSafe === totalPages}>Last</Button>
            <span className={cn(common.paginationInfo, themed.paginationInfo)}>
              {(pageSafe - 1) * pageSize + 1}–{Math.min(pageSafe * pageSize, sorted.length)} of {sorted.length}
            </span>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Freelancers;
