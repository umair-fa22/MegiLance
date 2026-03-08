# @AI-HINT: Central router registry - aggregates all v1 API routers into master router
from fastapi import APIRouter
from .v1 import (
    health, users, projects, proposals, contracts, portfolio, payments, 
    auth, client, assessments, interviews, verification,
    analytics_pro, escrow_pro, notifications_pro, teams, audit,
    export_import, i18n, rate_limiting, webhooks, scheduler, reports, referrals, moderation,
    bulk_operations, saved_searches, activity_feed, api_keys, comments, file_versions, custom_fields,
    templates, organizations, notification_preferences, two_factor, email_templates, integrations,
    push_notifications, invoice_tax, contract_builder, skill_graph,
    social_login, timezone, backup_restore,
    portfolio_builder, compliance, learning_center,
    analytics_dashboard, marketplace,
    subscription_billing, legal_documents, knowledge_base, workflow_automation,
    messages, notifications, reviews, disputes, milestones, skills, admin,
    time_entries, invoices, escrow, categories, favorites, tags, support_tickets, refunds, search,
    websocket, uploads, portal_endpoints, analytics, job_alerts, ai_services, fraud_detection, stripe, chatbot,
    # New enterprise features
    user_feedback, data_analytics_export,
    availability_calendar, review_responses,
    rate_cards, proposal_templates,
    notes_tags, custom_statuses, search_advanced, realtime_notifications,
    ai_matching,
    gamification,
    # Version 2.0 Advanced Features
    security, video_communication,
    # Now enabled - all modules working
    multicurrency, ai_advanced, admin_fraud_alerts,
    # AI Writing Assistant
    ai_writing,
    # Billion Dollar Upgrade Features
    scope_change, wallet, community, workroom, feature_flags,
    # Pakistan Payments - USDC, JazzCash, EasyPaisa, Wise, Payoneer
    pakistan_payments,
    # Blog & News
    blog,
    # Public clients showcase
    public_clients,
    # Public freelancer profiles
    public_profiles,
    # Fiverr/Upwork Feature Parity - Gig Marketplace & Seller Tiers
    gigs, seller_stats, talent_invitations,
    external_projects,
    price_estimator,
    # Standalone Public Tools
    invoice_generator, contract_builder_standalone, income_calculator,
    scope_planner, expense_tax_calculator,
    # AI Parallel Tools - Skill Analyzer, Rate Advisor, Proposal Writer
    skill_analyzer, rate_advisor, proposal_writer,
)


api_router = APIRouter()

# Core services
api_router.include_router(health.router, prefix="/health", tags=["health"]) 
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])  # WebSocket status

# User management
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(job_alerts.router, prefix="/job-alerts", tags=["job-alerts"])
api_router.include_router(admin.router, prefix="", tags=["admin"])  # Admin endpoints

# Project workflow
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(milestones.router, prefix="/milestones", tags=["milestones"])
api_router.include_router(scope_change.router, prefix="/scope-changes", tags=["scope-changes"])

# Communication
api_router.include_router(messages.router, prefix="", tags=["messages"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Reviews and disputes
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(disputes.router, prefix="/disputes", tags=["disputes"])

# Payments and portfolio
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(stripe.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])


# Time tracking, invoices, and escrow
api_router.include_router(time_entries.router, prefix="", tags=["time-tracking"])
api_router.include_router(invoices.router, prefix="", tags=["invoices"])
api_router.include_router(escrow.router, prefix="", tags=["escrow"])

# Categories, tags, and favorites
api_router.include_router(categories.router, prefix="", tags=["categories"])
api_router.include_router(tags.router, prefix="", tags=["tags"])
api_router.include_router(favorites.router, prefix="", tags=["favorites"])

# Support and refunds
api_router.include_router(support_tickets.router, prefix="", tags=["support"])
api_router.include_router(refunds.router, prefix="", tags=["refunds"])

# Search functionality
api_router.include_router(search.router, prefix="", tags=["search"])
api_router.include_router(search_advanced.router, prefix="", tags=["search-advanced"])  # Turso FTS5 search

# Real-time notifications
api_router.include_router(realtime_notifications.router, prefix="/realtime", tags=["realtime"])

# AI-powered matching
api_router.include_router(ai_matching.router, prefix="", tags=["ai-matching"])

# Gamification
api_router.include_router(gamification.router, prefix="", tags=["gamification"])

# Analytics and reporting
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Advanced Analytics Pro - ML predictions and BI
api_router.include_router(analytics_pro.router, prefix="/analytics-pro", tags=["analytics-pro"])

# File uploads and client tools
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(client.router, prefix="/client", tags=["client"])

# AI services
api_router.include_router(ai_services.router, prefix="/ai", tags=["ai"])

# AI Price Estimator - General-purpose pricing intelligence (public)
api_router.include_router(price_estimator.router, prefix="/price-estimator", tags=["price-estimator"])

# Standalone Public Tools
api_router.include_router(invoice_generator.router, prefix="/invoice-generator", tags=["invoice-generator"])
api_router.include_router(contract_builder_standalone.router, prefix="/contract-builder-standalone", tags=["contract-builder-standalone"])
api_router.include_router(income_calculator.router, prefix="/income-calculator", tags=["income-calculator"])
api_router.include_router(scope_planner.router, prefix="/scope-planner", tags=["scope-planner"])
api_router.include_router(expense_tax_calculator.router, prefix="/expense-tax-calculator", tags=["expense-tax-calculator"])

# AI Parallel Tools
api_router.include_router(skill_analyzer.router, prefix="/skill-analyzer", tags=["skill-analyzer"])
api_router.include_router(rate_advisor.router, prefix="/rate-advisor", tags=["rate-advisor"])
api_router.include_router(proposal_writer.router, prefix="/proposal-writer", tags=["proposal-writer"])

# Skill Assessments - Professional skill verification
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])

