// @AI-HINT: Admin Projects page. Theme-aware, accessible, animated list with filters and row actions.
'use client';

import React, { useMemo, useState } from 'react';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal } from '@/components/Animations'
import { useAdminData } from '@/hooks/useAdmin';
import common from './AdminProjects.common.module.css';
import light from './AdminProjects.light.module.css';
import dark from './AdminProjects.dark.module.css';

interface ProjectRow {
  id: string;
  name: string;
  client: string;
  budget: string;
  status: 'Planned' | 'In Progress' | 'Blocked' | 'Completed';
  updated: string;
}

const STATUSES = ['All', 'Planned', 'In Progress', 'Blocked', 'Completed'] as const;

const statusDotClass = (status: ProjectRow['status']) => {
  switch (status) {
    case 'Planned': return common.badgeDotPlanned;
    case 'In Progress': return common.badgeDotInProgress;
    case 'Blocked': return common.badgeDotBlocked;
    case 'Completed': return common.badgeDotCompleted;
  }
  return undefined;
};

const AdminProjects: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { projects, loading, error } = useAdminData();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');

  const rows: ProjectRow[] = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return (projects as any[]).map((p, idx) => ({
      id: String(p.id ?? idx),
      name: p.title ?? p.name,
      client: p.client ?? '—',
      budget: p.budget ?? '—',
      status: (p.status as ProjectRow['status']) ?? 'In Progress',
      updated: p.updatedAt ?? p.updated ?? '',
    }));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(p =>
      (status === 'All' || p.status === status) &&
      (!q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    );
  }, [rows, query, status]);

  // Sorting
  type SortKey = 'name' | 'client' | 'budget' | 'status' | 'updated';
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string = '';
      let bv: string = '';
      switch (sortKey) {
        case 'name': av = a.name || ''; bv = b.name || ''; break;
        case 'client': av = a.client || ''; bv = b.client || ''; break;
        case 'budget': av = a.budget || ''; bv = b.budget || ''; break;
        case 'status': av = a.status || ''; bv = b.status || ''; break;
        case 'updated': av = a.updated || ''; bv = b.updated || ''; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  React.useEffect(() => { setPage(1); }, [sortKey, sortDir, query, status, pageSize]);

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>Projects</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Platform-wide projects overview. Filter by status and search by name/client.</p>
          </div>
          <div className={common.controls} aria-label="Project filters">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="status">Status</label>
            <select id="status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)}>Create Project</button>
          </div>
        </ScrollReveal>

        <ScrollReveal className={common.tableWrap} aria-busy={loading || undefined} delay={0.2}>
          {error && <div className={common.error}>Failed to load projects.</div>}
          <div className={cn(common.toolbar)}>
            <div className={common.controls}>
              <label className={common.srOnly} htmlFor="sort-key">Sort by</label>
              <select id="sort-key" className={cn(common.select, themed.select)} value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                <option value="updated">Updated</option>
                <option value="status">Status</option>
                <option value="name">Name</option>
                <option value="client">Client</option>
                <option value="budget">Budget</option>
              </select>
              <label className={common.srOnly} htmlFor="sort-dir">Sort direction</label>
              <select id="sort-dir" className={cn(common.select, themed.select)} value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc'|'desc')}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <label className={common.srOnly} htmlFor="page-size">Rows per page</label>
              <select id="page-size" className={cn(common.select, themed.select)} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                className={cn(common.button, themed.button, 'secondary')}
                onClick={() => {
                  const header = ['ID','Name','Client','Budget','Status','Updated'];
                  const data = sorted.map(p => [p.id, p.name, p.client, p.budget, p.status, p.updated]);
                  const csv = [header, ...data]
                    .map(r => r.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `projects_export_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Export CSV</button>
            </div>
          </div>
          <table className={cn(common.table, themed.table)}>
            <thead>
              <tr>
                <th scope="col" className={themed.th + ' ' + common.th}>Name</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Client</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Budget</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Status</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Updated</th>
                <th scope="col" className={themed.th + ' ' + common.th} aria-label="Actions">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className={common.row}>
                    <td className={themed.td + ' ' + common.td} colSpan={6}>
                      <div className={common.skeletonRow}>
                        <Skeleton height={14} width={'40%'} />
                        <Skeleton height={12} width={'70%'} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className={common.row}>
                    <td className={themed.td + ' ' + common.td}>{p.name}</td>
                    <td className={themed.td + ' ' + common.td}>{p.client}</td>
                    <td className={themed.td + ' ' + common.td}>{p.budget}</td>
                    <td className={themed.td + ' ' + common.td}>
                      <span className={cn(common.badge, themed.badge)}>
                        <span className={cn(common.badgeDot, statusDotClass(p.status))} aria-hidden="true" />
                        {p.status}
                      </span>
                    </td>
                    <td className={themed.td + ' ' + common.td}>{p.updated}</td>
                    <td className={themed.td + ' ' + common.td}>
                      <div className={common.rowActions}>
                        <button type="button" className={cn(common.button, themed.button, 'secondary')}>Open</button>
                        <button type="button" className={cn(common.button, themed.button)}>Assign</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {sorted.length === 0 && !loading && (
            <div className={cn(common.empty)} role="status" aria-live="polite">No projects match your filters.</div>
          )}
          {sorted.length > 0 && (
            <div className={common.paginationBar} role="navigation" aria-label="Pagination">
              <button
                type="button"
                className={cn(common.button, themed.button, 'secondary')}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                aria-label="Previous page"
              >Prev</button>
              <span className={common.paginationInfo} aria-live="polite">Page {pageSafe} of {totalPages} · {sorted.length} result(s)</span>
              <button
                type="button"
                className={cn(common.button, themed.button)}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                aria-label="Next page"
              >Next</button>
            </div>
          )}
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default AdminProjects;
