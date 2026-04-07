// @AI-HINT: Completely redesigned premium sticky Header with accessible Mega Menu & mobile flyout
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Sparkles, ChevronDown, Briefcase, Users, Shield, 
  Search, Zap, Globe, MessageSquare, CreditCard, 
  BarChart3, Star, Building2, Rocket, HelpCircle, Mail, Activity, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MegiLanceLogo } from '@/app/components/atoms/MegiLanceLogo/MegiLanceLogo';
import Button from '@/app/components/atoms/Button/Button';
import FeatureStatusPill, { type FeatureStatus } from '@/app/components/molecules/FeatureStatusPill/FeatureStatusPill';

import commonStyles from './Header.common.module.css';
import lightStyles from './Header.light.module.css';
import darkStyles from './Header.dark.module.css';

const megaMenuData = {
  platform: {
    title: 'Platform',
    sections: [
      {
        title: 'Core Features',
        items: [
          { name: 'How It Works', href: '/how-it-works', icon: Rocket, description: '4-step process', status: 'complete' as FeatureStatus },
          { name: 'Marketplace', href: '/#features', icon: Zap, description: 'Find projects & talent', status: 'complete' as FeatureStatus },
          { name: 'Pricing', href: '/pricing', icon: CreditCard, description: 'Transparent fees', status: 'complete' as FeatureStatus },
          { name: 'Talent Directory', href: '/talent', icon: Star, description: 'Browse top freelancers', status: 'complete' as FeatureStatus },
        ]
      },
      {
        title: 'AI-Powered',
        items: [
          { name: 'AI Chatbot', href: '/ai/chatbot', icon: MessageSquare, description: 'Intelligent assistant', status: 'advanced' as FeatureStatus },
          { name: 'Smart Matching', href: '/explore', icon: Search, description: '7-factor algorithm', status: 'advanced' as FeatureStatus },
          { name: 'Price Estimator', href: '/ai/price-estimator', icon: BarChart3, description: 'ML-powered pricing', status: 'advanced' as FeatureStatus },
        ]
      },
      {
        title: 'Security',
        items: [
          { name: 'Secure Escrow', href: '/how-it-works#escrow', icon: Shield, description: 'Protected milestones', status: 'complete' as FeatureStatus },
        ]
      }
    ]
  },
  solutions: {
    title: 'Solutions',
    sections: [
      {
        title: 'Get Started',
        items: [
          { name: 'For Clients', href: '/clients', icon: Briefcase, description: 'Hire top talent', status: 'complete' as FeatureStatus },
          { name: 'For Freelancers', href: '/freelancers', icon: Users, description: 'Find great work', status: 'complete' as FeatureStatus },
          { name: 'Teams', href: '/teams', icon: Building2, description: 'Collaborate & scale', status: 'development' as FeatureStatus },
        ]
      },
      {
        title: 'Dashboards',
        items: [
          { name: 'Client Portal', href: '/client/dashboard', icon: Briefcase, description: 'Manage projects', auth: true, status: 'complete' as FeatureStatus },
          { name: 'Freelancer Portal', href: '/freelancer/dashboard', icon: Users, description: 'Track earnings', auth: true, status: 'complete' as FeatureStatus },
        ]
      }
    ]
  },
  resources: {
    title: 'Resources',
    sections: [
      {
        title: 'Help & Knowledge',
        items: [
          { name: 'FAQ', href: '/faq', icon: HelpCircle, description: 'Common questions', status: 'complete' as FeatureStatus },
          { name: 'Support', href: '/support', icon: Mail, description: 'Get help 24/7', status: 'development' as FeatureStatus },
        ]
      },
      {
        title: 'Company',
        items: [
          { name: 'About Us', href: '/about', icon: Globe, description: 'Our mission', status: 'complete' as FeatureStatus },
          { name: 'System Status', href: '/status', icon: Activity, description: 'Platform health', status: 'complete' as FeatureStatus },
        ]
      }
    ]
  }
};

type MenuKey = keyof typeof megaMenuData | null;

