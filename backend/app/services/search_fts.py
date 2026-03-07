# @AI-HINT: Advanced full-text search service using Turso's FTS5 extension for blazing-fast search
"""
Full-Text Search Service using Turso FTS5
Provides advanced search capabilities across projects, users, and skills with ranking and autocomplete
"""

from typing import List, Dict, Any, Optional
from app.db.turso_http import execute_query, parse_rows
from datetime import datetime, timedelta, timezone
import json
import logging

logger = logging.getLogger(__name__)


class SearchService:
    """Advanced search service leveraging Turso's FTS5 for high-performance full-text search"""

    def __init__(self):
        pass

    async def ensure_fts_tables(self):
        """Create FTS5 virtual tables if they don't exist"""
        try:
            await execute_query("""
                CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
                    project_id UNINDEXED,
                    title,
                    description,
                    category,
                    skills,
                    tokenize = 'porter unicode61'
                )
            """)
            await execute_query("""
                CREATE VIRTUAL TABLE IF NOT EXISTS users_fts USING fts5(
                    user_id UNINDEXED,
                    name,
                    bio,
                    skills,
                    location,
                    tokenize = 'porter unicode61'
                )
            """)
            await execute_query("""
                CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
                    skill_id UNINDEXED,
                    name,
                    category,
                    description,
                    tokenize = 'porter unicode61'
                )
            """)
        except Exception as e:
            logger.warning("FTS table creation: %s", e)

    async def index_project(self, project_id: int, title: str, description: str, category: str, skills: Any):
        """Index a project for full-text search"""
        try:
            await execute_query("DELETE FROM projects_fts WHERE project_id = ?", [project_id])

            skills_text = ""
            if skills:
                try:
                    if isinstance(skills, str):
                        skills_list = json.loads(skills)
                    else:
                        skills_list = skills
                    skills_text = " ".join(skills_list)
                except (json.JSONDecodeError, TypeError, ValueError):
                    skills_text = str(skills)

            await execute_query(
                """INSERT INTO projects_fts (project_id, title, description, category, skills)
                   VALUES (?, ?, ?, ?, ?)""",
                [project_id, title or "", description or "", category or "", skills_text]
            )
        except Exception as e:
            logger.error("Failed to index project %s: %s", project_id, e)

    async def index_user(self, user_id: int, name: str, bio: str, skills: Any, location: str):
        """Index a user for full-text search"""
        try:
            await execute_query("DELETE FROM users_fts WHERE user_id = ?", [user_id])

            skills_text = ""
            if skills:
                try:
                    if isinstance(skills, str):
                        skills_list = json.loads(skills)
                    else:
                        skills_list = skills
                    skills_text = " ".join(skills_list)
                except (json.JSONDecodeError, TypeError, ValueError):
                    skills_text = str(skills)

            await execute_query(
                """INSERT INTO users_fts (user_id, name, bio, skills, location)
                   VALUES (?, ?, ?, ?, ?)""",
                [user_id, name or "", bio or "", skills_text, location or ""]
            )
        except Exception as e:
            logger.error("Failed to index user %s: %s", user_id, e)

    async def index_skill(self, skill_id: int, name: str, category: str, description: str):
        """Index a skill for full-text search"""
        try:
            await execute_query("DELETE FROM skills_fts WHERE skill_id = ?", [skill_id])

            await execute_query(
                """INSERT INTO skills_fts (skill_id, name, category, description)
                   VALUES (?, ?, ?, ?)""",
                [skill_id, name or "", category or "", description or ""]
            )
        except Exception as e:
            logger.error("Failed to index skill %s: %s", skill_id, e)

    async def search_projects(
        self,
        query: str,
        category: Optional[str] = None,
        min_budget: Optional[float] = None,
        max_budget: Optional[float] = None,
        experience_level: Optional[str] = None,
        status: str = "open",
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Advanced project search with FTS5 ranking and filters"""
        start_time = datetime.now()

        fts_query = self._build_fts_query(query)

        sql_base = """
            SELECT p.*, fts.rank as search_rank
            FROM projects p
            INNER JOIN projects_fts fts ON p.id = fts.project_id
            WHERE projects_fts MATCH ?
        """
        params: list = [fts_query]

        if category:
            sql_base += " AND p.category = ?"
            params.append(category)

        if min_budget is not None:
            sql_base += " AND p.budget_min >= ?"
            params.append(min_budget)

        if max_budget is not None:
            sql_base += " AND p.budget_max <= ?"
            params.append(max_budget)

        if experience_level:
            sql_base += " AND p.experience_level = ?"
            params.append(experience_level)

        if status:
            sql_base += " AND p.status = ?"
            params.append(status)

        sql_base += " ORDER BY fts.rank, p.created_at DESC"

        # Count total
        count_sql = sql_base.replace("p.*, fts.rank as search_rank", "COUNT(*) as total")
        count_result = await execute_query(count_sql, params)
        count_rows = parse_rows(count_result)
        total = count_rows[0]["total"] if count_rows else 0

        # Get results with pagination
        sql_base += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        result = await execute_query(sql_base, params)
        rows = parse_rows(result)

        projects = []
        for row in rows:
            skills_val = row.get("skills")
            try:
                skills_parsed = json.loads(skills_val) if isinstance(skills_val, str) else skills_val
            except (json.JSONDecodeError, TypeError):
                skills_parsed = skills_val

            projects.append({
                "id": row.get("id"),
                "title": row.get("title"),
                "description": row.get("description"),
                "category": row.get("category"),
                "budget_min": row.get("budget_min"),
                "budget_max": row.get("budget_max"),
                "budget_type": row.get("budget_type"),
                "experience_level": row.get("experience_level"),
                "status": row.get("status"),
                "skills": skills_parsed,
                "created_at": row.get("created_at"),
                "search_rank": row.get("search_rank")
            })

        query_time = (datetime.now() - start_time).total_seconds() * 1000

        return {
            "results": projects,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query_time_ms": round(query_time, 2),
            "query": query
        }

    async def search_freelancers(
        self,
        query: str,
        skills: Optional[List[str]] = None,
        min_hourly_rate: Optional[float] = None,
        max_hourly_rate: Optional[float] = None,
        location: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Advanced freelancer search with FTS5 ranking"""
        start_time = datetime.now()

        fts_query = self._build_fts_query(query)

        sql_base = """
            SELECT u.*, fts.rank as search_rank
            FROM users u
            INNER JOIN users_fts fts ON u.id = fts.user_id
            WHERE users_fts MATCH ?
            AND u.user_type = 'freelancer'
            AND u.is_active = 1
        """
        params: list = [fts_query]

        if min_hourly_rate is not None:
            sql_base += " AND u.hourly_rate >= ?"
            params.append(min_hourly_rate)

        if max_hourly_rate is not None:
            sql_base += " AND u.hourly_rate <= ?"
            params.append(max_hourly_rate)

        if location:
            sql_base += " AND u.location LIKE ?"
            params.append(f"%{location}%")

        sql_base += " ORDER BY fts.rank"

        # Count total
        count_sql = sql_base.replace("u.*, fts.rank as search_rank", "COUNT(*) as total")
        count_result = await execute_query(count_sql, params)
        count_rows = parse_rows(count_result)
        total = count_rows[0]["total"] if count_rows else 0

        # Get results
        sql_base += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        result = await execute_query(sql_base, params)
        rows = parse_rows(result)

        freelancers = []
        for row in rows:
            skills_val = row.get("skills")
            try:
                skills_parsed = json.loads(skills_val) if isinstance(skills_val, str) else skills_val
            except (json.JSONDecodeError, TypeError):
                skills_parsed = skills_val

            freelancers.append({
                "id": row.get("id"),
                "name": row.get("name"),
                "email": row.get("email"),
                "bio": row.get("bio"),
                "skills": skills_parsed,
                "hourly_rate": row.get("hourly_rate"),
                "location": row.get("location"),
                "profile_image_url": row.get("profile_image_url"),
                "search_rank": row.get("search_rank")
            })

        query_time = (datetime.now() - start_time).total_seconds() * 1000

        return {
            "results": freelancers,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query_time_ms": round(query_time, 2)
        }

    async def autocomplete(self, query: str, type: str = "all", limit: int = 10) -> List[str]:
        """Autocomplete suggestions for search queries"""
        suggestions = []

        if type in ["all", "projects"]:
            result = await execute_query(
                "SELECT DISTINCT title FROM projects WHERE title LIKE ? LIMIT ?",
                [f"%{query}%", limit]
            )
            rows = parse_rows(result)
            suggestions.extend([r["title"] for r in rows])

        if type in ["all", "skills"]:
            result = await execute_query(
                "SELECT DISTINCT name FROM skills WHERE name LIKE ? LIMIT ?",
                [f"%{query}%", limit]
            )
            rows = parse_rows(result)
            suggestions.extend([r["name"] for r in rows])

        return list(set(suggestions))[:limit]

    async def get_search_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get search analytics for admin dashboard using search_history table."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        total_result = await execute_query(
            "SELECT COUNT(*) as total FROM search_history WHERE searched_at >= ?", [cutoff]
        )
        total_rows = parse_rows(total_result)
        total_searches = int(total_rows[0]["total"]) if total_rows else 0

        unique_result = await execute_query(
            "SELECT COUNT(DISTINCT search_hash) as cnt FROM search_history WHERE searched_at >= ?", [cutoff]
        )
        unique_rows = parse_rows(unique_result)
        unique_queries = int(unique_rows[0]["cnt"]) if unique_rows else 0

        avg_result = await execute_query(
            "SELECT AVG(results_count) as avg_results FROM search_history WHERE searched_at >= ?", [cutoff]
        )
        avg_rows = parse_rows(avg_result)
        avg_results = round(float(avg_rows[0]["avg_results"]), 1) if avg_rows and avg_rows[0].get("avg_results") is not None else 0

        popular_result = await execute_query(
            """SELECT criteria, COUNT(*) as cnt FROM search_history
               WHERE searched_at >= ?
               GROUP BY search_hash ORDER BY cnt DESC LIMIT 10""",
            [cutoff]
        )
        popular_rows = parse_rows(popular_result)
        popular_terms = []
        for row in popular_rows:
            try:
                crit = json.loads(row["criteria"]) if isinstance(row["criteria"], str) else row["criteria"]
                term = crit.get("query", crit.get("name", str(crit)[:50])) if isinstance(crit, dict) else str(crit)[:50]
            except (json.JSONDecodeError, TypeError, AttributeError):
                term = str(row["criteria"])[:50]
            popular_terms.append({"term": term, "count": row["cnt"]})

        zero_result = await execute_query(
            """SELECT criteria FROM search_history
               WHERE searched_at >= ? AND results_count = 0
               GROUP BY search_hash LIMIT 10""",
            [cutoff]
        )
        zero_rows = parse_rows(zero_result)
        zero_result_queries = []
        for row in zero_rows:
            try:
                crit = json.loads(row["criteria"]) if isinstance(row["criteria"], str) else row["criteria"]
                term = crit.get("query", str(crit)[:50]) if isinstance(crit, dict) else str(crit)[:50]
            except (json.JSONDecodeError, TypeError, AttributeError):
                term = str(row["criteria"])[:50]
            zero_result_queries.append(term)

        return {
            "total_searches": total_searches,
            "unique_queries": unique_queries,
            "avg_results": avg_results,
            "popular_terms": popular_terms,
            "zero_result_queries": zero_result_queries,
            "period_days": days
        }

    def _build_fts_query(self, query: str) -> str:
        """Build FTS5 query from user input"""
        terms = query.strip().split()
        if terms:
            terms[-1] = f"{terms[-1]}*"
        return " ".join(terms)

    async def reindex_all(self) -> Dict[str, int]:
        """Reindex all projects, users, and skills"""
        proj_result = await execute_query("SELECT id, title, description, category, skills FROM projects")
        projects = parse_rows(proj_result)
        for p in projects:
            await self.index_project(p["id"], p["title"], p["description"], p["category"], p["skills"])

        user_result = await execute_query(
            "SELECT id, name, bio, skills, location FROM users WHERE user_type = 'freelancer'"
        )
        users = parse_rows(user_result)
        for u in users:
            await self.index_user(u["id"], u["name"], u["bio"], u["skills"], u["location"])

        skill_result = await execute_query("SELECT id, name, category, description FROM skills")
        skills_data = parse_rows(skill_result)
        for s in skills_data:
            await self.index_skill(s["id"], s["name"], s["category"], s["description"])

        return {
            "projects_indexed": len(projects),
            "users_indexed": len(users),
            "skills_indexed": len(skills_data)
        }


_search_service: Optional[SearchService] = None


def get_search_service() -> SearchService:
    """Singleton factory for search service"""
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service
