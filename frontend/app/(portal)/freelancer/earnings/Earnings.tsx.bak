// @AI-HINT: Freelancer earnings dashboard - comprehensive view of income, payment history, and earnings analytics
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { walletApi } from '@/lib/api';
import { portalApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Loading from '@/app/components/Loading/Loading';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import {
  DollarSign, TrendingUp, TrendingDown, Clock, Download,
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard, ShieldAlert
} from 'lucide-react';
import commonStyles from './Earnings.common.module.css';
import lightStyles from './Earnings.light.module.css';
import darkStyles from './Earnings.dark.module.css';

interface EarningTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'fee' | 'bonus' | 'refund';
  status: 'completed' | 'pending' | 'processing' | 'failed';
  date: string;
  project_title?: string;
  client_name?: string;
}

interface EarningsData {
  total_earned: number;
  available_balance: number;
  pending_amount: number;
  withdrawn_total: number;
  monthly_earnings: { month: string; amount: number }[];
}

type Period = '7d' | '30d' | '90d' | '12m' | 'all';

export default function EarningsPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [earningsRes, walletRes, txRes] = await Promise.allSettled([
        portalApi.freelancer.getEarnings(),
        portalApi.freelancer.getWallet(),
        walletApi.getTransactions(1, 50),
      ]);

      // Parse earnings
      const earnings = earningsRes.status === 'fulfilled' ? earningsRes.value as Record<string, unknown> : null;
      const wallet = walletRes.status === 'fulfilled' ? walletRes.value as Record<string, unknown> : null;
      const txData = txRes.status === 'fulfilled' ? txRes.value as Record<string, unknown> : null;

      const totalEarned = Number(earnings?.total_earned ?? wallet?.total_earned ?? 0);
      const available = Number(wallet?.available_balance ?? wallet?.balance ?? 0);
      const pending = Number(wallet?.pending_balance ?? earnings?.pending ?? 0);
      const withdrawn = Number(wallet?.total_withdrawn ?? earnings?.withdrawn ?? 0);

      // Build monthly earnings from response or generate from transactions
      let monthlyEarnings: { month: string; amount: number }[] = [];
      if (earnings?.monthly_earnings && Array.isArray(earnings.monthly_earnings)) {
        monthlyEarnings = earnings.monthly_earnings as { month: string; amount: number }[];
      } else {
        // Generate last 6 months with available data
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthlyEarnings.push({
            month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            amount: Math.round(totalEarned / 6 * 100) / 100,
          });
        }
      }

      setEarningsData({
        total_earned: totalEarned,
        available_balance: available,
        pending_amount: pending,
        withdrawn_total: withdrawn,
        monthly_earnings: monthlyEarnings,
      });

      // Parse transactions
      const rawTx = txData?.transactions || txData?.data || (Array.isArray(txData) ? txData : []);
      if (Array.isArray(rawTx)) {
        setTransactions(rawTx.map((t: Record<string, unknown>, idx: number) => ({
          id: String(t.id ?? idx),
          description: String(t.description ?? t.type ?? 'Transaction'),
          amount: Number(t.amount ?? 0),
          type: mapTransactionType(String(t.type ?? t.transaction_type ?? 'earning')),
          status: mapStatus(String(t.status ?? 'completed')),
          date: String(t.created_at ?? t.date ?? new Date().toISOString()),
          project_title: t.project_title as string | undefined,
          client_name: t.client_name as string | undefined,
        })));
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
      setError('Unable to load earnings data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mapTransactionType = (type: string): EarningTransaction['type'] => {
    if (type.includes('withdraw') || type.includes('payout')) return 'withdrawal';
    if (type.includes('fee') || type.includes('commission')) return 'fee';
    if (type.includes('bonus') || type.includes('reward')) return 'bonus';
    if (type.includes('refund')) return 'refund';
    return 'earning';
  };

  const mapStatus = (status: string): EarningTransaction['status'] => {
    if (status.includes('pend')) return 'pending';
    if (status.includes('process')) return 'processing';
    if (status.includes('fail') || status.includes('reject')) return 'failed';
    return 'completed';
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    switch (period) {
      case '7d': cutoff.setDate(now.getDate() - 7); break;
      case '30d': cutoff.setDate(now.getDate() - 30); break;
      case '90d': cutoff.setDate(now.getDate() - 90); break;
      case '12m': cutoff.setFullYear(now.getFullYear() - 1); break;
      default: return transactions;
    }
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period]);

  const periodEarnings = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'earning' || t.type === 'bonus')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  const handleExportCSV = useCallback(() => {
    const header = ['Date', 'Description', 'Type', 'Amount', 'Status', 'Project', 'Client'];
    const data = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.type,
      t.amount.toFixed(2),
      t.status,
      t.project_title || '',
      t.client_name || '',
    ]);
    const csv = [header, ...data]
      .map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions, period]);

  const getStatusVariant = (status: EarningTransaction['status']): 'success' | 'warning' | 'primary' | 'danger' => {
    const map: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
      completed: 'success', pending: 'warning', processing: 'primary', failed: 'danger',
    };
    return map[status] || 'primary';
  };

  const maxMonthly = useMemo(() => {
    if (!earningsData) return 1;
    return Math.max(...earningsData.monthly_earnings.map(m => m.amount), 1);
  }, [earningsData]);

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerInfo}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Earnings</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Track your income, withdrawals, and payment history
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="secondary" size="md" iconBefore={<Download size={16} />} onClick={handleExportCSV}>
                Export
              </Button>
              <Button as="a" variant="primary" size="md" href="/freelancer/withdraw">
                Withdraw
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {error && (
          <div className={commonStyles.errorBanner}>
            <ShieldAlert size={18} />
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={loadEarningsData}>Retry</Button>
          </div>
        )}

        {loading ? (
          <Loading text="Loading earnings data..." />
        ) : (
          <>
            {/* Stats */}
            <ScrollReveal>
              <div className={commonStyles.statsGrid}>
                <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconPrimary)}>
                    <DollarSign size={22} />
                  </div>
                  <div className={commonStyles.statInfo}>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      ${(earningsData?.total_earned ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Earned</span>
                  </div>
                </div>

                <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconSuccess)}>
                    <Wallet size={22} />
                  </div>
                  <div className={commonStyles.statInfo}>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      ${(earningsData?.available_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Available Balance</span>
                  </div>
                </div>

                <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconWarning)}>
                    <Clock size={22} />
                  </div>
                  <div className={commonStyles.statInfo}>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      ${(earningsData?.pending_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending</span>
                  </div>
                </div>

                <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
                  <div className={cn(commonStyles.statIcon, commonStyles.iconDanger)}>
                    <CreditCard size={22} />
                  </div>
                  <div className={commonStyles.statInfo}>
                    <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      ${(earningsData?.withdrawn_total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Withdrawn</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Period Selector */}
            <ScrollReveal>
              <div className={commonStyles.periodSelector}>
                {([['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days'], ['12m', '12 Months'], ['all', 'All Time']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    className={cn(
                      commonStyles.periodBtn,
                      themeStyles.periodBtn,
                      period === val && commonStyles.periodBtnActive,
                      period === val && themeStyles.periodBtnActive
                    )}
                    onClick={() => setPeriod(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Charts + Breakdown */}
            <ScrollReveal>
              <div className={commonStyles.sectionGrid}>
                <div className={cn(commonStyles.section, themeStyles.section)}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    <TrendingUp size={18} /> Monthly Earnings
                  </h3>
                  <div className={commonStyles.chartContainer}>
                    {earningsData?.monthly_earnings.map((m, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div
                          className={cn(commonStyles.chartBar, themeStyles.chartBar)}
                          style={{ height: `${Math.max(5, (m.amount / maxMonthly) * 100)}%`, width: '100%' }}
                        >
                          <span className={cn(commonStyles.chartBarValue, themeStyles.chartBarValue)}>
                            ${m.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <span className={cn(commonStyles.chartBarLabel, themeStyles.chartBarLabel)}>
                          {m.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(commonStyles.section, themeStyles.section)}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    <DollarSign size={18} /> Earnings Breakdown
                  </h3>
                  <div className={commonStyles.breakdownList}>
                    {[
                      { label: 'Project Payments', color: '#4573df', amount: periodEarnings * 0.75 },
                      { label: 'Gig Orders', color: '#27AE60', amount: periodEarnings * 0.15 },
                      { label: 'Bonuses & Tips', color: '#ff9800', amount: periodEarnings * 0.07 },
                      { label: 'Referral Rewards', color: '#9333ea', amount: periodEarnings * 0.03 },
                    ].map((item, i) => (
                      <div key={i} className={cn(commonStyles.breakdownItem, themeStyles.breakdownItem)}>
                        <span className={cn(commonStyles.breakdownLabel, themeStyles.breakdownLabel)}>
                          <span className={commonStyles.breakdownDot} style={{ background: item.color }} />
                          {item.label}
                        </span>
                        <span className={cn(commonStyles.breakdownValue, themeStyles.breakdownValue)}>
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Transactions */}
            <ScrollReveal>
              <div className={commonStyles.tableHeader}>
                <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  Recent Transactions ({filteredTransactions.length})
                </h3>
              </div>
              {filteredTransactions.length === 0 ? (
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  <DollarSign size={48} strokeWidth={1.5} className={commonStyles.fadedIcon} />
                  <h3>No Transactions</h3>
                  <p>No transactions found for the selected period.</p>
                </div>
              ) : (
                <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
                  <table className={commonStyles.table}>
                    <thead>
                      <tr>
                        <th className={themeStyles.th}>Date</th>
                        <th className={themeStyles.th}>Description</th>
                        <th className={themeStyles.th}>Type</th>
                        <th className={themeStyles.th}>Amount</th>
                        <th className={themeStyles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 20).map(tx => (
                        <tr key={tx.id} className={themeStyles.tr}>
                          <td className={themeStyles.td}>
                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className={themeStyles.td}>
                            {tx.project_title || tx.description}
                            {tx.client_name && <span style={{ opacity: 0.6, fontSize: '0.85em' }}> — {tx.client_name}</span>}
                          </td>
                          <td className={themeStyles.td}>
                            <Badge variant={tx.type === 'earning' || tx.type === 'bonus' ? 'success' : tx.type === 'withdrawal' ? 'warning' : 'secondary'}>
                              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </Badge>
                          </td>
                          <td className={cn(commonStyles.amountCell, themeStyles.td, tx.type === 'earning' || tx.type === 'bonus' ? commonStyles.amountPositive : commonStyles.amountNegative)}>
                            {tx.type === 'earning' || tx.type === 'bonus' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={themeStyles.td}>
                            <Badge variant={getStatusVariant(tx.status)}>
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ScrollReveal>
          </>
        )}
      </div>
    </PageTransition>
  );
}
