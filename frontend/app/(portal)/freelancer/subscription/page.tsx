// @AI-HINT: Subscription Management page - View plans, usage meters, billing history, cancel/upgrade flows
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Button from '@/app/components/Button/Button';
import Loader from '@/app/components/Loader/Loader';
import { apiFetch } from '@/lib/api/core';
import {
  CreditCard, Crown, Zap, Shield, Rocket, Check, X, ArrowRight,
  Calendar, Clock, Download, FileText, BarChart3, Briefcase,
  Send, HardDrive, Headphones, AlertTriangle, ChevronDown, ChevronUp,
  Star, RefreshCw
} from 'lucide-react';
import commonStyles from './Subscription.common.module.css';
import lightStyles from './Subscription.light.module.css';
import darkStyles from './Subscription.dark.module.css';

interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  limits: {
    projects: number;
    proposals: number;
    storage: string;
    support: string;
  };
  popular?: boolean;
}

interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

interface UsageData {
  projects: { used: number; limit: number };
  proposals: { used: number; limit: number };
  storage: { used: number; limit: number; unit: string };
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Zap size={20} />,
  starter: <Rocket size={20} />,
  professional: <Crown size={20} />,
  enterprise: <Shield size={20} />,
};

const TIER_COLORS: Record<string, string> = {
  free: '#64748b',
  starter: '#4573df',
  professional: '#f59e0b',
  enterprise: '#8b5cf6',
};

type TabKey = 'plans' | 'usage' | 'billing';

const TAB_ITEMS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'plans', label: 'Plans', icon: <CreditCard size={16} /> },
  { key: 'usage', label: 'Usage', icon: <BarChart3 size={16} /> },
  { key: 'billing', label: 'Billing', icon: <FileText size={16} /> },
];

const CANCEL_REASONS = [
  'Too expensive',
  'Not using enough features',
  'Switching to a competitor',
  'Project completed',
  'Technical issues',
  'Other',
];

