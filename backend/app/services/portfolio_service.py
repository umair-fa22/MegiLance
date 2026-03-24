# @AI-HINT: Portfolio items service layer - CRUD database operations for portfolio items
from datetime import datetime, timezone
from typing import List, Optional
import logging
import json
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows


def verify_user_is_freelancer(user_id) -> Optional[bool]:
    """Check if user exists and is a freelancer. Returns None if not found, False if not freelancer, True if ok."""
    result = execute_query(
        "SELECT id, user_type FROM users WHERE id = ?",
        [user_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    if not rows:
        return None
    user_type = rows[0].get("user_type", "")
    if user_type and user_type.lower() != "freelancer":
        return False
    return True


def list_portfolio_items(user_id, skip: int = 0, limit: int = 100) -> List[dict]:
    """List portfolio items for a user."""
    result = execute_query(
        """SELECT id, freelancer_id, title, description, image_url, project_url,
                  created_at, updated_at, tags
           FROM portfolio_items
           WHERE freelancer_id = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?""",
        [user_id, limit, skip]
    )

    if not result:
        return []

    return parse_rows(result)


def get_portfolio_item_by_id(item_id: int) -> Optional[dict]:
    """Get a specific portfolio item by ID. Returns None if not found."""
    result = execute_query(
        """SELECT id, freelancer_id, title, description, image_url, project_url,
                  created_at, updated_at, tags
           FROM portfolio_items WHERE id = ?""",
        [item_id]
    )

    if not result or not result.get("rows"):
        return None

    rows = parse_rows(result)
    return rows[0] if rows else None


def create_portfolio_item_record(user_id, title, description, image_url, project_url, tags_json) -> tuple:
    """Insert a portfolio item. Returns (new_id, created_at). Raises RuntimeError on failure."""
    now = datetime.now(timezone.utc).isoformat()

    result = execute_query(
        """INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url, created_at, updated_at, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [user_id, title, description, image_url, project_url, now, now, tags_json]
    )

    if not result:
        raise RuntimeError("Failed to create portfolio item")

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)

    return new_id, now


def get_portfolio_item_owner(item_id: int) -> Optional[dict]:
    """Get portfolio item ownership info. Returns None if not found."""
    result = execute_query(
        "SELECT id, freelancer_id FROM portfolio_items WHERE id = ?",
        [item_id]
    )

    if not result or not result.get("rows"):
        return None

    rows = parse_rows(result)
    return rows[0] if rows else None


def update_portfolio_item_record(item_id: int, portfolio_item: dict) -> Optional[dict]:
    """Update a portfolio item and return the updated record."""
    updates = []
    params = []

    if "title" in portfolio_item:
        updates.append("title = ?")
        params.append(portfolio_item["title"])
    if "description" in portfolio_item:
        updates.append("description = ?")
        params.append(portfolio_item["description"])
    if "image_url" in portfolio_item:
        updates.append("image_url = ?")
        params.append(portfolio_item["image_url"])
    if "project_url" in portfolio_item:
        updates.append("project_url = ?")
        params.append(portfolio_item["project_url"])
    if "tags" in portfolio_item:
        updates.append("tags = ?")
        params.append(json.dumps(portfolio_item["tags"]))

    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(item_id)

        execute_query(
            f"UPDATE portfolio_items SET {', '.join(updates)} WHERE id = ?",
            params
        )

    result = execute_query(
        """SELECT id, freelancer_id, title, description, image_url, project_url,
                  created_at, updated_at, tags
           FROM portfolio_items WHERE id = ?""",
        [item_id]
    )

    rows = parse_rows(result)
    return rows[0] if rows else None


def delete_portfolio_item_record(item_id: int) -> None:
    """Delete a portfolio item by ID."""
    execute_query("DELETE FROM portfolio_items WHERE id = ?", [item_id])
