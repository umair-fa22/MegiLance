// @AI-HINT: Client Contracts List Page - Full-featured with KPI stats, status tabs, search, sorting, and rich contract cards
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { contractsApi } from '@/lib/api';
import { Button } from '@/app/components/atoms/Button';
import { Badge } from '@/app/components/atoms/Badge';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import Pagination from '@/app/components/molecules/Pagination/Pagination';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { 
  Search, FileText, DollarSign, CheckCircle, 
  Plus, Download, Calendar,
  ArrowRight, Briefcase
} from 'lucide-react';
import commonStyles from './Contracts.common.module.css';
import lightStyles from './Contracts.light.module.css';
import darkStyles from './Contracts.dark.module.css';

interface Contract {
  id: number;
  title: string;
  status: string;
  total_budget: number;
  paid_amount?: number;
  start_date: string;
  end_date?: string;
  milestones_count?: number;
  milestones_completed?: number;
  freelancer?: {
    full_name: string;
    avatar_url?: string;
  };
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'budget_high', label: 'Budget (High to Low)' },
  { value: 'budget_low', label: 'Budget (Low to High)' },
  { value: 'title', label: 'Title (A-Z)' },
];

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' | 'primary' => {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case 'active':
    case 'in_progress':
      return 'success';
    case 'completed':
    case 'done':
      return 'primary';
    case 'pending':
    case 'draft':
      return 'warning';
    case 'cancelled':
    case 'terminated':
      return 'danger';
    default:
      return 'default';
  }
};

