// @AI-HINT: Reusable multi-step form component with animated transitions, per-step Zod validation, progress tracking, and success animations. The gold standard for wizard-style forms across the platform.
'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { ZodSchema, ZodError } from 'zod';
import Button from '@/app/components/Button/Button';

import commonStyles from './MultiStepForm.common.module.css';
import lightStyles from './MultiStepForm.light.module.css';
import darkStyles from './MultiStepForm.dark.module.css';

// === Types ===

export interface StepConfig {
  id: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  /** Zod schema to validate this step's data slice */
  validationSchema?: ZodSchema;
  /** Which keys from form data this step owns (for partial validation) */
  fields?: string[];
  /** Whether this step is optional (can be skipped) */
  optional?: boolean;
}

export interface MultiStepFormProps<T extends Record<string, unknown>> {
  steps: StepConfig[];
  /** Render function for each step - receives current data, errors, and an updater */
  children: (props: StepRenderProps<T>) => React.ReactNode;
  /** Initial form data */
  initialData: T;
  /** Called on final submit with validated data */
  onSubmit: (data: T) => Promise<void> | void;
  /** Called whenever step changes */
  onStepChange?: (step: number, direction: 'forward' | 'backward') => void;
  /** Custom submit button text */
  submitLabel?: string;
  /** Show success animation on completion */
  showSuccessAnimation?: boolean;
  /** Success message to show */
  successTitle?: string;
  successMessage?: string;
  /** Allow clicking completed steps to navigate back */
  allowStepNavigation?: boolean;
  /** Custom action slot (replaces default navigation buttons) */
  renderActions?: (props: ActionRenderProps) => React.ReactNode;
  /** Additional class name */
  className?: string;
}

export interface StepRenderProps<T> {
  data: T;
  updateData: (updates: Partial<T>) => void;
  errors: Record<string, string>;
  currentStep: number;
  stepConfig: StepConfig;
  isFirstStep: boolean;
  isLastStep: boolean;
  clearFieldError: (field: string) => void;
}

export interface ActionRenderProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (step: number) => void;
}

// === Animation Variants ===

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.98,
  }),
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 },
  },
};

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { delay: 0.2, duration: 0.5, ease: 'easeInOut' as const },
  },
};

// === Component ===

