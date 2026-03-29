// @AI-HINT: Admin platform compliance management for GDPR, data retention, and regulatory requirements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Select from '@/app/components/molecules/Select/Select';
import Badge from '@/app/components/atoms/Badge/Badge';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import Loader from '@/app/components/atoms/Loader/Loader';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import { Shield, RefreshCw, FileText, Clock, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api/core';
import commonStyles from './Compliance.common.module.css';
import lightStyles from './Compliance.light.module.css';
import darkStyles from './Compliance.dark.module.css';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'gdpr' | 'data_retention' | 'security' | 'financial' | 'accessibility';
  status: 'compliant' | 'non_compliant' | 'needs_review' | 'not_applicable';
  last_checked: string;
  next_review: string;
  automated: boolean;
  notes?: string;
}

interface DataRetentionPolicy {
  id: string;
  data_type: string;
  retention_period: number;
  period_unit: 'days' | 'months' | 'years';
  action: 'delete' | 'anonymize' | 'archive';
  is_active: boolean;
  last_run?: string;
  records_affected?: number;
}

interface ComplianceReport {
  id: string;
  type: string;
  generated_at: string;
  status: 'ready' | 'generating' | 'failed';
  download_url?: string;
}

interface DataRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  user_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  submitted_at: string;
  completed_at?: string;
  deadline: string;
}

type TabType = 'overview' | 'retention' | 'requests' | 'reports';

