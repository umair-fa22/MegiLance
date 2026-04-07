# MegiLance Backend Architecture: Domain-Driven Design (DDD) Refactoring Plan

## Overview

As part of the MegiLance v3.0 strategy, the backend architecture is moving from a standard layered monolith to a **Modular Monolith** applying **Domain-Driven Design (DDD)** principles. This evolution is necessary to support microservices scaling, team autonomy, and complex business rule encapsulation.

## The Strategy: Layered to Modular Monolith

Currently, the application is organized by technical concern (e.g., `models/`, `schemas/`, `routers/`, `services/`).
The DDD approach requires organizing the codebase by **Business Domain** (Bounded Contexts).

### Core Bounded Contexts (Domains)

1.  **Identity & Access (IAM)**
    - *Responsibility:* User registration, authentication (JWT/WebAuthn), RBAC, session management.
    - *Entities:* `User`, `Role`, `Permission`.
2.  **Profiles & Reputation**
    - *Responsibility:* Freelancer portfolios, client details, ratings, and reviews.
    - *Entities:* `Profile`, `PortfolioItem`, `Review`, `Skill`.
3.  **Project Management**
    - *Responsibility:* Job postings, bidding, proposals, contract formulation.
    - *Entities:* `Project`, `Proposal`, `Contract`, `Milestone`.
4.  **Payments & Escrow**
    - *Responsibility:* Funding, holding funds in escrow, releasing payouts, invoice generation.
    - *Entities:* `Transaction`, `Escrow`, `Invoice`, `Wallet`.
5.  **Communications**
    - *Responsibility:* Real-time messaging, notifications, project workspaces.
    - *Entities:* `Message`, `Thread`, `Notification`.
6.  **Intelligence (AI)**
    - *Responsibility:* Matchmaking, price forecasting, sentiment analysis.
    - *Entities:* `MatchScore`, `Prediction`, `AnalysisReport`.

## New Directory Structure (Target State)

```text
backend/app/
├── core/                   # Cross-cutting concerns (Security, Config, DB Session)
├── domains/                # The Bounded Contexts
│   ├── identity/
│   │   ├── __init__.py
│   │   ├── models.py       # Domain Entities & Value Objects (SQLAlchemy)
│   │   ├── schemas.py      # DTOs (Pydantic)
│   │   ├── repository.py   # Data Access Layer
│   │   ├── service.py      # Business Logic (Application Service)
│   │   ├── exceptions.py   # Domain-specific errors
│   │   └── router.py       # API Endpoints
│   ├── projects/
│   ├── payments/
│   └── ...
├── shared/                 # Shared kernel (common base classes, types)
└── main.py                 # App factory and router inclusion
```

## Architectural Layers within a Domain

Each domain will enforce strict dependency rules (Clean Architecture):

1.  **Domain/Enterprise Logic (Models/Entities/Value Objects):** Pure Python logic. No dependencies on database or web frameworks.
2.  **Application Logic (Services):** Orchestrates domain objects to execute use cases.
3.  **Interface/Infrastructure (Routers/Repositories):** FastAPI endpoints (input/output) and SQLAlchemy adapters (database).

### Dependency Rule
`Router -> Service -> Repository -> Domain Model`

*   Routers only call Services.
*   Services use Repositories to fetch/save Models.
*   Domain Models do not know about Repositories or Routers.

## Inter-Domain Communication

To maintain decoupling, domains **must not** directly import services or repositories from other domains.

### 1. Synchronous Communication (Read-only)
If the `Project` domain needs to know a user's name, it calls an exposed "Anti-Corruption Layer" or internal facade in the `Identity` domain, not directly querying the `User` database table.

### 2. Asynchronous Communication (Domain Events)
For state changes, domains emit events.
*Example:* When a client funds an escrow (`Payments` domain), it emits an `EscrowFunded` event. The `Project` domain listens to this event and changes the project status to `In Progress`.
*(Implementation: Start with an in-memory event bus via FastAPI `BackgroundTasks` or simple PubSub, evolving to Redis/RabbitMQ when scaling to true microservices).*

## Database Evolution (Turso/libSQL)

While keeping a single Turso database initially, we will logically partition the tables.
- Tables will be prefixed by domain (e.g., `iam_users`, `prj_projects`, `pay_transactions`).
- **No strict foreign keys across bounded contexts.** Instead, store aggregate root IDs (e.g., store `client_id` in external tables, but enforce referential integrity at the application level rather than the DB schema level). This prepares the system for physical database splitting if microservices are extracted.

## Migration Path

1.  **Preparation:** Establish the `domains/` directory and create the shared event bus structure.
2.  **Slice 1 (Identity):** Move all auth, user models, and routers into `domains/identity`. Refactor to the Repository pattern.
3.  **Slice 2 (Projects):** Extract project logic. Replace direct User imports with ID references.
4.  **Slice N:** Continue until `models/`, `schemas/`, `services/`, and `api/v1/` are completely empty and deleted.

## Verification & Quality Guardrails

- `tests/` must be restructured to mirror the `domains/` folder.
- Enforce architectural boundaries using a linter tool (like `pytest-arch` or custom scripts) to ensure `domains.projects` does not import from `domains.identity.models`.
