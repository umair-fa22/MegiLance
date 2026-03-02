// @AI-HINT: This is the modernized Client Settings page. It features a two-panel layout with sidebar navigation and uses the reusable SettingsSection component for each category.
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { User, Shield, Bell, CreditCard, LifeBuoy, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

import SettingsSection from '@/app/components/SettingsSection/SettingsSection';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import ToggleSwitch from '@/app/components/ToggleSwitch/ToggleSwitch';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import common from './Settings.common.module.css';
import light from './Settings.light.module.css';
import dark from './Settings.dark.module.css';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'billing' | 'support';

const Settings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? dark : light;
    return { ...common, ...themeStyles };
  }, [resolvedTheme]);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State handlers
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productAnnouncements, setProductAnnouncements] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const user = await api.auth.me();
        setName(user.name || user.full_name || '');
        setEmail(user.email || '');
        setBio(user.bio || '');
        // Set other preferences if available in user object
      } catch (err) {
        console.error(err);
        setError('Failed to load profile settings');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      await api.auth.updateProfile({
        name,
        bio
        // Email update usually requires separate flow
      });
      
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className={styles.loading}>Loading settings...</div>;
    }

    switch (activeTab) {
      case 'profile':
        return (
          <SettingsSection
            title="Public Profile"
            description="This information will be displayed publicly on your company profile."
            footerContent={
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            }
          >
            {successMessage && (
              <div className={cn(styles.alertBanner, styles.alertSuccess)} role="status">
                <CheckCircle size={18} aria-hidden="true" /> {successMessage}
              </div>
            )}
            {error && (
              <div className={cn(styles.alertBanner, styles.alertError)} role="alert">
                <AlertCircle size={18} aria-hidden="true" /> {error}
              </div>
            )}
            <div className={styles.formGrid}>
              <Input label="Company Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Contact Email" type="email" value={email} disabled helpText="Contact support to change email." />
              <Textarea
                label="Company Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={200}
                helpText="A brief description of your company. Max 200 characters."
                className={styles.fullSpan}
              />
            </div>
          </SettingsSection>
        );
      case 'security':
        return (
          <SettingsSection
            title="Security"
            description="Manage your account's security settings and password."
            footerContent={<Button>Save Changes</Button>}
          >
            <ToggleSwitch
              id="two-factor-auth"
              label="Two-Factor Authentication"
              checked={twoFactor}
              onChange={setTwoFactor}
              helpText="Enhance your account security by requiring a second verification step."
            />
            <div className={styles.actionRow}>
                <p className={styles.actionDescription}>Update your password by sending a reset link to your email.</p>
                <Button variant="secondary">Send Password Reset Link</Button>
            </div>
          </SettingsSection>
        );
      case 'notifications':
        return (
          <SettingsSection
            title="Notifications"
            description="Control how you receive notifications from MegiLance."
            footerContent={<Button>Save Changes</Button>}
          >
            <ToggleSwitch
              id="email-notifications"
              label="Email Notifications"
              checked={emailNotifications}
              onChange={setEmailNotifications}
              helpText="Receive important updates about your account and projects via email."
            />
            <ToggleSwitch
              id="product-announcements"
              label="Product Announcements"
              checked={productAnnouncements}
              onChange={setProductAnnouncements}
              helpText="Get notified about new features, updates, and special offers."
            />
          </SettingsSection>
        );
      case 'billing':
        return (
          <SettingsSection
            title="Billing"
            description="Manage your payment methods, subscription, and view invoices."
            footerContent={<Button>Save Changes</Button>}
          >
              <div className={styles.formGrid}>
                <Select 
                  id="country-select"
                  label="Country" 
                  defaultValue="US"
                  options={[
                    { value: 'US', label: 'United States' },
                    { value: 'GB', label: 'United Kingdom' },
                    { value: 'CA', label: 'Canada' },
                    { value: 'DE', label: 'Germany' },
                  ]}
                />
                <Input label="Tax ID (Optional)" placeholder="e.g., EUVAT12345" helpText="Your business Tax ID for invoices."/>
              </div>
              <div className={styles.actionRow}>
                <p className={styles.actionDescription}>Update the credit card on file for your account.</p>
                <Button variant="secondary">Update Payment Method</Button>
              </div>
          </SettingsSection>
        );
        case 'support':
            return (
                <SettingsSection
                    title="Support"
                    description="Get help with your account or contact our support team."
                >
                    <div className={styles.supportContent}>
                        <h4>Frequently Asked Questions</h4>
                        <p>Find answers to common questions in our <a href="/help" className={styles.link}>Help Center</a>.</p>
                        <h4>Contact Us</h4>
                        <p>Can&apos;t find what you&apos;re looking for? <a href="/contact" className={styles.link}>Contact our support team</a> directly.</p>
                        <Button iconBefore={<LifeBuoy size={16} />} className={styles.supportButton}>Open Support Ticket</Button>
                    </div>
                </SettingsSection>
            )
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <PageTransition>
      <div className={cn(styles.page, styles.theme)}>
        <ScrollReveal>
          <header className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Manage your client account settings and preferences.</p>
          </header>
        </ScrollReveal>
        <div className={styles.container}>
          <ScrollReveal delay={0.1}>
            <nav className={styles.nav} role="tablist" aria-label="Settings sections">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    role="tab"
                    className={cn(styles.navButton, activeTab === item.id && styles.navButtonActive)}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    aria-selected={activeTab === item.id}
                  >
                    <Icon size={18} className={styles.navIcon} aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </ScrollReveal>
          <ScrollReveal delay={0.2} className={styles.content} role="tabpanel" aria-label={`${activeTab} settings`}>
            {renderContent()}
          </ScrollReveal>
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
