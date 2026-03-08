// @AI-HINT: Premium SaaS Login component for MegiLance platform. This is the main authentication interface that handles three user roles (Admin, Client, Freelancer) with production-ready UI quality. Features secure login, role selection, social authentication, and responsive design following exact MegiLance brand guidelines. Uses per-component CSS architecture with .common.css, .light.css, .dark.css theming. Designed to match quality standards of Linear, Vercel, GitHub, and Upwork Pro.
// @AI-HINT: Premium SaaS Login component for MegiLance. Redesigned for production-ready UI/UX quality, matching standards of Vercel, Linear, and Toptal. Features a modern two-panel layout, role-based dynamic content, and pixel-perfect implementation of the official brand playbook.
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Briefcase, ShieldCheck, Eye, EyeOff, Laptop, ListChecks, UserCog } from 'lucide-react';
import Tabs from '@/app/components/Tabs/Tabs';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import AuthBrandingPanel from '@/app/components/Auth/BrandingPanel/BrandingPanel';
import DevQuickLogin from '@/app/components/Auth/DevQuickLogin/DevQuickLogin';
import Checkbox from '@/app/components/Checkbox/Checkbox';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Login.common.module.css';
import lightStyles from './Login.light.module.css';
import darkStyles from './Login.dark.module.css';
import { isPreviewMode } from '@/app/utils/flags';

type UserRole = 'freelancer' | 'client' | 'admin';

// @AI-HINT: Role-specific configuration. Defines icons, labels, and dynamic content for the branding panel. This approach makes the UI feel more tailored and intelligent.
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



