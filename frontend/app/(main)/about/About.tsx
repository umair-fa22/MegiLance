// @AI-HINT: Premium About page with FYP project information, mission, problem statement, and team details.
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
  Users, 
  TrendingUp,
  DollarSign,
  Lock,
  Star
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
    timeline: cn(common.timeline, t.timeline),
    milestone: cn(common.milestone, t.milestone),
    milestoneTitle: cn(common.milestoneTitle, t.milestoneTitle),
    cta: cn(common.cta, t.cta),
    ctaBtn: cn(common.ctaBtn, t.ctaBtn),
  };

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={15} className="absolute inset-0" />
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
                  A hybrid decentralized freelancing platform that strategically integrates Artificial Intelligence 
                  for enhanced intelligence and Blockchain technology for secure, trustless transactions. Built to 
                  empower freelancers worldwide with fair pay, transparent reputation, and low-cost payments.
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
                Major platforms charge 10-20% commission, significantly reducing freelancer earnings. 
                This financial friction disproportionately impacts professionals in emerging markets.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="problem-payments-title">
              <Globe size={32} className={common.iconWarning} />
              <h3 id="problem-payments-title" className={styles.cardTitle}>Payment Barriers</h3>
              <p className={styles.cardBody}>
                Pakistani freelancers can&apos;t access PayPal and rely on slower alternatives like Payoneer 
                with steep withdrawal costs, poor exchange rates, and days-long processing times.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="problem-trust-title">
              <Shield size={32} className={common.iconAccent} />
              <h3 id="problem-trust-title" className={styles.cardTitle}>Trust Deficit</h3>
              <p className={styles.cardBody}>
                Centralized platforms use opaque algorithms for ranking and disputes. Freelancers lack 
                control over their reputation, and good workers stay hidden by unfair system glitches.
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
                Machine learning analyzes skills, project history, and verified reviews to generate 
                objective AI Ranking Scores. NLP-based sentiment analysis protects reputation from 
                unfair feedback. Data-driven price forecasting helps everyone price fairly.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="solution-blockchain-title">
              <Lock size={32} className={common.iconSuccess} />
              <h3 id="solution-blockchain-title" className={styles.cardTitle}>Blockchain Security</h3>
              <p className={styles.cardBody}>
                Smart Contract Escrow guarantees trustless payments. Funds lock automatically when 
                contracts start and release only when work is approved. Immutable transaction records 
                provide transparent proof of all financial activity.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0} aria-labelledby="solution-speed-title">
              <Zap size={32} className={common.iconWarning} />
              <h3 id="solution-speed-title" className={styles.cardTitle}>Modern Tech Stack</h3>
              <p className={styles.cardBody}>
                Next.js 16 delivers fast, SEO-optimized pages. FastAPI provides high-performance 
                async backend. Turso edge database ensures low-latency worldwide. Docker enables 
                consistent deployment across environments.
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
                AI ranking promotes talent based on verifiable skills and performance, not just who pays for visibility.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.valueItem} aria-labelledby="value-transparency-title">
              <h3 id="value-transparency-title" className={styles.valueTitle}>Radical Transparency</h3>
              <p className={styles.valueDesc}>
                On-chain transactions and clear ranking algorithms mean no hidden fees or opaque decision-making.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Global Impact */}
        <section aria-labelledby="impact-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="impact-title" className={styles.sectionTitle}>Global Impact</h2>
              <span aria-hidden="true" className={styles.sectionNote}>The gig economy opportunity</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.grid}>
            <StaggerItem className={styles.card} tabIndex={0}>
              <TrendingUp size={32} className={common.iconSuccess} />
              <h3 className={styles.cardTitle}>$455B+ Market</h3>
              <p className={styles.cardBody}>
                The global gig economy is forecast to surpass $455 billion, fueled by growing 
                demand for flexible, specialized labor across all industries.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0}>
              <Users size={32} className={common.iconPrimary} />
              <h3 className={styles.cardTitle}>Pakistan&apos;s Potential</h3>
              <p className={styles.cardBody}>
                Pakistan&apos;s freelance exports contribute hundreds of millions annually. The nation&apos;s 
                young, educated populace is perfectly positioned to capitalize on this global trend.
              </p>
            </StaggerItem>
            <StaggerItem className={styles.card} tabIndex={0}>
              <Star size={32} className={common.iconWarning} />
              <h3 className={styles.cardTitle}>Our Vision</h3>
              <p className={styles.cardBody}>
                Create a secure, low-cost payment infrastructure via crypto-based escrow, bypassing 
                traditional intermediaries and their high fees and delays.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Development Timeline */}
        <section aria-labelledby="timeline-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="timeline-title" className={styles.sectionTitle}>Development Roadmap</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Built with Agile methodology</span>
            </div>
          </ScrollReveal>
          <StaggerContainer className={styles.timeline}>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-phase1-title">
              <h3 id="ms-phase1-title" className={styles.milestoneTitle}>Phase 1: Core Marketplace</h3>
              <p>Users, projects, proposals, contracts, authentication with JWT + bcrypt security.</p>
            </StaggerItem>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-phase2-title">
              <h3 id="ms-phase2-title" className={styles.milestoneTitle}>Phase 2: AI Integration</h3>
              <p>Smart matching, sentiment analysis, price prediction, fraud detection services.</p>
            </StaggerItem>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-phase3-title">
              <h3 id="ms-phase3-title" className={styles.milestoneTitle}>Phase 3: Blockchain Layer</h3>
              <p>Smart contract escrow, USDC payments, on-chain reputation, dispute resolution.</p>
            </StaggerItem>
            <StaggerItem className={styles.milestone} aria-labelledby="ms-phase4-title">
              <h3 id="ms-phase4-title" className={styles.milestoneTitle}>Phase 4: Scale & Polish</h3>
              <p>Performance optimization, enterprise features, global marketplace readiness.</p>
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

        {/* Acknowledgements */}
        <section aria-labelledby="thanks-title">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <h2 id="thanks-title" className={styles.sectionTitle}>Acknowledgements</h2>
              <span aria-hidden="true" className={styles.sectionNote}>Thank you to everyone who made this possible</span>
            </div>
          </ScrollReveal>
          <div className={cn(styles.card, common.acknowledgements)}>
            <p className={cn(styles.cardBody, common.acknowledgementText)}>
              Special thanks to our supervisor <strong>Dr. Junaid</strong> for solid advice, honest feedback, 
              and pushing us when things got tough. The <strong>Department of Computer Science at COMSATS 
              University Islamabad, Lahore Campus</strong> provided the tools and environment for meaningful 
              learning. And massive gratitude to our families and friends for constant support throughout 
              this 15-month journey.
            </p>
          </div>
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
