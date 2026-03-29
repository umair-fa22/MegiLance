# @AI-HINT: Support tickets service layer - all database operations for support ticket endpoints
from datetime import datetime, timezone
from typing import Optional

from app.db.turso_http import execute_query, to_str, parse_date, parse_rows


def _row_to_ticket(row: list) -> dict:
    """Convert a database row to a support ticket dict"""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "user_id": row[1].get("value") if row[1].get("type") != "null" else None,
        "subject": to_str(row[2]),
        "description": to_str(row[3]),
        "category": to_str(row[4]),
        "priority": to_str(row[5]),
        "status": to_str(row[6]),
        "assigned_to": row[7].get("value") if row[7].get("type") != "null" else None,
        "attachments": to_str(row[8]),
        "created_at": parse_date(row[9]),
        "updated_at": parse_date(row[10])
    }


_TICKET_COLUMNS = "id, user_id, subject, description, category, priority, status, assigned_to, attachments, created_at, updated_at"


def create_ticket(user_id, subject: str, description: str, category: str,
                  priority: Optional[str], attachments) -> Optional[dict]:
    """Create a support ticket and return it."""
    now = datetime.now(timezone.utc).isoformat()
    result = execute_query(
        """INSERT INTO support_tickets (user_id, subject, description, category, priority, status, attachments, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)""",
        [user_id, subject, description, category, priority or "medium", attachments, now, now]
    )

    if not result:
        return None

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    rows = parse_rows(id_result) if id_result else []
    ticket_id = int(rows[0]["id"]) if rows else None
    return get_ticket_by_id(ticket_id)


def get_ticket_by_id(ticket_id) -> Optional[dict]:
    """Fetch a support ticket by ID."""
    result = execute_query(
        f"SELECT {_TICKET_COLUMNS} FROM support_tickets WHERE id = ?",
        [ticket_id]
    )
    if not result or not result.get("rows"):
        return None
    return _row_to_ticket(result["rows"][0])


def list_tickets(user_id, is_admin: bool, assigned_to_me: bool,
                 ticket_status: Optional[str], category: Optional[str],
                 priority: Optional[str], page: int, page_size: int) -> dict:
    """List support tickets with filters and pagination."""
    conditions = []
    params: list = []

    if is_admin:
        if assigned_to_me:
            conditions.append("assigned_to = ?")
            params.append(user_id)
    else:
        conditions.append("user_id = ?")
        params.append(user_id)

    if ticket_status:
        conditions.append("status = ?")
        params.append(ticket_status)
    if category:
        conditions.append("category = ?")
        params.append(category)
    if priority:
        conditions.append("priority = ?")
        params.append(priority)

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    count_result = execute_query(
        f"SELECT COUNT(*) FROM support_tickets WHERE {where_clause}",
        params
    )
    total = count_result["rows"][0][0].get("value", 0) if count_result and count_result.get("rows") else 0

    offset = (page - 1) * page_size
    list_params = params + [page_size, offset]

    result = execute_query(
        f"""SELECT {_TICKET_COLUMNS}
            FROM support_tickets WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        list_params
    )

    tickets = []
    if result and result.get("rows"):
        tickets = [_row_to_ticket(row) for row in result["rows"]]

    return {"tickets": tickets, "total": total, "page": page, "page_size": page_size}


_ALLOWED_TICKET_COLUMNS = frozenset({
    "subject", "description", "status", "priority", "category",
    "assigned_to", "resolution", "updated_at",
})


def update_ticket_fields(ticket_id, update_dict: dict) -> Optional[dict]:
    """Update specified fields on a ticket and return the updated ticket."""
    set_parts = []
    params = []
    for field, value in update_dict.items():
        if field not in _ALLOWED_TICKET_COLUMNS:
            continue
        set_parts.append(f"{field} = ?")
        params.append(value)

    set_parts.append("updated_at = ?")
    params.append(datetime.now(timezone.utc).isoformat())
    params.append(ticket_id)

    execute_query(
        f"UPDATE support_tickets SET {', '.join(set_parts)} WHERE id = ?",
        params
    )

    return get_ticket_by_id(ticket_id)


def ticket_exists(ticket_id) -> bool:
    """Check if a ticket exists."""
    result = execute_query("SELECT id FROM support_tickets WHERE id = ?", [ticket_id])
    return bool(result and result.get("rows"))


def get_assignee_role(user_id) -> Optional[dict]:
    """Get user_type and role for assignee verification."""
    result = execute_query(
        "SELECT id, user_type, role FROM users WHERE id = ?",
        [user_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "user_type": to_str(row[1]).lower() if row[1].get("type") != "null" else "",
        "role": to_str(row[2]).lower() if row[2].get("type") != "null" else ""
    }


def assign_ticket(ticket_id, assigned_to):
    """Assign a ticket to a support agent and set status to in_progress."""
    execute_query(
        "UPDATE support_tickets SET assigned_to = ?, status = 'in_progress', updated_at = ? WHERE id = ?",
        [assigned_to, datetime.now(timezone.utc).isoformat(), ticket_id]
    )


def resolve_ticket(ticket_id):
    """Set ticket status to resolved."""
    execute_query(
        "UPDATE support_tickets SET status = 'resolved', updated_at = ? WHERE id = ?",
        [datetime.now(timezone.utc).isoformat(), ticket_id]
    )


def close_ticket(ticket_id):
    """Set ticket status to closed."""
    execute_query(
        "UPDATE support_tickets SET status = 'closed', updated_at = ? WHERE id = ?",
        [datetime.now(timezone.utc).isoformat(), ticket_id]
    )


def delete_ticket(ticket_id):
    """Delete a support ticket by ID."""
    execute_query("DELETE FROM support_tickets WHERE id = ?", [ticket_id])
