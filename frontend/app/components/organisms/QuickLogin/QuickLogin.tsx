// @AI-HINT: Quick login floating button for development only - provides one-click login as different roles
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Button from '@/app/components/atoms/Button/Button';
import Card from '@/app/components/molecules/Card/Card';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Shield, User, Briefcase, X, ChevronRight } from 'lucide-react';
import commonStyles from './QuickLogin.common.module.css';
import lightStyles from './QuickLogin.light.module.css';
import darkStyles from './QuickLogin.dark.module.css';

const SHOW_DEMO_LOGIN = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true' || process.env.NODE_ENV === 'development';

// Demo credentials available when NEXT_PUBLIC_SHOW_DEMO_LOGIN=true or in dev mode
const DEV_ACCOUNTS: Record<string, { email: string; password: string }> = SHOW_DEMO_LOGIN
  ? {
      admin: {
        email: process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || 'admin@megilance.com',
        password: process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD || 'Admin@123',
      },
      client: {
        email: process.env.NEXT_PUBLIC_DEV_CLIENT_EMAIL || 'client1@example.com',
        password: process.env.NEXT_PUBLIC_DEV_CLIENT_PASSWORD || 'Client@123',
      },
      freelancer: {
        email: process.env.NEXT_PUBLIC_DEV_FREELANCER_EMAIL || 'freelancer1@example.com',
        password: process.env.NEXT_PUBLIC_DEV_FREELANCER_PASSWORD || 'Freelancer@123',
      },
    }
  : {};

export default function QuickLogin() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Show when demo login is enabled and credentials are configured
  useEffect(() => {
    if (SHOW_DEMO_LOGIN && DEV_ACCOUNTS.admin?.email) {
      setIsVisible(true);
    }
  }, []);

  if (!resolvedTheme || !isVisible || !SHOW_DEMO_LOGIN) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const handleLogin = async (role: 'admin' | 'client' | 'freelancer') => {
    setLoading(role);
    try {
      const account = DEV_ACCOUNTS[role];
      if (!account?.email || !account?.password) {
        showToast(`Dev credentials for "${role}" not configured. Set NEXT_PUBLIC_DEV_${role.toUpperCase()}_EMAIL and _PASSWORD in .env.local`, 'error');
        setLoading(null);
        return;
      }

      await authApi.login(account.email, account.password);
      
      // Redirect based on role
      switch (role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'client':
          router.push('/client/dashboard');
          break;
        case 'freelancer':
          router.push('/freelancer/dashboard');
          break;
      }
      setIsOpen(false);
    } catch {
      showToast('Login failed. Make sure dev seed data exists.', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={commonStyles.container}>
      {isOpen && (
        <Card 
          title="Dev Quick Login"
          className={cn(commonStyles.card, themeStyles.card)}
          variant="glass"
        >
          <div className={commonStyles.closeButtonWrapper}>
             <Button variant="ghost" size="icon" className={commonStyles.closeButton} onClick={() => setIsOpen(false)}>
              <X className={commonStyles.icon} />
            </Button>
          </div>
          <div className={commonStyles.buttonGroup}>
            <Button 
              variant="outline" 
              className={cn(commonStyles.roleButton, themeStyles.adminButton)}
              onClick={() => handleLogin('admin')}
              isLoading={loading === 'admin'}
              iconBefore={<Shield className={cn(commonStyles.icon, themeStyles.adminIcon)} />}
            >
              Admin
            </Button>
            <Button 
              variant="outline" 
              className={cn(commonStyles.roleButton, themeStyles.clientButton)}
              onClick={() => handleLogin('client')}
              isLoading={loading === 'client'}
              iconBefore={<User className={cn(commonStyles.icon, themeStyles.clientIcon)} />}
            >
              Client
            </Button>
            <Button 
              variant="outline" 
              className={cn(commonStyles.roleButton, themeStyles.freelancerButton)}
              onClick={() => handleLogin('freelancer')}
              isLoading={loading === 'freelancer'}
              iconBefore={<Briefcase className={cn(commonStyles.icon, themeStyles.freelancerIcon)} />}
            >
              Freelancer
            </Button>
          </div>
          <div className={cn(commonStyles.footer, themeStyles.footer)}>
            Quick demo login
          </div>
        </Card>
      )}
      
      <Button 
        className={cn(
          commonStyles.toggleButton,
          isOpen ? themeStyles.toggleButtonOpen : themeStyles.toggleButtonClosed
        )}
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight /> : <Shield className={commonStyles.toggleIcon} />}
      </Button>
      {toast && (
        <div className={cn(
          commonStyles.toast,
          toast.type === 'success' ? themeStyles.toastSuccess : themeStyles.toastError
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
