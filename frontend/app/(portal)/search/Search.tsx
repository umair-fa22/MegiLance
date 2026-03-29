// @AI-HINT: Portal Search page. Theme-aware, accessible, animated with filters and results list.
'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { searchApi } from '@/lib/api';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import { LottieAnimation, searchingAnimation, emptyBoxAnimation } from '@/app/components/Animations/LottieAnimation';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import common from './Search.common.module.css';
import light from './Search.light.module.css';
import dark from './Search.dark.module.css';

// Input validation
const MAX_QUERY_LENGTH = 200;
const sanitizeQuery = (query: string): string => {
  return query.slice(0, MAX_QUERY_LENGTH).replace(/[<>"'&]/g, '');
};

type ResultType = 'Message' | 'Project' | 'User' | 'Invoice';

type Result = {
  id: string;
  title: string;
  snippet: string;
  type: ResultType;
  date: string;
};

const TYPES = ['All', 'Project', 'User'] as const;
const DATES = ['Any time', 'Past week', 'Past month', 'Past year'] as const;

const Search: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();
  const uniqueId = useId();
  const searchInputId = `${uniqueId}-search`;
  const typeSelectId = `${uniqueId}-type`;
  const dateSelectId = `${uniqueId}-date`;
  const resultsRegionId = `${uniqueId}-results`;

  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [date, setDate] = useState<(typeof DATES)[number]>('Any time');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCount, setSearchCount] = useState(0); // For announcing result count

  const abortControllerRef = useRef<AbortController | null>(null);

  const searchAPI = useCallback(async (searchQuery: string, searchType: string) => {
    const sanitizedQuery = sanitizeQuery(searchQuery);
    if (!sanitizedQuery.trim()) {
      setResults([]);
      setSearchCount(0);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    const allResults: Result[] = [];

    try {
      // Search projects if type is All or Project
      if (searchType === 'All' || searchType === 'Project') {
        try {
          const projectsData = await searchApi.projects(searchQuery, { page_size: 10 });
          const projects = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.projects || (projectsData as any)?.results || [];
          allResults.push(...projects.map((p: any) => ({
            id: `project-${p.id}`,
            title: p.title,
            snippet: p.description?.substring(0, 100) + '...' || 'No description',
            type: 'Project' as ResultType,
            date: p.created_at || new Date().toISOString(),
          })));
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Project search failed', err);
          }
        }
      }

      // Search freelancers if type is All or User
      if (searchType === 'All' || searchType === 'User') {
        try {
          const usersData = await searchApi.freelancers(searchQuery, { page_size: 10 });
          const users = Array.isArray(usersData) ? usersData : (usersData as any)?.freelancers || (usersData as any)?.results || [];
          allResults.push(...users.map((u: any) => ({
            id: `user-${u.id}`,
            title: u.full_name || 'Unknown User',
            snippet: u.bio?.substring(0, 100) || u.skills?.join(', ') || 'Freelancer',
            type: 'User' as ResultType,
            date: u.created_at || new Date().toISOString(),
          })));
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Freelancer search failed', err);
          }
        }
      }

      setResults(allResults);
      setSearchCount(allResults.length);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Search error:', error);
      }
      notify({ title: 'Search Error', description: 'Failed to fetch results. Please try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAPI(query, type);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type, searchAPI]);

  // Filter results by date
  const filteredResults = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const withinDate = (d: string) => {
      if (date === 'Any time') return true;
      const now = new Date();
      const dt = new Date(d);
      const diff = now.getTime() - dt.getTime();
      if (date === 'Past week') return diff <= 7 * dayMs;
      if (date === 'Past month') return diff <= 31 * dayMs;
      if (date === 'Past year') return diff <= 365 * dayMs;
      return true;
    };
    return results.filter((r) => withinDate(r.date));
  }, [results, date]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>Search</h1>
              <p className={common.subtitle}>Find projects and freelancers across the platform.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className={cn(common.controls)} role="search" aria-label="Global search controls">
              <label className={common.srOnly} htmlFor={searchInputId}>Search query</label>
              <input
                id={searchInputId}
                className={common.input}
                type="search"
                placeholder="Search projects and freelancers…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={MAX_QUERY_LENGTH}
                aria-describedby={`${uniqueId}-search-hint`}
              />
              <span id={`${uniqueId}-search-hint`} className={common.srOnly}>
                Enter keywords to search for projects and freelancers
              </span>

              <label className={common.srOnly} htmlFor={typeSelectId}>Filter by type</label>
              <select
                id={typeSelectId}
                className={common.select}
                value={type}
                onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
                aria-label="Filter by result type"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label className={common.srOnly} htmlFor={dateSelectId}>Filter by date</label>
              <select
                id={dateSelectId}
                className={common.select}
                value={date}
                onChange={(e) => setDate(e.target.value as (typeof DATES)[number])}
                aria-label="Filter by date range"
              >
                {DATES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </ScrollReveal>

          {loading && (
            <div className={common.loadingState}>
              <LottieAnimation
                animationData={searchingAnimation}
                width={100}
                height={100}
                ariaLabel="Searching"
              />
              <p>Searching...</p>
            </div>
          )}

          {!loading && query.trim() && (
            <>
              <div
                aria-live="polite"
                aria-atomic="true"
                className={common.srOnly}
              >
                {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} found
              </div>
              <StaggerContainer
                delay={0.2}
                id={resultsRegionId}
                className={common.results}
                role="region"
                aria-label={`Search results: ${filteredResults.length} ${filteredResults.length === 1 ? 'result' : 'results'}`}
              >
              {filteredResults.map((r, index) => (
                <article
                  key={r.id}
                  role="article"
                  className={common.card}
                  aria-labelledby={`res-${r.id}-title`}
                  tabIndex={0}
                >
                  <h3 id={`res-${r.id}-title`} className={common.cardTitle}>{r.title}</h3>
                  <div className={common.cardMeta}>
                    <span className={cn(common.typeBadge, r.type === 'Project' ? common.typeProject : common.typeUser)}>
                      {r.type}
                    </span>
                    <time dateTime={r.date}>{formatDate(r.date)}</time>
                  </div>
                  <p>{r.snippet}</p>
                </article>
              ))}
            </StaggerContainer>
          </>
        )}

        {!loading && query.trim() && filteredResults.length === 0 && (
          <EmptyState
            title="No results found"
            description="Try a different query or adjust filters to broaden your search."
            animationData={emptyBoxAnimation}
            animationWidth={140}
            animationHeight={140}
            action={
              <button
                type="button"
                className={common.select}
                onClick={() => notify({ title: 'Tip', description: 'Use broader keywords or select All types.', variant: 'info', duration: 2500 })}
              >
                Get Search Tips
              </button>
            }
          />
        )}

        {!loading && !query.trim() && (
          <EmptyState
            title="Start Searching"
            description="Enter keywords to find projects, freelancers, and more."
            animationData={searchingAnimation}
            animationWidth={140}
            animationHeight={140}
          />
        )}
      </div>
      </main>
    </PageTransition>
  );
};

export default Search;
