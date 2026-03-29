/* AI-HINT: This component displays a single pricing plan, including its name, price, features, and a call-to-action. It's designed to be theme-aware and responsive, with a special variant for the 'popular' plan. */

'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import styles from './PricingCard.common.module.css';
import lightStyles from './PricingCard.light.module.css';
import darkStyles from './PricingCard.dark.module.css';

export interface PricingCardProps {
  tier: string;
  description: string;
  price: string;
  pricePeriod: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  ctaLink: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  tier, 
  description, 
  price, 
  pricePeriod, 
  features, 
  isPopular = false, 
  ctaText, 
  ctaLink 
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(styles.card, themeStyles.card, isPopular && styles.popular, isPopular && themeStyles.popular)}>
      {isPopular && <div className={styles.popularBadge}>Most Popular</div>}
      
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTier}>{tier}</h3>
      </div>

      <p className={styles.cardDescription}>{description}</p>

      <div className={styles.priceSection}>
        <div className={styles.price}>
          <span className={styles.priceAmount}>{price}</span>
          <span className={styles.pricePeriod}>{pricePeriod}</span>
        </div>
      </div>

      <ul className={styles.features}>
        {features.map((feature, index) => (
          <li key={index} className={styles.featureItem}>
            <Check className={styles.featureIcon} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={styles.cardCta}>
        <Button 
          as="a" 
          href={ctaLink} 
          variant={isPopular ? 'primary' : 'secondary'}
          className={styles.ctaButton}
          iconAfter={<ArrowRight size={16} />}
        >
          {ctaText}
        </Button>
      </div>
    </div>
  );
};
