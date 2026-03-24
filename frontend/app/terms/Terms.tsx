// @AI-HINT: Comprehensive Terms of Service page. Uses shared LegalPage CSS modules for theming.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube } from '@/app/components/3D';
import commonStyles from '@/app/styles/LegalPage.common.module.css';
import lightStyles from '@/app/styles/LegalPage.light.module.css';
import darkStyles from '@/app/styles/LegalPage.dark.module.css';

const Terms: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
        <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
          <FloatingCube size={40} />
        </div>
      </div>

      <main id="main-content" role="main" className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <header className={commonStyles.header}>
            <h1 className={commonStyles.title}>Terms of Service</h1>
            <p className={commonStyles.subtitle}>Last Updated: March 1, 2026</p>
          </header>

          {/* Table of Contents */}
          <nav className={cn(commonStyles.toc, themeStyles.toc)} aria-label="Table of Contents">
            <p className={commonStyles.tocTitle}>Table of Contents</p>
            <ol className={commonStyles.tocList}>
              <li><a href="#terms-1">1. Acceptance of Terms</a></li>
              <li><a href="#terms-2">2. Eligibility</a></li>
              <li><a href="#terms-3">3. Account Registration</a></li>
              <li><a href="#terms-4">4. Platform Services</a></li>
              <li><a href="#terms-5">5. User Obligations</a></li>
              <li><a href="#terms-6">6. Payments, Fees &amp; Escrow</a></li>
              <li><a href="#terms-7">7. Intellectual Property</a></li>
              <li><a href="#terms-8">8. Dispute Resolution</a></li>
              <li><a href="#terms-9">9. Prohibited Conduct</a></li>
              <li><a href="#terms-10">10. Limitation of Liability</a></li>
              <li><a href="#terms-11">11. Indemnification</a></li>
              <li><a href="#terms-12">12. Termination</a></li>
              <li><a href="#terms-13">13. Changes to Terms</a></li>
              <li><a href="#terms-14">14. Governing Law</a></li>
              <li><a href="#terms-15">15. Contact Information</a></li>
            </ol>
          </nav>

          {/* 1. Acceptance */}
          <section className={commonStyles.section} aria-labelledby="terms-1">
            <h2 id="terms-1" className={commonStyles.sectionTitle}>1. Acceptance of Terms</h2>
            <p className={commonStyles.sectionContent}>
              By accessing, browsing, or using the MegiLance platform (&quot;Platform&quot;), including any associated websites, mobile applications, APIs, or services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree with any part of these Terms, you must not use the Platform.
            </p>
            <p className={commonStyles.sectionContent}>
              These Terms constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and MegiLance (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account or using the Platform, you represent that you have the legal authority to enter into this agreement.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section className={commonStyles.section} aria-labelledby="terms-2">
            <h2 id="terms-2" className={commonStyles.sectionTitle}>2. Eligibility</h2>
            <p className={commonStyles.sectionContent}>To use MegiLance, you must:</p>
            <ul className={commonStyles.list}>
              <li>Be at least 18 years of age or the age of legal majority in your jurisdiction.</li>
              <li>Have the legal capacity to form a binding contract.</li>
              <li>Not be prohibited from using the Platform under applicable laws.</li>
              <li>Provide accurate and complete registration information.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              Accounts created by automated means or on behalf of others without authorization are prohibited and will be terminated immediately.
            </p>
          </section>

          {/* 3. Account Registration */}
          <section className={commonStyles.section} aria-labelledby="terms-3">
            <h2 id="terms-3" className={commonStyles.sectionTitle}>3. Account Registration</h2>
            <h3 className={commonStyles.subsectionTitle}>3.1 Account Types</h3>
            <p className={commonStyles.sectionContent}>
              MegiLance offers three account types: <strong>Client</strong> (those hiring freelancers), <strong>Freelancer</strong> (those offering services), and <strong>Admin</strong> (platform administrators). Each role has distinct privileges and responsibilities.
            </p>
            <h3 className={commonStyles.subsectionTitle}>3.2 Account Security</h3>
            <p className={commonStyles.sectionContent}>
              You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use. MegiLance will not be liable for losses caused by unauthorized access to your account where you have failed to safeguard your credentials.
            </p>
            <h3 className={commonStyles.subsectionTitle}>3.3 Identity Verification</h3>
            <p className={commonStyles.sectionContent}>
              We may require identity verification before granting access to certain features (e.g., payment processing, verified badges). You agree to provide valid government-issued identification and any other documentation we reasonably request.
            </p>
          </section>

          {/* 4. Platform Services */}
          <section className={commonStyles.section} aria-labelledby="terms-4">
            <h2 id="terms-4" className={commonStyles.sectionTitle}>4. Platform Services</h2>
            <p className={commonStyles.sectionContent}>
              MegiLance provides an online marketplace that connects clients with freelancers. Our services include but are not limited to:
            </p>
            <ul className={commonStyles.list}>
              <li><strong>Project Posting &amp; Job Listings:</strong> Clients can post projects and freelancers can browse and apply.</li>
              <li><strong>AI-Powered Matching:</strong> Our 7-factor algorithm matches freelancers to projects based on skills, experience, budget, and availability.</li>
              <li><strong>Escrow Payment System:</strong> Secure milestone-based payments held in escrow until work is approved.</li>
              <li><strong>Messaging &amp; Collaboration:</strong> Built-in communication tools for project coordination.</li>
              <li><strong>AI Tools:</strong> Proposal writing, price estimation, contract generation, invoice creation, and fraud detection tools.</li>
              <li><strong>Reviews &amp; Ratings:</strong> Mutual feedback system for quality assurance.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              MegiLance is not a party to any contract, agreement, or engagement between clients and freelancers. We act solely as an intermediary platform.
            </p>
          </section>

          {/* 5. User Obligations */}
          <section className={commonStyles.section} aria-labelledby="terms-5">
            <h2 id="terms-5" className={commonStyles.sectionTitle}>5. User Obligations</h2>
            <h3 className={commonStyles.subsectionTitle}>5.1 General Obligations</h3>
            <ul className={commonStyles.list}>
              <li>Provide accurate, current, and complete information in your profile.</li>
              <li>Keep your account information up-to-date.</li>
              <li>Comply with all applicable local, national, and international laws and regulations.</li>
              <li>Treat all users with respect and professionalism.</li>
            </ul>
            <h3 className={commonStyles.subsectionTitle}>5.2 Client Obligations</h3>
            <ul className={commonStyles.list}>
              <li>Provide clear, accurate project descriptions and requirements.</li>
              <li>Fund escrow milestones before work begins.</li>
              <li>Review and approve submitted work within 14 days (auto-approval applies after this period).</li>
              <li>Provide constructive feedback after project completion.</li>
            </ul>
            <h3 className={commonStyles.subsectionTitle}>5.3 Freelancer Obligations</h3>
            <ul className={commonStyles.list}>
              <li>Accurately represent your skills, experience, and portfolio.</li>
              <li>Deliver work that meets the agreed-upon specifications and deadlines.</li>
              <li>Communicate promptly regarding project progress or issues.</li>
              <li>Maintain confidentiality of client information and project details.</li>
            </ul>
          </section>

          {/* 6. Payments, Fees & Escrow */}
          <section className={commonStyles.section} aria-labelledby="terms-6">
            <h2 id="terms-6" className={commonStyles.sectionTitle}>6. Payments, Fees &amp; Escrow</h2>
            <h3 className={commonStyles.subsectionTitle}>6.1 Fee Structure</h3>
            <p className={commonStyles.sectionContent}>MegiLance operates on a tiered fee structure:</p>
            <ul className={commonStyles.list}>
              <li><strong>Basic Plan:</strong> 5% platform fee per transaction.</li>
              <li><strong>Standard Plan:</strong> 3% platform fee per transaction.</li>
              <li><strong>Premium Plan:</strong> 1% platform fee per transaction.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              There are no hidden charges, subscription requirements, or withdrawal penalties. Fees are deducted automatically at the time of payment release.
            </p>
            <h3 className={commonStyles.subsectionTitle}>6.2 Escrow System</h3>
            <p className={commonStyles.sectionContent}>All project payments are processed through our escrow system:</p>
            <ol className={commonStyles.orderedList}>
              <li>Client funds a milestone, and the amount is held in escrow.</li>
              <li>Freelancer completes and submits the milestone work.</li>
              <li>Client reviews the deliverables and approves (or requests revisions).</li>
              <li>Upon approval, funds are released to the freelancer minus the platform fee.</li>
              <li>If the client does not respond within 14 days, funds are auto-released.</li>
            </ol>
            <h3 className={commonStyles.subsectionTitle}>6.3 Payment Methods</h3>
            <p className={commonStyles.sectionContent}>Supported payment methods include:</p>
            <ul className={commonStyles.list}>
              <li>Credit and debit cards (via Stripe)</li>
              <li>Bank transfers</li>
              <li>USDC cryptocurrency (Optimism network) for near-zero fee transactions</li>
              <li>PayPal (where available)</li>
            </ul>
            <h3 className={commonStyles.subsectionTitle}>6.4 Refunds</h3>
            <p className={commonStyles.sectionContent}>
              Refunds are processed through the dispute resolution mechanism. Escrowed funds may be returned to the client if work is not delivered, is materially deficient, or as determined through our mediation process. Platform fees are non-refundable once a project has been initiated.
            </p>
          </section>

          {/* 7. Intellectual Property */}
          <section className={commonStyles.section} aria-labelledby="terms-7">
            <h2 id="terms-7" className={commonStyles.sectionTitle}>7. Intellectual Property</h2>
            <h3 className={commonStyles.subsectionTitle}>7.1 Platform IP</h3>
            <p className={commonStyles.sectionContent}>
              All content, features, and functionality of the MegiLance platform — including but not limited to text, graphics, logos, icons, software, AI models, and algorithms — are the exclusive property of MegiLance and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <h3 className={commonStyles.subsectionTitle}>7.2 User-Generated Content</h3>
            <p className={commonStyles.sectionContent}>
              By posting content (profiles, portfolio items, project descriptions, reviews), you grant MegiLance a worldwide, non-exclusive, royalty-free licence to display and distribute such content on the Platform for the purpose of providing our services.
            </p>
            <h3 className={commonStyles.subsectionTitle}>7.3 Work Product Ownership</h3>
            <p className={commonStyles.sectionContent}>
              Unless otherwise agreed in writing between the client and freelancer, all intellectual property rights in work product delivered under a project transfer to the client upon full payment. Freelancers may retain the right to display completed work in their portfolio unless a non-disclosure agreement is in place.
            </p>
          </section>

          {/* 8. Dispute Resolution */}
          <section className={commonStyles.section} aria-labelledby="terms-8">
            <h2 id="terms-8" className={commonStyles.sectionTitle}>8. Dispute Resolution</h2>
            <p className={commonStyles.sectionContent}>We encourage users to resolve disagreements directly. If this is not possible:</p>
            <ol className={commonStyles.orderedList}>
              <li><strong>Direct Resolution:</strong> Attempt to resolve the issue via the Platform&apos;s messaging system.</li>
              <li><strong>Formal Dispute:</strong> Either party may file a dispute through the Platform within 30 days.</li>
              <li><strong>Mediation:</strong> Our mediation team will review evidence from both parties and propose a resolution within 5–7 business days.</li>
              <li><strong>Final Decision:</strong> If mediation does not succeed, MegiLance will issue a binding decision based on the evidence provided.</li>
            </ol>
            <p className={commonStyles.sectionContent}>
              You agree that disputes up to $10,000 USD will be resolved through our internal mediation process before pursuing any external legal action. For disputes exceeding this amount, either party may proceed to binding arbitration under the rules of the jurisdiction specified in Section 14.
            </p>
          </section>

          {/* 9. Prohibited Conduct */}
          <section className={commonStyles.section} aria-labelledby="terms-9">
            <h2 id="terms-9" className={commonStyles.sectionTitle}>9. Prohibited Conduct</h2>
            <p className={commonStyles.sectionContent}>You agree not to:</p>
            <ul className={commonStyles.list}>
              <li>Use the Platform for any illegal purpose or in violation of any applicable law.</li>
              <li>Post fraudulent, misleading, or deceptive content.</li>
              <li>Circumvent the Platform&apos;s payment system or engage in off-platform transactions for work sourced through MegiLance.</li>
              <li>Create multiple accounts or impersonate another person.</li>
              <li>Harass, abuse, or threaten other users.</li>
              <li>Scrape, crawl, or use automated means to access the Platform without written permission.</li>
              <li>Upload malware, viruses, or any destructive code.</li>
              <li>Manipulate ratings, reviews, or search rankings.</li>
              <li>Share confidential or proprietary information of other users.</li>
              <li>Use AI-generated content (profiles, proposals, reviews) without disclosure.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              Violations may result in warnings, temporary suspension, permanent account termination, and forfeiture of pending earnings.
            </p>
          </section>

          {/* 10. Limitation of Liability */}
          <section className={commonStyles.section} aria-labelledby="terms-10">
            <h2 id="terms-10" className={commonStyles.sectionTitle}>10. Limitation of Liability</h2>
            <p className={commonStyles.sectionContent}>
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEGILANCE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL.
            </p>
            <p className={commonStyles.sectionContent}>
              Our total liability for any claim arising from or related to these Terms or the Platform shall not exceed the amount of fees paid by you to MegiLance in the twelve (12) months preceding the claim. MegiLance does not guarantee the quality, accuracy, or suitability of services provided by freelancers, nor the solvency or reliability of clients.
            </p>
          </section>

          {/* 11. Indemnification */}
          <section className={commonStyles.section} aria-labelledby="terms-11">
            <h2 id="terms-11" className={commonStyles.sectionTitle}>11. Indemnification</h2>
            <p className={commonStyles.sectionContent}>
              You agree to indemnify, defend, and hold harmless MegiLance, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with your use of the Platform, your violation of these Terms, or your infringement of any third-party rights.
            </p>
          </section>

          {/* 12. Termination */}
          <section className={commonStyles.section} aria-labelledby="terms-12">
            <h2 id="terms-12" className={commonStyles.sectionTitle}>12. Termination</h2>
            <h3 className={commonStyles.subsectionTitle}>12.1 By You</h3>
            <p className={commonStyles.sectionContent}>
              You may close your account at any time through your account settings. Upon closure, any pending projects must be completed or cancelled, and any escrowed funds will be handled according to the escrow terms.
            </p>
            <h3 className={commonStyles.subsectionTitle}>12.2 By MegiLance</h3>
            <p className={commonStyles.sectionContent}>
              We reserve the right to suspend or terminate your account at any time if you violate these Terms, engage in prohibited conduct, or if we reasonably believe your continued use poses a risk to the Platform or other users. We will provide notice of termination where practicable.
            </p>
            <h3 className={commonStyles.subsectionTitle}>12.3 Effect of Termination</h3>
            <p className={commonStyles.sectionContent}>
              Upon termination, your right to use the Platform ceases immediately. Sections relating to intellectual property, limitation of liability, indemnification, and dispute resolution survive termination.
            </p>
          </section>

          {/* 13. Changes to Terms */}
          <section className={commonStyles.section} aria-labelledby="terms-13">
            <h2 id="terms-13" className={commonStyles.sectionTitle}>13. Changes to Terms</h2>
            <p className={commonStyles.sectionContent}>
              We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on the Platform with a revised &quot;Last Updated&quot; date and, for significant changes, by email or in-app notification at least 30 days before the changes take effect. Your continued use of the Platform after the effective date constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 14. Governing Law */}
          <section className={commonStyles.section} aria-labelledby="terms-14">
            <h2 id="terms-14" className={commonStyles.sectionTitle}>14. Governing Law</h2>
            <p className={commonStyles.sectionContent}>
              These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict-of-law provisions. Any disputes not resolved through our internal mediation process shall be submitted to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          {/* 15. Contact */}
          <section className={commonStyles.section} aria-labelledby="terms-15">
            <h2 id="terms-15" className={commonStyles.sectionTitle}>15. Contact Information</h2>
            <p className={commonStyles.sectionContent}>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className={cn(commonStyles.contactBox, themeStyles.contactBox)}>
              <p className={commonStyles.sectionContent}><strong>MegiLance Legal Team</strong></p>
              <p className={commonStyles.sectionContent}>Email: legal@megilance.com</p>
              <p className={commonStyles.sectionContent}>Support: <a href="/support">megilance.com/support</a></p>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Terms;
