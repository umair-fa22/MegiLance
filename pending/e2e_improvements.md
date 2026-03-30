# End-to-End Test Improvements & Bugs
Date: March 31, 2026

## Overview
This document tracks all potential improvements, bugs, and enhancements discovered during automated End-to-End (E2E) testing of major user flows (Sign Up, Sign In, Profile/Portfolio creation, and Project management).

## User Flows Tested

### 1. Sign Up & Authentication Flow
- **Current State**: The /signup and /login routes have functional Dev Quick Login utilities which successfully bypass Google Auth mismatch issues for rapid local iteration.
- **Issues/Improvements**:
  - Hydration Mismatch: React hydration mismatch errors occur on /signup because server-rendered layout does not exactly match the client properties on load.
  - Onboarding Interception: New users who clear localStorage are immediately hit by the OnboardingTour overlay. The Tour intercepts pointer events for login forms, making automated clicks fail unless {force: true} is used or localStorage.has_seen_tour is seeded.
  - *Improvement*: Use a deterministic component rendering approach for the server vs client to solve the hydration matching error in SignupPage.

### 2. Freelancer Registration & Portfolio Flow
- **Current State**: The freelancer dashboard correctly gates unauthorized users. Profile editing is split into functional tabs (Basic Info, Professional, Experience, Education & Certs, Links & Social, Media & Files).
- **Issues/Improvements**:
  - Profile Sections UI/UX: When navigating /freelancer/profile, the active state of "Profile sections" (Basic Info vs Professional) should be more clearly announced via ARIA state (ria-selected="true") to improve accessibility.
  - Missing specific 'Portfolio' explicit label: The standard term feature "Portfolio" is bundled into "Experience" or "Media & Files". Consider dedicating a clear "Portfolio Projects" tab for better onboarding clarity matching standard freelance hubs.

### 3. Client Project Creation Flow (Tested in Previous Session)
- **Current State**: /client/post-job is fully functional and successfully tests multi-step form insertion into Turso backend.
- **Issues/Improvements**:
  - The step-by-step wizard stores intermediate states, but rapid traversal without saving can trigger Change in update lit-warnings from internal Next.js components.
  - AI Budget Suggestion is visible but requires further integration testing to ensure the FASTAPI layer communicates correctly without latency limits.

### 4. Admin Flow
- **Current State**: Admin users require specific database seeding to access the platform. Flow operates well via the Quick Demo Login.
- **Improvements**:
  - Need a dedicated automated script to verify that Admins can ban users or approve platform withdrawals natively without using DB SQL manipulation.

## Action Items (Pending Fixes)
1. Add strict has_seen_tour detection toggle for automated scripts natively inside rontend/app/(auth)/login/Login.tsx or handle it conditionally.
2. Resolve Hydration mismatch in the Auth layout group by checking window !== undefined conditionals.
3. Enhance the Freelancer Profile form by adding a clear UI element strictly named "Portfolio" for ease of visibility.

### 5. Freelancer Project Discovery Flow
- **Current State**: /jobs route successfully loads with valid Search and Filter categories (Web Development, AI & Machine Learning, etc.).
- **Issues/Improvements**:
  - Job Listing Latency/Indexing Issue: Upon submitting a "Test E2E Automated Project" in the Client post workflow, navigating as a Freelancer to /jobs resulted in "0 jobs found".
  - *Improvement*: Verify if newly posted projects default to a draft/pending approval state, or if the backend search index requires a cache bust/refresh before the item propagates to the public Freelancer feed.
