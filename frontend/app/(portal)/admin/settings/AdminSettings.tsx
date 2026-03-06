// @AI-HINT: Enterprise Admin Settings — comprehensive platform configuration: general, security, API, SMTP, file storage, sessions, maintenance, notifications, database
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useAdminData } from '@/hooks/useAdmin';
import Button from '@/app/components/Button/Button';
import {
  Settings,
  Shield,
  Globe,
  Mail,
  HardDrive,
  Clock,
  AlertTriangle,
  Bell,
  Database,
  Server,
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronRight,
  Search,
  Zap,
  FileText,
  UserCheck,
  Palette,
  Webhook,
} from 'lucide-react';

import common from './AdminSettings.common.module.css';
import light from './AdminSettings.light.module.css';
import dark from './AdminSettings.dark.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SectionId = 'general' | 'security' | 'api' | 'email' | 'storage' | 'sessions' | 'maintenance' | 'notifications' | 'database';

interface SectionMeta {
  id: SectionId;
  title: string;
  icon: React.ElementType;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  themed: Record<string, string>;
}

const Toggle: React.FC<ToggleProps> = ({ id, checked, onChange, label, themed }) => (
  <label htmlFor={id} className={common.toggle}>
    <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className={cn(common.toggleLabel, themed.toggleLabel)}>{label}</span>
  </label>
);

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  help?: string;
  themed: Record<string, string>;
  suffix?: string;
  readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, value, onChange, type = 'text', placeholder, help, themed, suffix, readOnly }) => (
  <div className={common.field}>
    <label htmlFor={id} className={common.label}>{label}</label>
    <div className={common.inputGroup}>
      <input
        id={id}
        type={type}
        className={cn(common.input, themed.input)}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {suffix && <span className={cn(common.inputSuffix, themed.inputSuffix)}>{suffix}</span>}
    </div>
    {help && <div className={cn(common.help, themed.help)}>{help}</div>}
  </div>
);

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  help?: string;
  themed: Record<string, string>;
}

