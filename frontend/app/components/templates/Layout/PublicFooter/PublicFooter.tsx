// @AI-HINT: Premium public footer with sitemap links, newsletter CTA, social icons, globe decoration, and gradient top border.
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

import { MegiLanceLogo } from '@/app/components/atoms/MegiLanceLogo/MegiLanceLogo';
import FooterGlobe from './FooterGlobe';

import commonStyles from './PublicFooter.common.module.css';
import lightStyles from './PublicFooter.light.module.css';
import darkStyles from './PublicFooter.dark.module.css';

const footerSections = {
  'Product': [
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'For Clients', href: '/clients' },
    { name: 'For Freelancers', href: '/freelancers' },
    { name: 'Talent Directory', href: '/talent' },
    { name: 'Teams', href: '/teams' },
    { name: 'Success Stories', href: '/testimonials' },
    { name: 'Download App', href: '/install' },
  ],
  'Company': [
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Security', href: '/security' },
  ],
  'Resources': [
    { name: 'Help Center', href: '/help' },
    { name: 'Support', href: '/support' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Community', href: '/community' },
    { name: 'Status', href: '/status' },
    { name: 'Referral Program', href: '/referral' },
  ],
  'Legal': [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'LinkedIn', href: '#', icon: Linkedin },
  { name: 'Email', href: 'mailto:hello@megilance.com', icon: Mail },
];

const PublicFooter = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render themed content until mounted to avoid hydration mismatch
  if (!mounted) {
    return <footer className={commonStyles.footer} />;
  }

  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <footer className={cn(commonStyles.footer, styles.footer)}>
      <div className={commonStyles.topBorder} />
      <FooterGlobe />
      <div className={cn(commonStyles.container, styles.container)}>
        <div className={commonStyles.mainContent}>
          <div className={commonStyles.brandColumn}>
            <Link href="/" aria-label="MegiLance Home" className={commonStyles.brandLink}>
              <MegiLanceLogo />
            </Link>
            <p className={cn(commonStyles.tagline, styles.tagline)}>
              The Future of Freelance, Today.
            </p>
            {/* Newsletter CTA */}
            <div className={commonStyles.newsletterSection}>
              <p className={cn(commonStyles.newsletterLabel, styles.newsletterLabel)}>Stay Updated</p>
              <form className={commonStyles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className={cn(commonStyles.newsletterInput, styles.newsletterInput)}
                  aria-label="Email for newsletter"
                />
                <button type="submit" className={cn(commonStyles.newsletterButton, styles.newsletterButton)}>
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className={commonStyles.linksGrid}>
            {Object.entries(footerSections).map(([title, links]) => (
              <div key={title} className={commonStyles.linksColumn}>
                <h3 className={cn(commonStyles.linksTitle, styles.linksTitle)}>{title}</h3>
                <ul className={commonStyles.linksList}>
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className={cn(commonStyles.linkItem, styles.linkItem)}>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(commonStyles.bottomBar, styles.bottomBar)}>
          <p className={cn(commonStyles.copyright, styles.copyright)}>
            &copy; {new Date().getFullYear()} MegiLance, Inc. All rights reserved.
          </p>
          <div className={commonStyles.socialLinks}>
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} aria-label={link.name} className={cn(commonStyles.socialLink, styles.socialLink)}>
                <link.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
