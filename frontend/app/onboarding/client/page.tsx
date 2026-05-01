// @AI-HINT: Client onboarding page — delegates to the ClientOnboarding wizard component.
// Route: /onboarding/client — visited by new clients after signup/social-auth.
// New clients are routed here from: callback page, role-select page, and signup page.
"use client";

import dynamic from "next/dynamic";

const ClientOnboarding = dynamic(() => import("./ClientOnboarding"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #4573df",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  ),
});

export default function ClientOnboardingPage() {
  return <ClientOnboarding />;
}
