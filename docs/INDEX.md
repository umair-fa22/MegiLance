# MegiLance Documentation Index

Authoritative, structured documentation set following modern software engineering, DevOps, security, quality, and academic (FYP) reporting standards.

## Core Overview
- [Project Overview](ProjectOverview.md)
- [Architecture](Architecture.md)
- [Data Model](DataModel.md)
- [API Overview](api/API_Overview.md)
- [Authentication & Authorization](api/Auth.md)
- [Environments & Configuration](Environments.md)

## Delivery & Operations
- [Deployment Guide](DeploymentGuide.md)
- [Runtime Operations Runbook](OperationsRunbook.md)
- [Performance & Scalability](PerformanceScalability.md)
- [Monitoring & Observability](Observability.md)
- [Security & Compliance](SecurityCompliance.md)
- [Backup & Disaster Recovery](BackupDR.md)

## Engineering Practices
- [Development Workflow](DevWorkflow.md)
- [Testing & QA Strategy](TestingStrategy.md)
- [Code Style & Conventions](CodeStyle.md)
- [Contributing Guide](Contributing.md)
- [Changelog Policy](Changelog.md)

## UX Research
- [UX Research Hub](ux/README.md)
- [User Personas](ux/PERSONAS.md)
- [Jobs-to-be-Done](ux/JTBD.md)
- [Journey Maps](ux/JOURNEY_MAPS.md)
- [Design Principles](ux/DESIGN_PRINCIPLES.md)
- [Accessibility Requirements](ux/ACCESSIBILITY.md)
- [Gap Analysis](ux/GAP_ANALYSIS.md)

## Supporting Documents
- [Risk Register & Mitigations](RiskRegister.md)
- [Threat Model Summary](ThreatModel.md)
- [License & Notices](LicenseNotes.md)

## Academic / FYP Report
- [Full FYP Style Report](FYP_Report.md)

## Quick Start Paths
| Goal | Path |
|------|------|
| Run locally | ProjectOverview > Environments > DeploymentGuide (local) |
| Deploy backend to Oracle | DeploymentGuide > OperationsRunbook |
| Configure security | SecurityCompliance > ThreatModel |
| Extend API | API_Overview > Auth > CodeStyle |
| Performance tuning | PerformanceScalability > Observability |

## Existing Legacy / Supplementary Docs
Existing repository docs (kept for historical traceability) are not duplicated but superseded by this structured set where overlap exists.

## Documentation Principles
- Single source of truth
- Versioned via Git (PR-based change control)
- Security & compliance baked in (OWASP ASVS mapping excerpts where relevant)
- Explicit environment separation: dev / staging / production
- Automatable processes: each guide has an "Automation Potential" note

---
© MegiLance Project – Internal Engineering Documentation
