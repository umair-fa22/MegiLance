// @AI-HINT: Enterprise page - Premium production-ready marketing page with stats, features, case studies, testimonials, and CTAs
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import {
  Shield,
  Users,
  BarChart3,
  Globe,
  Lock,
  Zap,
  Building2,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  HeadphonesIcon,
  Settings,
  TrendingUp
} from 'lucide-react';
import common from './Enterprise.common.module.css';
import light from './Enterprise.light.module.css';
import dark from './Enterprise.dark.module.css';

// Enterprise stats
const stats = [
  { label: 'Enterprise Features', value: '20+', icon: Building2, description: 'Built-in capabilities' },
  { label: 'Talent Pool', value: 'Global', icon: Users, description: 'Vetted professionals' },
  { label: 'Countries', value: '80+', icon: Globe, description: 'Worldwide coverage' },
  { label: 'Uptime SLA', value: '99.9%', icon: TrendingUp, description: 'Platform reliability' },
];

// Core features
const coreFeatures = [
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'SOC 2 Type II certified, end-to-end encryption, and advanced threat protection. Your data is protected by bank-level security standards.',
    highlight: 'SOC 2 Certified'
  },
  {
    icon: Users,
    title: 'Dedicated Account Team',
    description: 'Personal success manager, priority technical support, and quarterly business reviews to ensure your success.',
    highlight: '24/7 Support'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time dashboards, custom reports, and AI-powered insights to optimize your workforce utilization and spending.',
    highlight: 'Real-time Data'
  },
  {
    icon: Settings,
    title: 'Custom Integrations',
    description: 'Seamless integration with your existing tools - SAP, Workday, Oracle, Salesforce, and custom REST/GraphQL APIs.',
    highlight: '50+ Integrations'
  },
  {
    icon: Lock,
    title: 'Compliance & Governance',
    description: 'GDPR, CCPA, and industry-specific compliance. Custom approval workflows and audit trails for complete visibility.',
    highlight: 'Full Compliance'
  },
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    description: 'Our proprietary AI analyzes skills, experience, and work style to find the perfect talent match in minutes, not weeks.',
    highlight: '95% Match Rate'
  },
];

// Enterprise plans
const plans = [
  {
    name: 'Business',
    description: 'For growing teams',
    features: [
      'Up to 50 active contractors',
      'Advanced analytics dashboard',
      'Priority email support',
      'Custom approval workflows',
      'SSO integration',
      'Quarterly business reviews'
    ],
    cta: 'Contact Sales',
    highlighted: false
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    features: [
      'Unlimited contractors',
      'Custom analytics & reporting',
      '24/7 dedicated support',
      'Custom integrations (API)',
      'SLA guarantees (99.9% uptime)',
      'Dedicated success manager',
      'Custom contract terms',
      'On-premise deployment option'
    ],
    cta: 'Request Demo',
    highlighted: true
  },
  {
    name: 'Enterprise+',
    description: 'For Fortune 500',
    features: [
      'Everything in Enterprise, plus:',
      'White-label platform option',
      'Custom AI model training',
      'Executive sponsorship',
      'Compliance audit support',
      'Multi-region data residency',
      'Custom security reviews'
    ],
    cta: 'Contact Executive Team',
    highlighted: false
  },
];

// Trust badges / logos
const trustLogos = [
  { name: 'Enterprise-Ready', description: 'Architecture' },
  { name: 'ISO 27001', description: 'Standards' },
  { name: 'SOC 2', description: 'Designed' },
  { name: 'GDPR', description: 'Aligned' },
];

