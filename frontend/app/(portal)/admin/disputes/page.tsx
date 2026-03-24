// @AI-HINT: Admin page to list and manage disputes with stats, search, and detail modal
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Search, AlertTriangle, Clock, CheckCircle, XCircle, Shield, FileText } from 'lucide-react'

import Button from '@/app/components/Button/Button';
import { Badge } from '@/app/components/Badge';
import Loading from '@/app/components/Loading/Loading';
import Modal from '@/app/components/Modal/Modal';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import commonStyles from './AdminDisputes.common.module.css';
import lightStyles from './AdminDisputes.light.module.css';
import darkStyles from './AdminDisputes.dark.module.css';

interface Dispute {
  id: number;
  title: string;
  description: string;
  status: string;
  contract_id: number;
  raised_by_id: number;
  created_at: string;
  updated_at: string;
  resolution?: string;
  resolved_at?: string;
  resolved_by_id?: number;
}

const getStatusConfig = (status: string) => {
  const map: Record<string, { variant: 'danger' | 'warning' | 'success' | 'secondary' | 'primary'; icon: React.ReactNode; label: string }> = {
    open: { variant: 'danger', icon: <AlertTriangle size={14} />, label: 'Open' },
    in_progress: { variant: 'warning', icon: <Clock size={14} />, label: 'In Progress' },
    resolved: { variant: 'success', icon: <CheckCircle size={14} />, label: 'Resolved' },
    closed: { variant: 'secondary', icon: <XCircle size={14} />, label: 'Closed' },
  };
  return map[status.toLowerCase()] || { variant: 'primary' as const, icon: <FileText size={14} />, label: status };
};

export default function AdminDisputesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      const data = await api.disputes.list(filters) as any;
      setDisputes(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch disputes:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (mounted) fetchDisputes();
  }, [mounted, fetchDisputes]);

  const stats = useMemo(() => ({
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    inProgress: disputes.filter(d => d.status === 'in_progress').length,
    resolved: disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length,
  }), [disputes]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase()) && !d.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [disputes, filterStatus, searchQuery]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;
  if (!mounted) return <Loading />;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Dispute Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Review and resolve user disputes</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconTotal)}>
                <Shield size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.total}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Disputes</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconOpen)}>
                <AlertTriangle size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.open}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Open</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconProgress)}>
                <Clock size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.inProgress}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>In Progress</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconResolved)}>
                <CheckCircle size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.resolved}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Resolved</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Toolbar */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
            <div className={commonStyles.searchWrapper}>
              <Search size={18} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              />
            </div>
            <div className={commonStyles.filterTabs}>
              {[
                { key: 'all', label: 'All' },
                { key: 'open', label: 'Open', count: stats.open },
                { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
                { key: 'resolved', label: 'Resolved' },
                { key: 'closed', label: 'Closed' },
              ].map(f => (
                <button
                  key={f.key}
                  className={cn(commonStyles.filterTab, themeStyles.filterTab, filterStatus === f.key && commonStyles.filterTabActive, filterStatus === f.key && themeStyles.filterTabActive)}
                  onClick={() => setFilterStatus(f.key)}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span className={commonStyles.filterCount}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Disputes List */}
        {loading ? <Loading /> : filteredDisputes.length === 0 ? (
          <EmptyState
            icon={<Shield size={48} />}
            title="No disputes found"
            description={searchQuery ? 'Try adjusting your search or filter' : 'No disputes have been raised yet'}
          />
        ) : (
          <StaggerContainer className={commonStyles.disputesList}>
            {filteredDisputes.map(dispute => {
              const statusConfig = getStatusConfig(dispute.status);
              return (
                <StaggerItem key={dispute.id}>
                  <div className={cn(commonStyles.disputeCard, themeStyles.disputeCard)} onClick={() => setSelectedDispute(dispute)} role="button" tabIndex={0}>
                    <div className={commonStyles.disputeTop}>
                      <div className={commonStyles.disputeTitle}>
                        <span className={cn(commonStyles.disputeId, themeStyles.disputeId)}>#{dispute.id}</span>
                        <h3 className={cn(commonStyles.disputeName, themeStyles.disputeName)}>{dispute.title}</h3>
                      </div>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className={cn(commonStyles.disputeDesc, themeStyles.disputeDesc)}>
                      {dispute.description || 'No description provided'}
                    </p>
                    <div className={commonStyles.disputeMeta}>
                      <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                        Contract #{dispute.contract_id}
                      </span>
                      <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                        {new Date(dispute.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {dispute.resolved_at && (
                        <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                          Resolved {new Date(dispute.resolved_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {/* Detail Modal */}
        {selectedDispute && (
          <Modal isOpen onClose={() => setSelectedDispute(null)} title={`Dispute #${selectedDispute.id}`}>
            <div className={commonStyles.detailGrid}>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Title</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedDispute.title}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Status</span>
                <Badge variant={getStatusConfig(selectedDispute.status).variant}>
                  {selectedDispute.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Contract</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>#{selectedDispute.contract_id}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Created</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                  {new Date(selectedDispute.created_at).toLocaleString()}
                </span>
              </div>
              {selectedDispute.resolved_at && (
                <div className={commonStyles.detailRow}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Resolved</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                    {new Date(selectedDispute.resolved_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className={commonStyles.detailFullRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Description</span>
                <p className={cn(commonStyles.detailText, themeStyles.detailText)}>
                  {selectedDispute.description || 'No description'}
                </p>
              </div>
              {selectedDispute.resolution && (
                <div className={commonStyles.detailFullRow}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Resolution</span>
                  <p className={cn(commonStyles.detailText, themeStyles.detailText)}>{selectedDispute.resolution}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}
