// @AI-HINT: Premium Contact page: validated form, a11y, theme-aware styles, and animated entry.
'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Textarea from '@/app/components/Textarea/Textarea';
import { useToast } from '@/app/components/Toast/use-toast';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { ContactIllustration } from '@/app/components/Illustrations/Illustrations';
import illustrationStyles from '@/app/components/Illustrations/Illustrations.common.module.css';

import common from './Contact.common.module.css';
import light from './Contact.light.module.css';
import dark from './Contact.dark.module.css';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  topic: z.enum(['support', 'sales', 'partnerships']),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  { icon: Mail, text: 'fyp.megilance@comsats.edu.pk', href: 'mailto:fyp.megilance@comsats.edu.pk' },
  { icon: Phone, text: '+92 (42) 111-001-007', href: 'tel:+9242111001007' },
  { icon: MapPin, text: 'COMSATS University Islamabad, Lahore Campus', href: 'https://lahore.comsats.edu.pk/' },
];

const Contact: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const { toast } = useToast();
  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? dark : light;
    return {
      page: cn(common.page, themeStyles.page),
      container: cn(common.container),
      header: cn(common.header, themeStyles.header),
      title: cn(common.title, themeStyles.title),
      subtitle: cn(common.subtitle, themeStyles.subtitle),
      contentGrid: cn(common.contentGrid),
      infoPanel: cn(common.infoPanel, themeStyles.infoPanel),
      infoItem: cn(common.infoItem, themeStyles.infoItem),
      infoIcon: cn(common.infoIcon, themeStyles.infoIcon),
      infoText: cn(common.infoText, themeStyles.infoText),
      formPanel: cn(common.formPanel, themeStyles.formPanel),
      form: cn(common.form),
    };
  }, [resolvedTheme]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Send contact form to backend
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      toast({
        title: 'Message Sent!',
        description: "Thanks for reaching out. We'll get back to you shortly.",
        variant: 'success',
      });
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'danger',
      });
    }
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

      <div className={styles.page}>
        <div className={styles.container}>
          <ScrollReveal>
            <header className={styles.header}>
              <div className={common.heroRow}>
                <div className={common.heroContent}>
                  <h1 className={styles.title}>Get in Touch</h1>
                  <p className={styles.subtitle}>
                    Have a question or a project in mind? We&apos;d love to hear from you.
                  </p>
                </div>
                <ContactIllustration className={illustrationStyles.heroIllustrationSmall} />
              </div>
            </header>
          </ScrollReveal>

          <StaggerContainer className={styles.contentGrid}>
            <StaggerItem className={styles.infoPanel}>
              {contactInfo.map((item, index) => (
                <a key={index} href={item.href} className={styles.infoItem}>
                  <item.icon className={styles.infoIcon} />
                  <span className={styles.infoText}>{item.text}</span>
                </a>
              ))}
            </StaggerItem>

            <StaggerItem className={styles.formPanel}>
              <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
                <Input
                  id="name"
                  label="Full Name"
                  placeholder="John Doe"
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={isSubmitting}
                />
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                />
                <Select
                  id="topic"
                  label="Topic"
                  {...register('topic')}
                  disabled={isSubmitting}
                  defaultValue=""
                  options={[
                    { value: '', label: 'Select a topic...' },
                    { value: 'support', label: 'General Support' },
                    { value: 'sales', label: 'Sales Inquiry' },
                    { value: 'partnerships', label: 'Partnerships' },
                  ]}
                />
                <Textarea
                  id="message"
                  label="Your Message"
                  placeholder="Tell us about your project or question..."
                  {...register('message')}
                  error={errors.message?.message}
                  disabled={isSubmitting}
                  rows={5}
                />
                <Button type="submit" isLoading={isSubmitting} iconBefore={<Send size={18} />}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
