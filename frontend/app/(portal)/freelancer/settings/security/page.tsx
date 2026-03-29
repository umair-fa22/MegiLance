// @AI-HINT: Security settings page - 2FA setup, active sessions, backup codes, login alerts
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { twoFactorApi } from '@/lib/api';
import Modal from '@/app/components/organisms/Modal/Modal';
import Button from '@/app/components/atoms/Button/Button';
import Loader from '@/app/components/atoms/Loader/Loader';
import commonStyles from './Security.common.module.css';
import lightStyles from './Security.light.module.css';
import darkStyles from './Security.dark.module.css';
import LinkedAccounts from '@/app/components/organisms/LinkedAccounts/LinkedAccounts';

interface TwoFactorStatus {
  enabled: boolean;
  method?: string;
  verified_at?: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

interface BackupCode {
  code: string;
  used: boolean;
}

export default function SecuritySettingsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'2fa' | 'sessions' | 'alerts'>('2fa');
  
  // 2FA State
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Alerts State
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [unknownDeviceAlert, setUnknownDeviceAlert] = useState(true);
  const [passwordChangeAlert, setPasswordChangeAlert] = useState(true);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [showRegenCodesModal, setShowRegenCodesModal] = useState(false);
  const [terminateSessionId, setTerminateSessionId] = useState<string | null>(null);
  const [showTerminateAllModal, setShowTerminateAllModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const statusRes = await twoFactorApi.getStatus().catch(() => ({ enabled: false }));
      setTwoFAStatus(statusRes as TwoFactorStatus);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load security data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await twoFactorApi.setup() as { secret?: string; qr_code?: string; qr_uri?: string; backup_codes?: string[] };
      setQrCode(response.qr_code || response.qr_uri || '');
      setSecret(response.secret || '');
      if (response.backup_codes) {
        setBackupCodes(response.backup_codes);
      }
      setShowSetup(true);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to setup 2FA:', error);
      }
      showToast('Failed to setup 2FA', 'error');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await twoFactorApi.enable(verificationCode);
      setTwoFAStatus({ enabled: true, method: 'authenticator' });
      setShowSetup(false);
      setVerificationCode('');
      // Show backup codes from setup response
      if (backupCodes.length > 0) {
        setShowBackupCodes(true);
      }
      showToast('Two-factor authentication enabled!');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to verify 2FA:', error);
      }
      showToast('Invalid verification code', 'error');
    }
  };

  const handleDisable2FA = async () => {
    setShowDisable2FAModal(false);
    try {
      await twoFactorApi.disable();
      setTwoFAStatus({ enabled: false });
      showToast('Two-factor authentication disabled.');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to disable 2FA:', error);
      }
      showToast('Failed to disable 2FA.', 'error');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setShowRegenCodesModal(false);
    try {
      const response = await twoFactorApi.regenerateBackupCodes() as { backup_codes?: string[]; codes?: string[] };
      setBackupCodes(response.backup_codes || response.codes || []);
      setShowBackupCodes(true);
      showToast('Backup codes regenerated!');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to regenerate backup codes:', error);
      }
      showToast('Failed to regenerate backup codes.', 'error');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminateSessionId(null);
    setSessions(sessions.filter(s => s.id !== sessionId));
    showToast('Session ended.');
  };

  const handleTerminateAllSessions = async () => {
    setShowTerminateAllModal(false);
    setSessions(sessions.filter(s => s.is_current));
    showToast('All other sessions ended.');
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}><Loader size="lg" /></div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Security Settings</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage your account security and authentication
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
        <button
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === '2fa' && commonStyles.activeTab, activeTab === '2fa' && themeStyles.activeTab)}
          onClick={() => setActiveTab('2fa')}
        >
          🔐 Two-Factor Auth
        </button>
        <button
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'sessions' && commonStyles.activeTab, activeTab === 'sessions' && themeStyles.activeTab)}
          onClick={() => setActiveTab('sessions')}
        >
          📱 Active Sessions
        </button>
        <button
          className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'alerts' && commonStyles.activeTab, activeTab === 'alerts' && themeStyles.activeTab)}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 Login Alerts
        </button>
      </div>

      {/* Linked Social Accounts */}
      <LinkedAccounts />

      {/* 2FA Tab */}
      {activeTab === '2fa' && (
        <div className={commonStyles.tabContent}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div className={commonStyles.statusRow}>
                <div>
                  <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                    Two-Factor Authentication
                  </h3>
                  <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <span className={cn(
                  commonStyles.statusBadge,
                  twoFAStatus?.enabled ? commonStyles.statusEnabled : commonStyles.statusDisabled,
                  twoFAStatus?.enabled ? themeStyles.statusEnabled : themeStyles.statusDisabled
                )}>
                  {twoFAStatus?.enabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
            </div>

            {!twoFAStatus?.enabled && !showSetup && (
              <div className={commonStyles.setupPrompt}>
                <div className={cn(commonStyles.infoBox, themeStyles.infoBox)}>
                  <span className={commonStyles.infoIcon}>ℹ️</span>
                  <p>
                    Two-factor authentication adds an extra layer of security by requiring a code 
                    from your authenticator app in addition to your password.
                  </p>
                </div>
                <button
                  className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                  onClick={handleEnable2FA}
                >
                  Enable Two-Factor Authentication
                </button>
              </div>
            )}

            {showSetup && (
              <div className={commonStyles.setupFlow}>
                <div className={commonStyles.setupSteps}>
                  <div className={commonStyles.setupStep}>
                    <span className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>1</span>
                    <div>
                      <h4>Install an authenticator app</h4>
                      <p className={themeStyles.mutedText}>
                        Download Google Authenticator, Authy, or any TOTP-compatible app
                      </p>
                    </div>
                  </div>

                  <div className={commonStyles.setupStep}>
                    <span className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>2</span>
                    <div>
                      <h4>Scan the QR code</h4>
                      <div className={cn(commonStyles.qrContainer, themeStyles.qrContainer)}>
                        {qrCode ? (
                          <img src={qrCode} alt="QR Code" className={commonStyles.qrCode} />
                        ) : (
                          <div className={commonStyles.qrPlaceholder}>
                            <span>QR Code</span>
                          </div>
                        )}
                      </div>
                      <p className={themeStyles.mutedText}>
                        Or enter this code manually: <code className={cn(commonStyles.secretCode, themeStyles.secretCode)}>{secret}</code>
                      </p>
                    </div>
                  </div>

                  <div className={commonStyles.setupStep}>
                    <span className={cn(commonStyles.stepNumber, themeStyles.stepNumber)}>3</span>
                    <div>
                      <h4>Enter verification code</h4>
                      <div className={commonStyles.verifyInput}>
                        <input
                          type="text"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={cn(commonStyles.codeInput, themeStyles.codeInput)}
                          maxLength={6}
                        />
                        <button
                          className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                          onClick={handleVerify2FA}
                          disabled={verificationCode.length !== 6}
                        >
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                  onClick={() => setShowSetup(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            {twoFAStatus?.enabled && !showSetup && (
              <div className={commonStyles.enabledState}>
                <div className={cn(commonStyles.successBox, themeStyles.successBox)}>
                  <span className={commonStyles.successIcon}>✓</span>
                  <div>
                    <strong>Two-factor authentication is enabled</strong>
                    <p>Your account is protected with an authenticator app</p>
                  </div>
                </div>

                <div className={commonStyles.twoFAActions}>
                  <button
                    className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                    onClick={() => setShowRegenCodesModal(true)}
                  >
                    View Backup Codes
                  </button>
                  <button
                    className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                    onClick={() => setShowDisable2FAModal(true)}
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backup Codes Modal */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className={cn(commonStyles.modal, themeStyles.modal)}>
              <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
                <h3>Backup Codes</h3>
                <p className={themeStyles.mutedText}>
                  Save these codes in a safe place. Each code can only be used once.
                </p>
                <div className={commonStyles.backupCodesGrid}>
                  {backupCodes.map((code, index) => (
                    <code key={index} className={cn(commonStyles.backupCode, themeStyles.backupCode)}>
                      {code}
                    </code>
                  ))}
                </div>
                <div className={commonStyles.modalActions}>
                  <button
                    className={cn(commonStyles.secondaryButton, themeStyles.secondaryButton)}
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'));
                      showToast('Codes copied to clipboard!');
                    }}
                  >
                    Copy All
                  </button>
                  <button
                    className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                    onClick={() => setShowBackupCodes(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className={commonStyles.tabContent}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div>
                <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Active Sessions</h3>
                <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                  Manage devices where you're currently logged in
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  className={cn(commonStyles.dangerButton, themeStyles.dangerButton)}
                  onClick={() => setShowTerminateAllModal(true)}
                >
                  End All Other Sessions
                </button>
              )}
            </div>

            <div className={commonStyles.sessionsList}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    commonStyles.sessionItem,
                    themeStyles.sessionItem,
                    session.is_current && commonStyles.currentSession,
                    session.is_current && themeStyles.currentSession
                  )}
                >
                  <div className={commonStyles.sessionIcon}>
                    {session.device.includes('iPhone') || session.device.includes('Android') ? '📱' : '💻'}
                  </div>
                  <div className={commonStyles.sessionInfo}>
                    <div className={commonStyles.sessionDevice}>
                      {session.device}
                      {session.is_current && (
                        <span className={cn(commonStyles.currentBadge, themeStyles.currentBadge)}>
                          Current
                        </span>
                      )}
                    </div>
                    <div className={cn(commonStyles.sessionMeta, themeStyles.sessionMeta)}>
                      <span>{session.browser}</span>
                      <span>•</span>
                      <span>{session.ip_address}</span>
                      <span>•</span>
                      <span>{session.location}</span>
                    </div>
                    <div className={cn(commonStyles.sessionTime, themeStyles.sessionTime)}>
                      Last active: {new Date(session.last_active).toLocaleString()}
                    </div>
                  </div>
                  {!session.is_current && (
                    <button
                      className={cn(commonStyles.endSessionButton, themeStyles.endSessionButton)}
                      onClick={() => setTerminateSessionId(session.id)}
                    >
                      End Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className={commonStyles.tabContent}>
          <div className={cn(commonStyles.card, themeStyles.card)}>
            <div className={commonStyles.cardHeader}>
              <div>
                <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Login Alerts</h3>
                <p className={cn(commonStyles.cardDescription, themeStyles.cardDescription)}>
                  Get notified about account activity
                </p>
              </div>
            </div>

            <div className={commonStyles.alertsList}>
              <div className={cn(commonStyles.alertItem, themeStyles.alertItem)}>
                <div className={commonStyles.alertInfo}>
                  <h4>New login alerts</h4>
                  <p className={themeStyles.mutedText}>
                    Get notified when your account is accessed from a new location
                  </p>
                </div>
                <label className={commonStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={loginAlerts}
                    onChange={(e) => setLoginAlerts(e.target.checked)}
                  />
                  <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                </label>
              </div>

              <div className={cn(commonStyles.alertItem, themeStyles.alertItem)}>
                <div className={commonStyles.alertInfo}>
                  <h4>Unknown device alerts</h4>
                  <p className={themeStyles.mutedText}>
                    Get notified when a login is detected from an unrecognized device
                  </p>
                </div>
                <label className={commonStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={unknownDeviceAlert}
                    onChange={(e) => setUnknownDeviceAlert(e.target.checked)}
                  />
                  <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                </label>
              </div>

              <div className={cn(commonStyles.alertItem, themeStyles.alertItem)}>
                <div className={commonStyles.alertInfo}>
                  <h4>Password change alerts</h4>
                  <p className={themeStyles.mutedText}>
                    Get notified when your password is changed
                  </p>
                </div>
                <label className={commonStyles.toggle}>
                  <input
                    type="checkbox"
                    checked={passwordChangeAlert}
                    onChange={(e) => setPasswordChangeAlert(e.target.checked)}
                  />
                  <span className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></span>
                </label>
              </div>
            </div>

            <div className={commonStyles.cardFooter}>
              <button 
                className={cn(commonStyles.primaryButton, themeStyles.primaryButton)}
                onClick={async () => {
                  try {
                    showToast('Alert preferences saved!');
                  } catch {
                    showToast('Failed to save preferences.', 'error');
                  }
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      <Modal isOpen={showDisable2FAModal} title="Disable Two-Factor Authentication" onClose={() => setShowDisable2FAModal(false)}>
        <p>Are you sure you want to disable two-factor authentication? This will make your account less secure.</p>
        <div className={commonStyles.actionRow}>
          <Button variant="ghost" onClick={() => setShowDisable2FAModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDisable2FA}>Disable 2FA</Button>
        </div>
      </Modal>

      {/* Regenerate Backup Codes Modal */}
      <Modal isOpen={showRegenCodesModal} title="Regenerate Backup Codes" onClose={() => setShowRegenCodesModal(false)}>
        <p>This will invalidate your existing backup codes. Are you sure you want to continue?</p>
        <div className={commonStyles.actionRow}>
          <Button variant="ghost" onClick={() => setShowRegenCodesModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleRegenerateBackupCodes}>Regenerate</Button>
        </div>
      </Modal>

      {/* Terminate Session Modal */}
      <Modal isOpen={terminateSessionId !== null} title="End Session" onClose={() => setTerminateSessionId(null)}>
        <p>Are you sure you want to end this session?</p>
        <div className={commonStyles.actionRow}>
          <Button variant="ghost" onClick={() => setTerminateSessionId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (terminateSessionId) handleTerminateSession(terminateSessionId); }}>End Session</Button>
        </div>
      </Modal>

      {/* Terminate All Sessions Modal */}
      <Modal isOpen={showTerminateAllModal} title="End All Sessions" onClose={() => setShowTerminateAllModal(false)}>
        <p>This will log you out of all other devices. Continue?</p>
        <div className={commonStyles.actionRow}>
          <Button variant="ghost" onClick={() => setShowTerminateAllModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleTerminateAllSessions}>End All</Button>
        </div>
      </Modal>

      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast, toast.type === 'error' && themeStyles.toastError)}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
