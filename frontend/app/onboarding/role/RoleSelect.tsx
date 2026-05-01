// @AI-HINT: Post-social-signup role selection. New OAuth users land here to choose
// Client or Freelancer before proceeding. Calls selectRole API to update their
// account and issue fresh JWT tokens with the chosen role.
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Briefcase, User, Check } from "lucide-react";
import api, { setAuthToken, setRefreshToken } from "@/lib/api";
import Button from "@/app/components/atoms/Button/Button";

import commonStyles from "./RoleSelect.common.module.css";
import lightStyles from "./RoleSelect.light.module.css";
import darkStyles from "./RoleSelect.dark.module.css";

type Role = "client" | "freelancer";

interface RoleSelectResponse {
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string | number;
    email: string;
    name: string;
    role: string;
  };
}

const roles: {
  id: Role;
  name: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "client",
    name: "I want to hire",
    description:
      "Post projects, review proposals, and collaborate with skilled freelancers.",
    icon: Briefcase,
  },
  {
    id: "freelancer",
    name: "I want to work",
    description:
      "Browse projects, submit proposals, and get paid for your expertise.",
    icon: User,
  },
];

const RoleSelect: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const themeStyles = resolvedTheme === "dark" ? darkStyles : lightStyles;

  const handleContinue = async () => {
    if (!selected) return;

    setLoading(true);
    setError("");

    try {
      const response = (await api.socialAuth.selectRole(
        selected,
      )) as RoleSelectResponse;

      // Store fresh tokens with updated role
      if (response.access_token) {
        setAuthToken(response.access_token);
      }
      if (response.refresh_token) {
        setRefreshToken(response.refresh_token);
      }
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      localStorage.setItem("portal_area", selected);

      if (selected === "freelancer") {
        // Freelancers proceed to full profile onboarding
        router.push("/onboarding");
      } else {
        // New clients go through onboarding before reaching the dashboard
        const onboardingDone =
          localStorage.getItem("onboarding_complete") === "true";
        router.push(
          onboardingDone ? "/client/dashboard" : "/onboarding/client",
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to set role. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.card, themeStyles.card)}>
        <div className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>
            How will you use MegiLance?
          </h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Choose your primary role. You can always update this later.
          </p>
        </div>

        {error && (
          <div className={cn(commonStyles.error, themeStyles.error)}>
            {error}
          </div>
        )}

        <div className={commonStyles.roles}>
          {roles.map((role) => {
            const isSelected = selected === role.id;
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                type="button"
                className={cn(
                  commonStyles.roleCard,
                  themeStyles.roleCard,
                  isSelected && commonStyles.roleCardSelected,
                  isSelected && themeStyles.roleCardSelected,
                )}
                onClick={() => setSelected(role.id)}
                aria-pressed={isSelected}
                aria-label={`Select ${role.name}`}
              >
                <div
                  className={cn(commonStyles.roleIcon, themeStyles.roleIcon)}
                >
                  <Icon size={24} />
                </div>
                <div className={commonStyles.roleInfo}>
                  <div
                    className={cn(commonStyles.roleName, themeStyles.roleName)}
                  >
                    {role.name}
                  </div>
                  <div
                    className={cn(commonStyles.roleDesc, themeStyles.roleDesc)}
                  >
                    {role.description}
                  </div>
                </div>
                <div
                  className={cn(
                    commonStyles.checkMark,
                    themeStyles.checkMark,
                    isSelected && commonStyles.checkMarkSelected,
                    isSelected && themeStyles.checkMarkSelected,
                  )}
                >
                  {isSelected && <Check size={14} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className={commonStyles.actions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleContinue}
            disabled={!selected || loading}
            isLoading={loading}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
