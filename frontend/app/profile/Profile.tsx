// @AI-HINT: This is the Profile page root component for clients/admins. Uses API for data and 3-file CSS pattern.
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import UserAvatar from "../components/atoms/UserAvatar/UserAvatar";
import ProjectCard, {
  ProjectCardProps,
} from "../components/organisms/ProjectCard/ProjectCard";
import PostProjectCard from "@/app/components/organisms/PostProjectCard/PostProjectCard";
import Button from "@/app/components/atoms/Button/Button";
import { PageTransition } from "@/app/components/Animations/PageTransition";
import { ScrollReveal } from "@/app/components/Animations/ScrollReveal";
import {
  StaggerContainer,
  StaggerItem,
} from "@/app/components/Animations/StaggerContainer";
import { Share2, Link2, Copy, Check, X } from "lucide-react";
import commonStyles from "./Profile.common.module.css";
import lightStyles from "./Profile.light.module.css";
import darkStyles from "./Profile.dark.module.css";
import api from "@/lib/api";

interface ApiUser {
  id: number;
  email: string;
  full_name?: string;
  bio?: string;
  role?: string;
  profile_picture_url?: string;
  headline?: string;
  location?: string;
  phone_number?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  twitter_url?: string;
}

interface ApiProject {
  id: number;
  title: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  created_at?: string;
  updated_at?: string;
  category?: string;
}

