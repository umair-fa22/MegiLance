const fs = require('fs');
const path = require('path');

const dir = 'e:/MegiLance/frontend/app/components/organisms/Header';

const tsxContent = \// @AI-HINT: Completely redesigned premium sticky Header with accessible Mega Menu & mobile flyout
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
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
      <header 
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
      </header>

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
\;

const cssCommon = \/* @AI-HINT: Enterprise-level Premium Architecture for Common Header Styles */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  justify-content: center;
}

.innerContainer {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: padding 0.3s ease;
}

.header[data-scrolled="true"] .innerContainer {
  padding: 0.75rem 1.5rem;
}

.brandWrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  z-index: 101;
}

.brandText {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-family: var(--font-poppins, sans-serif);
}

.desktopNav {
  display: none;
  align-items: center;
  gap: 1.5rem;
  height: 100%;
}

.navBtn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-inter, sans-serif);
  text-decoration: none;
}

.featuredBtn {
  font-weight: 600;
}

.chevron {
  transition: transform 0.3s ease;
}

.chevronRotated {
  transform: rotate(180deg);
}

.dropdownWrapper {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.megaMenu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px) scale(0.98);
  opacity: 0;
  visibility: hidden;
  min-width: 600px;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  padding-top: 1rem; /* Hitbox buffer */
}

/* Align Resources to the right to avoid edge clipping */
.megaMenuAlignRight {
  left: auto;
  right: 0;
  transform: translateX(0) translateY(10px) scale(0.98);
}

.megaMenuActive {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0) scale(1);
  pointer-events: auto;
}

.megaMenuAlignRight.megaMenuActive {
  transform: translateX(0) translateY(0) scale(1);
}

.megaMenuContent {
  border-radius: inherit;
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
  border: 1px solid transparent;
  overflow: hidden;
}

.megaMenuSection {
  flex: 1;
  min-width: 250px;
}

.megaMenuLabel {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.megaMenuGrid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.megaMenuItem {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.iconWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  flex-shrink: 0;
}

.itemTextContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.itemHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.itemName {
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.itemDesc {
  font-size: 0.85rem;
  line-height: 1.4;
}

.actionGroup {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.desktopActions {
  display: none;
  gap: 0.75rem;
}

.hamburger {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

/* Mobile Flyout CSS */
.mobileFlyout {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobileFlyoutOpen {
  transform: translateX(0);
  opacity: 1;
}

.mobileHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid transparent;
}

.closeBtn {
  margin-right: -0.5rem;
}

.mobileContentWrapper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.mobileTabs {
  display: flex;
  padding: 1rem 1.5rem 0;
  gap: 1rem;
  border-bottom: 1px solid transparent;
}

.mobileTab {
  background: transparent;
  border: none;
  padding: 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
  opacity: 0.6;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.mobilePanel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.mobileSecWrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobileSecItems {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobileItemSpecific {
  align-items: center;
}

.mobileFooter {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid transparent;
}

.mobileFooterLink {
  text-decoration: none;
  width: 100%;
}

@media (min-width: 1024px) {
  .desktopNav, .desktopActions {
    display: flex;
  }
  .hamburger {
    display: none;
  }
}
\;

const cssLight = \/* @AI-HINT: Light Theme - Glassmorphism, Airy layout, Subtle shadows */
.header {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(0, 0, 0, 0.05);
}

.header[data-scrolled="true"] {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.brandText {
  background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navBtn {
  color: #4b5563;
}

.navBtn:hover, .navBtnActive {
  color: #111827;
  background: rgba(69, 115, 223, 0.06);
}

.featuredBtn {
  color: #4573df;
  background: rgba(69, 115, 223, 0.08);
}
.featuredBtn:hover {
  background: rgba(69, 115, 223, 0.15);
}

.megaMenuContent {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.megaMenuLabel {
  color: #6b7280;
}

.megaMenuItem {
  color: #1f2937;
}

.megaMenuItem:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.iconWrap {
  background: #f9fafb;
  color: #4573df;
}

.megaMenuItem:hover .iconWrap {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.itemDesc {
  color: #6b7280;
}

.hamburger {
  color: #4b5563;
}
.hamburger:hover {
  background: #f3f4f6;
}

.mobileFlyout {
  background: #ffffff;
}

.mobileHeader {
  border-color: rgba(0, 0, 0, 0.08);
}

.mobileTabActive {
  opacity: 1;
  border-color: #4573df;
  color: #4573df;
}

.mobileFooter {
  background: #f9fafb;
  border-color: rgba(0, 0, 0, 0.08);
}
\;

const cssDark = \/* @AI-HINT: Dark Theme - Deep Contrast, OLED-ready, Vivid Neon hints */
.header {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(255, 255, 255, 0.05);
}

.header[data-scrolled="true"] {
  background: rgba(15, 23, 42, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.brandText {
  color: #F8FAFC;
}

.navBtn {
  color: #9ca3af;
}

.navBtn:hover, .navBtnActive {
  color: #f9fafb;
  background: rgba(255, 255, 255, 0.05);
}

.featuredBtn {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
}
.featuredBtn:hover {
  background: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
}

.megaMenuContent {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.megaMenuLabel {
  color: #9ca3af;
}

.megaMenuItem {
  color: #f3f4f6;
}

.megaMenuItem:hover {
  background: #334155;
  transform: translateY(-1px);
}

.iconWrap {
  background: #0f172a;
  color: #60a5fa;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.megaMenuItem:hover .iconWrap {
  background: #1e293b;
  border-color: rgba(96, 165, 250, 0.3);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
}

.itemDesc {
  color: #9ca3af;
}

.hamburger {
  color: #d1d5db;
}
.hamburger:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobileFlyout {
  background: #0f172a;
}

.mobileHeader {
  border-color: rgba(255, 255, 255, 0.1);
}

.mobileTab {
  color: #d1d5db;
}

.mobileTabActive {
  opacity: 1;
  border-color: #60a5fa;
  color: #60a5fa;
}

.mobileFooter {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
}
\;

fs.writeFileSync(path.join(dir, 'Header.tsx'), tsxContent);
fs.writeFileSync(path.join(dir, 'Header.common.module.css'), cssCommon);
fs.writeFileSync(path.join(dir, 'Header.light.module.css'), cssLight);
fs.writeFileSync(path.join(dir, 'Header.dark.module.css'), cssDark);
console.log("Success! Header rebuilt.");
