// @AI-HINT: External Projects page - aggregated freelance projects from RemoteOK, Jobicy, Arbeitnow with scam detection
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { externalProjectsApi } from '@/lib/api';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';
import Button from '@/app/components/Button/Button';
import {
  Globe, Search, RefreshCw, ExternalLink, MapPin, DollarSign,
  Clock, Shield, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight,
  Briefcase, TrendingUp, Eye, MousePointerClick, AlertTriangle, Sparkles,
} from 'lucide-react';
import commonStyles from './ExternalProjects.common.module.css';
import lightStyles from './ExternalProjects.light.module.css';
import darkStyles from './ExternalProjects.dark.module.css';

interface ExternalProject {
  id: number;
  source: string;
  source_url: string;
  title: string;
  company: string;
  company_logo: string | null;
  description: string;
  description_plain: string | null;
  category: string;
  tags: string[];
  project_type: string;
  experience_level: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  budget_period: string;
  location: string;
  apply_url: string;
  trust_score: number;
  is_verified: boolean | number;
  posted_at: string | null;
  scraped_at: string;
  views_count: number;
  clicks_count: number;
}

interface CategoryInfo {
  name: string;
  count: number;
}

function formatBudget(min: number | null, max: number | null, currency = 'USD', period = 'fixed'): string {
  if (!min && !max) return '';
  const fmt = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toLocaleString();
  };
  const cur = currency === 'USD' ? '$' : currency;
  const p = period === 'yearly' ? '/yr' : period === 'monthly' ? '/mo' : period === 'hourly' ? '/hr' : '';
  if (min && max) return `${cur}${fmt(min)} - ${cur}${fmt(max)}${p}`;
  if (max) return `Up to ${cur}${fmt(max)}${p}`;
  return `From ${cur}${fmt(min!)}${p}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getTrustLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export default function ExternalProjectsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Data
  const [projects, setProjects] = useState<ExternalProject[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<string[]>([]);
  const [lastScraped, setLastScraped] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('posted_at');
  const [page, setPage] = useState(1);
  const pageSize = 18;

  // UI State
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await externalProjectsApi.list({
        query: query || undefined,
        category: selectedCategory || undefined,
        source: selectedSource || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        page,
        page_size: pageSize,
      });
      setProjects((data.projects || []) as unknown as ExternalProject[]);
      setTotal(data.total || 0);
      setSources(data.sources || []);
      setLastScraped(data.last_scraped);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load external projects:', err);
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, selectedSource, sortBy, page]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await externalProjectsApi.getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load categories:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounced search
  const handleSearch = (value: string) => {
    setQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResult(null);
    try {
      const result = await externalProjectsApi.triggerScrape();
      setScrapeResult(result);
      loadProjects();
      loadCategories();
      // Auto-dismiss after 8 seconds
      setTimeout(() => setScrapeResult(null), 8000);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Scrape failed:', err);
      }
      setScrapeResult({ status: 'error', error: 'Failed to scrape projects' });
      setTimeout(() => setScrapeResult(null), 5000);
    } finally {
      setScraping(false);
    }
  };

  const handleApply = async (project: ExternalProject) => {
    try {
      const result = await externalProjectsApi.trackClick(project.id);
      window.open(result.apply_url || project.apply_url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(project.apply_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!mounted) return null;

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const totalPages = Math.ceil(total / pageSize);

  const sourceColors: Record<string, string> = {
    remoteok: themed.sourceDotRemoteok,
    jobicy: themed.sourceDotJobicy,
    arbeitnow: themed.sourceDotArbeitnow,
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themed.page)}>
        <SectionGlobe variant="green" size="md" position="left" />
        {/* Header */}
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div className={commonStyles.headerTop}>
              <div>
                <div className={commonStyles.headerLeft}>
                  <Globe className={commonStyles.headerIcon} />
                  <h1 className={commonStyles.title}>External Projects</h1>
                </div>
                <p className={cn(commonStyles.subtitle, themed.subtitle)}>
                  Real freelance projects & tasks aggregated from top platforms — verified for authenticity
                </p>
              </div>
              <button
                className={cn(commonStyles.scrapeBtn, themed.scrapeBtn)}
                onClick={handleScrape}
                disabled={scraping}
                title="Fetch latest projects from all sources"
              >
                {scraping ? (
                  <span className={commonStyles.scrapingSpinner} />
                ) : (
                  <RefreshCw size={16} />
                )}
                {scraping ? 'Scraping...' : 'Refresh Projects'}
              </button>
            </div>
          </header>
        </ScrollReveal>

        {/* Stats Bar */}
        <ScrollReveal delay={0.05}>
          <div className={commonStyles.statsBar}>
            <div className={cn(commonStyles.statCard, themed.statCard)}>
              <div className={cn(commonStyles.statIcon, themed.statIcon)}>
                <Briefcase className={commonStyles.statIconInner} />
              </div>
              <div>
                <div className={cn(commonStyles.statValue, themed.statValue)}>{total}</div>
                <div className={cn(commonStyles.statLabel, themed.statLabel)}>Total Projects</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themed.statCard)}>
              <div className={cn(commonStyles.statIcon, themed.statIcon)}>
                <TrendingUp className={commonStyles.statIconInner} />
              </div>
              <div>
                <div className={cn(commonStyles.statValue, themed.statValue)}>{sources.length}</div>
                <div className={cn(commonStyles.statLabel, themed.statLabel)}>Sources</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themed.statCard)}>
              <div className={cn(commonStyles.statIcon, themed.statIcon)}>
                <ShieldCheck className={commonStyles.statIconInner} />
              </div>
              <div>
                <div className={cn(commonStyles.statValue, themed.statValue)}>{categories.length}</div>
                <div className={cn(commonStyles.statLabel, themed.statLabel)}>Categories</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Search & Filters */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.toolbar, themed.toolbar)}>
            <div className={commonStyles.searchRow}>
              <div className={commonStyles.searchWrapper}>
                <Search className={cn(commonStyles.searchIcon, themed.searchIcon)} />
                <input
                  type="text"
                  placeholder="Search projects by title, company, or skill..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={cn(commonStyles.searchInput, themed.searchInput)}
                  aria-label="Search external projects"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className={cn(commonStyles.filterSelect, themed.filterSelect)}
                aria-label="Sort projects by"
              >
                <option value="posted_at">Newest First</option>
                <option value="budget_max">Highest Budget</option>
                <option value="trust_score">Most Trusted</option>
              </select>
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
              <div className={commonStyles.categoryTabs}>
                <button
                  className={cn(
                    commonStyles.categoryTab,
                    !selectedCategory ? themed.categoryTabActive : themed.categoryTab
                  )}
                  onClick={() => { setSelectedCategory(null); setPage(1); }}
                >
                  All
                  <span className={cn(commonStyles.categoryCount, themed.categoryCount)}>{total}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    className={cn(
                      commonStyles.categoryTab,
                      selectedCategory === cat.name ? themed.categoryTabActive : themed.categoryTab
                    )}
                    onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                  >
                    {cat.name}
                    <span className={cn(commonStyles.categoryCount, themed.categoryCount)}>{cat.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Source Filters */}
            {sources.length > 0 && (
              <div className={commonStyles.sourceRow}>
                <span className={cn(commonStyles.sourceLabel, themed.sourceLabel)}>Sources:</span>
                <button
                  className={cn(
                    commonStyles.sourceBadge,
                    !selectedSource ? themed.sourceBadgeActive : themed.sourceBadge
                  )}
                  onClick={() => { setSelectedSource(null); setPage(1); }}
                >
                  All
                </button>
                {sources.map((src) => (
                  <button
                    key={src}
                    className={cn(
                      commonStyles.sourceBadge,
                      selectedSource === src ? themed.sourceBadgeActive : themed.sourceBadge
                    )}
                    onClick={() => { setSelectedSource(src); setPage(1); }}
                  >
                    <span className={cn(commonStyles.sourceDot, sourceColors[src])} />
                    {src}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Project Listings */}
        {loading ? (
          <div className={commonStyles.loadingWrapper}>
            <div className={cn(commonStyles.spinner, themed.spinner)} />
            <span className={cn(commonStyles.loadingText, themed.loadingText)}>
              Loading projects...
            </span>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className={commonStyles.grid}>
              {projects.map((project) => {
                const trustLevel = getTrustLevel(project.trust_score);
                const TrustIcon = trustLevel === 'high' ? ShieldCheck : trustLevel === 'medium' ? Shield : ShieldAlert;
                const trustClass = trustLevel === 'high' ? themed.trustBadgeHigh : trustLevel === 'medium' ? themed.trustBadgeMedium : themed.trustBadgeLow;
                const trustLabel = trustLevel === 'high' ? 'Verified' : trustLevel === 'medium' ? 'Moderate' : 'Caution';
                const budgetStr = formatBudget(project.budget_min, project.budget_max, project.budget_currency, project.budget_period);
                const tags: string[] = Array.isArray(project.tags) ? project.tags : [];

                return (
                  <div key={project.id} className={cn(commonStyles.projectCard, themed.projectCard)}>
                    {/* Source Tag */}
                    <span className={cn(commonStyles.sourceTag, themed.sourceTag)}>
                      {project.source}
                    </span>

                    {/* Header */}
                    <div className={commonStyles.cardHeader}>
                      {project.company_logo ? (
                        <img
                          src={project.company_logo}
                          alt={project.company}
                          className={commonStyles.companyLogo}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={cn(commonStyles.companyLogoPlaceholder, themed.companyLogoPlaceholder)}>
                          {project.company.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={commonStyles.cardTitleArea}>
                        <h3 className={cn(commonStyles.projectTitle, themed.projectTitle)}>
                          {project.title}
                        </h3>
                        <div className={cn(commonStyles.companyName, themed.companyName)}>
                          {project.company}
                          <span className={cn(commonStyles.trustBadge, trustClass)}>
                            <TrustIcon className={commonStyles.trustIcon} />
                            {trustLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className={commonStyles.cardBody}>
                      <p className={cn(commonStyles.projectDescription, themed.projectDescription)}>
                        {project.description_plain || project.description?.replace(/<[^>]*>/g, '').slice(0, 200) || 'No description available.'}
                      </p>
                      {tags.length > 0 && (
                        <div className={commonStyles.tagRow}>
                          {tags.slice(0, 4).map((tag, i) => (
                            <span key={i} className={cn(commonStyles.tag, themed.tag)}>{tag}</span>
                          ))}
                          {tags.length > 4 && (
                            <span className={cn(commonStyles.moreTags, themed.moreTags)}>
                              +{tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className={cn(commonStyles.cardFooter, themed.cardFooter)}>
                      <div className={commonStyles.cardMeta}>
                        {budgetStr && (
                          <span className={cn(commonStyles.metaItem, commonStyles.budget, themed.budget)}>
                            <DollarSign className={commonStyles.metaIcon} />
                            {budgetStr}
                          </span>
                        )}
                        <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                          <MapPin className={commonStyles.metaIcon} />
                          {project.location || 'Remote'}
                        </span>
                        {project.posted_at && (
                          <span className={cn(commonStyles.metaItem, themed.metaItem)}>
                            <Clock className={commonStyles.metaIcon} />
                            {timeAgo(project.posted_at)}
                          </span>
                        )}
                      </div>
                      <button
                        className={cn(commonStyles.applyBtn, themed.applyBtn)}
                        onClick={() => handleApply(project)}
                      >
                        Apply
                        <ExternalLink className={commonStyles.applyIcon} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={commonStyles.pagination}>
                <button
                  className={cn(commonStyles.pageBtn, themed.pageBtn)}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className={cn(commonStyles.pageInfo, themed.pageInfo)}>
                  Page {page} of {totalPages} ({total} projects)
                </span>
                <button
                  className={cn(commonStyles.pageBtn, themed.pageBtn)}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={cn(commonStyles.emptyState, themed.emptyState)}>
            <Sparkles className={cn(commonStyles.emptyIcon, themed.emptyIcon)} />
            <h3 className={commonStyles.emptyTitle}>No Projects Found</h3>
            <p className={cn(commonStyles.emptyText, themed.emptyText)}>
              {query || selectedCategory || selectedSource
                ? 'Try adjusting your filters or search query.'
                : 'Click "Refresh Projects" to scrape the latest freelance projects from external platforms.'}
            </p>
            {!query && !selectedCategory && !selectedSource && (
              <Button variant="primary" size="md" onClick={handleScrape} isLoading={scraping}>
                <RefreshCw size={16} /> Fetch Projects Now
              </Button>
            )}
          </div>
        )}

        {/* Last Updated */}
        {lastScraped && (
          <div className={cn(commonStyles.lastUpdated, themed.lastUpdated)}>
            Last updated: {new Date(lastScraped).toLocaleString()}
          </div>
        )}

        {/* Scrape Result Toast */}
        {scrapeResult && (
          <div className={cn(commonStyles.scrapeResult, themed.scrapeResult)}>
            <div className={commonStyles.scrapeResultTitle}>
              {scrapeResult.status === 'completed' ? '✅ Scrape Complete' : '❌ Scrape Failed'}
            </div>
            {scrapeResult.status === 'completed' && (
              <div className={cn(commonStyles.scrapeResultDetails, themed.scrapeResultDetails)}>
                {scrapeResult.projects_scraped} scraped • {scrapeResult.projects_added} new • {scrapeResult.projects_updated} updated
                {scrapeResult.projects_flagged > 0 && ` • ${scrapeResult.projects_flagged} flagged`}
                <br />
                Completed in {scrapeResult.duration_seconds?.toFixed(1)}s
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
