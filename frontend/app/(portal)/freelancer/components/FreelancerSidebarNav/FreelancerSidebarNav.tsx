// @AI-HINT: This component builds the sidebar navigation for the freelancer portal, providing clear and accessible links to all major sections.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Gauge, Briefcase, FileText, Wallet, TrendingUp, User, Settings, SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import MegiLanceLogo from '@/app/components/atoms/MegiLanceLogo/MegiLanceLogo';
import commonStyles from './FreelancerSidebarNav.common.module.css';
import lightStyles from './FreelancerSidebarNav.light.module.css';
import darkStyles from './FreelancerSidebarNav.dark.module.css';

const navItems = [
  { href: '/freelancer/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/freelancer/my-jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/freelancer/proposals', label: 'Proposals', icon: SendHorizontal },
  { href: '/freelancer/contracts', label: 'Contracts', icon: FileText },
  { href: '/freelancer/wallet', label: 'Wallet', icon: Wallet },
  { href: '/freelancer/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/freelancer/profile', label: 'Profile', icon: User },
  { href: '/freelancer/settings', label: 'Settings', icon: Settings },
];

const FreelancerSidebarNav = () => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        <MegiLanceLogo />
      </div>
      <nav className={styles.navContainer}>
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={cn(styles.navLink, isActive && styles.activeLink)}>
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default FreelancerSidebarNav;
