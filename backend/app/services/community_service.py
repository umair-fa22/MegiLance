# @AI-HINT: Community Hub service layer - all database operations for Q&A, Playbooks, Office Hours
"""Service layer for the Community Hub."""

from datetime import datetime, timezone
from typing import Optional
import json
import logging

from app.db.turso_http import execute_query
from app.services.db_utils import get_val as _get_val

logger = logging.getLogger(__name__)


def _row_to_question(row: list, truncate_content: bool = False) -> dict:
    """Convert a question DB row to a dict."""
    content = _get_val(row, 4)
    if truncate_content and content and len(content) > 300:
        content = content[:300] + "..."
    result = {
        "id": _get_val(row, 0),
        "user_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "content": content,
        "tags": json.loads(_get_val(row, 5) or "[]"),
        "category": _get_val(row, 6),
        "status": _get_val(row, 7),
        "view_count": _get_val(row, 8) or 0,
        "upvotes": _get_val(row, 9) or 0,
        "downvotes": _get_val(row, 10) or 0,
        "answer_count": _get_val(row, 11) or 0,
    }
    if truncate_content:
        result["has_accepted_answer"] = _get_val(row, 12) is not None
        result["created_at"] = _get_val(row, 13)
    else:
        result["accepted_answer_id"] = _get_val(row, 12)
        result["created_at"] = _get_val(row, 13)
        result["updated_at"] = _get_val(row, 14)
    return result


def _row_to_answer(row: list) -> dict:
    """Convert an answer DB row to a dict."""
    return {
        "id": _get_val(row, 0),
        "user_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "content": _get_val(row, 3),
        "upvotes": _get_val(row, 4) or 0,
        "downvotes": _get_val(row, 5) or 0,
        "is_accepted": bool(_get_val(row, 6)),
        "created_at": _get_val(row, 7),
        "updated_at": _get_val(row, 8),
    }


def _row_to_playbook_summary(row: list) -> dict:
    """Convert a playbook DB row (list view) to a dict."""
    return {
        "id": _get_val(row, 0),
        "author_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "description": _get_val(row, 4),
        "category": _get_val(row, 5),
        "tags": json.loads(_get_val(row, 6) or "[]"),
        "difficulty_level": _get_val(row, 7),
        "view_count": _get_val(row, 8) or 0,
        "like_count": _get_val(row, 9) or 0,
        "bookmark_count": _get_val(row, 10) or 0,
        "published_at": _get_val(row, 11),
        "created_at": _get_val(row, 12),
    }


def _row_to_playbook_detail(row: list) -> dict:
    """Convert a playbook DB row (detail view) to a dict."""
    return {
        "id": _get_val(row, 0),
        "author_id": _get_val(row, 1),
        "author_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "description": _get_val(row, 4),
        "content": _get_val(row, 5),
        "category": _get_val(row, 6),
        "tags": json.loads(_get_val(row, 7) or "[]"),
        "difficulty_level": _get_val(row, 8),
        "status": _get_val(row, 9),
        "view_count": _get_val(row, 10) or 0,
        "like_count": _get_val(row, 11) or 0,
        "bookmark_count": _get_val(row, 12) or 0,
        "published_at": _get_val(row, 13),
        "created_at": _get_val(row, 14),
        "updated_at": _get_val(row, 15),
    }


def _row_to_office_hours_summary(row: list) -> dict:
    """Convert an office hours DB row (list view) to a dict."""
    return {
        "id": _get_val(row, 0),
        "host_id": _get_val(row, 1),
        "host_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "description": _get_val(row, 4),
        "scheduled_at": _get_val(row, 5),
        "duration_minutes": _get_val(row, 6),
        "max_attendees": _get_val(row, 7),
        "category": _get_val(row, 8),
        "status": _get_val(row, 9),
        "is_public": bool(_get_val(row, 10)),
        "attendee_count": _get_val(row, 11) or 0,
        "created_at": _get_val(row, 12),
    }


