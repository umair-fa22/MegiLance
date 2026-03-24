// @AI-HINT: Portal Projects page. Theme-aware, accessible, animated grid of project cards. Fetches from dashboard API.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Loader2 } from 'lucide-react';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import common from './Projects.common.module.css';
import light from './Projects.light.module.css';
import dark from './Projects.dark.module.css';

interface Project {
  id: string;
  title: string;
  client: string;
  status: 'In Progress' | 'Review' | 'Completed' | 'Overdue';
  progress: number;
  budget: string;
}

const STATUSES = ['All', 'In Progress', 'Review', 'Completed', 'Overdue'] as const;

const Projects: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { data, loading, error } = useDashboardData();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');

  // Transform API data to Project interface
  const allProjects = useMemo<Project[]>(() => {
    if (!data?.recentProjects) return [];
    return data.recentProjects.map((p) => ({
      id: String(p.id),
      title: p.title,
      client: p.client,
      status: p.status,
      progress: p.progress,
      budget: p.budget || '$0',
    }));
  }, [data]);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allProjects.filter(p =>
      (status === 'All' || p.status === status) &&
      (!q || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    );
    return filtered;
  }, [query, status, allProjects]);

  if (loading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.loadingState}>
            <Loader2 className={common.spinner} size={32} />
            <span>Loading projects...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {error && (
            <div className={cn(common.errorBanner, themed.errorBanner)}>
              {error}
            </div>
          )}
          <ScrollReveal>
            <div className={common.header}>
              <div>
                <h1 className={common.title}>Projects</h1>
                <p className={cn(common.subtitle, themed.subtitle)}>Track progress, budgets, and status across all projects.</p>
              </div>
              <div className={common.controls} aria-label="Project filters">
                <label className={common.srOnly} htmlFor="project-q">Search projects</label>
                <input id="project-q" className={cn(common.input, themed.input)} type="search" placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />

                <label className={common.srOnly} htmlFor="project-status">Status</label>
                <select id="project-status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button type="button" className={cn(common.button, themed.button)} aria-label="Create project">New Project</button>
              </div>
            </div>
          </ScrollReveal>

          <StaggerContainer className={common.grid}>
            {projects.map(p => (
              <article key={p.id} tabIndex={0} aria-labelledby={`proj-${p.id}-title`} className={cn(common.card)}>
                <h3 id={`proj-${p.id}-title`} className={common.cardTitle}>{p.title}</h3>
                <div className={common.meta}>
                  <span>{p.client}</span>
                  <span>{p.status}</span>
                  <span>{p.budget}</span>
                </div>
                <div className={cn(common.progressWrap, themed.progressWrap)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.progress} aria-label={`Progress ${p.progress}%`}>
                  {/* SVG progress to avoid inline styles */}
                  <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                    <rect x="0" y="0" width="100" height="8" rx="4" ry="4" fill="transparent" />
                    <rect x="0" y="0" width={p.progress} height="8" rx="4" ry="4" className={cn(common.progressBar, themed.progressBar)} />
                  </svg>
                </div>
                <div className={common.chips}>
                  <span className={cn(common.chip, themed.chip)}>Design</span>
                  <span className={cn(common.chip, themed.chip)}>Frontend</span>
                </div>
                <div className={common.actions}>
                  <button className={cn(common.button, themed.button)} aria-label={`Open ${p.title}`}>Open</button>
                  <button className={cn(common.button, themed.button, 'secondary')} aria-label={`Archive ${p.title}`}>Archive</button>
                </div>
              </article>
            ))}
          </StaggerContainer>
        </div>
      </main>
    </PageTransition>
  );
};

export default Projects;
