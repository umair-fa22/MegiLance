# @AI-HINT: Service layer for tags CRUD - all execute_query calls for tags router
"""
Tags Service - Business logic and data access for tag management.
Handles tag CRUD, project-tag associations, and usage tracking.
"""

import logging
import re
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from tag name"""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')


def find_or_create_tag(name: str, tag_type: str) -> Dict[str, Any]:
    """
    Create a new tag or return existing one.
    Returns the tag dict. Raises ValueError on failure.
    """
    # Check if tag exists
    result = execute_query(
        "SELECT id, name, slug, type, usage_count, created_at FROM tags WHERE LOWER(name) = ?",
        [name]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0]

    # Generate unique slug
    slug = generate_slug(name)
    result = execute_query("SELECT id FROM tags WHERE slug = ?", [slug])
    if result and result.get("rows"):
        counter = 1
        while True:
            check = execute_query("SELECT id FROM tags WHERE slug = ?", [f"{slug}-{counter}"])
            if not check or not check.get("rows"):
                break
            counter += 1
        slug = f"{slug}-{counter}"

    now = datetime.now(timezone.utc).isoformat()

    result = execute_query(
        "INSERT INTO tags (name, slug, type, usage_count, created_at) VALUES (?, ?, ?, ?, ?)",
        [name, slug, tag_type, 0, now]
    )

    if not result:
        raise ValueError("Failed to create tag")

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)

    return {
        "id": new_id,
        "name": name,
        "slug": slug,
        "type": tag_type,
        "usage_count": 0,
        "created_at": now
    }


def list_tags(
    tag_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """List tags with optional type/search filters."""
    where_clauses = []
    params: list = []

    if tag_type:
        where_clauses.append("type = ?")
        params.append(tag_type)

    if search:
        where_clauses.append("name LIKE ?")
        params.append(f"%{search}%")

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params.append(limit)

    result = execute_query(
        f"""SELECT id, name, slug, type, usage_count, created_at
            FROM tags WHERE {where_sql}
            ORDER BY usage_count DESC, name ASC
            LIMIT ?""",
        params
    )

    if not result:
        return []

    return parse_rows(result)


def get_popular_tags(limit: int = 20) -> List[Dict[str, Any]]:
    """Get most used tags."""
    result = execute_query(
        """SELECT id, name, slug, type, usage_count, created_at
           FROM tags WHERE usage_count > 0
           ORDER BY usage_count DESC
           LIMIT ?""",
        [limit]
    )

    if not result:
        return []

    return parse_rows(result)


def get_tag_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get a tag by slug. Returns None if not found."""
    result = execute_query(
        "SELECT id, name, slug, type, usage_count, created_at FROM tags WHERE slug = ?",
        [slug]
    )

    if not result or not result.get("rows"):
        return None

    rows = parse_rows(result)
    return rows[0] if rows else None


def get_tag_by_id(tag_id: int) -> Optional[Dict[str, Any]]:
    """Get a tag by ID. Returns None if not found."""
    result = execute_query(
        "SELECT id, name, slug, type, usage_count FROM tags WHERE id = ?",
        [tag_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def check_tag_name_exists(name: str, exclude_id: int) -> bool:
    """Check if a tag name already exists (excluding a specific ID)."""
    check = execute_query(
        "SELECT id FROM tags WHERE LOWER(name) = ? AND id != ?",
        [name, exclude_id]
    )
    return bool(check and check.get("rows"))


def update_tag(tag_id: int, update_data: dict) -> Dict[str, Any]:
    """
    Update a tag's name/type. Returns updated tag dict.
    Raises ValueError if name conflict.
    """
    updates = []
    params: list = []

    if "name" in update_data:
        normalized = update_data["name"].strip().lower()
        if check_tag_name_exists(normalized, tag_id):
            raise ValueError("Tag name already exists")
        updates.append("name = ?")
        params.append(normalized)
        updates.append("slug = ?")
        params.append(generate_slug(normalized))

    if "type" in update_data:
        updates.append("type = ?")
        params.append(update_data["type"])

    if updates:
        params.append(tag_id)
        execute_query(
            f"UPDATE tags SET {', '.join(updates)} WHERE id = ?",
            params
        )

    result = execute_query(
        "SELECT id, name, slug, type, usage_count, created_at FROM tags WHERE id = ?",
        [tag_id]
    )

    rows = parse_rows(result)
    return rows[0] if rows else {}


def delete_tag(tag_id: int) -> None:
    """Delete a tag and all its project associations."""
    execute_query("DELETE FROM project_tags WHERE tag_id = ?", [tag_id])
    execute_query("DELETE FROM tags WHERE id = ?", [tag_id])


def tag_exists(tag_id: int) -> bool:
    """Check if a tag exists by ID."""
    result = execute_query("SELECT id FROM tags WHERE id = ?", [tag_id])
    return bool(result and result.get("rows"))


def get_project_owner(project_id: int) -> Optional[Dict[str, Any]]:
    """Get project info including client_id. Returns None if not found."""
    result = execute_query("SELECT id, client_id FROM projects WHERE id = ?", [project_id])
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def get_tag_usage_count(tag_id: int) -> Optional[int]:
    """Get a tag's usage_count. Returns None if tag not found."""
    result = execute_query("SELECT id, usage_count FROM tags WHERE id = ?", [tag_id])
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0].get("usage_count") if rows else None


def is_tag_on_project(project_id: int, tag_id: int) -> bool:
    """Check if a tag is already associated with a project."""
    result = execute_query(
        "SELECT id FROM project_tags WHERE project_id = ? AND tag_id = ?",
        [project_id, tag_id]
    )
    return bool(result and result.get("rows"))


def add_tag_to_project(project_id: int, tag_id: int) -> None:
    """Create project-tag association and increment usage count."""
    execute_query(
        "INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)",
        [project_id, tag_id]
    )
    execute_query(
        "UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?",
        [tag_id]
    )


def remove_tag_from_project(project_id: int, tag_id: int) -> bool:
    """
    Remove project-tag association and decrement usage count.
    Returns False if association doesn't exist.
    """
    result = execute_query(
        "SELECT id FROM project_tags WHERE project_id = ? AND tag_id = ?",
        [project_id, tag_id]
    )
    if not result or not result.get("rows"):
        return False

    execute_query(
        "UPDATE tags SET usage_count = MAX(0, usage_count - 1) WHERE id = ?",
        [tag_id]
    )
    execute_query(
        "DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?",
        [project_id, tag_id]
    )
    return True


def project_exists(project_id: int) -> bool:
    """Check if a project exists."""
    result = execute_query("SELECT id FROM projects WHERE id = ?", [project_id])
    return bool(result and result.get("rows"))


def get_project_tags(project_id: int) -> List[Dict[str, Any]]:
    """Get all tags for a project."""
    result = execute_query(
        """SELECT t.id, t.name, t.slug, t.type, t.usage_count, t.created_at
           FROM tags t
           INNER JOIN project_tags pt ON t.id = pt.tag_id
           WHERE pt.project_id = ?""",
        [project_id]
    )

    if not result:
        return []

    return parse_rows(result)
