// @AI-HINT: Admin Refunds management page with stats, detail view, and enhanced table
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import { Badge } from '@/app/components/atoms/Badge';
import Loading from '@/app/components/atoms/Loading/Loading';
import Modal from '@/app/components/organisms/Modal/Modal';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { refundsApi } from '@/lib/api';
import { 
  RotateCcw, Check, X, Eye, Clock, CheckCircle, AlertCircle, 
  DollarSign, Search, TrendingDown, Ban, FileText
} from 'lucide-react';

import commonStyles from './Refunds.common.module.css';
import lightStyles from './Refunds.light.module.css';
import darkStyles from './Refunds.dark.module.css';

interface Refund { 
  id: string; user_name: string; amount: number; reason: string; 
  status: string; created_at: string; contract_id?: string; 
}

export default function AdminRefundsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ refund: Refund; action: 'approve' | 'reject' } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) fetchRefunds();
  }, [mounted, filter]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await refundsApi.list(filter === 'all' ? undefined : filter);
      const refundsList = Array.isArray(response) ? response : (response as any).refunds || [];
      setRefunds(refundsList.map((r: any) => ({
        id: r.id?.toString(),
        user_name: r.user_name || r.requester_name || 'User',
        amount: r.amount || 0,
        reason: r.reason || '',
        status: r.status || 'pending',
        created_at: r.created_at || new Date().toISOString(),
        contract_id: r.contract_id
      })));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch refunds:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await refundsApi.approve(parseInt(id));
      setRefunds(refunds.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      setConfirmAction(null);
    } catch (err) { console.error('Failed to approve:', err); }
  };

  const handleReject = async (id: string) => {
    try {
      await refundsApi.reject(parseInt(id), 'Rejected by admin');
      setRefunds(refunds.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      setConfirmAction(null);
    } catch (err) { console.error('Failed to reject:', err); }
  };

  const stats = useMemo(() => ({
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
  }), [refunds]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (searchQuery && !r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.reason.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [refunds, filter, searchQuery]);

  const getStatusConfig = (status: string) => {
    const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'primary'; icon: React.ReactNode; label: string }> = {
      pending: { variant: 'warning', icon: <Clock size={14} />, label: 'Pending' },
      approved: { variant: 'success', icon: <CheckCircle size={14} />, label: 'Approved' },
      rejected: { variant: 'danger', icon: <Ban size={14} />, label: 'Rejected' },
      processed: { variant: 'primary', icon: <Check size={14} />, label: 'Processed' },
    };
    return map[status] || map.pending;
  };

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;
  if (!mounted) return <Loading />;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Refund Requests</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Review and process refund requests from users</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats Cards */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconTotal)}>
                <FileText size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.total}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Requests</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconPending)}>
                <Clock size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.pending}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending Review</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconApproved)}>
                <CheckCircle size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.approved}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Approved</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconAmount)}>
                <DollarSign size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                  ${stats.totalAmount.toLocaleString()}
                </span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Amount</span>
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
                placeholder="Search by user or reason..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              />
            </div>
            <div className={commonStyles.filterTabs}>
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending', count: stats.pending },
                { key: 'approved', label: 'Approved', count: stats.approved },
                { key: 'rejected', label: 'Rejected', count: stats.rejected },
              ].map(f => (
                <button
                  key={f.key}
                  className={cn(commonStyles.filterTab, themeStyles.filterTab, filter === f.key && commonStyles.filterTabActive, filter === f.key && themeStyles.filterTabActive)}
                  onClick={() => setFilter(f.key)}
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

        {/* Refunds List */}
        {loading ? <Loading /> : filteredRefunds.length === 0 ? (
          <EmptyState
            icon={<RotateCcw size={48} />}
            title="No refund requests"
            description={searchQuery ? 'Try adjusting your search or filter' : 'No refund requests have been submitted yet'}
          />
        ) : (
          <StaggerContainer className={commonStyles.refundsList}>
            {filteredRefunds.map(refund => {
              const statusConfig = getStatusConfig(refund.status);
              return (
                <StaggerItem key={refund.id}>
                  <div className={cn(commonStyles.refundCard, themeStyles.refundCard)}>
                    <div className={commonStyles.refundMain}>
                      <div className={commonStyles.refundTop}>
                        <div className={commonStyles.refundUser}>
                          <div className={cn(commonStyles.userAvatar, themeStyles.userAvatar)}>
                            {refund.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className={cn(commonStyles.userName, themeStyles.userName)}>{refund.user_name}</span>
                            <span className={cn(commonStyles.refundDate, themeStyles.refundDate)}>
                              {new Date(refund.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className={commonStyles.refundAmount}>
                          <span className={cn(commonStyles.amountValue, themeStyles.amountValue)}>
                            ${refund.amount.toLocaleString()}
                          </span>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                      <p className={cn(commonStyles.refundReason, themeStyles.refundReason)}>
                        {refund.reason || 'No reason provided'}
                      </p>
                      {refund.contract_id && (
                        <span className={cn(commonStyles.contractRef, themeStyles.contractRef)}>
                          Contract #{refund.contract_id}
                        </span>
                      )}
                    </div>
                    <div className={commonStyles.refundActions}>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRefund(refund)} title="View Details">
                        <Eye size={16} />
                      </Button>
                      {refund.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm" onClick={() => setConfirmAction({ refund, action: 'approve' })} title="Approve">
                            <Check size={16} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setConfirmAction({ refund, action: 'reject' })} title="Reject">
                            <X size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {/* Detail Modal */}
        {selectedRefund && (
          <Modal isOpen onClose={() => setSelectedRefund(null)} title="Refund Details">
            <div className={commonStyles.detailGrid}>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Requester</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedRefund.user_name}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Amount</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>${selectedRefund.amount.toLocaleString()}</span>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Status</span>
                <Badge variant={getStatusConfig(selectedRefund.status).variant}>{selectedRefund.status}</Badge>
              </div>
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Date</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                  {new Date(selectedRefund.created_at).toLocaleString()}
                </span>
              </div>
              {selectedRefund.contract_id && (
                <div className={commonStyles.detailRow}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Contract</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>#{selectedRefund.contract_id}</span>
                </div>
              )}
              <div className={commonStyles.detailRow}>
                <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Reason</span>
                <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{selectedRefund.reason || 'No reason provided'}</span>
              </div>
            </div>
            {selectedRefund.status === 'pending' && (
              <div className={commonStyles.detailActions}>
                <Button variant="success" onClick={() => { setSelectedRefund(null); setConfirmAction({ refund: selectedRefund, action: 'approve' }); }}>
                  Approve Refund
                </Button>
                <Button variant="danger" onClick={() => { setSelectedRefund(null); setConfirmAction({ refund: selectedRefund, action: 'reject' }); }}>
                  Reject Refund
                </Button>
              </div>
            )}
          </Modal>
        )}

        {/* Confirm Action Modal */}
        {confirmAction && (
          <Modal isOpen onClose={() => setConfirmAction(null)} title={`${confirmAction.action === 'approve' ? 'Approve' : 'Reject'} Refund`}>
            <div className={commonStyles.confirmContent}>
              {confirmAction.action === 'approve' ? (
                <CheckCircle size={48} className={commonStyles.confirmIconApprove} />
              ) : (
                <AlertCircle size={48} className={commonStyles.confirmIconReject} />
              )}
              <p className={commonStyles.confirmText}>
                {confirmAction.action === 'approve'
                  ? `Approve refund of $${confirmAction.refund.amount.toLocaleString()} for ${confirmAction.refund.user_name}?`
                  : `Reject refund request from ${confirmAction.refund.user_name}?`}
              </p>
            </div>
            <div className={commonStyles.modalActions}>
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                variant={confirmAction.action === 'approve' ? 'success' : 'danger'}
                onClick={() => confirmAction.action === 'approve' ? handleApprove(confirmAction.refund.id) : handleReject(confirmAction.refund.id)}
              >
                {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}