const Enterprise: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const themed = resolvedTheme === 'dark' ? dark : light;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <PageTransition>
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={600} blur={120} opacity={0.12} className="absolute top-[-15%] right-[-15%]" />
        <AnimatedOrb variant="blue" size={500} blur={100} opacity={0.10} className="absolute bottom-[-10%] left-[-10%]" />
        <AnimatedOrb variant="orange" size={300} blur={80} opacity={0.06} className="absolute top-[50%] left-[30%]" />
        <ParticlesSystem count={20} className="absolute inset-0" />
        <div className="absolute top-32 left-16 opacity-10 animate-float-slow">
          <FloatingCube size={50} />
        </div>
        <div className="absolute bottom-52 right-24 opacity-10 animate-float-medium">
          <FloatingSphere size={35} variant="gradient" />
        </div>
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        {/* Hero Section */}
        <section className={common.heroSection}>
          <div className={common.container}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={common.heroContent}
            >
              <span className={cn(common.badge, themed.badge)}>
                <Building2 size={16} />
                Enterprise Solutions
              </span>
              <h1 className={common.heroTitle}>
                Scale Your Workforce with
                <span className={common.heroGradient}> Enterprise-Grade </span>
                Talent Solutions
              </h1>
              <p className={cn(common.heroSubtitle, themed.heroSubtitle)}>
                Leading organizations can use MegiLance to access the world&apos;s best freelance talent. 
                Security-first, AI-powered, and built for the enterprise.
              </p>
              <div className={common.heroCtas}>
                <Link href="/contact" className={cn(common.primaryBtn, themed.primaryBtn)}>
                  Schedule a Demo
                  <ArrowRight size={18} />
                </Link>
                <Link href="/contact?type=sales" className={cn(common.secondaryBtn, themed.secondaryBtn)}>
                  Talk to Sales
                  <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={common.trustBadges}
            >
              {trustLogos.map((logo) => (
                <div key={logo.name} className={cn(common.trustBadge, themed.trustBadge)}>
                  <span className={common.trustBadgeName}>{logo.name}</span>
                  <span className={cn(common.trustBadgeDesc, themed.trustBadgeDesc)}>{logo.description}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={common.statsSection}>
          <div className={common.container}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={common.statsGrid}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className={cn(common.statCard, themed.statCard)}
                >
                  <div className={cn(common.statIcon, themed.statIcon)}>
                    <stat.icon size={28} />
                  </div>
                  <div className={common.statValue}>{stat.value}</div>
                  <div className={common.statLabel}>{stat.label}</div>
                  <div className={cn(common.statDesc, themed.statDesc)}>{stat.description}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Core Features */}
        <section className={common.section}>
          <div className={common.container}>
            <ScrollReveal>
              <div className={common.sectionHeader}>
                <h2 className={common.sectionTitle}>Enterprise-Ready Features</h2>
                <p className={cn(common.sectionSubtitle, themed.sectionSubtitle)}>
                  Built for organizations with the most demanding security, compliance, and scalability requirements.
                </p>
              </div>
            </ScrollReveal>

            <StaggerContainer className={common.featuresGrid}>
              {coreFeatures.map((feature) => (
                <StaggerItem key={feature.title} className={cn(common.featureCard, themed.featureCard)}>
                  <div className={cn(common.featureIcon, themed.featureIcon)}>
                    <feature.icon size={24} />
                  </div>
                  <span className={cn(common.featureHighlight, themed.featureHighlight)}>
                    {feature.highlight}
                  </span>
                  <h3 className={common.featureTitle}>{feature.title}</h3>
                  <p className={cn(common.featureDescription, themed.featureDescription)}>
                    {feature.description}
                  </p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className={cn(common.section, common.plansSection)}>
          <div className={common.container}>
            <ScrollReveal>
              <div className={common.sectionHeader}>
                <h2 className={common.sectionTitle}>Enterprise Plans</h2>
                <p className={cn(common.sectionSubtitle, themed.sectionSubtitle)}>
                  Flexible plans designed to scale with your organization.
                </p>
              </div>
            </ScrollReveal>

            <StaggerContainer className={common.plansGrid}>
              {plans.map((plan) => (
                <StaggerItem 
                  key={plan.name} 
                  className={cn(
                    common.planCard, 
                    themed.planCard,
                    plan.highlighted && common.planHighlighted,
                    plan.highlighted && themed.planHighlighted
                  )}
                >
                  {plan.highlighted && (
                    <span className={cn(common.planBadge, themed.planBadge)}>Most Popular</span>
                  )}
                  <h3 className={common.planName}>{plan.name}</h3>
                  <p className={cn(common.planDescription, themed.planDescription)}>{plan.description}</p>
                  <div className={common.planPrice}>Custom Pricing</div>
                  <ul className={common.planFeatures}>
                    {plan.features.map((feature) => (
                      <li key={feature} className={cn(common.planFeatureItem, themed.planFeatureItem)}>
                        <CheckCircle2 size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/contact?plan=enterprise" 
                    className={cn(
                      common.planCta, 
                      themed.planCta,
                      plan.highlighted && common.planCtaPrimary,
                      plan.highlighted && themed.planCtaPrimary
                    )}
                  >
                    {plan.cta}
                    <ArrowRight size={16} />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Final CTA */}
        <section className={cn(common.section, common.ctaSection)}>
          <div className={common.container}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={cn(common.ctaBox, themed.ctaBox)}
            >
              <h2 className={common.ctaTitle}>Ready to Transform Your Workforce?</h2>
              <p className={cn(common.ctaDescription, themed.ctaDescription)}>
                Enterprises can use MegiLance to build world-class teams. 
                Schedule a personalized demo with our enterprise team today.
              </p>
              <div className={common.ctaButtons}>
                <Link href="/contact" className={cn(common.primaryBtn, themed.primaryBtn)}>
                  Schedule Enterprise Demo
                  <ArrowRight size={18} />
                </Link>
                <a href="mailto:enterprise@megilance.site" className={cn(common.secondaryBtn, themed.secondaryBtn)}>
                  <HeadphonesIcon size={18} />
                  enterprise@megilance.site
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
};

export default Enterprise; 