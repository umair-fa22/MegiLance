// @AI-HINT: Third-party integrations management for connecting external services
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { integrationsApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Modal from '@/app/components/Modal/Modal';
import Button from '@/app/components/Button/Button';
import Loader from '@/app/components/Loader/Loader';
import commonStyles from './Integrations.common.module.css';
import lightStyles from './Integrations.light.module.css';
import darkStyles from './Integrations.dark.module.css';

interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  icon: string;
  category: 'communication' | 'storage' | 'payment' | 'productivity' | 'development' | 'analytics';
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  connected_at?: string;
  settings?: Record<string, unknown>;
  scopes?: string[];
  sync_enabled?: boolean;
  last_sync?: string;
}

interface IntegrationCategory {
  id: string;
  name: string;
  icon: string;
}

const categories: IntegrationCategory[] = [
  { id: 'all', name: 'All Integrations', icon: '🔗' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'storage', name: 'Storage', icon: '📁' },
  { id: 'payment', name: 'Payments', icon: '💳' },
  { id: 'productivity', name: 'Productivity', icon: '📊' },
  { id: 'development', name: 'Development', icon: '💻' },
  { id: 'analytics', name: 'Analytics', icon: '📈' },
];

const availableIntegrations: Omit<Integration, 'id' | 'status'>[] = [
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates in your Slack channels',
    icon: '💬',
    category: 'communication',
    scopes: ['messages', 'notifications'],
  },
  {
    provider: 'discord',
    name: 'Discord',
    description: 'Connect your Discord server for team communication',
    icon: '🎮',
    category: 'communication',
    scopes: ['messages', 'notifications'],
  },
  {
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Sync and manage files with Google Drive',
    icon: '📂',
    category: 'storage',
    scopes: ['files.read', 'files.write'],
  },
  {
    provider: 'dropbox',
    name: 'Dropbox',
    description: 'Connect Dropbox for file storage and sharing',
    icon: '📦',
    category: 'storage',
    scopes: ['files.read', 'files.write'],
  },
  {
    provider: 'stripe',
    name: 'Stripe',
    description: 'Process payments and manage subscriptions',
    icon: '💳',
    category: 'payment',
    scopes: ['payments', 'subscriptions'],
  },
  {
    provider: 'paypal',
    name: 'PayPal',
    description: 'Accept PayPal payments from clients',
    icon: '🅿️',
    category: 'payment',
    scopes: ['payments'],
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Sync tasks and documentation with Notion',
    icon: '📝',
    category: 'productivity',
    scopes: ['pages.read', 'pages.write'],
  },
  {
    provider: 'trello',
    name: 'Trello',
    description: 'Sync project boards and tasks with Trello',
    icon: '📋',
    category: 'productivity',
    scopes: ['boards.read', 'boards.write'],
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Connect repositories and track commits',
    icon: '🐙',
    category: 'development',
    scopes: ['repos.read', 'commits.read'],
  },
  {
    provider: 'gitlab',
    name: 'GitLab',
    description: 'Integrate with GitLab projects and CI/CD',
    icon: '🦊',
    category: 'development',
    scopes: ['repos.read', 'pipelines.read'],
  },
  {
    provider: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track portfolio and project analytics',
    icon: '📊',
    category: 'analytics',
    scopes: ['analytics.read'],
  },
  {
    provider: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows with 5000+ apps',
    icon: '⚡',
    category: 'productivity',
    scopes: ['webhooks'],
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  connected: { label: 'Connected', color: '#22c55e' },
  disconnected: { label: 'Not Connected', color: '#6b7280' },
  pending: { label: 'Pending', color: '#f59e0b' },
  error: { label: 'Error', color: '#ef4444' },
};

