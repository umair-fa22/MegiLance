# User Journey Maps

> Stage-by-stage journey maps for key user flows, documenting actions, thoughts, emotions, pain points, and design opportunities.

---

## Journey 1: Freelancer Registration → First Proposal

**Persona**: Saad (Early-Career Freelancer)
**Goal**: Sign up and submit first proposal
**Target duration**: < 30 minutes end-to-end

### Stage Map

| # | Stage | Doing | Thinking | Feeling | Pain Points | Opportunity |
|---|-------|-------|----------|---------|-------------|-------------|
| 1 | **Discovery** | Finds MegiLance via social media/search | "Another freelance platform? What's different?" | Skeptical | Too many platforms, unclear differentiator | Landing page must immediately communicate AI + low fees + Pakistan focus |
| 2 | **Signup** | Clicks "Sign Up as Freelancer", enters email/password, selects role | "Is this quick? Do I need ID verification right now?" | Cautious, impatient | Multi-step forms kill momentum | Single-page signup, defer verification to later |
| 3 | **Onboarding** | Enters Onboarding Tour Wizard — sets skills, bio, hourly rate | "What rate should I charge? What skills are in demand?" | Uncertain about pricing | No pricing guidance during setup, blank profile is intimidating | AI suggests rates based on skills + market, pre-fill from LinkedIn/GitHub |
| 4 | **Profile Build** | Uploads avatar, adds portfolio items, writes bio | "Will clients actually see this? Is my profile good enough?" | Anxious, wants validation | No profile quality score, no tips | Profile completeness meter + "Your profile is in top 30%" gamification |
| 5 | **Job Search** | Browses recommended jobs, uses filters | "These look relevant! How do I know the budget is fair?" | Curious, hopeful | Information overload, unclear if budget matches their rate | AI match scores on each job, budget fairness indicator |
| 6 | **First Proposal** | Clicks "Submit Proposal", writes cover letter, sets bid | "Am I bidding too high? Too low? Will I even get a response?" | Nervous, uncertain | Blank proposal form, no guidance on competitive bids | AI-assisted proposal drafting, "Similar freelancers bid $X-$Y" range |
| 7 | **Waiting** | Checks notifications, refreshes dashboard | "Did they see it? Should I apply to more?" | Anxious, idle | No visibility into proposal status, no next-step guidance | "Your proposal was viewed" notifications, suggest similar jobs |

### Emotional Curve

```
Feeling
  😊 |            4.Profile ─── 5.Search
     |           /                     \
  😐 | 1.Discovery                      6.Proposal
     |    \                                   \
  😟 |     2.Signup ─── 3.Onboarding          7.Waiting
     └──────────────────────────────────────────────
                        Time →
```

### Critical Moments of Truth

1. **Signup → Onboarding transition**: If user feels stuck here, they'll abandon. Must be < 2 minutes.
2. **First job search results**: If recommendations are irrelevant, trust is broken. AI matching must be accurate.
3. **Proposal submission**: Highest anxiety point. AI bid guidance and "Similar bids" data reduce uncertainty.

---

## Journey 2: Client Posting Job → Hiring

**Persona**: Hira (Small Business Client)
**Goal**: Post a job and hire a freelancer
**Target duration**: < 48 hours end-to-end

### Stage Map

| # | Stage | Doing | Thinking | Feeling | Pain Points | Opportunity |
|---|-------|-------|----------|---------|-------------|-------------|
| 1 | **Need Recognition** | Realizes they need a web developer for their project | "Where do I find someone reliable and affordable?" | Frustrated with past experiences | Word-of-mouth is slow, Upwork is expensive | SEO/social proof that MegiLance is cheaper and AI-curated |
| 2 | **Signup** | Registers as Client, minimal onboarding | "Let me just post my job quickly" | Impatient, goal-focused | Lengthy onboarding before posting | Allow job posting during signup — capture intent immediately |
| 3 | **Job Posting** | Fills out project title, description, budget, skills, timeline | "What budget should I set? What skills do I actually need?" | Uncertain about specifics | Blank form is daunting, budget guessing | AI budget estimator, skill auto-suggest, template projects |
| 4 | **Receiving Proposals** | Waits for proposals, gets notifications | "Are these freelancers any good? How do I compare?" | Overwhelmed by choices | All proposals look the same, hard to compare | AI-ranked proposals with match scores, comparison view |
| 5 | **Evaluation** | Reviews profiles, portfolios, match scores | "This one looks good but is expensive. This one is cheap but new." | Decision paralysis | No structured comparison tool | Side-by-side comparison, AI recommendation with reasoning |
| 6 | **Hiring** | Sends offer, sets milestones, funds escrow | "Is my money safe? What if they don't deliver?" | Cautious about money | Escrow process unclear, milestone setting is complex | Visual escrow flow, milestone templates, money-back guarantee messaging |
| 7 | **Project Start** | Onboards freelancer, shares files, sets expectations | "How do we communicate? Where do I track progress?" | Ready but needs structure | Platform messaging vs. external tools | Integrated project workspace with file sharing + messaging |

