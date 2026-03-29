// @AI-HINT: This is the dedicated header for the public-facing marketing website with dropdown menus. It includes navigation, branding, and primary calls-to-action like 'Sign In' and 'Sign Up'.
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown, Users, Briefcase, Zap, Shield, Sparkles } from 'lucide-react';

import { MegiLanceLogo } from '@/app/components/atoms/MegiLanceLogo/MegiLanceLogo';
import Button from '@/app/components/atoms/Button/Button';
import StatusIndicator, { FeatureStatus } from '@/app/components/molecules/StatusIndicator/StatusIndicator';

import commonStyles from './PublicHeader.common.module.css';
import lightStyles from './PublicHeader.light.module.css';
import darkStyles from './PublicHeader.dark.module.css';

const navLinks = [
  { name: 'How It Works', href: '/how-it-works', status: 'complete' },
  { name: 'Features', href: '/#features', status: 'complete' },
  { name: 'Pricing', href: '/pricing', status: 'complete' },
  { name: 'Blog', href: '/blog', status: 'working' },
];

const servicesDropdown = [
  { name: 'For Freelancers', href: '/freelancers', icon: Users, description: 'Find work and build your career', status: 'complete' },
  { name: 'For Clients', href: '/clients', icon: Briefcase, description: 'Hire top talent for your projects', status: 'complete' },
  { name: 'Talent Directory', href: '/talent', icon: Sparkles, description: 'Browse our top rated talent', status: 'complete' },
  { name: 'Teams', href: '/teams', icon: Users, description: 'Build your dream team', status: 'working' },
  { name: 'AI Tools', href: '/ai', icon: Zap, description: 'Powered by AI matching', status: 'working' },
  { name: 'Enterprise', href: '/enterprise', icon: Shield, description: 'Scale your team globally', status: 'incomplete' },
];

