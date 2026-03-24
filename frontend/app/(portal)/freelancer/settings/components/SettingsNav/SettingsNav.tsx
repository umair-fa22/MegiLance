// @AI-HINT: This component renders the vertical navigation for the settings pages, using the current pathname to highlight the active link. It's designed to be theme-aware and responsive.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { User, Lock, Bell, Shield, DollarSign } from 'lucide-react';

import commonStyles from './SettingsNav.common.module.css';
import lightStyles from './SettingsNav.light.module.css';
import darkStyles from './SettingsNav.dark.module.css';

const navItems = [
  { href: '/freelancer/settings', label: 'Account', icon: User },
  { href: '/freelancer/settings/password', label: 'Password', icon: Lock },
  { href: '/freelancer/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/freelancer/settings/security', label: 'Security', icon: Shield },
  { href: '/freelancer/settings/currency', label: 'Currency', icon: DollarSign },
];

const SettingsNav = () => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <nav className={cn(commonStyles.nav, styles.nav)}>
      <ul className={commonStyles.navList}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  commonStyles.navLink,
                  styles.navLink,
                  isActive && commonStyles.active,
                  isActive && styles.active
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={commonStyles.navIcon} />
                <span className={commonStyles.navLabel}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SettingsNav;
