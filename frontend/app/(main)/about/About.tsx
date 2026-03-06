// @AI-HINT: Clean About page with mission, problem/solution, team details.
'use client';
import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { AboutIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.common.module.css';
import { 
  Globe, 
  Shield, 
  Zap, 
  Brain, 
  DollarSign,
  Lock,
} from 'lucide-react';
import common from './About.common.module.css';
import light from './About.light.module.css';
import dark from './About.dark.module.css';

const About: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const t = resolvedTheme === 'dark' ? dark : light;
  const styles = {
    root: cn(common.root, t.root),
    hero: cn(common.hero, t.hero),
    title: cn(common.title, t.title),
    subtitle: cn(common.subtitle, t.subtitle),
    grid: cn(common.grid, t.grid),
    card: cn(common.card, t.card),
    cardTitle: cn(common.cardTitle, t.cardTitle),
    cardBody: cn(common.cardBody, t.cardBody),
    sectionHeader: cn(common.sectionHeader, t.sectionHeader),
    sectionTitle: cn(common.sectionTitle, t.sectionTitle),
    sectionNote: cn(common.sectionNote, t.sectionNote),
    valuesGrid: cn(common.valuesGrid, t.valuesGrid),
    valueItem: cn(common.valueItem, t.valueItem),
    valueTitle: cn(common.valueTitle, t.valueTitle),
    valueDesc: cn(common.valueDesc, t.valueDesc),
    cta: cn(common.cta, t.cta),
    ctaBtn: cn(common.ctaBtn, t.ctaBtn),
  };

  return (
    <PageTransition>
      {/* Premium 3D Background */}
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

      <main id="main-content" role="main" aria-labelledby="about-title" className={styles.root}>
        <header className={styles.hero}>
          <ScrollReveal direction="down">
            <div className={common.heroRow}>
              <div className={common.heroContent}>
                <h1 id="about-title" className={styles.title}>About MegiLance</h1>
                <p className={styles.subtitle}>
                  A hybrid decentralized freelancing platform that integrates Artificial Intelligence 
                  for smart matching and Blockchain technology for secure, trustless transactions. Built to 
                  empower freelancers worldwide with fair pay and low-cost payments.
                </p>
              </div>
              <AboutIllustration className={illustrationStyles.heroIllustration} />
            </div>
          </ScrollReveal>
        </header>

        {/* The Problem We Solve */}
        <section aria-labelledby="problem-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="problem-title" className={styles.sectionTitle}>The Problem We Solve</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Why the freelance industry needs disruption</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.grid}>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="problem-fees-title">
              <DollarSign size={32} className={common.iconError} />
              <h3 id="problem-fees-title" className={styles.cardTitle}>High Platform Fees</h3>
              <p className={styles.cardBody}>
                Major platforms charge 10-20% commission, significantly reducing freelancer earnings
                and disproportionately impacting professionals in emerging markets.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="problem-payments-title">
              <Globe size={32} className={common.iconWarning} />
              <h3 id="problem-payments-title" className={styles.cardTitle}>Payment Barriers</h3>
              <p className={styles.cardBody}>
                Pakistani freelancers can&apos;t access PayPal and rely on slower alternatives with
                steep withdrawal costs, poor exchange rates, and days-long processing times.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="problem-trust-title">
              <Shield size={32} className={common.iconAccent} />
              <h3 id="problem-trust-title" className={styles.cardTitle}>Trust Deficit</h3>
              <p className={styles.cardBody}>
                Centralized platforms use opaque algorithms for ranking and disputes. Freelancers lack 
                control over their reputation and visibility.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Our Solution */}
        <section aria-labelledby="solution-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="solution-title" className={styles.sectionTitle}>Our Solution</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Hybrid Web2 + Web3 Architecture</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.grid}>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="solution-ai-title">
              <Brain size={32} className={common.iconPrimary} />
              <h3 id="solution-ai-title" className={styles.cardTitle}>AI-Powered Intelligence</h3>
              <p className={styles.cardBody}>
                Machine learning analyzes skills, project history, and reviews to generate 
                objective ranking scores. NLP-based sentiment analysis and data-driven price forecasting 
                help everyone work fairly.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="solution-blockchain-title">
              <Lock size={32} className={common.iconSuccess} />
              <h3 id="solution-blockchain-title" className={styles.cardTitle}>Blockchain Security</h3>
              <p className={styles.cardBody}>
                Smart Contract Escrow guarantees trustless payments. Funds lock when 
                contracts start and release only when work is approved. Immutable records 
                provide transparent proof of all activity.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="solution-speed-title">
              <Zap size={32} className={common.iconWarning} />
              <h3 id="solution-speed-title" className={styles.cardTitle}>Modern Tech Stack</h3>
              <p className={styles.cardBody}>
                Next.js 16 for fast, SEO-optimized pages. FastAPI for high-performance 
                async backend. Turso edge database for worldwide low-latency.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Mission & Values */}
        <section aria-labelledby="mission-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="mission-title" className={styles.sectionTitle}>Our Mission</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Empowering the global freelance workforce</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.valuesGrid}>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-equity-title">
              <h3 id="value-equity-title" className={styles.valueTitle}>Financial Equity</h3>
              <p className={styles.valueDesc}>
                Reduce transaction costs to less than 1% using blockchain, so freelancers keep more of what they earn.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-merit-title">
              <h3 id="value-merit-title" className={styles.valueTitle}>Merit-Based Discovery</h3>
              <p className={styles.valueDesc}>
                AI ranking promotes talent based on verifiable skills and performance, not who pays for visibility.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-transparency-title">
              <h3 id="value-transparency-title" className={styles.valueTitle}>Radical Transparency</h3>
              <p className={styles.valueDesc}>
                On-chain transactions and clear ranking algorithms mean no hidden fees or opaque decisions.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Team Section */}
        <section aria-labelledby="team-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="team-title" className={styles.sectionTitle}>Our Team</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Final Year Project | COMSATS University Islamabad</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.valuesGrid}>
            <StaggerItem className={styles.valueItem}>
              <h3 className={styles.valueTitle}>Ghulam Ahmed (Team Lead)</h3>
              <p className={styles.valueDesc}>
                Architecture design, AI integration, full-stack development, and project documentation.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem}>
              <h3 className={styles.valueTitle}>Muhammad Waqar Ul Mulk</h3>
              <p className={styles.valueDesc}>
                Backend development, database design, API implementation, and security hardening.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem}>
              <h3 className={styles.valueTitle}>Mujtaba</h3>
              <p className={styles.valueDesc}>
                Frontend development, UI/UX design, responsive layouts, and theme implementation.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        <section aria-labelledby="cta-title">
          <ScrollReveal>
            <h2 id="cta-title" className={styles.sectionTitle}>Join the Revolution</h2>
            <div className={styles.cta}>
              <Link href="/signup">
                <button className={styles.ctaBtn} aria-label="Get started with MegiLance">
                  Start Freelancing Today
                </button>
              </Link>
              <span className={styles.sectionNote}>Zero fees for freelancers. Blockchain-secured payments.</span>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </PageTransition>
  );
};

export default About;