export default function ClientContractsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortKey, setSortKey] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    async function loadContracts() {
      try {
        const response = await contractsApi.list() as { contracts: Contract[] };
        const data = Array.isArray(response) ? response : (response.contracts || []);
        setContracts(data);
        setError(null);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load contracts', error);
        }
        setError('Failed to load contracts. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadContracts();
  }, []);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter(c => 
      ['active', 'in_progress'].includes(c.status?.toLowerCase())
    ).length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.total_budget || 0), 0);
    const completed = contracts.filter(c => 
      ['completed', 'done'].includes(c.status?.toLowerCase())
    ).length;
    return { total, active, totalValue, completed };
  }, [contracts]);

  // Status counts for tab badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contracts.length };
    contracts.forEach(c => {
      const s = c.status?.toLowerCase() || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
      // Normalize in_progress to active
      if (s === 'in_progress') counts['active'] = (counts['active'] || 0) + 1;
    });
    return counts;
  }, [contracts]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesTab = activeTab === 'all' || 
        c.status?.toLowerCase() === activeTab ||
        (activeTab === 'active' && c.status?.toLowerCase() === 'in_progress');
      const matchesSearch = !searchQuery || 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.freelancer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [contracts, activeTab, searchQuery]);

  // Sorted contracts
  const sortedContracts = useMemo(() => {
    const sorted = [...filteredContracts];
    switch (sortKey) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      case 'budget_high':
        return sorted.sort((a, b) => (b.total_budget || 0) - (a.total_budget || 0));
      case 'budget_low':
        return sorted.sort((a, b) => (a.total_budget || 0) - (b.total_budget || 0));
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return sorted;
    }
  }, [filteredContracts, sortKey]);

  // Paginated contracts
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedContracts.slice(start, start + itemsPerPage);
  }, [sortedContracts, currentPage]);

  const totalPages = Math.ceil(sortedContracts.length / itemsPerPage);

  // Reset page on filter changes
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, sortKey]);

  const getProgress = useCallback((contract: Contract) => {
    if (contract.milestones_count && contract.milestones_completed) {
      return Math.round((contract.milestones_completed / contract.milestones_count) * 100);
    }
    if (contract.paid_amount && contract.total_budget) {
      return Math.round((contract.paid_amount / contract.total_budget) * 100);
    }
    if (['completed', 'done'].includes(contract.status?.toLowerCase())) return 100;
    if (['active', 'in_progress'].includes(contract.status?.toLowerCase())) return 50;
    return 0;
  }, []);

  const handleExport = useCallback(() => {
    const header = ['Title', 'Status', 'Budget', 'Freelancer', 'Start Date'];
    const rows = contracts.map(c => [
      c.title, c.status, `$${c.total_budget}`, c.freelancer?.full_name || 'N/A', c.start_date
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [contracts]);

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themeStyles.theme)}>
        {/* Header */}
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div className={commonStyles.headerInfo}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Contracts</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage all your contracts, milestones, and freelancer agreements.
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="secondary" size="md" iconBefore={<Download size={16} />} onClick={handleExport}>
                Export
              </Button>
              <Button variant="primary" size="md" iconBefore={<Plus size={16} />} onClick={() => router.push('/client/post-job')}>
                New Contract
              </Button>
            </div>
          </header>
        </ScrollReveal>

        {/* KPI Stats */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.kpiGrid}>
            <div className={cn(commonStyles.kpiCard, themeStyles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, themeStyles.kpiIcon)}>
                <FileText size={22} />
              </div>
              <div>
                <span className={cn(commonStyles.kpiLabel, themeStyles.kpiLabel)}>Total Contracts</span>
                <span className={cn(commonStyles.kpiValue, themeStyles.kpiValue)}>{kpis.total}</span>
              </div>
            </div>
            <div className={cn(commonStyles.kpiCard, themeStyles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, themeStyles.kpiIcon)}>
                <Briefcase size={22} />
              </div>
              <div>
                <span className={cn(commonStyles.kpiLabel, themeStyles.kpiLabel)}>Active</span>
                <span className={cn(commonStyles.kpiValue, themeStyles.kpiValue)}>{kpis.active}</span>
              </div>
            </div>
            <div className={cn(commonStyles.kpiCard, themeStyles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, themeStyles.kpiIcon)}>
                <DollarSign size={22} />
              </div>
              <div>
                <span className={cn(commonStyles.kpiLabel, themeStyles.kpiLabel)}>Total Value</span>
                <span className={cn(commonStyles.kpiValue, themeStyles.kpiValue)}>${kpis.totalValue.toLocaleString()}</span>
              </div>
            </div>
            <div className={cn(commonStyles.kpiCard, themeStyles.kpiCard)}>
              <div className={cn(commonStyles.kpiIcon, themeStyles.kpiIcon)}>
                <CheckCircle size={22} />
              </div>
              <div>
                <span className={cn(commonStyles.kpiLabel, themeStyles.kpiLabel)}>Completed</span>
                <span className={cn(commonStyles.kpiValue, themeStyles.kpiValue)}>{kpis.completed}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Status Tabs */}
        <ScrollReveal delay={0.15}>
          <div className={commonStyles.statusTabs} role="tablist" aria-label="Contract status filter">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={cn(
                  commonStyles.statusTab,
                  themeStyles.statusTab,
                  activeTab === tab.key && commonStyles.statusTabActive,
                  activeTab === tab.key && themeStyles.statusTabActive,
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className={cn(commonStyles.tabCount, themeStyles.tabCount)}>
                  {statusCounts[tab.key] || 0}
                </span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Search & Sort Controls */}
        <ScrollReveal delay={0.2}>
          <div className={commonStyles.controls}>
            <Input
              id="contract-search"
              aria-label="Search contracts"
              iconBefore={<Search size={18} />}
              placeholder="Search by title or freelancer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={commonStyles.searchInput}
            />
            <div className={commonStyles.filters}>
              <Select
                id="sort-contracts"
                aria-label="Sort contracts"
                options={SORT_OPTIONS}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Contract Cards */}
        {error ? (
          <div className={commonStyles.emptyState || ''}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try again</button>
          </div>
        ) : loading ? (
          <div className={commonStyles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(commonStyles.skeletonCard, themeStyles.skeletonCard)} />
            ))}
          </div>
        ) : paginatedContracts.length > 0 ? (
          <StaggerContainer className={commonStyles.grid}>
            {paginatedContracts.map((contract) => {
              const progress = getProgress(contract);
              const initials = contract.freelancer?.full_name
                ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
              
              return (
                <StaggerItem key={contract.id}>
                  <Link 
                    href={`/client/contracts/${contract.id}`} 
                    className={cn(commonStyles.card, themeStyles.card)}
                    aria-label={`Contract: ${contract.title}`}
                  >
                    {/* Card Header */}
                    <div className={commonStyles.cardHeader}>
                      <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>{contract.title}</h3>
                      <div className={commonStyles.cardBadge}>
                        <Badge variant={getStatusVariant(contract.status)}>
                          {contract.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Freelancer Info */}
                    <div className={cn(commonStyles.freelancerInfo, themeStyles.freelancerInfo)}>
                      <div className={cn(commonStyles.freelancerAvatar, themeStyles.freelancerAvatar)}>
                        {initials}
                      </div>
                      <div className={commonStyles.freelancerDetails}>
                        <span className={cn(commonStyles.freelancerName, themeStyles.freelancerName)}>
                          {contract.freelancer?.full_name || 'Unassigned'}
                        </span>
                        <span className={cn(commonStyles.freelancerLabel, themeStyles.freelancerLabel)}>
                          Freelancer
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className={commonStyles.cardStats}>
                      <div className={commonStyles.cardStat}>
                        <span className={cn(commonStyles.cardStatLabel, themeStyles.cardStatLabel)}>Budget</span>
                        <span className={cn(commonStyles.cardStatValue, themeStyles.cardStatValue)}>
                          ${contract.total_budget?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className={commonStyles.cardStat}>
                        <span className={cn(commonStyles.cardStatLabel, themeStyles.cardStatLabel)}>Paid</span>
                        <span className={cn(commonStyles.cardStatValue, themeStyles.cardStatValue)}>
                          ${(contract.paid_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className={commonStyles.progressSection}>
                      <div className={commonStyles.progressHeader}>
                        <span className={cn(commonStyles.progressLabel, themeStyles.progressLabel)}>Progress</span>
                        <span className={cn(commonStyles.progressValue, themeStyles.progressValue)}>{progress}%</span>
                      </div>
                      <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
                        <div 
                          className={cn(commonStyles.progressFill, themeStyles.progressFill)} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>

                    {/* Milestones Summary */}
                    {contract.milestones_count != null && (
                      <div className={commonStyles.milestoneSummary}>
                        <CheckCircle size={12} />
                        {contract.milestones_completed || 0}/{contract.milestones_count} milestones completed
                      </div>
                    )}

                    {/* Footer */}
                    <div className={cn(commonStyles.cardFooter, themeStyles.cardFooter)}>
                      <span className={cn(commonStyles.cardDate, themeStyles.cardDate)}>
                        <Calendar size={12} />
                        {new Date(contract.start_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                      <span className={cn(commonStyles.cardDate, themeStyles.cardDate, commonStyles.labelBold)}>
                        View Details <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        ) : (
          <div className={commonStyles.emptyState}>
            <div className={cn(commonStyles.emptyIcon, themeStyles.emptyIcon)}>
              <FileText size={36} />
            </div>
            <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
              {searchQuery || activeTab !== 'all' ? 'No matching contracts' : 'No contracts yet'}
            </h3>
            <p className={cn(commonStyles.emptyText, themeStyles.emptyText)}>
              {searchQuery || activeTab !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start by posting a job and hiring a freelancer to create your first contract.'}
            </p>
            {!searchQuery && activeTab === 'all' && (
              <Button 
                variant="primary" 
                iconBefore={<Plus size={16} />}
                onClick={() => router.push('/client/post-job')}
              >
                Post a Job
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={commonStyles.paginationContainer}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
              onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
