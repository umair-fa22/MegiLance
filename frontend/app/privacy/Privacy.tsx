// @AI-HINT: Comprehensive Privacy Policy page. Uses shared LegalPage CSS modules for theming.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube } from '@/app/components/3D';
import commonStyles from '@/app/styles/LegalPage.common.module.css';
import lightStyles from '@/app/styles/LegalPage.light.module.css';
import darkStyles from '@/app/styles/LegalPage.dark.module.css';

const Privacy: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="blue" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="purple" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
        <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
          <FloatingCube size={40} />
        </div>
      </div>

      <main id="main-content" role="main" className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <header className={commonStyles.header}>
            <h1 className={commonStyles.title}>Privacy Policy</h1>
            <p className={commonStyles.subtitle}>Last Updated: March 1, 2026</p>
          </header>

          {/* Table of Contents */}
          <nav className={cn(commonStyles.toc, themeStyles.toc)} aria-label="Table of Contents">
            <p className={commonStyles.tocTitle}>Table of Contents</p>
            <ol className={commonStyles.tocList}>
              <li><a href="#privacy-1">1. Information We Collect</a></li>
              <li><a href="#privacy-2">2. How We Use Your Information</a></li>
              <li><a href="#privacy-3">3. AI &amp; Automated Processing</a></li>
              <li><a href="#privacy-4">4. Information Sharing</a></li>
              <li><a href="#privacy-5">5. Data Retention</a></li>
              <li><a href="#privacy-6">6. Data Security</a></li>
              <li><a href="#privacy-7">7. Your Rights (GDPR/CCPA)</a></li>
              <li><a href="#privacy-8">8. Cookies &amp; Tracking</a></li>
              <li><a href="#privacy-9">9. International Transfers</a></li>
              <li><a href="#privacy-10">10. Children&apos;s Privacy</a></li>
              <li><a href="#privacy-11">11. Third-Party Services</a></li>
              <li><a href="#privacy-12">12. Changes to This Policy</a></li>
              <li><a href="#privacy-13">13. Contact &amp; Data Protection Officer</a></li>
            </ol>
          </nav>

          {/* 1. Information We Collect */}
          <section className={commonStyles.section} aria-labelledby="privacy-1">
            <h2 id="privacy-1" className={commonStyles.sectionTitle}>1. Information We Collect</h2>

            <h3 className={commonStyles.subsectionTitle}>1.1 Information You Provide</h3>
            <ul className={commonStyles.list}>
              <li><strong>Account Information:</strong> Name, email address, password (hashed with bcrypt), profile photo, phone number.</li>
              <li><strong>Profile Data:</strong> Skills, experience, portfolio items, bio, hourly rate, location, education, certifications.</li>
              <li><strong>Project Data:</strong> Project descriptions, budgets, timelines, deliverables, and project files.</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely via Stripe — we do not store full card numbers), USDC wallet addresses.</li>
              <li><strong>Identity Verification:</strong> Government-issued ID documents for verified freelancer status.</li>
              <li><strong>Communications:</strong> Messages sent through the Platform, support requests, reviews, and feedback.</li>
            </ul>

            <h3 className={commonStyles.subsectionTitle}>1.2 Information Collected Automatically</h3>
            <ul className={commonStyles.list}>
              <li><strong>Usage Data:</strong> Pages visited, features used, search queries, time spent, click patterns.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, screen resolution.</li>
              <li><strong>Network Data:</strong> IP address, approximate geolocation (city/country level), ISP.</li>
              <li><strong>Performance Data:</strong> Page load times, error logs, API response times.</li>
            </ul>

            <h3 className={commonStyles.subsectionTitle}>1.3 Information from Third Parties</h3>
            <ul className={commonStyles.list}>
              <li><strong>OAuth Providers:</strong> If you sign in via Google or GitHub, we receive your name, email, and profile picture.</li>
              <li><strong>Payment Processors:</strong> Stripe provides transaction confirmations and fraud screening results.</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section className={commonStyles.section} aria-labelledby="privacy-2">
            <h2 id="privacy-2" className={commonStyles.sectionTitle}>2. How We Use Your Information</h2>
            <p className={commonStyles.sectionContent}>We use the information we collect for the following purposes:</p>
            <ul className={commonStyles.list}>
              <li><strong>Service Delivery:</strong> To create and manage your account, facilitate project matching, process payments, and enable communication between users.</li>
              <li><strong>AI-Powered Features:</strong> To power our matching algorithm, proposal writer, price estimator, fraud detection, and other AI tools.</li>
              <li><strong>Personalisation:</strong> To customise your feed, recommend projects or freelancers, and tailor notifications.</li>
              <li><strong>Security &amp; Fraud Prevention:</strong> To detect suspicious activity, prevent fraud, enforce our Terms of Service, and protect users.</li>
              <li><strong>Analytics &amp; Improvement:</strong> To understand usage patterns, improve platform performance, and develop new features.</li>
              <li><strong>Communications:</strong> To send transactional emails (payment confirmations, project updates), and with your consent, marketing communications.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </section>

          {/* 3. AI & Automated Processing */}
          <section className={commonStyles.section} aria-labelledby="privacy-3">
            <h2 id="privacy-3" className={commonStyles.sectionTitle}>3. AI &amp; Automated Processing</h2>
            <p className={commonStyles.sectionContent}>
              MegiLance uses artificial intelligence and machine learning to enhance the platform experience. This includes:
            </p>
            <ul className={commonStyles.list}>
              <li><strong>Matching Algorithm:</strong> Our 7-factor AI analyses skill alignment (30%), experience (15%), budget compatibility (15%), response rate (10%), success rate (10%), location preference (10%), and availability (10%) to recommend optimal matches.</li>
              <li><strong>Fraud Detection:</strong> Automated content analysis scans project descriptions, messages, and profiles for potential fraud indicators, spam, and policy violations.</li>
              <li><strong>Proposal &amp; Content Generation:</strong> AI tools may process your skills and project data to generate proposals, estimates, and contracts.</li>
              <li><strong>Search Ranking:</strong> Freelancer profiles are ranked in search results using automated scoring that considers completeness, ratings, response time, and verification status.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              You have the right to request human review of any significant automated decision that affects your account. Contact our support team to exercise this right.
            </p>
          </section>

          {/* 4. Information Sharing */}
          <section className={commonStyles.section} aria-labelledby="privacy-4">
            <h2 id="privacy-4" className={commonStyles.sectionTitle}>4. Information Sharing</h2>
            <p className={commonStyles.sectionContent}>
              <strong>We do not sell your personal data.</strong> We may share information in the following circumstances:
            </p>
            <ul className={commonStyles.list}>
              <li><strong>Between Users:</strong> Profile information, reviews, and project details are shared between clients and freelancers as necessary to facilitate engagements.</li>
              <li><strong>Service Providers:</strong> We share data with trusted third-party processors who assist with hosting (cloud infrastructure), payment processing (Stripe), email delivery, analytics, and customer support — all under strict data processing agreements.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, legal process, or governmental request.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of the transaction with equivalent privacy protections maintained.</li>
              <li><strong>With Your Consent:</strong> We may share information for purposes not described here only with your explicit consent.</li>
            </ul>
          </section>

          {/* 5. Data Retention */}
          <section className={commonStyles.section} aria-labelledby="privacy-5">
            <h2 id="privacy-5" className={commonStyles.sectionTitle}>5. Data Retention</h2>
            <p className={commonStyles.sectionContent}>We retain your data for as long as necessary to provide our services and fulfil the purposes described in this policy:</p>
            <ul className={commonStyles.list}>
              <li><strong>Active Accounts:</strong> Data is retained for the duration of your account.</li>
              <li><strong>Closed Accounts:</strong> Core account data is retained for 90 days after account closure to allow reactivation, then anonymised or deleted.</li>
              <li><strong>Financial Records:</strong> Transaction data is retained for 7 years to comply with tax and financial regulations.</li>
              <li><strong>Communications:</strong> Messages are retained for 2 years after the associated project is closed.</li>
              <li><strong>Usage Logs:</strong> Anonymised usage analytics are retained indefinitely for platform improvement.</li>
            </ul>
          </section>

          {/* 6. Data Security */}
          <section className={commonStyles.section} aria-labelledby="privacy-6">
            <h2 id="privacy-6" className={commonStyles.sectionTitle}>6. Data Security</h2>
            <p className={commonStyles.sectionContent}>We implement industry-standard security measures to protect your information:</p>
            <ul className={commonStyles.list}>
              <li><strong>Encryption:</strong> All data in transit is encrypted using TLS 1.3. Sensitive data at rest is encrypted using AES-256.</li>
              <li><strong>Authentication:</strong> JWT-based authentication with secure token rotation (30-minute access tokens, 7-day refresh tokens).</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with appropriate work factors. We never store plaintext passwords.</li>
              <li><strong>Access Controls:</strong> Role-based access control (RBAC) ensures users only access data relevant to their role.</li>
              <li><strong>Infrastructure:</strong> Hosted on secure cloud infrastructure with regular security audits, DDoS mitigation, and automated vulnerability scanning.</li>
              <li><strong>Incident Response:</strong> We maintain an incident response plan and will notify affected users within 72 hours of discovering a data breach.</li>
            </ul>
          </section>

          {/* 7. Your Rights */}
          <section className={commonStyles.section} aria-labelledby="privacy-7">
            <h2 id="privacy-7" className={commonStyles.sectionTitle}>7. Your Rights (GDPR / CCPA)</h2>
            <p className={commonStyles.sectionContent}>Depending on your location, you may have the following rights regarding your personal data:</p>

            <h3 className={commonStyles.subsectionTitle}>7.1 GDPR Rights (EU/UK Residents)</h3>
            <ul className={commonStyles.list}>
              <li><strong>Right of Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;).</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
            </ul>

            <h3 className={commonStyles.subsectionTitle}>7.2 CCPA Rights (California Residents)</h3>
            <ul className={commonStyles.list}>
              <li><strong>Right to Know:</strong> Request disclosure of categories and specific pieces of personal information collected.</li>
              <li><strong>Right to Delete:</strong> Request deletion of personal information.</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we do not sell your data).</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>

            <p className={commonStyles.sectionContent}>
              To exercise any of these rights, contact us at <a href="mailto:privacy@megilance.com">privacy@megilance.com</a> or use the privacy controls in your account settings. We will respond within 30 days.
            </p>
          </section>

          {/* 8. Cookies */}
          <section className={commonStyles.section} aria-labelledby="privacy-8">
            <h2 id="privacy-8" className={commonStyles.sectionTitle}>8. Cookies &amp; Tracking Technologies</h2>
            <p className={commonStyles.sectionContent}>We use cookies and similar technologies to:</p>
            <ul className={commonStyles.list}>
              <li><strong>Essential Cookies:</strong> Maintain your session, remember your preferences, and ensure platform security.</li>
              <li><strong>Analytics Cookies:</strong> Understand how users interact with the Platform to improve performance and features.</li>
              <li><strong>Preference Cookies:</strong> Remember your theme (light/dark mode), language, and display preferences.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              We do not use third-party advertising cookies or trackers. You can manage cookie preferences through your browser settings or our <a href="/cookies">Cookie Policy</a> page.
            </p>
          </section>

          {/* 9. International Transfers */}
          <section className={commonStyles.section} aria-labelledby="privacy-9">
            <h2 id="privacy-9" className={commonStyles.sectionTitle}>9. International Data Transfers</h2>
            <p className={commonStyles.sectionContent}>
              MegiLance operates globally, and your data may be transferred to and processed in countries outside your country of residence. When we transfer data internationally, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className={commonStyles.list}>
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
              <li>Data processing agreements with all third-party processors.</li>
              <li>Adequacy decisions where applicable.</li>
            </ul>
          </section>

          {/* 10. Children */}
          <section className={commonStyles.section} aria-labelledby="privacy-10">
            <h2 id="privacy-10" className={commonStyles.sectionTitle}>10. Children&apos;s Privacy</h2>
            <p className={commonStyles.sectionContent}>
              MegiLance is not directed at individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child under 18, we will delete it promptly. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* 11. Third-Party Services */}
          <section className={commonStyles.section} aria-labelledby="privacy-11">
            <h2 id="privacy-11" className={commonStyles.sectionTitle}>11. Third-Party Services</h2>
            <p className={commonStyles.sectionContent}>Our Platform may contain links to or integrate with third-party services. Key third-party processors include:</p>
            <ul className={commonStyles.list}>
              <li><strong>Stripe:</strong> Payment processing and fraud screening.</li>
              <li><strong>Turso (libSQL):</strong> Database hosting and storage.</li>
              <li><strong>Cloud Providers:</strong> Infrastructure and hosting services.</li>
              <li><strong>OAuth Providers:</strong> Google and GitHub for authentication.</li>
            </ul>
            <p className={commonStyles.sectionContent}>
              These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of third-party services.
            </p>
          </section>

          {/* 12. Changes */}
          <section className={commonStyles.section} aria-labelledby="privacy-12">
            <h2 id="privacy-12" className={commonStyles.sectionTitle}>12. Changes to This Policy</h2>
            <p className={commonStyles.sectionContent}>
              We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We will notify you of material changes by posting the updated policy on the Platform with a revised date. For significant changes, we will provide at least 30 days&apos; notice via email or in-app notification.
            </p>
          </section>

          {/* 13. Contact */}
          <section className={commonStyles.section} aria-labelledby="privacy-13">
            <h2 id="privacy-13" className={commonStyles.sectionTitle}>13. Contact &amp; Data Protection Officer</h2>
            <p className={commonStyles.sectionContent}>For privacy-related inquiries or to exercise your data rights:</p>
            <div className={cn(commonStyles.contactBox, themeStyles.contactBox)}>
              <p className={commonStyles.sectionContent}><strong>MegiLance Privacy Team</strong></p>
              <p className={commonStyles.sectionContent}>Email: <a href="mailto:privacy@megilance.com">privacy@megilance.com</a></p>
              <p className={commonStyles.sectionContent}>Data Protection Officer: <a href="mailto:dpo@megilance.com">dpo@megilance.com</a></p>
              <p className={commonStyles.sectionContent}>Support: <a href="/support">megilance.com/support</a></p>
            </div>
            <p className={commonStyles.sectionContent}>
              If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority (e.g., the ICO in the UK, CNIL in France).
            </p>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Privacy;
