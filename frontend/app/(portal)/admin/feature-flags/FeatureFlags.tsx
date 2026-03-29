// @AI-HINT: Admin Feature Flags page - manage feature toggles with rollout percentages and analytics
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { featureFlagsApi } from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import Loading from '@/app/components/atoms/Loading/Loading';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import {
  Flag, Plus, Search, BarChart3, AlertCircle,
  Users, ToggleRight, Clock, Percent
} from 'lucide-react';
import commonStyles from './FeatureFlags.common.module.css';
import lightStyles from './FeatureFlags.light.module.css';
import darkStyles from './FeatureFlags.dark.module.css';

interface FeatureFlag {
  name: string;
  description?: string;
  is_active: boolean;
  rollout_percentage: number;
  rollout_type?: string;
  variants?: { name: string; weight: number }[];
  default_variant?: string;
  created_at?: string;
  updated_at?: string;
}

export default function FeatureFlagsPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await featureFlagsApi.adminList();
      const data = Array.isArray(res) ? res : (res as Record<string, unknown>).flags as FeatureFlag[] ?? [];
      setFlags(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load feature flags:', err);
      }
      setError('Unable to load feature flags.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await featureFlagsApi.adminUpdate(flag.name, { is_active: !flag.is_active });
      setFlags(prev => prev.map(f => f.name === flag.name ? { ...f, is_active: !f.is_active } : f));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Toggle failed:', err);
      }
    }
  };

  const handleRolloutChange = async (flag: FeatureFlag, percentage: number) => {
    try {
      await featureFlagsApi.adminRollout(flag.name, percentage);
      setFlags(prev => prev.map(f => f.name === flag.name ? { ...f, rollout_percentage: percentage } : f));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Rollout update failed:', err);
      }
    }
  };

  const handleDelete = async (flag: FeatureFlag) => {
    if (!confirm(`Delete feature flag "${flag.name}"?`)) return;
    try {
      await featureFlagsApi.adminDelete(flag.name);
      setFlags(prev => prev.filter(f => f.name !== flag.name));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete failed:', err);
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search) return flags;
    const q = search.toLowerCase();
    return flags.filter(f => f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q));
  }, [flags, search]);

  const activeCount = useMemo(() => flags.filter(f => f.is_active).length, [flags]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerInfo}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <Flag size={24} /> Feature Flags
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Control feature rollouts, A/B tests, and gradual deployments
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="primary" size="md" iconBefore={<Plus size={16} />}>
                New Flag
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {error && (
          <div className={commonStyles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={loadFlags}>Retry</Button>
          </div>
        )}

        {loading ? (
          <Loading text="Loading feature flags..." />
        ) : (
          <>
            {/* Stats */}
            <ScrollReveal>
              <div className={commonStyles.statsRow}>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconBlue)}><Flag size={20} /></div>
                  <div>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{flags.length}</span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Flags</span>
                  </div>
                </div>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconGreen)}><ToggleRight size={20} /></div>
                  <div>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{activeCount}</span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
                  </div>
                </div>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconOrange)}><Percent size={20} /></div>
                  <div>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      {flags.length > 0 ? Math.round(flags.reduce((a, f) => a + f.rollout_percentage, 0) / flags.length) : 0}%
                    </span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Avg Rollout</span>
                  </div>
                </div>
                <div className={cn(commonStyles.stat, themeStyles.stat)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconRed)}><AlertCircle size={20} /></div>
                  <div>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{flags.length - activeCount}</span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Disabled</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Search */}
            <ScrollReveal>
              <div className={commonStyles.toolbar}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input
                    className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                    placeholder="Search flags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </ScrollReveal>

            {filtered.length === 0 ? (
              <div className={commonStyles.emptyState}>
                <div className={commonStyles.emptyIcon}><Flag size={48} /></div>
                <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>No Feature Flags</h3>
                <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
                  {search ? 'No flags match your search.' : 'Create your first feature flag to control feature rollouts.'}
                </p>
              </div>
            ) : (
              <ScrollReveal>
                <div className={commonStyles.flagsList}>
                  {filtered.map(flag => (
                    <div key={flag.name} className={cn(commonStyles.flagCard, themeStyles.flagCard)}>
                      <div className={commonStyles.flagHeader}>
                        <span className={cn(commonStyles.flagName, themeStyles.flagName)}>
                          <Flag size={16} /> {flag.name}
                        </span>
                        <div className={commonStyles.flagControls}>
                          <Badge variant={flag.is_active ? 'success' : 'warning'}>
                            {flag.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                          <button
                            className={cn(commonStyles.toggleSwitch, flag.is_active ? commonStyles.toggleOn : commonStyles.toggleOff)}
                            onClick={() => handleToggle(flag)}
                            aria-label={`Toggle ${flag.name}`}
                          >
                            <span className={commonStyles.toggleKnob} />
                          </button>
                          <Button variant="ghost" size="sm" iconBefore={<BarChart3 size={14} />}>Analytics</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(flag)}>Delete</Button>
                        </div>
                      </div>
                      {flag.description && (
                        <p className={cn(commonStyles.flagDesc, themeStyles.flagDesc)}>{flag.description}</p>
                      )}
                      <div className={cn(commonStyles.flagMeta, themeStyles.flagMeta)}>
                        <span className={commonStyles.metaItem}>
                          <Percent size={12} /> Rollout: {flag.rollout_percentage}%
                          <span className={commonStyles.rolloutBar}>
                            <span className={commonStyles.rolloutFill} style={{ width: `${flag.rollout_percentage}%` }} />
                          </span>
                        </span>
                        {flag.rollout_type && (
                          <span className={commonStyles.metaItem}>
                            <Users size={12} /> {flag.rollout_type}
                          </span>
                        )}
                        {flag.updated_at && (
                          <span className={commonStyles.metaItem}>
                            <Clock size={12} /> Updated {new Date(flag.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
