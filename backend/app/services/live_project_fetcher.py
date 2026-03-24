# @AI-HINT: Live project fetcher service — pulls REAL freelance/remote project data
# from public APIs and creates NATIVE MegiLance projects. Freelancers apply through
# MegiLance's own proposal system — no traffic sent to external platforms.
"""
Live Project Fetcher Service
==============================
Fetches real project requirements from free public APIs and creates them as
native MegiLance projects:
  1. RemoteOK API — real job requirements, skills, salaries
  2. Remotive API — curated remote job specifications
  3. Freelancer.com API — active project specs with budgets

IMPORTANT: Projects are created as NATIVE MegiLance listings.
Freelancers submit proposals through MegiLance — no external links.
Real market data (budgets, skills, requirements) is preserved.

Usage:
  # As a script
  cd backend && python -m app.services.live_project_fetcher

  # From code
  from app.services.live_project_fetcher import fetch_and_seed_live_projects
  result = fetch_and_seed_live_projects(limit_per_source=20)
"""

import json
import logging
import hashlib
import requests
from datetime import datetime, timezone, timedelta
from typing import Any

from app.db.turso_http import execute_query
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

# ============================================================================
# API Configuration — all free, no auth required
# ============================================================================
APIS = {
    "remoteok": {
        "url": "https://remoteok.com/api",
        "headers": {"User-Agent": "MegiLance/1.0 (job-aggregator)"},
    },
    "remotive": {
        "url": "https://remotive.com/api/remote-jobs",
        "headers": {},
    },
    "freelancer": {
        "url": "https://www.freelancer.com/api/projects/0.1/projects/active/",
        "headers": {},
        "params": {"compact": "true", "limit": 30, "job_details": "true",
                   "full_description": "true"},
    },
}

# Category mapping for normalization
CATEGORY_MAP = {
    # RemoteOK / Remotive tags → MegiLance categories
    "dev": "Web Development", "software-dev": "Web Development",
    "frontend": "Web Development", "backend": "Web Development",
    "fullstack": "Web Development", "web": "Web Development",
    "react": "Web Development", "javascript": "Web Development",
    "python": "Web Development", "node": "Web Development",
    "go": "Web Development", "rust": "Web Development",
    "ruby": "Web Development", "java": "Web Development",
    "devops": "Web Development", "sysadmin": "Web Development",
    "mobile": "Mobile Development", "ios": "Mobile Development",
    "android": "Mobile Development", "react-native": "Mobile Development",
    "flutter": "Mobile Development",
    "design": "Design & Creative", "ux": "Design & Creative",
    "ui": "Design & Creative", "product-design": "Design & Creative",
    "data": "Data Science & Analytics", "data-science": "Data Science & Analytics",
    "machine-learning": "Data Science & Analytics", "ai": "Data Science & Analytics",
    "analytics": "Data Science & Analytics",
    "marketing": "Marketing & Sales", "sales": "Marketing & Sales",
    "seo": "Marketing & Sales", "growth": "Marketing & Sales",
    "content": "Writing & Content", "writing": "Writing & Content",
    "copywriting": "Writing & Content", "technical-writing": "Writing & Content",
    "video": "Video & Animation", "animation": "Video & Animation",
    "security": "Web Development", "cloud": "Web Development",
    "crypto": "Web Development", "blockchain": "Web Development",
    "qa": "Web Development", "testing": "Web Development",
    # Remotive category slugs
    "software-development": "Web Development",
    "customer-support": "Other",
    "product": "Other",
    "finance-legal": "Other",
    "human-resources": "Other",
    "all-others": "Other",
}

# Freelancer.com category → MegiLance category
FREELANCER_CATEGORY_MAP = {
    "websites-it-software": "Web Development",
    "mobile-phones-computing": "Mobile Development",
    "design-media-architecture": "Design & Creative",
    "data-entry-admin": "Data Science & Analytics",
    "engineering-science": "Other",
    "writing-content": "Writing & Content",
    "sales-marketing": "Marketing & Sales",
    "translation-languages": "Other",
}

