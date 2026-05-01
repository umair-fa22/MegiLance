// @/app/(portal)/client/post-job/PostJob.types.ts

const CATEGORIES = [
  "Web Development",
  "Mobile Apps",
  "UI/UX Design",
  "Data Science",
  "AI/ML",
  "DevOps",
] as const;
const BUDGET_TYPES = ["Fixed", "Hourly"] as const;
const EXPERIENCE_LEVELS = ["entry", "intermediate", "expert"] as const;

export type Category = (typeof CATEGORIES)[number];
export type BudgetType = (typeof BUDGET_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface PostJobData {
  title: string;
  category: Category | "";
  description: string;
  skills: string[];
  budgetType: BudgetType;
  budgetAmount: number | null;
  timeline: string;
  experienceLevel: ExperienceLevel;
}

export type PostJobErrors = Partial<Record<keyof PostJobData, string>>;
