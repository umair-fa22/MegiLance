// @AI-HINT: This is a reusable, data-driven component that displays a paginated, sortable, and filterable grid of job cards. It encapsulates all state management for a clean, modular implementation.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { usePersistedState } from '@/app/lib/hooks/usePersistedState';
import DataToolbar, { SortOption } from '@/app/components/DataToolbar/DataToolbar';
import PaginationBar from '@/app/components/PaginationBar/PaginationBar';
import TableSkeleton from '@/app/components/DataTableExtras/TableSkeleton';
import SavedViewsMenu from '@/app/components/DataTableExtras/SavedViewsMenu';
import JobStatusCard, { JobStatusCardProps } from '../JobStatusCard/JobStatusCard';

import commonStyles from './PaginatedJobGrid.common.module.css';
import lightStyles from './PaginatedJobGrid.light.module.css';
import darkStyles from './PaginatedJobGrid.dark.module.css';

interface PaginatedJobGridProps {
  storageKey: string;
  jobs: JobStatusCardProps[];
  sortOptions: SortOption[];
  defaultSortKey: string;
  searchKeys: (keyof JobStatusCardProps)[];
  title: string;
}

const PaginatedJobGrid: React.FC<PaginatedJobGridProps> = ({ storageKey, jobs, sortOptions, defaultSortKey, searchKeys, title }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const [query, setQuery] = usePersistedState<string>(`${storageKey}:q`, '');
  const [sortKey, setSortKey] = usePersistedState<string>(`${storageKey}:sortKey`, defaultSortKey);
  const [sortDir, setSortDir] = usePersistedState<'asc' | 'desc'>(`${storageKey}:sortDir`, 'desc');
  const [page, setPage] = usePersistedState<number>(`${storageKey}:page`, 1);
  const [pageSize, setPageSize] = usePersistedState<number>(`${storageKey}:pageSize`, 6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(jobs.length === 0);
  }, [jobs, query, sortKey, sortDir, page, pageSize]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(job => 
      searchKeys.some(key => 
        String(job[key] ?? '').toLowerCase().includes(q)
      )
    );
  }, [query, jobs, searchKeys]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      const aVal = a[sortKey as keyof JobStatusCardProps];
      const bVal = b[sortKey as keyof JobStatusCardProps];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredJobs, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedJobs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, safePage, pageSize]);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <DataToolbar
        query={query}
        onQueryChange={(val) => { setQuery(val); setPage(1); }}
        sortValue={`${sortKey}:${sortDir}`}
        onSortChange={(val) => {
          const [k, d] = val.split(':') as [string, 'asc' | 'desc'];
          setSortKey(k);
          setSortDir(d);
          setPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
        sortOptions={sortOptions}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
      />
       <div className={styles.extrasRow}>
          <SavedViewsMenu
            storageKey={`${storageKey}:savedViews`}
            buildPayload={() => ({ q: query, sortKey: sortKey, sortDir: sortDir, pageSize: pageSize })}
            onApply={(p: any) => {
              setQuery(p.q ?? '');
              setSortKey(p.sortKey ?? defaultSortKey);
              setSortDir(p.sortDir ?? 'desc');
              setPageSize(p.pageSize ?? 6);
              setPage(1);
            }}
          />
        </div>
      <div className={styles.jobGrid}>
        {loading ? (
          <TableSkeleton rows={Math.min(pageSize, 6)} cols={3} useCards={true} />
        ) : (
          <>
            {paginatedJobs.map((job, index) => (
              <JobStatusCard key={`${storageKey}-${job.title}-${index}`} {...job} />
            ))}
            {sortedJobs.length === 0 && (
              <div role="status" aria-live="polite" className={styles.emptyState}>No jobs found.</div>
            )}
          </>
        )}
      </div>
      {sortedJobs.length > 0 && !loading && (
        <PaginationBar
          currentPage={safePage}
          totalPages={totalPages}
          totalResults={sortedJobs.length}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      )}
    </section>
  );
};

export default PaginatedJobGrid;
