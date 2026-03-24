// @AI-HINT: Search analytics page for admin to monitor search patterns
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { searchAnalyticsApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Select from '@/app/components/Select/Select';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import Badge from '@/app/components/Badge/Badge';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import {
  Search, Users, Calendar, BarChart3, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Hash, ArrowUpRight,
} from 'lucide-react';
import commonStyles from './SearchAnalytics.common.module.css';
import lightStyles from './SearchAnalytics.light.module.css';
import darkStyles from './SearchAnalytics.dark.module.css';

interface SearchTerm {
  term: string;
  count: number;
  clicks: number;
  ctr: number;
  avg_position: number;
  trend: 'up' | 'down' | 'stable';
}

interface SearchStats {
  total_searches: number;
  unique_searches: number;
  searches_today: number;
  avg_results: number;
  zero_result_rate: number;
}

interface ZeroResultQuery {
  query: string;
  count: number;
  last_searched: string;
}

export default function SearchAnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [topSearches, setTopSearches] = useState<SearchTerm[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchTerm[]>([]);
  const [zeroResults, setZeroResults] = useState<ZeroResultQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, topRes, trendingRes, zeroRes] = await Promise.allSettled([
        searchAnalyticsApi.getOverview(dateRange),
        searchAnalyticsApi.getTopQueries(20),
        (searchAnalyticsApi as any).getTrends?.('', dateRange),
        searchAnalyticsApi.getZeroResults(20)
      ]);
      setStats(statsRes.status === 'fulfilled' ? statsRes.value as any : null);
      setTopSearches(topRes.status === 'fulfilled' ? ((topRes.value as any) || []) : []);
      setTrendingSearches(trendingRes.status === 'fulfilled' ? ((trendingRes.value as any) || []) : []);
      setZeroResults(zeroRes.status === 'fulfilled' ? ((zeroRes.value as any) || []) : []);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load search analytics:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'top', label: 'Top Searches' },
    { id: 'trending', label: 'Trending' },
    { id: 'zero', label: 'Zero Results' },
  ];

  const STAT_ITEMS = stats ? [
    { label: 'Total Searches', value: stats.total_searches.toLocaleString(), icon: <Search size={18} /> },
    { label: 'Unique Queries', value: stats.unique_searches.toLocaleString(), icon: <Users size={18} /> },
    { label: 'Today', value: String(stats.searches_today), icon: <Calendar size={18} /> },
    { label: 'Avg Results', value: stats.avg_results.toFixed(1), icon: <BarChart3 size={18} /> },
    { label: 'Zero Results', value: `${(stats.zero_result_rate * 100).toFixed(1)}%`, icon: <AlertTriangle size={18} /> },
  ] : [];

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Search Analytics</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Monitor search patterns and optimize discovery
              </p>
            </div>
            <div className={commonStyles.dateFilter}>
              <Select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                options={[
                  { value: '1d', label: 'Last 24 hours' },
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                ]}
              />
            </div>
          </header>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrap}><Loader size="lg" /></div>
        ) : (
          <>
            {/* Stats */}
            {STAT_ITEMS.length > 0 && (
              <StaggerContainer className={commonStyles.statsRow}>
                {STAT_ITEMS.map((s, i) => (
                  <StaggerItem key={i} className={cn(commonStyles.statCard, themeStyles.statCard)}>
                    <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>{s.icon}</div>
                    <div className={commonStyles.statInfo}>
                      <strong>{s.value}</strong>
                      <span>{s.label}</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Tabs */}
            <ScrollReveal delay={0.2}>
              <div className={commonStyles.tabRow}>
                {tabs.map(tab => (
                  <Button key={tab.id} variant={activeTab === tab.id ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </Button>
                ))}
              </div>
            </ScrollReveal>

            <div className={commonStyles.tabContent}>
              {activeTab === 'overview' && (
                topSearches.length > 0 || trendingSearches.length > 0 || zeroResults.length > 0 ? (
                  <StaggerContainer className={commonStyles.overviewGrid}>
                    <StaggerItem className={cn(commonStyles.card, themeStyles.card)}>
                      <h3>Top Search Terms</h3>
                      <div className={commonStyles.termsList}>
                        {topSearches.slice(0, 5).map((term, i) => (
                          <div key={i} className={cn(commonStyles.termItem, themeStyles.termItem)}>
                            <span className={commonStyles.rank}>#{i + 1}</span>
                            <span className={commonStyles.termText}>{term.term}</span>
                            <span className={commonStyles.count}>{term.count}</span>
                          </div>
                        ))}
                        {topSearches.length === 0 && <p className={commonStyles.emptyNote}>No data yet</p>}
                      </div>
                    </StaggerItem>

                    <StaggerItem className={cn(commonStyles.card, themeStyles.card)}>
                      <h3>Trending Now</h3>
                      <div className={commonStyles.termsList}>
                        {trendingSearches.slice(0, 5).map((term, i) => (
                          <div key={i} className={cn(commonStyles.termItem, themeStyles.termItem)}>
                            <span className={commonStyles.trendIcon}><TrendIcon trend={term.trend} /></span>
                            <span className={commonStyles.termText}>{term.term}</span>
                            <span className={cn(commonStyles.change, term.trend === 'up' && commonStyles.up, term.trend === 'down' && commonStyles.down)}>
                              {term.trend === 'up' ? '+' : ''}{((term.count / 100) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                        {trendingSearches.length === 0 && <p className={commonStyles.emptyNote}>No data yet</p>}
                      </div>
                    </StaggerItem>

                    <StaggerItem className={cn(commonStyles.card, themeStyles.card)}>
                      <h3>Zero Result Queries</h3>
                      <div className={commonStyles.termsList}>
                        {zeroResults.slice(0, 5).map((query, i) => (
                          <div key={i} className={cn(commonStyles.termItem, themeStyles.termItem)}>
                            <span className={commonStyles.warningIcon}><AlertTriangle size={14} /></span>
                            <span className={commonStyles.termText}>{query.query}</span>
                            <span className={commonStyles.count}>{query.count}x</span>
                          </div>
                        ))}
                        {zeroResults.length === 0 && <p className={commonStyles.emptyNote}>No data yet</p>}
                      </div>
                    </StaggerItem>
                  </StaggerContainer>
                ) : (
                  <EmptyState title="No search data" description="Search analytics will appear once users begin searching." />
                )
              )}

              {activeTab === 'top' && (
                topSearches.length > 0 ? (
                  <ScrollReveal className={cn(commonStyles.tableCard, themeStyles.tableCard)}>
                    <table className={commonStyles.table}>
                      <thead>
                        <tr>
                          <th>#</th><th>Search Term</th><th>Searches</th><th>Clicks</th><th>CTR</th><th>Avg Position</th><th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSearches.map((term, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td className={commonStyles.termCell}>{term.term}</td>
                            <td>{term.count.toLocaleString()}</td>
                            <td>{term.clicks}</td>
                            <td>{(term.ctr * 100).toFixed(1)}%</td>
                            <td>{term.avg_position.toFixed(1)}</td>
                            <td><TrendIcon trend={term.trend} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollReveal>
                ) : (
                  <EmptyState title="No top searches" description="Search data will appear once users begin searching." />
                )
              )}

              {activeTab === 'trending' && (
                trendingSearches.length > 0 ? (
                  <StaggerContainer className={commonStyles.trendingGrid}>
                    {trendingSearches.map((term, i) => (
                      <StaggerItem key={i} className={cn(commonStyles.trendCard, themeStyles.trendCard)}>
                        <div className={commonStyles.trendHeader}>
                          <span className={commonStyles.trendRank}>#{i + 1}</span>
                          <Badge variant={term.trend === 'up' ? 'success' : term.trend === 'down' ? 'default' : 'info'}>
                            <TrendIcon trend={term.trend} /> {term.trend}
                          </Badge>
                        </div>
                        <h3>{term.term}</h3>
                        <div className={commonStyles.trendStats}>
                          <div><strong>{term.count}</strong><span>Searches</span></div>
                          <div><strong>{term.clicks}</strong><span>Clicks</span></div>
                          <div><strong>{(term.ctr * 100).toFixed(1)}%</strong><span>CTR</span></div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                ) : (
                  <EmptyState title="No trending searches" description="Trending data will appear as search patterns emerge." />
                )
              )}

              {activeTab === 'zero' && (
                zeroResults.length > 0 ? (
                  <ScrollReveal className={commonStyles.zeroSection}>
                    <div className={cn(commonStyles.alertCard, themeStyles.alertCard)}>
                      <h3><AlertTriangle size={16} /> Attention Required</h3>
                      <p>These queries returned no results. Consider adding relevant content or improving search indexing.</p>
                    </div>
                    <div className={cn(commonStyles.tableCard, themeStyles.tableCard)}>
                      <table className={commonStyles.table}>
                        <thead><tr><th>Query</th><th>Occurrences</th><th>Last Searched</th><th>Action</th></tr></thead>
                        <tbody>
                          {zeroResults.map((query, i) => (
                            <tr key={i}>
                              <td className={commonStyles.termCell}>{query.query}</td>
                              <td>{query.count}</td>
                              <td>{formatDate(query.last_searched)}</td>
                              <td><Button variant="ghost" size="sm">Add Synonym</Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollReveal>
                ) : (
                  <EmptyState title="No zero-result queries" description="All searches are returning results — great!" />
                )
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