export default function SubscriptionPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('plans');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [usage, setUsage] = useState<UsageData>({
    projects: { used: 0, limit: 1 },
    proposals: { used: 0, limit: 5 },
    storage: { used: 0, limit: 100, unit: 'MB' },
  });
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelStep, setCancelStep] = useState<'reason' | 'confirm'>('reason');
  const [showCompare, setShowCompare] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const { paymentsApi, invoicesApi } = await import('@/lib/api') as any;

      const [_paymentsData, invoicesData] = await Promise.all([
        paymentsApi.list(1, 10).catch(() => null),
        invoicesApi.list({ page: 1, page_size: 10 }).catch(() => null),
      ]);

      const defaultPlans: Plan[] = [
        {
          id: 'free', name: 'Free', tier: 'free', price: 0, billingPeriod: 'monthly',
          features: ['5 proposals/month', '1 active project', 'Basic support', 'Standard profile', '100MB storage'],
          limits: { projects: 1, proposals: 5, storage: '100MB', support: 'Community' },
        },
        {
          id: 'starter', name: 'Starter', tier: 'starter', price: 19, billingPeriod: 'monthly',
          features: ['25 proposals/month', '5 active projects', 'Email support', 'Featured profile', 'Analytics dashboard', '5GB storage'],
          limits: { projects: 5, proposals: 25, storage: '5GB', support: 'Email' },
        },
        {
          id: 'professional', name: 'Professional', tier: 'professional', price: 49, billingPeriod: 'monthly', popular: true,
          features: ['Unlimited proposals', 'Unlimited projects', 'Priority support', 'Verified badge', 'Advanced analytics', 'Team collaboration', 'API access', '50GB storage'],
          limits: { projects: -1, proposals: -1, storage: '50GB', support: 'Priority' },
        },
        {
          id: 'enterprise', name: 'Enterprise', tier: 'enterprise', price: 149, billingPeriod: 'monthly',
          features: ['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label options', 'Bulk invites', 'Advanced security', 'Unlimited storage'],
          limits: { projects: -1, proposals: -1, storage: 'Unlimited', support: 'Dedicated' },
        },
      ];

      const currentSubscription: Subscription = {
        id: 'sub_free',
        plan: defaultPlans[0],
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      };

      const invoicesArray = Array.isArray(invoicesData) ? invoicesData : invoicesData?.items || [];
      const billingData: BillingHistory[] = invoicesArray.map((inv: any) => ({
        id: inv.id?.toString() || `inv_${Math.random()}`,
        date: inv.created_at || inv.date || new Date().toISOString().split('T')[0],
        amount: inv.amount || inv.total || 0,
        description: inv.description || 'Subscription payment',
        status: inv.status === 'paid' ? 'paid' : inv.status === 'pending' ? 'pending' : 'paid',
        invoiceUrl: inv.url || inv.invoice_url || '#',
      }));

      setPlans(defaultPlans);
      setSubscription(currentSubscription);
      setBillingHistory(billingData);
      setUsage({
        projects: { used: 0, limit: currentSubscription.plan.limits.projects },
        proposals: { used: 2, limit: currentSubscription.plan.limits.proposals },
        storage: { used: 12, limit: 100, unit: 'MB' },
      });
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => Math.round(monthlyPrice * 12 * 0.8);

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercent = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const handleUpgrade = async (planId: string) => {
    try {
      await apiFetch('/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_tier: planId, prorate: true }),
      });
      await fetchSubscriptionData();
      showToast('Plan upgraded successfully!');
    } catch (error: any) {
      console.error('[Subscription] Upgrade error:', error);
      showToast(error?.detail || 'Upgrade failed. Please try again.', 'error');
    }
  };

  const handleCancel = async () => {
    setShowCancelModal(false);
    setCancelStep('reason');
    setCancelReason('');
    try {
      await apiFetch('/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: false, reason: cancelReason }),
      });
      setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
      showToast('Subscription will be canceled at end of billing period.');
    } catch (error) {
      console.error('[Subscription] Cancel error:', error);
      showToast('Failed to cancel subscription.', 'error');
    }
  };

  const getPlanAction = (plan: Plan) => {
    if (!subscription) return 'Get Started';
    const currentIdx = plans.findIndex(p => p.id === subscription.plan.id);
    const targetIdx = plans.findIndex(p => p.id === plan.id);
    if (currentIdx === targetIdx) return 'Current Plan';
    return targetIdx > currentIdx ? 'Upgrade' : 'Downgrade';
  };

  const COMPARE_FEATURES = [
    { label: 'Active Projects', key: 'projects' as const, icon: <Briefcase size={14} /> },
    { label: 'Proposals/Month', key: 'proposals' as const, icon: <Send size={14} /> },
    { label: 'Storage', key: 'storage' as const, icon: <HardDrive size={14} /> },
    { label: 'Support', key: 'support' as const, icon: <Headphones size={14} /> },
  ];

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <CreditCard size={28} className={commonStyles.titleIcon} />
                Subscription
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your plan, track usage, and view billing history
              </p>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <Loader size="lg" />
        ) : (
          <>
            {/* Current Plan Card - Enhanced */}
            {subscription && (
              <ScrollReveal delay={0.1}>
                <div className={cn(commonStyles.currentPlan, themeStyles.currentPlan)}>
                  <div className={commonStyles.currentPlanHeader}>
                    <div className={commonStyles.currentPlanLeft}>
                      <div
                        className={commonStyles.planIconCircle}
                        style={{ backgroundColor: `${TIER_COLORS[subscription.plan.tier]}20`, color: TIER_COLORS[subscription.plan.tier] }}
                      >
                        {TIER_ICONS[subscription.plan.tier]}
                      </div>
                      <div>
                        <span className={cn(commonStyles.currentPlanLabel, themeStyles.currentPlanLabel)}>
                          Current Plan
                        </span>
                        <h2 className={cn(commonStyles.currentPlanName, themeStyles.currentPlanName)}>
                          {subscription.plan.name}
                        </h2>
                      </div>
                    </div>
                    <div className={commonStyles.currentPlanRight}>
                      <span className={cn(
                        commonStyles.statusBadge,
                        subscription.status === 'active' && !subscription.cancelAtPeriodEnd
                          ? commonStyles.statusActive
                          : commonStyles.statusCanceled
                      )}>
                        {subscription.cancelAtPeriodEnd ? 'Canceling' : subscription.status}
                      </span>
                    </div>
                  </div>

                  <div className={commonStyles.currentPlanDetails}>
                    <div className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                      <Calendar size={14} />
                      <span>${subscription.plan.price}/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                    <div className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                      <Clock size={14} />
                      <span>{getDaysRemaining()} days remaining</span>
                    </div>
                    <div className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                      <RefreshCw size={14} />
                      <span>Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Quick Usage Meters */}
                  <div className={commonStyles.quickUsage}>
                    <div className={commonStyles.usageMeter}>
                      <div className={commonStyles.usageMeterHeader}>
                        <span className={cn(commonStyles.usageMeterLabel, themeStyles.usageMeterLabel)}>
                          <Briefcase size={13} /> Projects
                        </span>
                        <span className={cn(commonStyles.usageMeterValue, themeStyles.usageMeterValue)}>
                          {usage.projects.used}/{usage.projects.limit === -1 ? '∞' : usage.projects.limit}
                        </span>
                      </div>
                      <div className={cn(commonStyles.usageBar, themeStyles.usageBar)}>
                        <div
                          className={commonStyles.usageBarFill}
                          style={{ width: `${getUsagePercent(usage.projects.used, usage.projects.limit)}%` }}
                        />
                      </div>
                    </div>
                    <div className={commonStyles.usageMeter}>
                      <div className={commonStyles.usageMeterHeader}>
                        <span className={cn(commonStyles.usageMeterLabel, themeStyles.usageMeterLabel)}>
                          <Send size={13} /> Proposals
                        </span>
                        <span className={cn(commonStyles.usageMeterValue, themeStyles.usageMeterValue)}>
                          {usage.proposals.used}/{usage.proposals.limit === -1 ? '∞' : usage.proposals.limit}
                        </span>
                      </div>
                      <div className={cn(commonStyles.usageBar, themeStyles.usageBar)}>
                        <div
                          className={commonStyles.usageBarFill}
                          style={{ width: `${getUsagePercent(usage.proposals.used, usage.proposals.limit)}%` }}
                        />
                      </div>
                    </div>
                    <div className={commonStyles.usageMeter}>
                      <div className={commonStyles.usageMeterHeader}>
                        <span className={cn(commonStyles.usageMeterLabel, themeStyles.usageMeterLabel)}>
                          <HardDrive size={13} /> Storage
                        </span>
                        <span className={cn(commonStyles.usageMeterValue, themeStyles.usageMeterValue)}>
                          {usage.storage.used}/{usage.storage.limit}{usage.storage.unit}
                        </span>
                      </div>
                      <div className={cn(commonStyles.usageBar, themeStyles.usageBar)}>
                        <div
                          className={commonStyles.usageBarFill}
                          style={{ width: `${getUsagePercent(usage.storage.used, usage.storage.limit)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <div className={cn(commonStyles.cancelNotice, themeStyles.cancelNotice)}>
                      <AlertTriangle size={16} />
                      Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}

                  {subscription.plan.tier !== 'free' && !subscription.cancelAtPeriodEnd && (
                    <button
                      className={cn(commonStyles.cancelLink, themeStyles.cancelLink)}
                      onClick={() => { setShowCancelModal(true); setCancelStep('reason'); }}
                    >
                      Cancel subscription
                    </button>
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Tabs */}
            <ScrollReveal delay={0.2}>
              <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
                {TAB_ITEMS.map(tab => (
                  <button
                    key={tab.key}
                    className={cn(
                      commonStyles.tab, themeStyles.tab,
                      activeTab === tab.key && commonStyles.tabActive,
                      activeTab === tab.key && themeStyles.tabActive
                    )}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* === PLANS TAB === */}
            {activeTab === 'plans' && (
              <>
                <ScrollReveal delay={0.3}>
                  <div className={commonStyles.plansControls}>
                    <div className={cn(commonStyles.billingToggle, themeStyles.billingToggle)}>
                      <button
                        className={cn(commonStyles.toggleOption, themeStyles.toggleOption, billingPeriod === 'monthly' && commonStyles.toggleActive, billingPeriod === 'monthly' && themeStyles.toggleActive)}
                        onClick={() => setBillingPeriod('monthly')}
                      >
                        Monthly
                      </button>
                      <button
                        className={cn(commonStyles.toggleOption, themeStyles.toggleOption, billingPeriod === 'yearly' && commonStyles.toggleActive, billingPeriod === 'yearly' && themeStyles.toggleActive)}
                        onClick={() => setBillingPeriod('yearly')}
                      >
                        Yearly <span className={commonStyles.discount}>Save 20%</span>
                      </button>
                    </div>
                    <button
                      className={cn(commonStyles.compareBtn, themeStyles.compareBtn)}
                      onClick={() => setShowCompare(!showCompare)}
                    >
                      {showCompare ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showCompare ? 'Hide' : 'Compare'} Plans
                    </button>
                  </div>
                </ScrollReveal>

                {/* Plan Comparison Table */}
                {showCompare && (
                  <ScrollReveal delay={0.35}>
                    <div className={cn(commonStyles.compareTable, themeStyles.compareTable)}>
                      <div className={cn(commonStyles.compareHeader, themeStyles.compareHeader)}>
                        <div className={commonStyles.compareFeatureLabel}>Feature</div>
                        {plans.map(p => (
                          <div key={p.id} className={commonStyles.comparePlanHead}>
                            <span style={{ color: TIER_COLORS[p.tier] }}>{TIER_ICONS[p.tier]}</span>
                            {p.name}
                          </div>
                        ))}
                      </div>
                      {COMPARE_FEATURES.map(feat => (
                        <div key={feat.key} className={cn(commonStyles.compareRow, themeStyles.compareRow)}>
                          <div className={cn(commonStyles.compareFeatureLabel, themeStyles.compareFeatureLabel)}>
                            {feat.icon} {feat.label}
                          </div>
                          {plans.map(p => (
                            <div key={p.id} className={cn(commonStyles.compareCell, themeStyles.compareCell)}>
                              {feat.key === 'storage' || feat.key === 'support'
                                ? p.limits[feat.key]
                                : p.limits[feat.key] === -1
                                  ? 'Unlimited'
                                  : p.limits[feat.key]}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollReveal>
                )}

                <StaggerContainer delay={0.4} className={commonStyles.plansGrid}>
                  {plans.map(plan => {
                    const price = billingPeriod === 'yearly' ? getYearlyPrice(plan.price) : plan.price;
                    const isCurrentPlan = subscription?.plan.id === plan.id;
                    const action = getPlanAction(plan);
                    const isExpanded = expandedPlan === plan.id;

                    return (
                      <StaggerItem key={plan.id}>
                        <div
                          className={cn(
                            commonStyles.planCard, themeStyles.planCard,
                            plan.popular && commonStyles.popularPlan,
                            plan.popular && themeStyles.popularPlan,
                            isCurrentPlan && commonStyles.currentPlanCard,
                            isCurrentPlan && themeStyles.currentPlanCard
                          )}
                        >
                          {plan.popular && (
                            <div className={cn(commonStyles.popularBadge, themeStyles.popularBadge)}>
                              <Star size={12} /> Most Popular
                            </div>
                          )}

                          <div className={commonStyles.planCardTop}>
                            <div
                              className={commonStyles.planTierIcon}
                              style={{ backgroundColor: `${TIER_COLORS[plan.tier]}15`, color: TIER_COLORS[plan.tier] }}
                            >
                              {TIER_ICONS[plan.tier]}
                            </div>
                            <h3 className={cn(commonStyles.planName, themeStyles.planName)}>{plan.name}</h3>
                          </div>

                          <div className={commonStyles.planPrice}>
                            <span className={cn(commonStyles.priceAmount, themeStyles.priceAmount)}>
                              ${price}
                            </span>
                            <span className={cn(commonStyles.pricePeriod, themeStyles.pricePeriod)}>
                              /{billingPeriod === 'yearly' ? 'year' : 'month'}
                            </span>
                            {billingPeriod === 'yearly' && plan.price > 0 && (
                              <div className={cn(commonStyles.priceOriginal, themeStyles.priceOriginal)}>
                                ${plan.price * 12}/yr
                              </div>
                            )}
                          </div>

                          {/* Key limits summary */}
                          <div className={commonStyles.planLimits}>
                            <div className={cn(commonStyles.limitItem, themeStyles.limitItem)}>
                              <Briefcase size={13} />
                              {plan.limits.projects === -1 ? 'Unlimited' : plan.limits.projects} projects
                            </div>
                            <div className={cn(commonStyles.limitItem, themeStyles.limitItem)}>
                              <Send size={13} />
                              {plan.limits.proposals === -1 ? 'Unlimited' : plan.limits.proposals} proposals
                            </div>
                            <div className={cn(commonStyles.limitItem, themeStyles.limitItem)}>
                              <HardDrive size={13} />
                              {plan.limits.storage}
                            </div>
                          </div>

                          {/* Expandable features */}
                          <button
                            className={cn(commonStyles.showFeatures, themeStyles.showFeatures)}
                            onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                          >
                            {isExpanded ? 'Hide' : 'Show'} all features
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {isExpanded && (
                            <ul className={commonStyles.featuresList}>
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className={cn(commonStyles.feature, themeStyles.feature)}>
                                  <Check size={14} className={commonStyles.checkIcon} />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}

                          <button
                            className={cn(
                              commonStyles.planButton, themeStyles.planButton,
                              isCurrentPlan && commonStyles.currentButton,
                              isCurrentPlan && themeStyles.currentButton,
                              action === 'Downgrade' && commonStyles.downgradeButton,
                              action === 'Downgrade' && themeStyles.downgradeButton
                            )}
                            onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                            disabled={isCurrentPlan}
                          >
                            {isCurrentPlan ? (
                              <>Current Plan</>
                            ) : (
                              <>{action} <ArrowRight size={14} /></>
                            )}
                          </button>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </>
            )}

            {/* === USAGE TAB === */}
            {activeTab === 'usage' && (
              <ScrollReveal delay={0.3}>
                <div className={cn(commonStyles.usageSection, themeStyles.usageSection)}>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    Current Usage
                  </h3>
                  <p className={cn(commonStyles.sectionDesc, themeStyles.sectionDesc)}>
                    Track your resource consumption for this billing cycle
                  </p>

                  <div className={commonStyles.usageCards}>
                    {/* Projects */}
                    <div className={cn(commonStyles.usageCard, themeStyles.usageCard)}>
                      <div className={commonStyles.usageCardIcon} style={{ backgroundColor: '#4573df20', color: '#4573df' }}>
                        <Briefcase size={22} />
                      </div>
                      <div className={commonStyles.usageCardContent}>
                        <h4 className={cn(commonStyles.usageCardTitle, themeStyles.usageCardTitle)}>Active Projects</h4>
                        <div className={commonStyles.usageNumbers}>
                          <span className={cn(commonStyles.usageUsed, themeStyles.usageUsed)}>{usage.projects.used}</span>
                          <span className={cn(commonStyles.usageLimit, themeStyles.usageLimit)}>
                            / {usage.projects.limit === -1 ? '∞' : usage.projects.limit}
                          </span>
                        </div>
                        <div className={cn(commonStyles.usageBarLg, themeStyles.usageBarLg)}>
                          <div
                            className={commonStyles.usageBarFillLg}
                            style={{
                              width: `${getUsagePercent(usage.projects.used, usage.projects.limit)}%`,
                              backgroundColor: getUsagePercent(usage.projects.used, usage.projects.limit) > 80 ? '#ef4444' : '#4573df',
                            }}
                          />
                        </div>
                        <span className={cn(commonStyles.usagePercent, themeStyles.usagePercent)}>
                          {usage.projects.limit === -1 ? 'Unlimited' : `${getUsagePercent(usage.projects.used, usage.projects.limit)}% used`}
                        </span>
                      </div>
                    </div>

                    {/* Proposals */}
                    <div className={cn(commonStyles.usageCard, themeStyles.usageCard)}>
                      <div className={commonStyles.usageCardIcon} style={{ backgroundColor: '#27AE6020', color: '#27AE60' }}>
                        <Send size={22} />
                      </div>
                      <div className={commonStyles.usageCardContent}>
                        <h4 className={cn(commonStyles.usageCardTitle, themeStyles.usageCardTitle)}>Proposals Sent</h4>
                        <div className={commonStyles.usageNumbers}>
                          <span className={cn(commonStyles.usageUsed, themeStyles.usageUsed)}>{usage.proposals.used}</span>
                          <span className={cn(commonStyles.usageLimit, themeStyles.usageLimit)}>
                            / {usage.proposals.limit === -1 ? '∞' : usage.proposals.limit}
                          </span>
                        </div>
                        <div className={cn(commonStyles.usageBarLg, themeStyles.usageBarLg)}>
                          <div
                            className={commonStyles.usageBarFillLg}
                            style={{
                              width: `${getUsagePercent(usage.proposals.used, usage.proposals.limit)}%`,
                              backgroundColor: getUsagePercent(usage.proposals.used, usage.proposals.limit) > 80 ? '#ef4444' : '#27AE60',
                            }}
                          />
                        </div>
                        <span className={cn(commonStyles.usagePercent, themeStyles.usagePercent)}>
                          {usage.proposals.limit === -1 ? 'Unlimited' : `${getUsagePercent(usage.proposals.used, usage.proposals.limit)}% used`}
                        </span>
                      </div>
                    </div>

                    {/* Storage */}
                    <div className={cn(commonStyles.usageCard, themeStyles.usageCard)}>
                      <div className={commonStyles.usageCardIcon} style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                        <HardDrive size={22} />
                      </div>
                      <div className={commonStyles.usageCardContent}>
                        <h4 className={cn(commonStyles.usageCardTitle, themeStyles.usageCardTitle)}>Storage</h4>
                        <div className={commonStyles.usageNumbers}>
                          <span className={cn(commonStyles.usageUsed, themeStyles.usageUsed)}>{usage.storage.used}</span>
                          <span className={cn(commonStyles.usageLimit, themeStyles.usageLimit)}>
                            / {usage.storage.limit}{usage.storage.unit}
                          </span>
                        </div>
                        <div className={cn(commonStyles.usageBarLg, themeStyles.usageBarLg)}>
                          <div
                            className={commonStyles.usageBarFillLg}
                            style={{
                              width: `${getUsagePercent(usage.storage.used, usage.storage.limit)}%`,
                              backgroundColor: getUsagePercent(usage.storage.used, usage.storage.limit) > 80 ? '#ef4444' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span className={cn(commonStyles.usagePercent, themeStyles.usagePercent)}>
                          {`${getUsagePercent(usage.storage.used, usage.storage.limit)}% used`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade prompt if near limits */}
                  {(getUsagePercent(usage.proposals.used, usage.proposals.limit) > 70 ||
                    getUsagePercent(usage.projects.used, usage.projects.limit) > 70) && (
                    <div className={cn(commonStyles.upgradePrompt, themeStyles.upgradePrompt)}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Running low on resources?</strong>
                        <p>Upgrade your plan to unlock more capacity and features.</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setActiveTab('plans')}>
                        View Plans
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* === BILLING TAB === */}
            {activeTab === 'billing' && (
              <ScrollReveal delay={0.3}>
                <div className={cn(commonStyles.billingSection, themeStyles.billingSection)}>
                  <div className={commonStyles.billingSectionHeader}>
                    <div>
                      <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                        Billing History
                      </h3>
                      <p className={cn(commonStyles.sectionDesc, themeStyles.sectionDesc)}>
                        Your recent invoices and payments
                      </p>
                    </div>
                  </div>

                  {billingHistory.length > 0 ? (
                    <div className={commonStyles.billingList}>
                      <div className={cn(commonStyles.billingListHeader, themeStyles.billingListHeader)}>
                        <span>Date</span>
                        <span>Description</span>
                        <span>Amount</span>
                        <span>Status</span>
                        <span>Invoice</span>
                      </div>
                      {billingHistory.map(item => (
                        <div key={item.id} className={cn(commonStyles.billingRow, themeStyles.billingRow)}>
                          <span className={cn(commonStyles.billingDate, themeStyles.billingDate)}>
                            <Calendar size={13} />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className={cn(commonStyles.billingDesc, themeStyles.billingDesc)}>
                            {item.description}
                          </span>
                          <span className={cn(commonStyles.billingAmount, themeStyles.billingAmount)}>
                            ${item.amount.toFixed(2)}
                          </span>
                          <span>
                            <span className={cn(
                              commonStyles.paymentStatus,
                              item.status === 'paid' ? commonStyles.statusPaid : item.status === 'failed' ? commonStyles.statusFailed : commonStyles.statusPending,
                            )}>
                              {item.status}
                            </span>
                          </span>
                          <span>
                            {item.invoiceUrl && item.invoiceUrl !== '#' ? (
                              <a
                                href={item.invoiceUrl}
                                className={cn(commonStyles.invoiceLink, themeStyles.invoiceLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download size={14} /> PDF
                              </a>
                            ) : (
                              <span className={cn(commonStyles.noInvoice, themeStyles.noInvoice)}>--</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <FileText size={40} />
                      <h4>No billing history</h4>
                      <p>Your invoices and payment records will appear here once you subscribe to a paid plan.</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}
          </>
        )}

        {/* Cancel Modal - Multi-step */}
        {showCancelModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowCancelModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h3>Cancel Subscription</h3>
                <button className={cn(commonStyles.modalClose, themeStyles.modalClose)} onClick={() => setShowCancelModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                {cancelStep === 'reason' ? (
                  <>
                    <p className={cn(commonStyles.modalText, themeStyles.modalText)}>
                      We&apos;re sorry to see you go. Could you tell us why you&apos;re canceling?
                    </p>
                    <div className={commonStyles.reasonList}>
                      {CANCEL_REASONS.map(reason => (
                        <label
                          key={reason}
                          className={cn(
                            commonStyles.reasonItem,
                            themeStyles.reasonItem,
                            cancelReason === reason && commonStyles.reasonSelected,
                            cancelReason === reason && themeStyles.reasonSelected
                          )}
                        >
                          <input
                            type="radio"
                            name="cancelReason"
                            value={reason}
                            checked={cancelReason === reason}
                            onChange={() => setCancelReason(reason)}
                            className={commonStyles.reasonRadio}
                          />
                          {reason}
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={cn(commonStyles.confirmWarning, themeStyles.confirmWarning)}>
                      <AlertTriangle size={20} />
                      <div>
                        <strong>Are you sure?</strong>
                        <p>Your subscription will remain active until the end of the current billing period. After that, you&apos;ll lose access to premium features.</p>
                      </div>
                    </div>
                    <div className={cn(commonStyles.loseFeatures, themeStyles.loseFeatures)}>
                      <h4>You&apos;ll lose access to:</h4>
                      <ul>
                        {subscription?.plan.features.slice(0, 4).map((f, i) => (
                          <li key={i}><X size={12} /> {f}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
              <div className={commonStyles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                  Keep My Plan
                </Button>
                {cancelStep === 'reason' ? (
                  <Button
                    variant="danger"
                    onClick={() => setCancelStep('confirm')}
                    disabled={!cancelReason}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button variant="danger" onClick={handleCancel}>
                    Confirm Cancellation
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            commonStyles.toast, themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError,
            toast.type === 'error' && themeStyles.toastError
          )}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