export default function Header() {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState<MenuKey>('platform');
  const pathname = usePathname();

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Hydration handling
  useEffect(() => setIsMounted(true), []);

  // Scroll effect for dynamic shrinking navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync mobile menu body locking correctly
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Route change closes menus
  useEffect(() => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Click outside mega menu detection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuEnter = useCallback((key: MenuKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(key);
  }, []);

  const handleMenuLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 250);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} 
        className={cn(commonStyles.header, themeStyles.header)} 
        data-scrolled={isScrolled}
      >
        <div className={commonStyles.innerContainer}>
          <Link href="/" className={commonStyles.brandWrap} aria-label="MegiLance Home">
            <MegiLanceLogo />
            <span className={cn(commonStyles.brandText, themeStyles.brandText)}>MegiLance</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={commonStyles.desktopNav} ref={navRef}>
            <Link href="/explore" className={cn(commonStyles.navBtn, commonStyles.featuredBtn, themeStyles.featuredBtn)}>
              <Sparkles size={16} /> Explore
            </Link>

            {(Object.keys(megaMenuData) as Array<keyof typeof megaMenuData>).map((key) => (
              <div 
                key={key} 
                className={commonStyles.dropdownWrapper}
                onMouseEnter={() => handleMenuEnter(key)}
                onMouseLeave={handleMenuLeave}
              >
                <button 
                  className={cn(commonStyles.navBtn, themeStyles.navBtn, activeMenu === key && themeStyles.navBtnActive)}
                  aria-expanded={activeMenu === key}
                  onFocus={() => handleMenuEnter(key)}
                >
                  {megaMenuData[key].title}
                  <ChevronDown size={14} className={cn(commonStyles.chevron, activeMenu === key && commonStyles.chevronRotated)} />
                </button>

                {/* Animated MegaMenu Dropdown */}
                <div 
                  className={cn(
                    commonStyles.megaMenu, 
                    themeStyles.megaMenu, 
                    activeMenu === key && commonStyles.megaMenuActive,
                    key === 'resources' && commonStyles.megaMenuAlignRight // Right align last items
                  )}
                >
                  <div className={commonStyles.megaMenuContent}>
                    {megaMenuData[key].sections.map((section, idx) => (
                      <div key={idx} className={commonStyles.megaMenuSection}>
                        <h4 className={cn(commonStyles.megaMenuLabel, themeStyles.megaMenuLabel)}>{section.title}</h4>
                        <div className={commonStyles.megaMenuGrid}>
                          {section.items.map((item) => (
                            <Link key={item.href} href={item.href} className={cn(commonStyles.megaMenuItem, themeStyles.megaMenuItem)}>
                              <div className={cn(commonStyles.iconWrap, themeStyles.iconWrap)}>
                                <item.icon size={20} />
                              </div>
                              <div className={commonStyles.itemTextContent}>
                                <div className={commonStyles.itemHeader}>
                                  <span className={commonStyles.itemName}>
                                    {item.name}
                                    {('auth' in item && (item as any).auth) && <Lock size={12} className={commonStyles.lockIcon} />}
                                  </span>
                                  {('status' in item && (item as any).status) && (
                                    <FeatureStatusPill status={(item as any).status} size="xs" compact />
                                  )}
                                </div>
                                <span className={cn(commonStyles.itemDesc, themeStyles.itemDesc)}>{item.description}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>

          {/* Right Action Bar */}
          <div className={commonStyles.actionGroup}>
            <div className={commonStyles.desktopActions}>
              <Link href="/login">
                <Button variant="ghost" size="md">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="md">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Hamburger Hook */}
            <button 
              className={cn(commonStyles.hamburger, themeStyles.hamburger)}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Mobile Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Fullscreen Mobile Flyout Menu */}
      <div className={cn(commonStyles.mobileFlyout, themeStyles.mobileFlyout, mobileMenuOpen && commonStyles.mobileFlyoutOpen)}>
        <div className={cn(commonStyles.mobileHeader, themeStyles.mobileHeader)}>
          <Link href="/" className={commonStyles.brandWrap} onClick={() => setMobileMenuOpen(false)}>
            <MegiLanceLogo />
            <span className={cn(commonStyles.brandText, themeStyles.brandText)}>MegiLance</span>
          </Link>
          <button className={cn(commonStyles.closeBtn, themeStyles.hamburger)} onClick={() => setMobileMenuOpen(false)} aria-label="Close Mobile Menu">
            <X size={24} />
          </button>
        </div>

        <div className={commonStyles.mobileContentWrapper}>
          <div className={commonStyles.mobileTabs}>
            {(Object.keys(megaMenuData) as Array<keyof typeof megaMenuData>).map(key => (
              <button 
                key={key} 
                onClick={() => setActiveMobileSection(key)}
                className={cn(
                  commonStyles.mobileTab, 
                  themeStyles.mobileTab, 
                  activeMobileSection === key && themeStyles.mobileTabActive
                )}
              >
                {megaMenuData[key].title}
              </button>
            ))}
          </div>

          <div className={commonStyles.mobilePanel}>
            {activeMobileSection && megaMenuData[activeMobileSection].sections.map((sec, idx) => (
              <div key={idx} className={commonStyles.mobileSecWrap}>
                <h3 className={cn(commonStyles.mobileSecLabel, themeStyles.megaMenuLabel)}>{sec.title}</h3>
                <div className={commonStyles.mobileSecItems}>
                  {sec.items.map(item => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className={cn(commonStyles.megaMenuItem, commonStyles.mobileItemSpecific, themeStyles.megaMenuItem)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className={cn(commonStyles.iconWrap, themeStyles.iconWrap)}>
                        <item.icon size={20} />
                      </div>
                      <div className={commonStyles.itemTextContent}>
                        <div className={commonStyles.itemHeader}>
                          <span className={commonStyles.itemName}>{item.name}</span>
                          {('status' in item && (item as any).status) && (
                            <FeatureStatusPill status={(item as any).status} size="xs" compact />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(commonStyles.mobileFooter, themeStyles.mobileFooter)}>
          <Link href="/login" className={commonStyles.mobileFooterLink} onClick={() => setMobileMenuOpen(false)}>
            <Button variant="outline" size="lg" fullWidth>Sign In</Button>
          </Link>
          <Link href="/signup" className={commonStyles.mobileFooterLink} onClick={() => setMobileMenuOpen(false)}>
            <Button variant="primary" size="lg" fullWidth>Get Started</Button>
          </Link>
        </div>
      </div>
    </>
  );
}

