// @AI-HINT: This component provides a fully theme-aware queue for admins to moderate job postings. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Card from '@/app/components/Card/Card';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import { Check, X, Search, ListFilter, Building2, CalendarDays, ChevronDown, ChevronUp, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

import commonStyles from './JobModerationQueue.common.module.css';
import lightStyles from './JobModerationQueue.light.module.css';
import darkStyles from './JobModerationQueue.dark.module.css';

interface APIProject {
  id: number;
  title: string;
  description: string;
  status: string;
  budget_min: number;
  budget_max: number;
  client_id: number;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  client: { name: string; avatarUrl: string; };
  dateSubmitted: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  riskLevel: 'Low' | 'Medium' | 'High';
  budget: number;
}

// Estimate risk level based on project characteristics
function calculateRiskLevel(project: APIProject): 'Low' | 'Medium' | 'High' {
  const budget = project.budget_max || project.budget_min || 0;
  const description = (project.description || '').toLowerCase();
  
  // High risk indicators
  const highRiskKeywords = ['crypto', 'blockchain', 'defi', 'nft', 'trading', 'gambling', 'adult'];
  if (highRiskKeywords.some(kw => description.includes(kw)) || budget > 50000) {
    return 'High';
  }
  
  // Medium risk indicators
  if (budget > 10000 || description.length < 50) {
    return 'Medium';
  }
  
  return 'Low';
}

// Map API status to display status
function mapStatus(status: string): 'Pending' | 'Approved' | 'Rejected' {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower === 'open' || statusLower === 'pending' || statusLower === 'draft') {
    return 'Pending';
  }
  if (statusLower === 'active' || statusLower === 'approved' || statusLower === 'in_progress') {
    return 'Approved';
  }
  if (statusLower === 'rejected' || statusLower === 'cancelled' || statusLower === 'closed') {
    return 'Rejected';
  }
  return 'Pending';
}

