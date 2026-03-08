// @AI-HINT: Project creation wizard - guides clients through posting a project. Enhanced with Zod validation, animated transitions, and premium animations.
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { 
  FileText, Banknote, Users, CheckCircle,
  ArrowRight, ArrowLeft, Clock,
  Code, Smartphone, Paintbrush, PenLine, Megaphone, TrendingUp, Server, MoreHorizontal
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea';
import Select from '@/app/components/Select/Select';
import TagsInput from '@/app/components/TagsInput/TagsInput';
import FileUpload from '@/app/components/FileUpload/FileUpload';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import ProjectAICopilot from './ProjectAICopilot';
import FeasibilityAnalyzer from '../FeasibilityAnalyzer/FeasibilityAnalyzer';

import commonStyles from './ProjectWizard.common.module.css';
import lightStyles from './ProjectWizard.light.module.css';
import darkStyles from './ProjectWizard.dark.module.css';

// === Zod Validation Schemas ===

const step1Schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be under 200 characters'),
  description: z.string().min(100, 'Description must be at least 100 characters').max(5000, 'Description must be under 5000 characters'),
  category: z.string().min(1, 'Please select a category'),
});

const step2Schema = z.object({
  budgetMin: z.string().refine((val) => parseFloat(val) > 0, 'Budget minimum must be greater than 0'),
  budgetMax: z.string().refine((val) => parseFloat(val) > 0, 'Budget maximum must be greater than 0'),
  duration: z.string().min(1, 'Please select project duration'),
}).refine((data) => parseFloat(data.budgetMin) <= parseFloat(data.budgetMax), {
  message: 'Maximum must be greater than minimum',
  path: ['budgetMax'],
});

const step3Schema = z.object({
  skills: z.array(z.string()).min(2, 'Add at least 2 required skills'),
  experienceLevel: z.string().min(1, 'Select required experience level'),
});

const stepSchemas = [step1Schema, step2Schema, step3Schema, null]; // null = review step (no validation)

// === Slide animation variants ===
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.97,
    filter: 'blur(4px)',
  }),
};

interface ProjectData {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetMin: string;
  budgetMax: string;
  budgetType: 'fixed' | 'hourly';
  experienceLevel: string;
  duration: string;
  attachments: string[];
}

const steps = [
  { id: 1, title: 'Project Details', icon: FileText },
  { id: 2, title: 'Budget & Timeline', icon: Banknote },
  { id: 3, title: 'Skills Required', icon: Users },
  { id: 4, title: 'Review & Post', icon: CheckCircle },
];

const categories = [
  { value: 'WEB_DEVELOPMENT', label: 'Web Development', icon: Code },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Development', icon: Smartphone },
  { value: 'DESIGN', label: 'Design & Creative', icon: Paintbrush },
  { value: 'WRITING', label: 'Writing & Content', icon: PenLine },
  { value: 'MARKETING', label: 'Marketing & Sales', icon: Megaphone },
  { value: 'DATA_SCIENCE', label: 'Data Science & Analytics', icon: TrendingUp },
  { value: 'DEVOPS', label: 'DevOps & Cloud', icon: Server },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal },
];