export default function IntegrationsPage() {
  const { resolvedTheme } = useTheme();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSettings, setShowSettings] = useState<Integration | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<Integration | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.list() as any;
      const connected = response.items || [];
      
      // Merge with available integrations
      const merged = availableIntegrations.map(avail => {
        const existing = connected.find((c: Integration) => c.provider === avail.provider);
        return existing || {
          ...avail,
          id: avail.provider,
          status: 'disconnected' as const,
        };
      });
      
      setIntegrations(merged);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load integrations:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const connectIntegration = async (provider: string) => {
    try {
      setConnecting(provider);
      const response = await integrationsApi.connect(provider) as any;
      
      if (response.auth_url) {
        window.location.href = response.auth_url;
      } else {
        loadIntegrations();
        showToast(`${provider} connected successfully!`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to connect:', error);
      }
      showToast('Failed to connect integration.', 'error');
    } finally {
      setConnecting(null);
    }
  };

  const disconnectIntegration = async (integration: Integration) => {
    setDisconnectTarget(null);
    try {
      await integrationsApi.disconnect(integration.id);
      loadIntegrations();
      showToast(`${integration.name} disconnected.`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to disconnect:', error);
      }
      showToast('Failed to disconnect integration.', 'error');
    }
  };

  const toggleSync = async (integration: Integration) => {
    try {
      await integrationsApi.updateSettings(integration.id, {
        sync_enabled: !integration.sync_enabled,
      });
      setIntegrations(prev =>
        prev.map(i =>
          i.id === integration.id ? { ...i, sync_enabled: !i.sync_enabled } : i
        )
      );
      showToast(`Auto-sync ${!integration.sync_enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to toggle sync:', error);
      }
      showToast('Failed to toggle sync.', 'error');
    }
  };

  const syncNow = async (id: string) => {
    try {
      await integrationsApi.sync(id);
      loadIntegrations();
      showToast('Sync completed!');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to sync:', error);
      }
      showToast('Sync failed. Please try again.', 'error');
    }
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const filteredIntegrations = activeCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === activeCategory);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Integrations</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Connect your favorite tools and services • {connectedCount} connected
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.categories, themeStyles.categories)}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  commonStyles.categoryBtn,
                  themeStyles.categoryBtn,
                  activeCategory === cat.id && commonStyles.categoryActive,
                  activeCategory === cat.id && themeStyles.categoryActive
                )}
              >
                <span className={commonStyles.categoryIcon}>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <Loader size="lg" />
        ) : (
          <StaggerContainer className={commonStyles.integrationsGrid} delay={0.2}>
            {filteredIntegrations.map(integration => {
              const status = statusConfig[integration.status];
              return (
                <StaggerItem key={integration.provider}>
                  <div
                    className={cn(
                      commonStyles.integrationCard,
                      themeStyles.integrationCard,
                      integration.status === 'connected' && commonStyles.connected,
                      integration.status === 'connected' && themeStyles.connected
                    )}
                  >
                    <div className={commonStyles.integrationHeader}>
                      <span className={commonStyles.integrationIcon}>{integration.icon}</span>
                      <div className={commonStyles.integrationInfo}>
                        <h3 className={cn(commonStyles.integrationName, themeStyles.integrationName)}>
                          {integration.name}
                        </h3>
                        <span
                          className={commonStyles.statusBadge}
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <p className={cn(commonStyles.integrationDesc, themeStyles.integrationDesc)}>
                      {integration.description}
                    </p>

                    {integration.scopes && (
                      <div className={commonStyles.scopes}>
                        {integration.scopes.map(scope => (
                          <span
                            key={scope}
                            className={cn(commonStyles.scope, themeStyles.scope)}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    )}

                    {integration.status === 'connected' && (
                      <div className={commonStyles.syncInfo}>
                        <label className={commonStyles.syncToggle}>
                          <input
                            type="checkbox"
                            checked={integration.sync_enabled}
                            onChange={() => toggleSync(integration)}
                          />
                          <span className={cn(commonStyles.syncLabel, themeStyles.syncLabel)}>
                            Auto-sync enabled
                          </span>
                        </label>
                        {integration.last_sync && (
                          <span className={cn(commonStyles.lastSync, themeStyles.lastSync)}>
                            Last sync: {new Date(integration.last_sync).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className={commonStyles.integrationActions}>
                      {integration.status === 'connected' ? (
                        <>
                          <button
                            onClick={() => syncNow(integration.id)}
                            className={cn(commonStyles.syncBtn, themeStyles.syncBtn)}
                          >
                            🔄 Sync Now
                          </button>
                          <button
                            onClick={() => setShowSettings(integration)}
                            className={cn(commonStyles.settingsBtn, themeStyles.settingsBtn)}
                          >
                            ⚙️
                          </button>
                          <button
                            onClick={() => setDisconnectTarget(integration)}
                            className={cn(commonStyles.disconnectBtn, themeStyles.disconnectBtn)}
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => connectIntegration(integration.provider)}
                          disabled={connecting === integration.provider}
                          className={cn(commonStyles.connectBtn, themeStyles.connectBtn)}
                        >
                          {connecting === integration.provider ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowSettings(null)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => e.stopPropagation()}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  {showSettings.icon} {showSettings.name} Settings
                </h2>
                <button
                  onClick={() => setShowSettings(null)}
                  className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                >
                  ×
                </button>
              </div>

              <div className={commonStyles.modalContent}>
                <div className={commonStyles.settingsSection}>
                  <h4 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    Permissions
                  </h4>
                  <div className={commonStyles.permissionsList}>
                    {showSettings.scopes?.map(scope => (
                      <div key={scope} className={cn(commonStyles.permissionItem, themeStyles.permissionItem)}>
                        <span className={commonStyles.permissionIcon}>✓</span>
                        <span>{scope.replace(/\./g, ' ').replace(/^./, s => s.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={commonStyles.settingsSection}>
                  <h4 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    Connection Info
                  </h4>
                  <div className={cn(commonStyles.infoGrid, themeStyles.infoGrid)}>
                    <div className={commonStyles.infoItem}>
                      <span className={commonStyles.infoLabel}>Status</span>
                      <span
                        className={commonStyles.infoValue}
                        style={{ color: statusConfig[showSettings.status].color }}
                      >
                        {statusConfig[showSettings.status].label}
                      </span>
                    </div>
                    {showSettings.connected_at && (
                      <div className={commonStyles.infoItem}>
                        <span className={commonStyles.infoLabel}>Connected</span>
                        <span className={commonStyles.infoValue}>
                          {new Date(showSettings.connected_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {showSettings.last_sync && (
                      <div className={commonStyles.infoItem}>
                        <span className={commonStyles.infoLabel}>Last Sync</span>
                        <span className={commonStyles.infoValue}>
                          {new Date(showSettings.last_sync).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
                <button
                  onClick={() => setShowSettings(null)}
                  className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disconnect Confirmation Modal */}
        <Modal isOpen={disconnectTarget !== null} title="Disconnect Integration" onClose={() => setDisconnectTarget(null)}>
          <p>Are you sure you want to disconnect <strong>{disconnectTarget?.name}</strong>? This will revoke all permissions.</p>
          <div className={commonStyles.actionRow}>
            <Button variant="secondary" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => disconnectTarget && disconnectIntegration(disconnectTarget)}>Disconnect</Button>
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