function MultiStepForm<T extends Record<string, unknown>>({
  steps,
  children,
  initialData,
  onSubmit,
  onStepChange,
  submitLabel = 'Submit',
  showSuccessAnimation = true,
  successTitle = 'Success!',
  successMessage = 'Your submission has been completed.',
  allowStepNavigation = true,
  renderActions,
  className,
}: MultiStepFormProps<T>) {
  const { resolvedTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shakeStep, setShakeStep] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const stepConfig = steps[currentStep];

  // Merge styles helper
  const s = useCallback(
    (key: string) => cn((commonStyles as any)[key], (themeStyles as any)[key]),
    [themeStyles]
  );

  // Update form data
  const updateData = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear a specific field error on user interaction
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Validate current step using Zod schema
  const validateCurrentStep = useCallback((): boolean => {
    const step = steps[currentStep];
    if (!step.validationSchema) return true;

    // Extract only this step's fields for validation
    let dataSlice: Record<string, unknown> = formData;
    if (step.fields) {
      dataSlice = {};
      for (const field of step.fields) {
        dataSlice[field] = (formData as any)[field];
      }
    }

    try {
      step.validationSchema.parse(dataSlice);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.');
          if (!newErrors[key]) {
            newErrors[key] = issue.message;
          }
        }
        setErrors(newErrors);

        // Trigger shake animation
        setShakeStep(true);
        setTimeout(() => setShakeStep(false), 500);
      }
      return false;
    }
  }, [currentStep, formData, steps]);

  // Navigate to next step
  const goNext = useCallback(async () => {
    if (!validateCurrentStep()) return;

    if (isLastStep) {
      // Submit
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
        if (showSuccessAnimation) {
          setShowSuccess(true);
        }
      } catch (err: any) {
        setErrors({ _form: err?.message || 'Submission failed. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setDirection(1);
    setErrors({});
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    onStepChange?.(nextStep, 'forward');

    // Scroll to top of form
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentStep, formData, isLastStep, onStepChange, onSubmit, showSuccessAnimation, validateCurrentStep]);

  // Navigate to previous step
  const goPrev = useCallback(() => {
    if (isFirstStep) return;
    setDirection(-1);
    setErrors({});
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    onStepChange?.(prevStep, 'backward');
  }, [currentStep, isFirstStep, onStepChange]);

  // Navigate to specific step (only completed or current)
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (!allowStepNavigation) return;
      if (stepIndex > currentStep && !completedSteps.has(stepIndex - 1)) return;
      if (stepIndex === currentStep) return;

      setDirection(stepIndex > currentStep ? 1 : -1);
      setErrors({});
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex, stepIndex > currentStep ? 'forward' : 'backward');
    },
    [allowStepNavigation, completedSteps, currentStep, onStepChange]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext]);

  // Step render props
  const stepRenderProps = useMemo(
    (): StepRenderProps<T> => ({
      data: formData,
      updateData,
      errors,
      currentStep,
      stepConfig,
      isFirstStep,
      isLastStep,
      clearFieldError,
    }),
    [formData, updateData, errors, currentStep, stepConfig, isFirstStep, isLastStep, clearFieldError]
  );

  // Action render props
  const actionRenderProps = useMemo(
    (): ActionRenderProps => ({
      currentStep,
      totalSteps,
      isFirstStep,
      isLastStep,
      isSubmitting,
      goNext,
      goPrev,
      goToStep,
    }),
    [currentStep, totalSteps, isFirstStep, isLastStep, isSubmitting, goNext, goPrev, goToStep]
  );

  return (
    <div className={cn(commonStyles.wizard, className)}>
      {/* Progress Header */}
      <div className={commonStyles.progressHeader}>
        {/* Progress Bar */}
        <div className={s('progressBarTrack')}>
          <motion.div
            className={s('progressBarFill')}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Steps Indicator */}
        <div className={commonStyles.stepsRow} role="tablist" aria-label="Form steps">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const canNavigate = allowStepNavigation && (isCompleted || index <= currentStep);

            return (
              <React.Fragment key={step.id}>
                <button
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : ''}`}
                  className={cn(
                    commonStyles.stepItem,
                    !canNavigate && commonStyles.stepItemDisabled
                  )}
                  onClick={() => canNavigate && goToStep(index)}
                  disabled={!canNavigate}
                >
                  <motion.div
                    className={cn(
                      s('stepCircle'),
                      isActive && s('stepCircleActive'),
                      isCompleted && !isActive && s('stepCircleCompleted')
                    )}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted && !isActive ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <CheckCircle size={18} />
                        </motion.div>
                      ) : step.icon ? (
                        <motion.div
                          key="icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          {step.icon}
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          {index + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span
                    className={cn(
                      s('stepLabel'),
                      isActive && (themeStyles as any).stepLabelActive,
                      isCompleted && !isActive && (themeStyles as any).stepLabelCompleted
                    )}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={s('stepConnector')}>
                    <motion.div
                      className={s('stepConnectorFill')}
                      initial={false}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div
        ref={contentRef}
        className={cn(commonStyles.stepContent, shakeStep && commonStyles.shakeError)}
        role="tabpanel"
        aria-label={`Step ${currentStep + 1}: ${stepConfig.title}`}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            className={commonStyles.stepPanel}
          >
            {children(stepRenderProps)}
          </motion.div>
        </AnimatePresence>

        {/* Validation summary */}
        <AnimatePresence>
          {errors._form && (
            <motion.div
              className={s('validationSummary')}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
            >
              <AlertCircle size={18} className={s('validationIcon')} />
              <span>{errors._form}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Actions */}
      {renderActions ? (
        renderActions(actionRenderProps)
      ) : (
        <div className={s('actions')}>
          <div className={commonStyles.actionsLeft}>
            {!isFirstStep && (
              <Button
                type="button"
                variant="secondary"
                onClick={goPrev}
                disabled={isSubmitting}
              >
                <ChevronLeft size={16} />
                Back
              </Button>
            )}
          </div>

          <span className={s('stepCounter')}>
            {currentStep + 1} of {totalSteps}
          </span>

          <div className={commonStyles.actionsRight}>
            {stepConfig.optional && !isLastStep && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDirection(1);
                  setErrors({});
                  setCurrentStep((prev) => prev + 1);
                }}
                disabled={isSubmitting}
              >
                Skip
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={goNext}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isLastStep ? submitLabel : 'Continue'}
              {!isLastStep && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      )}

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className={s('successOverlay')}
            variants={successVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className={s('successIcon')}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M20 6L9 17l-5-5"
                  variants={checkmarkVariants}
                  initial="hidden"
                  animate="visible"
                />
              </svg>
            </motion.div>
            <motion.h3
              className={s('successTitle')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {successTitle}
            </motion.h3>
            <motion.p
              className={s('successMessage')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {successMessage}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MultiStepForm;