def _row_to_office_hours_detail(row: list) -> dict:
    """Convert an office hours DB row (detail view) to a dict."""
    return {
        "id": _get_val(row, 0),
        "host_id": _get_val(row, 1),
        "host_name": _get_val(row, 2),
        "title": _get_val(row, 3),
        "description": _get_val(row, 4),
        "scheduled_at": _get_val(row, 5),
        "duration_minutes": _get_val(row, 6),
        "max_attendees": _get_val(row, 7),
        "category": _get_val(row, 8),
        "status": _get_val(row, 9),
        "is_public": bool(_get_val(row, 10)),
        "recording_url": _get_val(row, 11),
        "attendee_count": _get_val(row, 12) or 0,
        "created_at": _get_val(row, 13),
        "updated_at": _get_val(row, 14),
    }


# ==================== Table Initialization ====================

def ensure_community_tables():
    """Create community tables if they don't exist."""
    execute_query("""
        CREATE TABLE IF NOT EXISTS community_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT,
            category TEXT,
            status TEXT DEFAULT 'open',
            view_count INTEGER DEFAULT 0,
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0,
            answer_count INTEGER DEFAULT 0,
            accepted_answer_id INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS community_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0,
            is_accepted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES community_questions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS community_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            vote_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(user_id, target_type, target_id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS community_playbooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT,
            difficulty_level TEXT DEFAULT 'intermediate',
            status TEXT DEFAULT 'draft',
            view_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            bookmark_count INTEGER DEFAULT 0,
            published_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS community_office_hours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            host_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 60,
            max_attendees INTEGER DEFAULT 50,
            category TEXT,
            status TEXT DEFAULT 'scheduled',
            is_public INTEGER DEFAULT 1,
            recording_url TEXT,
            attendee_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (host_id) REFERENCES users(id)
        )
    """, [])

    execute_query("""
        CREATE TABLE IF NOT EXISTS community_oh_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            office_hours_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            registered_at TEXT NOT NULL,
            attended INTEGER DEFAULT 0,
            UNIQUE(office_hours_id, user_id),
            FOREIGN KEY (office_hours_id) REFERENCES community_office_hours(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """, [])


# ==================== Q&A Service Functions ====================

def insert_question(user_id: int, title: str, content: str, tags_json: str, category: Optional[str]) -> Optional[dict]:
    """Insert a new question and return the created record."""
    now = datetime.now(timezone.utc).isoformat()

    execute_query("""
        INSERT INTO community_questions (user_id, title, content, tags, category, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
    """, [user_id, title, content, tags_json, category, now, now])

    result = execute_query("""
        SELECT q.id, q.user_id, u.name, q.title, q.content, q.tags, q.category,
               q.status, q.view_count, q.upvotes, q.downvotes, q.answer_count,
               q.accepted_answer_id, q.created_at, q.updated_at
        FROM community_questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.user_id = ? ORDER BY q.id DESC LIMIT 1
    """, [user_id])

    if not result or not result.get("rows"):
        return None

    return _row_to_question(result["rows"][0])


def fetch_questions(
    category: Optional[str],
    tag: Optional[str],
    status_filter: Optional[str],
    sort_by: str,
    skip: int,
    limit: int,
) -> list:
    """Fetch a filtered and sorted list of questions."""
    sql = """
        SELECT q.id, q.user_id, u.name, q.title, q.content, q.tags, q.category,
               q.status, q.view_count, q.upvotes, q.downvotes, q.answer_count,
               q.accepted_answer_id, q.created_at, q.updated_at
        FROM community_questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE 1=1
    """
    params: list = []

    if category:
        sql += " AND q.category = ?"
        params.append(category)

    if tag:
        sql += " AND q.tags LIKE ?"
        params.append(f"%{tag}%")

    if status_filter:
        sql += " AND q.status = ?"
        params.append(status_filter)

    if sort_by == "popular":
        sql += " ORDER BY (q.upvotes - q.downvotes) DESC, q.view_count DESC"
    elif sort_by == "unanswered":
        sql += " AND q.answer_count = 0 ORDER BY q.created_at DESC"
    else:
        sql += " ORDER BY q.created_at DESC"

    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, skip])

    result = execute_query(sql, params)

    questions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            questions.append(_row_to_question(row, truncate_content=True))
    return questions


