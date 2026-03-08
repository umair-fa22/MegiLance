# MegiLance User Personas

> 3 core personas representing the primary user roles on the platform.

---

## Persona 1: Saad — Early-Career Pakistani Freelancer

| Attribute | Detail |
|-----------|--------|
| **Age** | 22, recent CS graduate in Lahore |
| **Role** | Freelancer |
| **Goal** | Start earning from freelancing without high platform fees |
| **Tech Savvy** | Moderate — comfortable with web apps, uses mobile 60% of time |
| **Pain Points** | PayPal/Payoneer fees, no local payment support, pricing uncertainty, hard to build reputation from zero |
| **Current Tools** | Fiverr (expensive), WhatsApp for client comms, manual invoicing |
| **Context** | Works from home, unreliable internet, checks platform 3-5x daily on mobile |
| **Success** | First paid project within 2 weeks of registration |

### Saad's Day

- **Morning**: Checks phone notifications for new job matches and proposal responses
- **Midday**: Browses recommended jobs, compares budgets, submits 2-3 proposals
- **Evening**: Works on active project, uploads deliverables, messages client
- **Pain moment**: Gets no response on proposals for 3 days — considers lowering rates

### Design Implications

- Mobile-first for all critical flows (job search, proposals, messaging)
- AI pricing guidance during proposal submission ("Similar freelancers bid $X-$Y")
- "Your proposal was viewed" notifications to reduce anxiety
- Profile completeness gamification to build confidence
- Offline-resilient UI (optimistic updates, queue failed requests)

---

## Persona 2: Hira — Small Business Client

| Attribute | Detail |
|-----------|--------|
| **Age** | 34, runs an e-commerce startup in Karachi |
| **Role** | Client |
| **Goal** | Hire reliable developers/designers quickly without overpaying |
| **Tech Savvy** | Low-moderate — needs simple, guided experiences |
| **Pain Points** | Hard to evaluate freelancer quality, unclear pricing, disputes with international platforms |
| **Current Tools** | Upwork (too expensive), word-of-mouth referrals |
| **Context** | Posts 2-3 projects/month, busy, makes decisions on desktop during work hours |
| **Success** | Hired freelancer starts work within 48 hours of posting |

### Hira's Day

- **Morning**: Posts a new project with budget guidance from AI estimator
- **Afternoon**: Reviews 5-8 proposals, uses AI match scores to shortlist top 3
- **Next day**: Compares freelancers side-by-side, sends offer to best match
- **Pain moment**: Freelancer misses first milestone — unsure how to handle dispute

### Design Implications

- AI budget estimator embedded in job posting form (not a separate page)
- Template projects for common job types (e-commerce site, logo design, etc.)
- AI-ranked proposal list with clear comparison view
- Visual escrow flow — show exactly where money is at each stage
- One-click milestone approval with clear dispute escalation path

---

## Persona 3: Ammar — Platform Administrator

| Attribute | Detail |
|-----------|--------|
| **Age** | 28, MegiLance operations team |
| **Role** | Admin |
| **Goal** | Keep platform healthy — resolve disputes, manage users, monitor fraud |
| **Context** | Desktop-only, daily 8-hour sessions, needs data-dense interfaces |
| **Success** | Zero unresolved disputes older than 72 hours |

### Ammar's Day

- **Morning**: Reviews overnight alerts — fraud flags, new disputes, user reports
- **Midday**: Resolves 10-15 disputes, reviews flagged content, manages user accounts
- **Afternoon**: Checks platform metrics, exports reports, configures system settings
- **Pain moment**: Dispute requires context from 3 different pages — too much tab-switching

### Design Implications

- Data-dense dashboard with real-time metrics (no unnecessary whitespace)
- Unified dispute view with all context (messages, milestones, payments) on one screen
- Bulk actions for user management and content moderation
- Keyboard shortcuts for common admin actions
- Audit log with powerful search and filtering

---

## Persona Usage Guide

When building any feature, ask:
1. **Would Saad understand this on mobile with spotty internet?**
2. **Would Hira complete this in under 5 minutes on desktop?**
3. **Would Ammar be able to handle 50+ of these per day efficiently?**
