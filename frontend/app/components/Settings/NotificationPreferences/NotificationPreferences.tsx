// @AI-HINT: Notification preferences - multi-channel settings with granular controls
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
  Bell, Mail, Smartphone, MessageSquare,
  Save, CheckCircle 
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Select from '@/app/components/Select/Select';

import commonStyles from './NotificationPreferences.common.module.css';
import lightStyles from './NotificationPreferences.light.module.css';
import darkStyles from './NotificationPreferences.dark.module.css';

interface NotificationChannel {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

interface NotificationPrefs {
  projectUpdates: NotificationChannel;
  proposals: NotificationChannel;
  messages: NotificationChannel;
  payments: NotificationChannel;
  reviews: NotificationChannel;
  marketing: NotificationChannel;
}

interface DigestSettings {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quietHoursStart: string;
  quietHoursEnd: string;
}

const NotificationPreferences: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPrefs>({
    projectUpdates: { email: true, push: true, sms: false, inApp: true },
    proposals: { email: true, push: true, sms: true, inApp: true },
    messages: { email: true, push: true, sms: false, inApp: true },
    payments: { email: true, push: true, sms: true, inApp: true },
    reviews: { email: true, push: false, sms: false, inApp: true },
    marketing: { email: false, push: false, sms: false, inApp: false },
  });

  const [digest, setDigest] = useState<DigestSettings>({
    frequency: 'realtime',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    section: cn(commonStyles.section, themeStyles.section),
    sectionTitle: cn(commonStyles.sectionTitle, themeStyles.sectionTitle),
    table: cn(commonStyles.table, themeStyles.table),
    tableHeader: cn(commonStyles.tableHeader, themeStyles.tableHeader),
    tableRow: cn(commonStyles.tableRow, themeStyles.tableRow),
    categoryCell: cn(commonStyles.categoryCell, themeStyles.categoryCell),
    checkbox: cn(commonStyles.checkbox, themeStyles.checkbox),
    digestSettings: cn(commonStyles.digestSettings, themeStyles.digestSettings),
    actions: cn(commonStyles.actions, themeStyles.actions),
    successMessage: cn(commonStyles.successMessage, themeStyles.successMessage),
    loadingState: commonStyles.loadingState,
    titleIcon: commonStyles.titleIcon,
    categoryDescription: commonStyles.categoryDescription,
    quietHoursGrid: commonStyles.quietHoursGrid,
    fieldLabel: commonStyles.fieldLabel,
    timeInput: cn(commonStyles.timeInput, themeStyles.timeInput),
    quietHoursNote: commonStyles.quietHoursNote,
    inlineIcon: commonStyles.inlineIcon,
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data: any = await (api.users as any).getNotificationPreferences?.();

      if (data) {
        if (data.preferences) setPreferences(data.preferences);
        if (data.digest) setDigest(data.digest);
      }
    } catch {
      // Failed to load preferences, use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (category: keyof NotificationPrefs, channel: keyof NotificationChannel) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await (api.users as any).updateNotificationPreferences?.({ preferences, digest });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Failed to save preferences
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { key: 'projectUpdates' as const, label: 'Project Updates', description: 'New bids, status changes, deadlines' },
    { key: 'proposals' as const, label: 'Proposals', description: 'Proposal submissions, acceptances, rejections' },
    { key: 'messages' as const, label: 'Messages', description: 'New messages, chat notifications' },
    { key: 'payments' as const, label: 'Payments', description: 'Payment confirmations, invoices, disputes' },
    { key: 'reviews' as const, label: 'Reviews & Ratings', description: 'New reviews, rating updates' },
    { key: 'marketing' as const, label: 'Marketing & Tips', description: 'Platform updates, tips, newsletters' },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Bell size={18} className={styles.titleIcon} />
          Notification Preferences
        </h1>
        <p className={styles.subtitle}>
          Control how and when you receive notifications
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Channels</h2>
        
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.categoryCell}>Category</div>
            <div><Mail size={16} /> Email</div>
            <div><Bell size={16} /> Push</div>
            <div><MessageSquare size={16} /> SMS</div>
            <div><Smartphone size={16} /> In-App</div>
          </div>

          {categories.map(category => (
            <div key={category.key} className={styles.tableRow}>
              <div className={styles.categoryCell}>
                <strong>{category.label}</strong>
                <span className={styles.categoryDescription}>{category.description}</span>
              </div>
              <div>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={preferences[category.key].email}
                  onChange={() => handleChannelToggle(category.key, 'email')}
                  aria-label={`Email notifications for ${category.label}`}
                />
              </div>
              <div>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={preferences[category.key].push}
                  onChange={() => handleChannelToggle(category.key, 'push')}
                  aria-label={`Push notifications for ${category.label}`}
                />
              </div>
              <div>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={preferences[category.key].sms}
                  onChange={() => handleChannelToggle(category.key, 'sms')}
                  aria-label={`SMS notifications for ${category.label}`}
                />
              </div>
              <div>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={preferences[category.key].inApp}
                  onChange={() => handleChannelToggle(category.key, 'inApp')}
                  aria-label={`In-app notifications for ${category.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Digest Settings</h2>
        <div className={styles.digestSettings}>
          <Select
            id="digestFrequency"
            label="Digest Frequency"
            value={digest.frequency}
            onChange={(e) => setDigest({ ...digest, frequency: e.target.value as any })}
            options={[
              { value: 'realtime', label: 'Real-time (Instant notifications)' },
              { value: 'hourly', label: 'Hourly (Summary every hour)' },
              { value: 'daily', label: 'Daily (Once per day)' },
              { value: 'weekly', label: 'Weekly (Once per week)' },
            ]}
          />
          
          <div className={styles.quietHoursGrid}>
            <div>
              <label className={styles.fieldLabel}>Quiet Hours Start</label>
              <input
                type="time"
                value={digest.quietHoursStart}
                onChange={(e) => setDigest({ ...digest, quietHoursStart: e.target.value })}
                className={styles.timeInput}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Quiet Hours End</label>
              <input
                type="time"
                value={digest.quietHoursEnd}
                onChange={(e) => setDigest({ ...digest, quietHoursEnd: e.target.value })}
                className={styles.timeInput}
              />
            </div>
          </div>
          <p className={styles.quietHoursNote}>
            No notifications will be sent during quiet hours (except urgent payments)
          </p>
        </div>
      </div>

      {saved && (
        <div className={styles.successMessage}>
          <CheckCircle size={16} className={styles.inlineIcon} />
          Preferences saved successfully!
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={saving}
          disabled={saving}
        >
          <Save size={16} className={styles.inlineIcon} />
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