const SelectField: React.FC<SelectFieldProps> = ({ id, label, value, onChange, options, help, themed }) => (
  <div className={common.field}>
    <label htmlFor={id} className={common.label}>{label}</label>
    <select id={id} className={cn(common.select, themed.select)} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {help && <div className={cn(common.help, themed.help)}>{help}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const AdminSettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { loading, error } = useAdminData();

  // Active sidebar section
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const markDirty = useCallback(() => { if (!unsavedChanges) setUnsavedChanges(true); }, [unsavedChanges]);

  // ── General Settings ──
  const [companyName, setCompanyName] = useState('MegiLance');
  const [tagline, setTagline] = useState('AI-Powered Freelancing Platform');
  const [supportEmail, setSupportEmail] = useState('support@megilance.com');
  const [siteUrl, setSiteUrl] = useState('https://megilance.com');
  const [defaultLocale, setDefaultLocale] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // ── Security Settings ──
  const [require2FA, setRequire2FA] = useState(true);
  const [passwordMinLength, setPasswordMinLength] = useState('12');
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('30');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [csrfProtection, setCsrfProtection] = useState(true);
  const [contentSecurityPolicy, setContentSecurityPolicy] = useState("default-src 'self';");

  // ── API & Rate Limiting ──
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimitPerMin, setRateLimitPerMin] = useState('60');
  const [rateLimitBurst, setRateLimitBurst] = useState('100');
  const [apiKeyRotationDays, setApiKeyRotationDays] = useState('90');
  const [corsOrigins, setCorsOrigins] = useState('https://megilance.com');
  const [requestTimeout, setRequestTimeout] = useState('30');
  const [maxPayloadSizeMB, setMaxPayloadSizeMB] = useState('10');

  // ── Email / SMTP ──
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [smtpPassword, setSmtpPassword] = useState('••••••••');
  const [smtpTls, setSmtpTls] = useState(true);
  const [emailFromName, setEmailFromName] = useState('MegiLance');
  const [emailFromAddress, setEmailFromAddress] = useState('noreply@megilance.com');

  // ── File Storage ──
  const [storageProvider, setStorageProvider] = useState('local');
  const [maxFileSize, setMaxFileSize] = useState('10');
  const [allowedFileTypes, setAllowedFileTypes] = useState('.pdf,.doc,.docx,.png,.jpg,.jpeg,.svg');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('us-east-1');

  // ── Sessions ──
  const [accessTokenTTL, setAccessTokenTTL] = useState('30');
  const [refreshTokenTTL, setRefreshTokenTTL] = useState('10080');
  const [sessionConcurrency, setSessionConcurrency] = useState('5');
  const [idleTimeout, setIdleTimeout] = useState('60');
  const [rememberMeDays, setRememberMeDays] = useState('30');

  // ── Maintenance ──
  const [maintenanceMsg, setMaintenanceMsg] = useState('We are performing scheduled maintenance. Please check back soon.');
  const [maintenanceAllowedIPs, setMaintenanceAllowedIPs] = useState('');
  const [maintenanceScheduled, setMaintenanceScheduled] = useState('');

  // ── Notifications ──
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [alertOnLogin, setAlertOnLogin] = useState(false);
  const [alertOnPayment, setAlertOnPayment] = useState(true);
  const [alertOnDispute, setAlertOnDispute] = useState(true);
  const [alertOnError, setAlertOnError] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  // ── Database ──
  const [dbUrl, setDbUrl] = useState('libsql://megilance-db.turso.io');
  const [poolSize, setPoolSize] = useState('20');
  const [queryTimeout, setQueryTimeout] = useState('30');
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupRetention, setBackupRetention] = useState('30');

  const sections: SectionMeta[] = useMemo(() => [
    { id: 'general', title: 'General', icon: Settings, description: 'Organization, branding & regional' },
    { id: 'security', title: 'Security', icon: Shield, description: '2FA, passwords, IP whitelist, CSP' },
    { id: 'api', title: 'API & Rate Limiting', icon: Zap, description: 'Rate limits, CORS, timeouts' },
    { id: 'email', title: 'Email / SMTP', icon: Mail, description: 'Outbound email configuration' },
    { id: 'storage', title: 'File Storage', icon: HardDrive, description: 'Upload limits, S3, providers' },
    { id: 'sessions', title: 'Sessions & Auth', icon: Key, description: 'Token TTL, concurrency, idle' },
    { id: 'maintenance', title: 'Maintenance Mode', icon: AlertTriangle, description: 'Scheduled downtime settings' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Alerts, webhooks, digest' },
    { id: 'database', title: 'Database', icon: Database, description: 'Connection, pooling, backups' },
  ], []);

  const filteredSections = useMemo(() => {
    if (!searchTerm) return sections;
    const term = searchTerm.toLowerCase();
    return sections.filter(s =>
      s.title.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    );
  }, [sections, searchTerm]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    setSaving(false);
    setUnsavedChanges(false);
    showToast('All settings saved successfully!');
  }, [showToast]);

  const handleReset = useCallback(() => {
    setUnsavedChanges(false);
    showToast('Changes discarded', 'error');
  }, [showToast]);

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.enterpriseContainer}>
        {/* Header */}
        <ScrollReveal className={common.header}>
          <div className={common.headerInfo}>
            <h1 className={common.title}>Platform Settings</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Configure security, infrastructure, and operational settings for your MegiLance instance.</p>
          </div>
          <div className={common.headerActions}>
            {unsavedChanges && <span className={cn(common.unsavedBadge, themed.unsavedBadge)}>Unsaved changes</span>}
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={!unsavedChanges}>Discard</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving} disabled={!unsavedChanges}>
              <Save size={14} /> Save All
            </Button>
          </div>
        </ScrollReveal>

        {loading && <div className={common.skeletonRow} aria-busy="true" />}
        {error && <div className={common.error}>Failed to load settings.</div>}

        <div className={common.settingsLayout}>
          {/* Sidebar Navigation */}
          <nav className={cn(common.sidebar, themed.sidebar)} aria-label="Settings sections">
            <div className={common.sidebarSearch}>
              <Search size={14} className={common.sidebarSearchIcon} />
              <input
                className={cn(common.sidebarSearchInput, themed.sidebarSearchInput)}
                placeholder="Search settings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {filteredSections.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  className={cn(common.sidebarItem, themed.sidebarItem, activeSection === s.id && common.sidebarItemActive, activeSection === s.id && themed.sidebarItemActive)}
                  onClick={() => setActiveSection(s.id)}
                  aria-current={activeSection === s.id ? 'page' : undefined}
                >
                  <Icon size={16} className={common.sidebarIcon} />
                  <div className={common.sidebarText}>
                    <span className={common.sidebarTitle}>{s.title}</span>
                    <span className={cn(common.sidebarDesc, themed.sidebarDesc)}>{s.description}</span>
                  </div>
                  <ChevronRight size={14} className={common.sidebarArrow} />
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className={common.settingsContent}>
            <div className={common.contentHeader}>
              {currentSection && (
                <>
                  <div className={cn(common.contentIcon, themed.contentIcon)}>
                    {React.createElement(currentSection.icon, { size: 20 })}
                  </div>
                  <div>
                    <h2 className={cn(common.contentTitle, themed.contentTitle)}>{currentSection.title}</h2>
                    <p className={cn(common.contentDesc, themed.contentDesc)}>{currentSection.description}</p>
                  </div>
                </>
              )}
            </div>

            <StaggerContainer>
              {/* ═══ GENERAL ═══ */}
              {activeSection === 'general' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <InputField id="company" label="Company Name" value={companyName} onChange={v => { setCompanyName(v); markDirty(); }} help="Shown in emails, invoices and page titles." themed={themed} />
                    <InputField id="tagline" label="Tagline" value={tagline} onChange={v => { setTagline(v); markDirty(); }} help="Appears in SEO meta and emails." themed={themed} />
                  </div>
                  <div className={common.row}>
                    <InputField id="supportEmail" label="Support Email" value={supportEmail} onChange={v => { setSupportEmail(v); markDirty(); }} type="email" themed={themed} />
                    <InputField id="siteUrl" label="Site URL" value={siteUrl} onChange={v => { setSiteUrl(v); markDirty(); }} type="url" themed={themed} />
                  </div>
                  <div className={common.row}>
                    <SelectField id="locale" label="Default Locale" value={defaultLocale} onChange={v => { setDefaultLocale(v); markDirty(); }} options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                      { value: 'ar', label: 'Arabic' },
                      { value: 'ur', label: 'Urdu' },
                    ]} themed={themed} />
                    <SelectField id="timezone" label="Timezone" value={timezone} onChange={v => { setTimezone(v); markDirty(); }} options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'America/New_York', label: 'Eastern (US)' },
                      { value: 'Europe/London', label: 'London (UK)' },
                      { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
                      { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
                    ]} themed={themed} />
                  </div>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="signups" checked={signupsEnabled} onChange={v => { setSignupsEnabled(v); markDirty(); }} label="Allow New Signups" themed={themed} />
                      <div className={cn(common.help, themed.help)}>Disable to freeze registration.</div>
                    </div>
                    <div className={common.field}>
                      <Toggle id="maint" checked={maintenanceMode} onChange={v => { setMaintenanceMode(v); markDirty(); }} label="Maintenance Mode" themed={themed} />
                      <div className={cn(common.help, themed.help)}>Shows maintenance page to users.</div>
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ SECURITY ═══ */}
              {activeSection === 'security' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="twofa" checked={require2FA} onChange={v => { setRequire2FA(v); markDirty(); }} label="Require Two-Factor Authentication" themed={themed} />
                      <div className={cn(common.help, themed.help)}>Enforces TOTP/SMS-based 2FA for all admin accounts.</div>
                    </div>
                    <InputField id="pwdMinLen" label="Minimum Password Length" value={passwordMinLength} onChange={v => { setPasswordMinLength(v); markDirty(); }} type="number" themed={themed} />
                  </div>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="specialChars" checked={requireSpecialChars} onChange={v => { setRequireSpecialChars(v); markDirty(); }} label="Require Special Characters" themed={themed} />
                    </div>
                    <div className={common.field}>
                      <Toggle id="uppercase" checked={requireUppercase} onChange={v => { setRequireUppercase(v); markDirty(); }} label="Require Uppercase Letter" themed={themed} />
                    </div>
                  </div>
                  <div className={common.row}>
                    <InputField id="maxLogin" label="Max Login Attempts" value={maxLoginAttempts} onChange={v => { setMaxLoginAttempts(v); markDirty(); }} type="number" help="Before account lockout." themed={themed} />
                    <InputField id="lockout" label="Lockout Duration" value={lockoutDuration} onChange={v => { setLockoutDuration(v); markDirty(); }} type="number" suffix="minutes" help="How long to lock after max attempts." themed={themed} />
                  </div>
                  <div className={common.field}>
                    <label htmlFor="ipWhitelist" className={common.label}>IP Whitelist (CIDR)</label>
                    <textarea id="ipWhitelist" rows={3} className={cn(common.textarea, themed.textarea)} placeholder="203.0.113.0/24&#10;10.0.0.0/8" value={ipWhitelist} onChange={e => { setIpWhitelist(e.target.value); markDirty(); }} />
                    <div className={cn(common.help, themed.help)}>One CIDR block per line. Leave empty to allow all.</div>
                  </div>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="csrf" checked={csrfProtection} onChange={v => { setCsrfProtection(v); markDirty(); }} label="CSRF Protection" themed={themed} />
                    </div>
                  </div>
                  <div className={common.field}>
                    <label htmlFor="csp" className={common.label}>Content Security Policy</label>
                    <textarea id="csp" rows={2} className={cn(common.textarea, themed.textarea)} value={contentSecurityPolicy} onChange={e => { setContentSecurityPolicy(e.target.value); markDirty(); }} />
                    <div className={cn(common.help, themed.help)}>CSP header value. Be careful — incorrect values can break the UI.</div>
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ API & RATE LIMITING ═══ */}
              {activeSection === 'api' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="rateLimit" checked={rateLimitEnabled} onChange={v => { setRateLimitEnabled(v); markDirty(); }} label="Enable Rate Limiting" themed={themed} />
                      <div className={cn(common.help, themed.help)}>Uses SlowAPI with Redis backend.</div>
                    </div>
                    <InputField id="ratePerMin" label="Requests per Minute" value={rateLimitPerMin} onChange={v => { setRateLimitPerMin(v); markDirty(); }} type="number" suffix="req/min" themed={themed} />
                  </div>
                  <div className={common.row}>
                    <InputField id="rateBurst" label="Burst Limit" value={rateLimitBurst} onChange={v => { setRateLimitBurst(v); markDirty(); }} type="number" help="Max concurrent requests in burst." themed={themed} />
                    <InputField id="apiKeyRotation" label="API Key Rotation" value={apiKeyRotationDays} onChange={v => { setApiKeyRotationDays(v); markDirty(); }} type="number" suffix="days" themed={themed} />
                  </div>
                  <div className={common.field}>
                    <label htmlFor="cors" className={common.label}>CORS Allowed Origins</label>
                    <textarea id="cors" rows={3} className={cn(common.textarea, themed.textarea)} placeholder="https://megilance.com&#10;https://app.megilance.com" value={corsOrigins} onChange={e => { setCorsOrigins(e.target.value); markDirty(); }} />
                    <div className={cn(common.help, themed.help)}>One origin per line. Use * for all (not recommended for production).</div>
                  </div>
                  <div className={common.row}>
                    <InputField id="reqTimeout" label="Request Timeout" value={requestTimeout} onChange={v => { setRequestTimeout(v); markDirty(); }} type="number" suffix="seconds" themed={themed} />
                    <InputField id="maxPayload" label="Max Payload Size" value={maxPayloadSizeMB} onChange={v => { setMaxPayloadSizeMB(v); markDirty(); }} type="number" suffix="MB" themed={themed} />
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ EMAIL / SMTP ═══ */}
              {activeSection === 'email' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <InputField id="smtpHost" label="SMTP Host" value={smtpHost} onChange={v => { setSmtpHost(v); markDirty(); }} themed={themed} />
                    <InputField id="smtpPort" label="SMTP Port" value={smtpPort} onChange={v => { setSmtpPort(v); markDirty(); }} type="number" themed={themed} />
                  </div>
                  <div className={common.row}>
                    <InputField id="smtpUser" label="SMTP Username" value={smtpUser} onChange={v => { setSmtpUser(v); markDirty(); }} themed={themed} />
                    <div className={common.field}>
                      <label htmlFor="smtpPass" className={common.label}>SMTP Password</label>
                      <div className={common.inputGroup}>
                        <input id="smtpPass" type={showSecrets ? 'text' : 'password'} className={cn(common.input, themed.input)} value={smtpPassword} onChange={e => { setSmtpPassword(e.target.value); markDirty(); }} />
                        <button type="button" className={cn(common.inputToggle, themed.inputToggle)} onClick={() => setShowSecrets(p => !p)} aria-label="Toggle password visibility">
                          {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="smtpTls" checked={smtpTls} onChange={v => { setSmtpTls(v); markDirty(); }} label="Require TLS" themed={themed} />
                    </div>
                  </div>
                  <div className={common.row}>
                    <InputField id="emailFromName" label="From Name" value={emailFromName} onChange={v => { setEmailFromName(v); markDirty(); }} themed={themed} />
                    <InputField id="emailFromAddr" label="From Address" value={emailFromAddress} onChange={v => { setEmailFromAddress(v); markDirty(); }} type="email" themed={themed} />
                  </div>
                  <div className={common.inlineAction}>
                    <Button variant="outline" size="sm" onClick={() => showToast('Test email sent!')}>
                      <Mail size={14} /> Send Test Email
                    </Button>
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ FILE STORAGE ═══ */}
              {activeSection === 'storage' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <SelectField id="storageProvider" label="Storage Provider" value={storageProvider} onChange={v => { setStorageProvider(v); markDirty(); }} options={[
                      { value: 'local', label: 'Local Filesystem' },
                      { value: 's3', label: 'Amazon S3' },
                      { value: 'r2', label: 'Cloudflare R2' },
                      { value: 'gcs', label: 'Google Cloud Storage' },
                    ]} help="Where uploaded files are stored." themed={themed} />
                    <InputField id="maxFileSize" label="Max File Size" value={maxFileSize} onChange={v => { setMaxFileSize(v); markDirty(); }} type="number" suffix="MB" themed={themed} />
                  </div>
                  <div className={common.field}>
                    <InputField id="allowedTypes" label="Allowed File Types" value={allowedFileTypes} onChange={v => { setAllowedFileTypes(v); markDirty(); }} help="Comma-separated extensions." themed={themed} />
                  </div>
                  {storageProvider === 's3' && (
                    <div className={common.row}>
                      <InputField id="s3Bucket" label="S3 Bucket" value={s3Bucket} onChange={v => { setS3Bucket(v); markDirty(); }} themed={themed} />
                      <SelectField id="s3Region" label="S3 Region" value={s3Region} onChange={v => { setS3Region(v); markDirty(); }} options={[
                        { value: 'us-east-1', label: 'US East (N. Virginia)' },
                        { value: 'us-west-2', label: 'US West (Oregon)' },
                        { value: 'eu-west-1', label: 'EU (Ireland)' },
                        { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
                      ]} themed={themed} />
                    </div>
                  )}
                </ScrollReveal>
              )}

              {/* ═══ SESSIONS & AUTH ═══ */}
              {activeSection === 'sessions' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <InputField id="accessTTL" label="Access Token TTL" value={accessTokenTTL} onChange={v => { setAccessTokenTTL(v); markDirty(); }} type="number" suffix="minutes" help="Default: 30 min. Shorter = more secure." themed={themed} />
                    <InputField id="refreshTTL" label="Refresh Token TTL" value={refreshTokenTTL} onChange={v => { setRefreshTokenTTL(v); markDirty(); }} type="number" suffix="minutes" help="Default: 7 days (10080 min)." themed={themed} />
                  </div>
                  <div className={common.row}>
                    <InputField id="sessionConc" label="Max Concurrent Sessions" value={sessionConcurrency} onChange={v => { setSessionConcurrency(v); markDirty(); }} type="number" help="Per user. 0 = unlimited." themed={themed} />
                    <InputField id="idleTimeout" label="Idle Timeout" value={idleTimeout} onChange={v => { setIdleTimeout(v); markDirty(); }} type="number" suffix="minutes" help="Auto-logout after inactivity." themed={themed} />
                  </div>
                  <div className={common.row}>
                    <InputField id="rememberMe" label="Remember Me Duration" value={rememberMeDays} onChange={v => { setRememberMeDays(v); markDirty(); }} type="number" suffix="days" themed={themed} />
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ MAINTENANCE MODE ═══ */}
              {activeSection === 'maintenance' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.field}>
                    <Toggle id="maintMode" checked={maintenanceMode} onChange={v => { setMaintenanceMode(v); markDirty(); }} label="Enable Maintenance Mode" themed={themed} />
                    <div className={cn(common.help, themed.help)}>All non-admin users will see the maintenance page.</div>
                  </div>
                  <div className={common.field}>
                    <label htmlFor="maintMsg" className={common.label}>Maintenance Message</label>
                    <textarea id="maintMsg" rows={3} className={cn(common.textarea, themed.textarea)} value={maintenanceMsg} onChange={e => { setMaintenanceMsg(e.target.value); markDirty(); }} />
                  </div>
                  <div className={common.row}>
                    <InputField id="maintScheduled" label="Scheduled Start (ISO)" value={maintenanceScheduled} onChange={v => { setMaintenanceScheduled(v); markDirty(); }} placeholder="2025-01-15T02:00:00Z" themed={themed} />
                    <div className={common.field}>
                      <label htmlFor="maintIPs" className={common.label}>Admin Bypass IPs</label>
                      <textarea id="maintIPs" rows={2} className={cn(common.textarea, themed.textarea)} placeholder="Your IP addresses..." value={maintenanceAllowedIPs} onChange={e => { setMaintenanceAllowedIPs(e.target.value); markDirty(); }} />
                      <div className={cn(common.help, themed.help)}>These IPs can access the site during maintenance.</div>
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ NOTIFICATIONS ═══ */}
              {activeSection === 'notifications' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="emailAlerts" checked={emailAlerts} onChange={v => { setEmailAlerts(v); markDirty(); }} label="Email Alerts" themed={themed} />
                      <div className={cn(common.help, themed.help)}>Receive critical alerts via email.</div>
                    </div>
                    <div className={common.field}>
                      <Toggle id="smsAlerts" checked={smsAlerts} onChange={v => { setSmsAlerts(v); markDirty(); }} label="SMS Alerts" themed={themed} />
                      <div className={cn(common.help, themed.help)}>High-priority alerts via SMS.</div>
                    </div>
                  </div>
                  <div className={common.field}>
                    <InputField id="slackWebhook" label="Slack Webhook URL" value={slackWebhook} onChange={v => { setSlackWebhook(v); markDirty(); }} placeholder="https://hooks.slack.com/services/..." help="Pipe alerts to a Slack channel." themed={themed} />
                  </div>
                  <h3 className={cn(common.subsectionTitle, themed.subsectionTitle)}>Alert Triggers</h3>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="alertLogin" checked={alertOnLogin} onChange={v => { setAlertOnLogin(v); markDirty(); }} label="Failed Login Attempts" themed={themed} />
                    </div>
                    <div className={common.field}>
                      <Toggle id="alertPayment" checked={alertOnPayment} onChange={v => { setAlertOnPayment(v); markDirty(); }} label="Payment Events" themed={themed} />
                    </div>
                  </div>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="alertDispute" checked={alertOnDispute} onChange={v => { setAlertOnDispute(v); markDirty(); }} label="Dispute Escalations" themed={themed} />
                    </div>
                    <div className={common.field}>
                      <Toggle id="alertError" checked={alertOnError} onChange={v => { setAlertOnError(v); markDirty(); }} label="Server Errors (5xx)" themed={themed} />
                    </div>
                  </div>
                  <div className={common.field}>
                    <Toggle id="dailyDigest" checked={dailyDigest} onChange={v => { setDailyDigest(v); markDirty(); }} label="Daily Digest Email" themed={themed} />
                    <div className={cn(common.help, themed.help)}>Summary of key metrics sent at 9am UTC.</div>
                  </div>
                </ScrollReveal>
              )}

              {/* ═══ DATABASE ═══ */}
              {activeSection === 'database' && (
                <ScrollReveal className={cn(common.section, themed.section)}>
                  <InputField id="dbUrl" label="Database URL" value={dbUrl} onChange={v => { setDbUrl(v); markDirty(); }} help="Turso libSQL connection URL." themed={themed} readOnly />
                  <div className={common.row}>
                    <InputField id="poolSize" label="Connection Pool Size" value={poolSize} onChange={v => { setPoolSize(v); markDirty(); }} type="number" help="Max concurrent DB connections." themed={themed} />
                    <InputField id="queryTimeout" label="Query Timeout" value={queryTimeout} onChange={v => { setQueryTimeout(v); markDirty(); }} type="number" suffix="seconds" themed={themed} />
                  </div>
                  <h3 className={cn(common.subsectionTitle, themed.subsectionTitle)}>Backups</h3>
                  <div className={common.row}>
                    <div className={common.field}>
                      <Toggle id="backupEnabled" checked={backupEnabled} onChange={v => { setBackupEnabled(v); markDirty(); }} label="Automated Backups" themed={themed} />
                    </div>
                    <SelectField id="backupFreq" label="Backup Frequency" value={backupFrequency} onChange={v => { setBackupFrequency(v); markDirty(); }} options={[
                      { value: 'hourly', label: 'Hourly' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                    ]} themed={themed} />
                  </div>
                  <InputField id="backupRetention" label="Retention Period" value={backupRetention} onChange={v => { setBackupRetention(v); markDirty(); }} type="number" suffix="days" themed={themed} />
                </ScrollReveal>
              )}
            </StaggerContainer>
          </div>
        </div>

        {/* Floating save bar */}
        {unsavedChanges && (
          <div className={cn(common.saveBar, themed.saveBar)}>
            <span className={common.saveBarText}>You have unsaved changes</span>
            <Button variant="ghost" size="sm" onClick={handleReset}>Discard</Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
              <Save size={14} /> Save All
            </Button>
          </div>
        )}

        {toast && (
          <div className={cn(common.toast, toast.type === 'error' && common.toastError, themed.toast, toast.type === 'error' && themed.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
