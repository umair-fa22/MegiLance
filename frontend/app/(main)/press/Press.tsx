// @AI-HINT: Press page with accessible main landmark, labeled sections, and theme-aware styles.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { Download, Copy, Mail, Newspaper, Calendar, ExternalLink, Check } from 'lucide-react';
import common from './Press.common.module.css';
import light from './Press.light.module.css';
import dark from './Press.dark.module.css';

const pressReleases = [
  { 
    id: 'pr1', 
    title: 'MegiLance Launches AI-Powered Freelance Matching Platform', 
    date: 'March 1, 2026',
    description: 'A 7-factor AI algorithm connects businesses with top freelance talent worldwide.'
  },
  { 
    id: 'pr2', 
    title: 'Introducing Zero-Fee Blockchain Payments', 
    date: 'February 15, 2026',
    description: 'USDC escrow system eliminates traditional payment fees for freelancers.'
  },
  { 
    id: 'pr3', 
    title: 'MegiLance Platform Goes Live in Public Beta', 
    date: 'January 20, 2026',
    description: 'Open beta launch with AI matching, secure escrow, and global talent access.'
  },
];

const companyStats = [
  { label: 'Founded', value: '2024' },
  { label: 'Headquarters', value: 'Remote-First' },
  { label: 'Core Team', value: '3 Founders' },
  { label: 'Platform', value: 'AI + Blockchain' },
];

const Press: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [copied, setCopied] = React.useState(false);

  const copyBoilerplate = () => {
    const text = 'MegiLance is an AI-powered freelance marketplace that connects businesses with top talent through intelligent matching. Featuring secure USDC escrow payments with zero fees, real-time collaboration tools, and production-ready security, MegiLance is revolutionizing how the world works together.';
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      <main id="main-content" role="main" aria-labelledby="press-title" className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <span className={common.badge}>Press & Media</span>
              <h1 id="press-title" className={common.title}>MegiLance Press Room</h1>
              <p className={common.subtitle}>Resources for journalists and partners. Brand assets, news, and media contacts.</p>
            </header>
          </ScrollReveal>

          {/* Company Quick Stats */}
          <section aria-labelledby="stats-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="stats-heading" className={common.sectionTitle}>Company at a Glance</h2>
            </ScrollReveal>
            <StaggerContainer className={common.statsGrid}>
              {companyStats.map((stat, idx) => (
                <StaggerItem key={idx} className={common.statCard}>
                  <span className={common.statValue}>{stat.value}</span>
                  <span className={common.statLabel}>{stat.label}</span>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* Press Kit Section */}
          <section aria-labelledby="press-kit-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="press-kit-heading" className={common.sectionTitle}>Press Kit</h2>
            </ScrollReveal>
            <StaggerContainer className={common.grid}>
              <StaggerItem className={common.card}>
                <div className={common.cardIcon}>
                  <Download size={24} />
                </div>
                <h3 className={common.cardTitle}>Logos & Brand Assets</h3>
                <p>Download high-resolution logos, app icons, product screenshots, and brand guidelines.</p>
                <a className={cn(common.button, common.primary)} href="/assets/press/megilance-press-kit.zip" aria-label="Download MegiLance press kit">
                  <Download size={16} />
                  Download Press Kit
                </a>
              </StaggerItem>
              <StaggerItem className={common.card}>
                <div className={common.cardIcon}>
                  <Copy size={24} />
                </div>
                <h3 className={common.cardTitle}>Company Boilerplate</h3>
                <p>MegiLance is an AI-powered freelance marketplace that connects businesses with top talent through intelligent matching.</p>
                <button 
                  type="button" 
                  className={cn(common.button, common.secondary)} 
                  onClick={copyBoilerplate}
                  aria-label="Copy company boilerplate to clipboard"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Boilerplate'}
                </button>
              </StaggerItem>
            </StaggerContainer>
          </section>

          {/* Press Releases */}
          <section aria-labelledby="press-releases-heading" className={common.section}>
            <ScrollReveal>
              <h2 id="press-releases-heading" className={common.sectionTitle}>
                <Newspaper size={20} className="inline mr-2" />
                Recent Press Releases
              </h2>
            </ScrollReveal>
            <StaggerContainer className={common.releasesList}>
              {pressReleases.map((pr) => (
                <StaggerItem key={pr.id} className={common.releaseCard}>
                  <div className={common.releaseDate}>
                    <Calendar size={14} />
                    {pr.date}
                  </div>
                  <h3 className={common.releaseTitle}>{pr.title}</h3>
                  <p className={common.releaseDesc}>{pr.description}</p>
                  <a
                    className={common.releaseLink}
                    href="mailto:press@megilance.com"
                    aria-label={`Read full release: ${pr.title}`}
                  >
                    Read Full Release <ExternalLink size={14} />
                  </a>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* Media Contact */}
          <section aria-labelledby="media-contact-heading" className={common.section}>
            <ScrollReveal>
              <div className={common.contactCard}>
                <div className={common.contactIcon}>
                  <Mail size={32} />
                </div>
                <h2 id="media-contact-heading" className={common.sectionTitle}>Media Inquiries</h2>
                <p>For press inquiries, interviews, or partnership opportunities, reach our communications team:</p>
                <a className={cn(common.button, common.primary)} href="mailto:press@megilance.com">
                  <Mail size={16} />
                  press@megilance.com
                </a>
              </div>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Press;
