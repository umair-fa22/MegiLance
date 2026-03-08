// @AI-HINT: Enhanced Job Search Page for Freelancers. Features real-time filtering, AI matching, skeleton loading, and responsive layout.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { searchApi, projectsApi } from '@/lib/api';
import { Button } from '@/app/components/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import JobCard from '@/app/components/JobCard/JobCard';
import { PageTransition, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import { Search, Filter, X, Briefcase, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import commonStyles from './Jobs.common.module.css';
import lightStyles from './Jobs.light.module.css';
import darkStyles from './Jobs.dark.module.css';

// Types
interface Job {
  id: number;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  budget_type: 'fixed' | 'hourly';
  skills: string[];
  posted_at: string;
  client_rating: number;
  match_score?: number; // AI Match Score
}

export default function JobsPage() {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  // State
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'best-matches' | 'most-recent' | 'saved'>('best-matches');
  
  // Filters
  const [category, setCategory] = useState('all');
  const [budgetType, setBudgetType] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [projectLength, setProjectLength] = useState('all');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let response: any;
      const filters: any = {};
      if (category !== 'all') filters.category = category;
      if (minBudget) filters.budget_min = parseInt(minBudget);
      
      if (query) {
        response = await searchApi.projects(query, filters);
      } else {
        response = await projectsApi.list(filters);
      }
      
      // Handle different API response structures
      const data = Array.isArray(response) ? response : (response.projects || []);
      
      // Normalize data — use API values or sensible defaults
      const enrichedData = data.map((job: any) => ({
        ...job,
        match_score: job.match_score || null,
        client_rating: job.client_rating || null,
        is_verified: job.is_verified ?? false,
        client_name: job.client_name || 'Anonymous Client'
      }));
      
      // Sort based on tab
      if (activeTab === 'best-matches') {
        enrichedData.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0));
      } else if (activeTab === 'most-recent') {
        enrichedData.sort((a: any, b: any) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
      }
      
      setJobs(enrichedData);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [query, category, minBudget, activeTab, experienceLevel, projectLength]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchJobs]);


  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Find Your Next Project</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Discover thousands of opportunities tailored to your skills and expertise.
          </p>
          
          <div className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
            <Search className="text-gray-400 ml-3" size={24} />
            <input 
              type="text" 
              placeholder="Search projects by title, skills, or keywords..." 
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="primary" size="lg" onClick={fetchJobs}>Search</Button>
          </div>
        </div>

        <div className={commonStyles.layout}>
          {/* Filters Sidebar */}
          <aside className={cn(commonStyles.filters, themeStyles.filters, showFilters ? 'block' : 'hidden lg:block')}>
            <div className={commonStyles.filterHeader}>
              <h3 className={cn(commonStyles.filterTitle, themeStyles.filterTitle)}>Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setCategory('all');
                setBudgetType('all');
                setMinBudget('');
                setExperienceLevel('all');
                setProjectLength('all');
              }}>Reset</Button>
            </div>

            <div className={commonStyles.filterGroup}>
              <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Category</label>
              <Select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'web-dev', label: 'Web Development' },
                  { value: 'mobile-dev', label: 'Mobile Development' },
                  { value: 'design', label: 'Design & Creative' },
                  { value: 'writing', label: 'Writing & Translation' },
                ]}
              />
            </div>

            <div className={commonStyles.filterGroup}>
              <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Project Type</label>
              <Select 
                value={budgetType} 
                onChange={(e) => setBudgetType(e.target.value)}
                options={[
                  { value: 'all', label: 'Any Type' },
                  { value: 'fixed', label: 'Fixed Price' },
                  { value: 'hourly', label: 'Hourly Rate' },
                ]}
              />
            </div>

            <div className={commonStyles.filterGroup}>
              <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Min Budget ($)</label>
              <Input 
                type="number" 
                placeholder="e.g. 500" 
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
            </div>

            <div className={commonStyles.filterGroup}>
              <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Experience Level</label>
              <Select 
                value={experienceLevel} 
                onChange={(e) => setExperienceLevel(e.target.value)}
                options={[
                  { value: 'all', label: 'Any Level' },
                  { value: 'entry', label: 'Entry Level' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'expert', label: 'Expert' },
                ]}
              />
            </div>

            <div className={commonStyles.filterGroup}>
              <label className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Project Length</label>
              <Select 
                value={projectLength} 
                onChange={(e) => setProjectLength(e.target.value)}
                options={[
                  { value: 'all', label: 'Any Length' },
                  { value: 'less_1_month', label: '< 1 Month' },
                  { value: '1_3_months', label: '1-3 Months' },
                  { value: '3_6_months', label: '3-6 Months' },
                  { value: 'more_6_months', label: '> 6 Months' },
                ]}
              />
            </div>
          </aside>

          {/* Job Results */}
          <main>
            <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
              <button 
                className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'best-matches' && themeStyles.activeTab)}
                onClick={() => setActiveTab('best-matches')}
              >
                Best Matches
              </button>
              <button 
                className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'most-recent' && themeStyles.activeTab)}
                onClick={() => setActiveTab('most-recent')}
              >
                Most Recent
              </button>
              <button 
                className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'saved' && themeStyles.activeTab)}
                onClick={() => setActiveTab('saved')}
              >
                Saved Jobs
              </button>
            </div>

            <div className={commonStyles.resultsHeader}>
              <span className={cn(commonStyles.resultsCount, themeStyles.resultsCount)}>
                {loading ? 'Searching...' : `${jobs.length} project${jobs.length !== 1 ? 's' : ''} found`}
              </span>
              <div className="lg:hidden">
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={16} className="mr-2" /> Filters
                </Button>
              </div>
            </div>

            {loading ? (
              <div className={commonStyles.skeletonGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={cn(commonStyles.skeletonCard, themeStyles.skeletonCard)}>
                    <div className={commonStyles.skeletonHeader}>
                      <Skeleton className={commonStyles.skeletonTitle} />
                      <Skeleton className={commonStyles.skeletonBadge} />
                    </div>
                    <Skeleton className={commonStyles.skeletonDescription} />
                    <Skeleton className={commonStyles.skeletonDescription} />
                    <div className={commonStyles.skeletonFooter}>
                      <Skeleton className={commonStyles.skeletonChip} />
                      <Skeleton className={commonStyles.skeletonChip} />
                      <Skeleton className={commonStyles.skeletonChip} />
                    </div>
                    <div className={commonStyles.skeletonMeta}>
                      <Skeleton className={commonStyles.skeletonBudget} />
                      <Skeleton className={commonStyles.skeletonDate} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <StaggerContainer className={commonStyles.jobGrid}>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <StaggerItem key={job.id}>
                      <JobCard 
                        {...{
                          id: job.id,
                          title: job.title,
                          clientName: (job as any).client_name,
                          description: job.description,
                          budget: job.budget_max || job.budget_min,
                          postedAt: job.posted_at,
                          skills: job.skills || [],
                          matchScore: job.match_score,
                          clientRating: job.client_rating,
                          isVerified: (job as any).is_verified,
                        } as any}
                      />
                    </StaggerItem>
                  ))
                ) : (
                  <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                    <Briefcase size={48} className={commonStyles.emptyIcon} />
                    <h3 className={commonStyles.emptyTitle}>No matching projects</h3>
                    <p className={commonStyles.emptyText}>No projects match your current search and filters. Try broadening your criteria or check back later for new opportunities.</p>
                    <Button variant="primary" onClick={() => {
                      setQuery('');
                      setCategory('all');
                      setBudgetType('all');
                      setMinBudget('');
                    }}>Clear Filters</Button>
                  </div>
                )}
              </StaggerContainer>
            )}
          </main>
        </div>
      </div>
    </PageTransition>
  );
}
