// @AI-HINT: Comprehensive How It Works page with detailed workflows from FYP report use cases.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { 
  FileText, 
  Handshake, 
  CheckCircle, 
  UserCircle, 
  Briefcase, 
  DollarSign,
  Shield,
  Brain,
  Lock,
  Star,
  MessageSquare,
  Gavel,
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StepCard from '@/app/components/Public/StepCard/StepCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere, FloatingTorus } from '@/app/components/3D';
import commonStyles from './HowItWorksPage.common.module.css';
import lightStyles from './HowItWorksPage.light.module.css';
import darkStyles from './HowItWorksPage.dark.module.css';

const clientSteps = [
  {
    stepNumber: 1,
    title: 'Post a Project',
    description: 'Describe your project requirements, set your budget range, and get AI-powered price recommendations based on market data and project complexity.',
    icon: <FileText size={40} />,
  },
  {
    stepNumber: 2,
    title: 'Review AI-Matched Proposals',
    description: 'Our AI matches your project with top freelancers based on skills, experience, and past performance. Review proposals with objective ranking scores.',
    icon: <Brain size={40} />,
  },
  {
    stepNumber: 3,
    title: 'Hire & Fund Escrow',
    description: 'Accept a proposal to create a smart contract. Fund the escrow with USDC or fiat - funds are locked securely until you approve the work.',
    icon: <Lock size={40} />,
  },
  {
    stepNumber: 4,
    title: 'Approve & Release Payment',
    description: 'Review submitted work. Once satisfied, approve the milestone and payment is instantly released from the blockchain escrow to the freelancer.',
    icon: <CheckCircle size={40} />,
  },
];

const freelancerSteps = [
  {
    stepNumber: 1,
    title: 'Create Your Profile',
    description: 'Build your professional profile showcasing skills, portfolio, and experience. Your AI Ranking Score grows as you complete projects successfully.',
    icon: <UserCircle size={40} />,
  },
  {
    stepNumber: 2,
    title: 'Get AI-Matched to Jobs',
    description: 'Our smart matching algorithm recommends projects that fit your skills. Browse job listings filtered by AI compatibility scores.',
    icon: <Briefcase size={40} />,
  },
  {
    stepNumber: 3,
    title: 'Submit Winning Proposals',
    description: 'Send professional proposals with AI-assisted pricing guidance. Stand out with your verified credentials and transparent ranking.',
    icon: <MessageSquare size={40} />,
  },
  {
    stepNumber: 4,
    title: 'Get Paid in Crypto',
    description: 'Complete the work, get milestone approval, and receive payment instantly in USDC or other cryptocurrencies. Low fees, fast settlement.',
    icon: <DollarSign size={40} />,
  },
];

const securityFeatures = [
  {
    icon: <Shield size={32} />,
    title: 'Smart Contract Escrow',
    description: 'Funds are locked in an immutable blockchain contract until work is approved. No middleman, no delays.',
  },
  {
    icon: <Brain size={32} />,
    title: 'AI Sentiment Analysis',
    description: 'Reviews are analyzed for sentiment to flag malicious or biased feedback, protecting your reputation.',
  },
  {
    icon: <Star size={32} />,
    title: 'Objective AI Ranking',
    description: 'Your score is based on verifiable metrics: completion rate, skills, communication, and verified reviews.',
  },
  {
    icon: <Gavel size={32} />,
    title: 'On-Chain Dispute Resolution',
    description: 'Disputes are logged on the blockchain with transparent resolution processes and admin mediation.',
  },
];

const whyDifferent = [
  {
    icon: <DollarSign size={28} />,
    title: 'Save 90% on Fees',
    stat: '<1%',
    description: 'vs 10-20% on traditional platforms',
  },
  {
    icon: <Zap size={28} />,
    title: 'Instant Payments',
    stat: '<30s',
    description: 'vs 3-7 days bank transfers',
  },
  {
    icon: <Globe size={28} />,
    title: 'Global Access',
    stat: '150+',
    description: 'currencies including USDC',
  },
  {
    icon: <Shield size={28} />,
    title: 'Trustless Security',
    stat: '100%',
    description: 'blockchain-verified transactions',
  },
];

const HowItWorksPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="blue" size={500} blur={100} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="purple" size={400} blur={80} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={20} className="absolute inset-0" />
         <div className="absolute top-40 left-20 opacity-10 animate-float-slow">
           <FloatingTorus size={60} />
         </div>
         <div className="absolute bottom-60 right-40 opacity-10 animate-float-medium">
           <FloatingSphere size={50} variant="gradient" />
         </div>
      </div>

      <main id="main-content" role="main" className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <h1 className={cn(commonStyles.title, themeStyles.title)}>How MegiLance Works</h1>
            <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
              A hybrid decentralized platform combining Web2 speed with Web3 security. 
              AI-powered matching, blockchain escrow, and transparent reputation.
            </p>
          </header>
        </ScrollReveal>

        {/* Why We're Different Section */}
        <section className={commonStyles.section} aria-labelledby="why-different">
          <ScrollReveal>
            <h2 id="why-different" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              Why MegiLance is Different
            </h2>
            <p className={cn(commonStyles.sectionSubtitle, themeStyles.subtitle)}>
              Built to solve the real problems freelancers face: high fees, slow payments, and opaque rankings.
            </p>
          </ScrollReveal>
          <StaggerContainer className={commonStyles.statsGrid}>
            {whyDifferent.map((item, index) => (
              <StaggerItem key={index} className={cn(commonStyles.statCard, themeStyles.statCard)}>
                <div className={commonStyles.statIcon}>{item.icon}</div>
                <div className={commonStyles.statValue}>{item.stat}</div>
                <div className={commonStyles.statTitle}>{item.title}</div>
                <div className={commonStyles.statDesc}>{item.description}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className={commonStyles.main} aria-label="Process overview">
          {/* For Clients */}
          <section className={commonStyles.section} aria-labelledby="howitworks-clients">
            <ScrollReveal>
              <h2 id="howitworks-clients" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                For Clients
              </h2>
              <p className={cn(commonStyles.sectionSubtitle, themeStyles.subtitle)}>
                Post a project, get AI-matched proposals, and pay securely via blockchain escrow.
              </p>
            </ScrollReveal>
            <StaggerContainer className={commonStyles.grid}>
              {clientSteps.map(step => (
                <StaggerItem key={step.stepNumber}>
                  <StepCard {...step} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* For Freelancers */}
          <section className={commonStyles.section} aria-labelledby="howitworks-freelancers">
            <ScrollReveal>
              <h2 id="howitworks-freelancers" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                For Freelancers
              </h2>
              <p className={cn(commonStyles.sectionSubtitle, themeStyles.subtitle)}>
                Build your reputation with AI ranking, win projects, and get paid instantly in crypto.
              </p>
            </ScrollReveal>
            <StaggerContainer className={commonStyles.grid}>
              {freelancerSteps.map(step => (
                <StaggerItem key={step.stepNumber}>
                  <StepCard {...step} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </section>

        {/* Security & Trust */}
        <section className={commonStyles.section} aria-labelledby="security-trust">
          <ScrollReveal>
            <h2 id="security-trust" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              Trust & Security Built-In
            </h2>
            <p className={cn(commonStyles.sectionSubtitle, themeStyles.subtitle)}>
              Our hybrid Web2/Web3 architecture ensures speed without sacrificing security.
            </p>
          </ScrollReveal>
          <StaggerContainer className={commonStyles.featuresGrid}>
            {securityFeatures.map((feature, index) => (
              <StaggerItem key={index} className={cn(commonStyles.featureCard, themeStyles.featureCard)}>
                <div className={commonStyles.featureIcon}>{feature.icon}</div>
                <h3 className={commonStyles.featureTitle}>{feature.title}</h3>
                <p className={commonStyles.featureDesc}>{feature.description}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Technical Architecture Overview */}
        <section className={commonStyles.section} aria-labelledby="architecture">
          <ScrollReveal>
            <h2 id="architecture" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              The Technology Behind It
            </h2>
          </ScrollReveal>
          <div className={cn(commonStyles.architectureCard, themeStyles.architectureCard)}>
            <div className={commonStyles.archLayer}>
              <h3>🖥️ Frontend Layer</h3>
              <p><strong>Next.js 16 + TypeScript</strong></p>
              <p>Fast, SEO-optimized pages with responsive design. SSR + SSG for instant loading.</p>
            </div>
            <div className={commonStyles.archArrow}>↓</div>
            <div className={commonStyles.archLayer}>
              <h3>⚡ Backend Layer</h3>
              <p><strong>FastAPI + Python</strong></p>
              <p>High-performance async API. Pydantic validation. JWT authentication.</p>
            </div>
            <div className={commonStyles.archArrow}>↓</div>
            <div className={commonStyles.archLayerSplit}>
              <div className={commonStyles.archLayer}>
                <h3>🤖 AI Service</h3>
                <p><strong>Python ML</strong></p>
                <p>Matching, ranking, sentiment analysis, price prediction.</p>
              </div>
              <div className={commonStyles.archLayer}>
                <h3>🔗 Blockchain</h3>
                <p><strong>Solidity + Ethereum</strong></p>
                <p>Smart contract escrow, USDC payments, on-chain records.</p>
              </div>
            </div>
            <div className={commonStyles.archArrow}>↓</div>
            <div className={commonStyles.archLayer}>
              <h3>💾 Database</h3>
              <p><strong>Turso (libSQL)</strong></p>
              <p>Edge-distributed database for low-latency worldwide. SQLite-compatible.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={commonStyles.section} aria-labelledby="cta">
          <ScrollReveal>
            <div className={cn(commonStyles.ctaSection, themeStyles.ctaSection)}>
              <h2 id="cta" className={commonStyles.ctaTitle}>Ready to Get Started?</h2>
              <p className={commonStyles.ctaSubtitle}>
                Join thousands of freelancers and clients already using MegiLance.
              </p>
              <div className={commonStyles.ctaButtons}>
                <Link href="/signup" className={cn(commonStyles.ctaButton, commonStyles.ctaPrimary)}>
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <Link href="/jobs" className={cn(commonStyles.ctaButton, commonStyles.ctaSecondary)}>
                  Browse Projects
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </PageTransition>
  );
};

export default HowItWorksPage;
