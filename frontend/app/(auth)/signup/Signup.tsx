// @AI-HINT: This is the fully redesigned Signup page, architected for a premium user experience. It features the same two-panel layout as the Login page for brand consistency and uses the sophisticated Tabs component for role selection.
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { User, Briefcase, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { isPreviewMode } from '@/app/utils/flags';
import { trackSignupStart, trackSignupComplete } from '@/lib/tracking';

import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Checkbox from '@/app/components/atoms/Checkbox/Checkbox';
import Tabs from '@/app/components/molecules/Tabs/Tabs';
import AuthBrandingPanel from '@/app/components/Auth/BrandingPanel/BrandingPanel';
import ClientOnly from '@/app/components/ClientOnly';
import PasswordStrengthMeter from '@/app/components/AdvancedFeatures/PasswordStrengthMeter/PasswordStrengthMeter';

import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Signup.common.module.css';
import lightStyles from './Signup.light.module.css';
import darkStyles from './Signup.dark.module.css';

type UserRole = 'client' | 'freelancer';

const roleConfig = {
  client: {
    id: 'client' as UserRole,
    label: 'Client',
    brandIcon: User,
    brandTitle: 'Find Top-Tier Talent',
    brandText: 'Post projects, evaluate proposals, and collaborate with the world\u2019s best freelancers, all in one place.',
  },
  freelancer: {
    id: 'freelancer' as UserRole,
    label: 'Freelancer',
    brandIcon: Briefcase,
    brandTitle: 'Build Your Freelance Career',
    brandText: 'Showcase your skills, bid on exciting projects, and get paid securely for your expert work.',
  },
};

const Signup: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial role from URL params
  const getInitialRole = (): UserRole => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'client' || urlRole === 'freelancer') return urlRole;
    return 'freelancer'; // Deterministic fallback to prevent hydration mismatch
  };
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(getInitialRole());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Update role when URL params change or read from localStorage on mount
  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'client' || urlRole === 'freelancer') {
      setSelectedRole(urlRole);
    } else {
      // Check localStorage fallback only on client after mount
      try {
        const storedRole = window.localStorage.getItem('signup_role');
        if (storedRole === 'client' || storedRole === 'freelancer') {
          window.localStorage.removeItem('signup_role'); // Clear after use
          setSelectedRole(storedRole);
        }
      } catch { /* localStorage unavailable in private browsing */ }
    }
  }, [searchParams]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    
    // Name validation
    if (!trimmedName) {
      newErrors.fullName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      newErrors.fullName = 'Name is too long (max 100 characters).';
    } else if (!/^[a-zA-Z\s\-'.]+$/.test(trimmedName)) {
      newErrors.fullName = 'Name contains invalid characters.';
    }
    
    // Email validation
    if (!trimmedEmail) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    } else if (trimmedEmail.length > 254) {
      newErrors.email = 'Email address is too long.';
    }
    
    // Password strength validation
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long (max 128 characters).';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter.';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter.';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number.';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    
    // Terms agreement
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms and conditions.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Dev preview bypass: allow proceeding with empty credentials
    if (isPreviewMode()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        router.push(selectedRole === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
      }, 300);
      return;
    }
    if (validate()) {
      setLoading(true);
      trackSignupStart(selectedRole, 'email');
      try {
        await api.auth.register({
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          role: selectedRole,
        });

        trackSignupComplete(selectedRole, 'email');
        // Show verification notice
        router.push('/verify-email?registered=true');
      } catch (error: unknown) {
        setErrors({ email: error instanceof Error ? error.message : 'Registration failed. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
  };

  // @AI-HINT: Social signup click handler.
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (isPreviewMode()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        router.push(selectedRole === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
      }, 300);
      return;
    }
    
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/callback`;
      try { window.localStorage.setItem('portal_area', selectedRole); } catch { /* localStorage unavailable in private browsing */ }
      
      const response = await api.socialAuth.start(provider, redirectUri, selectedRole, 'register') as { authorization_url?: string };
      
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error: unknown) {
      setErrors({ email: error instanceof Error ? error.message : `Sign up with ${provider} failed.` });
      setLoading(false);
    }
  };

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
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
      socialAuth: merge('socialAuth'),
      divider: merge('divider'),
      dividerText: merge('dividerText'),
      loginForm: merge('loginForm'),
      inputGroup: merge('inputGroup'),
      passwordToggle: merge('passwordToggle'),
      formOptions: merge('formOptions'),
      forgotPasswordLink: merge('forgotPasswordLink'),
      submitButton: merge('submitButton'),
      signupPrompt: merge('signupPrompt'),
      generalError: merge('generalError'),
    } as const;
  }, [resolvedTheme]);

  return (
    <PageTransition className={styles.loginPage}>
      {/* Background Decor - REMOVED */}

      <div className={styles.brandingSlot}>
        <AuthBrandingPanel roleConfig={roleConfig[selectedRole]} />
      </div>
      <div className={styles.formPanel}>
        <StaggerContainer className={styles.formContainer}>
          <StaggerItem className={styles.formHeader}>
            <h1 className={styles.formTitle}>Create Your Account</h1>
            <p className={styles.formSubtitle}>Join the top-tier network of talent and clients.</p>
          </StaggerItem>

          <ClientOnly>
            <StaggerItem>
              <Tabs defaultIndex={Object.keys(roleConfig).indexOf(selectedRole)} onTabChange={(index) => setSelectedRole(Object.keys(roleConfig)[index] as UserRole)}>
                <Tabs.List className={styles.roleSelector}>
                  {Object.values(roleConfig).map((role) => (
                    <Tabs.Tab key={role.id} icon={<role.brandIcon />}>
                      {role.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            </StaggerItem>

            <StaggerItem className={styles.socialAuth}>
              <Button variant="social" provider="google" onClick={() => handleSocialLogin('google')} disabled={loading}>Continue with Google</Button>
            </StaggerItem>
          </ClientOnly>

          <StaggerItem className={styles.divider}><span className={styles.dividerText}>OR</span></StaggerItem>

          <StaggerItem>
            <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
              <Input name="fullName" type="text" label="Full Name" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} disabled={loading} />
              <Input name="email" type="email" label="Email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} disabled={loading} />
              <Input 
                name="password" 
                type={showPassword ? 'text' : 'password'}
                label="Password" 
                placeholder="8+ characters" 
                value={formData.password} 
                onChange={handleChange} 
                error={errors.password} 
                disabled={loading} 
                iconAfter={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              {formData.password && <PasswordStrengthMeter password={formData.password} showRequirements={true} />}
              <Input 
                name="confirmPassword" 
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password" 
                placeholder="Re-enter password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                error={errors.confirmPassword} 
                disabled={loading} 
                iconAfter={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.passwordToggle} aria-label="Toggle password visibility">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              
              <Checkbox
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                error={errors.agreedToTerms}
              >
                I agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer" className={styles.forgotPasswordLink}>Terms ↗</Link> & <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.forgotPasswordLink}>Privacy Policy ↗</Link>.
              </Checkbox>

              <Button type="submit" variant="primary" fullWidth className={styles.submitButton} isLoading={loading} disabled={loading}>
                {loading ? 'Creating Account...' : `Create ${roleConfig[selectedRole].label} Account`}
              </Button>
            </form>
          </StaggerItem>

          <StaggerItem className={styles.signupPrompt}>
            <p>Already have an account? <Link href="/login">Sign In</Link> or <Link href="/passwordless">use magic link</Link></p>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default Signup;