### Emotional Curve

```
Feeling
  😊 |                              5.Eval ─── 7.Start
     |                             /
  😐 | 1.Need ─── 3.Posting ─── 4.Proposals
     |        \                          \
  😟 |         2.Signup                    6.Hiring(escrow worry)
     └──────────────────────────────────────────────
                        Time →
```

### Critical Moments of Truth

1. **Job posting form**: Budget uncertainty is the #1 blocker. AI estimator must be prominent and accurate.
2. **First proposals arrive**: If proposals are low-quality or irrelevant, client loses trust. AI ranking must surface best matches.
3. **Escrow funding**: Money commitment is the highest-anxiety moment. Visual flow + guarantees reduce friction.

---

## Journey 3: Payment Flow (Freelancer Perspective)

**Persona**: Saad (Freelancer)
**Goal**: Get paid for completed milestone
**Target duration**: < 1 hour from milestone approval to wallet credit

### Stage Map

| # | Stage | Doing | Thinking | Feeling | Pain Points | Opportunity |
|---|-------|-------|----------|---------|-------------|-------------|
| 1 | **Milestone Delivery** | Submits deliverables, marks milestone complete | "I hope the client approves quickly" | Accomplished but uncertain | No estimated approval timeline | Show "Average approval time: 12 hours" |
| 2 | **Client Review** | Waits for client to review and approve | "When will they approve? Should I message them?" | Anxious, checking frequently | No visibility into client's review status | "Client has viewed your delivery" notification |
| 3 | **Approval** | Receives approval notification | "Great! When do I get the money?" | Relieved, excited | Unclear when funds will actually arrive | Immediate wallet credit with clear confirmation |
| 4 | **Wallet Credit** | Checks wallet balance | "How much did I actually receive after fees?" | Happy if transparent, frustrated if surprised | Hidden fees, unclear deductions | Show breakdown: Gross → Platform fee → Net, before and after |
| 5 | **Withdrawal** | Initiates withdrawal to bank/crypto wallet | "How long will this take? Are there more fees?" | Cautious | Withdrawal fees not clear upfront, slow processing | Upfront fee display, estimated arrival time, progress tracker |

### Critical Moments of Truth

1. **Fee transparency**: If Saad is surprised by deductions, trust is permanently damaged. Always show fee breakdowns before actions.
2. **Withdrawal speed**: Every hour of delay increases anxiety. Real-time status updates are essential.

---

## Journey 4: Dispute Resolution

**Persona**: Hira (Client) + Ammar (Admin)
**Goal**: Resolve a milestone dispute fairly
**Target duration**: < 72 hours

### Stage Map (Client Side)

| # | Stage | Doing | Thinking | Feeling |
|---|-------|-------|----------|---------|
| 1 | **Issue Discovery** | Receives deliverable that doesn't match requirements | "This isn't what I asked for" | Frustrated, disappointed |
| 2 | **Dispute Filing** | Navigates to dispute form, describes issue, attaches evidence | "Will the platform actually help?" | Skeptical, stressed |
| 3 | **Waiting** | Checks for updates on dispute status | "How long will this take?" | Impatient, worried about money |
| 4 | **Resolution** | Receives admin decision, funds returned/released | "Was this fair?" | Relieved or frustrated depending on outcome |

### Stage Map (Admin Side)

| # | Stage | Doing | Thinking | Feeling |
|---|-------|-------|----------|---------|
| 1 | **Alert** | Receives new dispute notification | "What's the context?" | Neutral, task-focused |
| 2 | **Investigation** | Reviews messages, deliverables, milestones, contract terms | "Who is in the right here?" | Analytical, needs all context on one screen |
| 3 | **Decision** | Makes ruling, communicates to both parties | "Is this fair and defensible?" | Responsible, careful |
| 4 | **Follow-up** | Monitors for appeal or escalation | "Is this resolved?" | Watchful |

### Critical Moments of Truth

1. **Dispute filing UX**: Must be straightforward — if it's hard to file, clients will just leave the platform.
2. **Admin context view**: All relevant data (contract, messages, deliverables, payment history) must be on ONE screen.
