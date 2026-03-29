// @AI-HINT: Custom branding page for admin to configure white-label settings
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { brandingApi } from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Modal from '@/app/components/organisms/Modal/Modal';
import Select from '@/app/components/molecules/Select/Select';
import Textarea from '@/app/components/atoms/Textarea/Textarea';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import commonStyles from './Branding.common.module.css';
import lightStyles from './Branding.light.module.css';
import darkStyles from './Branding.dark.module.css';

interface BrandingSettings {
  company_name: string;
  tagline: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css: string;
  footer_text: string;
  support_email: string;
  terms_url: string;
  privacy_url: string;
  social_links: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

const DEFAULT_SETTINGS: BrandingSettings = {
  company_name: 'MegiLance',
  tagline: 'AI-Powered Freelancing Platform',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  primary_color: '#4573df',
  secondary_color: '#27ae60',
  accent_color: '#ff9800',
  font_family: 'Inter',
  custom_css: '',
  footer_text: '© 2025 MegiLance. All rights reserved.',
  support_email: 'support@megilance.com',
  terms_url: '/terms',
  privacy_url: '/privacy',
  social_links: {}
};

const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Source Sans Pro'
];

export default function BrandingPage() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await (brandingApi as any).getConfig?.('default').catch((e: unknown) => { console.error('Branding config load failed:', e); return null; }) || await (brandingApi as any).getSettings?.().catch((e: unknown) => { console.error('Branding settings load failed:', e); return null; });
      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load branding settings:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await (brandingApi as any).updateConfig?.('default', settings) || await (brandingApi as any).updateSettings?.(settings);
      setHasChanges(false);
      showToast('Branding settings saved!');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save settings:', err);
      }
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    setShowResetConfirm(false);
    showToast('Settings reset to defaults.');
  };

  const updateField = (field: keyof BrandingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateSocialLink = (platform: string, url: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: url }
    }));
    setHasChanges(true);
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const tabs = [
    { id: 'general', label: '📝 General' },
    { id: 'colors', label: '🎨 Colors' },
    { id: 'logos', label: '🖼️ Logos' },
    { id: 'typography', label: '🔤 Typography' },
    { id: 'links', label: '🔗 Links & Social' },
    { id: 'advanced', label: '⚙️ Advanced' }
  ];

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.loading}>Loading branding settings...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Custom Branding</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Customize the platform appearance and branding
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="secondary" onClick={handleReset}>
                Reset Defaults
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!hasChanges || saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </header>
        </ScrollReveal>

        {/* Preview Card */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.previewCard, themeStyles.previewCard)}>
            <div className={commonStyles.previewHeader}>
              <h3>Live Preview</h3>
            </div>
            <div
              className={commonStyles.previewContent}
              style={{
                '--preview-primary': settings.primary_color,
                '--preview-secondary': settings.secondary_color,
                '--preview-accent': settings.accent_color,
                '--preview-font': settings.font_family
              } as React.CSSProperties}
            >
              <div className={commonStyles.mockHeader}>
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className={commonStyles.mockLogo} />
                ) : (
                  <span className={commonStyles.mockLogoText}>{settings.company_name}</span>
                )}
                <div className={commonStyles.mockNav}>
                  <span>Find Work</span>
                  <span>Find Talent</span>
                  <button style={{ backgroundColor: settings.primary_color }}>Sign Up</button>
                </div>
              </div>
              <div className={commonStyles.mockHero}>
                <h2 style={{ fontFamily: settings.font_family }}>{settings.company_name}</h2>
                <p>{settings.tagline}</p>
                <button style={{ backgroundColor: settings.primary_color }}>Get Started</button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={commonStyles.tabsRow}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(commonStyles.tabBtn, themeStyles.tabBtn, activeTab === tab.id && commonStyles.tabBtnActive, activeTab === tab.id && themeStyles.tabBtnActive)}>
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className={commonStyles.tabContent}>
            {activeTab === 'general' && (
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-company-name">Company Name</label>
                  <Input
                    id="branding-company-name"
                    value={settings.company_name}
                    onChange={e => updateField('company_name', e.target.value)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-tagline">Tagline</label>
                  <Input
                    id="branding-tagline"
                    value={settings.tagline}
                    onChange={e => updateField('tagline', e.target.value)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-support-email">Support Email</label>
                  <Input
                    id="branding-support-email"
                    type="email"
                    value={settings.support_email}
                    onChange={e => updateField('support_email', e.target.value)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-footer-text">Footer Text</label>
                  <Input
                    id="branding-footer-text"
                    value={settings.footer_text}
                    onChange={e => updateField('footer_text', e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <div className={commonStyles.colorGrid}>
                  <div className={commonStyles.colorGroup}>
                    <label htmlFor="branding-primary-color">Primary Color</label>
                    <div className={commonStyles.colorInput}>
                      <input
                        id="branding-primary-color"
                        type="color"
                        value={settings.primary_color}
                        onChange={e => updateField('primary_color', e.target.value)}
                      />
                      <Input
                        aria-label="Primary color hex value"
                        value={settings.primary_color}
                        onChange={e => updateField('primary_color', e.target.value)}
                      />
                    </div>
                    <span className={commonStyles.colorHint}>Buttons, links, active states</span>
                  </div>
                  <div className={commonStyles.colorGroup}>
                    <label htmlFor="branding-secondary-color">Secondary Color</label>
                    <div className={commonStyles.colorInput}>
                      <input
                        id="branding-secondary-color"
                        type="color"
                        value={settings.secondary_color}
                        onChange={e => updateField('secondary_color', e.target.value)}
                      />
                      <Input
                        aria-label="Secondary color hex value"
                        value={settings.secondary_color}
                        onChange={e => updateField('secondary_color', e.target.value)}
                      />
                    </div>
                    <span className={commonStyles.colorHint}>Success states, positive actions</span>
                  </div>
                  <div className={commonStyles.colorGroup}>
                    <label htmlFor="branding-accent-color">Accent Color</label>
                    <div className={commonStyles.colorInput}>
                      <input
                        id="branding-accent-color"
                        type="color"
                        value={settings.accent_color}
                        onChange={e => updateField('accent_color', e.target.value)}
                      />
                      <Input
                        aria-label="Accent color hex value"
                        value={settings.accent_color}
                        onChange={e => updateField('accent_color', e.target.value)}
                      />
                    </div>
                    <span className={commonStyles.colorHint}>Highlights, notifications</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logos' && (
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-logo-url">Logo (Light Mode)</label>
                  <Input
                    id="branding-logo-url"
                    type="url"
                    value={settings.logo_url}
                    onChange={e => updateField('logo_url', e.target.value)}
                    placeholder="https://... (image URL)"
                  />
                  {settings.logo_url && (
                    <div className={commonStyles.logoPreview}>
                      <img src={settings.logo_url} alt="Logo preview" />
                    </div>
                  )}
                </div>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-logo-dark-url">Logo (Dark Mode)</label>
                  <Input
                    id="branding-logo-dark-url"
                    type="url"
                    value={settings.logo_dark_url}
                    onChange={e => updateField('logo_dark_url', e.target.value)}
                    placeholder="https://... (image URL)"
                  />
                  {settings.logo_dark_url && (
                    <div className={cn(commonStyles.logoPreview, commonStyles.darkPreview)}>
                      <img src={settings.logo_dark_url} alt="Dark logo preview" />
                    </div>
                  )}
                </div>
                <div className={commonStyles.formGroup}>
                  <label htmlFor="branding-favicon-url">Favicon</label>
                  <Input
                    id="branding-favicon-url"
                    type="url"
                    value={settings.favicon_url}
                    onChange={e => updateField('favicon_url', e.target.value)}
                    placeholder="https://... (32x32 icon URL)"
                  />
                </div>
              </div>
            )}

            {activeTab === 'typography' && (
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <div className={commonStyles.formGroup}>
                  <label>Font Family</label>
                  <Select
                    aria-label="Font family"
                    value={settings.font_family}
                    onChange={e => updateField('font_family', e.target.value)}
                    options={FONT_OPTIONS.map(font => ({ value: font, label: font }))}
                  />
                </div>
                <div className={cn(commonStyles.fontPreview, themeStyles.fontPreview)}>
                  <h3 style={{ fontFamily: settings.font_family }}>
                    The quick brown fox jumps over the lazy dog
                  </h3>
                  <p style={{ fontFamily: settings.font_family }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <h3>Legal Pages</h3>
                <div className={commonStyles.formRow}>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="branding-terms-url">Terms of Service URL</label>
                    <Input
                      id="branding-terms-url"
                      value={settings.terms_url}
                      onChange={e => updateField('terms_url', e.target.value)}
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="branding-privacy-url">Privacy Policy URL</label>
                    <Input
                      id="branding-privacy-url"
                      value={settings.privacy_url}
                      onChange={e => updateField('privacy_url', e.target.value)}
                    />
                  </div>
                </div>

                <h3>Social Links</h3>
                <div className={commonStyles.formRow}>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="branding-twitter">🐦 Twitter</label>
                    <Input
                      id="branding-twitter"
                      type="url"
                      value={settings.social_links.twitter || ''}
                      onChange={e => updateSocialLink('twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="branding-linkedin">💼 LinkedIn</label>
                    <Input
                      id="branding-linkedin"
                      type="url"
                      value={settings.social_links.linkedin || ''}
                      onChange={e => updateSocialLink('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                </div>
                <div className={commonStyles.formRow}>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="branding-facebook">📘 Facebook</label>
                    <Input
                      id="branding-facebook"
                      type="url"
                      value={settings.social_links.facebook || ''}
                      onChange={e => updateSocialLink('facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label htmlFor="branding-instagram">📷 Instagram</label>
                    <Input
                      id="branding-instagram"
                      type="url"
                      value={settings.social_links.instagram || ''}
                      onChange={e => updateSocialLink('instagram', e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <div className={commonStyles.formGroup}>
                  <label>Custom CSS</label>
                  <p className={commonStyles.hint}>
                    Add custom CSS to override default styles. Use with caution.
                  </p>
                  <Textarea
                    aria-label="Custom CSS"
                    value={settings.custom_css}
                    onChange={e => updateField('custom_css', e.target.value)}
                    rows={12}
                    placeholder="/* Custom CSS rules */"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Unsaved Banner */}
        {hasChanges && (
          <ScrollReveal delay={0.4}>
            <div className={cn(commonStyles.unsavedBanner, themeStyles.unsavedBanner)}>
              <span>⚠️ You have unsaved changes</span>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Now'}
              </Button>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <Modal isOpen onClose={() => setShowResetConfirm(false)} title="Reset Branding">
          <p className={commonStyles.confirmText}>Are you sure you want to reset all branding settings to defaults? This cannot be undone.</p>
          <div className={commonStyles.modalActions}>
            <Button variant="secondary" size="sm" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={confirmReset}>Reset All</Button>
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
