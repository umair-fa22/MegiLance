// @AI-HINT: Enterprise portal footer with status indicator, version, keyboard hint, and professional links
'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Command } from 'lucide-react';

import commonStyles from './PortalFooter.common.module.css';
import lightStyles from './PortalFooter.light.module.css';
import darkStyles from './PortalFooter.dark.module.css';

const PortalFooter = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <footer className={cn(commonStyles.footer, styles.footer)}>
      <div className={commonStyles.container}>
        <div className={commonStyles.leftGroup}>
          <div className={cn(commonStyles.statusIndicator, styles.statusIndicator)}>
            <span className={commonStyles.statusDot} aria-hidden="true" />
            <span className={cn(commonStyles.statusText, styles.statusText)}>All systems operational</span>
          </div>
          <span className={cn(commonStyles.separator, styles.separator)} aria-hidden="true">&middot;</span>
          <p className={cn(commonStyles.copyright, styles.copyright)}>
            &copy; {new Date().getFullYear()} MegiLance
          </p>
          <span className={cn(commonStyles.versionBadge, styles.versionBadge)}>v2.1.0</span>
        </div>

        <div className={commonStyles.rightGroup}>
          <div className={cn(commonStyles.shortcutHint, styles.shortcutHint)}>
            <Command size={11} />
            <span>K</span>
            <span className={commonStyles.shortcutLabel}>Quick search</span>
          </div>
          <span className={cn(commonStyles.separator, styles.separator)} aria-hidden="true">&middot;</span>
          <div className={commonStyles.links}>
            <Link href="/help" className={cn(commonStyles.link, styles.link)}>Help</Link>
            <Link href="/terms" className={cn(commonStyles.link, styles.link)}>Terms</Link>
            <Link href="/privacy" className={cn(commonStyles.link, styles.link)}>Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
