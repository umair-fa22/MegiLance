// @AI-HINT: Admin Integrations page - manage third-party integrations (Slack, GitHub, Trello, Calendar, Stripe, etc.)
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { integrationsApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Loading from '@/app/components/Loading/Loading';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import {
  Puzzle, Settings, Link2, Unlink, RefreshCw, AlertCircle,
  MessageSquare, Github, Trello, Calendar, CreditCard, Zap, TestTube
} from 'lucide-react';
import commonStyles from './Integrations.common.module.css';
import lightStyles from './Integrations.light.module.css';
import darkStyles from './Integrations.dark.module.css';

type TabFilter = 'all' | 'connected' | 'available';

interface Integration {
  id?: string;
  type: string;
  name: string;
  description: string;
  connected: boolean;
  icon?: string;
  last_synced?: string;
  status?: string;
}

const INTEGRATION_ICONS: Record<string, React.ReactNode> = {
  slack: <MessageSquare size={22} />,
  github: <Github size={22} />,
  trello: <Trello size={22} />,
  google_calendar: <Calendar size={22} />,
  stripe: <CreditCard size={22} />,
};

const ICON_CLASSES: Record<string, string> = {
  slack: 'iconSlack',
  github: 'iconGithub',
  trello: 'iconTrello',
  google_calendar: 'iconCalendar',
  stripe: 'iconStripe',
};

const DEFAULT_INTEGRATIONS: Integration[] = [
  { type: 'slack', name: 'Slack', description: 'Send notifications and updates to Slack channels. Receive real-time alerts for projects, payments, and disputes.', connected: false },
  { type: 'github', name: 'GitHub', description: 'Link repositories to projects, create issues automatically, and track code contributions from freelancers.', connected: false },
  { type: 'trello', name: 'Trello', description: 'Sync project tasks with Trello boards. Auto-create cards for milestones and track progress visually.', connected: false },
  { type: 'google_calendar', name: 'Google Calendar', description: 'Sync deadlines, meetings, and milestones. Set automated reminders for project deliverables.', connected: false },
  { type: 'stripe', name: 'Stripe', description: 'Process payments, manage subscriptions, handle refunds, and view transaction analytics.', connected: false },
  { type: 'zapier', name: 'Zapier', description: 'Connect MegiLance with 5000+ apps. Automate workflows with triggers and actions.', connected: false },
];

export default function IntegrationsPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);

      const [availRes, connectedRes] = await Promise.allSettled([
        integrationsApi.list(),
        integrationsApi.getAvailable(),
      ]);

      const available = availRes.status === 'fulfilled' ? (Array.isArray(availRes.value) ? availRes.value : []) : [];
      const connected = connectedRes.status === 'fulfilled' ? (Array.isArray(connectedRes.value) ? connectedRes.value : []) : [];
      const connectedTypes = new Set(connected.map((c: Record<string, unknown>) => c.type as string));

      if (available.length > 0) {
        setIntegrations(available.map((a: Record<string, unknown>) => ({
          ...a,
          type: a.type as string ?? a.integration_type as string ?? '',
          name: a.name as string ?? a.type as string ?? '',
          description: a.description as string ?? '',
          connected: connectedTypes.has(a.type as string ?? a.integration_type as string),
        })) as Integration[]);
      } else {
        // Use defaults with connectivity status
        setIntegrations(DEFAULT_INTEGRATIONS.map(d => ({
          ...d,
          connected: connectedTypes.has(d.type),
        })));
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load integrations:', err);
      }
      setIntegrations(DEFAULT_INTEGRATIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    try {
      await integrationsApi.connect(integration.type);
      setIntegrations(prev => prev.map(i => i.type === integration.type ? { ...i, connected: true } : i));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Connect failed:', err);
      }
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Disconnect ${integration.name}?`)) return;
    try {
      await integrationsApi.disconnect(integration.id ?? integration.type);
      setIntegrations(prev => prev.map(i => i.type === integration.type ? { ...i, connected: false } : i));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Disconnect failed:', err);
      }
    }
  };

  const filtered = useMemo(() => {
    if (activeTab === 'connected') return integrations.filter(i => i.connected);
    if (activeTab === 'available') return integrations.filter(i => !i.connected);
    return integrations;
  }, [integrations, activeTab]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerInfo}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <Puzzle size={24} /> Integrations
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Connect third-party services to extend platform capabilities
              </p>
            </div>
          </div>
        </ScrollReveal>

        {error && (
          <div className={commonStyles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={loadIntegrations}>Retry</Button>
          </div>
        )}

        {loading ? (
          <Loading text="Loading integrations..." />
        ) : (
          <>
            <ScrollReveal>
              <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
                {([['all', `All (${integrations.length})`], ['connected', `Connected (${integrations.filter(i => i.connected).length})`], ['available', `Available (${integrations.filter(i => !i.connected).length})`]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    className={cn(commonStyles.tab, themeStyles.tab, activeTab === val && commonStyles.tabActive, activeTab === val && themeStyles.tabActive)}
                    onClick={() => setActiveTab(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {filtered.length === 0 ? (
              <div className={commonStyles.emptyState}>
                <div className={commonStyles.emptyIcon}><Puzzle size={48} /></div>
                <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
                  {activeTab === 'connected' ? 'No Connected Integrations' : 'No Integrations Available'}
                </h3>
                <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
                  {activeTab === 'connected' ? 'Connect an integration to get started.' : 'Check back later for new integrations.'}
                </p>
              </div>
            ) : (
              <ScrollReveal>
                <div className={commonStyles.integrationsGrid}>
                  {filtered.map(integration => {
                    const iconClass = ICON_CLASSES[integration.type] ?? 'iconDefault';
                    return (
                      <div key={integration.type} className={cn(commonStyles.integrationCard, themeStyles.integrationCard)}>
                        <div className={cn(commonStyles.cardIcon, commonStyles[iconClass])}>
                          {INTEGRATION_ICONS[integration.type] ?? <Zap size={22} />}
                        </div>
                        <h3 className={cn(commonStyles.cardName, themeStyles.cardName)}>{integration.name}</h3>
                        <p className={cn(commonStyles.cardDesc, themeStyles.cardDesc)}>{integration.description}</p>
                        <div className={cn(commonStyles.cardStatus, themeStyles.cardStatus)}>
                          <span className={cn(commonStyles.statusDot, integration.connected ? commonStyles.statusConnected : commonStyles.statusDisconnected)} />
                          {integration.connected ? 'Connected' : 'Not connected'}
                        </div>
                        <div className={commonStyles.cardActions}>
                          {integration.connected ? (
                            <>
                              <Button variant="secondary" size="sm" iconBefore={<Settings size={14} />}>Settings</Button>
                              <Button variant="secondary" size="sm" iconBefore={<TestTube size={14} />}>Test</Button>
                              <Button variant="danger" size="sm" iconBefore={<Unlink size={14} />} onClick={() => handleDisconnect(integration)}>
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button variant="primary" size="sm" iconBefore={<Link2 size={14} />} onClick={() => handleConnect(integration)}>
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollReveal>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
