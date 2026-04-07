// @AI-HINT: This is the Passwordless Authentication page, designed with the same premium two-panel layout as other auth pages for consistency. It allows users to sign in using only their email address without a password.
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sparkles, User, Briefcase, ShieldCheck, Laptop, ListChecks, UserCog } from 'lucide-react';

import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Tabs from '@/app/components/molecules/Tabs/Tabs';
import AuthBrandingPanel from '@/app/components/Auth/BrandingPanel/BrandingPanel';
import { isPreviewMode } from '@/app/utils/flags';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import commonStyles from './Passwordless.common.module.css';
import lightStyles from './Passwordless.light.module.css';
import darkStyles from './Passwordless.dark.module.css';

type UserRole = 'freelancer' | 'client' | 'admin';

const roleConfig = {
  freelancer: {
    id: 'freelancer' as UserRole,
    icon: User,
    label: 'Freelancer',
    redirectPath: '/freelancer/dashboard',
    brandIcon: Laptop,
    brandTitle: 'Build the Future',
    brandText: 'Access exclusive projects, secure your payments with USDC, and collaborate with top-tier clients from around the world.',
  },
  client: {
    id: 'client' as UserRole,
    icon: Briefcase,
    label: 'Client',
    redirectPath: '/client/dashboard',
    brandIcon: ListChecks,
    brandTitle: 'Assemble Your Dream Team',
    brandText: 'Find, hire, and manage elite talent. Our AI-powered platform ensures you connect with the perfect freelancers for your projects.',
  },
  admin: {
    id: 'admin' as UserRole,
    icon: ShieldCheck,
    label: 'Admin',
    redirectPath: '/admin/dashboard',
    brandIcon: UserCog,
    brandTitle: 'Oversee the Ecosystem',
    brandText: 'Manage platform operations, ensure quality and security, and empower our community of freelancers and clients.',
  },
};

const Passwordless: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('freelancer');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [errors, setErrors] = useState({ email: '', general: '' });

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submitted && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [submitted, countdown]);

  const validate = () => {
    const newErrors = { email: '', general: '' };
    let isValid = true;
    if (!email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setErrors({ email: '', general: '' });
    
    try {
      if (isPreviewMode()) {
        try { window.localStorage.setItem('portal_area', selectedRole); } catch { /* localStorage unavailable in private browsing */ }
        router.push(roleConfig[selectedRole].redirectPath);
        return;
      }
      
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: selectedRole }),
      });
      
      if (res.ok) {
        setSubmitted(true);
        setCountdown(30);
      } else {
        const error = await res.json().catch(() => ({}));
        setErrors({ email: '', general: error.detail || 'Failed to send magic link. Please try again.' });
      }
    } catch (error) {
      setErrors({ email: '', general: 'Failed to send magic link. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: selectedRole }),
      });
      
      if (res.ok) {
        setCountdown(30);
      } else {
        const error = await res.json().catch(() => ({}));
        setErrors({ email: '', general: error.detail || 'Failed to resend magic link. Please try again.' });
      }
    } catch (error) {
      setErrors({ email: '', general: 'Failed to resend magic link. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    const merge = (key: keyof typeof commonStyles) => cn((commonStyles as Record<string, string>)[key], (themeStyles as Record<string, string>)[key]);
    return {
      loginPage: merge('loginPage'),
      brandingSlot: merge('brandingSlot'),
      brandingPanel: merge('brandingPanel'),
      brandingContent: merge('brandingContent'),
      brandingIconWrapper: merge('brandingIconWrapper'),
      brandingIcon: merge('brandingIcon'),
      brandingTitle: merge('brandingTitle'),
      brandingText: merge('brandingText'),
      brandingFooter: merge('brandingFooter'),
      formPanel: merge('formPanel'),
      formContainer: merge('formContainer'),
      formHeader: merge('formHeader'),
      formTitle: merge('formTitle'),
      formSubtitle: merge('formSubtitle'),
      roleSelector: merge('roleSelector'),
      roleButton: merge('roleButton'),
      roleButtonSelected: merge('roleButtonSelected'),
      roleIcon: merge('roleIcon'),
      divider: merge('divider'),
      dividerText: merge('dividerText'),
      loginForm: merge('loginForm'),
      inputGroup: merge('inputGroup'),
      formOptions: merge('formOptions'),
      submitButton: merge('submitButton'),
      resendButton: merge('resendButton'),
      signupPrompt: merge('signupPrompt'),
      generalError: merge('generalError'),
      successMessage: merge('successMessage'),
      countdownText: merge('countdownText'),
    } as const;
  }, [resolvedTheme]);

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>
      <div className={styles.loginPage}>
        <div className={styles.brandingSlot}>
          <AuthBrandingPanel roleConfig={roleConfig[selectedRole]} />
        </div>
        <div className={styles.formPanel}>
          <StaggerContainer className={styles.formContainer}>
            {isPreviewMode() && (
              <StaggerItem>
                <div role="status" aria-live="polite" className={commonStyles.previewBanner}>
                  <strong>Preview Mode:</strong> Auth checks are disabled. Use the quick links below to jump into dashboards.
                </div>
              </StaggerItem>
            )}
            
            <StaggerItem className={styles.formHeader}>
              <h1 className={styles.formTitle}>Passwordless Sign In</h1>
              {submitted ? (
                <p className={styles.formSubtitle}>
                  Check your email for a magic link to sign in.
                </p>
              ) : (
                <p className={styles.formSubtitle}>
                  Enter your email and we&apos;ll send you a magic link to sign in instantly.
                </p>
              )}
            </StaggerItem>

            <StaggerItem>
              <Tabs defaultIndex={Object.keys(roleConfig).indexOf(selectedRole)} onTabChange={(index) => setSelectedRole(Object.keys(roleConfig)[index] as UserRole)}>
                <Tabs.List className={styles.roleSelector}>
                  {Object.entries(roleConfig).map(([role, { label, icon: Icon }]) => (
                    <Tabs.Tab key={role} icon={<Icon />}>
                      {label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            </StaggerItem>

            {submitted ? (
              <StaggerItem className={styles.successMessage}>
                <div className={commonStyles.successIconWrap}>
                  <Sparkles size={28} />
                </div>
                <p className={commonStyles.successText}>
                  We&apos;ve sent a magic link to <strong>{email}</strong>. Click the link to sign in.
                </p>
                <p className={commonStyles.successSubtext}>
                  Didn&apos;t receive the email? Check your spam folder.
                </p>
                <Button 
                  variant="secondary" 
                  fullWidth 
                  onClick={handleResend} 
                  disabled={loading || countdown > 0}
                  className={styles.resendButton}
                >
                  {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Magic Link'}
                </Button>
              </StaggerItem>
            ) : (
              <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
                {errors.general && <StaggerItem><p className={styles.generalError}>{errors.general}</p></StaggerItem>}
                <StaggerItem className={styles.inputGroup}>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    disabled={loading}
                  />
                </StaggerItem>

                <StaggerItem>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    fullWidth 
                    isLoading={loading} 
                    disabled={loading} 
                    className={styles.submitButton}
                    iconBefore={<Sparkles size={18} />}
                  >
                    {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
                  </Button>
                </StaggerItem>
              </form>
            )}

            <StaggerItem className={styles.signupPrompt}>
              <p>Want to use a password instead? <Link href="/login">Sign In</Link></p>
              <p>Don&apos;t have an account? <Link href="/signup">Create one now</Link></p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Passwordless;
