// @AI-HINT: Client Contract Detail page - Rich UI with overview cards, progress, milestones, and freelancer info
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { contractsApi as _contractsApi, milestonesApi as _milestonesApi } from '@/lib/api';
import { Button } from '@/app/components/atoms/Button';
import { Badge } from '@/app/components/atoms/Badge';
import Loading from '@/app/components/atoms/Loading/Loading';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { 
  ArrowLeft, DollarSign, Calendar, User, FileText, 
  CheckCircle, Clock, AlertTriangle, ChevronRight,
  MessageSquare, Download, MoreHorizontal, Loader2,
  XCircle, Briefcase
} from 'lucide-react';
import commonStyles from './ContractDetail.common.module.css';
import lightStyles from './ContractDetail.light.module.css';
import darkStyles from './ContractDetail.dark.module.css';

const contractsApi: any = _contractsApi;
const milestonesApi: any = _milestonesApi;

interface Milestone {
  id: number;
  description: string;
  amount: number;
  status: 'pending' | 'active' | 'submitted' | 'approved' | 'paid' | 'rejected';
  due_date?: string;
}

interface Contract {
  id: number;
  title: string;
  freelancer_id: number;
  client_id: number;
  total_budget: number;
  paid_amount?: number;
  status: string;
  start_date: string;
  end_date?: string;
  description?: string;
  milestones: Milestone[];
  freelancer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ContractDetailProps {
  contractId: number;
}

const getMilestoneStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
    case 'approved':
      return <CheckCircle size={16} />;
    case 'submitted':
      return <Clock size={16} />;
    case 'rejected':
      return <XCircle size={16} />;
    case 'active':
      return <Loader2 size={16} className={commonStyles.spinner} />;
    default:
      return <Clock size={16} />;
  }
};

