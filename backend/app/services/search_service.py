# @AI-HINT: Service layer for intelligent search with relevance scoring, skill synonyms, and weighted ranking
"""
Search Service v2.0 - Intelligent search with relevance scoring,
skill-aware matching, weighted ranking, and enhanced discovery.
"""

from typing import Optional, List, Dict, Any
import re
import json

from app.db.turso_http import execute_query, parse_rows, to_str, parse_date


# ── Relevance scoring helpers ──

def _relevance_boost(text: str, query: str) -> float:
    """Calculate relevance boost score for a text matching a query."""
    if not text or not query:
        return 0.0
    text_lower = text.lower()
    query_lower = query.lower().strip()
    terms = query_lower.split()

    score = 0.0
    # Exact phrase match in text = highest boost
    if query_lower in text_lower:
        score += 3.0
    # Title starts with query = strong boost
    if text_lower.startswith(query_lower):
        score += 2.0
    # Individual term matches
    for term in terms:
        if term in text_lower:
            score += 0.5

    return score


def _extract_snippet(text: str, query: str, max_len: int = 200) -> str:
    """Extract a relevant snippet from text around the query match."""
    if not text:
        return ""
    if not query:
        return text[:max_len]

    text_lower = text.lower()
    query_lower = query.lower().strip()
    idx = text_lower.find(query_lower)

    if idx == -1:
        # Try first term
        terms = query_lower.split()
        for term in terms:
            idx = text_lower.find(term)
            if idx != -1:
                break

    if idx == -1:
        return text[:max_len]

    start = max(0, idx - 60)
    end = min(len(text), idx + max_len - 60)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet


def row_to_project(row: list) -> dict:
    """Convert a database row to a project dict."""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "title": to_str(row[1]),
        "description": to_str(row[2]),
        "category": to_str(row[3]),
        "budget_type": to_str(row[4]),
        "budget_min": float(row[5].get("value")) if row[5].get("type") != "null" else None,
        "budget_max": float(row[6].get("value")) if row[6].get("type") != "null" else None,
        "experience_level": to_str(row[7]),
        "estimated_duration": to_str(row[8]) if len(row) > 8 else "Not specified",
        "status": to_str(row[9]) if len(row) > 9 else "open",
        "skills": to_str(row[10]).split(",") if len(row) > 10 and to_str(row[10]) else [],
        "client_id": row[11].get("value") if len(row) > 11 and row[11].get("type") != "null" else None,
        "created_at": parse_date(row[12]) if len(row) > 12 else None,
        "updated_at": parse_date(row[13]) if len(row) > 13 else None
    }


def row_to_user(row: list) -> dict:
    """Convert a database row to a user dict."""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "email": to_str(row[1]),
        "name": to_str(row[2]),
        "first_name": to_str(row[3]),
        "last_name": to_str(row[4]),
        "bio": to_str(row[5]),
        "hourly_rate": float(row[6].get("value")) if row[6].get("type") != "null" else None,
        "location": to_str(row[7]),
        "skills": to_str(row[8]),
        "user_type": to_str(row[9]),
        "is_active": bool(row[10].get("value")) if row[10].get("type") != "null" else True,
        "joined_at": parse_date(row[11])
    }


# ── Sorting maps ──
PROJECT_SORT_MAP = {
    "newest": "p.created_at DESC",
    "oldest": "p.created_at ASC",
    "budget_high": "p.budget_max DESC",
    "budget_low": "p.budget_min ASC",
    "most_proposals": "proposal_count DESC",
}

FREELANCER_SORT_MAP = {
    "newest": "u.created_at DESC",
    "rate_high": "u.hourly_rate DESC",
    "rate_low": "u.hourly_rate ASC",
    "rating_high": "avg_rating DESC",
    "most_reviews": "review_count DESC",
}


