"""
@AI-HINT: Projects API endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
"""

import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timezone

from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.core.security import get_current_active_user
from app.services.db_utils import get_user_role, sanitize_text, paginate_params
from app.db.turso_http import get_turso_http
from app.services.profile_validation import is_profile_complete, get_missing_profile_fields
from app.api.v1.core_domain.utils import moderate_content
import logging

logger = logging.getLogger("megilance")

router = APIRouter()

# Validation constants
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 10000
MAX_SEARCH_LENGTH = 100
ALLOWED_STATUSES = {"open", "in_progress", "completed", "cancelled", "on_hold", "paused"}
ALLOWED_SORT_OPTIONS = {"newest", "oldest", "budget_high", "budget_low", "most_proposals"}
ALLOWED_EXPERIENCE_LEVELS = {"entry", "intermediate", "expert"}


def sanitize_search_term(term: str) -> str:
    """
    Sanitize search term to prevent injection and limit special characters.
    """
    if not term:
        return ""
    # Limit length
    term = term[:MAX_SEARCH_LENGTH]
    # Escape SQL LIKE special characters
    term = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    # Remove any null bytes or control characters
    term = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', term)
    return term


def validate_project_input(project: ProjectCreate) -> None:
    """Validate project input data."""
    if len(project.title) > MAX_TITLE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Title must not exceed {MAX_TITLE_LENGTH} characters"
        )
    if project.description and len(project.description) > MAX_DESCRIPTION_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Description must not exceed {MAX_DESCRIPTION_LENGTH} characters"
        )
    if project.status and project.status.lower() not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}"
        )
    if project.budget_min is not None and project.budget_min < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget minimum cannot be negative"
        )
    if project.budget_max is not None and project.budget_min is not None:
        if project.budget_max < project.budget_min:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget maximum cannot be less than minimum"
            )


def _row_to_project(row: list, columns: list = None) -> dict:
    """Convert database row to project dict"""
    # Default column order from our SELECT queries
    if columns is None:
        columns = ["id", "title", "description", "category", "budget_type", 
                   "budget_min", "budget_max", "experience_level", "estimated_duration",
                   "skills", "client_id", "status", "created_at", "updated_at"]
    
    project = {}
    for i, col in enumerate(columns):
        if i < len(row):
            val = row[i]
            if col == "skills" and isinstance(val, str):
                project[col] = val.split(",") if val else []
            elif col in ["budget_min", "budget_max"] and val is not None:
                project[col] = float(val)
            else:
                project[col] = val
        else:
            project[col] = None
    return project


