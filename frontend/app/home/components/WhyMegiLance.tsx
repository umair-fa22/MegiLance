// @AI-HINT: "Why MegiLance?" section component showcasing the core platform value propositions with visual hierarchy, interactive cards, and trust-building messaging. Uses glassmorphism effects and gradient accents per 2025 design trends.

'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  Zap,
  Lock,
  Globe2,
  Wallet2,
  Check,
  ArrowRight,
} from 'lucide-react';

import commonStyles from './WhyMegiLance.common.module.css';
import lightStyles from './WhyMegiLance.light.module.css';
import darkStyles from './WhyMegiLance.dark.module.css';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';

interface ValueProp {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  variant: 'primary' | 'success' | 'orange' | 'purple';
}

const valuePropositions: ValueProp[] = [
  {
    id: 'ai-precision',
    icon: <Zap className={commonStyles.icon} />,
    title: 'AI-Powered Precision',
    subtitle: 'Intelligent Workflow Automation',
    description:
      'Leverage our suite of AI tools to estimate project costs, generate proposals, and automate your entire workflow with unparalleled accuracy.',
    benefits: [
      'Smart cost estimation using historical data',
      'AI-generated professional proposals',
      'Automated workflow optimization',
      'Real-time market analytics',
    ],
    variant: 'primary',
  },
  {
    id: 'bulletproof-security',
    icon: <Lock className={commonStyles.icon} />,
    title: 'Bulletproof Security',
    subtitle: 'Transparent On-Chain Payments',
    description:
      'Experience peace of mind with our secure USDC payment system, featuring transparent, low-fee transactions and on-chain verification.',
    benefits: [
      'Stable USDC stablecoin payments',
      'On-chain transaction verification',
      'Transparent fee structure (0.5-2%)',
      'Instant settlement with no intermediaries',
    ],
    variant: 'success',
  },
  {
    id: 'borderless-opportunities',
    icon: <Globe2 className={commonStyles.icon} />,
    title: 'Borderless Opportunities',
    subtitle: 'Global Network Access',
    description:
      'Connect with a curated, global network of clients and discover high-value projects that perfectly match your skills and professional ambition.',
    benefits: [
      'Access to global client marketplace',
      'AI-powered project matching algorithm',
      'Curated opportunity recommendations',
      'Multi-currency and timezone support',
    ],
    variant: 'orange',
  },
  {
    id: 'sovereign-wallet',
    icon: <Wallet2 className={commonStyles.icon} />,
    title: 'Sovereign Wallet',
    subtitle: 'Self-Custodial Fund Management',
    description:
      'Manage your earnings with a built-in, non-custodial wallet that gives you absolute control and ownership over your funds.',
    benefits: [
      'Non-custodial wallet ownership',
      'Direct control over private keys',
      'Seamless withdrawal to external wallets',
      'Built-in DeFi protocol integration',
    ],
    variant: 'purple',
  },
];

interface ValueCardProps {
  prop: ValueProp;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  themeStyles: any;
}

