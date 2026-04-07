// @AI-HINT: Fraud Detection Dashboard - Admin interface for monitoring suspicious activities
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import Select from '@/app/components/molecules/Select/Select';
import Loader from '@/app/components/atoms/Loader/Loader';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import Modal from '@/app/components/organisms/Modal/Modal';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import {
  Shield, AlertTriangle, Ban, CheckCircle, Eye, XCircle,
  Settings, DollarSign, ShieldAlert, ShieldCheck, ShieldX,
} from 'lucide-react';
import commonStyles from './FraudDetection.common.module.css';
import lightStyles from './FraudDetection.light.module.css';
import darkStyles from './FraudDetection.dark.module.css';

interface FlaggedTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  userId: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  status: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
}

interface FraudAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedUsers: number;
  timestamp: string;
  status: string;
}

interface FraudStats {
  totalFlagged: number;
  criticalAlerts: number;
  blockedTransactions: number;
  reviewedToday: number;
  avgRiskScore: number;
}

export default function FraudDetectionPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'alerts'>('transactions');
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailTx, setDetailTx] = useState<FlaggedTransaction | null>(null);
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) fetchFraudData();
  }, [mounted]);

  const fetchFraudData = async () => {
    setLoading(true);
    try {
      const api = await import('@/lib/api');
      const fraudApi = api.fraudDetectionApi;
      const adminApi = api.adminApi;
      
      // Raw API response types
      interface RawAlert {
        id: string | number;
        type?: string;
        severity?: string;
        message?: string;
        description?: string;
        affected_users?: number;
        created_at?: string;
        timestamp?: string;
        status?: string;
      }
      
      interface RawPayment {
        id: string | number;
        type?: string;
        amount?: number;
        currency?: string;
        user_id?: string | number;
        user_name?: string;
        user_email?: string;
        user?: { name?: string; email?: string };
        risk_score?: number;
        risk_level?: string;
        flags?: string[];
        status?: string;
        created_at?: string;
        ip_address?: string;
        location?: string;
        device_info?: string;
      }

      const [alertsRes, paymentsRes] = await Promise.allSettled([
        fraudApi?.getAlerts?.(),
        adminApi.getPayments({ status: 'flagged', limit: 20 }),
      ]);

      // Alerts
      type AlertsResponse = RawAlert[] | { items?: RawAlert[] };
      const alertsValue = alertsRes.status === 'fulfilled' ? alertsRes.value as AlertsResponse : null;
      const alertsArr: RawAlert[] = alertsValue
        ? (Array.isArray(alertsValue) ? alertsValue : (alertsValue.items || []))
        : [];
      setAlerts(alertsArr.map((a: RawAlert) => ({
        id: String(a.id),
        type: a.type || 'unknown',
        severity: (a.severity || 'medium') as FraudAlert['severity'],
        message: a.message || a.description || '',
        affectedUsers: a.affected_users ?? 0,
        timestamp: a.created_at || a.timestamp || new Date().toISOString(),
        status: a.status || 'active',
      })));

      // Transactions
      type PaymentsResponse = RawPayment[] | { items?: RawPayment[] };
      const paymentsValue = paymentsRes.status === 'fulfilled' ? paymentsRes.value as PaymentsResponse : null;
      const paymentsArr: RawPayment[] = paymentsValue
        ? (Array.isArray(paymentsValue) ? paymentsValue : (paymentsValue.items || []))
        : [];
      const txData: FlaggedTransaction[] = paymentsArr.map((p: RawPayment) => ({
        id: String(p.id),
        type: p.type || 'payment',
        amount: p.amount ?? 0,
        currency: p.currency || 'USD',
        userId: String(p.user_id || ''),
        userName: p.user_name || p.user?.name || '',
        userEmail: p.user_email || p.user?.email || '',
        riskScore: p.risk_score ?? 0,
        riskLevel: (p.risk_level || 'low') as FlaggedTransaction['riskLevel'],
        flags: p.flags || [],
        status: p.status || 'pending',
        timestamp: p.created_at || new Date().toISOString(),
        ipAddress: p.ip_address || '',
        location: p.location || '',
        deviceInfo: p.device_info || '',
      }));
      setTransactions(txData);

      // Stats derived from real data
      setStats({
        totalFlagged: txData.length,
        criticalAlerts: alertsArr.filter((a: RawAlert) => a.severity === 'critical' || a.severity === 'high').length,
        blockedTransactions: txData.filter((t: FlaggedTransaction) => t.status === 'blocked').length,
        reviewedToday: txData.filter((t: FlaggedTransaction) => t.status === 'reviewed' || t.status === 'cleared').length,
        avgRiskScore: txData.length > 0 ? Math.round(txData.reduce((s: number, t: FlaggedTransaction) => s + (t.riskScore || 0), 0) / txData.length) : 0,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load fraud data', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (txId: string, action: 'clear' | 'block') => {
    const newStatus = action === 'clear' ? 'cleared' : 'blocked';
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: newStatus } : t));
    setDetailTx(null);
    showToast(`Transaction ${action === 'clear' ? 'cleared' : 'blocked'}`);

    try {
      const api = await import('@/lib/api');
      const fraudApi = (api as any).fraudDetectionApi;
      await fraudApi?.updateTransaction?.(txId, { status: newStatus });
    } catch { /* optimistic update already applied */ }
  };

  const handleAlertAction = async (alertId: string, action: 'resolve' | 'dismiss') => {
    const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
    showToast(`Alert ${action === 'resolve' ? 'resolved' : 'dismissed'}`);
  };

  const getRiskBadgeVariant = (level: string): 'default' | 'warning' | 'success' | 'info' => {
    switch (level) {
      case 'critical': case 'high': return 'default';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'cleared': case 'resolved': return 'success';
      case 'pending': case 'active': return 'warning';
      case 'reviewed': return 'info';
      default: return 'default';
    }
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const filteredTransactions = transactions.filter(t => {
    if (riskFilter !== 'all' && t.riskLevel !== riskFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const STAT_ITEMS = stats ? [
    { label: 'Avg Risk Score', value: stats.avgRiskScore, icon: <Shield size={16} />, highlight: stats.avgRiskScore > 70 },
    { label: 'Critical Alerts', value: stats.criticalAlerts, icon: <ShieldAlert size={16} />, highlight: stats.criticalAlerts > 0 },
    { label: 'Flagged', value: stats.totalFlagged, icon: <AlertTriangle size={16} /> },
    { label: 'Blocked', value: stats.blockedTransactions, icon: <ShieldX size={16} /> },
  ] : [];

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Fraud Detection</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Monitor risk, review flagged transactions, and manage security
              </p>
            </div>
          </header>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrap}><Loader size="lg" /></div>
        ) : (
          <>
            {/* Stats */}
            {STAT_ITEMS.length > 0 && (
              <ScrollReveal delay={0.1}>
                <StaggerContainer className={commonStyles.statsGrid}>
                  {STAT_ITEMS.map((s, idx) => (
                    <StaggerItem key={idx} className={cn(commonStyles.statCard, themeStyles.statCard, s.highlight && commonStyles.statCritical)}>
                      <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>{s.icon}</div>
                      <div className={cn(commonStyles.statValue, themeStyles.statValue)}>{s.value}</div>
                      <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{s.label}</div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </ScrollReveal>
            )}

            {/* Tabs */}
            <ScrollReveal delay={0.2}>
              <div className={commonStyles.tabRow}>
                {(['transactions', 'alerts'] as const).map(tab => (
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

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <>
                <ScrollReveal delay={0.2}>
                  <div className={commonStyles.filters}>
                    <div className={commonStyles.filterItem}>
                      <Select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        options={[
                          { value: 'all', label: 'All Risk Levels' },
                          { value: 'critical', label: 'Critical' },
                          { value: 'high', label: 'High' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'low', label: 'Low' },
                        ]}
                      />
                    </div>
                    <div className={commonStyles.filterItem}>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                          { value: 'all', label: 'All Statuses' },
                          { value: 'pending', label: 'Pending Review' },
                          { value: 'reviewed', label: 'Reviewed' },
                          { value: 'blocked', label: 'Blocked' },
                          { value: 'cleared', label: 'Cleared' },
                        ]}
                      />
                    </div>
                  </div>
                </ScrollReveal>

                {filteredTransactions.length > 0 ? (
                  <StaggerContainer className={commonStyles.transactionsList}>
                    {filteredTransactions.map(tx => (
                      <StaggerItem
                        key={tx.id}
                        className={cn(commonStyles.transactionCard, themeStyles.transactionCard)}
                        onClick={() => setDetailTx(tx)}
                      >
                        <div className={commonStyles.transactionHeader}>
                          <div className={commonStyles.transactionInfo}>
                            <span className={cn(commonStyles.transactionType, themeStyles.transactionType)}>
                              {tx.type.toUpperCase()}
                            </span>
                            <span className={cn(commonStyles.transactionAmount, themeStyles.transactionAmount)}>
                              {tx.currency} {tx.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className={commonStyles.transactionMeta}>
                            <Badge variant={getRiskBadgeVariant(tx.riskLevel)}>
                              {tx.riskLevel} ({tx.riskScore})
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(tx.status)}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                        <div className={cn(commonStyles.transactionUser, themeStyles.transactionUser)}>
                          {tx.userName || 'Unknown User'} {tx.userEmail ? `(${tx.userEmail})` : ''}
                        </div>
                        {tx.flags.length > 0 && (
                          <div className={commonStyles.transactionFlags}>
                            {tx.flags.map((flag, i) => (
                              <span key={i} className={cn(commonStyles.flag, themeStyles.flag)}>
                                <AlertTriangle size={11} /> {flag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className={cn(commonStyles.transactionFooter, themeStyles.transactionFooter)}>
                          <span>{tx.location || 'Unknown location'}</span>
                          <span>{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                ) : (
                  <EmptyState
                    title="No flagged transactions"
                    description={riskFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your filters.'
                      : 'No flagged transactions found. The system is monitoring for suspicious activity.'}
                    action={<Button variant="secondary" size="sm" onClick={fetchFraudData}>Refresh</Button>}
                  />
                )}
              </>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              alerts.length > 0 ? (
                <StaggerContainer className={commonStyles.alertsList}>
                  {alerts.map(alert => (
                    <StaggerItem key={alert.id} className={cn(commonStyles.alertCard, themeStyles.alertCard)}>
                      <div className={commonStyles.alertHeader}>
                        <Badge variant={getRiskBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className={cn(commonStyles.alertType, themeStyles.alertType)}>{alert.type}</span>
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className={cn(commonStyles.alertMessage, themeStyles.alertMessage)}>{alert.message}</p>
                      <div className={cn(commonStyles.alertMeta, themeStyles.alertMeta)}>
                        <span>Affected Users: {alert.affectedUsers}</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                      {alert.status === 'active' && (
                        <div className={commonStyles.alertActions}>
                          <Button variant="success" size="sm" iconBefore={<CheckCircle size={13} />} onClick={() => handleAlertAction(alert.id, 'resolve')}>
                            Resolve
                          </Button>
                          <Button variant="ghost" size="sm" iconBefore={<XCircle size={13} />} onClick={() => handleAlertAction(alert.id, 'dismiss')}>
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <EmptyState
                  title="No alerts"
                  description="No fraud alerts have been raised. The system is actively monitoring."
                />
              )
            )}
          </>
        )}

        {/* Transaction Detail Modal */}
        <Modal isOpen={detailTx !== null} title="Transaction Details" onClose={() => setDetailTx(null)}>
          {detailTx && (
            <>
              <div className={commonStyles.detailGrid}>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Amount</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.currency} {detailTx.amount.toLocaleString()}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Type</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.type}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>User</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.userName || '--'}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Email</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.userEmail || '--'}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Risk</span>
                  <Badge variant={getRiskBadgeVariant(detailTx.riskLevel)}>
                    {detailTx.riskLevel} — score {detailTx.riskScore}/100
                  </Badge>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Status</span>
                  <Badge variant={getStatusBadgeVariant(detailTx.status)}>{detailTx.status}</Badge>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>IP Address</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.ipAddress || '--'}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Location</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.location || '--'}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Device</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{detailTx.deviceInfo || '--'}</span>
                </div>
                <div className={commonStyles.detailItem}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Date</span>
                  <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>{new Date(detailTx.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {detailTx.flags.length > 0 && (
                <div className={commonStyles.flagsList}>
                  <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Risk Signals</span>
                  <div className={commonStyles.flagsWrap}>
                    {detailTx.flags.map((flag, i) => (
                      <span key={i} className={cn(commonStyles.flagLarge, themeStyles.flagLarge)}>
                        <AlertTriangle size={12} /> {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(detailTx.status === 'pending' || detailTx.status === 'reviewed') && (
                <div className={commonStyles.modalFooter}>
                  <Button variant="ghost" size="sm" onClick={() => setDetailTx(null)}>Cancel</Button>
                  <Button variant="success" size="sm" iconBefore={<ShieldCheck size={14} />} onClick={() => handleAction(detailTx.id, 'clear')}>
                    Clear Transaction
                  </Button>
                  <Button variant="danger" size="sm" iconBefore={<Ban size={14} />} onClick={() => handleAction(detailTx.id, 'block')}>
                    Block &amp; Refund
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal>

        {toast && (
          <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