const ProjectWizard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [shakeError, setShakeError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    category: '',
    skills: [],
    budgetMin: '',
    budgetMax: '',
    budgetType: 'fixed',
    experienceLevel: '',
    duration: '',
    attachments: [],
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    progressBar: cn(commonStyles.progressBar, themeStyles.progressBar),
    progressFill: cn(commonStyles.progressFill, themeStyles.progressFill),
    stepsIndicator: cn(commonStyles.stepsIndicator, themeStyles.stepsIndicator),
    step: cn(commonStyles.step, themeStyles.step),
    stepActive: cn(commonStyles.stepActive, themeStyles.stepActive),
    stepCompleted: cn(commonStyles.stepCompleted, themeStyles.stepCompleted),
    stepIcon: cn(commonStyles.stepIcon, themeStyles.stepIcon),
    stepTitle: cn(commonStyles.stepTitle, themeStyles.stepTitle),
    content: cn(commonStyles.content, themeStyles.content),
    formGrid: cn(commonStyles.formGrid, themeStyles.formGrid),
    actions: cn(commonStyles.actions, themeStyles.actions),
    budgetToggle: cn(commonStyles.budgetToggle, themeStyles.budgetToggle),
    budgetOption: cn(commonStyles.budgetOption, themeStyles.budgetOption),
    budgetOptionActive: cn(commonStyles.budgetOptionActive, themeStyles.budgetOptionActive),
    reviewSection: cn(commonStyles.reviewSection, themeStyles.reviewSection),
    reviewItem: cn(commonStyles.reviewItem, themeStyles.reviewItem),
    reviewLabel: cn(commonStyles.reviewLabel, themeStyles.reviewLabel),
    reviewValue: cn(commonStyles.reviewValue, themeStyles.reviewValue),
    backgroundOverlay: commonStyles.backgroundOverlay,
    orbTopRight: commonStyles.orbTopRight,
    orbBottomLeft: commonStyles.orbBottomLeft,
    particlesLayer: commonStyles.particlesLayer,
    floatingCubeWrapper: commonStyles.floatingCubeWrapper,
    floatingSphereWrapper: commonStyles.floatingSphereWrapper,
    fullWidth: commonStyles.fullWidth,
    fullWidthSpaced: commonStyles.fullWidthSpaced,
    budgetLabel: commonStyles.budgetLabel,
    inlineIcon: commonStyles.inlineIcon,
    trailingIcon: commonStyles.trailingIcon,
    reviewTitle: cn(commonStyles.reviewTitle, themeStyles.reviewTitle),
    errorMessage: cn(commonStyles.errorMessage, themeStyles.errorMessage),
  };

  const progress = (currentStep / steps.length) * 100;

  const getDurationDays = (duration: string): number => {
    switch (duration) {
      case 'less-than-week': return 5;
      case '1-2-weeks': return 10;
      case '2-4-weeks': return 20;
      case '1-3-months': return 60;
      case '3-6-months': return 120;
      case 'more-than-6-months': return 180;
      default: return 30;
    }
  };

  const handleAIApply = (data: any) => {
    setProjectData(prev => ({
      ...prev,
      title: data.title || prev.title,
      description: data.description || prev.description,
      skills: data.skills || prev.skills,
      category: data.category || prev.category,
      budgetMin: data.budgetMin || prev.budgetMin,
      budgetMax: data.budgetMax || prev.budgetMax,
    }));
  };

  // Clear a specific field error on edit
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleNext = () => {
    if (validateStep()) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      if (currentStep < steps.length) {
        setDirection(1);
        setErrors({});
        setCurrentStep(currentStep + 1);
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep) return;
    if (stepId < currentStep || completedSteps.has(stepId)) {
      setDirection(stepId > currentStep ? 1 : -1);
      setErrors({});
      setCurrentStep(stepId);
    }
  };

  const validateStep = (): boolean => {
    const schema = stepSchemas[currentStep - 1];
    if (!schema) return true; // Review step

    // Extract the fields this step needs
    const dataSlice: Record<string, unknown> = {};
    if (currentStep === 1) {
      dataSlice.title = projectData.title;
      dataSlice.description = projectData.description;
      dataSlice.category = projectData.category;
    } else if (currentStep === 2) {
      dataSlice.budgetMin = projectData.budgetMin;
      dataSlice.budgetMax = projectData.budgetMax;
      dataSlice.duration = projectData.duration;
    } else if (currentStep === 3) {
      dataSlice.skills = projectData.skills;
      dataSlice.experienceLevel = projectData.experienceLevel;
    }

    const result = schema.safeParse(dataSlice);
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.');
      if (!newErrors[key]) {
        newErrors[key] = issue.message;
      }
    }
    setErrors(newErrors);

    // Trigger shake animation
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const project: any = await api.projects.create({
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        skills: projectData.skills,
        budget_min: parseFloat(projectData.budgetMin),
        budget_max: parseFloat(projectData.budgetMax),
        budget_type: projectData.budgetType,
        experience_level: projectData.experienceLevel,
        estimated_duration: projectData.duration,
        status: 'open',
      });

      router.push(`/client/projects/${project.id}?new=true`);
    } catch (error: any) {
      const message = error?.message || 'Failed to create project';
      if (message.includes('profile')) {
        setErrors({ general: 'Please complete your profile before posting a project.' });
      } else if (message.includes('401') || message.includes('unauthorized')) {
        setErrors({ general: 'Please log in to post a project.' });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Background Elements */}
        <div className={styles.backgroundOverlay}>
           <AnimatedOrb variant="blue" size={400} blur={80} opacity={0.15} className={styles.orbTopRight} />
           <AnimatedOrb variant="purple" size={300} blur={60} opacity={0.1} className={styles.orbBottomLeft} />
           <ParticlesSystem count={15} className={styles.particlesLayer} />
           <div className={styles.floatingCubeWrapper}>
             <FloatingCube size={40} />
           </div>
           <div className={styles.floatingSphereWrapper}>
             <FloatingSphere size={30} variant="gradient" />
           </div>
        </div>

        <ScrollReveal>
          <div className={styles.header}>
            <h1 className={styles.title}>Post a Project</h1>
            <p className={styles.subtitle}>
              Tell us about your project and find the perfect freelancer
            </p>
          </div>
        </ScrollReveal>

        {/* Progress Bar */}
        <ScrollReveal delay={0.1}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          {/* Steps Indicator */}
          <div className={styles.stepsIndicator}>
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              const canClick = step.id < currentStep || isCompleted;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={cn(
                    styles.step,
                    isActive && styles.stepActive,
                    isCompleted && styles.stepCompleted
                  )}
                  onClick={() => canClick && handleStepClick(step.id)}
                  style={{ cursor: canClick ? 'pointer' : 'default' }}
                  aria-label={`Step ${step.id}: ${step.title}${isCompleted ? ' (completed)' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <motion.div
                    className={styles.stepIcon}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <CheckCircle size={24} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <step.icon size={24} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <div className={styles.stepTitle}>{step.title}</div>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Step Content */}
        <div
          ref={contentRef}
          className={cn(styles.content, shakeError && commonStyles.shakeError)}
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
                x: { type: 'spring', stiffness: 280, damping: 28 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
                filter: { duration: 0.25 },
              }}
            >
          {currentStep === 1 && (
            <div className={styles.formGrid}>
              <StaggerItem className={styles.fullWidth}>
                <Input
                  name="title"
                  label="Project Title"
                  placeholder="e.g., Build a responsive e-commerce website"
                  value={projectData.title}
                  onChange={(e) => {
                    setProjectData({ ...projectData, title: e.target.value });
                    clearFieldError('title');
                  }}
                  error={errors.title}
                  helpText={`${projectData.title.length} characters (minimum 10)`}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Textarea
                  name="description"
                  label="Project Description"
                  placeholder="Describe your project in detail. What needs to be done? What are your requirements? What is the expected outcome?"
                  value={projectData.description}
                  onChange={(e) => {
                    setProjectData({ ...projectData, description: e.target.value });
                    clearFieldError('description');
                  }}
                  error={errors.description}
                  rows={8}
                  helpText={`${projectData.description.length}/5000 characters (minimum 100)`}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Select
                  id="category"
                  label="Project Category"
                  value={projectData.category}
                  onChange={(e) => {
                    setProjectData({ ...projectData, category: e.target.value });
                    clearFieldError('category');
                  }}
                  options={categories}
                  error={errors.category}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <FileUpload
                  label="Attachments (Optional)"
                  accept="image/*,.pdf,.doc,.docx"
                  maxSize={10}
                  uploadType="document"
                  onUploadComplete={(url) => setProjectData({ 
                    ...projectData, 
                    attachments: [...projectData.attachments, url] 
                  })}
                />
              </StaggerItem>
            </div>
          )}

          {currentStep === 2 && (
            <div className={styles.formGrid}>
              <StaggerItem className={styles.fullWidth}>
                <label className={styles.budgetLabel}>Budget Type</label>
                <div className={styles.budgetToggle}>
                  <button
                    type="button"
                    className={cn(
                      styles.budgetOption,
                      projectData.budgetType === 'fixed' && styles.budgetOptionActive
                    )}
                    onClick={() => setProjectData({ ...projectData, budgetType: 'fixed' })}
                  >
                    <Banknote className={styles.inlineIcon} size={16} />
                    Fixed Price
                  </button>
                  <button
                    type="button"
                    className={cn(
                      styles.budgetOption,
                      projectData.budgetType === 'hourly' && styles.budgetOptionActive
                    )}
                    onClick={() => setProjectData({ ...projectData, budgetType: 'hourly' })}
                  >
                    <Clock className={styles.inlineIcon} size={16} />
                    Hourly Rate
                  </button>
                </div>
              </StaggerItem>
              <StaggerItem>
                <Input
                  name="budgetMin"
                  type="number"
                  label={`Minimum ${projectData.budgetType === 'hourly' ? 'Hourly Rate' : 'Budget'} (PKR)`}
                  placeholder="10000"
                  value={projectData.budgetMin}
                  onChange={(e) => {
                    setProjectData({ ...projectData, budgetMin: e.target.value });
                    clearFieldError('budgetMin');
                  }}
                  error={errors.budgetMin}
                />
              </StaggerItem>
              <StaggerItem>
                <Input
                  name="budgetMax"
                  type="number"
                  label={`Maximum ${projectData.budgetType === 'hourly' ? 'Hourly Rate' : 'Budget'} (PKR)`}
                  placeholder="50000"
                  value={projectData.budgetMax}
                  onChange={(e) => {
                    setProjectData({ ...projectData, budgetMax: e.target.value });
                    clearFieldError('budgetMax');
                  }}
                  error={errors.budgetMax}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Select
                  name="duration"
                  label="Project Duration"
                  value={projectData.duration}
                  onChange={(e) => {
                    setProjectData({ ...projectData, duration: e.target.value });
                    clearFieldError('duration');
                  }}
                  options={[
                    { value: '', label: 'Select duration' },
                    { value: 'less-than-week', label: 'Less than 1 week' },
                    { value: '1-2-weeks', label: '1-2 weeks' },
                    { value: '2-4-weeks', label: '2-4 weeks' },
                    { value: '1-3-months', label: '1-3 months' },
                    { value: '3-6-months', label: '3-6 months' },
                    { value: 'more-than-6-months', label: 'More than 6 months' },
                  ]}
                />
              </StaggerItem>

              <StaggerItem className={styles.fullWidthSpaced}>
                 <FeasibilityAnalyzer 
                    projectDescription={projectData.description}
                    budgetMin={parseFloat(projectData.budgetMin) || 0}
                    budgetMax={parseFloat(projectData.budgetMax) || 0}
                    timelineDays={getDurationDays(projectData.duration)}
                 />
              </StaggerItem>
            </div>
          )}

          {currentStep === 3 && (
            <div className={styles.formGrid}>
              <StaggerItem className={styles.fullWidth}>
                <TagsInput
                  id="skills"
                  label="Required Skills (Add at least 2)"
                  placeholder="e.g., React, Node.js, MongoDB"
                  tags={projectData.skills}
                  onTagsChange={(skills) => {
                    setProjectData({ ...projectData, skills });
                    clearFieldError('skills');
                  }}
                  error={errors.skills}
                />
              </StaggerItem>
              <StaggerItem className={styles.fullWidth}>
                <Select
                  id="experienceLevel"
                  label="Experience Level Required"
                  value={projectData.experienceLevel}
                  onChange={(e) => {
                    setProjectData({ ...projectData, experienceLevel: e.target.value });
                    clearFieldError('experienceLevel');
                  }}
                  options={[
                    { value: '', label: 'Select level' },
                    { value: 'ENTRY', label: 'Entry Level - New freelancers welcome' },
                    { value: 'INTERMEDIATE', label: 'Intermediate - Some experience needed' },
                    { value: 'EXPERT', label: 'Expert - Only experienced professionals' },
                  ]}
                />
              </StaggerItem>
            </div>
          )}

          {currentStep === 4 && (
            <div className={styles.reviewSection}>
              <StaggerItem>
                <h3 className={styles.reviewTitle}>Review Your Project</h3>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Title:</span>
                <span className={styles.reviewValue}>{projectData.title}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Description:</span>
                <span className={styles.reviewValue}>{projectData.description}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Category:</span>
                <span className={styles.reviewValue}>
                  {categories.find(c => c.value === projectData.category)?.label}
                </span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Budget:</span>
                <span className={styles.reviewValue}>
                  PKR {projectData.budgetMin} - {projectData.budgetMax} ({projectData.budgetType})
                </span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Duration:</span>
                <span className={styles.reviewValue}>{projectData.duration}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Required Skills:</span>
                <span className={styles.reviewValue}>{projectData.skills.join(', ')}</span>
              </StaggerItem>
              
              <StaggerItem className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Experience Level:</span>
                <span className={styles.reviewValue}>{projectData.experienceLevel}</span>
              </StaggerItem>
            </div>
          )}

          {errors.general && (
            <motion.div
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {errors.general}
            </motion.div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {currentStep > 1 && (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className={styles.inlineIcon} size={16} />
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            isLoading={loading}
            disabled={loading}
          >
            {currentStep < steps.length ? (
              <>
                Next
                <ArrowRight className={styles.trailingIcon} size={16} />
              </>
            ) : (
              <>
                Post Project
                <CheckCircle className={styles.trailingIcon} size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProjectWizard;