# Video Interviews - WebRTC video calling
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])

# Identity Verification - KYC workflow
api_router.include_router(verification.router, prefix="/verification", tags=["verification"])

# Portal endpoints (client and freelancer dashboards)
api_router.include_router(portal_endpoints.router, prefix="/portal", tags=["portals"])

# Advanced Escrow Pro - Stripe integration with milestones
api_router.include_router(escrow_pro.router, prefix="/escrow-pro", tags=["escrow-pro"])

# Notification Center Pro - Multi-channel notifications
api_router.include_router(notifications_pro.router, prefix="/notifications-pro", tags=["notifications-pro"])

# AI Chatbot - Intelligent support automation
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])

# Team Collaboration - Agency and team management
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])

# Audit Trail - Compliance and security logging
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])

# Export/Import - Data portability and GDPR compliance
api_router.include_router(export_import.router, prefix="/export-import", tags=["export-import"])

# Internationalization (i18n) - Multi-language support
api_router.include_router(i18n.router, prefix="/i18n", tags=["i18n"])

# Rate Limiting Pro - Advanced API rate limiting
api_router.include_router(rate_limiting.router, prefix="/rate-limits", tags=["rate-limits"])

# Webhooks - Third-party integrations
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Background Task Scheduler - Job queue management
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])

# Report Generation - PDF/Excel exports
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

# Referral System - User acquisition rewards
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])

# Content Moderation - AI-powered content safety
api_router.include_router(moderation.router, prefix="/moderation", tags=["moderation"])

# Bulk Operations - Batch processing
api_router.include_router(bulk_operations.router, prefix="/bulk", tags=["bulk-operations"])

# Saved Searches - Persistent search queries
api_router.include_router(saved_searches.router, prefix="/saved-searches", tags=["saved-searches"])

# Activity Feed - User timeline and social features
api_router.include_router(activity_feed.router, prefix="/activity", tags=["activity-feed"])

# API Keys - Developer API management
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])

# Comments - Threaded discussions
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])

# File Versions - Document version control
api_router.include_router(file_versions.router, prefix="/file-versions", tags=["file-versions"])

# Custom Fields - Dynamic entity metadata
api_router.include_router(custom_fields.router, prefix="/custom-fields", tags=["custom-fields"])

# Templates - Reusable project/proposal/contract templates
api_router.include_router(templates.router, tags=["templates"])

# Organizations - Multi-tenant workspace management
api_router.include_router(organizations.router, tags=["organizations"])

# Notification Preferences - Granular notification settings
api_router.include_router(notification_preferences.router, tags=["notification-preferences"])

# Two-Factor Authentication - TOTP 2FA with backup codes
api_router.include_router(two_factor.router, tags=["two-factor"])

# Email Templates - Customizable email templates
api_router.include_router(email_templates.router, tags=["email-templates"])

# Integrations Hub - Third-party service integrations
api_router.include_router(integrations.router, tags=["integrations"])

# Mobile Push Notifications - FCM/APNs
api_router.include_router(push_notifications.router, tags=["push-notifications"])

# Invoice & Tax Management - Professional invoicing
api_router.include_router(invoice_tax.router, tags=["invoice-tax"])

# Contract Builder - Visual contract creation
api_router.include_router(contract_builder.router, tags=["contract-builder"])

# Skill Graph - Skill relationships and endorsements
api_router.include_router(skill_graph.router, tags=["skill-graph"])

# AI Writing Assistant - Content generation
api_router.include_router(ai_writing.router, prefix="/ai-writing", tags=["ai-writing"])

# Social Login - OAuth2 social authentication
api_router.include_router(social_login.router, tags=["social-login"])

# Timezone Management - Smart timezone handling
api_router.include_router(timezone.router, tags=["timezone"])

# Backup & Restore - Data backup and restoration
api_router.include_router(backup_restore.router, tags=["backup-restore"])

