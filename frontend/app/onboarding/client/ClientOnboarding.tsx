// @AI-HINT: Client onboarding wizard — 4-step flow: Welcome → About You → What You Need → All Set!
// Guides new clients through a lightweight profile setup before entering their dashboard.
// Uses framer-motion for animated step transitions, pill-chip multi-select for skill categories,
// and auto-saves to the backend (with silent fallback) upon reaching the final step.
// Mirrors the pattern from Onboarding.tsx (freelancer flow) for visual / structural consistency.
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Target,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import {
  LottieAnimation,
  welcomeWaveAnimation,
  walletAnimation,
} from '@/app/components/Animations/LottieAnimation';
import api from '@/lib/api';

import commonStyles from './ClientOnboarding.common.module.css';
import lightStyles from './ClientOnboarding.light.module.css';
import darkStyles from './ClientOnboarding.dark.module.css';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const TOTAL_STEPS = 4;

const SKILL_CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Digital Marketing',
  'Data Science',
  'Video & Animation',
  'SEO',
  'DevOps',
  'Other',
] as const;

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select your industry' },
  { value: 'technology', label: 'Technology' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design_creative', label: 'Design & Creative' },
  { value: 'writing_content', label: 'Writing & Content' },
  { value: 'business', label: 'Business' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'other', label: 'Other' },
];

const TEAM_SIZE_OPTIONS = [
  { value: '', label: 'Select team size' },
  { value: 'solo', label: 'Just me' },
  { value: '2-10', label: '2–10' },
  { value: '11-50', label: '11–50' },
  { value: '50+', label: '50+' },
];

