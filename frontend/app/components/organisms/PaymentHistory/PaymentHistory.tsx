// @AI-HINT: Payment history dashboard with transaction list, filters, and export
"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './PaymentHistory.common.module.css';
import lightStyles from './PaymentHistory.light.module.css';
import darkStyles from './PaymentHistory.dark.module.css';

interface Payment {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method: string;
  description: string;
  created_at: string;
  recipient?: string;
  project_id?: string;
}

interface PaymentHistoryProps {
  userId?: string;
  projectId?: string;
  className?: string;
}

export default function PaymentHistory({
  userId,
  projectId,
  className = ''
}: PaymentHistoryProps) {
  const { resolvedTheme } = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [searchQuery, setSearchQuery] = useState('');

  // Theme guard
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (projectId) params.append('project_id', projectId);
        
        const response = await fetch(
          `/api/multicurrency/payments/history?${params}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment history');
        }
        
        const data = await response.json();
        setPayments(data.payments || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [userId, projectId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((p) => p.type === typeFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((p) => new Date(p.created_at) >= cutoff);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.description.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.currency.toLowerCase().includes(query)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, typeFilter, dateRange, searchQuery]);

  const handleExport = () => {
    const csv = [
      'ID,Type,Amount,Currency,Status,Method,Description,Date',
      ...filteredPayments.map((p) =>
        [
          p.id,
          p.type,
          p.amount,
          p.currency,
          p.status,
          p.method,
          `"${p.description}"`,
          p.created_at
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getTypeIcon = (type: Payment['type']) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'payment': return '💳';
      case 'refund': return '↩️';
      default: return '💵';
    }
  };

  const calculateTotals = () => {
    const totals: Record<string, number> = {};
    filteredPayments.forEach((p) => {
      if (p.status === 'completed') {
        if (!totals[p.currency]) totals[p.currency] = 0;
        if (p.type === 'deposit' || p.type === 'refund') {
          totals[p.currency] += p.amount;
        } else {
          totals[p.currency] -= p.amount;
        }
      }
    });
    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      {/* Header */}
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <div>
          <h2 className={commonStyles.title}>💳 Payment History</h2>
          <p className={commonStyles.subtitle}>
            {filteredPayments.length} transactions found
          </p>
        </div>
        <Button variant="outline" size="md" onClick={handleExport}>
          📥 Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className={cn(commonStyles.filters, themeStyles.filters)}>
        {/* Search */}
        <div className={cn(commonStyles.searchContainer, themeStyles.searchContainer)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID, description, currency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </div>

        {/* Filter buttons */}
        <div className={commonStyles.filterRow}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={cn(commonStyles.select, themeStyles.select)}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="payment">Payments</option>
            <option value="refund">Refunds</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className={cn(commonStyles.select, themeStyles.select)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Totals */}
      {Object.keys(totals).length > 0 && (
        <div className={cn(commonStyles.totals, themeStyles.totals)}>
          <span className={commonStyles.totalsLabel}>Net Balance:</span>
          {Object.entries(totals).map(([currency, amount]) => (
            <span
              key={currency}
              className={cn(
                commonStyles.totalAmount,
                amount >= 0 ? commonStyles.totalPositive : commonStyles.totalNegative,
                amount >= 0 ? themeStyles.totalPositive : themeStyles.totalNegative
              )}
            >
              {amount >= 0 ? '+' : ''}{amount.toFixed(2)} {currency}
            </span>
          ))}
        </div>
      )}

      {/* Payment List */}
      {isLoading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          <div className={commonStyles.spinner}>⏳</div>
          <p>Loading payment history...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          ⚠️ {error}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <div className={commonStyles.emptyIcon}>💳</div>
          <h3>No payments found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className={cn(commonStyles.list, themeStyles.list)}>
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className={cn(commonStyles.paymentCard, themeStyles.paymentCard)}
            >
              <div className={commonStyles.paymentHeader}>
                <div className={commonStyles.paymentIcons}>
                  <span className={commonStyles.typeIcon}>{getTypeIcon(payment.type)}</span>
                  <span className={commonStyles.statusIcon}>{getStatusIcon(payment.status)}</span>
                </div>
                <span className={cn(commonStyles.paymentId, themeStyles.paymentId)}>
                  #{payment.id.slice(0, 8)}
                </span>
              </div>

              <div className={commonStyles.paymentBody}>
                <div className={commonStyles.paymentMain}>
                  <h4 className={commonStyles.paymentDescription}>
                    {payment.description || 'No description'}
                  </h4>
                  <div className={commonStyles.paymentMeta}>
                    <span className={commonStyles.metaItem}>
                      {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                    </span>
                    <span className={commonStyles.metaDot}>•</span>
                    <span className={commonStyles.metaItem}>{payment.method}</span>
                    <span className={commonStyles.metaDot}>•</span>
                    <span className={commonStyles.metaItem}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={commonStyles.paymentAmount}>
                  <span
                    className={cn(
                      commonStyles.amount,
                      payment.type === 'deposit' || payment.type === 'refund'
                        ? commonStyles.amountPositive
                        : commonStyles.amountNegative,
                      payment.type === 'deposit' || payment.type === 'refund'
                        ? themeStyles.amountPositive
                        : themeStyles.amountNegative
                    )}
                  >
                    {payment.type === 'deposit' || payment.type === 'refund' ? '+' : '-'}
                    {payment.amount.toFixed(2)}
                  </span>
                  <span className={commonStyles.currency}>{payment.currency}</span>
                </div>
              </div>

              <div
                className={cn(
                  commonStyles.paymentStatus,
                  themeStyles.paymentStatus,
                  commonStyles[`status${payment.status.charAt(0).toUpperCase()}${payment.status.slice(1)}`],
                  themeStyles[`status${payment.status.charAt(0).toUpperCase()}${payment.status.slice(1)}`]
                )}
              >
                {payment.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