interface JobCardProps {
  job: Job;
  onModerate: (id: string, newStatus: 'Approved' | 'Rejected') => void;
  themeStyles: { [key: string]: string };
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onModerate, themeStyles, isExpanded, onToggleExpand }) => {
  const riskBadgeVariant = { 
    High: 'danger' as const, 
    Medium: 'warning' as const, 
    Low: 'success' as const 
  }[job.riskLevel];

  return (
    <Card className={cn(commonStyles.jobCard, themeStyles.jobCard)}>
      <div className={commonStyles.cardHeader}>
        <h3 className={cn(commonStyles.jobTitle, themeStyles.jobTitle)}>{job.title}</h3>
        <Badge variant={riskBadgeVariant}>{job.riskLevel} Risk</Badge>
      </div>

      <div className={commonStyles.cardMeta}>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Building2 size={14} />
          <UserAvatar src={job.client.avatarUrl} name={job.client.name} size={24} />
          <span>{job.client.name}</span>
        </div>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <CalendarDays size={14} />
          <span>{new Date(job.dateSubmitted).toLocaleDateString()}</span>
        </div>
        {job.budget > 0 && (
          <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
            <span>${job.budget.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className={cn(commonStyles.description, isExpanded ? commonStyles.expanded : '')}>
        <p>{job.description || 'No description provided.'}</p>
      </div>
      <button onClick={onToggleExpand} className={cn(commonStyles.expandButton, themeStyles.expandButton)}>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>

      <div className={commonStyles.cardActions}>
        <Button variant="success" onClick={() => onModerate(job.id, 'Approved')}><Check size={16} /> Approve</Button>
        <Button variant="danger" onClick={() => onModerate(job.id, 'Rejected')}><X size={16} /> Reject</Button>
      </div>
    </Card>
  );
};

const JobModerationQueue = () => {
  const { resolvedTheme } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch projects and users in parallel
      const [projectsData, usersData] = await Promise.all([
        api.admin.getProjects({ limit: 100 }),
        api.admin.getUsers({ limit: 200 }),
      ]);
      
      const projects: APIProject[] = (projectsData as any).projects ?? projectsData ?? [];
      const users = (usersData as any).users ?? usersData ?? [];
      
      // Create user lookup map
      const userMap = new Map<number, { name: string; avatar_url?: string }>();
      users.forEach((u: { id: number; name: string; avatar_url?: string }) => {
        userMap.set(u.id, { name: u.name || 'Unknown', avatar_url: u.avatar_url });
      });
      
      // Transform projects to jobs
      const transformed: Job[] = projects.map(project => {
        const client = userMap.get(project.client_id) || { name: `Client #${project.client_id}`, avatar_url: '' };
        return {
          id: String(project.id),
          title: project.title || 'Untitled Project',
          description: project.description || '',
          client: { name: client.name, avatarUrl: client.avatar_url || '' },
          dateSubmitted: project.created_at || new Date().toISOString(),
          status: mapStatus(project.status),
          riskLevel: calculateRiskLevel(project),
          budget: project.budget_max || project.budget_min || 0,
        };
      });
      
      setJobs(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleModerate = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      // Map to backend status
      const backendStatus = newStatus === 'Approved' ? 'active' : 'rejected';
      
      await api.projects.update(Number(id), { status: backendStatus });
      
      // Update local state regardless of API response for optimistic UI
      setJobs(prev => prev.map(job => (job.id === id ? { ...job, status: newStatus } : job)));
      
    } catch {
      // Revert optimistic update on error
      setJobs(prev => prev.map(job => (job.id === id ? { ...job, status: 'Pending' } : job)));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredAndSortedJobs = jobs
    .filter(job => job.status === 'Pending')
    .filter(job => riskFilter === 'All' || job.riskLevel === riskFilter)
    .filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'date-desc') return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
      if (sortOrder === 'date-asc') return new Date(a.dateSubmitted).getTime() - new Date(b.dateSubmitted).getTime();
      const riskOrder = { High: 3, Medium: 2, Low: 1 };
      if (sortOrder === 'risk-desc') return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      if (sortOrder === 'risk-asc') return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      return 0;
    });

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <div className={commonStyles.headerContent}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Job Moderation Queue</h2>
          <p className={cn(commonStyles.description, themeStyles.description)}>
            {loading ? 'Loading...' : `${filteredAndSortedJobs.length} jobs awaiting moderation.`}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchProjects}
          iconBefore={<RefreshCw size={16} />}
          aria-label="Refresh jobs"
        >
          Refresh
        </Button>
      </header>

      <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
        <Input
          id="search-jobs"
          placeholder="Search jobs or clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          iconBefore={<Search size={16} />}
        />
        <div className={commonStyles.filters}>
          <Select
            id="risk-filter"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Risks' },
              { value: 'Low', label: 'Low Risk' },
              { value: 'Medium', label: 'Medium Risk' },
              { value: 'High', label: 'High Risk' },
            ]}
          />
          <Select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            options={[
              { value: 'date-desc', label: 'Newest First' },
              { value: 'date-asc', label: 'Oldest First' },
              { value: 'risk-desc', label: 'Highest Risk First' },
              { value: 'risk-asc', label: 'Lowest Risk First' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <Loader2 className={commonStyles.spinner} size={32} />
          <p>Loading jobs...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.errorState, themeStyles.errorState)}>
          <AlertTriangle size={32} />
          <h3>Failed to load jobs</h3>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchProjects}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className={commonStyles.jobGrid}>
          {filteredAndSortedJobs.length > 0 ? (
            filteredAndSortedJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                onModerate={handleModerate} 
                themeStyles={themeStyles} 
                isExpanded={expandedJobs.has(job.id)}
                onToggleExpand={() => toggleExpand(job.id)}
              />
            ))
          ) : (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <ListFilter size={48} />
              <h3>No Jobs Awaiting Moderation</h3>
              <p>All jobs have been reviewed or adjust your filters to find pending jobs.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobModerationQueue;
