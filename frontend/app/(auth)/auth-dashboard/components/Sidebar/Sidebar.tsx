// @AI-HINT: The Sidebar provides primary navigation for the dashboard. It's a key component for achieving a premium, production-ready UI, offering consistent branding, user context, and clear navigation pathways with modern enhancements.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { LogOut, Gauge, Briefcase, Users, Sun, Moon } from 'lucide-react';
import { User } from '../../types';

import commonStyles from './Sidebar.common.module.css';
import lightStyles from './Sidebar.light.module.css';
import darkStyles from './Sidebar.dark.module.css';

interface SidebarProps {
  user: User;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge, badge: null },
  { href: '/projects', label: 'Projects', icon: Briefcase, badge: '3' },
  { href: '/clients', label: 'Clients', icon: Users, badge: null },
];

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const { resolvedTheme, setTheme } = useTheme();

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.logo}>MegiLance</div>
        </div>
        <button 
          className={styles.themeToggle} 
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
      <div className={styles.userProfile}>
        <Image src={user.avatar} alt={`${user.fullName}'s avatar`} width={40} height={40} className={styles.avatar} />
        <div>
          <div className={styles.userName}>{user.fullName}</div>
          <div className={styles.userEmail}>{user.email}</div>
        </div>
      </div>
      <nav className={styles.navigation}>
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} className={styles.navItem}>
                <item.icon className={styles.navIcon} />
                <span>{item.label}</span>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarFooter}>
        <button className={styles.logoutButton}>
          <LogOut className={styles.navIcon} size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
