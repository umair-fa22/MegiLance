// @AI-HINT: Profile strength meter with category breakdown, prioritized next steps, and visibility impact scoring
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import {
  User,
  Briefcase,
  FolderOpen,
  Globe,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Shield,
  Eye,
} from 'lucide-react';

interface ProfileCompletenessData {
  percentage: number;
  completed: number;
  total: number;
  is_complete: boolean;
  missing_fields: string[];
  fields: Record<string, boolean>;
}

interface ProfileCompletenessProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

/** Field metadata: which category it belongs to, display label, visibility impact, and profile link anchor */
const FIELD_META: Record<string, { category: string; label: string; impact: 'high' | 'medium' | 'low'; anchor: string }> = {
  name:             { category: 'basic', label: 'Full Name', impact: 'high', anchor: '#basic' },
  bio:              { category: 'basic', label: 'Bio (20+ chars)', impact: 'high', anchor: '#basic' },
  location:         { category: 'basic', label: 'Location', impact: 'medium', anchor: '#basic' },
  profile_picture:  { category: 'basic', label: 'Profile Photo', impact: 'high', anchor: '#basic' },
  skills:           { category: 'professional', label: 'Skills (3+)', impact: 'high', anchor: '#skills' },
  hourly_rate:      { category: 'professional', label: 'Hourly Rate', impact: 'high', anchor: '#rate' },
  headline:         { category: 'professional', label: 'Headline', impact: 'medium', anchor: '#basic' },
  experience_level: { category: 'professional', label: 'Experience Level', impact: 'medium', anchor: '#professional' },
  languages:        { category: 'professional', label: 'Languages', impact: 'low', anchor: '#professional' },
  timezone:         { category: 'professional', label: 'Timezone', impact: 'low', anchor: '#professional' },
  linkedin_url:     { category: 'social', label: 'LinkedIn', impact: 'medium', anchor: '#social' },
  github_url:       { category: 'social', label: 'GitHub', impact: 'medium', anchor: '#social' },
  website_url:      { category: 'social', label: 'Portfolio Website', impact: 'low', anchor: '#social' },
  company_name:     { category: 'basic', label: 'Company Name', impact: 'medium', anchor: '#basic' },
};

const CATEGORY_META: Record<string, { label: string; icon: typeof User; color: string }> = {
  basic:        { label: 'Basic Info', icon: User, color: '#4573df' },
  professional: { label: 'Professional', icon: Briefcase, color: '#27AE60' },
  portfolio:    { label: 'Portfolio', icon: FolderOpen, color: '#ff9800' },
  social:       { label: 'Social Links', icon: Globe, color: '#9b59b6' },
};

const IMPACT_WEIGHT = { high: 3, medium: 2, low: 1 };

