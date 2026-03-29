// @AI-HINT: Premium full-page loading animation with brand-aligned styling and per-component CSS modules
'use client';

import { useTheme } from 'next-themes';
import styles from './MegaLoader.common.module.css';
import light from './MegaLoader.light.module.css';
import dark from './MegaLoader.dark.module.css';

// AI-HINT: Theme prop allows explicit control if you ever need to force a theme.
// Otherwise, the component uses useTheme() to auto-apply.
export type MegaLoaderProps = {
  theme?: 'light' | 'dark';
  message?: string;
  subMessage?: string;
};

// AI-HINT: Keep this component free of side effects; pure CSS animations for performance.
export default function MegaLoader({ theme: themeProp, message, subMessage }: MegaLoaderProps) {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeProp || resolvedTheme;
  const themeClass = currentTheme === 'dark' ? dark.theme : light.theme;

  return (
    <div className={[styles.backdrop, themeClass].join(' ')} role="status" aria-live="polite">
      <div className={styles.container}>
        {/* AI-HINT: Animated brand ring with subtle depth and glassy sheen */}
        <div className={styles.ringWrapper} aria-hidden>
          <div className={styles.ringOuter} />
          <div className={styles.ringInner} />
          <div className={styles.spark} />
        </div>

        {/* AI-HINT: Brand wordmark placeholder built in CSS for early-stage visual parity */}
        <div className={styles.wordmark}>
          <span className={styles.wordLeft}>Megi</span>
          <span className={styles.wordRight}>Lance</span>
        </div>

        {/* AI-HINT: Micro-interactions: progress shimmer + pulse dots for perceived performance */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
        <div className={styles.dots} aria-hidden>
          <span />
          <span />
          <span />
        </div>

        {/* AI-HINT: Localizable status text with semantic hierarchy */}
        <div className={styles.copy}>
          <p className={styles.title}>{message ?? 'Preparing your experience'}</p>
          <p className={styles.subtitle}>
            {subMessage ?? 'Optimizing assets • Securing session • Calibrating AI' }
          </p>
        </div>
      </div>
    </div>
  );
}