@router.get("", response_model=List[ProjectRead])
def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    project_status: Optional[str] = Query(None, alias="status", description="Filter by project status"),
    category: Optional[str] = Query(None, max_length=50, description="Filter by category"),
    search: Optional[str] = Query(None, max_length=MAX_SEARCH_LENGTH, description="Search in title and description"),
    sort: Optional[str] = Query("newest", description="Sort order: newest, oldest, budget_high, budget_low, most_proposals"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level: entry, intermediate, expert"),
    budget_min: Optional[float] = Query(None, ge=0, description="Minimum budget filter"),
    budget_max: Optional[float] = Query(None, ge=0, description="Maximum budget filter"),
) -> list[dict]:
    """List projects from Turso database (Public) with advanced filtering and sorting"""
    offset, limit = paginate_params(page, page_size)
    try:
        turso = get_turso_http()
        
        # Validate sort option
        if sort and sort not in ALLOWED_SORT_OPTIONS:
            sort = "newest"
        
        # Build base query - include proposal count via subquery
        sql = """SELECT p.id, p.title, p.description, p.category, p.budget_type, 
                        p.budget_min, p.budget_max, p.experience_level, p.estimated_duration,
                        p.skills, p.client_id, p.status, p.created_at, p.updated_at,
                        COALESCE(pc.proposal_count, 0) as proposal_count
                 FROM projects p
                 LEFT JOIN (
                     SELECT project_id, COUNT(*) as proposal_count
                     FROM proposals WHERE is_draft = 0
                     GROUP BY project_id
                 ) pc ON p.id = pc.project_id
                 WHERE 1=1"""
        params = []
        
        if project_status:
            if project_status.lower() not in ALLOWED_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}"
                )
            sql += " AND p.status = ?"
            params.append(project_status.lower())
        else:
            sql += " AND p.status = 'open'"
            
        if category:
            sql += " AND p.category = ?"
            params.append(category)
        
        if experience_level:
            if experience_level.lower() not in ALLOWED_EXPERIENCE_LEVELS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid experience level. Allowed: {', '.join(ALLOWED_EXPERIENCE_LEVELS)}"
                )
            sql += " AND p.experience_level = ?"
            params.append(experience_level.lower())
        
        if budget_min is not None:
            sql += " AND p.budget_max >= ?"
            params.append(budget_min)
        
        if budget_max is not None:
            sql += " AND p.budget_min <= ?"
            params.append(budget_max)
        
        if search:
            safe_search = sanitize_search_term(search)
            if safe_search:
                sql += " AND (p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')"
                params.extend([f"%{safe_search}%", f"%{safe_search}%"])
        
        # Sorting
        sort_map = {
            "newest": "p.created_at DESC",
            "oldest": "p.created_at ASC",
            "budget_high": "p.budget_max DESC NULLS LAST",
            "budget_low": "p.budget_min ASC NULLS LAST",
            "most_proposals": "proposal_count DESC",
        }
        sql += f" ORDER BY {sort_map.get(sort, 'p.created_at DESC')}"
        
        sql += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        result = turso.execute(sql, params)
        columns = result.get("columns", [])
        projects = []
        for row in result.get("rows", []):
            proj = _row_to_project(row, columns[:14])  # First 14 columns are project fields
            proj["proposal_count"] = int(row[14]) if len(row) > 14 and row[14] is not None else 0
            projects.append(proj)
        return projects
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("list_projects failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/my-projects", response_model=List[ProjectRead])
def get_my_projects(
    current_user: User = Depends(get_current_active_user)
) -> list[dict]:
    """Get projects for the current user (client's posted projects or freelancer's active projects)"""
    try:
        turso = get_turso_http()
        
        if current_user.user_type and current_user.user_type.lower() == "client":
            # Get client's posted projects
            sql = """SELECT id, title, description, category, budget_type, 
                            budget_min, budget_max, experience_level, estimated_duration,
                            skills, client_id, status, created_at, updated_at 
                     FROM projects WHERE client_id = ? ORDER BY created_at DESC"""
            result = turso.execute(sql, [current_user.id])
        else:
            # Get freelancer's projects (via contracts)
            # Note: This returns the project details for contracts the freelancer is involved in
            sql = """SELECT p.id, p.title, p.description, p.category, p.budget_type, 
                            p.budget_min, p.budget_max, p.experience_level, p.estimated_duration,
                            p.skills, p.client_id, p.status, p.created_at, p.updated_at 
                     FROM projects p
                     JOIN contracts c ON p.id = c.project_id
                     WHERE c.freelancer_id = ? ORDER BY c.created_at DESC"""
            result = turso.execute(sql, [current_user.id])
            
        columns = result.get("columns", [])
        projects = [_row_to_project(row, columns) for row in result.get("rows", [])]
        return projects
        
    except Exception as e:
        logger.error("get_my_projects failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int
) -> dict:
    """Get single project from Turso (Public)"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type, 
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at 
               FROM projects WHERE id = ?""",
            [project_id]
        )
        
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
        return _row_to_project(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Create new project in Turso"""
    # Only clients can create projects
    if not current_user.user_type or current_user.user_type.lower() != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create projects"
        )
    
    # Check profile completion
    if not is_profile_complete(current_user):
        missing = get_missing_profile_fields(current_user)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Please complete your profile before posting a project. Missing: {', '.join(missing)}"
        )
    
    # Validate input
    validate_project_input(project)
    
    # Content moderation
    for field_name, value in [("title", project.title), ("description", project.description)]:
        ok, reason = moderate_content(value)
        if not ok:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Project {field_name} rejected: {reason}")
    
    try:
        turso = get_turso_http()
        now = datetime.now(timezone.utc).isoformat()
        skills_str = ",".join(project.skills) if project.skills else ""
        
        # Insert project and get ID atomically
        results = turso.execute_many([
            {
                "q": """INSERT INTO projects (title, description, category, budget_type, 
                                     budget_min, budget_max, experience_level, estimated_duration,
                                     skills, client_id, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                "params": [sanitize_text(project.title)[:MAX_TITLE_LENGTH], sanitize_text(project.description)[:MAX_DESCRIPTION_LENGTH], project.category, project.budget_type,
                 project.budget_min, project.budget_max, project.experience_level, 
                 project.estimated_duration, skills_str, current_user.id,
                 project.status or "open", now, now]
            },
            {
                "q": "SELECT last_insert_rowid() as id",
                "params": []
            }
        ])
        
        # Get the new project ID from the batch result
        new_id = None
        if len(results) >= 2:
            id_rows = results[1].get("rows", [])
            if id_rows:
                new_id = id_rows[0][0]
        
        if not new_id:
            raise HTTPException(status_code=500, detail="Project created but ID not retrieved")
        
        # Fetch the created project by its known ID
        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type, 
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at 
               FROM projects WHERE id = ?""",
            [new_id]
        )
        
        if not row:
            raise HTTPException(status_code=500, detail="Project created but not found")
        
        return _row_to_project(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("create_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Update project in Turso"""
    try:
        turso = get_turso_http()
        
        # Check project exists and user owns it
        existing = turso.fetch_one("SELECT client_id FROM projects WHERE id = ?", [project_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id and get_user_role(current_user) != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        # Build update query
        updates = []
        params = []
        
        update_data = project_update.dict(exclude_unset=True)
        ALLOWED_PROJECT_COLUMNS = frozenset({
            'title', 'description', 'category', 'budget_type', 'budget_min',
            'budget_max', 'experience_level', 'estimated_duration', 'skills',
            'status', 'visibility',
        })
        
        text_fields = {'title', 'description'}
        for key, value in update_data.items():
            if key not in ALLOWED_PROJECT_COLUMNS:
                continue
            if key == "skills" and value is not None:
                value = ",".join(value) if value else ""
            elif key in text_fields and value:
                max_len = MAX_TITLE_LENGTH if key == 'title' else MAX_DESCRIPTION_LENGTH
                value = sanitize_text(value, max_len)
            elif key == "status" and value:
                if value not in ALLOWED_STATUSES:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}")
            updates.append(f"{key} = ?")
            params.append(value)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(project_id)
            
            turso.execute(
                f"UPDATE projects SET {', '.join(updates)} WHERE id = ?",
                params
            )
        
        # Return updated project
        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type, 
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at 
               FROM projects WHERE id = ?""",
            [project_id]
        )
        return _row_to_project(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user)
) -> None:
    """Soft-delete project (sets status to 'cancelled')"""
    try:
        turso = get_turso_http()
        
        # Check project exists and user owns it
        existing = turso.fetch_one("SELECT client_id FROM projects WHERE id = ?", [project_id])
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id and get_user_role(current_user) != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        now = datetime.now(timezone.utc).isoformat()
        turso.execute(
            "UPDATE projects SET status = 'cancelled', updated_at = ? WHERE id = ?",
            [now, project_id]
        )
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_project failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.post("/{project_id}/pause", response_model=ProjectRead)
def pause_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Pause a project - temporarily stops accepting proposals"""
    try:
        turso = get_turso_http()

        existing = turso.fetch_one(
            "SELECT client_id, status FROM projects WHERE id = ?", [project_id]
        )
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        if existing[1] != "open":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only open projects can be paused"
            )

        now = datetime.now(timezone.utc).isoformat()
        turso.execute(
            "UPDATE projects SET status = 'paused', updated_at = ? WHERE id = ?",
            [now, project_id]
        )

        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type,
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at
               FROM projects WHERE id = ?""",
            [project_id]
        )
        return _row_to_project(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("pause_project failed: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database temporarily unavailable")


@router.post("/{project_id}/resume", response_model=ProjectRead)
def resume_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Resume a paused project"""
    try:
        turso = get_turso_http()

        existing = turso.fetch_one(
            "SELECT client_id, status FROM projects WHERE id = ?", [project_id]
        )
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        if existing[1] != "paused":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only paused projects can be resumed"
            )

        now = datetime.now(timezone.utc).isoformat()
        turso.execute(
            "UPDATE projects SET status = 'open', updated_at = ? WHERE id = ?",
            [now, project_id]
        )

        row = turso.fetch_one(
            """SELECT id, title, description, category, budget_type,
                      budget_min, budget_max, experience_level, estimated_duration,
                      skills, client_id, status, created_at, updated_at
               FROM projects WHERE id = ?""",
            [project_id]
        )
        return _row_to_project(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("resume_project failed: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database temporarily unavailable")


@router.get("/{project_id}/stats")
def get_project_stats(
    project_id: int,
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """Get detailed stats for a project (proposal counts, avg bid, etc.)"""
    try:
        turso = get_turso_http()

        # Verify ownership
        existing = turso.fetch_one(
            "SELECT client_id FROM projects WHERE id = ?", [project_id]
        )
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if existing[0] != current_user.id and get_user_role(current_user) != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        # Proposal stats
        prop_stats = turso.fetch_one(
            """SELECT COUNT(*) as total,
                      COALESCE(AVG(bid_amount), 0) as avg_bid,
                      COALESCE(MIN(bid_amount), 0) as min_bid,
                      COALESCE(MAX(bid_amount), 0) as max_bid
               FROM proposals
               WHERE project_id = ? AND is_draft = 0""",
            [project_id]
        )

        # Status breakdown
        status_result = turso.execute(
            """SELECT status, COUNT(*) FROM proposals
               WHERE project_id = ? AND is_draft = 0
               GROUP BY status""",
            [project_id]
        )
        status_breakdown = {}
        for row in status_result.get("rows", []):
            status_breakdown[row[0] or "unknown"] = int(row[1] or 0)

        return {
            "project_id": project_id,
            "total_proposals": int(prop_stats[0]) if prop_stats else 0,
            "average_bid": round(float(prop_stats[1]), 2) if prop_stats else 0,
            "min_bid": round(float(prop_stats[2]), 2) if prop_stats else 0,
            "max_bid": round(float(prop_stats[3]), 2) if prop_stats else 0,
            "proposal_status_breakdown": status_breakdown,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_project_stats failed: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database temporarily unavailable")
