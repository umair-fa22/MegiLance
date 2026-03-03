# @AI-HINT: Advanced full-text search service using Turso's FTS5 extension for blazing-fast search
"""
Full-Text Search Service using Turso FTS5
Provides advanced search capabilities across projects, users, and skills with ranking and autocomplete
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from app.models.project import Project
from app.models.user import User
from app.models.skill import Skill
from datetime import datetime, timedelta, timezone
import json
import logging

logger = logging.getLogger(__name__)


class SearchService:
    """Advanced search service leveraging Turso's FTS5 for high-performance full-text search"""
    
    def __init__(self, db: Session):
        self.db = db
        self._ensure_fts_tables()
    
    def _ensure_fts_tables(self):
        """Create FTS5 virtual tables if they don't exist"""
        try:
            # Projects FTS table
            self.db.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
                    project_id UNINDEXED,
                    title,
                    description,
                    category,
                    skills,
                    tokenize = 'porter unicode61'
                )
            """))
            
            # Users FTS table
            self.db.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS users_fts USING fts5(
                    user_id UNINDEXED,
                    name,
                    bio,
                    skills,
                    location,
                    tokenize = 'porter unicode61'
                )
            """))
            
            # Skills FTS table
            self.db.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
                    skill_id UNINDEXED,
                    name,
                    category,
                    description,
                    tokenize = 'porter unicode61'
                )
            """))
            
            self.db.commit()
        except Exception as e:
            # Tables might already exist
            self.db.rollback()
    
    def index_project(self, project: Project):
        """Index a project for full-text search"""
        try:
            # Delete existing entry
            self.db.execute(
                text("DELETE FROM projects_fts WHERE project_id = :id"),
                {"id": project.id}
            )
            
            # Parse skills
            skills_text = ""
            if project.skills:
                try:
                    if isinstance(project.skills, str):
                        skills_list = json.loads(project.skills)
                    else:
                        skills_list = project.skills
                    skills_text = " ".join(skills_list)
                except (json.JSONDecodeError, TypeError, ValueError):
                    skills_text = str(project.skills)
            
            # Insert new entry
            self.db.execute(
                text("""
                    INSERT INTO projects_fts (project_id, title, description, category, skills)
                    VALUES (:id, :title, :desc, :cat, :skills)
                """),
                {
                    "id": project.id,
                    "title": project.title,
                    "desc": project.description,
                    "cat": project.category,
                    "skills": skills_text
                }
            )
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to index project %s: %s", project.id, e)
    
    def index_user(self, user: User):
        """Index a user for full-text search"""
        try:
            # Delete existing entry
            self.db.execute(
                text("DELETE FROM users_fts WHERE user_id = :id"),
                {"id": user.id}
            )
            
            # Parse skills
            skills_text = ""
            if user.skills:
                try:
                    if isinstance(user.skills, str):
                        skills_list = json.loads(user.skills)
                    else:
                        skills_list = user.skills
                    skills_text = " ".join(skills_list)
                except (json.JSONDecodeError, TypeError, ValueError):
                    skills_text = str(user.skills)
            
            # Insert new entry
            self.db.execute(
                text("""
                    INSERT INTO users_fts (user_id, name, bio, skills, location)
                    VALUES (:id, :name, :bio, :skills, :loc)
                """),
                {
                    "id": user.id,
                    "name": user.name or "",
                    "bio": user.bio or "",
                    "skills": skills_text,
                    "loc": user.location or ""
                }
            )
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to index user %s: %s", user.id, e)
    
    def index_skill(self, skill: Skill):
        """Index a skill for full-text search"""
        try:
            # Delete existing entry
            self.db.execute(
                text("DELETE FROM skills_fts WHERE skill_id = :id"),
                {"id": skill.id}
            )
            
            # Insert new entry
            self.db.execute(
                text("""
                    INSERT INTO skills_fts (skill_id, name, category, description)
                    VALUES (:id, :name, :cat, :desc)
                """),
                {
                    "id": skill.id,
                    "name": skill.name,
                    "cat": skill.category or "",
                    "desc": skill.description or ""
                }
            )
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error("Failed to index skill %s: %s", skill.id, e)
    
    def search_projects(
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
        """
        Advanced project search with FTS5 ranking and filters
        Returns: {results: [...], total: int, query_time_ms: float}
        """
        start_time = datetime.now()
        
        # Build FTS query
        fts_query = self._build_fts_query(query)
        
        # Search with ranking
        sql_base = """
            SELECT 
                p.*,
                fts.rank as search_rank
            FROM projects p
            INNER JOIN projects_fts fts ON p.id = fts.project_id
            WHERE projects_fts MATCH :query
        """
        
        filters = []
        params = {"query": fts_query}
        
        if category:
            filters.append("p.category = :category")
            params["category"] = category
        
        if min_budget is not None:
            filters.append("p.budget_min >= :min_budget")
            params["min_budget"] = min_budget
        
        if max_budget is not None:
            filters.append("p.budget_max <= :max_budget")
            params["max_budget"] = max_budget
        
        if experience_level:
            filters.append("p.experience_level = :exp_level")
            params["exp_level"] = experience_level
        
        if status:
            filters.append("p.status = :status")
            params["status"] = status
        
        if filters:
            sql_base += " AND " + " AND ".join(filters)
        
        sql_base += " ORDER BY fts.rank, p.created_at DESC"
        
        # Count total
        count_sql = sql_base.replace("p.*, fts.rank as search_rank", "COUNT(*) as total")
        total_result = self.db.execute(text(count_sql), params).fetchone()
        total = total_result[0] if total_result else 0
        
        # Get results with pagination
        sql_base += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset
        
        results = self.db.execute(text(sql_base), params).fetchall()
        
        # Convert to dict
        projects = []
        for row in results:
            project = self.db.query(Project).filter(Project.id == row[0]).first()
            if project:
                projects.append({
                    "id": project.id,
                    "title": project.title,
                    "description": project.description,
                    "category": project.category,
                    "budget_min": project.budget_min,
                    "budget_max": project.budget_max,
                    "budget_type": project.budget_type,
                    "experience_level": project.experience_level,
                    "status": project.status,
                    "skills": json.loads(project.skills) if isinstance(project.skills, str) else project.skills,
                    "created_at": project.created_at.isoformat(),
                    "search_rank": row.search_rank
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
    
    def search_freelancers(
        self,
        query: str,
        skills: Optional[List[str]] = None,
        min_hourly_rate: Optional[float] = None,
        max_hourly_rate: Optional[float] = None,
        location: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Advanced freelancer search with FTS5 ranking
        """
        start_time = datetime.now()
        
        fts_query = self._build_fts_query(query)
        
        sql_base = """
            SELECT 
                u.*,
                fts.rank as search_rank
            FROM users u
            INNER JOIN users_fts fts ON u.id = fts.user_id
            WHERE users_fts MATCH :query
            AND u.user_type = 'freelancer'
            AND u.is_active = 1
        """
        
        filters = []
        params = {"query": fts_query}
        
        if min_hourly_rate is not None:
            filters.append("u.hourly_rate >= :min_rate")
            params["min_rate"] = min_hourly_rate
        
        if max_hourly_rate is not None:
            filters.append("u.hourly_rate <= :max_rate")
            params["max_rate"] = max_hourly_rate
        
        if location:
            filters.append("u.location LIKE :location")
            params["location"] = f"%{location}%"
        
        if filters:
            sql_base += " AND " + " AND ".join(filters)
        
        sql_base += " ORDER BY fts.rank"
        
        # Count total
        count_sql = sql_base.replace("u.*, fts.rank as search_rank", "COUNT(*) as total")
        total_result = self.db.execute(text(count_sql), params).fetchone()
        total = total_result[0] if total_result else 0
        
        # Get results
        sql_base += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset
        
        results = self.db.execute(text(sql_base), params).fetchall()
        
        freelancers = []
        for row in results:
            user = self.db.query(User).filter(User.id == row[0]).first()
            if user:
                freelancers.append({
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "bio": user.bio,
                    "skills": json.loads(user.skills) if isinstance(user.skills, str) else user.skills,
                    "hourly_rate": user.hourly_rate,
                    "location": user.location,
                    "profile_image_url": user.profile_image_url,
                    "search_rank": row.search_rank
                })
        
        query_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            "results": freelancers,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query_time_ms": round(query_time, 2)
        }
    
    def autocomplete(self, query: str, type: str = "all", limit: int = 10) -> List[str]:
        """
        Autocomplete suggestions for search queries
        """
        suggestions = []
        
        if type in ["all", "projects"]:
            # Get project title suggestions
            results = self.db.execute(
                text("""
                    SELECT DISTINCT title 
                    FROM projects 
                    WHERE title LIKE :query 
                    LIMIT :limit
                """),
                {"query": f"%{query}%", "limit": limit}
            ).fetchall()
            suggestions.extend([r[0] for r in results])
        
        if type in ["all", "skills"]:
            # Get skill suggestions
            results = self.db.execute(
                text("""
                    SELECT DISTINCT name 
                    FROM skills 
                    WHERE name LIKE :query 
                    LIMIT :limit
                """),
                {"query": f"%{query}%", "limit": limit}
            ).fetchall()
            suggestions.extend([r[0] for r in results])
        
        return list(set(suggestions))[:limit]
    
    def get_search_analytics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get search analytics for admin dashboard using search_history table.
        """
        from app.db.turso_http import get_turso_http
        turso = get_turso_http()

        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        total_row = turso.fetch_one(
            "SELECT COUNT(*) FROM search_history WHERE searched_at >= ?", [cutoff]
        )
        total_searches = int(total_row[0]) if total_row else 0

        unique_row = turso.fetch_one(
            "SELECT COUNT(DISTINCT search_hash) FROM search_history WHERE searched_at >= ?", [cutoff]
        )
        unique_queries = int(unique_row[0]) if unique_row else 0

        avg_row = turso.fetch_one(
            "SELECT AVG(results_count) FROM search_history WHERE searched_at >= ?", [cutoff]
        )
        avg_results = round(float(avg_row[0]), 1) if avg_row and avg_row[0] is not None else 0

        popular_result = turso.execute(
            """SELECT criteria, COUNT(*) as cnt FROM search_history
               WHERE searched_at >= ?
               GROUP BY search_hash ORDER BY cnt DESC LIMIT 10""",
            [cutoff]
        )
        popular_terms = []
        for row in popular_result.get("rows", []):
            try:
                crit = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                term = crit.get("query", crit.get("name", str(crit)[:50])) if isinstance(crit, dict) else str(crit)[:50]
            except (json.JSONDecodeError, TypeError, AttributeError):
                term = str(row[0])[:50]
            popular_terms.append({"term": term, "count": row[1]})

        zero_result = turso.execute(
            """SELECT criteria FROM search_history
               WHERE searched_at >= ? AND results_count = 0
               GROUP BY search_hash LIMIT 10""",
            [cutoff]
        )
        zero_result_queries = []
        for row in zero_result.get("rows", []):
            try:
                crit = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                term = crit.get("query", str(crit)[:50]) if isinstance(crit, dict) else str(crit)[:50]
            except (json.JSONDecodeError, TypeError, AttributeError):
                term = str(row[0])[:50]
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
        # Clean and prepare query for FTS5
        # Handle phrases, wildcards, and boolean operators
        terms = query.strip().split()
        
        # Add wildcard to last term for prefix matching
        if terms:
            terms[-1] = f"{terms[-1]}*"
        
        return " ".join(terms)
    
    def reindex_all(self):
        """Reindex all projects, users, and skills"""
        # Reindex projects
        projects = self.db.query(Project).all()
        for project in projects:
            self.index_project(project)
        
        # Reindex users
        users = self.db.query(User).filter(User.user_type == "freelancer").all()
        for user in users:
            self.index_user(user)
        
        # Reindex skills
        skills = self.db.query(Skill).all()
        for skill in skills:
            self.index_skill(skill)
        
        return {
            "projects_indexed": len(projects),
            "users_indexed": len(users),
            "skills_indexed": len(skills)
        }


def get_search_service(db: Session) -> SearchService:
    """Dependency injection for search service"""
    return SearchService(db)
