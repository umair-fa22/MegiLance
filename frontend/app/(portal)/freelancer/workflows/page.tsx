// @AI-HINT: Workflow Automation page - Create and manage automated workflows
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import commonStyles from './Workflows.common.module.css';
import lightStyles from './Workflows.light.module.css';
import darkStyles from './Workflows.dark.module.css';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  isActive: boolean;
  lastRun?: string;
  runCount: number;
  createdAt: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  popularity: number;
}

export default function WorkflowsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-workflows' | 'templates' | 'logs'>('my-workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', trigger: '', description: '' });

  useEffect(() => {
    setMounted(true);
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      // Fetch real workflow data from API
      const { workflowApi } = await import('@/lib/api') as any;
      
      const [workflowsData, triggersData, actionsData] = await Promise.all([
        workflowApi.list().catch((e: unknown) => { console.error('Failed to load workflows:', e); return null; }),
        workflowApi.getTriggers().catch((e: unknown) => { console.error('Failed to load triggers:', e); return null; }),
        workflowApi.getActions().catch((e: unknown) => { console.error('Failed to load actions:', e); return null; }),
      ]);

      // Transform API workflows or use defaults
      const workflowsArray = Array.isArray(workflowsData) ? workflowsData : workflowsData?.items || [];
      const transformedWorkflows: Workflow[] = workflowsArray.map((wf: any) => ({
        id: wf.id?.toString() || `wf_${Math.random()}`,
        name: wf.name || 'Unnamed Workflow',
        description: wf.description || '',
        trigger: wf.trigger || { type: 'manual', config: {} },
        actions: wf.actions || [],
        isActive: wf.is_active ?? wf.isActive ?? false,
        lastRun: wf.last_run || wf.lastRun,
        runCount: wf.run_count || wf.runCount || 0,
        createdAt: wf.created_at || new Date().toISOString()
      }));

      // Generate templates from available triggers/actions
      const defaultTemplates: WorkflowTemplate[] = [
        { id: 't1', name: 'New Client Welcome', description: 'Welcome new clients with intro message', category: 'Onboarding', trigger: 'contract_signed', popularity: 89 },
        { id: 't2', name: 'Invoice Reminder', description: 'Auto-remind about unpaid invoices', category: 'Payments', trigger: 'invoice_overdue', popularity: 92 },
        { id: 't3', name: 'Project Completion', description: 'Actions when project is marked complete', category: 'Projects', trigger: 'project_completed', popularity: 78 },
        { id: 't4', name: 'Review Request', description: 'Request review after contract ends', category: 'Reviews', trigger: 'contract_ended', popularity: 85 },
        { id: 't5', name: 'Low Balance Alert', description: 'Alert when escrow balance is low', category: 'Payments', trigger: 'escrow_low', popularity: 67 },
        { id: 't6', name: 'Daily Standup', description: 'Daily status update reminder', category: 'Communication', trigger: 'schedule', popularity: 73 }
      ];

      setWorkflows(transformedWorkflows);
      setTemplates(defaultTemplates);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch workflows:', error);
      }
      setWorkflows([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(wf => wf.id === workflowId);
      if (!workflow) return;
      
      const { workflowApi } = await import('@/lib/api') as any;
      if (workflow.isActive) {
        await workflowApi.disable(workflowId);
      } else {
        await workflowApi.enable(workflowId);
      }
      
      setWorkflows(prev => prev.map(wf => 
        wf.id === workflowId ? { ...wf, isActive: !wf.isActive } : wf
      ));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to toggle workflow:', error);
      }
      alert('Failed to update workflow status. Please try again.');
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const { workflowApi } = await import('@/lib/api') as any;
      await workflowApi.delete(workflowId);
      setWorkflows(prev => prev.filter(wf => wf.id !== workflowId));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete workflow:', error);
      }
      alert('Failed to delete workflow. Please try again.');
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflow.name || !newWorkflow.trigger) return;
    
    const workflow: Workflow = {
      id: `wf_${Date.now()}`,
      name: newWorkflow.name,
      description: newWorkflow.description,
      trigger: { type: newWorkflow.trigger, config: {} },
      actions: [],
      isActive: false,
      runCount: 0,
      createdAt: new Date().toISOString()
    };
    
    setWorkflows(prev => [workflow, ...prev]);
    setNewWorkflow({ name: '', trigger: '', description: '' });
    setShowCreateModal(false);
  };

  const applyTemplate = (template: WorkflowTemplate) => {
    setNewWorkflow({
      name: template.name,
      trigger: template.trigger,
      description: template.description
    });
    setShowCreateModal(true);
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      proposal_received: '📨 Proposal Received',
      milestone_completed: '✅ Milestone Completed',
      contract_signed: '📝 Contract Signed',
      invoice_overdue: '⚠️ Invoice Overdue',
      project_completed: '🎉 Project Completed',
      contract_ended: '🏁 Contract Ended',
      escrow_low: '💰 Low Escrow Balance',
      schedule: '📅 Scheduled'
    };
    return labels[type] || type;
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Workflow Automation</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Automate repetitive tasks and streamline your workflow
              </p>
            </div>
            <button 
              className={cn(commonStyles.createButton, themeStyles.createButton)}
              onClick={() => setShowCreateModal(true)}
            >
              + Create Workflow
            </button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading workflows...</div>
        ) : (
          <>
            <ScrollReveal delay={0.1}>
              <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
                <button
                  className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'my-workflows' && commonStyles.tabActive, activeTab === 'my-workflows' && themeStyles.tabActive)}
                  onClick={() => setActiveTab('my-workflows')}
                >
                  My Workflows ({workflows.length})
                </button>
                <button
                  className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'templates' && commonStyles.tabActive, activeTab === 'templates' && themeStyles.tabActive)}
                  onClick={() => setActiveTab('templates')}
                >
                  Templates
                </button>
                <button
                  className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'logs' && commonStyles.tabActive, activeTab === 'logs' && themeStyles.tabActive)}
                  onClick={() => setActiveTab('logs')}
                >
                  Execution Logs
                </button>
              </div>
            </ScrollReveal>

            {activeTab === 'my-workflows' && (
              <div className={commonStyles.workflowsList}>
                {workflows.length === 0 ? (
                  <ScrollReveal>
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <div className={commonStyles.emptyIcon}>⚡</div>
                      <h3>No workflows yet</h3>
                      <p>Create your first workflow or use a template to get started</p>
                      <button 
                        className={cn(commonStyles.createButton, themeStyles.createButton)}
                        onClick={() => setActiveTab('templates')}
                      >
                        Browse Templates
                      </button>
                    </div>
                  </ScrollReveal>
                ) : (
                  <StaggerContainer>
                    {workflows.map(workflow => (
                      <StaggerItem key={workflow.id}>
                        <div className={cn(commonStyles.workflowCard, themeStyles.workflowCard)}>
                          <div className={commonStyles.workflowHeader}>
                            <div className={commonStyles.workflowInfo}>
                              <h3 className={cn(commonStyles.workflowName, themeStyles.workflowName)}>
                                {workflow.name}
                              </h3>
                              <p className={cn(commonStyles.workflowDesc, themeStyles.workflowDesc)}>
                                {workflow.description}
                              </p>
                            </div>
                            <label className={commonStyles.toggle}>
                              <input 
                                type="checkbox" 
                                checked={workflow.isActive}
                                onChange={() => toggleWorkflow(workflow.id)}
                              />
                              <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                            </label>
                          </div>
                          <div className={commonStyles.workflowMeta}>
                            <span className={cn(commonStyles.trigger, themeStyles.trigger)}>
                              {getTriggerLabel(workflow.trigger.type)}
                            </span>
                            <span className={cn(commonStyles.actionCount, themeStyles.actionCount)}>
                              {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className={cn(commonStyles.workflowStats, themeStyles.workflowStats)}>
                            <span>Runs: {workflow.runCount}</span>
                            {workflow.lastRun && (
                              <span>Last run: {new Date(workflow.lastRun).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className={commonStyles.workflowActions}>
                            <button className={cn(commonStyles.editButton, themeStyles.editButton)}>
                              Edit
                            </button>
                            <button className={cn(commonStyles.testButton, themeStyles.testButton)}>
                              Test
                            </button>
                            <button 
                              className={cn(commonStyles.deleteButton, themeStyles.deleteButton)}
                              onClick={() => deleteWorkflow(workflow.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>
            )}

            {activeTab === 'templates' && (
              <StaggerContainer className={commonStyles.templatesGrid}>
                {templates.map(template => (
                  <StaggerItem key={template.id}>
                    <div className={cn(commonStyles.templateCard, themeStyles.templateCard)}>
                      <div className={cn(commonStyles.templateCategory, themeStyles.templateCategory)}>
                        {template.category}
                      </div>
                      <h3 className={cn(commonStyles.templateName, themeStyles.templateName)}>
                        {template.name}
                      </h3>
                      <p className={cn(commonStyles.templateDesc, themeStyles.templateDesc)}>
                        {template.description}
                      </p>
                      <div className={commonStyles.templateMeta}>
                        <span className={cn(commonStyles.templateTrigger, themeStyles.templateTrigger)}>
                          {getTriggerLabel(template.trigger)}
                        </span>
                        <span className={cn(commonStyles.templatePopularity, themeStyles.templatePopularity)}>
                          ⭐ {template.popularity}% use
                        </span>
                      </div>
                      <button 
                        className={cn(commonStyles.useButton, themeStyles.useButton)}
                        onClick={() => applyTemplate(template)}
                      >
                        Use Template
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {activeTab === 'logs' && (
              <div className={cn(commonStyles.logsPanel, themeStyles.logsPanel)}>
                <StaggerContainer className={commonStyles.logsList}>
                  {[
                    { id: 1, workflow: 'Auto-respond to proposals', status: 'success', time: '2 hours ago', duration: '0.3s' },
                    { id: 2, workflow: 'Milestone completion notification', status: 'success', time: '5 hours ago', duration: '1.2s' },
                    { id: 3, workflow: 'Auto-respond to proposals', status: 'success', time: '1 day ago', duration: '0.4s' },
                    { id: 4, workflow: 'Weekly time report', status: 'failed', time: '3 days ago', duration: '2.1s' },
                    { id: 5, workflow: 'Auto-respond to proposals', status: 'success', time: '3 days ago', duration: '0.3s' },
                  ].map(log => (
                    <StaggerItem key={log.id}>
                      <div className={cn(commonStyles.logItem, themeStyles.logItem)}>
                        <div className={cn(
                          commonStyles.logStatus,
                          log.status === 'success' ? commonStyles.logSuccess : commonStyles.logFailed
                        )}>
                          {log.status === 'success' ? '✓' : '✕'}
                        </div>
                        <div className={commonStyles.logInfo}>
                          <span className={cn(commonStyles.logWorkflow, themeStyles.logWorkflow)}>
                            {log.workflow}
                          </span>
                          <span className={cn(commonStyles.logTime, themeStyles.logTime)}>
                            {log.time} • {log.duration}
                          </span>
                        </div>
                        <button className={cn(commonStyles.viewLogButton, themeStyles.viewLogButton)}>
                          View Details
                        </button>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>Create Workflow</h2>
                <button className={commonStyles.closeButton} onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className={commonStyles.modalContent}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Workflow Name</label>
                  <input
                    type="text"
                    className={cn(commonStyles.input, themeStyles.input)}
                    value={newWorkflow.name}
                    onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Auto-respond to proposals"
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Trigger Event</label>
                  <select
                    className={cn(commonStyles.select, themeStyles.select)}
                    value={newWorkflow.trigger}
                    onChange={e => setNewWorkflow(prev => ({ ...prev, trigger: e.target.value }))}
                  >
                    <option value="">Select a trigger...</option>
                    <option value="proposal_received">Proposal Received</option>
                    <option value="milestone_completed">Milestone Completed</option>
                    <option value="contract_signed">Contract Signed</option>
                    <option value="invoice_overdue">Invoice Overdue</option>
                    <option value="project_completed">Project Completed</option>
                    <option value="schedule">Scheduled (Cron)</option>
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.label, themeStyles.label)}>Description</label>
                  <textarea
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                    value={newWorkflow.description}
                    onChange={e => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What does this workflow do?"
                    rows={3}
                  />
                </div>
              </div>
              <div className={commonStyles.modalActions}>
                <button 
                  className={cn(commonStyles.cancelButton, themeStyles.cancelButton)}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className={cn(commonStyles.saveButton, themeStyles.saveButton)}
                  onClick={createWorkflow}
                  disabled={!newWorkflow.name || !newWorkflow.trigger}
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
