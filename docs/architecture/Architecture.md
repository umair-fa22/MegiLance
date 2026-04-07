---
title: System Architecture
doc_version: 1.0.0
last_updated: 2025-11-24
status: active
owners: ["architecture", "backend"]
related: ["API_Overview.md", "SecurityCompliance.md", "Observability.md", "PerformanceScalability.md", "TestingStrategy.md", "ENGINEERING_STANDARDS_2025.md"]
description: High-level and deployment architecture (C4-lite) plus operational overlays and current gap register.
---

# System Architecture

> @AI-HINT: This document defines the current platform structure (context, containers, components), deployment topology, cross-cutting concerns, and tracked technical debt. It is the canonical source for system-wide architectural decisions.

## 1. Hybrid Microservices Architecture (Logical View)
MegiLance employs a **Hybrid Microservices Deployment Architecture** to achieve the necessary separation of concerns, scalability, and security required for integrating Web2 and Web3 technologies.

```
+---------------------+       HTTPS / JSON        +----------------------+       RPC / Web3        +---------------------------+
|   Web2 Frontend     |  ───────────────────────▶ |    Web2 Backend      |  ─────────────────────▶ |   Web3 / Blockchain       |
|   (Next.js 16)      |                           |   (FastAPI / Python) |                         | (Smart Contract Escrow)   |
+---------------------+                           +----------------------+                         +---------------------------+
        │                                                    │                                                ▲
        │                                                    │ SQL                                            │
        ▼                                                    ▼                                                │
  End Users (UI)                                  Turso (libSQL) Database                               Immutable Ledger
```

### Core Components
1.  **Web2 Layer (Performance)**: Handles user profiles, project discovery, messaging, and business logic using **Next.js** and **FastAPI**.
2.  **Web3 Layer (Trust)**: Handles critical financial transactions (Escrow funding, release) and immutable reputation logging using **Solidity Smart Contracts**.
3.  **AI Layer (Intelligence)**: Provides "AI Service Stubs" and active modules for **Sentiment Analysis** (Reviews) and **Price Prediction** (Projects).

## 2. Deployment Architecture (Profiles)
Current supported deployment profiles:
- minimal (single VM/container set: backend + nginx; frontend externally hosted) [Oracle VM legacy removed]
- dev (docker compose: frontend, backend, local Turso/SQLite)
- prod (planned: consolidated compose with observability sidecars)
```
Legacy Oracle VM profile DECOMMISSIONED. Current baseline: containerized deployment on generic cloud VM or platform service.
  ├─ docker-compose.minimal.yml
  │   ├─ backend (FastAPI, Gunicorn/Uvicorn workers)
  │   └─ nginx (reverse proxy, static caching)
  │
  └─ No wallet dependency (removed with Turso migration)

Frontend (DigitalOcean App Platform)
  └─ Build → Deploy → Serve static + SSR over Node runtime
```

## 3. Component Responsibilities (Component Diagram)
| Component | Responsibilities | Tech | Scaling Path |
|-----------|-----------------|------|--------------|
| Frontend | UI rendering, theme mgmt, auth token storage, API calls | Next.js 14, TypeScript | Horizontal (platform-managed) |
| Nginx | Reverse proxy, compression, static caching, security headers | Nginx | Add rate limiting / WAF |
| Backend API | Auth, domain logic, validation, orchestration | FastAPI, Pydantic, SQLAlchemy | Split services (user, project, messaging) |
| Database | Persistent relational storage & SQL features | Turso libSQL (primary) | Scale via edge replicas / service tier |
| AI (Future) | Recommendation, skill inference, NLP | FastAPI + ML libs | Separate microservice + GPU (if needed) |

## 4. Data Flow (Authentication Sequence)
```
[User] → /api/auth/login (POST credentials)
  → Validate (FastAPI / Pydantic)
  → Query user (Turso libSQL)
  → Issue JWT access (30m) + refresh (7d)
  → Store minimal session claims in token (stateless)
[User] ← Tokens stored (httpOnly cookie or memory) → Subsequent API calls attach Authorization: Bearer <token>
```

## 5. Persistence Model Decisions
| Aspect | Choice | Rationale |
|--------|--------|-----------|
| DB | Turso libSQL (primary) | Distributed SQLite; edge replication; zero wallet management |
| ORM / Access | SQLAlchemy + Async | Balance productivity & performance |
| Migrations | Future Alembic integration | Deterministic schema evolution |
| Transactions | Unit-of-work per request dependency | Consistency & rollback safety |

## 6. Configuration & Secrets
| Category | Mechanism | Notes |
|----------|----------|-------|
| DB Wallet | Mounted readonly volume | Kept out of image layers |
| Secret Keys | .env (future: vault) | Rotate on release cycles |
| Environment Separation | Distinct .env variants | dev / prod divergence explicit |

## 7. Scalability Strategy
| Challenge | Current Mitigation | Future Evolution |
|----------|--------------------|------------------|
| CPU Saturation | Light worker count (<=2) | Add service tier, horizontal split |
| Memory Limits | Remove AI service from micro VM | Dedicated AI node / serverless |
| Cold Starts | Pre-warmed containers | Add queue-based warmers |
| DB Connection Pool | Conservative pool size | Introduce async pooling / pgbouncer analogue if needed |

