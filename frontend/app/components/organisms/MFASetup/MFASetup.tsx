// @AI-HINT: MFA setup component for TOTP, SMS, Email authentication methods

'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';

import commonStyles from './MFASetup.common.module.css';
import lightStyles from './MFASetup.light.module.css';
import darkStyles from './MFASetup.dark.module.css';

type MFAMethod = 'totp' | 'sms' | 'email' | 'webauthn';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [selectedMethod, setSelectedMethod] = useState<MFAMethod>('totp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'select' | 'setup' | 'verify'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const setupMFA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/security/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          phone_number: selectedMethod === 'sms' ? phoneNumber : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'MFA setup failed');
      }

      const data = await response.json();

      if (data.qr_code) {
        setQrCode(data.qr_code);
      }
      if (data.secret) {
        setSecret(data.secret);
      }
      if (data.backup_codes) {
        setBackupCodes(data.backup_codes);
      }

      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/security/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          code: verificationCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Verification failed');
      }

      onComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSelectMethod = () => (
    <div className={cn(commonStyles.methodGrid, themeStyles.methodGrid)}>
      <div
        className={cn(
          commonStyles.methodCard,
          themeStyles.methodCard,
          selectedMethod === 'totp' && commonStyles.selected,
          selectedMethod === 'totp' && themeStyles.selected
        )}
        onClick={() => setSelectedMethod('totp')}
      >
        <div className={commonStyles.methodIcon}>🔐</div>
        <h3 className={commonStyles.methodTitle}>Authenticator App</h3>
        <p className={commonStyles.methodDesc}>
          Use Google Authenticator, Authy, or similar apps
        </p>
      </div>

      <div
        className={cn(
          commonStyles.methodCard,
          themeStyles.methodCard,
          selectedMethod === 'sms' && commonStyles.selected,
          selectedMethod === 'sms' && themeStyles.selected
        )}
        onClick={() => setSelectedMethod('sms')}
      >
        <div className={commonStyles.methodIcon}>📱</div>
        <h3 className={commonStyles.methodTitle}>SMS</h3>
        <p className={commonStyles.methodDesc}>
          Receive codes via text message
        </p>
      </div>

      <div
        className={cn(
          commonStyles.methodCard,
          themeStyles.methodCard,
          selectedMethod === 'email' && commonStyles.selected,
          selectedMethod === 'email' && themeStyles.selected
        )}
        onClick={() => setSelectedMethod('email')}
      >
        <div className={commonStyles.methodIcon}>📧</div>
        <h3 className={commonStyles.methodTitle}>Email</h3>
        <p className={commonStyles.methodDesc}>
          Receive codes via email
        </p>
      </div>

      <div
        className={cn(
          commonStyles.methodCard,
          themeStyles.methodCard,
          selectedMethod === 'webauthn' && commonStyles.selected,
          selectedMethod === 'webauthn' && themeStyles.selected
        )}
        onClick={() => setSelectedMethod('webauthn')}
      >
        <div className={commonStyles.methodIcon}>🔑</div>
        <h3 className={commonStyles.methodTitle}>Security Key</h3>
        <p className={commonStyles.methodDesc}>
          Use biometric or hardware security keys
        </p>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className={cn(commonStyles.setupContainer, themeStyles.setupContainer)}>
      {selectedMethod === 'totp' && qrCode && (
        <div className={commonStyles.qrSection}>
          <h3 className={commonStyles.setupTitle}>Scan QR Code</h3>
          <div className={commonStyles.qrCodeWrapper}>
            <img src={qrCode} alt="QR Code" className={commonStyles.qrCode} />
          </div>
          {secret && (
            <div className={commonStyles.secretSection}>
              <p className={commonStyles.secretLabel}>Or enter this code manually:</p>
              <code className={cn(commonStyles.secret, themeStyles.secret)}>{secret}</code>
            </div>
          )}
        </div>
      )}

      {selectedMethod === 'sms' && (
        <div className={commonStyles.phoneSection}>
          <Input
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 234 567 8900"
            required
          />
        </div>
      )}

      {selectedMethod === 'email' && (
        <div className={commonStyles.infoSection}>
          <p>A verification code will be sent to your registered email address.</p>
        </div>
      )}
    </div>
  );

  const renderVerify = () => (
    <div className={cn(commonStyles.verifyContainer, themeStyles.verifyContainer)}>
      <h3 className={commonStyles.verifyTitle}>Enter Verification Code</h3>
      <Input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="000000"
        maxLength={6}
        className={commonStyles.codeInput}
        autoFocus
      />

      {backupCodes.length > 0 && (
        <div className={cn(commonStyles.backupCodes, themeStyles.backupCodes)}>
          <h4>Backup Codes</h4>
          <p className={commonStyles.backupInfo}>
            Save these codes in a safe place. Each can be used once if you lose access.
          </p>
          <div className={commonStyles.codesList}>
            {backupCodes.map((code, index) => (
              <code key={index} className={cn(commonStyles.backupCode, themeStyles.backupCode)}>
                {code}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h2 className={commonStyles.title}>Setup Multi-Factor Authentication</h2>
        <p className={commonStyles.subtitle}>
          Add an extra layer of security to your account
        </p>
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      {step === 'select' && renderSelectMethod()}
      {step === 'setup' && renderSetup()}
      {step === 'verify' && renderVerify()}

      <div className={commonStyles.actions}>
        {step === 'select' && (
          <>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={() => {
                if (selectedMethod === 'sms' && !phoneNumber) {
                  setStep('setup');
                } else {
                  setupMFA();
                }
              }}
              isLoading={loading}
            >
              Continue
            </Button>
          </>
        )}

        {step === 'setup' && (
          <>
            <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
            <Button variant="primary" onClick={setupMFA} isLoading={loading}>
              Next
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            <Button variant="outline" onClick={() => setStep('setup')}>Back</Button>
            <Button 
              variant="primary" 
              onClick={verifyMFA} 
              isLoading={loading}
              disabled={verificationCode.length !== 6}
            >
              Verify & Enable
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
