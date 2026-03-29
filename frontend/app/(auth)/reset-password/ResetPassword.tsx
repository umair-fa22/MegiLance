// @AI-HINT: This is the Reset Password page, redesigned to match the premium two-panel layout for a consistent authentication experience.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import { Shield } from 'lucide-react';
import AuthBrandingPanel from '@/app/components/Auth/BrandingPanel/BrandingPanel';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import PasswordStrengthMeter from '@/app/components/AdvancedFeatures/PasswordStrengthMeter/PasswordStrengthMeter';

import commonStyles from './ResetPassword.common.module.css';
import lightStyles from './ResetPassword.light.module.css';
import darkStyles from './ResetPassword.dark.module.css';

const resetPasswordBranding = {
  brandIcon: Shield,
  brandTitle: 'Strengthen Your Security',
  brandText: 'Create a new, strong password to protect your account. Make sure it&apos;s at least 8 characters long.',
};

const ResetPassword: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = { password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
          setErrors({ password: '', confirmPassword: 'Invalid or missing reset token. Please request a new password reset.' });
          return;
        }
        
        await api.auth.resetPassword(token, formData.password);
        setSubmitted(true);
      } catch (error) {
        setErrors({ password: '', confirmPassword: 'Failed to reset password. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    const merge = (key: keyof typeof commonStyles) => cn((commonStyles as any)[key], (themeStyles as any)[key]);
    return {
      loginPage: merge('loginPage'),
      brandingSlot: merge('brandingSlot'),
      formPanel: merge('formPanel'),
      formContainer: merge('formContainer'),
      formHeader: merge('formHeader'),
      formTitle: merge('formTitle'),
      formSubtitle: merge('formSubtitle'),
      loginForm: merge('loginForm'),
      submitButton: merge('submitButton'),
    } as const;
  }, [resolvedTheme]);

  return (
    <PageTransition>
      <div className={styles.loginPage}>
        <div className={styles.brandingSlot}>
          <AuthBrandingPanel roleConfig={resetPasswordBranding} />
        </div>
        <div className={styles.formPanel}>
          <StaggerContainer className={styles.formContainer}>
            <StaggerItem className={styles.formHeader}>
              <h1 className={styles.formTitle}>Set a New Password</h1>
              {submitted ? (
                <p className={styles.formSubtitle}>
                  Your password has been successfully reset.
                </p>
              ) : (
                <p className={styles.formSubtitle}>Create a new, strong password for your account.</p>
              )}
            </StaggerItem>

            {!submitted ? (
              <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
                <StaggerItem>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    disabled={loading}
                  />
                  {formData.password && <PasswordStrengthMeter password={formData.password} showRequirements={true} />}
                </StaggerItem>
                <StaggerItem>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    disabled={loading}
                  />
                </StaggerItem>
                <StaggerItem>
                  <Button type="submit" variant="primary" fullWidth isLoading={loading} disabled={loading} className={styles.submitButton}>
                    {loading ? 'Resetting Password...' : 'Set New Password'}
                  </Button>
                </StaggerItem>
              </form>
            ) : (
              <StaggerItem>
                <Link href="/login">
                  <Button variant="primary" fullWidth className={styles.submitButton}>
                    Return to Sign In
                  </Button>
                </Link>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default ResetPassword;