## 8. Resilience & Fault Handling
| Failure Type | Detection | Handling |
|--------------|----------|----------|
| Backend Crash | Docker restart policy | Auto-restarts; alert logs (future) |
| DB Connectivity | Readiness endpoint fails | Health checks used for rollback decisions |
| Memory OOM | Container exit | Memory limits & slim images |

## 9. Observability Model
| Layer | Signals | Tooling (Current / Planned) |
|-------|---------|-----------------------------|
| Infra | CPU, Memory, Disk | Docker stats / future Prometheus sidecar |
| App | Structured logs, request latency | Logging formatter (planned) |
| Health | /api/health/live /ready | Integrated load balancer checks |
| Errors | Exception traces | Add Sentry / OpenTelemetry later |

## 10. Security Architecture (Summary)
| Domain | Control |
|--------|---------|
| Transport | HTTPS (frontend), internal Docker network (backend) |
| Auth | JWT access + refresh rotation |
| Secrets | Wallet + environment isolation |
| Input Validation | Pydantic schemas everywhere |
| Principle of Least Privilege | Minimal OS packages, non-root containers (target state) |

(Full detail: `SecurityCompliance.md`, `ThreatModel.md`)

## 11. Build & Release Flow
```
Commit (main) ──▶ GitHub Repo ──▶ CI/CD → Deploy Target (VM / container platform)
  git pull → docker-compose up --build → health test → live
```
Future upgrade: Add canary or blue/green via versioned compose profiles.

## 12. Architectural Decision Records (Snapshot)
| ID | Decision | Status | Rationale |
|----|----------|--------|-----------|
| ADR-001 | FastAPI backend | Accepted | Async & typed | 
| ADR-002 | Oracle Autonomous DB | Deprecated | Replaced by Turso migration (simpler ops, edge performance) |
| ADR-003 | Remove AI from minimal VM | Accepted | Memory constraint |
| ADR-004 | Webhook CD instead of Actions | Accepted | Requirement constraint |
| ADR-005 | Docker Compose (minimal) | Accepted | Simplicity & portability |
| ADR-006 | Domain-Driven Design Backend | Accepted | Modular monolith allows safer team scaling & microservice preparation |
| ADR-007 | AI Smart Fallbacks & Hash Embeddings | Accepted | Guarantees AI endpoints work on low-memory VMs without ML libraries |

(Consider moving to /docs/adr/ with one file per ADR as system evolves.)

## 13. Extensibility Points
| Point | Mechanism |
|-------|-----------|
| Payment Integration | Add payments microservice + webhook consumer |
| Real-time Messaging | WebSocket gateway / separate service |
| Analytics | Event ingestion + warehouse (DuckDB / ClickHouse) |
| AI Services | Isolated container with resource requests |

## 14. Current Gaps / Technical Debt Register
Status legend: ACCEPTED, IN_PROGRESS, PLANNED, MITIGATED.
| Gap | Impact | Status | Planned Action |
|-----|--------|--------|----------------|
| Missing Alembic migrations | Risk of drift | PLANNED | Introduce migration baseline + initial revision |
| Structured logging incomplete | Harder diagnostics | IN_PROGRESS | Finalize JSON formatter + request_id middleware |
| No automated tests in CI | Manual regression risk | PLANNED | Add GitHub Actions workflow reusing `comprehensive_test.py` |
| Rate limiting coverage | Abuse potential | IN_PROGRESS | Expand beyond auth endpoints; add Nginx limits |
| Dual DB modes divergence | Complexity & config drift | PLANNED | Formalize environment-specific DB selection contract |
| Secrets rotation process | Operational risk | PLANNED | Add rotation SOP & calendar |

## 15. Architecture Validation Checklist
- [x] Single responsibility per container boundary
- [x] Stateless API (sessionless JWT)
- [x] Separation of configuration from code
- [x] Horizontal scalability plan documented
- [ ] Structured logging implemented (IN_PROGRESS)
- [ ] Formal migration process established (PLANNED)
- [ ] CI test workflow active (PLANNED)
- [ ] Secrets rotation SOP published (PLANNED)

## 16. Cross-Reference Map
| Concern | Detailed Doc |
|---------|--------------|
| API contracts & versioning | `API_Overview.md` |
| Testing coverage & strategy | `TestingStrategy.md` |
| Performance budgets & scaling | `PerformanceScalability.md` |
| Security controls | `SecurityCompliance.md` |
| Observability signals | `Observability.md` |
| Engineering standards | `ENGINEERING_STANDARDS_2025.md` |

## 17. Update Process
1. Propose change via ADR (new file under `docs/adr/ADR-<nnn>-<slug>.md`).
2. Reference ADR in relevant section above.
3. Bump `doc_version` if structural change (not for typo/format).
4. Update `last_updated` date.
5. Validate checklist (Section 15) after change.
6. Ensure fallback DB logic documented in `ConfigEnvironment.md` if modified.

---
Prepared under modern architecture documentation conventions (C4-lite + operational overlays). See `ProjectOverview.md` for contextual grounding. Aligns with 2025 engineering standards.