export default function ContractDetail({ contractId }: ContractDetailProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await contractsApi.get(contractId);
        setContract(data);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch contract:', err);
        }
        setError('Failed to load contract details.');
      } finally {
        setLoading(false);
      }
    };

    if (contractId) fetchContract();
  }, [contractId]);

  const handleMilestoneAction = useCallback(async (milestoneId: number, action: 'approve' | 'reject') => {
    setActionLoading(milestoneId);
    try {
      if (action === 'approve') {
        await milestonesApi.approve(milestoneId);
      } else {
        await milestonesApi.reject(milestoneId);
      }
      const data = await contractsApi.get(contractId);
      setContract(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to ${action} milestone:`, err);
      }
    } finally {
      setActionLoading(null);
    }
  }, [contractId]);

  // Contract actions: pause, resume, terminate, file dispute
  const handleContractAction = useCallback(async (action: 'pause' | 'resume' | 'terminate') => {
    if (!contract) return;
    setActionLoading(-1);
    try {
      // API call would happen here
      if (process.env.NODE_ENV === 'development') {
        console.log(`Contract action: ${action} on ${contract.id}`);
      }
      // Simulate successful update
      setContract(prev => prev ? { ...prev, status: action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'terminated' } : null);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to ${action} contract:`, err);
      }
    } finally {
      setActionLoading(null);
    }
  }, [contract]);

  const handleFileDispute = useCallback(async () => {
    if (!disputeReason || !disputeDescription) return;
    setActionLoading(-2);
    try {
      // API call would happen here
      if (process.env.NODE_ENV === 'development') {
        console.log(`Filing dispute: ${disputeReason} - ${disputeDescription}`);
      }
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeDescription('');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to file dispute:', err);
      }
    } finally {
      setActionLoading(null);
    }
  }, [disputeReason, disputeDescription]);

  // Calculations
  const progress = useMemo(() => {
    if (!contract?.milestones?.length) {
      if (['completed', 'done'].includes(contract?.status?.toLowerCase() || '')) return 100;
      return 0;
    }
    const completed = contract.milestones.filter(m => ['paid', 'approved'].includes(m.status)).length;
    return Math.round((completed / contract.milestones.length) * 100);
  }, [contract]);

  const totalPaid = useMemo(() => {
    if (contract?.paid_amount) return contract.paid_amount;
    if (!contract?.milestones?.length) return 0;
    return contract.milestones
      .filter(m => ['paid', 'approved'].includes(m.status))
      .reduce((sum, m) => sum + m.amount, 0);
  }, [contract]);

  const daysRemaining = useMemo(() => {
    if (!contract?.end_date) return null;
    const end = new Date(contract.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [contract]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.loadingState}>
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.error}>
          <div className={cn(commonStyles.errorIcon, themeStyles.errorIcon)}>
            <AlertTriangle size={32} />
          </div>
          <h2 className={cn(commonStyles.errorTitle, themeStyles.errorTitle)}>
            {error || 'Contract not found'}
          </h2>
          <p className={cn(commonStyles.errorText, themeStyles.errorText)}>
            The contract you&apos;re looking for could not be loaded. It may have been removed or you may not have access.
          </p>
          <Button variant="primary" iconBefore={<ArrowLeft size={16} />} onClick={() => router.push('/client/contracts')}>
            Back to Contracts
          </Button>
        </div>
      </div>
    );
  }

  const initials = contract.freelancer?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Breadcrumb */}
        <nav className={cn(commonStyles.breadcrumb, themeStyles.breadcrumb)} aria-label="Breadcrumb">
          <Link href="/client/contracts" className={cn(commonStyles.breadcrumbLink, themeStyles.breadcrumbLink)}>
            <Briefcase size={14} /> Contracts
          </Link>
          <span className={commonStyles.breadcrumbSep}><ChevronRight size={14} /></span>
          <span className={commonStyles.breadcrumbCurrent}>{contract.title}</span>
        </nav>

        {/* Header */}
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div className={commonStyles.headerInfo}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>{contract.title}</h1>
              <div className={commonStyles.headerMeta}>
                <Badge variant={
                  ['active', 'in_progress'].includes(contract.status?.toLowerCase()) ? 'success' :
                  ['completed', 'done'].includes(contract.status?.toLowerCase()) ? 'primary' :
                  contract.status?.toLowerCase() === 'cancelled' ? 'danger' : 'default'
                }>
                  {contract.status?.replace('_', ' ')}
                </Badge>
                <span className={cn(commonStyles.overviewSub, themeStyles.overviewSub)}>
                  <Calendar size={14} className={commonStyles.inlineIcon} />
                  Started {new Date(contract.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="secondary" size="md" iconBefore={<MessageSquare size={16} />}>
                Message
              </Button>
              <Button variant="secondary" size="md" iconBefore={<Download size={16} />}>
                Export
              </Button>
              {contract.status?.toLowerCase() === 'active' && (
                <>
                  <Button variant="ghost" size="md" onClick={() => handleContractAction('pause')}>
                    Pause
                  </Button>
                  <Button variant="danger" size="md" onClick={() => handleContractAction('terminate')}>
                    Terminate
                  </Button>
                </>
              )}
              {contract.status?.toLowerCase() === 'paused' && (
                <Button variant="success" size="md" onClick={() => handleContractAction('resume')}>
                  Resume
                </Button>
              )}
              <Button variant="danger" size="md" onClick={() => setShowDisputeModal(true)}>
                File Dispute
              </Button>
            </div>
          </header>
        </ScrollReveal>

        {/* Overview Cards */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.overviewGrid}>
            <div className={cn(commonStyles.overviewCard, themeStyles.overviewCard)}>
              <span className={cn(commonStyles.overviewLabel, themeStyles.overviewLabel)}>
                <DollarSign size={16} /> Total Budget
              </span>
              <span className={cn(commonStyles.overviewValue, themeStyles.overviewValue)}>
                ${contract.total_budget?.toLocaleString() || '0'}
              </span>
            </div>
            <div className={cn(commonStyles.overviewCard, themeStyles.overviewCard)}>
              <span className={cn(commonStyles.overviewLabel, themeStyles.overviewLabel)}>
                <CheckCircle size={16} /> Amount Paid
              </span>
              <span className={cn(commonStyles.overviewValue, themeStyles.overviewValue)}>
                ${totalPaid.toLocaleString()}
              </span>
              <span className={cn(commonStyles.overviewSub, themeStyles.overviewSub)}>
                {contract.total_budget ? `${Math.round((totalPaid / contract.total_budget) * 100)}%` : '0%'} of budget
              </span>
            </div>
            <div className={cn(commonStyles.overviewCard, themeStyles.overviewCard)}>
              <span className={cn(commonStyles.overviewLabel, themeStyles.overviewLabel)}>
                <FileText size={16} /> Milestones
              </span>
              <span className={cn(commonStyles.overviewValue, themeStyles.overviewValue)}>
                {contract.milestones?.filter(m => ['paid', 'approved'].includes(m.status)).length || 0}/{contract.milestones?.length || 0}
              </span>
              <span className={cn(commonStyles.overviewSub, themeStyles.overviewSub)}>Completed</span>
            </div>
            <div className={cn(commonStyles.overviewCard, themeStyles.overviewCard)}>
              <span className={cn(commonStyles.overviewLabel, themeStyles.overviewLabel)}>
                <Clock size={16} /> {daysRemaining !== null ? 'Days Remaining' : 'Duration'}
              </span>
              <span className={cn(commonStyles.overviewValue, themeStyles.overviewValue)}>
                {daysRemaining !== null ? (daysRemaining > 0 ? daysRemaining : 'Overdue') : 'Ongoing'}
              </span>
              {contract.end_date && (
                <span className={cn(commonStyles.overviewSub, themeStyles.overviewSub)}>
                  Due {new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Progress Bar */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.progressSection, themeStyles.progressSection)}>
            <div className={commonStyles.progressHeader}>
              <span className={cn(commonStyles.progressTitle, themeStyles.progressTitle)}>Overall Progress</span>
              <span className={cn(commonStyles.progressPercent, themeStyles.progressPercent)}>{progress}%</span>
            </div>
            <div className={cn(commonStyles.progressBarLarge, themeStyles.progressBarLarge)}>
              <div 
                className={cn(commonStyles.progressFillLarge, themeStyles.progressFillLarge)} 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className={commonStyles.progressInfo}>
              <span className={themeStyles.progressInfo}>
                ${totalPaid.toLocaleString()} paid of ${contract.total_budget?.toLocaleString() || '0'}
              </span>
              <span className={themeStyles.progressInfo}>
                {contract.milestones?.filter(m => m.status === 'submitted').length || 0} awaiting review
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Content Grid: Milestones + Sidebar */}
        <div className={commonStyles.contentGrid}>
          {/* Milestones Section */}
          <ScrollReveal delay={0.2}>
            <div className={cn(commonStyles.section, themeStyles.section)}>
              <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                <FileText size={18} /> Milestones
              </h2>
              <div className={commonStyles.milestoneList}>
                {contract.milestones && contract.milestones.length > 0 ? (
                  <StaggerContainer>
                    {contract.milestones.map((milestone, idx) => (
                      <StaggerItem key={milestone.id}>
                        <div className={cn(commonStyles.milestoneItem, themeStyles.milestoneItem)}>
                          <div className={commonStyles.milestoneInfo}>
                            <div className={commonStyles.milestoneDesc}>
                              <span className={cn(commonStyles.milestoneNumber, themeStyles.milestoneNumber)}>
                                {idx + 1}
                              </span>
                              {milestone.description}
                            </div>
                            <div className={cn(commonStyles.milestoneMeta, themeStyles.milestoneMeta)}>
                              <span><DollarSign size={12} /> ${milestone.amount.toLocaleString()}</span>
                              {milestone.due_date && (
                                <span>
                                  <Calendar size={12} /> Due: {new Date(milestone.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={commonStyles.milestoneActions}>
                            <span className={cn(commonStyles.statusBadge, commonStyles[milestone.status])}>
                              {getMilestoneStatusIcon(milestone.status)}
                              {milestone.status}
                            </span>
                            
                            {milestone.status === 'submitted' && (
                              <div className={commonStyles.actionButtons}>
                                <Button 
                                  variant="success" 
                                  size="sm" 
                                  isLoading={actionLoading === milestone.id}
                                  onClick={() => handleMilestoneAction(milestone.id, 'approve')}
                                >
                                  Approve & Pay
                                </Button>
                                <Button 
                                  variant="danger" 
                                  size="sm" 
                                  isLoading={actionLoading === milestone.id}
                                  onClick={() => handleMilestoneAction(milestone.id, 'reject')}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                ) : (
                  <div className={commonStyles.emptyState}>
                    <FileText size={24} className={commonStyles.emptyIcon} />
                    <p>No milestones defined for this contract.</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Sidebar */}
          <div>
            {/* Freelancer Card */}
            <ScrollReveal delay={0.25}>
              <div className={cn(commonStyles.section, themeStyles.section, commonStyles.sectionSpacing)}>
                <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  <User size={18} /> Freelancer
                </h2>
                <div className={cn(commonStyles.freelancerCard, themeStyles.freelancerCard)}>
                  <div className={cn(commonStyles.freelancerAvatar, themeStyles.freelancerAvatar)}>
                    {initials}
                  </div>
                  <div className={commonStyles.freelancerInfo}>
                    <div className={cn(commonStyles.freelancerName, themeStyles.freelancerName)}>
                      {contract.freelancer?.full_name || 'Unknown'}
                    </div>
                    <div className={cn(commonStyles.freelancerEmail, themeStyles.freelancerEmail)}>
                      {contract.freelancer?.email || ''}
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" fullWidth iconBefore={<MessageSquare size={14} />}>
                  Send Message
                </Button>
              </div>
            </ScrollReveal>

            {/* Contract Details */}
            <ScrollReveal delay={0.3}>
              <div className={cn(commonStyles.section, themeStyles.section)}>
                <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                  <Briefcase size={18} /> Details
                </h2>
                <div className={commonStyles.detailsGrid}>
                  <div className={commonStyles.detailItem}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Contract ID</span>
                    <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>#{contract.id}</span>
                  </div>
                  <div className={commonStyles.detailItem}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Status</span>
                    <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                      {contract.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={commonStyles.detailItem}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>Start Date</span>
                    <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                      {new Date(contract.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={commonStyles.detailItem}>
                    <span className={cn(commonStyles.detailLabel, themeStyles.detailLabel)}>End Date</span>
                    <span className={cn(commonStyles.detailValue, themeStyles.detailValue)}>
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Ongoing'}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Footer */}
        <div className={commonStyles.footer}>
          <Button variant="outline" iconBefore={<ArrowLeft size={16} />} onClick={() => router.push('/client/contracts')}>
            Back to Contracts
          </Button>
        </div>

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className={cn(commonStyles.modal, commonStyles.modalOverlay)} role="dialog" aria-modal="true">
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>File a Dispute</h2>
                <button
                  className={commonStyles.modalClose}
                  onClick={() => setShowDisputeModal(false)}
                  aria-label="Close dispute modal"
                >
                  ×
                </button>
              </div>

              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Reason for Dispute</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className={cn(commonStyles.select, themeStyles.select)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="quality">Quality Issues</option>
                    <option value="incomplete">Incomplete Work</option>
                    <option value="missed_deadline">Missed Deadline</option>
                    <option value="communication">Communication Issues</option>
                    <option value="payment">Payment Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Description</label>
                  <textarea
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    rows={5}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>
              </div>

              <div className={commonStyles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowDisputeModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleFileDispute}
                  disabled={!disputeReason || !disputeDescription}
                  isLoading={actionLoading === -2}
                >
                  File Dispute
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
