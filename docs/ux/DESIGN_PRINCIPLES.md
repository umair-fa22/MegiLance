# MegiLance UX Design Principles

> Platform-wide design principles guiding all UI/UX decisions. Reference these when designing new features or reviewing existing pages.

---

## 1. Progressive Disclosure

**Don't overwhelm with 152 pages. Show what matters now, reveal complexity as users grow.**

- Freelancer dashboard: Show 3 recommended jobs, not 50
- Job posting: Show basic fields first, "Advanced Options" expandable
- Settings: Group by frequency of use, not alphabetical order
- New users see simplified UI; power features unlock as they gain experience

**Anti-patterns to avoid:**
- Showing all filters/options by default
- Dense admin-style layouts for consumer-facing pages
- Navigation menus with 20+ items visible at once

---

## 2. AI as Guide, Not Gatekeeper

**AI features should feel like a helpful assistant, not a black box.**

- Always show reasoning: "Recommended because your skills match 85%"
- Allow override: Users can ignore AI suggestions without friction
- Be transparent: "AI estimated $500-$800 based on 47 similar projects"
- Fail gracefully: If AI is unavailable, the flow still works manually

**Implementation:**
- AI suggestions appear as inline hints, not modal interruptions
- Price estimator is embedded in forms, not on a separate `/ai/price-estimator` page
- Match scores show on job cards with expandable reasoning

---

## 3. Trust at Every Step

**Pakistani freelancers have trust issues with platforms. Earn trust through transparency.**

- Show escrow status prominently on every project page
- Display fee calculations before every transaction (never surprise deductions)
- Use verification badges and review counts on freelancer profiles
- Show "Money-back guarantee" messaging during escrow funding
- Make dispute resolution accessible and clearly documented

**Trust signals to display:**
- "Your money is held in escrow until you approve"
- "Platform fee: 5% ($25) — you receive $475"
- "Verified freelancer" / "Rising talent" badges
- "Average response time: 2 hours"

---

## 4. Mobile-First for Freelancers

**60% of target users (Pakistani freelancers) access via mobile.**

- All critical flows (job search, proposal submission, messaging) must work on 375px screens
- Touch targets minimum 44x44px
- Swipe gestures for job cards (swipe right to save, swipe left to skip)
- Bottom navigation for primary actions on mobile
- Reduce data usage: lazy-load images, minimize API calls
- Support offline-resilient patterns (optimistic updates, request queuing)

**Mobile Priority Matrix:**
| Flow | Mobile Priority |
|------|----------------|
| Job search & browse | P0 — Must be excellent |
| Proposal submission | P0 — Must work fully |
| Messaging | P0 — Must work fully |
| Dashboard | P1 — Should work well |
| Profile editing | P1 — Should work well |
| Payment/wallet | P1 — Should work well |
| Settings | P2 — Acceptable on desktop |
| Admin portal | P3 — Desktop only is fine |

---

## 5. Localization-Ready

**Platform targets Pakistan but aims for global reach.**

- Support Urdu RTL layout (future — design with this in mind now)
- Show prices in PKR + USD where relevant
- Respect timezone for deadlines and notifications
- Use culturally neutral icons and imagery
- Date formats should follow user's locale

---

## 6. Speed Over Decoration

**Users on unreliable connections need fast, functional interfaces.**

- Prefer CSS animations over JavaScript (GPU-accelerated)
- Skeleton loading states for all async content
- Optimistic UI updates — show changes immediately, sync in background
- Target < 3s First Contentful Paint on 3G connections
- Respect `prefers-reduced-motion` — disable all decorative animations

---

## 7. One Path Per Task

**Reduce cognitive load by having a single clear path for each action.**

- One way to reach the dashboard (not 3 different routes)
- One place to manage payments (not wallet + payments + invoices scattered)
- Consistent navigation patterns across freelancer/client/admin portals
- Breadcrumbs on all pages deeper than 2 levels

**Anti-patterns to avoid:**
- Multiple routes to the same content (`/dashboard`, `/auth-dashboard/dashboard`, `/client/dashboard`)
- Duplicate functionality in sidebar + header + page body
- "You can also do this from..." messaging
