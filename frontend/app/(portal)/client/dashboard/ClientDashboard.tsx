// @AI-HINT: Redesigned Client Dashboard with modern UI/UX, sparkline stats, activity timeline, progress rings, quick actions.
// Production-ready: Uses real API data, no mock fallbacks.
"use client";

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useClientData } from "@/hooks/useClient";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCounts } from "@/contexts/UnreadCountContext";
import Button from "@/app/components/atoms/Button/Button";
import Loading from "@/app/components/atoms/Loading/Loading";
import EmptyState from "@/app/components/molecules/EmptyState/EmptyState";
import ActivityTimeline, {
  TimelineEvent,
} from "@/app/components/molecules/ActivityTimeline/ActivityTimeline";
import ProgressRing from "@/app/components/atoms/ProgressRing/ProgressRing";
import { PageTransition } from "@/app/components/Animations/PageTransition";
import { ScrollReveal } from "@/app/components/Animations/ScrollReveal";
import {
  emptyBoxAnimation,
  aiSparkleAnimation,
} from "@/app/components/Animations/LottieAnimation";
import {
  Briefcase,
  DollarSign,
  Clock,
  MessageSquare,
  Plus,
  ArrowRight,
  Search,
  FileText,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
} from "lucide-react";

import ProfileCompleteness from "@/app/components/organisms/ProfileCompleteness/ProfileCompleteness";
import StatCard from "./components/StatCard";
import ProjectCard from "./components/ProjectCard";
import TalentCard from "./components/TalentCard";

