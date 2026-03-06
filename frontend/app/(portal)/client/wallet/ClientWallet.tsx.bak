// @AI-HINT: Client Wallet component. Theme-aware, accessible wallet with payment history and balance information.
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Button from '@/app/components/Button/Button';
import Select from '@/app/components/Select/Select';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { DollarSign, CheckCircle, Download, ArrowUpRight } from 'lucide-react';
import common from './ClientWallet.common.module.css';
import light from './ClientWallet.light.module.css';
import dark from './ClientWallet.dark.module.css';

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
  { value: 'status', label: 'Status' },
];

const DIR_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '20', label: '20 per page' },
  { value: '50', label: '50 per page' },
];

const ClientWallet: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { payments, loading, error } = useClientData();

  const walletStats = useMemo(() => {
    if (!Array.isArray(payments)) return { totalSpent: 0, pendingAmount: 0, completedPayments: 0 };
    
    const totalSpent = payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
        return sum + amount;
      }, 0);
    
    const completedPayments = payments.filter(p => p.status === 'Completed').length;
    
    return { totalSpent, pendingAmount, completedPayments };
  }, [payments]);

  type Txn = { id: string; amount: string; amountValue: number; date: string; description: string; status: string };
  const transactions = useMemo<Txn[]>(() => {
    if (!Array.isArray(payments)) return [];
    return payments.map((p, idx) => {
      const amountStr = String(p.amount ?? '0');
      const value = parseFloat(amountStr.replace(/[$,]/g, '') || '0');
      return {
        id: String(p.id ?? idx),
        amount: amountStr,
        amountValue: isFinite(value) ? value : 0,
        date: p.date ?? '',
        description: p.description ?? 'Unknown transaction',
        status: p.status ?? 'Unknown',
      };
    });
  }, [payments]);

  // Sorting
  type SortKey = 'date' | 'amount' | 'description' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sorted = useMemo(() => {
    const list = [...transactions];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'date': av = a.date; bv = b.date; break;
        case 'amount': av = a.amountValue; bv = b.amountValue; break;
        case 'description': av = a.description; bv = b.description; break;
        case 'status': av = a.status; bv = b.status; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [transactions, sortKey, sortDir]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  useEffect(() => { setPage(1); }, [sortKey, sortDir, pageSize]);

  const handleExportCSV = useCallback(() => {
    const header = ['ID', 'Date', 'Amount', 'Description', 'Status'];
    const data = sorted.map(t => [t.id, t.date, t.amount, t.description, t.status]);
    const csv = [header, ...data]
      .map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client_wallet_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Header */}
          <ScrollReveal>
            <div className={common.header}>
              <div>
                <h1 className={common.title}>Client Wallet</h1>
                <p className={cn(common.subtitle, themed.subtitle)}>
                  Track your payment history and manage your spending.
                </p>
              </div>
              <div className={common.headerActions}>
                <Button variant="secondary" size="md" iconBefore={<Download size={16} />} onClick={handleExportCSV}>
                  Export CSV
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {error && <div className={common.error}>Failed to load wallet data.</div>}

          {/* Balance Cards */}
          <ScrollReveal>
            <div className={common.balanceSection}>
              <div className={common.balanceGrid}>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={common.balanceCard}>
                      <Skeleton height={16} width={140} />
                      <Skeleton height={28} width={120} />
                    </div>
                  ))
                ) : (
                  <>
                    <div className={cn(common.balanceCard, themed.balanceCard)}>
                      <div className={common.balanceIcon}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h3 className={common.balanceTitle}>Total Spent</h3>
                        <p className={common.balanceAmount}>${walletStats.totalSpent.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={cn(common.balanceCard, themed.balanceCard)}>
                      <div className={cn(common.balanceIcon, common.balanceIconWarning)}>
                        <ArrowUpRight size={20} />
                      </div>
                      <div>
                        <h3 className={common.balanceTitle}>Pending Payments</h3>
                        <p className={common.balanceAmount}>${walletStats.pendingAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={cn(common.balanceCard, themed.balanceCard)}>
                      <div className={cn(common.balanceIcon, common.balanceIconSuccess)}>
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h3 className={common.balanceTitle}>Completed Payments</h3>
                        <p className={common.balanceAmount}>{walletStats.completedPayments}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Transactions Section */}
          <ScrollReveal>
            <div className={common.transactionsSection}>
              <section className={common.section}>
                <div className={common.sectionHeader}>
                  <h2 className={common.sectionTitle}>Recent Transactions</h2>
                  <span className={common.transactionCount}>
                    {sorted.length} transaction{sorted.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={common.toolbar}>
                  <div className={common.controls}>
                    <Select
                      id="wallet-sort-key"
                      options={SORT_OPTIONS}
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                    />
                    <Select
                      id="wallet-sort-dir"
                      options={DIR_OPTIONS}
                      value={sortDir}
                      onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                    />
                    <Select
                      id="wallet-page-size"
                      options={PAGE_SIZE_OPTIONS}
                      value={String(pageSize)}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    />
                  </div>
                </div>

                {loading ? (
                  <StaggerContainer className={common.transactionList}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={common.rowSkeleton}>
                        <Skeleton height={14} width={'30%'} />
                        <Skeleton height={12} width={'20%'} />
                        <Skeleton height={12} width={'40%'} />
                      </div>
                    ))}
                  </StaggerContainer>
                ) : (
                  <>
                    <StaggerContainer className={common.transactionList}>
                      {paged.map(txn => (
                        <TransactionRow
                          key={txn.id}
                          amount={txn.amount}
                          date={txn.date}
                          description={txn.description}
                        />
                      ))}
                      {sorted.length === 0 && (
                        <div className={common.emptyState}>
                          <DollarSign size={32} className={common.fadedIcon} />
                          <p>No transactions found.</p>
                        </div>
                      )}
                    </StaggerContainer>

                    {sorted.length > 0 && (
                      <div className={common.paginationBar} role="navigation" aria-label="Pagination">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={pageSafe === 1}
                          aria-label="Previous page"
                        >
                          Prev
                        </Button>
                        <span className={common.paginationInfo} aria-live="polite">
                          Page {pageSafe} of {totalPages} &middot; {sorted.length} result(s)
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={pageSafe === totalPages}
                          aria-label="Next page"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default ClientWallet;