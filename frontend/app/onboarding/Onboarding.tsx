// @AI-HINT: Onboarding flow — guides new users through profile setup with multi-step form, Zod validation, and animated transitions.
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { User, Briefcase, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Textarea from '@/app/components/atoms/Textarea/Textarea';
import TagsInput from '@/app/components/atoms/TagsInput/TagsInput';
import Select from '@/app/components/molecules/Select/Select';
import FileUpload from '@/app/components/molecules/FileUpload/FileUpload';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { LottieAnimation, welcomeWaveAnimation, walletAnimation } from '@/app/components/Animations/LottieAnimation'
import api from '@/lib/api';

import commonStyles from './Onboarding.common.module.css';
import lightStyles from './Onboarding.light.module.css';
import darkStyles from './Onboarding.dark.module.css';

// === Validation Schemas ===

const profileSchema = z.object({
  title: z.string().min(3, 'Professional title must be at least 3 characters').max(100, 'Title must be under 100 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters — tell clients about yourself!').max(2000, 'Bio must be under 2000 characters'),
  location: z.string().min(2, 'Please enter your location'),
});

const skillsSchema = z.object({
  skills: z.array(z.string()).min(3, 'Add at least 3 skills to help clients find you'),
  experienceLevel: z.string().min(1, 'Select your experience level'),
  hourlyRate: z.string().refine((val) => !val || parseFloat(val) > 0, 'Hourly rate must be greater than 0').optional(),
});

const stepSchemas = [null, profileSchema, skillsSchema, null]; // welcome + wallet steps have no validation

// === Animation Variants ===

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
};

interface OnboardingData {
  title: string;
  bio: string;
  location: string;
  skills: string[];
  experienceLevel: string;
  hourlyRate: string;
  avatarUrl: string;
}

const TOTAL_STEPS = 4;

