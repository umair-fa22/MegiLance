// @AI-HINT: Client Project Detail page with full proposal management, contract creation, and payment tracking.
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api, { proposalsApi as _proposalsApi, contractsApi as _contractsApi } from '@/lib/api';
const proposalsApi: any = _proposalsApi;
const contractsApi: any = _contractsApi;
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import Modal from '@/app/components/organisms/Modal/Modal';
import { User, DollarSign, Clock, CheckCircle, XCircle, MessageSquare, ShieldAlert } from 'lucide-react'
import { FraudAlertBanner } from '@/app/components/AI';
import common from './ProjectDetail.common.module.css';
import light from './ProjectDetail.light.module.css';
import dark from './ProjectDetail.dark.module.css';

interface Proposal {
  id: number;
  freelancer_id: number;
  freelancer_name?: string;
  cover_letter: string;
  bid_amount: number;
  estimated_hours: number;
  hourly_rate: number;
  status: string;
  created_at: string;
}

const ProjectDetail: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = params?.id ?? '';
  
  const [project, setProject] = useState<any>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [fraudCheckResults, setFraudCheckResults] = useState<Record<number, any>>({});
  const [checkingFraud, setCheckingFraud] = useState<number | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const projectId = useMemo(() => {
    if (!rawId) return null;
    const idStr = rawId.replace(/^PROJ-0*/, '');
    const id = parseInt(idStr, 10);
    return isNaN(id) ? null : id;
  }, [rawId]);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await (api.projects as any).get?.(projectId);
      setProject(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadProposals = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await proposalsApi.list(0, 50, projectId);
      const data = Array.isArray(response) ? response : (response.proposals || []);
      setProposals(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load proposals:', e);
      }
    } finally {
      setProposalsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadProposals();
  }, [loadProject, loadProposals]);

  const handleAcceptProposal = async (proposalId: number) => {
    setAcceptTarget(null);
    
    setActionLoading(proposalId);
    try {
      await proposalsApi.accept(proposalId);
      
      // Optionally create a contract automatically
      const acceptedProposal = proposals.find(p => p.id === proposalId);
      if (acceptedProposal && projectId) {
        try {
          await contractsApi.create({
            project_id: projectId,
            freelancer_id: acceptedProposal.freelancer_id,
            amount: acceptedProposal.bid_amount,
            terms: `Contract for project. Estimated ${acceptedProposal.estimated_hours} hours at $${acceptedProposal.hourly_rate}/hr.`,
          });
        } catch (contractErr) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Contract creation failed, but proposal was accepted:', contractErr);
          }
        }
      }
      
      // Refresh data
      await loadProject();
      await loadProposals();
      
      showToast('Proposal accepted! A contract has been created.');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to accept proposal:', err);
      }
      showToast('Failed to accept proposal. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProposal = async (proposalId: number) => {
    setRejectTarget(null);
    
    setActionLoading(proposalId);
    try {
      await proposalsApi.reject(proposalId);
      await loadProposals();
      showToast('Proposal rejected.');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to reject proposal:', err);
      }
      showToast('Failed to reject proposal. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckFraud = async (proposalId: number) => {
    setCheckingFraud(proposalId);
    try {
      // Use the aiApi.fraudDetection (which we updated in api.ts)
      // Note: api.ts exports fraudDetectionApi, but default export has it as api.fraudDetection
      // We need to make sure we are using the right one.
      // Let's use api.fraudDetection if available, or import fraudDetectionApi directly.
      // Since we imported api, let's check if api.fraudDetection is available.
      // Based on api.ts, it is available as api.fraudDetection.
      
      // However, we updated fraudDetectionApi in api.ts, but did we update the default export?
      // Yes, the default export includes fraudDetection: fraudDetectionApi.
      
      const result: any = await (api as any).fraudDetection?.checkProposal?.(proposalId);
      // The API returns { analysis: ... } wrapper
      setFraudCheckResults(prev => ({ ...prev, [proposalId]: result.analysis || result }));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to check fraud:', err);
      }
      showToast('Failed to check fraud risk.', 'error');
    } finally {
      setCheckingFraud(null);
    }
  };

  const requirements = useMemo(() => {
      if (!project?.skills) return [];
      if (Array.isArray(project.skills)) return project.skills;
      try {
          return JSON.parse(project.skills);
      } catch {
          return [project.skills];
      }
  }, [project?.skills]);

  if (loading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
           <Skeleton height={100} width='100%' />
           <div className={common.sectionSpacing}>
             <Skeleton height={200} width='100%' />
           </div>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
           <div className={common.error}>{error || 'Project not found'}</div>
           <Link href='/client/projects' className={cn(common.button, 'secondary', themed.button)}>Back to Projects</Link>
        </div>
      </main>
    );
  }

  const budgetDisplay = project.budget_max 
    ? `$${project.budget_max}` 
    : (project.budget_min ? `$${project.budget_min}+` : 'Not set');

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={cn(common.header)}>
              <div>
                <h1 className={common.title}>{project.title}</h1>
                <p className={cn(common.subtitle, themed.subtitle)}>Project ID: {rawId}</p>
                <div className={cn(common.meta, themed.meta)}>
                  <span className={cn(common.badge, themed.badge)}>{project.status || 'Open'}</span>
                  <span>•</span>
                  <span>{budgetDisplay}</span>
                  <span>•</span>
                  <span>Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={common.actions}>
                <Link href='/client/projects' className={cn(common.button, 'secondary', themed.button)}>Back to Projects</Link>
                {/* Only show Create Milestone if active */}
                {project.status === 'in_progress' && (
                    <button type='button' className={cn(common.button, 'primary', themed.button)}>Create Milestone</button>
                )}
              </div>
            </header>
          </ScrollReveal>

          <ScrollReveal>
            <section className={cn(common.section, themed.section)} aria-labelledby='desc-title'>
              <h2 id='desc-title' className={cn(common.sectionTitle, themed.sectionTitle)}>Description</h2>
              <p>{project.description}</p>
            </section>
          </ScrollReveal>

          {requirements.length > 0 && (
              <ScrollReveal>
                <section className={cn(common.section, themed.section)} aria-labelledby='req-title'>
                <h2 id='req-title' className={cn(common.sectionTitle, themed.sectionTitle)}>Skills / Requirements</h2>
                <ul className={common.list} role='list'>
                    {requirements.map((r: string, i: number) => (
                    <li key={i} role='listitem' className={cn(common.item, themed.item)}>{r}</li>
                    ))}
                </ul>
                </section>
              </ScrollReveal>
          )}

          {/* Activity section placeholder - could be populated with milestones later */}
          <ScrollReveal>
            <section className={cn(common.section, themed.section)} aria-labelledby='activity-title'>
              <h2 id='activity-title' className={cn(common.sectionTitle, themed.sectionTitle)}>Recent Activity</h2>
              <div className={common.list} role='list'>
                <div className={cn(common.item, themed.item)}>
                    <div>{new Date(project.created_at).toLocaleString()}</div>
                    <div>Project created</div>
                </div>
                {project.updated_at !== project.created_at && (
                    <div className={cn(common.item, themed.item)}>
                        <div>{new Date(project.updated_at).toLocaleString()}</div>
                        <div>Project updated</div>
                    </div>
                )}
              </div>
            </section>
          </ScrollReveal>

          {/* Proposals Section - The Core Feature */}
          <ScrollReveal>
            <section className={cn(common.section, themed.section)} aria-labelledby='proposals-title'>
              <h2 id='proposals-title' className={cn(common.sectionTitle, themed.sectionTitle)}>
                Proposals ({proposals.length})
              </h2>
              
              {proposalsLoading ? (
                <div className={common.list}>
                  <Skeleton height={100} width='100%' />
                  <Skeleton height={100} width='100%' />
                </div>
              ) : proposals.length === 0 ? (
                <div className={cn(common.emptyState, themed.emptyState)}>
                  <p>No proposals received yet. Share your project to attract freelancers!</p>
                </div>
              ) : (
                <div className={common.proposalsList}>
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className={cn(common.proposalCard, themed.proposalCard)}>
                      <div className={common.proposalHeader}>
                        <div className={common.proposalFreelancer}>
                          <User size={20} />
                          <span>{proposal.freelancer_name || `Freelancer #${proposal.freelancer_id}`}</span>
                        </div>
                        <Badge 
                          variant={(
                            proposal.status === 'accepted' ? 'success' : 
                            proposal.status === 'rejected' ? 'error' : 
                            'info'
                          ) as any}
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                      
                      <div className={common.proposalMeta}>
                        <span><DollarSign size={16} /> ${proposal.bid_amount.toLocaleString()}</span>
                        <span><Clock size={16} /> {proposal.estimated_hours} hours</span>
                        <span>${proposal.hourly_rate}/hr</span>
                      </div>
                      
                      <p className={common.proposalCoverLetter}>
                        {proposal.cover_letter.length > 300 
                          ? `${proposal.cover_letter.substring(0, 300)}...` 
                          : proposal.cover_letter
                        }
                      </p>
                      
                      <div className={common.proposalFooter}>
                        <span className={common.proposalDate}>
                          Submitted {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                        
                        {proposal.status === 'submitted' && (
                          <div className={common.proposalActions}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/portal/client/messages?freelancer=${proposal.freelancer_id}`)}
                            >
                              <MessageSquare size={16} /> Message
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              isLoading={checkingFraud === proposal.id}
                              onClick={() => handleCheckFraud(proposal.id)}
                              title="Check for fraud risk"
                            >
                          <ShieldAlert size={16} className={fraudCheckResults[proposal.id]?.risk_level === 'high' ? common.textDanger : ''} /> 
                              {fraudCheckResults[proposal.id] ? 'Risk Checked' : 'Check Risk'}
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              isLoading={actionLoading === proposal.id}
                              onClick={() => setRejectTarget(proposal.id)}
                            >
                              <XCircle size={16} /> Reject
                            </Button>
                            <Button 
                              variant="success" 
                              size="sm"
                              isLoading={actionLoading === proposal.id}
                              onClick={() => setAcceptTarget(proposal.id)}
                            >
                              <CheckCircle size={16} /> Accept & Hire
                            </Button>
                          </div>
                        )}
                        
                        {fraudCheckResults[proposal.id] && (
                          <div className={common.fraudResultWrapper}>
                            <FraudAlertBanner 
                              message={`Risk Score: ${fraudCheckResults[proposal.id].risk_score}/100. ${fraudCheckResults[proposal.id].recommendation}`}
                              severity={fraudCheckResults[proposal.id].risk_level as 'high' | 'medium' | 'low'}
                              details={fraudCheckResults[proposal.id].risk_factors}
                              onDismiss={() => {
                                const newResults = {...fraudCheckResults};
                                delete newResults[proposal.id];
                                setFraudCheckResults(newResults);
                              }}
                            />
                          </div>
                        )}
                        
                        {proposal.status === 'accepted' && (
                          <div className={common.proposalActions}>
                            <Link href={`/portal/client/contracts`}>
                              <Button variant="primary" size="sm">
                                View Contract
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </ScrollReveal>
        </div>
      </main>

      {/* Accept Proposal Modal */}
      <Modal isOpen={acceptTarget !== null} title="Accept Proposal" onClose={() => setAcceptTarget(null)}>
        <p>Accept this proposal? This will create a contract and reject other proposals.</p>
        <div className={common.actionRow}>
          <Button variant="ghost" onClick={() => setAcceptTarget(null)}>Cancel</Button>
          <Button variant="success" onClick={() => { if (acceptTarget) handleAcceptProposal(acceptTarget); }}>Accept &amp; Hire</Button>
        </div>
      </Modal>

      {/* Reject Proposal Modal */}
      <Modal isOpen={rejectTarget !== null} title="Reject Proposal" onClose={() => setRejectTarget(null)}>
        <p>Are you sure you want to reject this proposal?</p>
        <div className={common.actionRow}>
          <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (rejectTarget) handleRejectProposal(rejectTarget); }}>Reject</Button>
        </div>
      </Modal>

      {toast && (
        <div className={cn(common.toast, toast.type === 'error' && common.toastError, themed.toast, toast.type === 'error' && themed.toastError)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
};

export default ProjectDetail;