// @AI-HINT: The main Login component, orchestrating the layout and state. It's structured for clarity, separating the branding panel from the login form.
const Login: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const getRedirect = (role: UserRole) => returnTo || roleConfig[role].redirectPath;
  const [selectedRole, setSelectedRole] = useState<UserRole>('freelancer');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempAccessToken, setTempAccessToken] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    const merge = (key: keyof typeof commonStyles) => cn((commonStyles as any)[key], (themeStyles as any)[key]);
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
      previewDashboards: merge('previewDashboards'),
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

  const validate = () => {
    const newErrors = { email: '', password: '', general: '' };
    let isValid = true;
    const email = formData.email.trim().toLowerCase();
    
    if (!email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    } else if (email.length > 254) {
      newErrors.email = 'Email address is too long.';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long.';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDevQuickLogin = (email: string, password: string, role: 'admin' | 'freelancer' | 'client') => {
    // Auto-fill credentials
    setFormData({ email, password });
    // Set the correct role tab
    setSelectedRole(role);
    // Clear any previous errors
    setErrors({ email: '', password: '', general: '' });
  };

  const handleDevAutoLogin = async (email: string, password: string, role: 'admin' | 'freelancer' | 'client') => {
    // Set credentials and role
    setFormData({ email, password });
    setSelectedRole(role);
    setErrors({ email: '', password: '', general: '' });
    
    // Trigger login
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      
      if (data.user?.requires_2fa) {
        setNeeds2FA(true);
        setTempAccessToken(data.access_token || '');
      } else {
        // Tokens already stored by api.auth.login → setAuthToken/setRefreshToken
        // Store user data and portal area for quick access
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        try { window.localStorage.setItem('portal_area', role); } catch {}
        router.push(getRedirect(role));
      }
    } catch (error: any) {
      setErrors({ email: '', password: '', general: error.message || 'Auto-login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreviewMode()) {
      // Preview mode: bypass validation and go straight to the role destination
      try { window.localStorage.setItem('portal_area', selectedRole); } catch {}
      router.push(getRedirect(selectedRole));
      return;
    }
    if (!validate()) return;
    setLoading(true);
    setErrors({ email: '', password: '', general: '' });
    try {
      const data = await api.auth.login(formData.email, formData.password);
      
      // Check if 2FA is required
      if (data.requires_2fa) {
        setNeeds2FA(true);
        setTempAccessToken(data.temp_token || '');
      } else {
        // Tokens already stored by api.auth.login → setAuthToken/setRefreshToken
        // Store user data for quick access
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Redirect based on user's actual role from API, not the selected tab
        const userRole = (data.user?.user_type || data.user?.role || selectedRole).toLowerCase() as UserRole;
        const actualRole = userRole === 'admin' ? 'admin' : userRole === 'freelancer' ? 'freelancer' : 'client';
        try { window.localStorage.setItem('portal_area', actualRole); } catch {}
        router.push(getRedirect(actualRole));
      }
    } catch (error: any) {
      setErrors({ email: '', password: '', general: error.message || 'Login failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      setErrors({ email: '', password: '', general: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    setErrors({ email: '', password: '', general: '' });
    try {
      const data = await api.auth.verify2FALogin(twoFactorCode, tempAccessToken);
      // api.auth.verify2FALogin should return the final access token
      // We need to manually set it if the helper doesn't (it does return it, but might not set it if it's a custom return type)
      // Let's assume verify2FALogin returns { access_token, refresh_token }
      
      // If verify2FALogin doesn't set the token automatically, we might need to do it here.
      // But let's assume we updated api.ts to handle it or we do it here.
      // Actually, looking at my api.ts update, verify2FALogin returns { access_token } but doesn't call setAuthToken.
      // I should probably update api.ts to call setAuthToken or do it here.
      // Let's do it here for safety.
      if (data.access_token) {
        // Use centralized setAuthToken for consistent storage (sessionStorage + cookie)
        const { setAuthToken: setToken } = await import('@/lib/api');
        setToken(data.access_token);
      }

      try { window.localStorage.setItem('portal_area', selectedRole); } catch {}
      router.push(getRedirect(selectedRole));
    } catch (error: any) {
      setErrors({ email: '', password: '', general: error.message || 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/callback`;
      try { window.localStorage.setItem('portal_area', selectedRole); } catch {}
      
      const response = await api.socialAuth.start(provider, redirectUri, selectedRole, 'login') as { authorization_url?: string };
      
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error: any) {
      setErrors({ email: '', password: '', general: error.message || `Sign in with ${provider} failed.` });
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className={cn(commonStyles.loginPage)}>
        <div className={commonStyles.loadingContainer}>
          <div className={commonStyles.loadingSpinner} />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={styles.loginPage}>
      {/* Background Decor - REMOVED */}
      
      {/* Floating 3D Objects - REMOVED */}
      
      <div className={styles.brandingSlot}>
        <AuthBrandingPanel roleConfig={roleConfig[selectedRole]} />
      </div>
      <div className={styles.formPanel}>
        <StaggerContainer className={styles.formContainer}>
          {isPreviewMode() && (
            <div role="status" aria-live="polite" className={commonStyles.previewBanner}>
              <strong>Preview Mode:</strong> Auth checks are disabled. Use the quick links below to jump into dashboards.
            </div>
          )}
          <StaggerItem className={styles.formHeader}>
            <h1 className={styles.formTitle}>Sign in to MegiLance</h1>
            <p className={styles.formSubtitle}>Enter your details to access your account.</p>
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

          <StaggerItem className={styles.socialAuth}>
            <Button variant="social" provider="google" onClick={() => handleSocialLogin('google')} disabled={loading}>
              Continue with Google
            </Button>
            <Button variant="social" provider="github" onClick={() => handleSocialLogin('github')} disabled={loading}>
              Continue with GitHub
            </Button>
          </StaggerItem>

          {isPreviewMode() && (
            <div className={styles.previewDashboards}>
              <Button variant="secondary" onClick={() => router.push(roleConfig.freelancer.redirectPath)}>Freelancer Dashboard</Button>
              <Button variant="secondary" onClick={() => router.push(roleConfig.client.redirectPath)}>Client Dashboard</Button>
              <Button variant="secondary" onClick={() => router.push(roleConfig.admin.redirectPath)}>Admin Dashboard</Button>
            </div>
          )}

          <StaggerItem className={styles.divider}>
            <span className={styles.dividerText}>OR</span>
          </StaggerItem>

          <StaggerItem>
            <DevQuickLogin
              onCredentialSelect={handleDevQuickLogin}
              onAutoLogin={handleDevAutoLogin}
            />
          </StaggerItem>

          <StaggerItem>
            {needs2FA ? (
              // Two-Factor Authentication verification form
              <div className={styles.loginForm}>
              {errors.general && <p className={styles.generalError}>{errors.general}</p>}
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Enter Verification Code</h2>
                <p className={styles.formSubtitle}>Enter the 6-digit code from your authenticator app</p>
              </div>
              <Input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                label="Verification Code"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                disabled={loading}
                maxLength={6}
              />
              <Button type="button" variant="primary" fullWidth className={styles.submitButton} onClick={handleVerify2FA} isLoading={loading} disabled={loading || twoFactorCode.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => { setNeeds2FA(false); setTwoFactorCode(''); }} disabled={loading}>
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
            {errors.general && <p className={styles.generalError}>{errors.general}</p>}
            <div className={styles.inputGroup}>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className={styles.inputGroup}>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  disabled={loading}
                  autoComplete="current-password"
                  iconAfter={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle} aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
            </div>

            <div className={styles.formOptions}>
              <span title="Stay signed in for 30 days on this device">
                <Checkbox
                  name="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                >
                  Remember me
                </Checkbox>
              </span>
              <div className={commonStyles.linksColumn}>
                <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                  Forgot Password?
                </Link>
                <Link href="/passwordless" className={commonStyles.passwordlessLink}>
                  Sign in without password
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={loading} className={styles.submitButton}>
              {loading ? 'Signing In...' : `Sign In as ${roleConfig[selectedRole].label}`}
            </Button>
          </form>
          )}
          </StaggerItem>

          <StaggerItem className={styles.signupPrompt}>
            <p>Don&apos;t have an account? <Link href="/signup">Create one now</Link></p>
          </StaggerItem>
        </StaggerContainer>
      </div>
      </div>
    </PageTransition>
  );
};

export default Login;
