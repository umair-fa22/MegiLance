// @AI-HINT: Admin page to view and resolve a specific dispute
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Textarea from '@/app/components/Textarea/Textarea';
import Select from '@/app/components/Select/Select';
import Loader from '@/app/components/Loader/Loader';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { useToaster } from '@/app/components/Toast/ToasterProvider';

import commonStyles from './DisputeDetails.common.module.css';
import lightStyles from './DisputeDetails.light.module.css';
import darkStyles from './DisputeDetails.dark.module.css';

interface Dispute {
  id: number;
  title: string;
  description: string;
  status: string;
  contract_id: number;
  raised_by_id: number;
  created_at: string;
  updated_at: string;
  resolution?: string;
  resolved_at?: string;
  resolved_by_id?: number;
  evidence?: any[]; // Assuming evidence is an array of objects or strings
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open': return 'danger';
    case 'in_progress': return 'warning';
    case 'resolved': return 'success';
    case 'closed': return 'secondary';
    default: return 'info';
  }
};

const DisputeDetailsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const toaster = useToaster();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [resolutionNote, setResolutionNote] = useState('');
  const [contractAction, setContractAction] = useState('active'); // Default to resuming contract
  const [submitting, setSubmitting] = useState(false);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchDispute = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.disputes.get(Number(params.id)) as any;
      setDispute(data);
    } catch (err) {
      console.error('Failed to fetch dispute:', err);
      setError('Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  const handleResolve = async () => {
    if (!dispute || !resolutionNote.trim()) {
      toaster.notify({ title: 'Error', description: 'Please provide a resolution note', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await api.disputes.resolve(dispute.id, resolutionNote, contractAction);
      toaster.notify({ title: 'Success', description: 'Dispute resolved successfully', variant: 'success' });
      fetchDispute(); // Refresh data
    } catch (err: any) {
      console.error('Failed to resolve dispute:', err);
      toaster.notify({ title: 'Error', description: err.message || 'Failed to resolve dispute', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className={cn(styles.container, styles.loadingState)}>
        <Loader size="lg" />
        <p>Loading dispute details...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className={cn(styles.container, styles.errorState)}>
        <h2>Error Loading Dispute</h2>
        <p>{error || 'Dispute not found'}</p>
        <Button variant="primary" onClick={() => router.push('/portal/admin/disputes')}>
          Back to Disputes
        </Button>
      </div>
    );
  }

  const isResolved = dispute.status === 'resolved' || dispute.status === 'closed';

  return (
    <PageTransition>
      <div className={cn(styles.container)}>
        <Button 
          variant="ghost" 
          onClick={handleBack}
          iconBefore={<ArrowLeft size={16} />}
        >
          Back to Disputes
        </Button>

        <ScrollReveal>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{dispute.title}</h1>
              <div className={styles.meta}>
                <Badge variant={getStatusBadgeVariant(dispute.status)}>
                  {dispute.status.replace('_', ' ')}
                </Badge>
                <span>Dispute #{dispute.id}</span>
                <span>Contract #{dispute.contract_id}</span>
                <span>Created: {new Date(dispute.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.description}>{dispute.description}</p>
          </div>
        </ScrollReveal>

        {dispute.evidence && dispute.evidence.length > 0 && (
          <ScrollReveal delay={0.15}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Evidence</h2>
              <div className={styles.evidenceList}>
                {dispute.evidence.map((item: any, index: number) => (
                  <div key={index} className={styles.evidenceItem}>
                    <FileText size={28} className={styles.evidenceIcon} />
                    <span className={styles.evidenceName}>{item.filename || `Evidence ${index + 1}`}</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {isResolved ? (
          <ScrollReveal delay={0.2}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Resolution</h2>
              <div className={styles.resolutionDetails}>
                <p><strong>Resolved By:</strong> Admin #{dispute.resolved_by_id}</p>
                <p><strong>Resolved At:</strong> {dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleString() : 'N/A'}</p>
                <div className={styles.resolutionNote}>
                  <strong>Resolution Note:</strong>
                  <p className={styles.description}>{dispute.resolution}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal delay={0.2}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Resolve Dispute</h2>
              <div className={styles.resolutionForm}>
                <div className={styles.formGroup}>
                  <Textarea 
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Explain the resolution decision..."
                    rows={5}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <Select 
                    value={contractAction}
                    onChange={(e) => setContractAction(e.target.value)}
                    options={[
                      { value: 'active', label: 'Resume Contract (Set to Active)' },
                      { value: 'terminated', label: 'Terminate Contract' },
                      { value: 'completed', label: 'Mark as Completed' },
                    ]}
                  />
                </div>

                <div className={styles.actions}>
                  <Button 
                    variant="primary" 
                    onClick={handleResolve}
                    isLoading={submitting}
                    disabled={submitting}
                    iconBefore={<CheckCircle size={16} />}
                  >
                    Resolve Dispute
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
};

export default DisputeDetailsPage;
