// @AI-HINT: Premium FAQ page with accessible accordion, theme-aware styles, and JSON-LD schema.
'use client';
import React from 'react';
import Script from 'next/script';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Accordion, { AccordionItem } from '@/app/components/Accordion/Accordion';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { FAQIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.common.module.css';
import common from './FAQ.common.module.css';
import light from './FAQ.light.module.css';
import dark from './FAQ.dark.module.css';

const faqData = [
  {
    value: 'item-1',
    question: 'What is MegiLance?',
    answer: 'MegiLance is a next-generation freelance platform that leverages AI for intelligent matching and blockchain for secure, transparent payments. We focus on providing an production-ready user experience for both clients and freelancers. Our platform combines cutting-edge technology with user-friendly design to create the most efficient marketplace for global talent.',
  },
  {
    value: 'item-2',
    question: 'How do the fees work?',
    answer: 'We believe in transparency. MegiLance operates on a simple, tiered fee structure: Basic plan charges 5% per transaction, Standard plan charges 3%, and Premium plan charges just 1%. These are significantly lower than industry standards of 20%+. There are no hidden charges, subscription requirements, or withdrawal penalties. Visit our Pricing page for a detailed breakdown of our competitive rates.',
  },
  {
    value: 'item-3',
    question: 'Is my data and payment information secure?',
    answer: 'Absolutely. Security is our top priority. We employ enterprise-grade security measures including: end-to-end encryption for all data transmissions, smart contracts for payments on the blockchain ensuring trustless transactions, JWT authentication with secure token rotation, bcrypt password hashing, and regular security audits. Our platform is built to the highest security standards and complies with industry best practices.',
  },
  {
    value: 'item-4',
    question: 'What kind of freelancers can I find?',
    answer: 'MegiLance hosts a curated network of elite talent across various fields, including: Software Development (Web, Mobile, Desktop), UI/UX Design and Graphics, AI/ML Engineering, Data Science and Analytics, Digital Marketing and SEO, Content Writing and Copywriting, Video Editing and Animation, Virtual Assistance, and many more. Our AI matching ensures you connect with the perfect expert for your project.',
  },
  {
    value: 'item-5',
    question: 'How does the AI matching work?',
    answer: 'Our proprietary 7-factor AI algorithm analyzes multiple dimensions to find perfect matches: Skill Alignment (30%), Experience Level (15%), Budget Compatibility (15%), Response Rate (10%), Success Rate (10%), Location Preference (10%), and Availability (10%). The system uses machine learning to continuously improve matching accuracy based on successful project completions.',
  },
  {
    value: 'item-6',
    question: 'What payment methods are supported?',
    answer: 'MegiLance supports multiple payment options: Credit/Debit Cards via Stripe integration, Bank Transfers, USDC cryptocurrency payments on Optimism network for near-zero fee transactions, and PayPal (where available). All payments are protected by our smart contract escrow system, ensuring funds are only released when work is approved.',
  },
  {
    value: 'item-7',
    question: 'How does the escrow system work?',
    answer: 'Our escrow system protects both clients and freelancers: 1) Client funds a milestone, money is held in secure escrow. 2) Freelancer completes the work and submits for review. 3) Client reviews and approves the deliverable. 4) Funds are automatically released to the freelancer. If there is a dispute, our mediation team helps resolve it fairly. Smart contracts ensure complete transparency.',
  },
  {
    value: 'item-8',
    question: 'Can I use MegiLance from Pakistan?',
    answer: 'Yes! MegiLance was specifically designed with Pakistani freelancers in mind. We understand the challenges with PayPal restrictions and high withdrawal fees on other platforms. Our USDC payment system bypasses traditional banking limitations, allowing freelancers to receive payments with minimal fees and instant settlements. This is a core mission of our FYP project at COMSATS University.',
  },
  {
    value: 'item-9',
    question: 'How do I become a verified freelancer?',
    answer: 'To become verified: 1) Complete your profile with accurate information. 2) Add your skills and portfolio items. 3) Complete our optional skill assessments. 4) Submit ID verification (government ID). 5) Maintain good ratings and response times. Verified freelancers get a badge, appear higher in search results, and have access to premium projects.',
  },
  {
    value: 'item-10',
    question: 'What if I have a dispute with a client/freelancer?',
    answer: 'Our dispute resolution process is fair and efficient: 1) First, try to resolve directly through our messaging system. 2) If unresolved, file a formal dispute through your dashboard. 3) Our mediation team reviews evidence from both parties. 4) A fair resolution is proposed within 5-7 business days. 5) Escrow funds are distributed according to the decision. We aim for win-win resolutions whenever possible.',
  },
];

const FAQ: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? dark : light;
    return {
      root: cn(common.root, themeStyles.root),
      header: cn(common.header, themeStyles.header),
      title: cn(common.title, themeStyles.title),
      subtitle: cn(common.subtitle, themeStyles.subtitle),
      badge: cn(common.badge, themeStyles.badge),
      accordionContainer: cn(common.accordionContainer),
    };
  }, [resolvedTheme]);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
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

      <main id="main-content" role="main" aria-labelledby="faq-title" className={styles.root}>
        <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        
        <ScrollReveal>
          <header className={styles.header}>
            <div className={common.heroRow}>
              <div className={common.heroContent}>
                <span className={styles.badge}>Answers you need</span>
                <h1 id="faq-title" className={styles.title}>Frequently Asked Questions</h1>
                <p className={styles.subtitle}>Quick, clear answers about our platform, security, and how to get started.</p>
              </div>
              <FAQIllustration className={illustrationStyles.heroIllustration} />
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={styles.accordionContainer}>
            <Accordion type="single" defaultValue="item-1">
              {faqData.map((item) => (
                <AccordionItem key={item.value} value={item.value} title={item.question}>
                  <p>{item.answer}</p>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default FAQ;
