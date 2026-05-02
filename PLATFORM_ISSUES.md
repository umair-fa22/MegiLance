# MegiLance — Platform Issues & Integration Gaps

**Audit date:** 2026-05-02
**Status:** Pieces work in isolation, but the platform does **not** function as a cohesive freelancing system.
**Backend tests:** 56 passed / 3 failed / 27 errors. **Frontend tsc:** 0 errors.

This file enumerates every concrete issue, where it lives, and what to do. Work top-down — P0 blockers first.

---

## P0 — Critical Blockers (the freelancing loop is broken)

### 1. `submit-proposal?jobId=235` errors / no job context displayed
- **Symptom:** `localhost:3000/freelancer/submit-proposal?jobId=235` shows `ERR_FAILED` or no project info.
- **Root causes:**
  1. The page reads `jobId` from URL but **never fetches the job** to display its title/budget/description. Freelancer submits "blind." See [SubmitProposal.tsx:50-60](frontend/app/(portal)/freelancer/submit-proposal/SubmitProposal.tsx#L50-L60) and [StepReview.tsx](frontend/app/(portal)/freelancer/submit-proposal/components/StepReview/StepReview.tsx) — neither calls `projectsApi.get(jobId)` nor renders a project header.
  2. There is no validation of `jobId`. If the project does not exist (or jobId is missing), the user still progresses through the form; the submit only fails at the very end with a 404.
  3. The `freelancer/jobs/` `JobCard` does **not** include an "Apply" button. The only link is `/jobs/{id}` (the public marketing page). See [JobCard.tsx:136](frontend/app/components/organisms/JobCard/JobCard.tsx#L136). The only producer of `submit-proposal?jobId=…` URLs is the public [`(main)/jobs/[id]/JobDetails.tsx:132`](frontend/app/(main)/jobs/[id]/JobDetails.tsx#L132).
- **TODO:**
  - [ ] Fetch the job in `SubmitProposal.tsx` via `projectsApi.get(jobIdParam)`, gate render on success, show a `JobSummaryHeader` (title, client, budget, skills, description excerpt) at the top of every step.
  - [ ] If `jobId` is missing/invalid → redirect to `/freelancer/jobs` with toast `"Pick a job to apply to."`.
  - [ ] Add an `Apply now` CTA on the freelancer-portal `JobCard` linking to `/freelancer/submit-proposal?jobId={id}`.
  - [ ] Disable the Apply CTA if the freelancer has already submitted a proposal for this job (call `proposalsApi.list({ project_id })` once on jobs page load).

### 2. Client cannot view, accept, or reject proposals
- **Symptom:** Freelancer submits → goes nowhere from the client side.
- **Evidence:** [`frontend/app/(portal)/client/proposals/`](frontend/app/(portal)/client/proposals/) is an **empty directory** (no `page.tsx`). The client dashboard shows a `proposals_count` but the link goes to a 404.
- **TODO:**
  - [ ] Create `client/proposals/page.tsx` (list view, grouped by project).
  - [ ] Create `client/proposals/[id]/page.tsx` (proposal detail + Accept / Reject / Counter-offer actions).
  - [ ] Wire `Accept` → `POST /api/proposals/{id}/accept` → server creates `Contract` row and triggers payment-escrow flow → redirect client to `/client/contracts/{contract_id}`.
  - [ ] Wire `Reject` → `POST /api/proposals/{id}/reject` with a required reason field.
  - [ ] Add proposal-count badge to client sidebar.

### 3. No proposal → contract → escrow → workroom pipeline
- The client `Hire` form ([Hire.tsx:127-151](frontend/app/(portal)/client/hire/Hire.tsx#L127-L151)) creates a contract directly (good), but accepting a **proposal** does not create one (no UI exists, see #2).
- `client/escrow/page.tsx` can release funds but is **never linked** from the contract page — it's an isolated island.
- **TODO:**
  - [ ] On contract creation (from accepted proposal or direct hire), auto-create an escrow record with status `pending_funding`.
  - [ ] In `client/contracts/[id]/page.tsx`, add a `Fund Escrow` action that links to `client/escrow/[contractId]`.
  - [ ] On milestone completion + client approval, release the escrowed amount to the freelancer's wallet.
  - [ ] Link contract pages to their `Workroom` (chat + files + milestones); right now `workroom/` exists but is unconnected.

---

## P1 — Chatbot always shows "offline mode"

- **Symptom (verbatim):** *"I'm currently in offline mode with limited capabilities. For full assistance, please ensure the backend server is running or try again later."*
- **Root cause chain:**
  1. Frontend [`ChatbotAgent.tsx:122-132`](frontend/app/components/AI/ChatbotAgent/ChatbotAgent.tsx#L122-L132) treats **any** `fetch` failure on `/api/chatbot/start` as offline, with no distinction between 4xx, 5xx, network, or backend-app errors.
  2. The backend LLM gateway is **not active**: [`backend/app/services/llm_gateway.py:29-42`](backend/app/services/llm_gateway.py#L29-L42) requires `DO_AI_API_KEY` (or `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`); if all are absent, `is_active=False` and `generate_text()` returns `"AI service is currently not configured."`
  3. Consequently the chatbot endpoint returns an error/empty payload, frontend catches it, sets `isOfflineMode=true`, and every subsequent message hits the local `getOfflineResponse()` which falls through to the verbatim "offline mode" string at [`ChatbotAgent.tsx:170`](frontend/app/components/AI/ChatbotAgent/ChatbotAgent.tsx#L170).
- **TODO:**
  - [ ] Set one of `DO_AI_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in backend `.env` and redeploy.
  - [ ] Backend: when LLM is not configured, return HTTP 503 with `{"detail":"llm_unavailable"}` instead of a successful 200 with a "not configured" message — so the frontend can distinguish "LLM down" from "backend down."
  - [ ] Frontend: differentiate three states — `online`, `degraded` (backend up, LLM down — show a different banner), `offline` (network failure). Right now they're all collapsed into "offline."
  - [ ] Remove the "ensure the backend server is running" copy when the backend IS running; show "AI is temporarily limited" instead.
  - [ ] Add a retry button on the offline banner that re-pings `/api/chatbot/start`.

---

## P1 — Notification system is three disconnected stubs

End-to-end audit summary (see [Notification system detail](#notification-system-detail) below):

- [ ] **Triggers missing:** No notification is created when:
  - A proposal is submitted ([`backend/app/api/v1/projects_domain/proposals.py:195-262`](backend/app/api/v1/projects_domain/proposals.py))
  - A proposal is accepted/rejected (lines 326-395 of same file)
  - A new chat message arrives ([`backend/app/api/v1/chat/messages.py`](backend/app/api/v1/chat/messages.py))
  - A payment is received (only one trigger found in [`payments_domain/stripe.py`](backend/app/api/v1/payments_domain/stripe.py); incomplete)
  - A contract is awarded, a review is left, or a milestone is approved
- [ ] **Three incompatible implementations** — pick one and delete the others:
  - `backend/app/services/notification_center.py` — async, **in-memory only** (data is lost on restart)
  - `backend/app/services/notifications_service.py` — sync, persistent (Turso)
  - `backend/app/api/v1/core_domain/realtime_notifications.py` — websocket manager, hardcoded JSON
- [ ] **WebSocket payload mismatch:** backend sends `data.type`, frontend [`RealTimeNotifications.tsx:97-123`](frontend/app/components/AdvancedFeatures/RealTimeNotifications/RealTimeNotifications.tsx#L97-L123) reads `data.notification_type`. Real-time delivery silently no-ops.
- [ ] **No internal push channel:** the only WS push endpoint requires admin role; business logic (proposals/messages/payments) has no way to push to a connected user.
- [ ] **Frontend not integrated:** `RealTimeNotifications` is not mounted in the portal layout. The `/notifications/` page polls on mount only — no live updates.
- [ ] **Email/SMS/push are stubs** ([notification_center.py:584-615](backend/app/services/notification_center.py#L584-L615)). All return `{"status":"delivered"}` without sending.
- [ ] **No toast layer:** new events should pop a toast in addition to the bell counter.
- [ ] **No sound, no browser-notification API integration** despite permission request at [`Notifications.tsx:142-144`](frontend/app/(portal)/notifications/Notifications.tsx#L142-L144).
- **TODO (recommended order):**
  1. Consolidate to **one** persistent service (`notifications_service.py`); delete the other two or refactor them into thin layers above it.
  2. Add a `notify(user_id, type, payload)` helper that writes to DB **and** pushes over WS if the user is connected.
  3. Call `notify(...)` from the 6 trigger points listed above.
  4. Fix the WS payload key to match the frontend (or vice-versa).
  5. Mount `RealTimeNotifications` in `(portal)/layout.tsx` so the bell + toasts are global.
  6. Implement email delivery (start with a single transactional template via existing SMTP config) for high-importance events (proposal accepted, payment received, contract awarded). Push and SMS can come later.

---

## P1 — Cohesion gaps across the platform

Per-tab status of the **client** portal — graded ✅ wired / ⚠️ partial / ❌ missing or static:

| Tab | Status | Issue |
|---|---|---|
| dashboard | ✅ | Snapshot only; no real-time updates. |
| post-job | ✅ | Drafts only saved to localStorage, not synced. |
| projects | ✅ | OK. |
| **proposals** | ❌ | **Empty directory — does not exist.** |
| hire | ⚠️ | Direct hire works; no proposal-driven path. |
| contracts | ⚠️ | View-only; no link to escrow / workroom. |
| escrow | ⚠️ | UI works but isolated; never reached from contract flow. |
| messages | ⚠️ | Reuses shared component; real-time wiring unverified. |
| notifications | ❌ | Static; no live updates. |
| analytics / reports | ⚠️ | Endpoints sparse, may not exist server-side. |
| invoices, payments, wallet | ✅ | Wired to backend. |
| freelancers, search | ✅ | Wired. |
| video-calls | ❌ | Reuses freelancer page via dynamic import; backend integration unverified. |
| profile, settings, security | ✅ / ⚠️ | Profile/settings wired; security mostly UI shell. |

Per-area status of the **freelancer** portal:

| Area | Status | Issue |
|---|---|---|
| jobs | ⚠️ | Loads jobs but **JobCard has no Apply button** (#1). |
| submit-proposal | ❌ | Doesn't show what job (#1). |
| my-jobs / proposals | ⚠️ | Verify statuses sync after client accept/reject. |
| messages | ⚠️ | Same shared component as client; needs real-time confirm. |
| earnings, withdraw, wallet, invoices | ⚠️ | Verify backend endpoints are wired and not mock data. |
| notifications | ❌ | Same as client. |
| portfolio, profile, skills | ✅ | OK. |

---

## P2 — Backend test failures (3 failed, 27 errors)

From `pytest tests/ -v`:

- [ ] `test_security_api.py` — auth fixtures hit `429 Too Many Requests` because `slowapi` rate-limits `POST /api/auth/register` to 10/min and the fixture creates one user per test. **Fix:** add a `dev`/`testing` flag in `core/config.py` that skips or relaxes rate limits when `ENV=test`. Affects 27 errored tests.
- [ ] `test_ai_api.py::TestSemanticSkillMatching` — returns `401 Unauthorized` instead of `200`. The endpoint requires auth, but the test fixture passes anonymous. Either remove auth requirement for unauthenticated semantic match (read-only) or add an auth token to the fixture. (12 AI tests blocked on the same root cause.)
- [ ] `test_security_api.py::TestAuthenticationFlow::test_login_with_mfa_flow` — same rate-limit cascade as above.

After fixing the rate limiter test config, expect 23 of the 27 errors to clear automatically.

---

## P2 — Other concrete issues found while auditing

- [ ] `frontend/app/api/[...catchall]/route.ts:5` — `BACKEND_URL` defaults to `http://127.0.0.1:8000`. Production should fail loudly if `NEXT_PUBLIC_BACKEND_URL` is unset, not silently fall back.
- [ ] `backend/clean_db.sql` and `backend/reset_database.py` are untracked — either commit them with a `# dev-only, do not run in prod` header or `.gitignore` them.
- [ ] `MEMORY.md` claims "98% complete, approved for deployment." This audit shows the proposal pipeline alone is missing — that claim should be downgraded.
- [ ] `SubmitProposal.tsx:82-93` "auto-save" is purely cosmetic — sets `isSaved` state but never persists draft anywhere. Either remove the indicator or wire it to localStorage / backend draft endpoint.
- [ ] No global error boundary toast for failed API requests — many pages silently `setJobs([])` on failure (e.g., [`jobs/page.tsx:127-130`](frontend/app/(portal)/freelancer/jobs/page.tsx#L127-L130)) so the user can't tell "no jobs" from "backend dead."

---

## Suggested execution order

1. **Day 1 — unblock the freelancing loop.**
   - Fix #1 (job context in submit-proposal + Apply button on JobCard).
   - Build #2 (`client/proposals/` list + accept/reject).
   - Wire #3 step 1 (proposal-accept → contract auto-create).
2. **Day 2 — close the loop.**
   - Connect contract → escrow → workroom (#3 steps 2-4).
   - Add backend `notify(...)` helper and wire to the 6 triggers (P1 notifications steps 1-3).
3. **Day 3 — polish and reliability.**
   - Fix chatbot offline detection (P1 chatbot).
   - Mount global notification center + toasts.
   - Fix rate-limit test config; rerun pytest until green.
4. **Day 4 — ship to staging, run end-to-end manual smoke** (post job → submit proposal → accept → fund escrow → message in workroom → release escrow → review).

---

## Notification system detail

(Source: end-to-end audit run during this session.)

**Architecture problems:**
- Three competing systems (`notification_center.py` async/in-memory, `notifications_service.py` sync/persistent, `realtime_notifications.py` WS-only).
- WS endpoint `send_notification()` ([realtime_notifications.py:261](backend/app/api/v1/core_domain/realtime_notifications.py#L261)) is admin-gated → business logic cannot push.
- WS payload `data.type` ≠ frontend's expected `data.notification_type` ([RealTimeNotifications.tsx:97-123](frontend/app/components/AdvancedFeatures/RealTimeNotifications/RealTimeNotifications.tsx#L97-L123)).

**Missing trigger points:**
- `proposals.py:195-262` — `create_proposal()` does not notify project owner.
- `proposals.py:326-362` — `accept_proposal()` creates contract but does not notify freelancer.
- `proposals.py:365-395` — `reject_proposal()` does not notify freelancer.
- `chat/messages.py` — new messages do not notify recipient.
- `payments_domain/stripe.py` — only one `PAYMENT_RECEIVED` call found; incomplete coverage of subscription, refund, dispute events.

**Frontend gaps:**
- `RealTimeNotifications` is not mounted in `(portal)/layout.tsx`.
- `notifications/Notifications.tsx:41-96` only fetches once on mount.
- Browser Notification API permission requested but never used to actually `new Notification(...)`.
- No toast for inline events; no sound; no browser badge.

**Stubs masquerading as features:**
- `notification_center.py:584-588` — push delivery returns `{"status":"delivered"}` without calling web-push.
- `notification_center.py:598-601` — email delivery is a stub.
- `notification_center.py:604-615` — SMS delivery is a stub.
- `NotificationPreferences` stored in-memory only; lost on restart.

---

**End of report.** Mark items complete inline as you finish them so this file becomes a living checklist.
