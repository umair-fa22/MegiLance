// @AI-HINT: This component provides a modernized interface for admins to review and process freelancer withdrawal requests. Fetches from /payments API with outgoing filter.
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, MoreVertical, Copy, ArrowDownUp, Calendar, Inbox, Loader2 } from 'lucide-react'

import api from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import UserAvatar from '@/app/components/atoms/UserAvatar/UserAvatar';
import ActionMenu, { type ActionMenuItem } from '@/app/components/molecules/ActionMenu/ActionMenu';
import commonStyles from './Withdrawals.common.module.css';
import lightStyles from './Withdrawals.light.module.css';
import darkStyles from './Withdrawals.dark.module.css';

// Types
type Status = 'Pending' | 'Approved' | 'Rejected';
type SortBy = 'date' | 'amount';

interface WithdrawalRequest {
  id: string;
  freelancerName: string;
  freelancerAvatarUrl?: string;
  amount: number;
  currency: string;
  destinationAddress: string;
  dateRequested: string;
  status: Status;
}

interface ApiPayment {
  id: number;
  contract_id: number | null;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  tx_hash: string | null;
  escrow_address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function normalizeStatus(status: string): Status {
  const lower = status.toLowerCase();
  if (lower === 'completed') return 'Approved';
  if (lower === 'pending') return 'Pending';
  if (lower === 'failed' || lower === 'rejected') return 'Rejected';
  return 'Pending';
}

const StatusBadge = ({ status }: { status: Status }) => {
  const normalizedStatus = normalizeStatus(status);
  const variantMap: Record<Status, 'warning' | 'success' | 'danger'> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
  };
  const variant = variantMap[normalizedStatus];

  return <Badge variant={variant}>{normalizedStatus}</Badge>;
};

export default function Withdrawals() {
  const { resolvedTheme } = useTheme();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  useEffect(() => {
    async function fetchWithdrawals() {
      try {
        setLoading(true);
        
        // Fetch outgoing payments (withdrawals/payouts)
        const payments: ApiPayment[] = await api.payments.list(50) as any;

        // Transform API payments to withdrawal format
        const transformed: WithdrawalRequest[] = payments.map((payment) => ({
          id: `wd_${payment.id}`,
          freelancerName: `User #${payment.to_user_id}`,
          freelancerAvatarUrl: '',
          amount: payment.amount,
          currency: payment.currency || 'USD',
          destinationAddress: payment.escrow_address || payment.tx_hash || 'N/A',
          dateRequested: payment.created_at.split('T')[0],
          status: normalizeStatus(payment.status),
        }));

        setRequests(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load withdrawals');
      } finally {
        setLoading(false);
      }
    }

    fetchWithdrawals();
  }, []);

  const handleProcess = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setRequests(requests.map(req => (req.id === id ? { ...req, status: newStatus } : req)));
    // In production, this would also make a PATCH API call
  };

  const filteredAndSortedRequests = useMemo(() => {
    return requests
      .filter(req => {
        const normalized = normalizeStatus(req.status);
        return filter === 'All' || normalized === filter;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') return b.amount - a.amount;
        return new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime();
      });
  }, [requests, filter, sortBy]);

  const getActionItems = (request: WithdrawalRequest): ActionMenuItem[] => {
    const normalizedStatus = normalizeStatus(request.status);
    return [
      {
        label: 'Approve',
        onClick: () => handleProcess(request.id, 'Approved'),
        icon: CheckCircle,
        disabled: normalizedStatus !== 'Pending',
      },
      {
        label: 'Reject',
        onClick: () => handleProcess(request.id, 'Rejected'),
        icon: XCircle,
        disabled: normalizedStatus !== 'Pending',
      },
      { isSeparator: true },
      {
        label: 'Copy Address',
        onClick: () => navigator.clipboard.writeText(request.destinationAddress),
        icon: Copy,
      },
    ];
  };

  const styles = { ...commonStyles, ...(resolvedTheme === 'dark' ? darkStyles : lightStyles) };

  if (loading) {
    return (
      <div className={cn(styles.pageContainer, resolvedTheme === 'dark' ? styles.dark : styles.light)}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Withdrawal Requests</h1>
        </div>
        <div className={styles.loadingState}>
          <Loader2 className={styles.spinner} size={32} />
          <span>Loading withdrawal requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(styles.pageContainer, resolvedTheme === 'dark' ? styles.dark : styles.light)}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Withdrawal Requests</h1>
        </div>
        <div className={styles.errorState}>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const countByStatus = (status: 'Pending' | 'Approved' | 'Rejected') => 
    requests.filter(r => normalizeStatus(r.status) === status).length;

  return (
    <div className={cn(styles.pageContainer, resolvedTheme === 'dark' ? styles.dark : styles.light)}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Withdrawal Requests</h1>
        <div className={styles.headerActions}>
          <Button variant={sortBy === 'date' ? 'primary' : 'ghost'} size="sm" onClick={() => setSortBy('date')} iconBefore={<Calendar size={16} />}>Sort by Date</Button>
          <Button variant={sortBy === 'amount' ? 'primary' : 'ghost'} size="sm" onClick={() => setSortBy('amount')} iconBefore={<ArrowDownUp size={16} />}>Sort by Amount</Button>
        </div>
      </div>

      <div className={styles.filterTabs}>
        {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(status => (
          <button key={status} onClick={() => setFilter(status)} className={cn(styles.filterTab, { [styles.activeTab]: filter === status })}>
            {status} <Badge variant="info">{status === 'All' ? requests.length : countByStatus(status)}</Badge>
          </button>
        ))}
      </div>

      <div className={styles.requestsGrid}>
        {filteredAndSortedRequests.length > 0 ? (
          filteredAndSortedRequests.map(req => (
            <div key={req.id} className={styles.requestCard}>
              <div className={styles.cardHeader}>
                <UserAvatar src={req.freelancerAvatarUrl} name={req.freelancerName} size={40} />
                <div className={styles.cardHeaderText}>
                  <span className={styles.freelancerName}>{req.freelancerName}</span>
                  <span className={styles.requestDate}>{req.dateRequested}</span>
                </div>
                <ActionMenu
                  trigger={<Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>}
                  items={getActionItems(req)}
                />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.amount}>${req.amount.toLocaleString()} <Badge variant="info">{req.currency}</Badge></div>
                <div className={styles.addressWrapper}>
                  <span className={styles.addressLabel}>To:</span>
                  <code className={styles.address}>{req.destinationAddress}</code>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <StatusBadge status={req.status} />
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Inbox size={48} className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No {filter} Requests</h3>
            <p className={styles.emptyStateText}>There are currently no withdrawal requests with this status.</p>
          </div>
        )}
      </div>
    </div>
  );
};