const Profile: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [projects, setProjects] = useState<ProjectCardProps[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<"links" | "embed">("links");
  const [linkCopied, setLinkCopied] = useState(false);

  const themeStyles = resolvedTheme === "dark" ? darkStyles : lightStyles;

  const styles = useMemo(() => {
    const merged: Record<string, string> = {};
    for (const key of new Set([
      ...Object.keys(commonStyles),
      ...Object.keys(themeStyles),
    ])) {
      merged[key] = cn((commonStyles as any)[key], (themeStyles as any)[key]);
    }
    return merged;
  }, [themeStyles]);

  const profileUrl =
    typeof window !== "undefined"
      ? user?.role === "client" || (user as any)?.user_type === "client"
        ? `${window.location.origin}/clients/${user?.id}`
        : `${window.location.origin}/freelancers/${user?.id || (user as any)?.profile_slug}`
      : "";

  const copyProfileLink = useCallback(() => {
    navigator.clipboard.writeText(profileUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }, [profileUrl]);

  const activeProjectCount = projects.filter(
    (p) => p.status === "In Progress" || p.status === "Pending",
  ).length;
  const completedCount = projects.filter(
    (p) => p.status === "Completed",
  ).length;
  const completionRate =
    projects.length > 0
      ? Math.round((completedCount / projects.length) * 100)
      : 0;
  const projectCategories = [...new Set(projects.flatMap((p) => p.tags || []))];

  const fetchUserProfile = useCallback(async () => {
    try {
      const data: ApiUser = (await api.auth.me()) as any;
      setUser(data);
      // Fetch user's projects
      await fetchUserProjects();
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load profile:", err);
      }
      if (err.message.includes("401")) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserProjects = async () => {
    try {
      const data: any = await api.projects.getMyProjects();
      // Ensure data is an array
      const projectsList = Array.isArray(data) ? data : [];

      const mappedProjects: ProjectCardProps[] = projectsList
        .slice(0, 5)
        .map((p: ApiProject) => ({
          id: String(p.id),
          title: p.title,
          status:
            p.status === "open"
              ? "Pending"
              : p.status === "in_progress"
                ? "In Progress"
                : "Completed",
          progress:
            p.status === "completed"
              ? 100
              : p.status === "in_progress"
                ? 50
                : 0,
          budget: p.budget_max || p.budget_min || 0,
          paid: 0,
          freelancers: [],
          updatedAt: p.updated_at
            ? new Date(p.updated_at).toLocaleDateString()
            : "Recently",
          clientName: "You",
          postedTime: p.created_at
            ? new Date(p.created_at).toLocaleDateString()
            : "Recently",
          tags: p.category ? [p.category] : [],
        }));
      setProjects(mappedProjects);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load projects:", err);
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (!resolvedTheme) {
    return null; // Prevent hydration mismatch
  }

  if (loading) {
    return (
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <div
          className={cn(
            commonStyles.container,
            commonStyles.loadingContainer,
            themeStyles.loadingContainer,
          )}
        >
          <div className={commonStyles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <div
          className={cn(
            commonStyles.container,
            commonStyles.errorContainer,
            themeStyles.errorContainer,
          )}
        >
          <span className={commonStyles.errorIcon}>⚠️</span>
          <p>{error}</p>
          <button
            type="button"
            className={cn(commonStyles.retryButton, themeStyles.retryButton)}
            onClick={() => router.push("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={cn(commonStyles.header, themeStyles.header)}>
              <UserAvatar
                name={user?.full_name || "User"}
                src={user?.profile_picture_url}
                size="large"
              />
              <div className={commonStyles.headerInfo}>
                <div className={commonStyles.headerTop}>
                  <h1 className={cn(commonStyles.name, themeStyles.name)}>
                    {user?.full_name || "Your Name"}
                  </h1>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    title="Share your profile"
                  >
                    <Share2 size={16} /> Share
                  </Button>
                </div>
                {user?.headline && (
                  <p
                    className={cn(commonStyles.headline, themeStyles.headline)}
                  >
                    {user.headline}
                  </p>
                )}
                <p className={cn(commonStyles.bio, themeStyles.bio)}>
                  {user?.bio || "Add a bio to tell others about yourself."}
                </p>
                <div className={commonStyles.metaRow}>
                  <span className={cn(commonStyles.role, themeStyles.role)}>
                    {user?.role === "client"
                      ? "👔 Client"
                      : user?.role === "admin"
                        ? "🛡️ Admin"
                        : "👤 User"}
                  </span>
                  {user?.location && (
                    <span
                      className={cn(
                        commonStyles.locationBadge,
                        themeStyles.locationBadge,
                      )}
                    >
                      📍 {user.location}
                    </span>
                  )}
                </div>
                {(user?.linkedin_url ||
                  user?.github_url ||
                  user?.website_url ||
                  user?.twitter_url) && (
                  <div className={commonStyles.socialLinks}>
                    {user.linkedin_url && (
                      <a
                        href={user.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          commonStyles.socialLink,
                          themeStyles.socialLink,
                        )}
                      >
                        LinkedIn
                      </a>
                    )}
                    {user.github_url && (
                      <a
                        href={user.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          commonStyles.socialLink,
                          themeStyles.socialLink,
                        )}
                      >
                        GitHub
                      </a>
                    )}
                    {user.twitter_url && (
                      <a
                        href={user.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          commonStyles.socialLink,
                          themeStyles.socialLink,
                        )}
                      >
                        Twitter
                      </a>
                    )}
                    {user.website_url && (
                      <a
                        href={user.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          commonStyles.socialLink,
                          themeStyles.socialLink,
                        )}
                      >
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </header>
          </ScrollReveal>

          <main className={commonStyles.content}>
            <ScrollReveal delay={0.1}>
              <h2
                className={cn(
                  commonStyles.sectionTitle,
                  themeStyles.sectionTitle,
                )}
              >
                {user?.role === "client" ? "Your Projects" : "Recent Activity"}
              </h2>
            </ScrollReveal>

            {projects.length > 0 ? (
              <StaggerContainer className={commonStyles.projectsGrid}>
                {projects.map((project) => (
                  <StaggerItem key={project.id}>
                    <ProjectCard {...project} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <ScrollReveal delay={0.2}>
                <div
                  className={cn(
                    commonStyles.emptyState,
                    themeStyles.emptyState,
                  )}
                >
                  <span className={commonStyles.emptyIcon}>📋</span>
                  <h3>No Projects Yet</h3>
                  <p>
                    {user?.role === "client"
                      ? "Post your first project to start hiring talented freelancers."
                      : "Your project activity will appear here."}
                  </p>
                </div>
              </ScrollReveal>
            )}
          </main>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowShareModal(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Share profile"
          >
            <div
              className={styles.shareModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.shareModalHeader}>
                <h3>Share Profile</h3>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className={styles.closeBtn}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tab toggle */}
              <div className={styles.shareTabBar}>
                <button
                  type="button"
                  className={cn(
                    styles.shareTabBtn,
                    shareTab === "links" && styles.shareTabBtnActive,
                  )}
                  onClick={() => setShareTab("links")}
                >
                  Share Links
                </button>
                <button
                  type="button"
                  className={cn(
                    styles.shareTabBtn,
                    shareTab === "embed" && styles.shareTabBtnActive,
                  )}
                  onClick={() => setShareTab("embed")}
                >
                  Project Card
                </button>
              </div>

              {shareTab === "links" && (
                <div className={styles.shareContent}>
                  {/* Copy profile link */}
                  <div className={styles.shareLinkRow}>
                    <Link2 size={16} />
                    <input
                      readOnly
                      value={profileUrl}
                      className={styles.shareLinkInput}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      onClick={copyProfileLink}
                      className={styles.shareCopyBtn}
                    >
                      {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>

                  {/* Social sharing */}
                  <div className={styles.shareActions}>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareAction}
                    >
                      LinkedIn
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my profile on MegiLance!`)}&url=${encodeURIComponent(profileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareAction}
                    >
                      X / Twitter
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent("My MegiLance Profile")}&body=${encodeURIComponent(`Check out my profile: ${profileUrl}`)}`}
                      className={styles.shareAction}
                    >
                      Email
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out my MegiLance profile: ${profileUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareAction}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {shareTab === "embed" && user?.role === "client" && (
                <div className={styles.shareContent}>
                  <PostProjectCard
                    data={{
                      companyName: user.full_name || "Company",
                      headline: user.headline || "Hiring on MegiLance",
                      avatarUrl: user.profile_picture_url,
                      activeProjects: activeProjectCount,
                      projectCategories: projectCategories,
                      location: user.location,
                      profileUrl: profileUrl,
                      postProjectUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/client/projects`,
                      completionRate: completionRate,
                    }}
                  />
                </div>
              )}

              {shareTab === "embed" && user?.role !== "client" && (
                <div className={styles.shareContent}>
                  <p className={styles.shareHint}>
                    Embeddable cards are available for client accounts.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Profile;
