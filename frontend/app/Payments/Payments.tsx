// @AI-HINT: Payments page - displays real payment history and wallet balance from API
// Production-ready: No mock data, connects to /api/wallet and /api/payments
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Wallet, History, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import { getAuthToken } from '@/lib/api';
import common from './Payments.common.module.css';
import light from './Payments.light.module.css';
import dark from './Payments.dark.module.css';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  desc: string;
  date: string;
}

interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

// API helper
async function fetchApi<T>(endpoint: string): Promise<T | null> {
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  try {
    const res = await fetch(`/api${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const Payments: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = useMemo(() => resolvedTheme === 'dark' ? dark : light, [resolvedTheme]);
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<WalletBalance>({ available: 0, pending: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch wallet balance
      const walletData = await fetchApi<any>('/wallet/balance');
      if (walletData) {
        setBalance({
          available: walletData.available || 0,
          pending: walletData.pending || 0,
          total: (walletData.available || 0) + (walletData.pending || 0) + (walletData.escrow || 0),
        });
      }

      // Fetch wallet transactions
      const txData = await fetchApi<any[]>('/wallet/transactions?limit=20');
      if (txData && Array.isArray(txData)) {
        const mapped: Transaction[] = txData.map((tx: any) => ({
          id: tx.id,
          type: ['deposit', 'escrow_release', 'milestone_payment', 'bonus', 'refund'].includes(tx.type) ? 'credit' : 'debit',
          amount: Math.abs(tx.amount || 0),
          desc: tx.description || `${tx.type} transaction`,
          date: tx.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        }));
        setTransactions(mapped);
      }
    } catch (err) {
      console.error('[Payments] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  if (!mounted) return null;

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <PageTransition>
      <div className={common.page}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <Wallet size={28} className={cn(common.headerIcon, themed.headerIcon)} />
              <h1 className={cn(common.title, themed.title)}>Payments</h1>
            </div>
          </ScrollReveal>

          {/* Balance Cards */}
          <ScrollReveal>
            <div className={common.balanceGrid}>
              <div className={cn(common.balanceCard, common.balanceCardPrimary)}>
                <p className={cn(common.balanceLabel, common.balanceLabelWhite)}>Available Balance</p>
                <p className={cn(common.balanceValue, common.balanceValueWhite)}>${fmt(balance.available)}</p>
              </div>
              <div className={cn(common.balanceCard, themed.balanceCard)}>
                <p className={cn(common.balanceLabel, themed.balanceLabel)}>Pending</p>
                <p className={cn(common.balanceValue, themed.balanceValue)}>${fmt(balance.pending)}</p>
              </div>
              <div className={cn(common.balanceCard, themed.balanceCard)}>
                <p className={cn(common.balanceLabel, themed.balanceLabel)}>Total Balance</p>
                <p className={cn(common.balanceValue, themed.balanceValue)}>${fmt(balance.total)}</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Transaction History */}
          <ScrollReveal>
            <div className={cn(common.transactionsCard, themed.transactionsCard)}>
              <div className={cn(common.transactionsHeader, themed.transactionsHeader)}>
                <History size={20} className={cn(common.transactionsIcon, themed.transactionsIcon)} />
                <h2 className={cn(common.transactionsTitle, themed.transactionsTitle)}>Recent Transactions</h2>
              </div>
              {loading ? (
                <div className={common.loadingContainer}>
                  <Loader2 className={common.spinner} />
                </div>
              ) : transactions.length === 0 ? (
                <div className={cn(common.emptyState, themed.emptyState)}>
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className={common.transactionList}>
                  {transactions.map((tx) => (
                    <div key={tx.id} className={cn(common.transactionRow, themed.transactionRow)}>
                      <div className={common.transactionLeft}>
                        <div className={cn(
                          tx.type === 'credit' ? common.txIconCredit : common.txIconDebit,
                          tx.type === 'credit' ? themed.txIconCredit : themed.txIconDebit
                        )}>
                          {tx.type === 'credit' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className={cn(common.txDesc, themed.txDesc)}>{tx.desc}</p>
                          <p className={cn(common.txDate, themed.txDate)}>{tx.date}</p>
                        </div>
                      </div>
                      <span className={tx.type === 'credit' ? common.txAmountCredit : common.txAmountDebit}>
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </PageTransition>
  );
};

export default Payments;
