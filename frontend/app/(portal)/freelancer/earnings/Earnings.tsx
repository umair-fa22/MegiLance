// @AI-HINT: Enterprise freelancer earnings — analytics, tax estimation, goals, projections, payment schedule, data-driven breakdown
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Select from '@/app/components/molecules/Select/Select';
import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import Input from '@/app/components/atoms/Input/Input';
import { portalApi, walletApi } from '@/lib/api';
import commonStyles from './Earnings.common.module.css';
import lightStyles from './Earnings.light.module.css';
import darkStyles from './Earnings.dark.module.css';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Clock,
  Download, BarChart3, PieChart, Target, AlertTriangle,
  CheckCircle, ArrowUpRight, ArrowDownLeft, Calendar,
  CreditCard, Shield, Zap, Star, FileText, Calculator,
  ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw
} from 'lucide-react';

type TabKey = 'overview' | 'transactions' | 'goals' | 'tax';

interface EarningTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'refund' | 'fee';
  status: 'completed' | 'pending' | 'processing' | 'failed';
  project?: string;
  client?: string;
}

export default function Earnings() {
  const { resolvedTheme } = useTheme();

  // Data state
  const [earningsData, setEarningsData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [period, setPeriod] = useState('30d');
  const [showBalance, setShowBalance] = useState(true);

  // Transaction filters
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('all');
  const [txStatus, setTxStatus] = useState('all');
  const [txSort, setTxSort] = useState('date');
  const [txSortDir, setTxSortDir] = useState<'asc' | 'desc'>('desc');
  const [txPage, setTxPage] = useState(1);
  const txPerPage = 15;

  // Goals
  const [monthlyGoal, setMonthlyGoal] = useState(5000);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [yearlyGoal, setYearlyGoal] = useState(60000);

  // Tax
  const [taxRate, setTaxRate] = useState(25);

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          portalApi.freelancer.getEarnings(),
          portalApi.freelancer.getWallet(),
          walletApi.getTransactions(1, 100),
        ]);
        if (results[0].status === 'fulfilled') setEarningsData(results[0].value);
        if (results[1].status === 'fulfilled') setWalletData(results[1].value);
        if (results[2].status === 'fulfilled') {
          const res = results[2].value as any;
          const items = res?.data?.items || res?.items || [];
          setTransactions(items.map((t: any, i: number) => ({
            id: String(t.id ?? i),
            description: t.description || t.title || 'Transaction',
            amount: parseFloat(t.amount?.toString().replace(/[$,]/g, '') || '0'),
            date: t.created_at || t.date || '',
            type: t.type || 'earning',
            status: t.status || 'completed',
            project: t.project_title || t.project || '',
            client: t.client_name || t.client || '',
          })));
        }
      } catch {
        setError('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const t = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Stats
  const stats = useMemo(() => {
    const totalEarned = transactions
      .filter(tx => tx.type === 'earning' && (tx.status === 'completed'))
      .reduce((s, tx) => s + tx.amount, 0);
    const totalWithdrawn = transactions
      .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
      .reduce((s, tx) => s + tx.amount, 0);
    const pending = transactions
      .filter(tx => tx.status === 'pending' || tx.status === 'processing')
      .reduce((s, tx) => s + tx.amount, 0);
    const available = (walletData?.balance ?? earningsData?.available_balance ?? totalEarned - totalWithdrawn);
    const fees = transactions
      .filter(tx => tx.type === 'fee')
      .reduce((s, tx) => s + tx.amount, 0);

    return { totalEarned, totalWithdrawn, pending, available: Math.max(available, 0), fees };
  }, [transactions, walletData, earningsData]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; earnings: number; withdrawals: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en', { month: 'short' });
      const earnings = transactions
        .filter(tx => {
          const td = new Date(tx.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
            && tx.type === 'earning' && tx.status === 'completed';
        })
        .reduce((s, tx) => s + tx.amount, 0);
      const withdrawals = transactions
        .filter(tx => {
          const td = new Date(tx.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
            && tx.type === 'withdrawal' && tx.status === 'completed';
        })
        .reduce((s, tx) => s + tx.amount, 0);
      months.push({ label, earnings, withdrawals });
    }
    return months;
  }, [transactions]);

  const maxMonthly = Math.max(...monthlyTrend.map(m => Math.max(m.earnings, m.withdrawals)), 1);

  // Income sources breakdown (data-driven)
  const sourceBreakdown = useMemo(() => {
    const sources: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === 'earning' && tx.status === 'completed') {
        const src = tx.project || 'Direct Payment';
        sources[src] = (sources[src] || 0) + tx.amount;
      }
    });
    const total = Object.values(sources).reduce((s, v) => s + v, 0) || 1;
    const colors = ['#4573df', '#27AE60', '#ff9800', '#9b59b6', '#e81123', '#1abc9c'];
    return Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount], i) => ({
        name: name.length > 30 ? name.slice(0, 27) + '...' : name,
        amount,
        percent: Math.round((amount / total) * 100),
        color: colors[i % colors.length]
      }));
  }, [transactions]);

  // Month over month
  const momChange = useMemo(() => {
    if (monthlyTrend.length < 2) return 0;
    const curr = monthlyTrend[monthlyTrend.length - 1].earnings;
    const prev = monthlyTrend[monthlyTrend.length - 2].earnings;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [monthlyTrend]);

  // This month's earnings for goal
  const thisMonthEarnings = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1].earnings : 0;
  const goalProgress = monthlyGoal > 0 ? Math.min(Math.round((thisMonthEarnings / monthlyGoal) * 100), 100) : 0;

  // Projected yearly
  const avgMonthly = monthlyTrend.length > 0
    ? monthlyTrend.reduce((s, m) => s + m.earnings, 0) / monthlyTrend.length : 0;
  const projectedYearly = avgMonthly * 12;

  // Filtered transactions
  const filteredTx = useMemo(() => {
    let result = [...transactions];
    if (txSearch) {
      const q = txSearch.toLowerCase();
      result = result.filter(tx =>
        tx.description.toLowerCase().includes(q) ||
        (tx.project || '').toLowerCase().includes(q) ||
        (tx.client || '').toLowerCase().includes(q)
      );
    }
    if (txType !== 'all') result = result.filter(tx => tx.type === txType);
    if (txStatus !== 'all') result = result.filter(tx => tx.status === txStatus);
    result.sort((a, b) => {
      let cmp = 0;
      if (txSort === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (txSort === 'amount') cmp = a.amount - b.amount;
      else if (txSort === 'description') cmp = a.description.localeCompare(b.description);
      return txSortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [transactions, txSearch, txType, txStatus, txSort, txSortDir]);

  const txTotalPages = Math.ceil(filteredTx.length / txPerPage);
  const txPaginated = filteredTx.slice((txPage - 1) * txPerPage, txPage * txPerPage);

  const handleTxSort = useCallback((key: string) => {
    if (txSort === key) setTxSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setTxSort(key); setTxSortDir('desc'); }
  }, [txSort]);

  // Tax estimate
  const estimatedTax = (stats.totalEarned * taxRate) / 100;
  const quarterlyTax = estimatedTax / 4;

  const exportCSV = () => {
    const header = 'Date,Description,Amount,Type,Status,Project,Client\n';
    const rows = filteredTx.map(tx =>
      `${tx.date},"${tx.description}",${tx.amount},${tx.type},${tx.status},"${tx.project || ''}","${tx.client || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'earning') return <ArrowDownLeft size={14} />;
    if (type === 'withdrawal') return <ArrowUpRight size={14} />;
    if (type === 'fee') return <CreditCard size={14} />;
    if (type === 'bonus') return <Star size={14} />;
    return <DollarSign size={14} />;
  };

  const getStatusVariant = (s: string): 'success' | 'warning' | 'danger' | 'secondary' => {
    if (s === 'completed') return 'success';
    if (s === 'pending' || s === 'processing') return 'warning';
    return 'danger';
  };

  // Loading
  if (loading) {
    return (
      <PageTransition>
        <div className={cn(commonStyles.container, t.container)}>
          <Skeleton width="280px" height="32px" />
          <div className={commonStyles.statsGrid}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} width="100%" height="110px" radius="12px" />
            ))}
          </div>
          <Skeleton width="100%" height="300px" radius="12px" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className={cn(commonStyles.container, t.container)}>
          <div className={cn(commonStyles.errorBanner, t.errorBanner)}>
            <AlertTriangle size={20} /> <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'transactions', label: 'Transactions', icon: <Clock size={16} /> },
    { key: 'goals', label: 'Goals', icon: <Target size={16} /> },
    { key: 'tax', label: 'Tax Center', icon: <Calculator size={16} /> },
  ];

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, t.container)}>
        {/* Header */}
        <div className={cn(commonStyles.header, t.header)}>
          <div className={commonStyles.headerContent}>
            <h1 className={cn(commonStyles.title, t.title)}>
              <DollarSign size={28} /> Earnings Dashboard
            </h1>
            <p className={cn(commonStyles.subtitle, t.subtitle)}>
              Track income, manage withdrawals, and plan your finances
            </p>
          </div>
          <div className={commonStyles.headerActions}>
            <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download size={16} /> Export
            </Button>
            <Button variant="primary" size="sm">
              <Wallet size={16} /> Withdraw
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <ScrollReveal>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, t.statCard, commonStyles.statHighlight)}>
              <div className={commonStyles.statIcon}><DollarSign size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Total Earned</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${stats.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statTrend, momChange >= 0 ? commonStyles.trendUp : commonStyles.trendDown)}>
                  {momChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(momChange)}% vs last month
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconAvailable)}><Wallet size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Available</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${stats.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statMeta, t.statMeta)}>Ready to withdraw</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconPending)}><Clock size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Pending</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statMeta, t.statMeta)}>
                  {transactions.filter(tx => tx.status === 'pending').length} transactions
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconWithdrawn)}><ArrowUpRight size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Withdrawn</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${stats.totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statMeta, t.statMeta)}>Platform fees: ${stats.fees.toLocaleString()}</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconGoal)}><Target size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Monthly Goal</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>{goalProgress}%</span>
                <div className={cn(commonStyles.miniProgress, t.miniProgress)}>
                  <div className={commonStyles.miniProgressFill} style={{ width: `${goalProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Tab Navigation */}
        <div className={cn(commonStyles.tabBar, t.tabBar)}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={cn(commonStyles.tabBtn, t.tabBtn,
                activeTab === tab.key && cn(commonStyles.tabBtnActive, t.tabBtnActive))}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === 'overview' && (
          <StaggerContainer staggerDelay={0.08}>
            <div className={commonStyles.overviewGrid}>
              {/* Earnings Chart */}
              <div className={cn(commonStyles.chartSection, t.chartSection)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <BarChart3 size={18} /> Monthly Earnings & Withdrawals
                </h3>
                <div className={commonStyles.chartLegend}>
                  <span className={commonStyles.legendItem}>
                    <span className={cn(commonStyles.legendDot, commonStyles.legendEarning)} /> Earnings
                  </span>
                  <span className={commonStyles.legendItem}>
                    <span className={cn(commonStyles.legendDot, commonStyles.legendWithdrawal)} /> Withdrawals
                  </span>
                </div>
                <div className={commonStyles.chartContainer}>
                  <div className={commonStyles.chartBars}>
                    {monthlyTrend.map((m, i) => (
                      <div key={i} className={commonStyles.chartCol}>
                        <div className={commonStyles.chartColBars}>
                          <div className={commonStyles.barGroup}>
                            <span className={cn(commonStyles.chartAmount, t.chartAmount)}>
                              ${m.earnings >= 1000 ? `${(m.earnings / 1000).toFixed(1)}k` : m.earnings.toFixed(0)}
                            </span>
                            <div
                              className={cn(commonStyles.chartBar, commonStyles.earningBar)}
                              style={{ height: `${Math.max((m.earnings / maxMonthly) * 140, 4)}px` }}
                            />
                          </div>
                          <div className={commonStyles.barGroup}>
                            <div
                              className={cn(commonStyles.chartBar, commonStyles.withdrawalBar)}
                              style={{ height: `${Math.max((m.withdrawals / maxMonthly) * 140, 4)}px` }}
                            />
                          </div>
                        </div>
                        <span className={cn(commonStyles.chartLabel, t.chartLabel)}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Income Sources */}
              <div className={cn(commonStyles.chartSection, t.chartSection)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <PieChart size={18} /> Income Sources
                </h3>
                {sourceBreakdown.length > 0 ? (
                  <div className={commonStyles.sourceList}>
                    {sourceBreakdown.map((src, i) => (
                      <div key={i} className={cn(commonStyles.sourceItem, t.sourceItem)}>
                        <div className={commonStyles.sourceHeader}>
                          <span className={commonStyles.sourceDot} style={{ background: src.color }} />
                          <span className={cn(commonStyles.sourceName, t.sourceName)}>{src.name}</span>
                          <span className={cn(commonStyles.sourcePercent, t.sourcePercent)}>{src.percent}%</span>
                        </div>
                        <div className={cn(commonStyles.sourceBar, t.sourceBar)}>
                          <div className={commonStyles.sourceFill} style={{ width: `${src.percent}%`, background: src.color }} />
                        </div>
                        <span className={cn(commonStyles.sourceAmount, t.sourceAmount)}>
                          ${src.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn(commonStyles.emptyText, t.emptyText)}>No earnings yet. Your earnings will appear here once a client releases a milestone payment.</p>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={cn(commonStyles.recentSection, t.recentSection)}>
              <div className={commonStyles.recentHeader}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <Clock size={18} /> Recent Activity
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>View All</Button>
              </div>
              <div className={commonStyles.txList}>
                {transactions.slice(0, 5).map((tx, i) => (
                  <div key={tx.id} className={cn(commonStyles.txRow, t.txRow)}>
                    <div className={cn(commonStyles.txIcon, t.txIcon)}>{getTypeIcon(tx.type)}</div>
                    <div className={commonStyles.txInfo}>
                      <span className={cn(commonStyles.txDesc, t.txDesc)}>{tx.description}</span>
                      <span className={cn(commonStyles.txDate, t.txDate)}>
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {tx.client && ` · ${tx.client}`}
                      </span>
                    </div>
                    <div className={commonStyles.txRight}>
                      <span className={cn(commonStyles.txAmount, t.txAmount,
                        tx.type === 'earning' || tx.type === 'bonus' ? commonStyles.amountPositive : commonStyles.amountNegative)}>
                        {tx.type === 'earning' || tx.type === 'bonus' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className={cn(commonStyles.emptyText, t.emptyText)}>No transactions yet. Payments, withdrawals, and fees will appear here.</p>
                )}
              </div>
            </div>
          </StaggerContainer>
        )}

        {/* ===== TRANSACTIONS TAB ===== */}
        {activeTab === 'transactions' && (
          <ScrollReveal>
            <div className={cn(commonStyles.txPanel, t.txPanel)}>
              <div className={commonStyles.txToolbar}>
                <div className={commonStyles.txSearchRow}>
                  <div className={commonStyles.searchWrap}>
                    <Input
                      placeholder="Search transactions..."
                      value={txSearch}
                      onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                    />
                  </div>
                  <Select
                    value={txType}
                    onChange={(e) => { setTxType(e.target.value); setTxPage(1); }}
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'earning', label: 'Earnings' },
                      { value: 'withdrawal', label: 'Withdrawals' },
                      { value: 'bonus', label: 'Bonuses' },
                      { value: 'fee', label: 'Fees' },
                    ]}
                  />
                  <Select
                    value={txStatus}
                    onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'processing', label: 'Processing' },
                    ]}
                  />
                </div>
              </div>

              {/* Sort Header */}
              <div className={cn(commonStyles.sortHeader, t.sortHeader)}>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount' },
                ].map(col => (
                  <button
                    key={col.key}
                    className={cn(commonStyles.sortCol, t.sortCol,
                      txSort === col.key && cn(commonStyles.sortColActive, t.sortColActive))}
                    onClick={() => handleTxSort(col.key)}
                  >
                    {col.label}
                    {txSort === col.key && (txSortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                  </button>
                ))}
                <span className={cn(commonStyles.sortCol, t.sortCol)}>Status</span>
              </div>

              {/* Transaction Rows */}
              <div className={commonStyles.txList}>
                {txPaginated.map(tx => (
                  <div key={tx.id} className={cn(commonStyles.txRow, t.txRow)}>
                    <div className={cn(commonStyles.txIcon, t.txIcon)}>{getTypeIcon(tx.type)}</div>
                    <div className={commonStyles.txInfo}>
                      <span className={cn(commonStyles.txDesc, t.txDesc)}>{tx.description}</span>
                      <span className={cn(commonStyles.txDate, t.txDate)}>
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                        {tx.project && ` · ${tx.project}`}
                      </span>
                    </div>
                    <div className={commonStyles.txRight}>
                      <span className={cn(commonStyles.txAmount, t.txAmount,
                        tx.type === 'earning' || tx.type === 'bonus' ? commonStyles.amountPositive : commonStyles.amountNegative)}>
                        {tx.type === 'earning' || tx.type === 'bonus' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </div>
                  </div>
                ))}
                {filteredTx.length === 0 && (
                  <p className={cn(commonStyles.emptyText, t.emptyText)}>No transactions match your filters. Try changing the date range or transaction type.</p>
                )}
              </div>

              {/* Pagination */}
              {txTotalPages > 1 && (
                <div className={commonStyles.pagination}>
                  <span className={cn(commonStyles.pageInfo, t.pageInfo)}>
                    {(txPage - 1) * txPerPage + 1}–{Math.min(txPage * txPerPage, filteredTx.length)} of {filteredTx.length}
                  </span>
                  <div className={commonStyles.pageNumbers}>
                    <Button variant="ghost" size="sm" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>Prev</Button>
                    {Array.from({ length: Math.min(txTotalPages, 7) }, (_, i) => {
                      let n: number;
                      if (txTotalPages <= 7) n = i + 1;
                      else if (txPage <= 4) n = i + 1;
                      else if (txPage >= txTotalPages - 3) n = txTotalPages - 6 + i;
                      else n = txPage - 3 + i;
                      return (
                        <button
                          key={n}
                          className={cn(commonStyles.pageNum, t.pageNum,
                            txPage === n && cn(commonStyles.pageNumActive, t.pageNumActive))}
                          onClick={() => setTxPage(n)}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <Button variant="ghost" size="sm" disabled={txPage >= txTotalPages} onClick={() => setTxPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* ===== GOALS TAB ===== */}
        {activeTab === 'goals' && (
          <StaggerContainer staggerDelay={0.08}>
            <div className={commonStyles.goalsPanel}>
              {/* Monthly Goal */}
              <div className={cn(commonStyles.goalCard, t.goalCard)}>
                <div className={commonStyles.goalHeader}>
                  <div>
                    <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                      <Target size={18} /> Monthly Earnings Goal
                    </h3>
                    <p className={cn(commonStyles.goalDesc, t.goalDesc)}>
                      Track your progress toward your monthly income target
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowGoalEdit(!showGoalEdit)}>
                    {showGoalEdit ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                {showGoalEdit && (
                  <div className={commonStyles.goalEditRow}>
                    <Input
                      label="Monthly Goal ($)"
                      type="number"
                      value={String(monthlyGoal)}
                      onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                    />
                    <Input
                      label="Yearly Goal ($)"
                      type="number"
                      value={String(yearlyGoal)}
                      onChange={(e) => setYearlyGoal(Number(e.target.value))}
                    />
                    <Button variant="primary" size="sm" onClick={() => setShowGoalEdit(false)}>Save</Button>
                  </div>
                )}
                <div className={commonStyles.goalProgress}>
                  <div className={commonStyles.goalNumbers}>
                    <span className={cn(commonStyles.goalCurrent, t.goalCurrent)}>
                      ${thisMonthEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(commonStyles.goalTarget, t.goalTarget)}>
                      / ${monthlyGoal.toLocaleString()}
                    </span>
                  </div>
                  <div className={cn(commonStyles.goalBar, t.goalBar)}>
                    <div
                      className={cn(commonStyles.goalFill,
                        goalProgress >= 100 ? commonStyles.goalComplete :
                        goalProgress >= 70 ? commonStyles.goalGood : commonStyles.goalLow)}
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                  <div className={commonStyles.goalMeta}>
                    <span className={cn(commonStyles.goalRemaining, t.goalRemaining)}>
                      ${Math.max(monthlyGoal - thisMonthEarnings, 0).toLocaleString()} remaining
                    </span>
                    <span className={cn(commonStyles.goalPercent, t.goalPercent)}>
                      {goalProgress}% achieved
                    </span>
                  </div>
                </div>
              </div>

              {/* Projection Card */}
              <div className={cn(commonStyles.goalCard, t.goalCard)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <TrendingUp size={18} /> Income Projections
                </h3>
                <div className={commonStyles.projectionGrid}>
                  <div className={cn(commonStyles.projectionItem, t.projectionItem)}>
                    <span className={cn(commonStyles.projLabel, t.projLabel)}>Avg Monthly</span>
                    <span className={cn(commonStyles.projValue, t.projValue)}>
                      ${avgMonthly.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.projectionItem, t.projectionItem)}>
                    <span className={cn(commonStyles.projLabel, t.projLabel)}>Projected Yearly</span>
                    <span className={cn(commonStyles.projValue, t.projValue)}>
                      ${projectedYearly.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.projectionItem, t.projectionItem)}>
                    <span className={cn(commonStyles.projLabel, t.projLabel)}>Yearly Goal</span>
                    <span className={cn(commonStyles.projValue, t.projValue)}>
                      ${yearlyGoal.toLocaleString()}
                    </span>
                  </div>
                  <div className={cn(commonStyles.projectionItem, t.projectionItem)}>
                    <span className={cn(commonStyles.projLabel, t.projLabel)}>On Track?</span>
                    <span className={cn(commonStyles.projValue, t.projValue)}>
                      {projectedYearly >= yearlyGoal ? (
                        <><CheckCircle size={16} className={commonStyles.onTrack} /> Yes</>
                      ) : (
                        <><AlertTriangle size={16} className={commonStyles.offTrack} /> Behind</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </StaggerContainer>
        )}

        {/* ===== TAX TAB ===== */}
        {activeTab === 'tax' && (
          <ScrollReveal>
            <div className={commonStyles.taxPanel}>
              <div className={cn(commonStyles.taxCard, t.taxCard)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <Calculator size={18} /> Tax Estimation
                </h3>
                <p className={cn(commonStyles.taxDisclaimer, t.taxDisclaimer)}>
                  This is an estimate only. Consult a tax professional for accurate advice.
                </p>

                <div className={commonStyles.taxRateRow}>
                  <label className={cn(commonStyles.taxLabel, t.taxLabel)}>Estimated Tax Rate</label>
                  <div className={commonStyles.taxRateInput}>
                    <Input
                      type="number"
                      value={String(taxRate)}
                      onChange={(e) => setTaxRate(Math.min(Math.max(Number(e.target.value), 0), 100))}
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className={commonStyles.taxGrid}>
                  <div className={cn(commonStyles.taxItem, t.taxItem)}>
                    <span className={cn(commonStyles.taxItemLabel, t.taxItemLabel)}>Total Income</span>
                    <span className={cn(commonStyles.taxItemValue, t.taxItemValue)}>
                      ${stats.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.taxItem, t.taxItem)}>
                    <span className={cn(commonStyles.taxItemLabel, t.taxItemLabel)}>Platform Fees</span>
                    <span className={cn(commonStyles.taxItemValue, t.taxItemValue)}>
                      -${stats.fees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.taxItem, t.taxItem)}>
                    <span className={cn(commonStyles.taxItemLabel, t.taxItemLabel)}>Taxable Income</span>
                    <span className={cn(commonStyles.taxItemValue, t.taxItemValue)}>
                      ${(stats.totalEarned - stats.fees).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.taxItem, t.taxItem, commonStyles.taxItemHighlight)}>
                    <span className={cn(commonStyles.taxItemLabel, t.taxItemLabel)}>Estimated Tax</span>
                    <span className={cn(commonStyles.taxItemValue, t.taxItemValue)}>
                      ${estimatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.taxItem, t.taxItem)}>
                    <span className={cn(commonStyles.taxItemLabel, t.taxItemLabel)}>Quarterly Payment</span>
                    <span className={cn(commonStyles.taxItemValue, t.taxItemValue)}>
                      ${quarterlyTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={cn(commonStyles.taxItem, t.taxItem)}>
                    <span className={cn(commonStyles.taxItemLabel, t.taxItemLabel)}>After-Tax Income</span>
                    <span className={cn(commonStyles.taxItemValue, t.taxItemValue)}>
                      ${(stats.totalEarned - stats.fees - estimatedTax).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tax Documents */}
              <div className={cn(commonStyles.taxCard, t.taxCard)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <FileText size={18} /> Tax Documents
                </h3>
                <div className={commonStyles.docList}>
                  <div className={cn(commonStyles.docItem, t.docItem)}>
                    <FileText size={20} />
                    <div className={commonStyles.docInfo}>
                      <span className={cn(commonStyles.docName, t.docName)}>Annual Earnings Summary</span>
                      <span className={cn(commonStyles.docMeta, t.docMeta)}>Year-to-date earnings report</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                      <Download size={14} /> Download
                    </Button>
                  </div>
                  <div className={cn(commonStyles.docItem, t.docItem)}>
                    <FileText size={20} />
                    <div className={commonStyles.docInfo}>
                      <span className={cn(commonStyles.docName, t.docName)}>Transaction History</span>
                      <span className={cn(commonStyles.docMeta, t.docMeta)}>Complete transaction log</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                      <Download size={14} /> Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
}
