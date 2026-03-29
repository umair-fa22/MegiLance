// @AI-HINT: Reusable wizard container - step-by-step interface shell
'use client';

import { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './WizardContainer.common.module.css';
import lightStyles from './WizardContainer.light.module.css';
import darkStyles from './WizardContainer.dark.module.css';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  optional?: boolean;
  validate?: () => Promise<boolean> | boolean;
}

interface WizardContainerProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  canSkip?: boolean;
  isLoading?: boolean;
  saveProgress?: () => void;
  completeBtnText?: string;
  completeBtnIcon?: ReactNode;
  className?: string;
}

const WizardContainer: React.FC<WizardContainerProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  title,
  subtitle,
  canGoBack = true,
  canSkip = false,
  isLoading = false,
  saveProgress,
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const styles = {
    container: cn(commonStyles.container, themeStyles.container, className),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    progressContainer: cn(commonStyles.progressContainer, themeStyles.progressContainer),
    progressBar: cn(commonStyles.progressBar, themeStyles.progressBar),
    progressFill: cn(commonStyles.progressFill, themeStyles.progressFill),
    stepsIndicator: cn(commonStyles.stepsIndicator, themeStyles.stepsIndicator),
    stepItem: cn(commonStyles.stepItem, themeStyles.stepItem),
    stepItemActive: cn(commonStyles.stepItemActive, themeStyles.stepItemActive),
    stepItemCompleted: cn(commonStyles.stepItemCompleted, themeStyles.stepItemCompleted),
    stepCircle: cn(commonStyles.stepCircle, themeStyles.stepCircle),
    stepCircleActive: cn(commonStyles.stepCircleActive, themeStyles.stepCircleActive),
    stepCircleCompleted: cn(commonStyles.stepCircleCompleted, themeStyles.stepCircleCompleted),
    stepLabel: cn(commonStyles.stepLabel, themeStyles.stepLabel),
    stepDescription: cn(commonStyles.stepDescription, themeStyles.stepDescription),
    contentArea: cn(commonStyles.contentArea, themeStyles.contentArea),
    navigation: cn(commonStyles.navigation, themeStyles.navigation),
    buttonGroup: cn(commonStyles.buttonGroup, themeStyles.buttonGroup),
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (currentStepData.validate) {
      const isValid = await currentStepData.validate();
      if (!isValid) return;
    }

    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep && canGoBack) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (canSkip && currentStepData.optional && !isLastStep) {
      onStepChange(currentStep + 1);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className={commonStyles.progressText}>
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      <div className={styles.stepsIndicator}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div 
              key={step.id}
              className={cn(
                styles.stepItem,
                isActive && styles.stepItemActive,
                isCompleted && styles.stepItemCompleted
              )}
            >
              <div 
                className={cn(
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted
                )}
              >
                {isCompleted ? (
                  <Check size={14} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className={styles.stepLabel}>
                <div className={commonStyles.stepLabelTitle}>{step.title}</div>
                {step.description && (
                  <div className={styles.stepDescription}>{step.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.contentArea}>
        {currentStepData.component}
      </div>

      <div className={styles.navigation}>
        <div className={styles.buttonGroup}>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          
          {saveProgress && (
            <Button variant="ghost" onClick={saveProgress} disabled={isLoading}>
              Save Draft
            </Button>
          )}
        </div>

        <div className={styles.buttonGroup}>
          {!isFirstStep && canGoBack && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>
          )}

          {canSkip && currentStepData.optional && !isLastStep && (
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </Button>
          )}

          <Button 
            variant="primary"
            onClick={handleNext}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLastStep ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WizardContainer;
