# @AI-HINT: Messages service layer - all database operations for conversations and messaging endpoints
import logging
from typing import Optional, List

from app.db.turso_http import execute_query, parse_rows
from app.services.db_utils import sanitize_text

logger = logging.getLogger(__name__)

MAX_MESSAGE_LENGTH = 10000


def sanitize_content(content: Optional[str], max_length: int = MAX_MESSAGE_LENGTH) -> Optional[str]:
    """Sanitize message content to prevent XSS"""
    if content is None:
        return None
    content = content.strip()
    if len(content) > max_length:
        content = content[:max_length]
    content = sanitize_text(content)
    return content


# ==================== User Helpers ====================

def check_user_exists_active(user_id: int) -> Optional[dict]:
    """Check if user exists. Returns dict with id, user_type, is_active or None."""
    result = execute_query(
        "SELECT id, user_type, is_active FROM users WHERE id = ?",
        [user_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def get_user_public_info(user_id: int) -> Optional[dict]:
    """Get user's public info (name, avatar). Returns dict or None."""
    result = execute_query(
        "SELECT name, profile_image_url FROM users WHERE id = ?",
        [user_id]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0]
    return None


# ==================== Conversation Operations ====================

def find_existing_conversation(client_id: int, freelancer_id: int, project_id: Optional[int]) -> Optional[dict]:
    """Find existing conversation between client and freelancer."""
    if project_id:
        result = execute_query(
            """SELECT id, client_id, freelancer_id, project_id, status, is_archived,
                      last_message_at, created_at, updated_at
               FROM conversations
               WHERE client_id = ? AND freelancer_id = ? AND project_id = ?""",
            [client_id, freelancer_id, project_id]
        )
    else:
        result = execute_query(
            """SELECT id, client_id, freelancer_id, project_id, status, is_archived,
                      last_message_at, created_at, updated_at
               FROM conversations
               WHERE client_id = ? AND freelancer_id = ? AND project_id IS NULL""",
            [client_id, freelancer_id]
        )

    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            existing = rows[0]
            existing["is_archived"] = bool(existing.get("is_archived"))
            return existing
    return None


def create_conversation_record(client_id: int, freelancer_id: int, project_id: Optional[int], now: str) -> Optional[int]:
    """Create a new conversation record. Returns new ID or None on failure."""
    result = execute_query(
        """INSERT INTO conversations (client_id, freelancer_id, project_id, status, is_archived, last_message_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [client_id, freelancer_id, project_id, "active", 0, now, now, now]
    )
    if not result:
        return None

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    return new_id


def get_conversation_by_id(conversation_id: int) -> Optional[dict]:
    """Get a single conversation by ID. Returns dict or None."""
    result = execute_query(
        """SELECT id, client_id, freelancer_id, project_id, status, is_archived,
                  last_message_at, created_at, updated_at
           FROM conversations WHERE id = ?""",
        [conversation_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    if not rows:
        return None
    conv = rows[0]
    conv["is_archived"] = bool(conv.get("is_archived"))
    return conv


def get_conversation_participants(conversation_id: int) -> Optional[dict]:
    """Get conversation client_id, freelancer_id, status for access checks."""
    result = execute_query(
        "SELECT id, client_id, freelancer_id, status FROM conversations WHERE id = ?",
        [conversation_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def list_conversations_for_user(user_id: int, status_filter: Optional[str],
                                archived: Optional[bool], limit: int, skip: int) -> List[dict]:
    """Get all conversations for a user with enrichment (contact info, last message, unread)."""
    where_clauses = ["(client_id = ? OR freelancer_id = ?)"]
    params: list = [user_id, user_id]

    if status_filter:
        where_clauses.append("status = ?")
        params.append(status_filter.lower())

    if archived is not None:
        where_clauses.append("is_archived = ?")
        params.append(1 if archived else 0)

    where_sql = " AND ".join(where_clauses)
    params.extend([limit, skip])

    result = execute_query(
        f"""SELECT id, client_id, freelancer_id, project_id, status, is_archived,
                   last_message_at, created_at, updated_at
            FROM conversations
            WHERE {where_sql}
            ORDER BY last_message_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    if not result:
        return []

    rows = parse_rows(result)
    conversations = []

    for row in rows:
        conv = row
        conv["is_archived"] = bool(conv.get("is_archived"))

        other_user_id = conv["freelancer_id"] if conv["client_id"] == user_id else conv["client_id"]

        user_info = get_user_public_info(other_user_id)
        if user_info:
            conv["contact_name"] = user_info.get("name", "Unknown")
            conv["avatar"] = user_info.get("profile_image_url")

        last_msg = _get_last_message_preview(conv["id"])
        if last_msg:
            content = last_msg.get("content", "")
            conv["last_message"] = content[:100] + "..." if len(content) > 100 else content
            conv["last_message_type"] = last_msg.get("message_type", "text")

        conv["unread_count"] = _count_unread_in_conversation(conv["id"], user_id)

        conversations.append(conv)

    return conversations


def update_conversation_fields(conversation_id: int, set_clause: str, params: list):
    """Execute conversation update query."""
    execute_query(
        f"UPDATE conversations SET {set_clause} WHERE id = ?",
        params
    )


def find_conversation_between(user_id: int, other_id: int, project_id: Optional[int]) -> Optional[int]:
    """Find existing conversation ID between two users (in either direction)."""
    if project_id:
        result = execute_query(
            """SELECT id FROM conversations
               WHERE ((client_id = ? AND freelancer_id = ?) OR (client_id = ? AND freelancer_id = ?))
               AND project_id = ?""",
            [user_id, other_id, other_id, user_id, project_id]
        )
    else:
        result = execute_query(
            """SELECT id FROM conversations
               WHERE ((client_id = ? AND freelancer_id = ?) OR (client_id = ? AND freelancer_id = ?))
               AND project_id IS NULL""",
            [user_id, other_id, other_id, user_id]
        )

    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0].get("id")
    return None


# ==================== Message Operations ====================

def create_message_record(conversation_id: int, sender_id: int, receiver_id: int,
                          project_id: Optional[int], content: str, message_type: str, now: str) -> Optional[int]:
    """Insert a new message. Returns new message ID or None."""
    result = execute_query(
        """INSERT INTO messages (conversation_id, sender_id, receiver_id, project_id, content, message_type,
                                 is_read, is_deleted, sent_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [conversation_id, sender_id, receiver_id, project_id, content, message_type, 0, 0, now, now]
    )
    if not result:
        return None

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    return new_id


def update_conversation_timestamp(conversation_id: int, now: str):
    """Update conversation's last_message_at and updated_at."""
    execute_query(
        "UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?",
        [now, now, conversation_id]
    )


def fetch_conversation_messages(conversation_id: int, limit: int, skip: int) -> List[dict]:
    """Fetch messages for a conversation ordered by sent_at DESC."""
    result = execute_query(
        """SELECT id, conversation_id, sender_id, receiver_id, project_id, content,
                  message_type, is_read, read_at, is_deleted, sent_at, created_at
           FROM messages
           WHERE conversation_id = ? AND is_deleted = 0
           ORDER BY sent_at DESC
           LIMIT ? OFFSET ?""",
        [conversation_id, limit, skip]
    )
    if not result:
        return []
    return parse_rows(result)


def mark_messages_read(message_ids: List[int], now: str):
    """Mark multiple messages as read."""
    for msg_id in message_ids:
        execute_query(
            "UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?",
            [now, msg_id]
        )


def get_message_by_id(message_id: int) -> Optional[dict]:
    """Get a single message by ID with boolean conversion."""
    result = execute_query(
        """SELECT id, conversation_id, sender_id, receiver_id, project_id, content,
                  message_type, is_read, read_at, is_deleted, sent_at, created_at
           FROM messages WHERE id = ?""",
        [message_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    if not rows:
        return None
    msg = rows[0]
    msg["is_read"] = bool(msg.get("is_read"))
    msg["is_deleted"] = bool(msg.get("is_deleted"))
    return msg


def mark_single_message_read(message_id: int, now: str):
    """Mark a single message as read."""
    execute_query(
        "UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?",
        [now, message_id]
    )


def get_message_ownership(message_id: int) -> Optional[dict]:
    """Get message sender_id and receiver_id for permission checks."""
    result = execute_query(
        "SELECT id, sender_id, receiver_id FROM messages WHERE id = ?",
        [message_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def update_message_fields(message_id: int, set_clause: str, params: list):
    """Update message fields."""
    execute_query(
        f"UPDATE messages SET {set_clause} WHERE id = ?",
        params
    )


def soft_delete_message(message_id: int):
    """Soft delete a message by setting is_deleted = 1."""
    execute_query("UPDATE messages SET is_deleted = 1 WHERE id = ?", [message_id])


def count_unread_messages(user_id: int) -> int:
    """Count all unread messages for a user."""
    result = execute_query(
        "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0",
        [user_id]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0].get("count", 0)
    return 0


# ==================== Internal Helpers ====================

def _get_last_message_preview(conversation_id: int) -> Optional[dict]:
    """Get last message in conversation for preview."""
    result = execute_query(
        "SELECT content, message_type FROM messages WHERE conversation_id = ? AND is_deleted = 0 ORDER BY sent_at DESC LIMIT 1",
        [conversation_id]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0]
    return None


def _count_unread_in_conversation(conversation_id: int, user_id: int) -> int:
    """Count unread messages in a specific conversation for a user."""
    result = execute_query(
        "SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0 AND is_deleted = 0",
        [conversation_id, user_id]
    )
    if result and result.get("rows"):
        rows = parse_rows(result)
        if rows:
            return rows[0].get("count", 0)
    return 0


def search_messages(user_id: int, query: str, conversation_id: Optional[int],
                    limit: int, skip: int) -> List[dict]:
    """
    Search messages by content across user's conversations.
    Sanitizes search term and only returns messages the user can access.
    """
    import re
    # Sanitize query for LIKE
    safe_q = query[:200]
    safe_q = safe_q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    safe_q = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', safe_q)

    params: list = []
    where = "m.is_deleted = 0 AND (m.sender_id = ? OR m.receiver_id = ?)"
    params.extend([user_id, user_id])

    if conversation_id:
        where += " AND m.conversation_id = ?"
        params.append(conversation_id)

    where += " AND m.content LIKE ? ESCAPE '\\'"
    params.append(f"%{safe_q}%")

    params.extend([limit, skip])

    result = execute_query(
        f"""SELECT m.id, m.conversation_id, m.sender_id, m.receiver_id,
                   m.content, m.message_type, m.is_read, m.sent_at,
                   u.name as sender_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE {where}
            ORDER BY m.sent_at DESC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result:
        return []
    return parse_rows(result)