import commonStyles from "./ClientDashboard.common.module.css";
import lightStyles from "./ClientDashboard.light.module.css";
import darkStyles from "./ClientDashboard.dark.module.css";
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const ClientDashboard: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { projects, payments, loading, error } = useClientData();
  const { recommendations: freelancers } = useRecommendations(5);
  const { user } = useAuth();
  const { counts } = useUnreadCounts();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isNewClient = !localStorage.getItem("onboarding_complete");
    setShowWelcomeBanner(isNewClient);
  }, []);

  const themeStyles =
    mounted && resolvedTheme === "dark" ? darkStyles : lightStyles;

  const displayProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects;
  }, [projects]);

  const metrics = useMemo(() => {
    const totalProjects = displayProjects.length;
    const activeProjects = displayProjects.filter(
      (p) =>
        (p.status as string) === "In Progress" ||
        (p.status as string) === "in_progress" ||
        (p.status as string) === "active",
    ).length;
    const completedProjects = displayProjects.filter(
      (p) =>
        (p.status as string) === "Completed" ||
        (p.status as string) === "completed",
    ).length;
    const onHoldProjects = displayProjects.filter(
      (p) =>
        (p.status as string) === "On Hold" ||
        (p.status as string) === "on_hold" ||
        (p.status as string) === "paused",
    ).length;
    const totalSpent = Array.isArray(payments)
      ? payments.reduce((sum, p) => {
          const amount =
            typeof p.amount === "number"
              ? p.amount
              : parseFloat(p.amount?.replace(/[$,]/g, "") || "0");
          return sum + amount;
        }, 0)
      : 0;

    const pendingProposals = displayProjects.reduce(
      (sum, p) => sum + (p.proposals_count || 0),
      0,
    );
    const completionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;
    const averageProjectValue =
      totalProjects > 0
        ? Math.round(
            displayProjects.reduce((sum, p) => {
              const budget =
                typeof p.budget === "number"
                  ? p.budget
                  : parseFloat(String(p.budget || "0").replace(/[$,]/g, ""));
              return sum + budget;
            }, 0) / totalProjects,
          )
        : 0;

    return {
      totalSpent: `$${totalSpent.toLocaleString()}`,
      totalSpentNum: totalSpent,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalProjects,
      pendingProposals,
      unreadMessages: counts.messages,
      completionRate,
      averageProjectValue,
    };
  }, [displayProjects, payments, counts.messages]);

  // Generate sparkline data from payments history
  const spendingSparkline = useMemo(() => {
    if (!Array.isArray(payments) || payments.length === 0)
      return [0, 0, 0, 0, 0, 0];
    const amounts = payments.slice(0, 7).map((p) => {
      const amount =
        typeof p.amount === "number"
          ? p.amount
          : parseFloat(p.amount?.replace(/[$,]/g, "") || "0");
      return amount;
    });
    return amounts.length >= 2 ? amounts.reverse() : [0, ...amounts, 0];
  }, [payments]);

  // Generate activity timeline from projects and payments
  const recentActivity = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    displayProjects.slice(0, 3).forEach((p) => {
      const status = (p.status as string).toLowerCase();
      events.push({
        id: `project-${p.id}`,
        actor: "You",
        action:
          status === "completed"
            ? "completed"
            : status === "in_progress"
              ? "started work on"
              : "posted",
        target: p.title,
        targetHref: `/client/projects`,
        timestamp: p.updatedAt || p.updated || new Date().toISOString(),
        type:
          status === "completed"
            ? "success"
            : status === "in_progress"
              ? "info"
              : "purple",
        badge: p.budget,
      });
    });

    if (Array.isArray(payments)) {
      payments.slice(0, 2).forEach((p) => {
        events.push({
          id: `payment-${p.id}`,
          actor: "Payment",
          action:
            p.status === "Completed" || p.status === "Paid"
              ? "processed for"
              : "pending for",
          target: p.project || p.description,
          timestamp: p.date || new Date().toISOString(),
          type:
            p.status === "Completed" || p.status === "Paid"
              ? "success"
              : "warning",
          badge: p.amount,
        });
      });
    }

    return events
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 5);
  }, [displayProjects, payments]);

  // Risk alerts and pending actions
  const alerts = useMemo(() => {
    const issues: Array<{
      type: "warning" | "alert" | "info";
      icon: typeof AlertCircle;
      title: string;
      desc: string;
      href: string;
    }> = [];
    if (metrics.pendingProposals > 0) {
      issues.push({
        type: "warning",
        icon: Clock,
        title: `${metrics.pendingProposals} pending proposal${metrics.pendingProposals !== 1 ? "s" : ""}`,
        desc: "Review and respond to new proposals",
        href: "/client/projects",
      });
    }
    if (metrics.onHoldProjects > 0) {
      issues.push({
        type: "alert",
        icon: AlertCircle,
        title: `${metrics.onHoldProjects} project${metrics.onHoldProjects !== 1 ? "s" : ""} on hold`,
        desc: "Paused projects may need your attention",
        href: "/client/projects",
      });
    }
    if (metrics.totalProjects === 0) {
      issues.push({
        type: "info",
        icon: TrendingUp,
        title: "No active projects",
        desc: "Post your first project to start hiring",
        href: "/client/post-job",
      });
    }
    return issues.slice(0, 3);
  }, [metrics]);

  // Quick actions for the grid
  const quickActions = [
    {
      label: "Post a Project",
      href: "/client/post-job",
      icon: Plus,
      color: "primary" as const,
      desc: "Create a new project listing",
    },
    {
      label: "Browse Talent",
      href: "/client/hire",
      icon: Search,
      color: "success" as const,
      desc: "Find skilled freelancers",
    },
    {
      label: "My Projects",
      href: "/client/projects",
      icon: Briefcase,
      color: "info" as const,
      desc: `${metrics.activeProjects} active`,
    },
    {
      label: "Contracts",
      href: "/client/contracts",
      icon: FileText,
      color: "warning" as const,
      desc: "Manage agreements",
    },
    {
      label: "Payments",
      href: "/client/payments",
      icon: CreditCard,
      color: "danger" as const,
      desc: "View transactions",
    },
    {
      label: "Messages",
      href: "/client/messages",
      icon: MessageSquare,
      color: "purple" as const,
      desc: `${counts.messages} unread`,
    },
  ];

  if (!mounted) {
    return (
      <div
        className={cn(
          commonStyles.dashboardContainer,
          commonStyles.loadingContainer,
        )}
      >
        <Loading />
      </div>
    );
  }

  return (
    <PageTransition>
      <div
        className={cn(
          commonStyles.dashboardContainer,
          themeStyles.dashboardContainer,
        )}
      >
        {/* Header Section */}
        <ScrollReveal>
          <div className={commonStyles.headerSection}>
            <div
              className={cn(commonStyles.welcomeText, themeStyles.welcomeText)}
            >
              <h1>
                Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}{" "}
                👋
              </h1>
              <p>Here&apos;s what&apos;s happening with your projects today.</p>
            </div>
            <div className={commonStyles.headerActions}>
              <Link href="/client/hire">
                <Button
                  variant="outline"
                  size="lg"
                  iconBefore={<Search size={18} />}
                >
                  Browse Talent
                </Button>
              </Link>
              <Link href="/client/post-job">
                <Button
                  variant="primary"
                  size="lg"
                  iconBefore={<Plus size={20} />}
                >
                  Post a Project
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Welcome Banner — shown only to new clients who haven't completed onboarding */}
        {showWelcomeBanner && (
          <div className={cn(commonStyles.welcomeBanner, themeStyles.welcomeBanner)}>
            <div className={commonStyles.welcomeBannerContent}>
              <h3 className={cn(commonStyles.welcomeBannerTitle, themeStyles.welcomeBannerTitle)}>
                🚀 Welcome to MegiLance, {user?.name?.split(" ")[0] || "there"}!
              </h3>
              <p className={cn(commonStyles.welcomeBannerText, themeStyles.welcomeBannerText)}>
                You&apos;re all set! Post your first project and connect with
                world-class freelancers.
              </p>
            </div>
            <div className={commonStyles.welcomeBannerActions}>
              <Link href="/client/post-job" className={cn(commonStyles.welcomeBannerPrimaryAction, themeStyles.welcomeBannerPrimaryAction)}>
                Post a Project
              </Link>
              <button
                onClick={() => {
                  localStorage.setItem("onboarding_complete", "dismissed");
                  setShowWelcomeBanner(false);
                }}
                className={cn(commonStyles.welcomeBannerDismissAction, themeStyles.welcomeBannerDismissAction)}
                type="button"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid — with sparklines */}
        <section aria-label="Key statistics">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={commonStyles.motionWrapper}
          >
            <motion.div
              variants={itemVariants}
              className={commonStyles.cardHover}
            >
              <StatCard
                title="Total Spent"
                value={metrics.totalSpent}
                icon={DollarSign}
                sparklineData={spendingSparkline}
                sparklineColor="primary"
                href="/client/payments"
              />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className={commonStyles.cardHover}
            >
              <StatCard
                title="Active Projects"
                value={metrics.activeProjects.toString()}
                icon={Briefcase}
                sparklineColor="success"
                href="/client/projects"
              />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className={commonStyles.cardHover}
            >
              <StatCard
                title="Pending Proposals"
                value={metrics.pendingProposals.toString()}
                icon={Clock}
                href="/client/projects"
              />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className={commonStyles.cardHover}
            >
              <StatCard
                title="Unread Messages"
                value={metrics.unreadMessages.toString()}
                icon={MessageSquare}
                href="/client/messages"
              />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className={commonStyles.cardHover}
            >
              <StatCard
                title="Avg Project Value"
                value={`$${metrics.averageProjectValue.toLocaleString()}`}
                icon={TrendingUp}
                href="/client/analytics"
              />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className={commonStyles.cardHover}
            >
              <StatCard
                title="On-Hold Projects"
                value={metrics.onHoldProjects.toString()}
                icon={Clock}
                href="/client/projects"
              />
            </motion.div>
          </motion.div>
        </section>

        {error && (
          <div className={commonStyles.errorBanner} role="alert">
            <AlertCircle size={16} />
            <div>
              <p>Something went wrong loading your dashboard data.</p>
              <button
                onClick={() => window.location.reload()}
                className={commonStyles.retryButton}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Alerts & Pending Actions */}
        {alerts.length > 0 && (
          <section aria-label="Alerts and pending actions">
            <div
              className={cn(
                commonStyles.alertsSection,
                themeStyles.alertsSection,
              )}
            >
              <h2
                className={cn(
                  commonStyles.sectionTitle,
                  themeStyles.sectionTitle,
                )}
              >
                Your Attention Needed
              </h2>
              <div className={commonStyles.alertsGrid}>
                {alerts.map((alert, idx) => {
                  const AlertIcon = alert.icon;
                  return (
                    <Link
                      key={idx}
                      href={alert.href}
                      className={cn(
                        commonStyles.alertCard,
                        commonStyles[`alertCard-${alert.type}`],
                        themeStyles.alertCard,
                      )}
                    >
                      <div
                        className={cn(
                          commonStyles.alertIcon,
                          commonStyles[`alertIcon-${alert.type}`],
                        )}
                      >
                        <AlertIcon size={20} />
                      </div>
                      <div className={commonStyles.alertContent}>
                        <div
                          className={cn(
                            commonStyles.alertTitle,
                            themeStyles.alertTitle,
                          )}
                        >
                          {alert.title}
                        </div>
                        <div
                          className={cn(
                            commonStyles.alertDesc,
                            themeStyles.alertDesc,
                          )}
                        >
                          {alert.desc}
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className={commonStyles.alertArrow}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section aria-label="Quick actions">
          <ScrollReveal>
            <div className={commonStyles.quickActionsSection}>
              <h2
                className={cn(
                  commonStyles.sectionTitle,
                  themeStyles.sectionTitle,
                )}
              >
                Quick Actions
              </h2>
              <div className={commonStyles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      commonStyles.quickActionCard,
                      themeStyles.quickActionCard,
                    )}
                    aria-label={`${action.label}: ${action.desc}`}
                  >
                    <div
                      className={cn(
                        commonStyles.quickActionIcon,
                        commonStyles[`quickActionIcon-${action.color}`],
                      )}
                      aria-hidden="true"
                    >
                      <action.icon size={20} />
                    </div>
                    <span
                      className={cn(
                        commonStyles.quickActionLabel,
                        themeStyles.quickActionLabel,
                      )}
                    >
                      {action.label}
                    </span>
                    <span
                      className={cn(
                        commonStyles.quickActionDesc,
                        themeStyles.quickActionDesc,
                      )}
                    >
                      {action.desc}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Project Completion Metrics */}
        <section aria-label="Project metrics">
          <div className={commonStyles.metricsRow}>
            <div
              className={cn(commonStyles.metricCard, themeStyles.metricCard)}
            >
              <ProgressRing
                value={metrics.completionRate}
                label="Completion Rate"
                size="lg"
                color="success"
              />
              <span
                className={cn(commonStyles.metricHint, themeStyles.metricHint)}
              >
                % of projects delivered successfully
              </span>
            </div>
            <div
              className={cn(commonStyles.metricCard, themeStyles.metricCard)}
            >
              <ProgressRing
                value={
                  metrics.totalProjects > 0
                    ? Math.round(
                        (metrics.activeProjects / metrics.totalProjects) * 100,
                      )
                    : 0
                }
                label="Active Rate"
                size="lg"
                color="primary"
              />
              <span
                className={cn(commonStyles.metricHint, themeStyles.metricHint)}
              >
                % of projects currently in progress
              </span>
            </div>
            <div
              className={cn(commonStyles.metricCard, themeStyles.metricCard)}
            >
              <div className={commonStyles.metricStats}>
                <div className={commonStyles.metricStatItem}>
                  <CheckCircle2
                    size={16}
                    className={commonStyles.metricIconSuccess}
                  />
                  <span
                    className={cn(
                      commonStyles.metricStatValue,
                      themeStyles.metricStatValue,
                    )}
                  >
                    {metrics.completedProjects}
                  </span>
                  <span
                    className={cn(
                      commonStyles.metricStatLabel,
                      themeStyles.metricStatLabel,
                    )}
                  >
                    Completed
                  </span>
                </div>
                <div className={commonStyles.metricStatItem}>
                  <Zap size={16} className={commonStyles.metricIconPrimary} />
                  <span
                    className={cn(
                      commonStyles.metricStatValue,
                      themeStyles.metricStatValue,
                    )}
                  >
                    {metrics.activeProjects}
                  </span>
                  <span
                    className={cn(
                      commonStyles.metricStatLabel,
                      themeStyles.metricStatLabel,
                    )}
                  >
                    Active
                  </span>
                </div>
                <div className={commonStyles.metricStatItem}>
                  <Clock size={16} className={commonStyles.metricIconWarning} />
                  <span
                    className={cn(
                      commonStyles.metricStatValue,
                      themeStyles.metricStatValue,
                    )}
                  >
                    {metrics.pendingProposals}
                  </span>
                  <span
                    className={cn(
                      commonStyles.metricStatLabel,
                      themeStyles.metricStatLabel,
                    )}
                  >
                    Proposals
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className={commonStyles.mainContentGrid}>
          {/* Left Column */}
          <div className={commonStyles.sectionContainer}>
            <div className={commonStyles.sectionHeader}>
              <h2
                className={cn(
                  commonStyles.sectionTitle,
                  themeStyles.sectionTitle,
                )}
              >
                Active Projects
              </h2>
              <Link
                href="/client/projects"
                className={cn(
                  commonStyles.viewAllLink,
                  themeStyles.viewAllLink,
                )}
              >
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className={commonStyles.projectList}>
              {loading ? (
                <Loading />
              ) : displayProjects.length > 0 ? (
                displayProjects
                  .slice(0, 3)
                  .map((project: any) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
              ) : (
                <EmptyState
                  title="No active projects yet"
                  description="Post your first project to start hiring talented freelancers. It only takes a few minutes."
                  animationData={emptyBoxAnimation}
                  animationWidth={120}
                  animationHeight={120}
                  action={
                    <Link href="/client/post-job">
                      <Button
                        variant="primary"
                        size="md"
                        iconBefore={<Plus size={16} />}
                      >
                        Post Your First Project
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>

            {/* Activity Timeline */}
            <div
              className={cn(
                commonStyles.timelineSection,
                themeStyles.timelineSection,
              )}
            >
              <h3
                className={cn(
                  commonStyles.sectionTitle,
                  themeStyles.sectionTitle,
                )}
              >
                Recent Activity
              </h3>
              <ActivityTimeline
                events={recentActivity}
                maxItems={5}
                emptyMessage="No recent activity on your projects"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className={commonStyles.sectionContainer}>
            <div className={commonStyles.sectionHeader}>
              <h2
                className={cn(
                  commonStyles.sectionTitle,
                  themeStyles.sectionTitle,
                )}
              >
                Recommended Talent
              </h2>
              <Link
                href="/client/hire"
                className={cn(
                  commonStyles.viewAllLink,
                  themeStyles.viewAllLink,
                )}
              >
                Browse All
              </Link>
            </div>

            <div className={commonStyles.talentList}>
              {freelancers && freelancers.length > 0 ? (
                freelancers
                  .slice(0, 3)
                  .map((freelancer) => (
                    <TalentCard
                      key={freelancer.id}
                      name={freelancer.name}
                      role={freelancer.title}
                      avatar={freelancer.avatarUrl || "/avatars/default.jpg"}
                      rating={freelancer.rating}
                      location={freelancer.location}
                      hourlyRate={freelancer.hourlyRate}
                    />
                  ))
              ) : (
                <EmptyState
                  title="No recommendations yet"
                  description="Complete your profile to get AI matches."
                  animationData={aiSparkleAnimation}
                  animationWidth={100}
                  animationHeight={100}
                />
              )}
            </div>

            {/* Profile Completeness */}
            <ProfileCompleteness
              showDetails
              className={commonStyles.profileCompletenessWidget}
            />

            {/* Platform Insights Mini Card */}
            <div
              className={cn(commonStyles.insightCard, themeStyles.insightCard)}
            >
              <div className={commonStyles.insightHeader}>
                <BarChart3 size={18} />
                <h3
                  className={cn(
                    commonStyles.insightTitle,
                    themeStyles.insightTitle,
                  )}
                >
                  Platform Insights
                </h3>
              </div>
              <div className={commonStyles.insightGrid}>
                <div className={commonStyles.insightItem}>
                  <span
                    className={cn(
                      commonStyles.insightValue,
                      themeStyles.insightValue,
                    )}
                  >
                    {metrics.totalProjects}
                  </span>
                  <span
                    className={cn(
                      commonStyles.insightLabel,
                      themeStyles.insightLabel,
                    )}
                  >
                    Total Projects
                  </span>
                </div>
                <div className={commonStyles.insightItem}>
                  <span
                    className={cn(
                      commonStyles.insightValue,
                      themeStyles.insightValue,
                    )}
                  >
                    {metrics.totalSpent}
                  </span>
                  <span
                    className={cn(
                      commonStyles.insightLabel,
                      themeStyles.insightLabel,
                    )}
                  >
                    Total Invested
                  </span>
                </div>
                <div className={commonStyles.insightItem}>
                  <span
                    className={cn(
                      commonStyles.insightValue,
                      themeStyles.insightValue,
                    )}
                  >
                    {freelancers?.length ?? 0}
                  </span>
                  <span
                    className={cn(
                      commonStyles.insightLabel,
                      themeStyles.insightLabel,
                    )}
                  >
                    AI Matches
                  </span>
                </div>
                <div className={commonStyles.insightItem}>
                  <span
                    className={cn(
                      commonStyles.insightValue,
                      themeStyles.insightValue,
                    )}
                  >
                    {metrics.completionRate}%
                  </span>
                  <span
                    className={cn(
                      commonStyles.insightLabel,
                      themeStyles.insightLabel,
                    )}
                  >
                    Success Rate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ClientDashboard;