const BUDGET_OPTIONS = [
  { value: '', label: 'Select budget range' },
  { value: 'under_500', label: 'Under $500' },
  { value: '500_2000', label: '$500–$2,000' },
  { value: '2000_10000', label: '$2,000–$10,000' },
  { value: '10000_plus', label: '$10,000+' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const URGENCY_OPTIONS = [
  { value: '', label: 'Select timeline' },
  { value: 'asap', label: 'ASAP' },
  { value: 'within_month', label: 'Within a month' },
  { value: 'next_3_months', label: 'In the next 3 months' },
  { value: 'exploring', label: 'Just exploring' },
];

// ─────────────────────────────────────────────
// Framer-motion slide variants (same as Onboarding.tsx)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Data shape
// ─────────────────────────────────────────────

interface ClientOnboardingData {
  fullName: string;
  company: string;
  industry: string;
  teamSize: string;
  categories: string[];
  budget: string;
  urgency: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const ClientOnboarding: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  // ── State ──────────────────────────────────
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [data, setData] = useState<ClientOnboardingData>({
    fullName: '',
    company: '',
    industry: '',
    teamSize: '',
    categories: [],
    budget: '',
    urgency: '',
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // Pre-populate fullName from stored user session after mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const name: string = stored.full_name || stored.name || '';
      if (name) {
        setData((prev) => ({ ...prev, fullName: name }));
      }
    } catch {
      // localStorage unavailable or parse error — continue with empty name
    }
  }, []);

  // ── Theme ──────────────────────────────────
  // Default to light on SSR; resolves to correct theme after hydration.
  // No early return to avoid hook ordering violations.
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // ── Helpers ────────────────────────────────

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** Toggle a skill category chip on/off */
  const toggleCategory = (cat: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
    clearFieldError('categories');
  };

  // ── Validation ─────────────────────────────

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 2) {
      if (!data.fullName || data.fullName.trim().length < 2) {
        newErrors.fullName = 'Full name must be at least 2 characters';
      }
    }

    if (step === 3) {
      if (data.categories.length === 0) {
        newErrors.categories = 'Please select at least one skill category';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      return false;
    }

    setErrors({});
    return true;
  };

  // ── Backend save (called on arrival at step 4) ─────

  /**
   * Fires ~500ms after the user lands on step 4.
   * Attempts to persist client profile data to the API — silently continues on failure.
   * Sets loading=false when done so action buttons become clickable.
   * NOTE: `loading` is set to `true` by goNext() BEFORE this is called.
   */
  const finishOnboarding = async () => {
    try {
      await api.auth.updateProfile({
        company: data.company || undefined,
        bio: `Looking for ${data.categories.join(', ')} talent. Budget: ${data.budget}.`,
      });
    } catch {
      // Continue regardless — user can update their profile later
    }
    localStorage.setItem('onboarding_complete', 'true');
    setLoading(false);
  };

  // ── Navigation ─────────────────────────────

  const goNext = () => {
    if (!validateStep()) return;

    setCompletedSteps((prev) => new Set([...prev, step]));

    if (step < TOTAL_STEPS) {
      const nextStep = step + 1;
      setDirection(1);
      setErrors({});
      setStep(nextStep);
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // When entering the final step, lock action buttons and auto-save after animation settles
      if (nextStep === TOTAL_STEPS) {
        setLoading(true);
        setTimeout(finishOnboarding, 500);
      }
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setErrors({});
      setStep((s) => s - 1);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  // ── Render ─────────────────────────────────

  return (
    <PageTransition className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>

        {/* ── Progress bar ── */}
        <div className={commonStyles.progressBar}>
          <motion.div
            className={cn(commonStyles.progressBarFill, themeStyles.progressBarFill)}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* ── Card ── */}
        <div className={cn(commonStyles.card, themeStyles.card)}>

          {/* Step content with animated transitions */}
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

                {/* ────────────────────────────────
                    STEP 1 — Welcome
                ──────────────────────────────── */}
                {step === 1 && (
                  <>
                    <LottieAnimation
                      animationData={welcomeWaveAnimation}
                      width={150}
                      height={150}
                      ariaLabel="Welcome wave animation"
                      className="mx-auto mb-6"
                    />
                    <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>
                      Welcome to MegiLance!
                    </h2>
                    <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                      Let&apos;s set up your account so you can find and hire the best talent in minutes.
                    </p>
                    <Button onClick={goNext} variant="primary" size="lg">
                      Get Started <ChevronRight size={18} />
                    </Button>
                  </>
                )}

                {/* ────────────────────────────────
                    STEP 2 — About You
                ──────────────────────────────── */}
                {step === 2 && (
                  <div className={commonStyles.formStep}>
                    <div className={commonStyles.stepHeader}>
                      <Building2
                        size={28}
                        className={cn(commonStyles.stepHeaderIcon, themeStyles.stepHeaderIcon)}
                        aria-hidden="true"
                      />
                      <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>
                        Tell Us About Yourself
                      </h2>
                      <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                        A few quick details to personalize your experience.
                      </p>
                    </div>

                    <div className={commonStyles.formFields}>
                      <Input
                        name="fullName"
                        label="Full Name"
                        placeholder="e.g., Sarah Ahmed"
                        value={data.fullName}
                        onChange={(e) => {
                          setData({ ...data, fullName: e.target.value });
                          clearFieldError('fullName');
                        }}
                        error={errors.fullName}
                        required
                        autoComplete="name"
                      />

                      <Input
                        name="company"
                        label="Company or Project Name (Optional)"
                        placeholder="e.g., Acme Corp or My Startup"
                        value={data.company}
                        onChange={(e) => setData({ ...data, company: e.target.value })}
                        autoComplete="organization"
                      />

                      <Select
                        id="industry"
                        label="Industry"
                        value={data.industry}
                        onChange={(e) => setData({ ...data, industry: e.target.value })}
                        options={INDUSTRY_OPTIONS}
                      />

                      <Select
                        id="teamSize"
                        label="Team Size"
                        value={data.teamSize}
                        onChange={(e) => setData({ ...data, teamSize: e.target.value })}
                        options={TEAM_SIZE_OPTIONS}
                      />
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────
                    STEP 3 — What You're Looking For
                ──────────────────────────────── */}
                {step === 3 && (
                  <div className={commonStyles.formStep}>
                    <div className={commonStyles.stepHeader}>
                      <Target
                        size={28}
                        className={cn(commonStyles.stepHeaderIcon, themeStyles.stepHeaderIcon)}
                        aria-hidden="true"
                      />
                      <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>
                        What Do You Need Help With?
                      </h2>
                      <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                        Tell us what kind of talent you&apos;re looking for.
                      </p>
                    </div>

                    <div className={commonStyles.formFields}>

                      {/* Multi-select chip grid */}
                      <div className={commonStyles.chipSection}>
                        <label className={cn(commonStyles.chipLabel, themeStyles.chipLabel)}>
                          Skill Categories
                          <span className={commonStyles.required} aria-hidden="true"> *</span>
                        </label>

                        <div
                          className={commonStyles.chipGrid}
                          role="group"
                          aria-label="Select skill categories"
                        >
                          {SKILL_CATEGORIES.map((cat) => {
                            const isSelected = data.categories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                aria-pressed={isSelected}
                                className={cn(
                                  commonStyles.chip,
                                  themeStyles.chip,
                                  isSelected && commonStyles.chipSelected,
                                  isSelected && themeStyles.chipSelected,
                                )}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>

                        {errors.categories && (
                          <p
                            className={cn(commonStyles.chipError, themeStyles.chipError)}
                            role="alert"
                          >
                            <AlertCircle size={13} aria-hidden="true" />
                            {errors.categories}
                          </p>
                        )}
                      </div>

                      <Select
                        id="budget"
                        label="Typical Budget Per Project"
                        value={data.budget}
                        onChange={(e) => setData({ ...data, budget: e.target.value })}
                        options={BUDGET_OPTIONS}
                      />

                      <Select
                        id="urgency"
                        label="When do you need to hire?"
                        value={data.urgency}
                        onChange={(e) => setData({ ...data, urgency: e.target.value })}
                        options={URGENCY_OPTIONS}
                      />
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────
                    STEP 4 — All Set!
                ──────────────────────────────── */}
                {step === 4 && (
                  <>
                    <LottieAnimation
                      animationData={walletAnimation}
                      width={150}
                      height={150}
                      ariaLabel="Ready to hire animation"
                      className="mx-auto mb-6"
                    />
                    <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>
                      You&apos;re Ready to Hire!
                    </h2>
                    <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>
                      Your account is all set. Post your first project and connect with top talent today.
                    </p>

                    <div className={commonStyles.finalActions}>
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        isLoading={loading}
                        disabled={loading}
                        onClick={() => router.push('/client/post-job')}
                      >
                        Post a Project
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        fullWidth
                        disabled={loading}
                        onClick={() => router.push('/talent')}
                      >
                        Browse Freelancers
                      </Button>
                    </div>
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </div>{/* end stepWrapper */}

          {/* ── Navigation bar — visible only on steps 2 and 3 ── */}
          {step > 1 && step < TOTAL_STEPS && (
            <div className={cn(commonStyles.navigation, themeStyles.navigation)}>
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

        </div>{/* end card */}

        {/* ── Progress dots ── */}
        <div className={commonStyles.progress} aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <motion.div
              key={i}
              className={cn(
                commonStyles.progressDot,
                themeStyles.progressDot,
                step >= i + 1 && commonStyles.progressDotActive,
                step >= i + 1 && themeStyles.progressDotActive,
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

export default ClientOnboarding;