def get_question_detail(question_id: int) -> Optional[dict]:
    """Increment view count and return question with answers."""
    execute_query("UPDATE community_questions SET view_count = view_count + 1 WHERE id = ?", [question_id])

    result = execute_query("""
        SELECT q.id, q.user_id, u.name, q.title, q.content, q.tags, q.category,
               q.status, q.view_count, q.upvotes, q.downvotes, q.answer_count,
               q.accepted_answer_id, q.created_at, q.updated_at
        FROM community_questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id = ?
    """, [question_id])

    if not result or not result.get("rows"):
        return None

    question = _row_to_question(result["rows"][0])

    answers_result = execute_query("""
        SELECT a.id, a.user_id, u.name, a.content, a.upvotes, a.downvotes,
               a.is_accepted, a.created_at, a.updated_at
        FROM community_answers a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.question_id = ?
        ORDER BY a.is_accepted DESC, (a.upvotes - a.downvotes) DESC, a.created_at ASC
    """, [question_id])

    answers = []
    if answers_result and answers_result.get("rows"):
        for arow in answers_result["rows"]:
            answers.append(_row_to_answer(arow))

    question["answers"] = answers
    return question


def question_exists(question_id: int) -> bool:
    """Check whether a question exists."""
    result = execute_query("SELECT id FROM community_questions WHERE id = ?", [question_id])
    return bool(result and result.get("rows"))


