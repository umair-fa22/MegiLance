// @AI-HINT: Freelancer saved jobs page - bookmarked project listings for later application
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { Bookmark, Briefcase, Clock, Users, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api/core';
import commonStyles from './SavedJobs.common.module.css';
import lightStyles from './SavedJobs.light.module.css';
import darkStyles from './SavedJobs.dark.module.css';

interface SavedJob {
  id: string;
  title: string;
  description: string;
  budget_type: 'fixed' | 'hourly';
  budget_min: number;
  budget_max: number;
  skills: string[];
  client_name: string;
  posted_at: string;
  proposals_count: number;
  saved_at: string;
}

export default function SavedJobsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<any>('/saved-jobs');
      setSavedJobs(Array.isArray(data) ? data : data.items || data.jobs || []);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId: string) => {
    setRemovingId(jobId);
    try {
      await apiFetch(`/saved-jobs/${jobId}`, { method: 'DELETE' });
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job:', err);
      // Optimistic removal even on network error
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    } finally {
      setRemovingId(null);
    }
  };

  const formatBudget = (job: SavedJob) => {
    if (job.budget_type === 'hourly') {
      return `$${job.budget_min} - $${job.budget_max}/hr`;
    }
    return `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <h1 className={cn(commonStyles.title, themeStyles.title)}>
              <Bookmark size={28} />
              Saved Jobs
            </h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved for later
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <p>Loading saved jobs...</p>
          </div>
        ) : savedJobs.length === 0 ? (
          <ScrollReveal>
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <Bookmark size={48} strokeWidth={1.5} opacity={0.5} />
              <h3>No Saved Jobs</h3>
              <p>Browse projects and save interesting ones for later</p>
              <Button variant="primary" onClick={() => router.push('/freelancer/jobs')}>
                Browse Jobs
              </Button>
            </div>
          </ScrollReveal>
        ) : (
          <StaggerContainer className={commonStyles.jobsList}>
            {savedJobs.map(job => (
              <StaggerItem key={job.id}>
                <div className={cn(commonStyles.jobCard, themeStyles.jobCard)}>
                  <div className={commonStyles.jobHeader}>
                    <div className={commonStyles.jobTitleRow}>
                      <h3 className={cn(commonStyles.jobTitle, themeStyles.jobTitle)}>{job.title}</h3>
                      <span className={cn(commonStyles.savedTime, themeStyles.savedTime)}>
                        <Clock size={14} /> Saved {formatTimeAgo(job.saved_at)}
                      </span>
                    </div>
                    <p className={cn(commonStyles.clientName, themeStyles.clientName)}>
                      <Briefcase size={14} /> {job.client_name} • Posted {formatTimeAgo(job.posted_at)}
                    </p>
                  </div>

                  <p className={cn(commonStyles.description, themeStyles.description)}>
                    {job.description}
                  </p>

                  <div className={commonStyles.skills}>
                    {job.skills.map(skill => (
                      <span key={skill} className={cn(commonStyles.skill, themeStyles.skill)}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className={commonStyles.jobFooter}>
                    <div className={commonStyles.jobMeta}>
                      <span className={cn(commonStyles.budget, themeStyles.budget)}>
                        {formatBudget(job)}
                        <span className={cn(commonStyles.budgetType, themeStyles.budgetType)}>
                          {job.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price'}
                        </span>
                      </span>
                      <span className={cn(commonStyles.proposals, themeStyles.proposals)}>
                        <Users size={14} /> {job.proposals_count} proposal{job.proposals_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className={commonStyles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(job.id)}
                        isLoading={removingId === job.id}
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/freelancer/jobs/${job.id}`)}
                      >
                        <ExternalLink size={14} /> View & Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