const PublicHeader = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const servicesTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Ensure hydration completes before applying theme styles
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (servicesTimeoutRef.current) {
        clearTimeout(servicesTimeoutRef.current);
      }
    };
  }, []);

  // Compute styles - use common styles during SSR to prevent hydration mismatch
  const styles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Prevent hydration mismatch by using a minimal skeleton on server
  if (!mounted) {
    return (
      <header className={cn(commonStyles.header, lightStyles.header)}>
        <div className={commonStyles.container}>
          <div>
            <MegiLanceLogo />
          </div>
          <nav className={commonStyles.nav}>
            <ul className={commonStyles.navList}>
              <li className={commonStyles.navItem}>
                <button className={cn(commonStyles.navLink, lightStyles.navLink)}>Services</button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleServicesClick = () => {
    setIsServicesOpen(!isServicesOpen);
  };

  const handleServicesEnter = () => {
    // Clear any pending close timeout
    if (servicesTimeoutRef.current) {
      clearTimeout(servicesTimeoutRef.current);
      servicesTimeoutRef.current = null;
    }
    setIsServicesOpen(true);
  };

  const handleServicesLeave = () => {
    // Add a small delay before closing to make it more forgiving
    servicesTimeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 150);
  };

  const closeServicesDropdown = () => {
    if (servicesTimeoutRef.current) {
      clearTimeout(servicesTimeoutRef.current);
    }
    setIsServicesOpen(false);
  };

  return (
    <>
      <header className={cn(commonStyles.header, styles.header, isScrolled && commonStyles.scrolled, isScrolled && styles.scrolled)}>
        <div className={cn(commonStyles.container, styles.container)}>
          <div className={commonStyles.logoContainer}>
            <Link href="/" aria-label="MegiLance Home" onClick={closeMobileMenu}>
              <MegiLanceLogo />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className={commonStyles.nav}>
            <ul className={commonStyles.navList}>
              {/* Services Dropdown */}
              <li 
                className={commonStyles.dropdownContainer}
                onMouseEnter={handleServicesEnter}
                onMouseLeave={handleServicesLeave}
              >
                <button 
                  className={cn(commonStyles.navLink, styles.navLink, commonStyles.dropdownTrigger)}
                  onClick={handleServicesClick}
                  aria-expanded={isServicesOpen ? 'true' : 'false'}
                  aria-haspopup="true"
                >
                  Services
                  <ChevronDown size={16} className={cn(commonStyles.dropdownIcon, isServicesOpen && commonStyles.dropdownIconOpen)} />
                </button>
                
                {isServicesOpen && (
                  <div className={cn(commonStyles.dropdown, styles.dropdown)}>
                    <div className={commonStyles.dropdownContent}>
                      {servicesDropdown.map((item) => (
                        <Link 
                          key={item.name} 
                          href={item.href} 
                          className={cn(commonStyles.dropdownItem, styles.dropdownItem)}
                          onClick={closeServicesDropdown}
                        >
                          <div className={cn(commonStyles.dropdownItemIcon, styles.dropdownItemIcon)}>
                            <item.icon size={20} />
                          </div>
                          <div className={commonStyles.dropdownItemText}>
                            <div className={cn(commonStyles.dropdownItemTitle, styles.dropdownItemTitle)}>
                              {item.name}
                              {item.status && <StatusIndicator status={item.status as FeatureStatus} className="ml-2 scale-75" />}
                            </div>
                            <div className={cn(commonStyles.dropdownItemDesc, styles.dropdownItemDesc)}>{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
              
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className={cn(commonStyles.navLink, styles.navLink)}>
                    {link.name}
                    {link.status && <StatusIndicator status={link.status as FeatureStatus} className="ml-1 scale-75" />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Desktop Actions */}
          <div className={commonStyles.actionsContainer}>
            <Link href="/login">
              <Button variant="ghost" className={cn(commonStyles.signInButton, styles.signInButton)}>
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary">
                Sign Up Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(commonStyles.mobileMenuButton, styles.mobileMenuButton)}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={cn(commonStyles.mobileMenuOverlay, styles.mobileMenuOverlay)}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div className={cn(
        commonStyles.mobileMenu,
        styles.mobileMenu,
        isMobileMenuOpen && commonStyles.mobileMenuOpen,
        isMobileMenuOpen && styles.mobileMenuOpen
      )}>
        <nav className={commonStyles.mobileNav}>
          <ul className={commonStyles.mobileNavList}>
            {/* Mobile Services Section */}
            <li>
              <div className={cn(commonStyles.mobileNavCategory, styles.mobileNavCategory)}>Services</div>
              <ul className={commonStyles.mobileSubList}>
                {servicesDropdown.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href} 
                      className={cn(commonStyles.mobileNavLink, commonStyles.mobileNavSubLink, styles.mobileNavLink)}
                      onClick={closeMobileMenu}
                    >
                      <item.icon size={18} className={commonStyles.mobileNavLinkIcon} />
                      <div>
                        <div>
                          {item.name}
                          {item.status && <StatusIndicator status={item.status as FeatureStatus} className="ml-2 scale-75" />}
                        </div>
                        <div className={cn(commonStyles.mobileNavLinkDesc, styles.mobileNavLinkDesc)}>{item.description}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  href={link.href} 
                  className={cn(commonStyles.mobileNavLink, styles.mobileNavLink)}
                  onClick={closeMobileMenu}
                >
                  {link.name}
                  {link.status && <StatusIndicator status={link.status as FeatureStatus} className="ml-2 scale-75" />}
                </Link>
              </li>
            ))}
          </ul>
          <div className={commonStyles.mobileActions}>
            <Link href="/login" onClick={closeMobileMenu}>
              <Button 
                variant="ghost" 
                fullWidth
              >
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={closeMobileMenu}>
              <Button 
                variant="primary"
                fullWidth
              >
                Sign Up Free
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
};

export default PublicHeader;