export default function CompliancePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Attempt to fetch compliance data from backend
      const [rulesRes, policiesRes, requestsRes, reportsRes] = await Promise.allSettled([
        apiFetch('/compliance/rules'),
        apiFetch('/compliance/retention-policies'),
        apiFetch('/compliance/data-requests'),
        apiFetch('/compliance/reports')
      ]);

      if (rulesRes.status === 'fulfilled') {
        setRules(rulesRes.value as any);
      }
      if (policiesRes.status === 'fulfilled') {
        setPolicies(policiesRes.value as any);
      }
      if (requestsRes.status === 'fulfilled') {
        setDataRequests(requestsRes.value as any);
      }
      if (reportsRes.status === 'fulfilled') {
        setReports(reportsRes.value as any);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load compliance data', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'default' | 'info' => {
    switch (status) {
      case 'compliant': case 'completed': return 'success';
      case 'non_compliant': case 'rejected': return 'default';
      case 'needs_review': case 'pending': case 'in_progress': return 'warning';
      default: return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredRules = selectedCategory === 'all' 
    ? rules 
    : rules.filter(r => r.category === selectedCategory);

  const compliantCount = rules.filter(r => r.status === 'compliant').length;
  const issueCount = rules.filter(r => r.status === 'non_compliant' || r.status === 'needs_review').length;

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'gdpr', label: 'GDPR' },
    { value: 'security', label: 'Security' },
    { value: 'financial', label: 'Financial' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'data_retention', label: 'Data Retention' }
  ];

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Compliance Center</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage regulatory compliance, data retention, and privacy requests
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="outline" onClick={() => { loadComplianceData(); showToast('Data refreshed'); }}>
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
          </header>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <Shield size={20} className={commonStyles.statIconGreen} />
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{compliantCount}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Compliant</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <AlertTriangle size={20} className={commonStyles.statIconYellow} />
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{issueCount}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Issues</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <Clock size={20} className={commonStyles.statIconBlue} />
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{dataRequests.filter(r => r.status === 'pending').length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending Requests</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <FileText size={20} className={commonStyles.statIconPurple} />
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{reports.length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Reports</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            {(['overview', 'retention', 'requests', 'reports'] as TabType[]).map((tab) => (
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

        {loading ? (
          <div className={commonStyles.loading}><Loader size="lg" /></div>
        ) : (
          <div className={commonStyles.content}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <ScrollReveal delay={0.2}>
                  <div className={commonStyles.filterBar}>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      options={categoryOptions}
                    />
                  </div>
                </ScrollReveal>

                {filteredRules.length === 0 ? (
                  <EmptyState
                    title="No compliance rules"
                    description="No compliance rules have been configured yet. They will appear here when the compliance API is connected."
                  />
                ) : (
                  <StaggerContainer className={commonStyles.rulesList}>
                    {filteredRules.map((rule) => (
                      <StaggerItem key={rule.id} className={cn(commonStyles.ruleCard, themeStyles.ruleCard)}>
                        <div className={commonStyles.ruleHeader}>
                          <div>
                            <h4 className={cn(commonStyles.ruleName, themeStyles.ruleName)}>{rule.name}</h4>
                            <Badge variant="info">{rule.category.toUpperCase()}</Badge>
                          </div>
                          <Badge variant={getStatusBadgeVariant(rule.status)}>
                            {getStatusLabel(rule.status)}
                          </Badge>
                        </div>
                        <p className={cn(commonStyles.ruleDesc, themeStyles.ruleDesc)}>{rule.description}</p>
                        <div className={cn(commonStyles.ruleMeta, themeStyles.ruleMeta)}>
                          <span>Last checked: {new Date(rule.last_checked).toLocaleDateString()}</span>
                          <span>Next review: {new Date(rule.next_review).toLocaleDateString()}</span>
                          <Badge variant={rule.automated ? 'info' : 'default'}>
                            {rule.automated ? '🤖 Automated' : '👤 Manual'}
                          </Badge>
                        </div>
                        {rule.notes && (
                          <div className={cn(commonStyles.ruleNotes, themeStyles.ruleNotes)}>
                            Note: {rule.notes}
                          </div>
                        )}
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </>
            )}

            {/* Retention Tab */}
            {activeTab === 'retention' && (
              policies.length === 0 ? (
                <EmptyState
                  title="No retention policies"
                  description="Data retention policies will appear here when configured."
                />
              ) : (
                <StaggerContainer className={commonStyles.policiesList}>
                  {policies.map((policy) => (
                    <StaggerItem key={policy.id} className={cn(commonStyles.policyCard, themeStyles.policyCard)}>
                      <div className={commonStyles.policyHeader}>
                        <h4 className={cn(commonStyles.policyName, themeStyles.policyName)}>{policy.data_type}</h4>
                        <Badge variant={policy.is_active ? 'success' : 'default'}>
                          {policy.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <div className={commonStyles.policyDetails}>
                        <div className={commonStyles.policyDetail}>
                          <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Retention</span>
                          <span>{policy.retention_period} {policy.period_unit}</span>
                        </div>
                        <div className={commonStyles.policyDetail}>
                          <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Action</span>
                          <Badge variant="info">{policy.action.toUpperCase()}</Badge>
                        </div>
                        <div className={commonStyles.policyDetail}>
                          <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Last Run</span>
                          <span>{policy.last_run ? new Date(policy.last_run).toLocaleDateString() : 'Never'}</span>
                        </div>
                        <div className={commonStyles.policyDetail}>
                          <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Records</span>
                          <span>{policy.records_affected || 0}</span>
                        </div>
                      </div>
                      <div className={commonStyles.policyActions}>
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Run Now</Button>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              dataRequests.length === 0 ? (
                <EmptyState
                  title="No data requests"
                  description="Data subject requests (DSR) will appear here when submitted."
                />
              ) : (
                <StaggerContainer className={commonStyles.requestsList}>
                  {dataRequests.map((request) => (
                    <StaggerItem key={request.id} className={cn(commonStyles.requestCard, themeStyles.requestCard)}>
                      <div className={commonStyles.requestHeader}>
                        <div className={commonStyles.requestMeta}>
                          <Badge variant="info">{request.id}</Badge>
                          <Badge variant="default">{request.type.toUpperCase()}</Badge>
                        </div>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className={cn(commonStyles.requestEmail, themeStyles.requestEmail)}>
                        {request.user_email}
                      </p>
                      <div className={cn(commonStyles.ruleMeta, themeStyles.ruleMeta)}>
                        <span>Submitted: {new Date(request.submitted_at).toLocaleDateString()}</span>
                        <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
                        {request.completed_at && <span>Completed: {new Date(request.completed_at).toLocaleDateString()}</span>}
                      </div>
                      {request.status === 'pending' && (
                        <div className={commonStyles.requestActions}>
                          <Button variant="primary" size="sm">Process Request</Button>
                        </div>
                      )}
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              reports.length === 0 ? (
                <EmptyState
                  title="No reports"
                  description="Compliance reports will appear here when generated."
                />
              ) : (
                <StaggerContainer className={commonStyles.reportsList}>
                  {reports.map((report) => (
                    <StaggerItem key={report.id} className={cn(commonStyles.reportCard, themeStyles.reportCard)}>
                      <div>
                        <h4 className={cn(commonStyles.reportName, themeStyles.reportName)}>{report.type}</h4>
                        <span className={cn(commonStyles.reportDate, themeStyles.reportDate)}>
                          {new Date(report.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={commonStyles.reportActions}>
                        {report.status === 'ready' ? (
                          <Button variant="outline" size="sm">Download PDF</Button>
                        ) : report.status === 'generating' ? (
                          <Badge variant="warning">Generating...</Badge>
                        ) : (
                          <Badge variant="default">Failed</Badge>
                        )}
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
