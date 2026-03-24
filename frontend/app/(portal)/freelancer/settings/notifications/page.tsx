// @AI-HINT: This is the Notifications Settings page. It allows freelancers to manage their notification preferences using a clean, modern interface with reusable components.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useToaster } from '@/app/components/Toast/ToasterProvider';

import Button from '@/app/components/Button/Button';
import NotificationOption from './components/NotificationOption/NotificationOption';

import commonStyles from '../Settings.common.module.css';
import lightStyles from '../Settings.light.module.css';
import darkStyles from '../Settings.dark.module.css';

// Default settings when API is not available
const defaultSettings = {
  newJobAlerts: true,
  proposalStatusUpdates: true,
  messageNotifications: true,
  paymentConfirmations: true,
  weeklySummary: false,
};

const NotificationSettingsPage = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  const [settings, setSettings] = useState(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { settingsApi } = await import('@/lib/api') as any;
      const response = await settingsApi?.getNotificationPreferences?.().catch((e: unknown) => { console.error('Load notification prefs failed:', e); return null; });
      
      if (response) {
        setSettings({
          newJobAlerts: response.new_job_alerts ?? response.newJobAlerts ?? defaultSettings.newJobAlerts,
          proposalStatusUpdates: response.proposal_status_updates ?? response.proposalStatusUpdates ?? defaultSettings.proposalStatusUpdates,
          messageNotifications: response.message_notifications ?? response.messageNotifications ?? defaultSettings.messageNotifications,
          paymentConfirmations: response.payment_confirmations ?? response.paymentConfirmations ?? defaultSettings.paymentConfirmations,
          weeklySummary: response.weekly_summary ?? response.weeklySummary ?? defaultSettings.weeklySummary,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load notification settings:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { settingsApi } = await import('@/lib/api') as any;
      await settingsApi?.updateNotificationPreferences?.({
        new_job_alerts: settings.newJobAlerts,
        proposal_status_updates: settings.proposalStatusUpdates,
        message_notifications: settings.messageNotifications,
        payment_confirmations: settings.paymentConfirmations,
        weekly_summary: settings.weeklySummary,
      });
      
      toaster.notify({ title: 'Saved', description: 'Notification settings saved!', variant: 'success' });
    } catch (error) {
      toaster.notify({ title: 'Error', description: 'Failed to save settings', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn(commonStyles.formContainer, styles.formContainer)}>
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.formContainer, styles.formContainer)}>
      <header className={cn(commonStyles.formHeader, styles.formHeader)}>
        <h2 className={cn(commonStyles.formTitle, styles.formTitle)}>Notifications</h2>
        <p className={cn(commonStyles.formDescription, styles.formDescription)}>
          Choose how you want to be notified about activity on MegiLance.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={commonStyles.form}>
        <div className={commonStyles.inputGroup}>
          <NotificationOption
            id="new-job-alerts"
            title="New Job Alerts"
            description="Receive an email when a new job matches your skills."
            checked={settings.newJobAlerts}
            onChange={(value) => handleSettingChange('newJobAlerts', value)}
          />
          <NotificationOption
            id="proposal-status-updates"
            title="Proposal Status Updates"
            description="Get notified when a client views or responds to your proposal."
            checked={settings.proposalStatusUpdates}
            onChange={(value) => handleSettingChange('proposalStatusUpdates', value)}
          />
          <NotificationOption
            id="message-notifications"
            title="Direct Message Notifications"
            description="Receive a push notification for new direct messages."
            checked={settings.messageNotifications}
            onChange={(value) => handleSettingChange('messageNotifications', value)}
          />
          <NotificationOption
            id="payment-confirmations"
            title="Payment Confirmations"
            description="Get an email when a payment is processed to your account."
            checked={settings.paymentConfirmations}
            onChange={(value) => handleSettingChange('paymentConfirmations', value)}
          />
          <NotificationOption
            id="weekly-summary"
            title="Weekly Summary"
            description="Receive a weekly digest of your activity and earnings."
            checked={settings.weeklySummary}
            onChange={(value) => handleSettingChange('weeklySummary', value)}
          />
        </div>

        <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </footer>
      </form>
    </div>
  );
};

export default NotificationSettingsPage;
