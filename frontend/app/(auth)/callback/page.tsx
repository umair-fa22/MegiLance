// @AI-HINT: Handles OAuth2 callback from social providers. Exchanges code for tokens.
// Supports smart auth: auto-login for existing users, role-selection redirect for new
// users without a role, and account-linking redirect.
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import api, { setAuthToken, setRefreshToken } from "@/lib/api";
import Button from "@/app/components/atoms/Button/Button";

import commonStyles from "./AuthCallback.common.module.css";
import lightStyles from "./AuthCallback.light.module.css";
import darkStyles from "./AuthCallback.dark.module.css";

interface SocialAuthResponse {
  success?: boolean;
  action?: "login" | "register" | "link";
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    user_type?: string;
  };
  is_new_user?: boolean;
  needs_role_selection?: boolean;
  error?: string;
}

export default function AuthCallbackPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div>Authenticating...</div>
        </div>
      }
    >
      <AuthCallbackPage />
    </Suspense>
  );
}

function AuthCallbackPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Authenticating...");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const themeStyles = resolvedTheme === "dark" ? darkStyles : lightStyles;

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Authentication failed: ${error}`);
        showToast(`Authentication failed: ${error}`, "error");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Invalid callback parameters.");
        showToast("Invalid callback parameters.", "error");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      try {
        const response = (await api.socialAuth.complete(
          code,
          state,
        )) as SocialAuthResponse;

        if (response.success) {
          if (response.action === "login" || response.action === "register") {
            // Store tokens
            setAuthToken(response.access_token || null);
            setRefreshToken(response.refresh_token || null);

            if (response.user) {
              localStorage.setItem("user", JSON.stringify(response.user));
            }

            // ── New user who needs to pick a role → onboarding ──────────
            if (response.is_new_user && response.needs_role_selection) {
              setStatus("success");
              setMessage("Account created! Let\u2019s set up your role...");
              showToast("Welcome to MegiLance!", "success");
              setTimeout(() => router.push("/onboarding/role"), 800);
              return;
            }

            // ── Determine redirect path ─────────────────────────────────
            const role = response.user?.role || response.user?.user_type || "";
            const storedRole = localStorage.getItem("portal_area");
            let redirectPath = "/client/dashboard";

            if (role === "admin") {
              redirectPath = "/admin/dashboard";
            } else if (role === "freelancer") {
              redirectPath = "/freelancer/dashboard";
            } else if (storedRole === "freelancer") {
              redirectPath = "/freelancer/dashboard";
            } else if (storedRole === "admin") {
              redirectPath = "/admin/dashboard";
            }

            localStorage.removeItem("portal_area");

            setStatus("success");
            const actionLabel =
              response.action === "register" ? "registered" : "logged in";
            setMessage(`Successfully ${actionLabel}! Redirecting...`);
            showToast(`Successfully ${actionLabel}!`, "success");

            // New users go to role-specific onboarding, returning users go to dashboard
            if (response.is_new_user) {
              if (role === "freelancer" || storedRole === "freelancer") {
                setTimeout(() => router.push("/onboarding"), 800);
              } else {
                // New clients get the client onboarding wizard
                setTimeout(() => router.push("/onboarding/client"), 800);
              }
            } else {
              setTimeout(() => router.push(redirectPath), 800);
            }
          } else if (
            (response.action as any) === "linked" ||
            response.action === "link"
          ) {
            setStatus("success");
            setMessage("Account linked successfully!");
            showToast("Account linked successfully!", "success");
            setTimeout(() => router.push("/settings/security"), 1500);
          }
        } else {
          throw new Error(response.error || "Authentication failed");
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV === "development") {
          console.error("Social auth error:", err);
        }
        const errMessage =
          err instanceof Error
            ? err.message
            : "Authentication failed. Please try again.";
        setStatus("error");
        setMessage(errMessage);
        showToast(errMessage, "error");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.card, themeStyles.card)}>
        {status === "loading" && (
          <>
            <div className={cn(commonStyles.spinner, themeStyles.spinner)} />
            <h2 className={cn(commonStyles.title, themeStyles.title)}>
              Verifying...
            </h2>
            <p className={cn(commonStyles.message, themeStyles.message)}>
              {message}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className={cn(commonStyles.iconWrap, themeStyles.iconWrapSuccess)}
            >
              <CheckCircle />
            </div>
            <h2 className={cn(commonStyles.title, themeStyles.title)}>
              Success!
            </h2>
            <p className={cn(commonStyles.message, themeStyles.message)}>
              {message}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className={cn(commonStyles.iconWrap, themeStyles.iconWrapError)}
            >
              <XCircle />
            </div>
            <h2 className={cn(commonStyles.title, themeStyles.title)}>Error</h2>
            <p className={cn(commonStyles.message, themeStyles.messageError)}>
              {message}
            </p>
            <div className={commonStyles.actions}>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/login")}
              >
                Return to Login
              </Button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div
          className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === "error" && themeStyles.toastError,
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
