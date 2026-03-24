// @AI-HINT: Admin billing management - subscriptions, plans, revenue analytics
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import {
  Download, DollarSign, TrendingUp, Users, Percent, UserCheck,
  BarChart3, CreditCard, FileText, Edit3, Check,
} from 'lucide-react';
import commonStyles from './Billing.common.module.css';
import lightStyles from './Billing.light.module.css';
import darkStyles from './Billing.dark.module.css';

interface Subscription {
  id: string;
  userName: string;
  userEmail: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  billingCycle: string;
  currentPeriodEnd: string;
}

interface RevenueStats {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  trialConversionRate: number;
  growthRate: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  subscriberCount: number;
  isPopular: boolean;
}

export default function AdminBillingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'plans' | 'invoices'>('overview');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) fetchBillingData();
  }, [mounted]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const { metricsApi, adminApi } = await import('@/lib/api');

      const [overviewRes, paymentsRes, plansRes] = await Promise.allSettled([
        metricsApi.getOverview('30d'),
        adminApi.getPayments({ limit: 50 }),
        (adminApi as any).getPlans?.(),
      ]);

      // Stats
      const apiStats = overviewRes.status === 'fulfilled' && overviewRes.value
        ? (overviewRes.value as any) : null;
      if (apiStats) {
        setStats({
          mrr: apiStats.mrr ?? 0,
          arr: apiStats.arr ?? 0,
          totalRevenue: apiStats.total_revenue ?? 0,
          activeSubscriptions: apiStats.active_subscriptions ?? 0,
          churnRate: apiStats.churn_rate ?? 0,
          averageRevenuePerUser: apiStats.arpu ?? 0,
          trialConversionRate: apiStats.trial_conversion ?? 0,
          growthRate: apiStats.growth_rate ?? 0,
        });
      }

      // Subscriptions from payments
      const paymentsArr = paymentsRes.status === 'fulfilled' && paymentsRes.value
        ? (Array.isArray(paymentsRes.value) ? paymentsRes.value : (paymentsRes.value as any)?.items || [])
        : [];
      setSubscriptions(paymentsArr.map((p: any, idx: number) => ({
        id: p.id?.toString() || `sub_${idx}`,
        userName: p.user_name || p.user?.name || '',
        userEmail: p.user_email || p.user?.email || '',
        plan: p.plan || 'free',
        status: p.status || 'active',
        amount: p.amount ?? 0,
        currency: p.currency || 'USD',
        billingCycle: p.billing_cycle || 'monthly',
        currentPeriodEnd: p.expires_at || p.period_end || '',
      })));

      // Plans
      const plansArr = plansRes.status === 'fulfilled' && plansRes.value
        ? (Array.isArray(plansRes.value) ? plansRes.value : (plansRes.value as any)?.plans || [])
        : [];
      setPlans(plansArr.map((p: any) => ({
        id: p.id?.toString(),
        name: p.name || '',
        price: p.price ?? 0,
        billingCycle: p.billing_cycle || 'monthly',
        features: p.features || [],
        subscriberCount: p.subscriber_count ?? 0,
        isPopular: p.is_popular ?? false,
      })));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch billing data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'trialing': return 'info';
      case 'past_due': return 'warning';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    try {
      if (!stats) { showToast('No data to export', 'error'); return; }
      const rows = [
        { Metric: 'MRR', Value: `$${stats.mrr.toLocaleString()}` },
        { Metric: 'ARR', Value: `$${stats.arr.toLocaleString()}` },
        { Metric: 'Active Subscriptions', Value: stats.activeSubscriptions.toString() },
        { Metric: 'Churn Rate', Value: `${stats.churnRate}%` },
        { Metric: 'ARPU', Value: `$${stats.averageRevenuePerUser}` },
        { Metric: 'Trial Conversion', Value: `${stats.trialConversionRate}%` },
      ];
      const csvContent = ['Metric,Value', ...rows.map(r => `${r.Metric},${r.Value}`)].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report exported');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const STAT_ITEMS = stats ? [
    { label: 'Monthly Recurring Revenue', value: `$${stats.mrr.toLocaleString()}`, icon: <DollarSign size={16} />, highlight: true, change: stats.growthRate },
    { label: 'Annual Recurring Revenue', value: `$${stats.arr.toLocaleString()}`, icon: <TrendingUp size={16} /> },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions.toLocaleString(), icon: <Users size={16} /> },
    { label: 'Churn Rate', value: `${stats.churnRate}%`, icon: <Percent size={16} /> },
    { label: 'ARPU', value: `$${stats.averageRevenuePerUser}`, icon: <BarChart3 size={16} /> },
    { label: 'Trial Conversion', value: `${stats.trialConversionRate}%`, icon: <UserCheck size={16} /> },
  ] : [];

  const maxSubscribers = Math.max(...plans.map(p => p.subscriberCount), 1);

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Billing &amp; Subscriptions</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage subscriptions, plans, and revenue analytics
              </p>
            </div>
            <Button variant="primary" size="sm" iconBefore={<Download size={14} />} onClick={handleExport}>
              Export Report
            </Button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrap}><Loader size="lg" /></div>
        ) : (
          <>
            {/* Revenue Stats */}
            {STAT_ITEMS.length > 0 && (
              <ScrollReveal delay={0.1}>
                <StaggerContainer className={commonStyles.statsGrid}>
                  {STAT_ITEMS.map((item, idx) => (
                    <StaggerItem
                      key={idx}
                      className={cn(commonStyles.statCard, themeStyles.statCard, item.highlight && commonStyles.statHighlight)}
                    >
                      <div className={commonStyles.statHeader}>
                        <span className={cn(commonStyles.statIcon, themeStyles.statIcon)}>{item.icon}</span>
                        <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{item.label}</span>
                      </div>
                      <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{item.value}</div>
                      {item.change != null && (
                        <div className={cn(commonStyles.statChange, item.change >= 0 ? commonStyles.positive : commonStyles.negative)}>
                          {item.change >= 0 ? '+' : ''}{item.change}% vs last month
                        </div>
                      )}
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </ScrollReveal>
            )}

            {/* Tabs */}
            <ScrollReveal delay={0.2}>
              <div className={commonStyles.tabRow}>
                {(['overview', 'subscriptions', 'plans', 'invoices'] as const).map(tab => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                ))}
              </div>
            </ScrollReveal>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <ScrollReveal delay={0.3}>
                {plans.length > 0 ? (
                  <div className={cn(commonStyles.chartCard, themeStyles.chartCard)}>
                    <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Plan Distribution</h3>
                    <div className={commonStyles.planDistribution}>
                      {plans.map(plan => (
                        <div key={plan.id} className={commonStyles.planBar}>
                          <div className={commonStyles.planBarHeader}>
                            <span className={cn(commonStyles.planName, themeStyles.planName)}>{plan.name}</span>
                            <span className={cn(commonStyles.planCount, themeStyles.planCount)}>{plan.subscriberCount.toLocaleString()}</span>
                          </div>
                          <div className={cn(commonStyles.planBarTrack, themeStyles.planBarTrack)}>
                            <div
                              className={cn(commonStyles.planBarFill, themeStyles.planBarFill)}
                              style={{ width: `${(plan.subscriberCount / maxSubscribers) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No overview data"
                    description="Billing overview data is not available yet. Plans and subscriber counts will appear here once configured."
                  />
                )}
              </ScrollReveal>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <ScrollReveal delay={0.3}>
                <div className={cn(commonStyles.panel, themeStyles.panel)}>
                  <div className={commonStyles.filters}>
                    <div className={commonStyles.filterInput}>
                      <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className={commonStyles.filterSelect}>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                          { value: 'all', label: 'All Statuses' },
                          { value: 'active', label: 'Active' },
                          { value: 'trialing', label: 'Trialing' },
                          { value: 'past_due', label: 'Past Due' },
                          { value: 'cancelled', label: 'Cancelled' },
                        ]}
                      />
                    </div>
                  </div>

                  {filteredSubscriptions.length > 0 ? (
                    <div className={commonStyles.tableWrapper}>
                      <table className={commonStyles.table}>
                        <thead>
                          <tr className={cn(commonStyles.tableHeader, themeStyles.tableHeader)}>
                            <th>User</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Period End</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubscriptions.map(sub => (
                            <tr key={sub.id} className={cn(commonStyles.tableRow, themeStyles.tableRow)}>
                              <td>
                                <div className={cn(commonStyles.userName, themeStyles.userName)}>{sub.userName}</div>
                                <div className={cn(commonStyles.userEmail, themeStyles.userEmail)}>{sub.userEmail}</div>
                              </td>
                              <td>
                                <Badge variant="info">{sub.plan}</Badge>
                              </td>
                              <td>
                                <Badge variant={getStatusVariant(sub.status)}>
                                  {sub.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className={cn(commonStyles.amount, themeStyles.amount)}>
                                ${sub.amount}/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}
                              </td>
                              <td className={cn(commonStyles.date, themeStyles.date)}>
                                {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '--'}
                              </td>
                              <td>
                                <Button variant="ghost" size="sm" iconBefore={<CreditCard size={13} />}>
                                  Manage
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState
                      title="No subscriptions found"
                      description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Subscription data will appear here once available.'}
                    />
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
              plans.length > 0 ? (
                <StaggerContainer className={commonStyles.plansGrid}>
                  {plans.map(plan => (
                    <StaggerItem key={plan.id}>
                      <div className={cn(commonStyles.planCard, themeStyles.planCard, plan.isPopular && commonStyles.popularPlan)}>
                        {plan.isPopular && <div className={commonStyles.popularBadge}>Most Popular</div>}
                        <h3 className={cn(commonStyles.planTitle, themeStyles.planTitle)}>{plan.name}</h3>
                        <div className={cn(commonStyles.planPrice, themeStyles.planPrice)}>
                          <span className={commonStyles.priceAmount}>${plan.price}</span>
                          <span className={commonStyles.pricePeriod}>/{plan.billingCycle === 'yearly' ? 'year' : 'month'}</span>
                        </div>
                        <div className={cn(commonStyles.subscribers, themeStyles.subscribers)}>
                          {plan.subscriberCount.toLocaleString()} subscribers
                        </div>
                        <ul className={commonStyles.featureList}>
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className={cn(commonStyles.feature, themeStyles.feature)}>
                              <Check size={14} className={commonStyles.checkIcon} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button variant="secondary" size="sm" iconBefore={<Edit3 size={13} />} fullWidth>
                          Edit Plan
                        </Button>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <EmptyState
                  title="No plans configured"
                  description="Subscription plans will appear here once they are set up in the system."
                />
              )
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <ScrollReveal delay={0.3}>
                <EmptyState
                  title="Invoice Management"
                  description="View and manage all platform invoices here. Integration with payment provider pending."
                />
              </ScrollReveal>
            )}
          </>
        )}

        {toast && (
          <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
