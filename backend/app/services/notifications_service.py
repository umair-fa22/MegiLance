# @AI-HINT: Service layer for notification CRUD operations - all DB access via Turso HTTP
"""Notifications Service - Data access layer for notification management."""

import logging
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows

# Columns for notification queries
NOTIFICATION_COLUMNS = """id, user_id, notification_type, title, content, data, priority,
                          action_url, is_read, read_at, expires_at, created_at"""


def insert_notification(
    user_id: int,
    notification_type: Optional[str],
    title: Optional[str],
    content: Optional[str],
    data_json: Optional[str],
    priority: str,
    action_url: Optional[str],
    expires_at: Optional[str],
    now: str
) -> int:
    """Insert a new notification and return its ID."""
    result = execute_query(
        """INSERT INTO notifications (user_id, notification_type, title, content, data, 
                                      priority, action_url, expires_at, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [user_id, notification_type, title, content, data_json, priority, action_url, expires_at, False, now]
    )
    if not result:
        return 0

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    return new_id


def query_notification_count(where_sql: str, params: List) -> int:
    """Get total count of notifications matching filter."""
    result = execute_query(
        f"SELECT COUNT(*) as total FROM notifications WHERE {where_sql}",
        params
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0].get("total", 0)
    return 0


def query_unread_count(user_id: int) -> int:
    """Get unread notification count for a user."""
    result = execute_query(
        "SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0",
        [user_id]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0].get("unread", 0)
    return 0


def query_notifications(where_sql: str, params: List, limit: int, offset: int) -> List[Dict[str, Any]]:
    """Query notifications with filter, ordering, and pagination."""
    all_params = list(params) + [limit, offset]
    result = execute_query(
        f"""SELECT {NOTIFICATION_COLUMNS}
            FROM notifications WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        all_params
    )
    if not result or not result.get("rows"):
        return []
    return parse_rows(result)


def fetch_notification_by_id(notification_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a single notification by ID."""
    result = execute_query(
        f"SELECT {NOTIFICATION_COLUMNS} FROM notifications WHERE id = ?",
        [notification_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def mark_notification_as_read(notification_id: int, now: str) -> None:
    """Mark a specific notification as read."""
    execute_query(
        "UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?",
        [now, notification_id]
    )


def fetch_notification_for_permission(notification_id: int) -> Optional[Dict[str, Any]]:
    """Fetch minimal notification data for permission/update checks."""
    result = execute_query(
        "SELECT id, user_id, is_read, read_at FROM notifications WHERE id = ?",
        [notification_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def update_notification_fields(notification_id: int, set_clause: str, params: List) -> None:
    """Update notification fields."""
    execute_query(
        f"UPDATE notifications SET {set_clause} WHERE id = ?",
        params
    )


def mark_all_read(user_id: int, now: str) -> None:
    """Mark all notifications as read for a user."""
    execute_query(
        "UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0",
        [now, user_id]
    )


def fetch_notification_owner(notification_id: int) -> Optional[Dict[str, Any]]:
    """Fetch notification ownership data for delete check."""
    result = execute_query(
        "SELECT id, user_id FROM notifications WHERE id = ?",
        [notification_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def delete_notification_record(notification_id: int) -> None:
    """Delete a notification by ID."""
    execute_query("DELETE FROM notifications WHERE id = ?", [notification_id])


def send_notification(
    user_id: int,
    notification_type: str,
    title: str,
    content: str,
    data: dict = None,
    priority: str = "medium",
    action_url: str = None,
    expires_at: str = None,
) -> Optional[Dict[str, Any]]:
    """Helper function to send a notification (used by other modules)."""
    now = datetime.now(timezone.utc).isoformat()
    data_json = json.dumps(data) if data else None

    new_id = insert_notification(
        user_id, notification_type, title, content, data_json,
        priority, action_url, expires_at, now
    )

    if not new_id:
        return None

    return {
        "id": new_id,
        "user_id": user_id,
        "notification_type": notification_type,
        "title": title,
        "content": content,
        "data": data,
        "priority": priority,
        "action_url": action_url,
        "is_read": False,
        "created_at": now
    }
