# @AI-HINT: Workroom service layer - all database operations for Kanban, files, discussions, activity
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List

from app.db.turso_http import execute_query
from app.services.db_utils import get_val as _get_val

logger = logging.getLogger(__name__)


# ==================== Table Initialization ====================

_workroom_tables_initialized = False


def _create_workroom_tables():
    """Create all workroom tables."""
    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            column_name TEXT DEFAULT 'todo',
            priority TEXT DEFAULT 'medium',
            assignee_id INTEGER,
            created_by INTEGER NOT NULL,
            due_date TEXT,
            labels TEXT,
            order_index INTEGER DEFAULT 0,
            is_completed INTEGER DEFAULT 0,
            completed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (assignee_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_task_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES workroom_tasks(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            uploaded_by INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            description TEXT,
            version INTEGER DEFAULT 1,
            parent_file_id INTEGER,
            download_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_discussions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_pinned INTEGER DEFAULT 0,
            reply_count INTEGER DEFAULT 0,
            last_reply_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_discussion_replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discussion_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            parent_id INTEGER,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (discussion_id) REFERENCES workroom_discussions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS workroom_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            description TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (contract_id) REFERENCES contracts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])


# ==================== Contract Access ====================

def get_contract_parties(contract_id: int) -> Optional[dict]:
    """Get contract participants and status. Returns dict or None if not found."""
    result = execute_query("""
        SELECT client_id, freelancer_id, status FROM contracts WHERE id = ?
    """, [contract_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "client_id": int(_get_val(row, 0) or 0),
        "freelancer_id": int(_get_val(row, 1) or 0),
        "status": _get_val(row, 2)
    }


def log_activity(contract_id: int, user_id: int, activity_type: str,
                 entity_type: str = None, entity_id: int = None,
                 description: str = None, metadata: dict = None):
    """Log workroom activity."""
    now = datetime.now(timezone.utc).isoformat()
    metadata_json = json.dumps(metadata) if metadata else None
    try:
        execute_query("""
            INSERT INTO workroom_activity (contract_id, user_id, activity_type, entity_type,
                                           entity_id, description, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [contract_id, user_id, activity_type, entity_type, entity_id, description, metadata_json, now])
    except Exception as e:
        logger.warning(f"Failed to log activity: {e}")


# ==================== Kanban Board ====================

def get_board_tasks(contract_id: int) -> dict:
    """Get all tasks for a contract organized by column."""
    result = execute_query("""
        SELECT t.id, t.title, t.description, t.column_name, t.priority, t.assignee_id,
               u.name, t.due_date, t.labels, t.order_index, t.is_completed,
               t.completed_at, t.created_at, t.updated_at
        FROM workroom_tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.contract_id = ?
        ORDER BY t.column_name, t.order_index
    """, [contract_id])

    columns = {
        "todo": {"name": "To Do", "tasks": []},
        "in_progress": {"name": "In Progress", "tasks": []},
        "review": {"name": "Review", "tasks": []},
        "done": {"name": "Done", "tasks": []}
    }

    if result and result.get("rows"):
        for row in result["rows"]:
            task = {
                "id": _get_val(row, 0),
                "title": _get_val(row, 1),
                "description": _get_val(row, 2),
                "column": _get_val(row, 3),
                "priority": _get_val(row, 4),
                "assignee_id": _get_val(row, 5),
                "assignee_name": _get_val(row, 6),
                "due_date": _get_val(row, 7),
                "labels": json.loads(_get_val(row, 8) or "[]"),
                "order_index": _get_val(row, 9) or 0,
                "is_completed": bool(_get_val(row, 10)),
                "completed_at": _get_val(row, 11),
                "created_at": _get_val(row, 12)
            }
            column = task["column"] or "todo"
            if column in columns:
                columns[column]["tasks"].append(task)

    return {"columns": columns}


def get_next_order_index(contract_id: int, column: str) -> int:
    """Get next order index for a column."""
    result = execute_query("""
        SELECT MAX(order_index) FROM workroom_tasks WHERE contract_id = ? AND column_name = ?
    """, [contract_id, column])
    if result and result.get("rows"):
        return (_get_val(result["rows"][0], 0) or 0) + 1
    return 0


def create_task(contract_id: int, title: str, description: Optional[str], column: str,
                priority: str, assignee_id: Optional[int], created_by: int,
                due_date: Optional[str], labels_json: str, order_index: int, now: str) -> Optional[int]:
    """Create a new task. Returns task ID."""
    execute_query("""
        INSERT INTO workroom_tasks (contract_id, title, description, column_name, priority,
                                    assignee_id, created_by, due_date, labels, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [contract_id, title, description, column, priority,
          assignee_id, created_by, due_date, labels_json, order_index, now, now])

    id_result = execute_query("SELECT last_insert_rowid()", [])
    if id_result and id_result.get("rows"):
        return _get_val(id_result["rows"][0], 0)
    return None


def get_task_info(task_id: int) -> Optional[dict]:
    """Get task's contract_id and column_name."""
    result = execute_query("SELECT contract_id, column_name FROM workroom_tasks WHERE id = ?", [task_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "contract_id": int(_get_val(row, 0) or 0),
        "column_name": _get_val(row, 1)
    }


def update_task_fields(task_id: int, set_clause: str, params: list):
    """Update task fields with given SET clause and params."""
    execute_query(f"UPDATE workroom_tasks SET {set_clause} WHERE id = ?", params)


def mark_task_completed(task_id: int, now: str):
    """Mark task as completed."""
    execute_query("""
        UPDATE workroom_tasks SET is_completed = 1, completed_at = ? WHERE id = ?
    """, [now, task_id])


def unmark_task_completed(task_id: int):
    """Remove completion from task."""
    execute_query("UPDATE workroom_tasks SET is_completed = 0, completed_at = NULL WHERE id = ?", [task_id])


def move_task(task_id: int, column: str, order_index: int, is_completed: int,
              completed_at: Optional[str], now: str):
    """Move a task to a different column/position."""
    execute_query("""
        UPDATE workroom_tasks
        SET column_name = ?, order_index = ?, is_completed = ?, completed_at = COALESCE(?, completed_at), updated_at = ?
        WHERE id = ?
    """, [column, order_index, is_completed, completed_at, now, task_id])


def get_task_for_delete(task_id: int) -> Optional[dict]:
    """Get task contract_id and title for deletion."""
    result = execute_query("SELECT contract_id, title FROM workroom_tasks WHERE id = ?", [task_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "contract_id": int(_get_val(row, 0) or 0),
        "title": _get_val(row, 1)
    }


def delete_task_and_comments(task_id: int):
    """Delete a task and its comments."""
    execute_query("DELETE FROM workroom_task_comments WHERE task_id = ?", [task_id])
    execute_query("DELETE FROM workroom_tasks WHERE id = ?", [task_id])


# ==================== File Sharing ====================

def list_contract_files(contract_id: int) -> List[dict]:
    """List all files in a contract workroom."""
    result = execute_query("""
        SELECT f.id, f.filename, f.original_name, f.file_size, f.mime_type, f.description,
               f.version, f.download_count, f.uploaded_by, u.name, f.created_at
        FROM workroom_files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE f.contract_id = ? AND f.parent_file_id IS NULL
        ORDER BY f.created_at DESC
    """, [contract_id])

    files = []
    if result and result.get("rows"):
        for row in result["rows"]:
            files.append({
                "id": _get_val(row, 0),
                "filename": _get_val(row, 1),
                "original_name": _get_val(row, 2),
                "file_size": _get_val(row, 3),
                "mime_type": _get_val(row, 4),
                "description": _get_val(row, 5),
                "version": _get_val(row, 6),
                "download_count": _get_val(row, 7),
                "uploaded_by": _get_val(row, 8),
                "uploader_name": _get_val(row, 9),
                "created_at": _get_val(row, 10)
            })
    return files


def insert_file_record(contract_id: int, uploaded_by: int, unique_filename: str,
                       original_name: str, file_path: str, file_size: int,
                       content_type: str, description: Optional[str], now: str):
    """Insert a file record into workroom_files."""
    execute_query("""
        INSERT INTO workroom_files (contract_id, uploaded_by, filename, original_name, file_path,
                                    file_size, mime_type, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [contract_id, uploaded_by, unique_filename, original_name, file_path,
          file_size, content_type, description, now, now])


def get_file_info(file_id: int) -> Optional[dict]:
    """Get file info for download."""
    result = execute_query("""
        SELECT contract_id, file_path, original_name FROM workroom_files WHERE id = ?
    """, [file_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "contract_id": int(_get_val(row, 0) or 0),
        "file_path": _get_val(row, 1),
        "original_name": _get_val(row, 2)
    }


def increment_download_count(file_id: int):
    """Increment download count for a file."""
    execute_query("UPDATE workroom_files SET download_count = download_count + 1 WHERE id = ?", [file_id])


def get_file_for_delete(file_id: int) -> Optional[dict]:
    """Get file info needed for deletion."""
    result = execute_query("""
        SELECT contract_id, file_path, original_name, uploaded_by FROM workroom_files WHERE id = ?
    """, [file_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "contract_id": int(_get_val(row, 0) or 0),
        "file_path": _get_val(row, 1),
        "original_name": _get_val(row, 2),
        "uploaded_by": int(_get_val(row, 3) or 0)
    }


def delete_file_record(file_id: int):
    """Delete file record from database."""
    execute_query("DELETE FROM workroom_files WHERE id = ?", [file_id])


# ==================== Discussions ====================

def list_contract_discussions(contract_id: int, limit: int, skip: int) -> List[dict]:
    """List discussions in a contract workroom."""
    result = execute_query("""
        SELECT d.id, d.user_id, u.name, d.title, d.content, d.is_pinned,
               d.reply_count, d.last_reply_at, d.created_at, d.updated_at
        FROM workroom_discussions d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.contract_id = ?
        ORDER BY d.is_pinned DESC, d.last_reply_at DESC, d.created_at DESC
        LIMIT ? OFFSET ?
    """, [contract_id, limit, skip])

    discussions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            content_val = _get_val(row, 4) or ""
            discussions.append({
                "id": _get_val(row, 0),
                "user_id": _get_val(row, 1),
                "author_name": _get_val(row, 2),
                "title": _get_val(row, 3),
                "content": content_val[:300] + "..." if len(content_val) > 300 else content_val,
                "is_pinned": bool(_get_val(row, 5)),
                "reply_count": _get_val(row, 6) or 0,
                "last_reply_at": _get_val(row, 7),
                "created_at": _get_val(row, 8)
            })
    return discussions


def create_discussion_record(contract_id: int, user_id: int, title: str,
                             content: str, is_pinned: bool, now: str):
    """Create a new discussion."""
    execute_query("""
        INSERT INTO workroom_discussions (contract_id, user_id, title, content, is_pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [contract_id, user_id, title, content, 1 if is_pinned else 0, now, now])


def get_discussion_detail(discussion_id: int) -> Optional[dict]:
    """Get discussion with contract_id for access check."""
    result = execute_query("""
        SELECT d.id, d.contract_id, d.user_id, u.name, d.title, d.content,
               d.is_pinned, d.reply_count, d.last_reply_at, d.created_at, d.updated_at
        FROM workroom_discussions d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
    """, [discussion_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": _get_val(row, 0),
        "contract_id": int(_get_val(row, 1) or 0),
        "user_id": _get_val(row, 2),
        "author_name": _get_val(row, 3),
        "title": _get_val(row, 4),
        "content": _get_val(row, 5),
        "is_pinned": bool(_get_val(row, 6)),
        "reply_count": _get_val(row, 7) or 0,
        "last_reply_at": _get_val(row, 8),
        "created_at": _get_val(row, 9),
        "updated_at": _get_val(row, 10)
    }


def get_discussion_replies(discussion_id: int) -> List[dict]:
    """Get all replies for a discussion."""
    result = execute_query("""
        SELECT r.id, r.user_id, u.name, r.parent_id, r.content, r.created_at, r.updated_at
        FROM workroom_discussion_replies r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.discussion_id = ?
        ORDER BY r.created_at ASC
    """, [discussion_id])

    replies = []
    if result and result.get("rows"):
        for rrow in result["rows"]:
            replies.append({
                "id": _get_val(rrow, 0),
                "user_id": _get_val(rrow, 1),
                "author_name": _get_val(rrow, 2),
                "parent_id": _get_val(rrow, 3),
                "content": _get_val(rrow, 4),
                "created_at": _get_val(rrow, 5),
                "updated_at": _get_val(rrow, 6)
            })
    return replies


def get_discussion_contract_id(discussion_id: int) -> Optional[int]:
    """Get the contract_id for a discussion."""
    result = execute_query("SELECT contract_id FROM workroom_discussions WHERE id = ?", [discussion_id])
    if not result or not result.get("rows"):
        return None
    return int(_get_val(result["rows"][0], 0) or 0)


def create_reply_record(discussion_id: int, user_id: int, parent_id: Optional[int],
                        content: str, now: str):
    """Add a reply to a discussion and update reply count."""
    execute_query("""
        INSERT INTO workroom_discussion_replies (discussion_id, user_id, parent_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, [discussion_id, user_id, parent_id, content, now, now])

    execute_query("""
        UPDATE workroom_discussions SET reply_count = reply_count + 1, last_reply_at = ?, updated_at = ?
        WHERE id = ?
    """, [now, now, discussion_id])


# ==================== Activity Feed ====================

def get_activity_feed(contract_id: int, limit: int, skip: int) -> List[dict]:
    """Get activity feed for a workroom."""
    result = execute_query("""
        SELECT a.id, a.user_id, u.name, a.activity_type, a.entity_type, a.entity_id,
               a.description, a.metadata, a.created_at
        FROM workroom_activity a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.contract_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    """, [contract_id, limit, skip])

    activities = []
    if result and result.get("rows"):
        for row in result["rows"]:
            activities.append({
                "id": _get_val(row, 0),
                "user_id": _get_val(row, 1),
                "user_name": _get_val(row, 2),
                "activity_type": _get_val(row, 3),
                "entity_type": _get_val(row, 4),
                "entity_id": _get_val(row, 5),
                "description": _get_val(row, 6),
                "metadata": json.loads(_get_val(row, 7) or "{}"),
                "created_at": _get_val(row, 8)
            })
    return activities


# ==================== Workroom Summary ====================

def get_workroom_summary_data(contract_id: int) -> dict:
    """Get summary statistics for a workroom."""
    summary = {"contract_id": contract_id}

    # Task counts by column
    tasks_result = execute_query("""
        SELECT column_name, COUNT(*) FROM workroom_tasks WHERE contract_id = ? GROUP BY column_name
    """, [contract_id])

    task_counts = {"todo": 0, "in_progress": 0, "review": 0, "done": 0}
    if tasks_result and tasks_result.get("rows"):
        for row in tasks_result["rows"]:
            col = _get_val(row, 0)
            count = _get_val(row, 1) or 0
            if col in task_counts:
                task_counts[col] = count

    summary["tasks"] = task_counts
    summary["total_tasks"] = sum(task_counts.values())
    summary["completion_rate"] = round(task_counts["done"] / max(summary["total_tasks"], 1) * 100, 1)

    # File count
    files_result = execute_query("SELECT COUNT(*) FROM workroom_files WHERE contract_id = ?", [contract_id])
    summary["file_count"] = _get_val(files_result["rows"][0], 0) or 0 if files_result and files_result.get("rows") else 0

    # Discussion count
    disc_result = execute_query("SELECT COUNT(*) FROM workroom_discussions WHERE contract_id = ?", [contract_id])
    summary["discussion_count"] = _get_val(disc_result["rows"][0], 0) or 0 if disc_result and disc_result.get("rows") else 0

    # Recent activity count (last 7 days)
    week_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    activity_result = execute_query("""
        SELECT COUNT(*) FROM workroom_activity WHERE contract_id = ? AND created_at > ?
    """, [contract_id, week_ago])
    summary["recent_activities"] = _get_val(activity_result["rows"][0], 0) or 0 if activity_result and activity_result.get("rows") else 0

    return summary