def search_projects_advanced(where_clause: str, params: List,
                             sort: str = "newest") -> dict:
    """
    Enhanced project search returning items, total_count, and facets.
    """
    order = PROJECT_SORT_MAP.get(sort, "p.created_at DESC")

    # -- count --
    count_params = params[:-2]  # strip LIMIT/OFFSET
    count_result = execute_query(
        f"SELECT COUNT(*) as cnt FROM projects p WHERE {where_clause}",
        count_params,
    )
    total = 0
    if count_result:
        rows = parse_rows(count_result)
        if rows:
            total = rows[0].get("cnt", 0)

    # -- items with proposal count --
    result = execute_query(
        f"""SELECT p.id, p.title, p.description, p.category, p.budget_type,
                   p.budget_min, p.budget_max, p.experience_level,
                   p.estimated_duration, p.status, p.skills, p.client_id,
                   p.created_at, p.updated_at,
                   COALESCE(pc.proposal_count, 0) AS proposal_count
            FROM projects p
            LEFT JOIN (
                SELECT project_id, COUNT(*) AS proposal_count
                FROM proposals WHERE status != 'withdrawn'
                GROUP BY project_id
            ) pc ON p.id = pc.project_id
            WHERE {where_clause}
            ORDER BY {order}
            LIMIT ? OFFSET ?""",
        params,
    )
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            proj = row_to_project(row)
            proj["proposal_count"] = (
                row[14].get("value") if len(row) > 14 and row[14].get("type") != "null" else 0
            )
            items.append(proj)

    # -- facets (category counts + experience level counts) --
    facet_result = execute_query(
        f"""SELECT
                category,
                experience_level,
                COUNT(*) as cnt
            FROM projects p
            WHERE {where_clause}
            GROUP BY category, experience_level""",
        count_params,
    )
    category_counts: Dict[str, int] = {}
    experience_counts: Dict[str, int] = {}
    if facet_result:
        for fr in parse_rows(facet_result):
            cat = fr.get("category") or "uncategorized"
            exp = fr.get("experience_level") or "unspecified"
            cnt = fr.get("cnt", 0)
            category_counts[cat] = category_counts.get(cat, 0) + cnt
            experience_counts[exp] = experience_counts.get(exp, 0) + cnt

    return {
        "items": items,
        "total_count": total,
        "facets": {
            "categories": category_counts,
            "experience_levels": experience_counts,
        },
    }


def search_freelancers_advanced(where_clause: str, params: List,
                                sort: str = "newest") -> dict:
    """
    Enhanced freelancer search with rating data, total_count, and facets.
    """
    order = FREELANCER_SORT_MAP.get(sort, "u.created_at DESC")

    # -- count --
    count_params = params[:-2]
    count_result = execute_query(
        f"SELECT COUNT(*) as cnt FROM users u WHERE {where_clause}",
        count_params,
    )
    total = 0
    if count_result:
        rows = parse_rows(count_result)
        if rows:
            total = rows[0].get("cnt", 0)

    # -- items with rating + completed projects --
    result = execute_query(
        f"""SELECT u.id, u.email, u.name, u.first_name, u.last_name,
                   u.bio, u.hourly_rate, u.location, u.skills, u.user_type,
                   u.is_active, u.created_at,
                   COALESCE(rv.avg_rating, 0) AS avg_rating,
                   COALESCE(rv.review_count, 0) AS review_count,
                   COALESCE(cc.completed, 0) AS completed_projects
            FROM users u
            LEFT JOIN (
                SELECT reviewee_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
                FROM reviews GROUP BY reviewee_id
            ) rv ON u.id = rv.reviewee_id
            LEFT JOIN (
                SELECT freelancer_id, COUNT(*) AS completed
                FROM contracts WHERE status = 'completed'
                GROUP BY freelancer_id
            ) cc ON u.id = cc.freelancer_id
            WHERE {where_clause}
            ORDER BY {order}
            LIMIT ? OFFSET ?""",
        params,
    )
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user = row_to_user(row)
            user["avg_rating"] = (
                round(float(row[12].get("value")), 2)
                if len(row) > 12 and row[12].get("type") != "null" else 0
            )
            user["review_count"] = (
                row[13].get("value")
                if len(row) > 13 and row[13].get("type") != "null" else 0
            )
            user["completed_projects"] = (
                row[14].get("value")
                if len(row) > 14 and row[14].get("type") != "null" else 0
            )
            items.append(user)

    # -- facets (location counts) --
    facet_result = execute_query(
        f"""SELECT COALESCE(u.location, 'unspecified') AS loc, COUNT(*) AS cnt
            FROM users u WHERE {where_clause} GROUP BY loc""",
        count_params,
    )
    location_counts: Dict[str, int] = {}
    if facet_result:
        for fr in parse_rows(facet_result):
            location_counts[fr.get("loc", "unspecified")] = fr.get("cnt", 0)

    return {
        "items": items,
        "total_count": total,
        "facets": {"locations": location_counts},
    }


def search_projects_db(where_clause: str, params: List) -> List[dict]:
    """Execute project search query and return parsed project dicts (legacy)."""
    result = execute_query(
        f"""SELECT id, title, description, category, budget_type, budget_min, budget_max, experience_level, estimated_duration, status, skills, client_id, created_at, updated_at
            FROM projects
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_project(row) for row in result["rows"]]


def search_freelancers_db(where_clause: str, params: List) -> List[dict]:
    """Execute freelancer search query and return parsed user dicts (legacy)."""
    result = execute_query(
        f"""SELECT id, email, name, first_name, last_name, bio, hourly_rate, location, skills, user_type, is_active, created_at
            FROM users
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_user(row) for row in result["rows"]]