const Onboarding: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<OnboardingData>({
    title: '',
    bio: '',
    location: '',
    skills: [],
    experienceLevel: '',
    hourlyRate: '',
    avatarUrl: '',
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const schema = stepSchemas[step - 1];
    if (!schema) return true;

    const dataSlice: Record<string, unknown> = {};
    if (step === 2) {
      dataSlice.title = data.title;
      dataSlice.bio = data.bio;
      dataSlice.location = data.location;
    } else if (step === 3) {
      dataSlice.skills = data.skills;
      dataSlice.experienceLevel = data.experienceLevel;
      if (data.hourlyRate) dataSlice.hourlyRate = data.hourlyRate;
    }

    const result = schema.safeParse(dataSlice);
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.');
      if (!newErrors[key]) newErrors[key] = issue.message;
    }
    setErrors(newErrors);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
    return false;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setCompletedSteps((prev) => new Set([...prev, step]));
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setErrors({});
      setStep((s) => s + 1);
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setErrors({});
      setStep((s) => s - 1);
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      // Save profile data to backend
      await api.auth.updateProfile({
        title: data.title,
        bio: data.bio,
        location: data.location,
        skills: data.skills.join(', '),
        hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
        profile_image_url: data.avatarUrl || undefined,
        experience_level: data.experienceLevel || undefined,
        headline: data.title || undefined,
      });
    } catch {
      // Continue even if API fails — user can update profile later
    }

    localStorage.setItem('onboarding_complete', 'true');
    window.location.href = '/freelancer/dashboard';
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <PageTransition className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>
        {/* Progress bar */}
        <div className={commonStyles.progressBar}>
          <motion.div
            className={cn(commonStyles.progressBarFill, themeStyles.progressBarFill)}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Step content */}
        <div
          ref={contentRef}
          className={cn(commonStyles.stepWrapper, shakeError && commonStyles.shakeError)}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 280, damping: 28 },
                opacity: { duration: 0.2 },
                filter: { duration: 0.25 },
              }}
              className={commonStyles.step}
            >
              {step === 1 && (
                <>
                  <LottieAnimation
                    animationData={welcomeWaveAnimation}
                    width={150}
                    height={150}
                    ariaLabel="Welcome wave"
                    className="mx-auto mb-6"
                  />
                  <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>Welcome to MegiLance!</h2>
                  <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                    Let&apos;s set up your professional profile so clients can find and hire you. This only takes a couple of minutes.
                  </p>
                  <Button onClick={goNext} variant="primary" size="lg">
                    Get Started <ChevronRight size={18} />
                  </Button>
                </>
              )}

              {step === 2 && (
                <div className={commonStyles.formStep}>
                  <div className={commonStyles.stepHeader}>
                    <User size={28} className={cn(commonStyles.stepHeaderIcon, themeStyles.stepHeaderIcon)} />
                    <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>Your Profile</h2>
                    <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                      Tell clients who you are and what you do.
                    </p>
                  </div>

                  <div className={commonStyles.formFields}>
                    <FileUpload
                      label="Profile Photo (Optional)"
                      accept="image/*"
                      maxSize={5}
                      uploadType="avatar"
                      onUploadComplete={(url) => setData({ ...data, avatarUrl: url })}
                    />
                    <Input
                      name="title"
                      label="Professional Title"
                      placeholder="e.g., Full Stack Developer, UI/UX Designer"
                      value={data.title}
                      onChange={(e) => { setData({ ...data, title: e.target.value }); clearFieldError('title'); }}
                      error={errors.title}
                    />
                    <Textarea
                      name="bio"
                      label="Professional Bio"
                      placeholder="Describe your experience, expertise, and what makes you stand out..."
                      value={data.bio}
                      onChange={(e) => { setData({ ...data, bio: e.target.value }); clearFieldError('bio'); }}
                      error={errors.bio}
                      rows={5}
                      helpText={`${data.bio.length}/2000 characters (minimum 50)`}
                    />
                    <Input
                      name="location"
                      label="Location"
                      placeholder="e.g., Lahore, Pakistan"
                      value={data.location}
                      onChange={(e) => { setData({ ...data, location: e.target.value }); clearFieldError('location'); }}
                      error={errors.location}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={commonStyles.formStep}>
                  <div className={commonStyles.stepHeader}>
                    <Briefcase size={28} className={cn(commonStyles.stepHeaderIcon, themeStyles.stepHeaderIcon)} />
                    <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>Skills & Experience</h2>
                    <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                      Help us match you with the right projects.
                    </p>
                  </div>

                  <div className={commonStyles.formFields}>
                    <TagsInput
                      id="skills"
                      label="Your Skills (Add at least 3)"
                      placeholder="e.g., React, Python, Figma"
                      tags={data.skills}
                      onTagsChange={(skills) => { setData({ ...data, skills }); clearFieldError('skills'); }}
                      error={errors.skills}
                    />
                    <Select
                      id="experienceLevel"
                      label="Experience Level"
                      value={data.experienceLevel}
                      onChange={(e) => { setData({ ...data, experienceLevel: e.target.value }); clearFieldError('experienceLevel'); }}
                      error={errors.experienceLevel}
                      options={[
                        { value: '', label: 'Select your level' },
                        { value: 'ENTRY', label: 'Entry Level (0-2 years)' },
                        { value: 'INTERMEDIATE', label: 'Intermediate (2-5 years)' },
                        { value: 'EXPERT', label: 'Expert (5+ years)' },
                      ]}
                    />
                    <Input
                      name="hourlyRate"
                      type="number"
                      label="Hourly Rate (PKR) — Optional"
                      placeholder="e.g., 3000"
                      value={data.hourlyRate}
                      onChange={(e) => { setData({ ...data, hourlyRate: e.target.value }); clearFieldError('hourlyRate'); }}
                      error={errors.hourlyRate}
                      helpText="You can always change this later"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <>
                  <LottieAnimation
                    animationData={walletAnimation}
                    width={150}
                    height={150}
                    ariaLabel="All set"
                    className="mx-auto mb-6"
                  />
                  <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>You&apos;re All Set!</h2>
                  <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                    Your profile is ready. Connect your wallet for payments, or head straight to your dashboard.
                  </p>
                  <div className={commonStyles.finalActions}>
                    <Button onClick={finishOnboarding} variant="primary" size="lg" isLoading={loading}>
                      <CheckCircle size={18} /> Go to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {step > 1 && step < TOTAL_STEPS && (
          <div className={commonStyles.navigation}>
            <Button variant="ghost" onClick={goBack} disabled={loading}>
              <ChevronLeft size={16} /> Back
            </Button>
            <span className={cn(commonStyles.stepCounter, themeStyles.stepCounter)}>
              {step} of {TOTAL_STEPS}
            </span>
            <Button variant="primary" onClick={goNext} disabled={loading}>
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* Progress dots */}
        <div className={commonStyles.progress}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <motion.div
              key={i}
              className={cn(
                commonStyles.progressDot,
                themeStyles.progressDot,
                step >= i + 1 && commonStyles.progressDotActive,
                step >= i + 1 && themeStyles.progressDotActive
              )}
              animate={{ scale: step === i + 1 ? 1.3 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Onboarding;
