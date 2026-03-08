// @AI-HINT: Community page for MegiLance - unified connection hub.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { 
  MessageSquare, Users, ExternalLink,
  Github, Linkedin, Twitter, ArrowRight
} from 'lucide-react';
import common from './Community.common.module.css';
import light from './Community.light.module.css';
import dark from './Community.dark.module.css';

const channels = [
  {
    icon: <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
    title: 'Discord',
    description: 'Real-time discussions, networking, and skill-based groups.',
    url: 'https://discord.gg/megilance',
    cta: 'Join Discord',
    variant: 'discord' as const,
  },
  {
    icon: <MessageSquare size={28} />,
    title: 'GitHub Discussions',
    description: 'Share tips, ask questions, and connect with other professionals.',
    url: 'https://github.com/megilance/community/discussions',
    cta: 'Join Forums',
    variant: 'github' as const,
  },
  {
    icon: <Linkedin size={28} />,
    title: 'LinkedIn',
    description: 'Professional updates, job tips, and industry insights.',
    url: 'https://linkedin.com/company/megilance',
    cta: 'Follow Us',
    variant: 'linkedin' as const,
  },
  {
    icon: <Twitter size={28} />,
    title: 'Twitter / X',
    description: 'Latest news, feature announcements, and community highlights.',
    url: 'https://twitter.com/megilance',
    cta: 'Follow Us',
    variant: 'twitter' as const,
  },
  {
    icon: <Github size={28} />,
    title: 'GitHub',
    description: 'Explore our open-source projects and contribute to the codebase.',
    url: 'https://github.com/megilance',
    cta: 'View GitHub',
    variant: 'github' as const,
  },
];

const Community: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

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

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>Community</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Connect, collaborate, and grow with freelancers and clients worldwide.
              </p>
            </div>
          </ScrollReveal>

          <section className={common.section}>
            <ScrollReveal>
              <h2 className={common.sectionTitle}>Ways to Connect</h2>
            </ScrollReveal>
            <StaggerContainer className={common.communityGrid}>
              {channels.map((ch) => (
                <StaggerItem key={ch.title} className={cn(common.communityCard, themed.communityCard)}>
                  <div className={cn(common.cardIcon, themed.cardIcon)}>
                    {ch.icon}
                  </div>
                  <h3 className={cn(common.communityTitle, themed.communityTitle)}>{ch.title}</h3>
                  <p className={cn(common.communityDescription, themed.communityDescription)}>
                    {ch.description}
                  </p>
                  <a 
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(common.communityButton, themed.communityButton)}
                  >
                    {ch.cta} <ExternalLink size={14} />
                  </a>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* CTA */}
          <section className={common.section}>
            <ScrollReveal>
              <div className={cn(common.ctaCard, themed.ctaCard)}>
                <Users size={32} />
                <h2 className={cn(common.ctaTitle, themed.ctaTitle)}>Ready to join?</h2>
                <p className={cn(common.ctaDesc, themed.ctaDesc)}>
                  Start connecting with the global MegiLance community today.
                </p>
                <a 
                  href="https://discord.gg/megilance" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(common.communityButton, themed.communityButton)}
                >
                  Get Started <ArrowRight size={14} />
                </a>
              </div>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Community; 