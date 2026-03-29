// @AI-HINT: Enhanced orchestrator for the multi-step proposal submission flow with improved validation, error handling, and accessibility.
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Send, Loader2, Briefcase, Home } from 'lucide-react';

import api, { APIError } from '@/lib/api';
import { ProposalData, ProposalErrors } from './SubmitProposal.types';

import Button from '@/app/components/atoms/Button/Button';
import StepIndicator from './components/StepIndicator/StepIndicator';
import StepDetails from './components/StepDetails/StepDetails';
import StepTerms from './components/StepTerms/StepTerms';
import StepReview from './components/StepReview/StepReview';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';

import common from './SubmitProposal.common.module.css';
import light from './SubmitProposal.light.module.css';
import dark from './SubmitProposal.dark.module.css';

const STEPS = ['Details', 'Terms', 'Review'] as const;
type Step = typeof STEPS[number];

// Validation constants
const MIN_COVER_LETTER_LENGTH = 100;
const MAX_COVER_LETTER_LENGTH = 5000;
const MIN_HOURLY_RATE = 5;
const MAX_HOURLY_RATE = 500;

const SubmitProposal: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobIdParam = searchParams.get('jobId');

  const [data, setData] = useState<ProposalData>({
    jobId: jobIdParam || '',
    coverLetter: '',
    estimatedHours: null,
    hourlyRate: null,
    availability: 'immediate',
    attachments: [],
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<ProposalErrors>({});
  const [currentStep, setCurrentStep] = useState<Step>('Details');
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const stepIndex = STEPS.indexOf(currentStep);
    return ((stepIndex + 1) / STEPS.length) * 100;
  }, [currentStep]);

  // Calculate estimated total
  const estimatedTotal = useMemo(() => {
    return (data.hourlyRate || 0) * (data.estimatedHours || 0);
  }, [data.hourlyRate, data.estimatedHours]);

  // Auto-save simulation
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (data.coverLetter || data.estimatedHours || data.hourlyRate) {
        setIsSaved(true);
        setLastSaved(new Date());
        // Reset saved indicator after 2 seconds
        setTimeout(() => setIsSaved(false), 2000);
      }
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [data]);

  const updateData = useCallback((update: Partial<ProposalData>) => {
    setData(prev => ({ ...prev, ...update }));
    setIsSaved(false);
  }, []);

  const validateStep = useCallback((step: Step): boolean => {
    const newErrors: ProposalErrors = {};
    switch (step) {
      case 'Details':
        if (!data.coverLetter.trim()) {
          newErrors.coverLetter = 'Cover letter is required.';
        } else if (data.coverLetter.trim().length < MIN_COVER_LETTER_LENGTH) {
          newErrors.coverLetter = `Cover letter must be at least ${MIN_COVER_LETTER_LENGTH} characters.`;
        } else if (data.coverLetter.length > MAX_COVER_LETTER_LENGTH) {
          newErrors.coverLetter = `Cover letter must be less than ${MAX_COVER_LETTER_LENGTH} characters.`;
        }
        if (!data.estimatedHours || data.estimatedHours <= 0) {
          newErrors.estimatedHours = 'Please enter valid estimated hours.';
        }
        if (!data.hourlyRate || data.hourlyRate < MIN_HOURLY_RATE) {
          newErrors.hourlyRate = `Minimum hourly rate is $${MIN_HOURLY_RATE}.`;
        } else if (data.hourlyRate > MAX_HOURLY_RATE) {
          newErrors.hourlyRate = `Maximum hourly rate is $${MAX_HOURLY_RATE}.`;
        }
        break;
      case 'Terms':
        if (!data.termsAccepted) {
          newErrors.termsAccepted = 'You must accept the terms to continue.';
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      const currentIndex = STEPS.indexOf(currentStep);
      if (currentIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentIndex + 1]);
        // Scroll to top on step change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const goToStep = useCallback((step: Step) => {
    const currentIndex = STEPS.indexOf(currentStep);
    const targetIndex = STEPS.indexOf(step);
    if (targetIndex < currentIndex) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof APIError) {
      switch (error.status) {
        case 400:
          return 'Invalid proposal data. Please check your inputs and try again.';
        case 401:
          return 'Your session has expired. Please log in again.';
        case 403:
          return 'You don\'t have permission to submit proposals. Please verify your account.';
        case 404:
          return 'This job is no longer available.';
        case 409:
          return 'You have already submitted a proposal for this job.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Our team has been notified. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }
    return 'Failed to submit proposal. Please check your connection and try again.';
  }, []);

  const onSubmit = async () => {
    for (const step of STEPS) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const bidAmount = estimatedTotal;
      
      await api.portal.freelancer.submitProposal({
        project_id: parseInt(data.jobId),
        cover_letter: data.coverLetter.trim(),
        bid_amount: bidAmount,
        delivery_time: data.estimatedHours || 0
      });
      
      setSubmissionState('success');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Proposal submission error:', err);
      }
      setErrorMessage(getErrorMessage(err));
      setSubmissionState('error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'Details': return <StepDetails data={data} updateData={updateData} errors={errors} />;
      case 'Terms': return <StepTerms data={data} updateData={updateData} errors={errors} />;
      case 'Review': return <StepReview data={data} />;
      default: return null;
    }
  };

  if (submissionState === 'success') {
    return (
      <PageTransition>
        <div className={cn(common.centered_container, themed.centered_container)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className={cn(common.result_card, themed.result_card)}
            role="alert"
            aria-live="polite"
          >
            <CheckCircle className={cn(common.result_icon, common.success_icon, themed.success_icon)} size={56} />
            <h2 className={cn(common.result_title, themed.result_title)}>Proposal Submitted Successfully!</h2>
            <p className={cn(common.result_message, themed.result_message)}>
              Your proposal for <strong>${estimatedTotal.toLocaleString()}</strong> has been submitted. 
              The client will review it and get back to you soon.
            </p>
            <div className={cn(common.result_actions, themed.result_actions)}>
              <Button 
                variant="primary" 
                onClick={() => router.push('/freelancer/jobs')}
              >
                <Briefcase size={18} />
                Browse More Jobs
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/freelancer')}
              >
                <Home size={18} />
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  if (submissionState === 'error') {
    return (
      <PageTransition>
        <div className={cn(common.centered_container, themed.centered_container)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className={cn(common.result_card, themed.result_card)}
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle className={cn(common.result_icon, common.error_icon, themed.error_icon)} size={56} />
            <h2 className={cn(common.result_title, themed.result_title)}>Submission Failed</h2>
            <p className={cn(common.result_message, themed.result_message)}>
              {errorMessage || 'Something went wrong. Please try submitting again.'}
            </p>
            <div className={cn(common.result_actions, themed.result_actions)}>
              <Button variant="primary" onClick={() => setSubmissionState('idle')}>
                <ArrowLeft size={18} />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/freelancer/jobs')}>
                <Briefcase size={18} />
                Browse Jobs
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className={cn(common.main, themed.main)} role="main">
        <div className={common.container}>
          {/* Progress Bar */}
          <div className={cn(common.progressBar, themed.progressBar)}>
            <motion.div 
              className={cn(common.progressFill, themed.progressFill)}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <ScrollReveal>
            <header className={common.header}>
              <div className={cn(common.headerTop, themed.headerTop)}>
                <h1 className={cn(common.title, themed.title)}>Submit a Proposal</h1>
                {/* Auto-save indicator */}
                {isSaved && (
                  <motion.div 
                    className={cn(common.savedIndicator, themed.savedIndicator)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle size={14} />
                    <span>Draft saved</span>
                  </motion.div>
                )}
              </div>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Follow the steps to submit your proposal for this job.
              </p>
              {/* Estimated total preview */}
              {estimatedTotal > 0 && (
                <motion.div 
                  className={cn(common.estimatedTotal, themed.estimatedTotal)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Estimated Total: <strong>${estimatedTotal.toLocaleString()}</strong>
                </motion.div>
              )}
            </header>
          </ScrollReveal>

          <div className={common.step_indicator_container}>
            <StepIndicator steps={STEPS} currentStep={currentStep} />
          </div>

          <div className={common.content_container} role="form" aria-label="Proposal submission form">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className={cn(common.footer, themed.footer)}>
            <div className={cn(common.footerLeft, themed.footerLeft)}>
              {currentStep !== 'Details' && (
                <Button
                  variant="secondary"
                  onClick={prevStep}
                  aria-label="Go to previous step"
                >
                  <ArrowLeft size={18} />
                  Back
                </Button>
              )}
            </div>
            
            <div className={cn(common.footerRight, themed.footerRight)}>
              {currentStep !== 'Review' ? (
                <Button 
                  variant="primary"
                  onClick={nextStep}
                  aria-label={`Go to ${STEPS[STEPS.indexOf(currentStep) + 1]} step`}
                >
                  Next
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  onClick={onSubmit} 
                  disabled={submitting}
                  isLoading={submitting}
                  aria-label="Submit proposal"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className={common.spinner} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Proposal
                    </>
                  )}
                </Button>
              )}
            </div>
          </footer>
        </div>
      </main>
    </PageTransition>
  );
};

export default SubmitProposal;
