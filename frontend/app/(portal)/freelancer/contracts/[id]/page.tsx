// @AI-HINT: This page displays detailed information about a specific contract.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { ArrowLeft, Download, Loader2, AlertTriangle } from 'lucide-react';

import Button from '@/app/components/atoms/Button/Button';
import Badge from '@/app/components/atoms/Badge/Badge';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';

import commonStyles from './ContractDetails.common.module.css';
import lightStyles from './ContractDetails.light.module.css';
import darkStyles from './ContractDetails.dark.module.css';

interface Milestone {
  id: number;
  name: string;
  status: string;
  amount: number;
}

interface Contract {
  id: string;
  project_id: number;
  freelancer_id: number;
  client_id: number;
  total_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  milestones: string | Milestone[];
  terms: string;
  created_at: string;
  updated_at: string;
  // Enriched data
  project_title?: string;
  client_name?: string;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': 
    case 'in_progress': return 'info';
    case 'completed': return 'success';
    case 'disputed': return 'danger';
    case 'pending': 
    case 'negotiation': return 'warning';
    case 'cancelled':
    case 'terminated': return 'danger';
    default: return 'secondary';
  }
};

const ContractDetailsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const toaster = useToaster();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchContract = useCallback(async () => {
    if (!params.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const contractData = await api.contracts.get(Number(params.id)) as any as Contract;
      
      // Try to fetch project details
      try {
        const projectData = await api.projects.get(contractData.project_id) as any;
        contractData.project_title = projectData.title;
        contractData.client_name = projectData.client_name;
      } catch {
        // Ignore project fetch errors
      }
      
      // Parse milestones if it's a string
      if (typeof contractData.milestones === 'string') {
        try {
          contractData.milestones = JSON.parse(contractData.milestones);
        } catch {
          contractData.milestones = [];
        }
      }
      
      setContract(contractData);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch contract:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handleBack = () => {
    router.back();
  };

  const handleDownload = () => {
    toaster.notify({ 
      title: 'Download started', 
      description: `Downloading contract details`, 
      variant: 'success' 
    });
  };

  const handleRaiseDispute = () => {
    if (!contract) return;
    router.push(`/portal/disputes/create?contract=${contract.id}&project=${encodeURIComponent(contract.project_title || '')}&party=${encodeURIComponent(contract.client_name || '')}`);
  };

  // Parse milestones
  const milestones: Milestone[] = useMemo(() => {
    if (!contract) return [];
    if (Array.isArray(contract.milestones)) return contract.milestones;
    return [];
  }, [contract]);

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status?.toLowerCase() === 'completed').length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Parse terms
  const terms = useMemo(() => {
    if (!contract?.terms) return null;
    if (typeof contract.terms === 'string') {
      try {
        return JSON.parse(contract.terms);
      } catch {
        return { general: contract.terms };
      }
    }
    return contract.terms;
  }, [contract]);

  if (loading) {
    return (
      <div className={cn(styles.container, styles.loadingState)}>
        <Loader2 className={styles.spinner} />
        <p>Loading contract details...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className={cn(styles.container, styles.errorState)}>
        <h2>Error Loading Contract</h2>
        <p>{error || 'Contract not found'}</p>
        <Button variant="primary" onClick={() => router.push('/portal/freelancer/contracts')}>
          Back to Contracts
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(styles.container, resolvedTheme && styles[resolvedTheme])}>
      <header className={styles.header}>
        <Button 
          variant="secondary" 
          onClick={handleBack} 
          aria-label="Back to contracts"
          title="Back to contracts"
        >
          <ArrowLeft size={16} /> Back
        </Button>
        
        <div className={styles.headerActions}>
          {contract && !['disputed', 'cancelled', 'terminated'].includes(contract.status.toLowerCase()) && (
            <Button 
              variant="danger" 
              onClick={handleRaiseDispute}
              aria-label="Raise a dispute"
              title="Raise a dispute"
            >
              <AlertTriangle size={16} /> Raise Dispute
            </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={handleDownload}
            aria-label="Download contract"
            title="Download contract"
          >
            <Download size={16} /> Download
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.contractHeader}>
          <div>
            <h1 className={styles.title}>{contract.project_title || `Project #${contract.project_id}`}</h1>
            <p className={styles.client}>for {contract.client_name || `Client #${contract.client_id}`}</p>
          </div>
          <div className={styles.contractMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <Badge variant={getStatusBadgeVariant(contract.status)}>
                {contract.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Value</span>
              <span className={styles.metaValue}>${contract.total_amount.toLocaleString()}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Contract ID</span>
              <span className={styles.metaValue}>{contract.id}</span>
            </div>
          </div>
        </div>

        {milestones.length > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <h2 className={styles.sectionTitle}>Project Progress</h2>
              <span className={styles.progressText}>{completedMilestones}/{totalMilestones} milestones completed</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {contract.description && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Project Description</h2>
            <p className={styles.description}>{contract.description}</p>
          </div>
        )}

        {milestones.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Milestones</h2>
            <div className={styles.milestones}>
              {milestones.map((milestone, index) => (
                <div key={milestone.id || index} className={styles.milestone}>
                  <div className={styles.milestoneHeader}>
                    <h3 className={styles.milestoneTitle}>{milestone.name}</h3>
                    <Badge variant={getStatusBadgeVariant(milestone.status)}>
                      {milestone.status}
                    </Badge>
                  </div>
                  <div className={styles.milestoneAmount}>
                    ${milestone.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {terms && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Contract Terms</h2>
            <div className={styles.termsGrid}>
              {terms.paymentTerms && (
                <div className={styles.termItem}>
                  <h3 className={styles.termTitle}>Payment Terms</h3>
                  <p className={styles.termDescription}>{terms.paymentTerms}</p>
                </div>
              )}
              {terms.revisionPolicy && (
                <div className={styles.termItem}>
                  <h3 className={styles.termTitle}>Revision Policy</h3>
                  <p className={styles.termDescription}>{terms.revisionPolicy}</p>
                </div>
              )}
              {terms.cancellationPolicy && (
                <div className={styles.termItem}>
                  <h3 className={styles.termTitle}>Cancellation Policy</h3>
                  <p className={styles.termDescription}>{terms.cancellationPolicy}</p>
                </div>
              )}
              {terms.general && (
                <div className={styles.termItem}>
                  <h3 className={styles.termTitle}>General Terms</h3>
                  <p className={styles.termDescription}>{terms.general}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Timeline</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>Start Date</span>
              <span className={styles.timelineValue}>
                {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.timelineLabel}>End Date</span>
              <span className={styles.timelineValue}>
                {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContractDetailsPage;