def insert_answer(question_id: int, user_id: int, content: str) -> None:
    """Insert an answer and increment the question's answer count."""
    now = datetime.now(timezone.utc).isoformat()

    execute_query("""
        INSERT INTO community_answers (question_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, [question_id, user_id, content, now, now])

    execute_query("""
        UPDATE community_questions SET answer_count = answer_count + 1, updated_at = ? WHERE id = ?
    """, [now, question_id])


def vote_on_question(user_id: int, question_id: int, vote_type: str) -> dict:
    """Handle voting on a question. Returns {"action": "removed"|"changed"|"recorded"}."""
    now = datetime.now(timezone.utc).isoformat()

    existing = execute_query("""
        SELECT id, vote_type FROM community_votes
        WHERE user_id = ? AND target_type = 'question' AND target_id = ?
    """, [user_id, question_id])

    if existing and existing.get("rows"):
        old_vote = _get_val(existing["rows"][0], 1)
        if old_vote == vote_type:
            # Remove vote
            execute_query("""
                DELETE FROM community_votes WHERE user_id = ? AND target_type = 'question' AND target_id = ?
            """, [user_id, question_id])

            if vote_type == "upvote":
                execute_query("UPDATE community_questions SET upvotes = upvotes - 1 WHERE id = ?", [question_id])
            else:
                execute_query("UPDATE community_questions SET downvotes = downvotes - 1 WHERE id = ?", [question_id])

            return {"action": "removed", "message": "Vote removed"}
        else:
            # Change vote
            execute_query("""
                UPDATE community_votes SET vote_type = ?, created_at = ?
                WHERE user_id = ? AND target_type = 'question' AND target_id = ?
            """, [vote_type, now, user_id, question_id])

            if vote_type == "upvote":
                execute_query("UPDATE community_questions SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?", [question_id])
            else:
                execute_query("UPDATE community_questions SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?", [question_id])

            return {"action": "changed", "message": "Vote changed"}
    else:
        # New vote
        execute_query("""
            INSERT INTO community_votes (user_id, target_type, target_id, vote_type, created_at)
            VALUES (?, 'question', ?, ?, ?)
        """, [user_id, question_id, vote_type, now])

        if vote_type == "upvote":
            execute_query("UPDATE community_questions SET upvotes = upvotes + 1 WHERE id = ?", [question_id])
        else:
            execute_query("UPDATE community_questions SET downvotes = downvotes + 1 WHERE id = ?", [question_id])

        return {"action": "recorded", "message": "Vote recorded"}


def get_answer_ownership(answer_id: int) -> Optional[dict]:
    """Get question_id and question author for an answer. Returns None if not found."""
    result = execute_query("""
        SELECT a.question_id, q.user_id
        FROM community_answers a
        JOIN community_questions q ON a.question_id = q.id
        WHERE a.id = ?
    """, [answer_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "question_id": _get_val(row, 0),
        "question_author_id": _get_val(row, 1),
    }


def mark_answer_accepted(answer_id: int, question_id: int) -> None:
    """Unaccept previous answer and accept the given one."""
    now = datetime.now(timezone.utc).isoformat()

    execute_query("UPDATE community_answers SET is_accepted = 0 WHERE question_id = ?", [question_id])
    execute_query("UPDATE community_answers SET is_accepted = 1, updated_at = ? WHERE id = ?", [now, answer_id])
    execute_query("""
        UPDATE community_questions SET accepted_answer_id = ?, status = 'answered', updated_at = ? WHERE id = ?
    """, [answer_id, now, question_id])


# ==================== Playbook Service Functions ====================

def insert_playbook(
    author_id: int,
    title: str,
    description: str,
    content: str,
    category: str,
    tags_json: str,
    difficulty_level: str,
) -> None:
    """Insert a new playbook as draft."""
    now = datetime.now(timezone.utc).isoformat()

    execute_query("""
        INSERT INTO community_playbooks (author_id, title, description, content, category, tags, difficulty_level, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    """, [author_id, title, description, content, category, tags_json, difficulty_level, now, now])


def fetch_playbooks(
    category: Optional[str],
    difficulty: Optional[str],
    author_id: Optional[int],
    status_filter: str,
    skip: int,
    limit: int,
) -> list:
    """Fetch a filtered list of playbooks."""
    sql = """
        SELECT p.id, p.author_id, u.name, p.title, p.description, p.category,
               p.tags, p.difficulty_level, p.view_count, p.like_count, p.bookmark_count,
               p.published_at, p.created_at
        FROM community_playbooks p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = ?
    """
    params: list = [status_filter]

    if category:
        sql += " AND p.category = ?"
        params.append(category)

    if difficulty:
        sql += " AND p.difficulty_level = ?"
        params.append(difficulty)

    if author_id:
        sql += " AND p.author_id = ?"
        params.append(author_id)

    sql += " ORDER BY p.like_count DESC, p.view_count DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])

    result = execute_query(sql, params)

    playbooks = []
    if result and result.get("rows"):
        for row in result["rows"]:
            playbooks.append(_row_to_playbook_summary(row))
    return playbooks


def get_playbook_detail(playbook_id: int) -> Optional[dict]:
    """Increment view count and return full playbook detail."""
    execute_query("UPDATE community_playbooks SET view_count = view_count + 1 WHERE id = ?", [playbook_id])

    result = execute_query("""
        SELECT p.id, p.author_id, u.name, p.title, p.description, p.content, p.category,
               p.tags, p.difficulty_level, p.status, p.view_count, p.like_count, p.bookmark_count,
               p.published_at, p.created_at, p.updated_at
        FROM community_playbooks p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
    """, [playbook_id])

    if not result or not result.get("rows"):
        return None

    return _row_to_playbook_detail(result["rows"][0])


def get_playbook_author_status(playbook_id: int) -> Optional[dict]:
    """Get playbook author_id and status. Returns None if not found."""
    result = execute_query("SELECT author_id, status FROM community_playbooks WHERE id = ?", [playbook_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "author_id": _get_val(row, 0),
        "status": _get_val(row, 1),
    }


def publish_playbook_by_id(playbook_id: int) -> None:
    """Set playbook status to published."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE community_playbooks SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?
    """, [now, now, playbook_id])


def toggle_playbook_like(user_id: int, playbook_id: int) -> dict:
    """Like or unlike a playbook. Returns {"liked": bool, "message": str}."""
    now = datetime.now(timezone.utc).isoformat()

    existing = execute_query("""
        SELECT id FROM community_votes WHERE user_id = ? AND target_type = 'playbook' AND target_id = ?
    """, [user_id, playbook_id])

    if existing and existing.get("rows"):
        execute_query("""
            DELETE FROM community_votes WHERE user_id = ? AND target_type = 'playbook' AND target_id = ?
        """, [user_id, playbook_id])
        execute_query("UPDATE community_playbooks SET like_count = like_count - 1 WHERE id = ?", [playbook_id])
        return {"message": "Like removed", "liked": False}
    else:
        execute_query("""
            INSERT INTO community_votes (user_id, target_type, target_id, vote_type, created_at)
            VALUES (?, 'playbook', ?, 'like', ?)
        """, [user_id, playbook_id, now])
        execute_query("UPDATE community_playbooks SET like_count = like_count + 1 WHERE id = ?", [playbook_id])
        return {"message": "Playbook liked", "liked": True}


# ==================== Office Hours Service Functions ====================

def insert_office_hours(
    host_id: int,
    title: str,
    description: str,
    scheduled_at: str,
    duration_minutes: int,
    max_attendees: int,
    category: Optional[str],
    is_public: bool,
) -> None:
    """Insert a new office hours session."""
    now = datetime.now(timezone.utc).isoformat()

    execute_query("""
        INSERT INTO community_office_hours (host_id, title, description, scheduled_at, duration_minutes,
                                            max_attendees, category, is_public, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    """, [host_id, title, description, scheduled_at,
          duration_minutes, max_attendees, category, 1 if is_public else 0, now, now])


def fetch_office_hours(
    status_filter: str,
    host_id: Optional[int],
    category: Optional[str],
    skip: int,
    limit: int,
) -> list:
    """Fetch a filtered list of office hours sessions."""
    now = datetime.now(timezone.utc).isoformat()

    sql = """
        SELECT oh.id, oh.host_id, u.name, oh.title, oh.description, oh.scheduled_at,
               oh.duration_minutes, oh.max_attendees, oh.category, oh.status, oh.is_public,
               oh.attendee_count, oh.created_at
        FROM community_office_hours oh
        LEFT JOIN users u ON oh.host_id = u.id
        WHERE oh.is_public = 1
    """
    params: list = []

    if status_filter == "upcoming":
        sql += " AND oh.scheduled_at > ? AND oh.status = 'scheduled'"
        params.append(now)
    elif status_filter == "past":
        sql += " AND (oh.scheduled_at < ? OR oh.status = 'completed')"
        params.append(now)

    if host_id:
        sql += " AND oh.host_id = ?"
        params.append(host_id)

    if category:
        sql += " AND oh.category = ?"
        params.append(category)

    sql += " ORDER BY oh.scheduled_at " + ("ASC" if status_filter == "upcoming" else "DESC")
    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, skip])

    result = execute_query(sql, params)

    sessions = []
    if result and result.get("rows"):
        for row in result["rows"]:
            sessions.append(_row_to_office_hours_summary(row))
    return sessions


def get_office_hours_detail(oh_id: int) -> Optional[dict]:
    """Get full detail of an office hours session."""
    result = execute_query("""
        SELECT oh.id, oh.host_id, u.name, oh.title, oh.description, oh.scheduled_at,
               oh.duration_minutes, oh.max_attendees, oh.category, oh.status, oh.is_public,
               oh.recording_url, oh.attendee_count, oh.created_at, oh.updated_at
        FROM community_office_hours oh
        LEFT JOIN users u ON oh.host_id = u.id
        WHERE oh.id = ?
    """, [oh_id])

    if not result or not result.get("rows"):
        return None

    return _row_to_office_hours_detail(result["rows"][0])


def get_office_hours_capacity(oh_id: int) -> Optional[dict]:
    """Get capacity info for an office hours session. Returns None if not found."""
    result = execute_query("""
        SELECT max_attendees, attendee_count, status, scheduled_at FROM community_office_hours WHERE id = ?
    """, [oh_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "max_attendees": _get_val(row, 0) or 50,
        "attendee_count": _get_val(row, 1) or 0,
        "status": _get_val(row, 2),
        "scheduled_at": _get_val(row, 3),
    }


def check_oh_registration(oh_id: int, user_id: int) -> bool:
    """Check if a user is registered for an office hours session."""
    existing = execute_query("""
        SELECT id FROM community_oh_registrations WHERE office_hours_id = ? AND user_id = ?
    """, [oh_id, user_id])
    return bool(existing and existing.get("rows"))


def register_user_for_oh(oh_id: int, user_id: int) -> None:
    """Register a user for an office hours session."""
    now = datetime.now(timezone.utc).isoformat()

    execute_query("""
        INSERT INTO community_oh_registrations (office_hours_id, user_id, registered_at)
        VALUES (?, ?, ?)
    """, [oh_id, user_id, now])

    execute_query("UPDATE community_office_hours SET attendee_count = attendee_count + 1 WHERE id = ?", [oh_id])


def unregister_user_from_oh(oh_id: int, user_id: int) -> bool:
    """Unregister a user. Returns False if not registered."""
    result = execute_query("""
        SELECT id FROM community_oh_registrations WHERE office_hours_id = ? AND user_id = ?
    """, [oh_id, user_id])

    if not result or not result.get("rows"):
        return False

    execute_query("""
        DELETE FROM community_oh_registrations WHERE office_hours_id = ? AND user_id = ?
    """, [oh_id, user_id])

    execute_query("UPDATE community_office_hours SET attendee_count = MAX(0, attendee_count - 1) WHERE id = ?", [oh_id])
    return True


# ==================== Stats & Trending ====================

def get_community_stats() -> dict:
    """Gather aggregate community statistics."""
    stats: dict = {}

    q_result = execute_query("SELECT COUNT(*), SUM(answer_count) FROM community_questions", [])
    if q_result and q_result.get("rows"):
        row = q_result["rows"][0]
        stats["total_questions"] = _get_val(row, 0) or 0
        stats["total_answers"] = _get_val(row, 1) or 0

    p_result = execute_query("SELECT COUNT(*) FROM community_playbooks WHERE status = 'published'", [])
    if p_result and p_result.get("rows"):
        stats["total_playbooks"] = _get_val(p_result["rows"][0], 0) or 0

    oh_result = execute_query("""
        SELECT COUNT(*), SUM(attendee_count) FROM community_office_hours WHERE status = 'completed'
    """, [])
    if oh_result and oh_result.get("rows"):
        row = oh_result["rows"][0]
        stats["completed_sessions"] = _get_val(row, 0) or 0
        stats["total_attendees"] = _get_val(row, 1) or 0

    now = datetime.now(timezone.utc).isoformat()
    upcoming_result = execute_query("""
        SELECT COUNT(*) FROM community_office_hours WHERE scheduled_at > ? AND status = 'scheduled'
    """, [now])
    if upcoming_result and upcoming_result.get("rows"):
        stats["upcoming_sessions"] = _get_val(upcoming_result["rows"][0], 0) or 0

    return stats


def get_trending_tags_data(limit: int) -> list:
    """Get trending tags from recent questions."""
    result = execute_query("SELECT tags FROM community_questions ORDER BY created_at DESC LIMIT 100", [])

    tag_counts: dict = {}
    if result and result.get("rows"):
        for row in result["rows"]:
            tags = json.loads(_get_val(row, 0) or "[]")
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [{"tag": t, "count": c} for t, c in sorted_tags]
