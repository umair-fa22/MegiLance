// @AI-HINT: Saved job searches page - manage saved search filters for quick job discovery
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { searchesApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Button from '@/app/components/Button/Button';
import Modal from '@/app/components/Modal/Modal';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { Search, Bell, Sparkles, BarChart3, Pencil, Trash2, Play } from 'lucide-react';
import commonStyles from './SavedSearches.common.module.css';
import lightStyles from './SavedSearches.light.module.css';
import darkStyles from './SavedSearches.dark.module.css';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    skills?: string[];
    experienceLevel?: string;
    projectType?: string;
    location?: string;
  };
  alertEnabled: boolean;
  alertFrequency: 'instant' | 'daily' | 'weekly';
  matchCount: number;
  newMatches: number;
  lastRun: string;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedSearch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [newSearch, setNewSearch] = useState({
    name: '',
    query: '',
    category: '',
    minBudget: '',
    maxBudget: '',
    skills: '',
    experienceLevel: '',
    projectType: '',
    alertEnabled: true,
    alertFrequency: 'daily' as 'instant' | 'daily' | 'weekly'
  });

  useEffect(() => {
    setMounted(true);
    return () => { abortRef.current?.abort(); };
  }, []);

  const fetchSavedSearches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchesApi.getSaved('jobs') as any;
      const items = res?.saved_searches || res?.searches || (Array.isArray(res) ? res : []);
      
      setSearches(items.map((s: any) => ({
        id: s.id?.toString() || '',
        name: s.name || 'Untitled Search',
        query: s.criteria?.query || s.criteria?.keywords || s.query || '',
        filters: {
          category: s.criteria?.category || s.category,
          minBudget: s.criteria?.min_budget || s.criteria?.budget_min,
          maxBudget: s.criteria?.max_budget || s.criteria?.budget_max,
          skills: s.criteria?.skills || [],
          experienceLevel: s.criteria?.experience_level,
          projectType: s.criteria?.project_type,
          location: s.criteria?.location,
        },
        alertEnabled: s.is_alert ?? s.alert_enabled ?? false,
        alertFrequency: s.alert_frequency || 'daily',
        matchCount: s.match_count || s.results_count || 0,
        newMatches: s.new_matches || 0,
        lastRun: s.last_executed || s.last_run || s.updated_at || s.created_at,
        createdAt: s.created_at,
      })));
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load saved searches:', err);
        }
        showToast('Failed to load saved searches', 'error');
        setSearches([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) fetchSavedSearches();
  }, [mounted, fetchSavedSearches]);

  const handleCreateSearch = async () => {
    try {
      const payload = {
        name: newSearch.name,
        category: 'jobs',
        criteria: {
          query: newSearch.query,
          category: newSearch.category || undefined,
          min_budget: newSearch.minBudget ? parseInt(newSearch.minBudget) : undefined,
          max_budget: newSearch.maxBudget ? parseInt(newSearch.maxBudget) : undefined,
          skills: newSearch.skills ? newSearch.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          experience_level: newSearch.experienceLevel || undefined,
          project_type: newSearch.projectType || undefined,
        },
        is_alert: newSearch.alertEnabled,
        alert_frequency: newSearch.alertFrequency,
      };

      if (editingSearch) {
        await searchesApi.update(editingSearch.id, payload as any);
        showToast('Search updated successfully!');
      } else {
        await searchesApi.save(payload as any);
        showToast('Saved search created!');
      }

      setShowCreateModal(false);
      setEditingSearch(null);
      setNewSearch({
        name: '',
        query: '',
        category: '',
        minBudget: '',
        maxBudget: '',
        skills: '',
        experienceLevel: '',
        projectType: '',
        alertEnabled: true,
        alertFrequency: 'daily'
      });
      fetchSavedSearches();
    } catch {
      showToast('Failed to save search. Please try again.', 'error');
    }
  };

  const toggleAlert = async (id: string) => {
    const search = searches.find(s => s.id === id);
    if (!search) return;
    const newEnabled = !search.alertEnabled;
    // Optimistic update
    setSearches(searches.map(s => 
      s.id === id ? { ...s, alertEnabled: newEnabled } : s
    ));
    try {
      await searchesApi.toggleAlert(id, newEnabled, search.alertFrequency);
    } catch {
      // Rollback
      setSearches(searches.map(s => 
        s.id === id ? { ...s, alertEnabled: !newEnabled } : s
      ));
      showToast('Failed to update alert', 'error');
    }
  };

  const deleteSearch = async (search: SavedSearch) => {
    setDeleteTarget(null);
    const prevSearches = [...searches];
    setSearches(searches.filter(s => s.id !== search.id));
    try {
      await searchesApi.delete(search.id);
      showToast('Saved search deleted.');
    } catch {
      setSearches(prevSearches);
      showToast('Failed to delete search', 'error');
    }
  };

  const runSearch = (search: SavedSearch) => {
    // Navigate to jobs page with search params
    const params = new URLSearchParams();
    params.set('q', search.query);
    if (search.filters.category) params.set('category', search.filters.category);
    if (search.filters.minBudget) params.set('minBudget', search.filters.minBudget.toString());
    if (search.filters.maxBudget) params.set('maxBudget', search.filters.maxBudget.toString());
    router.push(`/freelancer/jobs?${params.toString()}`);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'instant': return 'Instant';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return freq;
    }
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Saved Searches</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your job search filters and alerts
              </p>
            </div>
            <button 
              className={cn(commonStyles.createButton, themeStyles.createButton)}
              onClick={() => setShowCreateModal(true)}
            >
              + New Saved Search
            </button>
          </div>
        </ScrollReveal>

        {/* Stats Summary */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><Search size={20} /></span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{searches.length}</div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Saved Searches</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><Bell size={20} /></span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {searches.filter(s => s.alertEnabled).length}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Alerts</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><Sparkles size={20} /></span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {searches.reduce((sum, s) => sum + s.newMatches, 0)}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>New Matches</div>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><BarChart3 size={20} /></span>
              <div>
                <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  {searches.reduce((sum, s) => sum + s.matchCount, 0)}
                </div>
                <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Matches</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Saved Searches List */}
        {searches.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <EmptyState
              title="No saved searches yet"
              description="Create your first saved search to get notified when new jobs match your criteria."
              icon={<Search size={48} />}
              action={
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create Saved Search
                </Button>
              }
            />
          </ScrollReveal>
        ) : (
          <StaggerContainer className={commonStyles.searchesList} delay={0.2}>
            {searches.map(search => (
              <StaggerItem key={search.id}>
                <div className={cn(commonStyles.searchCard, themeStyles.searchCard)}>
                  <div className={commonStyles.searchHeader}>
                    <div className={commonStyles.searchInfo}>
                      <h3 className={cn(commonStyles.searchName, themeStyles.searchName)}>
                        {search.name}
                        {search.newMatches > 0 && (
                          <span className={cn(commonStyles.newBadge, themeStyles.newBadge)}>
                            {search.newMatches} new
                          </span>
                        )}
                      </h3>
                      <p className={cn(commonStyles.searchQuery, themeStyles.searchQuery)}>
                        &quot;{search.query}&quot;
                      </p>
                    </div>
                    <div className={commonStyles.searchActions}>
                      <Button 
                        variant="primary"
                        size="sm"
                        iconBefore={<Play size={14} />}
                        onClick={() => runSearch(search)}
                      >
                        Run
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        iconBefore={<Pencil size={14} />}
                        onClick={() => setEditingSearch(search)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger"
                        size="sm"
                        iconBefore={<Trash2 size={14} />}
                        onClick={() => setDeleteTarget(search)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className={commonStyles.filterTags}>
                    {search.filters.category && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        📁 {search.filters.category}
                      </span>
                    )}
                    {(search.filters.minBudget || search.filters.maxBudget) && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        💰 ${search.filters.minBudget || 0} - ${search.filters.maxBudget || '∞'}
                      </span>
                    )}
                    {search.filters.experienceLevel && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        📊 {search.filters.experienceLevel}
                      </span>
                    )}
                    {search.filters.projectType && (
                      <span className={cn(commonStyles.filterTag, themeStyles.filterTag)}>
                        📋 {search.filters.projectType}
                      </span>
                    )}
                    {search.filters.skills?.map(skill => (
                      <span key={skill} className={cn(commonStyles.skillTag, themeStyles.skillTag)}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className={commonStyles.searchFooter}>
                    <div className={commonStyles.searchMeta}>
                      <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                        {search.matchCount} matches
                      </span>
                      <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                        Last run: {new Date(search.lastRun).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={commonStyles.alertToggle}>
                      <label className={cn(commonStyles.toggleLabel, themeStyles.toggleLabel)}>
                        <span>Alert: {getFrequencyLabel(search.alertFrequency)}</span>
                        <button 
                          className={cn(
                            commonStyles.toggle,
                            themeStyles.toggle,
                            search.alertEnabled && commonStyles.toggleActive,
                            search.alertEnabled && themeStyles.toggleActive
                          )}
                          onClick={() => toggleAlert(search.id)}
                        >
                          <span className={commonStyles.toggleKnob} />
                        </button>
                      </label>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingSearch) && (
          <div className={cn(commonStyles.modalOverlay, themeStyles.modalOverlay)} onClick={() => { setShowCreateModal(false); setEditingSearch(null); }}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                {editingSearch ? 'Edit Saved Search' : 'Create Saved Search'}
              </h2>
              
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Search Name</label>
                <input
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., React Development Jobs"
                  value={newSearch.name}
                  onChange={e => setNewSearch({ ...newSearch, name: e.target.value })}
                />
              </div>
              
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Search Query</label>
                <input
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., React developer"
                  value={newSearch.query}
                  onChange={e => setNewSearch({ ...newSearch, query: e.target.value })}
                />
              </div>
              
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Category</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newSearch.category}
                    onChange={e => setNewSearch({ ...newSearch, category: e.target.value })}
                  >
                    <option value="">Any Category</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Design">Design</option>
                    <option value="Writing">Writing</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Experience Level</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newSearch.experienceLevel}
                    onChange={e => setNewSearch({ ...newSearch, experienceLevel: e.target.value })}
                  >
                    <option value="">Any Level</option>
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Min Budget ($)</label>
                  <input
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="0"
                    value={newSearch.minBudget}
                    onChange={e => setNewSearch({ ...newSearch, minBudget: e.target.value })}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Max Budget ($)</label>
                  <input
                    type="number"
                    className={cn(commonStyles.input, themeStyles.input)}
                    placeholder="No limit"
                    value={newSearch.maxBudget}
                    onChange={e => setNewSearch({ ...newSearch, maxBudget: e.target.value })}
                  />
                </div>
              </div>
              
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Skills (comma-separated)</label>
                <input
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="e.g., React, TypeScript, Node.js"
                  value={newSearch.skills}
                  onChange={e => setNewSearch({ ...newSearch, skills: e.target.value })}
                />
              </div>
              
              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Alert Frequency</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newSearch.alertFrequency}
                    onChange={e => setNewSearch({ ...newSearch, alertFrequency: e.target.value as 'instant' | 'daily' | 'weekly' })}
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.checkboxLabel, themeStyles.checkboxLabel)}>
                    <input
                      type="checkbox"
                      checked={newSearch.alertEnabled}
                      onChange={e => setNewSearch({ ...newSearch, alertEnabled: e.target.checked })}
                    />
                    <span>Enable email alerts</span>
                  </label>
                </div>
              </div>
              
              <div className={commonStyles.modalActions}>
                <button 
                  className={cn(commonStyles.cancelButton, themeStyles.cancelButton)}
                  onClick={() => { setShowCreateModal(false); setEditingSearch(null); }}
                >
                  Cancel
                </button>
                <button 
                  className={cn(commonStyles.saveButton, themeStyles.saveButton)}
                  onClick={handleCreateSearch}
                  disabled={!newSearch.name || !newSearch.query}
                >
                  {editingSearch ? 'Save Changes' : 'Create Search'}
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteTarget !== null} title="Delete Saved Search" onClose={() => setDeleteTarget(null)}>
        <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.</p>
        <div className={commonStyles.actionRow}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (deleteTarget) deleteSearch(deleteTarget); }}>Delete</Button>
        </div>
      </Modal>

      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast, toast.type === 'error' && themeStyles.toastError)}>
          {toast.message}
        </div>
      )}
      </div>
    </PageTransition>
  );
}
