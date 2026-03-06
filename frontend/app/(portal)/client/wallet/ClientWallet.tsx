// @AI-HINT: Enterprise client wallet — spending analytics, budget tracking, payment methods, deposit flow, monthly trends
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import commonStyles from './ClientWallet.common.module.css';
import lightStyles from './ClientWallet.light.module.css';
import darkStyles from './ClientWallet.dark.module.css';
import {
  DollarSign, ArrowUpRight, CheckCircle, Download, Search,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, CreditCard,
  PiggyBank, Target, Plus, Wallet, BarChart3, PieChart,
  Calendar, AlertTriangle, ArrowDownLeft, ArrowUpLeft,
  Shield, Clock, Filter, Eye, EyeOff
} from 'lucide-react';

type TabKey = 'overview' | 'transactions' | 'budget' | 'methods';

interface WalletPayment {
  id: string;
  description: string;
  amount: string;
  date: string;
  status: string;
  type?: string;
  category?: string;
}

interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  color: string;
  icon: string;
}

export default function ClientWallet() {
  const { resolvedTheme } = useTheme();
  const { payments: rawPayments, loading, error } = useClientData();
  const payments = rawPayments ?? [];

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Transactions state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Budget state
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);

  // Deposit state
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Balance visibility
  const [showBalance, setShowBalance] = useState(true);

  if (!resolvedTheme) return null;
  const t = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Parse amounts
  const parseAmount = (p: WalletPayment) =>
    parseFloat(p.amount?.replace(/[$,]/g, '') || '0');

  // Wallet stats
  const walletStats = useMemo(() => {
    const totalSpent = payments.reduce((sum: number, p: WalletPayment) => {
      const a = parseAmount(p);
      return p.status === 'completed' || p.status === 'paid' ? sum + a : sum;
    }, 0);
    const pending = payments.reduce((sum: number, p: WalletPayment) => {
      const a = parseAmount(p);
      return p.status === 'pending' || p.status === 'processing' ? sum + a : sum;
    }, 0);
    const completed = payments.filter(
      (p: WalletPayment) => p.status === 'completed' || p.status === 'paid'
    ).length;
    const totalCount = payments.length;
    const avgTransaction = totalCount > 0 ? totalSpent / (completed || 1) : 0;
    const largestPayment = payments.reduce((max: number, p: WalletPayment) => {
      const a = parseAmount(p);
      return a > max ? a : max;
    }, 0);

    return { totalSpent, pending, completed, totalCount, avgTransaction, largestPayment };
  }, [payments]);

  // Monthly spending trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en', { month: 'short' });
      const amount = payments
        .filter((p: WalletPayment) => {
          const pd = new Date(p.date);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
            && (p.status === 'completed' || p.status === 'paid');
        })
        .reduce((s: number, p: WalletPayment) => s + parseAmount(p), 0);
      months.push({ label, amount });
    }
    return months;
  }, [payments]);

  const maxMonthly = Math.max(...monthlyTrend.map(m => m.amount), 1);

  // Spending by category
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    payments.forEach((p: WalletPayment) => {
      if (p.status === 'completed' || p.status === 'paid') {
        const cat = p.category || 'General';
        cats[cat] = (cats[cat] || 0) + parseAmount(p);
      }
    });
    const total = Object.values(cats).reduce((s, v) => s + v, 0) || 1;
    const colors = ['#4573df', '#27AE60', '#ff9800', '#e81123', '#9b59b6', '#1abc9c'];
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], i) => ({
        name,
        amount,
        percent: Math.round((amount / total) * 100),
        color: colors[i % colors.length]
      }));
  }, [payments]);

  // Budget categories
  const budgetCategories: BudgetCategory[] = useMemo(() => [
    { name: 'Development', budget: monthlyBudget * 0.4, spent: walletStats.totalSpent * 0.4, color: '#4573df', icon: '💻' },
    { name: 'Design', budget: monthlyBudget * 0.25, spent: walletStats.totalSpent * 0.25, color: '#9b59b6', icon: '🎨' },
    { name: 'Marketing', budget: monthlyBudget * 0.2, spent: walletStats.totalSpent * 0.2, color: '#27AE60', icon: '📈' },
    { name: 'Other', budget: monthlyBudget * 0.15, spent: walletStats.totalSpent * 0.15, color: '#ff9800', icon: '📦' },
  ], [monthlyBudget, walletStats.totalSpent]);

  // Filtered + sorted transactions
  const filtered = useMemo(() => {
    let result = [...payments] as WalletPayment[];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.description?.toLowerCase().includes(q) || p.amount?.includes(q)
      );
    }
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (filterType !== 'all') {
      result = result.filter((p) => (p.type || 'payment') === filterType);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'amount') cmp = parseAmount(a) - parseAmount(b);
      else if (sortBy === 'description') cmp = (a.description || '').localeCompare(b.description || '');
      else if (sortBy === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [payments, search, sortBy, sortDir, filterStatus, filterType]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = useCallback((key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  }, [sortBy]);

  const exportCSV = () => {
    const header = 'Date,Description,Amount,Status,Type\n';
    const rows = filtered.map(p =>
      `${p.date},"${p.description}",${p.amount},${p.status},${p.type || 'payment'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const budgetUsedPercent = monthlyBudget > 0
    ? Math.min(Math.round((walletStats.totalSpent / monthlyBudget) * 100), 100) : 0;

  const monthOverMonth = useMemo(() => {
    if (monthlyTrend.length < 2) return 0;
    const curr = monthlyTrend[monthlyTrend.length - 1].amount;
    const prev = monthlyTrend[monthlyTrend.length - 2].amount;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [monthlyTrend]);

  // Skeleton
  if (loading) {
    return (
      <PageTransition>
        <div className={cn(commonStyles.container, t.container)}>
          <div className={commonStyles.header}>
            <Skeleton width="250px" height="32px" />
            <Skeleton width="160px" height="20px" />
          </div>
          <div className={commonStyles.statsGrid}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} width="100%" height="120px" radius="12px" />
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
            <AlertTriangle size={20} />
            <span>Failed to load wallet data. Please try again.</span>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'transactions', label: 'Transactions', icon: <Clock size={16} /> },
    { key: 'budget', label: 'Budget', icon: <Target size={16} /> },
    { key: 'methods', label: 'Payment Methods', icon: <CreditCard size={16} /> },
  ];

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, t.container)}>
        {/* Header */}
        <div className={cn(commonStyles.header, t.header)}>
          <div className={commonStyles.headerContent}>
            <h1 className={cn(commonStyles.title, t.title)}>
              <Wallet size={28} /> Wallet & Finances
            </h1>
            <p className={cn(commonStyles.subtitle, t.subtitle)}>
              Track spending, manage budgets, and monitor financial health
            </p>
          </div>
          <div className={commonStyles.headerActions}>
            <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              {showBalance ? 'Hide' : 'Show'} Balances
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowDeposit(true)}>
              <Plus size={16} /> Add Funds
            </Button>
          </div>
        </div>

        {/* Deposit Modal */}
        {showDeposit && (
          <ScrollReveal>
            <div className={cn(commonStyles.depositPanel, t.depositPanel)}>
              <h3 className={cn(commonStyles.depositTitle, t.depositTitle)}>Add Funds to Wallet</h3>
              <div className={commonStyles.depositQuick}>
                {[50, 100, 250, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    className={cn(commonStyles.quickAmount, t.quickAmount,
                      depositAmount === String(amt) && commonStyles.quickAmountActive)}
                    onClick={() => setDepositAmount(String(amt))}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <div className={commonStyles.depositInput}>
                <Input
                  label="Custom Amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount..."
                />
              </div>
              <div className={commonStyles.depositActions}>
                <Button variant="ghost" size="sm" onClick={() => { setShowDeposit(false); setDepositAmount(''); }}>Cancel</Button>
                <Button variant="primary" size="sm" disabled={!depositAmount || parseFloat(depositAmount) <= 0}>
                  <Shield size={16} /> Deposit ${depositAmount || '0'}
                </Button>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Stats Cards */}
        <ScrollReveal>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, t.statCard, commonStyles.statHighlight)}>
              <div className={commonStyles.statIcon}><DollarSign size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Total Spent</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${walletStats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statTrend, monthOverMonth >= 0 ? commonStyles.trendUp : commonStyles.trendDown)}>
                  {monthOverMonth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(monthOverMonth)}% vs last month
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconPending)}><ArrowUpRight size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Pending</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${walletStats.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statMeta, t.statMeta)}>
                  {payments.filter((p: WalletPayment) => p.status === 'pending').length} transactions
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconSuccess)}><CheckCircle size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Completed</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>{walletStats.completed}</span>
                <span className={cn(commonStyles.statMeta, t.statMeta)}>
                  of {walletStats.totalCount} total
                </span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, t.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.iconAvg)}><PiggyBank size={22} /></div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, t.statLabel)}>Avg Transaction</span>
                <span className={cn(commonStyles.statValue, t.statValue)}>
                  {showBalance ? `$${walletStats.avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                </span>
                <span className={cn(commonStyles.statMeta, t.statMeta)}>
                  Largest: ${walletStats.largestPayment.toLocaleString()}
                </span>
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
              {/* Spending Trend Chart */}
              <div className={cn(commonStyles.chartSection, t.chartSection)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <TrendingUp size={18} /> Monthly Spending Trend
                </h3>
                <div className={commonStyles.chartContainer}>
                  <div className={commonStyles.chartBars}>
                    {monthlyTrend.map((m, i) => (
                      <div key={i} className={commonStyles.chartCol}>
                        <span className={cn(commonStyles.chartAmount, t.chartAmount)}>
                          ${m.amount >= 1000 ? `${(m.amount / 1000).toFixed(1)}k` : m.amount.toFixed(0)}
                        </span>
                        <div
                          className={cn(commonStyles.chartBar, t.chartBar)}
                          style={{ height: `${Math.max((m.amount / maxMonthly) * 160, 4)}px` }}
                        />
                        <span className={cn(commonStyles.chartLabel, t.chartLabel)}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className={cn(commonStyles.chartSection, t.chartSection)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <PieChart size={18} /> Spending by Category
                </h3>
                {categoryBreakdown.length > 0 ? (
                  <div className={commonStyles.categoryList}>
                    {categoryBreakdown.map((cat, i) => (
                      <div key={i} className={cn(commonStyles.categoryItem, t.categoryItem)}>
                        <div className={commonStyles.categoryHeader}>
                          <span className={commonStyles.categoryDot} style={{ background: cat.color }} />
                          <span className={cn(commonStyles.categoryName, t.categoryName)}>{cat.name}</span>
                          <span className={cn(commonStyles.categoryPercent, t.categoryPercent)}>{cat.percent}%</span>
                        </div>
                        <div className={cn(commonStyles.categoryBar, t.categoryBar)}>
                          <div
                            className={commonStyles.categoryFill}
                            style={{ width: `${cat.percent}%`, background: cat.color }}
                          />
                        </div>
                        <span className={cn(commonStyles.categoryAmount, t.categoryAmount)}>
                          ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn(commonStyles.emptyText, t.emptyText)}>No spending data yet</p>
                )}
              </div>
            </div>

            {/* Budget Quick View */}
            <div className={cn(commonStyles.budgetQuickView, t.budgetQuickView)}>
              <div className={commonStyles.budgetHeader}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <Target size={18} /> Monthly Budget
                </h3>
                <span className={cn(commonStyles.budgetAmount, t.budgetAmount)}>
                  ${walletStats.totalSpent.toLocaleString()} / ${monthlyBudget.toLocaleString()}
                </span>
              </div>
              <div className={cn(commonStyles.budgetProgressBar, t.budgetProgressBar)}>
                <div
                  className={cn(commonStyles.budgetProgressFill,
                    budgetUsedPercent > 90 ? commonStyles.budgetDanger :
                    budgetUsedPercent > 70 ? commonStyles.budgetWarning : commonStyles.budgetSafe
                  )}
                  style={{ width: `${budgetUsedPercent}%` }}
                />
              </div>
              <span className={cn(commonStyles.budgetPercent, t.budgetPercent)}>
                {budgetUsedPercent}% used
                {budgetUsedPercent > 90 && <AlertTriangle size={14} className={commonStyles.budgetAlert} />}
              </span>
            </div>

            {/* Recent Transactions Preview */}
            <div className={cn(commonStyles.recentSection, t.recentSection)}>
              <div className={commonStyles.recentHeader}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <Clock size={18} /> Recent Transactions
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>
                  View All
                </Button>
              </div>
              <div className={commonStyles.transactionList}>
                {payments.slice(0, 5).map((p: WalletPayment, i: number) => (
                  <TransactionRow key={p.id || i} date={p.date} description={p.description} amount={p.amount} />
                ))}
                {payments.length === 0 && (
                  <p className={cn(commonStyles.emptyText, t.emptyText)}>No transactions yet</p>
                )}
              </div>
            </div>
          </StaggerContainer>
        )}

        {/* ===== TRANSACTIONS TAB ===== */}
        {activeTab === 'transactions' && (
          <ScrollReveal>
            <div className={cn(commonStyles.transactionsPanel, t.transactionsPanel)}>
              {/* Toolbar */}
              <div className={commonStyles.toolbar}>
                <div className={commonStyles.searchRow}>
                  <div className={commonStyles.searchWrap}>
                    <Search size={16} className={commonStyles.searchIcon} />
                    <Input
                      placeholder="Search transactions..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                  <Select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'processing', label: 'Processing' },
                      { value: 'failed', label: 'Failed' },
                    ]}
                  />
                  <Select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'payment', label: 'Payments' },
                      { value: 'deposit', label: 'Deposits' },
                      { value: 'refund', label: 'Refunds' },
                    ]}
                  />
                </div>
                <div className={commonStyles.toolbarRight}>
                  <Select
                    value={String(perPage)}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                    options={[
                      { value: '10', label: '10 / page' },
                      { value: '20', label: '20 / page' },
                      { value: '50', label: '50 / page' },
                    ]}
                  />
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download size={16} /> Export CSV
                  </Button>
                </div>
              </div>

              {/* Sort Header */}
              <div className={cn(commonStyles.sortHeader, t.sortHeader)}>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'status', label: 'Status' },
                ].map(col => (
                  <button
                    key={col.key}
                    className={cn(commonStyles.sortCol, t.sortCol,
                      sortBy === col.key && cn(commonStyles.sortColActive, t.sortColActive))}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortBy === col.key && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div className={commonStyles.transactionList}>
                {paginated.map((p, i) => (
                  <TransactionRow key={p.id || i} date={p.date} description={p.description} amount={p.amount} />
                ))}
                {filtered.length === 0 && (
                  <p className={cn(commonStyles.emptyText, t.emptyText)}>
                    {search || filterStatus !== 'all' ? 'No matching transactions' : 'No transactions yet'}
                  </p>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={commonStyles.pagination}>
                  <span className={cn(commonStyles.pageInfo, t.pageInfo)}>
                    Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  </span>
                  <div className={commonStyles.pageNumbers}>
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let n: number;
                      if (totalPages <= 7) n = i + 1;
                      else if (page <= 4) n = i + 1;
                      else if (page >= totalPages - 3) n = totalPages - 6 + i;
                      else n = page - 3 + i;
                      return (
                        <button
                          key={n}
                          className={cn(commonStyles.pageNum, t.pageNum,
                            page === n && cn(commonStyles.pageNumActive, t.pageNumActive))}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* ===== BUDGET TAB ===== */}
        {activeTab === 'budget' && (
          <StaggerContainer staggerDelay={0.08}>
            <div className={cn(commonStyles.budgetPanel, t.budgetPanel)}>
              {/* Monthly Budget Setting */}
              <div className={cn(commonStyles.budgetSettingCard, t.budgetSettingCard)}>
                <div className={commonStyles.budgetSettingHeader}>
                  <div>
                    <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>Monthly Budget Limit</h3>
                    <p className={cn(commonStyles.budgetDesc, t.budgetDesc)}>
                      Set a spending limit to help manage your freelancing costs
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowBudgetEdit(!showBudgetEdit)}>
                    {showBudgetEdit ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                {showBudgetEdit && (
                  <div className={commonStyles.budgetEditRow}>
                    <Input
                      label="Monthly Budget ($)"
                      type="number"
                      value={String(monthlyBudget)}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      placeholder="5000"
                    />
                    <Button variant="primary" size="sm" onClick={() => setShowBudgetEdit(false)}>Save</Button>
                  </div>
                )}

                {/* Overall Progress */}
                <div className={commonStyles.budgetOverview}>
                  <div className={commonStyles.budgetNumbers}>
                    <span className={cn(commonStyles.budgetSpent, t.budgetSpent)}>
                      ${walletStats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(commonStyles.budgetOf, t.budgetOf)}>
                      of ${monthlyBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className={cn(commonStyles.budgetProgressBar, t.budgetProgressBar)}>
                    <div
                      className={cn(commonStyles.budgetProgressFill,
                        budgetUsedPercent > 90 ? commonStyles.budgetDanger :
                        budgetUsedPercent > 70 ? commonStyles.budgetWarning : commonStyles.budgetSafe
                      )}
                      style={{ width: `${budgetUsedPercent}%` }}
                    />
                  </div>
                  <div className={commonStyles.budgetMeta}>
                    <span className={cn(commonStyles.budgetRemaining, t.budgetRemaining)}>
                      ${Math.max(monthlyBudget - walletStats.totalSpent, 0).toLocaleString()} remaining
                    </span>
                    <span className={cn(commonStyles.budgetPercent, t.budgetPercent)}>
                      {budgetUsedPercent}% used
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Budgets */}
              <div className={cn(commonStyles.categoryBudgets, t.categoryBudgets)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>Category Breakdown</h3>
                <div className={commonStyles.categoryBudgetList}>
                  {budgetCategories.map((cat, i) => {
                    const pct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 100) : 0;
                    return (
                      <div key={i} className={cn(commonStyles.categoryBudgetItem, t.categoryBudgetItem)}>
                        <div className={commonStyles.catBudgetHeader}>
                          <span className={commonStyles.catBudgetIcon}>{cat.icon}</span>
                          <span className={cn(commonStyles.catBudgetName, t.catBudgetName)}>{cat.name}</span>
                          <span className={cn(commonStyles.catBudgetNums, t.catBudgetNums)}>
                            ${cat.spent.toLocaleString('en-US', { minimumFractionDigits: 0 })} / ${cat.budget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className={cn(commonStyles.catBudgetBar, t.catBudgetBar)}>
                          <div
                            className={commonStyles.catBudgetFill}
                            style={{ width: `${pct}%`, background: cat.color }}
                          />
                        </div>
                        <span className={cn(commonStyles.catBudgetPct, t.catBudgetPct)}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Budget Alerts */}
              <div className={cn(commonStyles.budgetAlerts, t.budgetAlerts)}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>
                  <AlertTriangle size={18} /> Budget Alerts
                </h3>
                <div className={commonStyles.alertList}>
                  {budgetUsedPercent > 90 && (
                    <div className={cn(commonStyles.alertItem, commonStyles.alertDanger, t.alertItem)}>
                      <AlertTriangle size={16} />
                      <span>You&apos;ve used {budgetUsedPercent}% of your monthly budget!</span>
                    </div>
                  )}
                  {budgetUsedPercent > 70 && budgetUsedPercent <= 90 && (
                    <div className={cn(commonStyles.alertItem, commonStyles.alertWarning, t.alertItem)}>
                      <AlertTriangle size={16} />
                      <span>Budget usage at {budgetUsedPercent}% — consider pacing your spending</span>
                    </div>
                  )}
                  {budgetUsedPercent <= 70 && (
                    <div className={cn(commonStyles.alertItem, commonStyles.alertSafe, t.alertItem)}>
                      <CheckCircle size={16} />
                      <span>Budget on track — {100 - budgetUsedPercent}% remaining this month</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </StaggerContainer>
        )}

        {/* ===== PAYMENT METHODS TAB ===== */}
        {activeTab === 'methods' && (
          <ScrollReveal>
            <div className={cn(commonStyles.methodsPanel, t.methodsPanel)}>
              <div className={commonStyles.methodsHeader}>
                <h3 className={cn(commonStyles.sectionTitle, t.sectionTitle)}>Saved Payment Methods</h3>
                <Button variant="primary" size="sm"><Plus size={16} /> Add Method</Button>
              </div>
              <div className={commonStyles.methodsList}>
                {/* Placeholder cards */}
                <div className={cn(commonStyles.methodCard, t.methodCard)}>
                  <div className={commonStyles.methodIcon}><CreditCard size={24} /></div>
                  <div className={commonStyles.methodInfo}>
                    <span className={cn(commonStyles.methodName, t.methodName)}>Visa ending in 4242</span>
                    <span className={cn(commonStyles.methodExp, t.methodExp)}>Expires 12/26</span>
                  </div>
                  <Badge variant="success">Default</Badge>
                </div>
                <div className={cn(commonStyles.methodCard, t.methodCard)}>
                  <div className={commonStyles.methodIcon}><Wallet size={24} /></div>
                  <div className={commonStyles.methodInfo}>
                    <span className={cn(commonStyles.methodName, t.methodName)}>PayPal — user@email.com</span>
                    <span className={cn(commonStyles.methodExp, t.methodExp)}>Connected</span>
                  </div>
                  <Button variant="ghost" size="sm">Set Default</Button>
                </div>
                <div className={cn(commonStyles.addMethodCard, t.addMethodCard)}>
                  <Plus size={28} />
                  <span>Add a new payment method</span>
                </div>
              </div>

              {/* Payment Security */}
              <div className={cn(commonStyles.securityInfo, t.securityInfo)}>
                <Shield size={20} />
                <div>
                  <h4 className={cn(commonStyles.securityTitle, t.securityTitle)}>Payment Security</h4>
                  <p className={cn(commonStyles.securityText, t.securityText)}>
                    All transactions are encrypted with 256-bit SSL. We never store your full card number.
                    Payments are processed through PCI DSS compliant payment processors.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
}
