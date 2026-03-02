// @AI-HINT: This page provides support resources for freelancers, including a contact form and an FAQ section. Fetches FAQs from API with fallback to static data.
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Accordion, { AccordionItem } from '@/app/components/Accordion/Accordion';
import { apiFetch } from '@/lib/api/core';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
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

const SupportPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [faqItems, setFaqItems] = useState<FaqItem[]>(defaultFaqItems);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      const { supportTicketsApi } = await import('@/lib/api');
      // Try to fetch FAQs from API if endpoint exists
      const data = await apiFetch<any>('/support/faqs').catch(() => null);
      if (data?.faqs?.length > 0) {
        setFaqItems(data.faqs);
      }
    } catch (error) {
      // Use default FAQs on error - no action needed
    }
  };

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
        priority: 'medium'
      });
      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      setSubmitError(true);
      setTimeout(() => setSubmitError(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className={cn(styles.pageWrapper)}>
        <ScrollReveal>
          <header className={cn(styles.header)}>
            <h1>Support Center</h1>
            <p>We&apos;re here to help. Find answers or get in touch with our team.</p>
          </header>
        </ScrollReveal>

        <main className={cn(styles.mainGrid)}>
          <ScrollReveal delay={0.1}>
            <div className={cn(styles.card)} role="region" aria-label="Contact support" title="Contact support">
              <h2 className={cn(styles.cardTitle)}>Contact Support</h2>
              {submitSuccess && (
                <div className={cn(styles.successMessage)}>
                  ✅ Your ticket has been submitted successfully! We&apos;ll get back to you soon.
                </div>
              )}
              {submitError && (
                <div className={cn(styles.errorMessage)}>
                  ❌ Failed to submit ticket. Please try again.
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
                  title="Submit support ticket" 
                  aria-label="Submit support ticket"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className={cn(styles.card)} role="region" aria-label="Frequently asked questions" title="Frequently asked questions">
              <h2 className={cn(styles.cardTitle)}>Frequently Asked Questions</h2>
              <span className={cn(styles.srOnly)} aria-live="polite">{faqItems.length} FAQ item{faqItems.length === 1 ? '' : 's'}</span>
              <Accordion>
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} title={item.question}>
                    <p>{item.answer}</p>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollReveal>
        </main>
      </div>
    </PageTransition>
  );
};

export default SupportPage;

