# @AI-HINT: Project Scope & Budget Planner engine – AI-assisted project planning for freelancers/clients
"""
Scope Planner Engine - Standalone, public project scope & budget planning tool.
No authentication required. Generates milestone breakdowns, timelines, resource plans,
risk assessments, and budget estimates for freelance projects.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger("megilance")

# ============================================================================
# Project Categories with default phase templates
# ============================================================================

PROJECT_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "web_app": {
        "label": "Web Application",
        "icon": "globe",
        "description": "Full-stack web application development",
        "default_phases": [
            {"name": "Discovery & Requirements", "percent": 10, "description": "Gather requirements, user stories, wireframes"},
            {"name": "UI/UX Design", "percent": 15, "description": "Design system, mockups, prototyping"},
            {"name": "Frontend Development", "percent": 25, "description": "Build UI components, pages, client-side logic"},
            {"name": "Backend Development", "percent": 25, "description": "APIs, database, server-side logic"},
            {"name": "Integration & Testing", "percent": 15, "description": "QA, bug fixes, integration tests"},
            {"name": "Deployment & Launch", "percent": 10, "description": "Server setup, CI/CD, go-live, monitoring"},
        ],
    },
    "mobile_app": {
        "label": "Mobile Application",
        "icon": "smartphone",
        "description": "iOS and/or Android mobile application",
        "default_phases": [
            {"name": "Discovery & Requirements", "percent": 10},
            {"name": "UI/UX Design", "percent": 15},
            {"name": "Core Development", "percent": 30},
            {"name": "API Integration", "percent": 15},
            {"name": "Testing & QA", "percent": 15},
            {"name": "App Store Submission", "percent": 15},
        ],
    },
    "ecommerce": {
        "label": "E-Commerce Platform",
        "icon": "shopping-cart",
        "description": "Online store with payments, inventory, orders",
        "default_phases": [
            {"name": "Requirements & Platform Selection", "percent": 10},
            {"name": "Design & Branding", "percent": 15},
            {"name": "Store Development", "percent": 25},
            {"name": "Payment & Shipping Integration", "percent": 15},
            {"name": "Product Data & Content", "percent": 10},
            {"name": "Testing & Launch", "percent": 15},
            {"name": "Post-Launch Support", "percent": 10},
        ],
    },
    "branding": {
        "label": "Branding & Design",
        "icon": "palette",
        "description": "Brand identity, logo, style guides",
        "default_phases": [
            {"name": "Research & Discovery", "percent": 15},
            {"name": "Concept Development", "percent": 25},
            {"name": "Design Iteration", "percent": 30},
            {"name": "Asset Production", "percent": 20},
            {"name": "Brand Guidelines", "percent": 10},
        ],
    },
    "marketing": {
        "label": "Marketing Campaign",
        "icon": "megaphone",
        "description": "Digital marketing, SEO, content strategy",
        "default_phases": [
            {"name": "Audit & Strategy", "percent": 15},
            {"name": "Content Creation", "percent": 25},
            {"name": "Campaign Setup", "percent": 20},
            {"name": "Execution & Management", "percent": 25},
            {"name": "Reporting & Optimization", "percent": 15},
        ],
    },
    "data_analytics": {
        "label": "Data & Analytics",
        "icon": "bar-chart-2",
        "description": "Data pipelines, dashboards, ML models",
        "default_phases": [
            {"name": "Data Assessment", "percent": 15},
            {"name": "Infrastructure Setup", "percent": 15},
            {"name": "Data Modeling", "percent": 25},
            {"name": "Dashboard Development", "percent": 20},
            {"name": "Validation & Documentation", "percent": 15},
            {"name": "Training & Handoff", "percent": 10},
        ],
    },
    "consulting": {
        "label": "Consulting Engagement",
        "icon": "message-circle",
        "description": "Strategy, advisory, process improvement",
        "default_phases": [
            {"name": "Assessment & Discovery", "percent": 20},
            {"name": "Analysis & Research", "percent": 25},
            {"name": "Strategy Development", "percent": 25},
            {"name": "Recommendations Report", "percent": 15},
            {"name": "Implementation Support", "percent": 15},
        ],
    },
    "content_creation": {
        "label": "Content & Copywriting",
        "icon": "file-text",
        "description": "Blog posts, website copy, technical writing",
        "default_phases": [
            {"name": "Research & Brief", "percent": 15},
            {"name": "Outline & Structure", "percent": 15},
            {"name": "Draft Writing", "percent": 30},
            {"name": "Revisions & Editing", "percent": 25},
            {"name": "Final Delivery", "percent": 15},
        ],
    },
    "custom": {
        "label": "Custom Project",
        "icon": "settings",
        "description": "Define your own project phases",
        "default_phases": [
            {"name": "Planning", "percent": 15},
            {"name": "Execution", "percent": 50},
            {"name": "Review & Delivery", "percent": 20},
            {"name": "Post-Delivery Support", "percent": 15},
        ],
    },
}

# ============================================================================
# Complexity Multipliers
# ============================================================================

COMPLEXITY_LEVELS: Dict[str, Dict[str, Any]] = {
    "simple": {"label": "Simple", "multiplier": 0.7, "description": "Straightforward, well-defined scope, standard requirements"},
    "moderate": {"label": "Moderate", "multiplier": 1.0, "description": "Some complexity, moderate integrations, standard timeline"},
    "complex": {"label": "Complex", "multiplier": 1.5, "description": "Multiple integrations, custom features, tight timeline"},
    "enterprise": {"label": "Enterprise", "multiplier": 2.2, "description": "Large-scale, strict compliance, multiple stakeholders"},
}

# ============================================================================
# Team Roles
# ============================================================================

TEAM_ROLES: List[Dict[str, Any]] = [
    {"key": "project_manager", "label": "Project Manager", "avg_rate": 95, "description": "Coordination, planning, stakeholder communication"},
    {"key": "designer", "label": "UI/UX Designer", "avg_rate": 85, "description": "User interface and experience design"},
    {"key": "frontend_dev", "label": "Frontend Developer", "avg_rate": 90, "description": "Client-side implementation"},
    {"key": "backend_dev", "label": "Backend Developer", "avg_rate": 100, "description": "Server-side, APIs, database"},
    {"key": "fullstack_dev", "label": "Full-Stack Developer", "avg_rate": 95, "description": "End-to-end development"},
    {"key": "mobile_dev", "label": "Mobile Developer", "avg_rate": 100, "description": "iOS/Android development"},
    {"key": "devops", "label": "DevOps Engineer", "avg_rate": 110, "description": "Infrastructure, CI/CD, deployments"},
    {"key": "qa_tester", "label": "QA/Tester", "avg_rate": 70, "description": "Testing, bug reporting, quality assurance"},
    {"key": "data_analyst", "label": "Data Analyst", "avg_rate": 85, "description": "Data analysis, reporting, visualization"},
    {"key": "copywriter", "label": "Copywriter", "avg_rate": 65, "description": "Content creation, copywriting"},
    {"key": "consultant", "label": "Consultant/Advisor", "avg_rate": 120, "description": "Expert advisory and strategy"},
]

# ============================================================================
# Risk Categories
# ============================================================================

RISK_CATEGORIES: List[Dict[str, str]] = [
    {"key": "scope_creep", "label": "Scope Creep", "description": "Uncontrolled changes or continuous growth in project scope"},
    {"key": "timeline", "label": "Timeline Risk", "description": "Delays due to dependencies, estimation errors, or resource issues"},
    {"key": "technical", "label": "Technical Risk", "description": "Unfamiliar technology, integration complexity, performance issues"},
    {"key": "resource", "label": "Resource Risk", "description": "Team availability, skill gaps, contractor reliability"},
    {"key": "budget", "label": "Budget Risk", "description": "Cost overruns, underestimated expenses, currency fluctuations"},
    {"key": "communication", "label": "Communication Risk", "description": "Misunderstandings, stakeholder alignment, feedback delays"},
    {"key": "external", "label": "External Dependencies", "description": "Third-party APIs, vendor delays, regulatory changes"},
]


# ============================================================================
# Engine Functions
# ============================================================================

def get_options() -> Dict[str, Any]:
    """Return all available scope planner options."""
    return {
        "categories": [
            {
                "key": k,
                "label": v["label"],
                "icon": v["icon"],
                "description": v["description"],
                "phase_count": len(v["default_phases"]),
            }
            for k, v in PROJECT_CATEGORIES.items()
        ],
        "complexity_levels": [
            {"key": k, "label": v["label"], "multiplier": v["multiplier"], "description": v["description"]}
            for k, v in COMPLEXITY_LEVELS.items()
        ],
        "team_roles": TEAM_ROLES,
        "risk_categories": RISK_CATEGORIES,
    }


def plan_project(
    # Project basics
    project_name: str = "Untitled Project",
    category: str = "web_app",
    description: str = "",
    complexity: str = "moderate",
    # Timeline
    total_weeks: int = 12,
    start_date: str = "",
    # Budget
    total_budget: Optional[float] = None,
    currency: str = "USD",
    hourly_rate: float = 75,
    # Team
    team_members: List[Dict[str, Any]] = None,
    # Custom phases (override defaults)
    custom_phases: List[Dict[str, Any]] = None,
    # Risk tolerance
    risk_buffer_percent: float = 15,
    # Features / requirements
    features: List[str] = None,
    # Deliverables
    deliverables: List[str] = None,
) -> Dict[str, Any]:
    """Generate a complete project scope & budget plan."""

    if not team_members:
        team_members = []
    if not features:
        features = []
    if not deliverables:
        deliverables = []

    cat_info = PROJECT_CATEGORIES.get(category, PROJECT_CATEGORIES["custom"])
    complexity_info = COMPLEXITY_LEVELS.get(complexity, COMPLEXITY_LEVELS["moderate"])
    multiplier = complexity_info["multiplier"]

    # Determine phases
    phases = custom_phases if custom_phases else cat_info["default_phases"]

    # Build phase plan
    phase_plan = _build_phase_plan(
        phases=phases,
        total_weeks=total_weeks,
        multiplier=multiplier,
        start_date=start_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )

    # Budget estimation
    budget = _estimate_budget(
        total_weeks=total_weeks,
        multiplier=multiplier,
        hourly_rate=hourly_rate,
        team_members=team_members,
        total_budget=total_budget,
        currency=currency,
        risk_buffer_percent=risk_buffer_percent,
        phases=phase_plan,
    )

    # Resource allocation
    resource_plan = _allocate_resources(
        phases=phase_plan,
        team_members=team_members,
        category=category,
    )

    # Risk assessment
    risks = _assess_risks(
        complexity=complexity,
        total_weeks=total_weeks,
        budget_total=budget["total"],
        team_size=len(team_members),
        features_count=len(features),
    )

    # Timeline summary
    total_adjusted = sum(p["weeks"] for p in phase_plan)
    timeline = {
        "total_weeks": total_adjusted,
        "total_months": round(total_adjusted / 4.33, 1),
        "start_date": start_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "phases": phase_plan,
    }

    # Feature mapping to phases
    feature_mapping = _map_features_to_phases(features, phase_plan, category) if features else []

    # Completeness score
    score = _calc_plan_completeness(
        project_name=project_name,
        description=description,
        features=features,
        deliverables=deliverables,
        team_members=team_members,
        total_budget=total_budget,
    )

    return {
        "project": {
            "name": project_name,
            "category": category,
            "category_label": cat_info["label"],
            "description": description,
            "complexity": complexity,
            "complexity_label": complexity_info["label"],
            "multiplier": multiplier,
        },
        "timeline": timeline,
        "budget": budget,
        "resources": resource_plan,
        "risks": risks,
        "features": feature_mapping,
        "deliverables": deliverables,
        "completeness": score,
        "recommendations": _get_recommendations(
            complexity=complexity,
            total_weeks=total_weeks,
            team_size=len(team_members),
            budget_total=budget["total"],
            category=category,
        ),
        "meta": {
            "currency": currency,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generator": "MegiLance Scope Planner",
        },
    }


def _build_phase_plan(phases, total_weeks, multiplier, start_date) -> List[Dict[str, Any]]:
    """Build detailed phase plan with timelines."""
    result = []
    current_week = 0

    for i, phase in enumerate(phases):
        pct = phase.get("percent", 100 / len(phases))
        raw_weeks = total_weeks * (pct / 100)
        adjusted_weeks = max(round(raw_weeks * multiplier, 1), 0.5)

        result.append({
            "number": i + 1,
            "name": phase["name"],
            "description": phase.get("description", ""),
            "percent_of_total": pct,
            "weeks": adjusted_weeks,
            "start_week": round(current_week, 1),
            "end_week": round(current_week + adjusted_weeks, 1),
            "status": "planned",
        })
        current_week += adjusted_weeks

    return result


def _estimate_budget(
    total_weeks, multiplier, hourly_rate, team_members, total_budget,
    currency, risk_buffer_percent, phases,
) -> Dict[str, Any]:
    """Estimate full project budget."""

    # Calculate from team members if provided
    if team_members:
        labor_cost = 0
        team_breakdown = []
        for member in team_members:
            role_info = next((r for r in TEAM_ROLES if r["key"] == member.get("role")), None)
            rate = member.get("rate", role_info["avg_rate"] if role_info else hourly_rate)
            hours = member.get("hours_per_week", 40) * total_weeks * multiplier
            cost = rate * hours
            labor_cost += cost
            team_breakdown.append({
                "role": role_info["label"] if role_info else member.get("role", "Unknown"),
                "rate": rate,
                "total_hours": round(hours, 0),
                "cost": round(cost, 2),
            })
    else:
        total_hours = total_weeks * 40 * multiplier
        labor_cost = total_hours * hourly_rate
        team_breakdown = [{
            "role": "Solo Freelancer",
            "rate": hourly_rate,
            "total_hours": round(total_hours, 0),
            "cost": round(labor_cost, 2),
        }]

    # Risk buffer
    buffer = labor_cost * (risk_buffer_percent / 100)

    # Phase budget split
    phase_budgets = []
    for phase in phases:
        pct = phase["percent_of_total"]
        phase_cost = labor_cost * (pct / 100)
        phase_budgets.append({
            "phase": phase["name"],
            "budget": round(phase_cost, 2),
            "percent": pct,
        })

    total = labor_cost + buffer

    # Compare with user-provided budget
    budget_status = None
    if total_budget:
        diff = total_budget - total
        if diff < 0:
            budget_status = {
                "status": "over_budget",
                "difference": round(abs(diff), 2),
                "message": f"Estimated cost exceeds budget by {currency} {abs(diff):,.2f}",
            }
        elif diff > total_budget * 0.2:
            budget_status = {
                "status": "under_budget",
                "difference": round(diff, 2),
                "message": f"Budget has {currency} {diff:,.2f} margin. Consider adding buffer or features.",
            }
        else:
            budget_status = {
                "status": "on_budget",
                "difference": round(diff, 2),
                "message": "Estimated cost is within budget.",
            }

    return {
        "labor_cost": round(labor_cost, 2),
        "risk_buffer": round(buffer, 2),
        "risk_buffer_percent": risk_buffer_percent,
        "total": round(total, 2),
        "currency": currency,
        "team_breakdown": team_breakdown,
        "phase_budgets": phase_budgets,
        "budget_status": budget_status,
        "monthly_burn_rate": round(total / max(total_weeks / 4.33, 1), 2),
    }


def _allocate_resources(phases, team_members, category) -> Dict[str, Any]:
    """Create resource allocation plan across phases."""
    if not team_members:
        return {
            "team_size": 1,
            "allocation": [],
            "recommendation": "Consider adding team members for faster delivery or specialized tasks.",
        }

    # Simple allocation: all team members across all phases
    allocation = []
    for phase in phases:
        phase_resources = []
        for member in team_members:
            role_info = next((r for r in TEAM_ROLES if r["key"] == member.get("role")), None)
            # Determine involvement based on phase and role
            involvement = _get_role_involvement(member.get("role", ""), phase["name"], category)
            if involvement > 0:
                phase_resources.append({
                    "role": role_info["label"] if role_info else member.get("role"),
                    "involvement_percent": involvement,
                    "hours": round(phase["weeks"] * member.get("hours_per_week", 40) * (involvement / 100), 0),
                })
        allocation.append({
            "phase": phase["name"],
            "resources": phase_resources,
        })

    return {
        "team_size": len(team_members),
        "allocation": allocation,
    }


def _get_role_involvement(role: str, phase_name: str, category: str) -> int:
    """Determine how involved a role is in a given phase (0-100%)."""
    phase_lower = phase_name.lower()
    involvement_map = {
        "project_manager": {"discovery": 80, "requirement": 80, "design": 60, "develop": 40, "test": 60, "deploy": 70, "launch": 80, "support": 50, "planning": 90, "execution": 50, "review": 70, "assessment": 80, "strategy": 70, "report": 60},
        "designer": {"discovery": 40, "design": 100, "ui": 100, "ux": 100, "mockup": 100, "prototype": 90, "brand": 100, "concept": 90, "develop": 20, "test": 30, "deploy": 10},
        "frontend_dev": {"design": 30, "frontend": 100, "develop": 80, "core": 70, "integration": 60, "test": 50, "deploy": 40},
        "backend_dev": {"backend": 100, "api": 100, "develop": 80, "core": 70, "integration": 70, "test": 50, "deploy": 50, "infrastructure": 60, "data": 70},
        "fullstack_dev": {"design": 20, "develop": 90, "frontend": 80, "backend": 80, "core": 90, "integration": 70, "test": 50, "deploy": 60, "api": 80},
        "mobile_dev": {"develop": 90, "core": 90, "integration": 70, "test": 50, "app store": 80, "submission": 80},
        "devops": {"infrastructure": 100, "deploy": 100, "launch": 90, "ci": 100, "setup": 70, "test": 30, "monitoring": 90},
        "qa_tester": {"test": 100, "qa": 100, "integration": 70, "validation": 90, "review": 60, "deploy": 30},
        "data_analyst": {"data": 100, "analysis": 90, "assessment": 70, "dashboard": 100, "report": 80, "model": 80},
        "copywriter": {"content": 100, "copy": 100, "draft": 100, "writing": 100, "research": 60, "brief": 70, "revision": 80},
        "consultant": {"discovery": 80, "assessment": 90, "strategy": 100, "analysis": 80, "recommend": 100, "report": 70, "support": 50},
    }

    role_map = involvement_map.get(role, {})
    for keyword, pct in role_map.items():
        if keyword in phase_lower:
            return pct
    return 20  # Default minimal involvement


def _assess_risks(complexity, total_weeks, budget_total, team_size, features_count) -> List[Dict[str, Any]]:
    """Assess project risks based on parameters."""
    risks = []

    # Scope creep
    if features_count > 10:
        risks.append({
            "category": "scope_creep",
            "severity": "high",
            "title": "Large Feature Set",
            "message": f"{features_count} features increase scope creep risk significantly.",
            "mitigation": "Prioritize features with MoSCoW method. Define MVP clearly.",
        })
    elif features_count > 5:
        risks.append({
            "category": "scope_creep",
            "severity": "medium",
            "title": "Moderate Feature Count",
            "message": "Feature scope needs clear boundaries and acceptance criteria.",
            "mitigation": "Use a change order process for any scope additions.",
        })

    # Timeline
    if complexity in ("complex", "enterprise") and total_weeks < 12:
        risks.append({
            "category": "timeline",
            "severity": "high",
            "title": "Tight Timeline for Complexity",
            "message": f"{total_weeks} weeks may be insufficient for a {complexity} project.",
            "mitigation": "Consider extending timeline or reducing scope.",
        })

    # Team size
    if team_size == 0 and total_weeks < 8 and complexity != "simple":
        risks.append({
            "category": "resource",
            "severity": "medium",
            "title": "Solo Execution Risk",
            "message": "Solo work on this project may cause bottlenecks.",
            "mitigation": "Consider bringing in specialists for critical phases.",
        })

    # Budget
    if budget_total > 50000:
        risks.append({
            "category": "budget",
            "severity": "medium",
            "title": "Large Budget Exposure",
            "message": "High-value project requires careful financial tracking.",
            "mitigation": "Use milestone-based payments and regular budget reviews.",
        })

    # Communication (always relevant)
    if team_size > 3:
        risks.append({
            "category": "communication",
            "severity": "medium",
            "title": "Team Coordination",
            "message": f"A team of {team_size} requires structured communication.",
            "mitigation": "Establish weekly standups, shared tools, and clear ownership.",
        })

    # Complexity default risk
    if complexity == "enterprise":
        risks.append({
            "category": "technical",
            "severity": "high",
            "title": "Enterprise Complexity",
            "message": "Enterprise projects often face regulatory, compliance, and integration challenges.",
            "mitigation": "Allocate extra time for compliance reviews and integration testing.",
        })
    elif complexity == "complex":
        risks.append({
            "category": "technical",
            "severity": "medium",
            "title": "Technical Complexity",
            "message": "Complex integrations and custom features may introduce technical debt.",
            "mitigation": "Plan for architecture reviews and code quality checkpoints.",
        })

    if not risks:
        risks.append({
            "category": "general",
            "severity": "low",
            "title": "Well-Scoped Project",
            "message": "This project has manageable risk levels.",
            "mitigation": "Maintain regular check-ins and monitor progress against milestones.",
        })

    return risks


def _map_features_to_phases(features, phases, category) -> List[Dict[str, Any]]:
    """Map features to the most appropriate project phase."""
    mapped = []
    for feature in features:
        fl = feature.lower()
        best_phase = phases[1]["name"] if len(phases) > 1 else phases[0]["name"]  # Default to 2nd phase

        # Simple keyword matching
        if any(w in fl for w in ["design", "mockup", "wireframe", "ui", "ux", "layout"]):
            best_phase = next((p["name"] for p in phases if "design" in p["name"].lower()), best_phase)
        elif any(w in fl for w in ["api", "database", "backend", "server", "auth"]):
            best_phase = next((p["name"] for p in phases if "backend" in p["name"].lower() or "develop" in p["name"].lower()), best_phase)
        elif any(w in fl for w in ["test", "qa", "bug", "quality"]):
            best_phase = next((p["name"] for p in phases if "test" in p["name"].lower()), best_phase)
        elif any(w in fl for w in ["deploy", "launch", "hosting", "ci/cd"]):
            best_phase = next((p["name"] for p in phases if "deploy" in p["name"].lower() or "launch" in p["name"].lower()), best_phase)
        elif any(w in fl for w in ["requirement", "scope", "plan", "research"]):
            best_phase = next((p["name"] for p in phases if "discovery" in p["name"].lower() or "requirement" in p["name"].lower() or "plan" in p["name"].lower()), best_phase)

        mapped.append({
            "feature": feature,
            "phase": best_phase,
        })

    return mapped


def _calc_plan_completeness(project_name, description, features, deliverables, team_members, total_budget) -> Dict[str, Any]:
    """Calculate plan completeness score."""
    score = 0
    factors = []

    if project_name and project_name != "Untitled Project":
        score += 10
        factors.append({"factor": "Project named", "points": 10})
    if description:
        score += 15
        factors.append({"factor": "Description provided", "points": 15})
    if features:
        pts = min(len(features) * 3, 20)
        score += pts
        factors.append({"factor": f"{len(features)} features defined", "points": pts})
    if deliverables:
        pts = min(len(deliverables) * 4, 15)
        score += pts
        factors.append({"factor": f"{len(deliverables)} deliverables listed", "points": pts})
    if team_members:
        score += 15
        factors.append({"factor": "Team defined", "points": 15})
    if total_budget:
        score += 15
        factors.append({"factor": "Budget set", "points": 15})

    # Baseline for having the tool itself
    score += 10
    factors.append({"factor": "Scope plan generated", "points": 10})

    score = min(score, 100)
    level = "excellent" if score >= 85 else "good" if score >= 65 else "fair" if score >= 45 else "needs_work"

    return {"score": score, "level": level, "factors": factors}


def _get_recommendations(complexity, total_weeks, team_size, budget_total, category) -> List[Dict[str, str]]:
    """Generate project recommendations."""
    recs = []

    if complexity in ("complex", "enterprise") and team_size < 2:
        recs.append({
            "type": "warning",
            "title": "Consider Expanding Team",
            "message": f"A {complexity} project typically benefits from at least 2-3 team members.",
        })

    if total_weeks > 24:
        recs.append({
            "type": "info",
            "title": "Long Project Timeline",
            "message": "For projects over 6 months, consider breaking into phases with checkpoints.",
        })

    if total_weeks < 4 and complexity != "simple":
        recs.append({
            "type": "warning",
            "title": "Very Short Timeline",
            "message": "Consider phased delivery or reducing scope for this timeline.",
        })

    recs.append({
        "type": "info",
        "title": "Use MegiLance for Execution",
        "message": "Find verified freelancers and manage your project on MegiLance's platform.",
    })

    return recs
