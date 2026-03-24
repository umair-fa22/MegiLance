// @AI-HINT: Client Hire flow. Orchestrates the multi-step hiring process using modular components.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { saveHireDraft, clearHireDraft } from '@/app/mocks/hires';
import api from '@/lib/api';

import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';

import Button from '@/app/components/Button/Button';
import StepIndicator from './components/StepIndicator/StepIndicator';
import StepFreelancer from './components/StepFreelancer/StepFreelancer';
import StepScope from './components/StepScope/StepScope';
import StepTerms from './components/StepTerms/StepTerms';
import StepReview from './components/StepReview/StepReview';

import common from './Hire.common.module.css';
import light from './Hire.light.module.css';
import dark from './Hire.dark.module.css';

const STEPS = ['Freelancer', 'Scope', 'Terms', 'Review'] as const;
type Step = typeof STEPS[number];

const Hire: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const params = useSearchParams();

  const [step, setStep] = useState<Step>('Freelancer');
  const [freelancerId, setFreelancerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rateType, setRateType] = useState<'Hourly' | 'Fixed'>('Hourly');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');

  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Contract templates
  const contractTemplates = useMemo(() => ({
    'Short-term Project': {
      titleSuffix: '(Short-term)',
      descriptionTemplate: 'Work on a specific project with defined scope and deliverables.',
      rateType: 'Fixed',
      duration: '2-4 weeks',
    },
    'Ongoing Support': {
      titleSuffix: '(Ongoing Support)',
      descriptionTemplate: 'Ongoing technical support and maintenance work as needed.',
      rateType: 'Hourly',
      duration: 'Ongoing',
    },
    'Retainer': {
      titleSuffix: '(Retainer)',
      descriptionTemplate: 'Retainer-based engagement with monthly reserved hours or budget allocation.',
      rateType: 'Hourly',
      duration: 'Monthly',
    },
    'Full-time': {
      titleSuffix: '(Full-time)',
      descriptionTemplate: 'Full-time remote position with defined working hours and responsibilities.',
      rateType: 'Hourly',
      duration: 'Full-time',
    },
  }), []);

  useEffect(() => {
    const f = params.get('freelancer');
    if (f) setFreelancerId(f);
  }, [params]);

  const currentIndex = useMemo(() => STEPS.indexOf(step), [step]);

  const canNext = useMemo(() => {
    switch (step) {
      case 'Freelancer': return Boolean(freelancerId.trim());
      case 'Scope': return title.trim().length > 2 && description.trim().length > 10;
      case 'Terms': return rate.trim().length > 0 && Number(rate) > 0 && Boolean(startDate);
      case 'Review': return true;
      default: return false;
    }
  }, [step, freelancerId, title, description, rate, startDate]);

  const goNext = () => {
    if (canNext && currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };
  
  const saveDraft = () => {
    saveHireDraft({ freelancerId, title, description, rateType, rate: rate ? Number(rate) : null, startDate, status: 'draft' });
    setLiveMessage('Draft saved.');
  };

  const applyContractTemplate = (templateName: keyof typeof contractTemplates) => {
    const template = contractTemplates[templateName];
    setTitle(prev => prev + ` ${template.titleSuffix}`.trim());
    setDescription(template.descriptionTemplate);
    setRateType(template.rateType as 'Fixed' | 'Hourly');
    setLiveMessage(`Applied "${templateName}" template.`);
  };

  const resetForm = () => {
    clearHireDraft();
    setFreelancerId('');
    setTitle('');
    setDescription('');
    setRateType('Hourly');
    setRate('');
    setStartDate('');
    setStep('Freelancer');
    setLiveMessage('Form cleared.');
  };

  const handleSubmit = async () => {
    if (!canNext) return;
    setSubmitting(true);
    setLiveMessage('Sending hire request…');
    try {
      // Extract numeric ID if prefixed
      const fId = parseInt(freelancerId.toString().replace('freelancer_', ''));
      
      const res: any = await api.contracts.createDirect({
        freelancer_id: isNaN(fId) ? 0 : fId,
        title,
        description,
        rate_type: rateType,
        rate: Number(rate),
        start_date: startDate
      });
      
      setLiveMessage(`Success: Contract created (id: ${res.id})`);
      resetForm();
    } catch (e: any) {
      setLiveMessage(`Error: ${e.message || 'Failed to create contract'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'Freelancer': return <StepFreelancer freelancerId={freelancerId} setFreelancerId={setFreelancerId} />;
      case 'Scope': return <StepScope title={title} setTitle={setTitle} description={description} setDescription={setDescription} />;
      case 'Terms': return <StepTerms rateType={rateType} setRateType={setRateType} rate={rate} setRate={setRate} startDate={startDate} setStartDate={setStartDate} />;
      case 'Review': return <StepReview freelancerId={freelancerId} title={title} rateType={rateType} rate={rate} startDate={startDate} />;
    }
  };

  return (
    <PageTransition>
      <main className={cn(common.page, themed.page)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <h1 className={cn(common.title, themed.title)}>Hire a Freelancer</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>Complete the steps to send a hiring request.</p>
            </header>
          </ScrollReveal>

          <div className={common.stepIndicatorContainer}>
            <StepIndicator steps={STEPS} currentStep={step} />
        </div>

        <form className={common.form} onSubmit={(e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>

            {liveMessage && <div className={cn(common.liveRegion, themed.liveRegion)} role="status">{liveMessage}</div>}

            <div className={common.actions}>
                <div className={common.leftActions}>
                    <Button variant="ghost" onClick={saveDraft}>Save Draft</Button>
                    <Button variant="ghost" onClick={resetForm}>Reset</Button>
                </div>
                <div className={common.rightActions}>
                    <Button variant="secondary" onClick={goBack} disabled={currentIndex === 0}>Back</Button>
                    {step !== 'Review' ? (
                        <Button variant="primary" onClick={goNext} disabled={!canNext}>Continue</Button>
                    ) : (
                        <Button variant="success" onClick={handleSubmit} disabled={submitting || !canNext} isLoading={submitting}>
                            {submitting ? 'Sending...' : 'Send Request'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Contract Template Suggestions (during Scope/Terms) */}
            {(step === 'Scope' || step === 'Terms') && (
              <div className={cn(common.templateSuggestions, themed.templateSuggestions)}>
                <p className={cn(common.templateHint, themed.templateHint)}>Quick templates:</p>
                <div className={common.templateButtonGroup}>
                  {Object.keys(contractTemplates).map((templateName) => (
                    <Button
                      key={templateName}
                      variant="ghost"
                      size="sm"
                      onClick={() => applyContractTemplate(templateName as keyof typeof contractTemplates)}
                      className={common.templateButton}
                    >
                      {templateName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
        </form>
      </div>
      </main>
    </PageTransition>
  );
};

export default Hire;
