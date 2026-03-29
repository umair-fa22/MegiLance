// @AI-HINT: This is the Wallet page for freelancers to manage their earnings and transactions. It is now fully theme-aware and features a premium, production-ready design.
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Info } from 'lucide-react';
import api from '@/lib/api';
import { apiFetch } from '@/lib/api/core';
import TransactionRow from '@/app/components/molecules/TransactionRow/TransactionRow';
import Button from '@/app/components/atoms/Button/Button';
import { useFreelancerData } from '@/hooks/useFreelancer';
import DataToolbar, { SortOption } from '@/app/components/organisms/DataToolbar/DataToolbar';
import PaginationBar from '@/app/components/molecules/PaginationBar/PaginationBar';
import { usePersistedState } from '@/app/lib/hooks/usePersistedState';
import { exportCSV, exportData } from '@/app/lib/csv';
import TableSkeleton from '@/app/components/organisms/DataTableExtras/TableSkeleton';
import DensityToggle, { Density } from '@/app/components/organisms/DataTableExtras/DensityToggle';
import SavedViewsMenu from '@/app/components/organisms/DataTableExtras/SavedViewsMenu';
import VirtualList from '@/app/components/organisms/DataTableExtras/VirtualList';
import Modal from '@/app/components/organisms/Modal/Modal';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { WalletIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.common.module.css';
import commonStyles from './Wallet.common.module.css';
import lightStyles from './Wallet.light.module.css';
import darkStyles from './Wallet.dark.module.css';

const Wallet: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { analytics, transactions, loading, error } = useFreelancerData();
  const toaster = useToaster();

  // Fetch commission rate from seller stats
  const [commissionRate, setCommissionRate] = useState<number>(20);
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const data = await apiFetch('/seller-stats/me') as Record<string, unknown>;
        const benefits = (data.benefits ?? {}) as Record<string, unknown>;
        const reduced = (benefits.reduced_fees as number) ?? 0;
        setCommissionRate(20 - reduced);
      } catch {
        // Default 20% if unavailable
      }
    };
    fetchRate();
  }, []);
  
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const balance = useMemo(() => {
    if (!analytics?.walletBalance) return 0;
    const balanceStr = analytics.walletBalance.replace(/[$,]/g, '');
    return parseFloat(balanceStr) ?? 0;
  }, [analytics?.walletBalance]);

  const [q, setQ] = usePersistedState<string>('freelancer:wallet:q', '');
  const [sortKey, setSortKey] = usePersistedState<'date' | 'amount' | 'type'>('freelancer:wallet:sortKey', 'date');
  const [sortDir, setSortDir] = usePersistedState<'asc' | 'desc'>('freelancer:wallet:sortDir', 'desc');
  const [pageSize, setPageSize] = usePersistedState<number>('freelancer:wallet:pageSize', 10);
  const [page, setPage] = usePersistedState<number>('freelancer:wallet:page', 1);
  const [uiLoading, setUiLoading] = useState(false);
  const [density, setDensity] = usePersistedState<Density>('freelancer:wallet:density', 'comfortable');
  const listRef = useRef<HTMLDivElement>(null);
  const itemHeight = density === 'compact' ? 48 : 56;
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');

  interface TxRow {
    id: string;
    type: string;
    amount: string;
    date: string;
    description: string;
  }

  const transactionRows: TxRow[] = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.map((txn, idx) => ({
      id: String(txn.id ?? idx),
      type: txn.type?.toLowerCase() ?? 'payment',
      amount: txn.amount ?? '0',
      date: txn.date ?? '',
      description: txn.description ?? 'Unknown transaction',
    }));
  }, [transactions]);

  const filtered = useMemo(() => {
    const lowerCaseQ = q.toLowerCase();
    return transactionRows.filter((tx) => {
      return tx.type.includes(lowerCaseQ) || tx.description.includes(lowerCaseQ);
    });
  }, [transactionRows, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const sortFn = (a: TxRow, b: TxRow) => {
      if (sortKey === 'date') {
        const av = new Date(a.date).getTime();
        const bv = new Date(b.date).getTime();
        return sortDir === 'asc' ? av - bv : bv - av;
      } else if (sortKey === 'amount') {
        const av = parseFloat(a.amount);
        const bv = parseFloat(b.amount);
        return sortDir === 'asc' ? av - bv : bv - av;
      } else {
        return sortDir === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }
    };
    list.sort(sortFn);
    return list;
  }, [filtered, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
  }, [sorted, page, pageSize]);

  const totalPages = useMemo(() => {
    const t = Math.ceil(sorted.length / pageSize);
    return Math.max(1, t);
  }, [sorted, pageSize]);

  const pageSafe = useMemo(() => {
    return Math.min(Math.max(1, page), totalPages);
  }, [page, totalPages]);

  // Lightweight UI loading to avoid layout jank on control changes
  useEffect(() => {
    setUiLoading(true);
    const t = setTimeout(() => setUiLoading(false), 120);
    return () => clearTimeout(t);
  }, [q, sortKey, sortDir, page, pageSize]);

  const onExportCSV = () => {
    const header = ['Type', 'Amount', 'Date', 'Description'];
    const rows = sorted.map(tx => [tx.type, tx.amount, tx.date, tx.description]);
    exportCSV(header, rows, 'transactions');
  };

  const onExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const header = ['Type', 'Amount', 'Date', 'Description'];
    const rows = sorted.map(tx => [tx.type, tx.amount, tx.date, tx.description]);
    exportData(format, header, rows, 'transactions');
  };

  const openWithdraw = () => {
    setWithdrawAmount('');
    setWithdrawError('');
    setWithdrawOpen(true);
  };

  const onWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setWithdrawError('Enter a valid amount greater than 0.');
      return;
    }
    if (amt > balance) {
      setWithdrawError('Amount exceeds available balance.');
      return;
    }
    setWithdrawError('');
    setUiLoading(true);
    try {
      await api.portal.freelancer.withdraw(amt);

      toaster.notify({
        title: 'Withdrawal requested',
        description: `Withdrawal of $${amt.toLocaleString()} requested successfully.`,
        variant: 'success',
        duration: 4000,
      });
      setWithdrawOpen(false);
      // Ideally we should refetch data here, but reload is a simple way to ensure consistency for now
      window.location.reload();
    } catch (e: any) {
      toaster.notify({
        title: 'Withdrawal failed',
        description: e.message || 'Failed to submit withdrawal. Please try again.',
        variant: 'danger',
        duration: 5000,
      });
    } finally {
      setUiLoading(false);
    }
  };

  const sortOptions: SortOption[] = [
    { value: 'date:desc', label: 'Newest' },
    { value: 'date:asc', label: 'Oldest' },
    { value: 'amount:desc', label: 'Amount High–Low' },
    { value: 'amount:asc', label: 'Amount Low–High' },
    { value: 'type:asc', label: 'Type A–Z' },
    { value: 'type:desc', label: 'Type Z–A' },
  ];

  return (
    <PageTransition>
      <div className={styles.container}>
        <ScrollReveal>
          <header className={styles.header}>
            <div className={styles.heroRow}>
              <div className={styles.heroContent}>
                <h1 className={styles.title}>My Wallet</h1>
                <p className={styles.subtitle}>View your balance, transactions, and manage withdrawals.</p>
              </div>
              <WalletIllustration className={illustrationStyles.heroIllustrationSmall} />
            </div>
          </header>
        </ScrollReveal>

        {loading && <div className={styles.loading} aria-busy="true">Loading wallet...</div>}
        {error && <div className={styles.error}>Failed to load wallet data.</div>}

        <div className={styles.contentGrid}>
          <ScrollReveal>
            <div className={styles.balanceCard}>
              <h2 className={styles.cardTitle}>Available Balance</h2>
              <p className={styles.balanceAmount}>${balance.toLocaleString()}</p>

              {/* Fee breakdown info */}
              <div className={styles.feeBreakdown} role="region" aria-label="Fee information">
                <div className={styles.feeRow}>
                  <span className={styles.feeLabel}>
                    <Info size={13} aria-hidden="true" style={{ opacity: 0.6 }} />
                    Platform Commission
                  </span>
                  <span className={styles.feeValue}>{commissionRate}%</span>
                </div>
                <div className={styles.feeDivider} />
                <p className={styles.feeHint}>
                  Your net earnings are credited after the {commissionRate}% platform fee. Level up your seller tier to reduce fees.
                </p>
              </div>

              <Button
                variant="primary"
                size="large"
                disabled={balance <= 0}
                aria-disabled={balance <= 0}
                title={balance <= 0 ? 'No available balance to withdraw' : 'Withdraw funds to your account'}
                onClick={openWithdraw}
              >
                Withdraw Funds
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <section className={styles.transactionsCard}>
              <h2 className={styles.cardTitle}>Transaction History</h2>
              <DataToolbar
                query={q}
                onQueryChange={(val) => { setQ(val); setPage(1); }}
                sortValue={`${sortKey}:${sortDir}`}
                onSortChange={(val) => {
                  const [k, d] = val.split(':') as [typeof sortKey, typeof sortDir];
                  setSortKey(k); setSortDir(d); setPage(1);
                }}
                pageSize={pageSize}
                onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
                sortOptions={sortOptions}
                onExport={onExport}
                exportLabel="Export"
                aria-label="Transactions filters and actions"
                searchPlaceholder="Search transactions"
                searchTitle="Search transactions"
                sortTitle="Sort transactions by"
                pageSizeTitle="Transactions per page"
                exportFormatTitle="Export transactions as"
              />
              <span className={styles.srOnly} aria-live="polite">
                Filters updated. {q ? `Query: ${q}. ` : ''}Sort: {sortKey} {sortDir}. Page size: {pageSize}.
              </span>

              <div className={styles.extrasRow} role="group" aria-label="View options">
                <DensityToggle value={density} onChange={setDensity} />
                <SavedViewsMenu
                  storageKey="freelancer:wallet:savedViews"
                  buildPayload={() => ({ q, sortKey, sortDir, pageSize, density })}
                  onApply={(p: { q: string; sortKey: typeof sortKey; sortDir: typeof sortDir; pageSize: number; density: typeof density; }) => {
                    setQ(p.q ?? '');
                    setSortKey(p.sortKey ?? 'date');
                    setSortDir(p.sortDir ?? 'desc');
                    setPageSize(p.pageSize ?? 10);
                    setDensity(p.density ?? 'comfortable');
                    setPage(1);
                  }}
                  aria-label="Wallet saved views"
                />
                <span className={styles.srOnly} aria-live="polite">Showing {sorted.length} transactions</span>
              </div>

              <div className={styles.transactionList} data-density={density} ref={listRef}>
                {uiLoading ? (
                  <TableSkeleton rows={Math.min(pageSize, 6)} cols={3} dense={density==='compact'} />
                ) : sorted.length === 0 && !loading ? (
                  <div className={styles.emptyState} role="status" aria-live="polite">No transactions found.</div>
                ) : (
                  <VirtualList
                    items={paged}
                    itemHeight={itemHeight}
                    overscan={6}
                    containerRef={listRef}
                    renderItem={(tx) => (
                      <TransactionRow key={tx.id} {...tx} />
                    )}
                  />
                )}
              </div>

              {sorted.length > 0 && (
                <PaginationBar
                  currentPage={pageSafe}
                  totalPages={totalPages}
                  totalResults={sorted.length}
                  onPrev={() => setPage(p => Math.max(1, p - 1))}
                  onNext={() => setPage(p => Math.min(totalPages, p + 1))}
                />
              )}
              {sorted.length > 0 && (
                <span className={styles.srOnly} aria-live="polite">
                  Page {pageSafe} of {totalPages}. {sorted.length} transaction{sorted.length === 1 ? '' : 's'}.
                </span>
              )}
            </section>
          </ScrollReveal>
        </div>

        <Modal
          isOpen={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          title="Withdraw Funds"
          size="small"
        >
          <form
            onSubmit={(e) => { e.preventDefault(); onWithdrawSubmit(); }}
            aria-label="Withdraw funds form"
          >
            <div className={styles.modalGrid}>
              <label htmlFor="withdraw-amount" className={styles.formLabel}>
                Amount (USD)
              </label>
              <input
                id="withdraw-amount"
                name="amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="e.g. 250.00"
                className={styles.input}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                aria-describedby={withdrawError ? 'withdraw-error' : undefined}
              />
              {withdrawError && (
                <div id="withdraw-error" role="alert" className={styles.error}>
                  {withdrawError}
                </div>
              )}
              {/* Withdrawal preview */}
              {withdrawAmount && parseFloat(withdrawAmount) > 0 && !withdrawError && (
                <div className={styles.feeBreakdown} role="status" aria-live="polite">
                  <div className={styles.feeRow}>
                    <span className={styles.feeLabel}>Withdrawal Amount</span>
                    <span className={styles.feeValue}>${parseFloat(withdrawAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className={styles.feeRow}>
                    <span className={styles.feeLabel}>Processing Fee</span>
                    <span className={styles.feeValue}>$0.00</span>
                  </div>
                  <div className={styles.feeDivider} />
                  <div className={styles.feeRow}>
                    <span className={styles.feeLabelBold}>You&apos;ll Receive</span>
                    <span className={styles.feeValueBold}>${parseFloat(withdrawAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={uiLoading} aria-busy={uiLoading}>Confirm Withdraw</Button>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Wallet;
