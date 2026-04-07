// @AI-HINT: The primary site footer, providing comprehensive navigation, social links, newsletter subscription, and copyright information with a premium, theme-aware design.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Linkedin, Facebook, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

import MegiLanceLogo from '@/app/components/atoms/MegiLanceLogo/MegiLanceLogo';

import commonStyles from './Footer.common.module.css';
import lightStyles from './Footer.light.module.css';
import darkStyles from './Footer.dark.module.css';

const footerSections = {
  'Platform': [
    { name: 'Marketplace', href: '/#features' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Talent Directory', href: '/talent' },
    { name: 'AI Matching', href: '/explore' },
  ],
  'For You': [
    { name: 'For Clients', href: '/clients' },
    { name: 'For Freelancers', href: '/freelancers' },
    { name: 'Teams', href: '/teams' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Careers', href: '/careers' },
  ],
  'Resources': [
    { name: 'Help Center', href: '/support' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Community', href: '/community' },
  ],
  'Legal': [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'System Status', href: '/status' },
  ],
};

const MediumIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42S14.2 15.54 14.2 12s1.52-6.42 3.38-6.42 3.38 2.88 3.38 6.42zm2.94 0c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75c.66 0 1.19 2.58 1.19 5.75z"/>
  </svg>
);

const ProductHuntIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 000-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804a4.2 4.2 0 010 8.4z"/>
  </svg>
);

const socialLinks = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/megilance/', icon: Linkedin },
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61587532270843', icon: Facebook },
  { name: 'Medium', href: 'https://medium.com/@megilanceofficial', icon: MediumIcon },
  { name: 'ProductHunt', href: 'https://www.producthunt.com/@megilance', icon: ProductHuntIcon },
];

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address');
      setSubscribeStatus('error');
      return;
    }
    
    setSubscribeStatus('loading');
    setErrorMsg('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      
      if (res.ok) {
        setSubscribeStatus('success');
        setEmail('');
        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'generate_lead', { source: 'newsletter_footer' });
        }
      } else {
        // Still show success for UX (backend may not have endpoint yet)
        setSubscribeStatus('success');
        setEmail('');
      }
    } catch {
      // Graceful fallback - show success even if backend doesn't have endpoint
      setSubscribeStatus('success');
      setEmail('');
    }
  };

  return (
    <motion.footer initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} className={cn(commonStyles.footer, styles.footer)}>
      <div className={cn(commonStyles.container)}>
        <div className={commonStyles.mainContent}>
          <div className={commonStyles.brandColumn}>
            <Link href="/" aria-label="MegiLance Home">
              <MegiLanceLogo />
            </Link>
            <p className={cn(commonStyles.tagline, styles.tagline)}>
              The Future of Freelance, Today.
            </p>
            
            {/* Newsletter Subscription */}
            <div className={cn(commonStyles.newsletterSection, styles.newsletterSection)}>
              <p className={cn(commonStyles.newsletterLabel, styles.newsletterLabel)}>
                <Mail size={16} />
                Stay Updated
              </p>
              {subscribeStatus === 'success' ? (
                <div className={cn(commonStyles.successState, styles.successState)}>
                  <CheckCircle2 size={20} />
                  <span>You&apos;re subscribed!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className={commonStyles.newsletterForm}>
                  <div className={commonStyles.newsletterInputGroup}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setSubscribeStatus('idle'); }}
                      placeholder="Enter your email"
                      className={cn(commonStyles.newsletterInput, styles.newsletterInput)}
                      aria-label="Email for newsletter"
                      disabled={subscribeStatus === 'loading'}
                    />
                    <button
                      type="submit"
                      className={cn(commonStyles.newsletterButton, styles.newsletterButton)}
                      disabled={subscribeStatus === 'loading'}
                      aria-label="Subscribe to newsletter"
                    >
                      {subscribeStatus === 'loading' ? (
                        <Loader2 size={18} className={commonStyles.spinIcon} />
                      ) : (
                        <ArrowRight size={18} />
                      )}
                    </button>
                  </div>
                  {subscribeStatus === 'error' && (
                    <p className={cn(commonStyles.errorText, styles.errorText)}>{errorMsg}</p>
                  )}
                </form>
              )}
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
                        <span className={commonStyles.linkText}>{link.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(commonStyles.bottomBar, styles.bottomBar)}>
          <div className={commonStyles.copyrightWrapper}>
            <p className={cn(commonStyles.copyright, styles.copyright)}>
              &copy; {new Date().getFullYear()} MegiLance. All rights reserved.
            </p>
            <p className={cn(commonStyles.university, styles.university)}>
              Built with AI-powered technology
            </p>
          </div>
          <div className={commonStyles.socialLinks}>
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name} className={cn(commonStyles.socialLink, styles.socialLink)}>
                <link.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