def global_search_projects(search_term: str, limit: int) -> List[dict]:
    """Search projects for global search."""
    result = execute_query(
        """SELECT id, title, description, budget_type, status
           FROM projects
           WHERE (title LIKE ? OR description LIKE ?) AND status = 'open'
           LIMIT ?""",
        [search_term, search_term, limit]
    )
    projects = []
    if result and result.get("rows"):
        for row in result["rows"]:
            desc = to_str(row[2])
            projects.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "project",
                "title": to_str(row[1]),
                "description": desc[:200] if desc else None,
                "budget_type": to_str(row[3]),
                "status": to_str(row[4])
            })
    return projects


def global_search_freelancers(search_term: str, limit: int) -> List[dict]:
    """Search freelancers for global search."""
    result = execute_query(
        """SELECT id, name, first_name, last_name, bio, hourly_rate, location
           FROM users
           WHERE (name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR bio LIKE ?)
             AND LOWER(user_type) = 'freelancer' AND is_active = 1
           LIMIT ?""",
        [search_term, search_term, search_term, search_term, limit]
    )
    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            name = to_str(row[1])
            if not name:
                first = to_str(row[2]) or ""
                last = to_str(row[3]) or ""
                name = f"{first} {last}".strip()
            bio = to_str(row[4])
            freelancers.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "freelancer",
                "name": name,
                "bio": bio[:200] if bio else None,
                "hourly_rate": float(row[5].get("value")) if row[5].get("type") != "null" else None,
                "location": to_str(row[6])
            })
    return freelancers


def global_search_skills(search_term: str, limit: int) -> List[dict]:
    """Search skills for global search."""
    result = execute_query(
        """SELECT id, name, category FROM skills WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    skills = []
    if result and result.get("rows"):
        for row in result["rows"]:
            skills.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "skill",
                "name": to_str(row[1]),
                "category": to_str(row[2])
            })
    return skills


def global_search_tags(search_term: str, limit: int) -> List[dict]:
    """Search tags for global search."""
    result = execute_query(
        """SELECT id, name, slug, usage_count FROM tags WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    tags = []
    if result and result.get("rows"):
        for row in result["rows"]:
            tags.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "tag",
                "name": to_str(row[1]),
                "slug": to_str(row[2]),
                "usage_count": row[3].get("value") if row[3].get("type") != "null" else 0
            })
    return tags


def global_search_gigs(search_term: str, limit: int) -> List[dict]:
    """Search gigs for global search."""
    result = execute_query(
        """SELECT id, title, slug, short_description, basic_price, rating_average, seller_id
           FROM gigs WHERE (title LIKE ? OR short_description LIKE ?) AND status = 'active' LIMIT ?""",
        [search_term, search_term, limit]
    )
    gigs = []
    if result and result.get("rows"):
        for row in result["rows"]:
            gigs.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "gig",
                "title": to_str(row[1]),
                "slug": to_str(row[2]),
                "short_description": to_str(row[3]),
                "basic_price": row[4].get("value") if row[4].get("type") != "null" else None,
                "rating_average": row[5].get("value") if row[5].get("type") != "null" else None,
                "seller_id": row[6].get("value") if row[6].get("type") != "null" else None,
            })
    return gigs


def autocomplete_projects(search_term: str, limit: int) -> List[dict]:
    """Get project autocomplete suggestions."""
    result = execute_query(
        """SELECT id, title FROM projects WHERE title LIKE ? AND status = 'open' LIMIT ?""",
        [search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "project",
                "text": to_str(row[1])
            })
    return suggestions


def autocomplete_freelancers(search_term: str, limit: int) -> List[dict]:
    """Get freelancer autocomplete suggestions."""
    result = execute_query(
        """SELECT id, name, first_name, last_name FROM users
           WHERE (name LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
             AND LOWER(user_type) = 'freelancer' AND is_active = 1
           LIMIT ?""",
        [search_term, search_term, search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            name = to_str(row[1])
            if not name:
                first = to_str(row[2]) or ""
                last = to_str(row[3]) or ""
                name = f"{first} {last}".strip()
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "freelancer",
                "text": name
            })
    return suggestions


