// @AI-HINT: Freelancer Support page - contact form with priority, ticket history, FAQ search, quick links
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Accordion, { AccordionItem } from '@/app/components/Accordion/Accordion';
import Loading from '@/app/components/Loading/Loading';
import Badge from '@/app/components/Badge/Badge';
import { apiFetch } from '@/lib/api/core';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/';
import {
  HelpCircle,
  Send,
  Search,
  Clock,
  BookOpen,
  MessageCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import commonStyles from './SupportPage.common.module.css';
import lightStyles from './SupportPage.light.module.css';
import darkStyles from './SupportPage.dark.module.css';

// Default FAQ items as fallback
const defaultFaqItems = [
  {
    question: 'How do I withdraw my earnings?',
    answer: 'You can withdraw your earnings from the /freelancer/withdraw page. You will need a valid crypto wallet address. Withdrawals are processed in USDC.'
  },
  {
    question: 'What are the platform fees?',
    answer: 'MegiLance charges a 10% service fee on all completed projects. This fee is automatically deducted from the payment before it is credited to your account.'
  },
  {
    question: 'How do disputes work?',
    answer: 'If there is a disagreement with a client, you can raise a dispute from the contract page. A decentralized arbitration service will mediate the dispute, and their decision is final.'
  },
  {
    question: 'How can I improve my Freelancer Rank?',
    answer: 'Your rank is determined by factors like job success rate, client reviews, and on-time delivery. Consistently delivering high-quality work is the best way to improve your rank.'
  }
];

interface FaqItem {
  question: string;
  answer: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const quickLinks = [
  { href: '/freelancer/support/knowledge-base', icon: BookOpen, label: 'Knowledge Base', desc: 'Browse articles & guides' },
  { href: '/freelancer/help', icon: HelpCircle, label: 'Help Center', desc: 'Common questions answered' },
  { href: '/freelancer/messages', icon: MessageCircle, label: 'Messages', desc: 'Chat with your clients' },
  { href: '/docs', icon: FileText, label: 'Documentation', desc: 'Platform documentation' },
];

const SupportPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(defaultFaqItems);
  const [faqSearch, setFaqSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  useEffect(() => {
    loadFaqs();
    loadTickets();
  }, []);

  const loadFaqs = async () => {
    try {
      const data = await apiFetch<any>('/support/faqs').catch(() => null);
      if (data?.faqs?.length > 0) {
        setFaqItems(data.faqs);
      }
    } catch {
      // Use default FAQs on error
    }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const { supportTicketsApi } = await import('@/lib/api');
      const data = await (supportTicketsApi as any).list?.() || await apiFetch<any>('/support/tickets').catch(() => null);
      if (Array.isArray(data)) {
        setTickets(data.slice(0, 5));
      } else if (data?.tickets) {
        setTickets(data.tickets.slice(0, 5));
      }
    } catch {
      // No tickets to show
    } finally {
      setTicketsLoading(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqItems;
    const q = faqSearch.toLowerCase();
    return faqItems.filter(
      item => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [faqItems, faqSearch]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const { supportTicketsApi } = await import('@/lib/api');
      await supportTicketsApi.create({
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });
      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      setPriority('medium');
      loadTickets();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      setSubmitError(true);
      setTimeout(() => setSubmitError(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTicketStatusIcon = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <Clock size={14} />;
      case 'resolved': return <CheckCircle2 size={14} />;
      case 'closed': return <XCircle size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  }, []);

  const getTicketStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    switch (status.toLowerCase()) {
      case 'open': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'warning';
    }
  };

  if (!mounted) return <Loading />;

  return (
    <PageTransition>
      <div className={cn(styles.pageWrapper)}>
        <ScrollReveal>
          <header className={cn(styles.header)}>
            <h1>Support Center</h1>
            <p>We&apos;re here to help. Find answers or get in touch with our team.</p>
          </header>
        </ScrollReveal>

        {/* Quick Links */}
        <ScrollReveal delay={0.05}>
          <StaggerContainer className={cn(styles.quickLinks)}>
            {quickLinks.map((link) => (
              <StaggerItem key={link.href}>
                <Link href={link.href} className={cn(styles.quickLink)}>
                  <link.icon size={20} className={styles.quickLinkIcon} />
                  <div>
                    <span className={styles.quickLinkLabel}>{link.label}</span>
                    <span className={styles.quickLinkDesc}>{link.desc}</span>
                  </div>
                  <ChevronRight size={16} className={styles.quickLinkArrow} />
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>

        <main className={cn(styles.mainGrid)}>
          {/* Contact Form */}
          <ScrollReveal delay={0.1}>
            <div className={cn(styles.card)} role="region" aria-label="Contact support">
              <h2 className={cn(styles.cardTitle)}>
                <Send size={20} /> Contact Support
              </h2>
              {submitSuccess && (
                <div className={cn(styles.successMessage)}>
                  Your ticket has been submitted successfully! We&apos;ll get back to you soon.
                </div>
              )}
              {submitError && (
                <div className={cn(styles.errorMessage)}>
                  Failed to submit ticket. Please try again.
                </div>
              )}
              <form className={cn(styles.form)} onSubmit={handleSubmitTicket}>
                <Input
                  id="subject"
                  label="Subject"
                  placeholder="e.g., Issue with a contract"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <div className={styles.priorityGroup}>
                  <label className={styles.priorityLabel}>Priority</label>
                  <div className={styles.priorityOptions}>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          styles.priorityBtn,
                          styles[`priority${p.value.charAt(0).toUpperCase() + p.value.slice(1)}`],
                          priority === p.value && styles.priorityActive
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="message"
                  label="Message"
                  placeholder="Describe your issue in detail..."
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <Button 
                  variant="primary" 
                  type="submit"
                  aria-label="Submit support ticket"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                  iconBefore={<Send size={16} />}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </div>
          </ScrollReveal>

          <div className={styles.rightColumn}>
            {/* FAQ Section */}
            <ScrollReveal delay={0.15}>
              <div className={cn(styles.card)} role="region" aria-label="Frequently asked questions">
                <h2 className={cn(styles.cardTitle)}>
                  <HelpCircle size={20} /> Frequently Asked Questions
                </h2>
                <div className={styles.faqSearch}>
                  <Search size={16} className={styles.faqSearchIcon} />
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className={styles.faqSearchInput}
                    aria-label="Search FAQs"
                  />
                </div>
                <span className={cn(styles.srOnly)} aria-live="polite">
                  {filteredFaqs.length} FAQ item{filteredFaqs.length === 1 ? '' : 's'}
                </span>
                {filteredFaqs.length === 0 ? (
                  <p className={styles.noResults}>No matching questions found. Try a different search term.</p>
                ) : (
                  <Accordion>
                    {filteredFaqs.map((item, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} title={item.question}>
                        <p>{item.answer}</p>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </ScrollReveal>

            {/* Recent Tickets */}
            <ScrollReveal delay={0.2}>
              <div className={cn(styles.card)} role="region" aria-label="Recent tickets">
                <h2 className={cn(styles.cardTitle)}>
                  <Clock size={20} /> Recent Tickets
                </h2>
                {ticketsLoading ? (
                  <Loading />
                ) : tickets.length === 0 ? (
                  <p className={styles.noResults}>No tickets submitted yet. Use the form to create one.</p>
                ) : (
                  <div className={styles.ticketList}>
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className={styles.ticketItem}>
                        <div className={styles.ticketInfo}>
                          <span className={styles.ticketSubject}>{ticket.subject}</span>
                          <span className={styles.ticketDate}>
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.ticketMeta}>
                          <Badge variant={getTicketStatusVariant(ticket.status)}>
                            {getTicketStatusIcon(ticket.status)} {ticket.status}
                          </Badge>
                          <span className={cn(styles.ticketPriority, styles[`priority${ticket.priority?.charAt(0).toUpperCase()}${ticket.priority?.slice(1)}`])}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default SupportPage;
