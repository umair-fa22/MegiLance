// @AI-HINT: Subscription Management page - View and manage subscription plans
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Modal from '@/app/components/Modal/Modal';
import Button from '@/app/components/Button/Button';
import Loader from '@/app/components/Loader/Loader';
import { apiFetch } from '@/lib/api/core';
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
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export default function SubscriptionPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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
      // Import API dynamically to avoid circular dependencies
      const { paymentsApi, invoicesApi } = await import('@/lib/api') as any;
      
      // Fetch real data from APIs
      const [paymentsData, invoicesData] = await Promise.all([
        paymentsApi.list(1, 10).catch(() => null),
        invoicesApi.list({ page: 1, page_size: 10 }).catch(() => null),
      ]);

      // Default plans (could also be fetched from API)
      const defaultPlans: Plan[] = [
        {
          id: 'free',
          name: 'Free',
          tier: 'free',
          price: 0,
          billingPeriod: 'monthly',
          features: ['5 proposals/month', '1 active project', 'Basic support', 'Standard profile'],
          limits: { projects: 1, proposals: 5, storage: '100MB', support: 'Community' }
        },
        {
          id: 'starter',
          name: 'Starter',
          tier: 'starter',
          price: 19,
          billingPeriod: 'monthly',
          features: ['25 proposals/month', '5 active projects', 'Email support', 'Featured profile', 'Analytics dashboard'],
          limits: { projects: 5, proposals: 25, storage: '5GB', support: 'Email' }
        },
        {
          id: 'professional',
          name: 'Professional',
          tier: 'professional',
          price: 49,
          billingPeriod: 'monthly',
          popular: true,
          features: ['Unlimited proposals', 'Unlimited projects', 'Priority support', 'Verified badge', 'Advanced analytics', 'Team collaboration', 'API access'],
          limits: { projects: -1, proposals: -1, storage: '50GB', support: 'Priority' }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          tier: 'enterprise',
          price: 149,
          billingPeriod: 'monthly',
          features: ['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label options', 'Bulk invites', 'Advanced security'],
          limits: { projects: -1, proposals: -1, storage: 'Unlimited', support: 'Dedicated' }
        }
      ];

      // Default to free plan if no subscription found
      const currentSubscription: Subscription = {
        id: 'sub_free',
        plan: defaultPlans[0],
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      };

      // Transform invoices to billing history
      const invoicesArray = Array.isArray(invoicesData) ? invoicesData : invoicesData?.items || [];
      const billingData: BillingHistory[] = invoicesArray.map((inv: any) => ({
        id: inv.id?.toString() || `inv_${Math.random()}`,
        date: inv.created_at || inv.date || new Date().toISOString().split('T')[0],
        amount: inv.amount || inv.total || 0,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'pending' ? 'pending' : 'paid',
        invoiceUrl: inv.url || inv.invoice_url || '#'
      }));

      setPlans(defaultPlans);
      setSubscription(currentSubscription);
      setBillingHistory(billingData);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount for yearly
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
    setShowCancelConfirm(false);
    try {
      await apiFetch('/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: false }),
      });
      setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
      showToast('Subscription will be canceled at end of billing period.');
    } catch (error) {
      console.error('[Subscription] Cancel error:', error);
      showToast('Failed to cancel subscription.', 'error');
    }
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Subscription</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your subscription and billing
              </p>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <Loader size="lg" />
        ) : (
          <>
            {/* Current Plan Card */}
            {subscription && (
              <ScrollReveal delay={0.1}>
                <div className={cn(commonStyles.currentPlan, themeStyles.currentPlan)}>
                  <div className={commonStyles.currentPlanHeader}>
                    <div>
                      <span className={cn(commonStyles.currentPlanLabel, themeStyles.currentPlanLabel)}>
                        Current Plan
                      </span>
                      <h2 className={cn(commonStyles.currentPlanName, themeStyles.currentPlanName)}>
                        {subscription.plan.name}
                      </h2>
                    </div>
                    <span className={cn(
                      commonStyles.statusBadge,
                      subscription.status === 'active' ? commonStyles.statusActive : commonStyles.statusCanceled
                    )}>
                      {subscription.cancelAtPeriodEnd ? 'Canceling' : subscription.status}
                    </span>
                  </div>
                  <div className={cn(commonStyles.currentPlanMeta, themeStyles.currentPlanMeta)}>
                    <span>
                      ${subscription.plan.price}/month • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <div className={cn(commonStyles.cancelNotice, themeStyles.cancelNotice)}>
                      Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Tabs */}
            <ScrollReveal delay={0.2}>
              <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
                <button
                  className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'plans' && commonStyles.tabActive, activeTab === 'plans' && themeStyles.tabActive)}
                  onClick={() => setActiveTab('plans')}
                >
                  Plans
                </button>
                <button
                  className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'billing' && commonStyles.tabActive, activeTab === 'billing' && themeStyles.tabActive)}
                  onClick={() => setActiveTab('billing')}
                >
                  Billing History
                </button>
              </div>
            </ScrollReveal>

            {activeTab === 'plans' && (
              <>
                {/* Billing Toggle */}
                <ScrollReveal delay={0.3}>
                  <div className={commonStyles.billingToggle}>
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
                </ScrollReveal>

                {/* Plans Grid */}
                <StaggerContainer delay={0.4} className={commonStyles.plansGrid}>
                  {plans.map(plan => {
                    const price = billingPeriod === 'yearly' ? getYearlyPrice(plan.price) : plan.price;
                    const isCurrentPlan = subscription?.plan.id === plan.id;
                    
                    return (
                      <StaggerItem key={plan.id}>
                        <div 
                          className={cn(
                            commonStyles.planCard, 
                            themeStyles.planCard,
                            plan.popular && commonStyles.popularPlan,
                            plan.popular && themeStyles.popularPlan,
                            isCurrentPlan && commonStyles.currentPlanCard
                          )}
                        >
                          {plan.popular && (
                            <div className={cn(commonStyles.popularBadge, themeStyles.popularBadge)}>
                              Most Popular
                            </div>
                          )}
                          <h3 className={cn(commonStyles.planName, themeStyles.planName)}>{plan.name}</h3>
                          <div className={commonStyles.planPrice}>
                            <span className={cn(commonStyles.priceAmount, themeStyles.priceAmount)}>
                              ${price}
                            </span>
                            <span className={cn(commonStyles.pricePeriod, themeStyles.pricePeriod)}>
                              /{billingPeriod === 'yearly' ? 'year' : 'month'}
                            </span>
                          </div>
                          <ul className={commonStyles.featuresList}>
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className={cn(commonStyles.feature, themeStyles.feature)}>
                                <span className={commonStyles.checkIcon}>✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <button
                            className={cn(
                              commonStyles.planButton,
                              themeStyles.planButton,
                              isCurrentPlan && commonStyles.currentButton
                            )}
                            onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                            disabled={isCurrentPlan}
                          >
                            {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                          </button>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </>
            )}

            {activeTab === 'billing' && (
              <ScrollReveal delay={0.3}>
                <div className={cn(commonStyles.billingHistory, themeStyles.billingHistory)}>
                  <table className={commonStyles.billingTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map(item => (
                        <tr key={item.id}>
                          <td>{new Date(item.date).toLocaleDateString()}</td>
                          <td>${item.amount.toFixed(2)}</td>
                          <td>
                            <span className={cn(
                              commonStyles.statusBadge,
                              item.status === 'paid' ? commonStyles.statusPaid : commonStyles.statusPending
                            )}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <a href={item.invoiceUrl} className={commonStyles.invoiceLink}>Download</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollReveal>
            )}
          </>
        )}

        {/* Cancel Confirmation Modal */}
        <Modal isOpen={showCancelConfirm} title="Cancel Subscription" onClose={() => setShowCancelConfirm(false)}>
          <p>Are you sure you want to cancel your subscription? Your plan will remain active until the end of the current billing period.</p>
          <div className={commonStyles.actionRow}>
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>Keep Plan</Button>
            <Button variant="danger" onClick={handleCancel}>Cancel Subscription</Button>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