def autocomplete_skills(search_term: str, limit: int) -> List[dict]:
    """Get skill autocomplete suggestions."""
    result = execute_query(
        """SELECT id, name FROM skills WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "skill",
                "text": to_str(row[1])
            })
    return suggestions


def autocomplete_tags(search_term: str, limit: int) -> List[dict]:
    """Get tag autocomplete suggestions."""
    result = execute_query(
        """SELECT id, name FROM tags WHERE name LIKE ? LIMIT ?""",
        [search_term, limit]
    )
    suggestions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            suggestions.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "type": "tag",
                "text": to_str(row[1])
            })
    return suggestions


def get_trending_projects(limit: int) -> List[dict]:
    """Get trending projects ranked by engagement (proposals + recency)."""
    result = execute_query(
        """SELECT p.id, p.title, p.description, p.category, p.budget_type,
                  p.budget_min, p.budget_max, p.experience_level,
                  p.estimated_duration, p.status, p.skills, p.client_id,
                  p.created_at, p.updated_at,
                  COALESCE(pc.proposal_count, 0) AS proposal_count
           FROM projects p
           LEFT JOIN (
               SELECT project_id, COUNT(*) AS proposal_count
               FROM proposals WHERE status != 'withdrawn'
               GROUP BY project_id
           ) pc ON p.id = pc.project_id
           WHERE p.status = 'open'
           ORDER BY (COALESCE(pc.proposal_count, 0) * 2 + 
                     CASE WHEN p.created_at > datetime('now', '-7 days') THEN 5
                          WHEN p.created_at > datetime('now', '-30 days') THEN 2
                          ELSE 0 END) DESC,
                    p.created_at DESC
           LIMIT ?""",
        [limit]
    )
    if not result or not result.get("rows"):
        return []
    items = []
    for row in result["rows"]:
        proj = row_to_project(row)
        proj["proposal_count"] = (
            row[14].get("value") if len(row) > 14 and row[14].get("type") != "null" else 0
        )
        items.append(proj)
    return items


def get_trending_freelancers(limit: int) -> List[dict]:
    """Get trending freelancers ranked by rating, completions, and recency."""
    result = execute_query(
        """SELECT u.id, u.email, u.name, u.first_name, u.last_name, u.bio,
                  u.hourly_rate, u.location, u.skills, u.user_type,
                  u.is_active, u.created_at,
                  COALESCE(rv.avg_rating, 0) AS avg_rating,
                  COALESCE(rv.review_count, 0) AS review_count,
                  COALESCE(cc.completed, 0) AS completed_projects
           FROM users u
           LEFT JOIN (
               SELECT reviewee_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
               FROM reviews GROUP BY reviewee_id
           ) rv ON u.id = rv.reviewee_id
           LEFT JOIN (
               SELECT freelancer_id, COUNT(*) AS completed
               FROM contracts WHERE status = 'completed'
               GROUP BY freelancer_id
           ) cc ON u.id = cc.freelancer_id
           WHERE LOWER(u.user_type) = 'freelancer' AND u.is_active = 1
           ORDER BY (COALESCE(rv.avg_rating, 0) * COALESCE(rv.review_count, 0) * 0.5 +
                     COALESCE(cc.completed, 0) * 3 +
                     CASE WHEN u.created_at > datetime('now', '-30 days') THEN 2 ELSE 0 END) DESC
           LIMIT ?""",
        [limit]
    )
    if not result or not result.get("rows"):
        return []
    items = []
    for row in result["rows"]:
        user = row_to_user(row)
        user["avg_rating"] = (
            round(float(row[12].get("value")), 2)
            if len(row) > 12 and row[12].get("type") != "null" else 0
        )
        user["review_count"] = (
            row[13].get("value")
            if len(row) > 13 and row[13].get("type") != "null" else 0
        )
        user["completed_projects"] = (
            row[14].get("value")
            if len(row) > 14 and row[14].get("type") != "null" else 0
        )
        items.append(user)
    return items


def get_trending_skills(limit: int) -> List[dict]:
    """Get trending skills."""
    result = execute_query(
        """SELECT id, name, category, created_at FROM skills ORDER BY created_at DESC LIMIT ?""",
        [limit]
    )
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            items.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": to_str(row[1]),
                "category": to_str(row[2])
            })
    return items


def get_trending_tags(limit: int) -> List[dict]:
    """Get trending tags by usage count."""
    result = execute_query(
        """SELECT id, name, slug, usage_count FROM tags WHERE usage_count > 0 ORDER BY usage_count DESC LIMIT ?""",
        [limit]
    )
    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            items.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": to_str(row[1]),
                "slug": to_str(row[2]),
                "usage_count": row[3].get("value") if row[3].get("type") != "null" else 0
            })
    return items
