// @AI-HINT: Portal Help/Support Center page. Full-featured knowledge base with search, FAQ accordion, categories, quick links, status, and contact support.
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import { StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import {
  Search, BookOpen, CreditCard, Shield, Users, Briefcase, Settings,
  MessageCircle, FileText, ChevronDown, ChevronUp, ExternalLink,
  Mail, Phone, Clock, CheckCircle, AlertCircle, HelpCircle,
  Zap, Star, Globe, Video, Award, TrendingUp, ArrowRight,
} from 'lucide-react';
import common from './Help.common.module.css';
import light from './Help.light.module.css';
import dark from './Help.dark.module.css';

interface Category {
  title: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  articleCount: number;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface QuickLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const categories: Category[] = [
  { title: 'Getting Started', desc: 'Set up your account, complete your profile, and land your first project.', icon: <BookOpen size={24} />, href: '/faq', articleCount: 12 },
  { title: 'Billing & Payments', desc: 'Manage earnings, withdrawals, invoices, and payment methods.', icon: <CreditCard size={24} />, href: '/pricing', articleCount: 15 },
  { title: 'Security & Privacy', desc: 'Two-factor auth, password management, and data protection.', icon: <Shield size={24} />, href: '/security', articleCount: 8 },
  { title: 'Finding Work', desc: 'Browse projects, submit proposals, and improve your visibility.', icon: <Briefcase size={24} />, href: '/freelancer/jobs', articleCount: 18 },
  { title: 'Contracts & Projects', desc: 'Milestones, time tracking, deliverables, and dispute resolution.', icon: <FileText size={24} />, href: '/freelancer/contracts', articleCount: 14 },
  { title: 'Account Settings', desc: 'Profile editing, notifications, verification, and preferences.', icon: <Settings size={24} />, href: '/settings', articleCount: 10 },
  { title: 'Teams & Collaboration', desc: 'Invite members, manage roles, and collaborate on projects.', icon: <Users size={24} />, href: '/freelancer/teams', articleCount: 7 },
  { title: 'Communication', desc: 'Messages, video calls, file sharing, and client interaction.', icon: <MessageCircle size={24} />, href: '/freelancer/messages', articleCount: 9 },
  { title: 'Growth & Analytics', desc: 'Performance analytics, skill assessments, rankings, and career tools.', icon: <TrendingUp size={24} />, href: '/freelancer/analytics', articleCount: 11 },
];

const faqs: FAQ[] = [
  { question: 'How do I create a freelancer account?', answer: 'Click "Sign Up" and select "Freelancer". Complete your profile with skills, portfolio items, and a professional bio. Verify your email to activate your account.', category: 'Getting Started' },
  { question: 'How do I submit a proposal?', answer: 'Browse available projects, click on one that matches your skills, then click "Submit Proposal". Include your cover letter, proposed rate, timeline, and any relevant portfolio pieces.', category: 'Finding Work' },
  { question: 'What payment methods are supported?', answer: 'We support bank transfers, PayPal, and Wise for withdrawals. Clients can pay via credit card, bank transfer, or PayPal. All transactions are secured with escrow protection.', category: 'Billing & Payments' },
  { question: 'How does escrow protection work?', answer: 'When a client funds a milestone, the money is held in escrow. Once you deliver the work and the client approves, funds are released to your wallet. This protects both parties.', category: 'Billing & Payments' },
  { question: 'How do I enable two-factor authentication?', answer: 'Go to Settings → Security → Two-Factor Authentication. You can use an authenticator app or SMS verification. We recommend using an authenticator app for better security.', category: 'Security & Privacy' },
  { question: 'How do I track time on a project?', answer: 'Navigate to Time Tracking from the sidebar. Click "Start Timer" for the relevant project. The timer captures screenshots periodically for hourly contracts. You can also add manual time entries.', category: 'Contracts & Projects' },
  { question: 'How is my freelancer rank calculated?', answer: 'Your rank is based on job success score, client feedback, earnings, on-time delivery rate, response time, and skill verification badges. Higher ranks unlock more visibility and premium features.', category: 'Growth & Analytics' },
  { question: 'Can I work with a team on projects?', answer: 'Yes! Create or join a team under Tools → Teams. Team leads can assign work, share files, and split payments among team members. Each member maintains their individual profile.', category: 'Teams & Collaboration' },
  { question: 'What happens if there\'s a dispute?', answer: 'If you and a client disagree, either party can open a dispute. Our mediation team reviews the evidence, milestone terms, and communication to reach a fair resolution within 5-7 business days.', category: 'Contracts & Projects' },
  { question: 'How do I withdraw my earnings?', answer: 'Go to Finance → Withdraw. Select your preferred payment method and amount. Standard withdrawals process in 3-5 business days. Express withdrawal (with a small fee) arrives within 24 hours.', category: 'Billing & Payments' },
  { question: 'How do I improve my profile visibility?', answer: 'Complete your profile 100%, add portfolio items, get skills verified through assessments, maintain a high job success score, respond quickly to messages, and keep your availability status updated.', category: 'Finding Work' },
  { question: 'What file types can I share in messages?', answer: 'You can share images (PNG, JPG, GIF), documents (PDF, DOC, DOCX), spreadsheets (XLS, XLSX), presentations (PPT, PPTX), and archives (ZIP, RAR). Maximum file size is 25MB per file.', category: 'Communication' },
  { question: 'How do subscription plans work?', answer: 'Free tier offers basic features. Professional plan unlocks advanced analytics, priority placement, and more monthly proposals. Business plan adds team features and dedicated account support.', category: 'Billing & Payments' },
  { question: 'Can I set different rates for different skills?', answer: 'Yes! Go to Finance → Rate Cards. Create multiple rate cards with different hourly or project-based rates for each skill category. Attach rate cards when submitting proposals.', category: 'Billing & Payments' },
];

const quickLinks: QuickLink[] = [
  { label: 'Browse Projects', href: '/freelancer/jobs', icon: <Briefcase size={16} /> },
  { label: 'Submit a Proposal', href: '/freelancer/proposals', icon: <FileText size={16} /> },
  { label: 'Time Tracking', href: '/freelancer/time-entries', icon: <Clock size={16} /> },
  { label: 'Earnings Dashboard', href: '/freelancer/earnings', icon: <TrendingUp size={16} /> },
  { label: 'Skill Assessments', href: '/freelancer/assessments', icon: <Award size={16} /> },
  { label: 'Video Calls', href: '/freelancer/video-calls', icon: <Video size={16} /> },
];

const videoTutorials = [
  { title: 'Getting Started with MegiLance', duration: '5:30', views: '12.4K' },
  { title: 'Writing Winning Proposals', duration: '8:15', views: '9.8K' },
  { title: 'Time Tracking Best Practices', duration: '6:45', views: '7.2K' },
  { title: 'Managing Multiple Contracts', duration: '10:20', views: '5.6K' },
  { title: 'Building a Standout Portfolio', duration: '7:00', views: '11.1K' },
  { title: 'Setting Competitive Rates', duration: '4:50', views: '8.3K' },
];

const Help: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [faqFilter, setFaqFilter] = useState<string>('All');
  const [contactForm, setContactForm] = useState({ subject: '', message: '', email: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const filteredFAQs = useMemo(() => {
    let result = faqs;
    if (faqFilter !== 'All') {
      result = result.filter(f => f.category === faqFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery, faqFilter]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c =>
      c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const faqCategories = useMemo(() => {
    const cats = ['All', ...new Set(faqs.map(f => f.category))];
    return cats;
  }, []);

  const toggleFAQ = useCallback((index: number) => {
    setExpandedFAQ(prev => prev === index ? null : index);
  }, []);

  const handleContactSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return;
    setFormSubmitted(true);
    setContactForm({ subject: '', message: '', email: '' });
    setTimeout(() => setFormSubmitted(false), 5000);
  }, [contactForm]);

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={common.bgDecorations}>
        <AnimatedOrb variant="blue" size={400} blur={90} opacity={0.08} className={common.orbTopLeft} />
        <AnimatedOrb variant="purple" size={350} blur={70} opacity={0.06} className={common.orbBottomRight} />
        <ParticlesSystem count={10} className={common.particles} />
        <div className={common.floatTopRight}><FloatingCube size={50} /></div>
        <div className={common.floatBottomLeft}><FloatingSphere size={40} /></div>
      </div>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Hero Header with Search */}
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>Help Center</h1>
              <p className={common.subtitle}>Find answers, learn best practices, and contact our support team.</p>
              <div className={common.searchBox}>
                <Search size={20} className={common.searchIcon} />
                <input
                  type="text"
                  className={cn(common.searchInput, themed.searchInput)}
                  placeholder="Search for help articles, FAQs, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search help articles"
                />
                {searchQuery && (
                  <button className={common.searchClear} onClick={() => setSearchQuery('')} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className={common.searchResults} role="status">
                  {filteredFAQs.length + filteredCategories.length} results for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>
          </ScrollReveal>

          {/* Quick Links Bar */}
          <ScrollReveal delay={0.05}>
            <section className={common.quickLinksSection} aria-label="Quick links">
              <div className={common.quickLinksBar}>
                {quickLinks.map((link) => (
                  <Link key={link.label} href={link.href} className={cn(common.quickLink, themed.quickLink)}>
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Knowledge Base Categories */}
          <section aria-label="Help categories" className={common.section}>
            <ScrollReveal delay={0.1}>
              <h2 className={common.sectionTitle}>
                <Globe size={20} />
                Knowledge Base
              </h2>
            </ScrollReveal>
            <StaggerContainer className={common.grid}>
              {filteredCategories.map((c) => (
                <StaggerItem key={c.title}>
                  <Link href={c.href} className={cn(common.card, themed.card)} aria-label={`${c.title} — ${c.articleCount} articles`}>
                    <div className={cn(common.cardIcon, themed.cardIcon)}>{c.icon}</div>
                    <div className={common.cardTitle}>{c.title}</div>
                    <p className={common.cardDesc}>{c.desc}</p>
                    <span className={cn(common.cardMeta, themed.cardMeta)}>{c.articleCount} articles <ArrowRight size={14} /></span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* FAQ Section with Accordion */}
          <section className={common.section} aria-label="Frequently asked questions">
            <ScrollReveal delay={0.15}>
              <h2 className={common.sectionTitle}>
                <HelpCircle size={20} />
                Frequently Asked Questions
              </h2>
              <div className={common.faqFilters} role="tablist" aria-label="FAQ category filter">
                {faqCategories.map(cat => (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={faqFilter === cat}
                    className={cn(common.faqFilter, themed.faqFilter, faqFilter === cat && common.faqFilterActive, faqFilter === cat && themed.faqFilterActive)}
                    onClick={() => setFaqFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </ScrollReveal>
            <div className={common.faqList}>
              {filteredFAQs.length === 0 ? (
                <div className={cn(common.emptyResult, themed.emptyResult)}>
                  <AlertCircle size={32} />
                  <p>No FAQs match your search. Try different keywords or <button className={common.textButton} onClick={() => { setSearchQuery(''); setFaqFilter('All'); }}>clear filters</button>.</p>
                </div>
              ) : (
                filteredFAQs.map((faq, idx) => (
                  <ScrollReveal key={idx} delay={0.02 * idx}>
                    <div className={cn(common.faqItem, themed.faqItem, expandedFAQ === idx && common.faqItemExpanded, expandedFAQ === idx && themed.faqItemExpanded)}>
                      <button
                        className={common.faqQuestion}
                        onClick={() => toggleFAQ(idx)}
                        aria-expanded={expandedFAQ === idx}
                        aria-controls={`faq-answer-${idx}`}
                      >
                        <span className={common.faqCategoryBadge}>{faq.category}</span>
                        <span className={common.faqQuestionText}>{faq.question}</span>
                        {expandedFAQ === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {expandedFAQ === idx && (
                        <div id={`faq-answer-${idx}`} className={cn(common.faqAnswer, themed.faqAnswer)} role="region">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                ))
              )}
            </div>
          </section>

          {/* Video Tutorials */}
          <section className={common.section} aria-label="Video tutorials">
            <ScrollReveal delay={0.1}>
              <h2 className={common.sectionTitle}>
                <Video size={20} />
                Video Tutorials
              </h2>
            </ScrollReveal>
            <StaggerContainer className={common.tutorialsGrid}>
              {videoTutorials.map((video, idx) => (
                <StaggerItem key={idx}>
                  <div className={cn(common.tutorialCard, themed.tutorialCard)}>
                    <div className={cn(common.tutorialThumb, themed.tutorialThumb)}>
                      <Video size={32} />
                      <span className={common.tutorialDuration}>{video.duration}</span>
                    </div>
                    <div className={common.tutorialInfo}>
                      <h3 className={common.tutorialTitle}>{video.title}</h3>
                      <span className={cn(common.tutorialViews, themed.tutorialViews)}>{video.views} views</span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* Platform Status */}
          <section className={common.section} aria-label="Platform status">
            <ScrollReveal delay={0.1}>
              <div className={cn(common.statusBar, themed.statusBar)}>
                <div className={common.statusIndicator}>
                  <CheckCircle size={18} className={common.statusGreen} />
                  <span className={common.statusText}>All systems operational</span>
                </div>
                <div className={common.statusLinks}>
                  <span className={cn(common.statusMeta, themed.statusMeta)}>
                    <Zap size={14} /> API: <strong>99.9%</strong> uptime
                  </span>
                  <span className={cn(common.statusMeta, themed.statusMeta)}>
                    <Clock size={14} /> Last checked: just now
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Contact Support Section */}
          <section className={common.section} aria-label="Contact support">
            <ScrollReveal delay={0.1}>
              <h2 className={common.sectionTitle}>
                <Mail size={20} />
                Still Need Help?
              </h2>
            </ScrollReveal>
            <div className={common.contactGrid}>
              <ScrollReveal delay={0.15}>
                <div className={cn(common.contactCard, themed.contactCard)}>
                  <MessageCircle size={28} />
                  <h3>Live Chat</h3>
                  <p>Chat with our support team in real-time. Average response time: 2 minutes.</p>
                  <Button variant="primary" size="sm">Start Chat</Button>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <div className={cn(common.contactCard, themed.contactCard)}>
                  <Mail size={28} />
                  <h3>Email Support</h3>
                  <p>Send us a detailed message. We respond within 24 hours on business days.</p>
                  <Button variant="outline" size="sm">support@megilance.com</Button>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.25}>
                <div className={cn(common.contactCard, themed.contactCard)}>
                  <Phone size={28} />
                  <h3>Priority Phone</h3>
                  <p>Available for Professional and Business plan subscribers. Mon–Fri 9 AM – 6 PM.</p>
                  <Button variant="outline" size="sm">Schedule Call</Button>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Submit Ticket Form */}
          <section className={common.section} aria-label="Submit a support ticket">
            <ScrollReveal delay={0.1}>
              <div className={cn(common.ticketForm, themed.ticketForm)}>
                <h2 className={common.ticketTitle}>
                  <FileText size={20} />
                  Submit a Support Ticket
                </h2>
                {formSubmitted ? (
                  <div className={cn(common.ticketSuccess, themed.ticketSuccess)}>
                    <CheckCircle size={32} />
                    <h3>Ticket Submitted!</h3>
                    <p>We&apos;ll get back to you within 24 hours. Check your email for a confirmation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className={common.ticketFormInner}>
                    <div className={common.formRow}>
                      <label className={cn(common.formLabel, themed.formLabel)} htmlFor="help-subject">Subject</label>
                      <input
                        id="help-subject"
                        type="text"
                        className={cn(common.formInput, themed.formInput)}
                        placeholder="Brief description of your issue"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={common.formRow}>
                      <label className={cn(common.formLabel, themed.formLabel)} htmlFor="help-email">Email (optional)</label>
                      <input
                        id="help-email"
                        type="email"
                        className={cn(common.formInput, themed.formInput)}
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className={common.formRow}>
                      <label className={cn(common.formLabel, themed.formLabel)} htmlFor="help-message">Message</label>
                      <textarea
                        id="help-message"
                        className={cn(common.formTextarea, themed.formTextarea)}
                        placeholder="Describe your issue in detail..."
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button variant="primary" type="submit">Submit Ticket</Button>
                  </form>
                )}
              </div>
            </ScrollReveal>
          </section>

          {/* Bottom CTA */}
          <section className={common.section} aria-label="Additional resources">
            <ScrollReveal>
              <div className={common.cta}>
                <Link href="/freelancer/support" className={common.button} aria-label="Go to Support">
                  <Star size={16} /> Support Portal
                </Link>
                <Link href="/contact" className={cn(common.button, common.buttonSecondary, themed.buttonSecondary)} aria-label="Contact us">
                  <Mail size={16} /> Contact Us
                </Link>
              </div>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Help;
