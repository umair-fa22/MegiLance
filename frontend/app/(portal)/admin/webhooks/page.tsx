// @AI-HINT: Admin Webhook Management - Configure and manage webhook endpoints
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { webhooksApi } from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Badge from '@/app/components/atoms/Badge/Badge';
import Modal from '@/app/components/organisms/Modal/Modal';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Webhooks.common.module.css';
import lightStyles from './Webhooks.light.module.css';
import darkStyles from './Webhooks.dark.module.css';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'inactive' | 'failing';
  created_at: string;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
}

interface DeliveryLog {
  id: string;
  webhook_id: string;
  event: string;
  status: 'success' | 'failed';
  response_code?: number;
  delivered_at: string;
  duration_ms: number;
}

export default function WebhooksPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  
  // Create form
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
  });

  // Toast + delete confirmation
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const availableEvents = [
    { id: 'project.created', label: 'Project Created', category: 'Projects' },
    { id: 'project.updated', label: 'Project Updated', category: 'Projects' },
    { id: 'project.completed', label: 'Project Completed', category: 'Projects' },
    { id: 'proposal.submitted', label: 'Proposal Submitted', category: 'Proposals' },
    { id: 'proposal.accepted', label: 'Proposal Accepted', category: 'Proposals' },
    { id: 'proposal.rejected', label: 'Proposal Rejected', category: 'Proposals' },
    { id: 'payment.completed', label: 'Payment Completed', category: 'Payments' },
    { id: 'payment.failed', label: 'Payment Failed', category: 'Payments' },
    { id: 'user.registered', label: 'User Registered', category: 'Users' },
    { id: 'user.verified', label: 'User Verified', category: 'Users' },
    { id: 'contract.signed', label: 'Contract Signed', category: 'Contracts' },
    { id: 'milestone.completed', label: 'Milestone Completed', category: 'Milestones' },
  ];

  useEffect(() => {
    setMounted(true);
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await webhooksApi.list().catch(() => null) as any;
      
      const webhookData: Webhook[] = response?.webhooks || (Array.isArray(response) ? response : []);
      setWebhooks(webhookData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load webhooks:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) return;
    
    try {
      await webhooksApi.create({
        url: newWebhook.url,
        events: newWebhook.events,
        secret: newWebhook.secret || undefined,
      } as any);
      setShowCreateModal(false);
      setNewWebhook({ name: '', url: '', events: [], secret: '' });
      loadWebhooks();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create webhook:', error);
      }
    }
  };

  const handleToggleWebhook = async (webhookId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await webhooksApi.update(webhookId, { status: newStatus });
      loadWebhooks();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to toggle webhook:', error);
      }
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await webhooksApi.delete(webhookId);
      setDeleteTargetId(null);
      showToast('Webhook deleted');
      loadWebhooks();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete webhook:', error);
      }
      showToast('Failed to delete webhook', 'error');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      await webhooksApi.test(webhookId);
      showToast('Test webhook sent!');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to test webhook:', error);
      }
      showToast('Failed to send test webhook', 'error');
    }
  };

  const handleViewLogs = async (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    try {
      const response = await webhooksApi.getLogs(webhook.id).catch(() => null) as any;
      
      const logsData: DeliveryLog[] = response?.logs || (Array.isArray(response) ? response : []);
      setDeliveryLogs(logsData);
      setShowLogsModal(true);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load logs:', error);
      }
    }
  };

  const toggleEvent = (eventId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const groupedEvents = availableEvents.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof availableEvents>);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading webhooks...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Webhooks</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Configure webhook endpoints for real-time event notifications
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
              + Add Webhook
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer className={commonStyles.stats}>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statValue}>{webhooks.length}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Webhooks</span>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statValue}>{webhooks.filter(w => w.status === 'active').length}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statValue}>{webhooks.reduce((sum, w) => sum + w.success_count, 0)}</span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Deliveries</span>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={cn(commonStyles.statValue, commonStyles.failureValue)}>
              {webhooks.reduce((sum, w) => sum + w.failure_count, 0)}
            </span>
            <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Failures</span>
          </StaggerItem>
        </StaggerContainer>

        {/* Webhooks List */}
        <StaggerContainer className={commonStyles.webhooksList}>
          {webhooks.length === 0 ? (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>🔗</span>
              <p>No webhooks configured</p>
              <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
                Add your first webhook
              </Button>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <StaggerItem key={webhook.id} className={cn(commonStyles.webhookCard, themeStyles.webhookCard)}>
                <div className={commonStyles.webhookHeader}>
                  <div className={commonStyles.webhookInfo}>
                    <h3 className={cn(commonStyles.webhookName, themeStyles.webhookName)}>
                      {webhook.name}
                    </h3>
                    <code className={cn(commonStyles.webhookUrl, themeStyles.webhookUrl)}>
                      {webhook.url}
                    </code>
                  </div>
                  <span className={cn(
                    commonStyles.status,
                    commonStyles[`status${webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}`],
                    themeStyles[`status${webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}`]
                  )}>
                    {webhook.status === 'failing' && '⚠️ '}
                    {webhook.status}
                  </span>
                </div>

                <div className={commonStyles.webhookBody}>
                  <div className={commonStyles.events}>
                    <span className={cn(commonStyles.eventsLabel, themeStyles.eventsLabel)}>Events:</span>
                    <div className={commonStyles.eventsList}>
                      {webhook.events.map((event) => (
                        <span key={event} className={cn(commonStyles.event, themeStyles.event)}>
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={cn(commonStyles.webhookMeta, themeStyles.webhookMeta)}>
                    <span>✓ {webhook.success_count} delivered</span>
                    <span>✗ {webhook.failure_count} failed</span>
                    {webhook.last_triggered_at && (
                      <span>Last triggered: {formatDate(webhook.last_triggered_at)}</span>
                    )}
                  </div>
                </div>

                <div className={commonStyles.webhookActions}>
                  <Button variant="secondary" size="sm" onClick={() => handleTestWebhook(webhook.id)}>
                    🧪 Test
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleViewLogs(webhook)}>
                    📋 Logs
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleToggleWebhook(webhook.id, webhook.status)}>
                    {webhook.status === 'active' ? '⏸️ Pause' : '▶️ Enable'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTargetId(webhook.id)}>
                    Delete
                  </Button>
                </div>
              </StaggerItem>
            ))
          )}
        </StaggerContainer>

        {/* Create Modal */}
        {showCreateModal && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent, commonStyles.modalLarge)}>
              <div className={commonStyles.modalHeader}>
                <h2>Add Webhook</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label>Name</label>
                  <Input
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Endpoint URL</label>
                  <Input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://example.com/webhooks"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Secret (optional)</label>
                  <Input
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Webhook signing secret"
                  />
                  <p className={cn(commonStyles.hint, themeStyles.hint)}>
                    Used to sign webhook payloads for verification
                  </p>
                </div>

                <div className={commonStyles.formGroup}>
                  <label>Events</label>
                  <div className={commonStyles.eventsGrid}>
                    {Object.entries(groupedEvents).map(([category, events]) => (
                      <div key={category} className={commonStyles.eventCategory}>
                        <h4 className={cn(commonStyles.categoryTitle, themeStyles.categoryTitle)}>
                          {category}
                        </h4>
                        {events.map((event) => (
                          <label
                            key={event.id}
                            className={cn(
                              commonStyles.eventOption,
                              themeStyles.eventOption,
                              newWebhook.events.includes(event.id) && commonStyles.eventSelected,
                              newWebhook.events.includes(event.id) && themeStyles.eventSelected
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={newWebhook.events.includes(event.id)}
                              onChange={() => toggleEvent(event.id)}
                            />
                            <span>{event.label}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={commonStyles.modalFooter}>
                <Button variant="secondary" size="md" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0}
                >
                  Create Webhook
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Modal */}
        {showLogsModal && selectedWebhook && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent, commonStyles.modalLarge)}>
              <div className={commonStyles.modalHeader}>
                <h2>Delivery Logs - {selectedWebhook.name}</h2>
                <button
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                  onClick={() => {
                    setShowLogsModal(false);
                    setSelectedWebhook(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.logsList}>
                  {deliveryLogs.length === 0 ? (
                    <p className={cn(commonStyles.noLogs, themeStyles.noLogs)}>No delivery logs yet</p>
                  ) : (
                    deliveryLogs.map((log) => (
                      <div key={log.id} className={cn(commonStyles.logEntry, themeStyles.logEntry)}>
                        <div className={commonStyles.logStatus}>
                          <span className={cn(
                            commonStyles.logBadge,
                            log.status === 'success' ? commonStyles.logSuccess : commonStyles.logFailed,
                            log.status === 'success' ? themeStyles.logSuccess : themeStyles.logFailed
                          )}>
                            {log.status === 'success' ? '✓' : '✗'} {log.response_code || 'Error'}
                          </span>
                        </div>
                        <div className={commonStyles.logInfo}>
                          <span className={cn(commonStyles.logEvent, themeStyles.logEvent)}>{log.event}</span>
                          <span className={cn(commonStyles.logTime, themeStyles.logTime)}>
                            {formatDate(log.delivered_at)} • {log.duration_ms}ms
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <Modal isOpen onClose={() => setDeleteTargetId(null)} title="Delete Webhook">
          <p className={commonStyles.confirmText}>Are you sure you want to delete this webhook? This action cannot be undone.</p>
          <div className={commonStyles.modalActions}>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => handleDeleteWebhook(deleteTargetId)}>Delete</Button>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
}