# Portfolio Builder - Professional portfolio creation
api_router.include_router(portfolio_builder.router, tags=["portfolio-builder"])

# Compliance Center - GDPR and regulatory compliance
api_router.include_router(compliance.router, tags=["compliance"])

# Learning Center - Tutorials and courses
api_router.include_router(learning_center.router, tags=["learning-center"])

# Fraud Detection - AI-powered fraud prevention
api_router.include_router(fraud_detection.router, tags=["fraud-detection"])

# Analytics Dashboard - Business intelligence
api_router.include_router(analytics_dashboard.router, tags=["analytics-dashboard"])

# Marketplace - Advanced search and discovery
api_router.include_router(marketplace.router, tags=["marketplace"])

# Subscription & Billing - Premium plans and payments
api_router.include_router(subscription_billing.router, tags=["subscriptions"])

# Legal Document Center - NDAs, contracts, e-signatures
api_router.include_router(legal_documents.router, tags=["legal-documents"])

# Knowledge Base & FAQ - Help center
api_router.include_router(knowledge_base.router, tags=["knowledge-base"])

# Workflow Automation - Triggers and automated actions
api_router.include_router(workflow_automation.router, tags=["workflows"])

# User Feedback - NPS surveys and feature requests
api_router.include_router(user_feedback.router, tags=["user-feedback"])



# Data Analytics Export - BI and reporting exports
api_router.include_router(data_analytics_export.router, tags=["data-export"])

# Availability Calendar - Freelancer scheduling
api_router.include_router(availability_calendar.router, tags=["availability"])

# Review Responses - Business owner replies
api_router.include_router(review_responses.router, tags=["review-responses"])

# Rate Cards - Freelancer pricing structures
api_router.include_router(rate_cards.router, tags=["rate-cards"])

# Proposal Templates - Reusable proposal templates
api_router.include_router(proposal_templates.router, tags=["proposal-templates"])

# Notes & Tags - Organization and metadata
api_router.include_router(notes_tags.router, tags=["notes-tags"])

# Custom Statuses - Workflow customization
api_router.include_router(custom_statuses.router, tags=["custom-statuses"])

# ========================================
# VERSION 2.0 ADVANCED FEATURES
# ========================================

# Advanced Security - MFA, risk-based auth, session management
api_router.include_router(security.router, prefix="/security", tags=["security-advanced"])

# Video Communication - WebRTC calls, screen sharing, whiteboard
api_router.include_router(video_communication.router, prefix="/video", tags=["video"])

# Multi-Currency Payments
api_router.include_router(multicurrency.router, prefix="/multicurrency", tags=["multicurrency"])

# Advanced AI - ML-powered features
api_router.include_router(ai_advanced.router, prefix="/ai-advanced", tags=["ai-advanced"])

# Admin Fraud Alerts - Real-time fraud monitoring
api_router.include_router(admin_fraud_alerts.router, prefix="/admin/fraud-alerts", tags=["admin-fraud"])

# ========================================
# BILLION DOLLAR UPGRADE FEATURES
# ========================================

# Community Hub - Q&A, Playbooks, Office Hours
api_router.include_router(community.router, prefix="/community", tags=["community"])

# Collaboration Workroom - Kanban, Files, Discussions
api_router.include_router(workroom.router, prefix="/workroom", tags=["workroom"])

# Feature Flags - A/B Testing and gradual rollouts
api_router.include_router(feature_flags.router, tags=["feature-flags"])

# Pakistan Payments - USDC, JazzCash, EasyPaisa, AirTM, Wise, Payoneer
# Stripe is NOT available in Pakistan - these are the alternatives
api_router.include_router(pakistan_payments.router, prefix="/pk-payments", tags=["pakistan-payments"])

# ============================================================================

# Blog & News
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])

# Public clients showcase (no auth required)
api_router.include_router(public_clients.router, tags=["public-clients"])

# Public freelancer profiles (no auth required - shareable profiles)
api_router.include_router(public_profiles.router, prefix="/freelancers", tags=["public-profiles"])

# ============================================================================
# FIVERR/UPWORK FEATURE PARITY - Gig Marketplace & Seller Tier System
# ============================================================================

# Gig Marketplace - Fiverr-style service packages with 3-tier pricing
api_router.include_router(gigs.router, prefix="/gigs", tags=["gigs"])

# Seller Stats & Tier System - Bronze to Platinum levels with JSS algorithm
api_router.include_router(seller_stats.router, prefix="/seller-stats", tags=["seller-stats"])

# Talent Invitations - Upwork-style invite-to-bid system
api_router.include_router(talent_invitations.router, prefix="/invitations", tags=["talent-invitations"])

# ============================================================================
# EXTERNAL PROJECT SCRAPER - Aggregate freelance projects from RemoteOK, Jobicy, Arbeitnow
# ============================================================================
api_router.include_router(external_projects.router, prefix="", tags=["external-projects"])