// @AI-HINT: This page allows freelancers to manage their job alerts. It's now fully theme-aware, connected to the backend, and uses our premium, reusable form components.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Input from '@/app/components/Input/Input';
import Select, { SelectOption } from '@/app/components/Select/Select';
import ToggleSwitch from '@/app/components/ToggleSwitch/ToggleSwitch';
import Card from '@/app/components/Card/Card';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import Modal from '@/app/components/Modal/Modal';
import { searchingAnimation } from '@/app/components/Animations/LottieAnimation';
import MegaLoader from '@/app/components/Loading/MegaLoader';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { Bell, Trash2, Search, Zap } from 'lucide-react';

import commonStyles from './JobAlerts.common.module.css';
import lightStyles from './JobAlerts.light.module.css';
import darkStyles from './JobAlerts.dark.module.css';

interface JobAlert {
  id: number;
  keywords: string;
  frequency: string;
  is_ai_powered: boolean;
}

const frequencyOptions: SelectOption[] = [
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Summary' },
  { value: 'realtime', label: 'Real-time (Instant)' },
];

const JobAlertsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const toaster = useToaster();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JobAlert | null>(null);

  // Form State
  const [keywords, setKeywords] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [isAiPowered, setIsAiPowered] = useState(false);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await api.jobAlerts.getAll();
      setAlerts(data as JobAlert[]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch alerts:', error);
      }
      toaster.error('Failed to load job alerts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) {
      toaster.error('Please enter keywords for your alert.');
      return;
    }

    try {
      setIsCreating(true);
      const newAlert = (await api.jobAlerts.create({
        keywords,
        frequency,
        is_ai_powered: isAiPowered,
      })) as JobAlert;
      setAlerts([newAlert, ...alerts]);
      toaster.success('Job alert created successfully!');
      
      // Reset form
      setKeywords('');
      setFrequency('daily');
      setIsAiPowered(false);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create alert:', error);
      }
      toaster.error('Failed to create job alert.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (alert: JobAlert) => {
    setDeleteTarget(null);
    try {
      await api.jobAlerts.delete(alert.id);
      setAlerts(alerts.filter(a => a.id !== alert.id));
      toaster.success('Job alert deleted.');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete alert:', error);
      }
      toaster.error('Failed to delete job alert.');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <MegaLoader />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={styles.container}>
        <ScrollReveal>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Job Alerts</h1>
              <p className={styles.subtitle}>
                Stay ahead of the competition. Get notified instantly when jobs matching your skills are posted.
              </p>
            </div>
            <div className={styles.headerIcon}>
              <Bell size={48} className={styles.bellIcon} />
            </div>
          </header>
        </ScrollReveal>

        <main className={styles.mainContent}>
          <div className={styles.grid}>
            {/* Create Alert Section */}
            <ScrollReveal delay={0.1}>
              <section className={styles.createSection}>
                <Card title="Create New Alert" icon={Search} className={styles.createCard}>
                  <form onSubmit={handleCreate} className={styles.form}>
                    <div className={styles.formGroup}>
                      <Input
                        id="alert-keywords"
                        label="Keywords"
                        placeholder="e.g. React, Python, DeFi, Smart Contracts"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        fullWidth
                        helpText="Separate multiple keywords with commas."
                      />
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <Select
                          id="alert-frequency"
                          label="Frequency"
                          options={frequencyOptions}
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <ToggleSwitch
                        id="ai-powered"
                        label="Enable AI Matching"
                        checked={isAiPowered}
                        onChange={setIsAiPowered}
                        helpText="Our AI will analyze job descriptions to ensure they truly match your profile, reducing noise."
                      />
                    </div>

                    <div className={styles.formActions}>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        isLoading={isCreating} 
                        fullWidth
                        iconBefore={<Bell size={18} />}
                      >
                        Create Alert
                      </Button>
                    </div>
                  </form>
                </Card>
              </section>
            </ScrollReveal>

            {/* Alerts List Section */}
            <section className={styles.listSection}>
              <ScrollReveal delay={0.2}>
                <h2 className={styles.sectionTitle}>Your Active Alerts ({alerts.length})</h2>
              </ScrollReveal>
              
              {alerts.length === 0 ? (
                <ScrollReveal delay={0.3}>
                  <EmptyState
                    title="No alerts yet"
                    description="Create your first job alert to start receiving notifications about new opportunities."
                    icon={<Bell size={48} />}
                    animationData={searchingAnimation}
                    animationWidth={120}
                    animationHeight={120}
                    action={
                      <Button variant="primary" onClick={() => document.getElementById('alert-keywords')?.focus()}>
                        Create Alert Above
                      </Button>
                    }
                  />
                </ScrollReveal>
              ) : (
                <StaggerContainer className={styles.alertList} delay={0.3}>
                  {alerts.map(alert => (
                    <StaggerItem key={alert.id}>
                      <div className={styles.alertItem}>
                        <div className={styles.alertContent}>
                          <div className={styles.alertHeader}>
                            <h3 className={styles.alertKeywords}>{alert.keywords}</h3>
                            {alert.is_ai_powered && (
                              <Badge variant="info" className={styles.aiBadge}>
                                <Zap size={12} className="mr-1" /> AI Powered
                              </Badge>
                            )}
                          </div>
                          <div className={styles.alertMeta}>
                            <span className={styles.frequencyLabel}>
                              Frequency: <strong>{alert.frequency}</strong>
                            </span>
                          </div>
                        </div>
                        <div className={styles.alertActions}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteTarget(alert)}
                            title="Delete Alert"
                            className={styles.deleteButton}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </section>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={deleteTarget !== null} title="Delete Alert" onClose={() => setDeleteTarget(null)}>
          <p>Are you sure you want to delete the alert for <strong>&quot;{deleteTarget?.keywords}&quot;</strong>?</p>
          <div className={styles.actionRow}>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default JobAlertsPage;
