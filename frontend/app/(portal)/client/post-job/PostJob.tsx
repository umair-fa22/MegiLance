// @AI-HINT: Enhanced orchestrator for the multi-step job posting flow with improved validation, error handling, and accessibility.
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  Save,
  Home,
} from "lucide-react";

import { PageTransition } from "@/app/components/Animations/PageTransition";
import { ScrollReveal } from "@/app/components/Animations/ScrollReveal";

import {
  PostJobData,
  PostJobErrors,
  Category,
  BudgetType,
  ExperienceLevel,
} from "./PostJob.types";
import { loadDraft, saveDraft, clearDraft } from "@/app/mocks/jobs";
import api, { APIError } from "@/lib/api";

import Button from "@/app/components/atoms/Button/Button";
import StepIndicator from "./components/StepIndicator/StepIndicator";
import StepDetails from "./components/StepDetails/StepDetails";
import StepScope from "./components/StepScope/StepScope";
import StepBudget from "./components/StepBudget/StepBudget";
import StepReview from "./components/StepReview/StepReview";

import common from "./PostJob.common.module.css";
import light from "./PostJob.light.module.css";
import dark from "./PostJob.dark.module.css";

const STEPS = ["Details", "Scope", "Budget", "Review"] as const;
type Step = (typeof STEPS)[number];

// Validation constants
const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 50;
const MIN_SKILLS = 1;

