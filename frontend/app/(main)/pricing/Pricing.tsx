// @AI-HINT: This is the primary pricing page component. It includes a monthly/annual toggle and uses the reusable PricingCard component to display different tiers.
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PricingCard } from '@/components/pricing/PricingCard/PricingCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { PricingIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.common.module.css';
import commonStyles from './Pricing.common.module.css';
import lightStyles from './Pricing.light.module.css';
import darkStyles from './Pricing.dark.module.css';

const pricingData = {
  monthly: [
    {
      tier: 'Basic',
      description: 'For freelancers starting their journey.',
      price: '5%',
      pricePeriod: ' fee',
      features: ['Unlimited project browsing', 'Standard messaging tools', 'Access to community forum', 'Basic AI matching'],
      ctaText: 'Start for Free',
      ctaLink: '/signup?plan=basic',
    },
    {
      tier: 'Standard',
      description: 'For professional freelancers.',
      price: '3%',
      pricePeriod: ' fee',
      features: ['Everything in Basic', 'Priority project invites', 'Advanced search filters', 'Verified freelancer badge', 'AI-powered proposal assistant'],
      isPopular: true,
      ctaText: 'Join Now',
      ctaLink: '/signup?plan=standard',
    },
    {
      tier: 'Premium',
      description: 'For agencies and top-tier talent.',
      price: '1%',
      pricePeriod: ' fee',
      features: ['Everything in Standard', 'Zero withdrawal fees', 'Dedicated account manager', 'Priority support', 'Premium AI analytics'],
      ctaText: 'Contact Sales',
      ctaLink: '/contact?plan=premium',
    },
  ],
  annually: [
    {
      tier: 'Basic',
      description: 'For freelancers starting their journey.',
      price: '5%',
      pricePeriod: ' fee',
      features: ['Unlimited project browsing', 'Standard messaging tools', 'Access to community forum', 'Basic AI matching'],
      ctaText: 'Start for Free',
      ctaLink: '/signup?plan=basic',
    },
    {
      tier: 'Standard',
      description: 'For professional freelancers.',
      price: '2.5%',
      pricePeriod: ' fee',
      features: ['Everything in Basic', 'Priority project invites', 'Advanced search filters', 'Verified freelancer badge', 'AI-powered proposal assistant'],
      isPopular: true,
      ctaText: 'Join Now',
      ctaLink: '/signup?plan=standard',
    },
    {
      tier: 'Premium',
      description: 'For agencies and top-tier talent.',
      price: '0.5%',
      pricePeriod: ' fee',
      features: ['Everything in Standard', 'Zero withdrawal fees', 'Dedicated account manager', 'Priority support', 'Premium AI analytics'],
      ctaText: 'Contact Sales',
      ctaLink: '/contact?plan=premium',
    },
  ],
};

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = { ...commonStyles, ...themeStyles };

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main id="main-content" className={styles.root}>
        <ScrollReveal>
          <div className={styles.header}>
            <div className={commonStyles.heroRow}>
              <div className={commonStyles.heroContent}>
                <h1 className={styles.title}>Transparent, Low Fees</h1>
                <p className={styles.subtitle}>
                  As an FYP project, MegiLance demonstrates how blockchain can reduce platform fees to 5-10% 
                  compared to the industry standard of 20%+.
                </p>
              </div>
              <PricingIllustration className={illustrationStyles.heroIllustrationSmall} />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={styles.toggleContainer}>
            <span className={cn(styles.toggleLabel, billingCycle === 'monthly' && styles.activeLabel)}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className={styles.toggleSwitch}
              aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
            >
              <motion.div className={styles.toggleHandle} layout transition={{ type: 'spring', stiffness: 700, damping: 30 }} />
            </button>
            <span className={cn(styles.toggleLabel, billingCycle === 'annually' && styles.activeLabel)}>
              Annually <span className={styles.discountBadge}>Save 15%</span>
            </span>
          </div>
        </ScrollReveal>

        <StaggerContainer className={styles.grid}>
          {pricingData[billingCycle].map((tier) => (
            <StaggerItem key={tier.tier}>
              <PricingCard {...tier} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal delay={0.4}>
          <p className={styles.note}>All prices in USD. Applicable taxes may be added at checkout. Contact us for enterprise solutions.</p>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default Pricing;
