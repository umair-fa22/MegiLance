// @AI-HINT: Public Job Details component
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Clock, Briefcase } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Link from 'next/link';

import commonStyles from './JobDetails.common.module.css';
import lightStyles from './JobDetails.light.module.css';
import darkStyles from './JobDetails.dark.module.css';

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_type: string;
  budget_min: number;
  budget_max: number;
  experience_level: string;
  estimated_duration: string;
  skills: string[];
  client_id: number;
  status: string;
  created_at: string;
}

interface JobDetailsProps {
  jobId: string;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId }) => {
  const { resolvedTheme } = useTheme();
  const [job, setJob] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    mainContent: cn(commonStyles.mainContent, themeStyles.mainContent),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    meta: cn(commonStyles.meta, themeStyles.meta),
    section: cn(commonStyles.section, themeStyles.section),
    sectionTitle: cn(commonStyles.sectionTitle, themeStyles.sectionTitle),
    description: cn(commonStyles.description, themeStyles.description),
    skills: cn(commonStyles.skills, themeStyles.skills),
    skillTag: cn(commonStyles.skillTag, themeStyles.skillTag),
    sidebar: cn(commonStyles.sidebar, themeStyles.sidebar),
    sidebarCard: cn(commonStyles.sidebarCard, themeStyles.sidebarCard),
    sidebarItem: cn(commonStyles.sidebarItem, themeStyles.sidebarItem),
    sidebarLabel: cn(commonStyles.sidebarLabel, themeStyles.sidebarLabel),
    sidebarValue: cn(commonStyles.sidebarValue, themeStyles.sidebarValue),
    applyButton: cn(commonStyles.applyButton, themeStyles.applyButton),
    loading: cn(commonStyles.loading, themeStyles.loading),
    error: cn(commonStyles.error, themeStyles.error),
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.projects.get(parseInt(jobId));
      setJob(data as Project);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setError('Failed to load job details.');
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (project: Project) => {
    if (project.budget_type === 'fixed') {
      if (project.budget_max) {
        return `$${project.budget_max.toLocaleString()}`;
      }
      return 'Fixed Price';
    } else {
      return `$${project.budget_min} - $${project.budget_max}/hr`;
    }
  };

  if (loading) return <div className={styles.loading}>Loading job details...</div>;
  if (error || !job) return <div className={styles.error}>{error || 'Job not found'}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>{job.title}</h1>
          <div className={styles.meta}>
            <span className="flex items-center gap-1">
              <Briefcase size={14} /> {job.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> Posted {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <div className={styles.description}>{job.description}</div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills Required</h2>
          <div className={styles.skills}>
            {job.skills.map((skill, index) => (
              <span key={index} className={styles.skillTag}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.sidebarCard}>
          <Link href={`/freelancer/submit-proposal?jobId=${job.id}`} className="w-full">
            <Button variant="primary" size="lg" fullWidth>
              Apply Now
            </Button>
          </Link>
          
          <div className={styles.sidebarItem}>
            <span className={styles.sidebarLabel}>Budget</span>
            <span className={styles.sidebarValue}>{formatBudget(job)}</span>
          </div>

          <div className={styles.sidebarItem}>
            <span className={styles.sidebarLabel}>Experience Level</span>
            <span className={styles.sidebarValue}>{job.experience_level}</span>
          </div>

          <div className={styles.sidebarItem}>
            <span className={styles.sidebarLabel}>Project Type</span>
            <span className={styles.sidebarValue}>
              {job.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price'}
            </span>
          </div>

          <div className={styles.sidebarItem}>
            <span className={styles.sidebarLabel}>Duration</span>
            <span className={styles.sidebarValue}>{job.estimated_duration}</span>
          </div>
        </div>

        <div className={styles.sidebarCard}>
          <h3 className={styles.sectionTitle}>About the Client</h3>
          <div className={styles.sidebarItem}>
            <span className={styles.sidebarLabel}>Client ID</span>
            <span className={styles.sidebarValue}>#{job.client_id}</span>
          </div>
          {/* Add more client info if available */}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