const ValueCard: React.FC<ValueCardProps> = ({
  prop,
  isHovered,
  onHover,
  themeStyles,
}) => {
  const variantClass = `variant${prop.variant.charAt(0).toUpperCase() + prop.variant.slice(1)}`;

  return (
    <div 
      className={commonStyles.cardWrapper}
      onMouseEnter={() => onHover(prop.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={cn(
          commonStyles.valueCard,
          commonStyles[variantClass as keyof typeof commonStyles],
          themeStyles.valueCard,
          isHovered && commonStyles.valueCardHovered
        )}
      >
        {/* Gradient Border Effect */}
        <div className={commonStyles.cardGradientBorder} />

      {/* Icon Container */}
      <div className={cn(commonStyles.iconContainer, themeStyles.iconContainer)}>
        <div className={commonStyles.iconBackground}>{prop.icon}</div>
      </div>

      {/* Content Container */}
      <div className={commonStyles.cardContent}>
        {/* Title Section */}
        <div className={commonStyles.titleSection}>
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
            {prop.title}
          </h3>
          <p className={cn(commonStyles.cardSubtitle, themeStyles.cardSubtitle)}>
            {prop.subtitle}
          </p>
        </div>

        {/* Description */}
        <p
          className={cn(
            commonStyles.cardDescription,
            themeStyles.cardDescription
          )}
        >
          {prop.description}
        </p>

        {/* Benefits List - Visible on Hover */}
        <div
          className={cn(
            commonStyles.benefitsList,
            isHovered && commonStyles.benefitsListVisible
          )}
        >
          {prop.benefits.map((benefit, idx) => (
            <div key={idx} className={cn(commonStyles.benefitItem, commonStyles[variantClass as keyof typeof commonStyles])}>
              <Check size={16} className={commonStyles.checkIcon} />
              <span className={cn(commonStyles.benefitText, themeStyles.benefitText)}>
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button - Links to relevant sections */}
        <a
          href={prop.id === 'ai-precision' ? '/ai/chatbot' : 
                prop.id === 'bulletproof-security' ? '/security' :
                prop.id === 'borderless-opportunities' ? '/jobs' : 
                '/pricing'}
          className={cn(
            commonStyles.cardCta,
            commonStyles[`cta${prop.variant.charAt(0).toUpperCase() + prop.variant.slice(1)}` as keyof typeof commonStyles],
            themeStyles.cardCta
          )}
        >
          <span>Learn More</span>
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
    </div>
  );
};

const WhyMegiLance: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className={cn(commonStyles.section, themeStyles.section)}>
      {/* Animated Background Elements */}
      <div className={commonStyles.backgroundElements}>
        <div className={cn(commonStyles.bgBlob, commonStyles.bgBlob1)} />
        <div className={cn(commonStyles.bgBlob, commonStyles.bgBlob2)} />
        <div className={cn(commonStyles.bgBlob, commonStyles.bgBlob3)} />
      </div>
      <SectionGlobe variant="orange" size="sm" position="right" />

      <div className={commonStyles.container}>
        {/* Section Header */}
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <div className={cn(commonStyles.preheader, themeStyles.preheader)}>
            <span className={commonStyles.badge}>Core Advantages</span>
            <div className={commonStyles.badgeDot} />
            <span className={commonStyles.badgeText}>Why Choose Us</span>
          </div>

          <h2 className={cn(commonStyles.heading, themeStyles.heading)}>
            Why <span className={commonStyles.highlightText}>MegiLance?</span>
          </h2>

          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            We&apos;ve built a next-generation freelance ecosystem with tools and
            security you can trust. Powered by AI precision, cryptographic security,
            and borderless access—all designed for your success.
          </p>
        </div>

        {/* Value Propositions Grid */}
        <div className={commonStyles.grid}>
          {valuePropositions.map((prop) => (
            <ValueCard
              key={prop.id}
              prop={prop}
              isHovered={hoveredCard === prop.id}
              onHover={setHoveredCard}
              themeStyles={themeStyles}
            />
          ))}
        </div>

        {/* Trust Badges Section */}
        <div className={cn(commonStyles.trustSection, themeStyles.trustSection)}>
          <p className={cn(commonStyles.trustLabel, themeStyles.trustLabel)}>
            Built with trust at our core
          </p>
          <div className={commonStyles.trustBadges}>
            {[
              { label: 'Bank-Level Security', icon: '🔐' },
              { label: 'Web3 Native', icon: '⛓️' },
              { label: '24/7 Support', icon: '🤝' },
              { label: 'Zero Hidden Fees', icon: '💎' },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={cn(
                  commonStyles.trustBadge,
                  themeStyles.trustBadge
                )}
              >
                <span className={commonStyles.badgeEmoji}>{badge.icon}</span>
                <span className={commonStyles.badgeLabel}>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyMegiLance;