# Source client accounts — created once, reused on subsequent runs
# These represent real companies/clients whose projects are now hosted on MegiLance
SOURCE_CLIENTS = {
    "remoteok": {
        "name": "MegiLance Remote Opportunities",
        "email": "remote-projects@megilance.io",
        "bio": "Verified remote opportunities curated from the global job market. "
               "All projects accept proposals directly through MegiLance.",
    },
    "remotive": {
        "name": "MegiLance Curated Projects",
        "email": "curated-projects@megilance.io",
        "bio": "Hand-picked remote projects curated from top employers worldwide. "
               "Submit your proposal on MegiLance to get started.",
    },
    "freelancer": {
        "name": "MegiLance Freelance Projects",
        "email": "freelance-projects@megilance.io",
        "bio": "Active freelance projects with real budgets and requirements. "
               "Bid on projects directly through MegiLance's proposal system.",
    },
}


# ============================================================================
# API Fetchers
# ============================================================================

def _fetch_remoteok(limit: int = 30) -> list[dict]:
    """Fetch jobs from RemoteOK public API."""
    try:
        resp = requests.get(
            APIS["remoteok"]["url"],
            headers=APIS["remoteok"]["headers"],
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()

        # First item is a legal notice object, skip it
        jobs = [j for j in data if isinstance(j, dict) and j.get("id")][:limit]
        results = []

        for job in jobs:
            tags = job.get("tags") or []
            category = "Other"
            for tag in tags:
                mapped = CATEGORY_MAP.get(tag.lower())
                if mapped:
                    category = mapped
                    break

            salary_min = job.get("salary_min") or 0
            salary_max = job.get("salary_max") or 0
            # RemoteOK salaries are annual; if unreasonably large for hourly, convert
            budget_type = "fixed"
            if salary_min and salary_max:
                budget_min = float(salary_min)
                budget_max = float(salary_max)
            else:
                budget_min = 0.0
                budget_max = 0.0

            apply_url = job.get("apply_url") or job.get("url") or ""
            company = job.get("company") or "Unknown Company"
            position = job.get("position") or job.get("title") or "Remote Position"
            location = job.get("location") or "Remote"
            description_raw = job.get("description") or ""

            # Strip HTML tags from description
            import re
            clean_desc = re.sub(r"<[^>]+>", " ", description_raw)
            clean_desc = re.sub(r"\s+", " ", clean_desc).strip()
            # Truncate to reasonable length
            if len(clean_desc) > 2000:
                clean_desc = clean_desc[:2000] + "..."

            description = (
                f"**{position}** — {company}\n\n"
                f"**Location:** {location}\n"
            )
            if salary_min or salary_max:
                description += f"**Budget:** ${salary_min:,} - ${salary_max:,}/year\n"
            description += "\n"
            if clean_desc:
                description += f"{clean_desc}\n\n"
            source_id = str(job.get("id", ""))
            description += (
                "**How to Apply:** Submit your proposal through MegiLance. "
                "Include your relevant experience, portfolio links, and availability.\n\n"
                f"_Project sourced from verified remote job market data._\n"
                f"[ref:remoteok:{source_id}]"
            )

            skills = [t.title() for t in tags[:8]] if tags else [category.split(" ")[0]]

            results.append({
                "title": f"{position} — {company}",
                "description": description,
                "category": category,
                "skills": skills,
                "budget_type": budget_type,
                "budget_min": budget_min,
                "budget_max": budget_max,
                "experience_level": "intermediate",
                "estimated_duration": "More than 6 months",
                "source": "remoteok",
                "source_id": str(job.get("id", "")),
            })

        logger.info(f"RemoteOK: fetched {len(results)} jobs")
        return results

    except Exception as e:
        logger.error(f"RemoteOK fetch failed: {e}")
        return []


def _fetch_remotive(limit: int = 30) -> list[dict]:
    """Fetch jobs from Remotive public API."""
    try:
        resp = requests.get(
            APIS["remotive"]["url"],
            headers=APIS["remotive"]["headers"],
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        jobs = (data.get("jobs") or [])[:limit]
        results = []

        for job in jobs:
            cat_slug = (job.get("category") or "").lower().replace(" ", "-")
            category = CATEGORY_MAP.get(cat_slug, "Other")

            salary_raw = job.get("salary") or ""
            budget_min, budget_max = 0.0, 0.0
            if salary_raw:
                import re
                nums = re.findall(r"[\d,]+", salary_raw.replace(",", ""))
                nums = [float(n) for n in nums if n]
                if len(nums) >= 2:
                    budget_min, budget_max = nums[0], nums[1]
                elif len(nums) == 1:
                    budget_min = budget_max = nums[0]

            company = job.get("company_name") or "Unknown Company"
            title = job.get("title") or "Remote Position"
            url = job.get("url") or ""
            location = job.get("candidate_required_location") or "Worldwide"
            job_type = job.get("job_type") or ""
            description_raw = job.get("description") or ""

            import re
            clean_desc = re.sub(r"<[^>]+>", " ", description_raw)
            clean_desc = re.sub(r"\s+", " ", clean_desc).strip()
            if len(clean_desc) > 2000:
                clean_desc = clean_desc[:2000] + "..."

            description = (
                f"**{title}** — {company}\n\n"
                f"**Location:** {location}\n"
                f"**Type:** {job_type}\n"
            )
            if salary_raw:
                description += f"**Budget:** {salary_raw}\n"
            description += "\n"
            if clean_desc:
                description += f"{clean_desc}\n\n"
            source_id = str(job.get("id", ""))
            description += (
                "**How to Apply:** Submit your proposal through MegiLance. "
                "Include your relevant experience, portfolio links, and availability.\n\n"
                f"_Project sourced from verified remote job market data._\n"
                f"[ref:remotive:{source_id}]"
            )

            tags = job.get("tags") or []
            skills = [t.title() for t in tags[:8]] if tags else [category.split(" ")[0]]

            results.append({
                "title": f"{title} — {company}",
                "description": description,
                "category": category,
                "skills": skills,
                "budget_type": "fixed",
                "budget_min": budget_min,
                "budget_max": budget_max,
                "experience_level": "intermediate",
                "estimated_duration": "More than 6 months",
                "source": "remotive",
                "source_id": str(job.get("id", "")),
            })

        logger.info(f"Remotive: fetched {len(results)} jobs")
        return results

    except Exception as e:
        logger.error(f"Remotive fetch failed: {e}")
        return []


def _fetch_freelancer(limit: int = 30) -> list[dict]:
    """Fetch active projects from Freelancer.com public API."""
    try:
        params = {**APIS["freelancer"]["params"], "limit": limit}
        resp = requests.get(
            APIS["freelancer"]["url"],
            headers=APIS["freelancer"]["headers"],
            params=params,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()

        projects = data.get("result", {}).get("projects") or []
        results = []

        for proj in projects:
            pid = proj.get("id", "")
            title = proj.get("title") or "Freelance Project"
            desc = proj.get("preview_description") or proj.get("description") or ""
            budget = proj.get("budget") or {}
            budget_min = float(budget.get("minimum") or 0)
            budget_max = float(budget.get("maximum") or 0)
            currency = proj.get("currency", {}).get("code", "USD")
            proj_type = proj.get("type") or "fixed"
            budget_type = "hourly" if proj_type == "hourly" else "fixed"
            bid_stats = proj.get("bid_stats") or {}
            bid_count = bid_stats.get("bid_count", 0)
            avg_bid = bid_stats.get("bid_avg", 0)

            # Extract skills from jobs array
            jobs = proj.get("jobs") or []
            skills = [j.get("name", "") for j in jobs if j.get("name")][:8]

            # Determine category from skills/jobs
            category = "Other"
            skill_lower = " ".join(s.lower() for s in skills)
            if any(k in skill_lower for k in ["react", "php", "javascript", "html", "css", "node", "python", "django", "laravel", "angular", "vue"]):
                category = "Web Development"
            elif any(k in skill_lower for k in ["android", "ios", "mobile", "flutter", "react native", "swift", "kotlin"]):
                category = "Mobile Development"
            elif any(k in skill_lower for k in ["graphic design", "logo", "illustrator", "photoshop", "animation", "3d", "ui design"]):
                category = "Design & Creative"
            elif any(k in skill_lower for k in ["data", "excel", "machine learning", "ai", "analytics"]):
                category = "Data Science & Analytics"
            elif any(k in skill_lower for k in ["marketing", "seo", "social media", "facebook", "instagram"]):
                category = "Marketing & Sales"
            elif any(k in skill_lower for k in ["writing", "content", "article", "copywriting"]):
                category = "Writing & Content"

            # Build a slug for the apply URL
            seo_url = proj.get("seo_url") or ""
            if seo_url:
                apply_url = f"https://www.freelancer.com/projects/{seo_url}"
            else:
                apply_url = f"https://www.freelancer.com/projects/{pid}"

            description = (
                f"**{title}**\n\n"
                f"**Budget:** {currency} {budget_min:,.0f} - {budget_max:,.0f} ({budget_type})\n"
                f"**Status:** Open, accepting proposals\n\n"
            )
            if desc:
                description += f"{desc}\n\n"
            if skills:
                description += f"**Required Skills:** {', '.join(skills)}\n\n"
            description += (
                "**How to Apply:** Submit your proposal through MegiLance. "
                "Include your rate, timeline estimate, and relevant portfolio work.\n\n"
                f"_Project sourced from verified freelance market data._\n"
                f"[ref:freelancer:{pid}]"
            )

            results.append({
                "title": title,
                "description": description,
                "category": category,
                "skills": skills if skills else ["Freelancing"],
                "budget_type": budget_type,
                "budget_min": budget_min,
                "budget_max": budget_max,
                "experience_level": "intermediate",
                "estimated_duration": "1-3 months",
                "source": "freelancer",
                "source_id": str(pid),
            })

        logger.info(f"Freelancer.com: fetched {len(results)} projects")
        return results

    except Exception as e:
        logger.error(f"Freelancer.com fetch failed: {e}")
        return []


# ============================================================================
# Database Operations
# ============================================================================

def _ensure_source_client(source: str) -> int | None:
    """Get or create the client account for a given source. Returns client_id."""
    client_info = SOURCE_CLIENTS.get(source)
    if not client_info:
        return None

    result = execute_query(
        "SELECT id FROM users WHERE email = ?",
        [client_info["email"]],
    )
    if result and result.get("rows") and len(result["rows"]) > 0:
        val = result["rows"][0][0]
        return int(val.get("value") if isinstance(val, dict) else val)

    # Create the source client
    hashed = get_password_hash("LiveSource2026!")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    execute_query(
        """INSERT INTO users (
            email, hashed_password, name, user_type, role, is_active,
            bio, created_at, updated_at, joined_at,
            is_verified, email_verified, two_factor_enabled, account_balance
        ) VALUES (?, ?, ?, 'Client', 'client', 1, ?, ?, ?, ?, 1, 1, 0, 50000.0)""",
        [
            client_info["email"], hashed, client_info["name"],
            client_info["bio"], now, now, now,
        ],
    )
    result = execute_query(
        "SELECT id FROM users WHERE email = ?",
        [client_info["email"]],
    )
    if result and result.get("rows") and len(result["rows"]) > 0:
        val = result["rows"][0][0]
        return int(val.get("value") if isinstance(val, dict) else val)
    return None


def _project_exists(title: str) -> bool:
    """Check if a project with this exact title already exists."""
    result = execute_query("SELECT id FROM projects WHERE title = ?", [title])
    return bool(result and result.get("rows") and len(result["rows"]) > 0)


def _source_id_exists(source: str, source_id: str) -> bool:
    """Check if we already imported a project from this source with this ID.
    
    Uses a hidden dedup marker embedded in the description: [ref:source:id]
    Also checks legacy format for backward compat with old imports.
    """
    # New format: [ref:remoteok:12345]
    new_pattern = f"%[ref:{source}:{source_id}]%"
    result = execute_query(
        "SELECT id FROM projects WHERE description LIKE ?",
        [new_pattern],
    )
    if result and result.get("rows") and len(result["rows"]) > 0:
        return True

    # Legacy format for projects imported before the native rewrite
    legacy_pattern = None
    if source == "remoteok":
        legacy_pattern = f"%RemoteOK Job #{source_id}%"
    elif source == "remotive":
        legacy_pattern = f"%Remotive Job #{source_id}%"
    elif source == "freelancer":
        legacy_pattern = f"%Freelancer.com Project #{source_id}%"

    if legacy_pattern:
        result = execute_query(
            "SELECT id FROM projects WHERE description LIKE ?",
            [legacy_pattern],
        )
        return bool(result and result.get("rows") and len(result["rows"]) > 0)
    return False


def _insert_project(project: dict, client_id: int) -> bool:
    """Insert a single project into the database. Returns True on success."""
    import random
    days_ago = random.randint(0, 3)
    created_at = (
        datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))
    ).strftime("%Y-%m-%d %H:%M:%S")

    try:
        execute_query(
            """INSERT INTO projects (
                title, description, client_id, category,
                budget_type, budget_min, budget_max,
                experience_level, estimated_duration,
                skills, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)""",
            [
                project["title"],
                project["description"],
                client_id,
                project["category"],
                project["budget_type"],
                project["budget_min"],
                project["budget_max"],
                project["experience_level"],
                project["estimated_duration"],
                json.dumps(project["skills"]),
                created_at,
                created_at,
            ],
        )
        return True
    except Exception as e:
        logger.error(f"Insert failed for '{project['title'][:50]}': {e}")
        return False


# ============================================================================
# Main Orchestrator
# ============================================================================

def fetch_and_seed_live_projects(
    limit_per_source: int = 25,
    sources: list[str] | None = None,
) -> dict[str, Any]:
    """
    Fetch REAL projects from live APIs and seed them into MegiLance.

    Args:
        limit_per_source: Max projects to fetch per API source (default 25)
        sources: Which sources to use. Default: all three.
                 Options: ["remoteok", "remotive", "freelancer"]

    Returns:
        dict with stats: {fetched, inserted, skipped, errors, by_source}
    """
    if sources is None:
        sources = ["remoteok", "remotive", "freelancer"]

    stats: dict[str, Any] = {
        "fetched": 0,
        "inserted": 0,
        "skipped": 0,
        "errors": 0,
        "by_source": {},
    }

    # Fetch from all sources
    all_projects: list[dict] = []

    fetchers = {
        "remoteok": _fetch_remoteok,
        "remotive": _fetch_remotive,
        "freelancer": _fetch_freelancer,
    }

    for source in sources:
        if source in fetchers:
            projects = fetchers[source](limit_per_source)
            stats["by_source"][source] = {"fetched": len(projects), "inserted": 0, "skipped": 0}
            all_projects.extend(projects)
            logger.info(f"  {source}: fetched {len(projects)}")

    stats["fetched"] = len(all_projects)

    if not all_projects:
        logger.warning("No projects fetched from any source!")
        return stats

    # Insert projects
    for project in all_projects:
        source = project.get("source", "unknown")
        source_id = project.get("source_id", "")

        # Deduplicate by source ID (preferred) or title
        if source_id and _source_id_exists(source, source_id):
            stats["skipped"] += 1
            if source in stats["by_source"]:
                stats["by_source"][source]["skipped"] += 1
            continue

        if _project_exists(project["title"]):
            stats["skipped"] += 1
            if source in stats["by_source"]:
                stats["by_source"][source]["skipped"] += 1
            continue

        # Get or create the source client
        client_id = _ensure_source_client(source)
        if not client_id:
            stats["errors"] += 1
            continue

        if _insert_project(project, client_id):
            stats["inserted"] += 1
            if source in stats["by_source"]:
                stats["by_source"][source]["inserted"] += 1
        else:
            stats["errors"] += 1

    return stats


# ============================================================================
# CLI Runner
# ============================================================================

def main():
    """CLI entry point for fetching live projects."""
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    parser = argparse.ArgumentParser(description="Fetch REAL live projects into MegiLance")
    parser.add_argument("--limit", type=int, default=25,
                        help="Max projects per source (default: 25)")
    parser.add_argument("--sources", nargs="+",
                        choices=["remoteok", "remotive", "freelancer"],
                        default=None,
                        help="Which sources to fetch from (default: all)")
    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("  MegiLance LIVE Project Fetcher")
    logger.info("  Fetching REAL projects from public APIs...")
    logger.info("=" * 70)

    result = fetch_and_seed_live_projects(
        limit_per_source=args.limit,
        sources=args.sources,
    )

    logger.info(f"\n{'=' * 70}")
    logger.info(f"  Results:")
    logger.info(f"    Fetched:  {result['fetched']}")
    logger.info(f"    Inserted: {result['inserted']}")
    logger.info(f"    Skipped:  {result['skipped']} (already existed)")
    logger.info(f"    Errors:   {result['errors']}")
    print()

    for source, s in result["by_source"].items():
        logger.info(f"    {source}: {s['fetched']} fetched → {s['inserted']} new, {s['skipped']} skipped")

    # Verify
    total = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'open'")
    if total and total.get("rows"):
        v = total["rows"][0][0]
        count = int(v.get("value") if isinstance(v, dict) else v)
        logger.info(f"\n  Total open projects on platform: {count}")

    real = execute_query("SELECT COUNT(*) FROM projects WHERE description LIKE '%APPLY HERE (REAL LINK)%'")
    if real and real.get("rows"):
        v = real["rows"][0][0]
        count = int(v.get("value") if isinstance(v, dict) else v)
        logger.info(f"  Projects with real apply links: {count}")

    logger.info(f"{'=' * 70}")
    logger.info("  Done! Run again anytime to fetch fresh projects.")
    logger.info(f"{'=' * 70}")


if __name__ == "__main__":
    main()
