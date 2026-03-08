// @AI-HINT: Centralized conversion tracking & analytics events for growth.
// Tracks: signups, project posts, proposals, hires, page views, CTAs, and funnel steps.
// Works with GA4, Google Tag Manager, and can be extended for Facebook Pixel, etc.

type EventParams = Record<string, string | number | boolean | undefined>;

const GA_ID = typeof window !== 'undefined'
  ? (window as any).__GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  : undefined;

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

function pushDataLayer(event: string, params?: EventParams) {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...params });
  }
}

// ── Core Event Tracker ──────────────────────────────────────────────────────

export function trackConversion(eventName: string, params?: EventParams) {
  // GA4 event
  gtag('event', eventName, params);
  // Data Layer (for GTM)
  pushDataLayer(eventName, params);
}

// ── Signup & Auth Events ────────────────────────────────────────────────────

export function trackSignupStart(role: 'client' | 'freelancer', source?: string) {
  trackConversion('signup_start', {
    role,
    source: source || 'direct',
    funnel_step: 'start',
  });
}

export function trackSignupComplete(role: 'client' | 'freelancer', method: string) {
  trackConversion('sign_up', {
    role,
    method,
    funnel_step: 'complete',
  });
  // GA4 recommended event
  gtag('event', 'sign_up', { method });
}

export function trackLogin(method: string) {
  trackConversion('login', { method });
  gtag('event', 'login', { method });
}

// ── Project Posting Funnel (Client Acquisition Key Metric) ──────────────────

export function trackProjectPostStart(source?: string) {
  trackConversion('project_post_start', {
    source: source || 'direct',
    funnel_step: 'create_start',
  });
}

export function trackProjectPostStep(step: string, data?: EventParams) {
  trackConversion('project_post_step', {
    step,
    funnel_step: step,
    ...data,
  });
}

export function trackProjectPostComplete(projectId: string, budget?: number, category?: string) {
  trackConversion('project_post_complete', {
    project_id: projectId,
    value: budget,
    currency: 'USD',
    category,
    funnel_step: 'complete',
  });
  // GA4 purchase-like event for ROI tracking
  gtag('event', 'generate_lead', {
    value: budget,
    currency: 'USD',
  });
}

// ── Hiring Funnel ───────────────────────────────────────────────────────────

export function trackFreelancerView(freelancerId: string, skill?: string) {
  trackConversion('view_freelancer', {
    freelancer_id: freelancerId,
    skill,
  });
}

export function trackProposalReceived(projectId: string) {
  trackConversion('proposal_received', { project_id: projectId });
}

export function trackHire(freelancerId: string, value?: number) {
  trackConversion('hire_freelancer', {
    freelancer_id: freelancerId,
    value,
    currency: 'USD',
  });
  // High-value conversion
  gtag('event', 'purchase', {
    value,
    currency: 'USD',
    transaction_id: `hire_${freelancerId}_${Date.now()}`,
  });
}

// ── CTA & Engagement Events ────────────────────────────────────────────────

export function trackCTAClick(ctaName: string, location: string, destination?: string) {
  trackConversion('cta_click', {
    cta_name: ctaName,
    cta_location: location,
    destination: destination || '',
  });
}

export function trackPageScroll(page: string, percentage: number) {
  if (percentage === 25 || percentage === 50 || percentage === 75 || percentage === 90) {
    trackConversion('scroll_depth', { page, depth: percentage });
  }
}

export function trackSearch(query: string, resultCount: number) {
  trackConversion('search', {
    search_term: query,
    results_count: resultCount,
  });
  gtag('event', 'search', { search_term: query });
}

// ── Lead Generation ─────────────────────────────────────────────────────────

export function trackEmailCapture(source: string) {
  trackConversion('email_capture', { source });
  gtag('event', 'generate_lead', { source });
}

export function trackNewsletterSignup(source: string) {
  trackConversion('newsletter_signup', { source });
}

// ── Comparison & Competitor Pages ───────────────────────────────────────────

export function trackComparisonView(competitor: string) {
  trackConversion('comparison_view', { competitor });
}

export function trackComparisonCTA(competitor: string, action: string) {
  trackConversion('comparison_cta', { competitor, action });
}

// ── Cost Calculator / Tools ─────────────────────────────────────────────────

export function trackCalculatorUse(toolName: string, result?: EventParams) {
  trackConversion('calculator_use', { tool: toolName, ...result });
}

// ── Referral Program ────────────────────────────────────────────────────────

export function trackReferralShare(method: string) {
  trackConversion('referral_share', { method });
}

export function trackReferralSignup(referrerId: string) {
  trackConversion('referral_signup', { referrer_id: referrerId });
}