const PostJob: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === "dark" ? dark : light;
  const router = useRouter();

  const [data, setData] = useState<PostJobData>({
    title: "",
    category: "Web Development",
    description: "",
    skills: [],
    budgetType: "Fixed",
    budgetAmount: null,
    timeline: "1-2 weeks",
    experienceLevel: "intermediate",
  });
  const [errors, setErrors] = useState<PostJobErrors>({});
  const [currentStep, setCurrentStep] = useState<Step>("Details");
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Project templates for quick-start
  const projectTemplates = useMemo(
    () => ({
      "Web Development": {
        description:
          "I need a skilled web developer to build/enhance my website with focus on [specific requirements].",
        skills: ["React", "Node.js", "MongoDB"],
        timeline: "2-4 weeks",
        budgetType: "Fixed",
      },
      "Mobile Apps": {
        description:
          "Looking for an experienced mobile app developer to create a [iOS/Android] application that [brief description].",
        skills: ["React Native", "Swift", "Kotlin"],
        timeline: "4-8 weeks",
        budgetType: "Fixed",
      },
      "UI/UX Design": {
        description:
          "Need a talented UX/UI designer for [project type]. Deliverables include wireframes, mockups, and design system.",
        skills: ["Figma", "UI Design", "UX Research"],
        timeline: "1-2 weeks",
        budgetType: "Fixed",
      },
      "Data Science": {
        description:
          "Seeking a data scientist to [analyze/build model/predict] for [domain]. Proficiency in [tools] required.",
        skills: ["Python", "Machine Learning", "Data Analysis"],
        timeline: "2-4 weeks",
        budgetType: "Fixed",
      },
      "AI/ML": {
        description:
          "Need an AI/ML engineer to develop/train/deploy [specific AI solution]. Should have experience with [frameworks].",
        skills: ["Python", "TensorFlow", "PyTorch"],
        timeline: "3-6 weeks",
        budgetType: "Fixed",
      },
      DevOps: {
        description:
          "Looking for a DevOps engineer to [setup/optimize/maintain] our infrastructure on [cloud platform].",
        skills: ["Docker", "Kubernetes", "AWS"],
        timeline: "1-2 weeks",
        budgetType: "Hourly",
      },
    }),
    [],
  );

  // Calculate completion progress
  const completionProgress = useMemo(() => {
    let completed = 0;
    const total = 4;

    if (data.title.length >= MIN_TITLE_LENGTH && data.category) completed++;
    if (
      data.description.length >= MIN_DESCRIPTION_LENGTH &&
      data.skills.length >= MIN_SKILLS
    )
      completed++;
    if (data.budgetAmount && data.budgetAmount > 0 && data.timeline)
      completed++;
    if (completed === 3) completed++; // Review step is ready

    return Math.round((completed / total) * 100);
  }, [data]);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      const CATEGORY_VALUES: readonly Category[] = [
        "Web Development",
        "Mobile Apps",
        "UI/UX Design",
        "Data Science",
        "AI/ML",
        "DevOps",
      ] as const;
      const isCategory = (v: unknown): v is Category =>
        (CATEGORY_VALUES as readonly string[]).includes(String(v));

      setData((prev) => {
        const safe: Partial<PostJobData> = {
          title: draft.title ?? "",
          category: isCategory(draft.category)
            ? (draft.category as Category)
            : "",
          description: draft.description ?? "",
          skills: Array.isArray(draft.skills) ? draft.skills : [],
          budgetType: draft.budgetType ?? "Fixed",
          budgetAmount: draft.budget ?? null,
          timeline: draft.timeline || "1-2 weeks",
        };
        return { ...prev, ...safe } as PostJobData;
      });
      setLastSaved(new Date());
    }
  }, []);

  // Auto-save draft periodically
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (data.title || data.description || data.skills.length > 0) {
        setIsSaving(true);
        saveDraft(data);
        setLastSaved(new Date());
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [data]);

  const updateData = useCallback((update: Partial<PostJobData>) => {
    setData((prev) => {
      const newData = { ...prev, ...update };
      return newData;
    });
    // Clear relevant errors when user updates data
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(update).forEach((key) => {
        delete newErrors[key as keyof PostJobErrors];
      });
      return newErrors;
    });
  }, []);

  // Apply project template
  const applyTemplate = (categoryName: string) => {
    const template =
      projectTemplates[categoryName as keyof typeof projectTemplates];
    if (template) {
      updateData({
        description: template.description,
        skills: template.skills,
        timeline: template.timeline,
        budgetType: template.budgetType as BudgetType,
      });
    }
  };

  // Smart budget recommendations based on category
  const budgetRecommendations = useMemo(() => {
    const recs: Record<
      string,
      { min: number; suggested: number; max: number }
    > = {
      "Web Development": { min: 500, suggested: 2500, max: 10000 },
      "Mobile Apps": { min: 1000, suggested: 5000, max: 15000 },
      "UI/UX Design": { min: 500, suggested: 1500, max: 5000 },
      "Data Science": { min: 800, suggested: 3000, max: 10000 },
      "AI/ML": { min: 1500, suggested: 5000, max: 20000 },
      DevOps: { min: 500, suggested: 1500, max: 5000 },
    };
    return recs[data.category] || { min: 300, suggested: 1500, max: 10000 };
  }, [data.category]);

  const validateStep = (step: Step): boolean => {
    const newErrors: PostJobErrors = {};
    switch (step) {
      case "Details":
        if (!data.title.trim()) {
          newErrors.title = "Job title is required.";
        } else if (data.title.trim().length < MIN_TITLE_LENGTH) {
          newErrors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters.`;
        }
        if (!data.category) newErrors.category = "Please select a category.";
        break;
      case "Scope":
        if (!data.description.trim()) {
          newErrors.description = "Description is required.";
        } else if (data.description.trim().length < MIN_DESCRIPTION_LENGTH) {
          newErrors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
        }
        if (data.skills.length < MIN_SKILLS) {
          newErrors.skills = `Please add at least ${MIN_SKILLS} skill.`;
        }
        break;
      case "Budget":
        if (!data.budgetAmount || data.budgetAmount <= 0) {
          newErrors.budgetAmount = "Please enter a valid budget amount.";
        } else if (data.budgetAmount > 1000000) {
          newErrors.budgetAmount = "Budget cannot exceed $1,000,000.";
        }
        if (!data.timeline) newErrors.timeline = "Please select a timeline.";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const currentIndex = STEPS.indexOf(currentStep);
      if (currentIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentIndex + 1]);
      }
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const goToStep = (step: Step) => {
    const currentIndex = STEPS.indexOf(currentStep);
    const targetIndex = STEPS.indexOf(step);
    if (targetIndex < currentIndex) {
      setCurrentStep(step);
    }
  };

  const onSubmit = async () => {
    // Validate all steps
    for (const step of STEPS) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.projects.create({
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category || "Web Development",
        budget_type: data.budgetType.toLowerCase(),
        budget_max: Number(data.budgetAmount ?? 0),
        budget_min: Math.round(Number(data.budgetAmount ?? 0) * 0.7),
        experience_level: data.experienceLevel,
        estimated_duration: data.timeline,
        skills: data.skills.map((s) => s.trim()),
        status: "open",
      });

      setSubmissionState("success");
      clearDraft();
      // Bug 1 fix: auto-redirect to projects list after 2 s
      setTimeout(() => {
        router.push("/client/projects");
      }, 2000);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Job submission error:", err);
      }

      // Extract meaningful error message
      if (err instanceof APIError) {
        switch (err.status) {
          case 400:
            setErrorMessage(
              err.message || "Invalid job data. Please check your inputs.",
            );
            break;
          case 401:
            setErrorMessage("Your session has expired. Please log in again.");
            break;
          case 403:
            setErrorMessage(
              "You do not have permission to post jobs. Please upgrade your account.",
            );
            break;
          case 429:
            setErrorMessage(
              "Too many requests. Please wait a moment and try again.",
            );
            break;
          case 500:
            setErrorMessage(
              "Server error. Our team has been notified. Please try again later.",
            );
            break;
          default:
            setErrorMessage(
              err.message || "Something went wrong. Please try again.",
            );
        }
      } else if (err instanceof Error) {
        if (err.message.includes("network") || err.message.includes("fetch")) {
          setErrorMessage(
            "Network error. Please check your internet connection.",
          );
        } else {
          setErrorMessage(
            err.message || "Something went wrong. Please try again.",
          );
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }

      setSubmissionState("error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "Details":
        return (
          <StepDetails data={data} updateData={updateData} errors={errors} />
        );
      case "Scope":
        return (
          <StepScope data={data} updateData={updateData} errors={errors} />
        );
      case "Budget":
        return (
          <StepBudget data={data} updateData={updateData} errors={errors} />
        );
      case "Review":
        return <StepReview data={data} />;
      default:
        return null;
    }
  };

  if (submissionState === "success") {
    return (
      <PageTransition>
        <div
          className={cn(common.centered_container, themed.centered_container)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(common.result_card, themed.result_card)}
            role="alert"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle
                className={cn(
                  common.result_icon,
                  common.success_icon,
                  themed.success_icon,
                )}
                size={64}
              />
            </motion.div>
            <h2 className={cn(common.result_title, themed.result_title)}>
              Job Posted Successfully!
            </h2>
            <p className={cn(common.result_message, themed.result_message)}>
              Your job &quot;{data.title}&quot; is now live. You will be
              notified when freelancers start applying.
            </p>
            <div className={common.result_actions}>
              <Button
                variant="secondary"
                onClick={() => router.push("/client/projects")}
                iconBefore={<Home size={18} />}
              >
                View My Projects
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSubmissionState("idle");
                  setData({
                    title: "",
                    category: "Web Development",
                    description: "",
                    skills: [],
                    budgetType: "Fixed",
                    budgetAmount: null,
                    timeline: "1-2 weeks",
                    experienceLevel: "intermediate",
                  });
                  setCurrentStep("Details");
                }}
              >
                Post Another Job
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  if (submissionState === "error") {
    return (
      <PageTransition>
        <div
          className={cn(common.centered_container, themed.centered_container)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(common.result_card, themed.result_card)}
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle
              className={cn(
                common.result_icon,
                common.error_icon,
                themed.error_icon,
              )}
              size={64}
            />
            <h2 className={cn(common.result_title, themed.result_title)}>
              Submission Failed
            </h2>
            <p className={cn(common.result_message, themed.result_message)}>
              {errorMessage}
            </p>
            <div className={common.result_actions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmissionState("idle");
                  setCurrentStep("Review");
                }}
              >
                Review & Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main
        className={cn(common.main, themed.main)}
        role="main"
        aria-label="Post a Job"
      >
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <div className={common.headerContent}>
                <h1 className={cn(common.title, themed.title)}>Post a Job</h1>
                <p className={cn(common.subtitle, themed.subtitle)}>
                  Follow the steps to get your job posted and find the right
                  talent.
                </p>
              </div>

              {/* Progress and auto-save indicator */}
              <div className={common.progressSection}>
                <div className={common.progressInfo}>
                  <span
                    className={cn(common.progressLabel, themed.progressLabel)}
                  >
                    {completionProgress}% Complete
                  </span>
                  {lastSaved && (
                    <span
                      className={cn(
                        common.savedIndicator,
                        themed.savedIndicator,
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={12} className={common.spinIcon} />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={12} /> Saved{" "}
                          {lastSaved.toLocaleTimeString()}
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className={common.progressTrack}>
                  <motion.div
                    className={cn(common.progressFill, themed.progressFill)}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </header>
          </ScrollReveal>

          <div className={common.step_indicator_container}>
            <StepIndicator steps={STEPS} currentStep={currentStep} />
          </div>

          <div
            className={common.content_container}
            role="region"
            aria-label={`Step: ${currentStep}`}
          >
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
            <div className={common.footerLeft}>
              <Button
                variant="secondary"
                onClick={prevStep}
                disabled={currentStep === "Details"}
                className={cn(currentStep === "Details" && common.hidden)}
                iconBefore={<ArrowLeft size={16} />}
                aria-label="Go to previous step"
              >
                Back
              </Button>
            </div>

            <div className={common.footerRight}>
              {currentStep !== "Review" ? (
                <Button
                  onClick={nextStep}
                  iconAfter={<ArrowRight size={16} />}
                  aria-label={`Continue to ${STEPS[STEPS.indexOf(currentStep) + 1]} step`}
                >
                  {currentStep === "Budget" ? "Preview" : "Continue"}
                </Button>
              ) : (
                <Button
                  onClick={onSubmit}
                  disabled={submitting}
                  isLoading={submitting}
                  iconBefore={!submitting ? <Send size={16} /> : undefined}
                  aria-label="Submit job posting"
                >
                  {submitting ? "Submitting..." : "Submit Job"}
                </Button>
              )}
            </div>
          </footer>
        </div>
      </main>
    </PageTransition>
  );
};

export default PostJob;