export default function ProfileCompleteness({ className, showDetails = true, compact = false }: ProfileCompletenessProps) {
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<ProfileCompletenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        const response = await api.users.getProfileCompleteness();
        setData(response as ProfileCompletenessData);
      } catch {
        setError('Unable to load profile status');
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteness();
  }, []);

  // Group fields into categories and calculate per-category scores
  const categories = useMemo(() => {
    if (!data?.fields) return [];
    const groups: Record<string, { done: number; total: number; fields: { key: string; label: string; completed: boolean; impact: 'high' | 'medium' | 'low'; anchor: string }[] }> = {};

    for (const [key, completed] of Object.entries(data.fields)) {
      const meta = FIELD_META[key] || { category: 'basic', label: key.replace(/_/g, ' '), impact: 'low' as const, anchor: '#basic' };
      const cat = meta.category;
      if (!groups[cat]) groups[cat] = { done: 0, total: 0, fields: [] };
      groups[cat].total++;
      if (completed) groups[cat].done++;
      groups[cat].fields.push({ key, label: meta.label, completed, impact: meta.impact, anchor: meta.anchor });
    }

    // Sort fields within each category: incomplete first, then by impact desc
    for (const group of Object.values(groups)) {
      group.fields.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return IMPACT_WEIGHT[b.impact] - IMPACT_WEIGHT[a.impact];
      });
    }

    return Object.entries(groups).map(([key, group]) => ({
      key,
      ...CATEGORY_META[key] || { label: key, icon: User, color: '#666' },
      ...group,
      percent: group.total > 0 ? Math.round((group.done / group.total) * 100) : 100,
    }));
  }, [data]);

  // Top 3 missing fields sorted by visibility impact
  const topActions = useMemo(() => {
    if (!data?.fields) return [];
    return Object.entries(data.fields)
      .filter(([, done]) => !done)
      .map(([key]) => ({ key, ...(FIELD_META[key] || { label: key.replace(/_/g, ' '), impact: 'low' as const, anchor: '#basic', category: 'basic' }) }))
      .sort((a, b) => IMPACT_WEIGHT[b.impact] - IMPACT_WEIGHT[a.impact])
      .slice(0, 3);
  }, [data]);

  if (loading) {
    return (
      <div className={cn('animate-pulse rounded-lg p-4', className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return isDark ? '#27AE60' : '#27AE60';
    if (pct >= 50) return isDark ? '#F2C94C' : '#d4a017';
    return isDark ? '#e81123' : '#e81123';
  };

  const strengthLabel = data.percentage >= 90 ? 'Excellent' : data.percentage >= 70 ? 'Good' : data.percentage >= 50 ? 'Fair' : 'Needs Work';

  const impactBadge = (impact: 'high' | 'medium' | 'low') => {
    const colors = {
      high: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-700',
      medium: isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-50 text-yellow-700',
      low: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide', colors[impact])}>
        {impact === 'high' ? 'High Impact' : impact === 'medium' ? 'Medium' : 'Low'}
      </span>
    );
  };

  // Compact mode: just the ring + percentage
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={getProgressColor(data.percentage)}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(data.percentage / 100) * 94.25} 94.25`}
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{data.percentage}%</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border transition-colors',
        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200',
        className
      )}
      role="region"
      aria-label="Profile strength"
    >
      {/* Header with ring */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true" className="shrink-0">
            <circle cx="26" cy="26" r="22" fill="none" stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth="4" />
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke={getProgressColor(data.percentage)}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(data.percentage / 100) * 138.23} 138.23`}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <text x="26" y="28" textAnchor="middle" dominantBaseline="middle"
              className={cn('text-xs font-bold')} fill={isDark ? '#fff' : '#111'}>
              {data.percentage}%
            </text>
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={cn('font-semibold text-sm', isDark ? 'text-gray-100' : 'text-gray-800')}>
                Profile Strength
              </h3>
              <span
                className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                  data.percentage >= 90 ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700') :
                  data.percentage >= 70 ? (isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700') :
                  data.percentage >= 50 ? (isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-50 text-yellow-700') :
                  (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-700')
                )}
              >
                {strengthLabel}
              </span>
            </div>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {data.completed}/{data.total} fields completed
            </p>
          </div>
        </div>

        {/* Category mini-bars */}
        {showDetails && (
          <div className="flex gap-1.5" aria-label="Category progress">
            {categories.map((cat) => (
              <div key={cat.key} className="flex-1 min-w-0" title={`${cat.label}: ${cat.percent}%`}>
                <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-gray-700' : 'bg-gray-200')}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
                <span className={cn('text-[10px] mt-0.5 block truncate', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top priority actions */}
      {showDetails && topActions.length > 0 && (
        <div className={cn('px-4 pb-3 border-t', isDark ? 'border-gray-700' : 'border-gray-100')}>
          <div className="flex items-center gap-1.5 mt-3 mb-2">
            <Sparkles size={12} className={isDark ? 'text-yellow-400' : 'text-yellow-600'} aria-hidden="true" />
            <span className={cn('text-xs font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Boost your visibility
            </span>
          </div>
          <ul className="space-y-1.5" role="list">
            {topActions.map((action) => (
              <li key={action.key}>
                <Link
                  href={`/freelancer/profile${action.anchor}`}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors group',
                    isDark ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-50 text-gray-600'
                  )}
                >
                  <Eye size={12} className="shrink-0 opacity-50" aria-hidden="true" />
                  <span className="flex-1">Add {action.label}</span>
                  {impactBadge(action.impact)}
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable category detail */}
      {showDetails && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'w-full flex items-center justify-center gap-1 py-2 text-xs font-medium border-t transition-colors',
              isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700/30' : 'border-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
            aria-expanded={expanded}
            aria-controls="profile-strength-detail"
          >
            {expanded ? 'Hide details' : 'View all fields'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded && (
            <div id="profile-strength-detail" className="px-4 pb-4">
              {categories.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.key} className="mt-3 first:mt-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CatIcon size={14} style={{ color: cat.color }} aria-hidden="true" />
                      <span className={cn('text-xs font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                        {cat.label}
                      </span>
                      <span className={cn('text-[10px] ml-auto', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {cat.done}/{cat.total}
                      </span>
                    </div>
                    <ul className="space-y-1" role="list">
                      {cat.fields.map((field) => (
                        <li
                          key={field.key}
                          className={cn(
                            'flex items-center gap-2 text-xs px-2 py-1 rounded',
                            field.completed
                              ? (isDark ? 'text-gray-400' : 'text-gray-400')
                              : (isDark ? 'text-gray-200' : 'text-gray-700')
                          )}
                        >
                          {field.completed ? (
                            <CheckCircle2 size={13} className="text-green-500 shrink-0" aria-hidden="true" />
                          ) : (
                            <Shield size={13} className="opacity-30 shrink-0" aria-hidden="true" />
                          )}
                          <span className={cn('flex-1', field.completed && 'line-through opacity-60')}>
                            {field.label}
                          </span>
                          {!field.completed && impactBadge(field.impact)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Complete celebration */}
      {data.is_complete && (
        <div className={cn('px-4 pb-3 flex items-center gap-2', isDark ? 'text-green-400' : 'text-green-600')}>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span className="text-xs font-medium">All fields complete — maximum visibility!</span>
        </div>
      )}
    </div>
  );
}
